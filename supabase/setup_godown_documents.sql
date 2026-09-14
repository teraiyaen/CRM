-- Run once in Supabase SQL Editor. No file storage and no stock reset.
-- Required existing tables: admin, profiles, metadata, activity_log,
-- godown_inventory and godown_transactions (confirmed in the supplied schema).
BEGIN;
ALTER TABLE public.godown_inventory ADD COLUMN IF NOT EXISTS is_sample boolean NOT NULL DEFAULT false;
ALTER TABLE public.godown_inventory ADD COLUMN IF NOT EXISTS sample_key text;
CREATE UNIQUE INDEX IF NOT EXISTS godown_sample_key_unique ON public.godown_inventory(sample_key) WHERE sample_key IS NOT NULL;

-- Only form values are recorded in the existing Activity Log. No document table or files.
CREATE INDEX IF NOT EXISTS activity_log_form_history ON public.activity_log(action,created_at DESC,id);

-- Inventory is shared by signed-in staff, consistent with the existing CRM.
DROP POLICY IF EXISTS "Public full access to godown_inventory" ON public.godown_inventory;
DROP POLICY IF EXISTS "Public full access to godown_transactions" ON public.godown_transactions;
DROP POLICY IF EXISTS godown_staff_access ON public.godown_inventory;
CREATE POLICY godown_staff_access ON public.godown_inventory FOR ALL TO authenticated USING ((SELECT auth.uid()) IS NOT NULL) WITH CHECK ((SELECT auth.uid()) IS NOT NULL);
DROP POLICY IF EXISTS godown_staff_transactions ON public.godown_transactions;
CREATE POLICY godown_staff_transactions ON public.godown_transactions FOR ALL TO authenticated USING ((SELECT auth.uid()) IS NOT NULL) WITH CHECK ((SELECT auth.uid()) IS NOT NULL);
GRANT SELECT,INSERT,UPDATE ON public.godown_inventory TO authenticated;
GRANT SELECT,INSERT ON public.godown_transactions TO authenticated;

CREATE OR REPLACE FUNCTION public.crm_receive_stock(p_request uuid,p_item uuid,p_name text,p_unit text,p_category text,p_quantity numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public,pg_temp AS $$
DECLARE v_item public.godown_inventory; v_old public.godown_transactions; v_payload text;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
    IF p_request IS NULL OR p_quantity IS NULL OR p_quantity <= 0 OR p_quantity >= 10000000000 OR p_quantity = 'NaN'::numeric OR round(p_quantity,2) <> p_quantity THEN RAISE EXCEPTION 'Enter a valid positive stock quantity'; END IF;
    IF nullif(trim(p_name),'') IS NULL OR nullif(trim(p_unit),'') IS NULL THEN RAISE EXCEPTION 'Name and unit are required'; END IF;
    v_payload := jsonb_build_object('item',p_item,'name',p_name,'unit',p_unit,'category',p_category,'quantity',p_quantity)::text;
    PERFORM pg_advisory_xact_lock(hashtextextended(p_request::text,0));
    SELECT * INTO v_old FROM public.godown_transactions WHERE id=p_request;
    IF FOUND THEN
        IF v_old.notes IS DISTINCT FROM v_payload THEN RAISE EXCEPTION 'Request already used for a different stock entry'; END IF;
        SELECT * INTO v_item FROM public.godown_inventory WHERE id=v_old.inventory_id;
        RETURN to_jsonb(v_item);
    END IF;
    IF p_item IS NULL THEN
        INSERT INTO public.godown_inventory(material_description,unit,category,in_stock,dispatched_qty,threshold_qty)
        VALUES(trim(p_name),trim(p_unit),coalesce(nullif(trim(p_category),''),'General'),p_quantity,0,0) RETURNING * INTO v_item;
    ELSE
        SELECT * INTO v_item FROM public.godown_inventory WHERE id=p_item FOR UPDATE;
        IF NOT FOUND THEN RAISE EXCEPTION 'Inventory item not found or not accessible'; END IF;
        IF v_item.in_stock = 'NaN'::numeric THEN RAISE EXCEPTION 'Stock quantity needs correction before receiving stock'; END IF;
        IF v_item.unit IS DISTINCT FROM trim(p_unit) THEN RAISE EXCEPTION 'Unit has changed; refresh and retry'; END IF;
        UPDATE public.godown_inventory SET in_stock=coalesce(in_stock,0)+p_quantity,updated_at=now() WHERE id=p_item RETURNING * INTO v_item;
    END IF;
    INSERT INTO public.godown_transactions(id,inventory_id,material_description,type,quantity,unit,notes)
    VALUES(p_request,v_item.id,v_item.material_description,'IN',p_quantity,v_item.unit,v_payload);
    INSERT INTO public.activity_log(user_id,action,message,new_value)
    VALUES(auth.uid(),'stock_received','Stock received: '||v_item.material_description||' · '||p_quantity||' '||v_item.unit,v_item.id::text);
    RETURN to_jsonb(v_item);
END $$;
REVOKE ALL ON FUNCTION public.crm_receive_stock(uuid,uuid,text,text,text,numeric) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.crm_receive_stock(uuid,uuid,text,text,text,numeric) TO authenticated;

CREATE OR REPLACE FUNCTION public.crm_create_document(p_id uuid,p_kind text,p_customer_id uuid,p_snapshot jsonb,p_movements jsonb DEFAULT '[]'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public,pg_temp AS $$
DECLARE v_log public.activity_log; v_doc jsonb; v_item public.godown_inventory; v_line record; v_name text; v_actor text; v_stock jsonb := '[]'::jsonb; v_quantity numeric; v_snapshot jsonb;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
    IF p_id IS NULL OR p_kind IS NULL OR p_kind NOT IN ('bom','agreement') OR jsonb_typeof(p_snapshot) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Invalid document'; END IF;
    IF octet_length(p_snapshot::text)>524288 OR p_snapshot::text ~* '(data:|blob:)' THEN RAISE EXCEPTION 'Only document values may be saved; uploaded files cannot be stored'; END IF;
    IF jsonb_typeof(p_movements) IS DISTINCT FROM 'array' OR jsonb_array_length(p_movements)>200 THEN RAISE EXCEPTION 'Invalid stock lines'; END IF;
    PERFORM pg_advisory_xact_lock(hashtextextended(p_id::text,0));
    SELECT * INTO v_log FROM public.activity_log WHERE id=p_id;
    IF FOUND THEN
        IF v_log.action NOT IN ('bom_created','agreement_created') THEN RAISE EXCEPTION 'Request ID already used'; END IF;
        v_doc := v_log.new_value::jsonb;
        IF v_doc->>'kind' IS DISTINCT FROM p_kind OR v_doc->'snapshot'->>'_request_hash' IS DISTINCT FROM md5(jsonb_build_object('snapshot',p_snapshot,'movements',p_movements,'customer',p_customer_id)::text) THEN RAISE EXCEPTION 'Document request already saved with different values'; END IF;
        RETURN v_doc;
    END IF;
    IF p_customer_id IS NOT NULL THEN
        SELECT consumer_name INTO v_name FROM public.admin WHERE id=p_customer_id;
        IF NOT FOUND THEN RAISE EXCEPTION 'Customer not found or not accessible'; END IF;
    END IF;
    SELECT coalesce(nullif(trim(name),''),auth.uid()::text) INTO v_actor FROM public.profiles WHERE id=auth.uid();
    v_actor := coalesce(v_actor,auth.uid()::text);
    IF p_kind='bom' THEN
        IF p_customer_id IS NULL OR jsonb_typeof(p_snapshot->'items') IS DISTINCT FROM 'array' OR jsonb_array_length(p_movements)=0 THEN RAISE EXCEPTION 'Select a customer and at least one stock item to dispatch'; END IF;
        -- Validate before grouping; reject zero/negative lines even if sums are positive.
        FOR v_line IN SELECT value FROM jsonb_array_elements(p_movements) LOOP
            v_quantity := (v_line.value->>'quantity')::numeric;
            IF v_quantity IS NULL OR v_quantity<=0 OR v_quantity='NaN'::numeric OR v_quantity>=10000000000 OR round(v_quantity,2)<>v_quantity OR nullif(v_line.value->>'inventory_id','') IS NULL THEN RAISE EXCEPTION 'Invalid dispatch quantity or item'; END IF;
        END LOOP;
        -- Fixed UUID ordering prevents two concurrent dispatches deadlocking.
        FOR v_line IN SELECT (value->>'inventory_id')::uuid AS id,sum((value->>'quantity')::numeric) AS quantity FROM jsonb_array_elements(p_movements) GROUP BY 1 ORDER BY 1 LOOP
            SELECT * INTO v_item FROM public.godown_inventory WHERE id=v_line.id FOR UPDATE;
            IF NOT FOUND THEN RAISE EXCEPTION 'Stock item not found or not accessible'; END IF;
            IF v_item.in_stock = 'NaN'::numeric OR coalesce(v_item.in_stock,0)<v_line.quantity THEN RAISE EXCEPTION 'Insufficient stock for %: available %, requested %',v_item.material_description,v_item.in_stock,v_line.quantity; END IF;
            UPDATE public.godown_inventory SET in_stock=in_stock-v_line.quantity,dispatched_qty=coalesce(dispatched_qty,0)+v_line.quantity,updated_at=now() WHERE id=v_item.id;
            INSERT INTO public.godown_transactions(inventory_id,material_description,type,quantity,unit,customer_name,dispatched_by,notes)
            VALUES(v_item.id,v_item.material_description,'OUT',v_line.quantity,v_item.unit,v_name,v_actor,'BOM '||p_id::text||' · Creator ID: '||auth.uid()::text);
            INSERT INTO public.activity_log(user_id,customer_id,action,message,new_value)
            VALUES(auth.uid(),p_customer_id,'stock_deducted',
                'Deducted '||v_line.quantity||' '||v_item.unit||' of '||v_item.material_description||' on '||to_char(now() AT TIME ZONE 'Asia/Kolkata','DD Mon YYYY HH24:MI')||' IST for '||v_name||' by '||v_actor,
                'BOM '||p_id::text); 
            v_stock := v_stock || jsonb_build_array(jsonb_build_object('inventory_id',v_item.id,'name',v_item.material_description,'quantity',v_line.quantity,'unit',v_item.unit));
        END LOOP;
    ELSIF jsonb_array_length(p_movements)<>0 THEN RAISE EXCEPTION 'Agreements cannot dispatch stock';
    END IF;
    v_name := coalesce(v_name,p_snapshot->'data'->>'consumerName','Manual entry');
    v_snapshot := p_snapshot || jsonb_build_object('stockIssued',v_stock,'_request_hash',md5(jsonb_build_object('snapshot',p_snapshot,'movements',p_movements,'customer',p_customer_id)::text));
    v_doc := jsonb_build_object('id',p_id,'kind',p_kind,'customer_id',p_customer_id,'customer_name',v_name,'snapshot',v_snapshot,'stock_applied',p_kind='bom','created_by',auth.uid(),'created_at',now());
    INSERT INTO public.activity_log(id,user_id,customer_id,action,message,new_value)
    VALUES(p_id,auth.uid(),p_customer_id,p_kind||'_created',CASE WHEN p_kind='bom' THEN 'BOM created and stock dispatched: ' ELSE 'DISCOM agreement created: ' END||v_name,v_doc::text);
    RETURN v_doc;
END $$;
REVOKE ALL ON FUNCTION public.crm_create_document(uuid,text,uuid,jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.crm_create_document(uuid,text,uuid,jsonb,jsonb) TO authenticated;
COMMIT;
-- No records are reset. PDFs are regenerated from saved values; files remain temporary.
SELECT to_regprocedure('public.crm_create_document(uuid,text,uuid,jsonb,jsonb)') AS stock_and_bom_function;

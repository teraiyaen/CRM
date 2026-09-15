-- Run once in Supabase SQL Editor before using the updated Convert button.
BEGIN;
-- A converted prospect may not yet have a consumer number.
ALTER TABLE public.admin ALTER COLUMN consumer_number DROP NOT NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS converted_customer_id uuid REFERENCES public.admin(id) ON DELETE SET NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS converted_at timestamptz;

CREATE OR REPLACE FUNCTION public.crm_convert_lead(p_lead_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public,pg_temp AS $$
DECLARE v_lead public.leads; v_customer public.admin;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
    SELECT * INTO v_lead FROM public.leads WHERE id=p_lead_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Lead not found or not accessible'; END IF;
    IF v_lead.converted_customer_id IS NOT NULL THEN
        SELECT * INTO v_customer FROM public.admin WHERE id=v_lead.converted_customer_id;
        IF NOT FOUND THEN RAISE EXCEPTION 'Linked customer is not accessible'; END IF;
        RETURN jsonb_build_object('lead',to_jsonb(v_lead),'customer',to_jsonb(v_customer));
    END IF;
    IF lower(coalesce(v_lead.status,''))='converted' THEN
        RAISE EXCEPTION 'This older converted lead has no customer link. Link its existing customer before retrying to avoid duplicates.';
    END IF;
    IF lower(coalesce(v_lead.status,''))='lost' THEN RAISE EXCEPTION 'A lost lead must be reopened before conversion'; END IF;
    INSERT INTO public.admin (
        consumer_name,consumer_number,mobile_no,email,address,sub_division,division,circle,
        discom_name,proposed_capacity_kw,panel_brand,panel_wattage_wp,panel_quantity,
        inverter_brand,inverter_capacity_kw,dealer,ref_agent,status,portal_status,sources,remarks
    ) VALUES (
        v_lead.consumer_name,NULL,v_lead.mobile_no,v_lead.email,v_lead.address,
        v_lead.sub_division,v_lead.division,v_lead.circle,v_lead.discom_name,
        v_lead.proposed_capacity_kw,v_lead.panel_brand,v_lead.panel_wattage_wp,v_lead.panel_quantity,
        v_lead.inverter_brand,v_lead.inverter_capacity_kw,v_lead.dealer,v_lead.ref_agent,
        'Vender Selection','Vender Selection','LEAD_CONVERSION',v_lead.remarks
    ) RETURNING * INTO v_customer;
    UPDATE public.leads SET status='Converted',converted_at=now(),
        converted_customer_id=v_customer.id,updated_at=now()
    WHERE id=p_lead_id RETURNING * INTO v_lead;
    IF NOT FOUND THEN RAISE EXCEPTION 'Lead could not be updated'; END IF;
    RETURN jsonb_build_object('lead',to_jsonb(v_lead),'customer',to_jsonb(v_customer));
END $$;
REVOKE ALL ON FUNCTION public.crm_convert_lead(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.crm_convert_lead(uuid) TO authenticated;
COMMIT;
SELECT to_regprocedure('public.crm_convert_lead(uuid)') AS conversion_function;

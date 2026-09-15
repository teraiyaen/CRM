-- Run this entire file in the Supabase SQL Editor.
-- Uses the existing godown tables and sample columns from setup_godown_documents.sql.
-- Quantities are suggested opening balances requested by the user, not a measured stocktake.
-- Panels: 33,000 W = 60 x 550 W; inverters: 36 kW aggregate capacity.
-- Keeps the 34 BOM units unchanged. No sample badges on the populated materials.
-- Existing stock/history is preserved; only untouched zero-stock materials are populated.
BEGIN;
LOCK TABLE public.godown_inventory, public.godown_transactions IN SHARE ROW EXCLUSIVE MODE;

CREATE TEMP TABLE opening_bom_stock (
    sr_no integer PRIMARY KEY, material_description text, category text,
    unit text, opening_qty numeric, threshold_qty numeric
) ON COMMIT DROP;
INSERT INTO opening_bom_stock VALUES
(1, 'SOLAR PANEL (ADANI 550wp)', 'Panels', 'WATT', 33000, 5500),
(2, 'SOLAR INVERTER (MAKE: )', 'Inverter', 'KW', 36, 6),
(3, 'ACDC COMBO (MCB+MCB)', 'Electrical', 'SET', 20, 5),
(4, 'ACDC COMBO (MCB+FUSE)', 'Electrical', 'SET', 10, 2),
(5, '40*40 PIPE (MAKE: )', 'Structure', 'KG', 250, 50),
(6, '60*40 PIPE (MAKE: )', 'Structure', 'KG', 200, 40),
(7, '80*40 PIPE (MAKE: )', 'Structure', 'KG', 150, 30),
(8, 'EARTHING KIT WITH MULTI SPIKE', 'Earthing', 'SET', 20, 5),
(9, 'POLYCAB 2.5 SQ.MM. (DC)', 'Cables', 'MTR', 500, 100),
(10, 'POLYCAB 4 SQ.MM. (DC)', 'Cables', 'MTR', 1000, 150),
(11, 'POLYCAB 2.5 SQ.MM. (AC)', 'Cables', 'MTR', 500, 100),
(12, 'POLYCAB 4 SQ.MM. (AC)', 'Cables', 'MTR', 500, 75),
(13, 'GALCAB 2.5 SQ.MM EARTHING (AC)', 'Earthing', 'MTR', 800, 150),
(14, 'GALCAB 4 SQ.MM EARTHING (AC)', 'Earthing', 'MTR', 400, 80),
(15, 'GALCAB 6 SQ.MM EARTHING (AC)', 'Earthing', 'MTR', 300, 60),
(16, 'GALCAB 16 SQ.MM LA', 'Lightning', 'MTR', 700, 140),
(17, 'MC 4', 'Accessories', 'PAIR', 150, 25),
(18, 'FASTENER', 'Hardware', 'PCS', 300, 60),
(19, 'M8 J BOLT (40*40)', 'Hardware', 'PCS', 500, 100),
(20, 'M8 J BOLT (60*40)', 'Hardware', 'PCS', 300, 60),
(21, 'CABLE TIE', 'Accessories', 'PKT', 40, 8),
(22, 'BASE PLATE', 'Structure', 'PCS', 100, 20),
(23, 'L ANGLE', 'Structure', 'PCS', 200, 40),
(24, 'STUD', 'Hardware', 'PCS', 100, 20),
(25, 'NUT WAHER', 'Hardware', 'KG', 50, 10),
(26, '25MM PVC PIPE POLYCAB', 'Conduit', 'PCS', 100, 20),
(27, 'TEE PVC', 'Conduit', 'PCS', 200, 40),
(28, 'BEND PVC', 'Conduit', 'PCS', 500, 100),
(29, 'C CLAMP PVC', 'Conduit', 'PCS', 40, 8),
(30, 'SPRAY (ML: )', 'Consumables', 'PCS', 30, 6),
(31, 'MID CLAMP (SIZE: ) SET', 'Hardware', 'PCS', 200, 40),
(32, 'END CLAMP (SIZE: ) SET', 'Hardware', 'PCS', 100, 20),
(33, 'FOUNDATION BAG (9w*7h)', 'Civil', 'PCS', 50, 10),
(34, 'FOUNDATION BOX (9*9)', 'Civil', 'PCS', 50, 10);

-- Remove precisely the ten obsolete sample items, plus their initial sample receipts.
-- Abort if any has since been used, so operational history is not silently deleted.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.godown_inventory i
        WHERE i.is_sample AND i.sample_key IN ('demo-panel-v1', 'demo-inverter-v1', 'demo-combo-v1', 'demo-pipe-v1', 'demo-earth-v1', 'demo-dc-v1', 'demo-ac-v1', 'demo-mc4-v1', 'demo-bolt-v1', 'demo-pvc-v1')
        AND (coalesce(i.dispatched_qty,0) <> 0 OR EXISTS (
            SELECT 1 FROM public.godown_transactions t WHERE t.inventory_id=i.id
            AND (t.type <> 'IN' OR t.notes IS DISTINCT FROM 'Initial SAMPLE DATA seed; not physical stock')
        ))
    ) THEN
        RAISE EXCEPTION 'A sample item has subsequent stock activity. Reconcile it before removing the sample items.';
    END IF;
END $$;
DELETE FROM public.godown_transactions t USING public.godown_inventory i
WHERE t.inventory_id=i.id AND i.is_sample AND i.sample_key IN ('demo-panel-v1', 'demo-inverter-v1', 'demo-combo-v1', 'demo-pipe-v1', 'demo-earth-v1', 'demo-dc-v1', 'demo-ac-v1', 'demo-mc4-v1', 'demo-bolt-v1', 'demo-pvc-v1');
DELETE FROM public.godown_inventory
WHERE is_sample AND sample_key IN ('demo-panel-v1', 'demo-inverter-v1', 'demo-combo-v1', 'demo-pipe-v1', 'demo-earth-v1', 'demo-dc-v1', 'demo-ac-v1', 'demo-mc4-v1', 'demo-bolt-v1', 'demo-pvc-v1');

-- Match existing original BOM entries by their exact description.
DO $$
DECLARE r record; v_item public.godown_inventory; v_count integer;
BEGIN
    FOR r IN SELECT * FROM opening_bom_stock ORDER BY sr_no LOOP
        SELECT count(*) INTO v_count FROM public.godown_inventory
        WHERE NOT is_sample AND material_description=r.material_description;
        IF v_count > 1 THEN
            RAISE EXCEPTION 'Duplicate material: %. Resolve duplicate entries first.', r.material_description;
        END IF;
        IF v_count = 0 THEN
            INSERT INTO public.godown_inventory
                (sr_no,material_description,category,unit,in_stock,dispatched_qty,threshold_qty,is_sample)
            VALUES (r.sr_no,r.material_description,r.category,r.unit,0,0,r.threshold_qty,false)
            RETURNING * INTO v_item;
        ELSE
            SELECT * INTO v_item FROM public.godown_inventory
            WHERE NOT is_sample AND material_description=r.material_description;
        END IF;
        IF v_item.unit IS DISTINCT FROM r.unit THEN
            RAISE EXCEPTION 'Unit mismatch for %: expected %, found %.', r.material_description,r.unit,v_item.unit;
        END IF;
        IF coalesce(v_item.in_stock,0)=0 AND coalesce(v_item.dispatched_qty,0)=0
           AND NOT EXISTS (SELECT 1 FROM public.godown_transactions WHERE inventory_id=v_item.id) THEN
            UPDATE public.godown_inventory
            SET in_stock=r.opening_qty,threshold_qty=r.threshold_qty,updated_at=now()
            WHERE id=v_item.id;
            INSERT INTO public.godown_transactions
                (inventory_id,material_description,type,quantity,unit,notes)
            VALUES (v_item.id,r.material_description,'IN',r.opening_qty,r.unit,
                    'Opening stock initialization: BOM 34 materials');
        END IF;
    END LOOP;
END $$;

-- Verification: 34 materials, their resulting balances, and whether initialized here.
SELECT b.sr_no,i.material_description,i.category,i.unit,i.in_stock,i.dispatched_qty,
       i.threshold_qty,i.is_sample,
       CASE WHEN EXISTS (SELECT 1 FROM public.godown_transactions t
                         WHERE t.inventory_id=i.id AND t.notes='Opening stock initialization: BOM 34 materials')
            THEN 'Opening balance recorded' ELSE 'Existing stock/history preserved' END AS result
FROM opening_bom_stock b JOIN public.godown_inventory i
ON i.material_description=b.material_description AND NOT i.is_sample
ORDER BY b.sr_no;
SELECT count(*) AS remaining_old_sample_items FROM public.godown_inventory
WHERE is_sample AND sample_key IN ('demo-panel-v1', 'demo-inverter-v1', 'demo-combo-v1', 'demo-pipe-v1', 'demo-earth-v1', 'demo-dc-v1', 'demo-ac-v1', 'demo-mc4-v1', 'demo-bolt-v1', 'demo-pvc-v1');
COMMIT;

-- Run the WHOLE file in Supabase SQL Editor.
-- PROVISIONAL balances requested for preview: 22 sufficient, 8 low, 4 empty.
-- Replaces current balances of the original 34 materials ONCE; not a physical stocktake.
-- Existing dispatch totals and history are retained. Balance changes are logged as
-- IN/OUT adjustments with explicit notes. No sample materials are created.
-- Reruns skip marked items, so subsequent dispatches are not undone.
-- Keep the provisional marker in remarks until you reconcile against live counts.
-- Units stay as recorded in the BOM (panels WATT, inverter KW).
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
(4, 'ACDC COMBO (MCB+FUSE)', 'Electrical', 'SET', 1, 2),
(5, '40*40 PIPE (MAKE: )', 'Structure', 'KG', 250, 50),
(6, '60*40 PIPE (MAKE: )', 'Structure', 'KG', 25, 40),
(7, '80*40 PIPE (MAKE: )', 'Structure', 'KG', 0, 30),
(8, 'EARTHING KIT WITH MULTI SPIKE', 'Earthing', 'SET', 20, 5),
(9, 'POLYCAB 2.5 SQ.MM. (DC)', 'Cables', 'MTR', 70, 100),
(10, 'POLYCAB 4 SQ.MM. (DC)', 'Cables', 'MTR', 1000, 150),
(11, 'POLYCAB 2.5 SQ.MM. (AC)', 'Cables', 'MTR', 500, 100),
(12, 'POLYCAB 4 SQ.MM. (AC)', 'Cables', 'MTR', 500, 75),
(13, 'GALCAB 2.5 SQ.MM EARTHING (AC)', 'Earthing', 'MTR', 800, 150),
(14, 'GALCAB 4 SQ.MM EARTHING (AC)', 'Earthing', 'MTR', 40, 80),
(15, 'GALCAB 6 SQ.MM EARTHING (AC)', 'Earthing', 'MTR', 0, 60),
(16, 'GALCAB 16 SQ.MM LA', 'Lightning', 'MTR', 700, 140),
(17, 'MC 4', 'Accessories', 'PAIR', 150, 25),
(18, 'FASTENER', 'Hardware', 'PCS', 35, 60),
(19, 'M8 J BOLT (40*40)', 'Hardware', 'PCS', 500, 100),
(20, 'M8 J BOLT (60*40)', 'Hardware', 'PCS', 0, 60),
(21, 'CABLE TIE', 'Accessories', 'PKT', 4, 8),
(22, 'BASE PLATE', 'Structure', 'PCS', 100, 20),
(23, 'L ANGLE', 'Structure', 'PCS', 200, 40),
(24, 'STUD', 'Hardware', 'PCS', 100, 20),
(25, 'NUT WAHER', 'Hardware', 'KG', 6, 10),
(26, '25MM PVC PIPE POLYCAB', 'Conduit', 'PCS', 100, 20),
(27, 'TEE PVC', 'Conduit', 'PCS', 200, 40),
(28, 'BEND PVC', 'Conduit', 'PCS', 500, 100),
(29, 'C CLAMP PVC', 'Conduit', 'PCS', 3, 8),
(30, 'SPRAY (ML: )', 'Consumables', 'PCS', 30, 6),
(31, 'MID CLAMP (SIZE: ) SET', 'Hardware', 'PCS', 200, 40),
(32, 'END CLAMP (SIZE: ) SET', 'Hardware', 'PCS', 100, 20),
(33, 'FOUNDATION BAG (9w*7h)', 'Civil', 'PCS', 50, 10),
(34, 'FOUNDATION BOX (9*9)', 'Civil', 'PCS', 0, 10);

-- Remove only the ten obsolete sample inventory rows.
-- Detach stock history first so ON DELETE CASCADE cannot erase it.
-- Transaction descriptions, quantities, customer details and saved BOMs remain intact.
UPDATE public.godown_transactions t
SET inventory_id = NULL
FROM public.godown_inventory i
WHERE t.inventory_id = i.id AND i.is_sample IS TRUE
  AND i.sample_key IN ('demo-panel-v1', 'demo-inverter-v1', 'demo-combo-v1', 'demo-pipe-v1', 'demo-earth-v1', 'demo-dc-v1', 'demo-ac-v1', 'demo-mc4-v1', 'demo-bolt-v1', 'demo-pvc-v1');
DELETE FROM public.godown_inventory
WHERE is_sample IS TRUE AND sample_key IN ('demo-panel-v1', 'demo-inverter-v1', 'demo-combo-v1', 'demo-pipe-v1', 'demo-earth-v1', 'demo-dc-v1', 'demo-ac-v1', 'demo-mc4-v1', 'demo-bolt-v1', 'demo-pvc-v1');

DO $$
DECLARE
    r record;
    v_item public.godown_inventory;
    v_count integer;
    v_delta numeric;
    v_marker constant text := 'Provisional stock 2026-09-15 v2 — awaiting physical count';
BEGIN
    FOR r IN SELECT * FROM opening_bom_stock ORDER BY sr_no LOOP
        SELECT count(*) INTO v_count FROM public.godown_inventory
        WHERE is_sample IS NOT TRUE AND material_description=r.material_description;
        IF v_count > 1 THEN
            RAISE EXCEPTION 'Duplicate material: %. Resolve duplicates first.', r.material_description;
        END IF;
        IF v_count = 0 THEN
            INSERT INTO public.godown_inventory
                (sr_no,material_description,category,unit,in_stock,dispatched_qty,threshold_qty,is_sample)
            VALUES (r.sr_no,r.material_description,r.category,r.unit,0,0,r.threshold_qty,false)
            RETURNING * INTO v_item;
        ELSE
            SELECT * INTO v_item FROM public.godown_inventory
            WHERE is_sample IS NOT TRUE AND material_description=r.material_description;
        END IF;
        IF v_item.unit IS DISTINCT FROM r.unit THEN
            RAISE EXCEPTION 'Unit mismatch for %: expected %, found %.',r.material_description,r.unit,v_item.unit;
        END IF;
        IF position(v_marker IN coalesce(v_item.remarks,'')) > 0 THEN
            CONTINUE;
        END IF;
        v_delta := r.opening_qty - coalesce(v_item.in_stock,0);
        UPDATE public.godown_inventory
        SET in_stock=r.opening_qty, threshold_qty=r.threshold_qty, sr_no=r.sr_no,
            remarks=concat_ws(' | ',nullif(remarks,''),v_marker), updated_at=now()
        WHERE id=v_item.id;
        IF v_delta <> 0 THEN
            INSERT INTO public.godown_transactions
                (inventory_id,material_description,type,quantity,unit,notes)
            VALUES (v_item.id,r.material_description,
                    CASE WHEN v_delta > 0 THEN 'IN' ELSE 'OUT' END,abs(v_delta),r.unit,
                    v_marker || '; balance adjustment, not a receipt or customer dispatch');
        END IF;
    END LOOP;
END $$;

SELECT b.sr_no,i.material_description,i.unit,i.in_stock,i.threshold_qty,
       CASE WHEN i.in_stock <= 0 THEN 'Out of stock'
            WHEN i.in_stock <= i.threshold_qty THEN 'Low stock'
            ELSE 'Sufficient' END AS stock_status
FROM opening_bom_stock b JOIN public.godown_inventory i
ON i.material_description=b.material_description AND i.is_sample IS NOT TRUE
ORDER BY b.sr_no;
COMMIT;

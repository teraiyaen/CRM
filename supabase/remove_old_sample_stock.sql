-- Run the whole file in Supabase SQL Editor.
-- Removes the ten sample inventory entries even if already dispatched.
-- Retains stock transaction history and saved BOMs; original 34 materials are unchanged.
BEGIN;
LOCK TABLE public.godown_inventory, public.godown_transactions IN SHARE ROW EXCLUSIVE MODE;
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

SELECT count(*) AS remaining_sample_items
FROM public.godown_inventory
WHERE is_sample IS TRUE AND sample_key IN ('demo-panel-v1', 'demo-inverter-v1', 'demo-combo-v1', 'demo-pipe-v1', 'demo-earth-v1', 'demo-dc-v1', 'demo-ac-v1', 'demo-mc4-v1', 'demo-bolt-v1', 'demo-pvc-v1');
-- Expected result: 0.
COMMIT;

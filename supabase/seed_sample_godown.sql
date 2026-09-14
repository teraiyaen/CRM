-- OPTIONAL SAMPLE DATA ONLY, explicitly requested by the client.
-- Run AFTER setup_godown_documents.sql. Inserts separate labelled sample items.
-- Re-running does not duplicate samples or reset/change any existing stock.
BEGIN;
WITH new_samples AS (
    INSERT INTO public.godown_inventory(sample_key,is_sample,material_description,category,unit,in_stock,dispatched_qty,threshold_qty,remarks)
    VALUES
      ('demo-panel-v1',true,'Solar panel - sample','Panels','PCS',60,0,10,'SAMPLE DATA - not physical stock'),
      ('demo-inverter-v1',true,'Solar inverter - sample','Inverters','PCS',12,0,3,'SAMPLE DATA - not physical stock'),
      ('demo-combo-v1',true,'ACDC combo - sample','Electrical','SET',20,0,5,'SAMPLE DATA - not physical stock'),
      ('demo-pipe-v1',true,'40 x 40 pipe - sample','Structure','KG',250,0,50,'SAMPLE DATA - not physical stock'),
      ('demo-earth-v1',true,'Earthing kit - sample','Earthing','SET',20,0,5,'SAMPLE DATA - not physical stock'),
      ('demo-dc-v1',true,'4 sq.mm DC cable - sample','Cable','MTR',1000,0,150,'SAMPLE DATA - not physical stock'),
      ('demo-ac-v1',true,'4 sq.mm AC cable - sample','Cable','MTR',500,0,75,'SAMPLE DATA - not physical stock'),
      ('demo-mc4-v1',true,'MC4 connector - sample','Accessories','PAIR',150,0,25,'SAMPLE DATA - not physical stock'),
      ('demo-bolt-v1',true,'M8 J bolt - sample','Hardware','PCS',500,0,100,'SAMPLE DATA - not physical stock'),
      ('demo-pvc-v1',true,'25mm PVC pipe - sample','Conduit','PCS',100,0,20,'SAMPLE DATA - not physical stock')
    ON CONFLICT(sample_key) WHERE sample_key IS NOT NULL DO NOTHING
    RETURNING *
)
INSERT INTO public.godown_transactions(inventory_id,material_description,type,quantity,unit,notes)
SELECT id,material_description,'IN',in_stock,unit,'Initial SAMPLE DATA seed; not physical stock' FROM new_samples;
COMMIT;
SELECT material_description,unit,in_stock,is_sample FROM public.godown_inventory WHERE is_sample ORDER BY sample_key;

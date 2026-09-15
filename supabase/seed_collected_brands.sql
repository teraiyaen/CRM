-- Optional: persist the built-in collected brand choices to metadata.
-- Names curated from upload2.csv and mis_supabase_ready.csv.
-- No customer values are changed. Safe to rerun; existing names are preserved.
BEGIN;
LOCK TABLE public.metadata IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO public.metadata(category,label)
SELECT source.category,source.label FROM (VALUES
('module_brand', 'Adani'),
('module_brand', 'Mundra Solar Energy Limited'),
('module_brand', 'Mundra Solar PV Limited'),
('module_brand', 'Mundra Solar Pvt. Ltd.'),
('module_brand', 'Waaree Energies Limited'),
('module_brand', 'Kosol Energie Pvt. Ltd.'),
('module_brand', 'Tata Power Renewable Energy Limited'),
('module_brand', 'Goldi Sun Private Limited'),
('module_brand', 'Rayzon Solar Limited'),
('inverter_make', 'Polycab'),
('inverter_make', 'Solaryaan'),
('inverter_make', 'SolaX Power'),
('inverter_make', 'Waaree'),
('inverter_make', 'Solis'),
('inverter_make', 'Sunways')
) AS source(category,label)
WHERE NOT EXISTS (SELECT 1 FROM public.metadata m WHERE m.category=source.category AND lower(trim(m.label))=lower(source.label))
ON CONFLICT DO NOTHING;
COMMIT;
SELECT category,label FROM public.metadata WHERE category IN ('module_brand','inverter_make') ORDER BY category,label;

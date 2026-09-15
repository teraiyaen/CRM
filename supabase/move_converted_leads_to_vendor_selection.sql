-- One-time correction for customers placed at the old lead-conversion entry stage.
-- Keeps projects at later stages unchanged. Run in Supabase SQL Editor.
BEGIN;
UPDATE public.admin
SET status = 'Vender Selection', portal_status = 'Vender Selection',
    updated_at = now()
WHERE sources = 'LEAD_CONVERSION'
  AND coalesce(nullif(trim(portal_status), ''), trim(status)) = 'Upload Agreement (Pending)'
RETURNING consumer_name, consumer_number, portal_status;
COMMIT;

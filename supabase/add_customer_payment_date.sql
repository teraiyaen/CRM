-- Run in Supabase SQL Editor. Existing undated payments are not backfilled.
BEGIN;
ALTER TABLE public.admin ADD COLUMN IF NOT EXISTS payment_date date;

CREATE OR REPLACE FUNCTION public.crm_default_customer_payment_date()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public,pg_temp AS $$
BEGIN
    IF NEW.payment IS NOT NULL AND NEW.payment_date IS NULL THEN
        IF TG_OP = 'INSERT' THEN
            NEW.payment_date := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date;
        ELSIF NEW.payment IS DISTINCT FROM OLD.payment THEN
            NEW.payment_date := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date;
        END IF;
    END IF;
    RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS crm_customer_payment_date_default ON public.admin;
CREATE TRIGGER crm_customer_payment_date_default
BEFORE INSERT OR UPDATE OF payment ON public.admin
FOR EACH ROW EXECUTE FUNCTION public.crm_default_customer_payment_date();
COMMIT;
SELECT column_name,data_type FROM information_schema.columns
WHERE table_schema='public' AND table_name='admin' AND column_name='payment_date';

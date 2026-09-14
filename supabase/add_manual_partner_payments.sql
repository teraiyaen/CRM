-- Run in Supabase SQL Editor. Adds manual per-customer payout fields only.
-- Reuses admin.dealer and metadata categories channel_partner / installation_vendor.
-- No storage buckets, sample data, or changes to customer receipts are created.
BEGIN;
ALTER TABLE public.admin
    ADD COLUMN IF NOT EXISTS installation_vendor text,
    ADD COLUMN IF NOT EXISTS vendor_payment_amount numeric(14,2),
    ADD COLUMN IF NOT EXISTS vendor_payment_status text,
    ADD COLUMN IF NOT EXISTS vendor_payment_date date,
    ADD COLUMN IF NOT EXISTS dealer_payment_amount numeric(14,2),
    ADD COLUMN IF NOT EXISTS dealer_payment_status text,
    ADD COLUMN IF NOT EXISTS dealer_payment_date date;

-- NULL means no payment record yet; do not label historical customers Unpaid by default.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.admin'::regclass AND conname = 'admin_vendor_payment_valid') THEN
        ALTER TABLE public.admin ADD CONSTRAINT admin_vendor_payment_valid CHECK (
            (vendor_payment_status IS NULL AND vendor_payment_amount IS NULL AND vendor_payment_date IS NULL)
            OR (vendor_payment_status IS NOT NULL AND vendor_payment_status IN ('Unpaid','Paid')
                AND installation_vendor IS NOT NULL AND length(trim(installation_vendor)) > 0
                AND vendor_payment_amount IS NOT NULL AND vendor_payment_amount >= 0
                AND vendor_payment_amount <> 'NaN'::numeric
                AND ((vendor_payment_status = 'Unpaid' AND vendor_payment_date IS NULL)
                    OR (vendor_payment_status = 'Paid' AND vendor_payment_date IS NOT NULL)))
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.admin'::regclass AND conname = 'admin_dealer_payment_valid') THEN
        ALTER TABLE public.admin ADD CONSTRAINT admin_dealer_payment_valid CHECK (
            (dealer_payment_status IS NULL AND dealer_payment_amount IS NULL AND dealer_payment_date IS NULL)
            OR (dealer_payment_status IS NOT NULL AND dealer_payment_status IN ('Unpaid','Paid')
                AND dealer IS NOT NULL AND length(trim(dealer)) > 0
                AND dealer_payment_amount IS NOT NULL AND dealer_payment_amount >= 0
                AND dealer_payment_amount <> 'NaN'::numeric
                AND ((dealer_payment_status = 'Unpaid' AND dealer_payment_date IS NULL)
                    OR (dealer_payment_status = 'Paid' AND dealer_payment_date IS NOT NULL)))
        );
    END IF;
END $$;
COMMIT;

-- Verification: should return 7 rows with the newly available column definitions.
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'admin'
  AND column_name IN ('installation_vendor', 'vendor_payment_amount', 'vendor_payment_status',
      'vendor_payment_date', 'dealer_payment_amount', 'dealer_payment_status', 'dealer_payment_date')
ORDER BY column_name;

-- =====================================================================
-- LEADS TABLE MIGRATION
-- Supports adding leads, tracking status (New, Converted, Lost), and CRM integration
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consumer_name TEXT NOT NULL,
    consumer_number TEXT,
    mobile_no TEXT,
    email TEXT,
    address TEXT,
    sub_division TEXT,
    division TEXT,
    circle TEXT,
    discom_name TEXT DEFAULT 'Paschim Gujarat Vij Co. Limited',
    proposed_capacity_kw NUMERIC(10, 2) DEFAULT 3.24,
    panel_brand TEXT DEFAULT 'Waaree Energies Limited',
    panel_wattage_wp NUMERIC(10, 2) DEFAULT 540,
    panel_quantity INTEGER DEFAULT 6,
    inverter_brand TEXT DEFAULT 'POLYCAB',
    inverter_capacity_kw NUMERIC(10, 2) DEFAULT 3.6,
    dealer TEXT DEFAULT 'Teraiya',
    ref_agent TEXT,
    status TEXT DEFAULT 'New', -- 'New', 'Contacted', 'Interested', 'Converted', 'Lost'
    lost_reason TEXT,
    remarks TEXT,
    converted_at TIMESTAMPTZ,
    converted_customer_id UUID REFERENCES public.admin(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for quick search and status filtering
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_mobile ON public.leads(mobile_no);
CREATE INDEX IF NOT EXISTS idx_leads_consumer_number ON public.leads(consumer_number);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view, insert, update leads
DROP POLICY IF EXISTS "Authenticated users full access to leads" ON public.leads;
CREATE POLICY "Authenticated users full access to leads"
ON public.leads
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow anonymous access if anon key is used by CRM frontend
DROP POLICY IF EXISTS "Anon read and write leads" ON public.leads;
CREATE POLICY "Anon read and write leads"
ON public.leads
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- =====================================================================
-- BOM (BILL OF MATERIALS) & BOM_ITEMS SCHEMA FOR SUPABASE
-- Run this in Supabase SQL Editor if the tables are not yet created
-- =====================================================================

-- 1. Create `bom` table (stores customer BOM header & loading milestones)
CREATE TABLE IF NOT EXISTS public.bom (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.admin(id) ON DELETE CASCADE,
    bom_type TEXT DEFAULT 'ROOF',               -- 'ROOF' | 'SHED' | 'TERAIYA'
    paper_prepared_by TEXT,
    paper_prepared_date DATE,
    material_loaded_by TEXT,
    material_loaded_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create `bom_items` table (stores line items, quantities, and installers)
CREATE TABLE IF NOT EXISTS public.bom_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bom_id UUID REFERENCES public.bom(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    quantity TEXT,
    uom TEXT,                                  -- Unit of Measure: Nos, MTR, SET, KG, etc.
    integration_by TEXT,                        -- Assigned installer/technician (e.g. Ramesh Makwana)
    note TEXT,                                 -- Remarks or specifications
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes for fast retrieval
CREATE INDEX IF NOT EXISTS idx_bom_admin_id ON public.bom(admin_id);
CREATE INDEX IF NOT EXISTS idx_bom_items_bom_id ON public.bom_items(bom_id);

-- Enforce 1 primary BOM record per customer (prevents duplicate rows)
CREATE UNIQUE INDEX IF NOT EXISTS bom_admin_id_unique ON public.bom(admin_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.bom ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bom_items ENABLE ROW LEVEL SECURITY;

-- 5. Policies for authenticated and anon roles
DROP POLICY IF EXISTS "Allow all access to bom" ON public.bom;
CREATE POLICY "Allow all access to bom" ON public.bom
    FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to bom_items" ON public.bom_items;
CREATE POLICY "Allow all access to bom_items" ON public.bom_items
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 6. Trigger for updating `updated_at` automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_bom_updated_at ON public.bom;
CREATE TRIGGER tr_bom_updated_at
    BEFORE UPDATE ON public.bom
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tr_bom_items_updated_at ON public.bom_items;
CREATE TRIGGER tr_bom_items_updated_at
    BEFORE UPDATE ON public.bom_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

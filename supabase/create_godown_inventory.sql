-- =====================================================================
-- GODOWN INVENTORY & TRANSACTIONS SCHEMA
-- Tracks stock in godown, materials dispatched out, and dispatch logs
-- Pre-seeded with the 34 materials from the Teraiya Enterprise BOM (Clean 0 count)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.godown_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sr_no INTEGER,
    material_description TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    unit TEXT NOT NULL DEFAULT 'PCS',
    in_stock NUMERIC(12, 2) DEFAULT 0,       -- Currently in the godown
    dispatched_qty NUMERIC(12, 2) DEFAULT 0, -- How much went out
    threshold_qty NUMERIC(12, 2) DEFAULT 10, -- Reorder alert level
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.godown_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID REFERENCES public.godown_inventory(id) ON DELETE CASCADE,
    material_description TEXT NOT NULL,
    type TEXT NOT NULL, -- 'IN' (Received into Godown) | 'OUT' (Dispatched to site)
    quantity NUMERIC(12, 2) NOT NULL,
    unit TEXT,
    customer_name TEXT,
    vehicle_no TEXT,
    driver_name TEXT,
    driver_contact TEXT,
    dealer_name TEXT,
    dispatched_by TEXT,
    approved_by TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.godown_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.godown_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public full access to godown_inventory" ON public.godown_inventory;
CREATE POLICY "Public full access to godown_inventory" ON public.godown_inventory FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access to godown_transactions" ON public.godown_transactions;
CREATE POLICY "Public full access to godown_transactions" ON public.godown_transactions FOR ALL USING (true) WITH CHECK (true);

-- Seed initial Teraiya Enterprise 34 BOM items with 0 stock
INSERT INTO public.godown_inventory (sr_no, material_description, category, unit, in_stock, dispatched_qty)
VALUES
(1, 'SOLAR PANEL (ADANI 550wp)', 'Panels', 'WATT', 0, 0),
(2, 'SOLAR INVERTER (MAKE: )', 'Inverter', 'KW', 0, 0),
(3, 'ACDC COMBO (MCB+MCB)', 'Electrical', 'SET', 0, 0),
(4, 'ACDC COMBO (MCB+FUSE)', 'Electrical', 'SET', 0, 0),
(5, '40*40 PIPE (MAKE: )', 'Structure', 'KG', 0, 0),
(6, '60*40 PIPE (MAKE: )', 'Structure', 'KG', 0, 0),
(7, '80*40 PIPE (MAKE: )', 'Structure', 'KG', 0, 0),
(8, 'EARTHING KIT WITH MULTI SPIKE', 'Earthing', 'SET', 0, 0),
(9, 'POLYCAB 2.5 SQ.MM. (DC)', 'Cables', 'MTR', 0, 0),
(10, 'POLYCAB 4 SQ.MM. (DC)', 'Cables', 'MTR', 0, 0),
(11, 'POLYCAB 2.5 SQ.MM. (AC)', 'Cables', 'MTR', 0, 0),
(12, 'POLYCAB 4 SQ.MM. (AC)', 'Cables', 'MTR', 0, 0),
(13, 'GALCAB 2.5 SQ.MM EARTHING (AC)', 'Earthing', 'MTR', 0, 0),
(14, 'GALCAB 4 SQ.MM EARTHING (AC)', 'Earthing', 'MTR', 0, 0),
(15, 'GALCAB 6 SQ.MM EARTHING (AC)', 'Earthing', 'MTR', 0, 0),
(16, 'GALCAB 16 SQ.MM LA', 'Lightning', 'MTR', 0, 0),
(17, 'MC 4', 'Accessories', 'PAIR', 0, 0),
(18, 'FASTENER', 'Hardware', 'PCS', 0, 0),
(19, 'M8 J BOLT (40*40)', 'Hardware', 'PCS', 0, 0),
(20, 'M8 J BOLT (60*40)', 'Hardware', 'PCS', 0, 0),
(21, 'CABLE TIE', 'Accessories', 'PKT', 0, 0),
(22, 'BASE PLATE', 'Structure', 'PCS', 0, 0),
(23, 'L ANGLE', 'Structure', 'PCS', 0, 0),
(24, 'STUD', 'Hardware', 'PCS', 0, 0),
(25, 'NUT WAHER', 'Hardware', 'KG', 0, 0),
(26, '25MM PVC PIPE POLYCAB', 'Conduit', 'PCS', 0, 0),
(27, 'TEE PVC', 'Conduit', 'PCS', 0, 0),
(28, 'BEND PVC', 'Conduit', 'PCS', 0, 0),
(29, 'C CLAMP PVC', 'Conduit', 'PCS', 0, 0),
(30, 'SPRAY (ML: )', 'Consumables', 'PCS', 0, 0),
(31, 'MID CLAMP (SIZE: ) SET', 'Hardware', 'PCS', 0, 0),
(32, 'END CLAMP (SIZE: ) SET', 'Hardware', 'PCS', 0, 0),
(33, 'FOUNDATION BAG (9w*7h)', 'Civil', 'PCS', 0, 0),
(34, 'FOUNDATION BOX (9*9)', 'Civil', 'PCS', 0, 0)
ON CONFLICT DO NOTHING;


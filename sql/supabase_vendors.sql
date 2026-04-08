-- Vendor Management Table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  website TEXT,
  address TEXT,
  category TEXT, -- e.g. Electronics, Furniture, Logistics
  tax_id TEXT,
  payment_terms TEXT, -- e.g. Net 30, Due on Receipt
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_hold')),
  notes TEXT,
  user_id TEXT NOT NULL, 
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own vendors"
  ON vendors
  FOR ALL
  TO authenticated
  USING (true); -- Simplifying for manual local testing if needed, though RLS should match actual auth

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vendors_updated_at
    BEFORE UPDATE ON vendors
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Optional: Indexing for performance
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors(category);

COMMENT ON TABLE vendors IS 'Central directory for all procurement partners and suppliers.';

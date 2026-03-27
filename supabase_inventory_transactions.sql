-- Inventory Transactions Audit Trail Table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID NOT NULL,
  inventory_item_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('receipt', 'shipment', 'adjustment', 'reservation', 'release', 'return')),
  quantity_change INTEGER NOT NULL,
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  reserved_change INTEGER,
  reserved_before INTEGER,
  reserved_after INTEGER,
  reason TEXT,
  reference_type TEXT NOT NULL CHECK (reference_type IN ('purchase_order', 'sales_order', 'quote', 'manual', 'system')),
  reference_id UUID,
  reference_number TEXT,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Indexes for common queries
  CONSTRAINT fk_inventory_item 
    FOREIGN KEY (inventory_item_id) 
    REFERENCES inventory(id) 
    ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item_id 
  ON inventory_transactions(inventory_item_id);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type 
  ON inventory_transactions(type);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_reference 
  ON inventory_transactions(reference_type, reference_id);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created_at 
  ON inventory_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_user_id 
  ON inventory_transactions(user_id);

-- RLS Policies (Row Level Security)
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all transactions
CREATE POLICY "Authenticated users can view inventory transactions"
  ON inventory_transactions
  FOR SELECT
  TO authenticated
  USING (true);

-- Only allow inserts (audit trail should be append-only)
CREATE POLICY "System can insert inventory transactions"
  ON inventory_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- No updates or deletes allowed (audit trail is immutable)
-- This is intentional - audit records should never be modified

COMMENT ON TABLE inventory_transactions IS 'Audit trail for all inventory stock changes';
COMMENT ON COLUMN inventory_transactions.type IS 'Type of transaction: receipt (PO), shipment (SO), adjustment (manual), reservation/return (quote)';
COMMENT ON COLUMN inventory_transactions.reference_type IS 'Source document type that triggered this change';
COMMENT ON COLUMN inventory_transactions.quantity_change IS 'Positive for stock IN, negative for stock OUT';

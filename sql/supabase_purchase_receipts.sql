-- Migration: Add Purchase Receipts for Partial Receiving Workflow
-- This implements the immutable event-log for Purchase Order fulfillment

CREATE TABLE IF NOT EXISTS public.purchase_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id UUID NOT NULL, -- references purchase_orders, but no strict FK as JSON might be used for PO items in MVP
    receipt_number TEXT NOT NULL,
    vendor_reference TEXT,
    date TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes TEXT,
    user_id UUID NOT NULL, -- Core tenancy/ownership scope
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, receipt_number) -- Multi-tenant / Org scoped uniqueness constraint
);

CREATE TABLE IF NOT EXISTS public.purchase_receipt_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL REFERENCES public.purchase_receipts(id) ON DELETE CASCADE,
    po_item_id UUID NOT NULL,
    inventory_item_id UUID,
    quantity_received NUMERIC NOT NULL DEFAULT 0 CHECK (quantity_received >= 0),
    quantity_accepted NUMERIC NOT NULL DEFAULT 0 CHECK (quantity_accepted >= 0),
    quantity_rejected NUMERIC NOT NULL DEFAULT 0 CHECK (quantity_rejected >= 0),
    rejection_reason TEXT,
    is_returnable BOOLEAN NOT NULL DEFAULT false,
    unit_cost NUMERIC NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Invariant validation at the database level!
    CONSTRAINT check_quantity_math CHECK (quantity_received = quantity_accepted + quantity_rejected)
);

-- RLS Setup
ALTER TABLE public.purchase_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_receipt_items ENABLE ROW LEVEL SECURITY;

-- Policies for purchase_receipts
CREATE POLICY "Users can view their own receipts" 
ON public.purchase_receipts FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own receipts" 
ON public.purchase_receipts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Note: Receipts are immutable. No UPDATE or DELETE policies are granted.

-- Policies for purchase_receipt_items
CREATE POLICY "Users can view their receipt items" 
ON public.purchase_receipt_items FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.purchase_receipts 
    WHERE purchase_receipts.id = purchase_receipt_items.receipt_id 
    AND purchase_receipts.user_id = auth.uid()
));

CREATE POLICY "Users can insert receipt items" 
ON public.purchase_receipt_items FOR INSERT 
WITH CHECK (EXISTS (
    SELECT 1 FROM public.purchase_receipts 
    WHERE purchase_receipts.id = receipt_id 
    AND purchase_receipts.user_id = auth.uid()
));

-- Note: Receipt Items are immutable. No UPDATE or DELETE policies are granted.

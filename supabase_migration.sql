-- Create discounts table
CREATE TABLE IF NOT EXISTS public.discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value numeric NOT NULL DEFAULT 0,
  scope text NOT NULL CHECK (scope IN ('line_item', 'order')) DEFAULT 'line_item',
  is_active boolean NOT NULL DEFAULT true,
  is_system boolean NOT NULL DEFAULT false,
  description text,
  min_order_amount numeric,
  max_discount_amount numeric,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;

-- RLS policies (same pattern as other tables)
CREATE POLICY "Users can view discounts in their organization"
  ON public.discounts FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.app_users WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can insert discounts in their organization"
  ON public.discounts FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.app_users WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can update discounts in their organization"
  ON public.discounts FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM public.app_users WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can delete non-system discounts in their organization"
  ON public.discounts FOR DELETE
  USING (
    is_system = false AND
    organization_id IN (
      SELECT organization_id FROM public.app_users WHERE auth_user_id = auth.uid()
    )
  );

-- Add discount fields to sales_orders table
ALTER TABLE public.sales_orders
  ADD COLUMN IF NOT EXISTS order_discount_id uuid REFERENCES public.discounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS order_discount_value numeric,
  ADD COLUMN IF NOT EXISTS order_discount_type text;

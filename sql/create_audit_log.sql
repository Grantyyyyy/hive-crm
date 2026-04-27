-- Migration: Create Audit Log Table
-- Purpose: Track all activity across leads, contacts, deals, tasks, quotes, and orders.
-- Project: ecokyjxnudfzklhcqecn

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- e.g., 'leads', 'orders'
  entity_id UUID NOT NULL,   -- ID of the record in the source table
  action TEXT NOT NULL,      -- 'INSERT', 'UPDATE', 'DELETE'
  changed_by UUID REFERENCES public.users(id),
  changed_at TIMESTAMPTZ DEFAULT now(),
  diff JSONB,                -- Store the changes (e.g., { "new": {...} } or { "updates": {...} })
  organization_id UUID REFERENCES public.organizations(id)
);

-- 2. Enable RLS
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
DROP POLICY IF EXISTS "Users can see logs for their organization" ON public.audit_log;
CREATE POLICY "Users can see logs for their organization" ON public.audit_log
  FOR SELECT USING (
    organization_id::text = auth.jwt() ->> 'org_id'
  );

DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_log;
CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_log
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- 4. Indexing for performance
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_org ON public.audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_at ON public.audit_log(changed_at DESC);

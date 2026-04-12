-- ============================================================
-- EMERGENCY FIX: RLS Recursion and Cold JWT Fallback
-- ============================================================
-- Problem: 
-- 1. Phase 2 RLS policies rely on (auth.jwt() ->> 'org_id')
-- 2. If the JWT claim is missing, all data is invisible.
-- 3. Falling back to a subquery on app_users causes recursion.
--
-- Solution:
-- Create a SECURITY DEFINER function to safely fetch org_id
-- and update the strict policies to use it as a fallback.
-- ============================================================

BEGIN;

-- 1. Create a SECURITY DEFINER helper to bypass RLS recursion
CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN (
    SELECT organization_id 
    FROM public.app_users 
    WHERE auth_user_id = auth.uid() 
    LIMIT 1
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_my_org_id TO authenticated;

-- 2. Define a consistent check expression
-- This uses the JWT claim if present (fastest), otherwise falls back 
-- to the SECURITY DEFINER lookup (safe cold-start).
-- Expression: COALESCE((auth.jwt() ->> 'org_id')::uuid, public.get_my_org_id())

-- 3. Update app_users policies
DROP POLICY IF EXISTS "app_users_select_org" ON app_users;
CREATE POLICY "app_users_select_org" ON app_users FOR SELECT TO authenticated
  USING (organization_id = COALESCE((auth.jwt() ->> 'org_id')::uuid, public.get_my_org_id()));

DROP POLICY IF EXISTS "app_users_update_org" ON app_users;
CREATE POLICY "app_users_update_org" ON app_users FOR UPDATE TO authenticated
  USING (organization_id = COALESCE((auth.jwt() ->> 'org_id')::uuid, public.get_my_org_id()))
  WITH CHECK (organization_id = COALESCE((auth.jwt() ->> 'org_id')::uuid, public.get_my_org_id()));

-- 4. Update core data tables to ensure immediate visibility
-- We only need to update the SELECT policies to restore the UI.
-- Others can be updated later, but we'll do the most critical ones now.

-- leads
DROP POLICY IF EXISTS "org_isolation_leads" ON leads;
CREATE POLICY "org_isolation_leads" ON leads FOR ALL TO authenticated
  USING (organization_id = COALESCE((auth.jwt() ->> 'org_id')::uuid, public.get_my_org_id()))
  WITH CHECK (organization_id = COALESCE((auth.jwt() ->> 'org_id')::uuid, public.get_my_org_id()));

-- contacts
DROP POLICY IF EXISTS "org_isolation_contacts" ON contacts;
CREATE POLICY "org_isolation_contacts" ON contacts FOR ALL TO authenticated
  USING (organization_id = COALESCE((auth.jwt() ->> 'org_id')::uuid, public.get_my_org_id()))
  WITH CHECK (organization_id = COALESCE((auth.jwt() ->> 'org_id')::uuid, public.get_my_org_id()));

-- deals
DROP POLICY IF EXISTS "org_isolation_deals" ON deals;
CREATE POLICY "org_isolation_deals" ON deals FOR ALL TO authenticated
  USING (organization_id = COALESCE((auth.jwt() ->> 'org_id')::uuid, public.get_my_org_id()))
  WITH CHECK (organization_id = COALESCE((auth.jwt() ->> 'org_id')::uuid, public.get_my_org_id()));

-- tasks
DROP POLICY IF EXISTS "org_isolation_tasks" ON tasks;
CREATE POLICY "org_isolation_tasks" ON tasks FOR ALL TO authenticated
  USING (organization_id = COALESCE((auth.jwt() ->> 'org_id')::uuid, public.get_my_org_id()))
  WITH CHECK (organization_id = COALESCE((auth.jwt() ->> 'org_id')::uuid, public.get_my_org_id()));

-- projects
DROP POLICY IF EXISTS "org_isolation_projects" ON projects;
CREATE POLICY "org_isolation_projects" ON projects FOR ALL TO authenticated
  USING (organization_id = COALESCE((auth.jwt() ->> 'org_id')::uuid, public.get_my_org_id()))
  WITH CHECK (organization_id = COALESCE((auth.jwt() ->> 'org_id')::uuid, public.get_my_org_id()));

-- roles
DROP POLICY IF EXISTS "roles_select_org" ON roles;
CREATE POLICY "roles_select_org" ON roles FOR SELECT TO authenticated
  USING (organization_id = COALESCE((auth.jwt() ->> 'org_id')::uuid, public.get_my_org_id()));

-- inventory
DROP POLICY IF EXISTS "org_isolation_inventory" ON inventory;
CREATE POLICY "org_isolation_inventory" ON inventory FOR ALL TO authenticated
  USING (organization_id = COALESCE((auth.jwt() ->> 'org_id')::uuid, public.get_my_org_id()))
  WITH CHECK (organization_id = COALESCE((auth.jwt() ->> 'org_id')::uuid, public.get_my_org_id()));

-- vendors
DROP POLICY IF EXISTS "org_isolation_vendors" ON vendors;
CREATE POLICY "org_isolation_vendors" ON vendors FOR ALL TO authenticated
  USING (organization_id = COALESCE((auth.jwt() ->> 'org_id')::uuid, public.get_my_org_id()))
  WITH CHECK (organization_id = COALESCE((auth.jwt() ->> 'org_id')::uuid, public.get_my_org_id()));

COMMIT;

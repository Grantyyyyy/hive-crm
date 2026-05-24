-- ============================================================
-- Fix Super Admin User Visibility
-- ============================================================
-- Super Admins need to be able to fetch and view all users 
-- regardless of their organization_id. 
-- This creates a SECURITY DEFINER function to prevent infinite
-- recursion when checking if the current user is a superadmin, 
-- and then updates the app_users_select_org policy to allow
-- them full read access to the app_users table.
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.is_superadmin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.app_users 
    WHERE auth_user_id = auth.uid() 
    AND is_superadmin = true
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_superadmin_user TO authenticated;

DROP POLICY IF EXISTS "app_users_select_org" ON app_users;

CREATE POLICY "app_users_select_org" ON app_users FOR SELECT TO authenticated
  USING (
    organization_id = COALESCE((auth.jwt() ->> 'org_id')::uuid, public.get_my_org_id())
    OR public.is_superadmin_user()
  );

COMMIT;

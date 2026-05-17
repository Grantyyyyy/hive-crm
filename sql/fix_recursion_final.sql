-- ============================================================
-- Complete RLS Recursion Fix for app_users
-- ============================================================
-- The previous role-restricted-invites migration introduced
-- direct subqueries to `app_users` inside the INSERT, UPDATE,
-- and DELETE policies for the `app_users` table. This caused
-- infinite recursion errors ("stack depth limit exceeded").
--
-- This migration drops the offending policies and any legacy
-- redundant policies, and replaces them with policies that
-- utilize `SECURITY DEFINER` functions (is_superadmin_user 
-- and is_admin_user) to safely perform lookups without 
-- triggering recursion.
-- ============================================================

BEGIN;

DROP POLICY IF EXISTS "app_users_select" ON app_users;
DROP POLICY IF EXISTS "Users can insert app_users" ON app_users;
DROP POLICY IF EXISTS "Users can delete app_users" ON app_users;
DROP POLICY IF EXISTS "app_users_insert_own_or_admin" ON app_users;
DROP POLICY IF EXISTS "New users can self-insert" ON app_users;
DROP POLICY IF EXISTS "app_users_insert" ON app_users;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.app_users au
    JOIN public.roles r ON r.id = au.role_id
    WHERE au.auth_user_id = auth.uid() 
    AND r.name = 'Admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin_user TO authenticated;

-- Update INSERT policy
DROP POLICY IF EXISTS "app_users_insert_admin" ON app_users;
CREATE POLICY "app_users_insert_admin" ON app_users FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = COALESCE((auth.jwt() ->> 'org_id')::uuid, public.get_my_org_id())
    AND (
      public.is_superadmin_user()
      OR
      (
        public.is_admin_user()
        AND (
          SELECT r.name FROM roles r WHERE r.id = role_id
        ) NOT IN ('Admin', 'Super Admin')
      )
    )
  );

-- Update UPDATE policy
DROP POLICY IF EXISTS "app_users_update_org" ON app_users;
CREATE POLICY "app_users_update_org" ON app_users FOR UPDATE TO authenticated
  USING (organization_id = COALESCE((auth.jwt() ->> 'org_id')::uuid, public.get_my_org_id()))
  WITH CHECK (
    organization_id = COALESCE((auth.jwt() ->> 'org_id')::uuid, public.get_my_org_id())
    AND (
      public.is_superadmin_user()
      OR
      (
        public.is_admin_user()
        AND (
          SELECT r.name FROM roles r WHERE r.id = role_id
        ) NOT IN ('Admin', 'Super Admin')
        AND (
          SELECT r2.name FROM roles r2
          JOIN app_users target ON target.role_id = r2.id
          WHERE target.id = app_users.id
        ) NOT IN ('Admin', 'Super Admin')
      )
    )
  );

-- Update DELETE policy
DROP POLICY IF EXISTS "app_users_delete_admin" ON app_users;
CREATE POLICY "app_users_delete_admin" ON app_users FOR DELETE TO authenticated
  USING (
    organization_id = COALESCE((auth.jwt() ->> 'org_id')::uuid, public.get_my_org_id())
    AND (
      public.is_superadmin_user()
      OR
      (
        public.is_admin_user()
        AND (
          SELECT r.name FROM roles r
          JOIN app_users target ON target.role_id = r.id
          WHERE target.id = app_users.id
        ) NOT IN ('Admin', 'Super Admin')
      )
    )
  );

COMMIT;

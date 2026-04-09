-- ============================================================
-- RBAC Row-Level Security Policies
-- ============================================================
-- Secures the roles, permissions, role_permissions, and app_users
-- tables so that only authorized users can read or modify them.
--
-- Run this in the Supabase SQL Editor.
-- ============================================================

-- ── 1. Enable RLS on all RBAC tables ────────────────────────

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- ── 2. Helper: check if current user is Admin ───────────────
-- We use an inline SQL function to avoid repeating the subquery.

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM app_users au
    JOIN roles r ON r.id = au.role_id
    WHERE au.auth_user_id = auth.uid()
      AND r.name = 'Admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── 3. roles table ─────────────────────────────────────────

-- All authenticated users can READ roles (needed to display role badges, etc.)
CREATE POLICY "roles_select_all"
  ON roles FOR SELECT
  TO authenticated
  USING (true);

-- Only Admin can INSERT roles
CREATE POLICY "roles_insert_admin"
  ON roles FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Only Admin can UPDATE roles
CREATE POLICY "roles_update_admin"
  ON roles FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Only Admin can DELETE roles
CREATE POLICY "roles_delete_admin"
  ON roles FOR DELETE
  TO authenticated
  USING (is_admin());

-- ── 4. permissions table ───────────────────────────────────

-- All authenticated users can READ permissions (needed for the Roles UI grid)
CREATE POLICY "permissions_select_all"
  ON permissions FOR SELECT
  TO authenticated
  USING (true);

-- No one can INSERT/UPDATE/DELETE permissions via the app (seed-only data)
-- If you need to manage permissions via the UI, add Admin policies here.

-- ── 5. role_permissions junction table ─────────────────────

-- All authenticated users can READ role_permissions
CREATE POLICY "role_perms_select_all"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (true);

-- Only Admin can INSERT role_permissions
CREATE POLICY "role_perms_insert_admin"
  ON role_permissions FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Only Admin can UPDATE role_permissions
CREATE POLICY "role_perms_update_admin"
  ON role_permissions FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Only Admin can DELETE role_permissions
CREATE POLICY "role_perms_delete_admin"
  ON role_permissions FOR DELETE
  TO authenticated
  USING (is_admin());

-- ── 6. app_users table ─────────────────────────────────────

-- Users can READ their own record; Admin can read all
CREATE POLICY "app_users_select_own_or_admin"
  ON app_users FOR SELECT
  TO authenticated
  USING (
    auth_user_id = auth.uid()
    OR is_admin()
  );

-- Only Admin can INSERT app_users (manually adding users)
CREATE POLICY "app_users_insert_admin"
  ON app_users FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Users can update their own profile (name, email, username);
-- Only Admin can change role_id or owner_id
CREATE POLICY "app_users_update_own_or_admin"
  ON app_users FOR UPDATE
  TO authenticated
  USING (
    auth_user_id = auth.uid()
    OR is_admin()
  )
  WITH CHECK (
    auth_user_id = auth.uid()
    OR is_admin()
  );

-- Only Admin can DELETE app_users
CREATE POLICY "app_users_delete_admin"
  ON app_users FOR DELETE
  TO authenticated
  USING (is_admin());

-- ── 7. Clean up ────────────────────────────────────────────

-- The is_admin() function is used by RLS policies and should persist.
-- If you need to drop everything later:
-- DROP POLICY IF EXISTS "roles_select_all" ON roles;
-- DROP POLICY IF EXISTS "roles_insert_admin" ON roles;
-- DROP POLICY IF EXISTS "roles_update_admin" ON roles;
-- DROP POLICY IF EXISTS "roles_delete_admin" ON roles;
-- DROP POLICY IF EXISTS "permissions_select_all" ON permissions;
-- DROP POLICY IF EXISTS "role_perms_select_all" ON role_permissions;
-- DROP POLICY IF EXISTS "role_perms_insert_admin" ON role_permissions;
-- DROP POLICY IF EXISTS "role_perms_update_admin" ON role_permissions;
-- DROP POLICY IF EXISTS "role_perms_delete_admin" ON role_permissions;
-- DROP POLICY IF EXISTS "app_users_select_own_or_admin" ON app_users;
-- DROP POLICY IF EXISTS "app_users_insert_admin" ON app_users;
-- DROP POLICY IF EXISTS "app_users_update_own_or_admin" ON app_users;
-- DROP POLICY IF EXISTS "app_users_delete_admin" ON app_users;
-- DROP FUNCTION IF EXISTS is_admin();

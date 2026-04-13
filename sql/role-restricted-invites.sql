-- =========================================================================================
-- Role-Restricted User Invite & Assignment (Applied to Supabase)
-- =========================================================================================
-- Migration 1: add_is_superadmin_column
-- Migration 2: role_restricted_user_policies 
-- Migration 3: prevent_last_admin_removal_trigger
-- =========================================================================================

-- ── Migration 1: Add is_superadmin column ─────────────────────────────────────
ALTER TABLE public.app_users
  ADD COLUMN IF NOT EXISTS is_superadmin BOOLEAN NOT NULL DEFAULT false;

UPDATE public.app_users
SET is_superadmin = true
WHERE role_id IN (
  SELECT id FROM public.roles WHERE name = 'Super Admin'
);

-- ── Migration 2: Role-restricted RLS policies ─────────────────────────────────

-- 1. INSERT Policy
DROP POLICY IF EXISTS "app_users_insert_admin" ON app_users;

CREATE POLICY "app_users_insert_admin" ON app_users FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = COALESCE((auth.jwt() ->> 'org_id')::uuid, public.get_my_org_id())
    AND (
      EXISTS (
        SELECT 1 FROM app_users au
        WHERE au.auth_user_id = auth.uid()
        AND au.is_superadmin = true
      )
      OR
      EXISTS (
        SELECT 1 FROM app_users au
        JOIN roles acting_role ON acting_role.id = au.role_id
        WHERE au.auth_user_id = auth.uid()
        AND acting_role.name = 'Admin'
        AND (
          SELECT r.name FROM roles r WHERE r.id = role_id
        ) NOT IN ('Admin', 'Super Admin')
      )
    )
  );

-- 2. UPDATE Policy
DROP POLICY IF EXISTS "app_users_update_org" ON app_users;

CREATE POLICY "app_users_update_org" ON app_users FOR UPDATE TO authenticated
  USING (organization_id = COALESCE((auth.jwt() ->> 'org_id')::uuid, public.get_my_org_id()))
  WITH CHECK (
    organization_id = COALESCE((auth.jwt() ->> 'org_id')::uuid, public.get_my_org_id())
    AND (
      EXISTS (
        SELECT 1 FROM app_users au
        WHERE au.auth_user_id = auth.uid()
        AND au.is_superadmin = true
      )
      OR
      EXISTS (
        SELECT 1 FROM app_users au
        JOIN roles acting_role ON acting_role.id = au.role_id
        WHERE au.auth_user_id = auth.uid()
        AND acting_role.name = 'Admin'
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

-- 3. DELETE Policy
DROP POLICY IF EXISTS "app_users_delete_admin" ON app_users;

CREATE POLICY "app_users_delete_admin" ON app_users FOR DELETE TO authenticated
  USING (
    organization_id = COALESCE((auth.jwt() ->> 'org_id')::uuid, public.get_my_org_id())
    AND (
      EXISTS (
        SELECT 1 FROM app_users au
        WHERE au.auth_user_id = auth.uid()
        AND au.is_superadmin = true
      )
      OR
      EXISTS (
        SELECT 1 FROM app_users au
        JOIN roles acting_role ON acting_role.id = au.role_id
        WHERE au.auth_user_id = auth.uid()
        AND acting_role.name = 'Admin'
        AND (
          SELECT r.name FROM roles r
          JOIN app_users target ON target.role_id = r.id
          WHERE target.id = app_users.id
        ) NOT IN ('Admin', 'Super Admin')
      )
    )
  );

-- ── Migration 3: Last Admin safety trigger ────────────────────────────────────

CREATE OR REPLACE FUNCTION public.prevent_last_admin_removal()
RETURNS TRIGGER AS $$
DECLARE
  admin_count INTEGER;
  target_role_name TEXT;
BEGIN
  SELECT r.name INTO target_role_name
  FROM roles r WHERE r.id = COALESCE(OLD.role_id, NEW.role_id);

  IF target_role_name != 'Admin' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT COUNT(*) INTO admin_count
  FROM app_users au
  JOIN roles r ON r.id = au.role_id
  WHERE au.organization_id = OLD.organization_id
    AND r.name = 'Admin'
    AND au.id != OLD.id;

  IF admin_count < 1 THEN
    RAISE EXCEPTION 'Cannot remove the last Admin from an organization. Assign another Admin first.';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_last_admin
  BEFORE DELETE OR UPDATE OF role_id ON app_users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_last_admin_removal();

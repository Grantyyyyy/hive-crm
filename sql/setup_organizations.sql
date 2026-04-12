-- 1. Setup variables for shared IDs
DO $$
DECLARE
    sys_user_id UUID;
    sys_org_id UUID;
BEGIN
    SELECT id, organization_id INTO sys_user_id, sys_org_id FROM app_users LIMIT 1;

    -- 2. Ensure Super Admin role exists
    INSERT INTO roles (name, description, color, is_system, owner_id, organization_id)
    VALUES ('Super Admin', 'Platform-level access to all organizations', '#0d9488', true, sys_user_id, sys_org_id)
    ON CONFLICT (name) DO NOTHING;

    -- 3. Add Organization Management permissions
    INSERT INTO permissions (module, action, description, organization_id)
    VALUES 
      ('organizations', 'read', 'Ability to view organizations', sys_org_id),
      ('organizations', 'create', 'Ability to create new organizations', sys_org_id),
      ('organizations', 'update', 'Ability to edit organization details', sys_org_id),
      ('organizations', 'delete', 'Ability to delete organizations', sys_org_id)
    ON CONFLICT (module, action) DO NOTHING;

    -- 4. Link permissions to Super Admin and Admin
    DECLARE
        super_admin_role_id UUID;
        admin_role_id UUID;
        perm_id UUID;
    BEGIN
        SELECT id INTO super_admin_role_id FROM roles WHERE name = 'Super Admin';
        SELECT id INTO admin_role_id FROM roles WHERE name = 'Admin';

        -- Assign all org permissions to Super Admin
        FOR perm_id IN SELECT id FROM permissions WHERE module = 'organizations' LOOP
            INSERT INTO role_permissions (role_id, permission_id, organization_id)
            VALUES (super_admin_role_id, perm_id, sys_org_id)
            ON CONFLICT DO NOTHING;
        END LOOP;

        -- Assign all org permissions to Admin as well (to maintain Full Access status)
        FOR perm_id IN SELECT id FROM permissions WHERE module = 'organizations' LOOP
            INSERT INTO role_permissions (role_id, permission_id, organization_id)
            VALUES (admin_role_id, perm_id, sys_org_id)
            ON CONFLICT DO NOTHING;
        END LOOP;

        -- 5. Promote the first user to Super Admin
        -- This ensures you can immediately access the new management features
        UPDATE app_users 
        SET role_id = super_admin_role_id
        WHERE id = sys_user_id;
    END;
END $$;




-- 4. Secure the Organizations table
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT
-- Super Admins see everything.
-- Admins/Users see only their own org.
DROP POLICY IF EXISTS "Organizations are viewable by assigned users or superadmins" ON organizations;
CREATE POLICY "Organizations are viewable by assigned users or superadmins" ON organizations
  FOR SELECT
  USING (
    id = (auth.jwt() ->> 'org_id')::uuid
    OR 
    EXISTS (
      SELECT 1 FROM app_users 
      JOIN roles ON app_users.role_id = roles.id
      WHERE app_users.auth_user_id = auth.uid()
      AND roles.name = 'Super Admin'
    )
  );

-- Policy: INSERT
-- For now, only Super Admins can create organizations via this table
DROP POLICY IF EXISTS "Organizations can be created by superadmins" ON organizations;
CREATE POLICY "Organizations can be created by superadmins" ON organizations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_users 
      JOIN roles ON app_users.role_id = roles.id
      WHERE app_users.auth_user_id = auth.uid()
      AND roles.name = 'Super Admin'
    )
  );

-- Policy: UPDATE
-- Admins can update their own org. Super Admins can update any.
DROP POLICY IF EXISTS "Organizations can be updated by admins or superadmins" ON organizations;
CREATE POLICY "Organizations can be updated by admins or superadmins" ON organizations
  FOR UPDATE
  USING (
    (id = (auth.jwt() ->> 'org_id')::uuid AND EXISTS (
      SELECT 1 FROM app_users 
      JOIN roles ON app_users.role_id = roles.id
      WHERE app_users.auth_user_id = auth.uid()
      AND roles.name IN ('Admin', 'Super Admin')
    ))
    OR
    EXISTS (
      SELECT 1 FROM app_users 
      JOIN roles ON app_users.role_id = roles.id
      WHERE app_users.auth_user_id = auth.uid()
      AND roles.name = 'Super Admin'
    )
  );

-- Policy: DELETE
-- Only Super Admins can delete organizations
DROP POLICY IF EXISTS "Organizations can be deleted by superadmins" ON organizations;
CREATE POLICY "Organizations can be deleted by superadmins" ON organizations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM app_users 
      JOIN roles ON app_users.role_id = roles.id
      WHERE app_users.auth_user_id = auth.uid()
      AND roles.name = 'Super Admin'
    )
  );

-- 5. Helper Function: Get Member Count (SECURITY DEFINER)
-- Bypasses RLS to get count of users in a specific org
CREATE OR REPLACE FUNCTION get_organization_member_count(org_id_param UUID)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT count(*)
    FROM app_users
    WHERE organization_id = org_id_param
  );
END;
$$;

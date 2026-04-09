-- ============================================================
-- RBAC Cleanup & Optimization (V3 - Robust)
-- ============================================================

BEGIN;

-- ── 1. Consolidate Permissions ──────────────────────────────

CREATE OR REPLACE FUNCTION merge_permission_actions(p_old_action text, p_new_action text)
RETURNS void AS $$
BEGIN
    -- 1. Insert mapping to new permission for any role that has the old one
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT rp.role_id, p_new.id
    FROM role_permissions rp
    JOIN permissions p_old ON p_old.id = rp.permission_id
    JOIN permissions p_new ON p_new.module = p_old.module AND p_new.action = p_new_action
    WHERE p_old.action = p_old_action
    ON CONFLICT DO NOTHING;

    -- 2. Delete old mappings
    DELETE FROM role_permissions rp
    USING permissions p_old
    WHERE rp.permission_id = p_old.id
      AND p_old.action = p_old_action;

    -- 3. Delete old permissions that have a standard counterpart
    DELETE FROM permissions p_old
    USING permissions p_new
    WHERE p_old.module = p_new.module 
      AND p_old.action = p_old_action 
      AND p_new.action = p_new_action;

    -- 4. Update remaining old actions to new standard (where no standard exists yet)
    UPDATE permissions SET action = p_new_action WHERE action = p_old_action;
END;
$$ LANGUAGE plpgsql;

SELECT merge_permission_actions('view', 'read');
SELECT merge_permission_actions('edit', 'update');
SELECT merge_permission_actions('manage', 'update');

DROP FUNCTION merge_permission_actions(text, text);

-- ── 2. Consolidate Roles ────────────────────────────────────

CREATE TEMP TABLE role_mapping (
    old_id UUID,
    new_id UUID
);

DO $$
DECLARE
    v_role_name text;
    v_new_id UUID;
BEGIN
    FOR v_role_name IN SELECT DISTINCT name FROM roles LOOP
        SELECT id INTO v_new_id FROM roles WHERE name = v_role_name ORDER BY length(description) DESC NULLS LAST LIMIT 1;
        
        INSERT INTO role_mapping (old_id, new_id)
        SELECT id, v_new_id FROM roles WHERE name = v_role_name AND id <> v_new_id;
    END LOOP;
END $$;

-- Update app_users
UPDATE app_users au
SET role_id = m.new_id
FROM role_mapping m
WHERE au.role_id = m.old_id;

-- Merge mappings for roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT m.new_id, rp.permission_id
FROM role_permissions rp
JOIN role_mapping m ON m.old_id = rp.role_id
ON CONFLICT DO NOTHING;

-- Delete old role_permissions and roles
DELETE FROM role_permissions WHERE role_id IN (SELECT old_id FROM role_mapping);
DELETE FROM roles WHERE id IN (SELECT old_id FROM role_mapping);

-- Add UNIQUE constraint to roles name
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'roles_name_unique') THEN
        ALTER TABLE roles ADD CONSTRAINT roles_name_unique UNIQUE (name);
    END IF;
END $$;

-- ── 3. Helper Functions ─────────────────────────────────────

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

CREATE OR REPLACE FUNCTION has_permission(p_module text, p_action text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM app_users au
    JOIN role_permissions rp ON rp.role_id = au.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE au.auth_user_id = auth.uid()
      AND p.module = p_module
      AND p.action = p_action
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMIT;

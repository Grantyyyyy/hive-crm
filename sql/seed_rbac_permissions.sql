-- ============================================================
-- RBAC Seed Data — Permissions & Default Roles
-- ============================================================
-- Creates the permissions table, default roles, and links
-- Admin role to ALL permissions (full access).
--
-- Run this in the Supabase SQL Editor.
-- ============================================================

-- ── 1. Ensure default roles exist ──────────────────────────

INSERT INTO roles (name, description, color, is_system, owner_id)
VALUES
  ('Admin', 'Full system access — all modules and settings', '#ef4444', true, 'system'),
  ('Manager', 'Team management — read access to all modules, limited settings', '#3b82f6', true, 'system'),
  ('Agent', 'Basic access — read and create on core CRM modules only', '#10b981', true, 'system')
ON CONFLICT DO NOTHING;

-- ── 2. Insert permissions for every module ─────────────────

-- Core CRM modules
INSERT INTO permissions (id, module, action, description) VALUES
  (gen_random_uuid(), 'tasks', 'create', 'Create tasks'),
  (gen_random_uuid(), 'tasks', 'read', 'View tasks'),
  (gen_random_uuid(), 'tasks', 'update', 'Edit tasks'),
  (gen_random_uuid(), 'tasks', 'delete', 'Delete tasks'),

  (gen_random_uuid(), 'projects', 'create', 'Create projects'),
  (gen_random_uuid(), 'projects', 'read', 'View projects'),
  (gen_random_uuid(), 'projects', 'update', 'Edit projects'),
  (gen_random_uuid(), 'projects', 'delete', 'Delete projects'),

  (gen_random_uuid(), 'leads', 'create', 'Create leads'),
  (gen_random_uuid(), 'leads', 'read', 'View leads'),
  (gen_random_uuid(), 'leads', 'update', 'Edit leads'),
  (gen_random_uuid(), 'leads', 'delete', 'Delete leads'),

  (gen_random_uuid(), 'contacts', 'create', 'Create contacts'),
  (gen_random_uuid(), 'contacts', 'read', 'View contacts'),
  (gen_random_uuid(), 'contacts', 'update', 'Edit contacts'),
  (gen_random_uuid(), 'contacts', 'delete', 'Delete contacts'),

  (gen_random_uuid(), 'deals', 'create', 'Create deals'),
  (gen_random_uuid(), 'deals', 'read', 'View deals'),
  (gen_random_uuid(), 'deals', 'update', 'Edit deals'),
  (gen_random_uuid(), 'deals', 'delete', 'Delete deals'),

  (gen_random_uuid(), 'activities', 'create', 'Log activities'),
  (gen_random_uuid(), 'activities', 'read', 'View activities'),
  (gen_random_uuid(), 'activities', 'update', 'Edit activities'),
  (gen_random_uuid(), 'activities', 'delete', 'Delete activities')
ON CONFLICT DO NOTHING;

-- Sales modules
INSERT INTO permissions (id, module, action, description) VALUES
  (gen_random_uuid(), 'quotes', 'create', 'Create quotes'),
  (gen_random_uuid(), 'quotes', 'read', 'View quotes'),
  (gen_random_uuid(), 'quotes', 'update', 'Edit quotes'),
  (gen_random_uuid(), 'quotes', 'delete', 'Delete quotes'),

  (gen_random_uuid(), 'orders', 'create', 'Create sales orders'),
  (gen_random_uuid(), 'orders', 'read', 'View sales orders'),
  (gen_random_uuid(), 'orders', 'update', 'Edit sales orders'),
  (gen_random_uuid(), 'orders', 'delete', 'Delete sales orders')
ON CONFLICT DO NOTHING;

-- Logistics modules
INSERT INTO permissions (id, module, action, description) VALUES
  (gen_random_uuid(), 'inventory', 'create', 'Create inventory items'),
  (gen_random_uuid(), 'inventory', 'read', 'View inventory'),
  (gen_random_uuid(), 'inventory', 'update', 'Edit inventory'),
  (gen_random_uuid(), 'inventory', 'delete', 'Delete inventory'),

  (gen_random_uuid(), 'purchase_orders', 'create', 'Create purchase orders'),
  (gen_random_uuid(), 'purchase_orders', 'read', 'View purchase orders'),
  (gen_random_uuid(), 'purchase_orders', 'update', 'Edit purchase orders'),
  (gen_random_uuid(), 'purchase_orders', 'delete', 'Delete purchase orders'),

  (gen_random_uuid(), 'purchase_requests', 'create', 'Create purchase requests'),
  (gen_random_uuid(), 'purchase_requests', 'read', 'View purchase requests'),
  (gen_random_uuid(), 'purchase_requests', 'update', 'Edit purchase requests'),
  (gen_random_uuid(), 'purchase_requests', 'delete', 'Delete purchase requests'),

  (gen_random_uuid(), 'vendors', 'create', 'Create vendors'),
  (gen_random_uuid(), 'vendors', 'read', 'View vendors'),
  (gen_random_uuid(), 'vendors', 'update', 'Edit vendors'),
  (gen_random_uuid(), 'vendors', 'delete', 'Delete vendors'),

  (gen_random_uuid(), 'reports', 'create', 'Create reports'),
  (gen_random_uuid(), 'reports', 'read', 'View reports'),
  (gen_random_uuid(), 'reports', 'update', 'Edit reports'),
  (gen_random_uuid(), 'reports', 'delete', 'Delete reports')
ON CONFLICT DO NOTHING;

-- Settings modules
INSERT INTO permissions (id, module, action, description) VALUES
  (gen_random_uuid(), 'users', 'create', 'Add / invite users'),
  (gen_random_uuid(), 'users', 'read', 'View users'),
  (gen_random_uuid(), 'users', 'update', 'Edit users and change roles'),
  (gen_random_uuid(), 'users', 'delete', 'Remove users'),

  (gen_random_uuid(), 'roles', 'create', 'Create roles'),
  (gen_random_uuid(), 'roles', 'read', 'View roles and permissions'),
  (gen_random_uuid(), 'roles', 'update', 'Edit roles and permissions'),
  (gen_random_uuid(), 'roles', 'delete', 'Delete roles')
ON CONFLICT DO NOTHING;

-- ── 3. Link Admin role to ALL permissions (full access) ────

INSERT INTO role_permissions (role_id, permission_id)
SELECT
  r.id AS role_id,
  p.id AS permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Admin'
ON CONFLICT DO NOTHING;

-- ── 4. Link Manager role to read + update on all modules ───

INSERT INTO role_permissions (role_id, permission_id)
SELECT
  r.id AS role_id,
  p.id AS permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Manager'
  AND p.action IN ('read', 'update', 'create')
ON CONFLICT DO NOTHING;

-- ── 5. Link Agent role to core CRM only (read + create) ────

INSERT INTO role_permissions (role_id, permission_id)
SELECT
  r.id AS role_id,
  p.id AS permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Agent'
  AND p.module IN ('tasks', 'projects', 'leads', 'contacts', 'deals', 'activities')
  AND p.action IN ('read', 'create')
ON CONFLICT DO NOTHING;

-- ── 6. Verify ──────────────────────────────────────────────

DO $$
DECLARE
  v_admin_count int;
  v_manager_count int;
  v_agent_count int;
  v_total_perms int;
BEGIN
  SELECT COUNT(*) INTO v_admin_count
  FROM role_permissions rp JOIN roles r ON r.id = rp.role_id
  WHERE r.name = 'Admin';

  SELECT COUNT(*) INTO v_manager_count
  FROM role_permissions rp JOIN roles r ON r.id = rp.role_id
  WHERE r.name = 'Manager';

  SELECT COUNT(*) INTO v_agent_count
  FROM role_permissions rp JOIN roles r ON r.id = rp.role_id
  WHERE r.name = 'Agent';

  SELECT COUNT(*) INTO v_total_perms FROM permissions;

  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '  🚀 RBAC Seed Data Loaded';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '  Total permissions: %', v_total_perms;
  RAISE NOTICE '  Admin permissions:  % (full access)', v_admin_count;
  RAISE NOTICE '  Manager permissions: %', v_manager_count;
  RAISE NOTICE '  Agent permissions:   %', v_agent_count;
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

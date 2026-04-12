-- ============================================================
-- Phase 2: Add organization_id to All Tables
-- ============================================================
-- Step 1: Create organizations table + default org
-- Step 2: Add organization_id to app_users
-- Step 3: Add organization_id to ALL data tables (nullable)
-- Step 4: Backfill all existing rows with default org_id
-- Step 5: Create indexes on organization_id
-- Step 6: Alter organization_id to NOT NULL
-- Step 7: Replace ALL RLS with org-scoped policies
-- Step 8: Create signin trigger + JWT hook function
-- ============================================================

BEGIN;

-- ── Step 1: Create organizations table ──────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Create default org for legacy data
INSERT INTO organizations (id, name, slug)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Organization', 'default')
ON CONFLICT (id) DO NOTHING;

-- ── Step 2: Add organization_id to app_users ────────────────
-- (FK now works because organizations table exists)
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

UPDATE app_users
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_app_users_organization_id ON app_users(organization_id);

-- RLS policy on organizations (now safe — app_users.organization_id exists)
DROP POLICY IF EXISTS "organizations_select_member" ON organizations;
CREATE POLICY "organizations_select_member" ON organizations FOR SELECT TO authenticated
  USING (id = (SELECT organization_id FROM app_users WHERE auth_user_id = auth.uid()));

-- ── Step 3: Add organization_id to ALL data tables (nullable) ─

-- Core CRM tables
ALTER TABLE leads ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Child tables (task-related)
ALTER TABLE task_tags ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE task_tag_links ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE task_subtasks ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE task_comments ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE task_activities ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE task_time_entries ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Sales tables
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Logistics tables
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE purchase_receipts ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE purchase_receipt_items ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- RTS table
ALTER TABLE return_to_suppliers ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- RBAC tables
ALTER TABLE roles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- ── Step 4: Backfill all existing rows with default org_id ──
UPDATE leads SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE contacts SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE deals SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE tasks SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE activities SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE projects SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;

UPDATE task_tags SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE task_tag_links SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE task_subtasks SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE task_comments SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE task_activities SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE task_time_entries SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;

UPDATE quotes SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE sales_orders SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;

UPDATE inventory SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE inventory_transactions SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE vendors SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE purchase_requests SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE purchase_orders SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE purchase_receipts SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE purchase_receipt_items SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;

UPDATE return_to_suppliers SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;

UPDATE roles SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE permissions SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE role_permissions SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;

-- ── Step 5: Create indexes on organization_id ───────────────
CREATE INDEX IF NOT EXISTS idx_leads_org ON leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_org ON contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_deals_org ON deals(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_org ON tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_activities_org ON activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_task_tags_org ON task_tags(organization_id);
CREATE INDEX IF NOT EXISTS idx_task_tag_links_org ON task_tag_links(organization_id);
CREATE INDEX IF NOT EXISTS idx_task_subtasks_org ON task_subtasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_org ON task_comments(organization_id);
CREATE INDEX IF NOT EXISTS idx_task_activities_org ON task_activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_task_time_entries_org ON task_time_entries(organization_id);
CREATE INDEX IF NOT EXISTS idx_quotes_org ON quotes(organization_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_org ON sales_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_inventory_org ON inventory(organization_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_org ON inventory_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_vendors_org ON vendors(organization_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_org ON purchase_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_org ON purchase_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_purchase_receipts_org ON purchase_receipts(organization_id);
CREATE INDEX IF NOT EXISTS idx_purchase_receipt_items_org ON purchase_receipt_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_return_to_suppliers_org ON return_to_suppliers(organization_id);
CREATE INDEX IF NOT EXISTS idx_roles_org ON roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_permissions_org ON permissions(organization_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_org ON role_permissions(organization_id);

-- ════════════════════════════════════════════════════════════
-- STOP HERE. Run these NULL checks before proceeding:
-- SELECT table_name, COUNT(*) as null_count FROM (
--   SELECT 'leads' as table_name FROM leads WHERE organization_id IS NULL
--   UNION ALL SELECT 'contacts' FROM contacts WHERE organization_id IS NULL
--   UNION ALL SELECT 'deals' FROM deals WHERE organization_id IS NULL
--   UNION ALL SELECT 'tasks' FROM tasks WHERE organization_id IS NULL
-- ) sub GROUP BY table_name HAVING COUNT(*) > 0;
-- Repeat for ALL tables. Every count must be 0.
-- If any are > 0, investigate before running Step 6.
-- ════════════════════════════════════════════════════════════

-- ── Step 6: Alter organization_id to NOT NULL ───────────────
ALTER TABLE leads ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE contacts ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE deals ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE tasks ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE activities ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE projects ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE task_tags ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE task_tag_links ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE task_subtasks ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE task_comments ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE task_activities ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE task_time_entries ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE quotes ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE sales_orders ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE inventory ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE inventory_transactions ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE vendors ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE purchase_requests ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE purchase_orders ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE purchase_receipts ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE purchase_receipt_items ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE return_to_suppliers ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE roles ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE permissions ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE role_permissions ALTER COLUMN organization_id SET NOT NULL;

-- ── Step 7: Replace ALL RLS with org-scoped policies ────────

-- 7a. leads
DROP POLICY IF EXISTS "Users can view their own leads" ON leads;
DROP POLICY IF EXISTS "Users can insert their own leads" ON leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON leads;
DROP POLICY IF EXISTS "Users can delete their own leads" ON leads;
CREATE POLICY "org_isolation_leads" ON leads FOR ALL TO authenticated
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (organization_id = (auth.jwt() ->> 'org_id')::uuid);

-- 7b. contacts
DROP POLICY IF EXISTS "Users can view their own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can insert their own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can update their own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can delete their own contacts" ON contacts;
CREATE POLICY "org_isolation_contacts" ON contacts FOR ALL TO authenticated
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (organization_id = (auth.jwt() ->> 'org_id')::uuid);

-- 7c. deals
DROP POLICY IF EXISTS "Users can view their own deals" ON deals;
DROP POLICY IF EXISTS "Users can insert their own deals" ON deals;
DROP POLICY IF EXISTS "Users can update their own deals" ON deals;
DROP POLICY IF EXISTS "Users can delete their own deals" ON deals;
CREATE POLICY "org_isolation_deals" ON deals FOR ALL TO authenticated
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (organization_id = (auth.jwt() ->> 'org_id')::uuid);

-- 7d. tasks
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;
CREATE POLICY "org_isolation_tasks" ON tasks FOR ALL TO authenticated
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (organization_id = (auth.jwt() ->> 'org_id')::uuid);

-- 7e. activities
DROP POLICY IF EXISTS "Users can view their own activities" ON activities;
DROP POLICY IF EXISTS "Users can insert their own activities" ON activities;
DROP POLICY IF EXISTS "Users can update their own activities" ON activities;
DROP POLICY IF EXISTS "Users can delete their own activities" ON activities;
CREATE POLICY "org_isolation_activities" ON activities FOR ALL TO authenticated
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (organization_id = (auth.jwt() ->> 'org_id')::uuid);

-- 7f. projects
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can view projects" ON projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
CREATE POLICY "org_isolation_projects" ON projects FOR ALL TO authenticated
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (organization_id = (auth.jwt() ->> 'org_id')::uuid);

-- 7g. task_tags
DROP POLICY IF EXISTS "Users can view their own task tags" ON task_tags;
DROP POLICY IF EXISTS "Authenticated users can view task tags" ON task_tags;
DROP POLICY IF EXISTS "Users can create their own task tags" ON task_tags;
DROP POLICY IF EXISTS "Users can update their own task tags" ON task_tags;
DROP POLICY IF EXISTS "Users can delete their own task tags" ON task_tags;
CREATE POLICY "org_isolation_task_tags" ON task_tags FOR ALL TO authenticated
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (organization_id = (auth.jwt() ->> 'org_id')::uuid);

-- 7h. task_tag_links
DROP POLICY IF EXISTS "Users can view their own task tag links" ON task_tag_links;
DROP POLICY IF EXISTS "Users can create task tag links" ON task_tag_links;
DROP POLICY IF EXISTS "Users can delete their own task tag links" ON task_tag_links;
DROP POLICY IF EXISTS "Authenticated users can view task tag links" ON task_tag_links;
DROP POLICY IF EXISTS "Authenticated users can create task tag links" ON task_tag_links;
DROP POLICY IF EXISTS "Authenticated users can delete task tag links" ON task_tag_links;
CREATE POLICY "org_isolation_task_tag_links" ON task_tag_links FOR ALL TO authenticated
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (organization_id = (auth.jwt() ->> 'org_id')::uuid);

-- 7i. task_subtasks
DROP POLICY IF EXISTS "Users can view their own subtasks" ON task_subtasks;
DROP POLICY IF EXISTS "Users can create subtasks" ON task_subtasks;
DROP POLICY IF EXISTS "Users can update their own subtasks" ON task_subtasks;
DROP POLICY IF EXISTS "Users can delete their own subtasks" ON task_subtasks;
DROP POLICY IF EXISTS "Authenticated users can view subtasks" ON task_subtasks;
DROP POLICY IF EXISTS "Authenticated users can create subtasks" ON task_subtasks;
DROP POLICY IF EXISTS "Authenticated users can update subtasks" ON task_subtasks;
DROP POLICY IF EXISTS "Authenticated users can delete subtasks" ON task_subtasks;
CREATE POLICY "org_isolation_task_subtasks" ON task_subtasks FOR ALL TO authenticated
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (organization_id = (auth.jwt() ->> 'org_id')::uuid);

-- 7j. task_comments
DROP POLICY IF EXISTS "Users can view comments on their tasks" ON task_comments;
DROP POLICY IF EXISTS "Users can create comments on their tasks" ON task_comments;
DROP POLICY IF EXISTS "Authors can update their own comments" ON task_comments;
DROP POLICY IF EXISTS "Authors can delete their own comments" ON task_comments;
DROP POLICY IF EXISTS "Authenticated users can view comments" ON task_comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON task_comments;
CREATE POLICY "org_isolation_task_comments" ON task_comments FOR ALL TO authenticated
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (organization_id = (auth.jwt() ->> 'org_id')::uuid);

-- 7k. task_activities
DROP POLICY IF EXISTS "Users can view activity on their tasks" ON task_activities;
DROP POLICY IF EXISTS "System can create activity logs" ON task_activities;
DROP POLICY IF EXISTS "Authenticated users can view activity logs" ON task_activities;
CREATE POLICY "org_isolation_task_activities" ON task_activities FOR ALL TO authenticated
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (organization_id = (auth.jwt() ->> 'org_id')::uuid);

-- 7l. task_time_entries
DROP POLICY IF EXISTS "Users can view their own time entries" ON task_time_entries;
DROP POLICY IF EXISTS "Users can create their own time entries" ON task_time_entries;
DROP POLICY IF EXISTS "Users can update their own time entries" ON task_time_entries;
DROP POLICY IF EXISTS "Users can delete their own time entries" ON task_time_entries;
DROP POLICY IF EXISTS "Authenticated users can view time entries" ON task_time_entries;
DROP POLICY IF EXISTS "Authenticated users can create time entries" ON task_time_entries;
CREATE POLICY "org_isolation_task_time_entries" ON task_time_entries FOR ALL TO authenticated
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (organization_id = (auth.jwt() ->> 'org_id')::uuid);

-- 7m. quotes
DROP POLICY IF EXISTS "Users can view their own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can insert their own quotes" ON quotes;
CREATE POLICY "org_isolation_quotes" ON quotes FOR ALL TO authenticated
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (organization_id = (auth.jwt() ->> 'org_id')::uuid);

-- 7n. sales_orders
DROP POLICY IF EXISTS "Users can view their own sales orders" ON sales_orders;
DROP POLICY IF EXISTS "Users can insert their own sales orders" ON sales_orders;
CREATE POLICY "org_isolation_sales_orders" ON sales_orders FOR ALL TO authenticated
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (organization_id = (auth.jwt() ->> 'org_id')::uuid);

-- 7o. inventory
DROP POLICY IF EXISTS "Users can view their own inventory" ON inventory;
DROP POLICY IF EXISTS "Users can insert their own inventory" ON inventory;
DROP POLICY IF EXISTS "Users can update their own inventory" ON inventory;
DROP POLICY IF EXISTS "Users can delete their own inventory" ON inventory;
CREATE POLICY "org_isolation_inventory" ON inventory FOR ALL TO authenticated
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (organization_id = (auth.jwt() ->> 'org_id')::uuid);

-- 7p. inventory_transactions
DROP POLICY IF EXISTS "Users can view their own inventory transactions" ON inventory_transactions;
DROP POLICY IF EXISTS "System can insert inventory transactions" ON inventory_transactions;
DROP POLICY IF EXISTS "Authenticated users can view inventory transactions" ON inventory_transactions;
CREATE POLICY "org_isolation_inventory_transactions" ON inventory_transactions FOR ALL TO authenticated
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (organization_id = (auth.jwt() ->> 'org_id')::uuid);

-- 7q. vendors
DROP POLICY IF EXISTS "Users can view their own vendors" ON vendors;
DROP POLICY IF EXISTS "Users can insert their own vendors" ON vendors;
DROP POLICY IF EXISTS "Users can update their own vendors" ON vendors;
DROP POLICY IF EXISTS "Users can delete their own vendors" ON vendors;
DROP POLICY IF EXISTS "Users can only access their own vendors" ON vendors;
CREATE POLICY "org_isolation_vendors" ON vendors FOR ALL TO authenticated
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (organization_id = (auth.jwt() ->> 'org_id')::uuid);

-- 7r. purchase_requests
DROP POLICY IF EXISTS "Users can view their own purchase requests" ON purchase_requests;
DROP POLICY IF EXISTS "Users can insert their own purchase requests" ON purchase_requests;
CREATE POLICY "org_isolation_purchase_requests" ON purchase_requests FOR ALL TO authenticated
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (organization_id = (auth.jwt() ->> 'org_id')::uuid);

-- 7s. purchase_orders
DROP POLICY IF EXISTS "Users can view their own purchase orders" ON purchase_orders;
DROP POLICY IF EXISTS "Users can insert their own purchase orders" ON purchase_orders;
CREATE POLICY "org_isolation_purchase_orders" ON purchase_orders FOR ALL TO authenticated
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (organization_id = (auth.jwt() ->> 'org_id')::uuid);

-- 7t. purchase_receipts
DROP POLICY IF EXISTS "Users can view their own receipts" ON purchase_receipts;
DROP POLICY IF EXISTS "Users can insert their own receipts" ON purchase_receipts;
CREATE POLICY "org_isolation_purchase_receipts" ON purchase_receipts FOR ALL TO authenticated
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (organization_id = (auth.jwt() ->> 'org_id')::uuid);

-- 7u. purchase_receipt_items
DROP POLICY IF EXISTS "Users can view their receipt items" ON purchase_receipt_items;
DROP POLICY IF EXISTS "Users can insert receipt items" ON purchase_receipt_items;
CREATE POLICY "org_isolation_purchase_receipt_items" ON purchase_receipt_items FOR ALL TO authenticated
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (organization_id = (auth.jwt() ->> 'org_id')::uuid);

-- 7v. return_to_suppliers
DROP POLICY IF EXISTS "Users can view their own returns" ON return_to_suppliers;
DROP POLICY IF EXISTS "Users can insert their own returns" ON return_to_suppliers;
CREATE POLICY "org_isolation_return_to_suppliers" ON return_to_suppliers FOR ALL TO authenticated
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (organization_id = (auth.jwt() ->> 'org_id')::uuid);

-- 7w. app_users
DROP POLICY IF EXISTS "app_users_select_own_or_admin" ON app_users;
DROP POLICY IF EXISTS "app_users_insert_admin" ON app_users;
DROP POLICY IF EXISTS "app_users_update_own_or_admin" ON app_users;
DROP POLICY IF EXISTS "app_users_delete_admin" ON app_users;

CREATE POLICY "app_users_select_org" ON app_users FOR SELECT TO authenticated
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "app_users_insert_admin" ON app_users FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = (auth.jwt() ->> 'org_id')::uuid
    AND EXISTS (
      SELECT 1 FROM app_users au
      JOIN roles r ON r.id = au.role_id
      WHERE au.auth_user_id = auth.uid() AND r.name = 'Admin'
    )
  );

CREATE POLICY "app_users_update_org" ON app_users FOR UPDATE TO authenticated
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (organization_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "app_users_delete_admin" ON app_users FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users au
      JOIN roles r ON r.id = au.role_id
      WHERE au.auth_user_id = auth.uid() AND r.name = 'Admin'
    )
  );

-- 7x. roles
DROP POLICY IF EXISTS "roles_select_all" ON roles;
DROP POLICY IF EXISTS "roles_insert_admin" ON roles;
DROP POLICY IF EXISTS "roles_update_admin" ON roles;
DROP POLICY IF EXISTS "roles_delete_admin" ON roles;

CREATE POLICY "roles_select_org" ON roles FOR SELECT TO authenticated
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "roles_insert_org_admin" ON roles FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = (auth.jwt() ->> 'org_id')::uuid
    AND EXISTS (SELECT 1 FROM app_users au JOIN roles r ON r.id = au.role_id WHERE au.auth_user_id = auth.uid() AND r.name = 'Admin')
  );

CREATE POLICY "roles_update_org_admin" ON roles FOR UPDATE TO authenticated
  USING (
    organization_id = (auth.jwt() ->> 'org_id')::uuid
    AND EXISTS (SELECT 1 FROM app_users au JOIN roles r ON r.id = au.role_id WHERE au.auth_user_id = auth.uid() AND r.name = 'Admin')
  )
  WITH CHECK (
    organization_id = (auth.jwt() ->> 'org_id')::uuid
    AND EXISTS (SELECT 1 FROM app_users au JOIN roles r ON r.id = au.role_id WHERE au.auth_user_id = auth.uid() AND r.name = 'Admin')
  );

CREATE POLICY "roles_delete_org_admin" ON roles FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM app_users au JOIN roles r ON r.id = au.role_id WHERE au.auth_user_id = auth.uid() AND r.name = 'Admin')
  );

-- 7y. permissions
DROP POLICY IF EXISTS "permissions_select_all" ON permissions;
CREATE POLICY "permissions_select_org" ON permissions FOR SELECT TO authenticated
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

-- 7z. role_permissions
DROP POLICY IF EXISTS "role_perms_select_all" ON role_permissions;
DROP POLICY IF EXISTS "role_perms_insert_admin" ON role_permissions;
DROP POLICY IF EXISTS "role_perms_update_admin" ON role_permissions;
DROP POLICY IF EXISTS "role_perms_delete_admin" ON role_permissions;

CREATE POLICY "role_perms_select_org" ON role_permissions FOR SELECT TO authenticated
  USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "role_perms_insert_org_admin" ON role_permissions FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = (auth.jwt() ->> 'org_id')::uuid
    AND EXISTS (SELECT 1 FROM app_users au JOIN roles r ON r.id = au.role_id WHERE au.auth_user_id = auth.uid() AND r.name = 'Admin')
  );

CREATE POLICY "role_perms_update_org_admin" ON role_permissions FOR UPDATE TO authenticated
  USING (
    organization_id = (auth.jwt() ->> 'org_id')::uuid
    AND EXISTS (SELECT 1 FROM app_users au JOIN roles r ON r.id = au.role_id WHERE au.auth_user_id = auth.uid() AND r.name = 'Admin')
  )
  WITH CHECK (
    organization_id = (auth.jwt() ->> 'org_id')::uuid
    AND EXISTS (SELECT 1 FROM app_users au JOIN roles r ON r.id = au.role_id WHERE au.auth_user_id = auth.uid() AND r.name = 'Admin')
  );

CREATE POLICY "role_perms_delete_org_admin" ON role_permissions FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM app_users au JOIN roles r ON r.id = au.role_id WHERE au.auth_user_id = auth.uid() AND r.name = 'Admin')
  );

-- ── Step 8: Signin trigger + interim JWT function ───────────

-- Trigger to link invited users (placeholder auth_user_id) to real auth.users
CREATE OR REPLACE FUNCTION public.link_app_user_on_first_signin()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.app_users
  SET auth_user_id = NEW.id
  WHERE email = NEW.email
    AND NOT EXISTS (
      SELECT 1 FROM auth.users au WHERE au.id = app_users.auth_user_id::uuid
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions so Supabase auth can call the trigger function
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON public.app_users TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.link_app_user_on_first_signin TO supabase_auth_admin;

DROP TRIGGER IF EXISTS link_app_user_on_signin ON auth.users;
CREATE TRIGGER link_app_user_on_signin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.link_app_user_on_first_signin();

-- Interim JWT function (replaced by custom_access_token_hook in Phase 3)
CREATE OR REPLACE FUNCTION public.user_claims()
RETURNS jsonb
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'org_id', (
      SELECT au.organization_id::text
      FROM public.app_users au
      WHERE au.auth_user_id = auth.uid()
      LIMIT 1
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.user_claims TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_claims TO supabase_auth_admin;

COMMIT;

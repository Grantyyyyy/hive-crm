-- ============================================================
-- Phase 1: Fix RLS Leaks — User-Scoped Interim Policies
-- ============================================================
-- This replaces all USING (true) and permissive policies with
-- user-scoped policies. Safe to run on live data. No schema changes.
-- ============================================================
-- PRE-FLIGHT: Run this query FIRST before executing:
-- SELECT table_name, column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name IN ('quotes', 'sales_orders', 'purchase_orders', 'inventory', 'vendors')
--   AND column_name IN ('user_id', 'owner_id')
-- ORDER BY table_name, column_name;
--
-- If inventory returns zero rows, run:
--   ALTER TABLE inventory ADD COLUMN IF NOT EXISTS user_id TEXT;
-- ============================================================

BEGIN;

-- ── 1. inventory — currently has NO RLS — CRITICAL ──────────
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view inventory" ON inventory;
CREATE POLICY "Users can view their own inventory"
  ON inventory FOR SELECT TO authenticated
  USING (auth.uid()::text = COALESCE(user_id, owner_id));

DROP POLICY IF EXISTS "Users can insert inventory" ON inventory;
CREATE POLICY "Users can insert their own inventory"
  ON inventory FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = COALESCE(user_id, owner_id));

DROP POLICY IF EXISTS "Users can update their own inventory" ON inventory;
CREATE POLICY "Users can update their own inventory"
  ON inventory FOR UPDATE TO authenticated
  USING (auth.uid()::text = COALESCE(user_id, owner_id));

DROP POLICY IF EXISTS "Users can delete their own inventory" ON inventory;
CREATE POLICY "Users can delete their own inventory"
  ON inventory FOR DELETE TO authenticated
  USING (auth.uid()::text = COALESCE(user_id, owner_id));

-- ── 2. vendors — currently USING (true) on FOR ALL — CRITICAL LEAK ──────────
DROP POLICY IF EXISTS "Users can only access their own vendors" ON vendors;

CREATE POLICY "Users can view their own vendors"
  ON vendors FOR SELECT TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own vendors"
  ON vendors FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own vendors"
  ON vendors FOR UPDATE TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own vendors"
  ON vendors FOR DELETE TO authenticated
  USING (auth.uid()::text = user_id);

-- ── 3. purchase_receipts — already user-scoped, verify ──────
ALTER TABLE purchase_receipts ENABLE ROW LEVEL SECURITY;

-- ── 4. purchase_receipt_items — inherits via parent ─────────
ALTER TABLE purchase_receipt_items ENABLE ROW LEVEL SECURITY;

-- ── 5. inventory_transactions — currently USING (true) ──────
DROP POLICY IF EXISTS "Authenticated users can view inventory transactions" ON inventory_transactions;
DROP POLICY IF EXISTS "System can insert inventory transactions" ON inventory_transactions;

CREATE POLICY "Users can view their own inventory transactions"
  ON inventory_transactions FOR SELECT TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "System can insert inventory transactions"
  ON inventory_transactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

-- ── 6. projects — currently USING (true) for SELECT ─────────
DROP POLICY IF EXISTS "Authenticated users can view projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can create projects" ON projects;
DROP POLICY IF EXISTS "Owners can update their projects" ON projects;
DROP POLICY IF EXISTS "Owners can delete their projects" ON projects;

CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT TO authenticated
  USING (auth.uid()::text = COALESCE(user_id, owner_id));

CREATE POLICY "Users can create their own projects"
  ON projects FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = COALESCE(user_id, owner_id));

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE TO authenticated
  USING (auth.uid()::text = COALESCE(user_id, owner_id));

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE TO authenticated
  USING (auth.uid()::text = COALESCE(user_id, owner_id));

-- ── 7. task_tags — currently USING (true) for SELECT ────────
DROP POLICY IF EXISTS "Authenticated users can view task tags" ON task_tags;
DROP POLICY IF EXISTS "Owners can create task tags" ON task_tags;
DROP POLICY IF EXISTS "Owners can update their tags" ON task_tags;
DROP POLICY IF EXISTS "Owners can delete their tags" ON task_tags;

CREATE POLICY "Users can view their own task tags"
  ON task_tags FOR SELECT TO authenticated
  USING (auth.uid()::text = owner_id);

CREATE POLICY "Users can create their own task tags"
  ON task_tags FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = owner_id);

CREATE POLICY "Users can update their own task tags"
  ON task_tags FOR UPDATE TO authenticated
  USING (auth.uid()::text = owner_id);

CREATE POLICY "Users can delete their own task tags"
  ON task_tags FOR DELETE TO authenticated
  USING (auth.uid()::text = owner_id);

-- ── 8. task_tag_links — currently USING (true) ──────────────
DROP POLICY IF EXISTS "Authenticated users can view task tag links" ON task_tag_links;
DROP POLICY IF EXISTS "Authenticated users can create task tag links" ON task_tag_links;
DROP POLICY IF EXISTS "Authenticated users can delete task tag links" ON task_tag_links;

CREATE POLICY "Users can view their own task tag links"
  ON task_tag_links FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM task_tags tt WHERE tt.id = task_tag_links.tag_id AND tt.owner_id = auth.uid()::text
  ));

CREATE POLICY "Users can create task tag links"
  ON task_tag_links FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM task_tags tt WHERE tt.id = task_tag_links.tag_id AND tt.owner_id = auth.uid()::text
  ));

CREATE POLICY "Users can delete their own task tag links"
  ON task_tag_links FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM task_tags tt WHERE tt.id = task_tag_links.tag_id AND tt.owner_id = auth.uid()::text
  ));

-- ── 9. task_subtasks — currently USING (true) on ALL ────────
DROP POLICY IF EXISTS "Authenticated users can view subtasks" ON task_subtasks;
DROP POLICY IF EXISTS "Authenticated users can create subtasks" ON task_subtasks;
DROP POLICY IF EXISTS "Authenticated users can update subtasks" ON task_subtasks;
DROP POLICY IF EXISTS "Authenticated users can delete subtasks" ON task_subtasks;

CREATE POLICY "Users can view their own subtasks"
  ON task_subtasks FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM tasks t WHERE t.id = task_subtasks.task_id AND t.owner_id = auth.uid()::text
  ));

CREATE POLICY "Users can create subtasks"
  ON task_subtasks FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM tasks t WHERE t.id = task_subtasks.task_id AND t.owner_id = auth.uid()::text
  ));

CREATE POLICY "Users can update their own subtasks"
  ON task_subtasks FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM tasks t WHERE t.id = task_subtasks.task_id AND t.owner_id = auth.uid()::text
  ));

CREATE POLICY "Users can delete their own subtasks"
  ON task_subtasks FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM tasks t WHERE t.id = task_subtasks.task_id AND t.owner_id = auth.uid()::text
  ));

-- ── 10. task_comments — currently USING (true) on ALL ───────
DROP POLICY IF EXISTS "Authenticated users can view comments" ON task_comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON task_comments;
DROP POLICY IF EXISTS "Authors can update their comments" ON task_comments;
DROP POLICY IF EXISTS "Authors can delete their comments" ON task_comments;

CREATE POLICY "Users can view comments on their tasks"
  ON task_comments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM tasks t WHERE t.id = task_comments.task_id AND t.owner_id = auth.uid()::text
  ));

CREATE POLICY "Users can create comments on their tasks"
  ON task_comments FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM tasks t WHERE t.id = task_comments.task_id AND t.owner_id = auth.uid()::text
  ));

CREATE POLICY "Authors can update their own comments"
  ON task_comments FOR UPDATE TO authenticated
  USING (auth.uid()::text = author_id);

CREATE POLICY "Authors can delete their own comments"
  ON task_comments FOR DELETE TO authenticated
  USING (auth.uid()::text = author_id);

-- ── 11. task_activities — currently USING (true) for SELECT ─
DROP POLICY IF EXISTS "Authenticated users can view activity logs" ON task_activities;
DROP POLICY IF EXISTS "System can create activity logs" ON task_activities;

CREATE POLICY "Users can view activity on their tasks"
  ON task_activities FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM tasks t WHERE t.id = task_activities.task_id AND t.owner_id = auth.uid()::text
  ));

CREATE POLICY "System can create activity logs"
  ON task_activities FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM tasks t WHERE t.id = task_activities.task_id AND t.owner_id = auth.uid()::text
  ) OR task_id IS NULL);

-- ── 12. task_time_entries — currently USING (true) ──────────
DROP POLICY IF EXISTS "Authenticated users can view time entries" ON task_time_entries;
DROP POLICY IF EXISTS "Authenticated users can create time entries" ON task_time_entries;
DROP POLICY IF EXISTS "Users can update their time entries" ON task_time_entries;
DROP POLICY IF EXISTS "Users can delete their time entries" ON task_time_entries;

CREATE POLICY "Users can view their own time entries"
  ON task_time_entries FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM tasks t WHERE t.id = task_time_entries.task_id AND t.owner_id = auth.uid()::text
  ) OR auth.uid()::text = user_id);

CREATE POLICY "Users can create their own time entries"
  ON task_time_entries FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own time entries"
  ON task_time_entries FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM tasks t WHERE t.id = task_time_entries.task_id AND t.owner_id = auth.uid()::text
  ) OR auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own time entries"
  ON task_time_entries FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM tasks t WHERE t.id = task_time_entries.task_id AND t.owner_id = auth.uid()::text
  ) OR auth.uid()::text = user_id);

-- ── 13. leads ───────────────────────────────────────────────
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own leads" ON leads;
CREATE POLICY "Users can view their own leads"
  ON leads FOR SELECT TO authenticated
  USING (owner_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can insert their own leads" ON leads;
CREATE POLICY "Users can insert their own leads"
  ON leads FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update their own leads" ON leads;
CREATE POLICY "Users can update their own leads"
  ON leads FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete their own leads" ON leads;
CREATE POLICY "Users can delete their own leads"
  ON leads FOR DELETE TO authenticated
  USING (owner_id = auth.uid()::text);

-- ── 14. contacts ────────────────────────────────────────────
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own contacts" ON contacts;
CREATE POLICY "Users can view their own contacts"
  ON contacts FOR SELECT TO authenticated
  USING (owner_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can insert their own contacts" ON contacts;
CREATE POLICY "Users can insert their own contacts"
  ON contacts FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update their own contacts" ON contacts;
CREATE POLICY "Users can update their own contacts"
  ON contacts FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete their own contacts" ON contacts;
CREATE POLICY "Users can delete their own contacts"
  ON contacts FOR DELETE TO authenticated
  USING (owner_id = auth.uid()::text);

-- ── 15. deals ───────────────────────────────────────────────
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own deals" ON deals;
CREATE POLICY "Users can view their own deals"
  ON deals FOR SELECT TO authenticated
  USING (owner_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can insert their own deals" ON deals;
CREATE POLICY "Users can insert their own deals"
  ON deals FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update their own deals" ON deals;
CREATE POLICY "Users can update their own deals"
  ON deals FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete their own deals" ON deals;
CREATE POLICY "Users can delete their own deals"
  ON deals FOR DELETE TO authenticated
  USING (owner_id = auth.uid()::text);

-- ── 16. tasks ───────────────────────────────────────────────
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT TO authenticated
  USING (owner_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
CREATE POLICY "Users can insert their own tasks"
  ON tasks FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;
CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE TO authenticated
  USING (owner_id = auth.uid()::text);

-- ── 17. activities — uses user_id (text) ──────────────────
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own activities" ON activities;
CREATE POLICY "Users can view their own activities"
  ON activities FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can insert their own activities" ON activities;
CREATE POLICY "Users can insert their own activities"
  ON activities FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update their own activities" ON activities;
CREATE POLICY "Users can update their own activities"
  ON activities FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete their own activities" ON activities;
CREATE POLICY "Users can delete their own activities"
  ON activities FOR DELETE TO authenticated
  USING (user_id = auth.uid()::text);

-- ── 18. quotes — uses user_id (text) ───────────────────────
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own quotes" ON quotes;
CREATE POLICY "Users can view their own quotes"
  ON quotes FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can insert their own quotes" ON quotes;
CREATE POLICY "Users can insert their own quotes"
  ON quotes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

-- ── 19. sales_orders — uses user_id (text) ─────────────────
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own sales orders" ON sales_orders;
CREATE POLICY "Users can view their own sales orders"
  ON sales_orders FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can insert their own sales orders" ON sales_orders;
CREATE POLICY "Users can insert their own sales orders"
  ON sales_orders FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

-- ── 20. purchase_orders — uses user_id (text) ──────────────
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own purchase orders" ON purchase_orders;
CREATE POLICY "Users can view their own purchase orders"
  ON purchase_orders FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can insert their own purchase orders" ON purchase_orders;
CREATE POLICY "Users can insert their own purchase orders"
  ON purchase_orders FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

-- ── 21. purchase_requests — uses user_id (text) ──────────
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own purchase requests" ON purchase_requests;
CREATE POLICY "Users can view their own purchase requests"
  ON purchase_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can insert their own purchase requests" ON purchase_requests;
CREATE POLICY "Users can insert their own purchase requests"
  ON purchase_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

-- ── 22. return_to_suppliers ─────────────────────────────────
ALTER TABLE return_to_suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own returns" ON return_to_suppliers;
CREATE POLICY "Users can view their own returns"
  ON return_to_suppliers FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own returns" ON return_to_suppliers;
CREATE POLICY "Users can insert their own returns"
  ON return_to_suppliers FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

COMMIT;

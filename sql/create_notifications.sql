-- ============================================================
-- Notifications table
-- Stores system-generated alerts (inventory, order, etc.)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL,
  organization_id uuid REFERENCES organizations(id),
  type            text NOT NULL DEFAULT 'info',
  title           text NOT NULL,
  message         text NOT NULL DEFAULT '',
  link            text,
  is_read         boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups by user + read status
CREATE INDEX IF NOT EXISTS idx_notifications_user_read
  ON public.notifications (user_id, is_read);

-- Index for organization scoping
CREATE INDEX IF NOT EXISTS idx_notifications_org
  ON public.notifications (organization_id);

-- ── RLS ─────────────────────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Uses auth.jwt() ->> 'sub' to match user_id (same pattern as other tables).
-- The anon role does NOT have permission to query auth.users directly.

CREATE POLICY "notifications_select"
  ON public.notifications FOR SELECT
  USING (user_id = (auth.jwt() ->> 'sub')::uuid);

CREATE POLICY "notifications_insert"
  ON public.notifications FOR INSERT
  WITH CHECK (user_id = (auth.jwt() ->> 'sub')::uuid);

CREATE POLICY "notifications_update"
  ON public.notifications FOR UPDATE
  USING (user_id = (auth.jwt() ->> 'sub')::uuid);

CREATE POLICY "notifications_delete"
  ON public.notifications FOR DELETE
  USING (user_id = (auth.jwt() ->> 'sub')::uuid);

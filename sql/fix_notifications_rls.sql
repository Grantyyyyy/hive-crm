-- Fix notifications RLS to use JWT claims (matching the project's existing pattern).
-- The anon role cannot query auth.users, so we use auth.jwt() instead.

DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete" ON public.notifications;

-- SELECT: org-scoped with user_id fallback
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT USING (
  user_id = (auth.jwt() ->> 'sub')::uuid
);

-- INSERT: user can insert their own notifications
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (
  user_id = (auth.jwt() ->> 'sub')::uuid
);

-- UPDATE: user can update their own notifications (mark read, etc.)
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING (
  user_id = (auth.jwt() ->> 'sub')::uuid
);

-- DELETE: user can delete their own notifications
CREATE POLICY "notifications_delete" ON public.notifications FOR DELETE USING (
  user_id = (auth.jwt() ->> 'sub')::uuid
);

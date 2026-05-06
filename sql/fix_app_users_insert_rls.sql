-- ============================================================
-- Fix: Allow new users to insert their own app_users record
-- ============================================================
-- The previous policy "app_users_insert_admin" only allowed
-- Admins to insert into app_users. This broke the sign-up flow
-- because new users need to create their own initial profile.
-- ============================================================

DROP POLICY IF EXISTS "app_users_insert_admin" ON app_users;

-- Allow Admins to insert anyone, AND allow new users to insert themselves
-- as long as they don't try to assign themselves a role or org yet.
CREATE POLICY "app_users_insert_own_or_admin"
  ON app_users FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin() 
    OR 
    (
      auth_user_id = auth.uid() AND
      role_id IS NULL AND
      organization_id IS NULL
    )
  );

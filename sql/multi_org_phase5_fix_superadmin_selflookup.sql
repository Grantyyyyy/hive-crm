-- ============================================================
-- Multi-Org Phase 5: Fix superadmin self-lookup (multi-membership)
-- ============================================================
-- Bug: app_users_select_org had `OR is_superadmin_user()`, so a
-- Super Admin who belongs to >1 org saw ALL their membership rows.
-- Every per-user `.eq(auth_user_id).maybeSingle()` in the client
-- (org name, permissions, role) then errored on multiple rows,
-- leaving the user with no org name and no permissions.
--
-- Fix: scope app_users SELECT to the active/effective org, exactly
-- like every other data table. Cross-org visibility for platform
-- Super Admins (the Users screen) moves to a dedicated RPC.
-- ============================================================

BEGIN;

DROP POLICY IF EXISTS app_users_select_org ON public.app_users;
CREATE POLICY app_users_select_org ON public.app_users
  FOR SELECT TO authenticated
  USING (organization_id = COALESCE((auth.jwt() ->> 'org_id')::uuid, public.get_active_org_id()));

-- Platform Super Admins can still list every user across all orgs
-- (used by the Users screen when isSuperAdmin). Returns nothing for
-- non-superadmins.
CREATE OR REPLACE FUNCTION public.list_all_app_users()
RETURNS SETOF public.app_users
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT au.*
  FROM public.app_users au
  WHERE EXISTS (
    SELECT 1 FROM public.app_users me
    WHERE me.auth_user_id = auth.uid() AND me.is_superadmin = true
  );
$$;

GRANT EXECUTE ON FUNCTION public.list_all_app_users() TO authenticated;

COMMIT;

-- ============================================================
-- Multi-Org Phase 2: Invite / add an existing user
-- ============================================================
-- Lets the invite endpoint (service role) resolve an already-
-- registered auth user by email, so it can attach them to a new
-- organization as a membership instead of failing with "already
-- registered".
--
-- Restricted to service_role to avoid email -> id enumeration by
-- ordinary clients.
-- ============================================================

CREATE OR REPLACE FUNCTION public.find_auth_user_id_by_email(p_email text)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM auth.users WHERE lower(email) = lower(p_email) LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.find_auth_user_id_by_email(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_auth_user_id_by_email(text) TO service_role;

-- ============================================================
-- Multi-Org Phase 6: Free-tier org creation limit
-- ============================================================
-- A user may own at most 2 free-plan organizations. Creating a
-- 3rd free org is blocked until they upgrade an existing one.
-- Platform Super Admins are exempt.
--
-- Adds organizations.created_by so the limit counts orgs the user
-- actually created (not ones they were merely invited into).
-- ============================================================

BEGIN;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Best-effort backfill: the earliest Admin/Super Admin member of each org.
UPDATE public.organizations o
SET created_by = sub.uid
FROM (
  SELECT DISTINCT ON (au.organization_id)
         au.organization_id, au.auth_user_id AS uid
  FROM public.app_users au
  JOIN public.roles r ON r.id = au.role_id
  WHERE r.name IN ('Admin', 'Super Admin')
    AND au.auth_user_id IS NOT NULL
  ORDER BY au.organization_id, au.created_at ASC
) sub
WHERE o.id = sub.organization_id AND o.created_by IS NULL;

-- Rebuild initialize_organization with the free-tier limit.
CREATE OR REPLACE FUNCTION public.initialize_organization(
  org_name text,
  org_slug text,
  user_email text DEFAULT NULL,
  user_full_name text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_org_id uuid;
  v_slug text;
  v_admin_role_id uuid;
  v_is_superadmin boolean;
  v_free_owned integer;
  c_free_org_limit constant integer := 2;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: no active session';
  END IF;

  -- Free-tier limit: at most 2 free-plan orgs per user (Super Admins exempt).
  v_is_superadmin := EXISTS (
    SELECT 1 FROM public.app_users
    WHERE auth_user_id = v_user_id AND is_superadmin = true
  );

  IF NOT v_is_superadmin THEN
    SELECT count(*) INTO v_free_owned
    FROM public.organizations
    WHERE created_by = v_user_id AND plan = 'free';

    IF v_free_owned >= c_free_org_limit THEN
      RAISE EXCEPTION 'Free plan is limited to % organizations. Upgrade an existing organization to create more.', c_free_org_limit
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  v_slug := org_slug;
  IF v_slug IS NULL OR length(trim(v_slug)) = 0 THEN
    v_slug := 'org';
  END IF;
  IF EXISTS (SELECT 1 FROM public.organizations WHERE slug = v_slug) THEN
    v_slug := v_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
  END IF;

  SELECT id INTO v_admin_role_id
  FROM public.roles
  WHERE lower(name) = 'admin'
  ORDER BY is_system DESC NULLS LAST, created_at ASC NULLS LAST
  LIMIT 1;

  IF v_admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Admin role not found';
  END IF;

  INSERT INTO public.organizations (name, slug, created_by)
  VALUES (org_name, v_slug, v_user_id)
  RETURNING id INTO v_org_id;

  INSERT INTO public.app_users (auth_user_id, email, name, organization_id, role_id, owner_id, updated_at)
  VALUES (
    v_user_id,
    user_email,
    COALESCE(user_full_name, split_part(COALESCE(user_email, ''), '@', 1), 'Admin'),
    v_org_id,
    v_admin_role_id,
    v_user_id::text,
    now()
  );

  INSERT INTO public.user_profiles (auth_user_id, active_organization_id, name)
  VALUES (v_user_id, v_org_id, COALESCE(user_full_name, split_part(COALESCE(user_email, ''), '@', 1)))
  ON CONFLICT (auth_user_id)
  DO UPDATE SET active_organization_id = EXCLUDED.active_organization_id, updated_at = now();

  RETURN jsonb_build_object(
    'success', true,
    'organization_id', v_org_id,
    'role_id', v_admin_role_id,
    'users_affected', 1
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.initialize_organization(text, text, text, text) TO authenticated;

-- Lightweight pre-check for the UI (so the user sees the limit before trying).
CREATE OR REPLACE FUNCTION public.can_create_organization()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    EXISTS (SELECT 1 FROM public.app_users WHERE auth_user_id = auth.uid() AND is_superadmin = true)
    OR (
      SELECT count(*) FROM public.organizations
      WHERE created_by = auth.uid() AND plan = 'free'
    ) < 2;
$$;

GRANT EXECUTE ON FUNCTION public.can_create_organization() TO authenticated;

COMMIT;

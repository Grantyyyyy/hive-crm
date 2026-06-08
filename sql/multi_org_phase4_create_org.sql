-- ============================================================
-- Multi-Org Phase 4: Create additional organizations
-- ============================================================
-- Rewrites initialize_organization so it can be used both for
-- first-time onboarding AND for an existing user spinning up an
-- additional organization.
--
-- Changes vs the old version:
--   * No longer rejects users who already belong to an org.
--   * INSERTS a new membership (does not move the existing one).
--   * Sets the new org as the caller's active org.
--
-- Note: roles/permissions are GLOBAL in this schema (UNIQUE on
-- roles.name and permissions.module/action, with world-readable
-- SELECT policies). New orgs reuse the shared Admin role rather
-- than seeding their own — copying would violate those uniques.
-- ============================================================

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
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: no active session';
  END IF;

  -- Ensure a unique slug.
  v_slug := org_slug;
  IF v_slug IS NULL OR length(trim(v_slug)) = 0 THEN
    v_slug := 'org';
  END IF;
  IF EXISTS (SELECT 1 FROM public.organizations WHERE slug = v_slug) THEN
    v_slug := v_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
  END IF;

  -- Global Admin role (roles are shared across orgs in this schema).
  SELECT id INTO v_admin_role_id
  FROM public.roles
  WHERE lower(name) = 'admin'
  ORDER BY is_system DESC NULLS LAST, created_at ASC NULLS LAST
  LIMIT 1;

  IF v_admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Admin role not found';
  END IF;

  -- 1. Create the organization.
  INSERT INTO public.organizations (name, slug)
  VALUES (org_name, v_slug)
  RETURNING id INTO v_org_id;

  -- 2. Add the caller as a member (Admin) of the new org.
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

  -- 3. Make the new org the caller's active workspace.
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

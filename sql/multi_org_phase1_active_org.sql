-- ============================================================
-- Multi-Org Phase 1: Active-org resolution + RLS hardening
-- ============================================================
-- Redefines the existing org/admin helper functions so that every
-- RLS policy that already calls them becomes "active-org aware"
-- without rewriting the ~57 data-table policies.
--
-- Key concepts:
--   get_active_org_id()  -> the caller's chosen org (validated
--                           against a real membership), else their
--                           first membership.
--   effective_org_id()   -> COALESCE(jwt org_id, active org). This
--                           is the org the request is transacting
--                           in; admin checks bind to THIS so admin
--                           status can never leak across orgs.
-- ============================================================

BEGIN;

-- ── Core resolvers ───────────────────────────────────────────

-- The caller's active org, validated against an actual membership.
CREATE OR REPLACE FUNCTION public.get_active_org_id()
RETURNS uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_active uuid;
BEGIN
  IF v_uid IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT active_organization_id INTO v_active
  FROM public.user_profiles
  WHERE auth_user_id = v_uid;

  IF v_active IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.app_users
    WHERE auth_user_id = v_uid AND organization_id = v_active
  ) THEN
    RETURN v_active;
  END IF;

  -- Fallback: earliest membership.
  RETURN (
    SELECT organization_id FROM public.app_users
    WHERE auth_user_id = v_uid AND organization_id IS NOT NULL
    ORDER BY created_at ASC
    LIMIT 1
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_active_org_id() TO authenticated;

-- The org this request is actually scoped to: JWT claim wins (fast,
-- fresh after a session refresh), else the active org.
CREATE OR REPLACE FUNCTION public.effective_org_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE((auth.jwt() ->> 'org_id')::uuid, public.get_active_org_id());
$$;
GRANT EXECUTE ON FUNCTION public.effective_org_id() TO authenticated;

-- All the user's org ids (bypasses app_users RLS) — used to let a
-- person read the names of every org they belong to.
CREATE OR REPLACE FUNCTION public.my_org_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT organization_id FROM public.app_users
  WHERE auth_user_id = auth.uid() AND organization_id IS NOT NULL;
$$;
GRANT EXECUTE ON FUNCTION public.my_org_ids() TO authenticated;

-- ── Redefine legacy resolvers to delegate (callers unchanged) ─

-- Data-table policies call this inside COALESCE(jwt, get_my_org_id()).
CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.get_active_org_id(); $$;

-- organizations_select / organizations_update call this bare.
CREATE OR REPLACE FUNCTION public.auth_user_org_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.effective_org_id(); $$;

-- ── Admin checks: bind to the EFFECTIVE org (no cross-org leak) ─

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_users au
    JOIN public.roles r ON r.id = au.role_id
    WHERE au.auth_user_id = auth.uid()
      AND au.organization_id = public.effective_org_id()
      AND r.name = 'Admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_users au
    JOIN public.roles r ON r.id = au.role_id
    WHERE au.auth_user_id = auth.uid()
      AND au.organization_id = public.effective_org_id()
      AND r.name = 'Admin'
  );
$$;
-- is_superadmin_user() stays platform-wide (Super Admin spans orgs).

-- ── JWT hook: stamp the ACTIVE org into the token ────────────

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id uuid := (event->>'user_id')::uuid;
  v_claims  jsonb := event->'claims';
  v_active  uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN event;
  END IF;

  SELECT active_organization_id INTO v_active
  FROM public.user_profiles
  WHERE auth_user_id = v_user_id;

  IF v_active IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.app_users
    WHERE auth_user_id = v_user_id AND organization_id = v_active
  ) THEN
    SELECT organization_id INTO v_active
    FROM public.app_users
    WHERE auth_user_id = v_user_id AND organization_id IS NOT NULL
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  IF v_active IS NOT NULL THEN
    v_claims := jsonb_set(v_claims, '{org_id}', to_jsonb(v_active::text));
  ELSE
    v_claims := jsonb_set(v_claims, '{org_id}', 'null'::jsonb);
  END IF;

  RETURN jsonb_set(event, '{claims}', v_claims);
END;
$$;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;
GRANT SELECT ON public.user_profiles TO supabase_auth_admin;
GRANT SELECT ON public.app_users TO supabase_auth_admin;

-- ── Org switching ────────────────────────────────────────────

-- Switch the caller's active org (must be a member). The client
-- then refreshes its session so the new JWT carries the new claim.
CREATE OR REPLACE FUNCTION public.set_active_org(p_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.app_users
    WHERE auth_user_id = v_uid AND organization_id = p_org_id
  ) THEN
    RAISE EXCEPTION 'Not a member of organization %', p_org_id;
  END IF;

  INSERT INTO public.user_profiles (auth_user_id, active_organization_id)
  VALUES (v_uid, p_org_id)
  ON CONFLICT (auth_user_id)
  DO UPDATE SET active_organization_id = EXCLUDED.active_organization_id, updated_at = now();

  RETURN jsonb_build_object('success', true, 'active_organization_id', p_org_id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.set_active_org(uuid) TO authenticated;

-- All orgs the caller belongs to, with their role + active flag.
CREATE OR REPLACE FUNCTION public.get_my_memberships()
RETURNS TABLE (
  organization_id   uuid,
  organization_name text,
  role_id           uuid,
  role_name         text,
  is_superadmin     boolean,
  is_active         boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT o.id, o.name, au.role_id, r.name, au.is_superadmin,
         (o.id = public.get_active_org_id()) AS is_active
  FROM public.app_users au
  JOIN public.organizations o ON o.id = au.organization_id
  LEFT JOIN public.roles r ON r.id = au.role_id
  WHERE au.auth_user_id = auth.uid()
  ORDER BY o.name;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_memberships() TO authenticated;

-- ── Fix the policy that breaks with >1 membership ────────────
-- Scalar subquery -> set membership via SECURITY DEFINER helper,
-- so a user can read every org they belong to (needed by switcher).
DROP POLICY IF EXISTS organizations_select_member ON public.organizations;
CREATE POLICY organizations_select_member ON public.organizations
  FOR SELECT TO authenticated
  USING (id IN (SELECT public.my_org_ids()));

COMMIT;

-- Fix org creation onboarding so the flow is atomic and does not depend on
-- a pre-existing app_users row or a fresh JWT org_id claim.

BEGIN;

-- Allow a newly signed-in user to create their own empty app_users stub.
DROP POLICY IF EXISTS "app_users_insert_admin" ON public.app_users;
DROP POLICY IF EXISTS "app_users_insert_own_or_admin" ON public.app_users;

CREATE POLICY "app_users_insert_own_or_admin"
  ON public.app_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin()
    OR (
      auth_user_id = auth.uid()
      AND role_id IS NULL
      AND organization_id IS NULL
    )
  );

-- Cold-start helper: if the JWT does not yet contain org_id, RLS policies and
-- the frontend can still resolve the caller's organization through app_users.
CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN (
    SELECT organization_id
    FROM public.app_users
    WHERE auth_user_id = auth.uid()
    LIMIT 1
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_org_id() TO authenticated;

-- Keep the JWT org_id claim in sync when the auth hook is enabled in Supabase.
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims jsonb;
  user_org_id uuid;
BEGIN
  SELECT organization_id
  INTO user_org_id
  FROM public.app_users
  WHERE auth_user_id = (event->>'user_id')::uuid
  LIMIT 1;

  claims := event->'claims';

  IF user_org_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{org_id}', to_jsonb(user_org_id::text));
  ELSE
    claims := jsonb_set(claims, '{org_id}', 'null');
  END IF;

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON public.app_users TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;

-- Replace older initialize_organization variants with one robust function.
DROP FUNCTION IF EXISTS public.initialize_organization(text, text);
DROP FUNCTION IF EXISTS public.initialize_organization(text, text, text, text);

CREATE OR REPLACE FUNCTION public.initialize_organization(
  org_name text,
  org_slug text,
  user_email text DEFAULT NULL,
  user_full_name text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_org_id uuid;
  v_admin_role_id uuid;
  v_app_user_id uuid;
  v_users_affected integer := 0;
  v_org_owner_type text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: no active session';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.app_users
    WHERE auth_user_id = v_user_id
      AND organization_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'User already belongs to an organization';
  END IF;

  SELECT id
  INTO v_admin_role_id
  FROM public.roles
  WHERE lower(name) = 'admin'
  ORDER BY is_system DESC NULLS LAST, created_at ASC NULLS LAST
  LIMIT 1;

  IF v_admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Admin role not found';
  END IF;

  SELECT c.udt_name
  INTO v_org_owner_type
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'organizations'
    AND c.column_name = 'owner_id'
  LIMIT 1;

  IF v_org_owner_type = 'uuid' THEN
    INSERT INTO public.organizations (name, slug, owner_id)
    VALUES (org_name, org_slug, v_user_id)
    RETURNING id INTO v_org_id;
  ELSIF v_org_owner_type IS NOT NULL THEN
    INSERT INTO public.organizations (name, slug, owner_id)
    VALUES (org_name, org_slug, v_user_id::text)
    RETURNING id INTO v_org_id;
  ELSE
    INSERT INTO public.organizations (name, slug)
    VALUES (org_name, org_slug)
    RETURNING id INTO v_org_id;
  END IF;

  SELECT id
  INTO v_app_user_id
  FROM public.app_users
  WHERE auth_user_id = v_user_id
     OR (
       user_email IS NOT NULL
       AND lower(email) = lower(user_email)
       AND organization_id IS NULL
     )
  ORDER BY CASE WHEN auth_user_id = v_user_id THEN 0 ELSE 1 END, created_at ASC NULLS LAST
  LIMIT 1
  FOR UPDATE;

  IF v_app_user_id IS NULL THEN
    INSERT INTO public.app_users (
      auth_user_id,
      email,
      name,
      organization_id,
      role_id,
      owner_id,
      updated_at
    )
    VALUES (
      v_user_id,
      user_email,
      COALESCE(user_full_name, split_part(COALESCE(user_email, ''), '@', 1), 'Admin'),
      v_org_id,
      v_admin_role_id,
      v_user_id::text,
      NOW()
    )
    RETURNING id INTO v_app_user_id;

    v_users_affected := 1;
  ELSE
    UPDATE public.app_users
    SET
      auth_user_id = v_user_id,
      email = COALESCE(user_email, email),
      name = COALESCE(user_full_name, name, split_part(COALESCE(user_email, ''), '@', 1), 'Admin'),
      organization_id = v_org_id,
      role_id = v_admin_role_id,
      owner_id = v_user_id::text,
      updated_at = NOW()
    WHERE id = v_app_user_id;

    GET DIAGNOSTICS v_users_affected = ROW_COUNT;
  END IF;

  IF v_users_affected < 1 THEN
    RAISE EXCEPTION 'Failed to link current user to the new organization';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'organization_id', v_org_id,
    'role_id', v_admin_role_id,
    'users_affected', v_users_affected
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.initialize_organization(text, text, text, text) TO authenticated;

COMMIT;

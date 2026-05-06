-- ============================================================
-- ONBOARDING FIX & SECURE RPC
-- Run this entire script in your Supabase SQL Editor
-- ============================================================

BEGIN;

-- 1. Fix app_users INSERT policy so new users can sign up
DROP POLICY IF EXISTS "app_users_insert_admin" ON public.app_users;
DROP POLICY IF EXISTS "app_users_insert_own_or_admin" ON public.app_users;

CREATE POLICY "app_users_insert_own_or_admin"
  ON public.app_users FOR INSERT
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

-- 2. Create the secure RPC for organization initialization
CREATE OR REPLACE FUNCTION public.initialize_organization(
  org_name TEXT,
  org_slug TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_admin_role_id UUID;
  v_result JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: No active session';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE auth_user_id = v_user_id AND organization_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'User already belongs to an organization';
  END IF;

  SELECT id INTO v_admin_role_id FROM public.roles WHERE name = 'Admin' LIMIT 1;
  IF v_admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Admin role not found in system';
  END IF;

  INSERT INTO public.organizations (name, slug)
  VALUES (org_name, org_slug)
  RETURNING id INTO v_org_id;

  UPDATE public.app_users
  SET 
    organization_id = v_org_id,
    role_id = v_admin_role_id,
    owner_id = v_user_id::text,
    updated_at = NOW()
  WHERE auth_user_id = v_user_id;

  v_result := jsonb_build_object(
    'success', true,
    'organization_id', v_org_id,
    'role_id', v_admin_role_id
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.initialize_organization TO authenticated;

-- 3. Tighten app_users UPDATE policy to prevent self-promotion
DROP POLICY IF EXISTS "app_users_update_own_or_admin" ON public.app_users;

CREATE POLICY "app_users_update_own_or_admin"
  ON public.app_users FOR UPDATE
  TO authenticated
  USING (
    auth_user_id = auth.uid()
    OR is_admin()
  )
  WITH CHECK (
    (NOT is_admin() AND (
      auth_user_id = auth.uid() AND
      (organization_id IS NOT DISTINCT FROM organization_id) AND
      (role_id IS NOT DISTINCT FROM role_id) AND
      (is_superadmin IS NOT DISTINCT FROM is_superadmin)
    ))
    OR is_admin()
  );

COMMIT;

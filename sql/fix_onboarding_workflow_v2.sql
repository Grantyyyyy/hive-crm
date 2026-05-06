-- ============================================================
-- ONBOARDING FIX & SECURE RPC (REFINED)
-- Run this entire script in your Supabase SQL Editor
-- ============================================================

BEGIN;

-- 1. Drop existing versions to avoid overloading conflicts
DROP FUNCTION IF EXISTS public.initialize_organization(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.initialize_organization(TEXT, TEXT, TEXT, TEXT);

-- 2. Ensure initialize_organization is robust and handles missing app_users records
CREATE OR REPLACE FUNCTION public.initialize_organization(
  org_name TEXT,
  org_slug TEXT,
  user_email TEXT DEFAULT NULL,
  user_full_name TEXT DEFAULT NULL
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
  v_row_count INT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: No active session';
  END IF;

  -- 1. Create the organization first
  INSERT INTO public.organizations (name, slug)
  VALUES (org_name, org_slug)
  RETURNING id INTO v_org_id;

  -- 2. Find the Admin role
  SELECT id INTO v_admin_role_id FROM public.roles WHERE name = 'Admin' LIMIT 1;
  IF v_admin_role_id IS NULL THEN
    -- Fallback: If no Admin role exists (rare), create a temporary one or fail
    -- For this system, we expect the default Admin role to exist from Phase 1.
    RAISE EXCEPTION 'Admin role not found in system. Please ensure migrations are complete.';
  END IF;

  -- DEBUG: Check if the user even exists in app_users before we start
  -- This will help identify if upsertCurrentUser already ran
  v_result := (SELECT jsonb_build_object(
    'existing_count', count(*),
    'matches_uuid', count(*) FILTER (WHERE auth_user_id = v_user_id),
    'matches_email', count(*) FILTER (WHERE email = user_email)
  ) FROM public.app_users);
  
  RAISE NOTICE 'Debug: User state before update: %', v_result;

  -- 3. Upsert the app_users record to ensure it exists and is linked
  -- We search by BOTH auth_user_id and email for maximum resilience
  IF EXISTS (SELECT 1 FROM public.app_users WHERE auth_user_id = v_user_id OR email = user_email) THEN
    UPDATE public.app_users
    SET 
      auth_user_id = v_user_id, -- Ensure the UUID is linked
      organization_id = v_org_id,
      role_id = v_admin_role_id,
      owner_id = v_user_id::text,
      updated_at = NOW()
    WHERE auth_user_id = v_user_id OR email = user_email;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
  ELSE
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
      COALESCE(user_full_name, 'New Admin'), 
      v_org_id, 
      v_admin_role_id, 
      v_user_id::text, 
      NOW()
    );
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
  END IF;

  -- 4. Double check that at least one user was updated/inserted
  IF v_row_count = 0 THEN
    RAISE EXCEPTION 'Failed to link user. No record found for ID % or Email %. Record may be blocked by RLS or missing.', v_user_id, user_email;
  END IF;

  v_result := jsonb_build_object(
    'success', true,
    'organization_id', v_org_id,
    'role_id', v_admin_role_id,
    'users_affected', v_row_count,
    'debug_info', v_result
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.initialize_organization TO authenticated;

COMMIT;

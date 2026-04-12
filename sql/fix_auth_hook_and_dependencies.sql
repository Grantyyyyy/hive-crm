-- ============================================================
-- Fix: Custom Access Token Hook Implementation
-- ============================================================
-- This script implements the exact signature required for the 
-- Supabase Custom Access Token (JWT) Hook.
-- ============================================================

BEGIN;

-- 1. Create the hook function with the CORRECT signature (event jsonb)
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
  -- Look up the organization_id for the user
  SELECT organization_id INTO user_org_id
  FROM public.app_users
  WHERE auth_user_id = (event->>'user_id')::uuid
  LIMIT 1;

  claims := event->'claims';

  -- If found, inject it into the JWT claims as 'org_id'
  IF user_org_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{org_id}', to_jsonb(user_org_id::text));
  ELSE
    claims := jsonb_set(claims, '{org_id}', 'null');
  END IF;

  -- Update the event object with the modified claims
  event := jsonb_set(event, '{claims}', claims);

  RETURN event;
END;
$$;

-- 2. Grant necessary permissions for the hook to run
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON public.app_users TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

-- 3. Diagnostic Queries (Run these to verify your data state)
-- ============================================================
-- QUERY A: Check if your user exists in app_users and has an org_id
-- ============================================================
-- SELECT id, email, auth_user_id, organization_id FROM public.app_users;

-- ============================================================
-- QUERY B: Check if that organization exists
-- ============================================================
-- SELECT id, name FROM public.organizations;

-- ============================================================
-- MANUAL STEP: 
-- You MUST sign out and sign back in for the hook to take effect.
-- Click "Sign out" in your app, then log in again.
-- ============================================================

COMMIT;

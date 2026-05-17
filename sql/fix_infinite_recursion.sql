-- ============================================================
-- EMERGENCY FIX: Resolves "stack depth limit exceeded" (Infinite Recursion)
-- ============================================================
-- The script from Claude created a function `auth_user_org_id()` that queries 
-- `app_users`. But since `app_users` also uses `auth_user_org_id()` in its 
-- RLS policies, this created an infinite loop.
--
-- By adding `SECURITY DEFINER`, the function runs with elevated privileges 
-- and bypasses RLS when reading `app_users`, completely breaking the infinite loop.
-- ============================================================

CREATE OR REPLACE FUNCTION auth_user_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER -- <== THIS IS THE MAGIC FIX
SET search_path = public
AS $$
  SELECT organization_id
  FROM app_users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- ============================================================
-- Multi-Org Phase 0: Membership foundation
-- ============================================================
-- Turns app_users into a true membership table (one row per
-- person-per-org) and introduces user_profiles to hold the
-- canonical per-person profile + the "active organization".
--
-- Safe / reversible:
--   * Index swap (single-org -> composite) is reversible.
--   * user_profiles is additive; backfill is idempotent.
-- ============================================================

BEGIN;

-- 1. Remove the constraint that forces ONE org per person.
DROP INDEX IF EXISTS public.idx_app_users_auth_user_id;

-- 2. Enforce "one membership per (person, org)" instead.
--    Partial: ignores legacy rows lacking an auth link or org.
CREATE UNIQUE INDEX IF NOT EXISTS uq_app_users_auth_org
  ON public.app_users (auth_user_id, organization_id)
  WHERE auth_user_id IS NOT NULL AND organization_id IS NOT NULL;

-- 3. Keep a (non-unique) lookup index by auth_user_id.
CREATE INDEX IF NOT EXISTS idx_app_users_auth_user_id
  ON public.app_users (auth_user_id);

-- 4. Canonical per-person profile + active org pointer.
CREATE TABLE IF NOT EXISTS public.user_profiles (
  auth_user_id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  active_organization_id  uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  name                    text,
  brand_color             text NOT NULL DEFAULT 'teal',
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_profiles_brand_color_check
    CHECK (brand_color = ANY (ARRAY[
      'teal','emerald','sky','blue','indigo','violet','rose','red','orange','amber'
    ]))
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_active_org
  ON public.user_profiles (active_organization_id);

-- 5. Backfill one profile per person; active org = their current membership.
INSERT INTO public.user_profiles (auth_user_id, active_organization_id, name, brand_color)
SELECT DISTINCT ON (au.auth_user_id)
  au.auth_user_id,
  au.organization_id,
  au.name,
  au.brand_color
FROM public.app_users au
WHERE au.auth_user_id IS NOT NULL
ORDER BY au.auth_user_id, au.created_at ASC
ON CONFLICT (auth_user_id) DO NOTHING;

-- 6. RLS: a person can see/manage only their own profile row.
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_profiles_select_own ON public.user_profiles;
CREATE POLICY user_profiles_select_own ON public.user_profiles
  FOR SELECT TO authenticated USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS user_profiles_insert_own ON public.user_profiles;
CREATE POLICY user_profiles_insert_own ON public.user_profiles
  FOR INSERT TO authenticated WITH CHECK (auth_user_id = auth.uid());

DROP POLICY IF EXISTS user_profiles_update_own ON public.user_profiles;
CREATE POLICY user_profiles_update_own ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- 7. updated_at touch trigger (dedicated name to avoid collisions).
CREATE OR REPLACE FUNCTION public.tg_user_profiles_touch()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_user_profiles_touch();

COMMIT;

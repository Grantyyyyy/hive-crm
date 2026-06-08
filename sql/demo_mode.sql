-- ============================================================
-- Demo Mode: per-visitor isolated sandbox organizations
-- ============================================================
-- A visitor clicks "Try Demo" -> anonymous sign-in -> calls
-- create_demo_workspace() which spins up a fresh org flagged
-- is_demo, seeds sample CRM data, and makes them its Admin.
-- A scheduled cleanup removes demo orgs (+ anon users) after 24h.
-- ============================================================

BEGIN;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_organizations_is_demo
  ON public.organizations (is_demo, created_at);

-- ── Create + seed a private demo workspace for the caller ─────
CREATE OR REPLACE FUNCTION public.create_demo_workspace()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_uid_t text;
  v_org uuid;
  v_admin_role uuid;
  v_existing uuid;
  c1 uuid; c2 uuid; c3 uuid; c4 uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: sign in first';
  END IF;
  v_uid_t := v_uid::text;

  -- Idempotent: if the caller already has a workspace, return it.
  SELECT organization_id INTO v_existing
  FROM public.app_users WHERE auth_user_id = v_uid AND organization_id IS NOT NULL
  LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'organization_id', v_existing, 'existing', true);
  END IF;

  SELECT id INTO v_admin_role
  FROM public.roles WHERE lower(name) = 'admin'
  ORDER BY is_system DESC NULLS LAST, created_at ASC NULLS LAST LIMIT 1;
  IF v_admin_role IS NULL THEN
    RAISE EXCEPTION 'Admin role not found';
  END IF;

  -- 'elite' plan + an active trial window so every feature is unlocked in the demo
  -- (usePlan unlocks pro-tier features while trial_ends_at is in the future).
  INSERT INTO public.organizations (name, slug, plan, seats_limit, trial_ends_at, is_demo, created_by)
  VALUES ('Demo Workspace',
          'demo-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
          'elite', 999, now() + interval '30 days', true, v_uid)
  RETURNING id INTO v_org;

  INSERT INTO public.app_users (auth_user_id, email, name, organization_id, role_id, owner_id, is_superadmin, updated_at)
  VALUES (v_uid, 'demo@demo.local', 'Demo User', v_org, v_admin_role, v_uid_t, false, now());

  INSERT INTO public.user_profiles (auth_user_id, active_organization_id, name)
  VALUES (v_uid, v_org, 'Demo User')
  ON CONFLICT (auth_user_id) DO UPDATE SET active_organization_id = v_org, updated_at = now();

  -- ── Seed sample data (core CRM modules) ──────────────────
  INSERT INTO public.contacts (user_id, name, email, source, organization_id)
  VALUES (v_uid_t, 'Sarah Chen', 'sarah.chen@acme.io', 'referral', v_org) RETURNING id INTO c1;
  INSERT INTO public.contacts (user_id, name, email, source, organization_id)
  VALUES (v_uid_t, 'Marcus Reyes', 'marcus@globex.com', 'ad', v_org) RETURNING id INTO c2;
  INSERT INTO public.contacts (user_id, name, email, source, organization_id)
  VALUES (v_uid_t, 'Elena Park', 'elena.park@initech.com', 'manual', v_org) RETURNING id INTO c3;
  INSERT INTO public.contacts (user_id, name, email, source, organization_id)
  VALUES (v_uid_t, 'David Okafor', 'david@northwind.co', 'referral', v_org) RETURNING id INTO c4;

  INSERT INTO public.leads (user_id, name, email, source, status, organization_id) VALUES
    (v_uid_t, 'Priya Nair', 'priya@stark.io', 'website', 'new', v_org),
    (v_uid_t, 'Tom Becker', 'tom.becker@wayne.com', 'referral', 'contacted', v_org),
    (v_uid_t, 'Aiko Tanaka', 'aiko@hooli.com', 'manual', 'qualified', v_org),
    (v_uid_t, 'Liam Murphy', 'liam@umbrella.co', 'website', 'new', v_org);

  INSERT INTO public.deals (user_id, title, value, stage, contact_id, organization_id) VALUES
    (v_uid_t, 'Acme — Annual License', 24000, 'negotiation', c1, v_org),
    (v_uid_t, 'Globex Expansion', 56000, 'discovery', c2, v_org),
    (v_uid_t, 'Initech Renewal', 12000, 'proposal', c3, v_org),
    (v_uid_t, 'Northwind Onboarding', 8500, 'won', c4, v_org),
    (v_uid_t, 'Stark Pilot', 4000, 'lost', c1, v_org);

  INSERT INTO public.tasks (user_id, title, due_date, priority, status, created_by, organization_id) VALUES
    (v_uid_t, 'Follow up with Sarah Chen', now() + interval '2 days', 'high', 'open', v_uid_t, v_org),
    (v_uid_t, 'Prepare proposal for Globex', now() + interval '1 day', 'high', 'in-progress', v_uid_t, v_org),
    (v_uid_t, 'Send Initech renewal contract', now() - interval '1 day', 'urgent', 'open', v_uid_t, v_org),
    (v_uid_t, 'Schedule demo with Stark', now() + interval '3 days', 'medium', 'open', v_uid_t, v_org),
    (v_uid_t, 'Quarterly pipeline review', now() + interval '7 days', 'low', 'completed', v_uid_t, v_org);

  INSERT INTO public.activities (user_id, type, content, contact_id, organization_id) VALUES
    (v_uid_t, 'meeting', 'Ran a 45-min product demo — strong interest in automation.', c1, v_org),
    (v_uid_t, 'email', 'Sent pricing breakdown and case studies.', c2, v_org),
    (v_uid_t, 'note', 'Decision expected after their next board meeting.', c3, v_org),
    (v_uid_t, 'meeting', 'Kickoff call completed; onboarding scheduled.', c4, v_org);

  RETURN jsonb_build_object('success', true, 'organization_id', v_org, 'existing', false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_demo_workspace() TO anon, authenticated;

-- ── Cleanup: remove demo orgs (+ anon users) older than 24h ──
CREATE OR REPLACE FUNCTION public.cleanup_demo_workspaces(p_age interval DEFAULT interval '24 hours')
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_org_ids uuid[];
  v_uids uuid[];
  r record;
  v_count integer := 0;
BEGIN
  SELECT array_agg(id) INTO v_org_ids
  FROM public.organizations
  WHERE is_demo = true AND created_at < now() - p_age;

  IF v_org_ids IS NOT NULL THEN
    SELECT array_agg(DISTINCT auth_user_id) INTO v_uids
    FROM public.app_users
    WHERE organization_id = ANY(v_org_ids) AND auth_user_id IS NOT NULL;

    -- Bypass FK ordering / triggers for a clean bulk delete (definer = superuser).
    SET session_replication_role = replica;

    FOR r IN
      SELECT table_name FROM information_schema.columns
      WHERE table_schema = 'public' AND column_name = 'organization_id'
        AND table_name <> 'organizations'
    LOOP
      EXECUTE format('DELETE FROM public.%I WHERE organization_id = ANY($1)', r.table_name)
      USING v_org_ids;
    END LOOP;

    IF v_uids IS NOT NULL THEN
      DELETE FROM public.user_profiles WHERE auth_user_id = ANY(v_uids);
    END IF;

    DELETE FROM public.organizations WHERE id = ANY(v_org_ids);

    -- Remove the anonymous accounts that were demo-only.
    IF v_uids IS NOT NULL THEN
      DELETE FROM auth.users
      WHERE id = ANY(v_uids) AND is_anonymous = true;
    END IF;

    SET session_replication_role = origin;
    v_count := array_length(v_org_ids, 1);
  END IF;

  -- Always sweep up stray anonymous accounts with no workspace (abandoned demo
  -- starts; Supabase does not auto-clean anonymous users).
  DELETE FROM auth.users au
  WHERE au.is_anonymous = true
    AND au.created_at < now() - p_age
    AND NOT EXISTS (
      SELECT 1 FROM public.app_users m WHERE m.auth_user_id = au.id
    );

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_demo_workspaces(interval) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_demo_workspaces(interval) TO service_role;

COMMIT;

-- Run cleanup hourly (pg_cron). Run separately from the transaction above.
-- SELECT cron.schedule('cleanup-demo-workspaces', '23 * * * *', 'SELECT public.cleanup_demo_workspaces()');

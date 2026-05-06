-- ============================================================
-- pg_cron schedule for the run-scheduled-jobs Edge Function
-- ============================================================
-- Replace the placeholders before running this in Supabase SQL Editor:
--   <PROJECT_REF>              your Supabase project ref
--   <SCHEDULED_JOBS_SECRET>    same value configured as the Edge Function secret
--
-- The Edge Function performs its own secret-header check, so deploy it with
-- JWT verification disabled or configure the cron request to include a valid
-- Authorization header as well.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('run-scheduled-jobs-every-minute')
WHERE EXISTS (
  SELECT 1
  FROM cron.job
  WHERE jobname = 'run-scheduled-jobs-every-minute'
);

SELECT cron.schedule(
  'run-scheduled-jobs-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ecokyjxnudfzklhcqecn.functions.supabase.co/run-scheduled-jobs',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-scheduled-jobs-secret', 'secure-scheduled-jobs-key-2026'
    ),
    body := jsonb_build_object('source', 'pg_cron'),
    timeout_milliseconds := 30000
  );
  $$
);

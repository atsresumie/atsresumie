-- ==========================================================
-- Migration: 010_cron_schedules.sql
-- pg_cron + pg_net schedules for latex and PDF workers
--
-- PREREQUISITES:
--   1. Enable pg_cron   in Dashboard → Database → Extensions
--   2. Enable pg_net    in Dashboard → Database → Extensions
--   3. Create Vault secrets:
--      SELECT vault.create_secret('<YOUR_PROJECT_URL>',  'project_url');
--      SELECT vault.create_secret('<YOUR_SERVICE_ROLE_KEY>', 'service_role_key');
-- ==========================================================

-- 1) LaTeX worker pump — every 20 seconds
SELECT cron.schedule(
  'latex-pump',
  '20 seconds',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/worker-generate-latex',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key'),
      'apikey', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body := '{"batchSize": 2}'::jsonb
  );
  $$
);

-- 2) PDF worker pump — every 45 seconds
SELECT cron.schedule(
  'pdf-pump',
  '45 seconds',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/worker-generate-pdf',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key'),
      'apikey', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body := '{"batchSize": 3}'::jsonb
  );
  $$
);

-- 3) Stale lock recovery — every 5 minutes
-- Resets jobs stuck in 'processing' for > 10 min back to 'queued'
SELECT cron.schedule(
  'stale-lock-recovery',
  '*/5 * * * *',
  $$
  UPDATE public.generation_jobs
  SET
    status = 'queued',
    progress_stage = 'queued',
    locked_at = NULL,
    lock_id = NULL,
    last_error = 'Lock expired (scheduled recovery)',
    updated_at = NOW()
  WHERE status = 'processing'
    AND locked_at < NOW() - INTERVAL '10 minutes'
    AND attempt_count < 3;
  $$
);

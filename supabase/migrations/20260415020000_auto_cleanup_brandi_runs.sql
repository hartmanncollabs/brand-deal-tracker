-- Auto-cleanup old Brandi runs (keep last 30 days)
-- Uses pg_cron to run daily at midnight UTC

-- Enable pg_cron if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron SCHEMA extensions;

-- Schedule daily cleanup at midnight UTC
SELECT cron.schedule(
  'cleanup-brandi-runs',
  '0 0 * * *',
  $$DELETE FROM public.brandi_runs WHERE created_at < NOW() - INTERVAL '30 days'$$
);

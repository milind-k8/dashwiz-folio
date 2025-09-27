-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the email sync to run every hour
SELECT cron.schedule(
  'hourly-email-sync',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
        url:='https://yudnrvzjeqtyldrpbunw.supabase.co/functions/v1/scheduled-email-sync',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1ZG5ydnpqZXF0eWxkcnBidW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI2MjU1MjQsImV4cCI6MjA0ODIwMTUyNH0.uLptBRqd_RAQkYEzKGqPGbbKFdJ5huf5NjpT5N7DSzE"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);
-- ==========================================================
-- Enable Supabase Realtime for Dashboard Tables
-- Run in Supabase SQL Editor (Dashboard > SQL Editor)
-- ==========================================================

-- Enable Realtime for generation_jobs (job status updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.generation_jobs;

-- Enable Realtime for user_profiles (credit balance updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_profiles;

-- Set REPLICA IDENTITY to FULL for proper change tracking
-- This ensures all columns are available in realtime payloads
ALTER TABLE public.generation_jobs REPLICA IDENTITY FULL;
ALTER TABLE public.user_profiles REPLICA IDENTITY FULL;

-- Verify tables are in publication
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Add progress column to generation_jobs table
-- Fixes PGRST204 error in Edge Functions

ALTER TABLE public.generation_jobs 
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- ==========================================================
-- Queue-Based Resume Generation System Migration
-- Run in Supabase SQL Editor
-- ==========================================================

-- 1) Ensure pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2) Add new columns for queue system (idempotent)
DO $$
BEGIN
  -- progress_stage: granular step tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'generation_jobs' AND column_name = 'progress_stage') THEN
    ALTER TABLE public.generation_jobs ADD COLUMN progress_stage TEXT;
  END IF;
  
  -- resume_text: store extracted text for worker
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'generation_jobs' AND column_name = 'resume_text') THEN
    ALTER TABLE public.generation_jobs ADD COLUMN resume_text TEXT;
  END IF;
  
  -- mode: generation mode for audit
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'generation_jobs' AND column_name = 'mode') THEN
    ALTER TABLE public.generation_jobs ADD COLUMN mode TEXT;
  END IF;
  
  -- attempt_count: retry tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'generation_jobs' AND column_name = 'attempt_count') THEN
    ALTER TABLE public.generation_jobs ADD COLUMN attempt_count INT NOT NULL DEFAULT 0;
  END IF;
  
  -- locked_at: when job was claimed
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'generation_jobs' AND column_name = 'locked_at') THEN
    ALTER TABLE public.generation_jobs ADD COLUMN locked_at TIMESTAMPTZ;
  END IF;
  
  -- lock_id: unique claim identifier
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'generation_jobs' AND column_name = 'lock_id') THEN
    ALTER TABLE public.generation_jobs ADD COLUMN lock_id TEXT;
  END IF;
END $$;

-- 3) Normalize existing statuses before constraint change
UPDATE public.generation_jobs SET status = 'queued' WHERE status = 'pending';
UPDATE public.generation_jobs SET status = 'processing' WHERE status = 'running';

-- 4) Update status constraint (drop old, add new)
ALTER TABLE public.generation_jobs DROP CONSTRAINT IF EXISTS generation_jobs_status_check;
ALTER TABLE public.generation_jobs 
  ADD CONSTRAINT generation_jobs_status_check 
  CHECK (status IN ('queued', 'processing', 'succeeded', 'failed'));

-- 5) Add index for queue ordering
CREATE INDEX IF NOT EXISTS idx_generation_jobs_queue 
  ON public.generation_jobs(status, created_at) 
  WHERE status = 'queued';

-- ==========================================================
-- CLAIM FUNCTIONS (FOR UPDATE SKIP LOCKED)
-- ==========================================================

-- 6) Claim next queued job (FIFO)
CREATE OR REPLACE FUNCTION public.claim_next_generation_job()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  jd_text TEXT,
  resume_text TEXT,
  resume_object_path TEXT,
  focus_prompt TEXT,
  mode TEXT,
  status TEXT,
  progress_stage TEXT,
  lock_id TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  claimed_id UUID;
  new_lock_id TEXT;
BEGIN
  new_lock_id := gen_random_uuid()::text;
  
  -- Atomically claim one queued job
  UPDATE public.generation_jobs g
  SET 
    status = 'processing',
    progress_stage = 'starting',
    started_at = NOW(),
    updated_at = NOW(),
    attempt_count = g.attempt_count + 1,
    locked_at = NOW(),
    lock_id = new_lock_id
  WHERE g.id = (
    SELECT gj.id FROM public.generation_jobs gj
    WHERE gj.status = 'queued'
    ORDER BY gj.created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING g.id INTO claimed_id;
  
  -- Return claimed job or empty
  IF claimed_id IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      g.id, g.user_id, g.jd_text, g.resume_text, g.resume_object_path,
      g.focus_prompt, g.mode, g.status, g.progress_stage, g.lock_id
    FROM public.generation_jobs g
    WHERE g.id = claimed_id;
  END IF;
END;
$$;

-- 7) Claim specific job by ID
CREATE OR REPLACE FUNCTION public.claim_generation_job(p_job_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  jd_text TEXT,
  resume_text TEXT,
  resume_object_path TEXT,
  focus_prompt TEXT,
  mode TEXT,
  status TEXT,
  progress_stage TEXT,
  lock_id TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_lock_id TEXT;
  claimed_id UUID;
BEGIN
  new_lock_id := gen_random_uuid()::text;
  
  -- Atomically claim if still queued
  UPDATE public.generation_jobs g
  SET 
    status = 'processing',
    progress_stage = 'starting',
    started_at = NOW(),
    updated_at = NOW(),
    attempt_count = g.attempt_count + 1,
    locked_at = NOW(),
    lock_id = new_lock_id
  WHERE g.id = p_job_id
    AND g.status = 'queued'
  RETURNING g.id INTO claimed_id;
  
  IF claimed_id IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      g.id, g.user_id, g.jd_text, g.resume_text, g.resume_object_path,
      g.focus_prompt, g.mode, g.status, g.progress_stage, g.lock_id
    FROM public.generation_jobs g
    WHERE g.id = claimed_id;
  END IF;
END;
$$;

-- 8) Update job progress stage
CREATE OR REPLACE FUNCTION public.update_job_progress(
  p_job_id UUID,
  p_progress_stage TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.generation_jobs
  SET 
    progress_stage = p_progress_stage,
    updated_at = NOW()
  WHERE id = p_job_id;
END;
$$;

-- 9) Complete job (success or failure)
CREATE OR REPLACE FUNCTION public.complete_job(
  p_job_id UUID,
  p_status TEXT,
  p_latex_text TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.generation_jobs
  SET 
    status = p_status,
    progress_stage = CASE WHEN p_status = 'succeeded' THEN 'done' ELSE 'failed' END,
    latex_text = COALESCE(p_latex_text, latex_text),
    error_message = COALESCE(p_error_message, error_message),
    updated_at = NOW(),
    completed_at = NOW()
  WHERE id = p_job_id;
END;
$$;

-- 10) Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- 11) Enable Realtime for generation_jobs (run in Dashboard if this fails)
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.generation_jobs;

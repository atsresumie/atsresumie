-- ==========================================================
-- Migration: 009_pipeline_split.sql
-- Adds columns and RPCs for the 3-function generation pipeline
-- ==========================================================

-- 1) Add new columns (idempotent)
DO $$
BEGIN
  -- Backoff scheduling for latex retries
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'generation_jobs' AND column_name = 'next_attempt_at') THEN
    ALTER TABLE public.generation_jobs ADD COLUMN next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;

  -- Last error for retry diagnostics
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'generation_jobs' AND column_name = 'last_error') THEN
    ALTER TABLE public.generation_jobs ADD COLUMN last_error TEXT;
  END IF;

  -- PDF pipeline state
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'generation_jobs' AND column_name = 'pdf_status') THEN
    ALTER TABLE public.generation_jobs ADD COLUMN pdf_status TEXT NOT NULL DEFAULT 'none';
  END IF;

  -- PDF retry counter
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'generation_jobs' AND column_name = 'pdf_attempt_count') THEN
    ALTER TABLE public.generation_jobs ADD COLUMN pdf_attempt_count INT NOT NULL DEFAULT 0;
  END IF;

  -- PDF backoff scheduling
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'generation_jobs' AND column_name = 'pdf_next_attempt_at') THEN
    ALTER TABLE public.generation_jobs ADD COLUMN pdf_next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;

  -- PDF last error
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'generation_jobs' AND column_name = 'pdf_last_error') THEN
    ALTER TABLE public.generation_jobs ADD COLUMN pdf_last_error TEXT;
  END IF;

  -- Idempotent credit deduction guard
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'generation_jobs' AND column_name = 'credit_deducted_at') THEN
    ALTER TABLE public.generation_jobs ADD COLUMN credit_deducted_at TIMESTAMPTZ;
  END IF;

  -- pdf_object_path (may already exist from earlier work)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'generation_jobs' AND column_name = 'pdf_object_path') THEN
    ALTER TABLE public.generation_jobs ADD COLUMN pdf_object_path TEXT;
  END IF;
END $$;

-- 2) Add constraint for pdf_status values
ALTER TABLE public.generation_jobs DROP CONSTRAINT IF EXISTS generation_jobs_pdf_status_check;
ALTER TABLE public.generation_jobs
  ADD CONSTRAINT generation_jobs_pdf_status_check
  CHECK (pdf_status IN ('none', 'queued', 'processing', 'ready', 'failed'));

-- 3) Index for latex worker queue (next_attempt_at ordering)
CREATE INDEX IF NOT EXISTS idx_generation_jobs_latex_queue
  ON public.generation_jobs(next_attempt_at ASC)
  WHERE status = 'queued';

-- 4) Index for PDF worker queue
CREATE INDEX IF NOT EXISTS idx_generation_jobs_pdf_queue
  ON public.generation_jobs(pdf_next_attempt_at ASC)
  WHERE status = 'succeeded' AND pdf_status IN ('queued', 'failed') AND pdf_object_path IS NULL;

-- ==========================================================
-- UPDATED RPCs
-- ==========================================================

-- 5) claim_next_generation_job — with backoff + stale lock recovery
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

  -- First: recover stale locks (processing > 10 min with no progress)
  UPDATE public.generation_jobs g
  SET
    status = 'queued',
    progress_stage = 'queued',
    locked_at = NULL,
    lock_id = NULL,
    updated_at = NOW(),
    last_error = 'Lock expired (stale recovery)'
  WHERE g.status = 'processing'
    AND g.locked_at < NOW() - INTERVAL '10 minutes'
    AND g.attempt_count < 3;

  -- Atomically claim one eligible queued job
  UPDATE public.generation_jobs g
  SET
    status = 'processing',
    progress_stage = 'starting',
    started_at = COALESCE(g.started_at, NOW()),
    updated_at = NOW(),
    attempt_count = g.attempt_count + 1,
    locked_at = NOW(),
    lock_id = new_lock_id
  WHERE g.id = (
    SELECT gj.id FROM public.generation_jobs gj
    WHERE gj.status = 'queued'
      AND gj.next_attempt_at <= NOW()
      AND gj.attempt_count < 3
    ORDER BY gj.created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
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

-- 6) claim_generation_job — claim by specific ID (with backoff check)
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

  UPDATE public.generation_jobs g
  SET
    status = 'processing',
    progress_stage = 'starting',
    started_at = COALESCE(g.started_at, NOW()),
    updated_at = NOW(),
    attempt_count = g.attempt_count + 1,
    locked_at = NOW(),
    lock_id = new_lock_id
  WHERE g.id = p_job_id
    AND g.status = 'queued'
    AND g.attempt_count < 3
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

-- 7) complete_job — auto-set pdf_status='queued' on success
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
    last_error = CASE WHEN p_status = 'failed' THEN COALESCE(p_error_message, last_error) ELSE last_error END,
    pdf_status = CASE WHEN p_status = 'succeeded' THEN 'queued' ELSE pdf_status END,
    updated_at = NOW(),
    completed_at = NOW()
  WHERE id = p_job_id;
END;
$$;

-- 8) claim_next_pdf_job — for PDF worker
CREATE OR REPLACE FUNCTION public.claim_next_pdf_job()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  latex_text TEXT,
  pdf_status TEXT,
  pdf_attempt_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  claimed_id UUID;
BEGIN
  UPDATE public.generation_jobs g
  SET
    pdf_status = 'processing',
    pdf_attempt_count = g.pdf_attempt_count + 1,
    updated_at = NOW()
  WHERE g.id = (
    SELECT gj.id FROM public.generation_jobs gj
    WHERE gj.status = 'succeeded'
      AND gj.latex_text IS NOT NULL
      AND gj.pdf_object_path IS NULL
      AND gj.pdf_status IN ('queued', 'failed')
      AND gj.pdf_next_attempt_at <= NOW()
      AND gj.pdf_attempt_count < 3
    ORDER BY gj.created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING g.id INTO claimed_id;

  IF claimed_id IS NOT NULL THEN
    RETURN QUERY
    SELECT g.id, g.user_id, g.latex_text, g.pdf_status, g.pdf_attempt_count
    FROM public.generation_jobs g
    WHERE g.id = claimed_id;
  END IF;
END;
$$;

-- 9) deduct_credit_once — idempotent credit deduction
CREATE OR REPLACE FUNCTION public.deduct_credit_once(
  p_job_id UUID,
  p_user_id UUID
)
RETURNS TEXT  -- 'deducted' | 'already_deducted' | 'insufficient'
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  already_done TIMESTAMPTZ;
  new_balance INTEGER;
BEGIN
  -- Check if already deducted
  SELECT credit_deducted_at INTO already_done
  FROM public.generation_jobs
  WHERE id = p_job_id;

  IF already_done IS NOT NULL THEN
    RETURN 'already_deducted';
  END IF;

  -- Ensure user has profile
  INSERT INTO public.user_profiles (id, credits)
  VALUES (p_user_id, 0)
  ON CONFLICT (id) DO NOTHING;

  -- Atomic deduct
  UPDATE public.user_profiles
  SET credits = credits - 1, updated_at = NOW()
  WHERE id = p_user_id AND credits >= 1
  RETURNING credits INTO new_balance;

  IF NOT FOUND THEN
    RETURN 'insufficient';
  END IF;

  -- Mark as deducted
  UPDATE public.generation_jobs
  SET credit_deducted_at = NOW(), updated_at = NOW()
  WHERE id = p_job_id AND credit_deducted_at IS NULL;

  RETURN 'deducted';
END;
$$;

-- 10) Refresh schema cache
NOTIFY pgrst, 'reload schema';

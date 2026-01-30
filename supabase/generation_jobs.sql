-- =========================
-- ATSResumie: Generation Jobs SQL
-- Matches app/api/generate/route.ts implementation
-- Run in Supabase SQL Editor
-- =========================

-- Drop existing table to start fresh (remove if you want to keep data)
DROP TABLE IF EXISTS public.generation_jobs CASCADE;

-- 1) Create generation_jobs table
CREATE TABLE public.generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Optional: retry grouping in future
  parent_job_id UUID REFERENCES public.generation_jobs(id),

  -- Inputs (from POST /api/generate body)
  jd_text TEXT NOT NULL,
  resume_object_path TEXT,
  focus_prompt TEXT,

  -- State
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'succeeded', 'failed')),
  error_message TEXT,
  progress INTEGER DEFAULT 0,

  -- Outputs
  latex_text TEXT,
  pdf_url TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- 2) Enable RLS
ALTER TABLE public.generation_jobs ENABLE ROW LEVEL SECURITY;

-- 3) RLS: Users can SELECT their own jobs
CREATE POLICY "Users can read own jobs" ON public.generation_jobs
  FOR SELECT USING (auth.uid() = user_id);

-- 4) RLS: Users can INSERT their own jobs
CREATE POLICY "Users can create own jobs" ON public.generation_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- NO UPDATE policy - all updates via RPC

-- 5) Indexes
CREATE INDEX idx_generation_jobs_user_id ON public.generation_jobs(user_id);
CREATE INDEX idx_generation_jobs_status ON public.generation_jobs(status);
CREATE INDEX idx_generation_jobs_created_at ON public.generation_jobs(created_at DESC);

-- 6) Server-controlled update RPC (called by supabaseAdmin in processJob)
CREATE OR REPLACE FUNCTION public.update_job_status(
  p_job_id UUID,
  p_status TEXT,
  p_latex_text TEXT DEFAULT NULL,
  p_pdf_url TEXT DEFAULT NULL,
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
    latex_text = COALESCE(p_latex_text, latex_text),
    pdf_url = COALESCE(p_pdf_url, pdf_url),
    error_message = COALESCE(p_error_message, error_message),
    updated_at = NOW(),
    started_at = CASE WHEN p_status = 'running' AND started_at IS NULL THEN NOW() ELSE started_at END,
    completed_at = CASE WHEN p_status IN ('succeeded', 'failed') AND completed_at IS NULL THEN NOW() ELSE completed_at END
  WHERE id = p_job_id;
END;
$$;

-- 7) Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- 8) Admin-callable credit adjustment (for service role - takes user_id explicitly)
CREATE OR REPLACE FUNCTION public.adjust_credits_for_user(
  p_user_id UUID,
  p_delta INTEGER,
  p_reason TEXT DEFAULT 'manual',
  p_source TEXT DEFAULT 'system'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  -- Ensure user has profile (auto-create with 0 if missing)
  INSERT INTO public.user_profiles (id, credits)
  VALUES (p_user_id, 0)
  ON CONFLICT (id) DO NOTHING;

  -- Atomic update with check for negative
  UPDATE public.user_profiles
  SET 
    credits = credits + p_delta,
    updated_at = NOW()
  WHERE id = p_user_id
    AND credits + p_delta >= 0
  RETURNING credits INTO new_balance;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
  
  RETURN new_balance;
END;
$$;

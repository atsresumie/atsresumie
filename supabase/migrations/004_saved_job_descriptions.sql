-- =========================
-- ATSResumie: Saved Job Descriptions
-- Migration: 004_saved_job_descriptions.sql
-- Run in Supabase SQL Editor
-- =========================

-- 1) Create saved_job_descriptions table
CREATE TABLE IF NOT EXISTS public.saved_job_descriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Core fields
  label TEXT NOT NULL,
  company TEXT,
  source_url TEXT,
  jd_text TEXT NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) Enable RLS
ALTER TABLE public.saved_job_descriptions ENABLE ROW LEVEL SECURITY;

-- 3) RLS Policies: Users can only access their own saved JDs

-- SELECT: Users can read their own saved JDs
CREATE POLICY "Users can read own saved JDs"
  ON public.saved_job_descriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Users can create their own saved JDs
CREATE POLICY "Users can create own saved JDs"
  ON public.saved_job_descriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own saved JDs
CREATE POLICY "Users can update own saved JDs"
  ON public.saved_job_descriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own saved JDs
CREATE POLICY "Users can delete own saved JDs"
  ON public.saved_job_descriptions
  FOR DELETE
  USING (auth.uid() = user_id);

-- 4) Indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_jds_user_id 
  ON public.saved_job_descriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_jds_updated_at 
  ON public.saved_job_descriptions(updated_at DESC);

-- 5) Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_saved_jd_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS saved_jd_updated_at_trigger ON public.saved_job_descriptions;
CREATE TRIGGER saved_jd_updated_at_trigger
  BEFORE UPDATE ON public.saved_job_descriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_saved_jd_updated_at();

-- 6) Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.saved_job_descriptions;

-- 7) Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- =========================
-- ATSResumie: Resume Versions
-- Migration: 005_resume_versions.sql
-- Run in Supabase SQL Editor
-- =========================

-- 1) Create resume_versions table
CREATE TABLE IF NOT EXISTS public.resume_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Core fields
  label TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT, -- pdf, docx, txt
  object_path TEXT NOT NULL,
  resume_text TEXT, -- extracted text for AI processing
  is_default BOOLEAN NOT NULL DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) Enable RLS
ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;

-- 3) RLS Policies: Users can only access their own resume versions

-- SELECT: Users can read their own resume versions
CREATE POLICY "Users can read own resume versions"
  ON public.resume_versions
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Users can create their own resume versions
CREATE POLICY "Users can create own resume versions"
  ON public.resume_versions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own resume versions
CREATE POLICY "Users can update own resume versions"
  ON public.resume_versions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own resume versions
CREATE POLICY "Users can delete own resume versions"
  ON public.resume_versions
  FOR DELETE
  USING (auth.uid() = user_id);

-- 4) Indexes for performance
CREATE INDEX IF NOT EXISTS idx_resume_versions_user_id 
  ON public.resume_versions(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_versions_user_default 
  ON public.resume_versions(user_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_resume_versions_created_at 
  ON public.resume_versions(created_at DESC);

-- 5) Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_resume_version_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS resume_version_updated_at_trigger ON public.resume_versions;
CREATE TRIGGER resume_version_updated_at_trigger
  BEFORE UPDATE ON public.resume_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_resume_version_updated_at();

-- 6) Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.resume_versions;

-- 7) Refresh schema cache
NOTIFY pgrst, 'reload schema';

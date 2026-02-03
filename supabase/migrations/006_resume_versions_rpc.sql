-- =========================
-- ATSResumie: Resume Versions RPC Functions
-- Migration: 006_resume_versions_rpc.sql
-- Run in Supabase SQL Editor AFTER 005_resume_versions.sql
-- =========================

-- 1) Atomic function to set a resume as default
-- Ensures exactly one default per user via transaction
CREATE OR REPLACE FUNCTION public.set_default_resume(p_resume_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_owner_id UUID;
BEGIN
  -- Get the current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check that the resume exists and belongs to the current user
  SELECT user_id INTO v_owner_id
  FROM public.resume_versions
  WHERE id = p_resume_id;
  
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Resume not found';
  END IF;
  
  IF v_owner_id != v_user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Atomically: unset all defaults for this user, then set the target
  UPDATE public.resume_versions
  SET is_default = false, updated_at = NOW()
  WHERE user_id = v_user_id AND is_default = true;
  
  UPDATE public.resume_versions
  SET is_default = true, updated_at = NOW()
  WHERE id = p_resume_id;
  
  RETURN true;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.set_default_resume(UUID) TO authenticated;

-- 2) Refresh schema cache
NOTIFY pgrst, 'reload schema';

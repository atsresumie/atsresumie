-- =========================
-- ATSResumie: User Profile Fields
-- Migration: 007_user_profile_fields.sql
-- Run in Supabase SQL Editor
-- =========================

-- 1) Add profile and settings columns to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS role_title TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS industries TEXT,
ADD COLUMN IF NOT EXISTS skills TEXT,
ADD COLUMN IF NOT EXISTS email_on_complete BOOLEAN DEFAULT true;

-- 2) Add UPDATE policy so users can update their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_profiles' 
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" ON public.user_profiles
      FOR UPDATE USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- 3) Refresh schema cache
NOTIFY pgrst, 'reload schema';

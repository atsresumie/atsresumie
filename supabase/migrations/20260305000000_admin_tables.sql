-- ==========================================================
-- Migration: Admin Panel Tables
-- Adds is_admin + email to user_profiles, admin_action_logs, admin_email_logs
-- ==========================================================

-- 1) Add is_admin flag to user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 2) Add email column to user_profiles (synced from auth.users)
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

-- 3) Backfill email from auth.users for existing rows
UPDATE public.user_profiles up
SET email = au.email
FROM auth.users au
WHERE up.id = au.id AND up.email IS NULL;

-- 4) Update handle_new_user trigger to also store email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, credits, email)
  VALUES (NEW.id, 3, NEW.email)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email WHERE user_profiles.email IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5) Admin action logs (audit trail)
CREATE TABLE IF NOT EXISTS public.admin_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  target_user_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS enabled + no policies = deny-all for anon/authenticated
ALTER TABLE public.admin_action_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_admin_action_logs_admin
  ON public.admin_action_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_target
  ON public.admin_action_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_created
  ON public.admin_action_logs(created_at DESC);

-- 6) Admin email logs
CREATE TABLE IF NOT EXISTS public.admin_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  target_user_id UUID REFERENCES auth.users(id),
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_type TEXT NOT NULL,
  body_preview TEXT,
  status TEXT NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent', 'failed')),
  resend_message_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS enabled + no policies = deny-all for anon/authenticated
ALTER TABLE public.admin_email_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_admin_email_logs_admin
  ON public.admin_email_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_email_logs_target
  ON public.admin_email_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_email_logs_created
  ON public.admin_email_logs(created_at DESC);

-- 7) Refresh schema cache
NOTIFY pgrst, 'reload schema';

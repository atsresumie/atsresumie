-- Add welcome_email_sent flag to user_profiles for deduplication
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN DEFAULT FALSE;

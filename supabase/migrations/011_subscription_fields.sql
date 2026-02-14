-- =========================
-- ATSResumie: Subscription Fields on user_profiles
-- Migration: 011_subscription_fields.sql
-- Run in Supabase SQL Editor AFTER previous migrations
-- =========================

-- 1) Add Stripe customer mapping
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- 2) Add subscription tracking fields
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT NULL;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS plan_name TEXT DEFAULT 'free';

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS cancel_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ DEFAULT NULL;

-- 3) Index for webhook lookup by stripe_customer_id (already UNIQUE, but explicit)
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer
  ON public.user_profiles(stripe_customer_id);

-- 4) Refresh schema cache so PostgREST picks up new columns
NOTIFY pgrst, 'reload schema';

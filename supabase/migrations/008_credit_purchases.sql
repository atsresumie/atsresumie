-- =========================
-- ATSResumie: Credit Purchases Table + Atomic Grant RPC
-- Migration: 008_credit_purchases.sql
-- Run in Supabase SQL Editor AFTER previous migrations
-- =========================

-- 1) Create credit_purchases table for audit trail
CREATE TABLE IF NOT EXISTS public.credit_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_checkout_session_id TEXT NOT NULL UNIQUE,  -- PRIMARY idempotency guard
  stripe_event_id TEXT NOT NULL UNIQUE,             -- Secondary uniqueness
  stripe_payment_intent_id TEXT UNIQUE,             -- Optional, for refund tracking
  pack_id TEXT NOT NULL,
  credits_amount INTEGER NOT NULL CHECK (credits_amount > 0),
  amount_paid_cents INTEGER NOT NULL CHECK (amount_paid_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'cad',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2) Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_credit_purchases_user_id ON public.credit_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_created_at ON public.credit_purchases(created_at DESC);

-- 3) Enable RLS: Users can only read their own purchases
ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own purchases" ON public.credit_purchases
  FOR SELECT USING (auth.uid() = user_id);

-- Note: No INSERT/UPDATE/DELETE policies for users - only service role can write

-- =========================
-- 4) Atomic credit grant function
-- Uses INSERT-as-gate pattern: attempt insert first, only grant credits if insert succeeds
-- This prevents race conditions and ensures idempotency
-- =========================

CREATE OR REPLACE FUNCTION public.grant_credits_for_purchase(
  p_user_id UUID,
  p_credits_amount INTEGER,
  p_stripe_checkout_session_id TEXT,
  p_stripe_event_id TEXT,
  p_stripe_payment_intent_id TEXT,
  p_pack_id TEXT,
  p_amount_paid_cents INTEGER,
  p_currency TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rowcount INTEGER := 0;
BEGIN
  -- INSERT-as-gate: attempt insert with ON CONFLICT DO NOTHING
  -- Uses no specific column so ANY unique constraint violation blocks insert
  -- This guards on both stripe_checkout_session_id AND stripe_event_id
  INSERT INTO public.credit_purchases (
    user_id,
    stripe_checkout_session_id,
    stripe_event_id,
    stripe_payment_intent_id,
    pack_id,
    credits_amount,
    amount_paid_cents,
    currency,
    status
  ) VALUES (
    p_user_id,
    p_stripe_checkout_session_id,
    p_stripe_event_id,
    p_stripe_payment_intent_id,
    p_pack_id,
    p_credits_amount,
    p_amount_paid_cents,
    p_currency,
    'succeeded'
  )
  ON CONFLICT DO NOTHING;

  -- Check if we actually inserted a row (ROW_COUNT is an integer)
  GET DIAGNOSTICS v_rowcount = ROW_COUNT;

  IF v_rowcount = 0 THEN
    -- Already processed, return false (no credits granted)
    RETURN FALSE;
  END IF;

  -- Only if INSERT succeeded, update user credits atomically
  -- Uses existing user_profiles table (same as /api/credits and credit deduction)
  INSERT INTO public.user_profiles (id, credits)
  VALUES (p_user_id, p_credits_amount)
  ON CONFLICT (id) DO UPDATE
  SET
    credits = user_profiles.credits + EXCLUDED.credits,
    updated_at = NOW();

  RETURN TRUE;
END;
$$;

-- 5) Grant execute permission to authenticated users (webhook uses service role)
-- Note: This function is SECURITY DEFINER so it runs with owner privileges
GRANT EXECUTE ON FUNCTION public.grant_credits_for_purchase(UUID, INTEGER, TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_credits_for_purchase(UUID, INTEGER, TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT) TO service_role;

-- =========================
-- 6) Helper function to mark purchase as refunded (for webhook)
-- =========================

CREATE OR REPLACE FUNCTION public.mark_purchase_refunded(
  p_stripe_payment_intent_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rowcount INTEGER := 0;
BEGIN
  UPDATE public.credit_purchases
  SET 
    status = 'refunded',
    updated_at = NOW()
  WHERE stripe_payment_intent_id = p_stripe_payment_intent_id
    AND status = 'succeeded';
  
  GET DIAGNOSTICS v_rowcount = ROW_COUNT;
  
  RETURN v_rowcount > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_purchase_refunded(TEXT) TO service_role;

-- 7) Refresh schema cache
NOTIFY pgrst, 'reload schema';

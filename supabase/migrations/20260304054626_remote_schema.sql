


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."job_status" AS ENUM (
    'queued',
    'running',
    'succeeded',
    'failed',
    'canceled'
);


ALTER TYPE "public"."job_status" OWNER TO "postgres";


CREATE TYPE "public"."onboarding_status" AS ENUM (
    'active',
    'claimed',
    'expired',
    'abandoned'
);


ALTER TYPE "public"."onboarding_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."adjust_credits"("p_delta" integer, "p_reason" "text" DEFAULT 'manual'::"text", "p_source" "text" DEFAULT 'system'::"text") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  -- Ensure user has profile (auto-create with 0 if missing)
  INSERT INTO user_profiles (id, credits)
  VALUES (auth.uid(), 0)
  ON CONFLICT (id) DO NOTHING;

  -- Atomic update with check for negative
  UPDATE user_profiles
  SET 
    credits = credits + p_delta,
    updated_at = NOW()
  WHERE id = auth.uid()
    AND credits + p_delta >= 0
  RETURNING credits INTO new_balance;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
  
  RETURN new_balance;
END;
$$;


ALTER FUNCTION "public"."adjust_credits"("p_delta" integer, "p_reason" "text", "p_source" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."adjust_credits_for_user"("p_user_id" "uuid", "p_delta" integer, "p_reason" "text" DEFAULT 'manual'::"text", "p_source" "text" DEFAULT 'system'::"text") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."adjust_credits_for_user"("p_user_id" "uuid", "p_delta" integer, "p_reason" "text", "p_source" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."claim_generation_job"("p_job_id" "uuid") RETURNS TABLE("id" "uuid", "user_id" "uuid", "jd_text" "text", "resume_text" "text", "resume_object_path" "text", "focus_prompt" "text", "mode" "text", "status" "text", "progress_stage" "text", "lock_id" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."claim_generation_job"("p_job_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."claim_next_generation_job"() RETURNS TABLE("id" "uuid", "user_id" "uuid", "jd_text" "text", "resume_text" "text", "resume_object_path" "text", "focus_prompt" "text", "mode" "text", "status" "text", "progress_stage" "text", "lock_id" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."claim_next_generation_job"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."claim_next_pdf_job"() RETURNS TABLE("id" "uuid", "user_id" "uuid", "latex_text" "text", "pdf_status" "text", "pdf_attempt_count" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."claim_next_pdf_job"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."claim_onboarding_session"("p_session_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE onboarding_sessions
  SET user_id = auth.uid(), status = 'claimed', claimed_at = NOW()
  WHERE id = p_session_id AND status = 'active' AND user_id IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Session invalid'; END IF;
END;
$$;


ALTER FUNCTION "public"."claim_onboarding_session"("p_session_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_job"("p_job_id" "uuid", "p_status" "text", "p_latex_text" "text" DEFAULT NULL::"text", "p_error_message" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."complete_job"("p_job_id" "uuid", "p_status" "text", "p_latex_text" "text", "p_error_message" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."deduct_credit_once"("p_job_id" "uuid", "p_user_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."deduct_credit_once"("p_job_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_credits"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  balance INTEGER;
BEGIN
  SELECT credits INTO balance
  FROM user_profiles
  WHERE id = auth.uid();
  
  -- Return 0 if no profile exists
  RETURN COALESCE(balance, 0);
END;
$$;


ALTER FUNCTION "public"."get_credits"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."grant_credits_for_purchase"("p_user_id" "uuid", "p_credits_amount" integer, "p_stripe_checkout_session_id" "text", "p_stripe_event_id" "text", "p_stripe_payment_intent_id" "text", "p_pack_id" "text", "p_amount_paid_cents" integer, "p_currency" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."grant_credits_for_purchase"("p_user_id" "uuid", "p_credits_amount" integer, "p_stripe_checkout_session_id" "text", "p_stripe_event_id" "text", "p_stripe_payment_intent_id" "text", "p_pack_id" "text", "p_amount_paid_cents" integer, "p_currency" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.user_profiles (id, credits)
  VALUES (NEW.id, 3)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_purchase_refunded"("p_stripe_payment_intent_id" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."mark_purchase_refunded"("p_stripe_payment_intent_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_default_resume"("p_resume_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."set_default_resume"("p_resume_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
      begin
        new.updated_at = now();
        return new;
      end;
      $$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_job_progress"("p_job_id" "uuid", "p_progress_stage" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.generation_jobs
  SET 
    progress_stage = p_progress_stage,
    updated_at = NOW()
  WHERE id = p_job_id;
END;
$$;


ALTER FUNCTION "public"."update_job_progress"("p_job_id" "uuid", "p_progress_stage" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_job_status"("p_job_id" "uuid", "p_status" "text", "p_latex_text" "text" DEFAULT NULL::"text", "p_pdf_url" "text" DEFAULT NULL::"text", "p_error_message" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."update_job_status"("p_job_id" "uuid", "p_status" "text", "p_latex_text" "text", "p_pdf_url" "text", "p_error_message" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_resume_version_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_resume_version_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_saved_jd_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_saved_jd_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."credit_purchases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "stripe_checkout_session_id" "text" NOT NULL,
    "stripe_event_id" "text" NOT NULL,
    "stripe_payment_intent_id" "text",
    "pack_id" "text" NOT NULL,
    "credits_amount" integer NOT NULL,
    "amount_paid_cents" integer NOT NULL,
    "currency" "text" DEFAULT 'cad'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "credit_purchases_amount_paid_cents_check" CHECK (("amount_paid_cents" >= 0)),
    CONSTRAINT "credit_purchases_credits_amount_check" CHECK (("credits_amount" > 0)),
    CONSTRAINT "credit_purchases_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'succeeded'::"text", 'failed'::"text", 'refunded'::"text"])))
);


ALTER TABLE "public"."credit_purchases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "email" "text",
    "message" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."generation_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "parent_job_id" "uuid",
    "jd_text" "text" NOT NULL,
    "resume_object_path" "text",
    "focus_prompt" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "error_message" "text",
    "latex_text" "text",
    "pdf_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "pdf_object_path" "text",
    "draft_id" "uuid",
    "progress" integer DEFAULT 0,
    "progress_stage" "text",
    "resume_text" "text",
    "mode" "text",
    "attempt_count" integer DEFAULT 0 NOT NULL,
    "locked_at" timestamp with time zone,
    "lock_id" "text",
    "styled_pdf_object_path" "text",
    "next_attempt_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_error" "text",
    "pdf_status" "text" DEFAULT 'none'::"text" NOT NULL,
    "pdf_attempt_count" integer DEFAULT 0 NOT NULL,
    "pdf_next_attempt_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "pdf_last_error" "text",
    "credit_deducted_at" timestamp with time zone,
    CONSTRAINT "generation_jobs_pdf_status_check" CHECK (("pdf_status" = ANY (ARRAY['none'::"text", 'queued'::"text", 'processing'::"text", 'ready'::"text", 'failed'::"text"]))),
    CONSTRAINT "generation_jobs_status_check" CHECK (("status" = ANY (ARRAY['queued'::"text", 'processing'::"text", 'succeeded'::"text", 'failed'::"text"])))
);

ALTER TABLE ONLY "public"."generation_jobs" REPLICA IDENTITY FULL;


ALTER TABLE "public"."generation_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."onboarding_drafts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "jd_text" "text" NOT NULL,
    "jd_source_url" "text",
    "jd_title" "text",
    "jd_company" "text",
    "resume_bucket" "text" DEFAULT 'user-resumes'::"text" NOT NULL,
    "resume_object_path" "text" NOT NULL,
    "resume_original_filename" "text",
    "resume_mime_type" "text",
    "resume_size_bytes" bigint,
    "resume_extracted_text" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "resume_status" "text",
    "resume_uploaded_at" timestamp with time zone,
    "resume_committed_at" timestamp with time zone,
    CONSTRAINT "onboarding_drafts_resume_status_check" CHECK (("resume_status" = ANY (ARRAY['temp'::"text", 'final'::"text"])))
);


ALTER TABLE "public"."onboarding_drafts" OWNER TO "postgres";


COMMENT ON COLUMN "public"."onboarding_drafts"."resume_status" IS 'temp = uploaded but not confirmed, final = confirmed and committed';



COMMENT ON COLUMN "public"."onboarding_drafts"."resume_uploaded_at" IS 'When the resume was first uploaded to temp storage';



COMMENT ON COLUMN "public"."onboarding_drafts"."resume_committed_at" IS 'When the resume was committed to final storage';



CREATE TABLE IF NOT EXISTS "public"."onboarding_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "status" "public"."onboarding_status" DEFAULT 'active'::"public"."onboarding_status" NOT NULL,
    "user_id" "uuid",
    "ip_hash" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval) NOT NULL,
    "claimed_at" timestamp with time zone,
    CONSTRAINT "expires_after_created" CHECK (("expires_at" > "created_at"))
);


ALTER TABLE "public"."onboarding_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resume_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "label" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_type" "text",
    "object_path" "text" NOT NULL,
    "resume_text" "text",
    "is_default" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."resume_versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."saved_job_descriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "label" "text" NOT NULL,
    "company" "text",
    "source_url" "text",
    "jd_text" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."saved_job_descriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tailored_outputs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_id" "uuid" NOT NULL,
    "tailored_resume_json" "jsonb",
    "tailored_resume_text" "text",
    "pdf_bucket" "text" DEFAULT 'generated-resumes'::"text" NOT NULL,
    "pdf_object_path" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tailored_outputs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" NOT NULL,
    "credits" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "name" "text",
    "role_title" "text",
    "location" "text",
    "industries" "text",
    "skills" "text",
    "email_on_complete" boolean DEFAULT true,
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "subscription_status" "text",
    "plan_name" "text" DEFAULT 'free'::"text",
    "cancel_at_period_end" boolean DEFAULT false,
    "cancel_at" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    CONSTRAINT "user_profiles_credits_check" CHECK (("credits" >= 0))
);

ALTER TABLE ONLY "public"."user_profiles" REPLICA IDENTITY FULL;


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."credit_purchases"
    ADD CONSTRAINT "credit_purchases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_purchases"
    ADD CONSTRAINT "credit_purchases_stripe_checkout_session_id_key" UNIQUE ("stripe_checkout_session_id");



ALTER TABLE ONLY "public"."credit_purchases"
    ADD CONSTRAINT "credit_purchases_stripe_event_id_key" UNIQUE ("stripe_event_id");



ALTER TABLE ONLY "public"."credit_purchases"
    ADD CONSTRAINT "credit_purchases_stripe_payment_intent_id_key" UNIQUE ("stripe_payment_intent_id");



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."generation_jobs"
    ADD CONSTRAINT "generation_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."onboarding_drafts"
    ADD CONSTRAINT "onboarding_drafts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."onboarding_sessions"
    ADD CONSTRAINT "onboarding_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resume_versions"
    ADD CONSTRAINT "resume_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_job_descriptions"
    ADD CONSTRAINT "saved_job_descriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tailored_outputs"
    ADD CONSTRAINT "tailored_outputs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_stripe_customer_id_key" UNIQUE ("stripe_customer_id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_stripe_subscription_id_key" UNIQUE ("stripe_subscription_id");



CREATE INDEX "idx_credit_purchases_created_at" ON "public"."credit_purchases" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_credit_purchases_user_id" ON "public"."credit_purchases" USING "btree" ("user_id");



CREATE INDEX "idx_generation_jobs_created_at" ON "public"."generation_jobs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_generation_jobs_latex_queue" ON "public"."generation_jobs" USING "btree" ("next_attempt_at") WHERE ("status" = 'queued'::"text");



CREATE INDEX "idx_generation_jobs_pdf_queue" ON "public"."generation_jobs" USING "btree" ("pdf_next_attempt_at") WHERE (("status" = 'succeeded'::"text") AND ("pdf_status" = ANY (ARRAY['queued'::"text", 'failed'::"text"])) AND ("pdf_object_path" IS NULL));



CREATE INDEX "idx_generation_jobs_queue" ON "public"."generation_jobs" USING "btree" ("status", "created_at") WHERE ("status" = 'queued'::"text");



CREATE INDEX "idx_generation_jobs_status" ON "public"."generation_jobs" USING "btree" ("status");



CREATE INDEX "idx_generation_jobs_user_id" ON "public"."generation_jobs" USING "btree" ("user_id");



CREATE INDEX "idx_resume_versions_created_at" ON "public"."resume_versions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_resume_versions_user_default" ON "public"."resume_versions" USING "btree" ("user_id", "is_default") WHERE ("is_default" = true);



CREATE INDEX "idx_resume_versions_user_id" ON "public"."resume_versions" USING "btree" ("user_id");



CREATE INDEX "idx_saved_jds_updated_at" ON "public"."saved_job_descriptions" USING "btree" ("updated_at" DESC);



CREATE INDEX "idx_saved_jds_user_id" ON "public"."saved_job_descriptions" USING "btree" ("user_id");



CREATE INDEX "idx_user_profiles_stripe_customer" ON "public"."user_profiles" USING "btree" ("stripe_customer_id");



CREATE INDEX "onboarding_drafts_session_id_idx" ON "public"."onboarding_drafts" USING "btree" ("session_id");



CREATE INDEX "onboarding_sessions_expires_idx" ON "public"."onboarding_sessions" USING "btree" ("expires_at");



CREATE INDEX "onboarding_sessions_status_idx" ON "public"."onboarding_sessions" USING "btree" ("status");



CREATE INDEX "onboarding_sessions_user_id_idx" ON "public"."onboarding_sessions" USING "btree" ("user_id");



CREATE INDEX "tailored_outputs_session_id_idx" ON "public"."tailored_outputs" USING "btree" ("session_id");



CREATE INDEX "tailored_outputs_user_id_idx" ON "public"."tailored_outputs" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "resume_version_updated_at_trigger" BEFORE UPDATE ON "public"."resume_versions" FOR EACH ROW EXECUTE FUNCTION "public"."update_resume_version_updated_at"();



CREATE OR REPLACE TRIGGER "saved_jd_updated_at_trigger" BEFORE UPDATE ON "public"."saved_job_descriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_saved_jd_updated_at"();



CREATE OR REPLACE TRIGGER "trg_onboarding_drafts_updated" BEFORE UPDATE ON "public"."onboarding_drafts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_onboarding_sessions_updated" BEFORE UPDATE ON "public"."onboarding_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."credit_purchases"
    ADD CONSTRAINT "credit_purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."generation_jobs"
    ADD CONSTRAINT "generation_jobs_parent_job_id_fkey" FOREIGN KEY ("parent_job_id") REFERENCES "public"."generation_jobs"("id");



ALTER TABLE ONLY "public"."generation_jobs"
    ADD CONSTRAINT "generation_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."onboarding_drafts"
    ADD CONSTRAINT "onboarding_drafts_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."onboarding_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."onboarding_sessions"
    ADD CONSTRAINT "onboarding_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."resume_versions"
    ADD CONSTRAINT "resume_versions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."saved_job_descriptions"
    ADD CONSTRAINT "saved_job_descriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tailored_outputs"
    ADD CONSTRAINT "tailored_outputs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."onboarding_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tailored_outputs"
    ADD CONSTRAINT "tailored_outputs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Users can create own jobs" ON "public"."generation_jobs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create own resume versions" ON "public"."resume_versions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create own saved JDs" ON "public"."saved_job_descriptions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own resume versions" ON "public"."resume_versions" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own saved JDs" ON "public"."saved_job_descriptions" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert feedback" ON "public"."feedback" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own jobs" ON "public"."generation_jobs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own profile" ON "public"."user_profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can read own purchases" ON "public"."credit_purchases" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own resume versions" ON "public"."resume_versions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own saved JDs" ON "public"."saved_job_descriptions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."user_profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own resume versions" ON "public"."resume_versions" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own saved JDs" ON "public"."saved_job_descriptions" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."credit_purchases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."generation_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."onboarding_drafts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."onboarding_sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "read own outputs" ON "public"."tailored_outputs" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."resume_versions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."saved_job_descriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tailored_outputs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."generation_jobs";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."resume_versions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."saved_job_descriptions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."user_profiles";









GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































GRANT ALL ON FUNCTION "public"."adjust_credits"("p_delta" integer, "p_reason" "text", "p_source" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."adjust_credits"("p_delta" integer, "p_reason" "text", "p_source" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."adjust_credits"("p_delta" integer, "p_reason" "text", "p_source" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."adjust_credits_for_user"("p_user_id" "uuid", "p_delta" integer, "p_reason" "text", "p_source" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."adjust_credits_for_user"("p_user_id" "uuid", "p_delta" integer, "p_reason" "text", "p_source" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."adjust_credits_for_user"("p_user_id" "uuid", "p_delta" integer, "p_reason" "text", "p_source" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."claim_generation_job"("p_job_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."claim_generation_job"("p_job_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."claim_generation_job"("p_job_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."claim_next_generation_job"() TO "anon";
GRANT ALL ON FUNCTION "public"."claim_next_generation_job"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."claim_next_generation_job"() TO "service_role";



GRANT ALL ON FUNCTION "public"."claim_next_pdf_job"() TO "anon";
GRANT ALL ON FUNCTION "public"."claim_next_pdf_job"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."claim_next_pdf_job"() TO "service_role";



GRANT ALL ON FUNCTION "public"."claim_onboarding_session"("p_session_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."claim_onboarding_session"("p_session_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."claim_onboarding_session"("p_session_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_job"("p_job_id" "uuid", "p_status" "text", "p_latex_text" "text", "p_error_message" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."complete_job"("p_job_id" "uuid", "p_status" "text", "p_latex_text" "text", "p_error_message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_job"("p_job_id" "uuid", "p_status" "text", "p_latex_text" "text", "p_error_message" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."deduct_credit_once"("p_job_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."deduct_credit_once"("p_job_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."deduct_credit_once"("p_job_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_credits"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_credits"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_credits"() TO "service_role";



GRANT ALL ON FUNCTION "public"."grant_credits_for_purchase"("p_user_id" "uuid", "p_credits_amount" integer, "p_stripe_checkout_session_id" "text", "p_stripe_event_id" "text", "p_stripe_payment_intent_id" "text", "p_pack_id" "text", "p_amount_paid_cents" integer, "p_currency" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."grant_credits_for_purchase"("p_user_id" "uuid", "p_credits_amount" integer, "p_stripe_checkout_session_id" "text", "p_stripe_event_id" "text", "p_stripe_payment_intent_id" "text", "p_pack_id" "text", "p_amount_paid_cents" integer, "p_currency" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."grant_credits_for_purchase"("p_user_id" "uuid", "p_credits_amount" integer, "p_stripe_checkout_session_id" "text", "p_stripe_event_id" "text", "p_stripe_payment_intent_id" "text", "p_pack_id" "text", "p_amount_paid_cents" integer, "p_currency" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_purchase_refunded"("p_stripe_payment_intent_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_purchase_refunded"("p_stripe_payment_intent_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_purchase_refunded"("p_stripe_payment_intent_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_default_resume"("p_resume_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."set_default_resume"("p_resume_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_default_resume"("p_resume_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_job_progress"("p_job_id" "uuid", "p_progress_stage" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_job_progress"("p_job_id" "uuid", "p_progress_stage" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_job_progress"("p_job_id" "uuid", "p_progress_stage" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_job_status"("p_job_id" "uuid", "p_status" "text", "p_latex_text" "text", "p_pdf_url" "text", "p_error_message" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_job_status"("p_job_id" "uuid", "p_status" "text", "p_latex_text" "text", "p_pdf_url" "text", "p_error_message" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_job_status"("p_job_id" "uuid", "p_status" "text", "p_latex_text" "text", "p_pdf_url" "text", "p_error_message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_job_status"("p_job_id" "uuid", "p_status" "text", "p_latex_text" "text", "p_pdf_url" "text", "p_error_message" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_resume_version_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_resume_version_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_resume_version_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_saved_jd_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_saved_jd_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_saved_jd_updated_at"() TO "service_role";
























GRANT ALL ON TABLE "public"."credit_purchases" TO "anon";
GRANT ALL ON TABLE "public"."credit_purchases" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_purchases" TO "service_role";



GRANT ALL ON TABLE "public"."feedback" TO "anon";
GRANT ALL ON TABLE "public"."feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."feedback" TO "service_role";



GRANT ALL ON TABLE "public"."generation_jobs" TO "anon";
GRANT ALL ON TABLE "public"."generation_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."generation_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."onboarding_drafts" TO "anon";
GRANT ALL ON TABLE "public"."onboarding_drafts" TO "authenticated";
GRANT ALL ON TABLE "public"."onboarding_drafts" TO "service_role";



GRANT ALL ON TABLE "public"."onboarding_sessions" TO "anon";
GRANT ALL ON TABLE "public"."onboarding_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."onboarding_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."resume_versions" TO "anon";
GRANT ALL ON TABLE "public"."resume_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."resume_versions" TO "service_role";



GRANT ALL ON TABLE "public"."saved_job_descriptions" TO "anon";
GRANT ALL ON TABLE "public"."saved_job_descriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."saved_job_descriptions" TO "service_role";



GRANT ALL ON TABLE "public"."tailored_outputs" TO "anon";
GRANT ALL ON TABLE "public"."tailored_outputs" TO "authenticated";
GRANT ALL ON TABLE "public"."tailored_outputs" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "authenticated_user_access i5g8va_0"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'resumes'::text));



  create policy "authenticated_user_access i5g8va_1"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'resumes'::text));



  create policy "authenticated_user_access i5g8va_2"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using ((bucket_id = 'resumes'::text));



  create policy "users read own generated pdf"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'generated-resumes'::text) AND (EXISTS ( SELECT 1
   FROM public.tailored_outputs t
  WHERE ((t.user_id = auth.uid()) AND (t.pdf_object_path = objects.name))))));




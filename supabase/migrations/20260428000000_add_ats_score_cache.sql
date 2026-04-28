-- Cache the latest general ATS score directly on resume_versions so the
-- dashboard cards don't have to re-call the scoring microservice on every
-- page visit.
ALTER TABLE "public"."resume_versions"
    ADD COLUMN IF NOT EXISTS "ats_score" integer,
    ADD COLUMN IF NOT EXISTS "ats_score_cached_at" timestamp with time zone;

ALTER TABLE "public"."resume_versions"
    DROP CONSTRAINT IF EXISTS "resume_versions_ats_score_check";

ALTER TABLE "public"."resume_versions"
    ADD CONSTRAINT "resume_versions_ats_score_check"
    CHECK ("ats_score" IS NULL OR ("ats_score" >= 0 AND "ats_score" <= 100));

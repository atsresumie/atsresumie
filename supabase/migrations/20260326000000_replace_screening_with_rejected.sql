-- Migration: Replace "screening" stage with "rejected"
-- Kanban-style application tracking: Saved → Applied → Interview → Offer → Rejected

-- 1. Move any existing "screening" rows to "applied" (safe migration)
UPDATE public.job_applications
SET stage = 'applied'
WHERE stage = 'screening';

-- 2. Drop the old CHECK constraint and add the new one
ALTER TABLE public.job_applications
    DROP CONSTRAINT IF EXISTS job_applications_stage_check;

ALTER TABLE public.job_applications
    ADD CONSTRAINT job_applications_stage_check
    CHECK (stage IN ('saved', 'applied', 'interview', 'offer', 'rejected'));

-- Migration: Add resume_status and timestamps to onboarding_drafts
-- Run this migration to enable soft-commit resume uploads

-- Add resume_status column to track temp vs final state
ALTER TABLE onboarding_drafts 
ADD COLUMN IF NOT EXISTS resume_status TEXT CHECK (resume_status IN ('temp', 'final'));

-- Add timestamps for tracking upload and commit times
ALTER TABLE onboarding_drafts
ADD COLUMN IF NOT EXISTS resume_uploaded_at TIMESTAMPTZ;

ALTER TABLE onboarding_drafts
ADD COLUMN IF NOT EXISTS resume_committed_at TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN onboarding_drafts.resume_status IS 'temp = uploaded but not confirmed, final = confirmed and committed';
COMMENT ON COLUMN onboarding_drafts.resume_uploaded_at IS 'When the resume was first uploaded to temp storage';
COMMENT ON COLUMN onboarding_drafts.resume_committed_at IS 'When the resume was committed to final storage';

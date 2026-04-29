-- Migration: Create job_applications table for the dashboard job tracker
-- Kanban-style application tracking: Saved → Applied → Screening → Interview → Offer

CREATE TABLE IF NOT EXISTS public.job_applications (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company         TEXT NOT NULL,
    role            TEXT NOT NULL,
    location        TEXT,
    salary          TEXT,
    source_url      TEXT,
    stage           TEXT NOT NULL DEFAULT 'saved'
                    CHECK (stage IN ('saved', 'applied', 'screening', 'interview', 'offer')),
    position        INTEGER DEFAULT 0,
    applied_at      TIMESTAMPTZ,
    interview_date  TIMESTAMPTZ,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.job_applications OWNER TO postgres;

-- Row Level Security
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own applications"
    ON public.job_applications FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at trigger (reuses existing set_updated_at function)
CREATE TRIGGER set_job_applications_updated_at
    BEFORE UPDATE ON public.job_applications
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable Realtime
ALTER TABLE public.job_applications REPLICA IDENTITY FULL;

-- Index for fast user queries
CREATE INDEX idx_job_applications_user_id ON public.job_applications(user_id);
CREATE INDEX idx_job_applications_user_stage ON public.job_applications(user_id, stage);

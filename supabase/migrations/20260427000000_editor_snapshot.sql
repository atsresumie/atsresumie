-- Migration: editor_snapshot
-- Adds columns to persist the final editor state when a user downloads a PDF.
-- This enables re-opening a generation and seeing the exact PDF, chat history,
-- and style config from the last download — on any device.

ALTER TABLE public.generation_jobs
  ADD COLUMN IF NOT EXISTS final_pdf_object_path TEXT,
  ADD COLUMN IF NOT EXISTS final_latex_text TEXT,
  ADD COLUMN IF NOT EXISTS chat_history JSONB DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS style_config JSONB DEFAULT NULL;

-- Add a comment for documentation
COMMENT ON COLUMN public.generation_jobs.final_pdf_object_path IS 'Storage path to the locked final PDF produced on download';
COMMENT ON COLUMN public.generation_jobs.final_latex_text IS 'Exact LaTeX that produced the final PDF (immutable snapshot)';
COMMENT ON COLUMN public.generation_jobs.chat_history IS 'Chat edit conversation history (persisted on download)';
COMMENT ON COLUMN public.generation_jobs.style_config IS 'Style slider config (font, margins, etc.) persisted on download';

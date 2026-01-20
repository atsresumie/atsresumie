# Anonymous Onboarding Flow - Documentation

This document describes the anonymous onboarding flow implementation for ATSResumie.

## Overview

Users can anonymously upload a resume and paste a Job Description. After signup, the session is claimed and a PDF generation job is queued.

## API Routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/onboarding/start` | POST | Create/resume session |
| `/api/onboarding/resume-upload-url` | POST | Get signed upload URL |
| `/api/onboarding/save-draft` | POST | Save JD + resume metadata |
| `/api/onboarding/claim` | POST | Claim session + queue job |
| `/api/jobs/[id]` | GET | Poll job status |

## Files

### Utilities
- `lib/utils/hash.ts` - SHA-256 using Node crypto
- `lib/utils/sanitize.ts` - Filename sanitization (120 char limit)
- `lib/supabase/server.ts` - Server client with Next.js 15 async cookies
- `lib/onboarding/client.ts` - Client-side helpers with polling
- `lib/onboarding/cookie.ts` - Session cookie management

### UI Integration
- `components/get-started/hooks/useResumeForm.ts` - Session init, upload, draft save

## How It Works

```
User opens /get-started
    ↓
POST /api/onboarding/start → Cookie set with sessionId
    ↓
User selects resume file
    ↓
POST /api/onboarding/resume-upload-url → { signedUrl, token }
    ↓
Client uploads to Supabase Storage
    ↓
User clicks "Analyze"
    ↓
POST /api/onboarding/save-draft → { draftId }
    ↓
POST /api/analyze → Shows preview
    ↓
User signs up
    ↓
POST /api/onboarding/claim → { jobId }
    ↓
Poll GET /api/jobs/[id] until complete
```

## Supabase Setup (Required)

### 1. Create Storage Buckets
In Supabase Dashboard → Storage, create:
- `user-resumes` (private)
- `generated-resumes` (private)

### 2. Create RPC Function
Run in SQL Editor:

```sql
CREATE OR REPLACE FUNCTION public.claim_onboarding_session(p_session_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.onboarding_sessions
  SET user_id = auth.uid(), status = 'claimed', updated_at = now()
  WHERE id = p_session_id AND status = 'active' AND expires_at > now() AND user_id IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Session not found or already claimed'; END IF;
END; $$;
```

### 3. Enable RLS
```sql
ALTER TABLE public.generation_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own jobs" ON public.generation_jobs 
  FOR SELECT USING (auth.uid() = user_id);
```

## Testing

```bash
npm run dev
```

1. Open http://localhost:3000/get-started
2. Open DevTools → Network tab
3. Select mode → Continue
4. Upload PDF/DOCX → Watch for toast + network calls
5. Paste job description (>50 chars)
6. Click Analyze
7. Check Supabase Table Editor → `onboarding_sessions` and `onboarding_drafts`

## Client Usage Example

```typescript
import {
  startOnboardingSession,
  uploadResume,
  saveDraft,
  claimSession,
  pollJobStatus,
} from "@/lib/onboarding/client";

// 1. Start session on page load
await startOnboardingSession();

// 2. Upload resume when user selects file
const { bucket, objectPath } = await uploadResume(file);

// 3. Save draft when user submits form
const draftId = await saveDraft({
  jdText: jobDescription,
  resumeBucket: bucket,
  resumeObjectPath: objectPath,
  resumeOriginalFilename: file.name,
  resumeMimeType: file.type,
  resumeSizeBytes: file.size,
});

// 4. After user signs up, claim session
const jobId = await claimSession();

// 5. Poll for completion
const finalStatus = await pollJobStatus(jobId, {
  onProgress: (status) => console.log(`Progress: ${status.progress}%`)
});
```

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Server only
```

## Supabase Edge Function (Job Processing)

The Edge Function at `supabase/functions/process-generation-job/` processes queued generation jobs.

### Deploy the Edge Function

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy
supabase functions deploy process-generation-job
```

### Invoke the Function

After claiming a session and getting a `jobId`, invoke the processor:

```typescript
import { invokeJobProcessor } from "@/lib/jobs/invoke";

const result = await invokeJobProcessor(jobId);
if (result.success) {
  console.log("PDF at:", result.pdfPath);
}
```

### What It Does

1. Fetches job from `generation_jobs`
2. Downloads resume from storage
3. Generates tailored resume (TODO: integrate AI)
4. Uploads PDF to `generated-resumes`
5. Creates `tailored_outputs` record
6. Updates job status

> **Note:** The current implementation uses mock/placeholder logic for:
> - Text extraction (TODO: use pdf-parse, mammoth)
> - Resume tailoring (TODO: integrate OpenAI/Anthropic)
> - PDF generation (TODO: use LaTeX compiler or Puppeteer)

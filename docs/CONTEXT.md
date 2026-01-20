# ATSResumie - Codebase Context

> This document provides comprehensive context about the ATSResumie codebase for LLM assistance.

---

## Project Overview

**ATSResumie** is a Next.js 16 application that helps users optimize their resumes for Applicant Tracking Systems (ATS). Users can:
1. Paste a job description
2. Upload their resume (PDF/DOCX)
3. Get AI-powered analysis and suggestions
4. Download an optimized PDF (after signup)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage |
| Auth | Supabase Auth (planned) |
| Edge Functions | Deno (Supabase Edge Functions) |
| Package Manager | pnpm |

---

## Directory Structure

```
atsresumie/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── analyze/       # ATS analysis endpoint
│   │   ├── export/        # PDF export endpoint
│   │   ├── jobs/[id]/     # Job status polling
│   │   └── onboarding/    # Anonymous session management
│   │       ├── start/           # Create/resume session
│   │       ├── session-status/  # Get session + draft data
│   │       ├── resume-upload-url/ # Signed URL for upload
│   │       ├── save-draft/      # Save JD + resume metadata
│   │       ├── delete-resume/   # Delete resume from storage
│   │       └── claim/           # Claim session after signup
│   ├── get-started/       # Main onboarding page
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   └── providers.tsx      # React context providers
│
├── components/
│   ├── get-started/       # Onboarding wizard components
│   │   ├── hooks/         # useResumeForm hook
│   │   ├── steps/         # Step0, Step1, Step2 components
│   │   ├── ModeCards.tsx  # Mode selection cards
│   │   └── ...
│   ├── landing/           # Landing page components
│   └── ui/                # shadcn/ui components
│
├── lib/                   # Utility libraries
│   ├── ats/               # ATS analysis logic
│   │   ├── extractText.ts # PDF/DOCX text extraction
│   │   └── mock.ts        # Mock analysis (placeholder for AI)
│   ├── jobs/
│   │   └── invoke.ts      # Edge function invocation
│   ├── onboarding/
│   │   ├── client.ts      # Client-side API helpers
│   │   └── cookie.ts      # Session cookie management
│   ├── storage/
│   │   └── draft.ts       # localStorage draft backup
│   ├── supabase/
│   │   ├── admin.ts       # Service role client
│   │   ├── browser.ts     # Browser client
│   │   └── server.ts      # Server component client
│   └── utils/
│       ├── hash.ts        # SHA-256 hashing
│       └── sanitize.ts    # Filename sanitization
│
├── supabase/
│   └── functions/         # Deno Edge Functions
│       ├── deno.json      # Deno configuration
│       └── process-generation-job/  # PDF generation worker
│
├── docs/                  # Documentation
│   ├── ONBOARDING.md      # Onboarding flow details
│   ├── WORKFLOW.md        # Application workflow
│   └── IMPLEMENTATIONS.md # Implementation history
│
└── public/                # Static assets
```

---

## Core Concepts

### 1. Anonymous Onboarding Flow

Users can start without signing up. A session is created and tracked via httpOnly cookie (`ats_onboarding_session`).

**Session Lifecycle:**
```
New User → Create Session → Upload Resume → Save Draft → Analyze → Signup → Claim Session → Generate PDF
```

**Session States:**
- `active` - User can edit, isEditable=true
- `claimed` - Linked to user, isEditable=false
- `expired` - Past expiration, isEditable=false

### 2. Resume Upload Flow

1. Client requests signed URL from `/api/onboarding/resume-upload-url`
2. Client uploads directly to Supabase Storage using signed URL
3. Metadata saved to `onboarding_drafts` table

### 3. Draft Restoration

When user returns with existing cookie:
1. `/api/onboarding/session-status` returns session + draft data
2. `useResumeForm` hook populates form with saved JD text and resume filename
3. Resume file shows as "Previously uploaded" with green checkmark

---

## Database Schema

### onboarding_sessions
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| ip_hash | text | Hashed IP for analytics |
| user_agent | text | Browser user agent |
| user_id | uuid | Linked user (after claim) |
| status | text | active/claimed/expired |
| expires_at | timestamp | Session expiration |

### onboarding_drafts
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| session_id | uuid | FK to onboarding_sessions |
| jd_text | text | Job description text |
| jd_title | text | Extracted job title |
| jd_company | text | Extracted company name |
| resume_bucket | text | Storage bucket name |
| resume_object_path | text | Storage object path |
| resume_original_filename | text | User's filename |
| resume_mime_type | text | File MIME type |

### generation_jobs
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Owner user |
| session_id | uuid | Source session |
| draft_id | uuid | Source draft |
| status | text | queued/running/succeeded/failed |
| progress | int | 0-100 progress |
| error_message | text | Error details if failed |

---

## Key Components

### useResumeForm Hook
**Location:** `components/get-started/hooks/useResumeForm.ts`

Central state management for the onboarding wizard. Handles:
- Step navigation (0, 1, 2)
- Mode selection (QUICK, DETAILED)
- Form state (JD, resume file, focus prompt)
- Session initialization and restoration
- Resume upload to Supabase
- Draft saving
- Analysis triggering

**Key Exports:**
```typescript
{
  step, setStep,
  mode, setMode,
  jobDescription, setJobDescription,
  resumeFile, setResumeFile,
  focusPrompt, setFocusPrompt,
  isAnalyzing, analysis,
  isLoadingSession,      // Loading session status
  isSessionLocked,       // Session claimed/expired
  hasPreviousDraft,      // Has restored data
  previousResumeFilename,// Restored filename
  isDeletingResume,      // Deletion in progress
  canAnalyze,            // Validation passed
  runAnalyze,            // Trigger analysis
  startFreshSession,     // Clear and restart
  clearUploadedResume,   // Delete resume and allow new upload
}
```

### Step Components
- **Step0ModeSelection** - Mode picker (Quick/Detailed)
- **Step1InputForm** - JD textarea, file upload, focus input
- **Step2Preview** - Results display with ATS score

---

## API Endpoints

### POST /api/onboarding/start
Creates or resumes session. Supports `forceNew: true` to clear old session.

### GET /api/onboarding/session-status
Returns session status and draft data for restoration.

### POST /api/onboarding/resume-upload-url
Returns signed URL for direct file upload.

### POST /api/onboarding/save-draft
Saves JD text and resume metadata.

### POST /api/onboarding/claim
Links session to authenticated user, creates generation job.

### DELETE /api/onboarding/delete-resume
Deletes resume from Supabase Storage and removes draft record.

### POST /api/analyze
Runs ATS analysis on resume against job description.

### POST /api/export
Generates downloadable PDF (stub implementation).

### GET /api/jobs/[id]
Polls generation job status.

---

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY=      # Service role key (server only)
```

---

## Current Implementation Status

### Implemented ✅
- Anonymous onboarding flow
- Session creation and restoration
- Resume upload to Supabase Storage
- Draft saving and retrieval
- Mock ATS analysis
- Session claiming (post-signup preparation)
- Draft protection (locked sessions)

### Placeholder/TODO 🚧
- AI integration for analysis (currently mock)
- PDF generation (returns placeholder)
- User authentication (NextAuth/Supabase Auth)
- Credits system
- Email notifications

---

## File Naming Conventions

- **API Routes:** `route.ts` in `/app/api/[endpoint]/`
- **Components:** PascalCase `.tsx` files
- **Hooks:** `use[Name].ts` in `hooks/` folders
- **Utilities:** camelCase `.ts` files in `lib/`

---

## Important Patterns

### Server vs Client Components
- API routes and server actions use `lib/supabase/admin.ts` (service role)
- Server components use `lib/supabase/server.ts` (respects RLS)
- Client components use `lib/supabase/browser.ts` (browser client)

### Cookie-based Session
Session ID stored in httpOnly cookie, not exposed to JavaScript. Cookie helpers in `lib/onboarding/cookie.ts`.

### Dual Storage Strategy
- **Primary:** Supabase tables for persistence
- **Backup:** localStorage via `lib/storage/draft.ts`

---

*Last updated: 2026-01-19*

### Next task
- Implement Auth using supabase Auth, it should be seemless, google o-auth sign-in should also be included.
- Auth : After user enter their email and password for signing-up, it should notify the user using a toast or may be dialoge box, that the user is being signed up and should verify their email which they have received from supabase.
- Auth : After user signing-in, they are allowed to access the onboarding flow which includes getting their pdf generated from AI.
-  Fix: The Analyze and Preview button is currently disabled when the current oboarding session is active and the user should be allowed to access the onboarding flow even with the active onboarding session. They are only not allowed to Generate or Export the pdf , which requires login or signup.

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

| Layer           | Technology                                         |
| --------------- | -------------------------------------------------- |
| Framework       | Next.js 16 (App Router)                            |
| Language        | TypeScript                                         |
| Styling         | Tailwind CSS                                       |
| Database        | Supabase (PostgreSQL)                              |
| Storage         | Supabase Storage                                   |
| Auth            | **Supabase Auth** (Email/Password + Google OAuth)  |
| AI Model        | **Claude 3.5 Sonnet** (via Anthropic SDK)          |
| Realtime        | **Supabase Realtime** (WebSockets)                 |
| PDF Engine      | **latex-online.cc** (External Compilation Service) |
| Package Manager | pnpm                                               |

---

## Directory Structure

```
atsresumie/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── analyze/       # ATS analysis endpoint
│   │   ├── credits/       # Get user credits
│   │   ├── export-pdf/    # PDF compilation proxy
│   │   ├── generate/      # Create generation job (Claude)
│   │   ├── jobs/[id]/     # Job status & details
│   │   └── onboarding/    # Anonymous session management
│   │       ├── commit-resume/   # Soft-commit resume
│   │       ├── session-status/  # Get session + draft data
│   │       ├── resume-upload-url/ # Signed URL for upload
│   │       ├── save-draft/      # Save JD + resume metadata
│   │       ├── delete-resume/   # Delete resume from storage
│   │       └── claim/           # Claim session after signup
│   ├── auth/              # Authentication routes
│   │   └── callback/      # OAuth callback handler
│   ├── dashboard/         # User dashboard
│   │   ├── generate/      # Generate page (JD input, resume selector)
│   │   ├── generations/   # Past generations list
│   │   ├── saved-jds/     # Saved job descriptions library
│   │   └── ...
│   ├── get-started/       # Main onboarding page
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   └── providers.tsx      # React context providers
│
├── components/
│   ├── auth/              # Authentication components
│   ├── dashboard/         # Dashboard components
│   │   ├── generate/      # Generate page components (Pickers, Indicators)
│   │   ├── generations/   # Generations list components (Row, Drawer, Filters)
│   │   └── ...
│   ├── get-started/       # Onboarding wizard components
│   │   ├── hooks/         # useResumeForm, useJobRealtime
│   │   ├── steps/         # Step0, Step1, Step2 components
│   │   └── ...
│   └── ui/                # shadcn/ui components
│
├── hooks/                 # Global custom hooks
│   ├── useAuth.ts         # Auth state hook
│   ├── useCredits.ts      # Credits state hook
│   ├── useJobRealtime.ts  # Supabase Realtime subscription
│   ├── useGenerations.ts  # Dashboard generations data + realtime
│   ├── useSavedJds.ts     # Saved JDs CRUD + realtime
│   ├── useDraftJd.ts      # Autosave hook for Generate page
│   ├── useUserResume.ts   # Fetch user's latest resume hook
│   └── useCreditHistory.ts # Credit history derived from generations
│
├── lib/                   # Utility libraries
│   ├── llm/               # AI Logic
│   │   ├── claudeLatex.ts # Claude integration & modes
│   │   └── prompts.ts     # Prompt templates
│   ├── onboarding/
│   │   └── client.ts      # Client-side API helpers (XHR upload)
│   ├── supabase/          # Supabase clients
│   └── utils/             # Helpers
│
└── public/                # Static assets
```

---

## Core Engines

### 1. Soft-Commit Resume Upload

Implements a two-stage upload process to prevent orphan files and improve UX:

- **Stage 1 (Temp)**: File uploaded to `temp/` folder immediately on selection. Yellow badge.
- **Stage 2 (Final)**: File moved to `final/` folder only when user confirms ("Preview & Analyze"). Green badge.
- **Progress Tracking**: Uses XHR for real-time upload percentage and ETA.

### 2. Claude LaTeX Generation

Uses **Claude 3.5 Sonnet** to generate ATS-safe LaTeX code.

- **Engine**: `lib/llm/claudeLatex.ts`
- **Prompts**: `lib/llm/prompts.ts`
- **Modes Designed**:
    1.  **Quick**: Minimal changes, speed optimized.
    2.  **Deep**: Deep tailoring using questionnaire.
    3.  **Scratch**: Build from structured profile.

> **⚠️ IMPORTANT LIMITATION**: While the backend supports all 3 modes, the API and UI currently **only trigger Quick Mode**. Review `docs/MISSING_MODES_CONTEXT.md` for details.

### 3. Realtime Flow (No Polling)

Replaced polling with **Supabase Realtime** for instant feedback:

1.  **Job Creation**: API returns `jobId` immediately (`status: pending`).
2.  **Subscription**: Frontend subscribes to `generation_jobs` changes via `useJobRealtime`.
3.  **Updates**: Backend helper `update_job_status` pushes changes (running -> succeeded/failed).
4.  **Reaction**: Frontend auto-navigates or updates UI based on push events.

### 4. PDF Compilation

Uses `latex-online.cc` to compile generated LaTeX into PDF.

- **Endpoint**: `/api/export-pdf`
- **Process**:
    1.  Check if PDF already exists (idempotency).
    2.  Send LaTeX to external compiler.
    3.  Upload result to Supabase Storage (`generated-pdfs/`).
    4.  Return signed URL (valid 10 mins).
- **Cost**: PDF compilation is free; credits are only deducted during LaTeX generation.

---

## Database Schema Changes

### `onboarding_drafts` (Updated)

Added soft-commit tracking columns:

- `resume_status`: 'temp' | 'final'
- `resume_uploaded_at`: Timestamp
- `resume_committed_at`: Timestamp

### `generation_jobs`

Now serves as the source of truth for Realtime updates:

- `status`: pending -> running -> succeeded/failed
- `latex_text`: Stores the raw generated LaTeX
- `pdf_object_path`: Stores path to compiled PDF (if exported)
- `error_message`: Stores failure reasons

### `saved_job_descriptions`

- Stores reusable JDs for quick generation
- `label`: User-defined name (required)
- `company`, `source_url`: Optional metadata
- `jd_text`: Full job description text (required)
- **Realtime**: Enabled for instant cross-tab sync

### `resume_versions`

- Stores user resume files with version management
- `label`, `file_name`, `file_type`: Resume metadata
- `object_path`: Supabase Storage path
- `resume_text`: Extracted text for AI processing
- `is_default`: Exactly one default per user (enforced via RPC)
- **Realtime**: Enabled for instant cross-tab sync
- **RPC**: `set_default_resume(p_resume_id)` for atomic default switching

---

## Current Implementation Status

### ✅ Implemented

- **Claude Integration**: Full backend logic for LaTeX generation.
- **Realtime System**: End-to-end WebSocket updates for generation and export.
- **Soft-Commit Upload**: Complete temp/final storage logic with progress UI.
- **PDF Export**: Working compilation pipeline via `latex-online.cc`.
- **Credit System**: Atomic decrements on generation success only.
- **Auth**: Full Google/Email auth flow with gate for export.
- **Dashboard**: Core features implemented (Home, Past Generations Library, Generate, Saved JDs, Resume Versions).

### 🚧 Missing / In Progress

- **Deep/Scratch Mode UI**: Frontend forms to collect extra inputs (Target Title, Skills, etc.) are missing.
- **API Mode Switching**: `/api/generate` is currently hardcoded to `mode: "quick"`.
- **Stripe**: Payment integration is not yet started.
- **Advanced Dashboard**: Download Center and Tags are pending.

---

_Last updated: 2026-02-02_

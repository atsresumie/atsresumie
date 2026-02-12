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
| Styling         | Tailwind CSS v4 + CSS Variables                    |
| UI Components   | shadcn/ui (49 primitives)                          |
| Database        | Supabase (PostgreSQL)                              |
| Storage         | Supabase Storage                                   |
| Auth            | **Supabase Auth** (Email/Password + Google OAuth)  |
| AI Model        | **Claude 3.5 Sonnet** (via Anthropic SDK)          |
| Realtime        | **Supabase Realtime** (WebSockets)                 |
| PDF Engine      | **latex-online.cc** (External Compilation Service) |
| Payments        | **Stripe** (Subscriptions + Checkout)              |
| Animation       | **Framer Motion** (for landing/onboarding)         |
| Package Manager | pnpm                                               |

---

## Directory Structure

```
atsresumie/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── analyze/       # ATS analysis endpoint
│   │   ├── credits/       # Get user credits
│   │   ├── export/        # Export endpoint
│   │   ├── export-pdf/    # PDF compilation proxy
│   │   ├── export-pdf-with-style/ # Styled PDF compilation
│   │   ├── feedback/      # User feedback submission
│   │   ├── generate/      # Create generation job (Claude)
│   │   ├── jobs/[id]/     # Job status & details
│   │   ├── onboarding/    # Anonymous session management
│   │   │   ├── claim/           # Claim session after signup
│   │   │   ├── commit-resume/   # Soft-commit resume
│   │   │   ├── delete-resume/   # Delete resume from storage
│   │   │   ├── resume-upload-url/ # Signed URL for upload
│   │   │   ├── save-draft/      # Save JD + resume metadata
│   │   │   └── session-status/  # Get session + draft data
│   │   ├── resumes/       # Resume management API
│   │   └── stripe/        # Stripe integration
│   │       ├── checkout/  # Create checkout session
│   │       └── webhook/   # Handle Stripe webhooks
│   │
│   ├── auth/              # Authentication routes
│   │   ├── callback/      # OAuth callback handler
│   │   └── verify-email/  # Email verification confirmation
│   │
│   ├── dashboard/         # User dashboard (protected)
│   │   ├── account/       # Account information page
│   │   ├── credits/       # Credits & billing page
│   │   ├── downloads/     # Download center
│   │   ├── editor/        # PDF Editor
│   │   │   └── [jobId]/   # Per-job editor page
│   │   ├── generate/      # Generate new resume
│   │   ├── generations/   # Past generations list
│   │   ├── profile/       # User profile page
│   │   ├── resumes/       # Resume versions management
│   │   ├── saved-jds/     # Saved job descriptions
│   │   ├── settings/      # User settings
│   │   ├── layout.tsx     # Dashboard layout (header + sidebar)
│   │   └── page.tsx       # Dashboard home
│   │
│   ├── get-started/       # Onboarding wizard (public)
│   ├── globals.css        # Design tokens & base styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   └── providers.tsx      # React context providers
│
├── providers/              # React context providers
│   └── CreditsProvider.tsx # Shared Realtime credits context
│
├── components/
│   ├── auth/              # Authentication components
│   ├── dashboard/         # Dashboard components
│   │   ├── generate/      # Generate page components
│   │   │   ├── JdQualityIndicator.tsx
│   │   │   ├── ModeSelector.tsx
│   │   │   ├── PastGenerationPicker.tsx
│   │   │   ├── QuickUploadModal.tsx
│   │   │   └── ResumeSelector.tsx
│   │   ├── generations/   # Generations list components
│   │   │   ├── DeleteJobDialog.tsx
│   │   │   ├── GenerationDetailsDrawer.tsx
│   │   │   ├── GenerationJobRow.tsx
│   │   │   └── GenerationsFilters.tsx
│   │   ├── resumes/       # Resume management components
│   │   ├── saved-jds/     # Saved JDs components
│   │   ├── CreditsCard.tsx
│   │   ├── DashboardHeader.tsx
│   │   ├── DashboardSidebar.tsx
│   │   ├── FeedbackModal.tsx
│   │   ├── QuickActionCard.tsx
│   │   ├── QuickActionsGrid.tsx
│   │   └── RecentGenerationsCard.tsx
│   │
│   ├── editor/            # PDF Editor components
│   │   ├── PdfJsPreview.tsx     # PDF.js renderer (scrollable + zoom)
│   │   ├── StyleControls.tsx    # Formatting sliders panel
│   │   ├── EditorLoadingState.tsx
│   │   └── EditorErrorState.tsx
│   │
│   ├── get-started/       # Onboarding wizard components
│   │   ├── hooks/         # useResumeForm
│   │   ├── steps/         # Step0, Step1, Step2 components
│   │   ├── AnimatedBackground.tsx
│   │   ├── ModeCards.tsx
│   │   ├── SidePanel.tsx
│   │   ├── SignupGateModal.tsx
│   │   ├── Stepper.tsx
│   │   └── TopNav.tsx
│   │
│   ├── landing/           # Landing page components
│   │   ├── BeforeAfter.tsx
│   │   ├── CTA.tsx
│   │   ├── FAQ.tsx
│   │   ├── Features.tsx
│   │   ├── Footer.tsx
│   │   ├── HeaderAuthControls.tsx
│   │   ├── Hero.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── Navbar.tsx
│   │   └── Pricing.tsx
│   │
│   ├── shared/            # Shared components
│   │   ├── CreditsPill.tsx
│   │   └── ProfileDropdown.tsx
│   │
│   └── ui/                # shadcn/ui components (49 files)
│       ├── button.tsx
│       ├── input.tsx
│       ├── dialog.tsx
│       ├── ... (46 more)
│
├── contexts/              # React contexts
│   └── AuthModalContext.tsx
│
├── hooks/                 # Global custom hooks
│   ├── useAuth.ts         # Auth state hook
│   ├── useAuthIntent.ts   # Auth intent preservation
│   ├── useCredits.ts      # Credits state with realtime
│   ├── useCreditHistory.ts # Credit history from generations
│   ├── useDownloads.ts    # Download center data
│   ├── useDraftJd.ts      # Autosave for Generate page
│   ├── useGenerations.ts  # Dashboard generations + realtime
│   ├── useJobPolling.ts   # Legacy polling (deprecated)
│   ├── useJobRealtime.ts  # Supabase Realtime subscription
│   ├── useProfile.ts      # User profile data
│   ├── usePurchaseHistory.ts # Stripe purchase history
│   ├── useRecentGenerations.ts # Dashboard home widget
│   ├── useResumeVersions.ts # Resume versions CRUD + realtime
│   ├── useSavedJds.ts     # Saved JDs CRUD + realtime
│   ├── useUserResume.ts   # Fetch user's latest resume
│   ├── use-mobile.tsx     # Mobile detection
│   └── use-toast.ts       # Toast notifications
│
├── lib/                   # Utility libraries
│   ├── ats/               # ATS-related utilities
│   ├── auth/              # Auth helpers
│   ├── jobs/              # Job-related utilities
│   ├── llm/               # AI Logic
│   │   ├── claudeLatex.ts # Claude integration & modes
│   │   └── prompts.ts     # Prompt templates
│   ├── onboarding/        # Onboarding helpers
│   │   └── client.ts      # Client-side API helpers (XHR upload)
│   ├── storage/           # Storage utilities
│   ├── stripe/            # Stripe helpers
│   ├── supabase/          # Supabase clients
│   │   ├── browser.ts     # Browser client
│   │   ├── server.ts      # Server client
│   │   └── middleware.ts  # Middleware client
│   ├── latex/             # LaTeX utilities
│   │   └── applyStyleToLatex.ts # Style injection + parsing
│   ├── utils/             # General helpers
│   └── utils.ts           # cn() utility
│
├── public/                # Static assets
│   └── logo.png
│
├── supabase/              # Supabase config & migrations
│   ├── functions/         # Edge Functions (Deno)
│   │   ├── enqueue-generation-job/   # User-facing fast job insert
│   │   ├── worker-generate-latex/    # Cron-triggered Claude worker
│   │   ├── worker-generate-pdf/      # Cron-triggered PDF compiler
│   │   └── process-generation-job/   # Legacy monolith (fallback)
│   └── migrations/        # SQL migrations
│       ├── 009_pipeline_split.sql    # Pipeline columns + RPCs
│       └── 010_cron_schedules.sql    # pg_cron + pg_net schedules
│
└── docs/                  # Documentation
    ├── AUTH.md
    ├── CANVAS.md           # PDF Editor architecture
    ├── CONTEXT.md          # (this file)
    ├── CORE_ENGINE.md
    ├── DASHBOARD.md
    ├── IMPLEMENTATIONS.md
    ├── ONBOARDING.md
    ├── PAYMENT.md
    └── WORKFLOW.md
```

---

## Core Features

### 1. Soft-Commit Resume Upload

Two-stage upload process to prevent orphan files:

- **Stage 1 (Temp)**: File uploaded to `temp/` folder on selection. Yellow badge.
- **Stage 2 (Final)**: File moved to `final/` folder on confirm. Green badge.
- **Progress**: XHR for real-time percentage and ETA.

### 2. Generation Pipeline (Split Architecture)

The generation pipeline is split into 3 decoupled Edge Functions:

```
Frontend → enqueue-generation-job → generation_jobs (queued)
                                         ↓
pg_cron (20s) → worker-generate-latex → Claude API → status=succeeded, pdf_status=queued
                                                          ↓
pg_cron (45s) → worker-generate-pdf → latexonline.cc → pdf_status=ready
```

| Function                 | Trigger                             | Responsibility                                                                       |
| ------------------------ | ----------------------------------- | ------------------------------------------------------------------------------------ |
| `enqueue-generation-job` | User request / `/api/generate` kick | JWT auth, validation, credit check, fast insert                                      |
| `worker-generate-latex`  | pg_cron (20s, batch 2)              | Claim jobs, call Claude, retry with exponential backoff, idempotent credit deduction |
| `worker-generate-pdf`    | pg_cron (45s, batch 3)              | Claim succeeded jobs, compile PDF via latexonline.cc, upload to Storage              |

**Key design decisions:**

- **Idempotent credit deduction**: `deduct_credit_once` RPC checks `credit_deducted_at` before deducting
- **Stale lock recovery**: Jobs stuck in `processing` > 10 min auto-reset (both in claim RPC and via dedicated cron job)
- **Exponential backoff**: 429/5xx errors backoff at `base × 2^attempt`, permanent fail after 3 attempts
- **Atomic claims**: `FOR UPDATE SKIP LOCKED` + `RETURNING` prevents concurrent workers from claiming the same job
- **Time budgets**: LaTeX worker 25s, PDF worker 50s — ensures completion within Deno function limits

### 3. Claude LaTeX Generation

Uses **Claude 3.5 Sonnet** to generate ATS-safe LaTeX code.

- **Engine**: `lib/llm/claudeLatex.ts`
- **Prompts**: `lib/llm/prompts.ts`
- **Modes**: Quick, Deep, From Scratch (all implemented)

### 4. Realtime System

Supabase Realtime replaces polling for instant updates:

1. Job created → `status: queued`
2. Frontend subscribes via `useJobRealtime` / `useGenerations`
3. Backend pushes updates (processing → succeeded/failed, pdf_status changes)
4. Frontend reacts immediately

**CreditsProvider** (`providers/CreditsProvider.tsx`): Wraps the entire dashboard layout so that all `useCredits()` consumers (header, sidebar, credits page, profile dropdown) share a **single Realtime channel** and always display the same value. Components outside the dashboard (e.g. landing page) fall back to their own independent subscription.

### 5. PDF Compilation

External compilation via `latex-online.cc`:

- **Background**: `worker-generate-pdf` Edge Function compiles and uploads automatically
- **On-demand fallback**: `/api/export-pdf` endpoint for manual download
- Uploads compiled PDF to Supabase Storage with upsert for idempotency
- Returns signed URL (10 min validity)
- Credits deducted during LaTeX generation, not PDF export

### 6. PDF Editor

Full-featured PDF styling editor at `/dashboard/editor/[jobId]`:

- **PDF.js Preview**: Scrollable all-pages view rendered to canvas, with zoom (50-300%)
- **HiDPI Rendering**: Canvas renders at `scale × devicePixelRatio` for crisp Retina output
- **Style Controls**: Font family, page size, margins, font size, line height, section spacing
- **Auto-Recompile**: Changes trigger PDF regeneration after 800ms debounce
- **Font Families**: Computer Modern, Latin Modern, Times New Roman, Palatino, Charter, Bookman, Helvetica
- **Initial Settings**: Parsed from existing LaTeX via `parseStyleFromLatex()`
- **Save on Download**: Styled LaTeX is saved to DB when user downloads
- **Layout**: Fixed viewport inside dashboard shell (`calc(100vh - header)`) — only PDF scrolls
- **LaTeX Injection**: Idempotent marker-based style block injection (`applyStyleToLatex()`)
- See `docs/CANVAS.md` for detailed architecture

### 7. Stripe Integration

Full subscription system:

- Monthly plan: $10/month for 75 credits
- Secure webhooks with signature verification
- Idempotent credit granting
- Promotion code support
- Purchase history tracking

---

## Current Design System

### Typography

- **Display**: Fraunces (serif) — headings
- **Body**: Inter (sans-serif) — UI text

### Color Palette

Warm dark theme with coffee/beige tones:

| Token      | Value                    |
| ---------- | ------------------------ |
| background | `hsl(24 28% 12%)`        |
| foreground | `hsl(36 30% 88%)`        |
| primary    | `hsl(20 30% 18%)`        |
| secondary  | `hsl(36 30% 85%)`        |
| accent     | `hsl(32 28% 66%)` (sand) |
| muted      | `hsl(24 20% 22%)`        |
| border     | `hsl(24 20% 25%)`        |

---

## Database Schema

### Key Tables

| Table                    | Purpose                                     |
| ------------------------ | ------------------------------------------- |
| `user_profiles`          | User data, credits, profile info            |
| `generation_jobs`        | Job status, LaTeX, PDF path, pipeline state |
| `saved_job_descriptions` | Reusable JDs                                |
| `resume_versions`        | User resume files with versions             |
| `onboarding_sessions`    | Anonymous session tracking                  |
| `onboarding_drafts`      | Draft data before signup                    |
| `credit_purchases`       | Stripe purchase records                     |

### Pipeline Columns (generation_jobs)

Added by migration `009_pipeline_split.sql`:

| Column                | Type          | Purpose                                                               |
| --------------------- | ------------- | --------------------------------------------------------------------- |
| `next_attempt_at`     | `TIMESTAMPTZ` | Backoff scheduling for LaTeX retries                                  |
| `last_error`          | `TEXT`        | Last error message for debugging                                      |
| `pdf_status`          | `TEXT`        | PDF pipeline state: `none`, `queued`, `processing`, `ready`, `failed` |
| `pdf_attempt_count`   | `INT`         | PDF compilation retry counter                                         |
| `pdf_next_attempt_at` | `TIMESTAMPTZ` | Backoff scheduling for PDF retries                                    |
| `pdf_last_error`      | `TEXT`        | Last PDF error for debugging                                          |
| `credit_deducted_at`  | `TIMESTAMPTZ` | Idempotency guard for credit deduction                                |

### Key RPCs

| RPC                         | Purpose                                                                 |
| --------------------------- | ----------------------------------------------------------------------- |
| `claim_next_generation_job` | Atomically claim queued job with backoff + stale lock recovery          |
| `claim_next_pdf_job`        | Claim succeeded job for PDF compilation                                 |
| `deduct_credit_once`        | Idempotent credit deduction (checks `credit_deducted_at`)               |
| `complete_job`              | Mark job succeeded/failed; auto-sets `pdf_status = 'queued'` on success |
| `recover_stale_locks`       | Reset jobs stuck in `processing` > 10 min                               |

### Storage Buckets

| Bucket           | Purpose                              |
| ---------------- | ------------------------------------ |
| `user-resumes`   | Onboarding flow (anonymous sessions) |
| `resumes`        | Dashboard resume versions            |
| `generated-pdfs` | Compiled PDF exports                 |

### Cron Schedules (pg_cron + pg_net)

| Job                   | Interval   | Action                                    |
| --------------------- | ---------- | ----------------------------------------- |
| `latex-pump`          | 20 seconds | POST to `worker-generate-latex` (batch 2) |
| `pdf-pump`            | 45 seconds | POST to `worker-generate-pdf` (batch 3)   |
| `stale-lock-recovery` | 5 minutes  | Reset stale `processing` jobs to `queued` |

---

## Implementation Status

### ✅ Fully Implemented

- Claude integration with all 3 generation modes
- Realtime system (WebSocket updates)
- Soft-commit resume upload with progress
- PDF export pipeline
- **Split generation pipeline** (3 Edge Functions + cron)
- Credit system with atomic decrements + idempotent deduction
- **CreditsProvider** for synced Realtime credits across all dashboard components
- Google/Email auth with gate for export
- Complete dashboard:
    - Home with quick actions
    - Generate with mode/resume selection
    - Past Generations with filters/drawer (PDF preparing/failed states)
    - Saved JDs library
    - Resume Versions with duplicate detection
    - Download Center
    - Credits & Billing (conditional buy button based on purchase history)
    - Profile/Settings/Account
    - PDF Editor with live preview
- Stripe monthly subscription
- Auth intent preservation
- User feedback submission
- Conditional sidebar upgrade button (hidden when user has credits + purchase history)

### 🚧 In Progress

- Subscription renewals (`invoice.paid` webhook)
- Subscription management (customer portal)

---

## Development Scripts

| Script               | Description                             |
| -------------------- | --------------------------------------- |
| `pnpm dev`           | Start Next.js + Stripe webhook listener |
| `pnpm dev:next`      | Start Next.js only (with Turbopack)     |
| `pnpm stripe:listen` | Start Stripe webhook listener only      |
| `pnpm build`         | Production build                        |
| `pnpm start`         | Start production server                 |
| `pnpm lint`          | Run ESLint                              |

---

_Last updated: 2026-02-11_

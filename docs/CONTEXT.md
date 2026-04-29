# ATSResumie - Codebase Context

> This document provides comprehensive context about the ATSResumie codebase for LLM assistance.

---

## Project Overview

**ATSResumie** is a Next.js 16 application that helps users optimize their resumes for Applicant Tracking Systems (ATS). Users can:

1. Paste a job description
2. Upload their resume (PDF/DOCX) or import from LinkedIn
3. Get AI-powered analysis and suggestions
4. Download an optimized PDF or DOCX (after signup)
5. Track job applications with a Kanban board
6. Browse and discover job postings
7. Check ATS compatibility scores with detailed keyword analysis
8. Use AI chat-edit to make targeted changes to their resume in the canvas editor

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
| PDF Engine      | **latex-backend** (self-hosted) + `latex-online.cc` (fallback) |
| DOCX Export     | **CloudConvert** (PDF → DOCX conversion)           |
| Payments        | **Stripe** (Subscriptions + Checkout)              |
| Email           | **Resend** (Transactional emails + Edge Function)  |
| Animation       | **Framer Motion** (for landing/onboarding)         |
| Analytics       | **Google Analytics** + **Vercel Analytics**        |
| LinkedIn Import | **Apify** (LinkedIn profile scraping)              |
| Job Scraping    | **Apify** (Job posting scraping)                   |
| Package Manager | pnpm                                               |

---

## Directory Structure

```
atsresumie/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── admin/         # Admin panel API
│   │   │   ├── check/           # Admin role check
│   │   │   ├── credits/         # Admin credit adjustments
│   │   │   ├── email/           # Admin email sending
│   │   │   ├── generations/     # Admin generation stats
│   │   │   ├── overview/        # Admin dashboard overview
│   │   │   └── users/           # Admin user management
│   │   ├── analyze/       # ATS analysis endpoint
│   │   ├── ats-check/     # ATS score check (targeted, with JD)
│   │   ├── ats-scans/     # ATS scan history CRUD
│   │   ├── ats-score/     # ATS score (general, no JD)
│   │   ├── chat-edit/     # AI chat-edit streaming endpoint
│   │   ├── credits/       # Get user credits
│   │   ├── export/        # Export endpoint
│   │   ├── export-docx/   # DOCX export (CloudConvert)
│   │   ├── export-pdf/    # PDF compilation proxy
│   │   ├── export-pdf-with-style/ # Styled PDF compilation
│   │   ├── feedback/      # User feedback submission
│   │   ├── generate/      # Create generation job (Claude)
│   │   ├── jobs/[id]/     # Job status & details
│   │   ├── jobs/scrape/   # Job posting scraper (Apify)
│   │   ├── linkedin/      # LinkedIn profile import
│   │   │   └── profile/         # Import via Apify
│   │   ├── onboarding/    # Anonymous session management
│   │   │   ├── claim/           # Claim session after signup
│   │   │   ├── commit-resume/   # Soft-commit resume
│   │   │   ├── delete-resume/   # Delete resume from storage
│   │   │   ├── resume-upload-url/ # Signed URL for upload
│   │   │   ├── save-draft/      # Save JD + resume metadata
│   │   │   └── session-status/  # Get session + draft data
│   │   ├── resumes/       # Resume management API
│   │   ├── send-welcome-email/ # Welcome email via Resend
│   │   └── stripe/        # Stripe integration
│   │       ├── checkout/  # Create checkout session
│   │       ├── portal/    # Stripe Customer Portal session
│   │       └── webhook/   # Handle Stripe webhooks
│   │
│   ├── auth/              # Authentication routes
│   │   ├── callback/      # OAuth callback handler
│   │   ├── login/         # Dedicated sign-in page
│   │   ├── signup/        # Dedicated sign-up page
│   │   └── verify-email/  # Email verification confirmation
│   │
│   ├── dashboard/         # User dashboard (protected)
│   │   ├── account/       # Account information page
│   │   ├── admin/         # Admin panel (role-gated)
│   │   ├── applications/  # Job application tracker (Kanban board)
│   │   ├── ats-checker/   # ATS score checker
│   │   ├── ats-scans/     # ATS scan history
│   │   ├── credits/       # Credits & billing page
│   │   ├── downloads/     # Download center
│   │   ├── editor/        # PDF Editor
│   │   │   └── [jobId]/   # Per-job editor page
│   │   ├── generate/      # Tailor Resume
│   │   ├── generations/   # Saved Jobs (past generations)
│   │   ├── job-search/    # Job search & discovery
│   │   ├── profile/       # User profile page
│   │   ├── resumes/       # My Resumes (resume versions)
│   │   ├── saved-jds/     # Saved job descriptions
│   │   ├── settings/      # User settings
│   │   ├── layout.tsx     # Dashboard layout (sidebar-only, no header)
│   │   └── page.tsx       # Dashboard home
│   │
│   ├── get-started/       # Onboarding wizard (public)
│   │
│   ├── # SEO Content Pages (static, public)
│   ├── chatgpt-resume-prompt-alternative/
│   ├── examples/
│   ├── how-it-works/
│   ├── resume-tailor-job-description/
│   │
│   ├── privacy/           # Privacy Policy
│   ├── terms/             # Terms of Service
│   │
│   ├── globals.css        # Design tokens & base styles
│   ├── layout.tsx         # Root layout (fonts, analytics, JSON-LD)
│   ├── page.tsx           # Landing page
│   ├── providers.tsx      # React context providers
│   ├── robots.ts          # robots.txt generation
│   └── sitemap.ts         # sitemap.xml generation
│
├── providers/              # React context providers
│   ├── CreditsProvider.tsx # Shared Realtime credits context
│   └── SidebarProvider.tsx # Mobile sidebar open/close state
│
├── components/
│   ├── NavLink.tsx
│   │
│   ├── admin/             # Admin panel components
│   │
│   ├── ats/               # ATS visualization components
│   │   ├── AtsRing.tsx          # ATS score ring
│   │   └── KeywordBars.tsx      # Keyword match bars
│   │
│   ├── auth/              # Authentication components
│   │   └── AuthModal.tsx
│   │
│   ├── content/           # SEO content page components
│   │
│   ├── dashboard/         # Dashboard components
│   │   ├── applications/  # Job application tracker
│   │   │   ├── ApplicationBoard.tsx
│   │   │   ├── ApplicationDetailModal.tsx
│   │   │   ├── ApplicationModal.tsx
│   │   │   └── DeleteApplicationDialog.tsx
│   │   ├── generate/      # Generate page components
│   │   ├── generations/   # Generations list components
│   │   ├── home/          # Dashboard home components
│   │   ├── resumes/       # Resume management components
│   │   │   ├── ResumePreviewCard.tsx  # Resume card with zoom + tailor CTA
│   │   │   └── ViewResumeTextModal.tsx
│   │   ├── saved-jds/     # Saved JDs components
│   │   ├── DashboardSidebar.tsx  # Brown-themed sidebar, mobile drawer
│   │   ├── ExportModal.tsx
│   │   ├── FeedbackModal.tsx
│   │   └── ...
│   │
│   ├── editor/            # PDF Editor components
│   │   ├── ChatPanel.tsx          # AI chat-edit UI
│   │   ├── EditorControls.tsx     # Editor toolbar
│   │   ├── EditorErrorState.tsx
│   │   ├── EditorLeftRail.tsx     # Left rail containing ChatPanel
│   │   ├── EditorLoadingState.tsx
│   │   ├── PdfJsPreview.tsx       # PDF.js renderer (scrollable + zoom)
│   │   ├── ResumeContent.tsx
│   │   ├── ResumeEditorShell.tsx
│   │   ├── ResumePreview.tsx
│   │   └── StyleControls.tsx
│   │
│   ├── get-started/       # Onboarding wizard components
│   ├── landing/           # Landing page components
│   ├── legal/             # Legal page components
│   └── shared/            # Shared components
│
├── hooks/                 # Global custom hooks
│   ├── useAuth.ts
│   ├── useAuthIntent.ts
│   ├── useAtsScans.ts     # ATS scan history with Realtime
│   ├── useAtsScores.ts    # ATS scores per resume version (cached)
│   ├── useChatEdit.ts     # Chat-based LaTeX editing in canvas
│   ├── useCredits.ts
│   ├── useCreditHistory.ts
│   ├── useDownloads.ts
│   ├── useDraftJd.ts
│   ├── useExportModal.ts
│   ├── useGenerations.ts
│   ├── useJobApplications.ts  # Job application CRUD + realtime
│   ├── useJobPolling.ts   # Legacy (deprecated)
│   ├── useJobRealtime.ts
│   ├── useProfile.ts
│   ├── usePurchaseHistory.ts
│   ├── useBilling.ts
│   ├── useRecentGenerations.ts
│   ├── useResumeVersions.ts
│   ├── useSavedJds.ts
│   ├── useUserResume.ts
│   ├── use-mobile.tsx
│   └── use-toast.ts
│
├── lib/                   # Utility libraries
│   ├── admin/             # Admin utilities
│   ├── ats/               # ATS-related utilities
│   ├── auth/              # Auth helpers
│   ├── editor/            # Editor utilities
│   ├── export/
│   │   └── latexToPlainText.ts
│   ├── jobs/              # Job-related utilities
│   ├── llm/               # AI Logic
│   │   ├── claudeLatex.ts     # Claude integration for LaTeX generation
│   │   ├── claudeChatEdit.ts  # Claude streaming for chat-edit
│   │   └── prompts.ts         # Prompt templates
│   ├── latex/             # LaTeX utilities
│   │   ├── applyStyleToLatex.ts  # Style injection + parsing
│   │   └── sanitizeLatex.ts      # Package sanitization before compile
│   ├── onboarding/
│   ├── storage/
│   ├── stripe/
│   ├── supabase/
│   └── utils/
│
├── types/
│   ├── chat.ts            # ChatMessage, ChatRole, ChatStatus + storage keys
│   └── editor.ts          # StyleConfig, LaTeXFontFamily
│
├── supabase/
│   ├── functions/         # Edge Functions (Deno)
│   │   ├── enqueue-generation-job/
│   │   ├── worker-generate-latex/
│   │   ├── worker-generate-pdf/
│   │   ├── process-generation-job/
│   │   └── resend/
│   └── migrations/
│       ├── 20260304054626_remote_schema.sql
│       ├── 20260304060000_welcome_email_flag.sql
│       ├── 20260305000000_admin_tables.sql
│       ├── 20260315000000_job_applications.sql
│       ├── 20260326000000_replace_screening_with_rejected.sql
│       ├── 20260422000000_ats_scans.sql
│       ├── 20260427000000_editor_snapshot.sql
│       └── 20260428000000_add_ats_score_cache.sql
│
└── docs/                  # Documentation
    ├── AUTH.md
    ├── CANVAS.md           # PDF Editor + chat-edit architecture
    ├── CONTEXT.md          # (this file)
    ├── CORE_ENGINE.md
    ├── DASHBOARD.md
    ├── IMPLEMENTATIONS.md
    ├── MICROSERVICE.md     # Backend microservices (latex-backend + ATS_Score)
    ├── ONBOARDING.md
    ├── PAYMENT.md
    └── WORKFLOW.md
```

---

## Core Features

### 1. Soft-Commit Resume Upload

Two-stage upload process to prevent orphan files:

- **Stage 1 (Temp)**: File uploaded to `temp/` folder on selection.
- **Stage 2 (Final)**: File moved to `final/` folder on confirm.
- **Progress**: XHR for real-time percentage and ETA.

### 2. Generation Pipeline (Split Architecture)

```
Frontend → enqueue-generation-job → generation_jobs (queued)
                                         ↓
pg_cron (20s) → worker-generate-latex → Claude API → status=succeeded, pdf_status=queued
                                                          ↓
pg_cron (45s) → worker-generate-pdf → latex-backend / latexonline.cc → pdf_status=ready
```

| Function                 | Trigger            | Responsibility                                               |
| ------------------------ | ------------------ | ------------------------------------------------------------ |
| `enqueue-generation-job` | User request       | JWT auth, validation, credit check, fast insert              |
| `worker-generate-latex`  | pg_cron (20s)      | Claim jobs, call Claude, retry with backoff, idempotent deduction |
| `worker-generate-pdf`    | pg_cron (45s)      | Claim succeeded jobs, compile PDF, upload to Storage         |

### 3. Claude LaTeX Generation

- **Engine**: `lib/llm/claudeLatex.ts`
- **Prompts**: `lib/llm/prompts.ts`
- **Modes**: Quick, Deep, From Scratch

### 4. AI Chat-Edit

Allows users to make targeted LaTeX modifications via natural language inside the canvas editor.

- **Frontend**: `ChatPanel` + `EditorLeftRail` + `useChatEdit` hook
- **Backend**: `/api/chat-edit` streams a Claude response via `claudeChatEdit.ts`
- **Flow**: User sends instruction → Claude returns modified LaTeX → recompile → PDF updates
- **Persistence**: Final LaTeX + PDF URL saved to `generation_jobs` (columns added by `20260427000000_editor_snapshot.sql`)
- **History**: Stored in `localStorage` per jobId, capped at `CHAT_HISTORY_MAX_TURNS`

### 5. ATS Checker & Scan History

- **Checker page**: `/dashboard/ats-checker` — score any resume against a JD
- **API endpoints**: `/api/ats-check` (targeted), `/api/ats-score` (general), `/api/ats-scans` (history CRUD)
- **Score caching**: ATS scores persisted to `resume_versions` (migration `20260428000000_add_ats_score_cache.sql`) via `useAtsScores` hook — avoids re-fetching
- **Scan history**: `/dashboard/ats-scans` — expandable rows with full breakdown, score coloring
- **Visualizations**: `AtsRing` (score ring) + `KeywordBars` (keyword match bars)

### 6. LinkedIn Profile Import

- **API**: `/api/linkedin/profile` scrapes a LinkedIn URL via Apify
- **Flow**: Maps profile fields (experience, education, skills) to the resume generation form
- **UX**: Surfaced as an import option on the Tailor Resume page

### 7. Job Application Tracker

Kanban-style tracker at `/dashboard/applications`.

- **Stages**: Saved → Applied → Interview → Offer → Rejected
- **Hook**: `useJobApplications.ts` — CRUD + Supabase Realtime
- **Database**: `job_applications` table (migration `20260315000000_job_applications.sql`)
- **Stage migration**: `screening` → `rejected` (migration `20260326000000_replace_screening_with_rejected.sql`)

### 8. Job Scraping

- **API**: `/api/jobs/scrape` — scrapes job postings via Apify and populates the job discovery page

### 9. PDF Compilation

Primary: **latex-backend** (self-hosted Express + TeX Live microservice)
Fallback: `latex-online.cc`

- **LaTeX sanitization**: `sanitizeLatex.ts` auto-injects missing packages and strips incompatible ones before every compile
- **Background**: `worker-generate-pdf` Edge Function compiles automatically
- **On-demand**: `/api/export-pdf` for manual download
- PDF uploaded to Supabase Storage with upsert for idempotency

See `docs/MICROSERVICE.md` for full latex-backend documentation.

### 10. DOCX Export

- **Step 1**: Compile LaTeX → PDF via latex-backend
- **Step 2**: Convert PDF → DOCX via CloudConvert
- **Endpoint**: `/api/export-docx`

### 11. PDF Editor

Full-featured editor at `/dashboard/editor/[jobId]`. See `docs/CANVAS.md` for full architecture.

- PDF.js preview, style controls, AI chat-edit panel, final PDF snapshot hydration

### 12. Stripe Integration

- Monthly plan: $10/month for 50 credits
- Secure webhooks with signature verification, idempotent credit granting
- Stripe Customer Portal for billing management

### 13. Admin Panel

Role-gated at `/dashboard/admin/`. See CONTEXT.md § Admin Panel above.

### 14. Dashboard Layout

Sidebar-only layout (no top header bar):

- **Layout**: `app/dashboard/layout.tsx` — wraps with `CreditsProvider` + `SidebarProvider`
- **Sidebar**: `DashboardSidebar.tsx` — brown `#805F4E` background, white text
- **Mobile**: Collapsible drawer via `SidebarProvider` context

**Sidebar nav links:**

| Label           | Route                       |
| --------------- | --------------------------- |
| Dashboard       | `/dashboard`                |
| Browse Jobs     | `/dashboard/job-search`     |
| My Applications | `/dashboard/applications`   |
| My Resumes      | `/dashboard/resumes`        |
| Tailor Resume   | `/dashboard/generate`       |
| Saved Jobs      | `/dashboard/generations`    |
| ATS Checker     | `/dashboard/ats-checker`    |
| Settings        | `/dashboard/settings`       |

### 15. Landing Page

Full redesign aligned to Figma white theme:

- Hero, Problem/Solution, TrustBar, Features, HowItWorks, BeforeAfter, ATSScore showcase, JobTracker showcase, JobDiscovery showcase, PlatformPreview, TemplateSelector, Pricing, FAQ, CTA, Footer, Navbar
- Unified `ATSResumie` branding across all navbars

---

## Current Design System

### Color Palette

Warm light theme. **All colors are centralized in `globals.css` — zero hardcoded hex values in components.**

| Token               | Value             | Purpose                      |
| ------------------- | ----------------- | ---------------------------- |
| `--surface-base`    | `#E5D5BE`         | Main background              |
| `--surface-raised`  | `#f0e6d4`         | Cards, panels                |
| `--surface-inset`   | `#d9c8ae`         | Pressed/recessed areas       |
| `--text-primary`    | `#654844`         | Main text                    |
| `--text-secondary`  | `#8a6f6a`         | Captions, labels             |
| `--text-tertiary`   | `#b09a94`         | Placeholders, disabled       |
| `--cta`             | `#654844`         | CTA button background        |
| `--cta-hover`       | `#7a5a55`         | CTA hover state              |
| `--border-visible`  | `#c4b198`         | Card outlines, inputs        |
| `--accent`          | `hsl(12 72% 42%)` | Primary accent (terracotta)  |

**Sidebar background**: `#805F4E` (brown) with white text — hardcoded in `DashboardSidebar.tsx` by design.

---

## Database Schema

### Key Tables

| Table                    | Purpose                                                         |
| ------------------------ | --------------------------------------------------------------- |
| `user_profiles`          | User data, credits, profile, subscription, welcome email flag   |
| `generation_jobs`        | Job status, LaTeX, PDF path, final snapshot, pipeline state     |
| `saved_job_descriptions` | Reusable JDs                                                    |
| `resume_versions`        | User resume files + ATS score cache                             |
| `onboarding_sessions`    | Anonymous session tracking                                      |
| `onboarding_drafts`      | Draft data before signup                                        |
| `credit_purchases`       | Stripe purchase records                                         |
| `admin_action_logs`      | Admin action audit trail                                        |
| `job_applications`       | Job application tracker (Kanban board)                          |
| `ats_scans`              | ATS scan history per user                                       |

### Pipeline Columns (generation_jobs)

| Column                | Type          | Purpose                                    |
| --------------------- | ------------- | ------------------------------------------ |
| `pdf_status`          | TEXT          | `none`, `queued`, `processing`, `ready`, `failed` |
| `credit_deducted_at`  | TIMESTAMPTZ   | Idempotency guard                          |
| `final_latex_text`    | TEXT          | Saved after chat-edit                      |
| `final_pdf_url`       | TEXT          | Saved after chat-edit, hydrated on load    |

### ATS Score Cache (resume_versions)

Added by migration `20260428000000_add_ats_score_cache.sql`. Persists the last ATS score and result JSON per resume version to avoid re-fetching.

### Migrations (in order)

| Migration File                                         | Purpose                                    |
| ------------------------------------------------------ | ------------------------------------------ |
| `20260304054626_remote_schema.sql`                     | Full remote schema snapshot                |
| `20260304060000_welcome_email_flag.sql`                | `welcome_email_sent` column                |
| `20260305000000_admin_tables.sql`                      | Admin action logs table + RLS              |
| `20260315000000_job_applications.sql`                  | Job applications table + RLS + Realtime    |
| `20260326000000_replace_screening_with_rejected.sql`   | Rename `screening` stage → `rejected`      |
| `20260422000000_ats_scans.sql`                         | ATS scan history table                     |
| `20260427000000_editor_snapshot.sql`                   | `final_latex_text` + `final_pdf_url` columns |
| `20260428000000_add_ats_score_cache.sql`               | ATS score cache on `resume_versions`       |

### Key RPCs

| RPC                         | Purpose                                                      |
| --------------------------- | ------------------------------------------------------------ |
| `claim_next_generation_job` | Atomically claim queued job with backoff + stale lock recovery |
| `claim_next_pdf_job`        | Claim succeeded job for PDF compilation                      |
| `deduct_credit_once`        | Idempotent credit deduction                                  |
| `complete_job`              | Mark job succeeded/failed; auto-sets `pdf_status = 'queued'` |
| `recover_stale_locks`       | Reset jobs stuck in `processing` > 10 min                   |

### Storage Buckets

| Bucket           | Purpose                              |
| ---------------- | ------------------------------------ |
| `user-resumes`   | Onboarding flow (anonymous sessions) |
| `resumes`        | Dashboard resume versions            |
| `generated-pdfs` | Compiled PDF exports                 |

### Cron Schedules

| Job                   | Interval   | Action                                    |
| --------------------- | ---------- | ----------------------------------------- |
| `latex-pump`          | 20 seconds | POST to `worker-generate-latex` (batch 2) |
| `pdf-pump`            | 45 seconds | POST to `worker-generate-pdf` (batch 3)   |
| `stale-lock-recovery` | 5 minutes  | Reset stale `processing` jobs to `queued` |

---

## Implementation Status

### ✅ Fully Implemented

- Claude integration with all 3 generation modes
- AI chat-edit in canvas editor (`ChatPanel` + `useChatEdit` + `/api/chat-edit`)
- Realtime system (WebSocket updates across all surfaces)
- Soft-commit resume upload with progress
- PDF export pipeline (latex-backend primary, latex-online.cc fallback)
- LaTeX sanitization before every compile
- DOCX export (CloudConvert)
- Split generation pipeline (3 Edge Functions + cron)
- Credit system with atomic decrements + idempotent deduction
- CreditsProvider for synced Realtime credits
- Google/Email auth with dedicated pages (`/auth/login`, `/auth/signup`)
- Dashboard (sidebar-only layout, mobile drawer via SidebarProvider):
  - Home with quick actions
  - Tailor Resume with mode/resume selection + LinkedIn import
  - Saved Jobs (past generations) with filters/drawer
  - Saved JDs library
  - My Resumes with card grid + ResumePreviewCard + zoom
  - Download Center
  - Credits & Billing (Stripe portal)
  - Profile/Settings/Account
  - PDF Editor (style controls + AI chat-edit + final snapshot persistence)
  - Job Application Tracker (Kanban, `rejected` stage)
  - ATS Checker (score + keyword analysis + score caching)
  - ATS Scan History
- LinkedIn profile import (Apify)
- Job posting scraping (`/api/jobs/scrape`)
- Admin Panel (role-gated)
- Stripe monthly subscription + Billing Management
- Auth intent preservation
- Welcome email (Resend, deduplication)
- SEO content pages + infrastructure (robots.txt, sitemap.xml, JSON-LD, OG)
- Legal pages (Privacy Policy + Terms of Service)
- Analytics (Google Analytics + Vercel Analytics)
- PWA manifest
- Full landing page redesign (Figma white theme)
- Mobile-responsive dashboard + editor

### 🚧 Under Development

| Feature                    | Route                    | Description                             |
| -------------------------- | ------------------------ | --------------------------------------- |
| **Browse Jobs / Discovery**| `/dashboard/job-search`  | Browse and filter scraped job postings  |

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

## Environment Variables

See `.env.example` for the full list. Key variables:

| Variable                         | Purpose                              |
| -------------------------------- | ------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`       | Supabase project URL                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | Supabase anonymous key               |
| `SUPABASE_SERVICE_ROLE_KEY`      | Supabase service role key            |
| `ANTHROPIC_API_KEY`              | Claude API key                       |
| `STRIPE_SECRET_KEY`              | Stripe secret key                    |
| `STRIPE_WEBHOOK_SECRET`          | Stripe webhook signing secret        |
| `STRIPE_PRICE_ID`                | Stripe price ID for subscription     |
| `RESEND_API_KEY`                 | Resend email API key                 |
| `CLOUDCONVERT_API_KEY`           | CloudConvert API key (DOCX)          |
| `NEXT_PUBLIC_BASE_URL`           | Application base URL                 |
| `LATEX_BACKEND_URL`              | URL of self-hosted latex-backend     |
| `APIFY_API_KEY`                  | Apify API key (LinkedIn + job scraping) |

---

_Last updated: 2026-04-29_

# ATSResumie - Codebase Context

> This document provides comprehensive context about the ATSResumie codebase for LLM assistance.

---

## Project Overview

**ATSResumie** is a Next.js 16 application that helps users optimize their resumes for Applicant Tracking Systems (ATS). Users can:

1. Paste a job description
2. Upload their resume (PDF/DOCX)
3. Get AI-powered analysis and suggestions
4. Download an optimized PDF or DOCX (after signup)
5. Track job applications with a Kanban board
6. Browse and discover job postings
7. Check ATS compatibility scores

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
| DOCX Export     | **CloudConvert** (PDF → DOCX conversion)           |
| Payments        | **Stripe** (Subscriptions + Checkout)              |
| Email           | **Resend** (Transactional emails + Edge Function)  |
| Animation       | **Framer Motion** (for landing/onboarding)         |
| Analytics       | **Google Analytics** + **Vercel Analytics**        |
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
│   │   ├── credits/       # Get user credits
│   │   ├── export/        # Export endpoint
│   │   ├── export-docx/   # DOCX export (CloudConvert)
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
│   │   ├── ats-checker/   # ATS score checker (under development)
│   │   ├── credits/       # Credits & billing page
│   │   ├── downloads/     # Download center
│   │   ├── editor/        # PDF Editor
│   │   │   └── [jobId]/   # Per-job editor page
│   │   ├── generate/      # Generate new resume
│   │   ├── generations/   # Past generations list
│   │   ├── job-search/    # Job search & discovery (under development)
│   │   ├── profile/       # User profile page
│   │   ├── resumes/       # Resume versions management
│   │   ├── saved-jds/     # Saved job descriptions
│   │   ├── settings/      # User settings
│   │   ├── layout.tsx     # Dashboard layout (sidebar-only, no header)
│   │   └── page.tsx       # Dashboard home
│   │
│   ├── get-started/       # Onboarding wizard (public)
│   │
│   ├── # SEO Content Pages (static, public)
│   ├── chatgpt-resume-prompt-alternative/  # SEO content page
│   ├── examples/                           # SEO content page
│   ├── how-it-works/                       # SEO content page
│   ├── resume-tailor-job-description/      # SEO content page
│   │
│   ├── # Legal Pages
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
│   └── CreditsProvider.tsx # Shared Realtime credits context
│
├── components/
│   ├── NavLink.tsx        # Navigation link primitive
│   │
│   ├── admin/             # Admin panel components
│   │   ├── AdminAccessDenied.tsx
│   │   ├── AdminSidebar.tsx
│   │   ├── CreditAdjustDialog.tsx
│   │   ├── EmailSendDialog.tsx
│   │   └── OverviewMetrics.tsx
│   │
│   ├── ats/               # ATS visualization components
│   │   ├── AtsRing.tsx          # ATS score ring
│   │   └── KeywordBars.tsx      # Keyword match bars
│   │
│   ├── auth/              # Authentication components
│   │   └── AuthModal.tsx        # Auth modal (login/signup)
│   │
│   ├── content/           # SEO content page components
│   │   ├── ContentPageLayout.tsx  # Reusable content layout with TOC
│   │   ├── Schema.tsx             # JSON-LD schema injection
│   │   └── contentPages.tsx       # Content definitions for all SEO pages
│   │
│   ├── dashboard/         # Dashboard components
│   │   ├── applications/  # Job application tracker components
│   │   │   ├── ApplicationBoard.tsx         # Kanban board view
│   │   │   ├── ApplicationDetailModal.tsx   # Application detail view
│   │   │   ├── ApplicationModal.tsx         # Add/edit application modal
│   │   │   └── DeleteApplicationDialog.tsx  # Delete confirmation dialog
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
│   │   ├── home/          # Dashboard home components
│   │   ├── resumes/       # Resume management components
│   │   ├── saved-jds/     # Saved JDs components
│   │   ├── CreditsCard.tsx
│   │   ├── DashboardHeader.tsx
│   │   ├── DashboardSidebar.tsx
│   │   ├── ExportModal.tsx       # PDF/DOCX export modal
│   │   ├── FeedbackModal.tsx
│   │   ├── QuickActionCard.tsx
│   │   ├── QuickActionsGrid.tsx
│   │   └── RecentGenerationsCard.tsx
│   │
│   ├── editor/            # PDF Editor components
│   │   ├── EditorControls.tsx     # Editor toolbar
│   │   ├── EditorErrorState.tsx
│   │   ├── EditorLoadingState.tsx
│   │   ├── PdfJsPreview.tsx       # PDF.js renderer (scrollable + zoom)
│   │   ├── ResumeContent.tsx      # Resume content display
│   │   ├── ResumeEditorShell.tsx  # Editor layout shell
│   │   ├── ResumePreview.tsx      # Resume preview wrapper
│   │   └── StyleControls.tsx      # Formatting sliders panel
│   │
│   ├── get-started/       # Onboarding wizard components
│   │   ├── hooks/         # useResumeForm
│   │   ├── steps/         # Step0, Step1, Step2 components
│   │   ├── types.ts       # Onboarding type definitions
│   │   ├── AnimatedBackground.tsx
│   │   ├── ModeCards.tsx
│   │   ├── SidePanel.tsx
│   │   ├── SignupGateModal.tsx
│   │   ├── Stepper.tsx
│   │   ├── SuccessModal.tsx
│   │   └── TopNav.tsx
│   │
│   ├── landing/           # Landing page components
│   │   ├── ATSScore.tsx           # ATS score showcase section
│   │   ├── BeforeAfter.tsx
│   │   ├── CTA.tsx
│   │   ├── FAQ.tsx
│   │   ├── Features.tsx
│   │   ├── Footer.tsx
│   │   ├── HeaderAuthControls.tsx
│   │   ├── Hero.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── JobDiscovery.tsx       # Job discovery showcase section
│   │   ├── JobTracker.tsx         # Job tracker showcase section
│   │   ├── Navbar.tsx
│   │   ├── PlatformPreview.tsx    # Platform preview section
│   │   ├── Pricing.tsx
│   │   ├── Problem.tsx           # Problem statement section
│   │   ├── TemplateSelector.tsx   # Template selector showcase section
│   │   └── TrustBar.tsx          # Trust/social-proof bar
│   │
│   ├── legal/             # Legal page components
│   │   ├── LegalLayout.tsx      # Shared legal page layout
│   │   └── legalContent.tsx     # Privacy & terms content
│   │
│   ├── shared/            # Shared components
│   │   ├── CreditsPill.tsx
│   │   ├── EmptyState.tsx       # Reusable empty-state placeholder
│   │   ├── ErrorState.tsx       # Reusable error-state display
│   │   ├── JobStatusBadge.tsx   # Job status badge component
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
│   ├── useExportModal.ts  # Export modal state (PDF/DOCX)
│   ├── useGenerations.ts  # Dashboard generations + realtime
│   ├── useJobApplications.ts # Job application CRUD + realtime
│   ├── useJobPolling.ts   # Legacy polling (deprecated)
│   ├── useJobRealtime.ts  # Supabase Realtime subscription
│   ├── useProfile.ts      # User profile data
│   ├── usePurchaseHistory.ts # Stripe purchase history
│   ├── useBilling.ts      # Subscription billing state
│   ├── useRecentGenerations.ts # Dashboard home widget
│   ├── useResumeVersions.ts # Resume versions CRUD + realtime
│   ├── useSavedJds.ts     # Saved JDs CRUD + realtime
│   ├── useUserResume.ts   # Fetch user's latest resume
│   ├── use-mobile.tsx     # Mobile detection
│   └── use-toast.ts       # Toast notifications
│
├── lib/                   # Utility libraries
│   ├── admin/             # Admin panel utilities
│   │   ├── email-templates.ts # Admin email HTML templates
│   │   ├── guard.ts           # Admin role authorization guard
│   │   ├── rate-limit.ts      # Admin API rate limiting
│   │   └── schemas.ts         # Admin API Zod schemas
│   ├── ats/               # ATS-related utilities
│   ├── auth/              # Auth helpers
│   ├── editor/            # Editor utilities
│   ├── export/            # Export utilities
│   │   └── latexToPlainText.ts # LaTeX → plain text conversion
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
│   │   ├── hash.ts        # Hashing utility
│   │   └── sanitize.ts    # Input sanitization
│   └── utils.ts           # cn() utility
│
├── types/                 # TypeScript type definitions
│   └── editor.ts          # Editor-related types
│
├── styles/                # Additional stylesheets
│   └── latex-resume.css   # LaTeX resume preview styles
│
├── public/                # Static assets
│   ├── logo3.png
│   ├── pdf.worker.min.mjs       # PDF.js worker (auto-copied)
│   ├── site.webmanifest          # PWA manifest
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── apple-touch-icon.png
│   ├── android-chrome-192x192.png
│   └── android-chrome-512x512.png
│
├── supabase/              # Supabase config & migrations
│   ├── functions/         # Edge Functions (Deno)
│   │   ├── enqueue-generation-job/   # User-facing fast job insert
│   │   ├── worker-generate-latex/    # Cron-triggered Claude worker
│   │   ├── worker-generate-pdf/      # Cron-triggered PDF compiler
│   │   ├── process-generation-job/   # Legacy monolith (fallback)
│   │   └── resend/                   # Resend email Edge Function
│   └── migrations/        # SQL migrations
│       ├── 20260304054626_remote_schema.sql  # Remote schema snapshot
│       ├── 20260304060000_welcome_email_flag.sql # welcome_email_sent column
│       ├── 20260305000000_admin_tables.sql   # Admin action logs + RLS
│       └── 20260315000000_job_applications.sql # Job applications table + RLS
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

**CreditsProvider** (`providers/CreditsProvider.tsx`): Wraps the entire dashboard layout so that all `useCredits()` consumers (sidebar, credits page) share a **single Realtime channel** and always display the same value. Components outside the dashboard (e.g. landing page) fall back to their own independent subscription.

### 5. PDF Compilation

External compilation via `latex-online.cc`:

- **Background**: `worker-generate-pdf` Edge Function compiles and uploads automatically
- **On-demand fallback**: `/api/export-pdf` endpoint for manual download
- Uploads compiled PDF to Supabase Storage with upsert for idempotency
- Returns signed URL (10 min validity)
- Credits deducted during LaTeX generation, not PDF export

### 6. DOCX Export

Two-step conversion pipeline via **CloudConvert**:

- **Step 1**: Compile LaTeX → PDF using `latexonline.cc`
- **Step 2**: Convert PDF → DOCX using CloudConvert API
- **Endpoint**: `/api/export-docx`
- **Helper**: `lib/export/latexToPlainText.ts` for plain-text fallback

### 7. PDF Editor

Full-featured PDF styling editor at `/dashboard/editor/[jobId]`:

- **PDF.js Preview**: Scrollable all-pages view rendered to canvas, with zoom (50-300%)
- **HiDPI Rendering**: Canvas renders at `scale × devicePixelRatio` for crisp Retina output
- **Style Controls**: Font family, page size, margins, font size, line height, section spacing
- **Auto-Recompile**: Changes trigger PDF regeneration after 800ms debounce
- **Font Families**: Computer Modern, Latin Modern, Times New Roman, Palatino, Charter, Bookman, Helvetica
- **Initial Settings**: Parsed from existing LaTeX via `parseStyleFromLatex()`
- **Save on Download**: Styled LaTeX is saved to DB when user downloads
- **Layout**: Fixed viewport inside dashboard shell — only PDF scrolls
- **LaTeX Injection**: Idempotent marker-based style block injection (`applyStyleToLatex()`)
- **Export Modal** (`ExportModal.tsx` + `useExportModal.ts`): Unified PDF/DOCX download modal
- **Components**: `EditorControls`, `ResumeEditorShell`, `ResumeContent`, `ResumePreview`
- See `docs/CANVAS.md` for detailed architecture

### 8. Stripe Integration

Full subscription + billing management system:

- Monthly plan: $10/month for 50 credits
- Secure webhooks with signature verification
- Idempotent credit granting
- Promotion code support
- Purchase history tracking
- **Billing Management** via Stripe Customer Portal:
    - Subscription status display (Active / Canceling / Past Due / Canceled)
    - Renewal and cancellation date display
    - "Manage billing" button → Stripe-hosted portal
    - Portal handles: payment methods, invoices, cancellation

**Webhook events handled:**

| Event                           | Action                                          |
| ------------------------------- | ----------------------------------------------- |
| `checkout.session.completed`    | Grant credits + store `stripe_customer_id`      |
| `charge.refunded`               | Mark purchase as refunded                       |
| `customer.subscription.created` | Set subscription fields                         |
| `customer.subscription.updated` | Update status, cancellation scheduling          |
| `customer.subscription.deleted` | Clear subscription fields (with ID match guard) |
| `invoice.paid`                  | Mark active (with reactivation safety)          |
| `invoice.payment_failed`        | Mark past_due                                   |

> **Gotcha:** Stripe Customer Portal sets `cancel_at` (a date) rather than `cancel_at_period_end: true`. The `useBilling` hook checks both.

### 9. Admin Panel

Role-gated admin dashboard at `/dashboard/admin/`:

- **Access Guard**: `lib/admin/guard.ts` checks user role before serving admin APIs
- **Rate Limiting**: `lib/admin/rate-limit.ts` for admin API protection
- **Validation**: Zod schemas in `lib/admin/schemas.ts`
- **Email Templates**: `lib/admin/email-templates.ts` for admin-triggered emails

**API Endpoints** (`/api/admin/`):

| Endpoint       | Purpose                        |
| -------------- | ------------------------------ |
| `check/`       | Verify admin role              |
| `credits/`     | Adjust user credits            |
| `email/`       | Send emails to users           |
| `generations/` | View generation statistics     |
| `overview/`    | Dashboard overview metrics     |
| `users/`       | User management (list, search) |

**Components** (`components/admin/`):

- `AdminAccessDenied` — unauthorized fallback
- `AdminSidebar` — admin navigation
- `OverviewMetrics` — dashboard stats cards
- `CreditAdjustDialog` — credit adjustment modal
- `EmailSendDialog` — email composition modal

**Database**: `admin_action_logs` table (migration `20260305000000_admin_tables.sql`) with RLS policies and foreign key to `user_profiles` (ON DELETE CASCADE).

### 10. SEO & Content Pages

Static, SEO-optimized content pages built with a reusable layout system:

- **ContentPageLayout** (`components/content/ContentPageLayout.tsx`): Shared layout with desktop table-of-contents
- **Schema** (`components/content/Schema.tsx`): JSON-LD injection for search engines and LLMs
- **Content Definitions** (`components/content/contentPages.tsx`): All page content in one file

**Routes:**

| Route                                  | Topic                                        |
| -------------------------------------- | -------------------------------------------- |
| `/chatgpt-resume-prompt-alternative`   | ChatGPT resume prompt alternative            |
| `/examples`                            | Resume examples                              |
| `/how-it-works`                        | How the tool works                           |
| `/resume-tailor-job-description`       | Resume tailoring for job descriptions        |

**SEO Infrastructure:**

- `app/robots.ts` — programmatic robots.txt
- `app/sitemap.ts` — programmatic sitemap.xml
- JSON-LD `SoftwareApplication` schema in root layout
- Open Graph + Twitter Card meta tags

### 11. Legal Pages

Privacy Policy and Terms of Service:

- **Routes**: `/privacy`, `/terms`
- **Layout**: `components/legal/LegalLayout.tsx` (shared legal page shell)
- **Content**: `components/legal/legalContent.tsx` (all legal copy)

### 12. Welcome Email

Automated welcome email on first signup:

- **API Route**: `/api/send-welcome-email` (Next.js)
- **Edge Function**: `supabase/functions/resend/` (Supabase Edge)
- **Deduplication**: `welcome_email_sent` boolean column on `user_profiles`
- **Provider**: Resend (transactional email service)

### 13. Job Application Tracker

Kanban-style job application tracking at `/dashboard/applications`:

- **Stages**: Saved → Applied → Screening → Interview → Offer
- **Hook**: `useJobApplications.ts` — CRUD operations + Supabase Realtime subscription
- **Database**: `job_applications` table (migration `20260315000000_job_applications.sql`) with RLS policies
- **Realtime**: Table has `REPLICA IDENTITY FULL` enabled for real-time updates

**Components** (`components/dashboard/applications/`):

- `ApplicationBoard` — Kanban board view with drag-and-drop columns
- `ApplicationDetailModal` — Detailed view of a single application
- `ApplicationModal` — Add/edit application form
- `DeleteApplicationDialog` — Delete confirmation

**Table Columns** (`job_applications`):

| Column           | Type          | Purpose                           |
| ---------------- | ------------- | --------------------------------- |
| `id`             | UUID          | Primary key                       |
| `user_id`        | UUID          | Foreign key → auth.users          |
| `company`        | TEXT          | Company name                      |
| `role`           | TEXT          | Job role/title                    |
| `location`       | TEXT          | Job location                      |
| `salary`         | TEXT          | Salary information                |
| `source_url`     | TEXT          | Job posting URL                   |
| `stage`          | TEXT          | Kanban stage (check constraint)   |
| `position`       | INTEGER       | Sort order within stage           |
| `applied_at`     | TIMESTAMPTZ   | Date applied                      |
| `interview_date` | TIMESTAMPTZ   | Scheduled interview date          |
| `notes`          | TEXT          | User notes                        |
| `created_at`     | TIMESTAMPTZ   | Record creation timestamp         |
| `updated_at`     | TIMESTAMPTZ   | Auto-updated via trigger          |

### 14. Authentication Pages

Dedicated authentication pages replacing the original modal-only flow:

- **Sign In**: `/auth/login` — dedicated login page
- **Sign Up**: `/auth/signup` — dedicated signup page
- **Auth Modal**: `components/auth/AuthModal.tsx` — modal fallback for in-app auth prompts
- **OAuth Callback**: `/auth/callback` — handles Google OAuth redirects
- **Email Verification**: `/auth/verify-email` — email confirmation page

### 15. Dashboard Layout

Sidebar-only layout with no top header bar:

- **Layout**: `app/dashboard/layout.tsx` — wraps all dashboard pages with `CreditsProvider` and sidebar
- **Sidebar**: `components/dashboard/DashboardSidebar.tsx` — brown-themed sidebar with white text
- **Mobile**: Collapsible sidebar with overlay on mobile, fixed on desktop
- **Width**: 256px (w-64) fixed sidebar, main content offset via `md:pl-64`

**Sidebar Navigation Links:**

| Label           | Route                       | Icon          |
| --------------- | --------------------------- | ------------- |
| Dashboard       | `/dashboard`                | Home          |
| Browse Jobs     | `/dashboard/job-search`     | Search        |
| My Applications | `/dashboard/applications`   | KanbanSquare  |
| My Resumes      | `/dashboard/resumes`        | FileText      |
| Tailor Resume   | `/dashboard/generate`       | Scissors      |
| Saved Jobs      | `/dashboard/generations`    | Bookmark      |
| ATS Checker     | `/dashboard/ats-checker`    | ScanSearch    |
| Settings        | `/dashboard/settings`       | Settings      |

**Sidebar Footer:**
- Conditional "Upgrade to Pro" button (hidden when user has credits + purchase history)
- Admin Panel link (visible only to admin users)
- User info section with avatar initial, name, and sign-out button

---

## Current Design System

### Typography

- **Display**: Manrope (sans-serif) — headings, navigation
- **Body**: DM Sans (sans-serif) — UI text, paragraphs
- **Mono**: IBM Plex Mono (monospace) — code, technical text

### Color Palette

Warm light theme with beige background and brown accents. **All colors are centralized in `globals.css` — zero hardcoded hex values in component files.**

| Token               | Value                        | Purpose                      |
| ------------------- | ---------------------------- | ---------------------------- |
| `--surface-base`    | `#E5D5BE`                    | Main background              |
| `--surface-raised`  | `#f0e6d4`                    | Cards, panels                |
| `--surface-inset`   | `#d9c8ae`                    | Pressed/recessed areas       |
| `--text-primary`    | `#654844`                    | Main text                    |
| `--text-secondary`  | `#8a6f6a`                    | Captions, labels             |
| `--text-tertiary`   | `#b09a94`                    | Placeholders, disabled       |
| `--cta`             | `#654844`                    | CTA button background        |
| `--cta-hover`       | `#7a5a55`                    | CTA hover state              |
| `--cta-foreground`  | `#ffffff`                    | Text on CTA                  |
| `--code-block`      | `#654844`                    | LaTeX preview background     |
| `--border-visible`  | `#c4b198`                    | Card outlines, inputs        |
| `--accent`          | `hsl(12 72% 42%)`            | Primary accent (terracotta)  |

### Landing Page Components

| Component             | Purpose                                    |
| --------------------- | ------------------------------------------ |
| `Hero`                | Main hero section with CTA                 |
| `Problem`             | Problem statement / pain points            |
| `TrustBar`            | Social proof / trust indicators            |
| `Features`            | Feature highlights                         |
| `HowItWorks`          | Step-by-step process                       |
| `BeforeAfter`         | Before/after resume comparison             |
| `ATSScore`            | ATS score showcase section                 |
| `JobTracker`          | Job tracker showcase section               |
| `JobDiscovery`        | Job discovery showcase section             |
| `PlatformPreview`     | Platform preview section                   |
| `TemplateSelector`    | Template selector showcase section         |
| `Pricing`             | Pricing plans                              |
| `FAQ`                 | Frequently asked questions                 |
| `CTA`                 | Bottom call-to-action                      |
| `Footer`              | Site footer                                |
| `Navbar`              | Navigation bar                             |
| `HeaderAuthControls`  | Auth buttons in header                     |

---

## Database Schema

### Key Tables

| Table                    | Purpose                                                       |
| ------------------------ | ------------------------------------------------------------- |
| `user_profiles`          | User data, credits, profile, subscription, welcome email flag |
| `generation_jobs`        | Job status, LaTeX, PDF path, pipeline state                   |
| `saved_job_descriptions` | Reusable JDs                                                  |
| `resume_versions`        | User resume files with versions                               |
| `onboarding_sessions`    | Anonymous session tracking                                    |
| `onboarding_drafts`      | Draft data before signup                                      |
| `credit_purchases`       | Stripe purchase records                                       |
| `admin_action_logs`      | Admin action audit trail                                      |
| `job_applications`       | Job application tracker (Kanban board)                        |

### Subscription Columns (user_profiles)

Added by migration `011_subscription_fields.sql`:

| Column                   | Type          | Purpose                                       |
| ------------------------ | ------------- | --------------------------------------------- |
| `stripe_customer_id`     | TEXT (UNIQUE) | Primary key for webhook user lookup           |
| `stripe_subscription_id` | TEXT (UNIQUE) | Current subscription ID                       |
| `subscription_status`    | TEXT          | `active`, `past_due`, `canceled`, etc.        |
| `plan_name`              | TEXT          | Derived from Price ID (default: `free`)       |
| `cancel_at_period_end`   | BOOLEAN       | Whether cancel is scheduled at period end     |
| `cancel_at`              | TIMESTAMPTZ   | Specific cancellation date (portal uses this) |
| `current_period_end`     | TIMESTAMPTZ   | Current billing period end date               |

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

### Migrations

| Migration File                              | Purpose                               |
| ------------------------------------------- | ------------------------------------- |
| `20260304054626_remote_schema.sql`          | Full remote schema snapshot           |
| `20260304060000_welcome_email_flag.sql`     | `welcome_email_sent` column           |
| `20260305000000_admin_tables.sql`           | Admin action logs table + RLS         |
| `20260315000000_job_applications.sql`       | Job applications table + RLS + Realtime |

---

## Implementation Status

### ✅ Fully Implemented

- Claude integration with all 3 generation modes
- Realtime system (WebSocket updates)
- Soft-commit resume upload with progress
- PDF export pipeline
- **DOCX export** (CloudConvert PDF → DOCX)
- **Split generation pipeline** (3 Edge Functions + cron)
- Credit system with atomic decrements + idempotent deduction
- **CreditsProvider** for synced Realtime credits across all dashboard components
- Google/Email auth with gate for export
- **Dedicated auth pages** (`/auth/login`, `/auth/signup`) replacing modal-only flow
- Complete dashboard:
    - Home with quick actions
    - Generate with mode/resume selection
    - Past Generations with filters/drawer (PDF preparing/failed states)
    - Saved JDs library
    - Resume Versions with duplicate detection
    - Download Center
    - Credits & Billing (conditional buy button based on purchase history)
    - Profile/Settings/Account
    - PDF Editor with live preview + export modal
    - **Job Application Tracker** (Kanban board with 5 stages)
- **Sidebar-only dashboard layout** (no top header bar)
- **Admin Panel** (role-gated, user management, credits, email, stats)
- Stripe monthly subscription
- **Billing Management** (subscription status, portal access, cancellation display)
- Auth intent preservation
- User feedback submission
- Conditional sidebar upgrade button (hidden when user has credits + purchase history)
- **Welcome email** on first signup (Resend API, dedup via `welcome_email_sent` column)
- **SEO content pages** (4 pages with `ContentPageLayout` + JSON-LD schema)
- **Legal pages** (Privacy Policy + Terms of Service)
- **SEO infrastructure** (robots.txt, sitemap.xml, Open Graph, Twitter Cards)
- **Analytics** (Google Analytics + Vercel Analytics)
- **PWA manifest** (web app manifest with icons)
- **ATS visualization** components (score ring + keyword bars)
- **Light theme** with centralized CSS variable design tokens
- **Landing page showcase sections** (ATSScore, JobTracker, JobDiscovery, PlatformPreview, TemplateSelector)

### 🚧 Under Development

| Feature                              | Route                      | Description                                                                                |
| ------------------------------------ | -------------------------- | ------------------------------------------------------------------------------------------ |
| **ATS Checker**                      | `/dashboard/ats-checker`   | Score resumes against job descriptions with detailed keyword match analysis                 |
| **Job Search & Discovery**           | `/dashboard/job-search`    | Browse and discover job postings from external sources                                     |

### 🗺️ Planned (alpha/v2.0)

Upcoming features on the `alpha/v2.0` branch:

| Feature                              | Description                                                                                        |
| ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| **AI Interaction Field**             | Additional text field to instruct the AI where specific changes need to be made in the resume       |
| **Job Post Crawling**                | Crawl and aggregate job postings from external sources                                              |
| **Recommendation Algorithm**         | Filter and rank crawled jobs by matching against the user's generated resume and ATS score          |
| **Real-time JD Parsing**             | Parse job descriptions on-the-fly and compute match rankings                                       |

**Planned subdomain:** `alpha.atsresumie.com`

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
| `pnpm lint:local`    | Run ESLint via GitHub Actions locally   |

---

## Environment Variables

See `.env.example` for the full list. Key variables:

| Variable                         | Purpose                           |
| -------------------------------- | --------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`       | Supabase project URL              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | Supabase anonymous key            |
| `SUPABASE_SERVICE_ROLE_KEY`      | Supabase service role key         |
| `ANTHROPIC_API_KEY`              | Claude API key                    |
| `STRIPE_SECRET_KEY`              | Stripe secret key                 |
| `STRIPE_WEBHOOK_SECRET`         | Stripe webhook signing secret     |
| `STRIPE_PRICE_ID`               | Stripe price ID for subscription  |
| `RESEND_API_KEY`                 | Resend email API key              |
| `CLOUDCONVERT_API_KEY`           | CloudConvert API key (DOCX)       |
| `NEXT_PUBLIC_BASE_URL`           | Application base URL              |

---

_Last updated: 2026-03-18_

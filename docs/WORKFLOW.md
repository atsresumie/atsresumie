# ATSResumie - Application Workflow

This document tracks the complete user workflow and data flow of the application.

---

## High-Level User Journey

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│  Landing Page  │────▶│  Get Started   │────▶│  Signup/Login  │────▶│   Dashboard    │
│  /             │     │  /get-started  │     │  /auth/...     │     │  /dashboard    │
└────────────────┘     └────────────────┘     └────────────────┘     └───────┬────────┘
                                                                            │
                       ┌────────────────────────────────────────────────────┤
                       │                    │                    │          │
                       ▼                    ▼                    ▼          ▼
              ┌────────────────┐   ┌────────────────┐   ┌──────────┐   ┌──────────┐
              │   Generate     │   │   PDF Editor   │   │ Credits  │   │ Resumes  │
              │  /dashboard/   │   │  /dashboard/   │   │ & Billing│   │ & JDs    │
              │   generate     │   │  editor/[id]   │   │          │   │          │
              └────────────────┘   └────────────────┘   └──────────┘   └──────────┘
```

---

## 1. Onboarding Flow (Anonymous → Authenticated)

### Step 0: Mode Selection

User selects generation mode: **Quick**, **Deep**, or **From Scratch**.

### Step 1: Input

- Paste job description
- Upload resume (PDF/DOCX) via signed URL → Supabase Storage
- Optional focus prompt

### Step 2: Preview & Signup Gate

- AI analysis runs (Claude 3.5 Sonnet)
- Results displayed with ATS score
- **PDF download requires signup** → triggers claim flow

```
Client                          Server                      Storage / DB
  │                               │                              │
  ├─POST /api/onboarding/start──▶│ Create session, set cookie   │
  │◀──── { sessionId } ──────────│                              │
  │                               │                              │
  ├─POST resume-upload-url───────▶│ Generate signed URL          │
  │◀──── { signedUrl } ──────────│                              │
  ├────── Upload file ──────────────────────────────────────────▶│
  │                               │                              │
  ├─POST /api/onboarding/save-draft─▶│ Save JD + resume metadata│
  │                               │                              │
  ├─POST /api/generate───────────▶│ Create generation job        │
  │◀──── { jobId } ──────────────│                              │
  │                               │                              │
  ├─Subscribe Realtime (jobId)──▶│ queued → processing → done   │
  │                               │                              │
  │── After signup ──             │                              │
  ├─POST /api/onboarding/claim──▶│ Link session to user         │
```

---

## 2. Generation Pipeline (Split Architecture)

Resume generation uses 3 decoupled Edge Functions triggered by `pg_cron`:

```
User Request
     │
     ▼
 ┌────────────────────────────┐
 │ enqueue-generation-job     │  JWT auth, validation, credit check
 │ OR /api/generate           │  → INSERT generation_jobs (queued)
 └─────────────┬──────────────┘
               │
    pg_cron (20s)
               │
               ▼
 ┌────────────────────────────┐
 │ worker-generate-latex      │  Claim job → Claude API → LaTeX
 │ (batch 2, 25s budget)      │  → status=succeeded, pdf_status=queued
 └─────────────┬──────────────┘
               │
    pg_cron (45s)
               │
               ▼
 ┌────────────────────────────┐
 │ worker-generate-pdf        │  Claim job → latexonline.cc → PDF
 │ (batch 3, 50s budget)      │  → Upload to Storage, pdf_status=ready
 └────────────────────────────┘
```

**Frontend subscribes via Realtime** (`useJobRealtime` / `useGenerations`) for instant status updates.

**Key safeguards:**

- Idempotent credit deduction (`deduct_credit_once` RPC)
- Atomic job claims (`FOR UPDATE SKIP LOCKED`)
- Exponential backoff on 429/5xx errors (max 3 attempts)
- Stale lock recovery (jobs stuck > 10 min auto-reset)

---

## 3. Dashboard Generate Flow

From `/dashboard/generate`, authenticated users can generate new resumes:

```
Select mode (Quick/Deep/From Scratch)
     │
     ▼
Select resume version (from library)  ─or─  Quick Upload (new PDF)
     │
     ▼
Paste Job Description
     │
     ▼
Click "Generate"
     │
     ▼
POST /api/generate → enqueue-generation-job → Pipeline (§2)
     │
     ▼
Realtime updates → View in Past Generations when done
```

**Draft auto-save:** `useDraftJd` hook saves JD text to localStorage so users don't lose input.

---

## 4. PDF Editor Flow

After a successful generation, users can fine-tune styling at `/dashboard/editor/[jobId]`:

```
Open editor (fetch latex_text from DB)
     │
     ▼
Parse current LaTeX style → Display in Style Controls
     │
     ▼
User adjusts: font family, size, margins, spacing, page size
     │
  800ms debounce
     │
     ▼
applyStyleToLatex() → POST /api/export-pdf-with-style → latexonline.cc
     │
     ▼
PDF.js renders result in scrollable preview (HiDPI)
     │
     ▼
"Download" → Save styled LaTeX to DB + download PDF
```

---

## 5. Payment & Credits Flow

### Subscription Purchase

```
Credits Page → Click "Subscribe" / "Buy Credits"
     │
     ▼
POST /api/stripe/checkout → Stripe Checkout Session (subscription mode)
     │
     ▼
User pays on Stripe-hosted page
     │
     ▼
Stripe fires webhook: checkout.session.completed
     │
     ▼
POST /api/stripe/webhook
  ├── Validate signature + price ID
  ├── Store stripe_customer_id in user_profiles
  ├── Grant credits via grant_credits_for_purchase RPC (idempotent)
  └── Record in credit_purchases table
     │
     ▼
CreditsProvider (Realtime) → All UI components update instantly
```

### Subscription Renewal

```
Stripe fires: invoice.paid
     │
     ▼
Webhook verifies subscription ID match + not canceled
     │
     ▼
Marks subscription active + grants renewal credits
```

---

## 6. Billing Management Flow

### Viewing Status

```
/dashboard/credits → useBilling hook → SELECT from user_profiles
     │
     ▼
BillingSubscriptionCard renders current state:
  ├── Active     → "Renews on [date]" + Manage billing button
  ├── Canceling  → "Cancels on [date]" + Manage billing button
  ├── Past Due   → "Payment failed" warning + Manage billing button
  ├── Canceled   → "Subscription has ended" message
  └── No sub     → "Upgrade to Pro" CTA
```

### Managing via Stripe Portal

```
Click "Manage billing"
     │
     ▼
POST /api/stripe/portal
  ├── Auth check
  ├── Fetch stripe_customer_id from DB (server-side)
  └── Create Stripe Billing Portal Session
     │
     ▼
Redirect to Stripe-hosted portal
  ├── Update payment method
  ├── View invoices
  ├── Cancel subscription
  └── Undo cancellation
     │
     ▼
Stripe fires: customer.subscription.updated
     │
     ▼
Webhook updates user_profiles (status, cancel_at, cancel_at_period_end)
     │
     ▼
User returns → Page refresh → useBilling fetches updated state
```

> **Gotcha:** Stripe Portal sets `cancel_at` (a date) rather than `cancel_at_period_end: true`. The `useBilling` hook checks both fields.

---

## 7. Realtime System

Supabase Realtime powers instant updates across the app:

| Channel Target           | Hook                | Updates                         |
| ------------------------ | ------------------- | ------------------------------- |
| `generation_jobs`        | `useJobRealtime`    | Job status (queued → succeeded) |
| `generation_jobs`        | `useGenerations`    | Past Generations list           |
| `user_profiles`          | `CreditsProvider`   | Credit balance (all components) |
| `resume_versions`        | `useResumeVersions` | Resume library CRUD             |
| `saved_job_descriptions` | `useSavedJds`       | JD library CRUD                 |

**CreditsProvider** wraps the dashboard layout so header, sidebar, credits page, and profile dropdown all share one Realtime channel.

---

## API Routes

| Route                               | Method | Purpose                           |
| ----------------------------------- | ------ | --------------------------------- |
| `/api/onboarding/start`             | POST   | Create/resume anonymous session   |
| `/api/onboarding/session-status`    | GET    | Get session + draft data          |
| `/api/onboarding/resume-upload-url` | POST   | Get signed upload URL             |
| `/api/onboarding/save-draft`        | POST   | Save JD + resume metadata         |
| `/api/onboarding/commit-resume`     | POST   | Soft-commit resume to final/      |
| `/api/onboarding/delete-resume`     | DELETE | Delete resume from storage        |
| `/api/onboarding/claim`             | POST   | Claim session after signup        |
| `/api/generate`                     | POST   | Create generation job             |
| `/api/jobs/[id]`                    | GET    | Fetch job status                  |
| `/api/credits`                      | GET    | Get user credit balance           |
| `/api/analyze`                      | POST   | ATS analysis endpoint             |
| `/api/export`                       | POST   | Export endpoint                   |
| `/api/export-pdf`                   | POST   | Compile PDF from LaTeX            |
| `/api/export-pdf-with-style`        | POST   | Compile styled PDF from LaTeX     |
| `/api/resumes/extract-text`         | POST   | Extract text from uploaded resume |
| `/api/feedback`                     | POST   | Submit user feedback              |
| `/api/stripe/checkout`              | POST   | Create Stripe checkout session    |
| `/api/stripe/portal`                | POST   | Create Stripe portal session      |
| `/api/stripe/webhook`               | POST   | Handle Stripe webhook events      |

---

## Database Tables

| Table                    | Purpose                                     |
| ------------------------ | ------------------------------------------- |
| `user_profiles`          | User data, credits, profile, subscription   |
| `generation_jobs`        | Job status, LaTeX, PDF path, pipeline state |
| `saved_job_descriptions` | Reusable job descriptions                   |
| `resume_versions`        | User resume files with versions             |
| `onboarding_sessions`    | Anonymous session tracking                  |
| `onboarding_drafts`      | Draft data before signup                    |
| `credit_purchases`       | Stripe purchase records                     |

---

## Session States (Onboarding)

| State     | `isEditable` | Description                    |
| --------- | ------------ | ------------------------------ |
| `active`  | ✅ true      | User can input and modify data |
| `claimed` | ❌ false     | Session linked to user, locked |
| `expired` | ❌ false     | Session past expiration        |

---

_Last updated: 2026-02-14_

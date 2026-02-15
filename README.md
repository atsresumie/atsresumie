# ATSResumie

AI-powered resume optimization platform built with Next.js 16, Supabase, Claude 3.5 Sonnet, and Stripe.

ATSResumie helps users tailor their resumes for Applicant Tracking Systems (ATS) by generating optimized, LaTeX-based, production-ready resumes with real-time feedback and PDF export.

---

## 🚀 Overview

ATSResumie allows users to:

1. Paste a Job Description
2. Upload their Resume (PDF/DOCX)
3. Generate an ATS-optimized resume using AI
4. Edit styling visually
5. Download a professionally compiled PDF

The system uses a split background pipeline architecture for scalable AI generation and PDF compilation.

---

## 🏗 Tech Stack

| Layer           | Technology                           |
| --------------- | ------------------------------------ |
| Framework       | Next.js 16 (App Router)              |
| Language        | TypeScript                           |
| Styling         | Tailwind CSS v4 + CSS Variables      |
| UI              | shadcn/ui                            |
| Database        | Supabase (PostgreSQL)                |
| Storage         | Supabase Storage                     |
| Auth            | Supabase Auth (Email + Google OAuth) |
| AI              | Claude 3.5 Sonnet                    |
| Realtime        | Supabase Realtime                    |
| PDF Engine      | latex-online.cc                      |
| Payments        | Stripe                               |
| Animations      | Framer Motion                        |
| Package Manager | pnpm                                 |

---

## 🧠 Core Architecture

### Split Generation Pipeline

Frontend → `enqueue-generation-job`
→ `generation_jobs` (queued)

**Cron Jobs:**

- `worker-generate-latex` (every 20s)
- `worker-generate-pdf` (every 45s)
- `stale-lock-recovery` (every 5m)

### Flow

1. User submits generation request
2. Job inserted into DB
3. LaTeX worker claims and calls Claude
4. PDF worker compiles via latex-online.cc
5. PDF uploaded to Supabase Storage
6. Realtime updates pushed to frontend

---

## 📂 Project Structure

```
atsresumie/
├── app/
│ ├── api/
│ ├── dashboard/
│ ├── auth/
│ ├── get-started/
│ └── layout.tsx
├── components/
├── hooks/
├── providers/
├── lib/
├── supabase/
├── public/
└── docs/
```

---

## 🔑 Key Features

### 1. Soft-Commit Resume Upload

Two-stage upload:

- Temp folder (yellow badge)
- Final folder (green badge)
- XHR progress tracking

---

### 2. AI Resume Generation

- Claude 3.5 Sonnet
- Quick / Deep / From Scratch modes
- Idempotent credit deduction
- Exponential backoff on failures
- Atomic job claiming via `FOR UPDATE SKIP LOCKED`

---

### 3. Realtime System

- Supabase Realtime
- No polling
- Shared `CreditsProvider`
- Instant job + credit updates

---

### 4. PDF Compilation

- Background PDF compilation
- Fallback API `/api/export-pdf`
- Signed URLs (10 min expiry)
- Stored in `generated-pdfs` bucket

---

### 5. PDF Editor

Route: `/dashboard/editor/[jobId]`

Features:

- PDF.js live preview
- Retina rendering
- Zoom (50–300%)
- Style controls
- 800ms debounce auto-recompile
- Idempotent LaTeX style injection

---

### 6. Stripe Integration

- $10/month → 50 credits
- Webhook signature verification
- Idempotent credit granting
- Promotion codes
- Purchase history

---

## 🗄 Database Tables

| Table                  | Purpose             |
| ---------------------- | ------------------- |
| user_profiles          | Credits + user data |
| generation_jobs        | AI + PDF pipeline   |
| resume_versions        | User resume files   |
| saved_job_descriptions | Reusable JDs        |
| onboarding_sessions    | Anonymous tracking  |
| onboarding_drafts      | Pre-signup drafts   |
| credit_purchases       | Stripe history      |

---

## 📦 Storage Buckets

| Bucket         | Purpose                   |
| -------------- | ------------------------- |
| user-resumes   | Onboarding uploads        |
| resumes        | Dashboard resume versions |
| generated-pdfs | Final compiled PDFs       |

---

## 🛠 Development

### Install

```bash
pnpm install
```

### Run Dev

```bash
pnpm dev
```

### Production Build

```bash
pnpm build
pnpm start
```

### 🔐 Security & Reliability

- JWT validation at enqueue layer

- Atomic credit deduction via RPC

- Stale lock recovery

- Retry with exponential backoff

- Idempotent PDF uploads (upsert)

- Stripe webhook verification

### 🧩 Edge Functions

- enqueue-generation-job

- worker-generate-latex

- worker-generate-pdf

- process-generation-job (legacy fallback )

### 📜 License

## Proprietary — ATSResumie

**www.sujanshrestha.ca**

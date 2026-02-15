# ATSResumie

AI-powered resume optimization platform built with Next.js 16, Supabase, Claude 3.5 Sonnet, and Stripe.

ATSResumie helps users tailor their resumes for Applicant Tracking Systems (ATS) by generating optimized, LaTeX-based, production-ready resumes with real-time feedback and PDF export.

---

## 📂 Repository Structure

```
atsresumie/
├── web/                        # Next.js 16 app (main web application)
│   ├── app/                    # App Router pages & API routes
│   ├── components/             # React components
│   ├── hooks/                  # Custom hooks
│   ├── lib/                    # Utilities & server helpers
│   ├── providers/              # React context providers
│   ├── public/                 # Static assets
│   ├── styles/                 # CSS
│   └── types/                  # TypeScript type definitions
├── microservices/
│   └── latex-service/          # (Placeholder) Future LaTeX compilation service
├── packages/
│   └── shared/                 # (Placeholder) Future shared utilities
├── supabase/                   # Edge functions & migrations
├── docs/                       # Project documentation
├── package.json                # Root workspace scripts
└── pnpm-workspace.yaml         # Workspace config
```

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
| Package Manager | pnpm (workspaces)                    |

---

## 🛠 Development

### Prerequisites

- Node.js 20+
- pnpm 9+

### Install

```bash
pnpm install
```

### Run Dev Server

```bash
pnpm dev           # Next.js only
pnpm dev:stripe    # Next.js + Stripe webhook listener
```

### Production Build

```bash
pnpm build
pnpm start
```

### Lint & Typecheck

```bash
pnpm lint
pnpm typecheck
```

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

## 🔑 Key Features

- **AI Resume Generation** — Claude 3.5 Sonnet with Quick / Deep / From Scratch modes
- **Realtime System** — Supabase Realtime, no polling, shared CreditsProvider
- **PDF Compilation** — Background compilation, fallback API, signed URLs
- **PDF Editor** — PDF.js live preview, retina rendering, zoom, style controls
- **Stripe Integration** — $10/month → 50 credits, webhook verification, promotion codes

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

## ☁️ Deployment (Vercel)

The web app deploys to Vercel. Configure with:

- **Root Directory**: `web`
- **Build Command**: `next build` (default)
- **Install Command**: `pnpm install` (default)

> **Note**: Environment variables in Vercel should be set for the `web` project root.

---

## 🔐 Security & Reliability

- JWT validation at enqueue layer
- Atomic credit deduction via RPC
- Stale lock recovery
- Retry with exponential backoff
- Idempotent PDF uploads (upsert)
- Stripe webhook verification

---

## 🧩 Edge Functions

- enqueue-generation-job
- worker-generate-latex
- worker-generate-pdf
- process-generation-job (legacy fallback)

---

## 📜 License

Proprietary — ATSResumie

**sujanshrestha.ca**

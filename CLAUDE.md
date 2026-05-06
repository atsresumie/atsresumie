# CLAUDE.md

Project-specific guidance for Claude Code working in this repo.

## What this is

**ATSResumie** — AI-powered resume tailoring SaaS. Paste a job description + upload a resume → Claude generates an ATS-optimized LaTeX resume → compiled to PDF.

## Stack

- **Next.js 16** (App Router, Turbopack), **TypeScript**, **Tailwind v4**, **shadcn/ui** (Radix)
- **Supabase**: Postgres, Auth (email + Google OAuth), Storage, Realtime, Edge Functions (Deno)
- **Anthropic Claude** via `@anthropic-ai/sdk` (server-side only)
- **Stripe** for credits/billing (webhook at `/api/stripe/webhook`)
- **LaTeX → PDF** via external `latex-online.cc`
- **pnpm** (workspace), **Vercel** for hosting

## Folder structure

```
app/
  api/              Next.js route handlers (server). Auth + ownership checks required.
  dashboard/        Authed app surface
  auth/             Supabase auth callbacks + flows
  get-started/      Onboarding flow
  (marketing)/      Landing, how-it-works, examples, legal
components/
  ats/ auth/ dashboard/ editor/ landing/ ui/   feature-scoped + shadcn primitives
hooks/              React Query hooks: useAuth, useCredits, useGenerations, useJobPolling, useJobRealtime, etc.
lib/
  ats/ auth/ editor/ export/ jobs/ latex/ llm/ onboarding/ storage/ stripe/ supabase/ utils/
providers/          React context providers
supabase/
  migrations/       SQL migrations (source of truth for schema)
  functions/        Edge Functions:
                    - enqueue-generation-job
                    - worker-generate-latex   (cron ~20s)
                    - worker-generate-pdf     (cron ~45s)
                    - process-generation-job, resend
  credits_system.sql, generation_jobs.sql
docs/               AUTH, CANVAS, CONTEXT, CORE_ENGINE, DASHBOARD, IMPLEMENTATIONS,
                    MICROSERVICE, ONBOARDING, PAYMENT, WORKFLOW — read these for deep context
middleware.ts       Supabase session refresh + route protection
```

## Core architecture: split generation pipeline

Frontend → `enqueue-generation-job` → `generation_jobs` row (queued)
→ `worker-generate-latex` claims row, calls Claude, writes LaTeX
→ `worker-generate-pdf` compiles via latex-online.cc, uploads to Storage
→ Realtime channel pushes status to client (`useJobRealtime`)
→ `stale-lock-recovery` cron unblocks crashed jobs

Do NOT call Claude inline from a Next.js route for generation — always enqueue.

## Key files

- [middleware.ts](middleware.ts) — Supabase SSR session, runs on every request
- [app/layout.tsx](app/layout.tsx) — root providers
- [app/providers.tsx](app/providers.tsx) — React Query, theme, etc.
- [lib/supabase/](lib/supabase/) — server vs browser clients; **never** import server client in `"use client"` files
- [lib/llm/](lib/llm/) — Claude prompt builders
- [lib/stripe/](lib/stripe/) — Stripe SDK + webhook handlers
- [lib/latex/](lib/latex/) — LaTeX templating + compile call
- [hooks/useCredits.ts](hooks/useCredits.ts), [hooks/useGenerations.ts](hooks/useGenerations.ts)

## Component patterns

- shadcn/ui in `components/ui/` — copy-paste primitives, edit freely.
- Feature components grouped by surface (`components/dashboard/...`, `components/editor/...`).
- Server Components by default; mark `"use client"` only when needed (state, effects, browser APIs).
- Data fetching: React Query hooks in `hooks/`, not raw `fetch` in components.
- Forms: `react-hook-form` + `zod` via `@hookform/resolvers`.

## API route conventions

Every `app/api/*/route.ts` handler MUST:
1. Get user via Supabase server client.
2. Reject unauthenticated requests (`401`).
3. Check ownership of any resource referenced (resume_id, job_id, etc.) before reading or mutating.

Reference fix: commit `f556960` (auth + ownership on `/api/ats-score`). Apply the same pattern to new endpoints.

## Scripts

- `pnpm dev` — Next dev + Stripe webhook listener (concurrently)
- `pnpm dev:next` — Next dev only (Turbopack)
- `pnpm build` / `pnpm start`
- `pnpm lint`
- `pnpm lint:local` — runs CI locally via `act`
- `postinstall` copies `pdf.worker.min.mjs` to `public/`

## Env

See [.env.example](.env.example). Required: Supabase URL/keys, Anthropic API key, Stripe keys + webhook secret, Resend.

## Deployment

- **Vercel** for the Next.js app (auto-deploy from `main`).
- **Supabase Edge Functions** deployed via `supabase functions deploy <name>`. Cron schedules live in Supabase dashboard / `config.toml`.
- Migrations in `supabase/migrations/` — apply via `supabase db push`.

## Project-specific rules

- **Never expose service-role Supabase key to the client.** Server client only.
- **Never call Anthropic from client code.** Always via API route or Edge Function.
- **All API routes require auth + ownership checks** (see above).
- **Generation goes through the queue** (`generation_jobs`), not inline.
- **PDF worker output paths** live under user-scoped Storage prefixes — preserve when refactoring.
- **Credits**: every generation/ATS-scan must decrement credits atomically (see `credits_system.sql` and `lib/...` helpers). Do not bypass.
- **LaTeX templates**: changes affect rendered PDFs site-wide — diff a sample compile before merging.

## Docs to read for deeper context

`docs/CORE_ENGINE.md`, `docs/WORKFLOW.md`, `docs/MICROSERVICE.md` cover the generation pipeline. `docs/AUTH.md` and `docs/PAYMENT.md` cover Supabase auth and Stripe flows.

## Keep this file current

When you change folder structure, add a new component pattern, change deployment, or introduce a new project-specific rule — update this file in the same PR.

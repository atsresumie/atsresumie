# DASHBOARD.md — ATSResumie Dashboard Architecture & Context

> This document defines the **architecture**, **information architecture**, **UX rules**, and **implementation status** for the ATSResumie Dashboard.

---

## 1) What the Dashboard Is

The Dashboard is the **returning user workspace** for ATSResumie.

It is a multi-page control center where users can:

- **Generate again quickly** — resume generation from the dashboard
- **Find and reuse past generations** — search, filter, re-download
- **Manage resume versions** — upload, set default, duplicate detection
- **Track job applications** — Kanban board with stage tracking
- **Check ATS scores** — score resumes against job descriptions
- **Browse and discover jobs** — job search and discovery
- **Access downloads easily** — centralized download center
- **Understand credits and usage** — live credits, billing management
- **Style and export** — full PDF editor with AI chat-edit + PDF/DOCX export
- **See changes instantly via Realtime** — no refresh required

### Dashboard ≠ Onboarding

- `/get-started` is the guided onboarding flow (public).
- `/dashboard` is where logged-in users return to work efficiently.

---

## 2) Core UX Principles

1. **Fast repeat usage** — "Tailor Resume" is always 1 click away.
2. **Library-first retention** — Past Generations is the user's reliable, searchable, re-downloadable library.
3. **Trust through transparency** — Credits are always visible (sidebar footer).
4. **No clutter** — Multi-page structure with consistent sidebar navigation.
5. **Realtime-first** — Supabase Realtime subscriptions over polling. Dashboard updates instantly.

---

## 3) Layout Architecture

### Shell Components

| Component          | File                                        | Purpose                                                  |
| ------------------ | ------------------------------------------- | -------------------------------------------------------- |
| `DashboardLayout`  | `app/dashboard/layout.tsx`                  | Client component. Wraps everything in `CreditsProvider` + `SidebarProvider` |
| `DashboardSidebar` | `components/dashboard/DashboardSidebar.tsx`  | Fixed left sidebar (brown `#805F4E` bg, white text, mobile drawer) |
| `SidebarProvider`  | `providers/SidebarProvider.tsx`             | Context for mobile sidebar open/close state              |

> **Note:** The top header bar was removed in alpha/v2.0. Layout is sidebar-only. Credits and user info live in the sidebar footer.

### Layout Structure

```
┌──────────────────────────────────────────────────────┐
│ ┌─ Sidebar (w-64, fixed) ──┐ ┌─ <main> children ───┐ │
│ │ [Logo]                   │ │ md:pl-64             │ │
│ │ ─────────────────────── │ │                      │ │
│ │ Dashboard                │ │                      │ │
│ │ Browse Jobs              │ │                      │ │
│ │ My Applications          │ │                      │ │
│ │ My Resumes               │ │                      │ │
│ │ Tailor Resume            │ │                      │ │
│ │ Saved Jobs               │ │                      │ │
│ │ ATS Checker              │ │                      │ │
│ │ Settings                 │ │                      │ │
│ │ ─────────────────────── │ │                      │ │
│ │ [Upgrade to Pro]         │ │                      │ │
│ │ [Admin Panel]            │ │                      │ │
│ │ [Avatar] Name  [Logout]  │ │                      │ │
│ └──────────────────────────┘ └──────────────────────┘ │
└───────────────────────────────────────────────────────┘
```

### Sidebar Details

**Navigation links** (8 items):

| Label           | Route                       | Icon          |
| --------------- | --------------------------- | ------------- |
| Dashboard       | `/dashboard`                | `Home`        |
| Browse Jobs     | `/dashboard/job-search`     | `Search`      |
| My Applications | `/dashboard/applications`   | `KanbanSquare`|
| My Resumes      | `/dashboard/resumes`        | `FileText`    |
| Tailor Resume   | `/dashboard/generate`       | `Scissors`    |
| Saved Jobs      | `/dashboard/generations`    | `Bookmark`    |
| ATS Checker     | `/dashboard/ats-checker`    | `ScanSearch`  |
| Settings        | `/dashboard/settings`       | `Settings`    |

**Sidebar footer:**

- **Upgrade to Pro** button — conditionally shown based on purchase history + credit balance
- **Admin Panel** link — visible only to admin users
- **User info row** — avatar initial, display name, sign-out button

**Active state**: Left accent border (`border-l-2`) + raised background

**Responsive behavior**: Desktop = always visible (`md:translate-x-0`), Mobile = slide-in overlay via `SidebarProvider` context

---

## 4) Navigation Rules (Non-negotiable)

- There is **no top header bar** — layout is sidebar-only.
- Settings is in the sidebar; profile/account remain accessible via settings page.
- Admin panel link appears only for admin users.
- Mobile sidebar is toggled via `SidebarProvider` context (hamburger inside sidebar or page headers).

---

## 5) Routes Map

### Sidebar Routes

| Route                         | Page                                  |
| ----------------------------- | ------------------------------------- |
| `/dashboard`                  | Dashboard Home                        |
| `/dashboard/job-search`       | Browse Jobs (job discovery)           |
| `/dashboard/applications`     | My Applications (Kanban board)        |
| `/dashboard/resumes`          | My Resumes (resume versions)          |
| `/dashboard/generate`         | Tailor Resume (generate)              |
| `/dashboard/generations`      | Saved Jobs (past generations)         |
| `/dashboard/ats-checker`      | ATS Checker                           |
| `/dashboard/settings`         | Settings                              |

### Other Dashboard Routes

| Route                         | Page                                  |
| ----------------------------- | ------------------------------------- |
| `/dashboard/ats-scans`        | ATS Scan History                      |
| `/dashboard/downloads`        | Download Center                       |
| `/dashboard/credits`          | Credits & Billing                     |
| `/dashboard/profile`          | User Profile                          |
| `/dashboard/account`          | Account Information                   |
| `/dashboard/admin`            | Admin Panel (role-gated)              |
| `/dashboard/editor/[jobId]`   | PDF Editor for a specific job         |

---

## 6) Page Details

### `/dashboard` — Home ✅

- **Quick Actions Grid**: Tailor Resume / My Applications / My Resumes / ATS Checker
- **Recent Generations Card**: Latest 5 generations with status, realtime updates
- **Credits Card**: Current balance with visual indicator

### `/dashboard/generate` — Tailor Resume ✅

- **JD input**: Paste or select from saved JDs
- **Resume selection**: Choose from resume versions or import from LinkedIn (`ResumeSelector`)
- **Mode selector**: Quick / Deep / From Scratch (`ModeSelector`)
- **LinkedIn import**: Import profile via Apify integration
- **JD quality indicator**: Warns about too-short or incomplete JDs
- **Quick upload modal**: Upload resume inline
- **Past generation picker**: Reuse JD from a previous generation
- **Auto-save**: Draft JD autosaved via `useDraftJd` hook

### `/dashboard/generations` — Saved Jobs ✅

The user's generation library with full management capabilities.

- **Job rows**: Title, company, mode, status badges, date, credits used
- **Status badges**: Queued → Processing → Succeeded/Failed + PDF status
- **Filters**: Status, date range, mode
- **Details drawer**: Full generation details with actions
- **Delete**: Confirmation dialog
- **Realtime**: Instant updates via `useGenerations` hook
- **Actions**: View result, Download PDF/DOCX, Re-generate, Delete

### `/dashboard/applications` — My Applications ✅

Kanban-style job application tracker.

- **Stages**: Saved → Applied → Interview → Offer → Rejected
- **Components**: `ApplicationBoard`, `ApplicationDetailModal`, `ApplicationModal`, `DeleteApplicationDialog`
- **Drag-and-drop**: Move applications between columns
- **Detail view**: Full application details with notes, dates, salary, source URL
- **Realtime**: Via `useJobApplications` hook

> **Note**: `screening` stage was replaced with `rejected` in migration `20260326000000_replace_screening_with_rejected.sql`.

### `/dashboard/resumes` — My Resumes ✅

Resume file management with version control.

- **Card grid**: Resume cards with preview (`ResumePreviewCard`), zoom, and Quick Tailor sidebar
- **Upload**: PDF/DOCX with drag-and-drop
- **Set default**: Mark a resume as the default for generation
- **Duplicate detection**: Warns when uploading an identical file
- **Delete**: With guard for default resume
- **Delete button**: Accessible from resume cards
- **Realtime**: Via `useResumeVersions` hook

### `/dashboard/ats-checker` — ATS Checker ✅

Full ATS score checker with keyword analysis.

- **Resume selector**: Choose from generated resumes or uploaded versions
- **Score ring**: `AtsRing` visualization of ATS compatibility score
- **Keyword bars**: `KeywordBars` showing matched vs. missing keywords
- **Scan on demand**: Calls `/api/ats-check` and `/api/ats-score`
- **Score persistence**: ATS scores cached on `resume_versions` to avoid re-fetching (`useAtsScores` hook)
- **History link**: Links to `/dashboard/ats-scans`

### `/dashboard/ats-scans` — ATS Scan History ✅

Historical log of all ATS scans.

- **Scan list**: Ordered by date, shows resume label, score, and job description snippet
- **Expandable rows**: Full score breakdown on click
- **Score coloring**: Green ≥ 70, yellow 40–69, red < 40
- **Data hook**: `useAtsScans` with Supabase Realtime

### `/dashboard/downloads` — Download Center ✅

Centralized access to all exported files.

- **List**: All exported PDFs with metadata
- **Search/sort**: By date, job title
- **Download**: Direct download without opening a generation
- **Source link**: Links back to the source generation

### `/dashboard/credits` — Credits & Billing ✅

Full credits and subscription management.

- **Credits remaining**: Live count with realtime updates
- **Credit history**: Based on generation history
- **Purchase history**: Stripe purchases
- **Buy/Upgrade**: Stripe checkout integration
- **Billing Management**: Subscription status, renewal/cancellation dates, Stripe Customer Portal

> **Gotcha:** Stripe Customer Portal sets `cancel_at` (a timestamp) rather than `cancel_at_period_end: true`. The `useBilling` hook checks both.

### `/dashboard/editor/[jobId]` — PDF Editor ✅

Full-featured PDF styling editor with AI chat-edit (see `docs/CANVAS.md` for full architecture).

- **PDF.js Preview**: Scrollable all-pages view with zoom (50–300%)
- **Style Controls**: Font family, page size, margins, font size, line height, section spacing
- **Chat Edit Panel**: AI-powered LaTeX editing via natural language (`ChatPanel` + `useChatEdit`)
- **Final PDF Snapshot**: Persisted and hydrated from DB on revisit
- **Export Modal**: Unified PDF/DOCX download

### `/dashboard/admin` — Admin Panel ✅

Role-gated admin dashboard.

- **Access**: Gated by admin role check (`/api/admin/check`)
- **Features**: User management, credit adjustments, email sending, generation stats, overview metrics

---

## 7) Hooks

| Hook                   | Purpose                                           | Realtime? |
| ---------------------- | ------------------------------------------------- | --------- |
| `useAuth`              | Auth state (user, signOut)                        | —         |
| `useAuthIntent`        | Preserve + restore auth intent after login        | —         |
| `useCredits`           | Credits count with realtime subscription          | ✅        |
| `useCreditHistory`     | Credit usage history from generations             | —         |
| `useDownloads`         | Download center data                              | —         |
| `useDraftJd`           | Auto-save draft JD text on Generate page          | —         |
| `useExportModal`       | Export modal state management (PDF/DOCX)          | —         |
| `useGenerations`       | Generations list with realtime + filters          | ✅        |
| `useJobApplications`   | Job application CRUD + Supabase Realtime          | ✅        |
| `useAtsScores`         | ATS scores per resume version (with cache)        | —         |
| `useAtsScans`          | ATS scan history with Realtime                    | ✅        |
| `useChatEdit`          | Chat-based LaTeX editing in the canvas editor     | —         |
| `useJobPolling`        | Legacy polling (deprecated)                       | —         |
| `useJobRealtime`       | Supabase Realtime subscription for single job     | ✅        |
| `useProfile`           | User profile data                                 | —         |
| `usePurchaseHistory`   | Stripe purchase history                           | —         |
| `useBilling`           | Subscription billing state                        | —         |
| `useRecentGenerations` | Dashboard home recent generations widget          | ✅        |
| `useResumeVersions`    | Resume versions CRUD with realtime                | ✅        |
| `useSavedJds`          | Saved JDs CRUD with realtime                      | ✅        |
| `useUserResume`        | Fetch user's latest resume                        | —         |

---

## 8) Realtime Architecture

### Strategy

- **Supabase Realtime** subscriptions to database tables — no manual refresh, no polling.
- **CreditsProvider** (`providers/CreditsProvider.tsx`): Wraps the entire dashboard layout so all `useCredits()` consumers share a **single Realtime channel**.
- Subscriptions are cleaned up on unmount/navigation.

### Realtime Scope

| Surface               | What updates                                          | Hook                  |
| ---------------------- | ---------------------------------------------------- | --------------------- |
| Past Generations list  | Job status, new jobs, PDF status changes             | `useGenerations`      |
| Dashboard Home         | Recent generations, processing indicators            | `useRecentGenerations`|
| Credits (everywhere)   | Credits count after deduction or purchase             | `useCredits`          |
| Resume Versions        | New uploads, deletions, default changes              | `useResumeVersions`   |
| Saved JDs              | Creates, edits, deletes                              | `useSavedJds`         |
| Editor job status      | Single-job status + PDF readiness                    | `useJobRealtime`      |
| Job Applications       | Stage moves, new applications, deletions             | `useJobApplications`  |
| ATS Scan History       | New scan results                                     | `useAtsScans`         |

---

## 9) Auth Protection

All dashboard routes are **protected** via Next.js middleware (`middleware.ts`).

- Unauthenticated visits to `/dashboard/*` redirect to `/?authRequired=true&next=/dashboard/...`
- After login, redirects back to the originally requested route.
- Dashboard API endpoints enforce server-side authorization.
- Admin endpoints additionally check admin role via `lib/admin/guard.ts`.

---

## 10) Implementation Status

| Feature                                       | Status |
| --------------------------------------------- | ------ |
| Dashboard Shell (sidebar-only layout)          | ✅     |
| Mobile sidebar drawer (`SidebarProvider`)      | ✅     |
| Dashboard Home (overview + quick actions)      | ✅     |
| Past Generations / Saved Jobs                  | ✅     |
| Tailor Resume (generate with modes)            | ✅     |
| LinkedIn profile import                        | ✅     |
| Credits & Billing (with Stripe portal)         | ✅     |
| Saved JDs (full CRUD + realtime)               | ✅     |
| My Resumes (card grid + ResumePreviewCard)     | ✅     |
| Download Center                                | ✅     |
| Profile / Settings / Account                  | ✅     |
| PDF Editor (with AI chat-edit + export modal)  | ✅     |
| Job Application Tracker (Kanban)               | ✅     |
| ATS Checker (score + keyword analysis)         | ✅     |
| ATS Scan History                               | ✅     |
| Admin Panel (role-gated)                       | ✅     |
| Realtime across all surfaces                   | ✅     |
| Browse Jobs / Job Discovery                    | 🚧     |

---

## 11) Guardrails

- No top header bar — sidebar-only layout.
- Do not add a standalone header component back.
- Sidebar nav is for "work/product" routes only.
- Realtime updates are the default — never fall back to "refresh to see."
- Admin-only features must always be gated by role check.
- ATS scores must be persisted to `resume_versions` — never re-fetch on every page load.

---

_Last updated: 2026-04-29_

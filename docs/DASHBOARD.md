# DASHBOARD.md — ATSResumie Dashboard Architecture & Context

> This document defines the **architecture**, **information architecture**, **UX rules**, and **implementation status** for the ATSResumie Dashboard.

---

## 1) What the Dashboard Is

The Dashboard is the **returning user workspace** for ATSResumie.

It is a multi-page control center where users can:

- **Generate again quickly** — resume generation from the dashboard
- **Find and reuse past generations** — search, filter, re-download
- **Manage resume versions** — upload, set default, duplicate detection
- **Manage saved job descriptions** — full CRUD with search/sort
- **Access downloads easily** — centralized download center
- **Understand credits and usage** — live credits, billing management
- **Style and export** — full PDF editor + PDF/DOCX export modal
- **See changes instantly via Realtime** — no refresh required

### Dashboard ≠ Onboarding

- `/get-started` is the guided onboarding flow (public).
- `/dashboard` is where logged-in users return to work efficiently.

---

## 2) Core UX Principles

1. **Fast repeat usage** — "Generate again" is always 1 click away.
2. **Library-first retention** — Past Generations is the user's reliable, searchable, re-downloadable library.
3. **Trust through transparency** — Credits are always visible (header pill, sidebar, credits page).
4. **No clutter** — Multi-page structure with consistent sidebar navigation.
5. **Realtime-first** — Supabase Realtime subscriptions over polling. Dashboard updates instantly.

---

## 3) Layout Architecture

### Shell Components

| Component          | File                                        | Purpose                                                |
| ------------------ | ------------------------------------------- | ------------------------------------------------------ |
| `DashboardLayout`  | `app/dashboard/layout.tsx`                  | Client component. Wraps everything in `CreditsProvider` |
| `DashboardHeader`  | `components/dashboard/DashboardHeader.tsx`   | Fixed top bar with logo, feedback, credits pill, profile |
| `DashboardSidebar` | `components/dashboard/DashboardSidebar.tsx`  | Fixed left sidebar (hidden on mobile, slide-in overlay) |
| `ProfileDropdown`  | `components/shared/ProfileDropdown.tsx`       | Avatar dropdown with nav + account + support + logout   |

### Layout Structure

```
┌──────────────────────────────────────────────────────┐
│  DashboardHeader (fixed, z-50)                       │
│  [☰ mobile] [Logo]              [Feedback] [💳] [👤] │
├──────────┬───────────────────────────────────────────┤
│ Sidebar  │  <main> children                          │
│ (w-64)   │  pt-14 md:pt-16, md:pl-64                │
│          │                                           │
│ ─────────│                                           │
│ Dashboard│                                           │
│ Generate │                                           │
│ Past Gens│                                           │
│ Saved JDs│                                           │
│ Resumes  │                                           │
│ Downloads│                                           │
│ Credits  │                                           │
│ ─────────│                                           │
│ [Upgrade]│                                           │
│ [Admin]  │                                           │
│ [Logout] │                                           │
└──────────┴───────────────────────────────────────────┘
```

### Header Details

- **Left**: Hamburger (mobile only) + Logo (links to `/`)
- **Right**: Feedback button (`FeedbackButton`) + Credits pill (`CreditsPill`, links to `/dashboard/credits`) + Profile avatar (`ProfileDropdown`)
- Fixed position, `h-14 md:h-16`

### Sidebar Details

**Navigation links** (7 items):

| Label              | Route                    | Icon        |
| ------------------ | ------------------------ | ----------- |
| Dashboard          | `/dashboard`             | `Home`      |
| Generate           | `/dashboard/generate`    | `Sparkles`  |
| Past Generations   | `/dashboard/generations` | `History`   |
| Saved JDs          | `/dashboard/saved-jds`   | `Bookmark`  |
| Resume Versions    | `/dashboard/resumes`     | `FileText`  |
| Download Center    | `/dashboard/downloads`   | `Download`  |
| Credits & Billing  | `/dashboard/credits`     | `CreditCard`|

**Bottom section:**

- **Upgrade/Buy credits** button — conditionally shown based on purchase history + credit balance (hidden when `hasPurchasedBefore && credits > 15`)
- **Admin Panel** button — conditionally shown when `/api/admin/check` returns `isAdmin: true`
- **Sign Out** button

**Active state**: Left accent border (`border-l-2 border-accent`) + raised background

**Responsive behavior**: Desktop = always visible (`md:translate-x-0`), Mobile = slide-in overlay with backdrop blur

### Profile Dropdown Sections

| Section       | Contents                                               |
| ------------- | ------------------------------------------------------ |
| Account       | User email                                             |
| Credits Row   | Clickable card → `/dashboard/credits`, shows count     |
| Navigation    | Dashboard Home, Generate, Past Generations             |
| Account Pages | Profile, Settings, Account Information                |
| Support       | mailto: `support@atsresumie.com`                       |
| Logout        | Sign out + redirect to `/`                             |

---

## 4) Navigation Rules (Non-negotiable)

- **Profile/Settings/Account** are in the **avatar dropdown only**, NOT in the sidebar.
- Sidebar contains only "work/product" navigation.
- Admin panel link appears only for admin users.
- The header is always visible across all `/dashboard/*` routes.

---

## 5) Routes Map

### Sidebar Routes

| Route                         | Page                                  |
| ----------------------------- | ------------------------------------- |
| `/dashboard`                  | Dashboard Home (default)              |
| `/dashboard/generate`         | Generate (dashboard version)          |
| `/dashboard/generations`      | Past Generations (library)            |
| `/dashboard/saved-jds`        | Saved Job Descriptions                |
| `/dashboard/resumes`          | Resume Versions                       |
| `/dashboard/downloads`        | Download Center                       |
| `/dashboard/credits`          | Credits & Billing                     |

### Avatar Dropdown Routes

| Route                         | Page                                  |
| ----------------------------- | ------------------------------------- |
| `/dashboard/profile`          | Profile                               |
| `/dashboard/settings`         | Settings                              |
| `/dashboard/account`          | Account Information                   |

### Admin Route

| Route                         | Page                                  |
| ----------------------------- | ------------------------------------- |
| `/dashboard/admin`            | Admin Panel (role-gated)              |

### Editor Route

| Route                              | Page                             |
| ---------------------------------- | -------------------------------- |
| `/dashboard/editor/[jobId]`        | PDF Editor for a specific job    |

---

## 6) Page Details (What Each Page Does)

### `/dashboard` — Home ✅

- **Quick Actions Grid**: Generate / View Generations / Resumes / Downloads
- **Recent Generations Card**: Latest 5 generations with status, realtime updates
- **Credits Card**: Current balance with visual indicator
- **Components**: `QuickActionsGrid`, `RecentGenerationsCard`, `CreditsCard`

### `/dashboard/generate` — Generate ✅

Dashboard generator (not a clone of `/get-started`).

- **JD input**: Paste or select from saved JDs
- **Resume selection**: Choose from resume versions (`ResumeSelector`)
- **Mode selector**: Quick / Deep / From Scratch (`ModeSelector`)
- **JD quality indicator**: Warns about too-short or incomplete JDs (`JdQualityIndicator`)
- **Quick upload modal**: Upload resume inline (`QuickUploadModal`)
- **Past generation picker**: Reuse JD from a previous generation (`PastGenerationPicker`)
- **Auto-save**: Draft JD autosaved via `useDraftJd` hook
- **Components**: `ModeSelector`, `ResumeSelector`, `JdQualityIndicator`, `QuickUploadModal`, `PastGenerationPicker`

### `/dashboard/generations` — Past Generations ✅

The user's generation library with full management capabilities.

- **Job rows**: Title, company, mode, status badges, date, credits used (`GenerationJobRow`)
- **Status badges**: Queued → Processing → Succeeded/Failed + PDF status (`JobStatusBadge`)
- **Filters**: Status, date range, mode (`GenerationsFilters`)
- **Details drawer**: Full generation details with actions (`GenerationDetailsDrawer`)
- **Delete**: Confirmation dialog (`DeleteJobDialog`)
- **Realtime**: Instant updates via `useGenerations` hook
- **Actions**: View result, Download PDF/DOCX, Re-generate, Delete
- **Components**: `GenerationJobRow`, `GenerationsFilters`, `GenerationDetailsDrawer`, `DeleteJobDialog`

### `/dashboard/saved-jds` — Saved JDs ✅

Full CRUD for reusable job descriptions.

- **Fields**: Label (required), Company, Source URL (optional), JD text (required)
- **Use-to-generate**: One-click prefills Generate page via localStorage
- **CRUD**: Create, Edit, Delete with confirmation
- **Search**: By label/company
- **Sort**: Newest/Oldest
- **Realtime**: Updates across tabs via `useSavedJds` hook

### `/dashboard/resumes` — Resume Versions ✅

Resume file management with version control.

- **Upload**: PDF/DOCX with drag-and-drop
- **Set default**: Mark a resume as the default for generation
- **Duplicate detection**: Warns when uploading an identical file
- **Delete**: With guard for default resume
- **Realtime**: Via `useResumeVersions` hook

### `/dashboard/downloads` — Download Center ✅

Centralized access to all exported files.

- **List**: All exported PDFs with metadata
- **Search/sort**: By date, job title
- **Download**: Direct download without opening a generation
- **Source link**: Links back to the source generation
- **Data hook**: `useDownloads`

### `/dashboard/credits` — Credits & Billing ✅

Full credits and subscription management.

- **Credits remaining**: Live count with realtime updates
- **Credit cost explanation**: What uses credits (generation only)
- **Credit history**: Based on generation history (`useCreditHistory`)
- **Purchase history**: Stripe purchases (`usePurchaseHistory`)
- **Buy/Upgrade**: Stripe checkout integration
- **Billing Management** (via `useBilling` hook):
    - Subscription status display (Active / Canceling / Past Due / Canceled)
    - Renewal + cancellation date display
    - "Manage billing" button → Stripe Customer Portal
    - Portal handles: payment methods, invoices, cancellation

> **Gotcha:** Stripe Customer Portal sets `cancel_at` (a timestamp) rather than `cancel_at_period_end: true`. The `useBilling` hook checks both.

### `/dashboard/profile` — Profile ✅

User profile management via avatar dropdown.

- Name, email, role/title
- Core skills, preferred industries
- Location (optional)

### `/dashboard/settings` — Settings ✅

Account settings via avatar dropdown.

- Password/auth methods
- Connected provider (Google)
- Email preferences

### `/dashboard/account` — Account Information ✅

Account details via avatar dropdown.

- Plan type
- Subscription details

### `/dashboard/editor/[jobId]` — PDF Editor ✅

Full-featured PDF styling editor (see `docs/CANVAS.md` for full architecture).

- **PDF.js Preview**: Scrollable all-pages view with zoom (50–300%)
- **HiDPI**: Canvas renders at `scale × devicePixelRatio` for Retina
- **Style Controls**: Font family, page size, margins, font size, line height, section spacing
- **Auto-Recompile**: 800ms debounce after style changes
- **Export Modal**: Unified PDF/DOCX download (`ExportModal` + `useExportModal`)
- **Components**: `EditorControls`, `ResumeEditorShell`, `ResumeContent`, `ResumePreview`, `PdfJsPreview`, `StyleControls`, `EditorLoadingState`, `EditorErrorState`

### `/dashboard/admin` — Admin Panel ✅

Role-gated admin dashboard (see `CONTEXT.md` § Admin Panel for full details).

- **Access**: Gated by admin role check (`/api/admin/check`)
- **Features**: User management, credit adjustments, email sending, generation stats, overview metrics
- **Components**: `AdminAccessDenied`, `AdminSidebar`, `OverviewMetrics`, `CreditAdjustDialog`, `EmailSendDialog`

---

## 7) Shared Components

| Component               | File                                           | Usage                                     |
| ------------------------ | ---------------------------------------------- | ----------------------------------------- |
| `CreditsPill`            | `components/shared/CreditsPill.tsx`            | Header credits display                    |
| `ProfileDropdown`        | `components/shared/ProfileDropdown.tsx`         | Avatar dropdown menu                      |
| `EmptyState`             | `components/shared/EmptyState.tsx`              | Reusable empty-state placeholder          |
| `ErrorState`             | `components/shared/ErrorState.tsx`              | Reusable error display                    |
| `JobStatusBadge`         | `components/shared/JobStatusBadge.tsx`          | Job status badge (queued/processing/etc.) |
| `FeedbackModal`          | `components/dashboard/FeedbackModal.tsx`        | User feedback submission modal            |
| `ExportModal`            | `components/dashboard/ExportModal.tsx`          | PDF/DOCX export download modal            |

---

## 8) Hooks

All dashboard hooks are in the `hooks/` directory:

| Hook                   | Purpose                                         | Realtime? |
| ---------------------- | ----------------------------------------------- | --------- |
| `useAuth`              | Auth state (user, signOut)                      | —         |
| `useAuthIntent`        | Preserve + restore auth intent after login      | —         |
| `useCredits`           | Credits count with realtime subscription        | ✅        |
| `useCreditHistory`     | Credit usage history from generations           | —         |
| `useDownloads`         | Download center data                            | —         |
| `useDraftJd`           | Auto-save draft JD text on Generate page        | —         |
| `useExportModal`       | Export modal state management (PDF/DOCX)        | —         |
| `useGenerations`       | Generations list with realtime + filters        | ✅        |
| `useJobPolling`        | Legacy polling (deprecated)                     | —         |
| `useJobRealtime`       | Supabase Realtime subscription for single job   | ✅        |
| `useProfile`           | User profile data                               | —         |
| `usePurchaseHistory`   | Stripe purchase history                         | —         |
| `useBilling`           | Subscription billing state                      | —         |
| `useRecentGenerations` | Dashboard home recent generations widget        | ✅        |
| `useResumeVersions`    | Resume versions CRUD with realtime              | ✅        |
| `useSavedJds`          | Saved JDs CRUD with realtime                    | ✅        |
| `useUserResume`        | Fetch user's latest resume                      | —         |

---

## 9) Realtime Architecture

### Strategy

- **Supabase Realtime** subscriptions to database tables — no manual refresh, no polling.
- **CreditsProvider** (`providers/CreditsProvider.tsx`): Wraps the entire dashboard layout so all `useCredits()` consumers share a **single Realtime channel**.
- Subscriptions are cleaned up on unmount/navigation.

### Realtime Scope

| Surface               | What updates                                          | Hook                |
| ---------------------- | ---------------------------------------------------- | ------------------- |
| Past Generations list  | Job status, new jobs, PDF status changes             | `useGenerations`    |
| Dashboard Home         | Recent generations, processing indicators            | `useRecentGenerations` |
| Credits (everywhere)   | Credits count after deduction or purchase             | `useCredits`        |
| Resume Versions        | New uploads, deletions, default changes              | `useResumeVersions` |
| Saved JDs              | Creates, edits, deletes                              | `useSavedJds`       |
| Editor job status      | Single-job status + PDF readiness                    | `useJobRealtime`    |

### UX Expectations

- Status changes animate subtly (badge transitions).
- New items appear at the top (newest first by default).
- Failed jobs show clear retry actions + failure messages in the details drawer.

---

## 10) Auth Protection

All dashboard routes are **protected** via Next.js middleware (`middleware.ts`).

### Behavior

- If a user is **not authenticated** and visits any `/dashboard/*` route:
    - Redirect to `/` with `?authRequired=true&next=/dashboard/...`
    - After login, redirect back to the originally requested route.
- Dashboard API endpoints enforce **server-side authorization**: authenticated `user_id` must match data owner.
- Admin endpoints additionally check admin role via `lib/admin/guard.ts`.

### Acceptance Criteria

- ✅ Logged-out users cannot view any dashboard content.
- ✅ Authenticated users access dashboard routes normally.
- ✅ Redirect preserves intended destination after login.
- ✅ All data reads/writes are ownership-validated server-side.
- ✅ Admin routes are additionally role-gated.

---

## 11) Implementation Status

All phases are **complete**:

| Phase | Feature                                    | Status |
| ----- | ------------------------------------------ | ------ |
| 1     | Dashboard Shell (layout + sidebar)         | ✅     |
| 2     | Dashboard Home (overview + quick actions)  | ✅     |
| 3     | Past Generations (with filters + drawer)   | ✅     |
| 4     | Generate (with modes + resume selection)   | ✅     |
| 5     | Credits & Billing (with Stripe portal)     | ✅     |
| 6     | Saved JDs (full CRUD + realtime)           | ✅     |
| 7     | Resume Versions (with duplicate detection) | ✅     |
| 8     | Download Center                            | ✅     |
| 9     | Profile / Settings / Account               | ✅     |
| 10    | PDF Editor (with live preview + export)    | ✅     |
| 11    | Admin Panel (role-gated)                   | ✅     |
| 12    | Export Modal (PDF + DOCX)                  | ✅     |
| 13    | Realtime across all surfaces               | ✅     |

---

## 12) Guardrails

- Do not add Profile/Settings/Account to the sidebar.
- Do not remove or redesign the existing top nav / profile dropdown structure.
- Do not build a "single huge dashboard page" with everything stacked.
- Keep the dashboard focused on repeat usage + library.
- Realtime updates are the default — never fall back to "refresh to see."
- Admin-only features must always be gated by role check.

---

_Last updated: 2026-03-09_

# DASHBOARD.md — ATSResumie Dashboard Vision & Context (for Claude)

> Branch: `feat/dashboard`  
> Purpose: This document defines the **product vision**, **information architecture**, and **UX rules** for the ATSResumie Dashboard so implementation stays consistent and scoped across incremental phases.

---

## 1) What the Dashboard is (Vision)

The Dashboard is the **returning user workspace** for ATSResumie.

It should feel like a control center where users can:

- **Generate again quickly**
- **Find and reuse past generations**
- **Manage resume versions**
- **Manage saved job descriptions**
- **Access downloads easily**
- **Understand credits and usage**
- **See changes instantly via Realtime (no refresh)**

### Dashboard ≠ Onboarding

- `/get-started` is the guided onboarding flow.
- `/dashboard` is where users return to work efficiently.

---

## 2) Core UX Principles

1. **Fast repeat usage**
    - Make “Generate again” easy and always accessible.

2. **Library-first retention**
    - “Past Generations” is the user’s library and should be reliable, searchable, and re-downloadable.

3. **Trust through transparency**
    - Always show credits clearly. Make credit usage explainable.

4. **No clutter**
    - Avoid stuffing everything into one screen.
    - Use a multi-page dashboard structure with consistent navigation.

5. **Realtime-first**
    - Dashboard should update **instantly** when the DB changes.
    - Avoid “refresh to see updates” UX.
    - Prefer **Supabase Realtime subscriptions** over polling.

---

## 3) Navigation & Layout Rules (Non-negotiable)

### Persistent Top Nav (already implemented)

Top nav is present across the app and **must stay visible across all `/dashboard/*` routes**.

✅ Existing Top Nav includes:

- Links: `Pricing`, `How it works`, `FAQ`, and a `Dashboard` button
- Profile avatar dropdown (top-right) menu items:
    - Account (email)
    - Credits remaining (count)
    - Upgrade
    - Support
    - Log out

> Keep this as the baseline UI. Do not replace it.

---

## 4) Where Profile/Settings/Account Info Live

**DO NOT** place these in the left sidebar.

They must be accessible from the **profile avatar dropdown** (top-right) only:

- Profile
- Settings
- Account Information

---

## 5) Dashboard Information Architecture (Multi-page)

### Left Sidebar (Work / Product navigation)

Include only “work” features:

1. **Dashboard Home**
2. **Generate**
3. **Past Generations**
4. **Saved JDs**
5. **Resume Versions**
6. **Download Center**
7. **Credits & Billing** _(work-related trust/usage area)_

### Profile Avatar Dropdown (Account navigation)

Keep “account” features here:

- Profile
- Settings
- Account Information
- (Existing) Credits remaining display, Upgrade, Support, Log out

---

## 6) Routes Map (Proposed)

> Exact route names can be adjusted for code style, but must remain consistent across nav.

### Sidebar routes

- `/dashboard` — Dashboard Home (default)
- `/dashboard/generate` — Generate More (dashboard version of get-started)
- `/dashboard/generations` — Past Generations (library)
- `/dashboard/saved-jds` — Saved Job Descriptions
- `/dashboard/resumes` — Resume Versions
- `/dashboard/downloads` — Download Center
- `/dashboard/credits` — Credits & Billing

### Avatar dropdown routes

- `/dashboard/profile` — Profile
- `/dashboard/settings` — Settings
- `/dashboard/account` — Account Information

---

## 7) Page Intent (What each page must accomplish)

### `/dashboard` — Home

- Quick overview + shortcuts (not a full feature dump)
- Shows:
    - Quick actions (Generate / View Generations / Resumes / Downloads)
    - Recent generations preview (latest 5)
    - Credits summary
    - Optional: notifications / job status highlights
- Should reflect DB changes in near real-time where relevant (recent jobs, credits).

### `/dashboard/generations` — Past Generations (Core)

Must show per generation:

- Job title + company (or user label)
- Mode (Quick now; Deep/Scratch later)
- Status (pending/running/succeeded/failed)
- Date created
- Credits used
- Actions:
    - View result
    - Download PDF
    - Re-generate (same JD + settings)
    - Duplicate (copy into Generate)
    - Delete

Enhancements:

- Search + filters (status, date range, mode)
- Tags + pinned + notes (can be phased)

### `/dashboard/generate` — Generate More

Dashboard generator, not a clone of `/get-started`.

- Quick Generate (default):
    - Paste JD
    - Select resume version (default)
    - Generate button

- Advanced (collapsible):
    - Target title
    - Focus skills
    - Seniority
    - Tone/style (Conservative / Modern)
    - (Later) ATS vs Human readability slider

Smart helpers:

- Use last JD
- Use from past generation
- Auto-save drafts
- JD quality indicator (too short / missing requirements)

### `/dashboard/credits` — Credits & Billing

- Credits remaining
- What costs credits (generation only)
- Usage this month
- Credit history (last 10)
- Low credits warning banner
- Estimate credits before generate (based on mode)
- Buy credits placeholder (Stripe later)

### `/dashboard/saved-jds` ✅ Implemented

- Save reusable JD snippets with:
    - Label (required), Company, Source URL (optional), JD text (required)
- Use-to-generate (one click prefills Generate via localStorage)
- Full CRUD: Create, Edit, Delete with confirmation
- Search by label/company
- Sort by Newest/Oldest
- Realtime updates across tabs

### `/dashboard/resumes`

- Multiple resume versions (v1/v2/v3)
- Set default resume
- Delete version (guard default)
- (Later) compare versions

### `/dashboard/downloads`

- List all exported PDFs
- Search/sort
- Download without opening a generation
- Link back to source generation

### `/dashboard/profile`

- Name, email
- Current role/title
- Core skills list (editable)
- Preferred industries
- Location optional
- “Resume baseline summary” (auto, can be placeholder initially)
- Skills inventory (suggest + add/remove, can be placeholder initially)

### `/dashboard/settings`

- Password/auth methods
- Connected provider (Google)
- Email preferences (job completion email toggle)
- Data & privacy (delete account, export data later)
- Security (active sessions later)

### `/dashboard/account`

- Plan type (Free/Pro later)
- Limits (later)
- Renewal date (later)
- Invoices/receipts (later)
- Tax info (later)

---

## 8) Realtime Requirements (Critical)

### Goal

All relevant dashboard surfaces must update **instantly** as DB changes occur — without manual refresh.

### Realtime Scope (MVP priorities)

1. **Past Generations list**
    - Job status changes (`pending → running → succeeded/failed`)
    - New jobs appearing instantly
    - Updates to `pdf_object_path` / export availability

2. **Dashboard Home**
    - “Recent generations” preview updates instantly
    - Processing/completed indicators update instantly

3. **Credits remaining**
    - Credits count updates instantly after deduction or purchase (future)
    - Credits shown in top nav dropdown should reflect changes promptly

### Realtime Strategy

- Prefer **Supabase Realtime subscriptions** to the relevant tables (e.g., `generation_jobs`, credits ledger/table if present).
- Do not rely on hard refresh or periodic polling.
- If a page is open, the UI should update in-place in response to DB events.
- Ensure subscriptions are properly cleaned up on unmount/navigation.

### UX Expectations

- Status changes should animate subtly (badge changes, row highlight).
- New items should appear at the top (Newest first).
- For failed jobs, show a clear retry action and failure message access (details drawer).

---

## 9) Data & System Expectations (High level)

- Generation history is sourced from `generation_jobs` (status, timestamps, latex_text/pdf_object_path, error_message).
- Realtime updates should be supported for job status where possible (no polling).
- PDF export links should be accessible/re-downloadable from Past Generations and Download Center.
- Credits are deducted on generation success only (export is free).

> Implementation specifics are flexible; preserve expected UX and behaviors.

---

## 10) Default Behavior

- Default landing after login or after completing a generation flow:
    - Redirect to `/dashboard`
- The dashboard home should surface:
    - Recent generations preview
    - A clear CTA to “Generate”
- If a job was just created, dashboard can highlight it (optional enhancement).

---

## 11) Phased Delivery (Chunked Implementation)

Dashboard development is split into phases; do not attempt to build everything at once.

Recommended order:

1. Dashboard Shell (layout + sidebar) ✅ Completed
2. Dashboard Home (overview + links) ✅ Completed
3. Past Generations (MVP) ✅ Completed
4. Generate More (MVP) ✅ Completed
5. Credits & Billing (MVP) ✅ Completed
6. Saved JDs ✅ Completed
7. Resume Versions
8. Download Center
9. Profile/Settings/Account pages via dropdown
10. Realtime polish + tags/notes/pins enhancements

---

## 12) Definition of Done (for each phase)

A phase is “done” when:

- The routes compile and render without broken navigation.
- The feature works end-to-end for its scope.
- Empty/loading/error states exist (even basic).
- Realtime behavior is implemented where relevant for that phase (or explicitly stubbed with a clear follow-up task).
- It does not introduce unrelated refactors.

---

## 13) Guardrails

- Do not add Profile/Settings/Account Info to sidebar.
- Do not remove or redesign the existing top nav dropdown baseline.
- Do not build a “single huge dashboard page” with everything stacked.
- Keep the dashboard experience focused on repeat usage + library.
- Realtime updates should be the default expectation for dashboard lists and status indicators.

---

## 14) Auth Protection (Required)

All dashboard pages must be **protected** and accessible **only when the user is logged in**.

### Scope

This applies to **every** route under:

- `/dashboard`
- `/dashboard/*`

Including (but not limited to):

- `/dashboard/generate`
- `/dashboard/generations`
- `/dashboard/saved-jds`
- `/dashboard/resumes`
- `/dashboard/downloads`
- `/dashboard/credits`
- `/dashboard/profile`
- `/dashboard/settings`
- `/dashboard/account`

### Expected UX

- If a user is **not authenticated** and visits any `/dashboard/*` route:
    - Redirect them to the authentication entry (login/signup).
    - After successful login, return them to the originally requested dashboard route.

### Security Requirements

Client-side gating is not enough.

- Dashboard-related API endpoints must enforce **server-side authorization**:
    - The authenticated `user_id` must match the owner of the data being fetched/modified.
    - No cross-user data leakage is allowed (generation history, resume files, downloads, credits, saved JDs).

### Acceptance Criteria

- ✅ Logged-out users cannot view any dashboard content (no partial rendering).
- ✅ Authenticated users can access dashboard routes normally.
- ✅ Redirect preserves the intended destination route after login.
- ✅ All data reads/writes used by dashboard are ownership-validated server-side.

# PDF Editor — Canvas Architecture

> Technical documentation for the PDF-first resume editor feature at `/dashboard/editor/[jobId]`.

---

## Overview

The PDF Editor allows users to visually adjust formatting of their AI-generated resumes and see real-time PDF previews. It renders the actual compiled PDF via PDF.js, injects style modifications into the LaTeX source, and recompiles on every change. The editor sits inside the dashboard shell but uses a fixed-height layout (`calc(100vh - header)`) so only the PDF area scrolls.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Editor Page (Client)                        │
│  /dashboard/editor/[jobId]/page.tsx                             │
│                                                                 │
│  ┌──────────────┐   styleConfig    ┌──────────────────────────┐ │
│  │ StyleControls │ ──────────────► │ Auto-recompile (800ms)   │ │
│  │              │                  │ debounce → API call      │ │
│  │ • Font Family│                  └────────┬─────────────────┘ │
│  │ • Page Size  │                           │                   │
│  │ • Margins    │                           ▼                   │
│  │ • Font Size  │                  ┌──────────────────────────┐ │
│  │ • Line Height│                  │ POST /api/export-pdf-    │ │
│  │ • Spacing    │                  │      with-style          │ │
│  └──────────────┘                  └────────┬─────────────────┘ │
│                                             │                   │
│  ┌──────────────────────────────────────┐   │                   │
│  │ PdfJsPreview                         │   │                   │
│  │ • Scrollable all-pages view          │◄──┘ (new pdfUrl)     │
│  │ • Zoom controls (50%-300%)           │                       │
│  │ • Ctrl/Cmd + scroll wheel zoom       │                       │
│  └──────────────────────────────────────┘                       │
│                                                                 │
│  ┌──────────────────────────────────────┐                       │
│  │ Top Bar                              │                       │
│  │ • Back button   • Filename input     │                       │
│  │ • Zoom controls • Recompile button   │                       │
│  │ • Download PDF                       │                       │
│  └──────────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Backend API                                    │
│  /api/export-pdf-with-style/route.ts                            │
│                                                                 │
│  1. Auth check (Supabase)                                       │
│  2. Fetch job.latex_text from DB                                │
│  3. applyStyleToLatex(latex, styleConfig)                       │
│     ├─ Strip existing geometry/setspace/font packages           │
│     ├─ Inject style block after \documentclass                  │
│     └─ Inject \fontsize after \begin{document}                  │
│  4. Compile via latex-online.cc                                 │
│  5. Upload PDF to Supabase Storage                              │
│  6. Optionally save styled LaTeX (saveLatex: true)              │
│  7. Return signed URL                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Map

### Core Files

| File                                       | Purpose                                                |
| ------------------------------------------ | ------------------------------------------------------ |
| `web/app/dashboard/editor/[jobId]/page.tsx`    | Main editor page — layout, state, auto-recompile logic |
| `web/components/editor/PdfJsPreview.tsx`       | PDF.js renderer — scrollable, zoomable, all-pages view |
| `web/components/editor/StyleControls.tsx`      | Formatting panel — font, margins, spacing sliders      |
| `web/components/editor/EditorLoadingState.tsx` | Loading skeleton                                       |
| `web/components/editor/EditorErrorState.tsx`   | Error display with retry                               |
| `web/lib/latex/applyStyleToLatex.ts`           | LaTeX style injection + parsing utility                |
| `web/app/api/export-pdf-with-style/route.ts`   | Backend: compile styled LaTeX → PDF                    |
| `web/types/editor.ts`                          | `StyleConfig`, `LaTeXFontFamily`, font options         |

### Supporting Files

| File                             | Purpose                                     |
| -------------------------------- | ------------------------------------------- |
| `web/app/api/export-pdf/route.ts`    | Existing PDF export (used for initial load) |
| `web/public/pdf.worker.min.mjs`      | PDF.js web worker (copied via postinstall)  |
| `package.json`                   | `pdfjs-dist` dep + `postinstall` script     |
| `web/app/auth/verify-email/page.tsx` | Email verification confirmation page        |

---

## Data Flow

### 1. Initial Load (No Compile)

```
EditorPage → Supabase (job metadata + latex_text)
           → parseStyleFromLatex(latex_text) → initial slider values
           → POST /api/export-pdf → signed URL for original PDF
           → PdfJsPreview renders PDF
```

### 2. Style Change (Auto-Recompile)

```
User adjusts slider → setStyleConfig(newConfig)
                     → localStorage.setItem(...)
                     → 800ms debounce timer
                     → POST /api/export-pdf-with-style { jobId, styleConfig }
                       → applyStyleToLatex(latex_text, styleConfig)
                       → latex-online.cc compiles PDF
                       → Upload to Supabase Storage
                       → Return signed URL
                     → PdfJsPreview re-renders new PDF
```

### 3. Download (Save + Download)

```
User clicks Download → POST /api/export-pdf-with-style { saveLatex: true }
                       → Same as above + saves styled LaTeX to DB
                     → Fetch PDF blob → trigger browser download
```

---

## StyleConfig Schema

```typescript
interface StyleConfig {
	pageSize: "letter" | "a4";
	marginTopMm: number; // 5-40mm
	marginBottomMm: number;
	marginLeftMm: number;
	marginRightMm: number;
	baseFontSizePt: number; // 8-12pt
	lineHeight: number; // 0.8-1.5
	sectionSpacingPt: number; // 2-16pt
	fontFamily: LaTeXFontFamily;
}
```

---

## Font Family Support

| UI Label          | LaTeX Package           | Type       |
| ----------------- | ----------------------- | ---------- |
| Computer Modern   | _(none — default)_      | Serif      |
| Latin Modern      | `lmodern`               | Serif      |
| Times New Roman   | `mathptmx`              | Serif      |
| Palatino          | `palatino`              | Serif      |
| Charter           | `charter`               | Serif      |
| Bookman           | `bookman`               | Serif      |
| Helvetica / Arial | `helvet` + `\sfdefault` | Sans-Serif |

---

## LaTeX Style Injection Strategy

The `applyStyleToLatex()` function uses an **idempotent marker-based** approach:

1. **Remove** any existing `% ATSRESUMIE_STYLE_BLOCK_START...END` block
2. **Strip** existing `geometry`, `setspace`, and font packages from the template
3. **Build** a new style block with the user's settings
4. **Insert** the style block right after `\documentclass`
5. **Insert** `\fontsize` command after `\begin{document}`

This ensures styles can be re-applied any number of times without accumulating duplicate packages.

---

## parseStyleFromLatex()

Extracts current formatting from LaTeX source to initialize sliders:

| What        | How                                                      |
| ----------- | -------------------------------------------------------- |
| Page size   | Checks for `a4paper` vs `letterpaper`                    |
| Font size   | Parses `\documentclass[Xpt]` options                     |
| Margins     | Parses `\usepackage[top=...]{geometry}` options          |
| Line height | Parses `\setstretch{X}` value                            |
| Font family | Detects known font packages (`mathptmx`, `helvet`, etc.) |

Falls back to `DEFAULT_STYLE_CONFIG` for anything not found.

---

## Zoom System

- **Controls**: `[−] 100% [+]` buttons in the top bar
- **Keyboard**: `Ctrl/Cmd + scroll wheel` on the PDF area only
- **Range**: 50% – 300%, steps of 10%
- **Rendering**: Re-renders canvas at `scale × devicePixelRatio` for crisp HiDPI/Retina output
- **State**: Lifted to editor page so both top bar controls and PDF.js component share it

---

## HiDPI / Retina Rendering

PDF.js renders to a `<canvas>`. On HiDPI screens (e.g. Retina at 2x), a 1:1 canvas looks blurry. Fix:

1. **Internal resolution**: canvas renders at `scale × dpr` (e.g. 2× on Retina)
2. **CSS display size**: set via `style.width/height` at logical pixels (`scaledWidth / dpr`)
3. Result: crisp, sharp text at any zoom level

---

## Layout Integration

The editor lives inside the dashboard shell (`DashboardHeader` + `DashboardSidebar`). To prevent page-level scrolling:

- Dashboard layout adds `pt-14 md:pt-16` (header offset) and `md:pl-64` (sidebar offset)
- Editor page uses `h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)]` + `overflow-hidden`
- Only the PDF container inside `PdfJsPreview` has `overflow-auto`

```
┌─ Dashboard Layout ────────────────────────────────┐
│ ┌─ DashboardHeader (h-14/h-16, fixed) ──────────┐ │
│ └────────────────────────────────────────────────┘ │
│ ┌─ Sidebar ─┐ ┌─ Editor (calc height) ──────────┐ │
│ │           │ │ ┌─ Editor Top Bar ─────────────┐ │ │
│ │           │ │ └─────────────────────────────┘ │ │
│ │           │ │ ┌─ StyleControls ─┐ ┌─ PDF ──┐ │ │
│ │           │ │ │ (scrolls own)  │ │(scroll)│ │ │
│ │           │ │ └────────────────┘ └────────┘ │ │
│ └───────────┘ └─────────────────────────────────┘ │
└───────────────────────────────────────────────────┘
```

---

## Email Verification Flow

After email/password signup, users are redirected to `/auth/verify-email?email=...`:

1. **AuthModal** calls `signUp(email, password)`, then redirects to verification page
2. **Verify page** shows numbered steps (open inbox → click link → return to sign in)
3. **Resend button** calls `supabase.auth.resend({ type: "signup", email })`
4. After clicking the email link → `/auth/callback` → authenticated

---

## Persistence

| Data         | Storage                               | Scope                            |
| ------------ | ------------------------------------- | -------------------------------- |
| Style config | `localStorage` per jobId              | Client-side, restored on revisit |
| Filename     | `localStorage` per jobId              | Client-side                      |
| Styled LaTeX | `generation_jobs.latex_text`          | Server-side, saved on download   |
| Styled PDF   | `Supabase Storage` (`.../styled.pdf`) | Server-side                      |

---

## Key Dependencies

| Package           | Version  | Purpose                             |
| ----------------- | -------- | ----------------------------------- |
| `pdfjs-dist`      | `^4.x`   | Client-side PDF rendering to canvas |
| `latex-online.cc` | External | LaTeX → PDF compilation service     |

---

_Last updated: 2026-02-09_

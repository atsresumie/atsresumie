# PDF Editor — Canvas Architecture

> Technical documentation for the PDF-first resume editor at `/dashboard/editor/[jobId]`.

---

## Overview

The PDF Editor allows users to visually adjust formatting of their AI-generated resumes and make targeted AI-driven edits via a chat panel. It renders the actual compiled PDF via PDF.js, injects style modifications into the LaTeX source, recompiles on every change, and persists a final snapshot to the database. The editor sits inside the dashboard shell but uses a fixed-height layout (`calc(100vh - 0px)`) so only the PDF area scrolls.

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Editor Page (Client)                          │
│  /dashboard/editor/[jobId]/page.tsx                                  │
│                                                                      │
│  ┌─────────────────┐   ┌────────────────────┐   ┌─────────────────┐ │
│  │  EditorLeftRail  │   │   StyleControls    │   │   Top Bar       │ │
│  │                  │   │                    │   │ Back / Filename │ │
│  │  ┌────────────┐ │   │ • Font Family      │   │ Zoom / Recompile│ │
│  │  │ ChatPanel  │ │   │ • Page Size        │   │ Download PDF    │ │
│  │  │            │ │   │ • Margins          │   └─────────────────┘ │
│  │  │ AI chat    │ │   │ • Font Size        │                        │
│  │  │ edit flow  │ │   │ • Line Height      │                        │
│  │  │            │ │   │ • Spacing          │                        │
│  │  └────────────┘ │   └────────┬───────────┘                        │
│  └─────────────────┘            │ styleConfig                        │
│                                 ▼                                    │
│                        Auto-recompile (800ms debounce)               │
│                                 │                                    │
│                      ┌──────────▼──────────┐                         │
│                      │ POST /api/export-   │                         │
│                      │   pdf-with-style    │                         │
│                      └──────────┬──────────┘                         │
│                                 │ new pdfUrl                         │
│  ┌──────────────────────────────▼──────────────────────────────────┐ │
│  │  PdfJsPreview                                                   │ │
│  │  • Scrollable all-pages view   • Zoom (50–300%)                │ │
│  │  • Ctrl/Cmd + scroll wheel     • HiDPI canvas rendering        │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
                              │                          │
              Style compile   │                          │ Chat edit
                              ▼                          ▼
┌─────────────────────────────────────┐  ┌─────────────────────────────┐
│  /api/export-pdf-with-style         │  │  /api/chat-edit             │
│                                     │  │                             │
│  1. Auth check (Supabase)           │  │  1. Auth check              │
│  2. Fetch job.latex_text from DB    │  │  2. Fetch latex_text from DB│
│  3. sanitizeLatex(latex)            │  │  3. Stream to Claude via    │
│  4. applyStyleToLatex(latex, style) │  │     claudeChatEdit()        │
│  5. Compile via latex-backend /     │  │  4. Apply LaTeX diff        │
│     latex-online.cc (fallback)      │  │  5. Recompile PDF           │
│  6. Upload to Supabase Storage      │  │  6. Persist final_latex_text│
│  7. Optionally save styled LaTeX    │  │     + final_pdf_url         │
│  8. Return signed URL               │  │  7. Return pdfUrl + latex   │
└─────────────────────────────────────┘  └─────────────────────────────┘
```

---

## File Map

### Core Files

| File                                       | Purpose                                                      |
| ------------------------------------------ | ------------------------------------------------------------ |
| `app/dashboard/editor/[jobId]/page.tsx`    | Main editor page — layout, state, auto-recompile, snapshot   |
| `components/editor/PdfJsPreview.tsx`       | PDF.js renderer — scrollable, zoomable, all-pages view       |
| `components/editor/StyleControls.tsx`      | Formatting panel — font, margins, spacing sliders            |
| `components/editor/ChatPanel.tsx`          | AI chat-edit UI — message thread, suggestions, send form     |
| `components/editor/EditorLeftRail.tsx`     | Left sidebar rail containing `ChatPanel`                     |
| `components/editor/EditorLoadingState.tsx` | Loading skeleton                                             |
| `components/editor/EditorErrorState.tsx`   | Error display with retry                                     |
| `lib/latex/applyStyleToLatex.ts`           | LaTeX style injection + parsing utility                      |
| `lib/latex/sanitizeLatex.ts`               | Auto-inject missing packages, strip incompatible ones        |
| `lib/llm/claudeChatEdit.ts`                | Claude streaming chat-edit logic (LaTeX diff)                |
| `app/api/export-pdf-with-style/route.ts`   | Backend: compile styled LaTeX → PDF                          |
| `app/api/chat-edit/route.ts`               | Backend: streaming Claude chat-edit endpoint                 |
| `hooks/useChatEdit.ts`                     | Chat-edit state: messages, send, clear, localStorage persist |
| `types/chat.ts`                            | `ChatMessage`, `ChatRole`, `ChatStatus` types + storage keys |
| `types/editor.ts`                          | `StyleConfig`, `LaTeXFontFamily`, font options               |

### Supporting Files

| File                             | Purpose                                       |
| -------------------------------- | --------------------------------------------- |
| `app/api/export-pdf/route.ts`    | PDF export (used for initial load + fallback) |
| `lib/llm/prompts.ts`             | Prompt templates (including chat-edit prompt) |
| `public/pdf.worker.min.mjs`      | PDF.js web worker (copied via postinstall)    |

---

## Data Flow

### 1. Initial Load

```
EditorPage → Supabase (job metadata + latex_text + final_latex_text + final_pdf_url)
           → If final_pdf_url exists: hydrate directly (no compile)
           → Else: POST /api/export-pdf → signed URL for original PDF
           → parseStyleFromLatex(latex_text) → initial slider values
           → PdfJsPreview renders PDF
```

### 2. Style Change (Auto-Recompile)

```
User adjusts slider → setStyleConfig(newConfig)
                     → localStorage.setItem(...)
                     → 800ms debounce timer
                     → POST /api/export-pdf-with-style { jobId, styleConfig }
                       → sanitizeLatex(latex_text)
                       → applyStyleToLatex(latex_text, styleConfig)
                       → latex-backend / latex-online.cc compiles PDF
                       → Upload to Supabase Storage
                       → Return signed URL
                     → PdfJsPreview re-renders new PDF
```

### 3. Chat Edit

```
User types instruction → ChatPanel → useChatEdit.send(message)
                        → POST /api/chat-edit { jobId, message, history }
                          → Fetch latex_text from DB
                          → Stream to Claude via claudeChatEdit()
                          → Claude returns modified LaTeX
                          → Recompile via latex-backend
                          → Persist final_latex_text + final_pdf_url to DB
                          → Return { pdfUrl, latex }
                        → onApplied({ pdfUrl, latex })
                        → PdfJsPreview updates with new PDF
```

### 4. Download (Save + Download)

```
User clicks Download → POST /api/export-pdf-with-style { saveLatex: true }
                       → Same as style-change flow + saves styled LaTeX to DB
                     → Fetch PDF blob → trigger browser download
```

---

## StyleConfig Schema

```typescript
interface StyleConfig {
  pageSize: "letter" | "a4";
  marginTopMm: number;        // 5–40mm
  marginBottomMm: number;
  marginLeftMm: number;
  marginRightMm: number;
  baseFontSizePt: number;     // 8–12pt
  lineHeight: number;         // 0.8–1.5
  sectionSpacingPt: number;   // 2–16pt
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

`applyStyleToLatex()` uses an **idempotent marker-based** approach:

1. **Remove** any existing `% ATSRESUMIE_STYLE_BLOCK_START...END` block
2. **Strip** existing `geometry`, `setspace`, and font packages from the template
3. **Build** a new style block with the user's settings
4. **Insert** the style block right after `\documentclass`
5. **Insert** `\fontsize` command after `\begin{document}`

This ensures styles can be re-applied any number of times without accumulating duplicate packages.

## LaTeX Sanitization

`sanitizeLatex()` (`lib/latex/sanitizeLatex.ts`) runs before every compile:

- **Auto-injects** commonly missing packages that templates rely on
- **Strips** packages known to be incompatible with the compile environment
- Called in both `/api/export-pdf-with-style` and `/api/chat-edit` before compilation

---

## Chat Edit Panel

### ChatPanel Component

`components/editor/ChatPanel.tsx` — the chat UI mounted in `EditorLeftRail`:

- **Message thread**: Scrollable list of user and assistant messages
- **Suggestion chips**: Pre-populated prompts (e.g., "Shorten my summary to two sentences.")
- **Send form**: Textarea with `Enter` to send, `Shift+Enter` for newline
- **Clear button**: Resets message history (confirmation-free)
- **Loading state**: Spinner on assistant turn

### useChatEdit Hook

`hooks/useChatEdit.ts` — manages chat state and API calls:

- **Persistence**: Chat history stored in `localStorage` keyed by `jobId` (`CHAT_HISTORY_STORAGE_KEY_PREFIX + jobId`)
- **Max turns**: Capped at `CHAT_HISTORY_MAX_TURNS` to avoid unbounded context
- **Hydration**: Accepts `initialMessages` pre-populated from DB snapshot; falls back to localStorage
- **`send(message)`**: Posts to `/api/chat-edit`, streams response, calls `onApplied` with updated PDF + LaTeX
- **`clear()`**: Resets messages and clears localStorage

### Chat Types (`types/chat.ts`)

```typescript
type ChatRole = "user" | "assistant";
type ChatStatus = "pending" | "done" | "error";

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  status: ChatStatus;
  createdAt: string;
}
```

---

## Final PDF Snapshot Persistence

Migration `20260427000000_editor_snapshot.sql` added `final_latex_text` and `final_pdf_url` columns to `generation_jobs`.

- **On chat edit**: `final_latex_text` and `final_pdf_url` are persisted to the job row after each successful edit.
- **On load**: The editor checks for `final_pdf_url` first — if present, it hydrates directly without triggering a compile.
- This avoids redundant re-compilation on every revisit.

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

---

## HiDPI / Retina Rendering

PDF.js renders to a `<canvas>`. On HiDPI screens (e.g. Retina at 2×):

1. **Internal resolution**: canvas renders at `scale × dpr`
2. **CSS display size**: set via `style.width/height` at logical pixels (`scaledWidth / dpr`)
3. Result: crisp, sharp text at any zoom level

---

## Layout Integration

Editor uses a sidebar-only dashboard layout (no top header bar):

```
┌─ Dashboard Layout ────────────────────────────────────┐
│ ┌─ Sidebar (w-64) ─┐ ┌─ Editor (full height) ───────┐ │
│ │                  │ │ ┌─ Editor Top Bar ───────────┐ │ │
│ │                  │ │ └───────────────────────────┘ │ │
│ │                  │ │ ┌─ LeftRail ─┐ ┌─ StyleCtrl─┐┌─PDF─┐│ │
│ │                  │ │ │ ChatPanel  │ │  sliders   ││     ││ │
│ │                  │ │ │            │ │            ││(scrl)││ │
│ │                  │ │ └────────────┘ └────────────┘└─────┘│ │
│ └──────────────────┘ └──────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

---

## Persistence Summary

| Data              | Storage                                  | Scope                            |
| ----------------- | ---------------------------------------- | -------------------------------- |
| Style config      | `localStorage` per jobId                 | Client-side, restored on revisit |
| Filename          | `localStorage` per jobId                 | Client-side                      |
| Chat history      | `localStorage` per jobId                 | Client-side, capped at max turns |
| Styled LaTeX      | `generation_jobs.latex_text`             | Server-side, saved on download   |
| Final LaTeX       | `generation_jobs.final_latex_text`       | Server-side, saved after chat edit|
| Final PDF         | `generation_jobs.final_pdf_url`          | Server-side, hydrated on load    |
| Styled PDF        | `Supabase Storage` (`.../styled.pdf`)    | Server-side                      |

---

## Key Dependencies

| Package           | Version  | Purpose                               |
| ----------------- | -------- | ------------------------------------- |
| `pdfjs-dist`      | `^4.x`   | Client-side PDF rendering to canvas   |
| `latex-backend`   | Internal | Self-hosted LaTeX → PDF (primary)     |
| `latex-online.cc` | External | LaTeX → PDF fallback                  |
| `@anthropic-ai/sdk` | Latest | Claude streaming for chat-edit        |

---

_Last updated: 2026-04-29_

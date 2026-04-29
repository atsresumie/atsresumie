# MICROSERVICE.md — ATSResumie Backend Microservices

> Documentation for the backend microservices in the [`atsresumie/microservices`](https://github.com/atsresumie/microservices) repository.

---

## Overview

The microservices repo houses two standalone Express/TypeScript services that power ATSResumie's PDF compilation and ATS scoring:

| Service          | Port | Status    | Description                                      |
| ---------------- | ---- | --------- | ------------------------------------------------ |
| `latex-backend`  | 8080 | ✅ Active | Self-hosted LaTeX → PDF compilation              |
| `ATS_Score`      | 8081 | ✅ Active | Deterministic ATS resume scoring engine (Claude) |

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      ATSResumie (Next.js)                        │
│                                                                  │
│  /api/export-pdf ────┐  /api/ats-check ───┐  /api/ats-score ──┐ │
│  /api/export-pdf-    │                    │                    │ │
│  with-style ─────────┘                    │                    │ │
└───────────────────────┬───────────────────┬────────────────────┘ │
                        ▼                   ▼                      │
             ┌──────────────────┐  ┌──────────────────────────────┐
             │  latex-backend   │  │         ATS_Score             │
             │  POST /compile/pdf│  │  POST /analyze (with JD)     │
             │  (Express+TeX)   │  │  POST /analyze/general (PDF) │
             │  :8080           │  │  (Express + Claude Haiku 4.5)|
             └──────────────────┘  │  :8081                       │
                                   └──────────────────────────────┘
```

---

## Shared Conventions

Both services follow identical patterns:

- **Express + TypeScript** (ES2022, NodeNext, strict mode)
- **`x-request-id` middleware** — propagates or generates a UUID per request
- **Structured JSON logging** — `{ level, message, requestId, durationMs, ... }`
- **Typed `EnvConfig`** with `parsePositiveInt()` and safe defaults
- **Custom error classes** with `statusCode` + `code` fields
- **Consistent error shape** `{ error, message }`
- **Multi-stage Dockerfile** — build → runtime, non-root `node` user
- **Node.js ≥ 20**

### Scripts (per service)

| Script  | Command                     | Description                   |
| ------- | --------------------------- | ----------------------------- |
| `dev`   | `tsx watch src/server.ts`   | Dev server with hot reload    |
| `build` | `tsc -p tsconfig.json`      | Compile TypeScript to `dist/` |
| `start` | `node dist/server.js`       | Run production build          |
| `check` | `tsc --noEmit`              | Type-check only               |
| `lint`  | `eslint .`                  | Lint                          |

---

## latex-backend

Self-hosted LaTeX → PDF compilation API. Replaces `latex-online.cc` for improved security, reliability, timeout control, and payload limits.

### Tech Stack

| Technology | Purpose                              |
| ---------- | ------------------------------------ |
| Node.js ≥ 20 | Runtime                            |
| Express 4.x | HTTP framework                      |
| TypeScript 5.x | Type safety                      |
| `latexmk`  | LaTeX compilation orchestrator       |
| TeX Live (Debian bookworm) | LaTeX distribution  |
| Docker     | Production containerization          |

### Source Structure

```
latex-backend/
├── src/
│   ├── server.ts              # Express bootstrap, PATH check, startup
│   ├── config/env.ts          # Typed env config with safe defaults
│   ├── routes/compile.ts      # POST /compile/pdf route handler
│   └── services/
│       └── latexCompiler.ts   # latexmk execution + workspace management
├── Dockerfile                 # Multi-stage production image
└── .env.example
```

### API

#### `GET /health`

```json
{ "status": "ok", "uptimeSeconds": 124 }
```

#### `POST /compile/pdf`

Compiles raw LaTeX source into a PDF.

| Field        | Location    | Required | Description                                |
| ------------ | ----------- | -------- | ------------------------------------------ |
| Body         | body        | ✅       | Raw LaTeX source text                      |
| Content-Type | header      | ✅       | `text/plain` or `application/text`         |
| `filename`   | query param | ❌       | Output filename (default: `resume.pdf`)    |
| `x-filename` | header      | ❌       | Alternative filename override              |
| `x-request-id` | header    | ❌       | Trace ID (auto-generated if absent)        |

**Success (200):** Binary PDF with `Content-Type: application/pdf`.

**Example:**

```bash
curl -X POST "http://localhost:8080/compile/pdf?filename=resume.pdf" \
  -H "Content-Type: text/plain" \
  --data-binary @resume.tex \
  --output resume.pdf
```

**Error codes:**

| Code                  | HTTP | Trigger                                  |
| --------------------- | ---- | ---------------------------------------- |
| `validation_error`    | 400  | Empty or non-string body                 |
| `payload_too_large`   | 413  | LaTeX source exceeds `LATEX_MAX_LENGTH`  |
| `compile_failed`      | 422  | latexmk exited with non-zero code        |
| `compile_timeout`     | 504  | Compilation exceeded `COMPILE_TIMEOUT_MS`|
| `compiler_unavailable`| 500  | latexmk binary not found                 |
| `missing_artifact`    | 500  | PDF not found after compilation          |
| `internal_error`      | 500  | Unexpected server error                  |

### Compilation Workflow

1. Body parser enforces `REQUEST_BODY_LIMIT_BYTES`
2. Validates LaTeX string length against `LATEX_MAX_LENGTH`
3. `mkdtemp()` creates an isolated ephemeral workspace
4. LaTeX source written to `input.tex`
5. `latexmk` spawned with safety flags (`-no-shell-escape`, `-interaction=nonstopmode`, `-halt-on-error`, `-file-line-error`)
6. `setTimeout` enforces `COMPILE_TIMEOUT_MS` — kills with `SIGKILL` on timeout
7. On exit code 0: reads `input.pdf`, streams back as binary
8. `finally` block guarantees temp directory cleanup

### Environment Variables

| Variable                   | Default            | Description                      |
| -------------------------- | ------------------ | -------------------------------- |
| `HOST`                     | `0.0.0.0`          | Bind address                     |
| `PORT`                     | `8080`             | Listen port                      |
| `REQUEST_BODY_LIMIT_BYTES` | `1048576` (1 MB)   | Express body parser limit        |
| `LATEX_MAX_LENGTH`         | `500000` (500 KB)  | Max LaTeX source characters      |
| `COMPILE_TIMEOUT_MS`       | `30000` (30s)      | latexmk process timeout          |
| `TEMP_ROOT_DIR`            | `/tmp/latex-work`  | Base directory for temp workspaces|

### Security & Hardening

| Measure               | Implementation                                                 |
| --------------------- | -------------------------------------------------------------- |
| No shell escape       | `latexmk -no-shell-escape` — blocks arbitrary OS commands     |
| Payload limits        | Body parser + `LATEX_MAX_LENGTH` validation                    |
| Compile timeout       | `SIGKILL` after `COMPILE_TIMEOUT_MS`                          |
| Temp isolation        | Each request gets its own `mkdtemp()` workspace               |
| Non-root runtime      | Docker container runs as `node` user                           |
| Filename sanitization | Only alphanumeric, underscore, dot, hyphen allowed             |

### Docker

```bash
docker build -t latex-backend ./latex-backend
docker run --rm -p 8080:8080 latex-backend
```

**Dockerfile stages:**

- **Stage 1 (build)**: Node 20 bookworm-slim — installs deps + compiles TypeScript
- **Stage 2 (runtime)**: Installs TeX Live (`texlive-latex-base`, `texlive-latex-recommended`, `texlive-latex-extra`, `texlive-xetex`, `fonts-lmodern`, `fonts-dejavu`) + copies compiled output

### Local Development

**Prerequisites:** Node.js ≥ 20 + `latexmk` on PATH
- macOS: `brew install --cask mactex-no-gui`
- Linux: install the TeX Live packages listed in the Dockerfile

```bash
cd latex-backend
npm install
npm run dev  # http://localhost:8080
```

---

## ATS_Score

A production-ready ATS scoring engine powered by **Claude Haiku 4.5** via forced tool-use. Zero free-form AI output — all responses are structured JSON matching strict schemas.

### Tech Stack

| Technology | Purpose                                               |
| ---------- | ----------------------------------------------------- |
| Node.js ≥ 20 | Runtime                                             |
| Express    | HTTP framework                                        |
| TypeScript | Type safety                                           |
| Claude Haiku 4.5 | Scoring engine via `@anthropic-ai/sdk`          |
| `pdfjs-dist` | PDF text extraction (buffer + URL)                  |
| Docker     | Production containerization                           |

### Source Structure

```
ATS_Score/
├── src/
│   ├── server.ts                  # Express bootstrap + middleware
│   ├── config/env.ts              # Typed env config; requires ANTHROPIC_API_KEY
│   ├── routes/
│   │   ├── analyze.ts             # POST /analyze (with JD)
│   │   └── analyzeGeneral.ts      # POST /analyze/general (PDF input)
│   └── services/
│       ├── aiClient.ts            # Anthropic SDK singleton (lazy init)
│       ├── analyzer.ts            # analyzeResume() — targeted scoring
│       ├── generalScorer.ts       # scoreResumeGeneral() — general scoring
│       └── pdfExtractor.ts        # PDF text extraction orchestration
├── Dockerfile
└── .env.example
```

### Key Technical Principles

- **Forced tool use**: Both scorers call Claude with `tool_choice: { type: "tool" }` and `temperature: 0` — guarantees structured JSON, no free-form text.
- **Singleton SDK client**: `aiClient.ts` lazily initializes one `Anthropic` instance per process.
- **Request tracing**: `x-request-id` header propagated throughout the stack.

### API

#### `GET /health`

```json
{ "status": "ok", "service": "ats-score", "uptimeSeconds": 42 }
```

#### `POST /analyze` — Job-targeted scoring

Scores a resume text against a specific job description.

**Request:**

```json
{
  "jobDescription": "We need a React/Node.js developer with AWS experience...",
  "resumeText": "SUMMARY\nFull Stack Developer with 6 years..."
}
```

**Response:**

```json
{
  "score": 69,
  "breakdown": {
    "keywordMatch": 79,
    "experienceRelevance": 27,
    "sectionCompleteness": 100,
    "formatting": 90,
    "keywordDistribution": 41
  },
  "keywords": {
    "matched": ["react", "node.js", "aws"],
    "missing": ["microservices", "docker"],
    "important": ["react", "node.js", "aws"]
  },
  "sections": {
    "summary": true,
    "experience": true,
    "skills": true,
    "education": true
  },
  "insights": {
    "strengths": ["Strong keyword alignment with the job description"],
    "weaknesses": ["Limited overlap between experience and requirements"],
    "suggestions": ["Add missing keywords: microservices, docker"]
  }
}
```

**Scoring dimensions (`submit_score` tool):**

| Dimension              | Weight | Method                                      |
| ---------------------- | ------ | ------------------------------------------- |
| Keyword Match          | 45%    | JD keyword intersection with resume         |
| Experience Relevance   | 20%    | Jaccard similarity of token sets            |
| Section Completeness   | 15%    | Heuristic detection of core sections        |
| Formatting             | 10%    | Bullet points, headers, structure, length   |
| Keyword Distribution   | 10%    | Spread of keywords across resume sections   |

#### `POST /analyze/general` — General ATS scoring

Evaluates overall ATS-friendliness from a PDF (no JD required). Accepts a PDF via **file upload** or **URL**.

**Option 1 — PDF binary upload (multipart):**

```bash
curl -X POST http://localhost:8081/analyze/general \
  -F "resume=@resume.pdf;type=application/pdf"
```

**Option 2 — Supabase storage URL (JSON):**

```bash
curl -X POST http://localhost:8081/analyze/general \
  -H "Content-Type: application/json" \
  -d '{"resumeUrl":"https://your-project.supabase.co/storage/v1/object/public/resumes/file.pdf"}'
```

**Response:**

```json
{
  "score": 39,
  "breakdown": {
    "sectionCompleteness": 80,
    "formatting": 0,
    "keywordStrength": 65,
    "actionVerbs": 0,
    "measurableResults": 0,
    "contactInfo": 55
  },
  "sections": {
    "summary": true, "experience": true, "skills": true,
    "education": true, "certifications": false, "projects": false
  },
  "insights": {
    "strengths": ["All core resume sections are present"],
    "weaknesses": ["Resume formatting needs improvement"],
    "suggestions": ["Use more bullet points", "Add measurable results"]
  },
  "metadata": {
    "wordCount": 24,
    "pageCount": 1,
    "detectedKeywords": ["react", "node.js", "aws"]
  }
}
```

**Scoring dimensions (`submit_score_general` tool):**

| Dimension              | Weight | Method                                               |
| ---------------------- | ------ | ---------------------------------------------------- |
| Section Completeness   | 25%    | Core sections + bonus (Certifications, Projects)     |
| Formatting             | 20%    | Bullet points, headers, structure, length            |
| Keyword Strength       | 20%    | Count of recognized industry/tech keywords           |
| Action Verbs           | 15%    | Unique strong verbs ("Built", "Led", "Designed", etc.)|
| Measurable Results     | 10%    | Percentages, dollar amounts, team sizes              |
| Contact Info           | 10%    | Email, phone, LinkedIn, GitHub, website              |

**Error codes:**

| Code                | HTTP | Trigger                                   |
| ------------------- | ---- | ----------------------------------------- |
| `validation_error`  | 400  | Empty or missing fields                   |
| `payload_too_large` | 413  | Input exceeds `MAX_INPUT_LENGTH`          |
| `pdf_error`         | 4xx  | PDF fetch failed or content-type mismatch |
| `extraction_failed` | 422  | Could not extract text from PDF           |
| `internal_error`    | 500  | Unexpected server error                   |

### Environment Variables

| Variable                   | Required | Default            | Description                               |
| -------------------------- | -------- | ------------------ | ----------------------------------------- |
| `ANTHROPIC_API_KEY`        | **Yes**  | —                  | Service refuses to start without this     |
| `ANTHROPIC_MODEL`          | No       | `claude-haiku-4-5` | Override the Claude model used for scoring|
| `HOST`                     | No       | `0.0.0.0`          | Bind address                              |
| `ATS_PORT` / `PORT`        | No       | `8081`             | Listen port                               |
| `REQUEST_BODY_LIMIT_BYTES` | No       | `1048576`          | Max request body size                     |
| `MAX_INPUT_LENGTH`         | No       | `500000`           | Max character length for text inputs      |

### Security & Guardrails

- `ANTHROPIC_API_KEY` validated at startup — service refuses to start without it
- Input validation restricts file sizes and string lengths via env-defined constraints
- All unexpected errors mapped to `500 internal_error` — no system leaks to consumers
- Structured isolation via custom error classes (`PdfFetchError`, `error_code` enums)

### Docker

```bash
docker build -t ats-score ./ATS_Score
docker run --rm -p 8081:8081 \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  ats-score
```

### Performance

- ~2–3ms processing time per `/analyze` request (network + Claude latency adds to this)
- PDF parsing via `pdfjs-dist` (Mozilla PDF.js)

---

## Integration with ATSResumie Frontend

### latex-backend

The Next.js app integrates by:

1. Setting `LATEX_BACKEND_URL` in the runtime environment
2. `POST ${LATEX_BACKEND_URL}/compile/pdf` with `text/plain` body (raw LaTeX)
3. Receiving binary PDF in the response
4. Preserving existing worker retry/backoff/storage behavior in Supabase Edge Functions

The `lib/latex/sanitizeLatex.ts` utility runs before every compile call to ensure LaTeX compatibility.

### ATS_Score

The Next.js app integrates via:

- `/api/ats-check` → `POST ${ATS_SCORE_URL}/analyze` — targeted scoring with JD
- `/api/ats-score` → `POST ${ATS_SCORE_URL}/analyze/general` — general scoring from PDF URL

Score results are persisted to `resume_versions` (ATS score cache) and `ats_scans` table.

---

_Last updated: 2026-04-29_

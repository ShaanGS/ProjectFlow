# Kairo

**Institutional memory for on-call engineers:** a Next.js app that recalls past incidents from Vectorize Hindsight (or local JSON fallback), surfaces vendor vs internal boundaries, and formats grounded briefs for chat and simulated alerts.

[![Next.js](https://img.shields.io/badge/Next.js-16.2.0-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-61dafb)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178c6)](https://www.typescriptlang.org/)
[![Vercel Analytics](https://img.shields.io/badge/Vercel%20Analytics-1.6.1-black)](https://vercel.com/analytics)
[![CI](https://img.shields.io/badge/CI-not%20configured%20in%20repo-lightgrey)](#deployment)
[![License](https://img.shields.io/badge/License-see%20section%20below-lightgrey)](#license)

## Overview

Kairo is a **memory-native incident copilot** for teams debugging third-party API and platform failures. The UI lets engineers review vendor-scoped history, simulate synthetic alerts, and chat with an agent whose answers are tied to **retrieved post-mortem-style records** (Hindsight recall or a bundled `data/incidents.json` fallback).

The core problem is **un grounded triage**: generic LLMs invent runbooks. Here, responses are constrained to **what recall returns**—structured fields like `successful_fix`, `failed_checks`, and `actual_root_cause`—so “what we did last time” stays tied to **stored incident memory**, not a model’s prior weights alone.

**Memory-native architecture matters** because this codebase explicitly branches on Hindsight availability (`recall` vs local scoring), tags retained documents (`kairo`, vendor, classification), and formats memory blocks for Groq prompts only after recall—not the other way around.

## Key Features

- **Vector recall via Hindsight** with `hindsight.recall(pipelineId, query, …)` when `HINDSIGHT_API_KEY` and `HINDSIGHT_PIPELINE_ID` are set; falls back to **keyword scoring** over `data/incidents.json` when not configured.
- **Vendor anchoring** in queries: token heuristics expand Razorpay, MSG91, Cashfree, WhatsApp, Auth0, AWS S3, or “internal postgres pool” signals before recall.
- **`/api/seed`**: one-shot POST that iterates `data/incidents.json` and calls `retainIncident` for each row (rate-limited with a 300 ms delay between writes).
- **Simulated alerts** (`POST /api/alert`) from a fixed **in-code list** of vendor/region/symptom scenarios; response includes recall count, a **template brief** (`buildKairoBrief`) or **Groq** analysis when `KAIRO_DEMO_MODE=llm` and `GROQ_API_KEY` are set.
- **Chat** (`POST /api/chat`) with demo vs LLM modes: first-turn structured brief from memory; follow-ups gated by `KAIRO_DEMO_MODE` and Groq configuration (see `app/api/chat/route.ts`).
- **Post-mortem export** in the chat UI: downloads a Markdown file from the first structured assistant brief in the thread (`components/kairo/agent-chat.tsx`).
- **Optional Slack bridge** (`npm run slack`): Socket Mode Bolt app using Groq for replies (`slack-bot.js`).
- **Vercel Analytics** injected in production (`@vercel/analytics` in `app/layout.tsx`).

## Tech Stack

Versions are taken from `package.json`.

| Layer | Packages / runtime |
| -------- | ------------------ |
| **Frontend** | `next` **16.2.0**, `react` **19.2.4**, `react-dom` **19.2.4**, Tailwind via `@tailwindcss/postcss` **4.2.0** / `tailwindcss` **4.2.0**, `lucide-react` **0.564.0**, Radix UI primitives (e.g. `@radix-ui/react-dialog` **1.1.15**), `recharts` **2.15.0**, `next-themes` **0.4.6** |
| **Forms / UI utilities** | `react-hook-form` ^7.54.1, `@hookform/resolvers` ^3.9.1, `zod` ^3.24.1, `class-variance-authority` ^0.7.1, `clsx` ^2.1.1, `tailwind-merge` ^3.3.1 |
| **Backend (app routes)** | Next.js App Router route handlers under `app/api/*` |
| **AI / LLM** | `groq-sdk` **1.1.2**, `groq` ^5.20.0 — chat completion calls in `/api/chat`, `/api/alert` |
| **Memory** | `@vectorize-io/hindsight-client` **^0.5.0** — `retain` and `recall` |
| **Other JS deps** | `ai` ^6.0.158 (listed in `package.json`; no imports found in `.ts`/`.tsx` sources), `date-fns` 4.1.0, `cmdk` 1.1.1, `embla-carousel-react` 8.6.0, `sonner` ^1.7.1, `input-otp` 1.4.2, `vaul` ^1.1.2 |
| **Integrations** | `@slack/bolt` ^3.20.0, `dotenv` ^16.4.5, `@vercel/analytics` 1.6.1 |
| **Tooling** | `typescript` 5.7.3, `@types/node` ^22, `@types/react` 19.2.14, `postcss` ^8.5, `tw-animate-css` 1.3.3 |

## Architecture Overview

1. **Browser load**: `app/page.tsx` mounts `DashboardShell` and, once per browser profile, `POST /api/seed` (guarded by `localStorage` key `kairo_seeded`) to push JSON incidents into Hindsight when keys exist.
2. **Dashboard**: `DashboardShell` loads resolved rows via `GET /api/incidents`. **Simulate Incident** calls `POST /api/alert` with an incrementing `index` to rotate through built-in synthetic alerts.
3. **Alert path**: `app/api/alert/route.ts` builds a query string from the alert, calls `recallIncidents`, formats memory with `formatHindsightMemoryContext`, and returns JSON: `incident`, `memoryMatches`, `classification`, `analysis` (template brief or Groq output), `recalledIncidents`.
4. **Chat path**: Client sends `messages`, optional `currentIncident`, to `POST /api/chat`. The handler normalizes turns, runs recall on the first user turn (or anchor recall on follow-ups), injects memory JSON into prompts when `KAIRO_DEMO_MODE=llm`, and falls back to `buildKairoBrief` / fixed demo strings when not in full LLM mode.
5. **Persistence**: `lib/hindsight.ts` `retainIncident` sends `embedding_text`, `context`, `timestamp`, rich `metadata`, and `tags` to Hindsight when configured; otherwise retain calls no-op with `{ skipped: true }`.

There is **no architecture diagram file** in this repository.

## Getting Started

### Prerequisites

- **Node.js** (LTS recommended) and **npm** (scripts use `npm`; lockfile is not committed—install produces local `node_modules`).
- **Accounts / keys (optional by feature)**  
  - **Vectorize Hindsight**: API key and pipeline (bank) id for retain/recall.  
  - **Groq**: API key for LLM paths in chat and alert simulation when `KAIRO_DEMO_MODE=llm`.  
  - **Slack**: bot token, signing secret, app-level token for the optional Bolt bot.

### Installation

```bash
git clone https://github.com/ShaanGS/kairo-ai.git
cd kairo-ai
npm install
```

Copy environment template:

```bash
cp .env.example .env.local
# Edit .env.local with real values
```

### Environment Variables

Defined in `.env.example`:

| Variable | Purpose |
| -------- | ------- |
| `GROQ_API_KEY` | Groq API key for chat/alert LLM completion when LLM mode is active. |
| `GROQ_MODEL` | Model id (default in code: `llama-3.3-70b-versatile` when unset). |
| `HINDSIGHT_BASE_URL` | Hindsight API base URL (default in code: `https://hindsight.vectorize.io`). |
| `HINDSIGHT_API_KEY` | API key for Hindsight retain/recall. |
| `HINDSIGHT_PIPELINE_ID` | Pipeline / memory bank id passed to `retain` and `recall`. |
| `KAIRO_DEMO_MODE` | Set to `llm` to enable full LLM behavior where implemented; empty/unset uses demo/template paths in `/api/chat` (see route logic). |
| `SLACK_BOT_TOKEN` | Slack bot token for `slack-bot.js`. |
| `SLACK_SIGNING_SECRET` | Slack signing secret for Bolt. |
| `SLACK_APP_TOKEN` | Slack app-level token (Socket Mode). |

### Running Locally

```bash
# Next.js app (UI + API routes)
npm run dev
# Open http://localhost:3000

# Optional: Slack bot (separate process; uses .env via dotenv)
npm run slack
```

Production build check:

```bash
npm run lint    # runs: tsc --noEmit
npm run build
npm run start
```

## Project Structure

```
.
├── app/                    # Next.js App Router
│   ├── api/
│   │   ├── alert/          # POST — synthetic alert simulation + recall + analysis
│   │   ├── chat/           # POST — agent chat with memory + optional Groq
│   │   ├── incidents/      # GET — returns data/incidents.json
│   │   ├── retain/         # POST — retain one incident body to Hindsight
│   │   └── seed/           # POST — seed all JSON incidents into Hindsight
│   ├── layout.tsx          # Root layout, fonts, Vercel Analytics (prod)
│   ├── page.tsx            # Dashboard entry; triggers /api/seed once per browser
│   └── globals.css         # Global styles
├── components/kairo/       # Dashboard, nav, pages, agent chat, right panel
├── components/ui/          # Shared UI primitives (Radix/shadcn-style)
├── data/incidents.json     # Canonical demo incidents (also seed source)
├── lib/
│   ├── hindsight.ts        # Hindsight client, retain/recall, fallback recall
│   ├── kairo-brief.ts      # Template brief from memory matches
│   ├── groq.ts             # Groq client + hasGroqConfig()
│   ├── llm-output.ts       # Strips model artifacts from strings
│   └── utils.ts            # `cn` helper (tailwind-merge + clsx)
├── public/                 # Static assets (icons, logos)
├── slack-bot.js            # Optional Slack Bolt + Groq integration
├── next.config.mjs         # Next config (images unoptimized)
├── package.json
├── tsconfig.json
└── .env.example            # Documented env template
```

## Integrations

| Integration | Role in this product |
| ----------- | -------------------- |
| **Vectorize Hindsight** (`@vectorize-io/hindsight-client`) | Retains incident text + metadata to a pipeline; recalls similar incidents for chat and alerts. Tags include `kairo`, vendor, and `classification`. |
| **Groq** (`groq-sdk`) | Optional LLM for structured alert diagnosis and conversational chat when env and `KAIRO_DEMO_MODE` allow. |
| **Slack** (`@slack/bolt`) | Optional Socket Mode bot: `@app_mention` and DM handlers call the same Groq helper flow (`slack-bot.js`). |
| **Vercel Analytics** (`@vercel/analytics`) | Page view analytics in production only (`app/layout.tsx`). |

No PagerDuty, Notion, or Google APIs appear in the codebase.

## How Memory Works

### Configuration switch

- **`hasHindsightConfig()`** (in `lib/hindsight.ts`) requires non-placeholder `HINDSIGHT_API_KEY` and `HINDSIGHT_PIPELINE_ID`.
- If **not** configured, **`recallIncidents`** does not call Hindsight. It scores rows in `data/incidents.json` by keyword overlap with **vendor anchor filtering** (`detectVendorAnchor`, `incidentPassesAnchor`, `expandQueryTerms`).
- If configured, **`hindsight.recall(getBankId(), hindsightQuery, { budget: "low", maxTokens: 4000, tags: ["kairo"] })`** runs. Results are **hydrated** with fields from `incidents.json` when context/text matches.

### What gets stored

- **`retainIncident`** sends `embedding_text`, `context` (title), `timestamp`, and **metadata**: `incident_id`, `title`, `vendor`, `region`, `classification`, `actual_root_cause`, `successful_fix`, `failed_checks`, `time_to_resolution_minutes`, `timestamp_start`, `customer_impact`.  
- **`/api/seed`** loops all `data/incidents.json` entries and calls `retainIncident` for each (with 300 ms delay).

### When it gets stored

- On **`POST /api/seed`** (automated from home page once per browser via `localStorage`).  
- On **`POST /api/retain`** with a JSON body shaped like an incident (passed through to `retainIncident`).

### How it is retrieved

- **`recallIncidents(query)`** augments the query (`augmentQueryForHindsight`) then calls `recall` with tag filter `["kairo"]` when Hindsight is configured.
- Chat and alert handlers use returned **`matches`** to build **`formatHindsightMemoryContext`** / **`buildKairoBrief`** strings, and optionally Groq prompts that **forbid** content outside `[HINDSIGHT MEMORY CONTEXT]` in `/api/alert` when in LLM mode.

### How it affects responses

- **Template path**: `buildKairoBrief` outputs sections like `BOUNDARY`, `ROOT_CAUSE_MEMORY`, `RESOLUTION_STEPS`, `SKIP`, `MEMORY_REF` from **memory fields only**—empty recall yields `INSUFFICIENT_MEMORY`.  
- **LLM path**: Groq receives memory blocks; `cleanModelOutput` strips `<redacted_thinking>` and fenced markdown wrappers.

## API Reference

Base URL: same origin as the app (e.g. `http://localhost:3000`).

### `POST /api/chat`

- **Purpose:** Agent chat with recall-backed or demo responses.
- **Body (JSON):** `messages` (array of `{ role: "user"|"assistant", content: string }`) and/or `message` (single string); optional `currentIncident`.
- **Responses:** JSON with `response` (string), `memoryMatches`, `recalledIncidents`; errors return `{ error }` with 4xx/5xx.

### `POST /api/alert`

- **Purpose:** Pick a simulated alert, recall memory, return structured `analysis`.
- **Body (JSON):** optional `index` (number) to rotate simulations.
- **Response:** `incident`, `memoryMatches`, `classification`, `analysis`, `recalledIncidents`.

### `GET /api/incidents`

- **Purpose:** Return `{ incidents }` from `data/incidents.json`.

### `POST /api/seed`

- **Purpose:** Seed all incidents from JSON into Hindsight via `retainIncident`.
- **Response:** `{ success, message }` or `{ error }`.

### `POST /api/retain`

- **Purpose:** Retain a single incident payload to Hindsight.
- **Body:** JSON incident (must align with fields expected by `retainIncident` / `IncidentMemory` in `lib/hindsight.ts`).
- **Response:** `{ success, message }` or `{ error }`.

## Deployment

- **No Dockerfile, `vercel.json`, or GitHub Actions workflow** is present in this repository.  
- **`.gitignore`** excludes `.vercel/`, `node_modules`, `.next`, and `.env*`.  
- **`@vercel/analytics`** is included for production builds; deploying on **Vercel** (or any host that runs `next build` / `next start`) is consistent with the dependencies.  
- Set environment variables in the host UI from `.env.example`.

Commands:

```bash
npm run build
npm run start
```

## Roadmap

- Add a **lockfile** (`package-lock.json` or `pnpm-lock.yaml`) and optional **CI** (lint + build) so main-branch status is explicit.
- Wire or remove the unused **`ai`** package import surface—either adopt Vercel AI SDK patterns or drop the dependency to shrink install size.
- **ESLint** (or `next lint` with config) alongside `tsc` for import and React hooks rules.
- **Tests** for `recallIncidents` fallback scoring and `/api/chat` demo vs LLM branches.

## Team

_Team member names were not found in this repository. Add them here._

## License

No `LICENSE` file is present in this repository. Add a license file (e.g. MIT, Apache-2.0) and update this section when you choose one.

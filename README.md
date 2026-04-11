# Kairo: Memory-Native Incident Copilot

**Kairo** is an enterprise-grade incident copilot that answers the question every on-call team asks in the first minutes of an outage: *Is this us, the vendor, or both—and what actually worked last time?*

---

## The problem

When third-party platforms degrade—**Stripe**, **Razorpay**, **Auth0**, **MSG91**, **AWS**, **WhatsApp Cloud API**—revenue and trust bleed fast. Industry data commonly cites on the order of **~$5,600 per minute** of critical-path downtime; much of that cost is not the outage itself but **misdirected engineering time** hunting Slack threads, stale wikis, and one-off runbooks that never made it into a shared system of record.

Engineers repeat the same dead-end checks while the real fix was already proven in a prior incident—if only it were **recallable on demand**.

## The solution

Kairo combines **Hindsight (Vectorize) vector memory** with **Groq LPU-class inference** to retrieve **operationally similar past incidents** and surface:

- **What the fault boundary was** (vendor vs internal vs mixed)  
- **What fixed it before** (synthesized runbook from memory)  
- **What to skip** (checks that historically wasted time)

By grounding responses in **episodic incident memory** instead of generic LLM prose, Kairo targets a dramatic reduction in mean time to remediate—**up to ~86%** in structured triage scenarios where the correct next action is already in memory.

## Key features

| Capability | Description |
|------------|-------------|
| **Fault boundary detection** | Classifies incidents as vendor-side, internal, or mixed using recalled episodes—not guesswork. |
| **Historical runbook synthesis** | Pulls resolution patterns from memory and presents actionable steps aligned with prior successful mitigations. |
| **Dead-end “skip” suggestions** | Surfaces checks that failed or misled responders in similar past incidents. |
| **One-click post-mortem export** | Exports a Markdown post-mortem (with official report header) from the structured incident brief in the agent panel. |

## Architecture (this repository)

The shipping application is a **Next.js monolith**: dashboard UI and **REST-style API routes** under `app/api/*`. There is **no separate FastAPI process** in this repo; ingestion and chat are implemented in TypeScript. A **FastAPI** (or other) service can sit alongside for high-volume webhooks or ETL—Kairo’s client is designed to **retain and recall** through the Hindsight API regardless of which service wrote the memory.

## Tech stack

| Layer | Technology |
|--------|------------|
| **Application** | Next.js (App Router), React 19, TypeScript |
| **API** | Next.js Route Handlers (`/api/chat`, `/api/alert`, `/api/seed`, `/api/retain`, `/api/incidents`) |
| **Styling** | Tailwind CSS, Radix-based UI primitives |
| **Inference** | Groq API (`groq-sdk`; default model configurable via `GROQ_MODEL`) |
| **Memory** | Hindsight via `@vectorize-io/hindsight-client` (vector bank / pipeline on Vectorize) |
| **Package manager** | pnpm (recommended via Corepack) |

> **Note:** Marketing materials may reference **Qwen3**; this project’s default Groq model is set in environment/config (e.g. Llama 3.3)—override with `GROQ_MODEL` as needed.

## Repository layout

```text
.
├── README.md                 # This file
├── KAIRO_CHECKPOINT.md       # Engineering handoff / product context
├── idea2_full_context.md     # Extended product narrative
└── Kairo Frontend/           # Next.js application (use as Vercel root directory)
    ├── app/
    ├── components/
    ├── lib/
    ├── data/incidents.json   # Seed incidents + local recall fallback
    └── .env.local            # Local secrets (not committed)
```

## How to run locally

### Prerequisites

- **Node.js** 20+ (recommended)  
- **pnpm** — enable with `corepack enable` then `corepack prepare pnpm@latest --activate`

### Environment

Create **`Kairo Frontend/.env.local`** with at least:

```env
GROQ_API_KEY=your_groq_key
HINDSIGHT_API_KEY=your_hindsight_key
HINDSIGHT_PIPELINE_ID=your_pipeline_id
# Optional:
# KAIRO_DEMO_MODE=llm
# GROQ_MODEL=llama-3.3-70b-versatile
```

Without valid Hindsight keys, Kairo uses **local semantic-style recall** over `data/incidents.json` so demos still work.

### Install and dev server

From the **application directory**:

```bash
cd "Kairo Frontend"
pnpm install
pnpm dev
```

Open **http://localhost:3000**.

Equivalent with **npm** (if you prefer):

```bash
cd "Kairo Frontend"
npm install
npm run dev
```

### Production build

```bash
cd "Kairo Frontend"
pnpm build
pnpm start
```

## Vercel deployment

1. Import the Git repository into Vercel.  
2. Set **Root Directory** to **`Kairo Frontend`**.  
3. Add the same environment variables as in `.env.local`.  
4. Deploy — `next build` runs automatically.

---

## Security & confidentiality

Kairo is intended for **internal engineering use**. Do not commit real incident PII or production secrets; use `.env.local` (gitignored) and Vercel **Environment Variables** for keys.

## License

Private / hackathon use unless otherwise specified.

---

*Kairo — fewer wrong turns when the vendor blinks.*

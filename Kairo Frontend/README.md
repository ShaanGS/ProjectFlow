# Kairo

Kairo is a memory-backed incident copilot prototype for vendor and external-service failures. The current app demonstrates a simulated incident loop: trigger an incident, retrieve similar past incidents, generate a memory-grounded response, and show the evidence in the existing dashboard UI.

This cleanup pass intentionally preserves the current UI and behavior while making the real execution path easier to understand.

## Stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS
- Lucide icons
- Hindsight memory client with local JSON fallback
- Groq SDK for optional LLM mode

## Run

```bash
npm install
npm run dev
```

Validate types:

```bash
npm run lint
```

## Folder Structure

```text
app/          Next.js page and API routes
components/   Active Kairo UI components
data/         Local incident dataset used for seed/fallback/demo data
lib/          Retrieval, memory, Groq, and formatting helpers
public/       Assets referenced by the active UI
types/        Shared TypeScript types for the active app
docs/         Wiring, architecture, data-flow, and cleanup docs
archive/      Unused or unverified legacy code/assets preserved for review
```

## Current Data Sources

- `data/incidents.json` is the canonical local incident dataset.
- `app/api/incidents/route.ts` returns that dataset for the resolved incident table.
- `lib/hindsight.ts` uses Hindsight when configured and falls back to local scoring over `data/incidents.json` when not configured.
- `app/api/alert/route.ts` uses an in-code `SIMULATED_ALERTS` list to create current incidents for the demo.

## API Routes

- `POST /api/seed` seeds `data/incidents.json` into Hindsight when Hindsight env vars are configured.
- `GET /api/incidents` returns local incidents for the resolved incident table.
- `POST /api/incidents` performs retrieval by description, but the current UI does not call this path.
- `POST /api/alert` creates a simulated alert, retrieves memory, and returns the active incident plus recalled episodes.
- `POST /api/chat` generates a memory-grounded agent response from provided or recalled episodes.
- `POST /api/resolve` writes a resolved incident to memory, but the current UI does not call it.
- `POST /api/retain` directly writes one incident to memory, but the current UI does not call it.

## What Is Real vs Mock

Real or partially real:

- The visible Simulate Incident flow is wired to `/api/alert` and `/api/chat`.
- Retrieval goes through `lib/hindsight.ts`.
- Hindsight is used when configured; otherwise local fallback scoring is used.
- The right panel and live incident table show recalled episodes from the active flow.

Still mock/static:

- Simulated current incidents are local constants in `app/api/alert/route.ts`.
- `MemoryLogPage`, `VendorsOverviewPage`, `VendorProfilePage`, and `PatternRulesPage` use hardcoded component-local data.
- Agent empty-state metrics are hardcoded.
- Resolve/write-back exists as an API route but has no visible UI flow.

## Next Phase

1. Decide whether Hindsight or another store is the canonical memory backend.
2. Replace static secondary pages with data from the canonical incident/memory source.
3. Add a visible Resolve Incident flow that calls `/api/resolve`.
4. Replace local simulated incidents with a curated realistic incident dataset.
5. Add focused tests for retrieval fallback, API response contracts, and the simulate flow.

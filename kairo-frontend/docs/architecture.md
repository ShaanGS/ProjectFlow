# Architecture

## Overview

Kairo is currently a single Next.js App Router application. The only rendered page is the dashboard at `app/page.tsx`.

```text
app/page.tsx
  -> DashboardShell
    -> LeftNav
    -> active page component
    -> RightPanel
      -> AgentChat
```

## Frontend

Active UI code lives under `components/kairo/`.

- `dashboard-shell.tsx` owns the main state: active page, active incident, live/resolved incidents, memory matches, and reasoning status.
- `left-nav.tsx` changes active pages/vendors.
- `pages/live-incidents.tsx` renders metrics, active incident, live incidents, and resolved incidents.
- `right-panel.tsx` renders the Episodic Memory summary and the agent panel.
- `agent-chat.tsx` renders chat messages and sends follow-up questions to `/api/chat`.
- `pages/memory-log.tsx`, `pages/vendors-overview.tsx`, `pages/vendor-profile.tsx`, and `pages/pattern-rules.tsx` are rendered from navigation but still use static local data.

Shared active types live in `types/kairo.ts`.

## API / Backend

Active route handlers live under `app/api/`.

- `alert/route.ts` creates simulated alerts and runs retrieval.
- `chat/route.ts` produces memory-grounded responses.
- `incidents/route.ts` returns local incident rows and exposes a retrieval POST path.
- `seed/route.ts` seeds incidents to memory when configured.
- `resolve/route.ts` and `retain/route.ts` write to memory but are not called by the current UI.

Backend helpers live under `lib/`.

- `hindsight.ts` wraps Hindsight retain/recall and local fallback retrieval.
- `kairo-brief.ts` creates deterministic memory-grounded demo responses.
- `groq.ts` configures the optional Groq client.
- `llm-output.ts` cleans model output.
- `utils.ts` contains CSS class helpers.

## Data Layer

`data/incidents.json` is the current local incident memory dataset. It is used by:

- `GET /api/incidents`
- `POST /api/seed`
- fallback retrieval in `lib/hindsight.ts`

When `HINDSIGHT_API_KEY` and `HINDSIGHT_PIPELINE_ID` are configured, `lib/hindsight.ts` uses Hindsight. Without those vars, it uses local deterministic scoring over `data/incidents.json`.

## Archive

`archive/` contains code/assets removed from the active path but preserved for review:

- unused shadcn/Radix UI primitives
- duplicate hooks used only by archived UI primitives
- legacy Hindsight scripts with dummy keys
- unused public screenshots/placeholders
- old shadcn config

`archive/` is excluded from TypeScript compilation.

## Limitations

- Secondary pages are static.
- Resolve/write-back has an API route but no UI.
- `/api/incidents` has a retrieval POST path that the current UI does not call.
- There is no test suite.
- There is no git metadata in this local folder, so cleanup was archive-first rather than delete-first.

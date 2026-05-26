# Kairo

Kairo is a memory-native incident copilot prototype for vendor and external-service failures. The current system demonstrates a complete local demo loop: simulate an incident, retrieve similar historical incidents from canonical memory, generate structured memory-grounded reasoning, resolve the incident, and retain the resolution for future retrieval.

## Tech Stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS
- Lucide icons
- Local canonical incident memory in `data/incidents-seed.json`
- Deterministic retrieval in `lib/retrieval`
- Structured agent runtime in `lib/agent`
- Supabase schema migration prepared under `supabase/migrations`
- Optional Groq configuration for future LLM-backed reasoning

## Folder Structure

```text
app/          Next.js pages and API routes
components/   Kairo dashboard UI
data/         Canonical demo incident dataset
docs/         Architecture, flow, demo, and cleanup documentation
lib/          Config, db helpers, retrieval, memory, agent, retention
public/       UI assets
supabase/     Database migrations
types/        Shared TypeScript domain and API types
archive/      Legacy/unverified code preserved outside the active path
```

## Run Locally

```bash
npm install
npm run dev
```

Validate TypeScript:

```bash
npm run lint
```

Health check:

```bash
curl http://localhost:3000/api/health
```

`/api/health` returns `degraded` when `GROQ_API_KEY` is not set because the local deterministic agent works without an LLM, but the LLM readiness check is intentionally false.

## Demo Flow

1. Open `http://localhost:3000`.
2. Click `Simulate Incident`.
3. Watch the Live Incidents row become active.
4. Review the Episodic Memory panel for retrieved prior incidents.
5. Review the Kairo Agent panel for structured diagnosis, likely cause, actions, checks to skip, uncertainty, and memory references.
6. Click `Resolve`.
7. Confirm the write-back message appears.
8. Click `Simulate Incident` again to repeat the loop.

The demo loop is designed to run repeatedly without reloading.

## What Is Real vs Simulated

Real in the current prototype:

- Canonical incident dataset with 20 realistic vendor incidents.
- Deterministic retrieval over incident memory.
- Structured reasoning grounded in retrieved memory.
- Dashboard panels driven by live API state.
- Resolution write-back through `/api/resolve`.
- Runtime retained incidents becoming eligible for later retrieval.
- Consistent API response envelopes and demo health check.

Simulated or local-only:

- Incident triggers come from canonical seed data through `/api/alert`.
- Retention is in process memory for the local demo, not yet persisted to Supabase.
- The agent runtime is deterministic unless a future LLM path is explicitly wired.
- Supabase migrations exist, but the UI still uses the local data/retention layer.

## API Contract

Most API success responses use:

```json
{ "success": true, "data": {} }
```

Most API errors use:

```json
{ "success": false, "error": "short message", "code": "ERROR_CODE" }
```

`/api/health` intentionally returns the health-check shape documented in `docs/demo-script.md`.

## Next Build Phase

The next phase is persistence and productionization: replace the in-memory retention layer with Supabase writes, persist `analysis_runs` and `memory_matches`, add tests around the API contracts and retrieval rankings, and optionally reintroduce an LLM behind the existing structured agent response shape.

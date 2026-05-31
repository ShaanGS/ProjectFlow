# Agent Runtime

## Purpose

The Kairo agent runtime converts active incident context plus retrieved memory into structured, UI-renderable reasoning.

It is designed for low hallucination:

- It uses retrieved memory as evidence.
- It cites memory incident IDs.
- It avoids unsupported root-cause claims when memory is weak or missing.
- It returns both a human-readable `response` string and a structured `analysis` object.

## Runtime Flow

```text
UI / simulate incident
  -> /api/chat
  -> lib/agent/runtime.ts
  -> retrieved memory from request or lib/retrieval/incidents.ts
  -> structured AgentReasoning
  -> UI-compatible JSON
```

## `/api/chat` Input

`/api/chat` accepts:

- `messages`
- `message`
- `currentIncident`
- `past_episodes`
- `pastEpisodes`
- `memoryMatches`

If retrieved memory is provided, the runtime uses it directly. If memory is missing, it retrieves memory from the active incident context.

## Output Shape

`/api/chat` returns:

- `response`
- `analysis`
- `memoryMatches`
- `recalledIncidents`
- `stages`

`analysis` includes:

- `diagnosis`
- `likely_cause`
- `recommended_next_actions`
- `checks_to_skip`
- `uncertainty_note`
- `referenced_memory_incidents`

`stages` is intentionally simple so the UI can later show staged or streamed updates without changing the core API shape.

## Grounding Rules

The runtime only recommends actions that are present in retrieved memory. If no memory is available, it recommends evidence collection instead of pretending to know the fix.

The nearest memory match drives the likely cause. Lower-similarity matches are used only to enrich skipped checks, related patterns, and uncertainty.

## Prompt Boundary

`lib/prompts/agent.ts` defines the prompt boundary for a future LLM-backed agent. The current runtime is deterministic, but the prompt module documents the exact evidence contract a model must follow when LLM reasoning is reintroduced.

## Current Limitation

The runtime does not yet persist `analysis_runs` or `memory_matches` rows. The database schema exists for that next step, but the current implementation keeps the active UI path local and deterministic.

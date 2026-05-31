# Retrieval Flow

## Purpose

Kairo retrieval finds similar historical incidents for a new active incident and returns structured memory that the UI and agent can render without guessing field names.

## Active Flow

```text
UI active incident
  -> /api/incidents POST
  -> lib/retrieval/incidents.ts
  -> data/incidents-seed.json via lib/db/incidents.ts
  -> standardized memory matches
```

`/api/alert` also uses this same retrieval path when simulating an incident.

## Input Shape

Retrieval accepts:

- `title`
- `description`
- `vendor`
- `service`
- `region`
- `signals`
- `symptoms`
- `tags`
- `currentIncident`

The request is normalized into `RetrievalRequest` from `types/agent.ts`.

## Retrieval Method

The current implementation is intentionally understandable and deterministic:

1. Build embedding-ready incident text from title, vendor, service, region, description, signals, symptoms, and tags.
2. Tokenize the active incident text.
3. Tokenize each historical incident from `data/incidents-seed.json`.
4. Expand common incident synonyms such as webhook/callback, timeout/latency, payment/UPI/card, and S3/upload/object.
5. Score candidates with weighted token overlap.
6. Add small boosts for exact vendor, service, region, and tag overlap.
7. Return the top matches with similarity, match reason, root cause, resolution, skipped checks, and patterns.

This is not a replacement for embeddings. It is the local deterministic retrieval layer that keeps the demo product real and testable until Supabase vector search or another embedding store is wired in.

## Response Shape

`/api/incidents` returns:

- `matches`
- `incidents`
- `query`
- `source`

Each match includes:

- `matched_incident_id`
- `title`
- `vendor`
- `service`
- `date`
- `similarity`
- `root_cause`
- `resolution`
- `skipped_checks`
- `patterns_matched`
- `signals`
- `tags`
- `match_reason`
- `metadata`

The `metadata` object preserves compatibility with the existing right panel and agent chat UI.

## Source Of Truth

The canonical incident memory source is:

- `data/incidents-seed.json`

The old `data/incidents.json` is no longer used by `/api/incidents` or `/api/alert`.

## Next Step

Replace the deterministic scoring function in `lib/retrieval/incidents.ts` with database-backed vector retrieval while keeping the response shape stable.

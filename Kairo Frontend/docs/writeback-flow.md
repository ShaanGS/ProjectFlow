# Write-Back Flow

## Canonical Path

`/api/resolve` is the canonical write-back endpoint.

```text
Live incident Resolve action
  -> POST /api/resolve
  -> lib/retention/store.ts
  -> retained runtime memory
  -> lib/retrieval/incidents.ts includes retained incidents in future retrieval
```

## `/api/resolve`

Required inputs:

- incident context
- `fix_applied`
- `root_cause`

Optional but preferred inputs:

- `failed_mitigations`
- `pattern_tags`
- `resolution_time_seconds`
- `resolved_by`
- `notes`

The endpoint returns:

- retained incident
- resolution record
- success message

## `/api/retain`

`/api/retain` remains as a compatibility endpoint, but it writes through the same `lib/retention/store.ts` path. New UI and product code should call `/api/resolve`.

## Retention Store

`lib/retention/store.ts` currently keeps retained incidents in process memory and merges them with `data/incidents-seed.json` for retrieval. This makes the local demo loop work without introducing a second database client before Supabase is fully wired.

The Supabase migration already defines the production tables:

- `incidents`
- `resolutions`
- `memory_matches`
- `analysis_runs`

The next persistence step is to replace the in-memory store with Supabase inserts while keeping the `/api/resolve` request and response shape stable.

## Auditability

Resolution write-back captures:

- root cause
- applied fix
- skipped or failed mitigations
- pattern tags
- time to resolve
- retained incident id

This keeps Kairo's future retrieval grounded in human-confirmed resolution data instead of transient chat output alone.

# Kairo Data Model

## Design Principles

- Keep the model close to real incident operations.
- Store enough evidence for retrieval and reasoning, not every possible workflow object.
- Make historical memory auditable through `memory_matches`.
- Keep model output separate from incident truth through `analysis_runs`.
- Treat `resolutions` as the write-back point for future memory.

## Tables

### `vendors`

Represents an external or internal provider.

Required fields:

- `id`
- `name`
- `category`
- `created_at`
- `updated_at`

Optional fields:

- `status_page_url`
- `escalation_url`

### `incidents`

Primary incident memory and active incident table.

Required fields:

- `id`
- `title`
- `vendor_id`
- `vendor`
- `service`
- `severity`
- `environment`
- `region`
- `status`
- `triggered_at`
- `ttd_seconds`
- `description`
- `signals`
- `tags`
- `skipped_checks`
- `patterns_matched`

Resolution fields:

- `resolved_at`
- `ttr_seconds`
- `root_cause`
- `resolution`

Generated/search field:

- `memory_text`

`memory_text` is generated in the SQL migration from incident details, signals, tags, root cause, resolution, skipped checks, and matched patterns. It is the practical retrieval text until a true embedding pipeline is added.

### `incident_events`

Append-only timeline for incident evidence and actions.

Fields:

- `id`
- `incident_id`
- `event_type`
- `occurred_at`
- `title`
- `body`
- `source`
- `metadata`
- `created_at`

Use this for monitoring signals, operator notes, vendor updates, mitigations, and state transitions.

### `memory_matches`

Stores retrieval results.

Fields:

- `id`
- `incident_id`
- `matched_incident_id`
- `analysis_run_id`
- `similarity`
- `rank`
- `match_reason`
- `matched_signals`
- `created_at`

This table makes Kairo’s recall explainable. The UI can show not just “similar incident found,” but why it was retrieved.

### `analysis_runs`

Stores structured reasoning output.

Fields:

- `id`
- `incident_id`
- `status`
- `model`
- `started_at`
- `completed_at`
- `diagnosis`
- `confidence`
- `recommended_actions`
- `dead_ends`
- `cross_vendor_pattern`
- `uncertainty_note`
- `cited_incident_ids`
- `input_snapshot`
- `output_snapshot`

The incident row should not be overwritten by every model attempt. Each attempt is a separate analysis run.

### `resolutions`

Stores human-confirmed resolution and memory write-back details.

Fields:

- `id`
- `incident_id`
- `resolved_by`
- `resolved_at`
- `fix_applied`
- `failed_mitigations`
- `root_cause`
- `pattern_tags`
- `time_to_resolve_seconds`
- `notes`
- `retained_as_memory`
- `created_at`

When a resolution is created, the corresponding incident should be updated to `resolved` or `closed`, with `root_cause`, `resolution`, `resolved_at`, and `ttr_seconds`.

## TypeScript Model

The TypeScript source of truth is:

- `types/kairo-domain.ts`

The database table constants and seed helpers live in:

- `lib/db/schema.ts`
- `lib/db/incidents.ts`

## Seed Source

The canonical demo seed data is:

- `data/incidents-seed.json`

The older `data/incidents.json` still exists because current API fallback code uses it. It should be migrated in a later implementation step after the UI and API are updated to the canonical model.

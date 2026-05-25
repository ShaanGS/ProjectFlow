# Seed Data

## Source Of Truth

Canonical demo incidents live in:

- `data/incidents-seed.json`

The dataset contains 20 realistic downtime-style incidents across:

- Razorpay
- MSG91
- Cashfree
- AWS S3
- WhatsApp Cloud API

Each incident includes:

- `id`
- `title`
- `vendor`
- `service`
- `severity`
- `environment`
- `region`
- `status`
- `triggered_at`
- `resolved_at`
- `ttd_seconds`
- `ttr_seconds`
- `description`
- `signals`
- `tags`
- `root_cause`
- `resolution`
- `skipped_checks`
- `patterns_matched`

## Database Schema

The canonical schema migration is:

- `supabase/migrations/202605260001_kairo_core_schema.sql`

It creates:

- `vendors`
- `incidents`
- `incident_events`
- `memory_matches`
- `analysis_runs`
- `resolutions`

## Seed Script

The seed script is:

- `scripts/seed-incidents.ts`

It validates the JSON dataset and can upsert vendors and incidents through Supabase REST.

Dry-run validation:

```bash
node --experimental-strip-types scripts/seed-incidents.ts --dry-run
```

Supabase seed:

```bash
SUPABASE_URL="https://<project>.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>" \
node --experimental-strip-types scripts/seed-incidents.ts
```

The script intentionally uses `SUPABASE_SERVICE_ROLE_KEY` because seed operations are server-side administrative writes. Do not expose that key to the browser.

## Current Integration Status

This seed dataset is the canonical source for the next product phase. The current visible UI still has some legacy hardcoded page data and the older `data/incidents.json` fallback path. The next implementation step should migrate `/api/incidents`, `/api/alert`, and `/api/chat` to consume this canonical dataset through `lib/db`.

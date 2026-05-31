# Demo Hardening

## What Changed

- Added typed environment validation in `lib/config/env.ts`.
- Standardized API success and error envelopes for active demo routes.
- Added `/api/health` for dataset, retrieval, and agent readiness checks.
- Updated UI fetch handling for wrapped API responses.
- Added clean fallback messages for retrieval, analysis, and resolve failures.
- Added skeleton rows while resolved memory loads.
- Reset the agent thread for each new simulation or selected incident to avoid stale demo state.
- Preserved `/api/retain` as a compatibility wrapper while keeping `/api/resolve` canonical.
- Updated README and added a live-demo script.

## Why

The goal was not to add product features. The changes reduce demo risk by making failures explicit, keeping UI state recoverable, and ensuring the incident lifecycle can run repeatedly without a reload.

## Validation Targets

- `npm run lint`
- `/api/health`
- simulate -> retrieve -> analyze -> resolve repeated three times
- clean UI fallback messages for retrieval, analysis, and resolve failures

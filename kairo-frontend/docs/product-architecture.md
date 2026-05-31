# Kairo Product Architecture

## Purpose

Kairo is a memory-native incident copilot for vendor and external-service failures. The product should help an operator move from an active incident to evidence-backed action by recalling similar historical incidents, showing what worked, warning about checks that wasted time before, and storing the final resolution as future memory.

This architecture is intentionally practical for the current repo. It defines the stable product objects and data boundaries needed before deeper UI and agent wiring.

## Core Loop

1. An incident is detected or manually created.
2. Kairo stores the incident and its timeline events.
3. Kairo retrieves similar resolved incidents from memory.
4. Kairo creates an analysis run using the active incident plus retrieved memory.
5. The operator acts on recommended actions and avoids known dead ends.
6. The operator resolves the incident.
7. Kairo writes the resolution and updates the incident memory.

## Core Entities

### Vendor

A third-party or internal service provider involved in an incident. Examples: Razorpay, MSG91, Cashfree, AWS S3, WhatsApp Cloud API.

Vendors are separated from incidents so the product can later support vendor health, escalation metadata, recurring patterns, and vendor-level reliability views.

### Incident

The primary operational record. It represents a real degradation, outage, or externally caused failure. It owns the current status, severity, timings, detected signals, root cause, resolution, skipped checks, and matched patterns.

### Incident Event

Append-only timeline entries for signals, human actions, vendor updates, mitigations, status changes, and resolution notes. Events keep the incident explainable without overloading the incident row.

### Memory Match

A persisted record showing that one incident recalled another incident as relevant memory. This makes retrieval auditable and lets the UI explain why Kairo cited a past episode.

### Analysis Run

A structured reasoning attempt for an incident. Each run records the model used, input snapshot, output snapshot, cited memory, diagnosis, confidence, recommended actions, dead ends, and uncertainty.

### Resolution

The final human-confirmed outcome. It captures the fix, failed mitigations, root cause, pattern tags, time to resolve, and whether the case should be retained as memory.

## Relationships

- A vendor has many incidents.
- An incident has many incident events.
- An incident has many analysis runs.
- An analysis run can create many memory matches.
- A memory match links the active incident to a matched historical incident.
- An incident has zero or one resolution.
- A resolution updates the incident and becomes memory for future retrieval.

## Runtime Boundaries

### UI

The UI should not own business truth. It should display active incidents, memory matches, analysis output, and resolution state returned by API routes.

### API Routes

API routes should validate request payloads, call `lib/db` and retrieval/reasoning helpers, and return stable DTOs for the UI.

### Data Layer

`lib/db` is the canonical boundary for table names, domain mapping, seed access, and future Supabase queries. UI components should not import seed data directly once the next phase starts.

### Seed Data

`data/incidents-seed.json` is the source of truth for demo incident memory. It uses the canonical incident shape and should replace scattered mock arrays over time.

## Non-Goals For This Step

- No UI redesign.
- No full retrieval implementation.
- No new service layer beyond the minimal `lib/db` boundary.
- No invented event streaming or queue infrastructure.
- No fake production claims before Supabase and retrieval are fully wired.

## Next Implementation Steps

1. Update `/api/incidents` to read canonical incidents from `lib/db` instead of the older `data/incidents.json` fallback.
2. Add a retrieval adapter that scores against `memory_text` and later swaps to embeddings.
3. Update the visible dashboard panels to consume `Incident`, `MemoryMatch`, `AnalysisRun`, and `Resolution` DTOs.
4. Wire `/api/resolve` to insert a `resolutions` row and update the incident row.
5. Add a migration-backed Supabase client only when the app is ready to persist live data.

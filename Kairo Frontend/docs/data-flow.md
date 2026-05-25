# Data Flow

## Initial Page Load

```text
app/page.tsx
  -> DashboardShell
  -> fetch("/api/seed", POST) once per browser via localStorage
  -> DashboardShell useEffect fetch("/api/incidents", GET)
  -> data/incidents.json
  -> resolved incidents table
```

Notes:

- `/api/seed` writes to Hindsight only when Hindsight env vars are configured.
- `/api/incidents` `GET` is local JSON-backed.

## Simulate Incident

```text
Simulate Incident button
  -> DashboardShell.handleSimulateIncident()
  -> POST /api/alert { index }
  -> SIMULATED_ALERTS
  -> recallIncidents()
    -> Hindsight when configured
    -> local scoring over data/incidents.json otherwise
  -> recalledIncidents returned to UI
  -> activeIncident + activeIncidents + memoryMatches state
  -> POST /api/chat with currentIncident + past_episodes
  -> buildKairoBrief() in demo mode or Groq in llm mode
  -> RightPanel + AgentChat update
```

## Agent Follow-Up

```text
AgentChat input
  -> POST /api/chat
  -> uses currentIncident and past_episodes when available
  -> returns response
  -> AgentChat appends assistant message
```

## Wired vs Placeholder

Actually wired:

- Live incident simulation
- Memory retrieval for simulated incident
- Agent reasoning panel
- Resolved incidents table from local dataset

Placeholder/static:

- Memory Log page
- Vendor Overview page
- Vendor Profile page
- Pattern Rules page
- Agent empty-state metrics

Unwired but present:

- `/api/resolve`
- `/api/retain`
- `POST /api/incidents`

## Next Integration Points

- A Resolve Incident UI should submit to `/api/resolve`.
- Secondary pages should read from the canonical incident/memory source instead of hardcoded arrays.
- A real incident ingestion path should replace `SIMULATED_ALERTS`.

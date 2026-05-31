# UI Wiring

## Current Visible Flow

The dashboard now uses the live Kairo API flow instead of standalone page arrays for the core product path.

```text
app/page.tsx
  -> POST /api/seed once per browser
  -> DashboardShell
  -> GET /api/incidents for canonical resolved memory
  -> POST /api/alert when Simulate Incident is clicked
  -> POST /api/chat with active incident and retrieved memory
  -> RightPanel and AgentChat render memory and structured reasoning
```

## State Ownership

`components/kairo/dashboard-shell.tsx` owns:

- `activeIncident`
- `activeIncidents`
- `resolvedIncidents`
- `memoryMatches`
- `memoryStatus`
- `reasoningStatus`
- `agentAnalysis`

The shell passes live computed state into:

- `LiveIncidentsPage`
- `RightPanel`
- `AgentChat`
- `VendorsOverviewPage`
- `VendorProfilePage`
- `MemoryLogPage`
- `PatternRulesPage`

## Active Incident Selection

Clicking a visible incident row calls back into `DashboardShell`, which:

1. Sets the selected incident as active.
2. Calls `POST /api/incidents` with `currentIncident`.
3. Calls `POST /api/chat` with the same retrieved memory.
4. Updates the episodic memory panel and agent panel.

## Simulate Incident

Clicking `Simulate Incident` calls `POST /api/alert`. The alert route now samples from canonical incident memory, retrieves similar incidents, and returns structured analysis. The shell then calls `/api/chat` with the same memory so the agent panel uses the canonical response shape.

## Dashboard Metrics

The Live Incidents cards are computed from state:

- memory recall hits from `memoryMatches.length`
- time saved from retrieved incidents' historical resolution minutes
- vendor patterns learned from active plus resolved incident vendors

Vendor, memory log, and pattern pages are derived from `resolvedIncidents` and `activeIncidents` passed by `DashboardShell`.

## Resolution

The live incident table includes a compact `Resolve` action for active incidents. It calls `/api/resolve` using the active incident, structured agent analysis, and top memory match. On success, the row moves from live to resolved and the agent records the write-back.

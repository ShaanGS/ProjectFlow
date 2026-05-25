import type { IncidentSeedRecord } from "@/types/kairo-domain"

export interface ActiveIncidentContext {
  id?: string
  incident_id?: string
  title?: string
  description?: string
  vendor?: string | null
  service?: string
  region?: string
  severity?: string
  environment?: string
  signals?: string[]
  symptoms?: string[]
  customer_impact?: string
  tags?: string[]
}

export interface RetrievedMemoryIncident {
  id: string
  matched_incident_id: string
  title: string
  vendor: string
  service: string
  date: string
  region: string
  severity: string
  similarity: number
  root_cause: string | null
  resolution: string | null
  skipped_checks: string[]
  patterns_matched: string[]
  signals: string[]
  tags: string[]
  match_reason: string
  metadata: {
    incident_id: string
    title: string
    vendor: string
    service: string
    region: string
    classification: string
    timestamp_start: string
    actual_root_cause: string
    successful_fix: string
    failed_checks: string
    customer_impact: string
    time_to_resolution_minutes: string
    patterns_matched: string
  }
  source: IncidentSeedRecord
}

export interface RetrievalRequest {
  title?: string
  description?: string
  vendor?: string | null
  service?: string
  region?: string
  signals?: string[]
  symptoms?: string[]
  tags?: string[]
  excludeIncidentIds?: string[]
  limit?: number
}

export interface RetrievalResponse {
  query: string
  matches: RetrievedMemoryIncident[]
}

export interface AgentReasoning {
  diagnosis: string
  likely_cause: string
  recommended_next_actions: string[]
  checks_to_skip: string[]
  uncertainty_note: string
  referenced_memory_incidents: Array<{
    id: string
    title: string
    vendor: string
    similarity: number
  }>
}

export interface AgentRuntimeResponse {
  response: string
  analysis: AgentReasoning
  memoryMatches: number
  recalledIncidents: RetrievedMemoryIncident[]
  stages: Array<{
    name: "input" | "retrieval" | "reasoning"
    status: "completed" | "skipped"
    summary: string
  }>
}

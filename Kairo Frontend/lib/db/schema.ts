import type {
  AnalysisRun,
  Incident,
  IncidentEvent,
  MemoryMatch,
  Resolution,
  Vendor,
} from "@/types/kairo-domain"

export const KAIRO_TABLES = {
  vendors: "vendors",
  incidents: "incidents",
  incidentEvents: "incident_events",
  memoryMatches: "memory_matches",
  analysisRuns: "analysis_runs",
  resolutions: "resolutions",
} as const

export type KairoTableName = (typeof KAIRO_TABLES)[keyof typeof KAIRO_TABLES]

export interface KairoDatabase {
  vendors: Vendor
  incidents: Incident
  incident_events: IncidentEvent
  memory_matches: MemoryMatch
  analysis_runs: AnalysisRun
  resolutions: Resolution
}

export const INCIDENT_SEVERITIES = ["SEV-1", "SEV-2", "SEV-3"] as const
export const INCIDENT_ENVIRONMENTS = ["production", "staging", "sandbox"] as const
export const INCIDENT_STATUSES = [
  "detected",
  "investigating",
  "mitigating",
  "resolved",
  "closed",
] as const

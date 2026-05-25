export type IncidentSeverity = "SEV-1" | "SEV-2" | "SEV-3"

export type IncidentEnvironment = "production" | "staging" | "sandbox"

export type IncidentStatus =
  | "detected"
  | "investigating"
  | "mitigating"
  | "resolved"
  | "closed"

export type IncidentEventType =
  | "signal"
  | "status_change"
  | "mitigation"
  | "vendor_update"
  | "analysis"
  | "resolution"

export type AnalysisRunStatus = "queued" | "running" | "completed" | "failed"

export interface Vendor {
  id: string
  name: string
  category: "payments" | "messaging" | "cloud" | "communications" | "identity" | "internal"
  statusPageUrl?: string
  escalationUrl?: string
  createdAt: string
  updatedAt: string
}

export interface Incident {
  id: string
  title: string
  vendorId: string
  vendor: string
  service: string
  severity: IncidentSeverity
  environment: IncidentEnvironment
  region: string
  status: IncidentStatus
  triggeredAt: string
  resolvedAt: string | null
  ttdSeconds: number
  ttrSeconds: number | null
  description: string
  signals: string[]
  tags: string[]
  rootCause: string | null
  resolution: string | null
  skippedChecks: string[]
  patternsMatched: string[]
  createdAt: string
  updatedAt: string
}

export interface IncidentEvent {
  id: string
  incidentId: string
  eventType: IncidentEventType
  occurredAt: string
  title: string
  body: string
  source: "kairo" | "monitor" | "human" | "vendor" | "system"
  metadata: Record<string, unknown>
}

export interface MemoryMatch {
  id: string
  incidentId: string
  matchedIncidentId: string
  analysisRunId?: string
  similarity: number
  rank: number
  matchReason: string
  matchedSignals: string[]
  createdAt: string
}

export interface AnalysisRun {
  id: string
  incidentId: string
  status: AnalysisRunStatus
  model: string
  startedAt: string
  completedAt: string | null
  diagnosis: string | null
  confidence: number | null
  recommendedActions: string[]
  deadEnds: string[]
  crossVendorPattern: string | null
  uncertaintyNote: string | null
  citedIncidentIds: string[]
  inputSnapshot: Record<string, unknown>
  outputSnapshot: Record<string, unknown>
}

export interface Resolution {
  id: string
  incidentId: string
  resolvedBy: string
  resolvedAt: string
  fixApplied: string
  failedMitigations: string[]
  rootCause: string
  patternTags: string[]
  timeToResolveSeconds: number
  notes?: string
  retainedAsMemory: boolean
}

export interface IncidentSeedRecord {
  id: string
  title: string
  vendor: string
  service: string
  severity: IncidentSeverity
  environment: IncidentEnvironment
  region: string
  status: IncidentStatus
  triggered_at: string
  resolved_at: string | null
  ttd_seconds: number
  ttr_seconds: number | null
  description: string
  signals: string[]
  tags: string[]
  root_cause: string | null
  resolution: string | null
  skipped_checks: string[]
  patterns_matched: string[]
}

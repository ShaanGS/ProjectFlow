export interface ApiIncident {
  incident_id: string
  title: string
  vendor: string | null
  region?: string
  severity: string
  symptoms?: string[]
  timestamp_start?: string
  customer_impact?: string
  time_to_resolution_minutes?: number
  classification?: string
}

export interface DisplayIncident {
  id: string
  name: string
  vendor: string
  status: "live" | "resolved"
  severity: "critical" | "warning" | "info"
  time: string
  memoryMatches: number
  classification?: string
  raw?: ApiIncident
}

export interface MemoryMatch {
  id: string
  matched_incident_id?: string
  title?: string
  vendor?: string
  service?: string
  date?: string
  region?: string
  severity?: string
  similarity?: number
  root_cause?: string | null
  resolution?: string | null
  skipped_checks?: string[]
  patterns_matched?: string[]
  signals?: string[]
  tags?: string[]
  match_reason?: string
  text?: string
  metadata?: {
    incident_id?: string
    title?: string
    vendor?: string
    service?: string
    region?: string
    classification?: string
    actual_root_cause?: string
    successful_fix?: string
    failed_checks?: string
    time_to_resolution_minutes?: string
    timestamp_start?: string
    customer_impact?: string
    patterns_matched?: string
  }
}

export type LoadStatus = "idle" | "loading" | "loaded" | "error"

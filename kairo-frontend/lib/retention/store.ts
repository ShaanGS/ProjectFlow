import { canonicalIncidentSeed } from "@/lib/db/incidents"
import type { ActiveIncidentContext } from "@/types/agent"
import type { IncidentSeedRecord } from "@/types/kairo-domain"

export interface ResolutionWritebackInput {
  incident: ActiveIncidentContext
  fix_applied: string
  failed_mitigations: string[]
  root_cause: string
  pattern_tags: string[]
  resolution_time_seconds: number
  resolved_by?: string
  notes?: string
}

const retainedIncidents = new Map<string, IncidentSeedRecord>()

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48)
}

function nowIso() {
  return new Date().toISOString()
}

function normalizeStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean)
  }
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

export function getMemoryIncidents() {
  return [...canonicalIncidentSeed, ...retainedIncidents.values()]
}

export function retainResolvedIncident(input: ResolutionWritebackInput) {
  const incident = input.incident
  const resolvedAt = nowIso()
  const triggeredAt =
    incident.triggered_at ?? incident.timestamp_start ?? new Date(Date.now() - input.resolution_time_seconds * 1000).toISOString()
  const vendor = incident.vendor ?? "Internal"
  const id =
    incident.id ??
    incident.incident_id ??
    `inc_retained_${slug(vendor)}_${Date.now()}`

  const retained: IncidentSeedRecord = {
    id,
    title: incident.title ?? "Resolved Kairo incident",
    vendor,
    service: incident.service ?? "Unknown service",
    severity: (incident.severity as IncidentSeedRecord["severity"]) ?? "SEV-2",
    environment: (incident.environment as IncidentSeedRecord["environment"]) ?? "production",
    region: incident.region ?? "unknown",
    status: "resolved",
    triggered_at: triggeredAt,
    resolved_at: resolvedAt,
    ttd_seconds: 0,
    ttr_seconds: input.resolution_time_seconds,
    description:
      incident.description ??
      incident.customer_impact ??
      `Resolved ${vendor} incident retained from Kairo UI flow.`,
    signals: normalizeStringArray(incident.signals ?? incident.symptoms),
    tags: normalizeStringArray(incident.tags).length
      ? normalizeStringArray(incident.tags)
      : normalizeStringArray(input.pattern_tags),
    root_cause: input.root_cause,
    resolution: input.fix_applied,
    skipped_checks: input.failed_mitigations,
    patterns_matched: input.pattern_tags,
  }

  retainedIncidents.set(retained.id, retained)

  return {
    incident: retained,
    resolution: {
      id: `res_${retained.id}`,
      incident_id: retained.id,
      resolved_by: input.resolved_by ?? "kairo-user",
      resolved_at: resolvedAt,
      fix_applied: input.fix_applied,
      failed_mitigations: input.failed_mitigations,
      root_cause: input.root_cause,
      pattern_tags: input.pattern_tags,
      time_to_resolve_seconds: input.resolution_time_seconds,
      notes: input.notes,
      retained_as_memory: true,
    },
  }
}

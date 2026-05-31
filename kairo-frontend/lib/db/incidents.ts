import incidentsSeed from "@/data/incidents-seed.json"
import type { IncidentSeedRecord } from "@/types/kairo-domain"

export const canonicalIncidentSeed = incidentsSeed as IncidentSeedRecord[]

export function getIncidentById(id: string) {
  return canonicalIncidentSeed.find((incident) => incident.id === id) ?? null
}

export function getIncidentsByVendor(vendor: string) {
  const normalizedVendor = vendor.toLowerCase()
  return canonicalIncidentSeed.filter(
    (incident) => incident.vendor.toLowerCase() === normalizedVendor
  )
}

export function buildIncidentMemoryText(incident: IncidentSeedRecord) {
  return [
    incident.title,
    incident.vendor,
    incident.service,
    incident.severity,
    incident.environment,
    incident.region,
    incident.description,
    incident.signals.join(" "),
    incident.tags.join(" "),
    incident.root_cause ?? "",
    incident.resolution ?? "",
    incident.skipped_checks.join(" "),
    incident.patterns_matched.join(" "),
  ]
    .filter(Boolean)
    .join(" ")
}

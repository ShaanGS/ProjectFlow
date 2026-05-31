import { getMemoryIncidents } from "@/lib/retention/store"
import type { RetrievalRequest, RetrievedMemoryIncident } from "@/types/agent"
import type { IncidentSeedRecord } from "@/types/kairo-domain"
import {
  buildActiveIncidentText,
  buildHistoricalIncidentText,
  tokenize,
  weightedTokenScore,
} from "./text"

function minutesFromSeconds(seconds: number | null) {
  if (!seconds) return "0"
  return String(Math.round(seconds / 60))
}

function classifyIncident(incident: IncidentSeedRecord) {
  if (incident.tags.includes("cloud")) return "vendor_side"
  if (incident.tags.includes("payments")) return "vendor_side"
  if (incident.tags.includes("messaging")) return "vendor_side"
  if (incident.tags.includes("communications")) return "vendor_side"
  return "unknown"
}

function explainMatch(input: RetrievalRequest, incident: IncidentSeedRecord, sharedTerms: string[]) {
  const reasons: string[] = []
  if (input.vendor && input.vendor.toLowerCase() === incident.vendor.toLowerCase()) {
    reasons.push(`same vendor (${incident.vendor})`)
  }
  if (input.region && incident.region.toLowerCase().includes(input.region.toLowerCase())) {
    reasons.push(`region overlap (${incident.region})`)
  }
  if (sharedTerms.length) reasons.push(`shared signals: ${sharedTerms.slice(0, 5).join(", ")}`)
  return reasons.join("; ") || "similar operational signals"
}

function toRetrievedMemoryIncident(
  incident: IncidentSeedRecord,
  similarity: number,
  rank: number,
  matchReason: string
): RetrievedMemoryIncident {
  return {
    id: incident.id,
    matched_incident_id: incident.id,
    title: incident.title,
    vendor: incident.vendor,
    service: incident.service,
    date: incident.triggered_at,
    region: incident.region,
    severity: incident.severity,
    similarity,
    root_cause: incident.root_cause,
    resolution: incident.resolution,
    skipped_checks: incident.skipped_checks,
    patterns_matched: incident.patterns_matched,
    signals: incident.signals,
    tags: incident.tags,
    match_reason: matchReason,
    metadata: {
      incident_id: incident.id,
      title: incident.title,
      vendor: incident.vendor,
      service: incident.service,
      region: incident.region,
      classification: classifyIncident(incident),
      timestamp_start: incident.triggered_at,
      actual_root_cause: incident.root_cause ?? "",
      successful_fix: incident.resolution ?? "",
      failed_checks: incident.skipped_checks.join(", "),
      customer_impact: incident.description,
      time_to_resolution_minutes: minutesFromSeconds(incident.ttr_seconds),
      patterns_matched: incident.patterns_matched.join(", "),
    },
    source: incident,
  }
}

export function retrieveSimilarIncidents(input: RetrievalRequest) {
  const limit = input.limit ?? 4
  const exclude = new Set(input.excludeIncidentIds ?? [])
  const query = buildActiveIncidentText(input)
  const queryTokens = tokenize(query)

  const scored = getMemoryIncidents()
    .filter((incident) => !exclude.has(incident.id))
    .map((incident) => {
      const docTokens = tokenize(buildHistoricalIncidentText(incident))
      const sharedTerms = queryTokens.filter((token) => docTokens.includes(token))
      const lexical = weightedTokenScore(queryTokens, docTokens)
      const vendorBoost =
        input.vendor && input.vendor.toLowerCase() === incident.vendor.toLowerCase() ? 0.22 : 0
      const serviceBoost =
        input.service && input.service.toLowerCase() === incident.service.toLowerCase() ? 0.12 : 0
      const regionBoost =
        input.region && incident.region.toLowerCase().includes(input.region.toLowerCase())
          ? 0.08
          : 0
      const patternBoost = (input.tags ?? []).some((tag) => incident.tags.includes(tag)) ? 0.08 : 0
      const similarity = Math.min(0.88, lexical + vendorBoost + serviceBoost + regionBoost + patternBoost)

      return {
        incident,
        similarity,
        matchReason: explainMatch(input, incident, sharedTerms),
      }
    })
    .filter((row) => row.similarity > 0.05)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)

  const matches = scored.map((row, index) =>
    toRetrievedMemoryIncident(
      row.incident,
      Number(row.similarity.toFixed(4)),
      index + 1,
      row.matchReason
    )
  )

  return {
    query,
    matches,
  }
}

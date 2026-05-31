import type { ActiveIncidentContext, RetrievalRequest } from "@/types/agent"
import type { IncidentSeedRecord } from "@/types/kairo-domain"

export function activeIncidentToRetrievalRequest(
  incident: ActiveIncidentContext,
  limit = 4
): RetrievalRequest {
  return {
    title: incident.title,
    description: incident.description ?? incident.customer_impact,
    vendor: incident.vendor,
    service: incident.service,
    region: incident.region,
    signals: incident.signals ?? incident.symptoms,
    tags: incident.tags,
    excludeIncidentIds: [incident.id, incident.incident_id].filter(Boolean) as string[],
    limit,
  }
}

export function seedIncidentToActiveContext(incident: IncidentSeedRecord): ActiveIncidentContext {
  return {
    id: incident.id,
    incident_id: incident.id,
    title: incident.title,
    description: incident.description,
    vendor: incident.vendor,
    service: incident.service,
    region: incident.region,
    severity: incident.severity,
    environment: incident.environment,
    signals: incident.signals,
    tags: incident.tags,
  }
}

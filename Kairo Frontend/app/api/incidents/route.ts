import { NextResponse } from "next/server"
import { canonicalIncidentSeed } from "@/lib/db/incidents"
import { retrieveSimilarIncidents } from "@/lib/retrieval/incidents"
import type { RetrievalRequest } from "@/types/agent"

function toLegacyApiIncident(incident: (typeof canonicalIncidentSeed)[number]) {
  return {
    ...incident,
    incident_id: incident.id,
    timestamp_start: incident.triggered_at,
    timestamp_end: incident.resolved_at,
    customer_impact: incident.description,
    symptoms: incident.signals,
    actual_root_cause: incident.root_cause,
    successful_fix: incident.resolution,
    failed_checks: incident.skipped_checks,
    time_to_resolution_minutes: incident.ttr_seconds
      ? Math.round(incident.ttr_seconds / 60)
      : 0,
    classification: "vendor_side",
    embedding_text: [
      incident.title,
      incident.vendor,
      incident.service,
      incident.description,
      incident.signals.join(" "),
      incident.root_cause ?? "",
      incident.resolution ?? "",
    ].join(" "),
  }
}

function requestFromBody(body: Record<string, unknown>): RetrievalRequest {
  const currentIncident =
    body.currentIncident && typeof body.currentIncident === "object"
      ? (body.currentIncident as Record<string, unknown>)
      : {}

  const description = String(
    body.description ??
      body.incidentDescription ??
      currentIncident.description ??
      currentIncident.customer_impact ??
      ""
  ).trim()

  const signals = Array.isArray(body.signals)
    ? body.signals.map(String)
    : Array.isArray(body.symptoms)
      ? body.symptoms.map(String)
      : Array.isArray(currentIncident.signals)
        ? currentIncident.signals.map(String)
        : Array.isArray(currentIncident.symptoms)
          ? currentIncident.symptoms.map(String)
          : []

  return {
    title: String(body.title ?? currentIncident.title ?? "").trim(),
    description,
    vendor: (body.vendor ?? currentIncident.vendor ?? null) as string | null,
    service: String(body.service ?? currentIncident.service ?? "").trim(),
    region: String(body.region ?? currentIncident.region ?? "").trim(),
    signals,
    tags: Array.isArray(body.tags) ? body.tags.map(String) : undefined,
    excludeIncidentIds: [
      body.id,
      body.incident_id,
      currentIncident.id,
      currentIncident.incident_id,
    ]
      .filter(Boolean)
      .map(String),
    limit: Number(body.limit ?? 4),
  }
}

export async function GET() {
  return NextResponse.json({
    incidents: canonicalIncidentSeed.map(toLegacyApiIncident),
    source: "data/incidents-seed.json",
  })
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const retrievalRequest = requestFromBody(body)
    const description = [
      retrievalRequest.vendor ?? "",
      retrievalRequest.region ?? "",
      retrievalRequest.title ?? "",
      retrievalRequest.description ?? "",
      ...(retrievalRequest.signals ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .trim()

    if (!description) {
      return NextResponse.json(
        { error: "Missing incident description" },
        { status: 400 }
      )
    }

    const recalled = retrieveSimilarIncidents(retrievalRequest)

    return NextResponse.json({
      matches: recalled.matches,
      incidents: recalled.matches.map((match) => ({
        id: match.matched_incident_id,
        incident_id: match.matched_incident_id,
        vendor_id: match.vendor,
        vendor: match.vendor,
        incident_type: match.metadata.classification,
        symptoms: match.signals,
        failed_mitigations: match.skipped_checks,
        fix_applied: match.resolution,
        time_to_resolve_minutes: Number(match.metadata.time_to_resolution_minutes),
        postmortem_summary:
          match.root_cause || match.resolution || match.metadata.customer_impact,
        pattern_tags: match.patterns_matched,
        similarity: match.similarity,
        metadata: match.metadata,
      })),
      query: recalled.query,
      source: "data/incidents-seed.json",
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Incident retrieval failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

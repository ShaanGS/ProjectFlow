import { NextRequest, NextResponse } from "next/server"
import { runKairoAgent } from "@/lib/agent/runtime"
import { canonicalIncidentSeed } from "@/lib/db/incidents"
import { seedIncidentToActiveContext } from "@/lib/memory/incident-memory"
import { retrieveSimilarIncidents } from "@/lib/retrieval/incidents"

function toSimulatedIncident(seedIndex: number) {
  const seed = canonicalIncidentSeed[seedIndex % canonicalIncidentSeed.length]
  const activeContext = seedIncidentToActiveContext(seed)

  return {
    ...activeContext,
    incident_id: `inc_sim_${Date.now()}`,
    timestamp_start: new Date().toISOString(),
    customer_impact: seed.description,
    symptoms: seed.signals,
    classification: "vendor_side",
    successful_fix: "",
    failed_checks: [],
    time_to_resolution_minutes: 0,
    embedding_text: [
      seed.vendor,
      seed.region,
      seed.title,
      seed.description,
      seed.signals.join(" "),
    ].join(" "),
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const alertIndex =
      typeof body.index === "number"
        ? body.index
        : Math.floor(Math.random() * canonicalIncidentSeed.length)

    const incident = toSimulatedIncident(alertIndex)
    const recalled = retrieveSimilarIncidents({
      title: incident.title,
      description: incident.description,
      vendor: incident.vendor,
      service: incident.service,
      region: incident.region,
      signals: incident.signals,
      excludeIncidentIds: [canonicalIncidentSeed[alertIndex % canonicalIncidentSeed.length].id],
      limit: 4,
    })

    const agentResult = runKairoAgent({
      activeIncident: incident,
      retrievedMemory: recalled.matches,
      latestUserMessage: `Analyze active incident: ${incident.title}`,
    })

    return NextResponse.json({
      incident,
      memoryMatches: recalled.matches.length,
      classification: "vendor_side",
      analysis: agentResult.response,
      structuredAnalysis: agentResult.analysis,
      recalledIncidents: recalled.matches,
      retrieval: {
        query: recalled.query,
        source: "data/incidents-seed.json",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Alert simulation failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

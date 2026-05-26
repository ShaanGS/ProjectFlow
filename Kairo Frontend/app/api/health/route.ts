import { NextResponse } from "next/server"
import { runKairoAgent } from "@/lib/agent/runtime"
import { hasAgentLlmConfig } from "@/lib/config/env"
import { canonicalIncidentSeed } from "@/lib/db/incidents"
import { retrieveSimilarIncidents } from "@/lib/retrieval/incidents"

export async function GET() {
  let dataset = false
  let retrieval = false
  let agent = false

  try {
    dataset = canonicalIncidentSeed.length > 0
    retrieval =
      retrieveSimilarIncidents({
        title: "Razorpay UPI timeout",
        vendor: "Razorpay",
        signals: ["payment capture 504", "callback delay"],
        limit: 1,
      }).matches.length > 0
    agent =
      hasAgentLlmConfig() &&
      Boolean(
        runKairoAgent({
          activeIncident: {
            title: "Health check incident",
            vendor: "Razorpay",
            signals: ["payment capture 504"],
          },
          latestUserMessage: "health check",
        }).analysis
      )
  } catch {
    return NextResponse.json({
      status: "degraded",
      checks: { dataset, retrieval, agent },
      timestamp: new Date().toISOString(),
    })
  }

  return NextResponse.json({
    status: dataset && retrieval && agent ? "ok" : "degraded",
    checks: { dataset, retrieval, agent },
    timestamp: new Date().toISOString(),
  })
}

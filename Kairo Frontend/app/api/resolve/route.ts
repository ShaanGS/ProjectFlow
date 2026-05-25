import { NextResponse } from "next/server"
import { retainIncident } from "@/lib/hindsight"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const now = new Date().toISOString()
    const incident = {
      incident_id: body.incident_id ?? `inc_resolved_${Date.now()}`,
      title: body.title ?? "Resolved incident",
      timestamp_start: body.timestamp_start ?? now,
      customer_impact: body.customer_impact ?? "",
      vendor: body.vendor ?? null,
      region: body.region ?? "unknown",
      classification: body.classification ?? body.incident_type ?? "unknown",
      actual_root_cause: body.root_cause ?? body.actual_root_cause ?? "",
      successful_fix: body.fix_applied ?? body.successful_fix ?? "",
      failed_checks: Array.isArray(body.failed_mitigations)
        ? body.failed_mitigations
        : Array.isArray(body.failed_checks)
          ? body.failed_checks
          : String(body.failed_mitigations ?? body.failed_checks ?? "")
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
      time_to_resolution_minutes: Number(
        body.resolution_time_minutes ?? body.time_to_resolution_minutes ?? 0
      ),
      embedding_text: [
        body.vendor,
        body.region,
        body.title,
        body.root_cause,
        body.fix_applied,
        body.pattern_tags,
      ]
        .flat()
        .filter(Boolean)
        .join(" "),
    }

    await retainIncident(incident)

    return NextResponse.json({
      success: true,
      incident,
      message: "Incident resolution stored in memory",
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to resolve incident"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { retainResolvedIncident } from "@/lib/retention/store"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const incident = body.incident ?? body.currentIncident ?? body

    const retained = retainResolvedIncident({
      incident,
      fix_applied: body.fix_applied ?? body.successful_fix ?? body.resolution ?? "Retained incident memory",
      failed_mitigations: Array.isArray(body.failed_mitigations)
        ? body.failed_mitigations
        : Array.isArray(body.failed_checks)
          ? body.failed_checks
          : [],
      root_cause: body.root_cause ?? body.actual_root_cause ?? "Retained historical incident",
      pattern_tags: Array.isArray(body.pattern_tags)
        ? body.pattern_tags
        : Array.isArray(body.patterns_matched)
          ? body.patterns_matched
          : [],
      resolution_time_seconds: Number(body.resolution_time_seconds ?? body.ttr_seconds ?? 0),
      resolved_by: body.resolved_by ?? "kairo-retain-api",
      notes: "Compatibility write through /api/retain; canonical path is /api/resolve.",
    })

    return NextResponse.json({
      success: true,
      incident: retained.incident,
      resolution: retained.resolution,
      message: "Incident retained through canonical Kairo write-back path",
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to retain incident"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

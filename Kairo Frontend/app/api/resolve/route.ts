import { NextResponse } from "next/server"
import { retainResolvedIncident } from "@/lib/retention/store"
import type { ActiveIncidentContext } from "@/types/agent"

function normalizeList(value: unknown) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean)
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const incident = (body.incident ?? body.currentIncident ?? body) as ActiveIncidentContext
    const fixApplied = String(body.fix_applied ?? body.successful_fix ?? body.resolution ?? "").trim()
    const rootCause = String(body.root_cause ?? body.actual_root_cause ?? "").trim()

    if (!incident || !incident.title) {
      return NextResponse.json({ error: "Missing incident context" }, { status: 400 })
    }

    if (!fixApplied || !rootCause) {
      return NextResponse.json(
        { error: "Missing fix_applied or root_cause for resolution write-back" },
        { status: 400 }
      )
    }

    const retained = retainResolvedIncident({
      incident,
      fix_applied: fixApplied,
      failed_mitigations: normalizeList(body.failed_mitigations ?? body.failed_checks),
      root_cause: rootCause,
      pattern_tags: normalizeList(body.pattern_tags ?? body.patterns_matched),
      resolution_time_seconds: Number(
        body.resolution_time_seconds ??
          body.time_to_resolve_seconds ??
          Number(body.resolution_time_minutes ?? 0) * 60 ??
          0
      ),
      resolved_by: String(body.resolved_by ?? "kairo-user"),
      notes: body.notes ? String(body.notes) : undefined,
    })

    return NextResponse.json({
      success: true,
      incident: retained.incident,
      resolution: retained.resolution,
      message: "Incident resolution retained as Kairo memory",
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to resolve incident"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

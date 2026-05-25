import { NextResponse } from "next/server"
import incidents from "@/data/incidents.json"
import { recallIncidents } from "@/lib/hindsight"

export async function GET() {
  return NextResponse.json({ incidents })
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const description = String(
      body.description ??
        body.incidentDescription ??
        [
          body.currentIncident?.vendor,
          body.currentIncident?.region,
          body.currentIncident?.title,
          ...(Array.isArray(body.currentIncident?.symptoms)
            ? body.currentIncident.symptoms
            : []),
        ]
          .filter(Boolean)
          .join(" ")
    ).trim()

    if (!description) {
      return NextResponse.json(
        { error: "Missing incident description" },
        { status: 400 }
      )
    }

    const recalled = await recallIncidents(description)

    return NextResponse.json({
      matches: recalled.matches,
      incidents: recalled.matches.map((match) => {
        const meta = match.metadata ?? {}
        return {
          id: meta.incident_id ?? match.id,
          incident_id: meta.incident_id ?? match.id,
          vendor_id: meta.vendor ?? "internal",
          vendor: meta.vendor ?? "internal",
          incident_type: meta.classification ?? "unknown",
          symptoms: match.text,
          failed_mitigations: meta.failed_checks ?? "",
          fix_applied: meta.successful_fix ?? "",
          time_to_resolve_minutes: Number(meta.time_to_resolution_minutes ?? 0),
          postmortem_summary:
            meta.actual_root_cause || meta.customer_impact || meta.title || match.text,
          pattern_tags: [meta.vendor, meta.classification].filter(Boolean),
          similarity: "score" in match ? (match as { score?: number }).score : undefined,
          metadata: meta,
        }
      }),
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Incident retrieval failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

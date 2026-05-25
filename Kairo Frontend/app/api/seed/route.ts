import { NextResponse } from "next/server"
import incidents from "@/data/incidents.json"
import { retainIncident } from "@/lib/hindsight"

export async function POST() {
  try {
    for (const incident of incidents) {
      await retainIncident(incident)
      await new Promise((resolve) => setTimeout(resolve, 300))
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${incidents.length} incidents to Hindsight`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to seed incidents"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

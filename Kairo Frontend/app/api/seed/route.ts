import { NextResponse } from "next/server"
import { canonicalIncidentSeed } from "@/lib/db/incidents"

export async function POST() {
  return NextResponse.json({
    success: true,
    source: "data/incidents-seed.json",
    incidents: canonicalIncidentSeed.length,
    message: `Canonical Kairo memory dataset is available with ${canonicalIncidentSeed.length} incidents.`,
  })
}

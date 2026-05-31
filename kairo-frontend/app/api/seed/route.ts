import { NextResponse } from "next/server"
import { canonicalIncidentSeed } from "@/lib/db/incidents"
import "@/lib/config/env"

export async function POST() {
  try {
    return NextResponse.json({ success: true, data: {
      source: "data/incidents-seed.json",
      incidents: canonicalIncidentSeed.length,
      message: `Canonical Kairo memory dataset is available with ${canonicalIncidentSeed.length} incidents.`,
    }})
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load seed dataset"
    return NextResponse.json(
      { success: false, error: message, code: "SEED_DATASET_FAILED" },
      { status: 500 }
    )
  }
}

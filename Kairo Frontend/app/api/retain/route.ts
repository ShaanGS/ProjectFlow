import { NextRequest, NextResponse } from "next/server"
import { retainIncident } from "@/lib/hindsight"

export async function POST(req: NextRequest) {
  try {
    const incident = await req.json()
    await retainIncident(incident)

    return NextResponse.json({
      success: true,
      message: "Incident retained in Hindsight memory",
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to retain incident"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


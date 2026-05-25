import { NextRequest, NextResponse } from "next/server"
import { runKairoAgent } from "@/lib/agent/runtime"
import type { ActiveIncidentContext, RetrievedMemoryIncident } from "@/types/agent"

type ChatTurn = { role: "user" | "assistant"; content: string }

function normalizeChatMessages(body: {
  messages?: unknown
  message?: string
}): ChatTurn[] {
  const raw = body.messages
  if (Array.isArray(raw) && raw.length > 0) {
    const out: ChatTurn[] = []
    for (const item of raw) {
      if (!item || typeof item !== "object") continue
      const role = (item as ChatTurn).role
      if (role !== "user" && role !== "assistant") continue
      const content = String((item as ChatTurn).content ?? "").trim()
      if (!content) continue
      out.push({ role, content })
    }
    if (out.length) return out.slice(-24)
  }
  if (typeof body.message === "string" && body.message.trim()) {
    return [{ role: "user", content: body.message.trim() }]
  }
  return []
}

function activeIncidentFromBody(body: Record<string, unknown>, latestUserMessage: string) {
  const current =
    body.currentIncident && typeof body.currentIncident === "object"
      ? (body.currentIncident as ActiveIncidentContext)
      : null

  if (current) return current

  return {
    title: latestUserMessage || "Untitled incident",
    description: latestUserMessage,
    signals: latestUserMessage ? [latestUserMessage] : [],
  } satisfies ActiveIncidentContext
}

function normalizeMemoryMatches(body: Record<string, unknown>) {
  const raw =
    Array.isArray(body.past_episodes) && body.past_episodes.length > 0
      ? body.past_episodes
      : Array.isArray(body.pastEpisodes) && body.pastEpisodes.length > 0
        ? body.pastEpisodes
        : Array.isArray(body.memoryMatches) && body.memoryMatches.length > 0
          ? body.memoryMatches
          : []

  return raw.filter((item): item is RetrievedMemoryIncident => {
    return Boolean(
      item &&
        typeof item === "object" &&
        "matched_incident_id" in item &&
        "title" in item &&
        "similarity" in item
    )
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>
    const chatMessages = normalizeChatMessages(body)

    if (!chatMessages.length) {
      return NextResponse.json(
        { error: "Missing messages or message" },
        { status: 400 }
      )
    }

    const latestUserMessage =
      [...chatMessages].reverse().find((message) => message.role === "user")?.content ?? ""

    const activeIncident = activeIncidentFromBody(body, latestUserMessage)
    const retrievedMemory = normalizeMemoryMatches(body)

    const result = runKairoAgent({
      activeIncident,
      retrievedMemory,
      latestUserMessage,
    })

    return NextResponse.json(result)
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Chat request failed"
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}

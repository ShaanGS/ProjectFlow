import { NextRequest, NextResponse } from "next/server"
import { recallIncidents, type MemoryMatch } from "@/lib/hindsight"
import groq, { hasGroqConfig } from "@/lib/groq"
import { cleanModelOutput } from "@/lib/llm-output"
import { buildKairoBrief } from "@/lib/kairo-brief"

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

function countUserMessages(chatMessages: ChatTurn[]) {
  return chatMessages.filter((m) => m.role === "user").length
}

function getFirstUserTurn(chatMessages: ChatTurn[]) {
  return chatMessages.find((m) => m.role === "user")
}

/** User is asking for immediate actions / remediation (not general chit-chat). */
function wantsNowGuidance(text: string) {
  const q = text.toLowerCase()
  return /what (should|can) we do(\s+now)?|what to do(\s+now)?|what'?s next|next steps?|next move|immediate action|how do (we|i) (fix|mitigate|resolve|proceed)|how to (fix|rectify|resolve|proceed)|remediation|mitigation|runbook|action items?|what now/i.test(
    q
  )
}

function formatWhatToDoNowBlock(matches: MemoryMatch[]): string {
  const fix = matches[0]?.metadata?.successful_fix?.trim()
  if (!fix) {
    return "**What to do now:** No runbook hit for this thread—re-state the vendor/symptoms in one message or simulate the alert again so memory can anchor."
  }
  const parts = fix.split(/\s*;\s*/).map((s) => s.trim()).filter(Boolean)
  const lines = parts.length ? parts : [fix]
  return "**What to do now:**\n" + lines.map((l) => `- ${l}`).join("\n")
}

function recalledMemoryJson(matches: MemoryMatch[]) {
  const rows = matches.map((m) => {
    const meta = m.metadata ?? {}
    return {
      incident_id: meta.incident_id ?? null,
      title: meta.title ?? null,
      timestamp_start: meta.timestamp_start ?? null,
      vendor: meta.vendor ?? null,
      region: meta.region ?? null,
      classification: meta.classification ?? null,
      actual_root_cause: meta.actual_root_cause ?? null,
      successful_fix: meta.successful_fix ?? null,
      failed_checks: meta.failed_checks ?? null,
      customer_impact: meta.customer_impact ?? null,
      time_to_resolution_minutes: meta.time_to_resolution_minutes ?? null,
    }
  })
  return JSON.stringify(rows, null, 2)
}

function buildRecallQuery(
  currentIncident: { vendor?: string; symptoms?: string[] } | null | undefined,
  userTurns: ChatTurn[]
) {
  const parts: string[] = []
  if (currentIncident) {
    const v = currentIncident.vendor ?? ""
    const s = Array.isArray(currentIncident.symptoms)
      ? currentIncident.symptoms.join(" ")
      : ""
    parts.push(`${v} ${s}`.trim())
  }
  for (const m of userTurns) {
    if (m.role === "user") parts.push(m.content)
  }
  return parts.filter(Boolean).join(" ").trim() || "incident triage"
}

const KAIRO_SYSTEM_PROMPT = (memoryJson: string) => `You are Kairo, a memory-native incident copilot for SRE teams.
You have access to a vector database of past post-mortems and
vendor incident history.

For the FIRST message describing a new incident, use the full structured format with BOUNDARY, ROOT_CAUSE, RESOLUTION_STEPS, SKIP, and MEMORY_REF sections.
For ALL follow-up messages in the same conversation, IGNORE the structured format completely. Just answer the specific question asked in 2-3 short sentences. Be direct, conversational, and human. Never repeat what you already said in the same chat.

MEMORY RULE: You must never hallucinate resolution steps. Only
suggest actions that are grounded in the incident context provided.

[RECALLED_MEMORY]
${memoryJson}`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { currentIncident } = body

    const chatMessages = normalizeChatMessages(body)
    if (!chatMessages.length) {
      return NextResponse.json(
        { error: "Missing messages or message" },
        { status: 400 }
      )
    }

    const latestUser =
      [...chatMessages].reverse().find((m) => m.role === "user")?.content ?? ""

    const userTurnCount = countUserMessages(chatMessages)
    const isFirstIncidentTurn = userTurnCount === 1
    const guidanceIntent = wantsNowGuidance(latestUser)

    let recalledMatches: MemoryMatch[] = []
    let anchorMatches: MemoryMatch[] = []

    if (isFirstIncidentTurn) {
      const recalled = await recallIncidents(
        buildRecallQuery(currentIncident, chatMessages)
      )
      recalledMatches = recalled.matches
    } else {
      const firstUser = getFirstUserTurn(chatMessages)
      if (firstUser) {
        const anchor = await recallIncidents(
          buildRecallQuery(currentIncident, [firstUser])
        )
        anchorMatches = anchor.matches
      }
    }

    const matchesForPrompt = isFirstIncidentTurn
      ? recalledMatches
      : anchorMatches.length > 0
        ? anchorMatches
        : recalledMatches

    const memoryJson = recalledMemoryJson(matchesForPrompt)
    const demoBrief = buildKairoBrief(latestUser, recalledMatches)

    if (process.env.KAIRO_DEMO_MODE !== "llm") {
      if (!isFirstIncidentTurn) {
        if (guidanceIntent && anchorMatches.length) {
          return NextResponse.json({
            response: formatWhatToDoNowBlock(anchorMatches),
            memoryMatches: anchorMatches.length,
            recalledIncidents: anchorMatches,
          })
        }
        return NextResponse.json({
          response:
            "Demo mode only formats the first incident turn from memory. Set KAIRO_DEMO_MODE=llm for conversational follow-ups.",
          memoryMatches: anchorMatches.length,
          recalledIncidents: anchorMatches,
        })
      }
      return NextResponse.json({
        response: demoBrief,
        memoryMatches: recalledMatches.length,
        recalledIncidents: recalledMatches,
      })
    }

    if (!hasGroqConfig()) {
      if (!isFirstIncidentTurn) {
        if (guidanceIntent && anchorMatches.length) {
          return NextResponse.json({
            response: formatWhatToDoNowBlock(anchorMatches),
            memoryMatches: anchorMatches.length,
            recalledIncidents: anchorMatches,
          })
        }
        return NextResponse.json({
          response:
            "Configure GROQ_API_KEY to enable conversational follow-ups in LLM mode.",
          memoryMatches: anchorMatches.length,
          recalledIncidents: anchorMatches,
        })
      }
      return NextResponse.json({
        response: demoBrief,
        memoryMatches: recalledMatches.length,
        recalledIncidents: recalledMatches,
      })
    }

    if (isFirstIncidentTurn) {
      return NextResponse.json({
        response: demoBrief,
        memoryMatches: recalledMatches.length,
        recalledIncidents: recalledMatches,
      })
    }

    const systemPrompt = KAIRO_SYSTEM_PROMPT(memoryJson)

    const response = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...chatMessages.map((m) => ({ role: m.role, content: m.content })),
      ],
      max_tokens: 600,
      temperature: 0.75,
    })

    const rawContent = response.choices[0]?.message?.content
    const cleaned = cleanModelOutput(rawContent)
    const missingModel =
      !cleaned || cleaned === "No response generated."

    let responseText: string
    if (missingModel) {
      responseText =
        guidanceIntent && anchorMatches.length
          ? formatWhatToDoNowBlock(anchorMatches)
          : "No response from model. Try again."
    } else {
      responseText = cleaned
    }

    return NextResponse.json({
      response: responseText,
      memoryMatches: anchorMatches.length,
      recalledIncidents: anchorMatches,
    })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Chat request failed"
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}

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

/** If they asked for next steps, ensure a concrete block exists (append from memory if the model omitted it). */
function ensureWhatToDoNowInReply(
  reply: string,
  latestUser: string,
  anchorMatches: MemoryMatch[]
): string {
  if (!wantsNowGuidance(latestUser) || !anchorMatches.length) return reply.trim()
  const trimmed = reply.trim()
  if (!trimmed) return formatWhatToDoNowBlock(anchorMatches)
  if (/\*\*what to do now\*\*:|what to do now:/i.test(trimmed)) return trimmed
  return `${trimmed}\n\n${formatWhatToDoNowBlock(anchorMatches)}`
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

function followUpSystemWithAnchor(
  anchorFix: string | undefined,
  wantsGuidance: boolean
) {
  const base = `You are Kairo, a DevOps Copilot. Answer the user's follow-up question conversationally and concisely based ONLY on the context of the incident detailed in the chat history above. Do not repeat the full incident brief. Just answer the question.

If the user is asking what to do now, what's next, next steps, remediation, or how to fix, you MUST include a short **What to do now:** section (2–4 bullets) tied to the incident already described in the thread.`

  if (!wantsGuidance || !anchorFix?.trim()) return base

  return `${base}

ANCHOR_RUNBOOK (ground truth from memory bank for this incident thread—use if the thread is thin):
${anchorFix.trim()}`
}

const STRICT_INCIDENT_SYSTEM = (memoryJson: string) => `You are Kairo, an elite L3 Incident Copilot.

[RECALLED_MEMORY]
${memoryJson}

You MUST output exactly this Markdown-style structure. Use only facts from [RECALLED_MEMORY]. If [RECALLED_MEMORY] is empty [], output exactly: INSUFFICIENT_MEMORY: No historical precedent found. Escalate to L2.

BOUNDARY: [vendor_side | internal | mixed from memory classification]
ROOT_CAUSE_MEMORY: [from memory actual_root_cause]
RESOLUTION_STEPS:
1. [from memory successful_fix; split on semicolons if multiple actions]
SKIP: [from memory failed_checks]

If the user is only asking what to do next (same as RESOLUTION_STEPS), still output the full structure above—do not skip sections.

No other sections. No \`<redacted_thinking>\` tags. No pleasantries.`

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

    const memoryJson = recalledMemoryJson(recalledMatches)
    const demoBrief = buildKairoBrief(latestUser, recalledMatches)

    const anchorFix = anchorMatches[0]?.metadata?.successful_fix

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

    const systemPrompt = isFirstIncidentTurn
      ? STRICT_INCIDENT_SYSTEM(memoryJson)
      : followUpSystemWithAnchor(anchorFix, guidanceIntent)

    const response = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...chatMessages.map((m) => ({ role: m.role, content: m.content })),
      ],
      max_tokens: isFirstIncidentTurn ? 700 : 550,
      temperature: isFirstIncidentTurn ? 0.2 : 0.35,
    })

    const rawContent = response.choices[0]?.message?.content
    const cleaned = cleanModelOutput(rawContent)
    const missingModel =
      !cleaned || cleaned === "No response generated."

    let responseText: string
    if (missingModel && isFirstIncidentTurn) {
      responseText = demoBrief
    } else if (missingModel) {
      responseText =
        guidanceIntent && anchorMatches.length
          ? formatWhatToDoNowBlock(anchorMatches)
          : "No response from model. Try again."
    } else if (isFirstIncidentTurn) {
      responseText = cleaned
    } else {
      responseText = ensureWhatToDoNowInReply(
        cleaned,
        latestUser,
        anchorMatches
      )
    }

    return NextResponse.json({
      response: responseText,
      memoryMatches: isFirstIncidentTurn
        ? recalledMatches.length
        : anchorMatches.length,
      recalledIncidents: isFirstIncidentTurn
        ? recalledMatches
        : anchorMatches,
    })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Chat request failed"
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}

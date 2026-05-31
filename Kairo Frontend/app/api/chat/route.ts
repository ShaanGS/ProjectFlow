import { NextRequest, NextResponse } from "next/server"
import { classifyChatIntent, conversationalResponse } from "@/lib/agent/intent"
import { kairoConfig } from "@/lib/config/env"
import groq from "@/lib/groq"
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

function field(value: unknown, fallback = "unknown") {
  if (typeof value === "string" && value.trim()) return value.trim()
  if (typeof value === "number") return String(value)
  return fallback
}

function confidenceLabel(similarity: unknown) {
  if (typeof similarity !== "number") return "weak"
  if (similarity >= 0.82) return "strong"
  if (similarity >= 0.58) return "moderate"
  return "weak"
}

function firstSentence(value: unknown, fallback: string) {
  const text = field(value, fallback)
  return text.split(/(?<=[.!?])\s+/)[0]?.trim() || fallback
}

function buildInitialIncidentBrief(
  currentIncident: ActiveIncidentContext,
  pastEpisodes: RetrievedMemoryIncident[]
) {
  const topMatch = pastEpisodes[0]
  const confidence = confidenceLabel(topMatch?.similarity)
  const matchTitle = field(topMatch?.title, "No prior incident title available")
  const matchVendor = field(topMatch?.vendor ?? currentIncident.vendor, "unknown vendor")
  const rootCause = firstSentence(
    topMatch?.root_cause,
    "The retrieved memory does not include a confirmed root cause."
  )
  const resolution = firstSentence(
    topMatch?.resolution,
    "The retrieved memory does not include a confirmed resolution."
  )
  const recommendedStep =
    resolution === "The retrieved memory does not include a confirmed resolution."
      ? "Confirm vendor impact and collect current error-rate evidence before mitigation."
      : resolution

  return [
    `I found a relevant prior incident for ${field(currentIncident.title, "this incident")}.`,
    `Match found: ${matchTitle} (${matchVendor}) — ${confidence}`,
    `Root cause: ${rootCause}`,
    `Resolution used: ${resolution}`,
    `Recommended next step: ${recommendedStep}`,
    `Ask me anything about this incident, or type 'draft postmortem' to generate a report.`,
  ].join("\n")
}

function streamStaticText(content: string) {
  const encoder = new TextEncoder()
  const words = content.split(/(\s+)/)

  return new Response(
    new ReadableStream({
      async start(controller) {
        for (const word of words) {
          controller.enqueue(encoder.encode(word))
          await new Promise((resolve) => setTimeout(resolve, 12))
        }
        controller.close()
      },
    }),
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Kairo-Stream": "true",
      },
    }
  )
}

function buildSystemPrompt(
  currentIncident: ActiveIncidentContext,
  pastEpisodes: RetrievedMemoryIncident[],
  mode?: string
) {
  const topMatch = pastEpisodes[0]
  const confidence = confidenceLabel(topMatch?.similarity)

  return `You are Kairo, an SRE incident intelligence assistant. You are helping an engineer handle an active incident in real time.

Active Incident:
- Title: ${field(currentIncident.title)}
- Vendor: ${field(currentIncident.vendor)}
- Severity: ${field(currentIncident.severity)}
- Region: ${field(currentIncident.region)}
- Description: ${field(currentIncident.description ?? currentIncident.customer_impact)}
- Customer Impact: ${field(currentIncident.customer_impact)}

Top Memory Match (most similar past incident):
- Title: ${field(topMatch?.title)}
- Root Cause: ${field(topMatch?.root_cause)}
- Resolution: ${field(topMatch?.resolution)}
- Similarity: ${field(topMatch?.similarity)}
- Confidence label: ${confidence}

Instructions:
- Answer only based on the context above
- Be concise, direct, and structured.
- If the user asks for the cause, explain the root cause from memory
- If the user asks what to do, give the resolution steps from memory
- If the user asks something outside this context, say "I don't have enough context for that in this incident"
- Never hallucinate actions or causes not present in the memory match
- Do not include chain-of-thought, hidden reasoning, or <think> blocks
- Do not use ALL CAPS section headers
- Do not show placeholders like "(from memory)"
- Do not show empty sections
- Do not use markdown bold markers inside structured content

Reply standard:
- Start with one direct sentence that answers the user.
- If a cause is available, write exactly:
Root cause: [plain sentence]
Confidence: [strong / moderate / weak] — matched against [incident title]
- If resolution steps are available, write:
Steps:
1. [plain sentence]
2. [plain sentence]
3. [plain sentence]
- End with one short follow-up line only when it naturally moves the incident forward. Do not mention postmortems unless the user asks for a report or the incident brief is ready for handoff.

${mode === "incident_brief"
  ? `Initial incident brief format:
1. A short opening sentence stating what Kairo found.
2. Match found: ${field(topMatch?.title)} (${field(topMatch?.vendor)}) — ${confidence}
3. Root cause: ${field(topMatch?.root_cause)}
4. Resolution used: ${field(topMatch?.resolution)}
5. Recommended next step: one clear action based only on the resolution above
6. Closing line: "Ask me anything about this incident, or type 'draft postmortem' to generate a report."
Do not add any other sections.`
  : ""}`
}

function groqMessages(systemPrompt: string, chatMessages: ChatTurn[]) {
  return [
    { role: "system" as const, content: systemPrompt },
    ...chatMessages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  ]
}

async function streamGroqResponse(systemPrompt: string, chatMessages: ChatTurn[]) {
  const completion = await groq.chat.completions.create({
    model: kairoConfig.groqModel,
    messages: groqMessages(systemPrompt, chatMessages),
    temperature: 0.2,
    max_completion_tokens: 700,
    stream: true,
  })

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      let buffer = ""
      let insideThinkBlock = false

      const filterHiddenReasoning = (input: string, flush = false) => {
        buffer += input
        let output = ""

        while (buffer.length) {
          if (insideThinkBlock) {
            const end = buffer.indexOf("</think>")
            if (end === -1) {
              buffer = buffer.slice(-7)
              return output
            }
            buffer = buffer.slice(end + "</think>".length)
            insideThinkBlock = false
            continue
          }

          const start = buffer.indexOf("<think>")
          if (start === -1) {
            if (flush) {
              output += buffer
              buffer = ""
              return output
            }
            const safeLength = Math.max(0, buffer.length - "<think>".length)
            output += buffer.slice(0, safeLength)
            buffer = buffer.slice(safeLength)
            return output
          }

          output += buffer.slice(0, start)
          buffer = buffer.slice(start + "<think>".length)
          insideThinkBlock = true
        }

        return output
      }

      try {
        for await (const chunk of completion) {
          const token = chunk.choices[0]?.delta?.content ?? ""
          const visibleToken = token ? filterHiddenReasoning(token) : ""
          if (visibleToken) controller.enqueue(encoder.encode(visibleToken))
        }
        const tail = filterHiddenReasoning("", true).trimStart()
        if (tail) {
          controller.enqueue(encoder.encode(tail))
        }
        controller.close()
      } catch (error) {
        controller.error(error)
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Kairo-Stream": "true",
    },
  })
}

function cleanAssistantText(content: string) {
  return content
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/\*\*/g, "")
    .replace(/\(from memory\)/gi, "")
    .replace(/\[(plain sentence|incident title|strong \/ moderate \/ weak|past incident title|vendor|confidence label|one clear action)\]/gi, "")
    .replace(/^\s*(Root cause|Confidence|Steps|Match found|Resolution used|Recommended next step):\s*$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

async function completeGroqResponse(systemPrompt: string, chatMessages: ChatTurn[]) {
  const completion = await groq.chat.completions.create({
    model: kairoConfig.groqModel,
    messages: groqMessages(systemPrompt, chatMessages),
    temperature: 0.2,
    max_completion_tokens: 700,
  })

  const content = completion.choices[0]?.message?.content ?? ""
  const visibleContent = cleanAssistantText(content)

  return visibleContent || "I don't have enough context for that in this incident"
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>
    const chatMessages = normalizeChatMessages(body)

    if (!chatMessages.length) {
      return NextResponse.json(
        { success: false, error: "Missing messages or message", code: "CHAT_INPUT_MISSING" },
        { status: 400 }
      )
    }

    const latestUserMessage =
      [...chatMessages].reverse().find((message) => message.role === "user")?.content ?? ""

    const hasActiveIncident = Boolean(
      body.currentIncident &&
        typeof body.currentIncident === "object" &&
        Object.keys(body.currentIncident as Record<string, unknown>).length > 0
    )
    const intent = classifyChatIntent({ message: latestUserMessage, hasActiveIncident })
    const retrievedMemory = normalizeMemoryMatches(body)

    if (intent === "greeting_or_smalltalk" || intent === "general_question") {
      return NextResponse.json({
        success: true,
        data: {
          response: conversationalResponse(intent, hasActiveIncident),
          analysis: null,
          memoryMatches: 0,
          recalledIncidents: [],
          intent,
          stages: [],
        },
      })
    }

    const activeIncident = activeIncidentFromBody(body, latestUserMessage)
    const mode = typeof body.mode === "string" ? body.mode : undefined

    if (mode === "incident_brief") {
      return streamStaticText(buildInitialIncidentBrief(activeIncident, retrievedMemory))
    }

    const systemPrompt = buildSystemPrompt(activeIncident, retrievedMemory, mode)

    if (body.stream === true) {
      return streamGroqResponse(systemPrompt, chatMessages)
    }

    const response = await completeGroqResponse(systemPrompt, chatMessages)

    return NextResponse.json({
      success: true,
      data: {
        response,
        analysis: null,
        memoryMatches: retrievedMemory.length,
        recalledIncidents: retrievedMemory,
        intent,
        stages: [
          {
            name: "input",
            status: "completed",
            summary: "Normalized active incident context.",
          },
          {
            name: "retrieval",
            status: retrievedMemory.length ? "completed" : "skipped",
            summary: retrievedMemory.length
              ? `Used ${retrievedMemory.length} memory match(es).`
              : "No memory matches were provided.",
          },
          {
            name: "reasoning",
            status: "completed",
            summary: "Generated a Groq-grounded response.",
          },
        ],
      },
    })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Chat request failed"
    return NextResponse.json(
      { success: false, error: errMsg, code: "CHAT_REQUEST_FAILED" },
      { status: 500 }
    )
  }
}

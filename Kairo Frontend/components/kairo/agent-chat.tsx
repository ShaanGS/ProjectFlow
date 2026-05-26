"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Video,
  Mail,
  Calendar,
  ChevronDown,
  Zap,
  ArrowUp,
  FileDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ApiIncident, LoadStatus, MemoryMatch } from "@/types/kairo"
import type { AgentReasoning } from "@/types/agent"

/** First assistant message that looks like the structured incident brief (LLM, demo, or channel update). */
function findIncidentBriefText(messages: Message[]): string | null {
  for (const m of messages) {
    if (m.role !== "assistant") continue
    const c = m.content
    if (/Kairo request failed/i.test(c)) continue
    const hasBoundary = /BOUNDARY|FAULT BOUNDARY/i.test(c)
    const hasBody =
      /RESOLUTION_STEPS|RESOLUTION RUNBOOK|ROOT_CAUSE|ROOT_CAUSE_MEMORY|DIAGNOSIS|LIKELY_CAUSE/i.test(c)
    const channelStyle =
      hasBoundary &&
      /OWNER:|ACTION:|STATUS:/i.test(c)
    const skipRunbook =
      /SKIP_FIRST/i.test(c) && /EXECUTE_NEXT/i.test(c)
    if ((hasBoundary && hasBody) || channelStyle || skipRunbook) return c
  }
  return null
}

function buildPostMortemMarkdown(briefBody: string) {
  const generated = new Date().toLocaleString(undefined, {
    dateStyle: "full",
    timeStyle: "short",
  })
  const header = `# KAIRO AUTOMATED POST-MORTEM REPORT
**Generated:** ${generated}
**Status:** Auto-Resolved via Hindsight Memory
**Confidentiality:** Internal Engineering Only
---

`
  return `${header}${briefBody.trim()}\n`
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  analysis?: AgentReasoning
}

const suggestionCards = [
  {
    icon: Video,
    text: "Is this our system or Razorpay?",
  },
  {
    icon: Mail,
    text: "What should I skip checking?",
  },
  {
    icon: Calendar,
    text: "Draft an incident channel update",
  },
]

interface AgentChatProps {
  activeIncident: ApiIncident | null
  injectedMessage: Message | null
  memoryMatches?: MemoryMatch[]
  agentAnalysis?: AgentReasoning | null
  reasoningStatus: LoadStatus
  threadKey: number
}

export function AgentChat({
  activeIncident,
  injectedMessage,
  memoryMatches = [],
  agentAnalysis,
  reasoningStatus,
  threadKey,
}: AgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setMessages([])
  }, [threadKey])

  useEffect(() => {
    if (!injectedMessage) return

    setMessages((previous) => {
      if (previous.some((message) => message.id === injectedMessage.id)) return previous
      return [...previous, injectedMessage]
    })
  }, [injectedMessage])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages])

  const incidentBriefForExport = useMemo(
    () => findIncidentBriefText(messages),
    [messages]
  )

  const handleExportPostMortem = useCallback(() => {
    if (!incidentBriefForExport) return
    const md = buildPostMortemMarkdown(incidentBriefForExport)
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
    const a = document.createElement("a")
    a.href = url
    a.download = `kairo-incident-report-${ts}.md`
    a.rel = "noopener"
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }, [incidentBriefForExport])

  const handleSend = async () => {
    if (!input.trim()) return
    const userInput = input
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userInput,
    }

    const nextMessages: Message[] = [...messages, userMessage]
    setMessages(nextMessages)
    setInput("")
    setIsSending(true)

    try {
      const historyPayload = nextMessages.map(({ role, content }) => ({
        role,
        content,
      }))

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyPayload,
          message: userInput,
          currentIncident: activeIncident,
          // Forward the retrieved memory matches so follow-up chats stay grounded
          past_episodes: memoryMatches.length > 0 ? memoryMatches : undefined,
        }),
      })
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "analysis failed")
      }
      const data = payload.data

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        analysis: data.analysis,
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const message = error instanceof Error ? error.message : "analysis failed"
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Kairo request failed: ${message}`,
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  const handleSuggestionClick = (text: string) => {
    setInput(text)
  }

  return (
    <div className="flex h-full flex-col bg-white font-sans antialiased">
      {/* Header */}
      <div className="border-b border-gray-100 bg-[#FAFAFA] px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <img src="/icon.svg" alt="Kairo Icon" className="h-8 w-8 shrink-0 object-contain" />
            <div className="min-w-0">
              <h3 className="text-[16px] font-bold leading-tight tracking-[-0.02em] text-gray-900">
                Kairo Agent
              </h3>
              <p className="text-[12px] text-gray-500">memory copilot</p>
            </div>
          </div>
          <div
            className="h-2 w-2 shrink-0 rounded-full bg-teal-600 shadow-[0_0_0_4px_rgba(13,148,136,0.12)]"
            aria-hidden
          />
        </div>
        {messages.length > 0 && (
          <div className="mt-4 flex justify-stretch sm:justify-end">
            <button
              type="button"
              onClick={handleExportPostMortem}
              disabled={!incidentBriefForExport}
              title={
                incidentBriefForExport
                  ? "Download post-mortem as Markdown"
                  : "Run an incident brief first (e.g. ask about boundary / resolution)"
              }
              className={cn(
                "group inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2.5 sm:w-auto sm:min-w-[10.5rem]",
                "text-[12px] font-semibold tracking-[-0.01em] text-gray-900 shadow-sm",
                "transition-all duration-200",
                "hover:border-teal-200 hover:bg-teal-50 hover:shadow-md",
                "active:scale-[0.99]",
                "disabled:pointer-events-none disabled:border-gray-100 disabled:bg-gray-50 disabled:text-gray-400 disabled:opacity-45 disabled:shadow-none"
              )}
            >
              <span className="text-[13px] leading-none" aria-hidden>
                📄
              </span>
              <span>Export Post-Mortem</span>
              <FileDown
                className="h-3.5 w-3.5 text-gray-400 transition-colors group-hover:text-teal-600 group-disabled:group-hover:text-gray-400"
                strokeWidth={2}
                aria-hidden
              />
            </button>
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4">
            {/* Empty State Icon */}
            <div className="mb-6">
              <img src="/kairo-logo.png" alt="Kairo" className="w-36 h-auto object-contain" />
            </div>

            <p className="mb-8 max-w-[220px] text-center text-[13px] text-gray-500">
              {reasoningStatus === "loading"
                ? "Analyzing retrieved incident memory..."
                : reasoningStatus === "error"
                  ? "analysis failed; simulate again or select another incident."
                  : "Query incident history, vendor patterns, and memory logs."}
            </p>

            {/* Metrics Row */}
            <div className="mb-8 flex items-center justify-center gap-1.5 text-[11px] text-[#6b7280]">
              <span>{memoryMatches.length} memories</span>
              <span>&middot;</span>
              <span>{activeIncident ? "active incident" : "idle"}</span>
              <span>&middot;</span>
              <span>{agentAnalysis?.referenced_memory_incidents.length ?? 0} refs</span>
            </div>

            <p className="mb-4 text-[12px] text-gray-500">Today&apos;s suggested prompts</p>

            {/* Suggestion Cards */}
            <div className="flex flex-col gap-3 w-full px-3">
              {suggestionCards.map((card, index) => {
                const Icon = card.icon
                return (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(card.text)}
                    className="flex items-start gap-3 rounded-lg border border-gray-100 bg-white p-4 text-left transition-all hover:bg-gray-50 hover:border-gray-200 hover:shadow-sm"
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" strokeWidth={1.5} />
                    <span className="text-[13px] text-gray-900 leading-snug">{card.text}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-6 py-5">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex flex-col",
                  message.role === "user" ? "items-end" : "items-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold text-teal-600">Kairo</span>
                    {(message.content.includes("MEMORY_REF") || message.analysis) && (
                      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                        Memory Active
                      </span>
                    )}
                  </div>
                )}
                {message.role === "assistant" && message.analysis && (
                  <StructuredReasoning analysis={message.analysis} />
                )}
                <div
                  className={cn(
                    "whitespace-pre-wrap px-4 py-3 text-[13px] leading-6 shadow-sm",
                    message.role === "user"
                      ? "max-w-[82%] rounded-[18px_18px_4px_18px] border border-gray-800 bg-gray-900 text-white"
                      : "w-full rounded-lg border border-gray-100 bg-white text-gray-900"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-100 bg-white p-4">
        {/* Model Selector */}
        <div className="mb-4 flex items-center">
          <button className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-900">
            <Zap className="h-3.5 w-3.5" />
            <span>Groq · qwen3</span>
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
        
        <div className="flex items-center gap-3 border border-[#e5e7eb] rounded-lg bg-gray-100 px-4 py-3 transition-all focus-within:border-gray-300 focus-within:bg-white">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Describe the incident or ask Kairo..."
            className="flex-1 bg-transparent text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={isSending}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-white transition-all duration-200 hover:bg-gray-800 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
          >
            <ArrowUp className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  )
}

function StructuredReasoning({ analysis }: { analysis: AgentReasoning }) {
  return (
    <div className="mb-2 w-full rounded-lg border border-teal-100 bg-teal-50/50 p-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-teal-700">
        Structured Reasoning
      </p>
      <p className="mt-2 text-[12px] font-semibold leading-5 text-gray-900">
        {analysis.diagnosis}
      </p>
      <p className="mt-2 text-[11px] leading-5 text-gray-600">
        Cause: {analysis.likely_cause}
      </p>
      {analysis.recommended_next_actions.length > 0 && (
        <div className="mt-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-gray-500">
            Next action
          </p>
          <p className="mt-1 text-[11px] leading-5 text-gray-700">
            {analysis.recommended_next_actions[0]}
          </p>
        </div>
      )}
      {analysis.referenced_memory_incidents.length > 0 && (
        <p className="mt-2 text-[10px] font-semibold text-teal-700">
          {analysis.referenced_memory_incidents.length} memory references cited
        </p>
      )}
    </div>
  )
}

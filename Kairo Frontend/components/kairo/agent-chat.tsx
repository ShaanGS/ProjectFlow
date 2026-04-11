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
import { KairoLogoMark } from "./vendor-logo"

/** First assistant message that looks like the structured incident brief (LLM, demo, or channel update). */
function findIncidentBriefText(messages: Message[]): string | null {
  for (const m of messages) {
    if (m.role !== "assistant") continue
    const c = m.content
    if (/Kairo request failed/i.test(c)) continue
    const hasBoundary = /BOUNDARY|FAULT BOUNDARY/i.test(c)
    const hasBody =
      /RESOLUTION_STEPS|RESOLUTION RUNBOOK|ROOT_CAUSE|ROOT_CAUSE_MEMORY/i.test(c)
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
  activeIncident: unknown
  injectedMessage: Message | null
}

export function AgentChat({ activeIncident, injectedMessage }: AgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)

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
    
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsSending(true)

    try {
      const historyPayload = [...messages, userMessage].map(({ role, content }) => ({
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
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to contact Kairo")
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to contact Kairo"
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
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border/70 px-5 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <KairoLogoMark className="h-9 w-9 shrink-0 rounded-full bg-[#0B0B0B] ring-black/10" />
            <div className="min-w-0">
              <h3 className="text-[16px] font-bold leading-tight tracking-[-0.02em] text-foreground">
                Kairo Agent
              </h3>
              <p className="text-[12px] text-muted-foreground">memory copilot</p>
            </div>
          </div>
          <div
            className="h-2 w-2 shrink-0 rounded-full bg-[#0D9488] shadow-[0_0_0_4px_rgba(13,148,136,0.12)]"
            aria-hidden
          />
        </div>
        {messages.length > 0 && (
          <div className="mt-3 flex justify-stretch sm:justify-end">
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
                "group inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-secondary/70 px-3 py-2.5 sm:w-auto sm:min-w-[10.5rem]",
                "text-[12px] font-semibold tracking-[-0.01em] text-foreground shadow-sm",
                "transition-all duration-200",
                "hover:border-[#0D9488]/40 hover:bg-[#0D9488]/[0.08] hover:shadow-md",
                "active:scale-[0.99]",
                "disabled:pointer-events-none disabled:border-border/80 disabled:bg-muted/40 disabled:text-muted-foreground disabled:opacity-45 disabled:shadow-none",
                "dark:bg-secondary/40 dark:hover:bg-[#0D9488]/15"
              )}
            >
              <span className="text-[13px] leading-none" aria-hidden>
                📄
              </span>
              <span>Export Post-Mortem</span>
              <FileDown
                className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-[#0D9488] group-disabled:group-hover:text-muted-foreground"
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
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0B0B0B] shadow-sm">
              <KairoLogoMark className="h-14 w-14 rounded-2xl bg-[#0B0B0B] ring-white/10" />
            </div>
            
            <h4 className="mb-2 text-lg font-semibold text-foreground">Kairo Agent</h4>
            <p className="mb-6 max-w-[220px] text-center text-[13px] text-muted-foreground">
              Query incident history, vendor patterns, and memory logs.
            </p>

            <p className="mb-3 text-[12px] text-muted-foreground">Today&apos;s suggested prompt</p>

            {/* Suggestion Cards */}
            <div className="flex flex-col gap-2 w-full px-2">
              {suggestionCards.map((card, index) => {
                const Icon = card.icon
                return (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(card.text)}
                    className="flex items-start gap-3 rounded-lg border border-border bg-background p-3 text-left transition-colors hover:bg-muted"
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                    <span className="text-[13px] text-foreground leading-snug">{card.text}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 px-5 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex flex-col",
                  message.role === "user" ? "items-end" : "items-start"
                )}
              >
                {message.role === "assistant" && (
                  <span className="mb-1 text-[11px] font-medium text-[#0D9488]">Kairo</span>
                )}
                <div
                  className={cn(
                    "whitespace-pre-wrap px-4 py-3 text-[13px] leading-6 shadow-sm",
                    message.role === "user"
                      ? "max-w-[82%] rounded-[18px_18px_4px_18px] bg-[#F0F0F0] text-foreground"
                      : "w-full rounded-[14px] border border-border bg-white text-foreground"
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
      <div className="border-t border-border p-4">
        {/* Model Selector */}
        <div className="mb-3 flex items-center">
          <button className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground">
            <Zap className="h-3.5 w-3.5" />
            <span>Groq · qwen3</span>
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="What's your agent going to help you with today?"
            className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={isSending}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowUp className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  )
}

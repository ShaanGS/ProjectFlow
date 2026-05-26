"use client"

import { ArrowUpRight, Brain, CheckCircle2, Network, Sparkles } from "lucide-react"
import type { AgentReasoning } from "@/types/agent"
import type { ApiIncident, LoadStatus, MemoryMatch } from "@/types/kairo"

interface RightPanelProps {
  activeIncident: ApiIncident | null
  memoryMatches: MemoryMatch[]
  memoryStatus: LoadStatus
  reasoningStatus: LoadStatus
  agentAnalysis: AgentReasoning | null
  onOpenConsole: () => void
}

export function RightPanel({
  activeIncident,
  memoryMatches,
  memoryStatus,
  reasoningStatus,
  agentAnalysis,
  onOpenConsole,
}: RightPanelProps) {
  const topMatch = memoryMatches[0]
  const topMatchTitle = topMatch?.title ?? topMatch?.metadata?.title
  const topMatchVendor = topMatch?.vendor ?? topMatch?.metadata?.vendor
  const suggestedAction =
    agentAnalysis?.recommended_next_actions?.[0] ??
    topMatch?.resolution ??
    topMatch?.metadata?.successful_fix

  return (
    <aside className="hidden h-full w-[320px] min-w-[320px] flex-col border-l border-gray-100 bg-[#FAFAFA] xl:flex">
      <div className="border-b border-gray-100 bg-white px-5 py-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
          Intelligence Rail
        </p>
        <h2 className="mt-1 text-[16px] font-bold tracking-[-0.02em] text-gray-950">
          Kairo overview
        </h2>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-4">
        <RailCard
          icon={Network}
          label="Memory summary"
          status={memoryStatus}
          title={
            activeIncident
              ? `${memoryMatches.length} historical ${memoryMatches.length === 1 ? "match" : "matches"}`
              : "No active incident"
          }
          body={
            memoryStatus === "loading"
              ? "Recalling similar vendor failures."
              : memoryStatus === "error"
                ? "Retrieval failed. Open the console to continue manually."
                : activeIncident
                  ? "Retrieved evidence is ready for analysis."
                  : "Simulate or select an incident to start recall."
          }
        />

        <RailCard
          icon={CheckCircle2}
          label="Top recalled match"
          status={topMatch ? "linked" : memoryStatus}
          title={topMatchTitle ?? "No match selected"}
          body={
            topMatch
              ? `${topMatchVendor ?? "Unknown vendor"} · ${
                  typeof topMatch.similarity === "number"
                    ? `${formatEvidenceStrength(topMatch.similarity)} evidence`
                    : "memory evidence"
                }`
              : "The best historical incident will appear here after retrieval."
          }
        />

        <RailCard
          icon={Brain}
          label="Likely cause preview"
          status={reasoningStatus}
          title={agentAnalysis?.likely_cause ?? "Awaiting Kairo analysis"}
          body={
            reasoningStatus === "loading"
              ? "Matching evidence and preparing an action plan."
              : reasoningStatus === "error"
                ? "Analysis failed. The incident workspace remains usable."
                : activeIncident
                  ? "Grounded in recalled incident memory."
                  : "No incident context is active."
          }
        />

        <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-teal-700" />
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500">
              Suggested action
            </p>
          </div>
          <p className="line-clamp-4 text-[13px] font-semibold leading-5 text-gray-950">
            {suggestedAction ?? "Open Kairo Console to inspect memory, ask follow-ups, or export a postmortem."}
          </p>
        </section>

        <button
          type="button"
          onClick={onOpenConsole}
          className="mt-auto flex w-full items-center justify-between rounded-xl bg-gray-950 px-4 py-3 text-left text-white shadow-sm transition-all hover:bg-gray-800"
        >
          <span>
            <span className="block text-[13px] font-bold">Open Kairo Console</span>
            <span className="mt-0.5 block text-[11px] font-medium text-white/60">
              Full report, memory graph, chat, export
            </span>
          </span>
          <ArrowUpRight className="h-4 w-4 shrink-0" />
        </button>
      </div>
    </aside>
  )
}

function formatEvidenceStrength(similarity: number) {
  if (similarity >= 0.82) return "strong"
  if (similarity >= 0.58) return "moderate"
  return "weak"
}

function RailCard({
  icon: Icon,
  label,
  status,
  title,
  body,
}: {
  icon: typeof Network
  label: string
  status: string
  title: string
  body: string
}) {
  return (
    <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-teal-700" />
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500">
            {label}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-bold text-gray-500">
          {status}
        </span>
      </div>
      <p className="line-clamp-2 text-[13px] font-bold leading-5 text-gray-950">{title}</p>
      <p className="mt-2 line-clamp-3 text-[12px] leading-5 text-gray-500">{body}</p>
    </section>
  )
}

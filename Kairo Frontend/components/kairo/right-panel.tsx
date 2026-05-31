"use client"

import { ArrowUpRight, Brain, CheckCircle2, Network, Sparkles } from "lucide-react"
import type { AgentReasoning } from "@/types/agent"
import type { ApiIncident, LoadStatus, MemoryMatch, SimulationStage } from "@/types/kairo"

interface RightPanelProps {
  activeIncident: ApiIncident | null
  memoryMatches: MemoryMatch[]
  memoryStatus: LoadStatus
  reasoningStatus: LoadStatus
  agentAnalysis: AgentReasoning | null
  simulationStage: SimulationStage
  onOpenConsole: () => void
}

export function RightPanel({
  activeIncident,
  memoryMatches,
  memoryStatus,
  reasoningStatus,
  agentAnalysis,
  simulationStage,
  onOpenConsole,
}: RightPanelProps) {
  const topMatch = memoryMatches[0]
  const topMatchTitle = topMatch?.title ?? topMatch?.metadata?.title
  const topMatchVendor = topMatch?.vendor ?? topMatch?.metadata?.vendor
  const suggestedAction =
    agentAnalysis?.recommended_next_actions?.[0] ??
    topMatch?.resolution ??
    topMatch?.metadata?.successful_fix
  const showMemorySummary = simulationStage === "memory" || simulationStage === "match" || simulationStage === "action"
  const showTopMatch = simulationStage === "match" || simulationStage === "action"
  const showAction = simulationStage === "action"

  return (
    <aside className="hidden h-full w-[300px] min-w-[300px] flex-col border-l border-gray-100 bg-[#FBFBFC] xl:flex">
      <div className="shrink-0 border-b border-gray-100 bg-white px-5 py-5">
        <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-gray-400">
          Intelligence Rail
        </p>
        <h2 className="mt-1 text-[19px] font-bold leading-tight tracking-tight text-gray-950">
          Kairo overview
        </h2>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-3">
          <RailCard
            icon={Network}
            label="Memory summary"
            status={memoryStatus}
            title={
              simulationStage === "processing"
                ? "Processing alert"
                : activeIncident && showMemorySummary
                ? `${memoryMatches.length} historical ${memoryMatches.length === 1 ? "match" : "matches"}`
                : "No active incident"
            }
            body={
              memoryStatus === "loading"
                ? "Recalling similar vendor failures."
                : memoryStatus === "error"
                  ? "Retrieval failed. Open the console to continue manually."
                  : activeIncident && showMemorySummary
                    ? "Retrieved evidence is ready for analysis."
                    : simulationStage === "processing"
                      ? "Normalizing the incoming incident before recall."
                      : activeIncident
                        ? "Incident captured. Memory recall is next."
                        : "Simulate or select an incident to start recall."
            }
            active={simulationStage === "processing" || showMemorySummary}
          />

          <RailCard
            icon={CheckCircle2}
            label="Top recalled match"
            status={topMatch ? "linked" : memoryStatus}
            title={showTopMatch ? topMatchTitle ?? "No match selected" : "Awaiting best match"}
            body={
              showTopMatch && topMatch
                ? `${topMatchVendor ?? "Unknown vendor"} · ${
                    typeof topMatch.similarity === "number"
                      ? `${formatEvidenceStrength(topMatch.similarity)} evidence`
                      : "memory evidence"
                  }`
                : "Kairo will surface the strongest memory after recall completes."
            }
            active={showTopMatch}
          />

          <RailCard
            icon={Brain}
            label="Likely cause preview"
            status={reasoningStatus}
            title={showAction ? agentAnalysis?.likely_cause ?? "Awaiting Kairo analysis" : "Analysis pending"}
            body={
              reasoningStatus === "loading"
                ? "Matching evidence and preparing an action plan."
                : reasoningStatus === "error"
                  ? "Analysis failed. The incident workspace remains usable."
                  : activeIncident && showAction
                    ? "Grounded in recalled incident memory."
                    : activeIncident
                      ? "Suggested cause appears after evidence is matched."
                      : "No incident context is active."
            }
            active={showAction}
          />

          <section className={[
            "kairo-hover-card rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-all duration-500",
            showAction ? "kairo-stage-in opacity-100" : "opacity-65",
          ].join(" ")}>
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-teal-700" />
              <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-gray-500">
                Suggested action
              </p>
            </div>
            <p className="line-clamp-4 text-[14px] font-semibold leading-6 text-gray-950">
              {showAction
                ? suggestedAction ?? "Open Kairo Console to inspect memory, ask follow-ups, or export a postmortem."
                : "Action plan appears after Kairo finishes evidence matching."}
            </p>
          </section>
        </div>
      </div>

      <div className="shrink-0 border-t border-gray-100 bg-white p-4">
        <button
          type="button"
          onClick={onOpenConsole}
          className="flex w-full items-center justify-between rounded-xl bg-gray-950 px-4 py-3 text-left text-white shadow-sm transition-all hover:bg-gray-800"
        >
          <span>
            <span className="block text-[14px] font-bold">Open Kairo Console</span>
            <span className="mt-1 block text-[12px] font-medium leading-5 text-white/60">
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
  active = true,
}: {
  icon: typeof Network
  label: string
  status: string
  title: string
  body: string
  active?: boolean
}) {
  return (
    <section className={[
      "kairo-hover-card rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-all duration-500",
      active ? "kairo-stage-in opacity-100" : "opacity-65",
    ].join(" ")}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-teal-700" />
          <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-gray-500">
            {label}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-gray-50 px-2.5 py-1 text-[11px] font-bold text-gray-500">
          {status}
        </span>
      </div>
      <p className="line-clamp-2 text-[14px] font-bold leading-6 text-gray-950">{title}</p>
      <p className="mt-2 line-clamp-3 text-[13px] leading-5 text-gray-500">{body}</p>
    </section>
  )
}

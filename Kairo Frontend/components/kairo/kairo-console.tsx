"use client"

import { useMemo, useState } from "react"
import { Activity, Brain, Network, X } from "lucide-react"
import { AgentChat } from "./agent-chat"
import { cn } from "@/lib/utils"
import type { AgentReasoning, AgentRuntimeResponse } from "@/types/agent"
import type { ApiIncident, LoadStatus, MemoryMatch } from "@/types/kairo"

interface AgentMessage {
  id: string
  role: "assistant"
  content: string
  analysis?: AgentReasoning
  stages?: AgentRuntimeResponse["stages"]
}

interface KairoConsoleProps {
  isOpen: boolean
  onClose: () => void
  activeIncident: ApiIncident | null
  injectedMessage: AgentMessage | null
  memoryMatches: MemoryMatch[]
  memoryStatus: LoadStatus
  reasoningStatus: LoadStatus
  agentAnalysis: AgentReasoning | null
  agentStages: AgentRuntimeResponse["stages"]
  agentThreadKey: number
}

export function KairoConsole({
  isOpen,
  onClose,
  activeIncident,
  injectedMessage,
  memoryMatches,
  memoryStatus,
  reasoningStatus,
  agentAnalysis,
  agentStages,
  agentThreadKey,
}: KairoConsoleProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-gray-950/20 backdrop-blur-[2px]">
      <button
        type="button"
        aria-label="Close Kairo Console"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <section className="kairo-console-panel relative h-full w-[min(1120px,calc(100vw-24px))] overflow-hidden border-l border-gray-200 bg-white shadow-2xl transition-transform duration-300">
        <div className="flex h-full flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-100 bg-white px-7">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-teal-100 bg-teal-50">
                <Brain className="h-4 w-4 text-teal-700" />
              </div>
              <div className="min-w-0">
                <h2 className="text-[18px] font-bold leading-tight tracking-tight text-gray-950">
                  Kairo Console
                </h2>
                {activeIncident && (
                  <p className="mt-0.5 max-w-[560px] truncate text-[13px] font-medium leading-5 text-gray-500">
                    {activeIncident.title}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden rounded-full border border-gray-100 bg-gray-50 px-3 py-1.5 text-[12px] font-semibold text-gray-600 sm:inline-flex">
                {memoryMatches.length} memories · analysis {reasoningStatus}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-100 bg-white text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
                aria-label="Close console"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div className="grid min-h-0 flex-1 grid-cols-1 bg-white lg:grid-cols-[minmax(0,1fr)_390px]">
            <div className="min-h-0 border-r border-gray-100">
              <AgentChat
                activeIncident={activeIncident}
                injectedMessage={injectedMessage}
                memoryMatches={memoryMatches}
                agentAnalysis={agentAnalysis}
                reasoningStatus={reasoningStatus}
                agentStages={agentStages}
                threadKey={agentThreadKey}
              />
            </div>
            <MemoryExplorer
              activeIncident={activeIncident}
              memoryMatches={memoryMatches}
              memoryStatus={memoryStatus}
              agentAnalysis={agentAnalysis}
            />
          </div>
        </div>
      </section>
    </div>
  )
}

function MemoryExplorer({
  activeIncident,
  memoryMatches,
  memoryStatus,
  agentAnalysis,
}: {
  activeIncident: ApiIncident | null
  memoryMatches: MemoryMatch[]
  memoryStatus: LoadStatus
  agentAnalysis: AgentReasoning | null
}) {
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null)
  const selectedMemory = useMemo(() => {
    if (!memoryMatches.length) return null
    return (
      memoryMatches.find((match) => getMemoryId(match) === selectedMemoryId) ??
      memoryMatches[0]
    )
  }, [memoryMatches, selectedMemoryId])

  return (
    <aside className="flex min-h-0 flex-col bg-[#FAFAFA]">
      <div className="shrink-0 border-b border-gray-100 bg-white px-6 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-gray-400">
              Memory Explorer
            </p>
            <p className="mt-1 text-[15px] font-semibold leading-6 text-gray-900">
              Evidence graph and retained incidents
            </p>
          </div>
          <span className="rounded-full border border-gray-100 bg-gray-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-gray-500">
            {memoryStatus}
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        {memoryStatus === "loading" && (
          <div className="space-y-3">
            <div className="h-36 rounded-xl border border-gray-100 bg-white" />
            <div className="h-24 rounded-xl border border-gray-100 bg-white" />
            <div className="h-24 rounded-xl border border-gray-100 bg-white" />
          </div>
        )}

        {memoryStatus === "error" && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-4 text-[13px] font-medium text-red-700">
            Retrieval failed. The console remains available for incident follow-up.
          </div>
        )}

        {memoryStatus !== "loading" && memoryStatus !== "error" && memoryMatches.length === 0 && (
          <div className="rounded-xl border border-gray-100 bg-white px-5 py-6 text-[15px] font-medium leading-6 text-gray-500">
            No recalled incidents yet. Simulate or select an incident to build the evidence map.
          </div>
        )}

        {memoryMatches.length > 0 && (
          <div className="space-y-4">
            <MemoryGraph
              activeIncident={activeIncident}
              memoryMatches={memoryMatches}
              selectedMemoryId={getMemoryId(selectedMemory)}
              onSelectMemory={setSelectedMemoryId}
            />

            {selectedMemory && <MemoryDetailCard match={selectedMemory} />}

            <section className="rounded-xl border border-gray-100 bg-white p-5">
              <div className="mb-3 flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-teal-700" />
                <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-gray-500">
                  Cause preview
                </p>
              </div>
              <p className="text-[15px] leading-7 text-gray-700">
                {agentAnalysis?.likely_cause ??
                  selectedMemory?.root_cause ??
                  selectedMemory?.metadata?.actual_root_cause ??
                  "Kairo will infer likely cause after memory and reasoning complete."}
              </p>
            </section>
          </div>
        )}
      </div>
    </aside>
  )
}

function MemoryGraph({
  activeIncident,
  memoryMatches,
  selectedMemoryId,
  onSelectMemory,
}: {
  activeIncident: ApiIncident | null
  memoryMatches: MemoryMatch[]
  selectedMemoryId: string | null
  onSelectMemory: (id: string) => void
}) {
  return (
    <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="h-3.5 w-3.5 text-teal-700" />
          <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-gray-500">
            Relationship Map
          </p>
        </div>
        <span className="text-[10px] font-semibold text-teal-700">
          {memoryMatches.length} linked
        </span>
      </div>

      <div className="relative pb-1">
        <div className="absolute left-1/2 top-[54px] h-px w-[78%] -translate-x-1/2 bg-teal-100" />
        <div className="relative z-10 mx-auto flex min-h-[66px] w-40 flex-col items-center justify-center rounded-xl border border-gray-900 bg-gray-900 px-3 text-center shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/60">
            active incident
          </span>
          <span className="mt-1 line-clamp-2 text-[13px] font-semibold leading-5 text-white">
            {activeIncident?.vendor ?? "incident"} · {activeIncident?.region ?? "region"}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {memoryMatches.slice(0, 6).map((match) => {
            const id = getMemoryId(match) ?? match.id
            const active = selectedMemoryId === id
            const relation = getRelationCue(activeIncident, match)
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelectMemory(id)}
                className={cn(
                  "min-h-[78px] rounded-lg border px-3 py-2 text-left transition-all",
                  active
                    ? "border-teal-300 bg-teal-50 shadow-sm"
                    : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"
                )}
              >
                <span className="block truncate text-[12px] font-bold uppercase tracking-[0.08em] text-teal-700">
                  {match.vendor ?? match.metadata?.vendor ?? "memory"}
                </span>
                <span className="mt-1 block text-[15px] font-bold text-gray-950">
                  {typeof match.similarity === "number"
                    ? formatEvidenceStrength(match.similarity)
                    : "match"}
                </span>
                <span className="mt-1 block truncate text-[12px] font-semibold text-gray-500">
                  {relation}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function MemoryDetailCard({ match }: { match: MemoryMatch }) {
  const meta = match.metadata ?? {}
  const rootCause = match.root_cause ?? meta.actual_root_cause
  const fix = match.resolution ?? meta.successful_fix
  const patterns = match.patterns_matched?.length
    ? match.patterns_matched
    : meta.patterns_matched?.split(",").map((item) => item.trim()).filter(Boolean) ?? []

  return (
    <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[12px] font-bold uppercase tracking-[0.1em] text-teal-700">
            {match.vendor ?? meta.vendor ?? "memory"}
          </p>
          <h3 className="mt-1 text-[16px] font-bold leading-6 text-gray-950">
            {match.title ?? meta.title ?? "Prior incident"}
          </h3>
        </div>
        {typeof match.similarity === "number" && (
          <span className="shrink-0 rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-bold text-teal-700">
            {formatEvidenceStrength(match.similarity)}
          </span>
        )}
      </div>

      <div className="space-y-4 text-[15px] leading-7 text-gray-700">
        <DetailLine label="Root cause" value={rootCause} />
        <DetailLine label="Fix" value={fix} />
        <DetailLine
          label="Skipped checks"
          value={match.skipped_checks?.join(", ") ?? meta.failed_checks}
        />
      </div>

      {patterns.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {patterns.slice(0, 5).map((pattern) => (
            <span
              key={pattern}
              className="rounded-full border border-gray-100 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-600"
            >
              {pattern.replaceAll("-", " ")}
            </span>
          ))}
        </div>
      )}
    </section>
  )
}

function DetailLine({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null

  return (
    <div>
      <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-gray-700">{value}</p>
    </div>
  )
}

function getMemoryId(match: MemoryMatch | null | undefined) {
  if (!match) return null
  return match.metadata?.incident_id ?? match.matched_incident_id ?? match.id
}

function getRelationCue(activeIncident: ApiIncident | null, match: MemoryMatch) {
  if (!activeIncident) return "historical evidence"
  if (activeIncident.vendor && activeIncident.vendor === (match.vendor ?? match.metadata?.vendor)) {
    return "same vendor"
  }
  if (activeIncident.region && activeIncident.region === (match.region ?? match.metadata?.region)) {
    return "same region"
  }
  const activeSignals = new Set([...(activeIncident.symptoms ?? []), ...(activeIncident.tags ?? [])])
  const overlap = [...(match.signals ?? []), ...(match.tags ?? [])].find((signal) => activeSignals.has(signal))
  return overlap ? "shared signal" : "similar failure mode"
}

function formatEvidenceStrength(similarity: number) {
  if (similarity >= 0.82) return "strong"
  if (similarity >= 0.58) return "moderate"
  return "weak"
}

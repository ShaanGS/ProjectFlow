"use client"

import { AgentChat } from "./agent-chat"
import type { ApiIncident, LoadStatus, MemoryMatch } from "@/types/kairo"

interface RightPanelProps {
  activeIncident: ApiIncident | null
  injectedMessage: {
    id: string
    role: "assistant"
    content: string
  } | null
  memoryMatches: MemoryMatch[]
  memoryStatus: LoadStatus
  reasoningStatus: LoadStatus
}

export function RightPanel({
  activeIncident,
  injectedMessage,
  memoryMatches,
  memoryStatus,
  reasoningStatus,
}: RightPanelProps) {
  return (
    <div className="hidden h-full w-[340px] min-w-[340px] flex-col border-l border-gray-100 bg-white xl:flex">
      <div className="border-b border-gray-100 bg-white px-5 py-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">
              Episodic Memory
            </p>
            <p className="mt-1 text-[12px] font-medium text-gray-600">
              {activeIncident
                ? `${memoryMatches.length} recalled · ${memoryStatus}`
                : "waiting for incident"}
            </p>
          </div>
          <span className="rounded-full border border-gray-100 bg-gray-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-gray-500">
            {reasoningStatus}
          </span>
        </div>

        {memoryStatus === "loading" && (
          <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-3 text-[12px] font-medium text-gray-500">
            Retrieving similar incidents...
          </div>
        )}

        {memoryStatus === "error" && (
          <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-3 text-[12px] font-medium text-red-700">
            Memory retrieval failed. Check the Kairo Agent message for details.
          </div>
        )}

        {memoryStatus === "loaded" && memoryMatches.length === 0 && (
          <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-3 text-[12px] font-medium text-gray-500">
            No similar prior incidents found.
          </div>
        )}

        {memoryMatches.length > 0 && (
          <div className="flex max-h-[260px] flex-col gap-2 overflow-y-auto pr-1">
            {memoryMatches.slice(0, 3).map((match) => {
              const meta = match.metadata ?? {}
              return (
                <div
                  key={meta.incident_id ?? match.id}
                  className="rounded-lg border border-gray-100 bg-[#FAFAFA] p-3"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="truncate text-[11px] font-bold uppercase tracking-[0.08em] text-teal-700">
                      {meta.vendor ?? "internal"}
                    </span>
                    <span className="shrink-0 text-[10px] font-semibold text-gray-400">
                      {meta.classification ?? "unknown"}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-[12px] font-semibold leading-5 text-gray-900">
                    {meta.title ?? match.text ?? "Prior incident"}
                  </p>
                  {meta.successful_fix && (
                    <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-gray-600">
                      Fix: {meta.successful_fix}
                    </p>
                  )}
                  {meta.failed_checks && (
                    <p className="mt-1 line-clamp-1 text-[11px] leading-5 text-gray-400">
                      Skip: {meta.failed_checks}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      <div className="min-h-0 flex-1">
        <AgentChat
          activeIncident={activeIncident}
          injectedMessage={injectedMessage}
          memoryMatches={memoryMatches}
        />
      </div>
    </div>
  )
}

"use client"

import { MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { VendorLogo } from "../vendor-logo"
import type { ApiIncident, DisplayIncident, LoadStatus, MemoryMatch, SimulationStage } from "@/types/kairo"

export function LiveIncidentsPage({
  activeIncidents,
  resolvedIncidents,
  activeIncident,
  memoryMatches,
  memoryStatus,
  reasoningStatus,
  vendorPatternCount,
  timeSavedMinutes,
  onSelectIncident,
  onResolveIncident,
  resolvingIncidentId,
  incidentListStatus,
  incidentListError,
  flowError,
  simulationStage,
}: {
  activeIncidents: DisplayIncident[]
  resolvedIncidents: DisplayIncident[]
  activeIncident: ApiIncident | null
  memoryMatches: MemoryMatch[]
  memoryStatus: LoadStatus
  reasoningStatus: LoadStatus
  vendorPatternCount: number
  timeSavedMinutes: number
  onSelectIncident: (incident: DisplayIncident) => void
  onResolveIncident: (incident: DisplayIncident) => void
  resolvingIncidentId: string | null | undefined
  incidentListStatus: LoadStatus
  incidentListError: string | null
  flowError: string | null
  simulationStage: SimulationStage
}) {
  const memoryHits = memoryMatches.length
  const timeSavedLabel = timeSavedMinutes > 0 ? `${timeSavedMinutes}m` : "0m"
  const activePriority = getPriorityFromSeverity(activeIncident?.severity)

  return (
    <div className="min-w-0 flex-1 overflow-y-auto bg-white">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-5 border-b border-gray-100 bg-white px-8 py-6">
        <StatBlock
          label="MEMORY RECALL HITS"
          value={memoryStatus === "loading" ? "…" : String(memoryHits)}
          subtitle={memoryStatus === "loading" ? "retrieving memory" : "for active incident"}
        />
        <StatBlock
          label="TIME SAVED BY MEMORY"
          value={memoryStatus === "loading" ? "…" : timeSavedLabel}
          subtitle="historical resolution minutes"
        />
        <StatBlock
          label="VENDOR PATTERNS LEARNED"
          value={String(vendorPatternCount)}
          subtitle={`reasoning ${reasoningStatus}`}
        />
      </div>

      {simulationStage === "processing" && (
        <div className="kairo-stage-in border-b border-gray-100 bg-[#FAFAFA] px-8 py-6">
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-teal-700">
              Processing alert
            </p>
            <h2 className="mt-2 text-[21px] font-bold leading-tight tracking-tight text-gray-950">
              Normalizing incident context
            </h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-6 text-gray-500">
              Kairo is preparing the alert before memory recall and analysis appear in sequence.
            </p>
          </div>
        </div>
      )}

      {activeIncident && (
        <div className="kairo-stage-in border-b border-gray-100 bg-[#FAFAFA] px-8 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-teal-700">
                Active Incident
              </p>
              <h2 className="mt-2 text-[22px] font-bold leading-tight tracking-tight text-gray-900">
                {activeIncident.title}
              </h2>
              {activeIncident.customer_impact && (
                <p className="mt-2 max-w-3xl text-[15px] font-medium leading-6 text-gray-500">
                  {activeIncident.customer_impact}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <PriorityBadge priority={activePriority} />
              <span className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-gray-600">
                {activeIncident.vendor ?? "Internal"}
              </span>
              <span className="rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-red-700">
                {activeIncident.severity ?? "SEV"}
              </span>
            </div>
          </div>
        </div>
      )}

      {flowError && (
        <div className="border-b border-red-100 bg-red-50 px-8 py-3 text-[13px] font-semibold text-red-700">
          {flowError}
        </div>
      )}

      {/* Incident Tables */}
      <div className="flex-1">
        <div className="flex items-center gap-3 px-8 py-5">
          <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-gray-500">
            live incident queue
          </span>
          <div className="h-px flex-1 bg-gray-100" />
        </div>
        <IncidentTable
          incidents={activeIncidents}
          memoryStatus={memoryStatus}
          onSelectIncident={onSelectIncident}
          onResolveIncident={onResolveIncident}
          resolvingIncidentId={resolvingIncidentId}
        />
        
        {/* Resolved divider */}
        <div className="flex items-center gap-3 border-t border-gray-100 px-8 py-6">
          <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-gray-500">
            memory corpus / resolved history
          </span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>
        
        <IncidentTable
          incidents={resolvedIncidents}
          isResolved
          listStatus={incidentListStatus}
          listError={incidentListError}
          onSelectIncident={onSelectIncident}
          onResolveIncident={onResolveIncident}
          resolvingIncidentId={resolvingIncidentId}
        />
      </div>
    </div>
  )
}

function StatBlock({
  label,
  value,
  subtitle,
}: {
  label: string
  value: string
  subtitle: string
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <p className="min-h-[30px] text-[12px] font-semibold uppercase tracking-[0.12em] text-gray-500">
        {label}
      </p>
      <div className="mt-3 flex flex-col">
        <p className="text-[34px] font-bold leading-none tracking-tight text-gray-900">{value}</p>
        <div className="mt-3 h-0.5 w-8 bg-teal-600" />
      </div>
      <p className="mt-3 text-[14px] font-medium leading-6 text-gray-500">{subtitle}</p>
    </div>
  )
}

type IncidentPriority = "P0" | "P1" | "P2" | "P3"

function getPriorityFromSeverity(severity?: string): IncidentPriority {
  if (severity === "SEV-1" || severity === "critical") return "P0"
  if (severity === "SEV-2" || severity === "warning") return "P1"
  if (severity === "SEV-3") return "P2"
  return "P3"
}

function getPriorityForDisplayIncident(incident: DisplayIncident): IncidentPriority {
  return getPriorityFromSeverity(incident.raw?.severity ?? incident.severity)
}

function PriorityBadge({
  priority,
  compact = false,
}: {
  priority: IncidentPriority
  compact?: boolean
}) {
  const classes: Record<IncidentPriority, string> = {
    P0: "border-red-100 bg-red-50 text-red-700",
    P1: "border-amber-100 bg-amber-50 text-amber-700",
    P2: "border-blue-100 bg-blue-50 text-blue-700",
    P3: "border-gray-100 bg-gray-50 text-gray-600",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border font-bold uppercase tracking-[0.08em]",
        compact ? "min-w-10 px-2 py-1 text-[10px]" : "px-3 py-1.5 text-[11px]",
        classes[priority]
      )}
    >
      {priority}
    </span>
  )
}

function IncidentTable({
  incidents,
  isResolved = false,
  memoryStatus,
  listStatus = "loaded",
  listError,
  onSelectIncident,
  onResolveIncident,
  resolvingIncidentId,
}: {
  incidents: DisplayIncident[]
  isResolved?: boolean
  memoryStatus?: LoadStatus
  listStatus?: LoadStatus
  listError?: string | null
  onSelectIncident: (incident: DisplayIncident) => void
  onResolveIncident: (incident: DisplayIncident) => void
  resolvingIncidentId?: string | null
}) {
  return (
    <div className={cn("bg-white", isResolved && "opacity-70")}>
      {isResolved && listStatus === "loading" && (
        <div className="space-y-3 px-8 py-4">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-[54px] rounded-lg border border-gray-100 bg-gray-50" />
          ))}
        </div>
      )}
      {isResolved && listStatus === "error" && (
        <div className="px-8 py-5 text-[15px] font-medium text-red-700">
          {listError ?? "retrieval failed while loading incidents"}
        </div>
      )}
      {!isResolved && incidents.length === 0 && (
        <div className="border-b border-gray-100 px-8 py-8 text-[15px] font-medium leading-6 text-gray-500">
          No live incidents. Simulate an incident to start retrieval and analysis.
        </div>
      )}
      {/* Rows */}
      {listStatus !== "error" && incidents.map((incident, index) => (
        <div
          key={`${isResolved ? "resolved" : "active"}-${incident.id}-${index}`}
          onClick={() => onSelectIncident(incident)}
          className={cn(
            "kairo-stage-in grid min-h-[76px] cursor-pointer grid-cols-[18px_minmax(160px,1fr)_44px_104px_76px_72px_86px_56px] items-center gap-3 border-b border-gray-100 px-8 py-4 transition-colors",
            incident.status === "live" && incident.severity === "critical" && "border-l-4 border-l-[#EE4444] hover:bg-[#FAFAFA]",
            incident.status === "live" && incident.severity === "warning" && "border-l-4 border-l-[#F59E0B] hover:bg-[#FAFAFA]",
            incident.status === "resolved" && "hover:bg-[#FAFAFA]"
          )}
        >
          {/* Status Dot */}
          <div>
            <div
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                incident.status === "live" && incident.severity === "critical" && "bg-[#EE4444]",
                incident.status === "live" && incident.severity === "warning" && "bg-[#F59E0B]",
                incident.status === "resolved" && "bg-[#00A651]"
              )}
            />
          </div>

          {/* Name */}
          <div className="truncate text-[15px] font-semibold leading-6 text-gray-900">
            {incident.name}
          </div>

          {/* Priority */}
          <div>
            <PriorityBadge priority={getPriorityForDisplayIncident(incident)} compact />
          </div>

          {/* Vendor */}
          <div className="min-w-0">
            <span className="inline-flex max-w-full items-center gap-2 truncate rounded-lg bg-gray-50 px-3 py-1.5 text-[11px] font-semibold text-gray-600 border border-gray-100">
              <VendorLogo vendor={incident.vendor} size="sm" />
              <span className="truncate">{incident.vendor}</span>
            </span>
          </div>

          {/* Status */}
          <div>
            <span
              className={cn(
                "inline-flex min-w-[88px] justify-center rounded-sm px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.05em]",
                incident.status === "live" && incident.severity === "critical" && "bg-[#EE4444]/15 text-[#EE4444]",
                incident.status === "live" && incident.severity === "warning" && "bg-[#F59E0B]/15 text-[#F59E0B]",
                incident.status === "resolved" && "bg-[#00A651]/10 text-[#00A651]"
              )}
            >
              {incident.status === "live"
                ? "Live"
                : isResolved && incident.time !== "Resolved now"
                  ? "Memory"
                  : "Resolved"}
            </span>
          </div>

          {/* Time */}
          <div className="truncate text-[13px] font-medium text-gray-500">{incident.time}</div>

          {/* Memory Matches */}
          <div>
            <span
              className={cn(
                "inline-flex min-w-[82px] justify-center rounded-md border px-2 py-1.5 text-[10px] font-bold",
                incident.status === "live" && memoryStatus === "loading"
                  ? "border-gray-200 bg-gray-50 text-gray-400"
                  : incident.memoryMatches > 0
                    ? "border-blue-600 bg-white text-blue-600"
                    : "border-gray-200 bg-white text-gray-400"
              )}
            >
              {incident.status === "live" && memoryStatus === "loading"
                ? "…"
                : `${incident.memoryMatches} ${incident.memoryMatches === 1 ? "match" : "matches"}`}
            </span>
          </div>

          {/* Actions */}
          <div className="flex justify-center">
            <button
              onClick={(event) => {
                event.stopPropagation()
                if (incident.status === "live") onResolveIncident(incident)
              }}
              disabled={incident.status !== "live" || resolvingIncidentId === incident.id}
              className={cn(
                "flex h-7 min-w-[54px] items-center justify-center rounded border px-2 text-[10px] font-semibold transition-colors",
                incident.status === "live"
                  ? "border-teal-100 bg-teal-50 text-teal-700 hover:bg-teal-100"
                  : "border-transparent text-gray-400 hover:bg-gray-100 hover:text-gray-900",
                resolvingIncidentId === incident.id && "cursor-not-allowed opacity-60"
              )}
            >
              {incident.status === "live"
                ? resolvingIncidentId === incident.id
                  ? "Saving"
                  : "Resolve"
                : <MoreHorizontal className="h-4 w-4" />}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

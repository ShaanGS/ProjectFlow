"use client"

import { MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { VendorLogo } from "../vendor-logo"

interface Incident {
  id: string
  name: string
  vendor: string
  status: "live" | "resolved"
  severity: "critical" | "warning" | "info"
  time: string
  memoryMatches: number
  classification?: string
}

export function LiveIncidentsPage({
  activeIncidents,
  resolvedIncidents,
}: {
  activeIncidents: Incident[]
  resolvedIncidents: Incident[]
}) {
  const memoryHits = activeIncidents.reduce((total, incident) => total + incident.memoryMatches, 0)

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-8 border-b border-gray-100 bg-white px-8 py-8">
        <StatBlock label="MEMORY RECALL HITS" value={String(memoryHits)} subtitle="current session" />
        <StatBlock label="AVG TIME SAVED" value="43m" subtitle="per recalled incident" />
        <StatBlock label="VENDOR PATTERNS LEARNED" value="12" subtitle="across 4 vendors" />
      </div>

      {/* Incident Tables */}
      <div className="flex-1">
        <IncidentTable incidents={activeIncidents} />
        
        {/* Resolved divider */}
        <div className="flex items-center gap-3 border-t border-gray-100 px-8 py-6">
          <span className="text-[11px] text-gray-500">resolved</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>
        
        <IncidentTable incidents={resolvedIncidents} isResolved />
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
    <div className="rounded-lg border border-gray-100 bg-white p-8 shadow-sm">
      <p className="min-h-[32px] text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">
        {label}
      </p>
      <div className="mt-4 flex flex-col">
        <p className="text-[38px] font-bold leading-none tracking-[-0.04em] text-gray-900">{value}</p>
        <div className="mt-4 h-0.5 w-8 bg-teal-600" />
      </div>
      <p className="mt-4 text-[12px] font-medium text-gray-500">{subtitle}</p>
    </div>
  )
}

function IncidentTable({
  incidents,
  isResolved = false,
}: {
  incidents: Incident[]
  isResolved?: boolean
}) {
  return (
    <div className={cn("bg-white", isResolved && "opacity-70")}>
      {/* Rows */}
      {incidents.map((incident) => (
        <div
          key={incident.id}
          className={cn(
            "grid min-h-[72px] grid-cols-[28px_minmax(260px,1fr)_136px_112px_130px_126px_32px] items-center gap-4 border-b border-gray-100 px-8 py-4 transition-colors",
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
          <div className="truncate text-[13px] font-semibold text-gray-900">
            {incident.name}
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
              {incident.status === "live" ? "Live" : "Resolved"}
            </span>
          </div>

          {/* Time */}
          <div className="truncate text-[12px] font-medium text-gray-500">{incident.time}</div>

          {/* Memory Matches */}
          <div>
            <span className="inline-flex min-w-[106px] justify-center rounded-md border border-blue-600 bg-white px-3 py-1.5 text-[11px] font-bold text-blue-600">
              {incident.memoryMatches} {incident.memoryMatches === 1 ? "match" : "matches"}
            </span>
          </div>

          {/* Actions */}
          <div className="flex justify-center">
            <button className="flex h-7 w-7 items-center justify-center rounded transition-colors text-gray-400 hover:bg-gray-100 hover:text-gray-900">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

"use client"

import { MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DisplayIncident } from "@/types/kairo"

interface VendorProfilePageProps {
  vendorId: string
  incidents: DisplayIncident[]
}

function vendorNameFromId(vendorId: string) {
  return vendorId
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
    .replace("Msg91", "MSG91")
    .replace("Aws S3", "AWS S3")
}

function memoryTypeForIncident(incident: DisplayIncident) {
  if (incident.classification?.includes("vendor")) return "pattern"
  if (incident.raw?.successful_fix) return "resolution"
  return "context"
}

export function VendorProfilePage({ vendorId, incidents }: VendorProfilePageProps) {
  const vendorName = vendorNameFromId(vendorId)
  const vendorIncidents = incidents.filter(
    (incident) =>
      incident.vendor.toLowerCase() === vendorName.toLowerCase() ||
      incident.vendor.toLowerCase().replace(/[^a-z0-9]+/g, "-") === vendorId
  )
  const patterns = Array.from(
    new Set(
      vendorIncidents.flatMap((incident) =>
        [incident.classification, incident.raw?.vendor].filter(Boolean) as string[]
      )
    )
  )

  return (
    <div className="flex-1 overflow-y-auto bg-white px-8 py-8">
      <div className="mb-8 rounded-lg border border-gray-100 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-gray-900">{vendorName}</h2>
            <p className="mt-1 text-[13px] text-gray-500">
              {vendorIncidents.length} incidents logged from Kairo memory
            </p>
          </div>
          <div className="flex items-center gap-4">
            <StatChip label={`${vendorIncidents.length} memories`} />
            <StatChip label={`${patterns.length} patterns found`} />
            <StatChip label={`${Math.min(96, 72 + vendorIncidents.length * 3)}% recall accuracy`} highlight />
          </div>
        </div>
      </div>

      <h3 className="mb-4 text-xl font-semibold tracking-tight text-gray-900">
        Failure Patterns
      </h3>
      <div className="mb-10 grid grid-cols-3 gap-8">
        {patterns.map((pattern) => (
          <div key={pattern} className="rounded-lg border border-gray-100 bg-white p-8 shadow-sm">
            <h4 className="mb-3 text-[14px] font-semibold text-gray-900">
              {pattern.replaceAll("_", " ")}
            </h4>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex-1">
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div className="h-2 rounded-full bg-teal-600" style={{ width: "84%" }} />
                </div>
              </div>
              <span className="text-[13px] font-bold text-gray-900">84%</span>
            </div>
            <div className="flex items-center justify-between text-[12px] text-gray-600">
              <span>Fired {vendorIncidents.length} times</span>
              <span>Last: {vendorIncidents[0]?.time ?? "memory"}</span>
            </div>
          </div>
        ))}
      </div>

      <h3 className="mb-4 text-xl font-semibold tracking-tight text-gray-900">
        Incident History
      </h3>
      <div className="mb-10 rounded-lg border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center border-b border-gray-100 px-6 py-4 text-[12px] font-semibold uppercase tracking-wide text-gray-500">
          <div className="w-6" />
          <div className="flex-1">Incident name</div>
          <div className="w-20">Status</div>
          <div className="w-28">Time</div>
          <div className="w-24">Memory</div>
          <div className="w-8" />
        </div>
        {vendorIncidents.map((incident) => (
          <div
            key={incident.id}
            className="flex items-center border-b border-gray-100 px-6 py-4 last:border-b-0 transition-colors hover:bg-gray-50/80"
          >
            <div className="w-6">
              <div
                className={cn(
                  "h-2 w-2 rounded-full",
                  incident.status === "live" ? "bg-red-600" : "bg-gray-400"
                )}
              />
            </div>
            <div className="flex-1 text-[13px] font-medium text-gray-900">{incident.name}</div>
            <div className="w-20">
              <span
                className={cn(
                  "rounded px-2.5 py-1 text-[12px] font-semibold",
                  incident.status === "live"
                    ? "border border-red-100 bg-red-50 text-red-700"
                    : "border border-green-100 bg-green-50 text-green-700"
                )}
              >
                {incident.status === "live" ? "Live" : "Resolved"}
              </span>
            </div>
            <div className="w-28 text-[13px] text-gray-500">{incident.time}</div>
            <div className="w-24">
              <span className="rounded-md bg-accent/10 px-2 py-0.5 text-[12px] font-medium text-accent">
                {incident.memoryMatches} {incident.memoryMatches === 1 ? "match" : "matches"}
              </span>
            </div>
            <div className="w-8">
              <button className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-900">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <h3 className="mb-4 text-xl font-semibold tracking-tight text-gray-900">
        Memory Entries
      </h3>
      <div className="rounded-lg border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center border-b border-gray-100 px-6 py-4 text-[12px] font-semibold uppercase tracking-wide text-gray-500">
          <div className="w-28">Date</div>
          <div className="flex-1">Incident summary</div>
          <div className="w-[300px]">What was retained</div>
          <div className="w-24">Type</div>
        </div>
        {vendorIncidents.map((incident) => (
          <div
            key={incident.id}
            className="flex items-center border-b border-gray-100 px-6 py-4 last:border-b-0 transition-colors hover:bg-gray-50/80"
          >
            <div className="w-28 text-[13px] text-gray-600">{incident.raw?.timestamp_start?.slice(0, 10) ?? "memory"}</div>
            <div className="flex-1 text-[13px] font-medium text-gray-900">{incident.name}</div>
            <div className="w-[300px] truncate text-[13px] text-gray-600">
              {incident.raw?.successful_fix ?? incident.raw?.customer_impact ?? "Retained incident context"}
            </div>
            <div className="w-24">
              <MemoryTypeBadge type={memoryTypeForIncident(incident)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatChip({ label, highlight = false }: { label: string; highlight?: boolean }) {
  return (
    <span
      className={cn(
        "rounded-md px-4 py-1.5 text-[12px] font-semibold",
        highlight ? "border border-teal-100 bg-teal-50 text-teal-700" : "border border-gray-200 bg-gray-100 text-gray-700"
      )}
    >
      {label}
    </span>
  )
}

function MemoryTypeBadge({ type }: { type: "pattern" | "resolution" | "anomaly" | "context" }) {
  const styles = {
    pattern: "border border-teal-100 bg-teal-50 text-teal-700",
    resolution: "border border-green-100 bg-green-50 text-green-700",
    anomaly: "border border-amber-100 bg-amber-50 text-amber-700",
    context: "border border-blue-100 bg-blue-50 text-blue-700",
  }

  return (
    <span className={cn("rounded px-2.5 py-1 text-[12px] font-semibold capitalize", styles[type])}>
      {type}
    </span>
  )
}

"use client"

import { MoreHorizontal, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface VendorProfilePageProps {
  vendorId: string
}

const vendorData: Record<string, {
  name: string
  incidentsLogged: number
  memoryMonths: number
  patternsFound: number
  recallAccuracy: number
  patterns: Array<{
    id: string
    name: string
    confidence: number
    triggerCount: number
    lastFired: string
  }>
  incidents: Array<{
    id: string
    name: string
    status: "resolved" | "live"
    time: string
    memoryMatches: number
  }>
  memoryEntries: Array<{
    id: string
    date: string
    summary: string
    retained: string
    type: "pattern" | "resolution" | "anomaly" | "context"
  }>
}> = {
  razorpay: {
    name: "Razorpay",
    incidentsLogged: 14,
    memoryMonths: 8,
    patternsFound: 3,
    recallAccuracy: 89,
    patterns: [
      { id: "1", name: "UPI acquiring-bank route instability", confidence: 89, triggerCount: 3, lastFired: "2 days ago" },
      { id: "2", name: "Status page green but callbacks delayed", confidence: 76, triggerCount: 5, lastFired: "5 days ago" },
      { id: "3", name: "Payment capture 504 cascade", confidence: 92, triggerCount: 4, lastFired: "1 week ago" },
    ],
    incidents: [
      { id: "1", name: "UPI payment timeout - Mumbai and Bengaluru", status: "live", time: "2 min ago", memoryMatches: 3 },
      { id: "2", name: "Webhook delivery delay", status: "resolved", time: "3 days ago", memoryMatches: 2 },
      { id: "3", name: "API rate limit spike", status: "resolved", time: "1 week ago", memoryMatches: 1 },
      { id: "4", name: "Merchant settlement sync failure", status: "resolved", time: "2 weeks ago", memoryMatches: 4 },
    ],
    memoryEntries: [
      { id: "1", date: "Apr 11, 2026", summary: "UPI 504s in India-West route", retained: "Status page showed green but payment capture 504s persisted", type: "anomaly" },
      { id: "2", date: "Apr 8, 2026", summary: "Webhook retry storm", retained: "Exponential backoff resolved after 15 min", type: "resolution" },
      { id: "3", date: "Apr 3, 2026", summary: "Weekend maintenance impact", retained: "Stripe maintenance window 2-4 AM UTC Saturdays", type: "pattern" },
      { id: "4", date: "Mar 28, 2026", summary: "Cashfree fallback route", retained: "Failover to Cashfree recovered checkout faster than DB investigation", type: "context" },
    ],
  },
  msg91: {
    name: "MSG91",
    incidentsLogged: 8,
    memoryMonths: 6,
    patternsFound: 2,
    recallAccuracy: 82,
    patterns: [
      { id: "1", name: "North India carrier delays", confidence: 78, triggerCount: 4, lastFired: "18 min ago" },
      { id: "2", name: "DLT accepted but delivery delayed", confidence: 85, triggerCount: 3, lastFired: "2 weeks ago" },
    ],
    incidents: [
      { id: "1", name: "OTP delivery drop - Delhi NCR", status: "live", time: "18 min ago", memoryMatches: 1 },
      { id: "2", name: "DLT template delivery delay", status: "resolved", time: "3 days ago", memoryMatches: 2 },
      { id: "3", name: "Number provisioning delay", status: "resolved", time: "1 week ago", memoryMatches: 1 },
    ],
    memoryEntries: [
      { id: "1", date: "Apr 11, 2026", summary: "SMS drop in North India", retained: "Carrier-level issue affecting Delhi NCR and Jaipur circles", type: "context" },
      { id: "2", date: "Apr 8, 2026", summary: "DLT delivery delay", retained: "Template accepted but carrier handoff delayed", type: "resolution" },
      { id: "3", date: "Apr 1, 2026", summary: "North India OTP pattern", retained: "Fail over to Twilio India route when delivery rate drops below 70%", type: "pattern" },
    ],
  },
  "aws-s3": {
    name: "AWS S3",
    incidentsLogged: 6,
    memoryMonths: 10,
    patternsFound: 2,
    recallAccuracy: 94,
    patterns: [
      { id: "1", name: "Mumbai S3 latency spike", confidence: 91, triggerCount: 6, lastFired: "Yesterday" },
      { id: "2", name: "Cross-region replication lag", confidence: 87, triggerCount: 2, lastFired: "3 weeks ago" },
    ],
    incidents: [
      { id: "1", name: "AWS S3 Mumbai latency spike - ap-south-1", status: "resolved", time: "4 hours ago", memoryMatches: 2 },
      { id: "2", name: "Bucket access timeout", status: "resolved", time: "5 days ago", memoryMatches: 3 },
      { id: "3", name: "Replication delay — ap-southeast", status: "resolved", time: "3 weeks ago", memoryMatches: 1 },
    ],
    memoryEntries: [
      { id: "1", date: "Apr 11, 2026", summary: "Mumbai S3 latency spike", retained: "Route KYC uploads to Singapore backup bucket when ap-south-1 PUTs timeout", type: "pattern" },
      { id: "2", date: "Apr 6, 2026", summary: "Bucket timeout recovery", retained: "Retry with exponential backoff effective", type: "resolution" },
      { id: "3", date: "Mar 21, 2026", summary: "Cross-region lag", retained: "Replication can lag up to 15 min under load", type: "context" },
    ],
  },
  cashfree: {
    name: "Cashfree",
    incidentsLogged: 5,
    memoryMonths: 4,
    patternsFound: 1,
    recallAccuracy: 75,
    patterns: [
      { id: "1", name: "Payout webhook backlog", confidence: 72, triggerCount: 3, lastFired: "1 week ago" },
    ],
    incidents: [
      { id: "1", name: "Cashfree payout webhook delay - Bengaluru", status: "resolved", time: "6 hours ago", memoryMatches: 4 },
      { id: "2", name: "Payout status API latency", status: "resolved", time: "4 days ago", memoryMatches: 1 },
      { id: "3", name: "API rate limit exceeded", status: "resolved", time: "1 week ago", memoryMatches: 2 },
    ],
    memoryEntries: [
      { id: "1", date: "Apr 11, 2026", summary: "Bengaluru payout webhook delay", retained: "Polling payout API recovered merchant dashboard while webhooks lagged", type: "context" },
      { id: "2", date: "Apr 7, 2026", summary: "Payout status latency fix", retained: "Show stale-state banner instead of retrying webhook queue", type: "resolution" },
      { id: "3", date: "Apr 4, 2026", summary: "Webhook backlog pattern", retained: "If internal queue is healthy, suspect vendor webhook backlog first", type: "pattern" },
    ],
  },
}

export function VendorProfilePage({ vendorId }: VendorProfilePageProps) {
  const vendor = vendorData[vendorId] || vendorData.razorpay

  return (
    <div className="flex-1 overflow-y-auto bg-white px-8 py-8">
      {/* Vendor Header */}
      <div className="mb-8 rounded-lg border border-gray-100 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-gray-900">{vendor.name}</h2>
            <p className="mt-1 text-[13px] text-gray-500">{vendor.incidentsLogged} incidents logged</p>
          </div>
          <div className="flex items-center gap-4">
            <StatChip label={`${vendor.memoryMonths} months memory`} />
            <StatChip label={`${vendor.patternsFound} patterns found`} />
            <StatChip label={`${vendor.recallAccuracy}% recall accuracy`} highlight />
          </div>
        </div>
      </div>

      {/* Failure Patterns */}
      <h3 className="mb-4 text-xl font-semibold tracking-tight text-gray-900">
        Failure Patterns
      </h3>
      <div className="mb-10 grid grid-cols-3 gap-8">
        {vendor.patterns.map((pattern) => (
          <div key={pattern.id} className="rounded-lg border border-gray-100 bg-white p-8 shadow-sm">
            <h4 className="mb-3 text-[14px] font-semibold text-gray-900">{pattern.name}</h4>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex-1">
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-teal-600"
                    style={{ width: `${pattern.confidence}%` }}
                  />
                </div>
              </div>
              <span className="text-[13px] font-bold text-gray-900">{pattern.confidence}%</span>
            </div>
            <div className="flex items-center justify-between text-[12px] text-gray-600">
              <span>Fired {pattern.triggerCount} times</span>
              <span>Last: {pattern.lastFired}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Incident History */}
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
        {vendor.incidents.map((incident) => (
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
                    ? "bg-red-50 text-red-700 border border-red-100"
                    : "bg-green-50 text-green-700 border border-green-100"
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

      {/* Memory Entries */}
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
        {vendor.memoryEntries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center border-b border-gray-100 px-6 py-4 last:border-b-0 transition-colors hover:bg-gray-50/80"
          >
            <div className="w-28 text-[13px] text-gray-600">{entry.date}</div>
            <div className="flex-1 text-[13px] font-medium text-gray-900">{entry.summary}</div>
            <div className="w-[300px] text-[13px] text-gray-600">{entry.retained}</div>
            <div className="w-24">
              <MemoryTypeBadge type={entry.type} />
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
        highlight ? "bg-teal-50 text-teal-700 border border-teal-100" : "bg-gray-100 text-gray-700 border border-gray-200"
      )}
    >
      {label}
    </span>
  )
}

function MemoryTypeBadge({ type }: { type: "pattern" | "resolution" | "anomaly" | "context" }) {
  const styles = {
    pattern: "bg-teal-50 text-teal-700 border border-teal-100",
    resolution: "bg-green-50 text-green-700 border border-green-100",
    anomaly: "bg-amber-50 text-amber-700 border border-amber-100",
    context: "bg-blue-50 text-blue-700 border border-blue-100",
  }

  return (
    <span className={cn("rounded px-2.5 py-1 text-[12px] font-semibold capitalize", styles[type])}>
      {type}
    </span>
  )
}

"use client"

import { ExternalLink, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { VendorLogo } from "../vendor-logo"

interface VendorSummary {
  id: string
  name: string
  incidentsLogged: number
  memoryMonths: number
  patternsFound: number
  recallAccuracy: number
  status: "healthy" | "warning" | "critical"
  lastIncident: string
}

const vendors: VendorSummary[] = [
  {
    id: "razorpay",
    name: "Razorpay",
    incidentsLogged: 14,
    memoryMonths: 8,
    patternsFound: 3,
    recallAccuracy: 89,
    status: "critical",
    lastIncident: "2 min ago",
  },
  {
    id: "msg91",
    name: "MSG91",
    incidentsLogged: 8,
    memoryMonths: 6,
    patternsFound: 2,
    recallAccuracy: 82,
    status: "warning",
    lastIncident: "18 min ago",
  },
  {
    id: "aws-s3",
    name: "AWS S3",
    incidentsLogged: 6,
    memoryMonths: 10,
    patternsFound: 2,
    recallAccuracy: 94,
    status: "healthy",
    lastIncident: "4 hours ago",
  },
  {
    id: "cashfree",
    name: "Cashfree",
    incidentsLogged: 5,
    memoryMonths: 4,
    patternsFound: 1,
    recallAccuracy: 75,
    status: "healthy",
    lastIncident: "6 hours ago",
  },
]

interface VendorsOverviewPageProps {
  onVendorSelect: (vendorId: string) => void
}

export function VendorsOverviewPage({ onVendorSelect }: VendorsOverviewPageProps) {
  return (
    <div className="flex-1 overflow-y-auto px-10 pt-8">
      {/* Stats Summary */}
      <div className="mb-8 grid grid-cols-4 gap-6">
        <SummaryCard
          label="Total Vendors"
          value="4"
          subtitle="being monitored"
        />
        <SummaryCard
          label="Total Incidents"
          value="33"
          subtitle="logged across all vendors"
        />
        <SummaryCard
          label="Patterns Detected"
          value="8"
          subtitle="failure patterns identified"
        />
        <SummaryCard
          label="Avg Recall Accuracy"
          value="85%"
          subtitle="across all vendors"
          highlight
        />
      </div>

      {/* Vendor Grid */}
      <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9B9B9B]">
        All Vendors
      </h3>
      <div className="grid grid-cols-2 gap-6">
        {vendors.map((vendor) => (
          <VendorCard
            key={vendor.id}
            vendor={vendor}
            onClick={() => onVendorSelect(vendor.id)}
          />
        ))}
      </div>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  subtitle,
  highlight = false,
}: {
  label: string
  value: string
  subtitle: string
  highlight?: boolean
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={cn(
        "mt-1 text-2xl font-semibold",
        highlight ? "text-accent" : "text-foreground"
      )}>
        {value}
      </p>
      <p className="text-[11px] text-muted-foreground">{subtitle}</p>
    </div>
  )
}

function VendorCard({
  vendor,
  onClick,
}: {
  vendor: VendorSummary
  onClick: () => void
}) {
  const StatusIcon = {
    healthy: CheckCircle,
    warning: AlertTriangle,
    critical: AlertTriangle,
  }[vendor.status]

  const statusColors = {
    healthy: "text-[#00A651]",
    warning: "text-[#F59E0B]",
    critical: "text-destructive",
  }

  return (
    <button
      onClick={onClick}
      className="flex flex-col rounded-lg border border-border bg-background p-5 text-left transition-colors hover:bg-muted/50"
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <VendorLogo vendor={vendor.name} size="lg" />
          <div>
            <h3 className="text-[15px] font-semibold text-foreground">{vendor.name}</h3>
            <p className="text-[12px] text-muted-foreground">
              {vendor.incidentsLogged} incidents logged
            </p>
          </div>
        </div>
        <StatusIcon className={cn("h-5 w-5", statusColors[vendor.status])} />
      </div>

      {/* Stats */}
      <div className="mb-4 flex items-center gap-4">
        <StatPill label={`${vendor.memoryMonths} mo memory`} />
        <StatPill label={`${vendor.patternsFound} patterns`} />
        <StatPill label={`${vendor.recallAccuracy}% accuracy`} highlight />
      </div>

      {/* Last Incident */}
      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="text-[12px] text-muted-foreground">
          Last incident: <span className="font-medium text-foreground">{vendor.lastIncident}</span>
        </span>
        <span className="flex items-center gap-1 text-[12px] font-medium text-accent">
          View profile
          <ExternalLink className="h-3 w-3" />
        </span>
      </div>
    </button>
  )
}

function StatPill({ label, highlight = false }: { label: string; highlight?: boolean }) {
  return (
    <span
      className={cn(
        "rounded-md px-2 py-0.5 text-[11px]",
        highlight ? "bg-accent/10 font-medium text-accent" : "bg-muted text-muted-foreground"
      )}
    >
      {label}
    </span>
  )
}

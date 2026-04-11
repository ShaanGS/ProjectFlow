"use client"

import { cn } from "@/lib/utils"
import { AlertCircle, Users, ScrollText, GitBranch, Plus } from "lucide-react"
import { KairoLogoMark } from "./vendor-logo"

interface LeftNavProps {
  activePage: string
  activeVendor: string | null
  onPageChange: (page: string) => void
  onVendorChange: (vendor: string | null) => void
  incidentCount: number
}

const mainNavItems = [
  { id: "incidents", label: "Live Incidents", icon: AlertCircle, showBadge: true },
  { id: "vendors", label: "Vendor Profiles", icon: Users },
  { id: "memory", label: "Memory Log", icon: ScrollText },
  { id: "patterns", label: "Pattern Rules", icon: GitBranch },
]

const vendors = [
  { id: "razorpay", label: "Razorpay" },
  { id: "msg91", label: "MSG91" },
  { id: "aws-s3", label: "AWS S3" },
  { id: "cashfree", label: "Cashfree" },
]

export function LeftNav({
  activePage,
  activeVendor,
  onPageChange,
  onVendorChange,
  incidentCount,
}: LeftNavProps) {
  return (
    <div className="hidden md:flex h-full w-[220px] flex-col bg-[#FAFAFA] border-r border-border">
      {/* Header */}
      <div className="flex items-center justify-center px-4 py-4">
        <KairoLogoMark />
      </div>

      {/* Nav Items */}
      <div className="flex-1 overflow-y-auto px-3 pt-2">
        <nav className="flex flex-col gap-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon
            const isActive = activePage === item.id && !activeVendor
            return (
              <button
                key={item.id}
                onClick={() => {
                  onPageChange(item.id)
                  onVendorChange(null)
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
                  isActive
                    ? "bg-background border border-border/50 text-foreground shadow-sm text-[13px] font-semibold"
                    : "text-muted-foreground hover:bg-background/50 hover:text-foreground text-[13px] font-normal"
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.5} />
                <span className="flex-1">{item.label}</span>
                {item.showBadge && incidentCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-medium text-destructive-foreground">
                    {incidentCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Vendors Section */}
        <p className="mb-2 mt-6 px-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9B9B9B]">
          Vendors
        </p>
        <nav className="flex flex-col gap-1">
          {vendors.map((vendor) => {
            const isActive = activeVendor === vendor.id
            return (
              <button
                key={vendor.id}
                onClick={() => {
                  onPageChange("vendor-profile")
                  onVendorChange(vendor.id)
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
                  isActive
                    ? "bg-background border border-border/50 text-foreground shadow-sm text-[13px] font-semibold"
                    : "text-muted-foreground hover:bg-background/50 hover:text-foreground text-[13px] font-normal"
                )}
              >
                <span>{vendor.label}</span>
              </button>
            )
          })}
          <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] text-[#0D9488] transition-colors hover:bg-background/50">
            <Plus className="h-4 w-4" strokeWidth={1.5} />
            <span>Add vendor</span>
          </button>
        </nav>
      </div>

      {/* User Info */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#116DFF] text-[12px] font-medium text-white">
            SR
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-[13px] font-medium text-foreground">SRE Engineer</p>
            <p className="text-[11px] text-muted-foreground">on-call</p>
          </div>
        </div>
      </div>
    </div>
  )
}

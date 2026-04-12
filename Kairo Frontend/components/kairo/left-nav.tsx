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
    <div className="hidden md:flex h-full w-[220px] flex-col border-r border-gray-200 bg-[#F9FAFB]">
      {/* Header */}
      <div className="flex items-center border-b border-gray-200 px-5 py-5">
        <KairoLogoMark className="min-w-0 origin-left scale-90" />
      </div>

      {/* Nav Items */}
      <div className="flex-1 overflow-y-auto px-3 pt-3">
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
                  "group flex w-full items-center gap-3 rounded-[8px] px-3 py-2 text-left transition-all duration-200",
                  isActive
                    ? "bg-gray-900 text-[13px] font-medium text-white shadow-md shadow-gray-900/10"
                    : "text-[13px] font-medium text-gray-500 hover:bg-gray-200/50 hover:text-gray-900"
                )}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] transition-colors",
                    isActive ? "text-white" : "text-gray-400 group-hover:text-gray-700"
                  )}
                  strokeWidth={isActive ? 2 : 1.5}
                />
                <span className="flex-1">{item.label}</span>
                {item.showBadge && incidentCount > 0 && (
                  <span className={cn(
                    "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold tracking-wide",
                    isActive ? "bg-white/20 text-white" : "bg-red-100 text-red-600"
                  )}>
                    {incidentCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Vendors Section */}
        <p className="mb-2 mt-6 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
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
                  "flex w-full items-center gap-3 rounded-[8px] px-4 py-2 text-left transition-all duration-200",
                  isActive
                    ? "bg-gray-900 text-[13px] font-medium text-white shadow-md shadow-gray-900/10"
                    : "text-[13px] font-medium text-gray-500 hover:bg-gray-200/50 hover:text-gray-900"
                )}
              >
                <span>{vendor.label}</span>
              </button>
            )
          })}
          <button className="group mt-1 flex w-full items-center gap-3 rounded-[8px] px-4 py-2 text-left text-[13px] font-medium text-gray-500 transition-all duration-200 hover:bg-gray-200/50 hover:text-gray-900">
            <Plus className="h-[18px] w-[18px] text-gray-400 transition-colors group-hover:text-gray-700" strokeWidth={1.5} />
            <span>Add vendor</span>
          </button>
        </nav>
      </div>

      {/* User Info */}
      <div className="mt-auto border-t border-gray-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[12px] font-bold tracking-wide text-white shadow-sm">
            SR
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-[13px] font-bold text-gray-900">SRE Engineer</p>
            <p className="text-[11px] font-medium text-gray-500">on-call</p>
          </div>
        </div>
      </div>
    </div>
  )
}

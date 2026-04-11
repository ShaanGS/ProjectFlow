"use client"

import { useState } from "react"
import { Search, ChevronDown, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

interface MemoryEntry {
  id: string
  timestamp: string
  vendor: string
  incident: string
  type: "pattern" | "resolution" | "anomaly" | "context"
  retained: string
}

const memoryEntries: MemoryEntry[] = [
  {
    id: "1",
    timestamp: "Apr 11, 2026 09:42",
    vendor: "Stripe",
    incident: "Payment gateway timeout — EU-West",
    type: "anomaly",
    retained: "Status page green but 504s persisted for 12 min",
  },
  {
    id: "2",
    timestamp: "Apr 11, 2026 09:18",
    vendor: "Twilio",
    incident: "SMS delivery drop — Southeast Asia",
    type: "context",
    retained: "Carrier-level issue affecting multiple APAC providers",
  },
  {
    id: "3",
    timestamp: "Apr 11, 2026 05:23",
    vendor: "AWS S3",
    incident: "Latency spike — us-east-1",
    type: "pattern",
    retained: "Morning spike 9-11 AM EST, auto-resolves",
  },
  {
    id: "4",
    timestamp: "Apr 10, 2026 18:45",
    vendor: "SendGrid",
    incident: "Email delivery delay — North America",
    type: "resolution",
    retained: "ISP throttling resolved by staggering sends",
  },
  {
    id: "5",
    timestamp: "Apr 10, 2026 14:12",
    vendor: "Stripe",
    incident: "Webhook retry storm",
    type: "resolution",
    retained: "Exponential backoff with 15 min recovery",
  },
  {
    id: "6",
    timestamp: "Apr 9, 2026 22:33",
    vendor: "Twilio",
    incident: "Voice API latency spike",
    type: "pattern",
    retained: "Cold start latency common after idle periods",
  },
  {
    id: "7",
    timestamp: "Apr 8, 2026 11:05",
    vendor: "AWS S3",
    incident: "Bucket access timeout",
    type: "resolution",
    retained: "Retry with exponential backoff effective",
  },
  {
    id: "8",
    timestamp: "Apr 7, 2026 16:28",
    vendor: "SendGrid",
    incident: "Template rendering timeout",
    type: "resolution",
    retained: "Template simplification reduced render by 60%",
  },
  {
    id: "9",
    timestamp: "Apr 6, 2026 08:15",
    vendor: "Stripe",
    incident: "API rate limit spike",
    type: "context",
    retained: "High traffic during flash sale exceeded limits",
  },
  {
    id: "10",
    timestamp: "Apr 5, 2026 20:42",
    vendor: "Twilio",
    incident: "Number provisioning delay",
    type: "anomaly",
    retained: "Regulatory approval backlog in EU region",
  },
]

const vendors = ["All vendors", "Stripe", "Twilio", "AWS S3", "SendGrid"]
const types = ["All types", "pattern", "resolution", "anomaly", "context"]

export function MemoryLogPage() {
  const [selectedVendor, setSelectedVendor] = useState("All vendors")
  const [selectedType, setSelectedType] = useState("All types")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredEntries = memoryEntries.filter((entry) => {
    const matchesVendor = selectedVendor === "All vendors" || entry.vendor === selectedVendor
    const matchesType = selectedType === "All types" || entry.type === selectedType
    const matchesSearch =
      searchQuery === "" ||
      entry.incident.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.retained.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesVendor && matchesType && matchesSearch
  })

  return (
    <div className="flex-1 overflow-y-auto px-10 pt-8">
      {/* Filter Bar */}
      <div className="mb-6 flex items-center gap-4">
        <FilterDropdown
          value={selectedVendor}
          options={vendors}
          onChange={setSelectedVendor}
        />
        <FilterDropdown
          value={selectedType}
          options={types}
          onChange={setSelectedType}
        />
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memory entries..."
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      {/* Memory Table */}
      <div className="rounded-lg border border-border">
        <div className="flex items-center border-b border-border px-4 py-2 text-[13px] text-muted-foreground">
          <div className="w-36">Timestamp</div>
          <div className="w-24">Vendor</div>
          <div className="flex-1">Incident</div>
          <div className="w-24">Type</div>
          <div className="w-[280px]">Retained content</div>
          <div className="w-8" />
        </div>

        {filteredEntries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center border-b border-border px-4 py-3 last:border-b-0 hover:bg-muted/50"
          >
            <div className="w-36 text-[13px] text-muted-foreground">{entry.timestamp}</div>
            <div className="w-24">
              <span className="rounded-md bg-muted px-2 py-0.5 text-[12px] text-muted-foreground">
                {entry.vendor}
              </span>
            </div>
            <div className="flex-1 text-[13px] font-medium text-foreground">{entry.incident}</div>
            <div className="w-24">
              <MemoryTypeBadge type={entry.type} />
            </div>
            <div className="w-[280px] text-[13px] text-muted-foreground truncate" title={entry.retained}>
              {entry.retained}
            </div>
            <div className="w-8">
              <button className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {filteredEntries.length === 0 && (
          <div className="flex items-center justify-center py-12 text-[13px] text-muted-foreground">
            No memory entries found matching your filters.
          </div>
        )}
      </div>
    </div>
  )
}

function FilterDropdown({
  value,
  options,
  onChange,
}: {
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-lg border border-border bg-background py-2 pl-3 pr-8 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
    </div>
  )
}

function MemoryTypeBadge({ type }: { type: "pattern" | "resolution" | "anomaly" | "context" }) {
  const styles = {
    pattern: "bg-[#0D9488]/10 text-[#0D9488]",
    resolution: "bg-[#00A651]/10 text-[#00A651]",
    anomaly: "bg-[#F59E0B]/10 text-[#F59E0B]",
    context: "bg-accent/10 text-accent",
  }

  return (
    <span className={cn("rounded px-2 py-0.5 text-[12px] font-medium capitalize", styles[type])}>
      {type}
    </span>
  )
}

"use client"

import { ExternalLink } from "lucide-react"

interface Pattern {
  id: string
  name: string
  vendor: string
  confidence: number
  triggerCount: number
  lastFired: string
  condition: string
}

const patterns: Pattern[] = [
  {
    id: "1",
    name: "Stripe EU-West silent degradation",
    vendor: "Stripe",
    confidence: 89,
    triggerCount: 3,
    lastFired: "2 days ago",
    condition: "Stripe + 504 + EU-West + status:green → silent outage 89% of the time",
  },
  {
    id: "2",
    name: "Stripe weekend maintenance window",
    vendor: "Stripe",
    confidence: 76,
    triggerCount: 5,
    lastFired: "5 days ago",
    condition: "Stripe + latency spike + Saturday 2-4 AM UTC → scheduled maintenance",
  },
  {
    id: "3",
    name: "Stripe 504 timeout cascade",
    vendor: "Stripe",
    confidence: 92,
    triggerCount: 4,
    lastFired: "1 week ago",
    condition: "Stripe + 504 + multiple regions + 5 min duration → cascade event",
  },
  {
    id: "4",
    name: "Twilio APAC carrier delays",
    vendor: "Twilio",
    confidence: 78,
    triggerCount: 4,
    lastFired: "18 min ago",
    condition: "Twilio + SMS + APAC + delivery rate <80% → carrier-level issue",
  },
  {
    id: "5",
    name: "Twilio Voice API cold start",
    vendor: "Twilio",
    confidence: 85,
    triggerCount: 3,
    lastFired: "2 weeks ago",
    condition: "Twilio + Voice + latency >2s + idle >1h → cold start warmup needed",
  },
  {
    id: "6",
    name: "AWS S3 us-east-1 morning spike",
    vendor: "AWS S3",
    confidence: 91,
    triggerCount: 6,
    lastFired: "Yesterday",
    condition: "AWS S3 + us-east-1 + 9-11 AM EST + latency spike → normal pattern, auto-resolves",
  },
  {
    id: "7",
    name: "AWS S3 cross-region replication lag",
    vendor: "AWS S3",
    confidence: 87,
    triggerCount: 2,
    lastFired: "3 weeks ago",
    condition: "AWS S3 + cross-region + replication delay >10 min → high load period",
  },
  {
    id: "8",
    name: "SendGrid bulk send throttling",
    vendor: "SendGrid",
    confidence: 72,
    triggerCount: 3,
    lastFired: "1 week ago",
    condition: "SendGrid + bulk email + delivery delay + ISP blocks → stagger sends",
  },
]

export function PatternRulesPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-white px-8 pb-8 pt-8">
      <div className="grid grid-cols-2 gap-8">
        {patterns.map((pattern) => (
          <PatternCard key={pattern.id} pattern={pattern} />
        ))}
      </div>
    </div>
  )
}

function PatternCard({ pattern }: { pattern: Pattern }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-8 shadow-sm">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="text-[14px] font-semibold text-gray-900">{pattern.name}</h3>
          <span className="text-[12px] text-gray-500">{pattern.vendor}</span>
        </div>
      </div>

      {/* Confidence Score */}
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[12px] text-gray-500">Confidence</span>
          <span className="text-[24px] font-bold text-gray-900">{pattern.confidence}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-100">
          <div
            className="h-2 rounded-full bg-gray-900 transition-all"
            style={{ width: `${pattern.confidence}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 flex items-center justify-between text-[12px]">
        <span className="text-gray-500">
          Fired <span className="font-medium text-gray-900">{pattern.triggerCount}</span> times
        </span>
        <span className="text-gray-500">
          Last: <span className="font-medium text-gray-900">{pattern.lastFired}</span>
        </span>
      </div>

      {/* Condition */}
      <div className="mb-4 rounded-lg border border-gray-100 bg-gray-50/80 p-4">
        <p className="font-mono text-[11px] text-gray-600">{pattern.condition}</p>
      </div>

      {/* Action */}
      <button className="flex items-center gap-1 text-[12px] font-medium text-gray-900 hover:underline">
        View incidents
        <ExternalLink className="h-3 w-3" />
      </button>
    </div>
  )
}

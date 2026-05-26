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

export function PatternRulesPage({ patterns }: { patterns: Pattern[] }) {
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

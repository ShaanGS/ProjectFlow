"use client"

import { useEffect, useState } from "react"
import { LeftNav } from "./left-nav"
import { RightPanel } from "./right-panel"
import { LiveIncidentsPage } from "./pages/live-incidents"
import { VendorProfilePage } from "./pages/vendor-profile"
import { VendorsOverviewPage } from "./pages/vendors-overview"
import { MemoryLogPage } from "./pages/memory-log"
import { PatternRulesPage } from "./pages/pattern-rules"
import { Plus } from "lucide-react"
import type { ApiIncident, DisplayIncident, LoadStatus, MemoryMatch } from "@/types/kairo"

interface AgentMessage {
  id: string
  role: "assistant"
  content: string
}

function mapSeverity(severity: string): DisplayIncident["severity"] {
  if (severity === "SEV-1") return "critical"
  if (severity === "SEV-2") return "warning"
  return "info"
}

function mapResolvedIncident(incident: ApiIncident): DisplayIncident {
  return {
    id: incident.incident_id,
    name: incident.title,
    vendor: incident.vendor ?? "Internal",
    status: "resolved",
    severity: "info",
    time: `Resolved in ${incident.time_to_resolution_minutes ?? 0}m`,
    memoryMatches: 0,
    classification: incident.classification,
    raw: incident,
  }
}

export function DashboardShell() {
  const [activePage, setActivePage] = useState("incidents")
  const [activeVendor, setActiveVendor] = useState<string | null>(null)
  const [activeIncidents, setActiveIncidents] = useState<DisplayIncident[]>([])
  const [resolvedIncidents, setResolvedIncidents] = useState<DisplayIncident[]>([])
  const [activeIncident, setActiveIncident] = useState<ApiIncident | null>(null)
  const [simulationCounter, setSimulationCounter] = useState(0)
  const [isSimulating, setIsSimulating] = useState(false)
  const [agentMessage, setAgentMessage] = useState<AgentMessage | null>(null)
  const [memoryMatches, setMemoryMatches] = useState<MemoryMatch[]>([])
  const [memoryStatus, setMemoryStatus] = useState<LoadStatus>("idle")
  const [reasoningStatus, setReasoningStatus] = useState<LoadStatus>("idle")

  useEffect(() => {
    fetch("/api/incidents")
      .then((response) => response.json())
      .then((data) => {
        setResolvedIncidents((data.incidents ?? []).map(mapResolvedIncident))
      })
      .catch(console.error)
  }, [])

  const getPageTitle = () => {
    if (activeVendor) {
      const vendorNames: Record<string, string> = {
        razorpay: "Razorpay",
        msg91: "MSG91",
        "aws-s3": "AWS S3",
        cashfree: "Cashfree",
      }
      return vendorNames[activeVendor] || "Vendor Profile"
    }
    
    const titles: Record<string, string> = {
      incidents: "Live Incidents",
      vendors: "Vendor Profiles",
      memory: "Memory Log",
      patterns: "Pattern Rules",
    }
    return titles[activePage] || "Dashboard"
  }

  const handleVendorSelect = (vendorId: string) => {
    setActiveVendor(vendorId)
    setActivePage("vendor-profile")
  }

  const renderPage = () => {
    if (activeVendor) {
      return <VendorProfilePage vendorId={activeVendor} />
    }

    const vendorPatternCount = new Set(
      [...activeIncidents, ...resolvedIncidents]
        .map((incident) => incident.vendor)
        .filter(Boolean)
    ).size

    const recalledMinutes = memoryMatches.reduce((total, match) => {
      const value = Number(match.metadata?.time_to_resolution_minutes ?? 0)
      return Number.isFinite(value) ? total + value : total
    }, 0)
    
    switch (activePage) {
      case "incidents":
        return (
          <LiveIncidentsPage
            activeIncidents={activeIncidents}
            resolvedIncidents={resolvedIncidents}
            activeIncident={activeIncident}
            memoryMatches={memoryMatches}
            memoryStatus={memoryStatus}
            reasoningStatus={reasoningStatus}
            vendorPatternCount={vendorPatternCount}
            timeSavedMinutes={recalledMinutes}
          />
        )
      case "vendors":
        return <VendorsOverviewPage onVendorSelect={handleVendorSelect} />
      case "memory":
        return <MemoryLogPage />
      case "patterns":
        return <PatternRulesPage />
      default:
        return (
          <LiveIncidentsPage
            activeIncidents={activeIncidents}
            resolvedIncidents={resolvedIncidents}
            activeIncident={activeIncident}
            memoryMatches={memoryMatches}
            memoryStatus={memoryStatus}
            reasoningStatus={reasoningStatus}
            vendorPatternCount={vendorPatternCount}
            timeSavedMinutes={recalledMinutes}
          />
        )
    }
  }

  const handleSimulateIncident = async () => {
    if (isSimulating) return

    setIsSimulating(true)
    setActivePage("incidents")
    setActiveVendor(null)
    setMemoryStatus("loading")
    setReasoningStatus("loading")
    setMemoryMatches([])

    try {
      const response = await fetch("/api/alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index: simulationCounter }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to simulate incident")
      }

      const incident = data.incident as ApiIncident
      const incidentDescription = [
        incident.vendor ?? "internal",
        incident.region,
        incident.title,
        ...(incident.symptoms ?? []),
        incident.customer_impact,
      ]
        .filter(Boolean)
        .join(" ")

      setActiveIncident(incident)

      // Use the matches already recalled by /api/alert — no second round-trip needed
      const matches = (data.recalledIncidents ?? []) as MemoryMatch[]
      const matchCount = matches.length

      setActiveIncidents((previous) => [
        {
          id: incident.incident_id,
          name: incident.title,
          vendor: incident.vendor ?? "Internal",
          status: "live",
          severity: mapSeverity(incident.severity),
          time: "just now",
          memoryMatches: matchCount,
          classification: data.classification,
          raw: incident,
        },
        ...previous,
      ])

      // Populate Episodic Memory panel immediately from alert recall
      setMemoryMatches(matches)
      setMemoryStatus(matches.length > 0 ? "loaded" : "loaded")

      // Pass the same retrieved matches into chat so reasoning is grounded in them
      const chatResponse = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentIncident: incident,
          past_episodes: matches,
          messages: [
            {
              role: "user",
              content: `Analyze this active incident using memory: ${incidentDescription}`,
            },
          ],
        }),
      })
      const chatData = await chatResponse.json()

      if (!chatResponse.ok) {
        throw new Error(chatData.error ?? "Failed to load Kairo reasoning")
      }

      // If chat returned fresher matches (it re-recalled), keep the larger set
      const chatMatches = (chatData.recalledIncidents ?? []) as MemoryMatch[]
      if (chatMatches.length > matches.length) {
        setMemoryMatches(chatMatches)
        setActiveIncidents((previous) =>
          previous.map((item) =>
            item.id === incident.incident_id
              ? { ...item, memoryMatches: chatMatches.length }
              : item
          )
        )
      }

      setReasoningStatus("loaded")
      setAgentMessage({
        id: `sim_${Date.now()}`,
        role: "assistant",
        content: chatData.response ?? data.analysis,
      })
      setSimulationCounter((previous) => previous + 1)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to simulate incident"
      setMemoryStatus((previous) => (previous === "loaded" ? previous : "error"))
      setReasoningStatus("error")
      setAgentMessage({
        id: `sim_error_${Date.now()}`,
        role: "assistant",
        content: `Simulation failed: ${message}`,
      })
    } finally {
      setIsSimulating(false)
    }
  }

  return (
    <div className="flex h-screen w-full bg-white font-sans antialiased">
      {/* Left Navigation */}
      <LeftNav
        activePage={activePage}
        activeVendor={activeVendor}
        onPageChange={setActivePage}
        onVendorChange={setActiveVendor}
        incidentCount={activeIncidents.length}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-100 bg-white px-8">
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">{getPageTitle()}</h1>
          <button
            onClick={handleSimulateIncident}
            disabled={isSimulating}
            className="flex items-center gap-2 rounded-full bg-gray-900 px-6 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all hover:scale-[1.02] hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
          >
            <Plus className="h-4 w-4" />
            {isSimulating ? "Simulating..." : "Simulate Incident"}
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-hidden bg-white">
          {renderPage()}
        </main>
      </div>

      {/* Right Panel - Agent Chat */}
      <RightPanel
        activeIncident={activeIncident}
        injectedMessage={agentMessage}
        memoryMatches={memoryMatches}
        memoryStatus={memoryStatus}
        reasoningStatus={reasoningStatus}
      />
    </div>
  )
}

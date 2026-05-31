"use client"

import { useEffect, useState } from "react"
import { LeftNav } from "./left-nav"
import { RightPanel } from "./right-panel"
import { KairoConsole } from "./kairo-console"
import { LiveIncidentsPage } from "./pages/live-incidents"
import { VendorProfilePage } from "./pages/vendor-profile"
import { VendorsOverviewPage } from "./pages/vendors-overview"
import { MemoryLogPage } from "./pages/memory-log"
import { PatternRulesPage } from "./pages/pattern-rules"
import { Brain, Plus } from "lucide-react"
import type { ApiIncident, DisplayIncident, LoadStatus, MemoryMatch, SimulationStage } from "@/types/kairo"
import type { AgentReasoning, AgentRuntimeResponse } from "@/types/agent"

interface AgentMessage {
  id: string
  role: "assistant"
  content: string
  analysis?: AgentReasoning
  stages?: AgentRuntimeResponse["stages"]
}

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string }

function unwrapApi<T>(payload: ApiEnvelope<T>): T {
  if (!payload.success) throw new Error(payload.error)
  return payload.data
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

function vendorIdForName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

function buildIncidentDescription(incident: ApiIncident) {
  return [
    incident.vendor ?? "internal",
    incident.region,
    incident.title,
    ...(incident.symptoms ?? []),
    incident.customer_impact,
  ]
    .filter(Boolean)
    .join(" ")
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
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
  const [agentAnalysis, setAgentAnalysis] = useState<AgentReasoning | null>(null)
  const [agentStages, setAgentStages] = useState<AgentRuntimeResponse["stages"]>([])
  const [isResolving, setIsResolving] = useState(false)
  const [incidentListStatus, setIncidentListStatus] = useState<LoadStatus>("loading")
  const [incidentListError, setIncidentListError] = useState<string | null>(null)
  const [flowError, setFlowError] = useState<string | null>(null)
  const [agentThreadKey, setAgentThreadKey] = useState(0)
  const [isConsoleOpen, setIsConsoleOpen] = useState(false)
  const [simulationStage, setSimulationStage] = useState<SimulationStage>("idle")

  useEffect(() => {
    fetch("/api/incidents")
      .then((response) => response.json())
      .then((payload: ApiEnvelope<{ incidents: ApiIncident[] }>) => {
        const data = unwrapApi(payload)
        setResolvedIncidents((data.incidents ?? []).map(mapResolvedIncident))
        setIncidentListStatus("loaded")
      })
      .catch(() => {
        setIncidentListStatus("error")
        setIncidentListError("retrieval failed while loading incident memory")
      })
  }, [])

  const allIncidents = [...activeIncidents, ...resolvedIncidents]
  const vendorSummaries = Array.from(
    allIncidents.reduce((vendors, incident) => {
      const existing = vendors.get(incident.vendor) ?? {
        id: vendorIdForName(incident.vendor),
        name: incident.vendor,
        incidentsLogged: 0,
        patternsFound: 0,
        recallAccuracy: 0,
        status: "healthy" as "healthy" | "warning" | "critical",
        lastIncident: "historical memory",
      }
      existing.incidentsLogged += 1
      existing.patternsFound = new Set(
        allIncidents
          .filter((item) => item.vendor === incident.vendor)
          .flatMap((item) => item.raw?.classification ? [item.raw.classification] : [])
      ).size
      existing.recallAccuracy = Math.min(96, 72 + existing.incidentsLogged * 3)
      if (incident.status === "live" && incident.severity === "critical") existing.status = "critical"
      else if (incident.status === "live" && existing.status !== "critical") existing.status = "warning"
      if (incident.status === "live") existing.lastIncident = "active now"
      vendors.set(incident.vendor, existing)
      return vendors
    }, new Map<string, {
      id: string
      name: string
      incidentsLogged: number
      patternsFound: number
      recallAccuracy: number
      status: "healthy" | "warning" | "critical"
      lastIncident: string
    }>())
  ).map(([, vendor]) => vendor)

  const memoryEntries = resolvedIncidents.slice(0, 20).map((incident) => ({
    id: incident.id,
    timestamp: incident.raw?.timestamp_start
      ? new Date(incident.raw.timestamp_start).toLocaleString()
      : incident.time,
    vendor: incident.vendor,
    incident: incident.name,
    type: "resolution" as const,
    retained:
      incident.raw?.successful_fix ??
      incident.raw?.actual_root_cause ??
      incident.raw?.customer_impact ??
      "Historical incident retained as memory",
  }))

  const patternRules = Array.from(
    new Map(
      resolvedIncidents.flatMap((incident) => {
        const tags = [incident.classification, incident.raw?.vendor].filter(Boolean) as string[]
        return tags.map((tag) => [
          `${incident.vendor}:${tag}`,
          {
            id: `${vendorIdForName(incident.vendor)}-${tag}`,
            name: `${incident.vendor} ${tag.replaceAll("_", " ")} pattern`,
            vendor: incident.vendor,
            confidence: Math.min(94, 70 + incident.memoryMatches * 5 + tags.length * 4),
            triggerCount: resolvedIncidents.filter((item) => item.vendor === incident.vendor).length,
            lastFired: incident.time,
            condition: `${incident.vendor} + ${tag} + matching signals -> recall prior resolution and skipped checks`,
          },
        ])
      })
    ).values()
  )

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
      return <VendorProfilePage vendorId={activeVendor} incidents={allIncidents} />
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
            onSelectIncident={handleSelectIncident}
            onResolveIncident={handleResolveIncident}
            resolvingIncidentId={isResolving ? activeIncident?.incident_id : null}
            incidentListStatus={incidentListStatus}
            incidentListError={incidentListError}
            flowError={flowError}
            simulationStage={simulationStage}
          />
        )
      case "vendors":
        return <VendorsOverviewPage onVendorSelect={handleVendorSelect} vendors={vendorSummaries} />
      case "memory":
        return <MemoryLogPage entries={memoryEntries} />
      case "patterns":
        return <PatternRulesPage patterns={patternRules} />
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
            onSelectIncident={handleSelectIncident}
            onResolveIncident={handleResolveIncident}
            resolvingIncidentId={isResolving ? activeIncident?.incident_id : null}
            incidentListStatus={incidentListStatus}
            incidentListError={incidentListError}
            flowError={flowError}
            simulationStage={simulationStage}
          />
        )
    }
  }

  const loadIncidentReasoning = async (incident: ApiIncident) => {
    setSimulationStage("processing")
    setActiveIncident(incident)
    setSimulationStage("incident")
    setMemoryStatus("loading")
    setReasoningStatus("loading")
    setMemoryMatches([])
    setAgentAnalysis(null)
    setAgentStages([])
    setFlowError(null)
    setAgentThreadKey((previous) => previous + 1)
    setSimulationStage("processing")

    const memoryResponse = await fetch("/api/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentIncident: incident }),
    })
    const memoryPayload = await memoryResponse.json()
    if (!memoryResponse.ok || !memoryPayload.success) {
      throw new Error(memoryPayload.error ?? "retrieval failed")
    }
    const memoryData = memoryPayload.data

    const matches = (memoryData.matches ?? []) as MemoryMatch[]
    setMemoryMatches(matches)
    setMemoryStatus("loaded")
    setSimulationStage("memory")

    const chatResponse = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentIncident: incident,
        past_episodes: matches,
        messages: [
          {
            role: "user",
            content: `Analyze this active incident using memory: ${buildIncidentDescription(incident)}`,
          },
        ],
      }),
    })
    const chatPayload = await chatResponse.json()
    if (!chatResponse.ok || !chatPayload.success) {
      throw new Error(chatPayload.error ?? "analysis failed")
    }
    const chatData = chatPayload.data

    const chatMatches = (chatData.recalledIncidents ?? matches) as MemoryMatch[]
    setMemoryMatches(chatMatches)
    setReasoningStatus("loaded")
    setAgentAnalysis(chatData.analysis ?? null)
    setAgentStages(chatData.stages ?? [])
    setSimulationStage("action")
    setAgentMessage({
      id: `analysis_${incident.incident_id}_${Date.now()}`,
      role: "assistant",
      content: chatData.response,
      analysis: chatData.analysis,
      stages: chatData.stages,
    })
    setActiveIncidents((previous) =>
      previous.map((item) =>
        item.id === incident.incident_id
          ? { ...item, memoryMatches: chatMatches.length }
          : item
      )
    )
  }

  const handleSelectIncident = async (incident: DisplayIncident) => {
    if (!incident.raw) return
    try {
      await loadIncidentReasoning(incident.raw)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to select incident"
      setMemoryStatus("error")
      setReasoningStatus("error")
      setFlowError(`retrieval/analysis failed: ${message}`)
      setAgentMessage({
        id: `select_error_${Date.now()}`,
        role: "assistant",
        content: `Selection failed: ${message}`,
      })
      setSimulationStage("idle")
    }
  }

  const handleResolveIncident = async (incident: DisplayIncident) => {
    if (!incident.raw || isResolving) return

    const topMatch = memoryMatches[0]
    const analysis = agentAnalysis
    const fixApplied =
      analysis?.recommended_next_actions?.[0] ??
      topMatch?.resolution ??
      topMatch?.metadata?.successful_fix ??
      "Resolved using Kairo memory-guided mitigation"
    const rootCause =
      analysis?.likely_cause ??
      topMatch?.root_cause ??
      topMatch?.metadata?.actual_root_cause ??
      "Resolved incident root cause recorded from Kairo operator flow"
    const failedMitigations =
      analysis?.checks_to_skip?.length
        ? analysis.checks_to_skip
        : topMatch?.skipped_checks ?? []
    const patternTags =
      topMatch?.patterns_matched?.length
        ? topMatch.patterns_matched
        : topMatch?.metadata?.patterns_matched?.split(",").map((item) => item.trim()).filter(Boolean) ?? []

    setIsResolving(true)
    try {
      const response = await fetch("/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incident: incident.raw,
          fix_applied: fixApplied,
          failed_mitigations: failedMitigations,
          root_cause: rootCause,
          pattern_tags: patternTags,
          resolution_time_seconds: Number(topMatch?.metadata?.time_to_resolution_minutes ?? 20) * 60,
        }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error ?? "resolve failed")

      setActiveIncidents((previous) => previous.filter((item) => item.id !== incident.id))
      setResolvedIncidents((previous) => [
        {
          ...incident,
          status: "resolved",
          severity: "info",
          time: `Resolved now`,
          raw: {
            ...incident.raw!,
            successful_fix: fixApplied,
            actual_root_cause: rootCause,
            failed_checks: failedMitigations,
            time_to_resolution_minutes: Number(topMatch?.metadata?.time_to_resolution_minutes ?? 20),
          },
        },
        ...previous,
      ])
      setActiveIncident(null)
      setMemoryMatches([])
      setMemoryStatus("idle")
      setReasoningStatus("idle")
      setAgentAnalysis(null)
      setAgentStages([])
      setAgentMessage({
        id: `resolved_${Date.now()}`,
        role: "assistant",
        content: `WRITE_BACK_COMPLETE: ${incident.name}\nStored resolution as retrievable Kairo memory via /api/resolve.\nResolution: ${fixApplied}`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to resolve incident"
      setFlowError(`resolve failed: ${message}`)
      setAgentMessage({
        id: `resolve_error_${Date.now()}`,
        role: "assistant",
        content: `Resolution write-back failed: ${message}`,
      })
    } finally {
      setIsResolving(false)
      setSimulationStage("idle")
    }
  }

  const handleSimulateIncident = async () => {
    if (isSimulating) return

    setIsSimulating(true)
    setActivePage("incidents")
    setActiveVendor(null)
    setActiveIncident(null)
    setMemoryStatus("loading")
    setReasoningStatus("loading")
    setMemoryMatches([])
    setAgentAnalysis(null)
    setAgentStages([])
    setFlowError(null)
    setAgentThreadKey((previous) => previous + 1)
    setSimulationStage("processing")

    try {
      const response = await fetch("/api/alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index: simulationCounter }),
      })

      const alertPayload = await response.json()

      if (!response.ok || !alertPayload.success) {
        throw new Error(alertPayload.error ?? "alert failed")
      }
      const data = alertPayload.data

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

      await wait(220)
      setActiveIncident(incident)
      setSimulationStage("incident")

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
          memoryMatches: 0,
          classification: data.classification,
          raw: incident,
        },
        ...previous.filter((item) => item.id !== incident.incident_id),
      ])

      await wait(360)
      // Populate Episodic Memory panel immediately from alert recall
      setMemoryMatches(matches)
      setMemoryStatus(matches.length > 0 ? "loaded" : "loaded")
      setSimulationStage("memory")
      setActiveIncidents((previous) =>
        previous.map((item) =>
          item.id === incident.incident_id
            ? { ...item, memoryMatches: matchCount }
            : item
        )
      )

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
      const chatPayload = await chatResponse.json()

      if (!chatResponse.ok || !chatPayload.success) {
        throw new Error(chatPayload.error ?? "analysis failed")
      }
      const chatData = chatPayload.data

      // If chat returned fresher matches (it re-recalled), keep the larger set
      const chatMatches = (chatData.recalledIncidents ?? []) as MemoryMatch[]
      await wait(360)
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
      setSimulationStage("match")

      await wait(360)
      setReasoningStatus("loaded")
      setAgentAnalysis(chatData.analysis ?? data.structuredAnalysis ?? null)
      setAgentStages(chatData.stages ?? [])
      setSimulationStage("action")
      setAgentMessage({
        id: `sim_${Date.now()}`,
        role: "assistant",
        content: chatData.response ?? data.analysis,
        analysis: chatData.analysis ?? data.structuredAnalysis,
        stages: chatData.stages,
      })
      setSimulationCounter((previous) => previous + 1)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to simulate incident"
      setMemoryStatus((previous) => (previous === "loaded" ? previous : "error"))
      setReasoningStatus("error")
      setFlowError(`retrieval/analysis failed: ${message}`)
      setAgentMessage({
        id: `sim_error_${Date.now()}`,
        role: "assistant",
        content: `Simulation failed: ${message}`,
      })
      setSimulationStage("idle")
    } finally {
      setIsSimulating(false)
    }
  }

  return (
    <div className="flex h-screen w-full bg-white font-sans text-[16px] leading-[1.5] antialiased">
      {/* Left Navigation */}
      <LeftNav
        activePage={activePage}
        activeVendor={activeVendor}
        onPageChange={setActivePage}
        onVendorChange={setActiveVendor}
        incidentCount={activeIncidents.length}
      />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-gray-100 bg-white px-8">
          <h1 className="text-[30px] font-bold leading-tight tracking-tight text-gray-900">{getPageTitle()}</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsConsoleOpen(true)}
              className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-gray-800 shadow-sm transition-all hover:border-teal-200 hover:bg-teal-50"
            >
              <Brain className="h-4 w-4 text-teal-700" />
              Ask Kairo
            </button>
            <button
              onClick={handleSimulateIncident}
              disabled={isSimulating}
              className="flex items-center gap-2 rounded-full bg-gray-900 px-6 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all hover:scale-[1.02] hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
            >
              <Plus className="h-4 w-4" />
              {isSimulating ? "Processing..." : "Simulate Incident"}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-hidden bg-white">
          {renderPage()}
        </main>
      </div>

      {/* Right Intelligence Rail */}
      <RightPanel
        activeIncident={activeIncident}
        memoryMatches={memoryMatches}
        memoryStatus={memoryStatus}
        reasoningStatus={reasoningStatus}
        agentAnalysis={agentAnalysis}
        simulationStage={simulationStage}
        onOpenConsole={() => setIsConsoleOpen(true)}
      />

      <KairoConsole
        isOpen={isConsoleOpen}
        onClose={() => setIsConsoleOpen(false)}
        activeIncident={activeIncident}
        injectedMessage={agentMessage}
        memoryMatches={memoryMatches}
        memoryStatus={memoryStatus}
        reasoningStatus={reasoningStatus}
        agentAnalysis={agentAnalysis}
        agentStages={agentStages}
        agentThreadKey={agentThreadKey}
      />
    </div>
  )
}

import { activeIncidentToRetrievalRequest } from "@/lib/memory/incident-memory"
import { retrieveSimilarIncidents } from "@/lib/retrieval/incidents"
import type {
  ActiveIncidentContext,
  AgentReasoning,
  AgentRuntimeResponse,
  RetrievedMemoryIncident,
} from "@/types/agent"

type RuntimeInput = {
  activeIncident: ActiveIncidentContext
  retrievedMemory?: RetrievedMemoryIncident[]
  latestUserMessage?: string
}

function normalizeList(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(values.map((value) => value?.trim()).filter(Boolean) as string[])
  )
}

function buildNoMemoryReasoning(incident: ActiveIncidentContext): AgentReasoning {
  const vendor = incident.vendor ?? "the affected vendor"
  return {
    diagnosis: `Kairo does not have a strong prior memory match for ${incident.title ?? "this incident"}. Treat this as active triage until more evidence is collected.`,
    likely_cause: "Unknown. There is not enough retrieved memory to identify a supported cause.",
    recommended_next_actions: [
      `Check ${vendor} status and support channels for a matching degradation.`,
      "Compare dependency latency, error rate, and callback/webhook lag against the incident start time.",
      "Confirm there was no internal deploy, config change, or traffic spike at the same time.",
    ],
    checks_to_skip: [],
    uncertainty_note:
      "No historical memory was retrieved, so Kairo is intentionally not recommending a specific fix.",
    referenced_memory_incidents: [],
  }
}

function buildMemoryGroundedReasoning(
  incident: ActiveIncidentContext,
  memory: RetrievedMemoryIncident[]
): AgentReasoning {
  if (!memory.length) return buildNoMemoryReasoning(incident)

  const top = memory[0]
  const references = memory.slice(0, 4).map((match) => ({
    id: match.matched_incident_id,
    title: match.title,
    vendor: match.vendor,
    similarity: match.similarity,
  }))

  const recommended = normalizeList([
    top.resolution,
    ...memory.slice(1, 3).map((match) => match.resolution),
  ]).slice(0, 4)

  const skipped = normalizeList(memory.flatMap((match) => match.skipped_checks)).slice(0, 6)
  const patternSummary = normalizeList(memory.flatMap((match) => match.patterns_matched)).slice(0, 5)
  const vendor = incident.vendor ?? top.vendor

  return {
    diagnosis: `${incident.title ?? "The active incident"} resembles ${top.title} (${top.vendor}) with ${formatEvidenceStrength(
      top.similarity
    )} evidence strength.`,
    likely_cause:
      top.root_cause ??
      `Likely ${vendor} degradation based on the closest memory match, but the root cause was not stored.`,
    recommended_next_actions:
      recommended.length > 0
        ? recommended
        : [
            "Keep the incident in investigation and collect vendor status, dependency latency, webhook/callback lag, and recent deploy evidence.",
          ],
    checks_to_skip: skipped,
    uncertainty_note:
      top.similarity >= 0.65
        ? `Grounded in ${references.length} retrieved memory incident(s). Validate current vendor status before executing irreversible mitigation.`
        : `Similarity is moderate. Use these memories as triage guidance, not proof. Matched patterns: ${
            patternSummary.join(", ") || "none"
          }.`,
    referenced_memory_incidents: references,
  }
}

export function renderAgentReasoning(reasoning: AgentReasoning) {
  return [
    `DIAGNOSIS: ${reasoning.diagnosis}`,
    `LIKELY_CAUSE: ${reasoning.likely_cause}`,
    "",
    "RECOMMENDED_NEXT_ACTIONS:",
    ...reasoning.recommended_next_actions.map((action, index) => `${index + 1}. ${action}`),
    "",
    "CHECKS_TO_SKIP:",
    ...(reasoning.checks_to_skip.length
      ? reasoning.checks_to_skip.map((check) => `- ${check}`)
      : ["- none from retrieved memory"]),
    "",
    `UNCERTAINTY: ${reasoning.uncertainty_note}`,
    "",
    "MEMORY_REFERENCES:",
    ...(reasoning.referenced_memory_incidents.length
      ? reasoning.referenced_memory_incidents.map(
          (ref) => `- ${ref.id} | ${ref.vendor} | ${formatEvidenceStrength(ref.similarity)} | ${ref.title}`
        )
      : ["- none"]),
  ].join("\n")
}

function formatEvidenceStrength(similarity: number) {
  if (similarity >= 0.82) return "strong"
  if (similarity >= 0.58) return "moderate"
  return "weak"
}

export function runKairoAgent(input: RuntimeInput): AgentRuntimeResponse {
  const memory =
    input.retrievedMemory && input.retrievedMemory.length > 0
      ? input.retrievedMemory
      : retrieveSimilarIncidents(activeIncidentToRetrievalRequest(input.activeIncident)).matches

  const analysis = buildMemoryGroundedReasoning(input.activeIncident, memory)

  return {
    response: renderAgentReasoning(analysis),
    analysis,
    memoryMatches: memory.length,
    recalledIncidents: memory,
    stages: [
      {
        name: "input",
        status: "completed",
        summary: "Normalized active incident context.",
      },
      {
        name: "retrieval",
        status: memory.length ? "completed" : "skipped",
        summary: memory.length
          ? `Retrieved ${memory.length} memory match(es).`
          : "No matching memory incidents were found.",
      },
      {
        name: "reasoning",
        status: "completed",
        summary: "Built structured memory-grounded reasoning.",
      },
    ],
  }
}

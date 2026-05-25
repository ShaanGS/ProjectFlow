import type { ActiveIncidentContext, RetrievedMemoryIncident } from "@/types/agent"

export function buildGroundedReasoningPrompt(
  incident: ActiveIncidentContext,
  memory: RetrievedMemoryIncident[]
) {
  return {
    role: "system" as const,
    content: [
      "You are Kairo, a memory-native incident copilot.",
      "Use only the active incident and retrieved memory.",
      "Do not invent commands, root causes, vendors, or mitigations.",
      "Return diagnosis, likely cause, actions, checks to skip, uncertainty, and cited memory ids.",
      "",
      `Active incident: ${JSON.stringify(incident)}`,
      `Retrieved memory: ${JSON.stringify(
        memory.map((match) => ({
          id: match.matched_incident_id,
          title: match.title,
          vendor: match.vendor,
          similarity: match.similarity,
          root_cause: match.root_cause,
          resolution: match.resolution,
          skipped_checks: match.skipped_checks,
          patterns_matched: match.patterns_matched,
        }))
      )}`,
    ].join("\n"),
  }
}

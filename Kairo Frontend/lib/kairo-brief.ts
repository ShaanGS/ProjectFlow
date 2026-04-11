import type { MemoryMatch } from "@/lib/hindsight"

function getMeta(match: MemoryMatch) {
  return match.metadata ?? {}
}

function boundaryLine(classification?: string) {
  if (classification === "internal") return "internal"
  if (classification === "mixed") return "mixed"
  if (classification === "vendor_side") return "vendor_side"
  return "unknown"
}

/** Split recorded fix text into numbered steps; no invented commands. */
function fixToSteps(successfulFix: string | undefined): string[] {
  const raw = successfulFix?.trim()
  if (!raw) return []
  const bySemi = raw.split(/\s*;\s*/).map((s) => s.trim()).filter(Boolean)
  if (bySemi.length > 1) return bySemi
  return [raw]
}

function parseFailedChecks(meta: Record<string, string | undefined>) {
  const fc = meta.failed_checks
  if (!fc) return []
  return fc.split(",").map((s) => s.trim()).filter(Boolean)
}

function memoryRefs(evidence: Array<Record<string, string | undefined>>) {
  return evidence.map((m) => `${m.timestamp_start?.slice(0, 10) ?? "?"} | ${m.title ?? "untitled"}`)
}

export function buildKairoBrief(message: string, matches: MemoryMatch[]) {
  if (!matches.length) {
    return [
      "INSUFFICIENT_MEMORY: no Hindsight recall hits.",
      "Do not infer root cause. Collect: vendor status, p95 dependency latency, deploy timeline, DB pool saturation, error budget burn.",
    ].join("\n")
  }

  const lower = message.toLowerCase()
  const top = getMeta(matches[0])
  const evidence = matches.slice(0, 3).map((m) => getMeta(m))
  const allFailed = Array.from(new Set(evidence.flatMap((meta) => parseFailedChecks(meta))))
  const topSteps = fixToSteps(top.successful_fix)
  const boundary = boundaryLine(top.classification)
  const root = top.actual_root_cause?.trim() || "not_stored_in_memory"

  if (lower.includes("skip")) {
    return [
      "SKIP_FIRST (memory — prior incidents wasted time here):",
      ...allFailed.slice(0, 6).map((c) => `- ${c}`),
      "",
      "EXECUTE_NEXT (memory — prior resolution):",
      ...topSteps.map((step, i) => `${i + 1}. ${step}`),
    ].join("\n")
  }

  if (lower.includes("slack") || lower.includes("channel") || lower.includes("update")) {
    return [
      `STATUS: ${top.customer_impact ?? "impact unknown"}`,
      `BOUNDARY: ${boundary}`,
      `OWNER: ${top.vendor && top.vendor !== "internal" ? top.vendor : "internal_platform"}`,
      `ROOT_CAUSE_MEMORY: ${root}`,
      `ACTION: ${top.successful_fix ?? "none_recorded"}`,
      `MEMORY_REF: ${memoryRefs(evidence).join(" | ")}`,
    ].join("\n")
  }

  return [
    `BOUNDARY: ${boundary}`,
    `ROOT_CAUSE_MEMORY: ${root}`,
    "",
    "RESOLUTION_STEPS (verbatim from memory — do not fabricate shell):",
    ...topSteps.map((step, i) => `${i + 1}. ${step}`),
    "",
    "SKIP (memory — failed checks in similar incidents):",
    ...allFailed.slice(0, 5).map((c) => `- ${c}`),
    "",
    "MEMORY_REF:",
    ...memoryRefs(evidence).map((line) => `- ${line}`),
  ].join("\n")
}

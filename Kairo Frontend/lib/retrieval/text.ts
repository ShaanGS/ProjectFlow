import type { IncidentSeedRecord } from "@/types/kairo-domain"
import type { RetrievalRequest } from "@/types/agent"

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "were",
  "was",
  "are",
  "api",
  "service",
  "incident",
])

const SYNONYMS: Record<string, string[]> = {
  timeout: ["latency", "slow", "504", "delay", "delayed", "timing"],
  latency: ["timeout", "slow", "delay", "delayed"],
  webhook: ["callback", "callbacks", "delivery"],
  payment: ["upi", "card", "checkout", "capture", "payout", "refund"],
  sms: ["otp", "dlt", "delivery", "sender"],
  whatsapp: ["message", "template", "media", "webhook"],
  s3: ["bucket", "object", "upload", "put", "replication"],
  upload: ["s3", "object", "put", "kyc"],
  accepted: ["queued", "pending", "delayed"],
}

export function tokenize(value: string) {
  const base = value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token))

  const expanded = new Set(base)
  for (const token of base) {
    for (const synonym of SYNONYMS[token] ?? []) expanded.add(synonym)
  }
  return [...expanded]
}

export function buildActiveIncidentText(input: RetrievalRequest) {
  return [
    input.vendor ?? "",
    input.service ?? "",
    input.region ?? "",
    input.title ?? "",
    input.description ?? "",
    ...(input.signals ?? []),
    ...(input.symptoms ?? []),
    ...(input.tags ?? []),
  ]
    .filter(Boolean)
    .join(" ")
}

export function buildHistoricalIncidentText(incident: IncidentSeedRecord) {
  return [
    incident.title,
    incident.vendor,
    incident.service,
    incident.region,
    incident.description,
    incident.signals.join(" "),
    incident.tags.join(" "),
    incident.root_cause ?? "",
    incident.resolution ?? "",
    incident.skipped_checks.join(" "),
    incident.patterns_matched.join(" "),
  ]
    .filter(Boolean)
    .join(" ")
}

export function weightedTokenScore(queryTokens: string[], documentTokens: string[]) {
  if (!queryTokens.length || !documentTokens.length) return 0

  const doc = new Set(documentTokens)
  const hits = queryTokens.filter((token) => doc.has(token)).length
  const coverage = hits / queryTokens.length
  const density = hits / Math.max(documentTokens.length, 1)

  return Math.min(1, coverage * 0.85 + density * 2.5)
}

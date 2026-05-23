import { HindsightClient, type RecallResult } from "@vectorize-io/hindsight-client"
import incidents from "@/data/incidents.json"

type IncidentMemory = {
  incident_id: string
  title: string
  timestamp_start: string
  customer_impact: string
  vendor: string | null
  region: string
  classification: string
  actual_root_cause?: string
  successful_fix: string
  failed_checks: string[]
  time_to_resolution_minutes: number
  embedding_text: string
}

export type MemoryMatch = RecallResult & {
  metadata: {
    incident_id?: string
    title?: string
    vendor?: string
    region?: string
    classification?: string
    actual_root_cause?: string
    successful_fix?: string
    failed_checks?: string
    time_to_resolution_minutes?: string
    timestamp_start?: string
    customer_impact?: string
  }
}

const hindsight = new HindsightClient({
  baseUrl: process.env.HINDSIGHT_BASE_URL ?? "https://hindsight.vectorize.io",
  apiKey: process.env.HINDSIGHT_API_KEY,
})

function getBankId() {
  const bankId = process.env.HINDSIGHT_PIPELINE_ID

  if (!bankId || bankId === "your_pipeline_id") {
    throw new Error("Missing HINDSIGHT_PIPELINE_ID. Set it to your Hindsight memory bank/pipeline id.")
  }

  return bankId
}

function hasHindsightConfig() {
  return Boolean(
    process.env.HINDSIGHT_API_KEY &&
      process.env.HINDSIGHT_API_KEY !== "your_hindsight_api_key" &&
      process.env.HINDSIGHT_PIPELINE_ID &&
      process.env.HINDSIGHT_PIPELINE_ID !== "your_pipeline_id"
  )
}

function stringifyMetadata(value: unknown) {
  if (value === null || value === undefined) return ""
  return Array.isArray(value) ? value.join(", ") : String(value)
}

export async function retainIncident(incident: IncidentMemory) {
  if (!hasHindsightConfig()) {
    return { success: true, skipped: true }
  }

  return hindsight.retain(getBankId(), incident.embedding_text, {
    context: incident.title,
    timestamp: incident.timestamp_start,
    metadata: {
      incident_id: stringifyMetadata(incident.incident_id),
      title: stringifyMetadata(incident.title),
      vendor: stringifyMetadata(incident.vendor),
      region: stringifyMetadata(incident.region),
      classification: stringifyMetadata(incident.classification),
      actual_root_cause: stringifyMetadata(incident.actual_root_cause),
      successful_fix: stringifyMetadata(incident.successful_fix),
      failed_checks: stringifyMetadata(incident.failed_checks),
      time_to_resolution_minutes: stringifyMetadata(incident.time_to_resolution_minutes),
      timestamp_start: stringifyMetadata(incident.timestamp_start),
      customer_impact: stringifyMetadata(incident.customer_impact),
    },
    tags: ["kairo", stringifyMetadata(incident.vendor || "internal"), incident.classification],
  })
}

/** Canonical vendor strings must match `data/incidents.json` `vendor` field. */
type VendorAnchor = { mode: "vendors"; vendors: string[] } | { mode: "internal" } | { mode: "none" }

function detectVendorAnchor(query: string): VendorAnchor {
  const q = query.toLowerCase()
  const vendors: string[] = []
  if (q.includes("razorpay")) vendors.push("Razorpay")
  if (q.includes("msg91")) vendors.push("MSG91")
  if (q.includes("cashfree")) vendors.push("Cashfree")
  if (q.includes("whatsapp")) vendors.push("WhatsApp Cloud API")
  if (q.includes("auth0")) vendors.push("Auth0")
  if (
    (q.includes("aws") && q.includes("s3")) ||
    (/\bs3\b/.test(q) &&
      (q.includes("mumbai") ||
        q.includes("upload") ||
        q.includes("kyc") ||
        q.includes("ap-south") ||
        q.includes("put ") ||
        q.includes("bucket")))
  ) {
    vendors.push("AWS S3")
  }

  const internalSignal =
    vendors.length === 0 &&
    /connection\s+pool|pool\s+exhaustion|internal\s+postgres|postgres.*pool|db\s+pool|all\s+checkout.*504/.test(q)

  if (internalSignal) return { mode: "internal" }
  if (vendors.length) return { mode: "vendors", vendors: [...new Set(vendors)] }
  return { mode: "none" }
}

function incidentPassesAnchor(
  incident: (typeof incidents)[number],
  anchor: VendorAnchor
): boolean {
  if (anchor.mode === "none") return true
  if (anchor.mode === "internal") return incident.vendor == null
  return Boolean(incident.vendor && anchor.vendors.includes(incident.vendor))
}

/** Map user tokens to related tokens so e.g. "webhook" scores Razorpay callback/capture incidents. */
function expandQueryTerms(terms: string[]): string[] {
  const out = new Set<string>()
  const synonymGroups: string[][] = [
    ["webhook", "webhooks", "callback", "callbacks", "capture"],
    ["failing", "failure", "failures", "failed", "outage", "degraded"],
    ["timeout", "timeouts", "504", "latency", "slow", "delay", "delayed"],
    ["otp", "sms", "dlt"],
  ]
  for (const term of terms) {
    out.add(term)
    for (const group of synonymGroups) {
      if (group.includes(term)) {
        for (const g of group) out.add(g)
      }
    }
  }
  return [...out]
}

function augmentQueryForHindsight(query: string): string {
  const anchor = detectVendorAnchor(query)
  if (anchor.mode === "vendors") return `${anchor.vendors.join(" ")} ${query}`
  if (anchor.mode === "internal") return `internal postgres connection pool ${query}`
  return query
}

export async function recallIncidents(query: string) {
  const hindsightQuery = augmentQueryForHindsight(query)

  if (!hasHindsightConfig()) {
    const anchor = detectVendorAnchor(query)
    const rawTerms = query.toLowerCase().split(/\W+/).filter(Boolean)
    const queryTerms = expandQueryTerms(rawTerms)

    const matches = incidents
      .filter((incident) => incidentPassesAnchor(incident, anchor))
      .map((incident) => {
        const searchable = [
          incident.title,
          incident.vendor ?? "internal",
          incident.region,
          incident.symptoms.join(" "),
          incident.embedding_text,
        ].join(" ").toLowerCase()
        const score = queryTerms.reduce((total, term) => total + (searchable.includes(term) ? 1 : 0), 0)

        return { incident, score }
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(({ incident }) => ({
        id: incident.incident_id,
        text: incident.embedding_text,
        type: "experience",
        metadata: {
          incident_id: incident.incident_id,
          title: incident.title,
          vendor: incident.vendor ?? "internal",
          region: incident.region,
          classification: incident.classification,
          actual_root_cause: incident.actual_root_cause ?? "",
          successful_fix: incident.successful_fix,
          failed_checks: incident.failed_checks.join(", "),
          time_to_resolution_minutes: String(incident.time_to_resolution_minutes),
          timestamp_start: incident.timestamp_start,
          customer_impact: incident.customer_impact,
        },
      })) as MemoryMatch[]

    return {
      results: matches,
      matches,
      fallback: true,
    }
  }

  const results = await hindsight.recall(getBankId(), hindsightQuery, {
    budget: "low",
    maxTokens: 4000,
    tags: ["kairo"],
  })

  // Hydrate missing metadata using raw incidents mapping where possible
  const hydratedMatches = (results.results ?? []).map((m: any) => {
    let incident = null;
    
    if (m.context) {
      const cleanContext = m.context.replace("Post-mortem experience: ", "").trim();
      incident = incidents.find((inc) => inc.title.includes(cleanContext) || cleanContext.includes(inc.title));
    }
    
    if (!incident && m.text) {
      const text = m.text.toLowerCase();
      let bestScore = 0;
      const words = text.split(/\W+/).filter((w: string) => w.length > 3);
      for (const inc of incidents) {
        const incText = (inc.title + " " + inc.embedding_text + " " + inc.symptoms.join(" ")).toLowerCase();
        let score = 0;
        for (const w of words) if (incText.includes(w)) score++;
        if (score > bestScore && score > 2) {
          bestScore = score;
          incident = inc;
        }
      }
    }

    const metadata = m.metadata || {
      incident_id: incident?.incident_id,
      title: incident?.title ?? m.context ?? "untitled",
      vendor: incident?.vendor ?? "internal",
      region: incident?.region ?? "unknown",
      classification: incident?.classification ?? "unknown",
      actual_root_cause: incident?.actual_root_cause ?? "",
      successful_fix: incident?.successful_fix ?? "",
      failed_checks: incident ? incident.failed_checks.join(", ") : "",
      time_to_resolution_minutes: incident ? String(incident.time_to_resolution_minutes) : "0",
      timestamp_start: incident?.timestamp_start ?? m.occurred_start ?? m.mentioned_at ?? "?",
      customer_impact: incident?.customer_impact ?? "unknown",
    };

    return { ...m, metadata };
  });

  return {
    ...results,
    matches: hydratedMatches as MemoryMatch[],
  }
}

/** Block inserted into LLM system prompts; must mirror seeded metadata. */
export function formatRecalledMemoryBlock(matches: MemoryMatch[]) {
  return formatHindsightMemoryContext(matches)
}

/** @deprecated Use formatRecalledMemoryBlock for LLM prompts */
export function formatHindsightMemoryContext(matches: MemoryMatch[]) {
  if (!matches.length) {
    return "No prior incidents found in memory."
  }

  return matches
    .map((match, index) => {
      const meta = match.metadata ?? {}

      return `Previous incident ${index + 1}:
Title: ${meta.title ?? match.text}
Date: ${meta.timestamp_start ?? "unknown"}
Vendor: ${meta.vendor ?? "internal"}
Region: ${meta.region ?? "unknown"}
Classification: ${meta.classification ?? "unknown"}
Root cause (memory): ${meta.actual_root_cause?.trim() ? meta.actual_root_cause : "not recorded"}
Customer impact: ${meta.customer_impact ?? "unknown"}
Historical failed checks (skip first): ${meta.failed_checks ?? "unknown"}
Historical resolution: ${meta.successful_fix ?? "unknown"}
Time to resolution: ${meta.time_to_resolution_minutes ?? "unknown"} minutes`
    })
    .join("\n\n---\n\n")
}

export default hindsight

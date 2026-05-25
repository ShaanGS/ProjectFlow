import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import type { IncidentSeedRecord } from "../types/kairo-domain"

type VendorSeed = {
  id: string
  name: string
  category: string
  status_page_url?: string
}

const vendorSeeds: VendorSeed[] = [
  {
    id: "vendor_razorpay",
    name: "Razorpay",
    category: "payments",
    status_page_url: "https://status.razorpay.com",
  },
  {
    id: "vendor_msg91",
    name: "MSG91",
    category: "messaging",
    status_page_url: "https://status.msg91.com",
  },
  {
    id: "vendor_cashfree",
    name: "Cashfree",
    category: "payments",
    status_page_url: "https://www.cashfree.com/status",
  },
  {
    id: "vendor_aws_s3",
    name: "AWS S3",
    category: "cloud",
    status_page_url: "https://health.aws.amazon.com/health/status",
  },
  {
    id: "vendor_whatsapp_cloud_api",
    name: "WhatsApp Cloud API",
    category: "communications",
    status_page_url: "https://metastatus.com/whatsapp-business-platform",
  },
]

const vendorIdByName = new Map(vendorSeeds.map((vendor) => [vendor.name, vendor.id]))
const seedPath = join(dirname(fileURLToPath(import.meta.url)), "../data/incidents-seed.json")
const seed = JSON.parse(readFileSync(seedPath, "utf8")) as IncidentSeedRecord[]

function requireStringArray(record: IncidentSeedRecord, key: keyof IncidentSeedRecord) {
  const value = record[key]
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== "string")) {
    throw new Error(`${record.id} has invalid ${String(key)}`)
  }
}

function validateSeed() {
  if (seed.length < 20) {
    throw new Error(`Expected at least 20 incidents, found ${seed.length}`)
  }

  const ids = new Set<string>()
  for (const incident of seed) {
    if (ids.has(incident.id)) throw new Error(`Duplicate incident id: ${incident.id}`)
    ids.add(incident.id)

    if (!vendorIdByName.has(incident.vendor)) {
      throw new Error(`${incident.id} references unknown vendor ${incident.vendor}`)
    }

    if (!incident.title || !incident.service || !incident.description) {
      throw new Error(`${incident.id} is missing required text fields`)
    }

    if (incident.status === "resolved" && !incident.resolved_at) {
      throw new Error(`${incident.id} is resolved without resolved_at`)
    }

    if (incident.resolved_at && new Date(incident.resolved_at) <= new Date(incident.triggered_at)) {
      throw new Error(`${incident.id} resolved_at must be after triggered_at`)
    }

    requireStringArray(incident, "signals")
    requireStringArray(incident, "tags")
    requireStringArray(incident, "skipped_checks")
    requireStringArray(incident, "patterns_matched")
  }
}

function toIncidentRow(incident: IncidentSeedRecord) {
  return {
    id: incident.id,
    title: incident.title,
    vendor_id: vendorIdByName.get(incident.vendor),
    vendor: incident.vendor,
    service: incident.service,
    severity: incident.severity,
    environment: incident.environment,
    region: incident.region,
    status: incident.status,
    triggered_at: incident.triggered_at,
    resolved_at: incident.resolved_at,
    ttd_seconds: incident.ttd_seconds,
    ttr_seconds: incident.ttr_seconds,
    description: incident.description,
    signals: incident.signals,
    tags: incident.tags,
    root_cause: incident.root_cause,
    resolution: incident.resolution,
    skipped_checks: incident.skipped_checks,
    patterns_matched: incident.patterns_matched,
  }
}

async function upsertSupabase(table: string, rows: unknown[]) {
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to seed Supabase")
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?on_conflict=id`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      "content-type": "application/json",
      prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(rows),
  })

  if (!response.ok) {
    throw new Error(`Failed to seed ${table}: ${response.status} ${await response.text()}`)
  }
}

async function main() {
  validateSeed()

  const dryRun = process.argv.includes("--dry-run")
  const incidentRows = seed.map(toIncidentRow)

  if (dryRun) {
    console.log(`Validated ${vendorSeeds.length} vendors and ${incidentRows.length} incidents.`)
    console.log("Dry run complete. No database writes were made.")
    return
  }

  await upsertSupabase("vendors", vendorSeeds)
  await upsertSupabase("incidents", incidentRows)

  console.log(`Seeded ${vendorSeeds.length} vendors and ${incidentRows.length} incidents.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

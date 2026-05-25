/**
 * Seed all incidents as rich experiences + create mental models
 * Run: node scripts/seed-full.mjs
 */
import { HindsightClient } from "@vectorize-io/hindsight-client";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const incidents = JSON.parse(
  readFileSync(join(__dirname, "..", "data", "incidents.json"), "utf-8")
);

const BANK_ID = "kairo";
const client = new HindsightClient({
  baseUrl: "https://api.hindsight.vectorize.io",
  apiKey: "dummy_keys",
});

// ─── Step 1: Retain each incident as a rich experience narrative ──────────────

function buildExperienceNarrative(inc) {
  const vendor = inc.vendor ?? "Internal";
  const symptoms = inc.symptoms.join(", ");
  const failedChecks = inc.failed_checks.join(", ");

  return `INCIDENT EXPERIENCE: ${inc.title}
Date: ${inc.timestamp_start} to ${inc.timestamp_end}
Severity: ${inc.severity}
Vendor: ${vendor}
Region: ${inc.region}
Classification: ${inc.classification}

CUSTOMER IMPACT: ${inc.customer_impact}

SYMPTOMS OBSERVED: ${symptoms}

INVESTIGATION STEPS THAT FAILED (wasted time): ${failedChecks}

ACTUAL ROOT CAUSE DISCOVERED: ${inc.actual_root_cause}

SUCCESSFUL RESOLUTION: ${inc.successful_fix}

TIME TO RESOLUTION: ${inc.time_to_resolution_minutes} minutes

KEY LEARNING: When seeing "${inc.symptoms[0]}" with ${vendor}, skip "${inc.failed_checks[0]}" and go directly to "${inc.successful_fix}". The root cause was ${inc.actual_root_cause}.`;
}

async function seedExperiences() {
  console.log("=== STEP 1: Retaining incidents as experiences ===\n");

  for (const inc of incidents) {
    const narrative = buildExperienceNarrative(inc);
    const tags = [
      "kairo",
      "experience",
      inc.classification,
      inc.vendor ?? "internal",
      inc.region,
    ].filter(Boolean);

    console.log(`  Retaining: ${inc.incident_id} — ${inc.title}`);

    try {
      await client.retain(BANK_ID, narrative, {
        timestamp: inc.timestamp_start,
        context: `Post-mortem experience: ${inc.title}`,
        metadata: {
          incident_id: inc.incident_id,
          severity: inc.severity,
          vendor: inc.vendor ?? "internal",
          region: inc.region,
          classification: inc.classification,
          root_cause: inc.actual_root_cause,
          resolution: inc.successful_fix,
          failed_checks: inc.failed_checks.join("; "),
          customer_impact: inc.customer_impact,
          ttr_minutes: String(inc.time_to_resolution_minutes),
        },
        tags,
      });
      console.log(`    ✅ Done`);
    } catch (err) {
      console.log(`    ❌ Error: ${err.message}`);
    }

    // Small delay to avoid rate limits
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\n  Total incidents retained: ${incidents.length}\n`);
}

// ─── Step 2: Create Mental Models ─────────────────────────────────────────────

const mentalModels = [
  {
    id: "razorpay-playbook",
    name: "Razorpay Incident Playbook",
    sourceQuery:
      "Razorpay payment failure UPI timeout 504 checkout degradation resolution steps what to do",
    tags: ["kairo", "Razorpay"],
  },
  {
    id: "otp-sms-playbook",
    name: "OTP/SMS Delivery Failure Playbook",
    sourceQuery:
      "MSG91 OTP SMS delivery drop failure DLT carrier routing resolution what worked",
    tags: ["kairo", "MSG91"],
  },
  {
    id: "aws-s3-playbook",
    name: "AWS S3 Outage Playbook",
    sourceQuery:
      "AWS S3 Mumbai latency PUT timeout upload failure KYC resolution steps",
    tags: ["kairo", "AWS S3"],
  },
  {
    id: "internal-infra-playbook",
    name: "Internal Infrastructure Failure Playbook",
    sourceQuery:
      "internal Postgres connection pool exhaustion DB checkout 504 traffic spike resolution",
    tags: ["kairo", "internal"],
  },
  {
    id: "vendor-vs-internal",
    name: "Vendor vs Internal Incident Classification Guide",
    sourceQuery:
      "How to determine if an incident is vendor-side or internal? What symptoms indicate vendor issue vs internal infrastructure problem?",
    tags: ["kairo"],
  },
  {
    id: "failed-checks-to-skip",
    name: "Common Failed Checks to Skip",
    sourceQuery:
      "What investigation steps commonly waste time and should be skipped? Failed checks that didn't help in past incidents",
    tags: ["kairo", "experience"],
  },
];

async function createMentalModels() {
  console.log("=== STEP 2: Creating Mental Models ===\n");

  for (const mm of mentalModels) {
    console.log(`  Creating: "${mm.name}"`);
    console.log(`    Query: "${mm.sourceQuery.substring(0, 80)}..."`);

    try {
      await client.createMentalModel(BANK_ID, mm.name, mm.sourceQuery, {
        id: mm.id,
        tags: mm.tags,
      });
      console.log(`    ✅ Created`);
    } catch (err) {
      // If already exists, try updating
      if (err.message?.includes("already exists") || err.statusCode === 409) {
        console.log(`    ⚠️  Already exists, updating...`);
        try {
          await client.updateMentalModel(BANK_ID, mm.id, {
            name: mm.name,
            sourceQuery: mm.sourceQuery,
            tags: mm.tags,
          });
          await client.refreshMentalModel(BANK_ID, mm.id);
          console.log(`    ✅ Updated & refreshed`);
        } catch (updateErr) {
          console.log(`    ❌ Update error: ${updateErr.message}`);
        }
      } else {
        console.log(`    ❌ Error: ${err.message}`);
      }
    }

    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\n  Total mental models: ${mentalModels.length}\n`);
}

// ─── Run ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔═══════════════════════════════════════════════════╗");
  console.log("║  Kairo — Full Hindsight Cloud Seed               ║");
  console.log("║  Bank: kairo                                     ║");
  console.log("║  Incidents: " + incidents.length + "                                     ║");
  console.log("╚═══════════════════════════════════════════════════╝\n");

  await seedExperiences();
  await createMentalModels();

  // Verify counts
  console.log("=== STEP 3: Verification ===\n");
  try {
    const memories = await client.listMemories(BANK_ID, { limit: 1 });
    console.log(`  Total memories in bank: ${memories.total}`);
  } catch (err) {
    console.log(`  Could not verify: ${err.message}`);
  }

  try {
    const models = await client.listMentalModels(BANK_ID);
    console.log(`  Mental models: ${models.mental_models?.length ?? 0}`);
    for (const m of models.mental_models ?? []) {
      console.log(`    - ${m.name} (status: ${m.status})`);
    }
  } catch (err) {
    console.log(`  Could not list models: ${err.message}`);
  }

  console.log("\n✅ Seeding complete!\n");
}

main().catch(console.error);

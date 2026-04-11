import { NextRequest, NextResponse } from "next/server"
import { formatHindsightMemoryContext, recallIncidents } from "@/lib/hindsight"
import groq, { hasGroqConfig } from "@/lib/groq"
import { cleanModelOutput } from "@/lib/llm-output"
import { buildKairoBrief } from "@/lib/kairo-brief"

const SIMULATED_ALERTS = [
  {
    vendor: "Razorpay",
    region: "india-west",
    title: "UPI payment timeout - Mumbai and Bengaluru",
    symptoms: ["504 on payment capture", "latency 1240ms", "status page green", "internal services healthy"],
    severity: "SEV-1",
    customer_impact: "47% checkout failure rate for UPI users",
  },
  {
    vendor: "MSG91",
    region: "north-india",
    title: "OTP delivery drop - Delhi NCR",
    symptoms: ["delivery rate 61%", "DLT accepted", "no carrier error codes", "queue healthy"],
    severity: "SEV-2",
    customer_impact: "OTP login failures for Delhi NCR users",
  },
  {
    vendor: "AWS S3",
    region: "ap-south-1",
    title: "KYC upload failures - Mumbai S3",
    symptoms: ["PUT requests timing out", "GET latency >3s", "health dashboard delayed"],
    severity: "SEV-2",
    customer_impact: "KYC image upload failures",
  },
  {
    vendor: null,
    region: "ap-south-1",
    title: "Checkout 504s across all payment methods",
    symptoms: ["504 on all checkout endpoints", "DB connection errors", "high DB pod memory", "no vendor anomalies"],
    severity: "SEV-1",
    customer_impact: "checkout failures across UPI, cards, and COD",
  },
  {
    vendor: "Auth0",
    region: "india",
    title: "Login latency with token cache misses",
    symptoms: ["JWT validation timeout", "login endpoint 502s", "Auth0 tenant slow", "internal token cache miss spike"],
    severity: "SEV-2",
    customer_impact: "30% login failures for Indian users",
  },
]

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const alertIndex = body.index ?? Math.floor(Math.random() * SIMULATED_ALERTS.length)
    const alert = SIMULATED_ALERTS[alertIndex % SIMULATED_ALERTS.length]

    const query = `${alert.vendor ?? "internal"} ${alert.region} ${alert.symptoms.join(" ")}`
    const recalled = await recallIncidents(query)
    const matchCount = recalled.matches.length

    const memoryContext = formatHindsightMemoryContext(recalled.matches)

    const fallbackAnalysis = () => {
      return buildKairoBrief(`simulate ${alert.vendor} ${alert.symptoms.join(" ")}`, recalled.matches)
    }

    const analysis = hasGroqConfig() && process.env.KAIRO_DEMO_MODE === "llm"
      ? await groq.chat.completions.create({
          model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are Kairo, a Senior DevOps AI Assistant. Diagnose the alert using ONLY [HINDSIGHT MEMORY CONTEXT].

STRICT RULES:
1. No pleasantries. No "I am an AI."
2. kubectl/shell only if verbatim in memory; else quote memory resolution text as numbered steps.
3. Do not guess beyond memory. If memory empty, output INSUFFICIENT_MEMORY + 3 telemetry checks.
4. No <redacted_thinking> or chain-of-thought.

Use headers:
BOUNDARY:
ROOT_CAUSE_MEMORY:
RESOLUTION_STEPS:
SKIP:

[HINDSIGHT MEMORY CONTEXT]
${memoryContext}`,
            },
            {
              role: "user",
              content: `ALERT: ${alert.title}
Vendor: ${alert.vendor} | Region: ${alert.region}
Symptoms: ${alert.symptoms.join(", ")}
Customer impact: ${alert.customer_impact}`,
            },
          ],
          max_tokens: 400,
          temperature: 0.2,
        })
      : null

    const topClassification = recalled.matches[0]?.metadata?.classification ?? "unknown"

    const newIncident = {
      incident_id: `inc_sim_${Date.now()}`,
      title: alert.title,
      timestamp_start: new Date().toISOString(),
      vendor: alert.vendor,
      region: alert.region,
      severity: alert.severity,
      customer_impact: alert.customer_impact,
      symptoms: alert.symptoms,
      classification: topClassification,
      successful_fix: "",
      failed_checks: [],
      time_to_resolution_minutes: 0,
      embedding_text: query,
    }

    return NextResponse.json({
      incident: newIncident,
      memoryMatches: matchCount,
      classification: topClassification,
      analysis: hasGroqConfig() && process.env.KAIRO_DEMO_MODE === "llm"
        ? cleanModelOutput(analysis?.choices[0]?.message?.content) || fallbackAnalysis()
        : fallbackAnalysis(),
      recalledIncidents: recalled.matches,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Alert simulation failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

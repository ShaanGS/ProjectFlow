import type { ChatInteractionIntent } from "@/types/agent"

const GREETING_RE = /^(hi|hello|hey|yo|sup|thanks|thank you|ok|okay|cool|nice|gm|good morning|good evening)[!. ]*$/i
const INCIDENT_SIGNAL_RE = /\b(incident|outage|degradation|failure|failing|failed|error|errors|timeout|timing out|5xx|4xx|504|503|latency|lag|delayed|stuck|webhook|callback|payment|otp|upload|throttle|severity|sev-|p[0-3])\b/i
const FOLLOWUP_RE = /\b(why|what|which|should|next|skip|avoid|fix|mitigate|resolve|evidence|memory|similar|cause|action|runbook|status update|postmortem)\b/i

export function classifyChatIntent({
  message,
  hasActiveIncident,
}: {
  message: string
  hasActiveIncident: boolean
}): ChatInteractionIntent {
  const text = message.trim()
  if (!text || GREETING_RE.test(text)) return "greeting_or_smalltalk"

  if (hasActiveIncident && FOLLOWUP_RE.test(text)) return "incident_followup"
  if (INCIDENT_SIGNAL_RE.test(text)) return "incident_description"

  return "general_question"
}

export function conversationalResponse(intent: ChatInteractionIntent, hasActiveIncident = false) {
  if (intent === "greeting_or_smalltalk") {
    return hasActiveIncident
      ? "Hi. I can help with this incident, the recalled memory, or next response steps."
      : "Hi. I can help with Kairo setup, incident flow, or memory analysis."
  }

  return hasActiveIncident
    ? "I can help with this incident, memory evidence, or Kairo workflow."
    : "I can help with Kairo setup, incident flow, or memory analysis. For incident analysis, share the vendor and symptom."
}

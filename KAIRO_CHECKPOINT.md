# Kairo Project Checkpoint

## Project Overview

Kairo is a memory-native incident copilot for third-party API/vendor failures.

The product is not a generic status dashboard or uptime monitor. Its core job is to help an on-call engineer answer:

```text
Is this issue on our side, the vendor side, or both?
What happened last time this pattern appeared?
What fixed it fastest?
What should we skip because it wasted time before?
```

The intended demo story:

```text
A production alert fires.
Normally the team wastes 20-40 minutes checking DB, Redis, pods, deploys, etc.
Kairo recalls similar past incidents and identifies the failure boundary:
vendor-side, internal, or mixed.
Then it recommends the fastest next action and what not to debug.
```

Current product positioning:

```text
A memory-native incident copilot for third-party integration failures.
It identifies the fault boundary between internal systems and vendors like Razorpay, MSG91, Cashfree, AWS S3, WhatsApp Cloud API, and Auth0.
```

The project was originally seeded with Stripe/Twilio/AWS/SendGrid style incidents, but has now been optimized for an India demo.

## Workspace

Root workspace:

```text
/Users/shaangurushankar/Documents/genesis hackathon 
```

Actual Next.js app:

```text
/Users/shaangurushankar/Documents/genesis hackathon /Kairo Frontend
```

Important context file:

```text
/Users/shaangurushankar/Documents/genesis hackathon /idea2_full_context.md
```

This markdown file contains the full original product idea and architecture.

## Tech Stack

Frontend:

```text
Next.js 16.2.0
React 19
TypeScript
Tailwind CSS
shadcn/ui-style components
```

Package manager:

```text
pnpm via corepack
```

Backend:

```text
Next.js API routes only
No Express
No FastAPI
No separate server
```

LLM:

```text
Groq API via groq-sdk
Model originally configured as qwen/qwen3-32b
```

Memory:

```text
Hindsight via @vectorize-io/hindsight-client
```

Important correction:

The requested package `@hindsight-so/client` does not exist on npm and returned 404. The installed/current package is:

```text
@vectorize-io/hindsight-client
```

Also, the package named `groq` on npm is Sanity's GROQ query package, not Groq's LLM SDK. So `groq-sdk` was installed for actual Groq chat completions.

Installed relevant dependencies:

```json
"@vectorize-io/hindsight-client": "^0.5.0",
"groq": "^5.20.0",
"groq-sdk": "^1.1.2",
"ai": "^6.0.158"
```

The `groq` package remains installed because it was requested, but actual LLM code uses `groq-sdk`.

## Environment File

Created:

```text
/Users/shaangurushankar/Documents/genesis hackathon /Kairo Frontend/.env.local
```

Current env shape:

```env
GROQ_API_KEY=<real Groq key was added>
HINDSIGHT_API_KEY=your_hindsight_api_key
HINDSIGHT_PIPELINE_ID=your_pipeline_id
```

Important behavior:

Kairo currently works even without Hindsight keys because `lib/hindsight.ts` has a local memory fallback using `data/incidents.json`.

Kairo currently defaults to controlled demo-mode responses instead of raw LLM prose. If someone wants raw LLM answers, add:

```env
KAIRO_DEMO_MODE=llm
```

But for the hackathon demo, keep demo mode unset. It gives clearer, more reliable output.

## How To Run

From app directory:

```bash
cd "/Users/shaangurushankar/Documents/genesis hackathon /Kairo Frontend"
corepack pnpm dev
```

App URL:

```text
http://localhost:3000
```

If sandbox blocks port binding, run with approval/escalation.

## Verification Already Done

TypeScript check passes:

```bash
corepack pnpm exec tsc --noEmit
```

Production build passed with network access:

```bash
corepack pnpm build
```

First build attempt failed only because restricted network blocked Google Fonts from `next/font/google`.

Lint does not currently run because `eslint` is not installed even though package.json has:

```json
"lint": "eslint ."
```

So this fails:

```bash
corepack pnpm lint
```

with:

```text
sh: eslint: command not found
```

## Major Files Added

Backend/data files added:

```text
data/incidents.json
lib/hindsight.ts
lib/groq.ts
lib/llm-output.ts
lib/kairo-brief.ts
app/api/seed/route.ts
app/api/chat/route.ts
app/api/alert/route.ts
app/api/retain/route.ts
app/api/incidents/route.ts
```

Frontend files modified:

```text
app/page.tsx
components/kairo/dashboard-shell.tsx
components/kairo/agent-chat.tsx
components/kairo/right-panel.tsx
components/kairo/pages/live-incidents.tsx
components/kairo/left-nav.tsx
components/kairo/pages/vendors-overview.tsx
components/kairo/pages/vendor-profile.tsx
```

Lock/dependency files modified:

```text
package.json
pnpm-lock.yaml
```

## Data Model

Current incident objects in `data/incidents.json` follow this shape:

```ts
{
  incident_id: string
  title: string
  timestamp_start: string
  timestamp_end: string
  severity: "SEV-1" | "SEV-2"
  customer_impact: string
  vendor: string | null
  region: string
  symptoms: string[]
  actual_root_cause: string
  successful_fix: string
  failed_checks: string[]
  time_to_resolution_minutes: number
  classification: "vendor_side" | "internal" | "mixed"
  embedding_text: string
}
```

Current India-focused seed incidents:

1. Razorpay UPI authorization latency spike - India
2. Razorpay UPI silent degradation - status page green
3. Cashfree payout webhook delay - Bengaluru merchants
4. MSG91 OTP delivery drop - Delhi NCR and Jaipur
5. AWS S3 Mumbai latency spike - ap-south-1
6. WhatsApp Cloud API template delivery delay - India
7. Internal Postgres connection pool exhaustion - Mumbai cluster
8. Auth0 India login latency amplified by weak token cache

The important classification coverage:

```text
vendor_side:
- Razorpay
- Cashfree
- MSG91
- AWS S3
- WhatsApp Cloud API

internal:
- Internal Postgres connection pool exhaustion

mixed:
- Auth0 India login latency + internal token cache miss spike
```

This is important for the demo because it proves Kairo does not always blame the vendor. It can classify the fault boundary.

## Backend API Routes

### POST /api/seed

File:

```text
app/api/seed/route.ts
```

Purpose:

Seeds all incidents from `data/incidents.json` into Hindsight memory.

Behavior:

If Hindsight keys are missing/placeholders, `retainIncident` no-ops with local fallback behavior, so this route does not need to block local demo.

Returns:

```json
{
  "success": true,
  "message": "Seeded 8 incidents to Hindsight"
}
```

### POST /api/chat

File:

```text
app/api/chat/route.ts
```

Input:

```json
{
  "message": "What happened last time Razorpay had 504s?",
  "currentIncident": {}
}
```

Behavior:

1. Builds a recall query from `currentIncident` plus user message.
2. Calls `recallIncidents`.
3. In default demo mode, returns a controlled answer using `buildKairoBrief`.
4. If `KAIRO_DEMO_MODE=llm` is set, calls Groq with memory context.
5. Cleans `<think>...</think>` output using `cleanModelOutput`.

Output:

```json
{
  "response": "chatbot response",
  "memoryMatches": 3,
  "recalledIncidents": []
}
```

Important:

By default, it does not use raw LLM prose even if Groq key exists. This was intentional because Qwen was returning visible `<think>` and rambling paragraphs. Demo mode is clearer.

### POST /api/alert

File:

```text
app/api/alert/route.ts
```

Input:

```json
{
  "index": 0
}
```

Behavior:

Simulates one incident from the hardcoded `SIMULATED_ALERTS` array.

Current simulated alerts rotate through:

1. Razorpay UPI payment timeout - Mumbai and Bengaluru
2. MSG91 OTP delivery drop - Delhi NCR
3. AWS S3 KYC upload failures - Mumbai S3
4. Internal checkout 504s across all payment methods
5. Auth0 login latency with token cache misses

For each alert:

1. Builds query from vendor/region/symptoms.
2. Recalls similar incidents.
3. Uses top memory classification as the new incident classification.
4. Returns a generated/current incident object.
5. Returns memory-grounded analysis.

Output:

```json
{
  "incident": {},
  "memoryMatches": 4,
  "classification": "vendor_side",
  "analysis": "My read: this is most likely on the third-party vendor side...",
  "recalledIncidents": []
}
```

### POST /api/retain

File:

```text
app/api/retain/route.ts
```

Purpose:

Stores a resolved incident into Hindsight memory.

Input:

```json
{
  "incident_id": "inc_x",
  "embedding_text": "...",
  ...
}
```

Output:

```json
{
  "success": true,
  "message": "Incident retained in Hindsight memory"
}
```

Currently there is not yet a full frontend resolution form wired to this route.

### GET /api/incidents

File:

```text
app/api/incidents/route.ts
```

Purpose:

Returns seed incident history from `data/incidents.json`.

Output:

```json
{
  "incidents": [...]
}
```

Used by dashboard on page load to populate resolved incidents table.

## Hindsight Wrapper

File:

```text
lib/hindsight.ts
```

Exports:

```ts
retainIncident(incident)
recallIncidents(query)
default hindsight
```

Uses:

```ts
import { HindsightClient } from "@vectorize-io/hindsight-client"
```

Client setup:

```ts
const hindsight = new HindsightClient({
  baseUrl: process.env.HINDSIGHT_BASE_URL ?? "https://hindsight.vectorize.io",
  apiKey: process.env.HINDSIGHT_API_KEY,
})
```

Important:

`HINDSIGHT_PIPELINE_ID` is treated as the Hindsight bank id.

If Hindsight env vars are missing/placeholders, local fallback is used:

```ts
hasHindsightConfig()
```

Fallback recall:

1. Tokenizes query.
2. Scores incidents by text overlap against:
   - title
   - vendor
   - region
   - symptoms
   - embedding_text
3. Sorts by score.
4. Returns top 4 as `matches`.

This lets the demo work without real Hindsight.

## Groq Wrapper

File:

```text
lib/groq.ts
```

Uses:

```ts
import Groq from "groq-sdk"
```

Exports:

```ts
default groq
hasGroqConfig()
```

`hasGroqConfig()` checks that `GROQ_API_KEY` exists and is not placeholder.

## LLM Output Cleaner

File:

```text
lib/llm-output.ts
```

Purpose:

Remove visible chain-of-thought or code fences from model output.

Function:

```ts
cleanModelOutput(content)
```

Removes:

```text
<think>...</think>
```

and trims output.

This was added because Qwen returned visible `<think>` blocks in the UI.

## Controlled Demo Response Formatter

File:

```text
lib/kairo-brief.ts
```

This is now very important.

Purpose:

Build clear chatbot-style, memory-grounded answers without relying on raw LLM prose.

Exports:

```ts
buildKairoBrief(message, matches)
```

Current output style is conversational:

```text
My read: this is most likely on the third-party vendor side.

Confidence: high, because this matches 3 prior Razorpay incidents with the same symptom pattern.

What memory says:
- 2026-02-03: Razorpay UPI silent degradation - status page green; fixed by fail over UPI and card payments to Cashfree payment route.
- 2026-01-14: Razorpay UPI authorization latency spike - India; fixed by route high-value checkout traffic to Cashfree fallback.

What I would do now: fail over UPI and card payments to Cashfree payment route.
What I would not waste time on: checked internal checkout service, inspected recent deploys, verified DB connections.
```

It handles special user intents:

If message includes `skip`:

```text
Yes. Based on memory, I would skip these first:
- DB connection pool inspection
- Redis failover
- checkout pod restart

Why: these checks wasted time in similar incidents...
Better move: ...
```

If message includes `slack`, `channel`, or `update`:

```text
Incident update draft:
We are investigating ...
Current evidence and prior memory point to the third-party vendor side.
Closest prior incidents: ...
Action: ...
```

It also includes boundary language:

```ts
boundaryLabel(classification)
```

Mappings:

```text
vendor_side -> third-party vendor side
internal -> internal app/database side
mixed -> mixed: vendor issue amplified by our system
unknown -> unknown boundary
```

## Frontend Wiring

### app/page.tsx

Now a client component.

On first load:

```ts
useEffect(() => {
  const seeded = localStorage.getItem("kairo_seeded")
  if (!seeded) {
    fetch("/api/seed", { method: "POST" })
      .then(() => localStorage.setItem("kairo_seeded", "true"))
      .catch(console.error)
  }
}, [])
```

This auto-seeds once per browser.

If the seed failed previously due to missing Hindsight config, local fallback now avoids blocking. If needed, clear localStorage key:

```js
localStorage.removeItem("kairo_seeded")
```

### components/kairo/dashboard-shell.tsx

Now owns app state:

```ts
activeIncidents
resolvedIncidents
activeIncident
simulationCounter
isSimulating
agentMessage
```

On mount:

```ts
GET /api/incidents
```

Maps seed data into resolved incidents table.

Simulate button:

```ts
POST /api/alert
body: { index: simulationCounter }
```

Then:

1. Adds returned incident to active incident list.
2. Sets `activeIncident`.
3. Injects `analysis` into chat panel.
4. Increments simulation counter.

Current top button:

```text
Simulate Incident
```

### components/kairo/pages/live-incidents.tsx

Previously had hardcoded active/resolved incident arrays. Now receives:

```ts
activeIncidents
resolvedIncidents
```

Displays:

```text
Memory recall hits = sum of active incident memoryMatches
Resolved incidents = from /api/incidents
Active incidents = from simulated alerts
```

### components/kairo/right-panel.tsx

Now passes props into chat:

```tsx
<AgentChat activeIncident={activeIncident} injectedMessage={injectedMessage} />
```

### components/kairo/agent-chat.tsx

Previously fully mocked.

Now:

1. Sends user messages to `/api/chat`.
2. Includes active incident as context.
3. Accepts injected assistant messages from simulated incidents.
4. Renders messages with:

```css
whitespace-pre-wrap
```

This was added because line breaks were collapsing into one unreadable paragraph.

Important user-visible fix:

The chat now displays structured multiline responses properly.

### components/kairo/left-nav.tsx

Vendor nav changed from:

```text
Stripe
Twilio
AWS S3
SendGrid
```

to:

```text
Razorpay
MSG91
AWS S3
Cashfree
```

### components/kairo/pages/vendors-overview.tsx

Vendor cards changed to India-relevant vendors:

```text
Razorpay
MSG91
AWS S3
Cashfree
```

### components/kairo/pages/vendor-profile.tsx

Vendor profile keys updated:

```ts
razorpay
msg91
aws-s3
cashfree
```

Fallback vendor is now:

```ts
vendorData.razorpay
```

Visible profile data was changed to India examples:

- UPI acquiring-bank route instability
- DLT delivery delay
- Mumbai S3 latency spike
- Cashfree payout webhook backlog

## Current Demo Flow

Recommended judge demo flow:

1. Open:

```text
http://localhost:3000
```

2. Click:

```text
Simulate Incident
```

First incident should be Razorpay/UPI India-West.

3. Ask:

```text
Which side is the problem on?
```

Expected answer:

```text
My read: this is most likely on the third-party vendor side.
```

It should mention Razorpay memory and Cashfree failover.

4. Ask:

```text
What should I not waste time checking?
```

Expected:

```text
DB connection pool inspection
Redis failover
checkout pod restart
checked internal checkout service
inspected recent deploys
verified DB connections
```

5. Ask:

```text
Give me an update for the incident channel.
```

Expected:

```text
Incident update draft:
We are investigating checkout payment failures...
Current evidence and prior memory point to the third-party vendor side...
Action: fail over to Cashfree...
```

6. Click `Simulate Incident` a few more times to rotate scenarios.

The key thing to show judges:

```text
Kairo does not always say vendor-side.
```

The simulated sequence includes:

- Razorpay = vendor_side
- MSG91 = vendor_side
- AWS S3 Mumbai = vendor_side
- Internal Postgres = internal
- Auth0 + token cache = mixed

Use this exact verbal framing:

```text
Kairo is identifying the fault boundary. It tells us whether the failure is on our side, the vendor side, or mixed. It is not just checking a status page.
```

## Known Visual/Browser Issue

The user posted screenshots where text/UI appears heavily corrupted/overlapped.

Likely causes:

- Browser rendering glitch
- DevTools overlay/rendering issue
- Zoom not at 100%
- GPU/compositing issue
- Possibly browser extension or responsive zoom issue

Suggested quick fixes:

- Hard refresh
- Close DevTools
- Set browser zoom to 100%
- Try Chrome if using Arc/Safari
- Restart dev server
- Use a clean browser profile/window for judging

No code-level fix has been made for this because it appears rendering/environment-related, not backend logic.

## Current Dev Server

At last check, dev server was running under session id `67093`, serving:

```text
http://localhost:3000
```

If needed, restart:

```bash
corepack pnpm dev
```

## Important Design/Product Decisions Made

1. Local fallback memory was added because Hindsight keys were not yet configured.
2. Raw LLM output is disabled by default for demo reliability.
3. Groq key is present, but default endpoint uses `buildKairoBrief` unless:

```env
KAIRO_DEMO_MODE=llm
```

4. This is intentional. Raw Qwen output produced visible `<think>` and unstructured paragraphs, which is bad for judging.
5. The product should demonstrate decision support and boundary detection, not generic chatbot behavior.

## What Still Needs Work

High priority:

1. Make active incident count in left nav dynamic.

Currently in `DashboardShell`, `LeftNav` still gets:

```tsx
incidentCount={2}
```

Should become:

```tsx
incidentCount={activeIncidents.length}
```

2. Improve active incident detail UX.

Right now clicking row does not open details. The chat knows activeIncident only after simulation.

3. Add visual boundary badge on active incident rows:

- Vendor-side
- Internal
- Mixed

4. Add a small Fault Boundary panel/card:

Example:

```text
Fault boundary: Vendor-side
Likely owner: Razorpay UPI/acquiring-bank route
Internal systems: healthy
Recommended move: fail over to Cashfree
```

This would make the core product clearer than chat alone.

5. Add demo reset button or clear active incidents.

Currently repeated simulation adds many rows.

6. Improve the local recall scoring.

Current fallback is basic token overlap. It works for demo but can produce loose matches.

7. Add frontend resolution/retain form.

Backend route exists: `/api/retain`, but no full UI form is wired.

8. Add Hindsight credentials and test real recall.

Current demo works without Hindsight.

9. If using Groq raw LLM mode, switch to a model less likely to emit `<think>`, or enforce no-reasoning output harder.

Potential model/prompt fix:

- Use Llama-style model if available in Groq.
- Keep `/no_think`.
- Keep `cleanModelOutput`.

## Suggested Next Task For Another AI

If handing off to another AI, ask it to do this:

```text
Continue from the current Kairo Next.js codebase.

Goal: make the judge demo clearly show fault-boundary detection for India-specific incidents.

Do not change the whole UI. Add focused improvements:
1. Make left-nav live incident count dynamic.
2. Add a visible boundary badge to live incident rows: vendor_side/internal/mixed.
3. Add a top Fault Boundary card on the Live Incidents page when there is an active incident, showing:
   - Boundary: Vendor-side/Internal/Mixed
   - Likely owner: vendor or internal subsystem
   - Why: 1 sentence from memory
   - Recommended action
   - Skip
4. Keep the existing API routes.
5. Keep demo-mode deterministic answers from lib/kairo-brief.ts.
6. Keep India-focused vendors and incidents.
7. Run `corepack pnpm exec tsc --noEmit`.
```

## File References For Handoff

Backend:

```text
/Users/shaangurushankar/Documents/genesis hackathon /Kairo Frontend/data/incidents.json
/Users/shaangurushankar/Documents/genesis hackathon /Kairo Frontend/lib/hindsight.ts
/Users/shaangurushankar/Documents/genesis hackathon /Kairo Frontend/lib/groq.ts
/Users/shaangurushankar/Documents/genesis hackathon /Kairo Frontend/lib/llm-output.ts
/Users/shaangurushankar/Documents/genesis hackathon /Kairo Frontend/lib/kairo-brief.ts
/Users/shaangurushankar/Documents/genesis hackathon /Kairo Frontend/app/api/chat/route.ts
/Users/shaangurushankar/Documents/genesis hackathon /Kairo Frontend/app/api/alert/route.ts
/Users/shaangurushankar/Documents/genesis hackathon /Kairo Frontend/app/api/seed/route.ts
/Users/shaangurushankar/Documents/genesis hackathon /Kairo Frontend/app/api/retain/route.ts
/Users/shaangurushankar/Documents/genesis hackathon /Kairo Frontend/app/api/incidents/route.ts
```

Frontend:

```text
/Users/shaangurushankar/Documents/genesis hackathon /Kairo Frontend/app/page.tsx
/Users/shaangurushankar/Documents/genesis hackathon /Kairo Frontend/components/kairo/dashboard-shell.tsx
/Users/shaangurushankar/Documents/genesis hackathon /Kairo Frontend/components/kairo/agent-chat.tsx
/Users/shaangurushankar/Documents/genesis hackathon /Kairo Frontend/components/kairo/right-panel.tsx
/Users/shaangurushankar/Documents/genesis hackathon /Kairo Frontend/components/kairo/pages/live-incidents.tsx
/Users/shaangurushankar/Documents/genesis hackathon /Kairo Frontend/components/kairo/left-nav.tsx
/Users/shaangurushankar/Documents/genesis hackathon /Kairo Frontend/components/kairo/pages/vendors-overview.tsx
/Users/shaangurushankar/Documents/genesis hackathon /Kairo Frontend/components/kairo/pages/vendor-profile.tsx
```

## One-Line Current State

Kairo is now a working Next.js demo app with API routes, India-specific synthetic incident memory, local Hindsight fallback, Groq configured, deterministic memory-grounded chatbot responses, and simulated incident flow that can classify vendor-side/internal/mixed outage boundaries.


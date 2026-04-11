# Idea 2 Full Build Context

## Project identity

**Working idea:** a memory-powered incident copilot for third-party integrations.

This product is **not** a generic uptime monitor and **not** a simple alerting bot. The core problem is that when a payment provider, auth vendor, messaging API, cloud dependency, or external service starts degrading, internal teams usually waste the first 20–40 minutes debugging the wrong layer. The product exists to reduce that wasted time by remembering what similar incidents looked like before, what signals actually mattered, what fixes worked, and what paths turned out to be dead ends.[cite:57][cite:58][cite:74]

The strongest product framing is:

> "An incident copilot that remembers third-party failures, identifies likely vendor-side patterns, and recommends the fastest next action."

Good categories for the product:
- Third-party incident intelligence
- Vendor outage memory
- Dependency-aware incident copilot
- MTTR reduction for external-service failures

## One-line pitch

A memory-native incident copilot that helps engineering teams stop debugging the wrong thing during Stripe, Twilio, Auth, cloud, and vendor outages by recalling similar incidents, likely root causes, and the fixes that worked fastest before.[cite:57][cite:63][cite:79]

## Why this idea exists

Modern products depend on a stack of external services: payments, identity, email, SMS, storage, CDN, cloud regions, analytics, and deployment platforms. When one of these starts failing, the internal team often cannot tell whether the issue is in their code, in a vendor, or in the interaction between both systems.[cite:134][cite:74]

The pain is not just detection. Teams already have alerts. The pain is:
- misclassification,
- wasted triage time,
- repeated investigation of known patterns,
- poor incident handoffs,
- and forgotten remediation knowledge from prior outages.[cite:57][cite:58][cite:63]

This is why memory matters. A stateless system sees only the current symptom. A memory-enabled system can say:
- this symptom pattern matches two previous Stripe regional issues,
- internal database and app latency were normal both times,
- the team lost 30 minutes checking irrelevant systems,
- failover and customer comms reduced impact fastest last time.[cite:74][cite:79]

## Core business problem

Third-party outages create a specific operational tax:
- engineers burn time isolating blame,
- incident managers lose time coordinating,
- on-call teams investigate the wrong subsystems,
- and customer-facing teams wait too long for a confident answer.[cite:57][cite:58][cite:65]

The product does **not** replace engineers. It reduces the search space and speeds up the first correct move. That is the real value proposition.[cite:57][cite:63]

## Product positioning

### Bad positioning
- "AI agent that tells you when Stripe is down"
- "Outage alert bot for third-party apps"
- "Vendor status monitor"

These are weak because they sound like a wrapper around existing status pages or alert feeds.[cite:74][cite:128]

### Strong positioning
- "An incident copilot that prevents teams from debugging the wrong layer"
- "A memory system for third-party failures and dependency incidents"
- "A vendor-fingerprinting agent that recognizes failure patterns before humans waste time"

This works because the product now clearly sits in the triage and decision-support layer, not in raw monitoring.[cite:57][cite:79]

## Exact scope for hackathon

Keep the project narrow. The brief explicitly says a polished agent that does one thing brilliantly beats a sprawling prototype, and it encourages realistic synthetic data when real data is hard to obtain.[cite:2]

### Best v1 scope
Build only for:
- 1 customer app,
- 4 to 6 third-party services,
- 3 to 5 recurring incident patterns,
- one main workflow: incoming alert -> memory recall -> likely cause -> recommended next action -> resolution write-back.[cite:2]

### Recommended service set
Use vendors that make immediate business sense:
- Stripe for payments
- Twilio or SendGrid for messaging/notifications
- Auth0 or Okta for authentication
- AWS for cloud dependencies
- GitHub or Vercel for developer/productivity infrastructure
- Cloudflare as an optional edge/network dependency

This gives you enough diversity without making the system messy.[cite:134][cite:155][cite:162]

## Product outcome

The product should answer these questions very quickly:
- Is this likely vendor-side or internal?
- Which vendor is most likely involved?
- What past incidents look similar?
- What actions worked last time?
- What should be checked first now?
- What should be skipped because it wasted time before?
- What update should be posted to the incident channel right now?

If the product can answer those, it is already valuable.

## What the agent actually does

### Main responsibilities

1. **Ingests an incident signal**
   - alert payload,
   - app metrics,
   - error logs,
   - service tags,
   - vendor status snippets.

2. **Builds the incident context**
   - what service failed,
   - what changed,
   - which dependency path is involved,
   - what user-facing impact is visible.

3. **Queries memory**
   - retrieves similar incidents,
   - finds similar vendor patterns,
   - surfaces previous successful remediations,
   - recalls previous false leads.

4. **Performs triage reasoning**
   - likely internal,
   - likely third-party,
   - likely mixed,
   - confidence score or confidence band.

5. **Recommends next actions**
   - what to check first,
   - whether to fail over,
   - whether to switch fallback provider,
   - whether to freeze deploys,
   - whether to notify support/customer-facing teams.

6. **Supports incident comms**
   - drafts Slack update,
   - drafts internal incident summary,
   - logs timeline notes.

7. **Learns after resolution**
   - stores final root cause,
   - stores successful mitigation,
   - stores time-to-resolution,
   - stores what was misleading.

This final write-back loop is what makes the agent visibly improve over time, which the hackathon explicitly wants.[cite:2]

## The memory thesis

The strongest version of this project is not a generic AI chatbot over logs. It is a system with **episodic operational memory**.

Each incident becomes a memory episode containing:
- symptom pattern,
- dependency path,
- internal state,
- vendor state,
- human decisions,
- successful fix,
- failed attempts,
- and postmortem lessons.[cite:136][cite:133]

When the next incident appears, the system is not just "searching." It is recalling operational episodes and using them to shape the next decision. This is exactly the kind of before/after memory story that judges will understand immediately.[cite:2]

## User persona

Primary user:
- on-call engineer,
- incident commander,
- SRE,
- platform engineer,
- startup CTO.

Secondary users:
- support lead,
- engineering manager,
- product operations,
- customer success during incident comms.

## Real startup narrative

This should be pitched like a startup, not a college hack. A strong story is:

"Every SaaS company depends on external vendors. When checkout, auth, messaging, or cloud dependencies start failing, teams spend the first half hour asking the wrong question: ‘Is it us?’ This product shrinks that uncertainty window by remembering how similar third-party failures looked before and what action worked fastest."

That sounds much stronger than "we monitor third-party outages."

## Complete user workflow

### Workflow 1: live incident triage
1. Alert enters the system.
2. Agent extracts the key symptom signature.
3. Agent identifies affected internal service and dependency path.
4. Agent queries Hindsight for similar prior incidents.
5. Agent fetches any available vendor status data.
6. Agent combines current evidence + memory + vendor context.
7. Agent returns:
   - likely cause classification,
   - top similar incidents,
   - ranked next steps,
   - suggested incident-channel update.
8. Human takes action.
9. At resolution, the final outcome is written back to memory.

### Workflow 2: postmortem learning
1. Incident gets resolved.
2. Team records final timeline, root cause, failed attempts, and what worked.
3. Agent summarizes the incident.
4. Agent stores a clean memory episode.
5. Future incidents can now benefit from it.

### Workflow 3: incident review
1. Engineering lead asks: "Show all vendor-caused payment incidents from the last 90 days."
2. Agent groups related episodes.
3. Agent identifies repeated vendor patterns, recurring false leads, and fix effectiveness.
4. Team uses this to improve fallback logic or vendor strategy.

## Core UX surfaces

### Dashboard
Should show:
- incoming incidents,
- current severity,
- likely affected dependency,
- top recalled incidents,
- recommended next steps,
- vendor health feed,
- write-back / resolution form.

### Incident detail panel
Should show:
- current symptom summary,
- likely classification,
- confidence,
- evidence map,
- matching past incidents,
- timeline of current incident,
- draft Slack update.

### Memory explorer
Should show:
- prior incidents,
- filters by vendor/service/region,
- fix success rates,
- repeated root-cause clusters,
- common dead-end checks.

### Post-resolution panel
Should show:
- final diagnosis,
- actions attempted,
- action that worked,
- time saved estimate,
- button to retain in Hindsight.

## Recommended tech stack

### Frontend
- Next.js
- Tailwind CSS
- shadcn/ui
- optional Recharts for tiny trend charts

Reason: fast team velocity, clean dashboard UI, easy API integration, easy deployment.

### Backend
Choose one:
- Next.js API routes if your team wants one codebase
- FastAPI if your team prefers Python for data processing and memory orchestration

### LLM layer
- Groq
- model options recommended in the hackathon brief: `openai/gpt-oss-120b` and `qwen/qwen3-32b`.[cite:2]

### Memory layer
- Hindsight Cloud for speed during hackathon
- open-source Hindsight only if someone on the team is comfortable managing infra quickly.[cite:2]

### Data layer
- JSON or simple Postgres/Supabase for static incident datasets and demo history
- avoid overengineering

### Deployment
- Vercel for frontend/API if using Next.js
- Render/Railway/Fly only if using separate Python backend

### Observability for demo
No need for real Datadog/New Relic integrations in v1. Simulated alerts are enough if the data is realistic, which the brief explicitly allows.[cite:2]

## System architecture

```text
[Simulated alert feed / webhook]
            |
            v
 [Incident parser + normalizer]
            |
            +--------------------------+
            |                          |
            v                          v
   [Hindsight recall]          [Vendor status fetch / mock feed]
            |                          |
            +------------+-------------+
                         |
                         v
                 [LLM reasoning layer]
                         |
       +-----------------+------------------+
       |                 |                  |
       v                 v                  v
[Likely cause]   [Next actions]   [Incident update draft]
       |
       v
[Human response + resolution write-back]
       |
       v
 [Hindsight retain]
```

## Suggested folder structure

```text
app/
  dashboard/
  api/alert/
  api/resolve/
  api/retain/
components/
  alert-feed.tsx
  incident-card.tsx
  memory-matches.tsx
  recommendation-panel.tsx
  vendor-status-strip.tsx
  resolution-form.tsx
lib/
  hindsight.ts
  groq.ts
  incident-normalizer.ts
  classifiers.ts
  prompts.ts
data/
  incidents.json
  vendors.json
  status_snapshots.json
  synthetic_logs/
```

## Complete data model

Your agent needs a structured memory schema.

### Incident record schema

```json
{
  "incident_id": "inc_104",
  "title": "Stripe EU-West payment authorization latency spike",
  "timestamp_start": "2026-02-12T10:14:00Z",
  "timestamp_end": "2026-02-12T10:41:00Z",
  "severity": "SEV-1",
  "customer_impact": "42% payment failures on checkout",
  "internal_service": "checkout-api",
  "dependency_path": ["checkout-api", "payment-service", "Stripe API"],
  "vendor": "Stripe",
  "vendor_service": "Payments API",
  "region": "eu-west",
  "symptoms": [
    "elevated 504 timeouts",
    "payment authorization failure spike",
    "normal DB latency",
    "normal Redis latency"
  ],
  "internal_metrics": {
    "db_p95_ms": 34,
    "redis_p95_ms": 12,
    "checkout_error_rate": 0.42
  },
  "vendor_status_updates": [
    "10:20 investigating elevated API latency in EU",
    "10:28 identified issue in upstream processing path"
  ],
  "initial_hypothesis": "internal checkout regression",
  "actual_root_cause": "vendor-side regional degradation",
  "mitigations_attempted": [
    "restarted checkout pods",
    "increased timeout threshold",
    "failed over payment routing"
  ],
  "successful_fix": "reroute payment traffic to alternate region/provider path",
  "failed_checks": [
    "DB connection pool inspection",
    "Redis failover verification"
  ],
  "time_to_resolution_minutes": 27,
  "tags": ["vendor_side", "payments", "stripe", "regional"],
  "embedding_text": "SEV-1 checkout failure with Stripe EU-West latency spike causing payment timeouts while internal DB and Redis remained healthy. Final cause was vendor-side regional degradation. Successful action was payment failover."
}
```

### Vendor snapshot schema

```json
{
  "vendor": "Twilio",
  "service": "Programmable SMS",
  "timestamp": "2026-01-08T11:05:00Z",
  "status": "investigating",
  "region": "us-east",
  "message": "Delays affecting outbound SMS delivery in selected US carriers"
}
```

### Alert payload schema

```json
{
  "alert_id": "alert_221",
  "service": "notification-api",
  "severity": "critical",
  "timestamp": "2026-04-11T08:11:00Z",
  "symptoms": [
    "SMS delivery success dropped to 51%",
    "callback latency > 15s",
    "API retries increasing"
  ],
  "logs": [
    "Twilio callback timeout",
    "delivery status delayed",
    "internal queue healthy"
  ]
}
```

## Data sources for seed dataset

### Public sources
- public status-page APIs and history pages from GitHub, Twilio, SendGrid, and other providers can supply incident timelines and statuses.[cite:152][cite:155][cite:162]
- AWS Health dashboard materials provide service and event context for cloud-related dependency issues.[cite:151]
- public postmortems such as Twilio engineering writeups and the `danluu/post-mortems` collection provide realistic root-cause structures and operational lessons.[cite:125][cite:126]
- Rootly AI Labs provides a public logs dataset useful for AI-powered incident management experiments.[cite:139]

### Synthetic data
The hackathon brief explicitly encourages realistic synthetic data when real data is difficult to get.[cite:2]

Use synthetic expansions for:
- application-specific metrics,
- your own internal service names,
- customer-facing impact text,
- realistic log snippets,
- failed mitigations,
- and fake but believable vendor interaction patterns.

## How many records to create

### Recommended dataset size for demo
- 40 to 60 fully structured incidents is enough for a strong demo
- 80 to 150 is excellent if the team can generate and normalize quickly

Quality matters more than size.

### Minimum coverage matrix
Cover at least:
- 10 payment incidents
- 10 auth incidents
- 10 messaging incidents
- 10 cloud/deployment incidents
- 5 false alarms / internal-only incidents
- 5 mixed incidents where vendor issue + internal weakness both matter

## Classification framework

Each incident should be labeled as one of:
- `vendor_side`
- `internal`
- `mixed`
- `unknown`

This allows the agent to do a meaningful first-pass triage, not just retrieve text.

## Retrieval strategy

At query time, the system should retrieve by a combination of:
- vendor name,
- error signature,
- affected service,
- region,
- symptom cluster,
- severity,
- customer impact,
- and dependency path.

The strongest retrieval result is not necessarily the same vendor only. Sometimes a similar pattern across different vendors can still be useful, like auth callback delays, webhook queue drift, or regional edge latency.

## What the LLM prompt should do

The LLM should **not hallucinate root causes**. It should be instructed to:
- use current evidence,
- use retrieved incidents,
- separate evidence from inference,
- rank likely causes,
- explain why a suggestion is being made,
- suggest next actions in order,
- and mention uncertainty when confidence is low.

### Prompt goals
Ask the model to produce:
1. likely classification: internal / vendor / mixed
2. top suspected vendor or subsystem
3. evidence from current incident
4. relevant prior incidents from memory
5. top 3 next checks
6. suggested mitigation
7. one Slack-ready incident update

## What the product is **not**

- not a replacement for Datadog/New Relic/Grafana
- not a generic chatbot over logs
- not a pure vendor status dashboard
- not a root-cause oracle
- not a fully autonomous remediation bot

This keeps expectations realistic and makes the demo stronger.

## Best demo story

The brief says to tell a story and make the value obvious within 60 seconds.[cite:2]

### Demo scenario
Use a fake e-commerce platform.

Dependencies:
- Stripe for payments
- Twilio for SMS OTP
- Auth0 for login
- AWS for infra

#### Scene 1: the pain
A critical checkout alert fires. Team sees rising 504s and payment failures.

#### Scene 2: without memory
A generic assistant suggests checking database connections, restarting services, reviewing deployments, and inspecting cache.

#### Scene 3: with memory
Your product says:
- this pattern matches two prior incidents,
- internal DB and cache remained healthy in both,
- likely vendor-side Stripe regional degradation,
- prior fastest mitigation was traffic reroute and customer comms,
- here is a draft incident update.

#### Scene 4: learning
After the fix, the operator marks the incident as resolved and stores the outcome. On the next similar incident, the recommendation becomes sharper.

That gives you a visible before/after learning curve, which is exactly what the hackathon wants.[cite:2]

## UI blocks to build first

1. top alert strip
2. incident summary card
3. memory matches panel
4. likely cause card
5. ranked actions card
6. vendor status panel
7. incident update draft box
8. resolution + retain form

Do not build anything else until these work.

## Necessary features for v1

### Must-have
- synthetic alert ingestion
- memory recall from Hindsight
- LLM reasoning over retrieved incidents
- top similar incidents display
- ranked next actions
- resolution write-back to Hindsight

### Nice-to-have
- confidence scoring
- tiny vendor timeline chart
- saved incident reports
- filterable incident explorer

### Avoid for hackathon
- live integrations to every real vendor
- autonomous remediation execution
- complex RBAC/auth
- billing
- multi-tenant architecture
- mobile app

## Team split for six people

### Person 1: Hindsight integration
- incident retain
- incident recall
- memory formatting

### Person 2: LLM orchestration
- Groq integration
- prompting
- reasoning output schema

### Person 3: synthetic dataset
- generate incidents
- normalize JSON
- create vendor snapshots and logs

### Person 4: frontend dashboard
- main UI
- incident details
- memory cards

### Person 5: frontend polish + storytelling
- dashboard flow
- demo-specific UX
- resolution flow

### Person 6: repo, content, integration
- README
- architecture diagram
- article/social drafts
- final QA

## API endpoints to create

### `POST /api/alert`
Input: simulated alert payload
Output:
- parsed incident summary
- memory recalls
- recommended actions
- draft update

### `POST /api/retain`
Input: resolved incident object
Output:
- success status
- retained memory id

### `GET /api/incidents`
Returns demo incident history.

### `GET /api/vendors`
Returns vendor snapshot and status data.

## Internal logic modules

### incident normalizer
Converts noisy alerts/logs into a normalized incident context.

### memory retriever
Queries Hindsight with symptom and dependency cues.

### vendor enricher
Attaches current or mocked vendor status context.

### reasoning engine
Generates triage output and recommended actions.

### resolution writer
Stores final lessons after the incident ends.

## Example reasoning output schema

```json
{
  "classification": "vendor_side",
  "confidence": 0.82,
  "suspected_vendor": "Stripe",
  "evidence": [
    "payment timeouts rising while internal DB latency remains healthy",
    "similar signature matched 2 prior Stripe incidents",
    "vendor status snapshot shows elevated EU processing latency"
  ],
  "next_actions": [
    "pause DB deep-dive unless internal latency changes",
    "switch traffic to alternate payment route",
    "post customer-impact update in incident channel"
  ],
  "draft_update": "Investigating elevated checkout failures. Current evidence points to a likely external payment-provider issue rather than internal database degradation. Failover path under evaluation."
}
```

## Evaluation criteria for your own demo

Your system succeeds if, during demo, judges can instantly see:
- current alert,
- retrieved relevant history,
- stronger diagnosis because of memory,
- clear next action,
- and learning after resolution.[cite:2]

If the audience cannot tell where memory changed the answer, the project is not yet good enough.

## Risks and flaws

### Risk 1: it becomes just a fancy status page
Fix: always show internal evidence + prior incidents + recommended action, not just vendor status.

### Risk 2: it looks like generic incident response
Fix: heavily emphasize dependency path and vendor behavior memory.

### Risk 3: the data feels fake
Fix: use realistic logs, human-sounding postmortem summaries, real vendor names, and plausible timelines.[cite:2][cite:125][cite:126]

### Risk 4: the system sounds overconfident
Fix: show confidence bands and alternative hypotheses.

### Risk 5: retrieval is weak
Fix: store structured summaries plus concise embedding text, and split large incidents into smaller memory units.

## Strong naming guidance

Since the product does not need a literal name, choose a name that feels brandable, short, and human. It does not need to reference incidents directly.

## What to tell Cursor at the top

Use this exact framing when prompting Cursor:

> Build a polished web app called [NAME], a memory-native incident copilot for third-party integrations. It helps engineering teams identify whether a production issue is internal or caused by a vendor like Stripe, Twilio, Auth0, or AWS. The app should ingest simulated alerts, retrieve similar incidents from Hindsight memory, reason over current evidence plus prior incidents, recommend the next best actions, draft an incident-channel update, and retain the final resolution so the system improves over time. The product is not a generic status monitor; it is a decision-support layer that reduces MTTR by preventing teams from debugging the wrong layer first.

## What to tell Cursor about design

> Design this like a modern B2B operations product. Dark mode first. The UI should feel sharp, credible, and operational, not cyberpunk. Use a dashboard layout with strong hierarchy: current alert, likely cause, memory matches, next steps, vendor context, and resolution write-back. The most important goal is to make the memory effect visually obvious.

## What to tell Cursor about implementation priorities

> Prioritize the end-to-end flow before polish: alert in, recall memory, generate triage, show next steps, retain resolution. Use mocked data first. Keep all logic modular so Hindsight and Groq integrations can be swapped if needed. Avoid adding extra features unless they strengthen the main memory narrative.

## Final product truth

If built correctly, this project is not "an AI that tells you Stripe is down."

It is:
- a memory system for vendor-related incidents,
- a triage accelerator,
- a decision-support layer for on-call teams,
- and a startup-shaped product because it reduces a recurring, expensive operational problem.[cite:57][cite:58][cite:79]

That is the correct mental model for the build.

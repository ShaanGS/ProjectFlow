# Demo Script

## Overview

Kairo proves that incident response can be memory-native: the product recalls similar past incidents, explains what worked, highlights checks to skip, reasons over evidence, and writes the new resolution back into future memory.

## Prerequisites

- Run `npm install`.
- Run `npm run dev`.
- Open `http://localhost:3000`.
- Optional: run `curl http://localhost:3000/api/health` before the demo.

## Step-By-Step Flow

### Step 1: Open The Dashboard

What to click or trigger: open `http://localhost:3000`.

What the audience will see: the original Kairo dashboard shell with Live Incidents, Vendor Profiles, Memory Log, Pattern Rules, the right-side memory/agent panel, and a `Simulate Incident` button.

What this proves technically: the active UI shell is intact and the page can bootstrap the canonical seed dataset through `/api/seed`.

Backup action if it fails: refresh the browser and run `npm run dev` again. Check `/api/health` for dataset/retrieval status.

### Step 2: Simulate An Incident

What to click or trigger: click `Simulate Incident`.

What the audience will see: a live incident row appears, the top metrics update, and the active incident banner shows the incident title, vendor, and severity.

What this proves technically: `/api/alert` created a current incident from canonical memory and the dashboard state reacted without a reload.

Backup action if it fails: click `Simulate Incident` again. If a red fallback appears, explain that the UI caught the failed step and remains usable.

### Step 3: Show Episodic Memory

What to click or trigger: look at the right-side Episodic Memory panel.

What the audience will see: recalled incidents with vendor, title, fix, skipped checks, and similarity score.

What this proves technically: `/api/incidents` and `lib/retrieval` found similar historical incidents and returned structured metadata for the UI.

Backup action if it fails: select the active incident row to trigger retrieval again.

### Step 4: Show Agent Reasoning

What to click or trigger: look at the Kairo Agent panel.

What the audience will see: structured diagnosis, likely cause, recommended next action, checks to skip, uncertainty, and memory references.

What this proves technically: `/api/chat` produced retrieval-grounded structured reasoning from the active incident and memory matches.

Backup action if it fails: ask a short follow-up in the agent input or click the incident row again. The panel should show an analysis fallback instead of going blank.

### Step 5: Resolve The Incident

What to click or trigger: click `Resolve` on the live incident row.

What the audience will see: the incident moves to resolved and the agent panel shows `WRITE_BACK_COMPLETE`.

What this proves technically: `/api/resolve` stored the resolution through the canonical retention path and made it eligible for later retrieval.

Backup action if it fails: the UI shows `resolve failed`. The demo can continue by clicking `Simulate Incident` again.

### Step 6: Repeat The Loop

What to click or trigger: click `Simulate Incident` again after resolving.

What the audience will see: a new active incident starts with fresh memory and fresh reasoning. Repeat this at least three times.

What this proves technically: stale state from prior runs does not block the next incident lifecycle.

Backup action if it fails: refresh the browser. The seeded memory remains available from `data/incidents-seed.json`.

## Non-Technical Architecture Explanation

Kairo works like an incident response teammate with a memory: it compares the current outage to prior outages, recommends what worked before, warns what wasted time, and learns from the final resolution.

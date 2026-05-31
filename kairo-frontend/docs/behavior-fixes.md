# Behavior Fixes

## Scope

This pass keeps the current dashboard and Kairo Console layout intact. It only changes interaction behavior and rendering rules so Kairo does not force every chat message through incident analysis.

## Input intent classification

`/api/chat` now classifies the latest user message before running structured incident reasoning:

- `greeting_or_smalltalk`: returns a conversational response with no memory retrieval and no report.
- `general_question`: returns a normal guidance response with no report.
- `incident_description`: runs structured incident analysis using the provided incident-like text.
- `incident_followup`: uses the active incident and current recalled memory when available.

The classifier is intentionally conservative. Without an active incident, a message must contain incident signals such as timeout, degradation, failure, delayed webhook, payment issue, severity, or similar operational language before Kairo renders an incident report.

## Structured report gating

The console only renders the Incident Intelligence Report when the assistant response includes structured analysis. Casual messages and general questions remain plain chat bubbles.

The reasoning pipeline is also hidden unless an analysis response or reasoning stages exist.

## Live versus history clarity

The dashboard now labels the operational list as `live incident queue`.

Seeded and retained records are shown under `memory corpus / resolved history`, and historical seed rows use `Memory` status instead of appearing like active leftovers.

## Similarity and confidence calibration

The retrieval score cap was lowered from `0.99` to `0.88` to avoid repeated fake-looking `99%` matches from lexical scoring.

UI surfaces now display evidence strength labels such as `strong`, `moderate`, or `weak` instead of pretending the score is model-derived confidence.

## Empty and no-context behavior

When no active incident exists:

- Kairo stays conversational.
- The memory explorer remains idle if no memory is recalled.
- Resolving an incident clears active memory and reasoning state so stale analysis does not persist into the next interaction.

## Preserved flows

- Simulate incident
- Memory retrieval
- Structured reasoning for real incident context
- Follow-up reasoning on active incidents
- Resolve and write-back
- Postmortem export

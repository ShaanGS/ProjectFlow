# Layout Refactor Notes

## What changed

- The right-side panel is now a compact Intelligence Rail instead of a full chat and memory workspace.
- Deep Kairo interaction moved into a dedicated Kairo Console overlay.
- The Kairo Console contains the full incident intelligence report, chat thread, reasoning stages, export postmortem action, and memory explorer.
- Full memory exploration moved out of the rail into the console with a relationship-map style view and selected memory detail card.
- The main incident workspace now shows incident priority as `P0`, `P1`, `P2`, or `P3`.

## Why

The previous layout placed episodic memory, memory graph, selected memory detail, agent summary, export action, model selector, and chat input in one narrow sidebar. That made critical workflows cramped and pushed chat below the fold.

The new structure separates responsibilities:

- Left navigation: app/page navigation and global context.
- Center workspace: active incident operations, KPIs, queue, status, priority, resolve flow.
- Right rail: compact intelligence preview only.
- Kairo Console: expanded AI operations workspace for reasoning, follow-up chat, evidence inspection, and export.

## Priority mapping

The UI maps severity into operational priority without changing backend contracts:

- `SEV-1` or `critical` -> `P0`
- `SEV-2` or `warning` -> `P1`
- `SEV-3` -> `P2`
- anything else -> `P3`

## Backend impact

No backend API contracts were changed. Existing calls remain:

- `/api/alert`
- `/api/incidents`
- `/api/chat`
- `/api/resolve`

## Preserved flows

- Simulate incident
- Retrieve episodic memory
- Generate structured reasoning
- Resolve incident
- Write back retained memory
- Export postmortem

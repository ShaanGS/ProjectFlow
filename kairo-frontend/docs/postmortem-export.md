# Postmortem Export

## Current Trigger

The export trigger lives in:

- `components/kairo/agent-chat.tsx`

The button appears in the Kairo Agent panel after an incident analysis message exists.

## Generation Path

1. The agent panel receives:
   - active incident context
   - structured analysis from `/api/chat`
   - retrieved memory matches
2. `buildPostMortemMarkdown` builds a Markdown report in the browser.
3. The browser downloads a `.md` file using a generated object URL.

## Export Format

The export is Markdown because it is portable, easy to inspect during a demo, and can later be rendered to HTML or PDF.

The report includes:

- incident title
- vendor/service
- severity
- impact summary
- incident timeline
- memory references used
- likely root cause
- actions taken or recommended
- checks skipped
- final resolution
- follow-up / prevention notes
- Kairo reasoning snapshot

## Quality Rules

- The report uses structured incident and agent data instead of generic filler.
- It does not expose raw chain-of-thought.
- It cites memory references with vendor and similarity where available.
- It remains useful even if the incident has not yet been resolved, because it records the recommended response and evidence used.

## Next Improvement

When persistence is added, the export should include the stored `resolution` row, full incident event timeline, and persisted `analysis_run` ID.

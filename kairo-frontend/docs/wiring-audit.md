# Kairo Wiring Audit

Audit date: 2026-05-26

## 1. Current Entry Points

- **CONFIRMED:** `app/layout.tsx` is the Next.js root layout. Evidence: App Router convention and imports `@vercel/analytics/next`.
- **CONFIRMED:** `app/page.tsx` is the only app page in source. Evidence: `find app -type f` shows `app/page.tsx` and API routes only.
- **CONFIRMED:** `app/page.tsx` renders `DashboardShell`. Evidence: `app/page.tsx` imports `DashboardShell` from `@/components/kairo/dashboard-shell` and returns `<DashboardShell />`.
- **CONFIRMED:** `app/page.tsx` performs one browser-local seed call. Evidence: `app/page.tsx` calls `fetch("/api/seed", { method: "POST" })` when `localStorage.kairo_seeded` is missing.

## 2. Rendered Page / Component Tree

**CONFIRMED active tree:**

```text
app/layout.tsx
  -> app/page.tsx
    -> components/kairo/dashboard-shell.tsx
      -> LeftNav
      -> page switch:
        -> LiveIncidentsPage when activePage === "incidents"
        -> VendorsOverviewPage when activePage === "vendors"
        -> MemoryLogPage when activePage === "memory"
        -> PatternRulesPage when activePage === "patterns"
        -> VendorProfilePage when activeVendor is set
      -> RightPanel
        -> AgentChat
```

Evidence:

- `components/kairo/dashboard-shell.tsx` imports `LeftNav`, `RightPanel`, `LiveIncidentsPage`, `VendorProfilePage`, `VendorsOverviewPage`, `MemoryLogPage`, and `PatternRulesPage`.
- `DashboardShell.renderPage()` switches on `activePage` and `activeVendor`.
- `RightPanel` imports and renders `AgentChat`.

## 3. Verified Data Flow

### Initial Load / Seeding

```text
app/page.tsx
  -> fetch("/api/seed", POST)
  -> app/api/seed/route.ts
  -> retainIncident() from lib/hindsight.ts
  -> Hindsight if env is configured, otherwise skipped
```

Evidence:

- `app/page.tsx` calls `/api/seed`.
- `app/api/seed/route.ts` imports `incidents` from `@/data/incidents.json` and `retainIncident` from `@/lib/hindsight`.
- `lib/hindsight.ts` skips writes unless `HINDSIGHT_API_KEY` and `HINDSIGHT_PIPELINE_ID` are configured.

### Initial Resolved Incidents Table

```text
DashboardShell useEffect
  -> fetch("/api/incidents", GET)
  -> app/api/incidents/route.ts GET
  -> data/incidents.json
  -> resolvedIncidents state
  -> LiveIncidentsPage resolved table
```

Evidence:

- `components/kairo/dashboard-shell.tsx` calls `fetch("/api/incidents")`.
- `app/api/incidents/route.ts` `GET()` returns `{ incidents }` imported from `@/data/incidents.json`.
- `DashboardShell.mapResolvedIncident()` maps the returned rows into the resolved incident table.

### Simulate Incident Flow

```text
Simulate Incident button in DashboardShell
  -> fetch("/api/alert", POST, { index })
  -> app/api/alert/route.ts
  -> SIMULATED_ALERTS in app/api/alert/route.ts
  -> recallIncidents() from lib/hindsight.ts
  -> data/incidents.json fallback or Hindsight recall
  -> buildKairoBrief() from lib/kairo-brief.ts, or Groq when configured
  -> DashboardShell activeIncident, activeIncidents, memoryMatches
  -> fetch("/api/chat", POST, { currentIncident, past_episodes, messages })
  -> app/api/chat/route.ts
  -> uses injected past_episodes or recallIncidents()
  -> buildKairoBrief() or Groq when configured
  -> RightPanel + AgentChat display reasoning
```

Evidence:

- `DashboardShell.handleSimulateIncident()` calls `/api/alert`, then `/api/chat`.
- `app/api/alert/route.ts` contains local `SIMULATED_ALERTS`, calls `recallIncidents`, and returns `incident`, `memoryMatches`, `classification`, `analysis`, and `recalledIncidents`.
- `DashboardShell` uses `data.recalledIncidents` directly for the Episodic Memory panel and passes them as `past_episodes` to `/api/chat`.
- `app/api/chat/route.ts` accepts `past_episodes` / `pastEpisodes` and avoids redundant recall when provided.
- `RightPanel` displays `memoryMatches`.
- `AgentChat` displays `injectedMessage`.

### Manual Agent Follow-Up

```text
AgentChat input
  -> fetch("/api/chat", POST)
  -> app/api/chat/route.ts
  -> injected memory matches if available, otherwise recallIncidents()
  -> buildKairoBrief() in demo mode or Groq in llm mode
  -> AgentChat messages
```

Evidence:

- `components/kairo/agent-chat.tsx` calls `/api/chat`.
- It forwards `currentIncident` and `past_episodes` when `memoryMatches.length > 0`.

## 4. Files Confirmed In The Live Execution Path

**CONFIRMED active UI:**

- `app/layout.tsx`
- `app/page.tsx`
- `app/globals.css`
- `styles/globals.css`
- `components/kairo/dashboard-shell.tsx`
- `components/kairo/left-nav.tsx`
- `components/kairo/right-panel.tsx`
- `components/kairo/agent-chat.tsx`
- `components/kairo/vendor-logo.tsx`
- `components/kairo/pages/live-incidents.tsx`
- `components/kairo/pages/vendors-overview.tsx`
- `components/kairo/pages/vendor-profile.tsx`
- `components/kairo/pages/memory-log.tsx`
- `components/kairo/pages/pattern-rules.tsx`
- `lib/utils.ts`

**CONFIRMED active API/backend/data:**

- `app/api/seed/route.ts`
- `app/api/incidents/route.ts` `GET`
- `app/api/alert/route.ts`
- `app/api/chat/route.ts`
- `lib/hindsight.ts`
- `lib/groq.ts`
- `lib/kairo-brief.ts`
- `lib/llm-output.ts`
- `data/incidents.json`

**CONFIRMED active public assets:**

- `public/icon.svg`
- `public/kairo-logo.png`
- `public/logos/razorpay.svg`
- `public/logos/msg91.svg`
- `public/logos/aws-s3.svg`
- `public/logos/cashfree.svg`
- `public/logos/internal.svg`
- `public/logos/auth0.svg`
- `public/logos/whatsapp.svg`

## 5. Files Present But Unused By The Current UI

**CONFIRMED unused by current rendered Kairo path:**

- `components/ui/*` - no active `app/`, `components/kairo/`, or `lib/` file imports these UI primitives.
- `hooks/use-mobile.ts` - only referenced by `components/ui/sidebar.tsx`, which is not in the active Kairo render path.
- `hooks/use-toast.ts` - only referenced by `components/ui/toaster.tsx`, which is not in the active Kairo render path.
- `components/theme-provider.tsx` - no active import.
- `scripts/seed-full.mjs` - no active import or package script.
- `scripts/test-hindsight.mjs` - no active import or package script.
- `scripts/test-recall.mjs` - no active import or package script.
- `public/PHOTO-2026-04-12-00-56-05.jpg` - no source reference found.
- `public/Screenshot 2026-04-12 at 2.02.33 AM.jpg` - no source reference found.
- `public/Screenshot 2026-04-12 at 2.02.33 AM.png` - no source reference found.
- `public/apple-icon.png` - no source reference found.
- `public/icon-dark-32x32.png` - no source reference found.
- `public/icon-light-32x32.png` - no source reference found.
- `public/placeholder-logo.png` - no source reference found.
- `public/placeholder-logo.svg` - no source reference found.
- `public/placeholder-user.jpg` - no source reference found.
- `public/placeholder.jpg` - no source reference found.
- `public/placeholder.svg` - no source reference found.

## 6. Files Unverified / Uncertain

- **UNVERIFIED:** Whether `scripts/seed-full.mjs`, `scripts/test-hindsight.mjs`, or `scripts/test-recall.mjs` were useful historical experiments. They contain hardcoded `dummy_keys` and are not wired through `package.json`.
- **UNVERIFIED:** Whether the unused `components/ui/*` library is needed for future pages. It is not needed for the current rendered app.
- **UNVERIFIED:** Whether unused public images are design references. They are not referenced by current source.
- **UNVERIFIED:** `/api/resolve` as product behavior. It exists but no visible UI calls it.
- **UNVERIFIED:** `/api/retain` as product behavior. It exists but no visible UI calls it.
- **UNVERIFIED:** `POST /api/incidents` as product behavior. It exists, but current UI uses `GET /api/incidents` and gets memory matches from `/api/alert`, not `POST /api/incidents`.

## 7. Mock Or Placeholder Data Still Driving UI

**CONFIRMED mock/local data:**

- `app/api/alert/route.ts` uses local `SIMULATED_ALERTS` for the Simulate Incident button.
- `data/incidents.json` drives `GET /api/incidents` and fallback recall in `lib/hindsight.ts`.
- `components/kairo/pages/memory-log.tsx` uses hardcoded `memoryEntries`, `vendors`, and `types`.
- `components/kairo/pages/vendors-overview.tsx` uses hardcoded `vendors` and summary cards.
- `components/kairo/pages/vendor-profile.tsx` uses hardcoded `vendorData`.
- `components/kairo/pages/pattern-rules.tsx` uses hardcoded `patterns`.
- `components/kairo/agent-chat.tsx` empty state displays hardcoded `"14 incidents · 89% recall · 3 patterns"`.

**INFERRED:** The current product is only partially memory-backed. The Live Incidents simulation path is wired to retrieval/reasoning, but secondary pages are static.

## 8. Conflicting Or Duplicate Implementations

- **CONFIRMED duplicate hooks:** `hooks/use-mobile.ts` and `components/ui/use-mobile.tsx` both define `useIsMobile`.
- **CONFIRMED duplicate toast state:** `hooks/use-toast.ts` and `components/ui/use-toast.ts` both define toast state APIs.
- **CONFIRMED endpoint overlap:** `/api/resolve` and `/api/retain` both write to memory through `retainIncident`, but neither is called by current UI.
- **CONFIRMED retrieval overlap:** `/api/alert` performs retrieval for simulation; `POST /api/incidents` also performs retrieval by description, but current UI does not call that POST route.
- **CONFIRMED stale naming mismatch:** README describes app routes and Hindsight, while the product brief references Supabase. No Supabase code exists in the current source.

## 9. Recommendation: Keep / Archive / Delete

### Keep Active

- `app/`
- `components/kairo/`
- `lib/`
- `data/incidents.json`
- `styles/globals.css`
- `public/icon.svg`
- `public/kairo-logo.png`
- `public/logos/`
- build config files: `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `next-env.d.ts`, `components.json`, `.env.example`, `.gitignore`

### Archive

- `components/ui/` - large unused shadcn/Radix library, not rendered by Kairo.
- `hooks/` - only supports unused UI primitives.
- `components/theme-provider.tsx` - unused.
- `scripts/*.mjs` - not active, contain hardcoded dummy credentials and exploratory Hindsight code.
- unused public placeholders/screenshots/photos.

### Delete

- No source files should be deleted yet. Archive first because there is no git metadata at this path and some files may be useful as references.

## 10. Proposed Canonical Architecture For Current Repo

```text
app/
  page.tsx                  # only UI entry
  layout.tsx
  api/
    alert/route.ts           # simulation + retrieval
    chat/route.ts            # reasoning/chat
    incidents/route.ts       # current local incident data + optional retrieval POST
    resolve/route.ts         # write-back API, currently unwired
    retain/route.ts          # legacy/direct retain API, currently unwired
    seed/route.ts            # optional memory seeding
components/
  kairo/                     # active Kairo UI only
lib/
  hindsight.ts               # retrieval/write helper
  kairo-brief.ts             # deterministic reasoning formatter
  groq.ts                    # optional LLM client
  llm-output.ts
  utils.ts
data/
  incidents.json             # current seed/fallback dataset
docs/
archive/
  components-ui/
  hooks/
  scripts/
  public-unused/
```

The next phase should replace hardcoded secondary pages with data-driven views only after the active incident loop is stable.

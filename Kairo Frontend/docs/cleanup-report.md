# Cleanup Report

## Summary

The active Kairo app path was preserved. Unused or unverified code/assets were moved into `archive/` rather than deleted.

## Moved To Archive

- `components/ui/` -> `archive/components/ui/`
- `components/theme-provider.tsx` -> `archive/components/theme-provider.tsx`
- `hooks/` -> `archive/hooks/legacy-hooks/`
- `scripts/` -> `archive/scripts/legacy-hindsight-scripts/`
- unused public screenshots/placeholders/icons -> `archive/public-unused/`
- `components.json` -> `archive/components/shadcn-components.json`

## Deleted

No source files were deleted. This folder is not a git checkout, so the cleanup used archive-first preservation.

## Dependency Pruning

Removed dependencies that were only used by archived/unrendered UI primitives or legacy scripts. Active dependencies now match the current app path more closely:

- Next/React
- Lucide icons
- Groq SDK
- Hindsight client
- Vercel Analytics
- `clsx` and `tailwind-merge`

## Preserved Active Path

- `app/`
- `components/kairo/`
- `lib/`
- `data/incidents.json`
- `public/icon.svg`
- `public/kairo-logo.png`
- `public/logos/`
- `types/kairo.ts`

## Intentional Non-Changes

- The UI design was not redesigned.
- Static secondary pages were not rewritten.
- Unwired APIs were not deleted because they may be used in the next product phase.
- Memory backend choice was not changed.

## Validation

- `npm run lint` passes after cleanup.

## Remaining Work

- Add tests.
- Wire a resolve flow to `/api/resolve`.
- Replace static secondary pages with real data.
- Decide whether Hindsight remains the canonical memory backend.
- Reintroduce any archived UI primitives only if a future feature actually imports them.

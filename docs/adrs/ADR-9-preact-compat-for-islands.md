# ADR-9: Use Preact (preact/compat) for islands

- Status: Proposed
- Date: 2026-11-06
- Deciders: Kinetix team
- Related: ADR-3, ADR-8, docs/ARCHITECTURE.md, docs/PATTERNS.md

## Context
Islands (ADR-3) ship React 19 + react-dom. In the existing `dist/client/_astro/` build, the largest shared framework chunk is `client.BismhMee.js` (~207 KB raw, ~64 KB gzip; identified by size and name as the react-dom client, not inspected). Preact with `preact/compat` is ~4-5 KB gzip (estimate from Preact's published figures, not measured here). There are nine non-test `.tsx` files (~1,530 lines) under `features/events/components/`.

Compat assessment from the code:

| Island | Hooks used | Risk |
|---|---|---|
| `RouteList` | `useState`, `useCallback`, `actions` | Safe |
| `IconPicker` | `useState`, `useEffect`, `useRef` | Safe |
| `AddressPicker` | `useEffect`, `useRef`, `useState`, `useCallback`, `@tabler/icons-react` | Safe (icons are plain components) |
| `RouteMap` | `useEffect`, `useRef`, dynamic `leaflet` | Safe (DOM library, framework-agnostic) |
| `RouteViewer`, `DistanceRoutePreview` | `useState`, `useMemo`, `lazy`, `Suspense` | Safe (supported by compat) |
| `RouteUploadForm` | hooks only | Safe |
| `ItineraryEditor` | `@dnd-kit/core`, `sortable`, `utilities` | **Risky**: dnd-kit targets React internals and context behaviour; compat is community-reported to work but not officially supported |
| `ElevationProfile` | `recharts` 3 | **Risky**: Recharts 3 uses React 18/19 features and react-redux internally; Preact support must be tested (it is also the biggest chunk, ~356 KB raw / ~102 KB gzip) |

No island uses React 19-only APIs (`use`, `useActionState`, `useOptimistic`; grep found none).

## Decision
**Proposed, not adopted.** Decide in stages, with a measurable criterion, instead of switching blindly:
1. **Baseline**: run `astro build` and record the `dist/client/_astro/` sizes (raw/gzip) of the React runtime chunk and each island chunk.
2. **Cheap wins first (independent of Preact)**: convert the small islands `RouteList` and `AddressPicker` (`IconPicker` is a child of `ItineraryEditor` and moves only with it) to `.astro` + `<script>` where they are mostly DOM wiring (PATTERNS "Islands" table). Switch `RouteViewer` and `RouteUploadForm` from `client:load` to `client:visible`. Remove `@tabler/icons-react` from islands if `@lucide/astro` icons suffice.
3. **Spike on a branch**: replace `@astrojs/react` with `@astrojs/preact` (`preact({ compat: true })`), alias `react`/`react-dom` to `preact/compat`, set `tsconfig.json` `jsxImportSource` to `preact`, and run Vitest with the same alias. Check `ItineraryEditor` (keyboard + pointer drag) and `ElevationProfile` manually and with E2E 05.
4. **Adopt** only if all hold: runtime chunk shrinks by at least 50 KB gzip on the pages that use islands; all unit and E2E tests pass unchanged; no visual or interaction regression in `ItineraryEditor` and `ElevationProfile`. Otherwise reject, or keep React only for those two islands (Astro cannot mix React and Preact integrations without `include`/`exclude` patterns; the cost of that split must be weighed).

## Consequences
### Positive
- Estimated saving of ~55-60 KB gzip of framework runtime on pages with islands; faster hydration on mobile (Lighthouse mobile is 86, see `PERFORMANCE_REPORT.md`).
- Same hooks and JSX; most island code unchanged.

### Negative / risks
- Config changes: `astro.config.mjs` (`@astrojs/preact`, aliases), `tsconfig.json` (`jsxImportSource`), `vitest.config.ts` (alias, plus a plugin or esbuild `jsxImportSource`), new dependencies `preact` and `@astrojs/preact`.
- `@testing-library/react` runs on React; Preact needs `@testing-library/preact`, so all island tests change (ADR-8).
- `[eventSlug].astro` imports `react-dom/client` and `createElement` for the manual mount (ADR-3); it would need `preact` `render` instead.
- Subtle behaviour differences: synthetic events, `onChange` vs `onInput`, `useEffect` timing, no `StrictMode` double render.
- `@dnd-kit` and Recharts breakage could negate the gain, since those are the heaviest islands.
- Moving to `.astro` + `<script>` loses typed JSX and the existing island tests for those components; they must be rewritten.

## Alternatives considered
- **Stay on React 19** (status quo): no migration risk, larger runtime.
- **Convert small islands to `.astro` + `<script>`**: removes React from pages that only use those islands, but it does not help pages that still load `ItineraryEditor`/`ElevationProfile`.
- **Replace dnd-kit/Recharts with lighter libraries** (native drag and drop, `uPlot`/inline SVG): bigger rewrite, larger payoff; revisit after step 3.
- **Preact signals / native Preact without compat**: requires rewriting every island; not justified.

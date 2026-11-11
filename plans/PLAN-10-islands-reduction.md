# PLAN-10: Islands reduction

- Status: In progress (T1, T2, T4, T5, T6 done via PLAN-11 T4/T9/T10; T7 Preact spike pending)
- Created: 2026-11-06 | Updated: 2026-11-10
- Spec: none (performance and maintainability)
- ADRs: ADR-3, ADR-7, ADR-9

## Goal
Ship less client JavaScript on pages with islands, decided by measured bundle sizes, without changing behavior.

## Scope
### In
- Baseline measurement, converting small islands to `.astro` + script, mounting `DistanceRoutePreview` as a real island, splitting the `[eventSlug].astro` inline script, a Preact spike.
### Out
- Adopting Preact before the criterion in ADR-9 is met; replacing dnd-kit or Recharts.

## Design
Follow ADR-9 stages: baseline, cheap wins independent of Preact, spike on a branch, adopt only if the runtime chunk shrinks at least 50 KB gzip, all tests pass unchanged and `ItineraryEditor` and `ElevationProfile` show no regression.

## Tasks
- [x] T1 Measure baseline: run `pnpm build`, record raw/gzip sizes of the React runtime chunk and each island chunk in `docs/` — test first: n/a (measurement; exception: no behavior change) — files: `docs/reports/BUNDLE_BASELINE.md`
  - Evidence: raw baseline recorded in `docs/reports/ISLANDS_AND_PREACT.md` (React runtime 207,396; `ElevationProfile` 355,842; `leaflet` 148,731; `validation` 92,230; `ItineraryEditor` 50,448; event page script 30,031; `RouteList` 4,321; `AddressPicker` 3,503). Gzip was measured only for the post-change build (`gzip -c`), noted in the report.
- [x] T2 Convert `RouteList` to `.astro` + `<script>` — test first: port `RouteList` behavior checks to a Vitest DOM test before deleting the island — files: `src/features/events/components/routes/RouteList.tsx`, new `RouteList.astro`
  - Evidence: `RouteList.astro` (server-rendered) + `route-list.client.ts` (`route-list.client.test.ts`, 8 tests, RED first) + `route-list.boot.ts`; `RouteList.tsx` deleted. Chunk 4,321 → 1,300 raw.
- [ ] ~~T3 Convert `IconPicker` to `.astro` + `<script>`~~ Dropped: `IconPicker` is rendered inside `ItineraryEditor.tsx:140`, so it moves only together with its parent (see docs/reports/ISLANDS_AND_PREACT.md, action 4)
- [x] T4 Mount `DistanceRoutePreview` as an island in `[eventSlug].astro` instead of manual `createElement` + `react-dom/client` — test first: existing `DistanceRoutePreview.test.tsx` plus E2E 05 — files: `src/pages/dashboard/events/[eventSlug].astro`
  - Evidence: the island now lives inside the distance `<template>` with `client:visible`; the component emits `kinetix:gpx-loaded`/`kinetix:gpx-cleared` DOM events (2 new tests), the editor script fills the hidden `gpx_filename`, and `editor/gpx-mount.ts` was deleted. Verified in headless Chromium against the built server (cloned island hydrates, upload reaches the right card, map renders, second card isolated). E2E 05 was not run (needs the backend + docker compose).
- [x] T5 Split the `[eventSlug].astro` inline script (~1,900 lines) into feature modules under `src/features/events/` — test first: unit tests for each extracted pure function — files: `src/pages/dashboard/events/[eventSlug].astro`, `src/features/events/scripts/*`
  - Evidence: 2,023 → 460 lines; modules under `src/features/events/editor/` with 5 test files / 46 tests (RED first). See PLAN-11 T4.
- [x] T6 Re-measure after T2-T5 and compare with T1 — files: `docs/reports/BUNDLE_BASELINE.md`
  - Evidence: after table in `docs/reports/ISLANDS_AND_PREACT.md`: page script 30,031 → 24,643; `ItineraryEditor` 50,448 → 48,860; `AddressPicker` 3,503 → 3,118; `RouteList` 4,321 → 1,300 (script) with no React hydration; `DistanceRoutePreview` now a 4,279 deferred chunk; React runtime 207,396 → 209,191 (+1,795 for the `visible` directive). Editor eager island JS −5,566 raw (−1.9%).
- [ ] T7 Preact spike on a branch (`@astrojs/preact` with `compat: true`, aliases, `jsxImportSource`, Vitest alias) and evaluate against the ADR-9 criterion — files: `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `package.json` (branch only until accepted)

## Verification
`pnpm astro check`, `pnpm test`, `pnpm build`, `pnpm test:e2e` (spec 05); gzip sizes before/after in `BUNDLE_BASELINE.md`. T7 is adopted only if ADR-9's criterion holds; otherwise record rejection in ADR-9.

## Risks and rollback
Rewriting islands loses typed JSX and their tests unless ported first. dnd-kit and Recharts may not work under `preact/compat`. Rollback: revert per task; the spike stays on its own branch.

## Open questions
- Keep React only for `ItineraryEditor` and `ElevationProfile` if the rest moves (cost of split integrations)?

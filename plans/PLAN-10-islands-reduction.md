# PLAN-10: Islands reduction

- Status: Draft
- Created: 2026-11-06 | Updated: 2026-11-06
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
- [ ] T1 Measure baseline: run `pnpm build`, record raw/gzip sizes of the React runtime chunk and each island chunk in `docs/` — test first: n/a (measurement; exception: no behavior change) — files: `docs/reports/BUNDLE_BASELINE.md`
- [ ] T2 Convert `RouteList` to `.astro` + `<script>` — test first: port `RouteList` behavior checks to a Vitest DOM test before deleting the island — files: `src/features/events/components/routes/RouteList.tsx`, new `RouteList.astro`
- [ ] T3 Convert `IconPicker` to `.astro` + `<script>` — test first: adapt `IconPicker.test.tsx` — files: `src/features/events/components/IconPicker.tsx`, new `IconPicker.astro`
- [ ] T4 Mount `DistanceRoutePreview` as an island in `[eventSlug].astro` instead of manual `createElement` + `react-dom/client` — test first: existing `DistanceRoutePreview.test.tsx` plus E2E 05 — files: `src/pages/dashboard/events/[eventSlug].astro`
- [ ] T5 Split the `[eventSlug].astro` inline script (~1,900 lines) into feature modules under `src/features/events/` — test first: unit tests for each extracted pure function — files: `src/pages/dashboard/events/[eventSlug].astro`, `src/features/events/scripts/*`
- [ ] T6 Re-measure after T2-T5 and compare with T1 — files: `docs/reports/BUNDLE_BASELINE.md`
- [ ] T7 Preact spike on a branch (`@astrojs/preact` with `compat: true`, aliases, `jsxImportSource`, Vitest alias) and evaluate against the ADR-9 criterion — files: `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `package.json` (branch only until accepted)

## Verification
`pnpm astro check`, `pnpm test`, `pnpm build`, `pnpm test:e2e` (spec 05); gzip sizes before/after in `BUNDLE_BASELINE.md`. T7 is adopted only if ADR-9's criterion holds; otherwise record rejection in ADR-9.

## Risks and rollback
Rewriting islands loses typed JSX and their tests unless ported first. dnd-kit and Recharts may not work under `preact/compat`. Rollback: revert per task; the spike stays on its own branch.

## Open questions
- Keep React only for `ItineraryEditor` and `ElevationProfile` if the rest moves (cost of split integrations)?

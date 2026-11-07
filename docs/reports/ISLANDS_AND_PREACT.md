# Islands, code reduction and Preact

**There is no Svelte in this project.** `grep -ri svelte src package.json astro.config.mjs` finds nothing except a leftover `svelte` glob in the unused `tailwind.config.mjs`. The interactive layer is **React 19 islands** (`@astrojs/react`), so the question ("improve what Svelte has / can Preact reduce the code") is answered here for React. Related: `docs/adrs/ADR-9-preact-compat-for-islands.md` (Proposed), `plans/PLAN-10-islands-reduction.md` (Draft).

Numbers marked **(measured)** come from the existing `dist/client/_astro/` (gzip level 6 via `gzip -c`; the build date of `dist/` is unknown). Everything else marked **(estimate)** is not measured. Date: 2026-11-06.

## Islands (`.tsx` under `src/features/events/components/`)

9 files, 1,531 lines (tests excluded).

| Island | Lines | Mounted in | Directive | Heavy deps | Recommendation | Reason |
|---|---|---|---|---|---|---|
| `AddressPicker.tsx` | 182 | `pages/dashboard/events/[eventSlug].astro:333` | `client:only="react"` | `@tabler/icons-react` (3 icons) | Preact-safe | Hooks + fetch autocomplete; dispatches a `window` CustomEvent (`:108`), no React internals. Too stateful to hand-convert (ADR-9 lists it as convertible; not recommended) |
| `ItineraryEditor.tsx` | 230 | `[eventSlug].astro:351` | `client:only="react"` | `@dnd-kit/core`, `sortable`, `utilities` (chunk **50,448 B raw / 16,414 B gz, measured**) | Risky under Preact | dnd-kit relies on React context/event internals; works with compat per community reports only. Keep React unless the spike passes keyboard and pointer drag |
| `IconPicker.tsx` | 119 | child of `ItineraryEditor.tsx:140` (also exports `ITINERARY_ICON_CATALOG`) | none (nested) | `@tabler/icons-react` | Keep React (with its parent) | It is rendered *inside* a React island, so it cannot become `.astro` unless `ItineraryEditor` is rewritten; contradicts ADR-9 step 2 / PLAN-10 T3. Preact-safe if the parent moves |
| `routes/RouteUploadForm.tsx` | 347 | `pages/dashboard/events/[slug]/routes.astro:39` | `client:load` | none (lazy `RouteMap`, `ElevationProfile`) | Preact-safe | Hooks only. Move the `fetch` behind an action (see below) and use `client:visible` |
| `routes/RouteList.tsx` | 142 | `routes.astro:48` | `client:load` | `astro:actions` | Convert to `.astro` + script | State is a list with delete; one action call (`actions.event.deleteRoute`, `:28`) |
| `routes/RouteViewer.tsx` | 107 | `features/events/components/EventDescription.astro:43` (public event page) | `client:load` | lazy `RouteMap`, `ElevationProfile` | Preact-safe | `useState`/`useMemo`/`lazy`/`Suspense` are supported by compat. Switch to `client:visible` (below the fold) |
| `DistanceRoutePreview.tsx` | 175 | `[eventSlug].astro:985-1008` via `createRoot` + `createElement` (no directive) | manual mount | lazy `RouteMap`, `ElevationProfile`, `lib/gpx-parser` | Preact-safe | Manual mount must change to preact `render` if migrating (see actions) |
| `routes/RouteMap.tsx` | 112 | lazy from the three route islands | n/a | `leaflet` (**148,731 B raw / 42,910 B gz, measured**; dynamic `import('leaflet')` at `:18`) | Preact-safe | Leaflet is DOM-only; React only holds a ref |
| `routes/ElevationProfile.tsx` | 116 | lazy from the three route islands | n/a | `recharts` 3 (**355,842 B raw / 102,094 B gz, measured**, the largest chunk) | Risky under Preact | Recharts 3 uses react-redux/context internals; must be tested. Already lazy, so it loads only when a route exists |

Framework runtime today: `client.BismhMee.js` = **207,396 B raw / 64,140 B gz (measured)**, identified by size and name, not inspected (same note as ADR-9).

## Code-reduction actions that keep behavior

Line savings are **estimates**; moving code into modules reduces the page, not necessarily the total.

| # | Action | Evidence | Estimated lines saved | Notes |
|---|---|---|---|---|
| 1 | Split `pages/dashboard/events/[eventSlug].astro` (2,022 lines: frontmatter 1-211, template 212-821, inline `<script>` 840-2012 = ~1,170 lines) into `src/features/events/scripts/*.ts` (form state, DistanceRows, KitRows, sub-resource payload, submit, field-config) | `pages/dashboard/events/[eventSlug].astro:840-2012` | Page shrinks by ~1,100-1,200 lines (estimate); net total ~100-250 after de-duplicating with `lib/validation.ts` | Each extracted pure function gets a Vitest unit test first (PLAN-10 T5). The built script chunk is only 30,018 B raw / 9,234 B gz (measured), so this is about maintainability, not bytes |
| 2 | Replace the manual `createRoot(host)` + `createElement(DistanceRoutePreview)` mount with a declarative island | `[eventSlug].astro:845-846, 985-1008` (about 25 lines plus 2 imports) | ~25-30 (estimate) | Rows are created client-side, so a server-rendered `<DistanceRoutePreview client:only="react" />` per row is not possible directly; spike a `<template>` containing an `<astro-island>` clone, or keep `render()` but behind one `mountIsland()` helper. **Unverified** |
| 3 | Convert `RouteList` to `.astro` + `<script>` | `routes/RouteList.tsx` (142 lines) | ~40-60 (estimate) | Port `confirm`, delete action call and empty-state to a Vitest DOM test first. Removes one `client:load` island |
| 4 | Do **not** convert `IconPicker` on its own | `IconPicker.tsx` is rendered by `ItineraryEditor.tsx:140` | 0 | Convert both only if ItineraryEditor is rewritten without dnd-kit; otherwise keep (revises ADR-9 step 2) |
| 5 | Move the upload `fetch` behind an action or API route | `routes/RouteUploadForm.tsx:5` hardcodes `http://localhost:8085/api/v1`; `:29-32` reads `access_token` from `document.cookie`, but that cookie is set `httpOnly: true` (`lib/cookies.ts:28-29`), so JS cannot read it; `:118` posts to the backend | ~20 (estimate) | Likely functional bug: `getAccessToken()` returns null and the form reports "No autenticado" (by code reading; not run). An action runs server-side with the cookie, fixes the hardcoded host and matches the existing pattern. RED test first |
| 6 | Consolidate layouts and sidebars | `DashboardLayout.astro` (65) vs `ParticipantLayout.astro` (66); `DashboardSidebar.astro` (113) vs `NavigationSidebar.astro` (111); `Layout.astro` (35) into `MainLayout.astro` (19) | ~170-190 (estimate) | `diff` shows only nav items, icon map and brand text differ |
| 7 | One icon library | `@lucide/astro` (5 `.astro` files), `@tabler/icons-react` (3 islands), `@tabler/icons` (starwind SVGs), unused `lucide` (`package.json:33`) | ~0 lines; removes `@tabler/icons-react` and `lucide` dependencies | Replacing the 3 islands' icons also removes React-bound icon components, which eases Preact. Keep `@tabler/icons` while starwind needs it |
| 8 | Share the lazy `RouteMap` + `ElevationProfile` wrapper | Verified duplicated: `RouteViewer.tsx:4-5,87-104`, `RouteUploadForm.tsx:8,11,250-267`, `DistanceRoutePreview.tsx:7-8,162-170` (fallbacks differ slightly) | ~30-40 (estimate) | New `RoutePreviewPanel.tsx` with `route` and optional `fallback` props |
| 9 | Directive hygiene | `RouteViewer`/`RouteUploadForm`/`RouteList` use `client:load` (`EventDescription.astro:46`, `routes.astro:42,50`) | 0 lines; less initial JS | Use `client:visible` where the island is below the fold (ADR-9 step 2) |

## Preact

### Exact configuration change (spike, branch only)

| File | Change |
|---|---|
| `package.json` | add `preact`, `@astrojs/preact`; remove `@astrojs/react`, and (with compat aliases) `react`, `react-dom`; add `@testing-library/preact`, drop `@testing-library/react` |
| `astro.config.mjs` | `import preact from '@astrojs/preact'`; `integrations: [preact({ compat: true })]` (currently `react()` at `astro.config.mjs:9`). `compat: true` aliases `react` and `react-dom` to `preact/compat` for Vite, SSR included |
| Mixed mode (fallback if dnd-kit or recharts fail) | keep `react({ include: ['**/ItineraryEditor*', '**/IconPicker*', '**/ElevationProfile*'] })` and `preact({ include: ['**/routes/**', '**/DistanceRoutePreview*', '**/AddressPicker*'] })`. Both integrations then ship a runtime on pages mixing them, so the gain shrinks. **Not verified** with Astro 7 |
| Directives | `client:only="react"` at `[eventSlug].astro:334,352` becomes `client:only="preact"` |
| `tsconfig.json` | `"jsx": "react-jsx"` stays; `"jsxImportSource": "preact"` (currently `"react"`); add `paths` mapping `react`, `react-dom` to `./node_modules/preact/compat/` |
| `vitest.config.ts` | `resolve.alias`: `react` and `react-dom` to `preact/compat`, `react/jsx-runtime` to `preact/jsx-runtime`; `esbuild: { jsx: 'automatic', jsxImportSource: 'preact' }`. Keep `// @vitest-environment happy-dom` headers |
| `[eventSlug].astro:845-846` | replace `react-dom/client`'s `createRoot` and `createElement` with `render`/`h` from `preact` (or the helper from action 2) |

### Risks

| Risk | Where | Mitigation |
|---|---|---|
| dnd-kit depends on React internals | `ItineraryEditor.tsx:2-15` | Test keyboard and pointer drag manually and with E2E 05; otherwise keep React for this island |
| Recharts 3 (react-redux, context) | `routes/ElevationProfile.tsx:1-9` | Test with real GPX data; otherwise mixed mode, or replace with inline SVG/uPlot (larger rewrite) |
| Event semantics (`onChange` vs `onInput`, effect timing, no StrictMode double render) | all hook-based islands | Run all island tests and E2E unchanged |
| Test library swap | all `*.test.tsx` under `features/events/components` | Adopt `@testing-library/preact`; port first, then migrate |
| Types | `@types/react`, `@types/react-dom` in `devDependencies` | Replace with the `paths` mapping above |
| React 19-only APIs | none found (`use`, `useActionState`, `useOptimistic`: grep empty, as ADR-9 states) | n/a |

### Staged plan (matches ADR-9 and PLAN-10)

| Stage | Work | Plan task |
|---|---|---|
| 1 | Baseline: `pnpm build`, record raw/gzip of the runtime and island chunks in `docs/reports/BUNDLE_BASELINE.md` (the numbers above are a starting point, not the baseline) | PLAN-10 T1 |
| 2 | Independent wins: actions 3, 5, 6, 7, 8, 9 here; mount helper (action 2) | T2, T4 |
| 3 | Split `[eventSlug].astro` (action 1) | T5 |
| 4 | Re-measure and compare with stage 1 | T6 |
| 5 | Spike on a branch with the config above; run `pnpm astro check`, `pnpm test`, `pnpm build`, `pnpm test:e2e` | T7 |
| 6 | Adopt only if the criterion holds; else reject in ADR-9 or use mixed mode if its cost is acceptable | ADR-9 |

### Measurable criterion

Adopt Preact only if all hold (from ADR-9):

1. The framework runtime chunk shrinks by **at least 50 KB gzip** on pages that use islands. Estimate from the numbers above: 64,140 B gz today (measured) versus roughly 5-10 KB gz for Preact + compat (published figure, **not measured**), about 55 KB saved.
2. All unit and E2E tests pass unchanged apart from the testing-library swap.
3. No visual or interaction regression in `ItineraryEditor` and `ElevationProfile`.

Note: `ElevationProfile` (102,094 B gz, measured) and `leaflet` (42,910 B gz) are bigger than the React runtime, so the lazy loading and `client:visible` changes (action 9) can matter more for real users than the Preact swap, and are risk-free.

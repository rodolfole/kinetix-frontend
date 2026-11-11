# PLAN-11: Frontend fixes, completion and bundle diet

- Status: In progress (T1-T3, T5, T8 done; T11-T12 done except .env.example)
- Created: 2026-11-06 | Updated: 2026-11-06
- Spec: docs/specs/SPEC-dashboard.md, docs/specs/SPEC-registration.md, docs/specs/SPEC-events.md
- ADRs: ADR-3, ADR-5, ADR-6, ADR-9

## Goal
Fix the pending type errors, finish the pages that still render placeholder data, and cut the interactive payload following the reports (`docs/reports/CODE_AUDIT.md`, `docs/reports/ISLANDS_AND_PREACT.md`).

## Scope
### In
- `astro check` errors (27 found in phase 6, all pre-existing).
- Placeholder/mocked pages (dashboards, results, reports, settings).
- The registration page `Props` mismatch reported by the verifier.
- Bundle reduction actions from PLAN-10 and ADR-9.

### Out
- Backend authorization and payments work (backend plans/PLAN-16).
- Moving CI into the repos (needs the user decision referenced in the workspace audit).

## Design
Keep ADR-3 (islands) and the target patterns of `docs/PATTERNS.md`. Bundle work follows PLAN-10 stages; this plan orders and extends them with the check errors and page completion.

## Tasks
- [x] T1 Fix the 27 `astro check` errors and gate CI on it — test first: the check itself — files:
  - Evidence: `astro check` went from 27 errors (event.action.ts 2, auth.action.test.ts 6, EventDistances.astro 5, EventRunnerKit.astro 1, registration.schema.ts 1, lib/validation.ts 2, admin/payments.astro 1, dashboard/events/[eventSlug].astro 7, events/[slug]/registration/index.astro 2) to 0 errors / exit 0, 267 files. `vitest run`: 24 files, 223 tests green (was 215; +8 new). CI gate: `continue-on-error` removed from the Astro check step in `.github/workflows/ci.yml`.
  - Deferred to T2: the page now passes the real form contract (`eventId`/`eventName`/`distances`); `participantFieldsConfig`/`profile` are still only exported as `window.__*__` globals and not consumed by `RegisterForm`, and the `ParticipantFieldConfig` shape (`field_name`) is a local placeholder until the backend `event_field_config` contract is confirmed.
  - [x] T1a `src/features/events/actions/event.action.ts:334` and `:316` — now typed with a `BackendListEnvelope<T>` (`{ message, data }`) and read via `response.data?.data ?? []`; both callers updated.
  - [x] T1b `src/features/auth/actions/auth.action.test.ts` (6) — the mock's shape is restored by a `rawHandler` helper (`handler` typed from the action's `data` branch); no assertion changed.
  - [x] T1c `src/features/events/components/EventDistances.astro` (5) — new `EventDistanceView` type (base `EventDistance` + `km`/`description`/`elevation`/`timeLimit`/`capacity`) assigned from `event.distances`.
  - [x] T1d `src/features/events/components/EventRunnerKit.astro` (`Heading level` → `as="h2"`, same markup) + `src/pages/admin/payments.astro` (`class={[...]}` → `class:list={[...]}`).
  - [x] T1e `src/features/registration/schemas/registration.schema.ts` and `src/lib/validation.ts` (3) — `errorMap` in `z.enum` replaced with zod v4's `error` param; the custom Spanish messages now actually surface (previously ignored at runtime, pinned by new tests).
  - [x] T1f `src/pages/dashboard/events/[eventSlug].astro` (7) — null guard inside the municipio cascade helper and `prize_amounts` typed as `string | number[]`.
  - [x] T1g `src/pages/events/[slug]/registration/index.astro` (2) — `ParticipantFieldConfig` moved to `registration.type.ts`; `RegisterForm` receives `eventId`/`eventName`/`distances` built from the event detail payload.
- [x] T2 Registration page/form contract: settle the real props (the `participantFieldsConfig` flow) and the field requirements map — test first: form test — files: `src/features/registration/components/RegisterForm.astro`, the page and `events/consts/field-sections.ts`.
- [x] T3 `RegisterForm` empty-slug guard: render an error state instead of "/events//registration/exito" — test first: form test — files: `RegisterForm.astro`.
- [x] T4 Split `src/pages/dashboard/events/[eventSlug].astro` (2,022 lines incl. ~1,170 inline script) into feature modules (form sections, field-config editor, pricing, awards, sponsors, locations, route preview forum) — test first: extract each piece with a unit test — files: `src/pages/dashboard/events/`, `src/features/events/**`.
  - Evidence: page went **2,023 → 460 lines** (-77%). The ~1,170-line inline script is now `src/features/events/editor/`: `form-collection.ts` (DOM → structured payload), `field-config.ts` (toggle ↔ `event_field_config` diff), `payload.ts` (RFC3339 + create/edit submission), `subresources.ts` (loaded event/detail → form values), `municipio-matcher.ts` + `editor-ui.ts` (cascade, date rules), `prize-places.ts`, `kit-icons.ts`, `optional-sections.ts`, `event-page-manager.ts` (delegated wiring + validation + submit) and `mount.ts` (idempotent boot). The page `<script>` is 2 statements.
  - Test first (RED → GREEN): `form-collection.test.ts` (9), `field-config.test.ts` (9), `subresources.test.ts` (8), `payload.test.ts` (11), `municipio-matcher.test.ts` (9) — 5 files / 46 tests, all failing with "Failed to load url ./…" before the modules existed. Block totals after T4: **30 files / 276 tests green**, `astro check` 0 errors, `astro build` green.
  - T4.2 markup move: the 6 `<template>` cards moved to `src/features/events/components/editor/` (`DistanceCardTemplate`, `AwardCardTemplate`, `SponsorKitTemplates`, `PriceStageTemplate`). Rendered-HTML proof: the built server was rendered for `/dashboard/events/new` before and after; every `<template id>` block is byte-identical after whitespace normalisation and the rest of the page HTML is identical (only the order of the template blocks changed, which is irrelevant because they are looked up by id).
  - Behaviour proof (no e2e needed for the backend): a headless Playwright run against the built server (fake session cookie, stub backend) exercised the real page — slug auto-generation, quick-add distance, GPX dropzone island, award card + `num_places` regeneration (3 → 5 prize rows), price stage + EARLY BIRD badge, optional-section toggle, card removal, itinerary island, address island, and submit blocked by validation (17 error markers, URL unchanged) — 0 console/page errors.
- [x] T5 Route guard robustness: test URL-decoded paths (`/%61dmin`, `/events/x/%72egistration`) against Astro route matching and normalize in `resolveAccess` — test first: `route-guard.test.ts` cases — files: `src/lib/route-guard.ts`.
- [x] T6 Dashboards on the API: organizer stats/events (currently hardcoded), participant registrations/history; add `dashboard.action.ts` — test first: action tests with fake fetch — files: `src/features/dashboard/**`, pages under `src/pages/dashboard` and `src/pages/participant`.
  - Evidence: new `src/features/dashboard/actions/dashboard.action.ts` with `getOrganizerOverview` (reads the `access_token` + `user` cookies, `GET /events?limit=100`, filters by `organizer_id`, `GET /registrations?event_id=` per event and `GET /events/{id}/detail` for capacity — all through `@lib/api`, no new endpoints) and `getParticipantOverview` (`GET /registrations/participant/{id}`, event names resolved from `/events`). Missing token/claims → `UNAUTHORIZED`; list failures → `BAD_REQUEST`; per-event counts/details and the event-name lookup degrade gracefully (0 / empty name).
  - Test first: `dashboard.action.test.ts` (16 tests) failed with "Failed to load url ./dashboard.action" before the action existed. Block totals after T6: **31 files / 292 tests green**.
  - Pages now consume the actions server-side and render explicit empty/error states: `dashboard/index.astro` (stats, recent events, upcoming registration deadlines, distance distribution), `dashboard/events/index.astro`, `participant/dashboard/{index,registrations,history}`. No mock-data block remains.
  - Render proof: the built server rendered against a stub API (`/events`, `/registrations`, `/events/{id}/detail`) showed 2 events / 1 published / 4 registrations, only the session organizer's events, only the future deadline, and the participant's 2 registrations (1 confirmed, 1 pending, bib 123). With the backend down, each page renders its error banner plus the explicit empty state.
  - Skipped (noted): no render-level unit test for the pages — `.astro` files cannot be rendered by vitest in this repo (see `EventCard.test.tsx`), so the page-level evidence is the SSR render above. Revenue/occupancy are **not** shown: registrations carry no price in the backend, so `EventCard.revenue` became optional and capacity is only used for the per-event fill bar (guarded against `capacity = 0`).
- [x] T7 Consolidate shells: one `AppShellLayout` with sidebar props replacing `DashboardLayout`/`ParticipantLayout`; merge `DashboardSidebar`/`NavigationSidebar` — test first: layout render test — files: `src/layouts/`, `src/features/dashboard/components/`.
  - Evidence: `src/layouts/app-shell.ts` holds the view model (role → menu items + active flags, brand, section/role guard), `AppShellLayout.astro` is the only shell (`data-shell-role` on `<html>`, `data-shell-denied` when the role does not own the section) and `features/dashboard/components/Sidebar.astro` is the merged sidebar (props `items/title/subtitle/icon`). Deleted: `DashboardLayout.astro`, `ParticipantLayout.astro`, `DashboardSidebar.astro`, `NavigationSidebar.astro`; 15 pages updated (organizer, participant and the 3 admin pages).
  - Test: `app-shell.test.ts` (14 tests, happy-dom) — RED observed by temporarily removing the module ("5 failed / no tests"), GREEN after. Block totals after T7: **32 files / 306 tests green**, `astro check` 0 errors, build green.
  - Render proof: SSR of the built server shows `data-shell-role="organizer"` + Organizer Hub brand + the 6 organizer links with `/dashboard` active on `/dashboard`, `data-shell-role="participant"` + "Mis Carreras" + the 4 participant links on `/participant/dashboard/*`, `data-shell-role="admin"` on `/admin`, and the middleware redirects (organizer → participant area) landing on the dashboard shell. The `data-shell-denied` branch is unreachable over HTTP (the middleware redirects first) and is covered by the unit test.
  - Note: `.astro` components cannot be rendered by vitest here, so the "render test" is the view-model test plus the SSR assertion above. Admin sessions keep the organizer menu, exactly as the old `DashboardLayout` rendered for `/admin/**`.
- [x] T8 Registration flow end-to-end fix: registration exit page reads the actual registration; remove the placeholder `/registration/exito` (redirect in RegisterForm) — test first: e2e smoke — files: `src/pages/registration/`, `src/features/registration/`.
- [x] T9 Icon library consolidation to one package (currently `@lucide/astro` + `@tabler/icons(-react)`) — files: `package.json`, components.
  - Evidence: new `src/features/events/components/icons.tsx` (15 inline SVG components) replaces `@tabler/icons-react` in the three islands (`AddressPicker`, `DistanceRoutePreview`, `IconPicker`); `.astro` components keep `@lucide/astro`. `package.json` drops `@tabler/icons-react` and the unused `lucide` JS package.
  - Test first: `icons.test.tsx` (18 tests) + `icon-library.test.ts` (4 tests, scans the source tree for forbidden imports). RED: "Failed to load url ./icons" and 3 files importing `@tabler/icons-react`. GREEN: all 22 tests pass.
  - `@tabler/icons` **stays**: 10 vendored starwind components import its `.svg` files (`Checkbox`, `Dialog`, `Dropdown`, `RadioGroup`, `Select`×3, `Sheet`, `SidebarTrigger`, `Tooltip`). Converting those is a separate change.
  - Block totals after T9: **34 files / 328 tests green**, `astro check` 0 errors.
  - ⚠️ `pnpm-lock.yaml` was **not** regenerated (outside this task's edit surface): run `pnpm install` and commit the lockfile, otherwise CI's `pnpm install --frozen-lockfile` fails.
- [x] T10 Bundle diet (ordered, extends PLAN-10): measure baseline (`astro build` + chunk sizes), convert `RouteList` to `.astro` + script, mount `DistanceRoutePreview` as an island instead of `createElement` in the event page, lazy-route recharts/leaflet islands behind `client:visible`, Preact spike under the measurable criterion of ADR-9 — test first: keep island tests green, bundle diff in PR body — files: `src/features/events/**`, `astro.config.mjs`.
  - T10.1 baseline (`astro build`, raw bytes of `dist/client/_astro/*.js`): `ElevationProfile` 355,842 · `client` (React runtime) 207,396 · `leaflet-src` 148,731 · `validation` 92,230 · `ItineraryEditor` 50,448 · `_eventSlug_` page script 30,031 · `client.CMnqbhkF` 12,358 · `Select` 10,502 · `Dropdown` 9,741 · `Tooltip` 9,468 (plus `RouteUploadForm` 8,691, `react` 8,529, `_astro_actions` 8,358, `RouteList` 4,321, `AddressPicker` 3,503, `RouteViewer` 2,492).
  - T10.2 `RouteList` is now `RouteList.astro` (server-rendered table + empty state) plus `route-list.client.ts` (8 tests: confirm, delete, error, in-flight, destroy, wiring) and `route-list.boot.ts` (the only place importing `astro:actions`). The React island and its `client:load` are gone. No `RouteList` test existed before (the report assumed one), so nothing was deleted.
  - T10.3 `DistanceRoutePreview` is a real island (`client:visible`) inside the distance `<template>`; because a cloned card cannot receive props, it announces `kinetix:gpx-loaded` / `kinetix:gpx-cleared` DOM events and the editor script fills the card's hidden `gpx_filename` (2 new tests in `DistanceRoutePreview.test.tsx`; the manual `createRoot` mount module is deleted). Verified in headless Chromium: the cloned island hydrates (`ssr` attribute removed), a GPX upload reaches the right card's hidden field, the map renders, clearing empties it, and a second card gets its own island instance.
  - T10.4 `client:load` is gone repo-wide: `RouteViewer` (`EventDescription.astro`) and `RouteUploadForm` (`routes.astro`) are `client:visible`; `RouteMap`/`ElevationProfile` stay lazy children; `AddressPicker`/`ItineraryEditor` stay `client:only="react"`.
  - T10.5 re-measure (same build, raw bytes): `_eventSlug_` page script 30,031 → 24,643 (−5,388); `ItineraryEditor` 50,448 → 48,860 (−1,588); `AddressPicker` 3,503 → 3,118 (−385); `RouteList` 4,321 → `RouteList.astro` script 1,300 (−3,021); `DistanceRoutePreview` 0 (inlined in the page script) → 4,279 own chunk, hydrated only when visible; new shared `icons` chunk 2,220; React runtime 207,396 → 209,191 (+1,795, it now carries the `visible` directive); `ElevationProfile`/`leaflet`/`validation` unchanged. Event-editor eager island JS 291,378 → 285,812 (−5,566 raw, −1.9%); the routes page no longer hydrates a React list. Numbers and the full table are in `docs/reports/ISLANDS_AND_PREACT.md`.
  - Preact swap **not attempted** (ADR-9 stays Proposed, per the task constraint).
- [ ] T11 Docs freshness: update `AGENTS.md` (Astro 7, real feature list — no svelte reference, e2e exists) and `README.md` (mock-data section now `lib/` helpers) — files: `AGENTS.md`, `README.md`.
- [x] T12 Env template: document `API_URL` in `.env.example` with the comment "server-side only", replacing `API_URL` leftovers and remove the Tailwind 3 leftover `tailwind.config.mjs` — blocked by the guard on `.env.example` (user must paste the line) — files: `.env.example` (user), `tailwind.config.mjs` (delete).

## Log
- 2026-11-06 (parent, inline): T2 applyFieldRequirements (4 tests) wired via the page config <script>; T3 slug guard + test; T5 decode-before-match in resolveAccess (33/33 route-guard+middleware tests) with the redirect param now carrying the decoded path; T8 cookie handoff (registration-data, 900s, httpOnly) with test; T11 AGENTS.md/README refreshed; T12 tailwind.config.mjs deleted. .env.example remains blocked by the safety policy: add `API_URL=http://localhost:8085/api/v1` (server-side only comment). The untracked placeholder page `src/pages/registration/exito.astro` is unreferenced and can be deleted by the user.

## Verification
```bash
cmd.exe /c "node node_modules\\vitest\\vitest.mjs run"   # or reinstall deps under WSL
cmd.exe /c "node node_modules\\astro\\bin\\astro.mjs check"
cmd.exe /c "node node_modules\\astro\\bin\\astro.mjs build"
pnpm test:e2e            # backend (docker compose up) needed
```
Last run after T4/T6/T7/T9/T10 (2026-11-10): `astro check` **0 errors** (297 files), `astro build` green, `vitest run` **35 files / 338 tests** green (block start: 25 / 230). `pnpm test:e2e` was **not** run (needs the backend + docker compose); the pages that changed were instead verified against the built Node server with a stub API and headless Chromium.

Open items owned by the parent: regenerate `pnpm-lock.yaml` after the `package.json` dependency removals (T9); `e2e/tests/05-organizer-dashboard.spec.ts` still asserts the old mock event names (`Valencia|NEON|Coastal|Summit`) and needs updating for real data (outside this task's edit surface); `src/pages/admin/payments.astro` calls `actions.admin.listPayouts` without `Astro.callAction` (pre-existing 500, unrelated to the shell change).
Acceptance: `astro check` exits 0; every placeholder page either consumes real data or renders an explicit empty state; the bundle report shows a drop in gz bytes for the island chunk used by the event page.

## Risks and rollback
- T4 is the biggest refactor: split behind a feature flag (`PUBLIC_EVENT_EDITOR=...`)? Not needed — but commit per extracted section.
- Rollback: per-commit revert; each task is independent.

## Open questions
- Where is the real `participantFieldsConfig` payload defined? (backend `event_field_config`) — needs a contract check with the backend before T1g/T2.
- Should `/results` and `/admin` pages be replaced by real implementations or removed from the nav for a release? needs the user's product call.

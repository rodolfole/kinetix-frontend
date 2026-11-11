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
- [ ] T4 Split `src/pages/dashboard/events/[eventSlug].astro` (2,022 lines incl. ~1,170 inline script) into feature modules (form sections, field-config editor, pricing, awards, sponsors, locations, route preview forum) — test first: extract each piece with a unit test — files: `src/pages/dashboard/events/`, `src/features/events/**`.
- [x] T5 Route guard robustness: test URL-decoded paths (`/%61dmin`, `/events/x/%72egistration`) against Astro route matching and normalize in `resolveAccess` — test first: `route-guard.test.ts` cases — files: `src/lib/route-guard.ts`.
- [ ] T6 Dashboards on the API: organizer stats/events (currently hardcoded), participant registrations/history; add `dashboard.action.ts` — test first: action tests with fake fetch — files: `src/features/dashboard/**`, pages under `src/pages/dashboard` and `src/pages/participant`.
- [ ] T7 Consolidate shells: one `AppShellLayout` with sidebar props replacing `DashboardLayout`/`ParticipantLayout`; merge `DashboardSidebar`/`NavigationSidebar` — test first: layout render test — files: `src/layouts/`, `src/features/dashboard/components/`.
- [x] T8 Registration flow end-to-end fix: registration exit page reads the actual registration; remove the placeholder `/registration/exito` (redirect in RegisterForm) — test first: e2e smoke — files: `src/pages/registration/`, `src/features/registration/`.
- [ ] T9 Icon library consolidation to one package (currently `@lucide/astro` + `@tabler/icons(-react)`) — files: `package.json`, components.
- [ ] T10 Bundle diet (ordered, extends PLAN-10): measure baseline (`astro build` + chunk sizes), convert `RouteList` to `.astro` + script, mount `DistanceRoutePreview` as an island instead of `createElement` in the event page, lazy-route recharts/leaflet islands behind `client:visible`, Preact spike under the measurable criterion of ADR-9 — test first: keep island tests green, bundle diff in PR body — files: `src/features/events/**`, `astro.config.mjs`.
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
Acceptance: `astro check` exits 0; every placeholder page either consumes real data or renders an explicit empty state; the bundle report shows a drop in gz bytes for the island chunk used by the event page.

## Risks and rollback
- T4 is the biggest refactor: split behind a feature flag (`PUBLIC_EVENT_EDITOR=...`)? Not needed — but commit per extracted section.
- Rollback: per-commit revert; each task is independent.

## Open questions
- Where is the real `participantFieldsConfig` payload defined? (backend `event_field_config`) — needs a contract check with the backend before T1g/T2.
- Should `/results` and `/admin` pages be replaced by real implementations or removed from the nav for a release? needs the user's product call.

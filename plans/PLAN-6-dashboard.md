# PLAN-6: Dashboard

- Status: In progress
- Created: 2026-09-15 | Updated: 2026-11-06
- Spec: docs/specs/SPEC-dashboard.md
- ADRs: ADR-2, ADR-6

## Goal
Organizers see their events, KPIs and participants; participants see their own registrations, each behind a role-gated shell.

## Scope
### In
- Organizer pages: home, events list/detail, participants, reports, settings.
- Participant dashboard pages and shared dashboard components.
### Out
- Editable participants/settings forms and real report charts (static placeholders).

## Design
Role gating lives in `src/middleware.ts` (ADR-6). `DashboardLayout` and `ParticipantLayout` duplicate the shell (noted in `docs/ARCHITECTURE.md`).

## Tasks
- [ ] T1 Action layer `getStats` and `getOrganizerEvents` (fallback when `organizer_id=me` is unsupported) — test first: `src/features/dashboard/actions/dashboard.action.test.ts` — files: `src/features/dashboard/actions/dashboard.action.ts` (does not exist; pages call the API directly)
- [x] T2 Shared components (`DashboardSidebar`, `NavigationSidebar`, `EventCard`, `StatCard`, `PageHeader`, `UserActions`, `FormSection`) — files: `src/features/dashboard/components/*`
- [x] T3 Organizer home — files: `src/pages/dashboard/index.astro`
- [x] T4 Organizer events list and detail — files: `src/pages/dashboard/events/index.astro`, `[eventSlug].astro`
- [x] T5 Organizer participants list — files: `src/pages/dashboard/participants/index.astro`
- [x] T6 Reports and settings placeholders — files: `src/pages/dashboard/reports/index.astro`, `settings/index.astro`
- [x] T7 Participant dashboard (plus history, profile, registrations, settings pages) — files: `src/pages/participant/dashboard/**`
- [ ] T8 Replace hardcoded dashboard numbers with API data — test first: dashboard action test (T1) — files: `src/pages/dashboard/index.astro`, `src/pages/participant/dashboard/*`
- [x] T9 E2E dashboards — files: `e2e/tests/05-organizer-dashboard.spec.ts`, `06-participant-dashboard.spec.ts`

## Verification
`pnpm astro check`, `pnpm test`, `pnpm test:e2e` (specs 05, 06); KPI tiles match backend data.

## Risks and rollback
Dashboard pages currently render hardcoded values in places. T1 blocks T8. Rollback: per-page revert.

## Open questions
- Unify the two layouts into one `AppShellLayout`?

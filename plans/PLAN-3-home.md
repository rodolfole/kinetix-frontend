# PLAN-3: Home

- Status: Done
- Created: 2026-09-15 | Updated: 2026-11-06
- Spec: docs/specs/SPEC-home.md
- ADRs: ADR-2, ADR-5

## Goal
The public landing page renders a hero and an SSR-fetched events grid with no client JS, and degrades to an empty state when the backend is down.

## Scope
### In
- `/` landing page, hero, events grid, `getEvents` action, reuse of the grid at `/events`.
### Out
- Filtering, pagination, search (events feature); client interactivity.

## Design
`EventsGrid.astro` fetches in its frontmatter through the `home.getEvents` action and returns `[]` on failure. The grid is reused by `src/pages/events/index.astro`.

## Tasks
- [x] T1 Scaffold `src/features/home/{actions,components}` — files: `src/features/home/**`
- [x] T2 Write typed `getEvents(limit)` action returning `[]` on empty/failed response — files: `src/features/home/actions/home.action.ts`
- [x] T3 Build `HeroSection.astro` with default Spanish copy and overridable props — files: `src/features/home/components/HeroSection.astro`
- [x] T4 Build `EventsGrid.astro` with empty state "Aún no hay eventos publicados." — files: `src/features/home/components/EventsGrid.astro`
- [x] T5 Compose landing page (`HeroSection`, `SearchFilterBar`, `EventsGrid`, `NewsletterCTA`) — files: `src/pages/index.astro`
- [x] T6 Reuse the grid at `/events` — files: `src/pages/events/index.astro`
- [x] T7 Add E2E home flow — files: `e2e/tests/01-home.spec.ts`
- [ ] T8 Unit test `getEvents` (parses `data`, falls back to `[]`, forwards `limit`) — test first: `src/features/home/actions/home.action.test.ts` — see PLAN-9 characterization tasks

## Verification
`pnpm build`; `curl http://localhost:4325/` returns 200 with hero and cards; with the backend stopped the empty-state copy renders without throwing.

## Risks and rollback
The action swallows backend errors into an empty list, so an outage looks like "no events". Rollback: revert the feature folder.

## Open questions
- None.

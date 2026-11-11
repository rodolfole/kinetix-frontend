# PLAN-4: Events

- Status: In progress
- Created: 2026-09-15 | Updated: 2026-11-06
- Spec: docs/specs/SPEC-events.md
- ADRs: ADR-3, ADR-5, ADR-7

## Goal
Visitors browse a public catalog and open event details; organizers manage events and routes from the dashboard.

## Scope
### In
- Public `/events` list and `/events/:slug` detail (hero, description, distances, runner kit, pricing, itinerary, CTA).
- Event action layer, types, island components (address picker, itinerary editor, route viewer/upload).
### Out
- Registration form (PLAN-5), tag pills (PLAN-7), bundle reduction (PLAN-10).

## Design
Public pages are pure Astro; optional sections render nothing when their array is empty. Data flows page -> Astro action -> `api` -> component. The planned `EventService` class and per-feature Zod response schemas were not built: `features/events/{schemas,services}/` are empty and `event.action.ts` maps backend snake_case to the `BaseEvent` types directly.

## Tasks
- [x] T1 Define event and route types — files: `src/features/events/types/event.type.ts`, `route.type.ts`
- [ ] T2 Add Zod response schemas and parse every API response at the boundary — test first: `src/features/events/schemas/event.schema.test.ts` — files: `src/features/events/schemas/event.schema.ts`
- [x] T3 Event actions (list, by slug, detail, create/update, routes) — files: `src/features/events/actions/event.action.ts`
- [x] T4 Build Astro components (`EventCard`, `EventCTA`, `EventHero`, `EventDescription`, `EventDistances`, `EventRunnerKit`, `EventPricing`, `EventItineraryTimeline`) — test first: `EventCard.test.tsx`, `EventDescription.test.tsx` — files: `src/features/events/components/*.astro`
- [x] T5 Listing page — files: `src/pages/events/index.astro`
- [x] T6 Detail page — files: `src/pages/events/[slug]/index.astro`
- [x] T7 Organizer islands with tests (`AddressPicker`, `IconPicker`, `ItineraryEditor`, `DistanceRoutePreview`, `RouteMap`) — files: `src/features/events/components/*.tsx`
- [x] T8 Organizer event pages and route upload — files: `src/pages/dashboard/events/[eventSlug].astro`, `[slug]/routes.astro`
- [x] T9 E2E event detail — files: `e2e/tests/04-event-detail.spec.ts`
- [ ] T10 Characterization tests for `event.action.ts` — see PLAN-9

## Verification
`pnpm astro check`, `pnpm test`, `pnpm build`; `/events` and `/events/<known-slug>` return 200; unknown slug does not 500.

## Risks and rollback
Backend may omit `distances`, `runner_kit` or `sponsors` (sections are conditional). `[eventSlug].astro` is ~1,900 lines of inline script (PLAN-10). Rollback: revert pages and components per task.

## Open questions
- Whether to keep the Zod boundary (T2) or drop it in favor of typing the action output only.

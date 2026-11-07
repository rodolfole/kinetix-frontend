# PLAN-7: Tags

- Status: In progress
- Created: 2026-09-15 | Updated: 2026-11-06
- Spec: docs/specs/SPEC-tags.md
- ADRs: ADR-2

## Goal
Event tags render as consistent pills on the event description.

## Scope
### In
- Presentational tag pills inside the event description; tags come from `BaseEvent.tags: string[]`.
### Out
- Tag CRUD UI, tag filtering, a tags service layer.

## Design
No `src/features/tags/` folder exists. `EventDescription.astro` maps `event.tags` to spans inline; the planned reusable `TagPills.astro` was not created.

## Tasks
- [ ] T1 Extract `TagPills.astro` (renders nothing for empty/undefined) — test first: `src/features/tags/TagPills.test.ts` — files: `src/features/tags/TagPills.astro`
- [x] T2 `EventDescription.astro` renders description and tags — test first: `src/features/events/components/EventDescription.test.tsx` — files: `src/features/events/components/EventDescription.astro`
- [ ] T3 Make `EventDescription` use `TagPills` and accept optional `tags?: string[]` — files: `src/features/events/components/EventDescription.astro`

## Verification
`pnpm test`; the event detail page shows pills for an event with tags and none for an event without.

## Risks and rollback
Low. Rollback: inline markup stays as is.

## Open questions
- Is extracting `TagPills` worth it, or should the spec be reduced to the inline rendering?

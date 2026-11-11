# SPEC — Tags (per-event pills)

- Status: Partial
- Plan: plans/PLAN-7-tags.md

## 1. Objective

Render each event's tags as styled "pill" UI elements. This is a small UI helper that lives alongside the events feature, not a service or repository.

## 2. Scope

In scope:

- A reusable `TagPills.astro` component that accepts `tags: string[]` and emits one styled `<span>` per tag.
- The event description view (`EventDescription.astro`) consumes `TagPills` and renders the `tags: string[]` it receives (already present on the event detail payload from `GET /events/{id}/detail` as `Tags []string`).

Out of scope:

- A separate tags service, repository, or admin UI for managing tags.
- Tag CRUD against `/events/{eventId}/tags` (the backend endpoint exists but no management UI is in this feature).
- Tag-based filtering on the public events list.

## 3. Functional requirements

- `TagPills` renders nothing when the input array is empty or undefined.
- Each tag is rendered as a small, rounded `<span>` with consistent spacing.
- The component is purely presentational — no fetches, no client-side JS.
- `EventDescription.astro` accepts `tags?: string[]` and renders `TagPills` above (or near) the description body.

## 4. Non-functional requirements

- Tailwind utility classes only; matches the visual language of the rest of the site.
- No new dependencies.
- This feature has no service / repository layer — a deliberate simplification. The data model is `BaseEvent.tags: string[]`, so the only "API contract" is the existing `EventDetailResponse.tags` field.

## 5. Acceptance criteria

- An event with no tags renders without an empty pills block.
- An event with three tags renders exactly three pills.
- Pills use the same base style (rounded-full, light background, small text).

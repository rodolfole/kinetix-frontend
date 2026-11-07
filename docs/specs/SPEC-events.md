# Spec: Events

- Status: Partial
- Plan: plans/PLAN-4-events.md

## Objective

Expose a public-facing catalog of running events published on Kinetix. Visitors can browse a list of upcoming races, open an event detail page to read the description, distances, runner kit, sponsors and itinerary, and follow a CTA into the registration flow.

**User stories**
- As a visitor, I can see all published events on `/events` without authenticating.
- As a visitor, I can open `/events/:slug` to see the full event details.
- As a visitor, I can click "Inscribirme" to navigate to the registration flow.

**Acceptance**
- `/events` SSR-fetches the event list and renders a grid of cards.
- `/events/:slug` SSR-fetches the detail and renders hero + description + distances + runner kit + sponsors + itinerary.
- Both routes are public (no auth required) — middleware already exempts `/events/*`.
- Optional sub-resources (runner_kit, sponsors, distances) hide their section when the API does not return them.

## Tech Stack

- Astro 7.1.3 (SSR, `output: 'server'`, `@astrojs/node` standalone)
- React 19.2.7 (not used in this feature — pure Astro components)
- Tailwind 4 via `@tailwindcss/vite`
- TypeScript 6 (strict)
- Zod 4 for response schemas
- `apiFetch` from `src/lib/api.ts` (already configured for `http://localhost:8085/api/v1`)

## Commands

```bash
npm run dev                  # Astro dev server on :4325
npm run build                # Production build
npm test                     # Vitest unit tests (covers schemas)
npm run test:e2e             # Playwright (requires backend on :8085)
```

## Project Structure

```
src/features/events/
├── types/event.type.ts                 # Event, EventDetail, Distance, RunnerKitItem, Sponsor
├── schemas/event.schema.ts             # Zod schemas for API responses
├── services/EventService.ts            # class wrapping apiFetch calls
├── actions/event.action.ts             # exported helpers used by pages
└── components/
    ├── EventCard.astro                 # card for the listing grid
    ├── EventCTA.astro                  # "Inscribirme" link
    ├── EventHero.astro                 # hero with name + date + address
    ├── EventDescription.astro          # description + optional tag pills
    ├── EventDistances.astro            # distances list
    └── EventRunnerKit.astro            # runner kit list

src/pages/events/
├── index.astro                         # SSR list
└── [slug]/index.astro                  # SSR detail
```

## Code Style

- Astro frontmatter (between `---`) is the only place where SSR fetching happens; UI components are pure.
- Sub-resource sections render nothing when their data is absent (no empty-state noise).
- Snake_case stays snake_case on the wire (the API returns snake_case); we do not reshape unless a screen needs a derived field.
- One screen per file under `src/pages/events/`; reusable pieces go in `src/features/events/components/`.
- All styles are Tailwind utility classes — no inline `<style>` blocks.

## Testing Strategy

- **Schema tests** (`*.schema.ts`): vitest unit tests parse real API responses from a fixture and assert the parser rejects malformed payloads.
- **Pure helpers**: none required for this feature (everything is rendering).
- **E2E**: Playwright hits `/events`, asserts ≥1 card, clicks into a slug, asserts the hero name is visible. Lives in `e2e/tests/events.spec.ts`.
- **Coverage**: schemas must reach ≥80% line coverage; UI smoke is the e2e.

## Boundaries

- **Always:** validate API responses with the Zod schema at the boundary (`EventService`); render `null` for optional sub-resources when the API returns them empty.
- **Ask first:** adding new endpoints, changing the apiFetch contract, adding a state-management library.
- **Never:** call the API directly from `.astro` components — go through `EventService`/`actions`; expose the access token to the client.

## Success Criteria

1. `npm run build` passes with zero TypeScript errors.
2. `GET /events` returns a grid of at least one card from the live backend.
3. `GET /events/:slug` renders name, date, description, distances, runner kit, sponsors (when present), itinerary.
4. Clicking a card navigates to the detail page; clicking "Inscribirme" navigates to `/events/:slug/registration`.
5. Optional sections (distances, runner kit, sponsors, itinerary) hide themselves when the API does not include them — no broken layout.
6. No auth required for any of these routes.

## Open Questions

- Whether the backend will eventually expose `runner_kit` and `sponsors` on `/events/slug/:slug` (currently the detail endpoint returns the base event only; the page already handles their absence gracefully).
- Whether the organizer will be allowed to publish "draft" events publicly — current behavior is to render everything returned by `/events`.

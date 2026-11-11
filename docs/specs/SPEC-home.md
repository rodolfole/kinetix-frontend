# SPEC — home feature

- Status: Implemented
- Plan: plans/PLAN-3-home.md

## Objective

Provide the public landing page (`/`) for Kinetix. Render a marketing hero and an
SSR-fetched grid of upcoming events so unauthenticated visitors can immediately
discover what's on the calendar without any client-side JS.

**Why it exists**: The home page is the entry point for both participants
(browsing events) and organizers (judging whether to sign up). It must render
content with zero JS hydration so it stays fast and indexable.

**In scope**:
- Server-rendered landing page at `src/pages/index.astro`
- Hero section (title, subtitle, CTA)
- Events grid that pulls from `GET /api/v1/events` at request time
- Typed wrapper around the events endpoint

**Out of scope**:
- Event detail pages (handled by the `events` feature)
- Filtering, pagination, search (handled by the `events` feature)
- Client-side interactivity (Astro-only, no React island needed)

## Tech Stack

- **Astro 7** with `output: 'server'` (already configured)
- **Tailwind 4** via `@tailwindcss/vite` (utility classes only, no custom CSS)
- **TypeScript strict** (path alias `@features/*` → `src/features/*`)
- **`apiFetch<T>`** from `src/lib/api.ts` — the only network primitive

No new dependencies. No React components (pure Astro template).

## Commands

```bash
# Dev server (frontend on :4325, backend on :8085)
npm run dev

# Build + preview
npm run build && npm run preview

# Tests (vitest, when wired in tests/)
npm test
```

## Project Structure

```
src/
├── pages/
│   ├── index.astro                       # entry, composes HeroSection + EventsGrid
│   └── events/
│       └── index.astro                   # placeholder, reuses EventsGrid
├── features/
│   └── home/
│       ├── actions/
│       │   └── home.action.ts            # getEvents() -> Event[]
│       └── components/
│           ├── HeroSection.astro         # marketing hero
│           └── EventsGrid.astro          # SSR-fetched event grid
└── lib/
    └── api.ts                            # apiFetch wrapper (read-only)
```

## Code Style

**Action pattern** — typed wrapper around the API, returns the unwrapped array:

```ts
// src/features/home/actions/home.action.ts
export async function getEvents(limit = 12): Promise<Event[]> {
  const res = await apiFetch<EventsListResponse>(`/events?limit=${limit}`);
  return res?.data ?? [];
}
```

**SSR fetch in Astro frontmatter** — runs server-side on every request, no
client JS shipped:

```astro
---
import { getEvents } from '@features/home/actions/home.action';
const events = await getEvents(12);
---
<section>
  {events.length === 0 ? <p>No hay eventos.</p> : events.map((evt) => (
    <article>
      <h3>{evt.name}</h3>
      <a href={`/events/${evt.slug}`}>Ver detalles →</a>
    </article>
  ))}
</section>
```

**Styling** — Tailwind utilities only, no `<style>` blocks. Dark backgrounds
come from `bg-gradient-to-br`; status badges use color-coded rounded pills.

## Testing Strategy

Tests will live under `tests/` once vitest is configured (see `docs/TESTING.md`).

- **Unit**: `getEvents()` returns `[]` when the API payload is missing,
  unwraps `data` correctly, passes `limit` to the query string.
- **Integration**: with the backend up, `GET /` returns 200 and HTML
  containing the seeded event names.
- **E2E (Playwright)**: home page loads, hero CTA navigates to `/events`,
  cards link to `/events/{slug}`.

## Boundaries

- **Read-only**: no POST/PUT/DELETE from this feature.
- **No auth coupling**: middleware allows `/` publicly; this page must work
  with zero cookies set.
- **No client-side fetch**: the grid is rendered server-side; an empty grid
  is a real empty grid, not a loading state.
- **No React island**: if interactivity is ever needed, promote this to a
  feature with a React component. Don't add `client:*` directives here.

## Success Criteria

1. `GET /` returns 200 with HTML containing the seeded events from the backend.
2. The hero section renders without any JS being executed.
3. Each event card links to `/events/{slug}`.
4. When the backend is unreachable, the grid degrades to "No hay eventos
   publicados" without crashing the request.
5. No new dependencies added; existing `lib/api.ts` is the only network path.

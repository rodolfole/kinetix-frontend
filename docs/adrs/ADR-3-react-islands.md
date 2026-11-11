# ADR-3: React 19 islands for interactivity

- Status: Accepted
- Date: 2026-09-15
- Deciders: Kinetix team
- Related: ADR-1, ADR-7, ADR-9, docs/ARCHITECTURE.md, docs/PATTERNS.md

## Context
Most pages are static content, but a few widgets need client state: itinerary editor with drag and drop, address search, icon picker, route map with elevation chart, GPX upload. The team knows React, and the required libraries (`@dnd-kit`, `recharts`, `@tabler/icons-react`) are React-only. The project has no Svelte (only a stale `svelte` glob in `tailwind.config.mjs`).

## Decision
Use `@astrojs/react` (React 19) for islands only; everything else is `.astro`. `tsconfig.json` sets `jsx: react-jsx`, `jsxImportSource: react`. Heavy libraries are loaded lazily inside islands (`React.lazy` for `RouteMap` and `ElevationProfile`; dynamic `import('leaflet')`). Current islands (`src/features/events/components/`):

| Island | Mounted in | Directive |
|---|---|---|
| `RouteViewer` | `EventDescription.astro` | `client:load` |
| `AddressPicker` | `pages/dashboard/events/[eventSlug].astro` | `client:only="react"` |
| `ItineraryEditor` | `pages/dashboard/events/[eventSlug].astro` | `client:only="react"` |
| `RouteUploadForm` | `pages/dashboard/events/[slug]/routes.astro` | `client:load` |
| `RouteList` | `pages/dashboard/events/[slug]/routes.astro` | `client:load` |
| `DistanceRoutePreview` | `[eventSlug].astro` inline `<script>` (manual `createRoot`) | none (manual) |

Islands call Astro Actions (`RouteList` uses `actions` from `astro:actions`) and communicate with page scripts through DOM events such as `kinetix:address-selected` (`AddressPicker`).

## Consequences
### Positive
- Pages without islands ship no React.
- Full React ecosystem for the editor and charts; Testing Library works for component tests.

### Negative / risks
- `[eventSlug].astro` mounts `DistanceRoutePreview` manually with `createRoot` + `createElement` inside a large page script (line ~845-1010), bypassing Astro's hydration and directives. Target: a real island or a form-section component.
- `RouteViewer` and `RouteUploadForm` use `client:load`, though route viewing is below the fold on the event page; `client:visible` is the preferred directive in `PATTERNS.md`.
- `RouteUploadForm.tsx` calls the backend directly from the browser (see ADR-5).
- React 19 + react-dom is the largest shared client chunk in the existing `dist/` (see ADR-9).
- `AGENTS.md` says "all components are `.astro`", contradicting this ADR.

## Alternatives considered
- **Svelte/Solid/Preact**: smaller runtimes, but would not run `@dnd-kit`/`recharts` unchanged (Preact is evaluated in ADR-9).
- **Vanilla `<script>` in `.astro`**: right for small widgets (see PATTERNS "Islands"); impractical for the itinerary editor.
- **Full SPA**: loses static-first benefits (ADR-1).

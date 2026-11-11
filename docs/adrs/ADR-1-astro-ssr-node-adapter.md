# ADR-1: Astro SSR with the Node adapter

- Status: Accepted
- Date: 2026-09-15
- Deciders: Kinetix team
- Related: ADR-3, ADR-5, ADR-6, docs/ARCHITECTURE.md

## Context
Kinetix web shows public event pages (SEO, fast first paint) and authenticated dashboards that depend on per-request cookies and live backend data (registrations, payouts). Events change often, so build-time prerendering of every page is not an option, and the session cookie must be readable on the server before rendering.

## Decision
Use Astro with `output: 'server'` and the `@astrojs/node` adapter in `standalone` mode (`astro.config.mjs`). Pages render on the server per request; `site` is `https://kinetix.events`. The app ships as a single Node process (`engines.node >=22.12.0`). Dev server runs on port 4325 (`package.json`).

## Consequences
### Positive
- HTML is rendered with real data per request; middleware (ADR-6) and Astro Actions (ADR-5) run server-side with access to httpOnly cookies.
- Zero JavaScript by default; interactivity is opt-in per island (ADR-3).
- One deployable artifact (`dist/server/entry.mjs`), no separate BFF service.
- `PERFORMANCE_REPORT.md` measured Lighthouse desktop 99, mobile 86 on the home page.

### Negative / risks
- Every page costs a server render and a backend round trip; there is no response caching layer yet.
- The backend URL is hardcoded as `http://localhost:8085/api/v1` in `src/lib/api.ts` (and `routes/RouteUploadForm.tsx`), so the build is not environment-portable. Target: `import.meta.env.KINETIX_API_URL`.
- `AGENTS.md` still says "Astro 6.x"; `package.json` pins `^7.1.3`.
- Needs a Node host (not static hosting); a health endpoint and deployment doc are missing.

## Alternatives considered
- **Static output (`output: 'static'`)**: cheapest to host, but event data and dashboards are per-request; rejected.
- **Hybrid with prerendered public pages**: viable later for `/` and event pages with revalidation; not adopted because there is no cache invalidation from the backend.
- **Next.js / SPA (React only)**: heavier client JS and a second routing model; rejected in favor of static-first HTML with islands.

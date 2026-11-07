# Architecture

Kinetix web is the user-facing side of the running-events platform: public event discovery, event detail with routes, participant registration, the organizer dashboard (event editor, GPX routes) and an admin area for commissions and payouts. All data comes from the Kinetix API (`backend/`).

## Stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | Astro 7, `output: 'server'` | `@astrojs/node` standalone adapter |
| Interactivity | React 19 islands via `@astrojs/react` | Only where needed, see [ADR-3](adrs/ADR-3-react-islands.md) |
| Styling | Tailwind CSS 4 via `@tailwindcss/vite` | Tokens in `src/styles/global.css` |
| UI kit | Starwind (copied into `src/components/starwind`) | See [ADR-4](adrs/ADR-4-starwind-ui-and-design-tokens.md) |
| Server logic | Astro Actions + Zod | See [ADR-5](adrs/ADR-5-astro-actions-backend-gateway.md) |
| Maps / charts / DnD | Leaflet, Recharts, dnd-kit | Lazy-loaded inside islands |
| Tests | Vitest + happy-dom + Testing Library, Playwright | See [TESTING.md](TESTING.md) |

There is no Svelte in this project. `tailwind.config.mjs` lists `svelte` in a content glob only; the file is a Tailwind 3 leftover.

## Layout

```
src/
  pages/            routes (file-based). Thin: load data, compose components
  layouts/          Layout (html shell), MainLayout, DashboardLayout, ParticipantLayout
  actions/index.ts  registry: exports every feature's actions under one `server` object
  middleware.ts     auth guard and role redirects
  features/<f>/
    actions/        <name>.action.ts   (server only, calls the API)
    schemas/        <name>.schema.ts   (Zod, shared by action and form)
    types/          <name>.type.ts
    consts/         index.ts
    components/     .astro components, .tsx islands, colocated *.test.tsx
    index.ts        barrel: public API of the feature
  shared/components common UI used by 2+ features (Navbar, Footer, forms)
  components/starwind  generated UI kit, edited only through Starwind
  lib/              framework-free utilities (api client, cookies, slug, formatting)
  styles/           global.css (tokens), starwind.css
```

Features: `auth`, `home`, `events`, `registration`, `dashboard`, `admin`.

## Data flow

```
Browser ──form/fetch──> Astro Action (server) ──lib/api.ts──> Kinetix API
Page (SSR) ──Astro.callAction / api.get──> Kinetix API
Island (client) ──actions.<feature>.<name>()──> Astro Action ──> Kinetix API
```

- The browser never calls the Kinetix API directly. Tokens live in httpOnly cookies, so only server code can attach `Authorization`.
- The API contract is defined in `backend/docs/API_CONTRACTS.md`. Backend response types are declared once per feature in `types/` and mapped to view models in the action.

## Auth and routing

`src/middleware.ts` runs on every request:
1. Public routes pass through.
2. Private routes need the `access_token` and `user` cookies; otherwise redirect to `/auth/login?redirect=<encoded path>`.
3. Role routing: `/dashboard/*` organizer or admin, `/participant/dashboard/*` participant or admin, `/admin/*` admin only.

Cookies (`lib/cookies.ts`): `access_token` and `refresh_token` httpOnly, `sameSite=lax`, `secure` in production. `user` is readable by the client for UI only and is never trusted for authorization.

## Rules

1. **Pages are thin.** A page loads data and composes components. No business logic, no `<script>` over ~50 lines; move it into a feature component or island.
2. **Static first.** `.astro` by default. A React island only for state that changes after load (editors, maps, drag and drop). Prefer `client:visible` / `client:idle`; `client:load` only above the fold.
3. **One way to call the API**: `lib/api.ts` from server code, through an action. Base URL from `import.meta.env.KINETIX_API_URL`, never hardcoded.
4. **Validation lives in the feature `schemas/`** and is reused by the action and the form. `lib/` holds no Zod schemas and no DOM code.
5. **Types once.** Backend DTO types live in the feature `types/`, never redeclared in actions.
6. **Shared means used by 2+ features.** Otherwise it stays in the feature.
7. **No mock data in pages.** Pages without an API yet render an explicit empty state.

## Known gaps (target state)

| Gap | Where | Target |
|---|---|---|
| `[eventSlug].astro` is 2,000+ lines with ~1,200 lines of inline script | `src/pages/dashboard/events/` | Rule 1: split into feature components |
| API base URL hardcoded, also in `RouteUploadForm.tsx` (browser calls API directly) | `src/lib/api.ts`, `routes/RouteUploadForm.tsx` | Rule 3 |
| Zod schemas and DOM helpers in `lib/validation.ts`, duplicated in `registration.schema.ts` | `src/lib/` | Rule 4 |
| `Backend*` types redeclared in `event.action.ts` and `home.action.ts` | `features/events`, `features/home` | Rule 5 |
| Dashboards render hardcoded numbers | `pages/dashboard/index.astro`, `pages/participant/dashboard/*` | Rule 7 |
| `/admin/*` has no role check; `/events/*/registration` is public | `src/middleware.ts` | Auth rule 3 |
| `DashboardLayout` and `ParticipantLayout` duplicate the shell | `src/layouts/` | One `AppShellLayout` with a sidebar prop |

Details in [reports/CODE_AUDIT.md](reports/CODE_AUDIT.md) and [reports/ISLANDS_AND_PREACT.md](reports/ISLANDS_AND_PREACT.md).

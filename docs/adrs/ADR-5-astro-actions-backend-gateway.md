# ADR-5: Astro Actions as the backend gateway

- Status: Accepted
- Date: 2026-09-15
- Deciders: Kinetix team
- Related: ADR-1, ADR-6, docs/PATTERNS.md, docs/ARCHITECTURE.md, backend/docs/API_CONTRACTS.md

## Context
The Go backend exposes a REST API at `/api/v1`. The browser holds the session in httpOnly cookies (ADR-6), so it cannot attach `Authorization` itself, and exposing the API origin to the client adds CORS and token-leak surface. Inputs need validation on both sides with one schema.

## Decision
All browser-to-backend traffic goes through **Astro Actions** (`defineAction` with Zod `input`). Actions run on the server, read `access_token` from cookies, call the backend with the shared client `src/lib/api.ts` (`api.get/post/put/delete`), and return view data or throw `ActionError`. Each feature owns `features/<f>/actions/<name>.action.ts`; `src/actions/index.ts` exports them in one `server` object: `auth`, `event`, `home`, `register`, `registration`, `admin`. SSR pages call the same API through `Astro.callAction` or `api`. Islands use `actions.<feature>.<name>()` (e.g. `RouteList`).

## Consequences
### Positive
- Tokens never reach client JS; one validated entry point per operation.
- Zod schemas are shared between form and action; errors map to typed `ActionError` codes.
- Actions can be unit-tested with a mocked `fetch` (`auth.action.test.ts`).

### Negative / risks
Known gaps (the code does not yet match `PATTERNS.md`):
- `src/lib/api.ts` hardcodes `http://localhost:8085/api/v1` instead of `import.meta.env.KINETIX_API_URL`.
- `api.ts` ignores a `{ token }` option: it spreads options into `fetch`, and no code adds `Authorization`. `features/admin/actions/admin.action.ts` passes `{ token }`, so admin calls are sent unauthenticated. `event.action.ts` passes `{ headers }` instead, which does work.
- `api.ts` does not return `status`, always calls `response.json()` (breaks on `204`/non-JSON), and `ActionError` mapping is ad hoc.
- `RouteUploadForm.tsx` fetches `http://localhost:8085/api/v1/routes/upload` directly from the browser and reads `access_token` from `document.cookie`; that cookie is httpOnly (`src/lib/cookies.ts`), so the token cannot be read and the upload path is broken as designed. It needs an action (multipart) or a server proxy.
- Other call styles beside actions: raw `fetch('/_actions/event.getFieldConfig', ...)` in `[eventSlug].astro`, a custom route `src/pages/api/events/[id].ts`, and `RegisterForm.astro` posting to `/api/registrations-proxy`, for which no route exists under `src/pages/api/` (only `events/[id].ts`).
- `register` (`features/auth`) and `registration` are separate action namespaces with near-identical names.
- Backend DTOs are redeclared as `Backend*` in `event.action.ts` and `home.action.ts` instead of `types/`.
- `event.action.ts` is 552 lines; mappers should be extracted.

## Alternatives considered
- **Browser calls API directly (CORS + bearer in JS)**: needs non-httpOnly tokens; rejected for security.
- **Custom API routes (`src/pages/api/*`)**: no built-in input validation or typed client; one exists today (`events/[id].ts`).
- **tRPC / separate BFF service**: extra service to run; Actions give the same without one.

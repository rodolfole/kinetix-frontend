# PLAN-9: Strict TDD and bug fixes

- Status: Implemented (pending pnpm astro check / build / e2e)
- Created: 2026-11-06 | Updated: 2026-11-06
- Spec: docs/specs/SPEC-auth.md, SPEC-home.md, SPEC-events.md, SPEC-registration.md
- ADRs: ADR-5, ADR-6, ADR-8

## Goal
Untested frontend behavior is pinned by characterization tests, and each known security/functional bug (F1-F9) is fixed minimally after a failing test proves it.

## Scope
### In
- Characterization tests for `src/middleware.ts` and the home, event and registration actions.
- One RED test and one minimal GREEN fix per bug F1-F9.
### Out
- Refactors, islands reduction (PLAN-10), new features.

## Design
Order: characterization first (so fixes are checked against known behavior), then bugs. Test layers (from the old plan index): Zod schemas in `src/lib/validation.ts`; pure helpers (`src/lib/slug.ts`, `cookies.ts`, `form-utils.ts`); React island logic with `@testing-library/react`; critical journeys with Playwright in `e2e/tests/`. Unit tests are colocated `*.test.ts(x)` (ADR-8). Middleware is tested by calling `onRequest` with a fake context (`url`, `cookies`, `redirect`) and a stub `next`. Run each fix as: RED observed, GREEN observed, full `pnpm test`.

## Tasks
### Characterization (existing behavior, expected to pass)
- [x] C1 Pin middleware: static/public paths pass, missing cookies redirect to `/auth/login?redirect=`, corrupt `user` cookie is cleared, role redirects for `/dashboard` and `/participant/dashboard` — test first: `src/middleware.test.ts` — files: `src/middleware.test.ts` Evidence: `src/middleware.test.ts` (9 tests) + `src/lib/route-guard.test.ts` (23); characterization cases passed on the old middleware before the fix.
- [x] C2 Pin `home.getEvents` (parses `data`, `[]` on empty/error, forwards `limit`) — test first: `src/features/home/actions/home.action.test.ts` — files: same Evidence: `home.action.test.ts` (4 tests). Actual behavior pinned: no `limit` param; list error throws `BAD_REQUEST` ActionError; empty list returns `[]`.
- [x] C3 Pin event actions (backend snake_case mapping, error mapping to `ActionError`) — test first: `src/features/events/actions/event.action.test.ts` — files: same Evidence: `event.action.test.ts` (3 tests, `getBySlug`: NOT_FOUND mapping, BaseEvent mapping, token forwarding).
- [x] C4 Pin `completeRegistration` (schema rejection throws, API error throws, success returns result) — test first: `src/features/registration/actions/registration.action.test.ts` — files: same Superseded by F7: `completeRegistration` had no callers and was replaced by `registration.submit`; see `registration.action.test.ts` (5 tests).

### Bugs
- [x] F1 `api.ts` ignores `{ token }` used by `admin.action.ts` — RED: `src/lib/api.test.ts` asserts `Authorization: Bearer <token>` is sent when `{ token }` is passed — GREEN: honor `token` option in `apiFetch` — files: `src/lib/api.ts`, `src/lib/api.test.ts` RED: `api.test.ts` "sends Authorization: Bearer <token>" -> expected undefined to be 'Bearer tok123'; "does not leak the token option" -> expected 'tok123' to be undefined. GREEN: 15/15. `admin.action.test.ts` (4) added after the fix as the caller-side check.
- [x] F2 API base URL hardcoded — RED: `api.test.ts` expects `import.meta.env.KINETIX_API_URL` to override the default — GREEN: read the env var with `http://localhost:8085/api/v1` fallback; update `.env.example`, `src/env.d.ts` — files: `src/lib/api.ts`, `src/env.d.ts` RED: "uses import.meta.env.KINETIX_API_URL" -> received `http://localhost:8085/api/v1/events`. GREEN: 15/15; fallback test passes. `.env.example` not updated (outside the allowed surface); `src/env.d.ts` typed.
- [x] F3 `/admin/*` has no role check — RED: `middleware.test.ts` organizer/participant to `/admin` is redirected, admin passes — GREEN: add admin guard in middleware — files: `src/middleware.ts` RED: `middleware.test.ts` organizer on /admin/settings -> expected 'next' to deeply equal { redirectedTo: '/dashboard' }. GREEN: guard in `src/lib/route-guard.ts` `resolveAccess`.
- [x] F4 `/events/[slug]/registration` public by the `events` prefix — RED: `middleware.test.ts` anonymous request to `/events/x/registration` redirects to login with `redirect` — GREEN: exclude `/registration` suffix paths from the public prefix match (keep `exito` reachable only if the spec requires it) — files: `src/middleware.ts` RED: anonymous /events/my-race/registration -> got 'next'. GREEN: `isEventRegistration` excluded from the public prefix (also covers `/exito`).
- [x] F5 Middleware bypass for any path containing `actions` — RED: `middleware.test.ts` `/dashboard/actions-report` is guarded — GREEN: bypass only paths starting with `/_actions/` — files: `src/middleware.ts` RED: /dashboard/actions-report -> got 'next'. GREEN: bypass only `/_astro` and `/_actions/`.
- [x] F6 Redirect param not encoded — RED: `middleware.test.ts` path with `?`/`&` yields `redirect=%2F...` encoded — GREEN: `encodeURIComponent(pathname + search)` — files: `src/middleware.ts` RED: expected `redirect=%2Fdashboard%2Fevents%3Ftab%3Da%26x%3D1`, got unencoded path without search. GREEN: `encodeURIComponent(pathname + search)`.
- [x] F7 `RegisterForm` posts to non-existent `/api/registrations-proxy` — RED: test that submit calls the registration Astro action (not `fetch('/api/registrations-proxy')`) — GREEN: submit through `actions.registration.completeRegistration`, forwarding the cookie token server side — files: `src/features/registration/components/RegisterForm.astro`, `src/features/registration/actions/registration.action.ts` RED: `registration.action.test.ts` -> `registration.submit` undefined (5/5 fail); `submit-registration.test.ts` fails to load. GREEN: `registration.submit` action (cookie token -> `POST /registrations/with-participant`), `RegisterForm.astro` calls it via `submitRegistration` and redirects to `/events/<slug>/registration/exito`. Form has no address/country/category: defaults `No especificada`/`MX`/`general`.
- [x] F8 `RouteUploadForm` reads the httpOnly cookie and calls the API from the browser — RED: `RouteUploadForm.test.tsx` expects upload via a same-origin server endpoint, no `document.cookie` or absolute API URL — GREEN: add a server proxy (action or `src/pages/api/routes/upload.ts`) that attaches the token — files: `src/features/events/components/routes/RouteUploadForm.tsx`, `src/pages/api/routes/upload.ts` RED: `RouteUploadForm.test.tsx` -> expected 'http://localhost:8085/api/v1/routes/u…' to be '/api/routes/upload'; `upload-route.test.ts` fails to resolve the module. GREEN: `src/pages/api/routes/upload.ts` (401 JSON without cookie) and form posts to `/api/routes/upload`.
- [x] F9 Open redirect via `?redirect=//host` on login — RED: login redirect helper rejects `//host`, `https://...`, `/\host`; accepts `/dashboard` — GREEN: extract `safeRedirect(target, fallback)` into `src/lib/` and use it in `login.astro` (also covers the non-`/` slug branch) — files: `src/lib/safe-redirect.ts`, `src/lib/safe-redirect.test.ts`, `src/pages/auth/login.astro` RED: `safe-redirect.test.ts` fails to load module. GREEN: 18/18; `safeRedirect` + `resolveLoginRedirect` (keeps the bare event-slug redirect) used in `login.astro` (frontmatter and script). `register.astro` still builds `/events/${redirect}/registration` (same-origin path, not changed).

## Verification
`pnpm astro check`, `pnpm test`, `pnpm build`, `pnpm test:e2e` (specs 02, 05, 07). Each task: RED output captured before the fix, GREEN after. Done when C1-C4 and F1-F9 are checked and no bug has a fix without a prior failing test.

## Risks and rollback
F3-F5 change access control and can lock out valid flows (e.g. `exito` pages, anonymous registration if product wants it); check E2E 07. F2 needs deployment env updated. Rollback: revert per task (one commit per task).

## Open questions
- Should anonymous users be allowed to register for an event (F4), or must they log in first? Current E2E 07 assumes the existing behavior.

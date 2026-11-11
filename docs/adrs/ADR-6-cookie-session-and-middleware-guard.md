# ADR-6: Cookie session and middleware guard

- Status: Accepted
- Date: 2026-09-15
- Deciders: Kinetix team
- Related: ADR-1, ADR-5, docs/ARCHITECTURE.md, backend/docs/adrs/ADR-4-jwt-authentication.md

## Context
The backend issues JWT access and refresh tokens at login/register. The web app needs the session on the server for SSR and actions, a user summary for the UI, and role-based areas (participant, organizer, admin).

## Decision
- `setAuthCookies` (`src/lib/cookies.ts`) stores `access_token` and `refresh_token` as **httpOnly**, `sameSite=lax`, `path=/`, `secure` in production; `access_token` lives `expires_in` seconds, `refresh_token` 7x that. `user` (JSON with `role`) is non-httpOnly for UI use. `deleteAuthCookies` clears all three.
- `src/middleware.ts` runs on every request:
  1. Let through `/_astro*` and any path containing `actions`.
  2. Public prefixes: `/`, `auth/login`, `auth/register`, `events`, `results`, `community`.
  3. Otherwise require `access_token` and `user`; else redirect to `/auth/login?redirect=<path>`.
  4. Parse `user`; invalid JSON or role not in `participant|organizer|admin` clears cookies and redirects to login.
  5. Role redirects: `/participant/dashboard*` for participant/admin; `/dashboard*` for organizer/admin (participants go to `/participant/dashboard`).

## Consequences
### Positive
- Tokens are unreachable from JS (XSS-resistant), `sameSite=lax` mitigates CSRF for most flows.
- Session checks are centralized; pages need no guard code.

### Negative / risks
- `/admin/*` (`pages/admin/index|payments|settings.astro`) has no role check: any logged-in user passes the middleware.
- The `events` prefix makes `/events/[slug]/registration` public, though registration needs a user.
- `refresh_token` is stored but never used; when the access token expires the user is not refreshed and cookies just lapse.
- The middleware trusts the client-editable `user` cookie for roles; real authorization is only the backend's, and `admin.action.ts` currently sends no token (ADR-5).
- `?redirect=${pathname}` is not `encodeURIComponent`-encoded; `pages/auth/login.astro` treats a non-`/` value as an event slug and otherwise redirects to the raw value (open-redirect-style risk, e.g. `//host`).
- `pathname.includes('actions')` bypasses auth for any URL containing "actions".
- No CSRF token beyond `sameSite=lax`; no logout-everywhere.
- Code comments are in Spanish, against the English-code convention.

## Alternatives considered
- **JWT in localStorage**: simple, but XSS-exposed; rejected.
- **Server-side session store**: needs shared storage and duplicates backend auth.
- **Signed/encrypted `user` cookie**: stronger; recommended follow-up so role decisions are tamper-evident.

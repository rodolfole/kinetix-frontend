# SPEC — Dashboard (organizer + participant)

- Status: Partial
- Plan: plans/PLAN-6-dashboard.md

## 1. Objective

Provide role-aware dashboard pages for organizers and participants. Organizers see their events and key KPIs; participants see their own registrations. Both live behind `src/middleware.ts` (role-gated).

## 2. Scope

In scope:

- Organizer home (`/dashboard`) with KPI tiles sourced from the API.
- Organizer events list and detail (`/dashboard/events`, `/dashboard/events/[eventSlug]`).
- Organizer participants list (`/dashboard/participants`).
- Organizer reports and settings static pages.
- Participant home (`/participant/dashboard`) showing the user's registrations.
- Shared dashboard components: sidebar, stat card, event card, page header, user actions.

Out of scope:

- Creating/editing events end-to-end (the detail page shows edit controls but the form is read-only here — full create/edit is a separate feature).
- Reports data computation (static placeholders only).
- Settings persistence (static form only).

## 3. Functional requirements

- `src/middleware.ts` already restricts `/dashboard/*` to `organizer`/`admin` and `/participant/*` to `participant`/`admin`. No additional auth checks needed in pages.
- Pages SSR-fetch via `apiFetch()` from `src/lib/api.ts`, forwarding the `access_token` cookie for protected routes.
- KPI numbers come from real API data (event list length, participant total).
- Dashboard sidebar highlights the active route.
- Logout link clears cookies via a form POST to a future `/api/auth/logout` route; here we link to `/auth/logout` (the existing flow).

## 4. Non-functional requirements

- All pages render server-side (Astro SSR via the `node` adapter).
- Components use Tailwind utility classes consistent with the existing `home` feature.
- No client-side JS islands required for dashboard pages.

## 5. API surface used

| Page | Endpoint | Notes |
|---|---|---|
| `/dashboard` | `GET /events?organizer_id=me` | Per task spec; falls back to listing first 50 events if backend does not support `organizer_id=me`. |
| `/dashboard/events` | `GET /events` | Same fallback. |
| `/dashboard/events/[eventSlug]` | `GET /events/slug/{slug}` and `GET /events/{id}/detail` | |
| `/dashboard/participants` | `GET /participants?limit=100` | |
| `/participant/dashboard` | `GET /registrations/participant/{participant_id}` | Requires participant role. |

## 6. Acceptance criteria

- All listed routes compile and render with real data when the API is reachable.
- Sidebar shows the active link styled.
- An unauthenticated request is redirected by middleware to `/auth/login`.
- An organizer cannot reach `/participant/*` and vice versa.

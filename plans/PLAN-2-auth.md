# PLAN-2: Auth

- Status: Done
- Created: 2026-09-15 | Updated: 2026-11-06
- Spec: docs/specs/SPEC-auth.md
- ADRs: ADR-5, ADR-6

## Goal
Participants and organizers can sign in and register through server-rendered pages that set HttpOnly session cookies.

## Scope
### In
- `/auth/login`, `/auth/register`, `/auth/register/organizer` pages.
- Auth actions for login and both registrations.
- Zod validation shared from `@lib/validation`.
### Out
- Password reset, email verification, OAuth, MFA.
- Security fixes for redirect handling (PLAN-9 F6, F9).

## Design
Actions call `/auth/login`, `/auth/register/participant`, `/auth/register/organizer` through `apiFetch`; cookies are set server side (ADR-6). `confirm_email` is stripped before calling the backend. Schemas stay in `src/lib/validation.ts`; the planned per-feature re-export (`schemas/auth.schema.ts`) was dropped, `features/auth/schemas/` is empty.

## Tasks
- [x] T1 Scaffold `src/features/auth/` and `src/pages/auth/register/` — files: `src/features/auth/**`
- [x] T2 Write login and registration actions plus `isUnauthorized`/`isConflict` helpers — test first: `src/features/auth/actions/auth.action.test.ts` — files: `src/features/auth/actions/auth.action.ts`, `register.action.ts`
- [x] T3 Build login page (validate, login, set cookies, redirect to `?redirect=` or dashboard) — files: `src/pages/auth/login.astro`
- [x] T4 Build participant registration page (409 shows duplicate-email message) — files: `src/pages/auth/register.astro`
- [x] T5 Build organizer registration page (fiscal and contact fieldsets) — files: `src/pages/auth/register/organizer.astro`
- [x] T6 Add E2E flows — files: `e2e/tests/02-auth-login.spec.ts`, `03-auth-register.spec.ts`, `08-organizer-register.spec.ts`
- [ ] T7 Add integration tests for the three pages — superseded by PLAN-9 characterization tasks

## Verification
`pnpm test` (action tests), `pnpm test:e2e` (specs 02, 03, 08), manual: bad password re-renders with error, seeded login lands on the dashboard.

## Risks and rollback
Login `?redirect=` is not validated (open redirect, PLAN-9 F9). Rollback: revert the page and action files.

## Open questions
- None.

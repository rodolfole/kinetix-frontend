# PLAN-5: Registration

- Status: In progress
- Created: 2026-09-15 | Updated: 2026-11-06
- Spec: docs/specs/SPEC-registration.md
- ADRs: ADR-5, ADR-6

## Goal
A visitor completes a 2-step form (personal info, race info), confirms, and lands on a success page after the registration is saved.

## Scope
### In
- `/events/:slug/registration` form, step components, Zod schema, `completeRegistration` action, success pages.
### Out
- Draft persistence in `localStorage`, profile prefill (not confirmed by product).

## Design
No framework: plain HTML with one `<script>` toggling step panels. Browser-native validation gates each step; the Zod schema runs before the POST. Distances are SSR-fetched once and passed to `RaceInfo`.

## Tasks
- [x] T1 Types and schemas (`personalInfoSchema`, `raceInfoSchema`, `registrationSchema`) — test first: `src/features/registration/schemas/registration.schema.test.ts` — files: `src/features/registration/{types,schemas}/*`
- [x] T2 `completeRegistration(payload, token?)` action — files: `src/features/registration/actions/registration.action.ts`
- [x] T3 Step components (`StepIndicator`, `PersonalInfo`, `RaceInfo`, `RegistrationSummary`) — files: `src/features/registration/components/*.astro`
- [x] T4 Orchestrator `RegisterForm.astro` with step toggling and summary — files: `src/features/registration/components/RegisterForm.astro`
- [ ] T5 Make submit work: it posts to non-existent `/api/registrations-proxy` — see PLAN-9 F7
- [x] T6 Registration page (SSR event + distances) — files: `src/pages/events/[slug]/registration/index.astro`
- [x] T7 Success pages — files: `src/pages/registration/exito.astro`, `src/pages/events/[slug]/registration/exito.astro`
- [x] T8 E2E registration flow — files: `e2e/tests/07-registration-flow.spec.ts`

## Verification
`pnpm test` (schema tests), `pnpm test:e2e` (spec 07), manual: a submitted registration appears in the backend and the browser lands on `/registration/exito`.

## Risks and rollback
Anonymous POST may get 401 (the action accepts an optional token). The page is currently public by prefix (PLAN-9 F4). Rollback: revert the feature folder and pages.

## Open questions
- Add `localStorage` draft persistence?
- Prefill personal info from the `user` cookie of a logged-in participant?

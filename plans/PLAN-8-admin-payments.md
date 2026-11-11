# PLAN-8: Admin and payments

- Status: In progress
- Created: 2026-11-06 | Updated: 2026-11-06
- Spec: backend/docs/specs/SPEC-platform-payments.md
- ADRs: ADR-5, ADR-6, backend ADR-7, backend ADR-8

## Goal
An admin edits the platform commission and reviews organizer payouts from the frontend.

## Scope
### In
- `/admin`, `/admin/settings`, `/admin/payments` pages and the `admin` Astro actions (`getConfig`, `updateConfig`, `listPayouts`).
### Out
- Manual payout trigger UI (in the backend spec, no frontend code or endpoint wiring yet).
- Payment processing (backend).

## Design
Actions read the `access_token` cookie and call `/admin/config` and `/admin/payouts` through `api` with `{ token }`. Retroactive plan derived from code, no prior plan existed.

## Tasks
- [x] T1 Admin actions — files: `src/features/admin/actions/admin.action.ts`, `src/actions/index.ts`
- [x] T2 Settings form for commission % — files: `src/features/admin/components/SettingsForm.astro`
- [x] T3 Admin pages (index, settings, payouts table) — files: `src/pages/admin/{index,settings,payments}.astro`
- [ ] T4 Role check for `/admin/*` in middleware — see PLAN-9 F3
- [ ] T5 Forward the token in `api.ts` so admin calls are authorized — see PLAN-9 F1
- [ ] T6 Manual payout trigger button — test first: `src/features/admin/actions/admin.action.test.ts` — files: `src/features/admin/actions/admin.action.ts`, `src/pages/admin/payments.astro`

## Verification
`pnpm astro check`, `pnpm test`; as admin, changing the commission persists and the payouts table lists pending/sent/failed rows; as organizer, `/admin` redirects.

## Risks and rollback
Until T4/T5 land, `/admin/*` has no role gate and admin calls may reach the API without the bearer token. Rollback: revert admin files.

## Open questions
- Does the backend expose a manual payout trigger endpoint to wire in T6?

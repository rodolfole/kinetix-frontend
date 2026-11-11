# PLAN-1: Bootstrap foundation

- Status: Done
- Created: 2026-09-15 | Updated: 2026-11-06
- Spec: none (infrastructure)
- ADRs: ADR-1, ADR-2, ADR-3, ADR-4

## Goal
A running Astro SSR app with styling, UI kit, path aliases and the feature-folder layout, so every feature plan starts from the same base.

## Scope
### In
- Astro 7 SSR (`output: 'server'`) with `@astrojs/node` standalone adapter.
- Tailwind 4 through `@tailwindcss/vite`; global styles and Starwind tokens.
- Starwind UI kit copied into `src/components/starwind`.
- Path aliases `@`, `@features`, `@layouts`, `@shared`, `@lib`, `@actions`.
- `src/features/<feature>/` layout, shared lib, layouts, middleware.
### Out
- Any feature behavior (see PLAN-2 onward).

## Design
See ADR-1 (SSR + Node adapter), ADR-2 (feature folders), ADR-3 (React islands via `@astrojs/react`), ADR-4 (Starwind and tokens).

## Tasks
- [x] T1 Initial project setup and tooling config — files: `package.json`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts` (commits `d8fe975`, `e8b385b`, `ce075f0`)
- [x] T2 Configure SSR, Node adapter, React integration, Tailwind plugin and aliases — files: `astro.config.mjs`
- [x] T3 Add global styles, env types and middleware — files: `src/styles/global.css`, `src/env.d.ts`, `src/middleware.ts` (commit `c596a73`)
- [x] T4 Add shared lib utilities and types — files: `src/lib/*` (commit `f49a45b`)
- [x] T5 Add Starwind components and shared components — files: `src/components/starwind/**`, `src/shared/components/**` (commit `10b3e6d`)
- [x] T6 Add page layouts — files: `src/layouts/*` (commit `6b619a0`)

## Verification
`git log --oneline` shows the commits above; `astro.config.mjs` contains `output: 'server'`, `node({ mode: 'standalone' })`, `react()`, `tailwindcss()` and the six aliases. `pnpm build` produces `dist/`.

## Risks and rollback
Retroactive plan: evidence comes from git history, not from a pre-implementation checklist. Rollback is not applicable.

## Open questions
- None.

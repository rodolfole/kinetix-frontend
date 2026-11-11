# ADR-8: Vitest and Playwright

- Status: Accepted
- Date: 2026-09-15
- Deciders: Kinetix team
- Related: docs/TESTING.md, ADR-3

## Context
The project needs fast tests for utilities, actions and islands, and a few browser-level journeys against the real backend. Astro builds on Vite, so Vite-native tooling avoids a second transform pipeline.

## Decision
- **Vitest 2** for unit, action and island tests: `vitest.config.ts` includes `src/**/*.{test,spec}.{ts,tsx}`, default `environment: 'node'`, `globals: false`, and the same path aliases as Astro. Island tests opt in with `// @vitest-environment happy-dom` and use `@testing-library/react` plus `@testing-library/jest-dom`.
- **Playwright** for E2E: `e2e/tests/NN-<journey>.spec.ts` (eight specs today, `01-home` to `08-organizer-register`), Chromium only, `workers: 1`, `fullyParallel: false`, web server `pnpm dev` on port 4325 (reused if running), trace and screenshot kept on failure.
- Scripts: `pnpm test` (`node node_modules/vitest/vitest.mjs run`), `pnpm test:e2e`, `pnpm test:e2e:headed`.

## Consequences
### Positive
- Same Vite transform and aliases as the app; colocated tests; fast feedback.
- E2E covers real flows (login, registration, dashboard) through the whole stack.

### Negative / risks
- `vitest.config.ts` has no React plugin and no `setupFiles`; TSX works through esbuild and `tsconfig` (`jsx: react-jsx`), and each test imports `@testing-library/jest-dom/vitest` by hand. Switching JSX runtime (ADR-9) needs config changes here.
- `vitest.config.ts` is untracked in git at the time of writing; no coverage tool or thresholds are configured (`TESTING.md` targets 70-80%).
- No `.astro` component tests (`experimental_AstroContainer` unused) and the only action test is `auth.action.test.ts`; `middleware.ts` has no test.
- `playwright.config.ts` sets `headless: false` ("headed by default"), which fails in CI and headless WSL; no `retries`, no CI profile.
- E2E depends on a backend at `:8085` with seed data and specs are numbered, which invites order dependence.
- `node_modules` installed on Windows breaks Vitest in WSL (missing `@rollup/rollup-linux-x64-gnu`); documented in `TESTING.md`.

## Alternatives considered
- **Jest**: separate transform pipeline and ESM friction; rejected.
- **Cypress**: heavier, no multi-tab or WebKit/Firefox via one runner; Playwright preferred.
- **Storybook for islands**: possible later for visual states; not needed for current scale.

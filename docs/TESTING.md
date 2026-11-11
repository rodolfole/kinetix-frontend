# Testing

## Workflow: strict TDD

1. **RED**: write one failing test for one rule. Run it and see it fail for the expected reason.
2. **GREEN**: minimum code to pass.
3. **REFACTOR**: clean up with all tests green.

A bug fix starts with a test that reproduces the bug. A behavior change without a test that would have failed before is not mergeable.

## Levels

| Level | What | Tool | Location |
|---|---|---|---|
| Unit | `lib/*`, schemas, mappers, middleware decisions | Vitest (`node`) | colocated `*.test.ts` |
| Action | Action handlers with mocked `fetch` and cookies | Vitest (`node`) | `features/<f>/actions/*.test.ts` |
| Island | React components: render, interaction, emitted events | Vitest + happy-dom + Testing Library | colocated `*.test.tsx` |
| Astro component | Rendered HTML of `.astro` components | Vitest + `experimental_AstroContainer` | colocated `*.test.ts` |
| E2E | Critical user journeys in a real browser | Playwright | `e2e/tests/NN-<journey>.spec.ts` |

Critical journeys that must always have E2E coverage: login, participant registration + payment redirect, organizer creates and publishes an event, organizer uploads a GPX route, admin updates the commission.

## What a test must assert

- Behavior visible to the user or caller: returned value, rendered text/role, redirect target, cookie set or deleted, request sent (URL, method, headers, body).
- Rejected input: the error message **and** that no request was sent.
- Boundaries named by the rule (min/max length, empty, invalid format, unauthorized, not found).
- Query by role and accessible name (`getByRole('button', { name: 'Guardar' })`), not by CSS class or test id unless there is no accessible handle.

## Style

```ts
// src/lib/slug.test.ts
import { describe, it, expect } from 'vitest';
import { generateSlug } from './slug';

describe('generateSlug', () => {
  it.each([
    ['Maratón CDMX 2026', 'maraton-cdmx-2026'],
    ['  10K  Nocturno ', '10k-nocturno'],
  ])('turns %s into %s', (input, expected) => {
    expect(generateSlug(input)).toBe(expected);
  });
});
```

- `describe` = unit, `it` = behavior in plain English (`it('redirects participants away from /dashboard')`).
- Component tests declare `// @vitest-environment happy-dom` on line 1; everything else runs in `node`.
- Mock at the boundary only: `fetch`, `astro:actions`, `leaflet`. Never mock the module under test.
- No real network, no timers without `vi.useFakeTimers()`, no order dependence.
- E2E tests are independent: each creates or logs in its own data; no reliance on a previous spec.

## Commands

```bash
pnpm test                  # vitest run (unit + action + island)
pnpm test:watch
pnpm test -- --coverage    # requires @vitest/coverage-v8
pnpm test:e2e              # needs backend on :8085 with seed data
pnpm astro check           # type check .astro and .ts
```

On WSL with a Windows-installed `node_modules`, run Vitest with the Windows Node (`cmd.exe /c "node node_modules\\vitest\\vitest.mjs run"`) or reinstall dependencies inside WSL; rollup's native binary is platform-specific.

## Coverage gates

| Area | Minimum line coverage |
|---|---|
| `src/lib/*`, `middleware.ts`, `features/*/schemas`, `features/*/actions` | 80% |
| Islands (`*.tsx`) | 70% |
| `components/starwind` | excluded (vendored) |

## Configuration requirements

- `vitest.config.ts` adds `@vitejs/plugin-react` (or Astro's `getViteConfig`) so `.tsx` tests use the same JSX transform as the app, and a `setupFiles` entry that loads `@testing-library/jest-dom/vitest`.
- Playwright runs headless in CI (`headless: !!process.env.CI`), with `retries: 2` in CI and traces on first retry.

## CI

Each pull request runs `pnpm install --frozen-lockfile`, `pnpm astro check`, `pnpm test`, `pnpm build`. E2E runs on `main` and on PRs labeled `e2e`, against the backend docker compose stack.

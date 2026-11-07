# Git Conventions

## Branches

- `main` is always deployable and protected: no direct pushes, merge only through a reviewed PR with green CI.
- Work branches: `<type>/<short-kebab-description>`, optionally with the issue number.
  - `feat/participant-dashboard-api`, `fix/88-admin-auth-header`, `refactor/event-form-split`, `docs/adr-islands`.
- One branch per change. Rebase on `main` before review; delete after merge.

## Commits: Conventional Commits

```
<type>(<scope>): <imperative summary, max 72 chars>

<optional body: why, not what>

<optional footer: Refs #88 | BREAKING CHANGE: ...>
```

| Type | Use |
|---|---|
| `feat` | New behavior |
| `fix` | Bug fix |
| `refactor` | Behavior unchanged |
| `test` | Tests only |
| `docs` | Documentation only |
| `style` | CSS / design tokens without behavior change |
| `chore` | Tooling, deps, config |
| `ci` | Pipeline |
| `perf` | Bundle size, rendering, Lighthouse |

- Scope is the feature or area: `auth`, `events`, `registration`, `dashboard`, `home`, `admin`, `ui`, `lib`, `middleware`.
- Tests and docs go in the same commit as the behavior they cover.
- Each commit passes `pnpm test` and `pnpm build`.
- Starwind-generated components are added in their own `chore(ui): add starwind <component>` commit, separate from feature code.

## Pull requests

- Target size: under ~400 changed lines (lockfile and generated Starwind code excluded). Split larger work into stacked PRs.
- Title follows the commit format. Description: what, why, screenshots for UI changes (desktop + mobile), how to test, linked issue/plan/ADR.
- Checklist before requesting review:
  - [ ] `pnpm astro check` and `pnpm test` green, new behavior has tests written first
  - [ ] `pnpm build` succeeds
  - [ ] no new `client:load` island without a reason in the PR (see [PATTERNS.md](PATTERNS.md#islands))
  - [ ] contract changes coordinated with `backend/docs/API_CONTRACTS.md`
- Merge strategy: squash merge; the squash message is a Conventional Commit.
- At least one approval. Changes to `middleware.ts`, `lib/api.ts`, `lib/cookies.ts` or auth actions need a second reviewer.

## Releases

- Semantic versioning tags on `main`: `vMAJOR.MINOR.PATCH`.
- Changelog generated from Conventional Commits.

## Repository hygiene

- Never commit: `dist/`, `.astro/`, `node_modules/`, `.env`, screenshots and Lighthouse reports (attach them to the PR instead), Playwright traces.
- Use `pnpm` only; commit `pnpm-lock.yaml` with every dependency change.
- Line endings are normalized by `.gitattributes`:

```
* text=auto eol=lf
*.png binary
*.jpg binary
*.webp binary
```

  Windows contributors set `git config core.autocrlf false`. The current working tree shows almost every file modified only by CRLF conversion; add `.gitattributes` and renormalize (`git add --renormalize .`) in a dedicated `chore` commit.

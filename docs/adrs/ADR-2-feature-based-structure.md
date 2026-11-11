# ADR-2: Feature-based project structure

- Status: Accepted
- Date: 2026-09-15
- Deciders: Kinetix team
- Related: ADR-5, docs/ARCHITECTURE.md, docs/PATTERNS.md, AGENTS.md

## Context
The app has distinct business areas (auth, home, events, registration, dashboard, admin). Grouping by file type (`components/`, `actions/`, `types/`) scatters one change across many folders and invites cross-feature coupling.

## Decision
Group code by feature under `src/features/<feature>/` with the subfolders `actions/`, `schemas/`, `types/`, `consts/`, `components/` and a barrel `index.ts`. Cross-cutting code goes to `src/shared/` (used by 2+ features) or `src/lib/` (framework-free utilities). Pages in `src/pages/` stay thin. `src/actions/index.ts` is the single registry that exports each feature's actions. Import aliases in `tsconfig.json` and `astro.config.mjs`: `@`, `@features`, `@layouts`, `@shared`, `@lib`, `@actions`. Rules (types in `types/`, constants in `consts/`, pure functions in `lib/`) are in `AGENTS.md`.

Features present: `admin`, `auth`, `dashboard`, `events`, `home`, `registration`.

## Consequences
### Positive
- A feature change touches one folder; ownership is clear.
- Colocated `*.test.ts(x)` next to the code (ADR-8).
- Aliases give stable import paths.

### Negative / risks
- Rules are not enforced by tooling (no lint boundary rule), so drift exists:
  - `src/lib/validation.ts` holds Zod schemas and DOM helpers; `registration.schema.ts` duplicates part of it.
  - `Backend*` types are redeclared in `features/events/actions/event.action.ts` and `features/home/actions/home.action.ts`.
  - `src/lib/mock-data.ts` still exists; pages with hardcoded numbers violate the "no mock data in pages" rule.
  - `EventCard` exists in both `features/events` and `features/dashboard`.
  - `AGENTS.md` lists `services/` and says "all components are `.astro`", which no longer matches the code (islands exist).
- `src/pages/dashboard/events/[eventSlug].astro` is a large page with a big inline script, against "pages are thin".
- `src/actions/index.ts` mixes `@/features/...` and `@features/...` import styles for the same alias target.

## Alternatives considered
- **Layer-based folders** (`components/`, `services/`, `types/`): simple at first, scatters features; rejected.
- **Monorepo packages per feature**: overhead not justified for one app.

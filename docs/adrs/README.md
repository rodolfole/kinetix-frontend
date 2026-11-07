# Architecture Decision Records

An ADR records one significant technical decision: the context that forced it, what was decided, and its consequences. ADRs explain *why* the code looks the way it does; the guides in `docs/` explain *how* to work with it.

## Naming

`ADR-<N>-<kebab-slug>.md`. `N` is sequential and never reused, even if the ADR is deprecated. Files live in `docs/adrs/`.

## Lifecycle

`Proposed` -> `Accepted` -> `Deprecated` | `Superseded by ADR-N`

An accepted ADR is not rewritten. To change a decision, write a new ADR and mark the old one `Superseded by ADR-N`. Typo and link fixes are fine.

## When to write one

- Adding or replacing a framework, runtime library, or build tool.
- Changing a structural rule (folder layout, how the API is called, auth/session handling).
- Choosing between options that are expensive to reverse.
- Accepting a known gap on purpose (record it under Negative / risks).

Not needed for bug fixes, renames, or choices that fit an existing ADR.

## Template

```md
# ADR-<N>: <Title>

- Status: Accepted | Proposed
- Date: <YYYY-MM-DD>
- Deciders: Kinetix team
- Related: ADR-x, docs/..., backend/docs/...

## Context
## Decision
## Consequences
### Positive
### Negative / risks
## Alternatives considered
```

## Index

| N | Title | Status | Date |
|---|---|---|---|
| [1](ADR-1-astro-ssr-node-adapter.md) | Astro SSR with the Node adapter | Accepted | 2026-09-15 |
| [2](ADR-2-feature-based-structure.md) | Feature-based project structure | Accepted | 2026-09-15 |
| [3](ADR-3-react-islands.md) | React 19 islands for interactivity | Accepted | 2026-09-15 |
| [4](ADR-4-starwind-ui-and-design-tokens.md) | Starwind UI kit and design tokens | Accepted | 2026-09-15 |
| [5](ADR-5-astro-actions-backend-gateway.md) | Astro Actions as the backend gateway | Accepted | 2026-09-15 |
| [6](ADR-6-cookie-session-and-middleware-guard.md) | Cookie session and middleware guard | Accepted | 2026-09-15 |
| [7](ADR-7-client-side-gpx-preview.md) | Client-side GPX preview | Accepted | 2026-11-06 |
| [8](ADR-8-vitest-and-playwright.md) | Vitest and Playwright | Accepted | 2026-09-15 |
| [9](ADR-9-preact-compat-for-islands.md) | Use Preact (preact/compat) for islands | Proposed | 2026-11-06 |

Backend ADRs live in `backend/docs/adrs/`.

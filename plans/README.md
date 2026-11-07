# Plans

A plan is the implementation checklist for one change: what to build, in what order, how to verify it. Specs (`docs/specs/`) say *what* a feature must do; ADRs (`docs/adrs/`) say *why* a technical decision was made; plans say *how and in which steps* the work lands.

## Naming

`PLAN-<N>-<kebab-slug>.md`. `N` is sequential and never reused, even if the plan is abandoned. Files live in `plans/`. Each plan links its spec and ADRs; each spec links back via its `Plan:` header.

## Lifecycle

`Draft` -> `Approved` -> `In progress` -> `Done` | `Abandoned`

Update `Status` and `Updated` in the plan and in the index below whenever it changes. Tick a task only when the code shows it is done.

## Definition of Done

- `pnpm astro check` passes.
- `pnpm test` passes.
- `pnpm build` passes.
- Tests were written first (RED observed, then GREEN) for every behavior change.
- No new `client:load` island without a stated reason (see ADR-3 and ADR-9).

## Template

```md
# PLAN-<N>: <Title>

- Status: Draft | Approved | In progress | Done | Abandoned
- Created: <YYYY-MM-DD> | Updated: <YYYY-MM-DD>
- Spec: docs/specs/SPEC-<x>.md
- ADRs: ADR-x, ADR-y

## Goal
<1-3 lines, outcome not activity>

## Scope
### In
### Out

## Design
<short; decisions belong in ADRs, link them>

## Tasks
- [ ] T1 <imperative> — test first: <test name/file> — files: <paths>

## Verification
<commands and acceptance criteria>

## Risks and rollback

## Open questions
```

## Index

| N | Title | Status | Spec | ADRs |
|---|---|---|---|---|
| [1](PLAN-1-bootstrap-foundation.md) | Bootstrap foundation | Done | none | ADR-1, 2, 3, 4 |
| [2](PLAN-2-auth.md) | Auth | Done | [SPEC-auth](../docs/specs/SPEC-auth.md) | ADR-5, 6 |
| [3](PLAN-3-home.md) | Home | Done | [SPEC-home](../docs/specs/SPEC-home.md) | ADR-2, 5 |
| [4](PLAN-4-events.md) | Events | In progress | [SPEC-events](../docs/specs/SPEC-events.md) | ADR-3, 5, 7 |
| [5](PLAN-5-registration.md) | Registration | In progress | [SPEC-registration](../docs/specs/SPEC-registration.md) | ADR-5, 6 |
| [6](PLAN-6-dashboard.md) | Dashboard | In progress | [SPEC-dashboard](../docs/specs/SPEC-dashboard.md) | ADR-2, 6 |
| [7](PLAN-7-tags.md) | Tags | In progress | [SPEC-tags](../docs/specs/SPEC-tags.md) | ADR-2 |
| [8](PLAN-8-admin-payments.md) | Admin and payments | In progress | backend `SPEC-platform-payments` | ADR-5, 6 |
| [9](PLAN-9-strict-tdd-and-bug-fixes.md) | Strict TDD and bug fixes | Approved | auth, home, events, registration | ADR-5, 6, 8 |
| [10](PLAN-10-islands-reduction.md) | Islands reduction | Draft | none | ADR-3, 7, 9 |

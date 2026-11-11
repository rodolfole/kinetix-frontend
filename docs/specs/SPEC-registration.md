# Spec: Registration

- Status: Partial
- Plan: plans/PLAN-5-registration.md

## Objective

Let a visitor sign up to participate in a Kinetix event. The flow is a 2-step form (personal info, race info), followed by a confirmation summary, ending on a success page. The form is plain HTML/JS — no React, no client framework — so it works without JS hydration overhead and degrades gracefully on slow networks.

**User stories**
- As a visitor, I can open `/events/:slug/registration` and see a multi-step form for that event.
- As a visitor, I complete personal info, choose a distance, and confirm — submitting POSTs to `/registrations`.
- After submission I land on `/registration/exito` and see a "registration received" page.

**Acceptance**
- Step indicator shows current step and progress.
- Browser-native validation (`required`, `type="email"`) gates step advancement.
- Summary step renders every value entered.
- On submit success the browser navigates to the success page; on failure an inline error appears.

## Tech Stack

- Astro 7.1.3 (SSR)
- Vanilla TypeScript in `<script>` blocks for step switching (no React island)
- Zod 4 for both client-side validation surface and server-side shape
- `apiFetch` from `src/lib/api.ts` for POST submission
- Tailwind 4 for styling

## Commands

```bash
npm run dev                  # Astro dev server on :4325
npm run build                # Production build
npm test                     # Vitest unit tests for schemas
npm run test:e2e             # Playwright (requires backend on :8085)
```

## Project Structure

```
src/features/registration/
├── types/registration.type.ts                # PersonalInfo, RaceInfo, RegistrationPayload, RegistrationResult
├── schemas/registration.schema.ts            # Zod schemas for client + server
├── actions/registration.action.ts            # completeRegistration()
└── components/
    ├── StepIndicator.astro                  # visual progress bar
    ├── PersonalInfo.astro                   # step 1 inputs
    ├── RaceInfo.astro                       # step 2 inputs
    ├── RegistrationSummary.astro            # step 3 review
    └── RegisterForm.astro                   # wrapper that toggles steps + handles submit

src/pages/
├── events/[slug]/registration/index.astro   # SSR-fetch event, render <RegisterForm/>
└── registration/exito.astro                 # post-submit success page
```

## Code Style

- Schemas live in `schemas/*.ts`; types in `types/*.ts`; never inline the validation rule.
- Step indicator exposes `current` (0-indexed) and `steps: string[]` only — no business logic.
- Step transitions live in one place: `RegisterForm.astro`'s `<script>` block. Sub-components are dumb.
- Browser-native form validation (`required`, `type="email"`, `pattern`) gates step advancement; Zod is reserved for the final submission (defense in depth at the trust boundary).
- All styles Tailwind utility classes.

## Testing Strategy

- **Schema tests:** vitest unit tests assert `personalInfoSchema` rejects empty/malformed values and accepts the happy path. Same for `raceInfoSchema` and the merged `registrationSchema`.
- **Component tests:** none — the only client logic is step toggling, exercised by the e2e.
- **E2E (Playwright):** fill personal step, advance, fill race step, advance, submit, assert navigation to `/registration/exito`. Located at `e2e/tests/registration.spec.ts`.
- **Coverage:** schemas ≥80%; e2e covers the happy path.

## Boundaries

- **Always:** validate at the boundary using `completeRegistration()` (Zod → POST); never trust a raw payload from the client.
- **Ask first:** adding a payment step, integrating 3rd-party form libraries, persisting drafts across sessions.
- **Never:** store the access token in the form markup; rely on the auth cookie; submit via a method other than POST.

## Success Criteria

1. `/events/:slug/registration` renders the multi-step form pre-filled with `event_id` and the list of distances.
2. Advancing from step 1 to step 2 triggers browser validation; missing required fields block the transition.
3. Step 3 displays every entered value.
4. Submitting POSTs `{personal + race}` to `/registrations` and on 2xx navigates to `/registration/exito`.
5. On non-2xx, the inline error banner appears with a retry message; the user stays on the form.
6. Schemas reject: empty names, malformed email, phone < 10 digits, missing distance, malformed event_id (non-UUID).

## Open Questions

- Whether the backend requires auth (it does for POST per current API). The action accepts an optional `token` so we can pass the cookie-derived access token when the participant is logged in; anonymous registrations will surface a 401 today.
- Whether to persist the form across page reloads — currently a hard refresh discards progress. Add localStorage draft only if the user story demands it.

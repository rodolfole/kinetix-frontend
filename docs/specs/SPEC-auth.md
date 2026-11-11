# SPEC — auth feature

- Status: Implemented
- Plan: plans/PLAN-2-auth.md

## Objective

Provide public sign-in and self-service registration for both participants and
organizers. Forms are server-rendered Astro pages that POST to themselves,
validate via shared Zod schemas, hit the backend auth endpoints, and set
HttpOnly cookies on success. No client-side JS required.

**Why it exists**: This is the only entry point for any authenticated area
of the app (organizer dashboard, participant registration). It must work with
JS disabled and fail safely on bad credentials.

**In scope**:
- `POST /auth/login` page with email/password
- `POST /auth/register` page (participant signup)
- `POST /auth/register/organizer` page (organizer signup with billing fields)
- Auth actions wrapping `/auth/login`, `/auth/register/participant`,
  `/auth/register/organizer`
- Re-exported Zod schemas for feature-local imports

**Out of scope**:
- Password reset, email verification, OAuth
- Logout endpoint (handled via cookie deletion on a future route)
- Multi-factor auth

## Tech Stack

- **Astro 7** with `output: 'server'`
- **Zod** for shared validation (existing schemas in `src/lib/validation.ts`)
- **`apiFetch<T>`** from `src/lib/api.ts`
- **`setAuthCookies`** / **`zodToFieldErrors`** from `src/lib/cookies.ts` and
  `src/lib/form-utils.ts`
- **Tailwind 4** utility classes

No new dependencies.

## Commands

```bash
npm run dev          # http://localhost:4325/auth/login
npm test             # once tests/ is wired
```

## Project Structure

```
src/
├── pages/
│   └── auth/
│       ├── login.astro                       # login form + POST handler
│       ├── register.astro                    # participant signup
│       └── register/
│           └── organizer.astro               # organizer signup
└── features/
    └── auth/
        ├── actions/
        │   └── auth.action.ts                # login / registerParticipant / registerOrganizer
        └── schemas/
            └── auth.schema.ts                # re-exports + input types
```

## Code Style

**Action pattern** — typed functions that map 1:1 to backend routes, throw
`ApiError` on failure:

```ts
// src/features/auth/actions/auth.action.ts
export async function login(input: LoginInput): Promise<LoginResult> {
  const res = await apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: input,
  });
  return { ...res };
}
```

**Schema re-export** — feature-scoped imports without owning the canonical
schema:

```ts
// src/features/auth/schemas/auth.schema.ts
export {
  loginSchema, registerSchema, organizerRegisterSchema, validatePassword,
} from '@lib/validation';
```

**Page POST handler** — parse form, validate, call action, set cookies,
redirect. Errors flow back into the template:

```astro
---
if (Astro.request.method === 'POST') {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    fieldErrors = zodToFieldErrors(parsed.error);
  } else {
    try {
      const result = await login(parsed.data);
      setAuthCookies(Astro.cookies, result);
      return Astro.redirect(Astro.url.searchParams.get('redirect') ?? '/dashboard');
    } catch (err) {
      if (isUnauthorized(err)) formError = 'Email o contraseña incorrectos.';
    }
  }
}
---
```

## Testing Strategy

Tests land in `tests/` (Vitest + Playwright, see `docs/TESTING.md`).

- **Unit (`tests/unit/auth.action.test.ts`)** — each action calls the right
  endpoint, forwards body, unwraps response, throws on non-2xx.
- **Unit (`tests/unit/auth.schema.test.ts`)** — re-exports point to the
  canonical schemas.
- **Integration (`tests/integration/auth.test.ts`)** — POST `/auth/login`
  with valid credentials sets cookies; with bad credentials returns 200
  and renders the error message.
- **E2E (Playwright `e2e/tests/auth.spec.ts`)** — full login → dashboard
  flow, full participant registration → login → dashboard flow.

## Boundaries

- **No client-side fetch** — every form is a native HTML POST. React islands
  would mean duplicating validation client-side; not worth it now.
- **No session storage beyond cookies** — `access_token`, `refresh_token`,
  `user` are HttpOnly except `user` (read by layouts for nav).
- **Trust Zod for input validation at the form boundary** — the backend
  re-validates; the frontend's role is to give immediate field-level
  feedback.
- **Login response shape**: backend returns `RegisterResponse` on login
  (despite the name); the action normalizes it to `LoginResult`.
- **Registration does NOT auto-login** — backend returns user IDs only;
  redirect to `/auth/login` after a successful registration.

## Success Criteria

1. `POST /auth/login` with valid creds sets `access_token` + `refresh_token`
   cookies and redirects to `?redirect=...` or `/dashboard`.
2. `POST /auth/login` with bad creds re-renders the form with an error
   message and no cookies set.
3. `POST /auth/register` with a valid participant payload creates the user
   (backend returns 201) and shows a success message linking to login.
4. `POST /auth/register/organizer` with a valid organizer payload (incl.
   billing fields) succeeds the same way.
5. Field-level validation errors render next to their inputs.
6. Middleware (`src/middleware.ts`) is unchanged; `/auth/login`,
   `/auth/register`, `/auth/register/*` remain publicly accessible.
7. No new dependencies; existing `lib/cookies.ts`, `lib/validation.ts`,
   `lib/form-utils.ts`, `lib/api.ts` are reused as-is.

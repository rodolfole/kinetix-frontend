# Patterns

How code in a feature is written. New code follows this file; old code is fixed when touched.

## Action

```ts
// src/features/events/actions/event.action.ts
import { defineAction, ActionError } from 'astro:actions';
import { api } from '@lib/api';
import { updateEventSchema } from '../schemas/event.schema';
import type { BackendEvent } from '../types/event.type';
import { toEventView } from '../lib/event.mapper';

export const event = {
  update: defineAction({
    accept: 'json',
    input: updateEventSchema,
    handler: async (input, ctx) => {
      const token = ctx.cookies.get('access_token')?.value;
      if (!token) throw new ActionError({ code: 'UNAUTHORIZED' });

      const res = await api.put<BackendEvent>(`/events/${input.id}`, input, { token });
      if (res.error) throw new ActionError({ code: toActionCode(res.status), message: res.error });

      return toEventView(res.data);
    },
  }),
};
```

Rules:
- Every exported member of `src/actions/index.ts` is a `defineAction`. Plain helper objects do not belong there.
- `input` is always a Zod schema from the feature `schemas/`. Import Zod from `astro/zod` everywhere.
- The token is read from cookies inside the action and passed to `api` as the `token` option. Never pass the token from the browser.
- Map API errors to `ActionError` codes (`UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `BAD_REQUEST`, `CONFLICT`, `INTERNAL_SERVER_ERROR`). Never return `{ success: false }` objects.
- Map backend DTOs to view models in one mapper per feature; components never read raw backend shapes.

## API client (`lib/api.ts`)

- Single place that knows the base URL (`import.meta.env.KINETIX_API_URL`), timeouts and headers.
- Returns `{ data, status }` or `{ error, status }`; it does not throw for HTTP errors.
- Parses JSON only when `Content-Type` is JSON; `204` returns `data: undefined`.
- Supports `{ token }` to add `Authorization: Bearer`.

## Page

```astro
---
import MainLayout from '@layouts/MainLayout.astro';
import { EventHero, EventDistances } from '@features/events';

const { data: event, error } = await Astro.callAction(actions.event.getBySlug, { slug: Astro.params.slug! });
if (error?.code === 'NOT_FOUND') return Astro.redirect('/404');
---
<MainLayout title={event.title}>
  <EventHero event={event} />
  <EventDistances distances={event.distances} />
</MainLayout>
```

- Frontmatter: load, guard, compose. No formatting logic (use `lib/format.ts`), no inline types.
- Handle the error branch explicitly. Never fall back to hardcoded demo content.

## Component

- `.astro` component: typed `Props` interface imported from `types/` when shared, local only when private to the component.
- Use Starwind components (`Button`, `Input`, `Card`, ...) instead of hand-rolled ones. `shared/components/ui/Button.astro` is deprecated.
- Styling: Tailwind utilities with design tokens from `global.css` (`bg-primary`, `text-on-surface`). No hex colors, no inline `style` except computed values.
- Radius: cards `rounded-lg`, buttons/inputs `rounded-xl`.
- Copy is Spanish (product language); code, identifiers and comments are English. No emojis.

## Islands

Choose the lightest option that works:

| Need | Use |
|---|---|
| Static content | `.astro` |
| Toggle, tabs, copy-to-clipboard, small form logic | `.astro` + `<script>` (bundled, no framework) |
| Stateful widget with re-render (editor, picker with search) | React island |
| Heavy library (Leaflet, Recharts) | React island + `lazy()` import of the library |

- Directive: `client:visible` for below-the-fold, `client:idle` for non-critical, `client:load` only for above-the-fold interaction, `client:only="react"` only when the component cannot render on the server (Leaflet).
- Props are serializable and minimal. Islands call actions, never `fetch` to the API.
- Never mount React manually with `createRoot` inside a page `<script>`; make it an island.
- Communication between islands: DOM `CustomEvent` with a `kinetix:` prefix (as `AddressPicker` does) or nanostores. No globals on `window`.

## Forms

- Progressive enhancement: `<form method="POST" action={actions.x.y}>` works without JavaScript; client script only enhances.
- One Zod schema validates on the client (optional) and in the action (required).
- Errors render next to the field with `aria-invalid` and `aria-describedby`.

## Naming

| Thing | Convention | Example |
|---|---|---|
| Components, layouts | PascalCase | `EventHero.astro`, `RouteMap.tsx` |
| Actions | `<name>.action.ts` | `event.action.ts` |
| Schemas | `<name>.schema.ts` | `registration.schema.ts` |
| Types | `<name>.type.ts` | `event.type.ts` |
| Tests | colocated `<file>.test.ts(x)` | `slug.test.ts` |
| New routes | kebab-case, English (existing Spanish URLs such as `/exito` keep working via redirect if renamed) | `/events/[slug]/registration/success` |
| Custom events | `kinetix:<kebab>` | `kinetix:address-selected` |

Two components with the same name in different features are not allowed (`EventCard` exists twice today); prefix the narrower one (`DashboardEventCard`).

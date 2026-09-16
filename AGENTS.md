# Kinetix - Developer Guidelines

## Project Overview

Kinetix is a **running events platform** connecting athletes with race events.

### Current Features

| Feature        | Purpose                               |
| :------------- | :------------------------------------ |
| `auth`         | User authentication (register, login) |
| `registration` | Multi-step race registration flow     |
| `events`       | Event listing, details, pricing       |
| `home`         | Landing page with search              |
| `dashboard`    | User dashboard with stats             |

---

## Architecture - Feature-Based

```
actions
  index.ts        - Unified entry point; exports actions from /features
consts/           - Global constants and configuration values
features/
  <feature>/
    actions/      - Astro actions
    schemas/      - Zod schemas for input validation
    services/     - Business logic, DB queries, or external API calls
    types/        - Interfaces
    components/   - .astro components
layouts/          - Page templates and master layouts
lib/              - Pure utility functions and shared instances (e.g., db.ts)
shared/           - Global resources used across multiple features
  components/     - Common UI library
```

### Rules

1. **Types** in `types/` only, NOT inline in components
2. **Constants** in `consts/index.ts`, NOT inline
3. **Pure functions** in `lib/`, NOT inline in components
4. **Shared code** (used by 2+ features) goes in `shared/`
5. **Barrel exports** (`index.ts`) per feature

### Import Aliases

Defined in `tsconfig.json`:

- `@features/*` → `src/features/*`
- `@layouts/*` → `src/layouts/*`
- `@shared/*` → `src/shared/*`
- `@lib/*` → `src/lib/*`
- `@actions/*` → `src/actions/*`


## Tech Stack

| Tool     | Version | Notes                                                    |
| :------- | :------ | :------------------------------------------------------- |
| Astro    | 6.x     | Server-side rendering (`output: 'server'`)               |
| React    | 19.x    | Islands only for interactive components                  |
| Tailwind | 4.x     | Uses `@tailwindcss/vite` plugin, NOT `@astrojs/tailwind` |
| Starwind | latest  | UI component library                                     |


## Design System

- **Colors**: Material Design 3 tokens (in `src/styles/global.css`)
- **Fonts**: Lexend (headlines), Manrope (body) - Google Fonts
- **Spacing**:
  - Cards: `rounded-lg` (16px)
  - Buttons/Inputs: `rounded-xl` (24px)
- **Starwind**: Use Starwind components, avoid manual buttons/inputs


## Code Style

- TypeScript strict mode
- **All components are `.astro` files (static-first)**
- React only for interactive islands in functional components only (no class components)
- Astro Islands use `client:load` directives
- No emojis in code or UI

### Pattern: Form Handling

Astro Actions + Zod validation in `src/features/<feature>/actions/<name-action>.action.ts`:

```typescript
import { actions } from "astro:actions";

const result = await actions.registration.submit(formData);
```

## Backend (Planned)

Go backend with:
- Vertical Slice Architecture
- PostgreSQL + sqlc + goose
- Store pattern for data access


## Don'ts

- Don't put types inline in pages
- Don't duplicate data across features
- Don't use modals when inline UI or popovers work
- Don't over-engineer — ship the minimum needed

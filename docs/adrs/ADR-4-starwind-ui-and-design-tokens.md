# ADR-4: Starwind UI kit and design tokens

- Status: Accepted
- Date: 2026-09-15
- Deciders: Kinetix team
- Related: ADR-2, docs/PATTERNS.md, AGENTS.md

## Context
The UI needs accessible primitives (button, input, select, dialog, tabs, sidebar, table) without a client framework runtime, in Astro, with Tailwind 4. A brand look is also required (Lexend headlines, Manrope body, Material-3 style color roles).

## Decision
- Use **Starwind** (`starwind.config.json`, 19 components, `componentDir: src/components`, base color `neutral`, CSS variables on). Components are copied into `src/components/starwind/` as `.astro` files and are treated as vendored: change them through the Starwind CLI, not by hand.
- Use **Tailwind CSS 4** through `@tailwindcss/vite` (not `@astrojs/tailwind`), with `tw-animate-css` and `@tailwindcss/forms`.
- Design tokens live in CSS: `src/styles/global.css` (Material-3 color roles such as `--primary: #0058ba`, `--surface-*`, `.font-headline`, `.font-body`) imported by `MainLayout`; `src/styles/starwind.css` (Starwind `@theme` tokens, `--color-primary: hsl(0 0% 9%)`) imported by `DashboardLayout` and `ParticipantLayout`.
- Radius: cards `rounded-lg`, buttons/inputs `rounded-xl`. Use tokens (`bg-primary`, `text-on-surface`), not hex colors.

## Consequences
### Positive
- Accessible components with no React cost; source is owned and customizable.
- Public pages and dashboards can evolve their look independently.
- Tokens as CSS variables keep theming a CSS-only change.

### Negative / risks
- Two token systems with colliding names: `primary` is blue in `global.css` and near-black in `starwind.css`. Which one applies depends on the layout, so a shared component can change color between areas. Target: one token file, Starwind tokens mapped to the brand palette.
- `tailwind.config.mjs` is a Tailwind 3 leftover (lists `svelte`, `vue`); Tailwind 4 does not need it.
- `src/shared/components/ui/Button.astro` duplicates Starwind `Button` (deprecated in `PATTERNS.md`).
- `DashboardLayout` and `ParticipantLayout` duplicate the sidebar shell.
- Icons come from three packages (`@lucide/astro`, `lucide`, `@tabler/icons-react`); consolidation is open.
- Fonts are loaded from Google Fonts (external dependency, privacy and performance cost).

## Alternatives considered
- **shadcn/ui (React)**: same token model, but every component would be an island.
- **Hand-rolled components**: already drifted (`Button.astro`); more a11y work.
- **Plain Tailwind without a kit**: fastest start, slowest to keep consistent.

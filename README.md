# Kinetix - Running Events Platform

A modern web application for running events built with Astro, Feature-based architecture, Repository Pattern with Dependency Injection.

## 🏗️ Architecture

### Feature-Based Architecture

The project follows a feature-based structure where each feature is self-contained:

```
src/
├── actions/              # Global Astro actions
│   └── index.ts
├── features/             # Feature modules
│   ├── auth/            # Authentication feature
│   │   ├── actions/
│   │   ├── components/
│   │   ├── schemas/
│   │   ├── services/
│   │   │   ├── AuthService.ts
│   │   │   └── AuthRepository.ts
│   │   ├── types/
│   │   └── index.ts
│   ├── events/          # Events feature
│   │   ├── components/
│   │   │   ├── EventCard.astro
│   │   │   ├── EventHero.astro
│   │   │   ├── EventDescription.astro
│   │   │   ├── EventPricing.astro
│   │   │   ├── EventDistances.astro
│   │   │   ├── EventCTA.astro
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── EventService.ts
│   │   │   └── EventRepository.ts
│   │   ├── types/
│   │   │   └── event.type.ts
│   │   ├── schemas/
│   │   │   └── event.schema.ts
│   │   └── index.ts
│   └── home/            # Home page feature
│       └── components/
│           ├── HeroSection.astro
│           ├── SearchFilterBar.astro
│           ├── EventsGrid.astro
│           ├── NewsletterCTA.astro
│           └── index.ts
├── layouts/              # Page layouts
│   ├── Layout.astro     # Base layout
│   └── MainLayout.astro # Layout with Nav/Footer
├── lib/                  # Core utilities
│   ├── di.ts            # Dependency injection container
│   ├── mock-data.ts     # format/formatDate/price helpers (name kept by convention)
├── pages/                # Astro pages
│   ├── index.astro      # Home page
│   └── eventos/
│       ├── index.astro  # Events listing
│       └── [slug].astro # Event detail
├── shared/               # Shared components
│   ├── components/
│   │   ├── forms/       # Form components
│   │   ├── typography/  # Typography components
│   │   ├── ui/          # UI primitives
│   │   ├── Navbar.astro
│   │   ├── Footer.astro
│   │   └── index.ts
│   └── types/
│       └── index.ts
└── styles/
    └── global.css      # Global styles + Tailwind
```

### Repository Pattern with DI

Each feature has:
- **Types**: TypeScript interfaces for domain entities
- **Schemas**: Zod schemas for validation
- **Repository**: Data access abstraction (`IRepository` interfaces)
- **Service**: Business logic layer (`IService` interfaces)
- **Components**: UI components specific to the feature

```typescript
// Dependency Injection Container
export interface AppServices {
  events: IEventService;
  auth: IAuthService;
}

export function createAppServices(): AppServices {
  const eventRepository = new MockEventRepository();
  const authRepository = new MockAuthRepository();

  return {
    events: new EventService(eventRepository),
    auth: new AuthService(authRepository),
  };
}
```

## 🚀 Tech Stack

- **Framework**: [Astro](https://astro.build/) - Static-first with islands architecture
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Custom design system
- **UI Library**: [React](https://react.dev/) - Only for interactive islands (when needed)
- **Language**: [TypeScript](https://www.typescriptlang.org/) - Strict mode
- **Validation**: [Zod](https://zod.dev/) - Runtime type safety

## 🎨 Design System

### Typography

- **Headlines**: Lexend (Google Fonts)
- **Body**: Manrope (Google Fonts)

### Color Palette

Based on Material Design 3 with custom tokens:

```css
primary: #0058ba
secondary: #3854b7
tertiary: #883c93
surface: #f9f6f5
```

### Spacing Scale

Based on Tailwind's default scale with custom utilities for the custom color system.

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🧪 Development Scripts

```json
{
  "dev": "astro dev",
  "build": "astro build",
  "preview": "astro preview",
}
```

## 🗂️ Project Structure

### Pages

1. **Home** (`/`) - Landing page with hero, search, events grid, and newsletter CTA
2. **Events Listing** (`/eventos`) - All events with filtering
3. **Event Detail** (`/eventos/[slug]`) - Individual event page with registration

### Features

#### Events Feature

- **Event Types**: `BaseEvent`, `EventDistance`, `EventFilter`
- **Event Repository**: `MockEventRepository` (implements `IEventRepository`)
- **Event Service**: `EventService` (implements `IEventService`)
- **Components**:
  - `EventHero` - Hero section for event detail
  - `EventDescription` - Rich description with route map
  - `EventPricing` - Tiered pricing table
  - `EventDistances` - Distance selection cards
  - `EventCTA` - Call to action banner
  - `EventCard` - Card component for listings

#### Auth Feature

- **Auth Types**: `User`, `AuthSession`, `LoginCredentials`, `RegisterData`
- **Auth Repository**: `MockAuthRepository` (implements `IAuthRepository`)
- **Auth Service**: `AuthService` (implements `IAuthService`)
- **Components**: Ready for `LoginForm`, `RegisterForm`, etc.

## 🔄 State Management

- **Static Content**: Frontmatter + Props (Astro's built-in)
- **Interactive State**: React islands with local state
- **Authentication**: Service layer ready for backend integration

## 🎯 Key Patterns

### 1. Import Aliases

All paths use TypeScript aliases for clean imports:

```typescript
import { EventCard } from '@features/events/components';
import { Button } from '@shared/components';
import { MainLayout } from '@layouts/MainLayout.astro';
import { formatPrice } from '@lib/mock-data';
```

### 2. Component Composition

```astro
<MainLayout title="Events">
  <EventHero event={event} />
  <EventDescription event={event} />
  <EventPricing event={event} />
  <EventDistances event={event} />
  <EventCTA event={event} />
</MainLayout>
```

### 3. Feature Exports

Each feature exports from a barrel file (`index.ts`):

```typescript
// src/features/events/index.ts
export * from './services/EventService';
export * from './services/EventRepository';
export * from './types/event.type';
export * from './schemas/event.schema';
```

## 📝 Mock Data

Development uses mock data from `src/lib/mock-data.ts`:

```typescript
export const mockEvents: BaseEvent[] = [
  {
    id: 'event-001',
    name: '10K Valencia Marathon',
    // ... full event data
  },
  // ... more events
];

export function getEventBySlug(slug: string): BaseEvent | undefined
export function getEventById(id: string): BaseEvent | undefined
export function getFeaturedEvents(): BaseEvent[]
export function getUpcomingEvents(): BaseEvent[]
```

## 🎨 Styling Approach

### Tailwind + Custom Properties

```css
@layer base {
  :root {
    --primary: #0058ba;
    --surface: #f9f6f5;
    /* ... all design tokens */
  }
}

@layer utilities {
  .text-on-surface { color: var(--on-surface); }
  .bg-surface-container { background-color: var(--surface-container); }
}
```

### Component-Level Styles

Scoped styles with Astro's `<style>` tag when needed:

```astro
<style>
  .kinetic-gradient {
    background: linear-gradient(45deg, #0058ba 0%, #6c9fff 100%);
  }
</style>
```

## 🚧 Future Work

- [ ] E2E tests with Playwright

## 📄 License

TODO: Add license

---

Built with ❤️ using **Astro**, **Feature-based architecture**, and **Repository Pattern with DI**.
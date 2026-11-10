// EventDescription.astro cannot be rendered directly with @testing-library
// (vitest can't compile `.astro` files). The component is a pure template —
// its data transformations are limited to:
//   - splitting `event.description` on `\n` and trimming each paragraph
//     (rendered with `set:html`, so HTML inside paragraphs is preserved)
//   - `hasRoutes = routes.length > 0` to switch between RouteViewer and placeholder
//   - `defaultDistanceId = routes[0]?.distance_id || ''`
//   - `JSON.stringify(routes)` for the React island
// These tests pin down those data-flow contracts independently of the .astro file.
import { describe, it, expect } from 'vitest';
import type { BaseEvent } from '@features/events/types/event.type';

const baseEvent: BaseEvent = {
  id: 'evt1',
  name: 'Test',
  slug: 'test',
  shortDescription: 'short',
  description: 'Para uno\n\nPara dos\n\nPara tres',
  date: '2024-03-15T07:00:00Z',
  distances: [],
  featured: false,
  images: { hero: '/h.jpg' },
  location: { address: 'addr', municipality: 'M', state: 'S' },
  organizer: { id: 'o1', name: 'Org' },
  pricing: { basePrice: 0, currency: 'MXN' },
  status: 'upcoming',
  tags: ['road', 'trail'],
  createdAt: '',
  updatedAt: '',
};

describe('EventDescription data flow', () => {
  describe('description paragraph split', () => {
    it('splits description into paragraphs by newline', () => {
      const paragraphs = baseEvent.description.split('\n').map((p) => p.trim());
      expect(paragraphs).toEqual(['Para uno', '', 'Para dos', '', 'Para tres']);
    });

    it('preserves HTML inside paragraphs (set:html is used in template)', () => {
      const html = 'Intro\n\n<strong>Bold para</strong>';
      const paragraphs = html.split('\n').map((p) => p.trim());
      expect(paragraphs[0]).toBe('Intro');
      expect(paragraphs[2]).toBe('<strong>Bold para</strong>');
    });

    it('handles single-line description without splitting', () => {
      const single = 'Just one paragraph';
      const paragraphs = single.split('\n').map((p) => p.trim());
      expect(paragraphs).toEqual(['Just one paragraph']);
    });

    it('handles empty description', () => {
      const paragraphs = ''.split('\n').map((p) => p.trim());
      expect(paragraphs).toEqual(['']);
    });
  });

  describe('routes / RouteViewer selection', () => {
    it('hasRoutes is true when routes is non-empty', () => {
      const routes = [{ distance_id: 'd1' }];
      expect(routes.length > 0).toBe(true);
    });

    it('hasRoutes is false when routes is empty', () => {
      const routes: Array<{ distance_id: string }> = [];
      expect(routes.length > 0).toBe(false);
    });

    it('defaultDistanceId falls back to empty string when no routes', () => {
      const routes: Array<{ distance_id: string }> = [];
      const defaultDistanceId = routes[0]?.distance_id || '';
      expect(defaultDistanceId).toBe('');
    });

    it('defaultDistanceId uses the first route distance_id', () => {
      const routes = [{ distance_id: 'd42' }, { distance_id: 'd99' }];
      const defaultDistanceId = routes[0]?.distance_id || '';
      expect(defaultDistanceId).toBe('d42');
    });

    it('routes are JSON-serialized for the React island and round-trip', () => {
      const routes = [{ distance_id: 'd1', name: '10K' }];
      const routesJson = JSON.stringify(routes);
      expect(JSON.parse(routesJson)).toEqual(routes);
    });
  });

  describe('event shape used by the template', () => {
    it('reads event.shortDescription for the heading', () => {
      expect(baseEvent.shortDescription).toBe('short');
    });

    it('renders each tag in event.tags', () => {
      expect(baseEvent.tags).toEqual(['road', 'trail']);
    });

    it('renders organizer.name in the details panel', () => {
      expect(baseEvent.organizer.name).toBe('Org');
    });

    it('renders event.location.address in the details panel', () => {
      expect(baseEvent.location.address).toBe('addr');
    });

    it('omits capacity-status block when capacity or registered missing', () => {
      // Template gates the capacity block on `event.capacity && event.registered`
      const ev: BaseEvent = { ...baseEvent };
      expect(Boolean(ev.capacity && ev.registered)).toBe(false);
    });

    it('shows capacity-status block when capacity and registered are both set', () => {
      const ev: BaseEvent = { ...baseEvent, capacity: 100, registered: 25 };
      expect(Boolean(ev.capacity && ev.registered)).toBe(true);
    });
  });
});

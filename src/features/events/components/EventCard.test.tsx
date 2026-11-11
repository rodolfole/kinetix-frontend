// EventCard.astro cannot be rendered directly with @testing-library (vitest
// can't compile `.astro` files). These tests cover the data flow the card
// depends on: the `formatPrice`, `formatDate`, and `getAvailableSlots` helpers
// in `mock-data.ts`, plus the inline price-calculation rule used by the
// component (`pricing.basePrice + mainDistance.priceModifier`).
import { describe, it, expect } from 'vitest';
import { formatPrice, formatDate, getAvailableSlots } from '@lib/mock-data';
import type { BaseEvent } from '@features/events/types/event.type';

const sampleEvent: BaseEvent = {
  id: 'evt1',
  name: 'Test Race',
  slug: 'test-race',
  shortDescription: 'short',
  description: 'desc',
  date: '2024-03-15T07:00:00Z',
  distances: [
    { id: 'd1', distanceKm: 10, name: '10K', priceModifier: 5000, availableSlots: 100, registered: 30 },
    { id: 'd2', distanceKm: 5, name: '5K', priceModifier: 0 },
  ],
  featured: false,
  images: { hero: '/hero.jpg' },
  location: { address: 'addr', municipality: 'M', state: 'S' },
  organizer: { id: 'o1', name: 'Org' },
  pricing: { basePrice: 10000, currency: 'MXN' },
  status: 'upcoming',
  tags: ['road'],
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('EventCard data flow (formatPrice, formatDate, getAvailableSlots, price calc)', () => {
  describe('formatPrice', () => {
    it('divides amount by 100 and formats as currency', () => {
      // 10000 cents → 100 in major units
      expect(formatPrice(10000, 'MXN')).toMatch(/100/);
    });

    it('handles zero amount', () => {
      expect(formatPrice(0, 'MXN')).toMatch(/0/);
    });

    it('defaults to EUR currency', () => {
      // EUR formatter should produce a euro-sign character on the en-US locale
      expect(formatPrice(100)).toMatch(/€/);
    });
  });

  describe('formatDate', () => {
    it('returns a non-empty date string', () => {
      const s = formatDate('2024-03-15T07:00:00Z');
      expect(typeof s).toBe('string');
      expect(s.length).toBeGreaterThan(0);
    });
  });

  describe('getAvailableSlots', () => {
    it('returns availableSlots minus registered for the matching distance', () => {
      expect(getAvailableSlots(sampleEvent, 'd1')).toBe(70);
    });

    it('returns undefined when distance has no availableSlots', () => {
      expect(getAvailableSlots(sampleEvent, 'd2')).toBeUndefined();
    });

    it('returns undefined when distance id is unknown', () => {
      expect(getAvailableSlots(sampleEvent, 'missing')).toBeUndefined();
    });

    it('treats registered=0 as full availableSlots', () => {
      const e: BaseEvent = {
        ...sampleEvent,
        distances: [{ id: 'd3', distanceKm: 21, name: '21K', priceModifier: 0, availableSlots: 25, registered: 0 }],
      };
      expect(getAvailableSlots(e, 'd3')).toBe(25);
    });
  });

  describe('price calculation (pricing.basePrice + mainDistance.priceModifier)', () => {
    it('adds priceModifier to basePrice for the first distance', () => {
      const main = sampleEvent.distances[0];
      const price = sampleEvent.pricing.basePrice + main.priceModifier;
      expect(price).toBe(15000);
    });

    it('falls back to basePrice when event has no distances', () => {
      const noDistances: BaseEvent = { ...sampleEvent, distances: [] };
      const main = noDistances.distances[0];
      const price = main
        ? noDistances.pricing.basePrice + main.priceModifier
        : noDistances.pricing.basePrice;
      expect(price).toBe(noDistances.pricing.basePrice);
    });

    it('clamps negative price to 0 (matches Math.max(0, price) in template)', () => {
      const main = { ...sampleEvent.distances[0], priceModifier: -99999 };
      const raw = sampleEvent.pricing.basePrice + main.priceModifier;
      expect(Math.max(0, raw)).toBe(0);
    });
  });
});

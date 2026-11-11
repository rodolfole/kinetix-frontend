// Server-side mappings of the event editor page (loaded event → form values and
// event detail → pre-populated sub-resource cards). Extracted from the page
// frontmatter so the shapes are testable without rendering the page.
import { describe, it, expect } from 'vitest';
import { buildFormData, buildInitialSubResources } from './subresources';

const existingEvent = {
  id: 'e1',
  name: 'Maratón',
  slug: 'maraton',
  description: 'Descripción completa',
  shortDescription: 'Corta',
  date: '2026-05-01T13:30:00Z',
  logo_url: 'logo.png',
  location: { state: 'Jalisco', municipality: 'Arandas', address: 'Calle 1' },
  pricing: { earlyBirdDeadline: '2026-04-20T00:00:00Z' },
};

describe('buildFormData', () => {
  it('returns empty values when there is no event (create mode)', () => {
    expect(buildFormData(null)).toEqual({
      name: '',
      slug: '',
      description: '',
      state: '',
      municipality: '',
      address: '',
      logo_url: '',
      date: '',
      deadline: '',
    });
  });

  it('maps an existing event into input-ready values', () => {
    expect(buildFormData(existingEvent)).toEqual({
      name: 'Maratón',
      slug: 'maraton',
      description: 'Descripción completa',
      state: 'Jalisco',
      municipality: 'Arandas',
      address: 'Calle 1',
      logo_url: 'logo.png',
      date: '2026-05-01T13:30',
      deadline: '2026-04-20',
    });
  });

  it('prefers the full description and falls back to the short one', () => {
    expect(buildFormData({ ...existingEvent, description: '' }).description).toBe('Corta');
  });

  it('leaves optional values empty when the backend omits them', () => {
    const data = buildFormData({ id: 'e1', name: 'X', slug: 'x' });
    expect(data).toMatchObject({
      state: '',
      municipality: '',
      address: '',
      logo_url: '',
      date: '',
      deadline: '',
    });
  });
});

describe('buildInitialSubResources', () => {
  it('returns empty arrays when there is no event detail', () => {
    expect(buildInitialSubResources(null)).toEqual({
      distances: [],
      pricing_stages: [],
      sponsors: [],
      runner_kits: [],
      registrations: [],
      itinerary: [],
      categories: [],
    });
  });

  it('maps distances, pricing stages, sponsors, kits, locations and itinerary', () => {
    const detail = {
      distances: [{ km: 10, capacity: 500, surface: 'trail' }],
      pricing_stages: [
        {
          distance_id: 'd1',
          name: 'Early',
          price: 450,
          start_date: '2026-01-01T00:00:00Z',
          end_date: '2026-02-01T00:00:00Z',
          is_early_bird: true,
        },
      ],
      sponsors: [{ name: 'Acme', tier: 'gold' }],
      runner_kits: [{ name: 'Playera', icon: 'shirt' }],
      registration_locations: [{ location_name: 'Gimnasio', address: 'Calle 2' }, { name: 'Parque' }],
      data: { itinerary: [{ key: 'Salida', time: '08:00', icon: 'map-pin' }] },
    };

    expect(buildInitialSubResources(detail)).toEqual({
      distances: [{ distance_type_id: 'fallback-10K', km: 10, capacity: 500, surface: 'trail' }],
      pricing_stages: [
        {
          distance_id: 'd1',
          name: 'Early',
          price: 450,
          start_date: '2026-01-01',
          end_date: '2026-02-01',
          is_early_bird: true,
        },
      ],
      sponsors: [{ name: 'Acme', tier: 'gold', logo_url: '' }],
      runner_kits: [{ name: 'Playera', icon: 'shirt' }],
      registrations: [
        { location_name: 'Gimnasio', address: 'Calle 2' },
        { location_name: 'Parque', address: '' },
      ],
      itinerary: [{ key: 'Salida', time: '08:00', icon: 'map-pin' }],
      categories: [],
    });
  });

  it('groups award rows into one card per (distance, age category, gender) sorted by place', () => {
    const detail = {
      awards: [
        { distance_id: 'd1', age_category_id: 'a1', gender: 'female', place: 2, prize_amount: 800 },
        { distance_id: 'd1', age_category_id: 'a1', gender: 'female', place: 1, prize_amount: 1500 },
        { distance_id: 'd1', age_category_id: 'a1', gender: 'male', place: 1, prize_amount: 1000 },
      ],
    };

    expect(buildInitialSubResources(detail).categories).toEqual([
      {
        distance_id: 'd1',
        age_category_id: 'a1',
        gender: 'female',
        num_places: 2,
        prize_amounts: [1500, 800],
      },
      {
        distance_id: 'd1',
        age_category_id: 'a1',
        gender: 'male',
        num_places: 1,
        prize_amounts: [1000],
      },
    ]);
  });

  it('accepts the backend `categories` key for awards too', () => {
    const detail = {
      categories: [{ distance_id: 'd1', age_category_id: 'a1', gender: 'general', place: 1, prize_amount: 500 }],
    };
    expect(buildInitialSubResources(detail).categories).toEqual([
      {
        distance_id: 'd1',
        age_category_id: 'a1',
        gender: 'general',
        num_places: 1,
        prize_amounts: [500],
      },
    ]);
  });
});

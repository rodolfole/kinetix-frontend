vi.mock('astro:actions', () => ({
  defineAction: <T>(config: T) => config,
  ActionError: class ActionError extends Error {
    code: string;
    constructor({ code, message }: { code: string; message: string }) {
      super(message);
      this.code = code;
    }
  },
}));

import { describe, it, expect, vi, afterEach } from 'vitest';
import { event } from './event.action';

const evt = {
  id: 'e1',
  organizer_id: 'o1',
  name: 'Carrera',
  slug: 'carrera',
  description: '<b>Descripción</b>',
  event_date: '2026-12-01T08:00:00Z',
  deadline: '2026-11-20T00:00:00Z',
  state: 'CDMX',
  municipality: 'Coyoacán',
  address: 'Calle 1',
  logo_url: '',
  status: 'published',
  itinerary: [{ key: 'k', time: '07:00', icon: 'ticket' }],
  created_at: 'c',
  updated_at: 'u',
};

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}
const cookiesWith = (token?: string) => ({
  get: (name: string) => (name === 'access_token' && token ? { value: token } : undefined),
});

describe('event.getBySlug', () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });
  const run = (slug: string, token?: string) =>
    (event.getBySlug as any).handler({ slug }, { cookies: cookiesWith(token) });

  it('throws NOT_FOUND when the slug lookup fails', async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(jsonResponse({ message: 'not found' }, 404)) as any;
    await expect(run('missing')).rejects.toMatchObject({ code: 'NOT_FOUND', message: 'Evento no encontrado' });
  });

  it('maps backend event, detail and organizer into BaseEvent', async () => {
    globalThis.fetch = vi.fn(async (url: string) => {
      if (url.endsWith('/events/slug/carrera')) return jsonResponse({ data: evt });
      if (url.endsWith('/events/e1/detail'))
        return jsonResponse({
          data: evt,
          distances: [{ id: 'd1', km: 21, capacity: 50, surface: 'trail', elevation: 300, time_limit: '03:00' }],
          tags: ['trail'],
          pricing_stages: [{ id: 'p1', distance_id: 'd1', name: 'R', price: 600, start_date: 's', end_date: '2026-11-01T00:00:00Z', is_early_bird: false }],
          runner_kits: [{ name: 'Playera', icon: 'shirt' }],
        });
      if (url.endsWith('/organizers/o1')) return jsonResponse({ data: { id: 'o1', business_name: 'Biz', logo_url: 'org.png', contact_email: 'a@b.c' } });
      return jsonResponse({}, 404);
    }) as any;

    const mapped = await run('carrera', 'tok');

    // token is forwarded to every backend call
    for (const call of (globalThis.fetch as any).mock.calls) {
      expect(call[1].headers.Authorization).toBe('Bearer tok');
    }
    expect(mapped).toMatchObject({
      id: 'e1',
      slug: 'carrera',
      shortDescription: 'Descripción...',
      organizer: { id: 'o1', name: 'Biz', logo: 'org.png' },
      images: { hero: 'org.png', gallery: ['org.png', 'org.png'] },
      distances: [{ id: 'd1', km: 21, distanceKm: 21, name: '21K', elevation: 300, timeLimit: '03:00', capacity: 50 }],
      pricing: { basePrice: 600, currency: 'MXN', earlyBirdDeadline: evt.deadline },
      tags: ['trail'],
      runner_kits: [{ name: 'Playera', icon: 'shirt' }],
      capacity: 50,
      itinerary: evt.itinerary,
    });
  });

  it('sends no Authorization header for anonymous visitors', async () => {
    globalThis.fetch = vi.fn(async (url: string) =>
      url.includes('/events/slug/') ? jsonResponse({ data: evt }) : jsonResponse({ message: 'x' }, 404)
    ) as any;
    await run('carrera');
    expect((globalThis.fetch as any).mock.calls[0][1].headers.Authorization).toBeUndefined();
  });
});

describe('event.getDistanceTypes', () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('unwraps the backend { message, data } envelope into the distance type array', async () => {
    globalThis.fetch = vi.fn(async () =>
      jsonResponse({ message: 'ok', data: [{ id: 'dt1', name: '10K', km: 10 }] })
    ) as any;

    const types = await (event.getDistanceTypes as any).handler({}, { cookies: cookiesWith('tok') });

    expect(types).toEqual([{ id: 'dt1', name: '10K', km: 10 }]);
    expect((globalThis.fetch as any).mock.calls[0][1].headers.Authorization).toBe('Bearer tok');
  });

  it('returns an empty array when the envelope has no data list', async () => {
    globalThis.fetch = vi.fn(async () => jsonResponse({ message: 'ok' })) as any;

    const types = await (event.getDistanceTypes as any).handler({}, { cookies: cookiesWith() });

    expect(types).toEqual([]);
  });
});

describe('event.getAgeCategories', () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('unwraps the backend { message, data } envelope into the age category array', async () => {
    globalThis.fetch = vi.fn(async () =>
      jsonResponse({
        message: 'ok',
        data: [{ id: 'ac1', name: '18-29', min_age: 18, max_age: 29, display_order: 1 }],
      })
    ) as any;

    const categories = await (event.getAgeCategories as any).handler({}, { cookies: cookiesWith('tok') });

    expect(categories).toEqual([
      { id: 'ac1', name: '18-29', min_age: 18, max_age: 29, display_order: 1 },
    ]);
    expect((globalThis.fetch as any).mock.calls[0][1].headers.Authorization).toBe('Bearer tok');
  });

  it('returns an empty array when the envelope has no data list', async () => {
    globalThis.fetch = vi.fn(async () => jsonResponse({ message: 'ok' })) as any;

    const categories = await (event.getAgeCategories as any).handler({}, { cookies: cookiesWith() });

    expect(categories).toEqual([]);
  });
});

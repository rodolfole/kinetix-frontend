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
import { home } from './home.action';

const evt = {
  id: 'e1',
  organizer_id: 'o1',
  name: 'Carrera',
  slug: 'carrera',
  description: '<p>Una carrera</p>',
  event_date: '2026-12-01T08:00:00Z',
  deadline: '2026-11-20T00:00:00Z',
  state: 'CDMX',
  municipality: 'Coyoacán',
  address: 'Calle 1',
  logo_url: 'https://img/logo.png',
  status: 'published',
  created_at: 'c',
  updated_at: 'u',
};

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

describe('home.getEvents', () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });
  const run = () => (home.getEvents as any).handler();

  it('returns [] when the backend has no events (and fetches no detail)', async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(jsonResponse({ data: [] })) as any;
    expect(await run()).toEqual([]);
    expect((globalThis.fetch as any).mock.calls).toHaveLength(1);
  });

  it('throws a BAD_REQUEST ActionError when the list call fails', async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(jsonResponse({ message: 'boom' }, 500)) as any;
    await expect(run()).rejects.toMatchObject({ code: 'BAD_REQUEST', message: 'boom' });
  });

  it('maps backend snake_case events with detail and organizer into BaseEvent', async () => {
    globalThis.fetch = vi.fn(async (url: string) => {
      if (url.endsWith('/events')) return jsonResponse({ data: [evt] });
      if (url.endsWith('/events/e1/detail'))
        return jsonResponse({
          data: evt,
          distances: [{ id: 'd1', km: 10, capacity: 100, surface: 'asphalt' }],
          pricing_stages: [
            { id: 'p1', distance_id: 'd1', name: 'Early', price: 300, start_date: 's', end_date: '2026-10-01T00:00:00Z', is_early_bird: true },
            { id: 'p2', distance_id: 'd1', name: 'Regular', price: 450, start_date: 's', end_date: '2026-11-15T00:00:00Z', is_early_bird: false },
          ],
        });
      if (url.endsWith('/organizers/o1'))
        return jsonResponse({ data: { id: 'o1', business_name: 'Biz SA', brand_name: 'Brand', contact_email: 'a@b.c', logo_url: 'org.png' } });
      return jsonResponse({}, 404);
    }) as any;

    const [mapped] = await run();

    expect(mapped).toMatchObject({
      id: 'e1',
      slug: 'carrera',
      name: 'Carrera',
      date: evt.event_date,
      location: { state: 'CDMX', municipality: 'Coyoacán', address: 'Calle 1' },
      organizer: { id: 'o1', name: 'Brand', logo: 'org.png' },
      images: { hero: 'https://img/logo.png' },
      distances: [{ id: 'd1', distanceKm: 10, name: '10K', capacity: 100, priceModifier: 0 }],
      pricing: { basePrice: 450, currency: 'MXN', earlyBirdDeadline: evt.deadline },
      status: 'published',
      featured: false,
      registered: 0,
    });
    expect(mapped.shortDescription).toBe('Una carrera...');
  });

  it('falls back to "Unknown Organizer" and empty distances when detail/organizer calls fail', async () => {
    globalThis.fetch = vi.fn(async (url: string) =>
      url.endsWith('/events') ? jsonResponse({ data: [evt] }) : jsonResponse({ message: 'nope' }, 404)
    ) as any;
    const [mapped] = await run();
    expect(mapped.organizer.name).toBe('Unknown Organizer');
    expect(mapped.distances).toEqual([]);
    expect(mapped.pricing.basePrice).toBe(0);
  });
});

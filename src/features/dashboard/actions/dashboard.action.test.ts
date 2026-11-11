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
import { dashboard } from './dashboard.action';

const organizerCookie = (organizerId = 'org-1') =>
  JSON.stringify({ role: 'organizer', organizer_id: organizerId, email: 'o@x.com' });
const participantCookie = (participantId = 'part-1') =>
  JSON.stringify({ role: 'participant', participant_id: participantId, email: 'p@x.com' });

const cookiesWith = (token: string | undefined, user: string | undefined) => ({
  get: (name: string) => {
    if (name === 'access_token' && token) return { value: token };
    if (name === 'user' && user) return { value: user };
    return undefined;
  },
});

const backendEvent = (overrides: Record<string, any> = {}) => ({
  id: 'e1',
  organizer_id: 'org-1',
  name: 'Carrera Kinetix',
  slug: 'carrera-kinetix',
  description: '10K',
  event_date: '2027-05-01T13:00:00Z',
  deadline: '2027-04-20T00:00:00Z',
  state: 'Jalisco',
  municipality: 'Arandas',
  address: 'Calle 1',
  status: 'published',
  created_at: 'c',
  updated_at: 'u',
  ...overrides,
});

const jsonResponse = (body: any, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const runOrganizer = (input: any = {}, cookies = cookiesWith('tok', organizerCookie())) =>
  (dashboard.getOrganizerOverview as any).handler(input, { cookies });

const runParticipant = (cookies = cookiesWith('tok', participantCookie())) =>
  (dashboard.getParticipantOverview as any).handler({}, { cookies });

describe('dashboard.getOrganizerOverview', () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('throws UNAUTHORIZED without an access token', async () => {
    globalThis.fetch = vi.fn() as any;
    await expect(runOrganizer({}, cookiesWith(undefined, organizerCookie()))).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
    expect((globalThis.fetch as any).mock.calls).toHaveLength(0);
  });

  it('throws UNAUTHORIZED when the session has no organizer claim', async () => {
    globalThis.fetch = vi.fn() as any;
    await expect(
      runOrganizer({}, cookiesWith('tok', JSON.stringify({ role: 'organizer' }))),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    expect((globalThis.fetch as any).mock.calls).toHaveLength(0);
  });

  it('lists events with the Bearer token and a limit that is not the backend default', async () => {
    globalThis.fetch = vi.fn(async () => jsonResponse({ data: [] })) as any;

    await runOrganizer({});

    const [url, init] = (globalThis.fetch as any).mock.calls[0];
    expect(url).toContain('/events?limit=100');
    expect(init.headers.Authorization).toBe('Bearer tok');
  });

  it('keeps only the events of the session organizer', async () => {
    globalThis.fetch = vi.fn(async (url: string) => {
      if (url.includes('/events?limit=100')) {
        return jsonResponse({
          data: [backendEvent({ id: 'e1' }), backendEvent({ id: 'e2', organizer_id: 'org-2' })],
        });
      }
      if (url.includes('/registrations?event_id=')) return jsonResponse({ data: [] });
      return jsonResponse({ data: backendEvent(), distances: [] });
    }) as any;

    const overview = await runOrganizer({});

    expect(overview.stats.totalEvents).toBe(1);
    expect(overview.events.map((event: any) => event.id)).toEqual(['e1']);
  });

  it('counts the registrations of each event and aggregates the totals', async () => {
    globalThis.fetch = vi.fn(async (url: string) => {
      if (url.includes('/events?limit=100')) {
        return jsonResponse({
          data: [
            backendEvent({ id: 'e1', status: 'published' }),
            backendEvent({ id: 'e2', status: 'draft' }),
          ],
        });
      }
      if (url.includes('/registrations?event_id=e1')) {
        return jsonResponse({ data: [{ id: 'r1' }, { id: 'r2' }, { id: 'r3' }] });
      }
      if (url.includes('/registrations?event_id=e2')) return jsonResponse({ data: [{ id: 'r4' }] });
      return jsonResponse({ data: backendEvent(), distances: [{ id: 'd1', km: 10, capacity: 500 }] });
    }) as any;

    const overview = await runOrganizer({});

    expect(overview.stats).toEqual({
      totalEvents: 2,
      activeEvents: 1,
      totalRegistrations: 4,
    });
    expect(overview.events).toEqual([
      expect.objectContaining({ id: 'e1', registered: 3, capacity: 500 }),
      expect.objectContaining({ id: 'e2', registered: 1, capacity: 500 }),
    ]);
  });

  it('tolerates a failing registration count and a failing detail call', async () => {
    globalThis.fetch = vi.fn(async (url: string) => {
      if (url.includes('/events?limit=100')) return jsonResponse({ data: [backendEvent()] });
      if (url.includes('/registrations?event_id=')) return jsonResponse({ message: 'boom' }, 500);
      return jsonResponse({ message: 'no detail' }, 404);
    }) as any;

    const overview = await runOrganizer({});

    expect(overview.events[0]).toMatchObject({ registered: 0, capacity: 0 });
    expect(overview.stats.totalRegistrations).toBe(0);
  });

  it('throws a BAD_REQUEST ActionError when the event list fails', async () => {
    globalThis.fetch = vi.fn(async () => jsonResponse({ message: 'nope' }, 500)) as any;
    await expect(runOrganizer({})).rejects.toMatchObject({ code: 'BAD_REQUEST', message: 'nope' });
  });

  it('returns an explicit empty overview and skips the per-event calls', async () => {
    globalThis.fetch = vi.fn(async () => jsonResponse({ data: [] })) as any;

    const overview = await runOrganizer({});

    expect(overview.empty).toBe(true);
    expect(overview.events).toEqual([]);
    expect(overview.deadlines).toEqual([]);
    expect(overview.distanceDistribution).toEqual([]);
    expect((globalThis.fetch as any).mock.calls).toHaveLength(1);
  });

  it('sorts recent events by date descending and honours recentLimit', async () => {
    globalThis.fetch = vi.fn(async (url: string) => {
      if (url.includes('/events?limit=100')) {
        return jsonResponse({
          data: [
            backendEvent({ id: 'old', event_date: '2026-01-01T10:00:00Z' }),
            backendEvent({ id: 'new', event_date: '2027-01-01T10:00:00Z' }),
            backendEvent({ id: 'mid', event_date: '2026-06-01T10:00:00Z' }),
          ],
        });
      }
      if (url.includes('/registrations')) return jsonResponse({ data: [] });
      return jsonResponse({ data: backendEvent(), distances: [] });
    }) as any;

    const overview = await runOrganizer({ recentLimit: 2 });

    expect(overview.recentEvents.map((event: any) => event.id)).toEqual(['new', 'mid']);
  });

  it('lists the upcoming registration deadlines and the distance distribution', async () => {
    globalThis.fetch = vi.fn(async (url: string) => {
      if (url.includes('/events?limit=100')) {
        return jsonResponse({
          data: [
            backendEvent({ id: 'e1', deadline: '2020-01-01T00:00:00Z' }),
            backendEvent({ id: 'e2', deadline: '2999-04-20T00:00:00Z' }),
          ],
        });
      }
      if (url.includes('/registrations')) return jsonResponse({ data: [] });
      if (url.includes('/events/e1/detail')) {
        return jsonResponse({ data: backendEvent({ id: 'e1' }), distances: [{ id: 'd1', km: 10, capacity: 100 }] });
      }
      if (url.includes('/events/e2/detail')) {
        return jsonResponse({
          data: backendEvent({ id: 'e2' }),
          distances: [
            { id: 'd2', km: 10, capacity: 100 },
            { id: 'd3', km: 21.0975, capacity: 100 },
          ],
        });
      }
      return jsonResponse({ message: 'x' }, 404);
    }) as any;

    const overview = await runOrganizer({});

    expect(overview.deadlines).toEqual([
      { event: 'Carrera Kinetix', date: '2999-04-20T00:00:00Z', type: 'Cierre de inscripciones' },
    ]);
    expect(overview.distanceDistribution).toEqual([
      { label: '10K', count: 2 },
      { label: '21K', count: 1 },
    ]);
  });
});

describe('dashboard.getParticipantOverview', () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('throws UNAUTHORIZED when the session has no participant claim', async () => {
    globalThis.fetch = vi.fn() as any;
    await expect(
      runParticipant(cookiesWith('tok', JSON.stringify({ role: 'participant' }))),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    expect((globalThis.fetch as any).mock.calls).toHaveLength(0);
  });

  it('reads the registrations of the participant with the Bearer token', async () => {
    globalThis.fetch = vi.fn(async (url: string) => {
      if (url.includes('/registrations/participant/part-1')) {
        return jsonResponse({ data: [{ id: 'r1', event_id: 'e1', status: 'confirmed' }] });
      }
      return jsonResponse({ data: [backendEvent({ id: 'e1' })] });
    }) as any;

    const overview = await runParticipant();

    const [url, init] = (globalThis.fetch as any).mock.calls[0];
    expect(url).toContain('/registrations/participant/part-1');
    expect(init.headers.Authorization).toBe('Bearer tok');
    expect(overview.registrations).toEqual([
      expect.objectContaining({ id: 'r1', eventName: 'Carrera Kinetix', status: 'confirmed' }),
    ]);
  });

  it('aggregates the participant stats', async () => {
    globalThis.fetch = vi.fn(async (url: string) => {
      if (url.includes('/registrations/participant/')) {
        return jsonResponse({
          data: [
            { id: 'r1', event_id: 'e1', status: 'confirmed' },
            { id: 'r2', event_id: 'e1', status: 'pending' },
            { id: 'r3', event_id: 'e2', status: 'cancelled' },
          ],
        });
      }
      return jsonResponse({ data: [backendEvent({ id: 'e1' }), backendEvent({ id: 'e2' })] });
    }) as any;

    const overview = await runParticipant();

    expect(overview.stats).toEqual({ total: 3, confirmed: 1, pending: 1 });
  });

  it('returns an explicit empty overview when the participant has no registrations', async () => {
    globalThis.fetch = vi.fn(async () => jsonResponse({ data: [] })) as any;

    const overview = await runParticipant();

    expect(overview.empty).toBe(true);
    expect(overview.registrations).toEqual([]);
    expect(overview.upcoming).toEqual([]);
    expect(overview.stats).toEqual({ total: 0, confirmed: 0, pending: 0 });
  });

  it('keeps the registrations when the event lookup fails', async () => {
    globalThis.fetch = vi.fn(async (url: string) => {
      if (url.includes('/registrations/participant/')) {
        return jsonResponse({ data: [{ id: 'r1', event_id: 'e1', status: 'pending' }] });
      }
      return jsonResponse({ message: 'nope' }, 500);
    }) as any;

    const overview = await runParticipant();

    expect(overview.registrations[0]).toMatchObject({ id: 'r1', eventName: '' });
  });

  it('throws a BAD_REQUEST ActionError when the registration list fails', async () => {
    globalThis.fetch = vi.fn(async () => jsonResponse({ message: 'boom' }, 500)) as any;
    await expect(runParticipant()).rejects.toMatchObject({ code: 'BAD_REQUEST', message: 'boom' });
  });
});

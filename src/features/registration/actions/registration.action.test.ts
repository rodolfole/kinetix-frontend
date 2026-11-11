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
import { registration } from './registration.action';

const valid = {
  first_name: 'Ana',
  last_name: 'Pérez',
  second_last_name: 'López',
  birth_date: '1990-05-17',
  gender: 'female',
  phone: '5512345678',
  email: 'ana@example.com',
  event_id: '0b9f6a52-6c0e-4c34-9d8e-2f5d8e6b7a11',
  distance_id: '7d1a6f0e-2c3b-4a55-8f1e-9a0b1c2d3e4f',
  emergency_contact_name: 'Luis',
  emergency_contact_phone: '5598765432',
  t_shirt_size: 'M',
  medical_conditions: 'Ninguna',
};

describe('registration.submit', () => {
  const originalFetch = globalThis.fetch;
  const submit = registration.submit as any;

  function mockFetchOnce(body: any, status = 200) {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
    ) as any;
  }
  const cookiesWith = (token?: string) => ({
    get: (name: string) => (name === 'access_token' && token ? { value: token } : undefined),
    set: vi.fn(),
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('rejects an unauthenticated request with UNAUTHORIZED and sends no request', async () => {
    globalThis.fetch = vi.fn() as any;
    await expect(submit.handler(valid, { cookies: cookiesWith(undefined) })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('sets a short-lived registration-data cookie after success', async () => {
    const created = { id: 'r9', status: 'pending', bib_number: '0042' };
    mockFetchOnce({ message: 'Registration created successfully', data: created });

    const cookies = cookiesWith('tok');
    await submit.handler(valid, { cookies });
    expect(cookies.set).toHaveBeenCalledWith(
      'registration-data',
      expect.stringContaining('0042'),
      expect.objectContaining({ httpOnly: true, maxAge: 900 }),
    );
  });

  it('POSTs to /registrations/with-participant with the Bearer token and the backend body shape', async () => {
    const created = { id: 'r1', status: 'pending', event_id: valid.event_id };
    mockFetchOnce({ message: 'Registration created successfully', data: created });

    const result = await submit.handler(valid, { cookies: cookiesWith('tok') });

    const [url, init] = (globalThis.fetch as any).mock.calls[0];
    expect(url).toBe('http://localhost:8085/api/v1/registrations/with-participant');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer tok');
    expect(JSON.parse(init.body)).toEqual({
      event_id: valid.event_id,
      participant: {
        first_name: 'Ana',
        last_name: 'Pérez',
        second_last_name: 'López',
        gender: 'female',
        birth_date: '1990-05-17T00:00:00Z',
        email: 'ana@example.com',
        phone: '5512345678',
        country: 'MX',
        address: 'No especificada',
        size: 'M',
        emergency_contact_name: 'Luis',
        emergency_contact_phone: '5598765432',
        medical_info: 'Ninguna',
      },
      registration: {
        distance_id: valid.distance_id,
        category: 'general',
        size: 'M',
      },
    });
    expect(result).toEqual(created);
  });

  it('omits optional participant fields that were not provided', async () => {
    mockFetchOnce({ data: { id: 'r1' } });
    const { t_shirt_size, medical_conditions, emergency_contact_name, emergency_contact_phone, ...minimal } = valid;
    await submit.handler(minimal, { cookies: cookiesWith('tok') });
    const body = JSON.parse((globalThis.fetch as any).mock.calls[0][1].body);
    expect(body.participant).not.toHaveProperty('size');
    expect(body.participant).not.toHaveProperty('medical_info');
    expect(body.registration).not.toHaveProperty('size');
  });

  it('maps a backend error to an ActionError', async () => {
    mockFetchOnce({ message: 'registration already exists' }, 409);
    await expect(submit.handler(valid, { cookies: cookiesWith('tok') })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'registration already exists',
    });
  });

  it('input schema rejects invalid payloads (bad event_id, missing distance)', () => {
    expect(() => submit.input.parse({ ...valid, event_id: 'nope' })).toThrow();
    expect(() => submit.input.parse({ ...valid, distance_id: '' })).toThrow();
    expect(() => submit.input.parse(valid)).not.toThrow();
  });
});

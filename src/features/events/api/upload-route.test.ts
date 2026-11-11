import { describe, it, expect, vi, afterEach } from 'vitest';
import { POST } from '@/pages/api/routes/upload';

describe('POST /api/routes/upload', () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const cookiesWith = (token?: string) => ({
    get: (name: string) => (name === 'access_token' && token ? { value: token } : undefined),
  });

  function uploadRequest() {
    const fd = new FormData();
    fd.append('event_id', 'e1');
    fd.append('name', 'Circuito');
    fd.append('file', new File(['<gpx/>'], 'ruta.gpx', { type: 'application/gpx+xml' }));
    return new Request('http://localhost:4321/api/routes/upload', { method: 'POST', body: fd });
  }

  it('returns 401 JSON and sends no upstream request when the cookie is missing', async () => {
    globalThis.fetch = vi.fn() as any;
    const res = await (POST as any)({ request: uploadRequest(), cookies: cookiesWith(undefined) });
    expect(res.status).toBe(401);
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(await res.json()).toEqual({ message: 'No autenticado' });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('forwards the multipart body to the backend with the cookie token and relays the response', async () => {
    const created = { message: 'Route uploaded successfully', data: { id: 'route1' } };
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(created), { status: 201, headers: { 'content-type': 'application/json' } })
    ) as any;

    const res = await (POST as any)({ request: uploadRequest(), cookies: cookiesWith('tok') });

    const [url, init] = (globalThis.fetch as any).mock.calls[0];
    expect(url).toBe('http://localhost:8085/api/v1/routes/upload');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer tok');
    expect(init.headers['Content-Type']).toBeUndefined(); // fetch sets the multipart boundary
    expect(init.body).toBeInstanceOf(FormData);
    expect(init.body.get('event_id')).toBe('e1');
    expect(init.body.get('name')).toBe('Circuito');
    expect((init.body.get('file') as File).name).toBe('ruta.gpx');
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual(created);
  });

  it('relays backend error status and message', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'invalid or missing event_id' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      })
    ) as any;
    const res = await (POST as any)({ request: uploadRequest(), cookies: cookiesWith('tok') });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: 'invalid or missing event_id' });
  });

  it('returns 502 JSON when the backend is unreachable', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED')) as any;
    const res = await (POST as any)({ request: uploadRequest(), cookies: cookiesWith('tok') });
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ message: 'Error de conexión' });
  });
});

// Mock astro:actions so `defineAction` is a passthrough — that exposes the raw
// handler at `<action>.handler` so we can drive it directly without needing an
// Astro ActionAPIContext (`this` symbol check).
vi.mock('astro:actions', () => ({
  defineAction: <T>(config: T) => config,
}));

import { describe, it, expect, vi, afterEach } from 'vitest';
import { auth } from './auth.action';

// The mocked `defineAction` returns its config, so the raw handler is reachable
// at `.handler`; the real type is a callable action without that property. A
// defined action resolves to `{ data: <handler output> } | { error }`, so the
// handler output is the `data` field of the success branch. This helper casts
// the mocked shape back instead of changing what the tests assert.
type HandlerOutput<A extends (...args: any[]) => any> = Extract<
  Awaited<ReturnType<A>>,
  { error: undefined }
>['data'];

type MockHandler<A extends (...args: any[]) => any> = (
  input: Parameters<A>[0],
  ctx: any
) => Promise<HandlerOutput<A>>;

const rawHandler = <A extends (...args: any[]) => any>(action: A): MockHandler<A> =>
  (action as unknown as { handler: MockHandler<A> }).handler;

describe('auth.action', () => {
  const originalFetch = globalThis.fetch;

  function mockFetchOnce(body: any, opts: { status?: number } = {}) {
    const status = opts.status ?? 200;
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify(body), {
        status,
        statusText: String(status),
        headers: { 'content-type': 'application/json' },
      })
    ) as any;
  }

  function makeCookies() {
    return { set: vi.fn(), delete: vi.fn() };
  }

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('login', () => {
    it('POSTs to /auth/login and returns user data on success', async () => {
      mockFetchOnce({
        access_token: 'access123',
        refresh_token: 'refresh123',
        expires_in: 3600,
        user: {
          id: 'u1',
          email: 'a@b.com',
          first_name: 'A',
          last_name: 'B',
          role: 'participant',
        },
      });

      const cookies = makeCookies();
      const result = await rawHandler(auth.login)(
        { email: 'a@b.com', password: 'secret123' },
        { cookies } as any
      );

      const fetchUrl = (globalThis.fetch as any).mock.calls[0][0];
      const fetchOpts = (globalThis.fetch as any).mock.calls[0][1];
      expect(fetchUrl).toContain('/api/v1/auth/login');
      expect(fetchOpts.method).toBe('POST');
      expect(JSON.parse(fetchOpts.body)).toEqual({
        email: 'a@b.com',
        password: 'secret123',
      });

      expect(result.error).toBe(false);
      expect(result.message).toMatch(/exitoso/i);
      expect(result.user?.email).toBe('a@b.com');
      expect(cookies.set).toHaveBeenCalledTimes(3);
    });

    it('returns {error:true, message} on 4xx (does not throw)', async () => {
      mockFetchOnce({ message: 'Invalid credentials' }, { status: 401 });

      const cookies = makeCookies();
      const result = await rawHandler(auth.login)(
        { email: 'a@b.com', password: 'wrong' },
        { cookies } as any
      );

      expect(result.error).toBe(true);
      expect(result.message).toBe('Invalid credentials');
      expect(cookies.set).not.toHaveBeenCalled();
    });

    it('returns {error:true, message} on 5xx', async () => {
      mockFetchOnce({ message: 'Server error' }, { status: 500 });

      const cookies = makeCookies();
      const result = await rawHandler(auth.login)(
        { email: 'a@b.com', password: 'pw' },
        { cookies } as any
      );

      expect(result.error).toBe(true);
      expect(result.message).toBeTruthy();
      expect(cookies.set).not.toHaveBeenCalled();
    });

    it('returns {error:true} on network failure (api client wraps into error)', async () => {
      globalThis.fetch = vi.fn().mockRejectedValueOnce(new Error('Network down')) as any;

      const cookies = makeCookies();
      const result = await rawHandler(auth.login)(
        { email: 'a@b.com', password: 'pw' },
        { cookies } as any
      );

      expect(result.error).toBe(true);
      expect(result.message).toMatch(/conexión|network/i);
      expect(cookies.set).not.toHaveBeenCalled();
    });

    it('returns invalid-response error when access_token is missing from a 2xx body', async () => {
      mockFetchOnce({ user: { id: 'u1' } });

      const cookies = makeCookies();
      const result = await rawHandler(auth.login)(
        { email: 'a@b.com', password: 'pw' },
        { cookies } as any
      );

      expect(result.error).toBe(true);
      expect(result.message).toMatch(/inválida/i);
      expect(cookies.set).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('deletes auth cookies and returns success (no fetch)', async () => {
      const cookies = makeCookies();
      const result = await rawHandler(auth.logout)({}, { cookies } as any);

      expect(result.error).toBe(false);
      expect(result.message).toMatch(/cerrada/i);
      expect(cookies.delete).toHaveBeenCalledWith('access_token', { path: '/' });
      expect(cookies.delete).toHaveBeenCalledWith('refresh_token', { path: '/' });
      expect(cookies.delete).toHaveBeenCalledWith('user', { path: '/' });
    });
  });
});

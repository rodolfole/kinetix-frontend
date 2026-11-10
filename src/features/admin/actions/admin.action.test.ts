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
import { admin } from './admin.action';

describe('admin.action', () => {
  const originalFetch = globalThis.fetch;

  function mockFetchOnce(body: any, status = 200) {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
      })
    ) as any;
  }

  const cookiesWith = (token?: string) => ({
    get: (name: string) => (name === 'access_token' && token ? { value: token } : undefined),
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('getConfig sends the access_token cookie as a Bearer header (F1)', async () => {
    mockFetchOnce({ data: { commission_pct: 12, updated_at: 't' } });
    const result = await (admin.getConfig as any).handler(undefined, { cookies: cookiesWith('tok') });
    const [url, init] = (globalThis.fetch as any).mock.calls[0];
    expect(url).toContain('/admin/config');
    expect(init.headers.Authorization).toBe('Bearer tok');
    expect(result).toEqual({ commission_pct: 12, updated_at: 't' });
  });

  it('updateConfig PUTs with the Bearer header (F1)', async () => {
    mockFetchOnce({ data: { commission_pct: 15 } });
    const result = await (admin.updateConfig as any).handler(
      { commission_pct: 15, updated_by: 'admin@x.com' },
      { cookies: cookiesWith('tok') }
    );
    const [, init] = (globalThis.fetch as any).mock.calls[0];
    expect(init.method).toBe('PUT');
    expect(init.headers.Authorization).toBe('Bearer tok');
    expect(JSON.parse(init.body)).toEqual({ commission_pct: 15, updated_by: 'admin@x.com' });
    expect(result).toEqual({ commission_pct: 15 });
  });

  it('listPayouts sends the Bearer header and the status filter (F1)', async () => {
    mockFetchOnce({ data: [], total: 0 });
    await (admin.listPayouts as any).handler({ status: 'pending' }, { cookies: cookiesWith('tok') });
    const [url, init] = (globalThis.fetch as any).mock.calls[0];
    expect(url).toContain('/admin/payouts?status=pending');
    expect(init.headers.Authorization).toBe('Bearer tok');
  });

  it('throws when the backend returns an error', async () => {
    mockFetchOnce({ message: 'forbidden' }, 403);
    await expect(
      (admin.getConfig as any).handler(undefined, { cookies: cookiesWith('tok') })
    ).rejects.toThrow('forbidden');
  });
});

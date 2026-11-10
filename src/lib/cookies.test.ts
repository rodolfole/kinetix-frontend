import { describe, it, expect } from 'vitest';

describe('cookie helpers', () => {
  function makeCookies() {
    const store = new Map<string, { value: string; opts: any }>();
    return {
      set: (name: string, value: string, opts: any) =>
        store.set(name, { value, opts }),
      get: (name: string) => {
        const v = store.get(name);
        return v ? { value: v.value } : undefined;
      },
      delete: (name: string, _opts?: any) => {
        store.delete(name);
        // Astro's cookies.delete also accepts an opts arg but ignores it for our purposes
      },
      _store: store,
    };
  }

  it('setAuthCookies stores access_token with httpOnly', async () => {
    const { setAuthCookies } = await import('./cookies');
    const cookies = makeCookies();
    setAuthCookies(cookies, {
      access_token: 'tok',
      refresh_token: 'rfr',
      user: { id: 'u1', role: 'organizer' },
      expires_in: 3600,
    });
    expect(cookies._store.get('access_token')?.value).toBe('tok');
    expect(cookies._store.get('access_token')?.opts.httpOnly).toBe(true);
    expect(cookies._store.get('access_token')?.opts.maxAge).toBe(3600);
  });

  it('setAuthCookies stores refresh_token with 7x maxAge', async () => {
    const { setAuthCookies } = await import('./cookies');
    const cookies = makeCookies();
    setAuthCookies(cookies, {
      access_token: 'a',
      refresh_token: 'b',
      user: { id: 'u' },
      expires_in: 60,
    });
    expect(cookies._store.get('refresh_token')?.opts.maxAge).toBe(60 * 7);
  });

  it('setAuthCookies stores user as JSON in non-httpOnly cookie', async () => {
    const { setAuthCookies } = await import('./cookies');
    const cookies = makeCookies();
    setAuthCookies(cookies, {
      access_token: 'a',
      refresh_token: 'b',
      user: { id: 'u', role: 'organizer' },
      expires_in: 100,
    });
    const v = cookies._store.get('user')?.value;
    expect(v).toBe(JSON.stringify({ id: 'u', role: 'organizer' }));
    expect(cookies._store.get('user')?.opts.httpOnly).toBe(false);
  });

  it('deleteAuthCookies removes all three cookies', async () => {
    const { setAuthCookies, deleteAuthCookies } = await import('./cookies');
    const cookies = makeCookies();
    setAuthCookies(cookies, {
      access_token: 'a',
      refresh_token: 'b',
      user: { id: 'u' },
      expires_in: 1,
    });
    deleteAuthCookies(cookies);
    expect(cookies.get('access_token')).toBeUndefined();
    expect(cookies.get('refresh_token')).toBeUndefined();
    expect(cookies.get('user')).toBeUndefined();
  });
});

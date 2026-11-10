vi.mock('astro:middleware', () => ({
  defineMiddleware: <T>(fn: T) => fn,
}));

import { describe, it, expect, vi } from 'vitest';
import { onRequest } from './middleware';

function run(path: string, cookieValues: Record<string, string> = {}) {
  const cookies = {
    get: (name: string) => (cookieValues[name] ? { value: cookieValues[name] } : undefined),
    delete: vi.fn(),
  };
  const redirect = vi.fn((to: string) => ({ redirectedTo: to }));
  const next = vi.fn(() => 'next');
  const result = (onRequest as any)({ url: new URL(path, 'http://localhost'), cookies, redirect }, next);
  return Promise.resolve(result).then((value) => ({ value, cookies, redirect, next }));
}

const session = (role: string) => ({
  access_token: 'tok',
  user: JSON.stringify({ role, id: 'u1' }),
});

describe('middleware onRequest', () => {
  it('passes public pages through without cookies', async () => {
    const { value, next, redirect } = await run('/events/my-race');
    expect(value).toBe('next');
    expect(next).toHaveBeenCalledOnce();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('passes /_actions/ calls through without cookies', async () => {
    const { value } = await run('/_actions/auth.login');
    expect(value).toBe('next');
  });

  it('redirects anonymous users on private paths to login with the encoded path and query (F6)', async () => {
    const { value, next } = await run('/dashboard/events?tab=a&x=1');
    expect(value).toEqual({ redirectedTo: '/auth/login?redirect=%2Fdashboard%2Fevents%3Ftab%3Da%26x%3D1' });
    expect(next).not.toHaveBeenCalled();
  });

  it('requires login for /events/[slug]/registration (F4)', async () => {
    const { value } = await run('/events/my-race/registration');
    expect(value).toEqual({ redirectedTo: '/auth/login?redirect=%2Fevents%2Fmy-race%2Fregistration' });
  });

  it('clears auth cookies and redirects to login when the user cookie is corrupt', async () => {
    const { value, cookies } = await run('/dashboard', { access_token: 'tok', user: '{not json' });
    expect(value).toEqual({ redirectedTo: '/auth/login' });
    expect(cookies.delete).toHaveBeenCalledWith('access_token', { path: '/' });
    expect(cookies.delete).toHaveBeenCalledWith('user', { path: '/' });
  });

  it('treats an unknown role as a corrupt cookie', async () => {
    const { value, cookies } = await run('/dashboard', { access_token: 'tok', user: JSON.stringify({ role: 'root' }) });
    expect(value).toEqual({ redirectedTo: '/auth/login' });
    expect(cookies.delete).toHaveBeenCalledTimes(2);
  });

  it('keeps role routing for /dashboard and /participant/dashboard', async () => {
    expect((await run('/dashboard', session('participant'))).value).toEqual({ redirectedTo: '/participant/dashboard' });
    expect((await run('/dashboard', session('organizer'))).value).toBe('next');
    expect((await run('/participant/dashboard', session('organizer'))).value).toEqual({ redirectedTo: '/dashboard' });
    expect((await run('/participant/dashboard', session('participant'))).value).toBe('next');
  });

  it('blocks non-admins from /admin and lets admins in (F3)', async () => {
    expect((await run('/admin/settings', session('organizer'))).value).toEqual({ redirectedTo: '/dashboard' });
    expect((await run('/admin/settings', session('participant'))).value).toEqual({ redirectedTo: '/participant/dashboard' });
    expect((await run('/admin/settings', session('admin'))).value).toBe('next');
  });

  it('guards private paths that contain "actions" (F5)', async () => {
    const { value } = await run('/dashboard/actions-report');
    expect(value).toEqual({ redirectedTo: '/auth/login?redirect=%2Fdashboard%2Factions-report' });
  });
});

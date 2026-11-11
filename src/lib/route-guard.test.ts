import { describe, it, expect } from 'vitest';
import { resolveAccess } from './route-guard';

const ALLOW = { type: 'allow' };
const redirect = (to: string) => ({ type: 'redirect', to });
const participant = { role: 'participant' };
const organizer = { role: 'organizer' };
const admin = { role: 'admin' };

describe('resolveAccess', () => {
  it('treats percent-encoded paths like their decoded form', () => {
    const organizer = { role: 'organizer' };
    expect(resolveAccess('/%61dmin', organizer)).toEqual({ type: 'redirect', to: '/dashboard' });
    expect(resolveAccess('/dashboard', organizer)).toEqual({ type: 'allow' });
    expect(resolveAccess('/events/x/%72egistration', null)).toEqual({
      type: 'redirect',
      to: '/auth/login?redirect=%2Fevents%2Fx%2Fregistration',
    });
  });

  describe('bypass (F5)', () => {
    it('allows /_astro assets and /_actions/ calls without a session', () => {
      expect(resolveAccess('/_astro/app.js', null)).toEqual(ALLOW);
      expect(resolveAccess('/_actions/auth.login', null)).toEqual(ALLOW);
    });

    it('does not bypass a private path that merely contains "actions"', () => {
      expect(resolveAccess('/dashboard/actions-report', null)).toEqual(
        redirect('/auth/login?redirect=%2Fdashboard%2Factions-report')
      );
      expect(resolveAccess('/dashboard/actions-report', participant)).toEqual(
        redirect('/participant/dashboard')
      );
    });

    it('keeps /events/actions-race public (it is a public event slug)', () => {
      expect(resolveAccess('/events/actions-race', null)).toEqual(ALLOW);
    });
  });

  describe('public routes', () => {
    it.each(['/', '/auth/login', '/auth/register', '/events', '/events/', '/events/my-race', '/results', '/community'])(
      'allows anonymous access to %s',
      (path) => {
        expect(resolveAccess(path, null)).toEqual(ALLOW);
      }
    );
  });

  describe('event registration requires login (F4)', () => {
    it('redirects anonymous users to login with the encoded redirect', () => {
      expect(resolveAccess('/events/my-race/registration', null)).toEqual(
        redirect('/auth/login?redirect=%2Fevents%2Fmy-race%2Fregistration')
      );
      expect(resolveAccess('/events/my-race/registration/exito', null)).toEqual(
        redirect('/auth/login?redirect=%2Fevents%2Fmy-race%2Fregistration%2Fexito')
      );
    });

    it('allows any logged-in role', () => {
      expect(resolveAccess('/events/my-race/registration', participant)).toEqual(ALLOW);
      expect(resolveAccess('/events/my-race/registration', organizer)).toEqual(ALLOW);
    });
  });

  describe('redirect param encoding (F6)', () => {
    it('encodes pathname + search with encodeURIComponent', () => {
      expect(resolveAccess('/dashboard/events', null, '?a=1&b=2')).toEqual(
        redirect('/auth/login?redirect=%2Fdashboard%2Fevents%3Fa%3D1%26b%3D2')
      );
    });

    it('cannot inject extra query params through the path', () => {
      const result = resolveAccess('/dashboard/x&admin=1', null) as { to: string };
      expect(result.to).toBe('/auth/login?redirect=%2Fdashboard%2Fx%26admin%3D1');
    });
  });

  describe('admin area (F3)', () => {
    it('allows admins', () => {
      expect(resolveAccess('/admin', admin)).toEqual(ALLOW);
      expect(resolveAccess('/admin/payments', admin)).toEqual(ALLOW);
    });

    it('redirects organizers to their dashboard', () => {
      expect(resolveAccess('/admin', organizer)).toEqual(redirect('/dashboard'));
      expect(resolveAccess('/admin/settings', organizer)).toEqual(redirect('/dashboard'));
    });

    it('redirects participants to theirs', () => {
      expect(resolveAccess('/admin/payments', participant)).toEqual(redirect('/participant/dashboard'));
    });

    it('redirects anonymous users to login', () => {
      expect(resolveAccess('/admin', null)).toEqual(redirect('/auth/login?redirect=%2Fadmin'));
    });
  });

  describe('existing role routing is unchanged', () => {
    it('sends participants away from /dashboard', () => {
      expect(resolveAccess('/dashboard', participant)).toEqual(redirect('/participant/dashboard'));
    });
    it('allows organizer and admin on /dashboard', () => {
      expect(resolveAccess('/dashboard', organizer)).toEqual(ALLOW);
      expect(resolveAccess('/dashboard/events', admin)).toEqual(ALLOW);
    });
    it('sends organizers away from /participant/dashboard', () => {
      expect(resolveAccess('/participant/dashboard', organizer)).toEqual(redirect('/dashboard'));
    });
    it('allows participant and admin on /participant/dashboard', () => {
      expect(resolveAccess('/participant/dashboard/history', participant)).toEqual(ALLOW);
      expect(resolveAccess('/participant/dashboard', admin)).toEqual(ALLOW);
    });
  });
});

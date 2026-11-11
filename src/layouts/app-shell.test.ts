// @vitest-environment happy-dom
// `.astro` components cannot be rendered by vitest in this repo (see the note in
// `features/events/components/EventCard.test.tsx`), so the shell's view model is
// tested here and the rendered markup is asserted against the real SSR output of
// the built server (recorded in PLAN-11 T7 evidence).
import { describe, it, expect } from 'vitest';
import {
  getShellBrand,
  getSidebarItems,
  isSectionAllowedForRole,
  sectionOf,
  resolveShellRole,
  type ShellRole,
} from './app-shell';

describe('resolveShellRole', () => {
  it('resolves the three session roles', () => {
    expect(resolveShellRole({ role: 'organizer' })).toBe('organizer');
    expect(resolveShellRole({ role: 'participant' })).toBe('participant');
    expect(resolveShellRole({ role: 'admin' })).toBe('admin');
  });

  it('returns null without a session or with an unknown role', () => {
    expect(resolveShellRole(null)).toBeNull();
    expect(resolveShellRole(undefined)).toBeNull();
    expect(resolveShellRole({})).toBeNull();
    expect(resolveShellRole({ role: 'superuser' })).toBeNull();
  });
});

describe('getSidebarItems', () => {
  it('renders the organizer menu with its links', () => {
    const items = getSidebarItems('organizer', '/dashboard');
    expect(items.map((item) => [item.label, item.href])).toEqual([
      ['Dashboard', '/dashboard'],
      ['My Events', '/dashboard/events'],
      ['Create Event', '/dashboard/events/new'],
      ['Participants', '/dashboard/participants'],
      ['Reports', '/dashboard/reports'],
      ['Settings', '/dashboard/settings'],
    ]);
  });

  it('renders the participant menu with its links', () => {
    const items = getSidebarItems('participant', '/participant/dashboard');
    expect(items.map((item) => [item.label, item.href])).toEqual([
      ['Mis Inscripciones', '/participant/dashboard/registrations'],
      ['Mi Perfil', '/participant/dashboard/profile'],
      ['Historial', '/participant/dashboard/history'],
      ['Configuración', '/participant/dashboard/settings'],
    ]);
  });

  it('keeps the organizer menu for admin sessions', () => {
    expect(getSidebarItems('admin', '/dashboard').map((item) => item.href)).toEqual(
      getSidebarItems('organizer', '/dashboard').map((item) => item.href),
    );
  });

  it('marks only the current section as active (organizer)', () => {
    const active = (pathname: string) =>
      getSidebarItems('organizer', pathname)
        .filter((item) => item.active)
        .map((item) => item.href);

    expect(active('/dashboard')).toEqual(['/dashboard']);
    expect(active('/dashboard/events')).toEqual(['/dashboard/events']);
    expect(active('/dashboard/events/new')).toEqual(['/dashboard/events/new']);
    expect(active('/dashboard/events/carrera-2026')).toEqual(['/dashboard/events']);
    expect(active('/dashboard/events/carrera-2026/routes')).toEqual(['/dashboard/events']);
    expect(active('/dashboard/participants')).toEqual(['/dashboard/participants']);
    expect(active('/dashboard/reports')).toEqual(['/dashboard/reports']);
    expect(active('/dashboard/settings')).toEqual(['/dashboard/settings']);
  });

  it('marks only the current section as active (participant)', () => {
    const active = (pathname: string) =>
      getSidebarItems('participant', pathname)
        .filter((item) => item.active)
        .map((item) => item.href);

    expect(active('/participant/dashboard/registrations')).toEqual([
      '/participant/dashboard/registrations',
    ]);
    expect(active('/participant/dashboard/profile')).toEqual(['/participant/dashboard/profile']);
    expect(active('/participant/dashboard/history')).toEqual(['/participant/dashboard/history']);
    expect(active('/participant/dashboard/settings')).toEqual([
      '/participant/dashboard/settings',
    ]);
    expect(active('/participant/dashboard')).toEqual([]);
  });
});

describe('getShellBrand', () => {
  it('uses the organizer brand for the organizer and admin shells', () => {
    expect(getShellBrand('organizer')).toEqual({
      title: 'Kinetix',
      subtitle: 'Organizer Hub',
      icon: 'bolt',
    });
    expect(getShellBrand('admin')).toEqual(getShellBrand('organizer'));
  });

  it('uses the participant brand', () => {
    expect(getShellBrand('participant')).toEqual({
      title: 'Kinetix',
      subtitle: 'Mis Carreras',
      icon: 'trophy',
    });
  });

  it('falls back to the organizer brand without a role', () => {
    expect(getShellBrand(null)).toEqual(getShellBrand('organizer'));
  });
});

describe('role guard', () => {
  it('detects the section of a pathname', () => {
    expect(sectionOf('/dashboard/events/new')).toBe('organizer');
    expect(sectionOf('/participant/dashboard/history')).toBe('participant');
    expect(sectionOf('/admin/payments')).toBe('admin');
    expect(sectionOf('/events/carrera-2026')).toBeNull();
  });

  it('allows each area only for its role (and admins)', () => {
    const cases: Array<[ShellRole, string, boolean]> = [
      ['organizer', '/dashboard', true],
      ['organizer', '/dashboard/events/new', true],
      ['organizer', '/participant/dashboard', false],
      ['participant', '/participant/dashboard/registrations', true],
      ['participant', '/dashboard', false],
      ['admin', '/admin/payments', true],
      ['admin', '/dashboard', true],
      ['admin', '/participant/dashboard', true],
    ];
    for (const [role, pathname, expected] of cases) {
      expect(`${role} ${pathname} -> ${isSectionAllowedForRole(role, pathname)}`).toBe(
        `${role} ${pathname} -> ${expected}`,
      );
    }
  });

  it('denies the private shells without a session role', () => {
    expect(isSectionAllowedForRole(null, '/dashboard')).toBe(false);
    expect(isSectionAllowedForRole(null, '/participant/dashboard')).toBe(false);
  });

  it('leaves public paths untouched', () => {
    expect(isSectionAllowedForRole('organizer', '/events/carrera-2026')).toBe(true);
  });
});

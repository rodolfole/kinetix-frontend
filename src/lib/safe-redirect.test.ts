import { describe, it, expect } from 'vitest';
import { safeRedirect, resolveLoginRedirect } from './safe-redirect';

describe('safeRedirect', () => {
  it.each(['/dashboard', '/events/my-race/registration', '/dashboard/events?tab=a&x=1', '/'])(
    'accepts same-origin relative path %s',
    (value) => {
      expect(safeRedirect(value)).toBe(value);
    }
  );

  it.each([
    ['protocol-relative', '//evil.com'],
    ['absolute https', 'https://evil.com'],
    ['absolute http', 'http://evil.com/x'],
    ['backslash host', '/\\evil.com'],
    ['javascript scheme', 'javascript:alert(1)'],
    ['bare host', 'evil.com'],
    ['leading space protocol-relative', ' //evil.com'],
    ['tab-obfuscated protocol-relative', '/\t/evil.com'],
    ['triple slash', '///evil.com'],
    ['encoded protocol-relative', '%2F%2Fevil.com'],
    ['newline-obfuscated protocol-relative', '/\n/evil.com'],
    ['mixed-case javascript scheme', 'JaVaScRiPt:alert(1)'],
    ['empty', ''],
  ])('rejects %s (%s) and returns the default "/"', (_label, value) => {
    expect(safeRedirect(value)).toBe('/');
  });

  it('returns the default for null/undefined', () => {
    expect(safeRedirect(null)).toBe('/');
    expect(safeRedirect(undefined)).toBe('/');
  });

  it('honours a custom fallback', () => {
    expect(safeRedirect('//evil.com', '/dashboard')).toBe('/dashboard');
  });
});

describe('resolveLoginRedirect', () => {
  it('maps a bare event slug to its registration page (legacy ?redirect=<slug>)', () => {
    expect(resolveLoginRedirect('carrera-kinetix-2026', '/dashboard')).toBe('/events/carrera-kinetix-2026/registration');
  });

  it('passes safe paths through', () => {
    expect(resolveLoginRedirect('/events/x/registration', '/dashboard')).toBe('/events/x/registration');
  });

  it('falls back for unsafe targets and for no target', () => {
    expect(resolveLoginRedirect('//evil.com', '/dashboard')).toBe('/dashboard');
    expect(resolveLoginRedirect('https://evil.com', '/dashboard')).toBe('/dashboard');
    expect(resolveLoginRedirect('/\\evil.com', '/dashboard')).toBe('/dashboard');
    expect(resolveLoginRedirect(null, '/participant/dashboard')).toBe('/participant/dashboard');
  });
});

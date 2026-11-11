export const PUBLIC_ROUTES = ['/', 'auth/login', 'auth/register', 'events', 'results', 'community'];

export interface SessionUser {
  role: string;
}

export type AccessDecision = { type: 'allow' } | { type: 'redirect'; to: string };

const allow = (): AccessDecision => ({ type: 'allow' });
const redirectTo = (to: string): AccessDecision => ({ type: 'redirect', to });

const trimSlashes = (path: string) => path.replace(/^\/|\/$/g, '') || '/';

/** `/events/[slug]/registration[/...]` is public by prefix but needs a session. */
const isEventRegistration = (pathname: string) => /^\/events\/[^/]+\/registration(\/|$)/.test(pathname);

function isPublic(pathname: string): boolean {
  if (isEventRegistration(pathname)) return false;
  const cleanPath = trimSlashes(pathname);
  return PUBLIC_ROUTES.some((route) => {
    const cleanRoute = trimSlashes(route);
    return cleanPath === cleanRoute || cleanPath.startsWith(cleanRoute + '/');
  });
}

/**
 * Pure routing decision for the middleware. `user` is the validated session
 * user, or null when there is no session.
 */
/** The middleware sees the raw URL; routing matches the decoded form. */
const decodePath = (pathname: string): string => {
  try {
    const decoded = decodeURIComponent(pathname);
    // A decoded path that escapes its origin (e.g. %2F%2Fevil.com) stays raw.
    return decoded.startsWith('/') ? decoded : pathname;
  } catch {
    return pathname;
  }
};

export function resolveAccess(pathname: string, user: SessionUser | null, search = ''): AccessDecision {
  const target = decodePath(pathname);

  if (target.startsWith('/_astro') || target.startsWith('/_actions/')) return allow();
  if (isPublic(target)) return allow();

  if (!user) {
    return redirectTo(`/auth/login?redirect=${encodeURIComponent(target + search)}`);
  }

  if (target === '/admin' || target.startsWith('/admin/')) {
    if (user.role !== 'admin') {
      return redirectTo(user.role === 'participant' ? '/participant/dashboard' : '/dashboard');
    }
  }

  if (target.startsWith('/participant/dashboard')) {
    if (user.role !== 'participant' && user.role !== 'admin') {
      return redirectTo('/dashboard');
    }
  }

  if (target.startsWith('/dashboard') && !target.startsWith('/participant/dashboard')) {
    if (user.role !== 'organizer' && user.role !== 'admin') {
      return redirectTo(user.role === 'participant' ? '/participant/dashboard' : '/auth/login');
    }
  }

  return allow();
}

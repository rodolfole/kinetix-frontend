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
export function resolveAccess(pathname: string, user: SessionUser | null, search = ''): AccessDecision {
  if (pathname.startsWith('/_astro') || pathname.startsWith('/_actions/')) return allow();
  if (isPublic(pathname)) return allow();

  if (!user) {
    return redirectTo(`/auth/login?redirect=${encodeURIComponent(pathname + search)}`);
  }

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (user.role !== 'admin') {
      return redirectTo(user.role === 'participant' ? '/participant/dashboard' : '/dashboard');
    }
  }

  if (pathname.startsWith('/participant/dashboard')) {
    if (user.role !== 'participant' && user.role !== 'admin') {
      return redirectTo('/dashboard');
    }
  }

  if (pathname.startsWith('/dashboard') && !pathname.startsWith('/participant/dashboard')) {
    if (user.role !== 'organizer' && user.role !== 'admin') {
      return redirectTo(user.role === 'participant' ? '/participant/dashboard' : '/auth/login');
    }
  }

  return allow();
}

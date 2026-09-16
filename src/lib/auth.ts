import type { UserClaims } from '@features/auth/types/response.types';

export type UserRole = 'admin' | 'organizer' | 'participant';

/**
 * Verifica si el usuario está autenticado
 */
export function isAuthenticated(Astro: any): boolean {
  const accessToken = Astro.cookies.get('access_token');
  return !!accessToken?.value;
}

/**
 * Obtiene el usuario actual desde la cookie
 */
export function getAuthUser(Astro: any): UserClaims | null {
  const userCookie = Astro.cookies.get('user');
  if (!userCookie?.value) return null;
  
  try {
    return JSON.parse(userCookie.value) as UserClaims;
  } catch {
    return null;
  }
}

/**
 * Obtiene el role del usuario
 */
export function getUserRole(Astro: any): UserRole | null {
  const user = getAuthUser(Astro);
  return user?.role || null;
}

/**
 * Verifica si el usuario tiene un rol específico
 */
export function hasRole(Astro: any, role: UserRole): boolean {
  const userRole = getUserRole(Astro);
  return userRole === role;
}

/**
 * Verifica si el usuario es admin
 */
export function isAdmin(Astro: any): boolean {
  return hasRole(Astro, 'admin');
}

/**
 * Verifica si el usuario es organizer
 */
export function isOrganizer(Astro: any): boolean {
  return hasRole(Astro, 'organizer');
}

/**
 * Verifica si el usuario es participant
 */
export function isParticipant(Astro: any): boolean {
  return hasRole(Astro, 'participant');
}

/**
 * Requiere autenticación - redirige si no está autenticado
 */
export function requireAuth(Astro: any): UserClaims | null {
  if (!isAuthenticated(Astro)) {
    const redirect = Astro.url.pathname;
    return Astro.redirect(`/auth/login?redirect=${redirect}`);
  }
  return getAuthUser(Astro);
}

/**
 * Requiere rol específico - redirige si no tiene el rol
 */
export function requireRole(Astro: any, role: UserRole): UserClaims | null {
  const user = requireAuth(Astro);
  if (!user) return null;
  
  if (user.role !== role && user.role !== 'admin') {
    // Admin puede acceder a todo
    return Astro.redirect('/dashboard');
  }
  return user;
}

/**
 * Obtiene la URL de redirección desde query params
 */
export function getRedirectUrl(Astro: any): string | null {
  const redirect = Astro.url.searchParams.get('redirect');
  return redirect || null;
}

/**
 * Limpia las cookies de auth (logout)
 */
export function clearAuthCookies(Astro: any): void {
  Astro.cookies.delete('access_token', { path: '/' });
  Astro.cookies.delete('refresh_token', { path: '/' });
  Astro.cookies.delete('user', { path: '/' });
}
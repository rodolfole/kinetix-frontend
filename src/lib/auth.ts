import type { UserClaims } from '@features/auth/types/response.types';

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

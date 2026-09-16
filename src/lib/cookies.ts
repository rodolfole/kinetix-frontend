/**
 * Cookie helper functions for authentication
 */

// Opciones base para cookies de auth
function getBaseCookieOptions(expiresIn: number) {
  return {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: expiresIn,
  };
}

/**
 * Set authentication cookies (access_token, refresh_token, user)
 */
export function setAuthCookies(
  cookies: any,
  { access_token, refresh_token, user, expires_in }: {
    access_token: string;
    refresh_token: string;
    user: any;
    expires_in: number;
  }
) {
  // Access token
  cookies.set('access_token', access_token, {
    ...getBaseCookieOptions(expires_in),
    httpOnly: true,
  });

  // Refresh token (dura más - 7x)
  cookies.set('refresh_token', refresh_token, {
    ...getBaseCookieOptions(expires_in * 7),
    httpOnly: true,
  });

  // User data (para leer en cliente)
  cookies.set('user', JSON.stringify(user), {
    ...getBaseCookieOptions(expires_in),
    httpOnly: false,
  });
}

/**
 * Delete authentication cookies
 */
export function deleteAuthCookies(cookies: any) {
  cookies.delete('access_token', { path: '/' });
  cookies.delete('refresh_token', { path: '/' });
  cookies.delete('user', { path: '/' });
}
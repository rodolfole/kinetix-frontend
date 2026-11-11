import { defineMiddleware } from 'astro:middleware';
import { resolveAccess, type SessionUser } from '@lib/route-guard';

// Valid roles
const VALID_ROLES = ['participant', 'organizer', 'admin'];

// Validate user cookie structure
function isValidUserCookie(obj: unknown): obj is SessionUser {
  if (!obj || typeof obj !== 'object') return false;
  const user = obj as SessionUser;
  return typeof user.role === 'string' && VALID_ROLES.includes(user.role);
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect } = context;
  const { pathname, search } = url;

  // 1. Bypass y rutas públicas: no requieren sesión ni parsear cookies
  if (resolveAccess(pathname, null, search).type === 'allow') return next();

  // 2. VALIDACIÓN DE SESIÓN: Si llegamos aquí, la ruta es PRIVADA
  const accessToken = cookies.get('access_token')?.value;
  const userRaw = cookies.get('user')?.value;

  let user: SessionUser | null = null;
  if (accessToken && userRaw) {
    try {
      const parsed = JSON.parse(userRaw);
      if (!isValidUserCookie(parsed)) {
        throw new Error('Invalid user cookie structure');
      }
      user = parsed;
    } catch (e) {
      // Cookie corrupta o estructura inválida — limpiar y redirigir
      cookies.delete('access_token', { path: '/' });
      cookies.delete('user', { path: '/' });
      return redirect('/auth/login');
    }
  }

  // 3. Decisión de acceso (login requerido, rol admin, redirecciones por rol)
  const decision = resolveAccess(pathname, user, search);
  if (decision.type === 'redirect') return redirect(decision.to);
  return next();
});

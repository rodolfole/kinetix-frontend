import { defineMiddleware } from 'astro:middleware';

const PUBLIC_ROUTES = ['/', 'auth/login', 'auth/register', 'events', 'results', 'community'];

// User cookie schema for validation
interface UserCookie {
  role: string;
  id?: string;
  email?: string;
}

// Valid roles
const VALID_ROLES = ['participant', 'organizer', 'admin'];

// Validate user cookie structure
function isValidUserCookie(obj: unknown): obj is UserCookie {
  if (!obj || typeof obj !== 'object') return false;
  const user = obj as UserCookie;
  return typeof user.role === 'string' && VALID_ROLES.includes(user.role);
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect } = context;
  const { pathname } = url;

  // 1. PRIORIDAD: Dejar pasar acciones de autenticación y recursos estáticos
  if (pathname.startsWith('/_astro') || pathname.includes('actions')) {
    return next();
  }

  // 2. RUTAS PÚBLICAS: Normalización robusta
  const cleanPath = pathname.replace(/^\/|\/$/g, '') || '/';
  const isPublic = PUBLIC_ROUTES.some(route => {
    const cleanRoute = route.replace(/^\/|\/$/g, '') || '/';
    return cleanPath === cleanRoute || cleanPath.startsWith(cleanRoute + '/');
  });

  if (isPublic) return next();

  // 3. VALIDACIÓN DE SESIÓN: Si llegamos aquí, la ruta es PRIVADA
  const accessToken = cookies.get('access_token')?.value;
  const userRaw = cookies.get('user')?.value;

  if (!accessToken || !userRaw) {
    return redirect(`/auth/login?redirect=${pathname}`);
  }

  // 4. PARSEO SEGURO Y VALIDACIÓN DE ROLES
  let user: UserCookie;
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

  // 5. REDIRECCIONES CRUZADAS POR ROLES
  if (pathname.startsWith('/participant/dashboard')) {
    if (user.role !== 'participant' && user.role !== 'admin') {
      return redirect('/dashboard');
    }
  }

  if (pathname.startsWith('/dashboard') && !pathname.startsWith('/participant/dashboard')) {
    if (user.role !== 'organizer' && user.role !== 'admin') {
      return redirect(user.role === 'participant' ? '/participant/dashboard' : '/auth/login');
    }
  }

  return next();
});
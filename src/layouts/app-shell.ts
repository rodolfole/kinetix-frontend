// The dashboard shell used by every private page (organizer dashboard,
// participant dashboard and the admin pages). Before this module there were two
// layouts and two sidebar components that differed only in their menu items and
// brand text; the view model now lives here so it can be unit tested.

export type ShellRole = 'organizer' | 'participant' | 'admin';

export interface ShellMenuItem {
  icon: string;
  label: string;
  href: string;
  active?: boolean;
  badge?: string;
}

interface MenuDefinition {
  icon: string;
  label: string;
  href: string;
  isActive: (pathname: string) => boolean;
}

/** Organizer navigation (also rendered for admin sessions, as before). */
const ORGANIZER_MENU: MenuDefinition[] = [
  {
    icon: 'layout-dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    isActive: (pathname) => pathname === '/dashboard',
  },
  {
    icon: 'calendar',
    label: 'My Events',
    href: '/dashboard/events',
    isActive: (pathname) =>
      pathname.startsWith('/dashboard/events') &&
      !pathname.includes('/new') &&
      !pathname.includes('/edit'),
  },
  {
    icon: 'plus-circle',
    label: 'Create Event',
    href: '/dashboard/events/new',
    isActive: (pathname) => pathname.includes('/dashboard/events/new'),
  },
  {
    icon: 'users',
    label: 'Participants',
    href: '/dashboard/participants',
    isActive: (pathname) => pathname.startsWith('/dashboard/participants'),
  },
  {
    icon: 'bar-chart',
    label: 'Reports',
    href: '/dashboard/reports',
    isActive: (pathname) => pathname.startsWith('/dashboard/reports'),
  },
  {
    icon: 'settings',
    label: 'Settings',
    href: '/dashboard/settings',
    isActive: (pathname) => pathname.startsWith('/dashboard/settings'),
  },
];

/** Participant navigation. */
const PARTICIPANT_MENU: MenuDefinition[] = [
  {
    icon: 'calendar-check',
    label: 'Mis Inscripciones',
    href: '/participant/dashboard/registrations',
    isActive: (pathname) => pathname.includes('/registrations'),
  },
  {
    icon: 'ruler',
    label: 'Mi Perfil',
    href: '/participant/dashboard/profile',
    isActive: (pathname) => pathname.includes('/profile'),
  },
  {
    icon: 'history',
    label: 'Historial',
    href: '/participant/dashboard/history',
    isActive: (pathname) => pathname.includes('/history'),
  },
  {
    icon: 'settings',
    label: 'Configuración',
    href: '/participant/dashboard/settings',
    isActive: (pathname) => pathname.includes('/settings'),
  },
];

export interface ShellBrand {
  title: string;
  subtitle: string;
  icon: 'bolt' | 'trophy';
}

/** Session role of the shell; `null` when the cookie carries no known role. */
export function resolveShellRole(user: Record<string, unknown> | null | undefined): ShellRole | null {
  const role = user?.role;
  if (role === 'admin' || role === 'organizer' || role === 'participant') return role;
  return null;
}

/**
 * Menu for a role. Admin sessions keep the organizer menu (that is what the
 * previous `DashboardLayout` rendered for `/admin/**`) and a missing role falls
 * back to it as well.
 */
export function menuForRole(role: ShellRole | null): MenuDefinition[] {
  return role === 'participant' ? PARTICIPANT_MENU : ORGANIZER_MENU;
}

export function getSidebarItems(role: ShellRole | null, pathname: string): ShellMenuItem[] {
  return menuForRole(role).map((item) => ({
    icon: item.icon,
    label: item.label,
    href: item.href,
    active: item.isActive(pathname),
  }));
}

export function getShellBrand(role: ShellRole | null): ShellBrand {
  return role === 'participant'
    ? { title: 'Kinetix', subtitle: 'Mis Carreras', icon: 'trophy' }
    : { title: 'Kinetix', subtitle: 'Organizer Hub', icon: 'bolt' };
}

/** Which section of the app a pathname belongs to (null when it is neither). */
export function sectionOf(pathname: string): 'participant' | 'organizer' | 'admin' | null {
  if (pathname.startsWith('/participant/dashboard')) return 'participant';
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/dashboard')) return 'organizer';
  return null;
}

/**
 * Role guard for the shell: the participant area belongs to participants (and
 * admins), the organizer area to organizers (and admins). Mirrors the redirect
 * rules enforced by the middleware, so a page that renders anyway never leaks
 * the other role's navigation.
 */
export function isSectionAllowedForRole(role: ShellRole | null, pathname: string): boolean {
  const section = sectionOf(pathname);
  if (section === null) return true;
  if (role === null) return false;
  if (role === 'admin') return true;
  if (section === 'admin') return false;
  return section === role;
}

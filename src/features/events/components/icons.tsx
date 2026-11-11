/**
 * Minimal inline SVG icon set for the React islands.
 *
 * The islands used `@tabler/icons-react` only for decorative icons; these
 * components keep the same props (`size`, `stroke`, `className`) so the call
 * sites do not change, and they remove a React-bound icon dependency (see
 * PLAN-11 T9). `.astro` components keep using `@lucide/astro`.
 */

import type { ReactNode } from 'react';

export interface IconProps {
  size?: number | string;
  stroke?: number | string;
  className?: string;
  'aria-hidden'?: boolean;
}

interface SvgProps {
  children: ReactNode;
}

function Icon({ size = 24, stroke = 2, className, 'aria-hidden': ariaHidden = true, children }: IconProps & SvgProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={ariaHidden}
    >
      {children}
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="10" cy="10" r="7" />
      <line x1="15" y1="15" x2="21" y2="21" />
    </Icon>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 21s-7-5.5-7-11a7 7 0 1114 0c0 5.5-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </Icon>
  );
}

export function XIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="6" y1="18" x2="18" y2="6" />
    </Icon>
  );
}

export function RouteIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="6" cy="19" r="2.5" />
      <circle cx="18" cy="5" r="2.5" />
      <path d="M8.5 19h5a4 4 0 000-8h-3a4 4 0 010-8h5" />
    </Icon>
  );
}

export function TicketIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 8a2 2 0 012-2h12a2 2 0 012 2v1.5a2.5 2.5 0 000 5V16a2 2 0 01-2 2H6a2 2 0 01-2-2v-1.5a2.5 2.5 0 000-5V8z" />
      <path d="M13 6v12" strokeDasharray="2 2" />
    </Icon>
  );
}

export function CoffeeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 8h12v6a5 5 0 01-5 5H9a5 5 0 01-5-5V8z" />
      <path d="M16 9h2a2.5 2.5 0 010 5h-2" />
      <line x1="5" y1="3" x2="5" y2="5" />
      <line x1="9" y1="3" x2="9" y2="5" />
      <line x1="13" y1="3" x2="13" y2="5" />
    </Icon>
  );
}

export function HeadphonesIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 14v-2a8 8 0 0116 0v2" />
      <rect x="3" y="14" width="4" height="6" rx="2" />
      <rect x="17" y="14" width="4" height="6" rx="2" />
    </Icon>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 16 14" />
    </Icon>
  );
}

export function UsersGroupIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0113 0" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M17 14a5 5 0 014.5 6" />
    </Icon>
  );
}

export function ShirtIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 3l-5 3v5h3v10h10V11h3V6l-5-3-3 4-3-4z" />
    </Icon>
  );
}

export function MedalIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="15" r="5" />
      <path d="M8 3l4 7M16 3l-4 7" />
    </Icon>
  );
}

export function TrophyIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 4h8v4a4 4 0 11-8 0V4z" />
      <path d="M6 5H4v1a3 3 0 003 3M18 5h2v1a3 3 0 01-3 3" />
      <path d="M10 14h4v3h2v3H8v-3h2v-3z" />
    </Icon>
  );
}

export function BackpackIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 9a3 3 0 013-3h6a3 3 0 013 3v9a2 2 0 01-2 2H8a2 2 0 01-2-2V9z" />
      <path d="M9 6V4a3 3 0 016 0v2" />
      <path d="M9 12h6v4H9z" />
    </Icon>
  );
}

export function MaskIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 9c0-2 4-3 8-3s8 1 8 3v6c0 2-4 3-8 3s-8-1-8-3V9z" />
      <line x1="4" y1="11" x2="20" y2="11" />
    </Icon>
  );
}

export function BottleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 2h6v3l1 2v13a2 2 0 01-2 2h-4a2 2 0 01-2-2V7l1-2V2z" />
      <line x1="10" y1="14" x2="14" y2="14" />
    </Icon>
  );
}

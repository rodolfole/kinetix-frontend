import { useState, useEffect, useRef, type ComponentType } from 'react';
import {
  IconTicket,
  IconCoffee,
  IconHeadphones,
  IconClock,
  IconUsersGroup,
  IconShirt,
  IconMedal,
  IconTrophy,
  IconBackpack,
  IconMask,
  IconBottle,
} from '@tabler/icons-react';

/**
 * Icon picker — visual catalog for itinerary and kit items.
 *
 * The catalog is intentionally a single source of truth so changing an icon
 * (or adding a new one) is a one-line edit. Each catalog entry exposes:
 * - a stable `value` string persisted to the DB (matches backend enum-like icon)
 * - a `label` shown on hover/focus
 * - a Tabler icon React component
 *
 * Rendering is funnel-shaped: a horizontal strip of icon tiles with a search
 * field. The tile renders the icon at large size for visual scanning and stays
 * accessible (button role + aria-selected + keyboard focusable).
 */

export interface IconOption {
  value: string;
  label: string;
  Icon: ComponentType<{ size?: number | string; stroke?: number | string; className?: string; 'aria-hidden'?: boolean }>;
}

export const ITINERARY_ICON_CATALOG: readonly IconOption[] = [
  { value: 'ticket', label: 'Ticket / Inscripción', Icon: IconTicket },
  { value: 'coffee', label: 'Café / Hidratación', Icon: IconCoffee },
  { value: 'headphones', label: 'Audífonos DJ / Música', Icon: IconHeadphones },
  { value: 'clock', label: 'Reloj / Horario', Icon: IconClock },
  { value: 'users-group', label: 'Comunidad / Grupo', Icon: IconUsersGroup },
];

export const KIT_ICON_CATALOG: readonly IconOption[] = [
  { value: 'shirt', label: 'Playera', Icon: IconShirt },
  { value: 'medal', label: 'Medalla', Icon: IconMedal },
  { value: 'trophy', label: 'Trofeo', Icon: IconTrophy },
  { value: 'backpack', label: 'Mochila / Bolsa', Icon: IconBackpack },
  { value: 'mask', label: 'Buff / Tubular', Icon: IconMask },
  { value: 'bottle', label: 'Termo', Icon: IconBottle },
];

interface IconPickerProps {
  catalog: readonly IconOption[];
  value: string;
  onChange: (next: string) => void;
  ariaLabel?: string;
}

/**
 * Compact, accessible icon picker. Renders one tile per option, highlights
 * the active one, keyboard-navigable. Designed to replace <select> icon
 * dropdowns without inflating the bundle (uses Tabler icons tree-shaken).
 */
export default function IconPicker({ catalog, value, onChange, ariaLabel }: IconPickerProps) {
  const [active, setActive] = useState<string>(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActive(value);
  }, [value]);

  function handleKey(e: React.KeyboardEvent<HTMLButtonElement>, next: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(next);
      setActive(next);
    }
  }

  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-label={ariaLabel ?? 'Selecciona un icono'}
      className="flex flex-wrap gap-2"
    >
      {catalog.map(({ value: v, label, Icon }) => {
        const isActive = active === v;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={label}
            title={label}
            tabIndex={0}
            onKeyDown={(e) => handleKey(e, v)}
            onClick={() => {
              onChange(v);
              setActive(v);
            }}
            className={[
              'inline-flex items-center justify-center',
              'h-11 w-11 rounded-xl border transition-all duration-150',
              isActive
                ? 'bg-blue-600 border-blue-600 text-white shadow-md scale-105'
                : 'bg-white border-zinc-200 text-zinc-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
            ].join(' ')}
          >
            <Icon size={22} stroke={1.75} />
          </button>
        );
      })}
    </div>
  );
}

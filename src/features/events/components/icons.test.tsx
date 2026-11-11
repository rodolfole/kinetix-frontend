// @vitest-environment happy-dom
// T9: one icon library. Islands used `@tabler/icons-react`; the icons they need
// are now inline SVGs in `icons.tsx` (no extra dependency, no React-bound icon
// package). These tests render every icon the islands use.
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  BackpackIcon,
  BottleIcon,
  ClockIcon,
  CoffeeIcon,
  HeadphonesIcon,
  MapPinIcon,
  MaskIcon,
  MedalIcon,
  RouteIcon,
  SearchIcon,
  ShirtIcon,
  TicketIcon,
  TrophyIcon,
  UsersGroupIcon,
  XIcon,
} from './icons';

const ALL_ICONS = {
  BackpackIcon,
  BottleIcon,
  ClockIcon,
  CoffeeIcon,
  HeadphonesIcon,
  MapPinIcon,
  MaskIcon,
  MedalIcon,
  RouteIcon,
  SearchIcon,
  ShirtIcon,
  TicketIcon,
  TrophyIcon,
  UsersGroupIcon,
  XIcon,
};

describe('inline icons', () => {
  for (const [name, Icon] of Object.entries(ALL_ICONS)) {
    it(`${name} renders a 24x24 stroke svg that inherits currentColor`, () => {
      const { container } = render(<Icon />);
      const svg = container.querySelector('svg');

      expect(svg).not.toBeNull();
      expect(svg!.getAttribute('viewBox')).toBe('0 0 24 24');
      expect(svg!.getAttribute('stroke')).toBe('currentColor');
      expect(svg!.getAttribute('fill')).toBe('none');
      expect(svg!.getAttribute('aria-hidden')).toBe('true');
      expect(svg!.querySelectorAll('path, circle, rect, line, polyline').length).toBeGreaterThan(0);
    });
  }

  it('honours the size and stroke props', () => {
    const { container } = render(<SearchIcon size={18} stroke={1.75} />);
    const svg = container.querySelector('svg')!;

    expect(svg.getAttribute('width')).toBe('18');
    expect(svg.getAttribute('height')).toBe('18');
    expect(svg.getAttribute('stroke-width')).toBe('1.75');
  });

  it('passes a className through to the svg element', () => {
    const { container } = render(<MapPinIcon className="text-blue-500" />);
    expect(container.querySelector('svg')!.getAttribute('class')).toContain('text-blue-500');
  });

  it('every catalog entry exposes a component', async () => {
    const { ITINERARY_ICON_CATALOG, KIT_ICON_CATALOG } = await import('./IconPicker');
    for (const option of [...ITINERARY_ICON_CATALOG, ...KIT_ICON_CATALOG]) {
      expect(typeof option.Icon).toBe('function');
      const { container } = render(<option.Icon />);
      expect(container.querySelector('svg')).not.toBeNull();
    }
  });
});

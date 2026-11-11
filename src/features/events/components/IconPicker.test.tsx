// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import IconPicker, { ITINERARY_ICON_CATALOG, KIT_ICON_CATALOG } from './IconPicker';

afterEach(() => {
  cleanup();
});

describe('IconPicker', () => {
  it('renders one tile per option in the catalog', () => {
    render(<IconPicker catalog={ITINERARY_ICON_CATALOG} value="ticket" onChange={() => {}} />);
    const buttons = screen.getAllByRole('radio');
    expect(buttons.length).toBe(ITINERARY_ICON_CATALOG.length);
  });

  it('marks the active option via aria-checked', () => {
    render(<IconPicker catalog={ITINERARY_ICON_CATALOG} value="ticket" onChange={() => {}} />);
    const ticketTile = screen.getByRole('radio', { name: /Ticket/ });
    expect(ticketTile.getAttribute('aria-checked')).toBe('true');

    const others = screen.getAllByRole('radio').filter((b) => b !== ticketTile);
    for (const o of others) {
      expect(o.getAttribute('aria-checked')).toBe('false');
    }
  });

  it('calls onChange when a tile is clicked', () => {
    const onChange = vi.fn();
    render(<IconPicker catalog={ITINERARY_ICON_CATALOG} value="ticket" onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio', { name: /Café/ }));
    expect(onChange).toHaveBeenCalledWith('coffee');
  });

  it('updates aria-checked when value prop changes', () => {
    const { rerender } = render(
      <IconPicker catalog={ITINERARY_ICON_CATALOG} value="ticket" onChange={() => {}} />
    );
    expect(screen.getByRole('radio', { name: /Ticket/ }).getAttribute('aria-checked')).toBe('true');

    rerender(<IconPicker catalog={ITINERARY_ICON_CATALOG} value="clock" onChange={() => {}} />);
    expect(screen.getByRole('radio', { name: /Reloj/ }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('radio', { name: /Ticket/ }).getAttribute('aria-checked')).toBe('false');
  });

  it('handles Enter keyboard activation', () => {
    const onChange = vi.fn();
    render(<IconPicker catalog={ITINERARY_ICON_CATALOG} value="ticket" onChange={onChange} />);

    const coffee = screen.getByRole('radio', { name: /Café/ });
    fireEvent.keyDown(coffee, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('coffee');
  });

  it('handles Space keyboard activation', () => {
    const onChange = vi.fn();
    render(<IconPicker catalog={ITINERARY_ICON_CATALOG} value="ticket" onChange={onChange} />);

    const coffee = screen.getByRole('radio', { name: /Café/ });
    fireEvent.keyDown(coffee, { key: ' ' });
    expect(onChange).toHaveBeenCalledWith('coffee');
  });

  it('uses custom aria-label when provided', () => {
    render(
      <IconPicker
        catalog={KIT_ICON_CATALOG}
        value="shirt"
        onChange={() => {}}
        ariaLabel="Icono del kit"
      />
    );
    expect(screen.getByRole('radiogroup').getAttribute('aria-label')).toBe('Icono del kit');
  });

  it('defaults aria-label to "Selecciona un icono" when not provided', () => {
    render(<IconPicker catalog={KIT_ICON_CATALOG} value="shirt" onChange={() => {}} />);
    expect(screen.getByRole('radiogroup').getAttribute('aria-label')).toBe('Selecciona un icono');
  });

  it('renders the kit catalog correctly', () => {
    render(<IconPicker catalog={KIT_ICON_CATALOG} value="medal" onChange={() => {}} />);
    expect(screen.getAllByRole('radio').length).toBe(KIT_ICON_CATALOG.length);
    expect(screen.getByRole('radio', { name: /Medalla/ }).getAttribute('aria-checked')).toBe('true');
  });
});

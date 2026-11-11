// @vitest-environment happy-dom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import ItineraryEditor from './ItineraryEditor';

afterEach(() => {
  cleanup();
});

function getHiddenJson(): string {
  return (document.querySelector('input[name="itinerary_json"]') as HTMLInputElement).value;
}

describe('ItineraryEditor', () => {
  it('shows empty-state when no initial items', () => {
    render(<ItineraryEditor />);
    expect(screen.getByText(/No hay puntos de itinerario/)).toBeInTheDocument();
    expect(getHiddenJson()).toBe('[]');
  });

  it('renders initial items and serializes to JSON', () => {
    const initial = [
      { key: 'Largada', time: '07:00', icon: 'ticket' },
      { key: 'Meta', time: '10:00', icon: 'medal' },
    ];
    render(<ItineraryEditor initialItems={initial} />);
    expect(screen.getByDisplayValue('Largada')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Meta')).toBeInTheDocument();
    const json = JSON.parse(getHiddenJson());
    expect(json.length).toBe(2);
    expect(json[0]).toEqual({ key: 'Largada', time: '07:00', icon: 'ticket' });
  });

  it('adds a new item when "Agregar punto" is clicked', () => {
    render(<ItineraryEditor />);
    const addBtn = screen.getByRole('button', { name: /Añadir/i });
    fireEvent.click(addBtn);
    // After add: empty-state disappears, time input renders
    expect(screen.queryByText(/No hay puntos de itinerario/)).not.toBeInTheDocument();
    expect(document.querySelector('input[type="time"]')).toBeInTheDocument();
    const json = JSON.parse(getHiddenJson());
    expect(json.length).toBe(1);
  });

  it('removes an item via the close button', () => {
    const initial = [
      { key: 'A', time: '08:00', icon: 'ticket' },
      { key: 'B', time: '09:00', icon: 'medal' },
    ];
    render(<ItineraryEditor initialItems={initial} />);
    expect(screen.getByDisplayValue('A')).toBeInTheDocument();

    const removeBtns = screen.getAllByRole('button', { name: /Eliminar/i });
    fireEvent.click(removeBtns[0]);

    expect(screen.queryByDisplayValue('A')).not.toBeInTheDocument();
    const json = JSON.parse(getHiddenJson());
    expect(json.length).toBe(1);
    expect(json[0].key).toBe('B');
  });

  it('updates the key field', () => {
    const initial = [{ key: 'old', time: '07:00', icon: 'ticket' }];
    render(<ItineraryEditor initialItems={initial} />);
    const input = screen.getByDisplayValue('old');
    fireEvent.change(input, { target: { value: 'new-key' } });

    const json = JSON.parse(getHiddenJson());
    expect(json[0].key).toBe('new-key');
  });

  it('updates the time field', () => {
    const initial = [{ key: 'k', time: '07:00', icon: 'ticket' }];
    render(<ItineraryEditor initialItems={initial} />);
    const input = screen.getByDisplayValue('07:00');
    fireEvent.change(input, { target: { value: '08:30' } });

    const json = JSON.parse(getHiddenJson());
    expect(json[0].time).toBe('08:30');
  });

  it('updates the icon when an IconPicker tile is clicked', () => {
    const initial = [{ key: 'k', time: '07:00', icon: 'ticket' }];
    render(<ItineraryEditor initialItems={initial} />);
    // Click the "Café" tile in the catalog
    const cafe = screen.getByRole('radio', { name: /Café/ });
    fireEvent.click(cafe);
    const json = JSON.parse(getHiddenJson());
    expect(json[0].icon).toBe('coffee');
  });

  it('preserves initial icons via aria-checked in SortableContext', () => {
    const initial = [
      { key: 'A', time: '07:00', icon: 'ticket' },
      { key: 'B', time: '08:00', icon: 'clock' },
    ];
    render(<ItineraryEditor initialItems={initial} />);
    // Two distinct selected tiles should exist
    const ticked = screen.getAllByRole('radio');
    const tickedOnes = ticked.filter((b) => b.getAttribute('aria-checked') === 'true');
    expect(tickedOnes.length).toBe(2);
  });
});

// @vitest-environment happy-dom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import AddressPicker from './AddressPicker';

afterEach(() => {
  cleanup();
});

describe('AddressPicker', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
  });

  it('renders an input with default placeholder', () => {
    render(<AddressPicker name="address" />);
    const input = screen.getByLabelText(/Buscar dirección/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', expect.stringMatching(/direcci/i));
  });

  it('uses a custom placeholder when provided', () => {
    render(<AddressPicker name="address" placeholder="Custom placeholder" />);
    const input = screen.getByLabelText(/Buscar dirección/i);
    expect(input).toHaveAttribute('placeholder', 'Custom placeholder');
  });

  it('starts with provided initial value', () => {
    render(<AddressPicker name="address" initialValue="CDMX Centro" />);
    const input = screen.getByLabelText(/Buscar dirección/i) as HTMLInputElement;
    expect(input.value).toBe('CDMX Centro');
  });

  it('does not search until query has 3+ chars (debounce handled too)', async () => {
    globalThis.fetch = vi.fn();
    render(<AddressPicker name="address" />);
    const input = screen.getByLabelText(/Buscar dirección/i);

    await act(async () => {
      fireEvent.change(input, { target: { value: 'ab' } });
    });

    // 2 chars: should NOT call Nominatim
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('fetches Nominatim when query has 3+ chars', async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify([
        { display_name: 'Av Reforma 1, CDMX', lat: '19.43', lon: '-99.13', address: { city: 'CDMX' } },
      ]), { status: 200, headers: { 'content-type': 'application/json' } })
    ) as any;

    render(<AddressPicker name="address" />);
    const input = screen.getByLabelText(/Buscar dirección/i);

    await act(async () => {
      fireEvent.change(input, { target: { value: 'Reforma' } });
    });

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    const calledUrl = (globalThis.fetch as any).mock.calls[0][0];
    expect(calledUrl).toContain('nominatim.openstreetmap.org');
    expect(calledUrl).toContain('countrycodes=mx');
    expect(calledUrl).toContain(encodeURIComponent('Reforma'));
  });

  it('selects a hit and populates hidden lat/lng inputs', async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify([
        { display_name: 'Av Reforma 1, CDMX', lat: '19.4326', lon: '-99.1332', address: { city: 'CDMX' } },
      ]), { status: 200, headers: { 'content-type': 'application/json' } })
    ) as any;

    render(<AddressPicker name="address" latName="lat" lngName="lng" />);
    const input = screen.getByLabelText(/Buscar dirección/i);

    await act(async () => {
      fireEvent.change(input, { target: { value: 'Reforma' } });
    });

    await waitFor(() => {
      expect(screen.getByText(/Av Reforma 1/)).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText(/Av Reforma 1/));
    });

    await waitFor(() => {
      const lat = document.querySelector('input[name="lat"]') as HTMLInputElement;
      const lng = document.querySelector('input[name="lng"]') as HTMLInputElement;
      expect(lat.value).toBe('19.4326');
      expect(lng.value).toBe('-99.1332');
    });

    // After picking, status indicator should appear
    expect(screen.getByText(/Ubicación fijada/)).toBeInTheDocument();
  });

  it('dispatches kinetix:address-selected with state/municipality on pick', async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify([
        {
          display_name: 'Polanco, CDMX',
          lat: '19.43',
          lon: '-99.20',
          address: { state: 'CDMX', municipality: 'Miguel Hidalgo' },
        },
      ]), { status: 200, headers: { 'content-type': 'application/json' } })
    ) as any;

    const listener = vi.fn();
    window.addEventListener('kinetix:address-selected', listener);

    render(<AddressPicker name="address" />);
    fireEvent.change(screen.getByLabelText(/Buscar dirección/i), {
      target: { value: 'Polanco' },
    });

    await waitFor(() => {
      expect(screen.getByText(/Polanco/)).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText(/Polanco/));
    });

    expect(listener).toHaveBeenCalledTimes(1);
    const detail = listener.mock.calls[0][0].detail;
    expect(detail.state).toBe('CDMX');
    expect(detail.municipality).toBe('Miguel Hidalgo');

    window.removeEventListener('kinetix:address-selected', listener);
  });

  it('clear button resets query and hidden inputs', async () => {
    render(<AddressPicker name="address" initialValue="CDMX" initialLat={19.43} initialLng={-99.13} />);

    const clearBtn = screen.getByRole('button', { name: /Limpiar/i });
    await act(async () => {
      fireEvent.click(clearBtn);
    });

    const hiddenText = document.querySelector('input[name="address"]') as HTMLInputElement;
    const hiddenLat = document.querySelector('input[name="address_lat"]') as HTMLInputElement;
    const hiddenLng = document.querySelector('input[name="address_lng"]') as HTMLInputElement;
    expect(hiddenText.value).toBe('');
    expect(hiddenLat.value).toBe('');
    expect(hiddenLng.value).toBe('');
    expect(screen.queryByText(/Ubicación fijada/)).not.toBeInTheDocument();
  });

  it('handles fetch failure gracefully (no crash, no hits)', async () => {
    globalThis.fetch = vi.fn().mockRejectedValueOnce(new Error('network down')) as any;

    render(<AddressPicker name="address" />);
    fireEvent.change(screen.getByLabelText(/Buscar dirección/i), {
      target: { value: 'Anything' },
    });

    await waitFor(() => {
      // Should not throw, should not show hits
      expect(screen.queryAllByRole('button')).not.toContain(
        expect.objectContaining({ textContent: expect.stringMatching(/México|Ciudad/) })
      );
    });
  });
});

// @vitest-environment happy-dom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import RouteMap from './RouteMap';

afterEach(() => {
  cleanup();
});

describe('RouteMap', () => {
  it('shows fallback message when no route is provided', () => {
    render(<RouteMap />);
    expect(screen.getByText(/Mapa de ruta no disponible/)).toBeInTheDocument();
  });

  it('shows fallback when route exists but has no geojson coordinates', () => {
    render(<RouteMap route={{} as any} />);
    expect(screen.getByText(/Mapa de ruta no disponible/)).toBeInTheDocument();
  });

  it('shows fallback when geojson has empty coordinates', () => {
    render(<RouteMap route={{ geojson: { type: 'LineString', coordinates: [] } } as any} />);
    expect(screen.getByText(/Mapa de ruta no disponible/)).toBeInTheDocument();
  });

  it('renders a container when geojson has coordinates', () => {
    render(
      <RouteMap
        route={
          {
            geojson: {
              type: 'LineString',
              coordinates: [
                [-99.1, 19.4],
                [-99.2, 19.5],
              ],
            },
          } as any
        }
      />
    );
    // The container div for Leaflet
    const container = document.querySelector('.z-0');
    expect(container).not.toBeNull();
    expect(container?.className).toContain('min-h-'); // tailwind arbitrary value class
    // Includes Leaflet CSS CDN link
    const link = document.querySelector('link[href*="leaflet.min.css"]');
    expect(link).not.toBeNull();
  });

  it('applies custom className to the container', () => {
    render(
      <RouteMap
        className="h-72 rounded-md"
        route={
          {
            geojson: {
              type: 'LineString',
              coordinates: [[-99.1, 19.4]],
            },
          } as any
        }
      />
    );
    // className should land on the outer wrapper
    const wrapper = document.querySelector('.h-72.rounded-md');
    expect(wrapper).not.toBeNull();
  });
});

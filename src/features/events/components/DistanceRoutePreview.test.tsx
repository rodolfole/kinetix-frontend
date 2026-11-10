// @vitest-environment happy-dom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import DistanceRoutePreview from './DistanceRoutePreview';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function makeGpx(name = 'route', points = 5, withElev = true): string {
  const trkpts = Array.from({ length: points }, (_, i) => {
    const ele = withElev ? `<ele>${100 + i * 10}</ele>` : '';
    return `<trkpt lat="${19.4 + i * 0.001}" lon="${-99.1 + i * 0.001}">${ele}</trkpt>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1">
  <trk><name>${name}</name><trkseg>${trkpts}</trkseg></trk>
</gpx>`;
}

function makeFile(content: string, name: string, sizeBytes?: number): File {
  const blob = new Blob([content], { type: 'application/gpx+xml' });
  const file = new File([blob], name, { type: 'application/gpx+xml' });
  if (sizeBytes !== undefined) {
    // Override size on the underlying blob
    Object.defineProperty(file, 'size', { value: sizeBytes });
  }
  return file;
}

describe('DistanceRoutePreview', () => {
  it('renders initial dropzone', () => {
    render(<DistanceRoutePreview />);
    expect(screen.getByText(/Arrastra el GPX/)).toBeInTheDocument();
  });

  it('accepts initial name and shows empty dropzone (no parsed data yet)', () => {
    render(<DistanceRoutePreview initialName="preset.gpx" />);
    // Even with initialName, no parsed data → dropzone shows
    expect(screen.getByText(/Arrastra el GPX/)).toBeInTheDocument();
  });

  it('rejects non-gpx files', async () => {
    render(<DistanceRoutePreview />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [makeFile('hello', 'notes.txt')] } });
    });
    expect(screen.getByText(/Solo se permiten archivos \.gpx/)).toBeInTheDocument();
  });

  it('rejects oversized files', async () => {
    render(<DistanceRoutePreview />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [makeFile('x', 'big.gpx', 6 * 1024 * 1024)] } });
    });
    expect(screen.getByText(/supera el máximo/)).toBeInTheDocument();
  });

  it('parses valid GPX and fires onLoaded with route', async () => {
    const onLoaded = vi.fn();
    render(<DistanceRoutePreview onLoaded={onLoaded} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const gpx = makeGpx('mi-ruta', 4);

    await act(async () => {
      fireEvent.change(input, { target: { files: [makeFile(gpx, 'mi-ruta.gpx')] } });
    });

    // Dropzone replaced by loaded banner with filename
    expect(screen.getByText('mi-ruta.gpx')).toBeInTheDocument();
    expect(onLoaded).toHaveBeenCalledTimes(1);

    const { name, gpxFilename, route } = onLoaded.mock.calls[0][0];
    expect(name).toBe('mi-ruta');
    expect(gpxFilename).toBe('mi-ruta.gpx');
    expect(route.geojson.type).toBe('LineString');
    expect(route.geojson.coordinates.length).toBe(4);
    // Coordinates must be in [lng, lat] order per GeoJSON
    const [firstLng, firstLat] = route.geojson.coordinates[0];
    expect(typeof firstLng).toBe('number');
    expect(typeof firstLat).toBe('number');
    // Elevation profile should have one entry per trkpt
    expect(route.elevation_profile.length).toBe(4);
    // Total distance should be a positive number
    expect(route.total_distance_km).toBeGreaterThan(0);
    // Elevation gain with ascending points
    expect(route.total_elevation_gain).toBe(30);
  });

  it('reports error for GPX with no track points', async () => {
    render(<DistanceRoutePreview />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const empty = `<?xml version="1.0"?><gpx><trk><name>x</name><trkseg></trkseg></trk></gpx>`;

    await act(async () => {
      fireEvent.change(input, { target: { files: [makeFile(empty, 'empty.gpx')] } });
    });
    expect(screen.getByText(/No track points found/)).toBeInTheDocument();
  });

  it('clearAll resets state and fires onCleared', async () => {
    const onCleared = vi.fn();
    render(<DistanceRoutePreview onCleared={onCleared} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [makeFile(makeGpx(), 'r.gpx')] } });
    });
    // Loaded banner appears
    expect(screen.getByText('r.gpx')).toBeInTheDocument();

    const removeBtn = screen.getByRole('button', { name: /Quitar GPX/i });
    fireEvent.click(removeBtn);

    // Banner gone, dropzone back, callback fired
    expect(onCleared).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Arrastra el GPX/)).toBeInTheDocument();
  });

  it('handles drop event with a valid GPX', async () => {
    const onLoaded = vi.fn();
    render(<DistanceRoutePreview onLoaded={onLoaded} />);
    // Find the dropzone button via the parent div with data-react-island
    const dropzone = document.querySelector('[data-react-island="distance-route-preview"] button')!;

    await act(async () => {
      fireEvent.drop(dropzone, {
        dataTransfer: { files: [makeFile(makeGpx('dropped'), 'dropped.gpx')] },
      });
    });

    expect(screen.getByText('dropped.gpx')).toBeInTheDocument();
    expect(onLoaded).toHaveBeenCalled();
  });

  it('uses default name "Unnamed Route" if GPX has no <name>', async () => {
    const onLoaded = vi.fn();
    render(<DistanceRoutePreview onLoaded={onLoaded} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const noName = `<?xml version="1.0"?>
<gpx><trk><trkseg>
  <trkpt lat="19.4" lon="-99.1"><ele>100</ele></trkpt>
  <trkpt lat="19.5" lon="-99.2"><ele>110</ele></trkpt>
</trkseg></trk></gpx>`;

    await act(async () => {
      fireEvent.change(input, { target: { files: [makeFile(noName, 'a.gpx')] } });
    });
    expect(onLoaded.mock.calls[0][0].name).toBe('Unnamed Route');
  });
});

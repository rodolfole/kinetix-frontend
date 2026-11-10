// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

vi.mock('./RouteMap', () => ({ default: () => null }));
vi.mock('./ElevationProfile', () => ({ default: () => null }));
vi.mock('@lib/gpx-parser', () => ({
  parseGPX: () => ({
    name: 'Circuito 10K',
    coords: [[19.4, -99.1]],
    elevationProfile: [],
    totalDistanceKm: 10,
    totalElevationGain: 50,
    minElevation: 2200,
    maxElevation: 2250,
  }),
}));

import RouteUploadForm from './RouteUploadForm';

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  delete (document as any).cookie; // drop the instance override, back to the prototype accessor
  vi.restoreAllMocks();
});

async function selectGpx(container: HTMLElement) {
  fireEvent.click(screen.getByText('Subir Ruta GPX'));
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(['<gpx/>'], 'ruta.gpx', { type: 'application/gpx+xml' });
  fireEvent.change(input, { target: { files: [file] } });
  return await screen.findByRole('button', { name: 'Subir Ruta' });
}

describe('RouteUploadForm submit (F8)', () => {
  it('posts to the same-origin /api/routes/upload without reading document.cookie', async () => {
    const cookieRead = vi.fn(() => 'access_token=secret');
    Object.defineProperty(document, 'cookie', { configurable: true, get: cookieRead, set: () => {} });
    const uploaded = { id: 'route1' };
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: uploaded }), { status: 201, headers: { 'content-type': 'application/json' } })
    ) as any;
    const onUploaded = vi.fn();

    const { container } = render(<RouteUploadForm eventId="e1" distances="[]" onUploaded={onUploaded} />);
    const submit = await selectGpx(container);
    fireEvent.click(submit);

    await waitFor(() => expect(onUploaded).toHaveBeenCalledWith(uploaded));
    const [url, init] = (globalThis.fetch as any).mock.calls[0];
    expect(url).toBe('/api/routes/upload');
    expect(init.method).toBe('POST');
    expect(init.headers?.Authorization).toBeUndefined();
    expect(init.body.get('event_id')).toBe('e1');
    expect(init.body.get('name')).toBe('Circuito 10K');
    expect(cookieRead).not.toHaveBeenCalled();
  });

  it('shows the server error message and does not call onUploaded', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'No autenticado' }), { status: 401, headers: { 'content-type': 'application/json' } })
    ) as any;
    const onUploaded = vi.fn();
    const { container } = render(<RouteUploadForm eventId="e1" distances="[]" onUploaded={onUploaded} />);
    fireEvent.click(await selectGpx(container));
    expect(await screen.findByText('No autenticado')).toBeTruthy();
    expect(onUploaded).not.toHaveBeenCalled();
  });

  it('rejects non-.gpx files without sending a request', async () => {
    globalThis.fetch = vi.fn() as any;
    const { container } = render(<RouteUploadForm eventId="e1" distances="[]" />);
    fireEvent.click(screen.getByText('Subir Ruta GPX'));
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['x'], 'ruta.txt')] } });
    expect(await screen.findByText('Solo archivos .gpx son soportados')).toBeTruthy();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});

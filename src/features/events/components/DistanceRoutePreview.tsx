import { useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react';
import { IconRoute, IconX } from '@tabler/icons-react';
import { parseGPX, type ParsedGPX } from '@lib/gpx-parser';
import type { RouteData } from '../types/route.type';

// Lazy-loaded Leaflet / Recharts — same code path as /dashboard/events/[slug]/routes
const RouteMap = lazy(() => import('./routes/RouteMap'));
const ElevationProfile = lazy(() => import('./routes/ElevationProfile'));

interface DistanceRoutePreviewProps {
  initialName?: string;
  onLoaded?: (payload: { name: string; gpxFilename: string; route: RouteData }) => void;
  onCleared?: () => void;
}

/** Haversine entre dos [lat, lng] en km. */
// haversineKm now lives in @lib/gpx-parser; this component imports parseGPX from there.

export default function DistanceRoutePreview({
  initialName = '',
  onLoaded,
  onCleared,
}: DistanceRoutePreviewProps) {
  const [fileName, setFileName] = useState(initialName);
  const [parsed, setParsed] = useState<ParsedGPX | null>(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Si initialName llega vacío y parsed ya estaba, limpiamos
  useEffect(() => {
    if (!initialName && parsed) {
      setParsed(null);
      setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialName]);

  const route: RouteData | null = useMemo(() => {
    if (!parsed) return null;
    return {
      id: `local-${parsed.name}`,
      event_id: '',
      distance_id: '',
      name: parsed.name,
      total_distance_km: parsed.totalDistanceKm,
      elevation_profile: parsed.elevationProfile,
      total_elevation_gain: parsed.totalElevationGain,
      max_elevation: parsed.maxElevation,
      min_elevation: parsed.minElevation,
      geojson: {
        type: 'LineString',
        coordinates: parsed.coords.map(([lat, lng]) => [lng, lat]),
      },
    } as unknown as RouteData;
  }, [parsed]);

  async function loadFile(f: File) {
    setError('');
    if (!/\.gpx$/i.test(f.name)) {
      setError('Solo se permiten archivos .gpx');
      return;
    }
    if (f.size / (1024 * 1024) > 5) {
      setError('El archivo supera el máximo de 5 MB');
      return;
    }
    try {
      const text = await f.text();
      const next = parseGPX(text);
      setParsed(next);
      setFileName(f.name);
      onLoaded?.({ name: next.name, gpxFilename: f.name, route: {
        id: `local-${next.name}`,
        event_id: '',
        distance_id: '',
        name: next.name,
        total_distance_km: next.totalDistanceKm,
        elevation_profile: next.elevationProfile,
        total_elevation_gain: next.totalElevationGain,
        max_elevation: next.maxElevation,
        min_elevation: next.minElevation,
        geojson: { type: 'LineString', coordinates: next.coords.map(([lat, lng]) => [lng, lat]) },
      } as unknown as RouteData });
    } catch (e: any) {
      setError(e?.message || 'No se pudo parsear el GPX');
    }
  }

  function clearAll() {
    setParsed(null);
    setFileName('');
    setError('');
    if (inputRef.current) inputRef.current.value = '';
    onCleared?.();
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) loadFile(f);
  }

  return (
    <div className="space-y-3" data-react-island="distance-route-preview">
      {/* Dropzone — más compacta y consistente con el resto del form */}
      {!parsed && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`w-full cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition-all ${
            dragOver
              ? 'border-blue-500 bg-blue-50'
              : 'border-zinc-300 bg-zinc-50/40 hover:border-blue-400 hover:bg-blue-50/30'
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <IconRoute size={20} stroke={1.75} />
            </div>
            <div className="text-sm font-medium text-zinc-700">
              Arrastra el GPX aquí o haz click para elegir
            </div>
            <div className="text-xs text-zinc-500">.gpx · máx. 5 MB</div>
            {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".gpx,application/gpx+xml"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) loadFile(f);
            }}
          />
        </button>
      )}

      {/* Loaded state — map + elevation */}
      {parsed && route && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-700 font-medium">
              <IconRoute size={16} stroke={2} />
              <span className="truncate">{fileName}</span>
            </div>
            <button
              type="button"
              onClick={clearAll}
              className="text-zinc-500 hover:text-red-600"
              aria-label="Quitar GPX"
            >
              <IconX size={16} />
            </button>
          </div>

          <Suspense fallback={<div className="h-40 rounded-xl bg-zinc-100 animate-pulse" />}>
            <div className="rounded-xl overflow-hidden">
              <RouteMap route={route} />
            </div>
          </Suspense>

          <Suspense fallback={<div className="h-40 rounded-xl bg-zinc-100 animate-pulse" />}>
            <ElevationProfile route={route} />
          </Suspense>
        </div>
      )}
    </div>
  );
}

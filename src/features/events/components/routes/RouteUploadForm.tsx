import { useState, useRef, useCallback, lazy, Suspense } from 'react';
import { parseGPX, type ParsedGPX } from '@lib/gpx-parser';
import type { RouteData } from '../../types/route.type';

// Lazy-loaded map preview (SSR-safe)
const RouteMap = lazy(() => import('./RouteMap'));

// Lazy-loaded elevation profile chart (SSR-safe)
const ElevationProfile = lazy(() => import('./ElevationProfile'));

// ── Types ──────────────────────────────────────────────────────────────────

interface DistanceOption {
  id: string;
  km: number;
  name?: string;
}

interface RouteUploadFormProps {
  eventId: string;
  distances: string; // JSON serialized DistanceOption[]
  onUploaded?: (route: RouteData) => void;
}

// ── Component ───────────────────────────────────────────────────────────────

export default function RouteUploadForm({ eventId, distances: distancesJson, onUploaded }: RouteUploadFormProps) {
  const distances: DistanceOption[] = JSON.parse(distancesJson || '[]');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedGPX | null>(null);
  const [name, setName] = useState('');
  const [distanceId, setDistanceId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // ── File handling ──────────────────────────────────────────────────────

  const handleFile = useCallback(async (f: File) => {
    if (!f.name.toLowerCase().endsWith('.gpx')) {
      setError('Solo archivos .gpx son soportados');
      return;
    }
    setError('');
    setFile(f);

    try {
      const content = await f.text();
      const result = parseGPX(content);
      setParsed(result);
      setName(result.name);
    } catch (err) {
      setError('No se pudo leer el archivo GPX. Verifica que sea un archivo válido.');
      setParsed(null);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => setDragOver(false), []);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const removeFile = useCallback(() => {
    setFile(null);
    setParsed(null);
    setName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // ── Submit ─────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!file || !parsed) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('event_id', eventId);
      formData.append('file', file);
      if (name) formData.append('name', name);
      if (distanceId) formData.append('distance_id', distanceId);

      // Same-origin server endpoint: it attaches the httpOnly access_token cookie.
      const res = await fetch('/api/routes/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al subir la ruta');
      }

      // Reset form
      removeFile();
      setIsOpen(false);
      onUploaded?.(data.data);
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setUploading(false);
    }
  }, [file, parsed, eventId, name, distanceId, removeFile, onUploaded]);

  // ── Render ─────────────────────────────────────────────────────────────

  const previewRoute: { geojson?: { coordinates: [number, number][] }; elevation_profile?: [number, number][]; total_distance_km?: number; total_elevation_gain?: number; min_elevation?: number; max_elevation?: number } | null = parsed
    ? {
        geojson: {
          coordinates: parsed.coords.map(([lat, lng]) => [lng, lat] as [number, number]),
        },
        elevation_profile: parsed.elevationProfile,
        total_distance_km: parsed.totalDistanceKm,
        total_elevation_gain: parsed.totalElevationGain,
        min_elevation: parsed.minElevation,
        max_elevation: parsed.maxElevation,
      }
    : null;

  return (
    <div className="rounded-xl border border-surface-container-high overflow-hidden">
      {/* Accordion header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 bg-surface-container-low hover:bg-surface-container transition-colors"
      >
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <div className="text-left">
            <h3 className="font-bold text-on-surface">Subir Ruta GPX</h3>
            <p className="text-xs text-on-surface-variant">Importa un archivo GPX con el recorrido de la carrera</p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-on-surface-variant transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Accordion content */}
      {isOpen && (
        <div className="p-6 space-y-6 bg-surface-container-low">
          {/* Error message */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* File drop zone or preview */}
          {!parsed ? (
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                dragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-surface-container-highest hover:border-primary/50 hover:bg-surface'
              }`}
            >
              <svg className="w-10 h-10 mx-auto mb-3 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="font-bold text-on-surface mb-1">Arrastra un archivo GPX aquí</p>
              <p className="text-sm text-on-surface-variant">o haz clic para seleccionar uno</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".gpx"
                className="hidden"
                onChange={onFileChange}
              />
            </div>
          ) : (
            <div className="space-y-6">
              {/* File info + remove */}
              <div className="flex items-center justify-between bg-surface rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-on-surface">{file?.name}</p>
                    <p className="text-xs text-on-surface-variant">{parsed.totalDistanceKm.toFixed(1)} km</p>
                  </div>
                </div>
                <button
                  onClick={removeFile}
                  className="text-sm text-red-500 hover:text-red-700 font-bold"
                >
                  Eliminar
                </button>
              </div>

              {/* Stats preview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Distancia" value={`${parsed.totalDistanceKm.toFixed(1)} km`} />
                <StatCard label="Desnivel +" value={`${parsed.totalElevationGain.toFixed(0)} m`} />
                <StatCard label="Altitud max" value={`${parsed.maxElevation.toFixed(0)} m`} />
                <StatCard label="Altitud min" value={`${parsed.minElevation.toFixed(0)} m`} />
              </div>

              {/* Elevation profile chart */}
              <Suspense fallback={
                <div className="rounded-xl bg-surface-container-high h-48 animate-pulse flex items-center justify-center">
                  <p className="text-sm text-on-surface-variant">Cargando perfil de elevación...</p>
                </div>
              }>
                <ElevationProfile route={previewRoute as any} />
              </Suspense>

              {/* Map preview (lazy) */}
              <Suspense fallback={
                <div className="rounded-xl bg-surface-container-high h-64 animate-pulse flex items-center justify-center">
                  <p className="text-sm text-on-surface-variant">Cargando mapa...</p>
                </div>
              }>
                <div className="rounded-xl overflow-hidden shadow-md">
                  <RouteMap route={previewRoute as any} />
                </div>
              </Suspense>

              {/* Form fields */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Nombre de la ruta
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Circuito 10K"
                    className="w-full h-10 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Distancia asociada (opcional)
                  </label>
                  <select
                    value={distanceId}
                    onChange={(e) => setDistanceId(e.target.value)}
                    className="w-full h-10 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Sin distancia</option>
                    {distances.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name || `${d.km} km`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Submit button */}
          {parsed && (
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-6 h-10 rounded-xl text-sm font-bold text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={uploading}
                className="px-8 h-10 rounded-xl bg-primary text-on-primary font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Subiendo...
                  </>
                ) : (
                  'Subir Ruta'
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── StatCard ────────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface rounded-xl p-3 text-center">
      <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">{label}</p>
      <p className="text-lg font-black text-on-surface">{value}</p>
    </div>
  );
}

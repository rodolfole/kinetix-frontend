import { useState, useMemo, lazy, Suspense } from 'react';
import type { RouteData } from '../../types/route.type';

const RouteMap = lazy(() => import('./RouteMap'));
const ElevationProfile = lazy(() => import('./ElevationProfile'));

interface RouteViewerProps {
  routes: string; // JSON serialized array
  defaultDistanceId?: string;
}

function LoadingFallback() {
  return (
    <div className="rounded-xl bg-surface-container-high p-8 animate-pulse flex items-center justify-center h-64">
      <p className="text-on-surface-variant text-sm">Cargando mapa...</p>
    </div>
  );
}

export default function RouteViewer({ routes: routesJson, defaultDistanceId }: RouteViewerProps) {
  const routes: RouteData[] = useMemo(() => {
    try {
      return JSON.parse(routesJson);
    } catch {
      return [];
    }
  }, [routesJson]);

  const [activeDistanceId, setActiveDistanceId] = useState(defaultDistanceId);

  // Group routes by distance_id
  const distanceIds = useMemo(() => {
    const ids = new Set<string>();
    for (const r of routes) {
      if (r.distance_id) ids.add(r.distance_id);
    }
    return Array.from(ids);
  }, [routes]);

  const activeRoute = useMemo(() => {
    if (!activeDistanceId) return routes[0];
    return routes.find((r) => r.distance_id === activeDistanceId) || routes[0];
  }, [routes, activeDistanceId]);

  // If no routes at all, render nothing
  if (!routes.length) return null;

  // Get distance name from route name or distance_id
  const getDistanceLabel = (distanceId: string) => {
    const route = routes.find((r) => r.distance_id === distanceId);
    if (!route) return distanceId;
    const match = route.name.match(/(\d+)\s*K/i);
    return match ? `${match[1]} km` : route.name;
  };

  return (
    <div className="space-y-8">
      {/* Distance selector tabs */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">
          Ruta:
        </span>
        {distanceIds.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {distanceIds.map((distId) => (
              <button
                key={distId}
                onClick={() => setActiveDistanceId(distId)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeDistanceId === distId
                    ? 'bg-primary text-on-primary shadow-md'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                }`}
              >
                {getDistanceLabel(distId)}
              </button>
            ))}
          </div>
        ) : (
          <span className="text-sm font-bold text-on-surface">
            {activeRoute?.name || 'Recorrido'}
          </span>
        )}
      </div>

      {/* Map — lazy loaded to avoid Leaflet SSR issues */}
      <Suspense fallback={<LoadingFallback />}>
        {activeRoute?.geojson?.coordinates?.length ? (
          <div className="rounded-xl overflow-hidden shadow-xl bg-surface-container-high">
            <RouteMap route={activeRoute} />
          </div>
        ) : (
          <div className="rounded-xl bg-surface-container-high p-8 text-center">
            <p className="text-on-surface-variant text-sm">
              Mapa no disponible para esta distancia
            </p>
          </div>
        )}

        {/* Elevation Profile */}
        {activeRoute?.elevation_profile?.length ? (
          <ElevationProfile route={activeRoute} />
        ) : null}
      </Suspense>
    </div>
  );
}

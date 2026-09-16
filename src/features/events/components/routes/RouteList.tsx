import { useState, useCallback } from 'react';
import { actions } from 'astro:actions';
import type { RouteData } from '../../types/route.type';

interface RouteListProps {
  routes: string; // JSON serialized RouteData[]
  onRefresh?: () => void;
}

export default function RouteList({ routes: routesJson, onRefresh }: RouteListProps) {
  const [routes, setRoutes] = useState<RouteData[]>(() => {
    try {
      return JSON.parse(routesJson);
    } catch {
      return [];
    }
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Esta accion eliminara la ruta permanentemente. Estas seguro?')) return;

    setDeletingId(id);
    setError('');

    try {
      const res = await actions.event.deleteRoute({ id });

      if (res.error) {
        setError(res.error.message || 'Error al eliminar la ruta');
        setDeletingId(null);
        return;
      }

      // Remove from local state
      setRoutes((prev) => prev.filter((r) => r.id !== id));
      onRefresh?.();
    } catch (err: any) {
      setError(err.message || 'Error de conexion');
    } finally {
      setDeletingId(null);
    }
  }, [onRefresh]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // ── Empty state ────────────────────────────────────────────────────────

  if (!routes.length) {
    return (
      <div className="rounded-xl bg-surface-container-low p-12 text-center">
        <svg className="w-12 h-12 mx-auto mb-4 text-on-surface-variant/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3l-6-3m6 3l6 3m6-3l-5.447-2.724A1 1 0 0121 16.382V5.618a1 1 0 00-1.447-.894L15 7m6 13l-3-1.5m0-9l-3-1.5m0 0L9 7m6 0l-6 3m6 0l3 1.5M9 7l6 3m0 0l3-1.5" />
        </svg>
        <h3 className="font-bold text-on-surface mb-1">Sin rutas todavia</h3>
        <p className="text-sm text-on-surface-variant">
          Sube un archivo GPX para agregar el recorrido de la carrera
        </p>
      </div>
    );
  }

  // ── Table ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-surface-container-high">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-container-low text-on-surface-variant text-xs font-bold uppercase tracking-wider">
              <th className="text-left px-4 py-3">Nombre</th>
              <th className="text-left px-4 py-3">Distancia</th>
              <th className="text-right px-4 py-3">KM</th>
              <th className="text-right px-4 py-3">Desnivel</th>
              <th className="text-left px-4 py-3">Fecha</th>
              <th className="text-right px-4 py-3 w-20">Accion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-high">
            {routes.map((route) => (
              <tr key={route.id} className="hover:bg-surface-container-low/50 transition-colors">
                <td className="px-4 py-3 font-bold text-on-surface">{route.name || 'Sin nombre'}</td>
                <td className="px-4 py-3 text-on-surface-variant">
                  {route.distance_id ? 'Asignada' : 'Sin distancia'}
                </td>
                <td className="px-4 py-3 text-right font-mono text-on-surface">
                  {route.total_distance_km?.toFixed(1) ?? '-'}
                </td>
                <td className="px-4 py-3 text-right font-mono text-on-surface">
                  {route.total_elevation_gain != null ? `${route.total_elevation_gain.toFixed(0)}m` : '-'}
                </td>
                <td className="px-4 py-3 text-on-surface-variant">
                  {formatDate(route.created_at)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(route.id)}
                    disabled={deletingId === route.id}
                    className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Eliminar ruta"
                  >
                    {deletingId === route.id ? (
                      <svg className="animate-spin w-4 h-4 inline" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-on-surface-variant text-right">
        {routes.length} {routes.length === 1 ? 'ruta' : 'rutas'} registrada{ routes.length !== 1 ? 's' : '' }
      </p>
    </div>
  );
}

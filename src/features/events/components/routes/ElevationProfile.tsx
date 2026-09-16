import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { RouteData } from '../../types/route.type';

interface ElevationProfileProps {
  route?: RouteData;
  className?: string;
}

// Custom tooltip for elevation chart
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number; name: string }[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white px-4 py-2 rounded-lg shadow-lg border text-sm">
      <p className="font-bold text-on-surface">
        {payload[0].value.toFixed(1)} m
      </p>
      <p className="text-on-surface-variant text-xs">
        Distancia: {payload[1]?.value.toFixed(2) ?? '-'} km
      </p>
    </div>
  );
}

export default function ElevationProfile({ route, className = '' }: ElevationProfileProps) {
  if (!route?.elevation_profile?.length) {
    return (
      <div className={`rounded-xl bg-surface-container-high p-8 flex items-center justify-center ${className}`}>
        <p className="text-on-surface-variant text-sm">Perfil de elevación no disponible</p>
      </div>
    );
  }

  // elevation_profile is [[distanceKm, elevationM], ...]
  const data = route.elevation_profile.map(([distance, elevation]) => ({
    distance: Number(distance.toFixed(3)),
    elevation: Number(elevation.toFixed(1)),
  }));

  const totalDistance = route.total_distance_km ?? data[data.length - 1].distance;
  const elevGain = route.total_elevation_gain ?? 0;
  const maxElev = route.max_elevation ?? Math.max(...data.map((d) => d.elevation));
  const minElev = route.min_elevation ?? Math.min(...data.map((d) => d.elevation));

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Distancia total" value={`${totalDistance.toFixed(1)} km`} />
        <StatCard label="Desnivel positivo" value={`${elevGain.toFixed(0)} m`} />
        <StatCard label="Altitud máxima" value={`${maxElev.toFixed(0)} m`} />
        <StatCard label="Altitud mínima" value={`${minElev.toFixed(0)} m`} />
      </div>

      {/* Chart */}
      <div className="rounded-xl bg-surface-container-low p-4">
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="elevationGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e11d48" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#e11d48" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="distance"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickFormatter={(v: number) => `${v.toFixed(0)} km`}
              label={{ value: 'Distancia (km)', position: 'insideBottomRight', offset: -5, style: { fontSize: 11, fill: '#6b7280' } }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickFormatter={(v: number) => `${v.toFixed(0)} m`}
              label={{ value: 'Altitud (m)', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#6b7280' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="elevation"
              stroke="#e11d48"
              strokeWidth={2}
              fill="url(#elevationGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#e11d48' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-container-low rounded-xl p-4 text-center">
      <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">
        {label}
      </p>
      <p className="text-xl font-black text-on-surface">{value}</p>
    </div>
  );
}

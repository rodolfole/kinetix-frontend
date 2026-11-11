// ── Types ──────────────────────────────────────────────────────────────────

export interface ParsedGPX {
  coords: [number, number][]; // [lat, lng][]
  elevationProfile: [number, number][]; // [distKm, elevM][]
  totalDistanceKm: number;
  totalElevationGain: number;
  minElevation: number;
  maxElevation: number;
  name: string;
}

// ── Haversine ──────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Parser ──────────────────────────────────────────────────────────────────

export function parseGPX(xmlContent: string): ParsedGPX {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'text/xml');

  // Extract name
  const nameEl = doc.querySelector('gpx > trk > name');
  const name = nameEl?.textContent?.trim() || 'Unnamed Route';

  // Extract track points
  const trkpts = doc.querySelectorAll('gpx > trk > trkseg > trkpt');
  if (!trkpts.length) {
    throw new Error('No track points found in GPX file');
  }

  const coords: [number, number][] = [];
  const rawElevations: number[] = [];

  trkpts.forEach((pt) => {
    const lat = parseFloat(pt.getAttribute('lat') || '0');
    const lng = parseFloat(pt.getAttribute('lon') || '0');
    const eleEl = pt.querySelector('ele');
    const ele = eleEl ? parseFloat(eleEl.textContent || '0') : 0;

    coords.push([lat, lng]);
    rawElevations.push(ele);
  });

  // Calculate cumulative distance + elevation profile
  const elevationProfile: [number, number][] = [];
  let cumulativeDist = 0;
  let totalElevGain = 0;

  elevationProfile.push([0, rawElevations[0]]);

  for (let i = 1; i < coords.length; i++) {
    const segDist = haversineKm(
      coords[i - 1][0], coords[i - 1][1],
      coords[i][0], coords[i][1]
    );
    cumulativeDist += segDist;

    const elevDiff = rawElevations[i] - rawElevations[i - 1];
    if (elevDiff > 0) totalElevGain += elevDiff;

    elevationProfile.push([
      parseFloat(cumulativeDist.toFixed(3)),
      parseFloat(rawElevations[i].toFixed(1)),
    ]);
  }

  const elevations = rawElevations.filter((e) => !isNaN(e));
  const minElevation = elevations.length ? Math.min(...elevations) : 0;
  const maxElevation = elevations.length ? Math.max(...elevations) : 0;

  return {
    coords,
    elevationProfile,
    totalDistanceKm: parseFloat(cumulativeDist.toFixed(2)),
    totalElevationGain: parseFloat(totalElevGain.toFixed(1)),
    minElevation: parseFloat(minElevation.toFixed(1)),
    maxElevation: parseFloat(maxElevation.toFixed(1)),
    name,
  };
}

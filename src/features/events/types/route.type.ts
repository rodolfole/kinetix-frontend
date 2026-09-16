export type RouteData = {
  id: string;
  event_id: string;
  distance_id?: string;
  name: string;
  geojson: GeoJSONLineString;
  elevation_profile?: ElevationPoint[];
  total_distance_km?: number;
  total_elevation_gain?: number;
  min_elevation?: number;
  max_elevation?: number;
  created_at: string;
};

export type GeoJSONLineString = {
  type: 'LineString';
  coordinates: [number, number][]; // [lng, lat][]
};

export type ElevationPoint = [number, number]; // [distanceKm, elevationM]

export type RouteListItem = {
  id: string;
  event_id: string;
  distance_id?: string;
  name: string;
  total_distance_km?: number;
  total_elevation_gain?: number;
  min_elevation?: number;
  max_elevation?: number;
  created_at: string;
};

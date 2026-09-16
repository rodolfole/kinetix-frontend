import { useEffect, useRef } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import type { RouteData } from '../../types/route.type';

interface RouteMapProps {
  route?: RouteData;
  className?: string;
}

export default function RouteMap({ route, className = '' }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (!mapRef.current || !route?.geojson?.coordinates?.length) return;

    async function initMap() {
      const L = await import('leaflet');
      const container = mapRef.current;
      if (!container) return;

      // Fix default icon paths for bundlers
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      // Parse coordinates: GeoJSON is [lng, lat] -> Leaflet is [lat, lng]
      const coords = route!.geojson.coordinates.map(
        ([lng, lat]) => [lat, lng] as [number, number]
      );

      // Calculate center
      const center: [number, number] = coords.reduce(
        ([sumLat, sumLng], [lat, lng]) => [sumLat + lat, sumLng + lng],
        [0, 0]
      ).map((v) => v / coords.length) as [number, number];

      // Destroy previous instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = L.map(container, {
        center,
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Route polyline
      L.polyline(coords, {
        color: '#e11d48',
        weight: 4,
        opacity: 0.85,
      }).addTo(map);

      // Start marker
      L.marker(coords[0])
        .addTo(map)
        .bindPopup('Salida');

      // Finish marker
      if (coords.length > 1) {
        L.marker(coords[coords.length - 1])
          .addTo(map)
          .bindPopup('Meta');
      }

      // Fit bounds to show full route
      if (coords.length > 1) {
        map.fitBounds(coords, { padding: [40, 40] });
      }

      mapInstanceRef.current = map;
    }

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [route]);

  if (!route?.geojson?.coordinates?.length) {
    return (
      <div className={`rounded-xl overflow-hidden bg-surface-container-high aspect-video flex items-center justify-center ${className}`}>
        <p className="text-on-surface-variant text-sm">Mapa de ruta no disponible</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl overflow-hidden ${className}`}>
      <div ref={mapRef} className="w-full min-h-[400px] z-0" />
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
      />
    </div>
  );
}

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapPinIcon, SearchIcon, XIcon } from './icons';

/**
 * Address picker — text search only (Nominatim OpenStreetMap).
 *
 * Architecture decision: pull the address search from Nominatim's free
 * public endpoint (no API key needed, CORS-friendly), debounce typing to
 * avoid rate-limits. No map component — the search alone is enough for
 * our Mexican event registration flow; coordinates are stored as hidden
 * inputs and consumed by the form submission.
 */

interface AddressPickerProps {
  name: string;
  initialValue?: string;
  latName?: string;
  lngName?: string;
  initialLat?: number | null;
  initialLng?: number | null;
  placeholder?: string;
}

interface NominatimAddress {
  state?: string;
  state_district?: string;
  region?: string;
  municipality?: string;
  county?: string;
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  suburb?: string;
  neighbourhood?: string;
  city_district?: string;
}

interface NominatimHit {
  display_name: string;
  lat: string;
  lon: string;
  address?: NominatimAddress;
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const COUNTRY_CODES = 'mx';

export default function AddressPicker({
  name,
  initialValue = '',
  latName = 'address_lat',
  lngName = 'address_lng',
  initialLat = null,
  initialLng = null,
  placeholder = 'Busca la dirección (calle, colonia, ciudad)…',
}: AddressPickerProps) {
  const [query, setQuery] = useState(initialValue);
  const [hits, setHits] = useState<NominatimHit[]>([]);
  const [selected, setSelected] = useState<{ lat: number; lng: number } | null>(
    initialLat !== null && initialLng !== null ? { lat: initialLat, lng: initialLng } : null
  );
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search via Nominatim.
  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 3) {
      setHits([]);
      return;
    }
    setSearching(true);
    try {
      const url = `${NOMINATIM_URL}?format=json&addressdetails=1&limit=5&countrycodes=${COUNTRY_CODES}&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'es' } });
      const data: NominatimHit[] = await res.json();
      setHits(data);
    } catch {
      setHits([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query), 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  function pickHit(h: NominatimHit) {
    setQuery(h.display_name);
    setSelected({ lat: Number(h.lat), lng: Number(h.lon) });
    setHits([]);

    // Disparamos un CustomEvent a nivel document. Como AddressPicker es
    // una React island montada por Astro, no comparte árbol DOM con el
    // resto del form; el listener en [eventSlug].astro busca este evento
    // y auto-rellena los selects #state / #municipality con matching
    // difuso contra el dataset `data-mexico`.
    const a = h.address ?? {};
    const state =
      a.state || a.state_district || a.region || '';
    const municipality =
      a.municipality || a.county || a.city || a.town || a.village || '';
    window.dispatchEvent(
      new CustomEvent('kinetix:address-selected', {
        detail: { state, municipality },
      }),
    );
  }

  function clearAll() {
    setQuery('');
    setSelected(null);
    setHits([]);
  }

  return (
    <div className="space-y-2">
      {/* Hidden inputs populated for the form */}
      <input type="hidden" name={name} value={query} />
      <input type="hidden" name={latName} value={selected?.lat ?? ''} />
      <input type="hidden" name={lngName} value={selected?.lng ?? ''} />

      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center text-zinc-400 pointer-events-none">
          <SearchIcon size={18} stroke={1.75} />
        </div>
        <input
          type="text"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full h-11 pl-10 pr-10 rounded-lg border border-zinc-200 bg-white text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
          aria-label="Buscar dirección"
        />
        {query && (
          <button
            type="button"
            aria-label="Limpiar dirección"
            onClick={clearAll}
            className="absolute inset-y-0 right-3 flex items-center text-zinc-400 hover:text-zinc-700"
          >
            <XIcon size={16} />
          </button>
        )}
        {hits.length > 0 && (
          <ul className="absolute z-30 top-full mt-1 w-full max-h-72 overflow-auto rounded-lg border border-zinc-200 bg-white shadow-lg">
            {hits.map((h, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => pickHit(h)}
                  className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-start gap-2 text-sm border-b border-zinc-100 last:border-b-0"
                >
                  <MapPinIcon size={16} className="mt-1 text-blue-500 flex-shrink-0" />
                  <span className="line-clamp-2">{h.display_name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
            Buscando…
          </div>
        )}
      </div>

      {selected && (
        <div className="flex items-center gap-2 text-xs text-emerald-600">
          <MapPinIcon size={14} />
          Ubicación fijada ({selected.lat.toFixed(4)}, {selected.lng.toFixed(4)})
        </div>
      )}
    </div>
  );
}

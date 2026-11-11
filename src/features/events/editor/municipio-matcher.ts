/**
 * Tolerant Estado/Municipio matching for the address auto-fill.
 *
 * Nominatim returns strings like "Guadalajara Metropolitan Area" or
 * "Jalisco, México"; the form selects only accept values from the local
 * `data-mexico` dataset, so the raw text is normalised and matched fuzzily.
 */

export interface MexicoDatasetEntry {
  estado: string;
  municipios: string[];
}

export function normalizeLocationName(raw?: string): string {
  return (raw || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // acentos
    .replace(/\([^)]*\)/g, ' ') // paréntesis y su contenido
    .replace(/[.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function findEstado(raw: string, mexico: MexicoDatasetEntry[]): string | null {
  if (!raw) return null;
  const normalized = normalizeLocationName(raw);
  if (!normalized) return null;

  const exact = mexico.find((entry) => normalizeLocationName(entry.estado) === normalized);
  if (exact) return exact.estado;

  // "Guadalajara, Jalisco, México" → contains "jalisco".
  const contained = mexico.find((entry) =>
    normalized.includes(normalizeLocationName(entry.estado)),
  );
  return contained ? contained.estado : null;
}

export function findMunicipio(
  estadoNombre: string,
  raw: string,
  mexico: MexicoDatasetEntry[],
): string | null {
  if (!raw) return null;
  const found = mexico.find((entry) => entry.estado === estadoNombre);
  if (!found) return null;

  const normalized = normalizeLocationName(raw);
  if (!normalized) return null;

  const exact = found.municipios.find((m) => normalizeLocationName(m) === normalized);
  if (exact) return exact;

  // "Puerto Vallarta Centro" matches "Puerto Vallarta".
  const contained = found.municipios.find((m) => normalized.includes(normalizeLocationName(m)));
  if (contained) return contained;

  // raw="Centro" matches "Centro (Villahermosa)".
  const inverse = found.municipios.find((m) => normalizeLocationName(m).includes(normalized));
  return inverse || null;
}

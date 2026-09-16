// Catálogo cerrado de iconos Lucide para el itinerario del evento
// Solamente estos iconos están disponibles, definidos en la BD como strings.

export const ITINERARY_ICONS = [
  { value: 'flag', label: 'Largada / Salida' },
  { value: 'finish', label: 'Llegada / Meta' },
  { value: 'map-pin', label: 'Punto de control' },
  { value: 'droplet', label: 'Hidratación' },
  { value: 'apple', label: 'Avituallamiento' },
  { value: 'heart-pulse', label: 'Atención médica' },
  { value: 'first-aid', label: 'Primeros auxilios' },
  { value: 'bath', label: 'Sanitarios' },
  { value: 'parking', label: 'Estacionamiento' },
  { value: 'tent', label: 'Campamento' },
  { value: 'backpack', label: 'Guardarropa' },
  { value: 'music', label: 'Animación / Música' },
  { value: 'camera', label: 'Fotografía' },
  { value: 'timer', label: 'Cronometraje' },
  { value: 'info', label: 'Información' },
  { value: 'arrow-up-from-line', label: 'Subida' },
  { value: 'arrow-down-to-line', label: 'Bajada' },
  { value: 'utensils', label: 'Alimentación' },
  { value: 'shirt', label: 'Entrega de kits' },
  { value: 'trophy', label: 'Podio / Premiación' },
] as const;

export type ItineraryIcon = (typeof ITINERARY_ICONS)[number]['value'];

// Mapa rápido de icono a label
export const ITINERARY_ICON_LABELS: Record<string, string> =
  Object.fromEntries(ITINERARY_ICONS.map((i) => [i.value, i.label]));

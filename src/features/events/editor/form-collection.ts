import { collectDynamicItems } from '@lib/validation';

/**
 * Reads the event form DOM into the structured payload the submit handler
 * validates and sends. Reuses `collectDynamicItems` (the shared helper for
 * every repeatable card) so the naming and "only cards with a value" rules stay
 * in one place.
 */

export const BASIC_FIELDS = [
  'name',
  'slug',
  'description',
  'event_date',
  'deadline',
  'state',
  'municipality',
  'address',
  'logo_url',
] as const;

export const INFO_FIELDS = ['judges', 'rules', 'risks', 'transit'] as const;

const DISTANCE_FIELDS = ['distance_type_id', 'capacity', 'surface', 'gpx_filename'];
const PRICING_FIELDS = ['distance_id', 'name', 'price', 'start_date', 'end_date', 'is_early_bird'];
const CATEGORY_FIELDS = ['distance_id', 'age_category_id', 'gender', 'num_places', 'is_elite'];
const REGISTRATION_FIELDS = ['location_name', 'address'];
const SPONSOR_FIELDS = ['name', 'tier', 'logo_url'];
const KIT_FIELDS = ['name', 'icon'];

/** Sub-resources whose booleans must travel as "true"/"false" strings. */
const SUB_RESOURCE_KEYS = [
  'distances',
  'pricing_stages',
  'categories',
  'registrations',
  'sponsors',
  'runner_kits',
];

export interface CollectEventFormOptions {
  form: HTMLFormElement;
  /** Sections the user (or the persisted field config) turned on. */
  enabledSections: Iterable<string>;
}

export type StructuredEventData = Record<string, any>;

export function collectEventFormData({
  form,
  enabledSections,
}: CollectEventFormOptions): StructuredEventData {
  const enabled = new Set(enabledSections);
  const flatData = Object.fromEntries(new FormData(form).entries()) as Record<string, FormDataEntryValue>;
  const structured: StructuredEventData = {};

  for (const field of BASIC_FIELDS) {
    structured[field] = flatData[field] || '';
  }

  try {
    structured.itinerary = JSON.parse(String(flatData['itinerary_json'] ?? '[]'));
  } catch {
    structured.itinerary = [];
  }

  const rawDistances = collectDynamicItems('distances-container', DISTANCE_FIELDS);
  structured.distances = Object.entries(rawDistances).map(([id, item]) => ({
    _tempId: id,
    ...(item as Record<string, unknown>),
  }));

  structured.pricing_stages = Object.values(
    collectDynamicItems('pricing-stages-container', PRICING_FIELDS),
  );

  // `collectDynamicItems` only reads the first input of each data-name, so the
  // per-place prize amounts are collected explicitly afterwards.
  const categories = collectDynamicItems('categories-container', CATEGORY_FIELDS) as Record<
    string,
    Record<string, any>
  >;
  for (const [id, item] of Object.entries(categories)) {
    const card = document.querySelector<HTMLElement>(`#categories-container [data-id="${id}"]`);
    const amounts: number[] = [];
    card?.querySelectorAll<HTMLInputElement>('input[data-name="prize_amount"]').forEach((input) => {
      const value = Number(input.value);
      amounts.push(Number.isNaN(value) ? 0 : value);
    });
    item.prize_amounts = amounts;
    // `prize_amount` (legacy single value) mirrors the first place.
    item.prize_amount = String(amounts[0] ?? 0);
  }
  structured.categories = categories;

  if (enabled.has('registrations')) {
    structured.registrations = collectDynamicItems('reg-locations-container', REGISTRATION_FIELDS);
  }

  // Categories, sponsors and runner kits are always active.
  structured.sponsors = collectDynamicItems('sponsors-container', SPONSOR_FIELDS);
  structured.runner_kits = collectDynamicItems('kits-container', KIT_FIELDS);

  for (const field of INFO_FIELDS) {
    if (enabled.has(field)) structured[field] = flatData[field] || '';
  }

  return structured;
}

/**
 * The create schema expects `"true"`/`"false"` strings, so checkbox booleans
 * are coerced before validation (edit mode validates only the base fields).
 */
export function coerceBooleanFlags(structured: StructuredEventData): StructuredEventData {
  for (const key of SUB_RESOURCE_KEYS) {
    if (!structured[key]) continue;
    const items: any[] = Array.isArray(structured[key])
      ? structured[key]
      : Object.values(structured[key] as Record<string, any>);
    items.forEach((item: any) => {
      if (!item) return;
      if (typeof item.is_early_bird === 'boolean') item.is_early_bird = String(item.is_early_bird);
      if (typeof item.is_elite === 'boolean') item.is_elite = String(item.is_elite);
    });
  }
  return structured;
}

/**
 * Submit payload for the event form. Edit mode PUTs only the base event fields
 * to the dedicated API route (the backend update ignores sub-resources); create
 * mode POSTs the whole structured payload through the Astro action.
 */

export interface EventSubmission {
  url: string;
  method: 'POST' | 'PUT';
  payload: Record<string, any>;
}

export interface SubmissionOptions {
  isEditing: boolean;
  eventId?: string;
}

/** Normalises form date values (date-only / datetime-local) to RFC3339 UTC. */
export function toRFC3339(value: any): string {
  if (!value) return '';
  const raw = String(value);
  // Already zoned.
  if (/Z$|[+-]\d{2}:?\d{2}$/.test(raw)) return raw;
  // Date-only → UTC midnight.
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return `${raw}T00:00:00Z`;
  // datetime-local (YYYY-MM-DDTHH:MM or …:SS) → assume UTC.
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw)) {
    return raw.length === 16 ? `${raw}:00Z` : `${raw}Z`;
  }
  return raw;
}

export function slugifyEventName(name: string): string {
  return (name || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

export function buildEventSubmission(
  structured: Record<string, any>,
  { isEditing, eventId }: SubmissionOptions,
): EventSubmission {
  if (isEditing) {
    if (!eventId) {
      throw new Error('No se pudo resolver el ID del evento a actualizar');
    }
    return {
      url: `/api/events/${eventId}`,
      method: 'PUT',
      payload: {
        name: structured.name,
        slug: structured.slug,
        description: structured.description,
        event_date: toRFC3339(structured.event_date),
        deadline: toRFC3339(structured.deadline),
        state: structured.state,
        municipality: structured.municipality,
        address: structured.address,
        logo_url: structured.logo_url,
        itinerary: structured.itinerary,
        judges: structured.judges,
        rules: structured.rules,
        risks: structured.risks,
        transit: structured.transit,
      },
    };
  }

  const finalSlug =
    (structured.slug && String(structured.slug).trim()) || slugifyEventName(structured.name || '');

  return {
    url: '/_actions/event.create',
    method: 'POST',
    payload: {
      ...structured,
      slug: finalSlug,
      event_date: toRFC3339(structured.event_date),
      deadline: toRFC3339(structured.deadline),
    },
  };
}

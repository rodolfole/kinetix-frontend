// The submit payload builder was inline in the event page script. These tests
// pin the URL/method the form hits and how dates and the create-mode slug are
// normalised before the request leaves the browser.
import { describe, it, expect } from 'vitest';
import { buildEventSubmission, slugifyEventName, toRFC3339 } from './payload';

const structured = {
  name: 'Maratón de Arandas',
  slug: '',
  description: 'Descripción',
  event_date: '2026-05-01T07:00',
  deadline: '2026-04-20',
  state: 'Jalisco',
  municipality: 'Arandas',
  address: 'Calle 1',
  logo_url: '',
  itinerary: [{ key: 'Salida', time: '08:00', icon: 'map-pin' }],
  judges: 'Juez',
  rules: 'Reglas',
  risks: 'Riesgos',
  transit: 'Transición',
  distances: [{ _tempId: 'd1', distance_type_id: '10k', capacity: '500', surface: 'trail' }],
  pricing_stages: [{ distance_id: 'd1', name: 'Early', price: '450' }],
};

describe('toRFC3339', () => {
  it('turns a date-only value into UTC midnight', () => {
    expect(toRFC3339('2026-04-20')).toBe('2026-04-20T00:00:00Z');
  });

  it('adds seconds and the UTC marker to datetime-local values', () => {
    expect(toRFC3339('2026-05-01T07:00')).toBe('2026-05-01T07:00:00Z');
    expect(toRFC3339('2026-05-01T07:00:30')).toBe('2026-05-01T07:00:30Z');
  });

  it('keeps values that already carry a zone', () => {
    expect(toRFC3339('2026-05-01T07:00:00Z')).toBe('2026-05-01T07:00:00Z');
    expect(toRFC3339('2026-05-01T07:00:00-06:00')).toBe('2026-05-01T07:00:00-06:00');
  });

  it('returns an empty string for empty input', () => {
    expect(toRFC3339('')).toBe('');
    expect(toRFC3339(undefined)).toBe('');
  });
});

describe('slugifyEventName', () => {
  it('strips accents, punctuation and collapses separators', () => {
    expect(slugifyEventName('Maratón de Arandas!!')).toBe('maraton-de-arandas');
    expect(slugifyEventName('  10K   Nocturno  ')).toBe('10k-nocturno');
  });

  it('truncates to 80 characters', () => {
    expect(slugifyEventName('a'.repeat(120)).length).toBe(80);
  });
});

describe('buildEventSubmission — edit mode', () => {
  it('PUTs only the base fields to the event endpoint resolved from the event id', () => {
    const submission = buildEventSubmission(structured, { isEditing: true, eventId: 'evt-1' });

    expect(submission.method).toBe('PUT');
    expect(submission.url).toBe('/api/events/evt-1');
    expect(submission.payload).toEqual({
      name: 'Maratón de Arandas',
      slug: '',
      description: 'Descripción',
      event_date: '2026-05-01T07:00:00Z',
      deadline: '2026-04-20T00:00:00Z',
      state: 'Jalisco',
      municipality: 'Arandas',
      address: 'Calle 1',
      logo_url: '',
      itinerary: [{ key: 'Salida', time: '08:00', icon: 'map-pin' }],
      judges: 'Juez',
      rules: 'Reglas',
      risks: 'Riesgos',
      transit: 'Transición',
    });
    expect(submission.payload).not.toHaveProperty('distances');
  });

  it('throws when the event id could not be resolved', () => {
    expect(() => buildEventSubmission(structured, { isEditing: true, eventId: '' })).toThrow(
      'No se pudo resolver el ID del evento a actualizar',
    );
  });
});

describe('buildEventSubmission — create mode', () => {
  it('POSTs the whole structured payload to the create action', () => {
    const submission = buildEventSubmission(structured, { isEditing: false });

    expect(submission.method).toBe('POST');
    expect(submission.url).toBe('/_actions/event.create');
    expect(submission.payload).toMatchObject({
      name: 'Maratón de Arandas',
      distances: structured.distances,
      pricing_stages: structured.pricing_stages,
      event_date: '2026-05-01T07:00:00Z',
      deadline: '2026-04-20T00:00:00Z',
    });
  });

  it('derives the slug from the name when the user left it empty', () => {
    const submission = buildEventSubmission(structured, { isEditing: false });
    expect(submission.payload.slug).toBe('maraton-de-arandas');
  });

  it('keeps a slug the user typed', () => {
    const submission = buildEventSubmission(
      { ...structured, slug: 'mi-carrera' },
      { isEditing: false },
    );
    expect(submission.payload.slug).toBe('mi-carrera');
  });
});

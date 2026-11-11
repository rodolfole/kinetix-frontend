// @vitest-environment happy-dom
// The event editor page used to collect its form data inside a ~1,170 line
// inline <script>. That logic now lives in `form-collection.ts`; these tests
// pin the collected payload shape through the DOM (public interface), not
// through internal state.
import { describe, it, expect, beforeEach } from 'vitest';
import { collectEventFormData, coerceBooleanFlags } from './form-collection';

const BASIC_MARKUP = `
  <input id="name" name="name" value="Maratón de Arandas" />
  <input id="slug" name="slug" value="maraton-de-arandas" />
  <textarea id="description" name="description">Una carrera</textarea>
  <input id="event_date" name="event_date" value="2026-05-01T07:00" />
  <input id="deadline" name="deadline" value="2026-04-20" />
  <select id="state" name="state"><option value="Jalisco" selected>Jalisco</option></select>
  <select id="municipality" name="municipality"><option value="Arandas" selected>Arandas</option></select>
  <input id="address" name="address" value="Calle 1" />
  <input type="hidden" name="itinerary_json" value='[{"key":"Salida","time":"08:00","icon":"map-pin"}]' />
`;

function mountForm(inner: string): HTMLFormElement {
  document.body.innerHTML = `<form id="event-form">${BASIC_MARKUP}${inner}</form>`;
  return document.getElementById('event-form') as HTMLFormElement;
}

const DISTANCE_CARD = `
  <div class="distance-card" data-id="d1">
    <select data-name="distance_type_id"><option value="10k" selected>10K</option></select>
    <input data-name="capacity" value="500" />
    <select data-name="surface"><option value="trail" selected>Trail</option></select>
    <input data-name="gpx_filename" value="ruta.gpx" />
  </div>
`;

const CATEGORY_CARD = `
  <div class="card" data-id="c1">
    <select data-name="distance_id"><option value="d1" selected>10K</option></select>
    <select data-name="age_category_id"><option value="a1" selected>18-29</option></select>
    <select data-name="gender"><option value="female" selected>Femenil</option></select>
    <select data-name="num_places"><option value="2" selected>2</option></select>
    <input type="checkbox" data-name="is_elite" checked />
    <input data-name="prize_amount" value="1500" />
    <input data-name="prize_amount" value="800" />
  </div>
`;

describe('collectEventFormData', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('collects the basic fields and defaults missing ones to empty strings', () => {
    const form = mountForm('');
    const data = collectEventFormData({ form, enabledSections: [] });

    expect(data).toMatchObject({
      name: 'Maratón de Arandas',
      slug: 'maraton-de-arandas',
      description: 'Una carrera',
      event_date: '2026-05-01T07:00',
      deadline: '2026-04-20',
      state: 'Jalisco',
      municipality: 'Arandas',
      address: 'Calle 1',
      logo_url: '',
    });
  });

  it('parses itinerary_json into itinerary items', () => {
    const form = mountForm('');
    const data = collectEventFormData({ form, enabledSections: [] });
    expect(data.itinerary).toEqual([{ key: 'Salida', time: '08:00', icon: 'map-pin' }]);
  });

  it('falls back to an empty itinerary when itinerary_json is not valid JSON', () => {
    document.body.innerHTML = `
      <form id="event-form">
        <input id="name" name="name" value="X" />
        <input type="hidden" name="itinerary_json" value="{not json" />
      </form>`;
    const form = document.getElementById('event-form') as HTMLFormElement;
    expect(collectEventFormData({ form, enabledSections: [] }).itinerary).toEqual([]);
  });

  it('maps distance cards into an array carrying the temporary card id', () => {
    const form = mountForm(`<div id="distances-container">${DISTANCE_CARD}</div>`);
    const data = collectEventFormData({ form, enabledSections: [] });

    expect(data.distances).toEqual([
      {
        _tempId: 'd1',
        distance_type_id: '10k',
        capacity: '500',
        surface: 'trail',
        gpx_filename: 'ruta.gpx',
      },
    ]);
  });

  it('collects one prize_amounts entry per place and mirrors the first place in prize_amount', () => {
    const form = mountForm(`<div id="categories-container">${CATEGORY_CARD}</div>`);
    const data = collectEventFormData({ form, enabledSections: ['categories'] });

    expect(data.categories.c1).toMatchObject({
      distance_id: 'd1',
      age_category_id: 'a1',
      gender: 'female',
      num_places: '2',
      prize_amounts: [1500, 800],
      prize_amount: '1500',
    });
  });

  it('always collects sponsors and runner kits', () => {
    const form = mountForm(`
      <div id="sponsors-container">
        <div class="card" data-id="s1">
          <input data-name="name" value="Acme" />
          <input data-name="tier" value="gold" />
          <input data-name="logo_url" value="logo.png" />
        </div>
      </div>
      <div id="kits-container">
        <div class="card" data-id="k1">
          <input data-name="name" value="Playera" />
          <input data-name="icon" value="shirt" />
        </div>
      </div>`);
    const data = collectEventFormData({ form, enabledSections: [] });

    expect(data.sponsors).toEqual({ s1: { name: 'Acme', tier: 'gold', logo_url: 'logo.png' } });
    expect(data.runner_kits).toEqual({ k1: { name: 'Playera', icon: 'shirt' } });
  });

  it('omits optional sections that are not enabled', () => {
    const form = mountForm(`
      <div id="reg-locations-container">
        <div class="card" data-id="r1">
          <input data-name="location_name" value="Gimnasio" />
          <input data-name="address" value="Calle 2" />
        </div>
      </div>
      <textarea id="rules" name="rules">Reglas</textarea>`);
    const data = collectEventFormData({ form, enabledSections: [] });

    expect(data.registrations).toBeUndefined();
    expect(data.rules).toBeUndefined();
  });

  it('includes enabled optional sections (registrations + long text fields)', () => {
    const form = mountForm(`
      <div id="reg-locations-container">
        <div class="card" data-id="r1">
          <input data-name="location_name" value="Gimnasio" />
          <input data-name="address" value="Calle 2" />
        </div>
      </div>
      <textarea id="rules" name="rules">Reglas</textarea>
      <textarea id="risks" name="risks">Riesgos</textarea>`);
    const data = collectEventFormData({
      form,
      enabledSections: new Set(['registrations', 'rules', 'risks']),
    });

    expect(data.registrations).toEqual({ r1: { location_name: 'Gimnasio', address: 'Calle 2' } });
    expect(data.rules).toBe('Reglas');
    expect(data.risks).toBe('Riesgos');
    expect(data.judges).toBeUndefined();
    expect(data.transit).toBeUndefined();
  });
});

describe('coerceBooleanFlags', () => {
  it('turns boolean flags of every sub-resource into "true"/"false" strings', () => {
    const structured = {
      pricing_stages: [{ is_early_bird: true }, { is_early_bird: false }],
      categories: { c1: { is_elite: true } },
      distances: 'not-an-array' as unknown,
    };
    const data = coerceBooleanFlags({ ...structured, distances: undefined as unknown as any });

    expect(data.pricing_stages).toEqual([{ is_early_bird: 'true' }, { is_early_bird: 'false' }]);
    expect(data.categories).toEqual({ c1: { is_elite: 'true' } });
  });
});

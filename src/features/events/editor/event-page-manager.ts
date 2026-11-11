import { navigate } from 'astro:transitions/client';
import { generateSlug } from '@lib/slug';
import { showFieldError, clearAllFieldErrors, setupFieldErrorListeners } from '@lib/form-utils';
import { buildEventSchema, baseEventSchema } from '@lib/validation';
import { coerceBooleanFlags, collectEventFormData } from './form-collection';
import { buildFieldConfigSections, parseDisabledSections } from './field-config';
import { buildEventSubmission } from './payload';
import { renderKitIconBar } from './kit-icons';
import { OPTIONAL_SECTION_DEFINITIONS } from './optional-sections';
import { wirePlacesSelector } from './prize-places';
import { syncDeadlineMax, syncPriceStageDates, wireEstadoMunicipioCascade } from './editor-ui';

/**
 * Behaviour of the event create/edit form.
 *
 * The page renders the sections and the `<template>` cards; this manager wires
 * the repeatable cards, the optional-section toggles, the client-side
 * validation and the submit. It is event-delegated so cards added after load
 * need no extra wiring except their own per-template enhancements.
 */

interface DistanceType {
  id: string;
  name: string;
  km: number;
}

interface SectionConfig {
  key: string;
  btn: string;
  container: string;
  tpl: string;
}

const SECTION_CONFIG: SectionConfig[] = [
  { key: 'distances', btn: 'add-distance-btn', container: 'distances-container', tpl: 'distance-tpl' },
  {
    key: 'registrations',
    btn: 'add-reg-btn',
    container: 'reg-locations-container',
    tpl: 'reg-tpl',
  },
  { key: 'sponsors', btn: 'add-sponsor-btn', container: 'sponsors-container', tpl: 'sponsor-tpl' },
  {
    key: 'categories',
    btn: 'add-category-btn',
    container: 'categories-container',
    tpl: 'category-tpl',
  },
  {
    key: 'pricing_stages',
    btn: 'add-price-stage-btn',
    container: 'pricing-stages-container',
    tpl: 'price-stage-tpl',
  },
  { key: 'runner_kits', btn: 'add-kit-btn', container: 'kits-container', tpl: 'kit-tpl' },
];

/** Empty-state message ids per container. */
const EMPTY_STATE_MESSAGES: Record<string, string> = {
  'categories-container': 'no-categories-msg',
  'distances-container': 'no-distances-msg',
  'reg-locations-container': 'no-registration-msg',
  'sponsors-container': 'no-sponsors-msg',
  'kits-container': 'no-kits-msg',
  'pricing-stages-container': 'no-pricing-msg',
};

/** Containers whose cards must expose a prize_amounts[] array. */
const CATEGORY_CONTAINER_IDS: Record<string, string> = {
  categories: 'categories-container',
  pricing_stages: 'pricing-stages-container',
  registrations: 'reg-locations-container',
  sponsors: 'sponsors-container',
  runner_kits: 'kits-container',
};

/** Distancias inyectadas por la página (`window.__DISTANCE_TYPES`). */
function getDistanceTypes(): DistanceType[] {
  return ((window as unknown as { __DISTANCE_TYPES?: DistanceType[] }).__DISTANCE_TYPES ?? []);
}

export class EventPageManager {
  form: HTMLElement | null;
  enabledSections: Set<string>;

  constructor(form: HTMLElement | null = document.getElementById('event-form')) {
    this.form = form;
    // enabledSections empieza VACÍO: las secciones opcionales no se muestran
    // hasta que el usuario active su toggle.
    this.enabledSections = new Set();
    this.init();
  }

  get isEditing(): boolean {
    return this.form?.dataset.editing === 'true';
  }

  get slug(): string {
    return this.form?.dataset.slug || '';
  }

  get eventId(): string {
    return this.form?.dataset.eventId || '';
  }

  init(): void {
    if (!this.form) return;

    wireEstadoMunicipioCascade(this.form);

    const eventDate = this.form.querySelector<HTMLInputElement>('#event_date');
    const deadline = this.form.querySelector<HTMLInputElement>('#deadline');
    if (eventDate && deadline) syncDeadlineMax(eventDate, deadline);

    const renderContainer = document.getElementById('optional-sections-render');
    if (renderContainer) {
      renderContainer.innerHTML = '';
      this.form.querySelectorAll<HTMLInputElement>('.optional-section-toggle').forEach((toggle) => {
        toggle.checked = false;
      });
    }

    this.form.querySelectorAll<HTMLInputElement>('.optional-section-toggle').forEach((toggle) => {
      toggle.addEventListener('change', () => {
        this.toggleSection(toggle.dataset.section || '', toggle.checked);
      });
    });

    this.form.addEventListener('click', (event) => this.handleGlobalClicks(event));
    this.form.addEventListener('input', (event) => this.handleGlobalInputs(event));
    this.form.addEventListener('change', (event) => this.handleGlobalChanges(event));
    this.form.addEventListener('submit', (event) => this.handleSubmit(event));

    // The GPX drop zone is an Astro island (`client:visible`) inside the
    // distance template; it reports through DOM events instead of props.
    this.form.addEventListener('kinetix:gpx-loaded', (event) => this.handleGpxEvent(event));
    this.form.addEventListener('kinetix:gpx-cleared', (event) => this.handleGpxEvent(event));

    setupFieldErrorListeners('#event-form');
    this.checkEmptyStates();
    this.updateCategoryButtonState();
    if (this.isEditing) {
      this.hydrateFromInitialData();
      void this.loadFieldConfig();
    }
  }

  async loadFieldConfig(): Promise<void> {
    if (!this.slug) return;
    try {
      const response = await fetch('/_actions/event.getFieldConfig', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: this.slug }),
      });
      const body = await response.json();
      const configs = body?.data;
      if (!Array.isArray(configs)) return;

      for (const sectionName of parseDisabledSections(configs)) {
        this.enabledSections.delete(sectionName);
        const toggle = this.form!.querySelector<HTMLInputElement>(
          `.optional-section-toggle[data-section="${sectionName}"]`,
        );
        if (toggle) {
          toggle.checked = false;
          this.toggleSection(sectionName, false);
        }
      }
    } catch (error) {
      console.warn('Could not load field config:', error);
    }
  }

  async saveFieldConfig(): Promise<void> {
    if (!this.isEditing || !this.slug) return;
    const sections = buildFieldConfigSections(this.enabledSections);
    try {
      await fetch('/_actions/event.updateFieldConfig', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: this.slug, sections }),
      });
    } catch (error) {
      console.warn('Could not save field config:', error);
    }
  }

  toggleSection(sectionName: string, enabled: boolean): void {
    if (enabled) {
      this.enabledSections.add(sectionName);
    } else {
      this.enabledSections.delete(sectionName);
    }
    this.renderOptionalSection(sectionName, enabled);
  }

  renderOptionalSection(sectionName: string, enabled: boolean): void {
    const renderContainer = document.getElementById('optional-sections-render');
    if (!renderContainer) return;

    const existing = renderContainer.querySelector(`[data-optional-section="${sectionName}"]`);
    if (existing) existing.remove();
    if (!enabled) return;

    const definition = OPTIONAL_SECTION_DEFINITIONS[sectionName];
    if (!definition) return;

    const block = document.createElement('div');
    block.dataset.optionalSection = sectionName;
    block.className = 'optional-section-block';
    block.innerHTML = `
        <div class="border rounded-xl bg-white shadow-sm">
          <div class="px-6 py-4 border-b border-zinc-100">
            <h3 class="font-semibold text-base">${definition.title}</h3>
            <p class="text-xs text-muted-foreground mt-1">${definition.description}</p>
          </div>
          <div class="p-6">${definition.render()}</div>
        </div>
      `;
    renderContainer.appendChild(block);
    this.onUIChange();
  }

  handleGlobalClicks(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest('[data-react-island]')) return;

    const section = SECTION_CONFIG.find((config) => config.btn === target.id);
    if (section) {
      this.addItem(section.container, section.tpl, section.key);
      return;
    }

    if (target.classList.contains('quick-add')) {
      this.addItem('distances-container', 'distance-tpl', 'distances', {
        typeId: target.dataset.typeId || '',
        km: target.dataset.km || '',
        label: target.dataset.label || '',
      });
    }

    if (target.id === 'add-early-bird-btn') {
      const card = this.addItem('pricing-stages-container', 'price-stage-tpl', 'pricing_stages');
      if (card) {
        this.setInputValue(card, 'name', 'Early Bird');
        const check = card.querySelector<HTMLInputElement>('[data-name="is_early_bird"]');
        if (check) {
          check.checked = true;
          check.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    }

    const removeButton = target.closest('.remove-item');
    if (removeButton) {
      const card = removeButton.closest('.distance-card, .card');
      if (card) {
        card.remove();
        this.onUIChange();
      }
    }
  }

  handleGlobalInputs(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.id === 'name') {
      const slugInput = document.getElementById('slug') as HTMLInputElement | null;
      if (slugInput) slugInput.value = generateSlug(target.value);
    }
    if (target.dataset.name === 'is_early_bird') {
      const card = target.closest('.card');
      const badge = card?.querySelector('.stage-badge');
      if (badge) {
        const isEarlyBird = target.checked;
        badge.className = `stage-badge px-2 py-0.5 rounded text-[10px] font-bold ${
          isEarlyBird ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
        }`;
        badge.textContent = isEarlyBird ? 'EARLY BIRD' : 'REGULAR';
      }
    }
  }

  /** Fills the hidden `gpx_filename` of the card that owns the drop zone. */
  handleGpxEvent(event: Event): void {
    const detail = (event as CustomEvent<{ gpxFilename?: string }>).detail ?? {};
    const card = (event.target as HTMLElement | null)?.closest?.('.distance-card');
    if (!card) return;
    const hidden = card.querySelector<HTMLInputElement>('[data-name="gpx_filename"]');
    if (hidden) hidden.value = detail.gpxFilename ?? '';
  }

  handleGlobalChanges(_event: Event): void {
    // Future hook — kept minimal.
  }

  addItem(
    containerId: string,
    tplId: string,
    prefix: string,
    options: { typeId?: string; km?: string; label?: string } = {},
  ): HTMLElement | null {
    const container = document.getElementById(containerId);
    const template = document.getElementById(tplId) as HTMLTemplateElement | null;
    if (!container || !template) return null;

    const clone = template.content.cloneNode(true) as DocumentFragment;
    const card = clone.querySelector('.distance-card, .card') as HTMLElement | null;
    if (!card) return null;

    const id = crypto.randomUUID().split('-')[0];
    card.dataset.id = id;

    if (options.label) {
      const title = card.querySelector('.dist-title');
      if (title) title.textContent = options.label;
    }

    card.querySelectorAll('input, select, textarea').forEach((element) => {
      const field = (element as HTMLElement).dataset.name;
      if (!field) return;

      // El template de awards tiene un input por lugar: se nombran como array
      // (`prize_amounts[]`) para que el backend reciba un solo campo.
      if (tplId === 'category-tpl' && field === 'prize_amount') {
        (element as HTMLInputElement).name = `${prefix}[${id}][prize_amounts][]`;
      } else {
        (element as HTMLInputElement).name = `${prefix}[${id}][${field}]`;
      }
      if (tplId === 'category-tpl' && field === 'distance_id') {
        this.populateDistanceSelect(element as HTMLSelectElement);
      }
      if (field === 'distance_type_id' && options.typeId) {
        (element as HTMLInputElement).value = options.typeId;
      }
    });

    if (tplId === 'kit-tpl') {
      const slot = card.querySelector<HTMLElement>('[data-name="kit_icon_bar"]');
      const hidden = card.querySelector<HTMLInputElement>('[data-name="icon"]');
      if (slot && hidden) renderKitIconBar(slot, hidden);
    }
    if (tplId === 'price-stage-tpl') {
      const eventDateElement = this.form!.querySelector<HTMLInputElement>('#event_date');
      syncPriceStageDates(card, eventDateElement);
    }
    if (tplId === 'category-tpl') {
      wirePlacesSelector(card);
    }

    container.appendChild(clone);
    this.onUIChange();
    return card;
  }

  onUIChange(): void {
    this.checkEmptyStates();
    this.updateCategoryButtonState();
    this.form!.querySelectorAll<HTMLSelectElement>('[data-name="distance_id"]').forEach((select) => {
      this.populateDistanceSelect(select);
    });
  }

  populateDistanceSelect(select: HTMLSelectElement): void {
    const currentValue = select.value;
    select.innerHTML = '<option value="">Seleccionar distancia…</option>';
    const distanceTypes = getDistanceTypes();
    this.form!.querySelectorAll<HTMLElement>('#distances-container .distance-card').forEach((card) => {
      const typeId = card.querySelector<HTMLSelectElement>('[data-name="distance_type_id"]')?.value;
      const type = typeId ? distanceTypes.find((candidate) => candidate.id === typeId) : null;
      const label = type ? `${type.name} (${type.km} km)` : 'Distancia sin tipo';
      select.add(new Option(label, card.dataset.id || ''));
    });
    select.value = currentValue;
  }

  checkEmptyStates(): void {
    for (const [containerId, messageId] of Object.entries(EMPTY_STATE_MESSAGES)) {
      const container = document.getElementById(containerId);
      const message = document.getElementById(messageId);
      if (container && message) {
        message.style.display = container.children.length === 0 ? 'block' : 'none';
      }
    }
  }

  updateCategoryButtonState(): void {
    const hasDistances =
      this.form!.querySelectorAll('#distances-container .distance-card').length > 0;

    const buttonIds = ['add-category-btn', 'add-price-stage-btn', 'add-early-bird-btn'];
    buttonIds.forEach((id) => {
      const button = document.getElementById(id) as HTMLButtonElement | null;
      if (!button) return;
      button.disabled = !hasDistances;
      button.classList.toggle('opacity-50', !hasDistances);
      button.classList.toggle('cursor-not-allowed', !hasDistances);
    });
  }

  /** Pre-populate sub-resource cards from `data-initial-subresources` (edit mode). */
  hydrateFromInitialData(): void {
    if (!this.form || !this.isEditing) return;
    const raw = this.form.dataset.initialSubresources;
    if (!raw) return;

    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      return;
    }

    (data.distances || []).forEach((distance: any) => {
      const card = this.addItem('distances-container', 'distance-tpl', 'distances', {
        typeId: distance.distance_type_id,
        km: distance.km ? String(distance.km) : '',
        label: distance.km ? `${distance.km}K` : 'Distancia',
      });
      if (!card) return;
      this.setInputValue(card, 'capacity', distance.capacity ? String(distance.capacity) : '');
      this.setInputValue(card, 'surface', distance.surface || 'asphalt');
    });

    (data.pricing_stages || []).forEach((stage: any) => {
      const card = this.addItem('pricing-stages-container', 'price-stage-tpl', 'pricing_stages');
      if (!card) return;
      this.setInputValue(card, 'distance_id', stage.distance_id || '');
      this.setInputValue(card, 'name', stage.name || '');
      this.setInputValue(card, 'price', stage.price ? String(stage.price) : '');
      this.setInputValue(card, 'start_date', stage.start_date || '');
      this.setInputValue(card, 'end_date', stage.end_date || '');
      const earlyBird = card.querySelector<HTMLInputElement>('[data-name="is_early_bird"]');
      if (earlyBird) earlyBird.checked = !!stage.is_early_bird;
    });

    (data.sponsors || []).forEach((sponsor: any) => {
      const card = this.addItem('sponsors-container', 'sponsor-tpl', 'sponsors');
      if (!card) return;
      this.setInputValue(card, 'name', sponsor.name || '');
      this.setInputValue(card, 'tier', sponsor.tier || '');
      this.setInputValue(card, 'logo_url', sponsor.logo_url || '');
    });

    (data.runner_kits || []).forEach((kit: any) => {
      const card = this.addItem('kits-container', 'kit-tpl', 'runner_kits');
      if (!card) return;
      this.setInputValue(card, 'name', kit.name || '');
      this.setInputValue(card, 'icon', kit.icon || '');
    });

    // Cada categoría trae prize_amounts[] con un monto por lugar. El template
    // genera 3 inputs; se ajusta num_places, se regeneran las filas y se
    // poblan los valores.
    (data.categories || []).forEach((category: any) => {
      const card = this.addItem('categories-container', 'category-tpl', 'categories');
      if (!card) return;
      this.setInputValue(card, 'distance_id', category.distance_id || '');
      this.setInputValue(card, 'age_category_id', category.age_category_id || '');
      this.setInputValue(card, 'gender', category.gender || 'general');

      const numPlaces =
        Number(category.num_places) || (category.prize_amounts || category.prizes || [0]).length || 1;
      this.setInputValue(card, 'num_places', String(numPlaces));
      const placesSelect = card.querySelector<HTMLSelectElement>('[data-name="num_places"]');
      if (placesSelect) {
        placesSelect.value = String(numPlaces);
        placesSelect.dispatchEvent(new Event('change'));
      }

      const amounts: number[] = Array.isArray(category.prize_amounts)
        ? category.prize_amounts
        : Array.isArray(category.prizes)
          ? category.prizes.map((prize: any) => Number(prize.prize_amount) || 0)
          : [Number(category.prize_amount) || 0];

      card.querySelectorAll<HTMLElement>('[data-prize-row]').forEach((row) => {
        const place = Number(row.dataset.place);
        const input = row.querySelector<HTMLInputElement>('input[data-name="prize_amount"]');
        if (input) input.value = String(amounts[place - 1] ?? 0);
      });
    });

    if ((data.registrations || []).length > 0) {
      this.toggleSection('registrations', true);
      const toggle = this.form.querySelector<HTMLInputElement>(
        '.optional-section-toggle[data-section="registrations"]',
      );
      if (toggle) toggle.checked = true;
      (data.registrations || []).forEach((location: any) => {
        const card = this.addItem('reg-locations-container', 'reg-tpl', 'registrations');
        if (!card) return;
        this.setInputValue(card, 'location_name', location.location_name || '');
        this.setInputValue(card, 'address', location.address || '');
      });
    }

    // El itinerario lo maneja el island de React (initialItems), no se hidrata acá.
    this.onUIChange();
  }

  setInputValue(parent: HTMLElement, dataName: string, value: string): void {
    const element = parent.querySelector<HTMLInputElement>(`[data-name="${dataName}"]`);
    if (element) element.value = value;
  }

  showGroupError(containerId: string, message: string, id: string): void {
    const container = document.getElementById(containerId);
    if (!container) return;
    document.getElementById(id)?.remove();
    const element = document.createElement('p');
    element.id = id;
    element.className = 'text-xs text-red-600 mt-2 p-2 bg-red-50 border border-red-200 rounded';
    element.textContent = message;
    container.prepend(element);
  }

  showValidationIssues(issues: { path: (string | number)[]; message: string }[]): void {
    for (const issue of issues) {
      const path = issue.path as string[];
      const message = issue.message as string;
      const firstKey = path[0] as string;

      if (firstKey === 'distances' && path.length === 1) {
        this.showGroupError('distances-container', message, 'distances-error');
        continue;
      }
      if (firstKey === 'pricing_stages' && path.length === 1) {
        this.showGroupError('pricing-stages-container', message, 'pricing-stages-error');
        continue;
      }
      if (firstKey === 'itinerary' && path.length === 1) {
        this.showGroupError('itinerary-container', message, 'itinerary-error');
        continue;
      }
      if (firstKey === 'runner_kits' && path.length === 1) {
        this.showGroupError('kits-container', message, 'runner-kits-error');
        continue;
      }

      if (Object.keys(CATEGORY_CONTAINER_IDS).includes(firstKey)) {
        if (path.length >= 2) {
          const [, itemId, field] = path;
          const container = document.getElementById(CATEGORY_CONTAINER_IDS[firstKey]);
          const card = container?.querySelector(`[data-id="${itemId}"]`);
          const fieldElement = card?.querySelector<HTMLElement>(`[data-name="${field}"]`);
          if (fieldElement) {
            fieldElement.classList.add('border-red-500', 'ring-1', 'ring-red-500');
            const error = document.createElement('p');
            error.id = `${itemId}-${field}-error`;
            error.className = 'text-xs text-red-500 mt-1';
            error.textContent = message;
            fieldElement.parentElement?.appendChild(error);
          }
        }
        continue;
      }

      showFieldError(firstKey, message);
    }
  }

  async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.form) return;

    clearAllFieldErrors();
    document.querySelectorAll('[id$="-error"]').forEach((element) => element.remove());

    const eventDate = this.form.querySelector<HTMLInputElement>('#event_date')?.value || '';
    const deadline = this.form.querySelector<HTMLInputElement>('#deadline')?.value || '';
    if (eventDate && deadline && deadline > eventDate.slice(0, 10)) {
      showFieldError(
        'deadline',
        'La fecha límite de inscripción no puede ser posterior a la fecha del evento.',
      );
      return;
    }

    const eventDateOnly = eventDate ? eventDate.slice(0, 10) : '';
    const priceCards = this.form.querySelectorAll<HTMLElement>('#pricing-stages-container .card');
    for (const card of priceCards) {
      const start = card.querySelector<HTMLInputElement>('[data-name="start_date"]')?.value;
      const end = card.querySelector<HTMLInputElement>('[data-name="end_date"]')?.value;
      if (start && end && end < start) {
        this.showGroupError(
          'pricing-stages-container',
          'La fecha de fin no puede ser anterior a la fecha de inicio.',
          'pricing-stages-error',
        );
        return;
      }
      if (end && eventDateOnly && end > eventDateOnly) {
        this.showGroupError(
          'pricing-stages-container',
          'La fecha de fin de la etapa de precio no puede ser posterior a la fecha y hora del evento.',
          'pricing-stages-error',
        );
        const endInput = card.querySelector<HTMLInputElement>('[data-name="end_date"]');
        if (endInput) {
          endInput.classList.add('border-red-500', 'ring-1', 'ring-red-500');
          endInput.setAttribute('aria-invalid', 'true');
        }
        return;
      }
    }

    const structured = collectEventFormData({
      form: this.form as HTMLFormElement,
      enabledSections: this.enabledSections,
    });

    // Coerce booleans → strings ANTES de validar (Zod espera "true"/"false").
    // Edit mode uses baseEventSchema, which does not validate sub-resources.
    if (!this.isEditing) coerceBooleanFlags(structured);

    const schema = this.isEditing
      ? baseEventSchema
      : buildEventSchema([...this.enabledSections, 'categories', 'runner_kits', 'sponsors']);

    const result = schema.safeParse(structured);
    if (!result.success) {
      console.warn('[edit] validation failed:', JSON.stringify(result.error.issues, null, 2));
      this.showValidationIssues(result.error.issues as { path: (string | number)[]; message: string }[]);
      return;
    }

    const submitButton = this.form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const submitLabel = this.isEditing ? 'Actualizar Evento' : 'Crear Evento';

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Guardando…';
      }

      const submission = buildEventSubmission(structured, {
        isEditing: this.isEditing,
        eventId: this.eventId,
      });

      const response = await fetch(submission.url, {
        method: submission.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission.payload),
      });
      const body = await response.json();

      if (!response.ok || body?.error) {
        const message =
          (body && typeof body.error === 'string' ? body.error : null) ||
          body?.error?.message ||
          body?.message ||
          'Error al guardar el evento';
        alert(message);
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = submitLabel;
        }
        return;
      }

      // El backend puede regenerar el slug: usamos el de la respuesta.
      const newSlug =
        (body && typeof body === 'object' && (body.slug || body?.data?.slug)) || this.slug;
      navigate(this.isEditing ? `/dashboard/events/${newSlug}` : '/dashboard/events');
    } catch (error) {
      console.error('Error al guardar evento:', error);
      alert('Ocurrió un error al guardar el evento');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = submitLabel;
      }
    }
  }
}

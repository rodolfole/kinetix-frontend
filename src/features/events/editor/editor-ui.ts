import {
  findEstado,
  findMunicipio,
  type MexicoDatasetEntry,
} from './municipio-matcher';

/**
 * Date rules shared by the event form editors:
 * - the registration deadline can never be after the event date
 * - a pricing stage cannot end before it starts nor after the event date
 */

const ERROR_CLASSES = ['border-red-500', 'ring-1', 'ring-red-500'];

/** Tope del input `#deadline` = fecha del evento. */
export function syncDeadlineMax(eventDate: HTMLInputElement, deadline: HTMLInputElement): void {
  function update() {
    if (!eventDate.value) return;
    // event_date es "YYYY-MM-DDTHH:MM"; deadline usa sólo "YYYY-MM-DD".
    const maxDateOnly = eventDate.value.slice(0, 10);
    deadline.max = maxDateOnly;
    if (deadline.value && deadline.value > maxDateOnly) {
      deadline.classList.add(...ERROR_CLASSES);
    } else {
      deadline.classList.remove(...ERROR_CLASSES);
    }
  }

  eventDate.addEventListener('change', update);
  eventDate.addEventListener('input', update);
  update();
}

/** `min`/`max` y marca visual de una etapa de precio. */
export function syncPriceStageDates(
  card: HTMLElement,
  eventDate: HTMLInputElement | null,
): void {
  const startInput = card.querySelector<HTMLInputElement>('[data-name="start_date"]');
  const endInput = card.querySelector<HTMLInputElement>('[data-name="end_date"]');
  if (!startInput || !endInput) return;
  const start: HTMLInputElement = startInput;
  const end: HTMLInputElement = endInput;

  const maxFromEvent = () => (eventDate && eventDate.value ? eventDate.value.slice(0, 10) : '');

  function sync() {
    end.min = start.value || '';
    const maxDate = maxFromEvent();
    if (maxDate) {
      end.max = maxDate;
    } else {
      end.removeAttribute('max');
    }

    const beyondMax = maxDate && end.value && end.value > maxDate;
    const beforeStart = start.value && end.value && end.value < start.value;
    if (beyondMax || beforeStart) {
      end.classList.add(...ERROR_CLASSES);
      end.setAttribute('aria-invalid', 'true');
      end.title = beyondMax
        ? 'La fecha de fin no puede ser posterior a la fecha del evento.'
        : 'La fecha de fin no puede ser anterior a la fecha de inicio.';
    } else {
      end.classList.remove(...ERROR_CLASSES);
      end.removeAttribute('aria-invalid');
      end.removeAttribute('title');
    }
  }

  start.addEventListener('change', sync);
  end.addEventListener('change', sync);
  if (eventDate) {
    eventDate.addEventListener('change', sync);
    eventDate.addEventListener('input', sync);
  }
  sync();
}

interface AddressSelectionDetail {
  state: string;
  municipality: string;
}

/**
 * Estado → Municipio cascade plus the auto-fill triggered by the address
 * picker island (`kinetix:address-selected` window event).
 */
export function wireEstadoMunicipioCascade(
  form: HTMLElement,
  mexico: MexicoDatasetEntry[] = JSON.parse(form.dataset.mexico ?? '[]'),
): void {
  const estado = form.querySelector<HTMLSelectElement>('#state');
  const muni = form.querySelector<HTMLSelectElement>('#municipality');
  if (!estado || !muni) return;

  function repopulateMunicipios(estadoNombre: string) {
    if (!muni) return;
    const found = mexico.find((entry) => entry.estado === estadoNombre);
    muni.innerHTML = '<option value="">Selecciona un municipio…</option>';
    if (found) {
      [...found.municipios]
        .sort((a, b) => a.localeCompare(b, 'es'))
        .forEach((municipio) => {
          const option = document.createElement('option');
          option.value = municipio;
          option.textContent = municipio;
          muni.appendChild(option);
        });
      muni.disabled = false;
      muni.classList.remove('bg-zinc-100', 'text-zinc-400', 'cursor-not-allowed');
    } else {
      muni.disabled = true;
      muni.classList.add('bg-zinc-100', 'text-zinc-400', 'cursor-not-allowed');
    }
  }

  estado.addEventListener('change', () => {
    repopulateMunicipios(estado.value);
  });

  window.addEventListener('kinetix:address-selected', (event: Event) => {
    const detail = (event as CustomEvent<AddressSelectionDetail>).detail || {
      state: '',
      municipality: '',
    };
    const estadoMatch = findEstado(detail.state, mexico);
    // Sin match no tocamos el form (no rompemos la selección manual).
    if (!estadoMatch) return;

    if (estado.value !== estadoMatch) {
      estado.value = estadoMatch;
    }
    repopulateMunicipios(estadoMatch);

    const municipioMatch = findMunicipio(estadoMatch, detail.municipality, mexico);
    if (municipioMatch) muni.value = municipioMatch;
  });
}

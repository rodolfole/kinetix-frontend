/**
 * Applies the event's participant field config to the registration form:
 * disabled fields are dropped from the DOM flow, required fields get the
 * required/aria-required markers so the browser validation matches what the
 * backend enforces (PLAN-11 T2).
 */
export type ParticipantFieldConfig = {
  field_name: string;
  is_enabled: boolean;
  is_required: boolean;
};

export type FieldRequirementsSummary = { disabled: number; required: number };

export function applyFieldRequirements(
  form: HTMLFormElement | null,
  config: ParticipantFieldConfig[] | null | undefined,
): FieldRequirementsSummary {
  if (!form || !Array.isArray(config)) return { disabled: 0, required: 0 };

  let disabled = 0;
  let required = 0;

  for (const field of config) {
    const control = form.querySelector<HTMLElement>(`[name="${field.field_name}"]`);
    if (!control) continue;

    if (!field.is_enabled) {
      control.setAttribute('disabled', '');
      control.setAttribute('aria-disabled', 'true');
      disabled++;
      continue;
    }
    if (field.is_required) {
      control.setAttribute('required', '');
      control.setAttribute('aria-required', 'true');
      // every required field needs an accessible label marker
      const label = form.querySelector<HTMLLabelElement>(`label[for="${control.id}"]`);
      if (label && !label.dataset.requiredMarked) {
        const star = document.createElement('span');
        star.className = 'text-error';
        star.setAttribute('aria-hidden', 'true');
        star.textContent = ' *';
        label.appendChild(star);
        label.dataset.requiredMarked = 'true';
      }
      required++;
    }
  }

  return { disabled, required };
}

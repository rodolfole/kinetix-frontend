// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { applyFieldRequirements } from './field-requirements';

function formWith(names: string[]): HTMLFormElement {
  document.body.innerHTML = `
    <form id="register-form">
      ${names
        .map(
          (n) => `
        <div>
          <label for="f-${n}">Campo ${n}</label>
          <input id="f-${n}" name="${n}" />
        </div>`,
        )
        .join('')}
    </form>`;
  return document.querySelector<HTMLFormElement>('#register-form')!;
}

describe('applyFieldRequirements', () => {
  it('marks required fields and their labels', () => {
    const form = formWith(['country', 'email']);
    const summary = applyFieldRequirements(form, [
      { field_name: 'country', is_enabled: true, is_required: true },
      { field_name: 'email', is_enabled: true, is_required: false },
    ]);
    const country = form.querySelector<HTMLInputElement>('input[name="country"]')!;
    expect(country.required).toBe(true);
    expect(country.getAttribute('aria-required')).toBe('true');
    expect(form.querySelector('label[for="f-country"] .text-error')).toBeTruthy();
    expect(form.querySelector('label[for="f-email"] .text-error')).toBeFalsy();
    expect(summary).toEqual({ disabled: 0, required: 1 });
  });

  it('disables fields the event does not collect', () => {
    const form = formWith(['medical_info', 'country']);
    const summary = applyFieldRequirements(form, [
      { field_name: 'medical_info', is_enabled: false, is_required: false },
      { field_name: 'country', is_enabled: true, is_required: true },
    ]);
    const medical = form.querySelector<HTMLInputElement>('input[name="medical_info"]')!;
    expect(medical.disabled).toBe(true);
    expect(summary).toEqual({ disabled: 1, required: 1 });
  });

  it('is a no-op without a form or config', () => {
    expect(applyFieldRequirements(null, [{ field_name: 'country', is_enabled: true, is_required: true }])).toEqual({
      disabled: 0,
      required: 0,
    });
    const form = formWith(['country']);
    expect(applyFieldRequirements(form, undefined)).toEqual({ disabled: 0, required: 0 });
    expect(form.querySelector<HTMLInputElement>('input[name="country"]')!.required).toBe(false);
  });

  it('skips controls that are not present in the form', () => {
    const form = formWith(['country']);
    const summary = applyFieldRequirements(form, [
      { field_name: 'waiver_signed_at', is_enabled: true, is_required: true },
    ]);
    expect(summary).toEqual({ disabled: 0, required: 0 });
  });
});

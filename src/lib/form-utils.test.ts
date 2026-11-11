// @vitest-environment happy-dom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  showFieldError,
  clearAllFieldErrors,
  setupFieldErrorListeners,
} from './form-utils';

beforeEach(() => {
  document.body.innerHTML = '';
});

function makeInput(id: string) {
  const input = document.createElement('input');
  input.id = id;
  document.body.appendChild(input);
  return input;
}

describe('showFieldError', () => {
  it('no-ops when input not found', () => {
    expect(() => showFieldError('does-not-exist', 'msg')).not.toThrow();
  });

  it('applies error classes and creates error message', () => {
    const input = makeInput('email');
    showFieldError('email', 'Invalid email');
    expect(input.classList.contains('border-red-500')).toBe(true);
    expect(input.classList.contains('ring-red-500')).toBe(true);
    expect(input.classList.contains('border-input')).toBe(false);
    const err = document.getElementById('email-error');
    expect(err).not.toBeNull();
    expect(err?.textContent).toBe('Invalid email');
  });

  it('updates existing error message instead of duplicating', () => {
    makeInput('email');
    showFieldError('email', 'first');
    showFieldError('email', 'second');
    const errors = document.querySelectorAll('#email-error');
    expect(errors.length).toBe(1);
    expect(errors[0].textContent).toBe('second');
  });
});

describe('clearAllFieldErrors', () => {
  it('removes error classes and error elements', () => {
    const a = makeInput('a');
    const b = makeInput('b');
    showFieldError('a', 'eA');
    showFieldError('b', 'eB');
    expect(document.querySelectorAll('[id$="-error"]').length).toBe(2);

    clearAllFieldErrors();

    expect(a.classList.contains('border-red-500')).toBe(false);
    expect(b.classList.contains('border-red-500')).toBe(false);
    expect(document.querySelectorAll('[id$="-error"]').length).toBe(0);
  });
});

describe('setupFieldErrorListeners', () => {
  it('no-ops when form not found', () => {
    expect(() => setupFieldErrorListeners('#missing')).not.toThrow();
  });

  it('binds input listeners on every field inside the form', () => {
    document.body.innerHTML = `
      <form id="registration-form">
        <input id="a" />
        <input id="b" />
        <select id="c"></select>
        <textarea id="d"></textarea>
      </form>
    `;
    setupFieldErrorListeners();

    showFieldError('a', 'err');
    const a = document.getElementById('a')!;
    a.dispatchEvent(new Event('input'));

    expect(a.classList.contains('border-red-500')).toBe(false);
    expect(document.getElementById('a-error')).toBeNull();
  });
});

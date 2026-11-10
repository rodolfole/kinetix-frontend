import { describe, it, expect, vi } from 'vitest';
import { submitRegistration, eventSlugFromPath } from './submit-registration';

const values = { first_name: 'Ana', t_shirt_size: '', medical_conditions: '', event_id: 'e1' };

describe('submitRegistration', () => {
  it('calls the registration action with empty fields stripped and returns the exito redirect', async () => {
    const submit = vi.fn().mockResolvedValue({ data: { id: 'r1' }, error: undefined });
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const result = await submitRegistration(submit, values, 'mi-carrera');

    expect(submit).toHaveBeenCalledWith({ first_name: 'Ana', event_id: 'e1' });
    expect(result).toEqual({ ok: true, redirectTo: '/events/mi-carrera/registration/exito' });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('returns the action error message and no redirect on failure', async () => {
    const submit = vi.fn().mockResolvedValue({ data: undefined, error: { code: 'UNAUTHORIZED', message: 'Inicia sesión' } });
    const result = await submitRegistration(submit, values, 'mi-carrera');
    expect(result).toEqual({ ok: false, message: 'Inicia sesión' });
  });
});

describe('eventSlugFromPath', () => {
  it('extracts the slug from /events/<slug>/registration', () => {
    expect(eventSlugFromPath('/events/mi-carrera/registration')).toBe('mi-carrera');
  });
  it('returns null for other paths', () => {
    expect(eventSlugFromPath('/dashboard')).toBeNull();
  });
});

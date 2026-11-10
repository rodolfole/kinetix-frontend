import { describe, it, expect } from 'vitest';
import {
  personalInfoSchema,
  raceInfoSchema,
  registrationSchema,
} from './registration.schema';

describe('personalInfoSchema', () => {
  const baseValid = {
    first_name: 'Ana',
    last_name: 'López',
    second_last_name: 'Pérez',
    birth_date: '1990-05-12',
    gender: 'female' as const,
    phone: '5512345678',
    email: 'a@example.com',
  };

  it('accepts valid personal info', () => {
    const r = personalInfoSchema.safeParse(baseValid);
    expect(r.success).toBe(true);
  });

  it('rejects empty first_name', () => {
    const r = personalInfoSchema.safeParse({ ...baseValid, first_name: '' });
    expect(r.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const r = personalInfoSchema.safeParse({ ...baseValid, email: 'not-email' });
    expect(r.success).toBe(false);
  });

  it('rejects short phone', () => {
    const r = personalInfoSchema.safeParse({ ...baseValid, phone: '123' });
    expect(r.success).toBe(false);
  });

  it('rejects invalid gender', () => {
    const r = personalInfoSchema.safeParse({ ...baseValid, gender: 'unknown' });
    expect(r.success).toBe(false);
  });
});

describe('raceInfoSchema', () => {
  const baseValid = {
    event_id: 'a1b2c3d4-e5f6-4789-89ab-cdef01234567',
    distance_id: 'd1',
  };

  it('accepts minimal valid race info', () => {
    const r = raceInfoSchema.safeParse(baseValid);
    expect(r.success).toBe(true);
  });

  it('rejects invalid event_id (not a UUID)', () => {
    const r = raceInfoSchema.safeParse({ ...baseValid, event_id: 'not-a-uuid' });
    expect(r.success).toBe(false);
  });

  it('rejects empty distance_id', () => {
    const r = raceInfoSchema.safeParse({ ...baseValid, distance_id: '' });
    expect(r.success).toBe(false);
  });

  it('accepts optional t_shirt_size in valid enum', () => {
    const r = raceInfoSchema.safeParse({ ...baseValid, t_shirt_size: 'L' });
    expect(r.success).toBe(true);
  });

  it('rejects invalid t_shirt_size', () => {
    const r = raceInfoSchema.safeParse({ ...baseValid, t_shirt_size: 'XXXL' });
    expect(r.success).toBe(false);
  });
});

describe('registrationSchema (merged)', () => {
  const baseValid = {
    first_name: 'Ana',
    last_name: 'López',
    second_last_name: 'Pérez',
    birth_date: '1990-05-12',
    gender: 'female' as const,
    phone: '5512345678',
    email: 'a@example.com',
    event_id: 'a1b2c3d4-e5f6-4789-89ab-cdef01234567',
    distance_id: 'd1',
  };

  it('accepts valid full registration', () => {
    const r = registrationSchema.safeParse(baseValid);
    expect(r.success).toBe(true);
  });

  it('rejects when personal info invalid even if race info valid', () => {
    const r = registrationSchema.safeParse({ ...baseValid, email: 'not-email' });
    expect(r.success).toBe(false);
  });
});

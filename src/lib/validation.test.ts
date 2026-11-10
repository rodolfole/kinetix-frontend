import { describe, it, expect } from 'vitest';
import {
  validatePassword,
  loginSchema,
  registerSchema,
  organizerRegisterSchema,
  eventDistanceSchema,
} from './validation';

describe('validatePassword', () => {
  it('rejects empty', () => {
    expect(validatePassword('')).toBe('Password is required');
  });

  it('rejects too short', () => {
    expect(validatePassword('Aa1')).toBe('Minimum 8 characters');
  });

  it('rejects no uppercase', () => {
    expect(validatePassword('abcdefg1')).toBe('Must include at least one uppercase');
  });

  it('rejects no lowercase', () => {
    expect(validatePassword('ABCDEFG1')).toBe('Must include at least one lowercase');
  });

  it('rejects no digit', () => {
    expect(validatePassword('Abcdefgh')).toBe('Must include at least one number');
  });

  it('accepts valid password', () => {
    expect(validatePassword('Abcdefg1')).toBeNull();
    expect(validatePassword('Str0ngPass')).toBeNull();
  });
});

describe('loginSchema', () => {
  it('accepts valid login', () => {
    const r = loginSchema.safeParse({ email: 'user@example.com', password: 'x' });
    expect(r.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const r = loginSchema.safeParse({ email: 'not-an-email', password: 'x' });
    expect(r.success).toBe(false);
  });

  it('rejects empty password', () => {
    const r = loginSchema.safeParse({ email: 'user@example.com', password: '' });
    expect(r.success).toBe(false);
  });
});

describe('registerSchema', () => {
  const baseValid = {
    first_name: 'Ana',
    last_name: 'López',
    second_last_name: 'Pérez',
    birth_date: '1990-05-12',
    gender: 'female' as const,
    phone: '5512345678',
    email: 'a@example.com',
    confirm_email: 'a@example.com',
    password: 'secret1A',
  };

  it('accepts valid registration', () => {
    const r = registerSchema.safeParse(baseValid);
    expect(r.success).toBe(true);
  });

  it('rejects when emails do not match', () => {
    const r = registerSchema.safeParse({ ...baseValid, confirm_email: 'different@example.com' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].path[0]).toBe('confirm_email');
  });

  it('rejects invalid gender', () => {
    const r = registerSchema.safeParse({ ...baseValid, gender: 'unknown' });
    expect(r.success).toBe(false);
  });

  it('rejects short phone', () => {
    const r = registerSchema.safeParse({ ...baseValid, phone: '123' });
    expect(r.success).toBe(false);
  });

  it('keeps the custom gender message', () => {
    const r = registerSchema.safeParse({ ...baseValid, gender: 'unknown' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe('Selecciona un género válido');
  });
});

describe('eventDistanceSchema', () => {
  const baseValid = { distance_type_id: 'dt1', capacity: '10', surface: 'asphalt' as const };

  it('accepts a valid distance', () => {
    const r = eventDistanceSchema.safeParse(baseValid);
    expect(r.success).toBe(true);
  });

  it('keeps the custom surface message', () => {
    const r = eventDistanceSchema.safeParse({ ...baseValid, surface: 'mud' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe('Selecciona una superficie válida');
  });
});

describe('organizerRegisterSchema', () => {
  const baseValid = {
    email: 'org@example.com',
    password: 'StrongP4ss',
    business_name: 'Race Co',
    brand_name: 'RaceCo',
    rfc: 'ABC123456789',
    billing_zip_code: '12345',
    billing_state: 'CDMX',
    billing_city: 'CDMX',
    contact_name: 'Contact Person',
    contact_email: 'contact@example.com',
    contact_phone: '5512345678',
    logo_url: '',
  };

  it('accepts valid organizer registration', () => {
    const r = organizerRegisterSchema.safeParse(baseValid);
    expect(r.success).toBe(true);
  });

  it('rejects too-short RFC', () => {
    const r = organizerRegisterSchema.safeParse({ ...baseValid, rfc: '123' });
    expect(r.success).toBe(false);
  });

  it('rejects too-long RFC', () => {
    const r = organizerRegisterSchema.safeParse({ ...baseValid, rfc: 'A'.repeat(20) });
    expect(r.success).toBe(false);
  });

  it('rejects invalid contact email', () => {
    const r = organizerRegisterSchema.safeParse({ ...baseValid, contact_email: 'not-email' });
    expect(r.success).toBe(false);
  });
});

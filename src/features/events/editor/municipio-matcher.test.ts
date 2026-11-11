// Fuzzy Estado/Municipio matching used to auto-fill the event location selects
// from the Nominatim address picker. Extracted from the page inline script.
import { describe, it, expect } from 'vitest';
import { findEstado, findMunicipio, normalizeLocationName } from './municipio-matcher';

const MEXICO = [
  { estado: 'Jalisco', municipios: ['Guadalajara', 'Puerto Vallarta', 'Arandas'] },
  { estado: 'Nuevo León', municipios: ['Monterrey', 'Centro (Villahermosa)'] },
  { estado: 'Ciudad de México', municipios: ['Coyoacán'] },
];

describe('normalizeLocationName', () => {
  it('lowercases, strips accents, parentheses and punctuation', () => {
    expect(normalizeLocationName('Guadalajara Metropolitan Area')).toBe('guadalajara metropolitan area');
    expect(normalizeLocationName('Coyoacán')).toBe('coyoacan');
    expect(normalizeLocationName('Centro (Villahermosa)')).toBe('centro');
    expect(normalizeLocationName('Nuevo León, México')).toBe('nuevo leon mexico');
  });

  it('returns an empty string for empty input', () => {
    expect(normalizeLocationName('')).toBe('');
    expect(normalizeLocationName(undefined as unknown as string)).toBe('');
  });
});

describe('findEstado', () => {
  it('matches an exact state name ignoring case and accents', () => {
    expect(findEstado('jalisco', MEXICO)).toBe('Jalisco');
    expect(findEstado('NUEVO LEON', MEXICO)).toBe('Nuevo León');
  });

  it('matches a state contained in a longer Nominatim string', () => {
    expect(findEstado('Guadalajara, Jalisco, México', MEXICO)).toBe('Jalisco');
  });

  it('returns null when nothing matches', () => {
    expect(findEstado('Texas', MEXICO)).toBeNull();
    expect(findEstado('', MEXICO)).toBeNull();
  });
});

describe('findMunicipio', () => {
  it('matches an exact municipality ignoring case and accents', () => {
    expect(findMunicipio('Jalisco', 'guadalajara', MEXICO)).toBe('Guadalajara');
    expect(findMunicipio('Ciudad de México', 'coyoacan', MEXICO)).toBe('Coyoacán');
  });

  it('matches a municipality contained in the raw string', () => {
    expect(findMunicipio('Jalisco', 'Puerto Vallarta Centro', MEXICO)).toBe('Puerto Vallarta');
  });

  it('matches when the raw string is contained in the municipality', () => {
    expect(findMunicipio('Nuevo León', 'Centro', MEXICO)).toBe('Centro (Villahermosa)');
  });

  it('returns null for an unknown estado or municipality', () => {
    expect(findMunicipio('Texas', 'Austin', MEXICO)).toBeNull();
    expect(findMunicipio('Jalisco', 'Monterrey', MEXICO)).toBeNull();
  });
});

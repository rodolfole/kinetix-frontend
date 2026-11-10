import { describe, it, expect } from 'vitest';
import { generateSlug } from './slug';

describe('generateSlug', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(generateSlug('Maratón de Arandas')).toBe('maraton-de-arandas');
  });

  it('strips accents', () => {
    expect(generateSlug('Corriéndón')).toBe('corriendon');
    expect(generateSlug('Niños')).toBe('ninos');
  });

  it('removes special characters but keeps hyphens', () => {
    expect(generateSlug('Hello, World!')).toBe('hello-world');
    expect(generateSlug('a@b#c')).toBe('abc');
  });

  it('collapses multiple hyphens', () => {
    expect(generateSlug('foo  --  bar')).toBe('foo-bar');
  });

  it('trims leading and trailing hyphens', () => {
    expect(generateSlug('  --hello--  ')).toBe('hello');
  });

  it('returns empty string for empty input', () => {
    expect(generateSlug('')).toBe('');
  });

  it('returns empty for only-special input', () => {
    expect(generateSlug('!!!')).toBe('');
    expect(generateSlug('   ')).toBe('');
  });

  it('keeps numbers', () => {
    expect(generateSlug('10K Valencia 2026')).toBe('10k-valencia-2026');
  });
});

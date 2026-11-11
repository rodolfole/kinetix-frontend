// The field-config editor used to live in the event page inline script. The
// diff between "what the user toggled" and "what the backend stores" is pure
// logic; these tests pin the payload sent to the backend and the reading of
// the backend response.
import { describe, it, expect } from 'vitest';
import { EVENT_FIELD_SECTIONS } from '@features/events/consts/field-sections';
import {
  ALWAYS_ON_SECTIONS,
  OPT_TO_BACKEND,
  buildFieldConfigSections,
  parseDisabledSections,
} from './field-config';

describe('buildFieldConfigSections', () => {
  it('returns one entry per field section, in the catalog order', () => {
    const sections = buildFieldConfigSections([]);
    expect(sections.map((s) => s.section_name)).toEqual(
      EVENT_FIELD_SECTIONS.map((s) => s.section_name),
    );
  });

  it('keeps categories, sponsors and runner_kits enabled even when nothing is toggled', () => {
    const sections = buildFieldConfigSections([]);
    const enabled = sections.filter((s) => s.is_enabled).map((s) => s.section_name);

    expect(ALWAYS_ON_SECTIONS).toEqual(['categories', 'sponsors', 'runner_kits']);
    expect(enabled).toEqual(['categories', 'sponsors', 'runner_kits']);
  });

  it('enables exactly the toggled optional sections', () => {
    const sections = buildFieldConfigSections(['registrations', 'risks']);
    const enabled = sections.filter((s) => s.is_enabled).map((s) => s.section_name);

    expect(enabled).toEqual(['categories', 'sponsors', 'runner_kits', 'registrations', 'risks']);
    expect(sections.find((s) => s.section_name === 'judges')?.is_enabled).toBe(false);
  });

  it('accepts a Set as the enabled-section source', () => {
    const sections = buildFieldConfigSections(new Set(['transit']));
    expect(sections.find((s) => s.section_name === 'transit')?.is_enabled).toBe(true);
  });
});

describe('parseDisabledSections', () => {
  it('returns the internal names of sections the backend disabled', () => {
    const disabled = parseDisabledSections([
      { section_name: 'registrations', is_enabled: false },
      { section_name: 'rules', is_enabled: false },
      { section_name: 'risks', is_enabled: true },
    ]);

    expect(disabled).toEqual(['registrations', 'rules']);
  });

  it('ignores sections that are always on (they cannot be disabled)', () => {
    const disabled = parseDisabledSections([
      { section_name: 'categories', is_enabled: false },
      { section_name: 'sponsors', is_enabled: false },
    ]);

    expect(disabled).toEqual([]);
  });

  it('ignores unknown section names from the backend', () => {
    const disabled = parseDisabledSections([{ section_name: 'not_a_section', is_enabled: false }]);
    expect(disabled).toEqual([]);
  });

  it('treats a missing is_enabled flag as not disabled', () => {
    const disabled = parseDisabledSections([{ section_name: 'judges' }]);
    expect(disabled).toEqual([]);
  });

  it('maps backend section names to internal toggle names', () => {
    // OPT_TO_BACKEND is the internal → backend map today (identity for the
    // optional sections); the parser must use its inverse.
    expect(OPT_TO_BACKEND.registrations).toBe('registrations');
    expect(parseDisabledSections([{ section_name: 'transit', is_enabled: false }])).toEqual([
      'transit',
    ]);
  });
});

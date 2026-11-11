import { EVENT_FIELD_SECTIONS } from '@features/events/consts/field-sections';

/**
 * Field-config editor logic for the event page.
 *
 * `event_field_config` stores one row per toggleable section. Categories, the
 * runner kit and sponsors are always present in every event, so they are
 * persisted as enabled no matter what the user toggled.
 */

/** Internal toggle name → `section_name` persisted by the backend. */
export const OPT_TO_BACKEND: Record<string, string> = {
  registrations: 'registrations',
  rules: 'rules',
  risks: 'risks',
  judges: 'judges',
  transit: 'transit',
};

/** Sections that are always enabled and are not rendered as toggles. */
export const ALWAYS_ON_SECTIONS = ['categories', 'sponsors', 'runner_kits'] as const;

export interface FieldConfigSection {
  section_name: string;
  is_enabled: boolean;
}

export interface BackendFieldConfig {
  section_name: string;
  is_enabled?: boolean;
}

/** Payload for `event.updateFieldConfig` — one entry per known field section. */
export function buildFieldConfigSections(enabled: Iterable<string>): FieldConfigSection[] {
  const enabledNames = new Set(enabled);
  return EVENT_FIELD_SECTIONS.map((section) => ({
    section_name: section.section_name,
    is_enabled:
      (ALWAYS_ON_SECTIONS as readonly string[]).includes(section.section_name) ||
      enabledNames.has(section.section_name),
  }));
}

/**
 * Internal toggle names the backend reports as disabled. Always-on and
 * unknown sections are ignored, and a missing flag counts as enabled.
 */
export function parseDisabledSections(
  configs: BackendFieldConfig[] | null | undefined,
  optToBackend: Record<string, string> = OPT_TO_BACKEND,
): string[] {
  const backendToOpt: Record<string, string> = {};
  for (const [optName, backendName] of Object.entries(optToBackend)) {
    backendToOpt[backendName] = optName;
  }

  const disabled: string[] = [];
  for (const config of configs ?? []) {
    if (config?.is_enabled !== false) continue;
    const optName = backendToOpt[config.section_name];
    if (!optName) continue;
    disabled.push(optName);
  }
  return disabled;
}

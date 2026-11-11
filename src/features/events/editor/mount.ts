import { EventPageManager } from './event-page-manager';

/**
 * Boots the event editor. Idempotent per form element: the layout uses Astro's
 * ClientRouter, so both the initial script run and `astro:page-load` (after a
 * view transition) can reach this without initialising the form twice.
 */
const mountedForms = new WeakSet<HTMLElement>();

export function mountEventEditor(): EventPageManager | null {
  const form = document.getElementById('event-form');
  if (!form || mountedForms.has(form)) return null;
  mountedForms.add(form);
  return new EventPageManager(form);
}

document.addEventListener('astro:page-load', () => {
  mountEventEditor();
});

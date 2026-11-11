import { actions } from 'astro:actions';
import { initRouteLists } from './route-list.client';

/**
 * Boots the server-rendered route list: wires the delete buttons to the
 * `event.deleteRoute` action. Kept separate from `route-list.client.ts` so the
 * delete logic is unit tested without the Astro action runtime.
 */
initRouteLists(document, {
  confirm: (message) => window.confirm(message),
  deleteRoute: (id) => actions.event.deleteRoute({ id }),
  reload: () => window.location.reload(),
});

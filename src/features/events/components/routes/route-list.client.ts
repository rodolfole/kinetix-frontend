/**
 * Delete behaviour of the server-rendered route list (PLAN-11 T10.2).
 *
 * The list markup comes from `RouteList.astro`; this module only handles the
 * destructive action: confirm → delete through the event action → remove the
 * row, refresh the counter and reload so the server-rendered state wins.
 */

export const DELETE_CONFIRM_MESSAGE =
  'Esta accion eliminara la ruta permanentemente. Estas seguro?';

export const DELETE_ERROR_FALLBACK = 'Error al eliminar la ruta';
export const CONNECTION_ERROR_FALLBACK = 'Error de conexion';

interface ActionLikeError {
  message?: string;
}

export interface DeleteRouteResult {
  data?: unknown;
  error?: ActionLikeError | null;
}

export interface RouteListDeps {
  confirm: (message: string) => boolean;
  deleteRoute: (id: string) => Promise<DeleteRouteResult>;
  reload: () => void;
}

export interface RouteListController {
  destroy(): void;
}

const errorBoxOf = (root: HTMLElement) =>
  root.querySelector<HTMLElement>('[data-route-list-error]');

const updateCounter = (root: HTMLElement) => {
  const counter = root.querySelector<HTMLElement>('[data-route-list-count]');
  if (!counter) return;
  const total = root.querySelectorAll('[data-route-row]').length;
  counter.textContent =
    total === 1 ? '1 ruta registrada' : `${total} rutas registradas`;
};

export function createRouteListController(
  root: HTMLElement,
  deps: RouteListDeps,
): RouteListController {
  const showError = (message: string) => {
    const box = errorBoxOf(root);
    if (!box) return;
    box.textContent = message;
    box.hidden = false;
  };

  const clearError = () => {
    const box = errorBoxOf(root);
    if (!box) return;
    box.textContent = '';
    box.hidden = true;
  };

  const onClick = async (event: Event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      '[data-route-delete]',
    );
    if (!button || button.disabled) return;

    const id = button.dataset.routeDelete || '';
    if (!id) return;
    if (!deps.confirm(DELETE_CONFIRM_MESSAGE)) return;

    clearError();
    button.disabled = true;

    try {
      const result = await deps.deleteRoute(id);

      if (result?.error) {
        showError(result.error.message || DELETE_ERROR_FALLBACK);
        button.disabled = false;
        return;
      }

      const row = root.querySelector(`[data-route-row][data-route-id="${id}"]`);
      row?.remove();
      updateCounter(root);
      deps.reload();
    } catch (error: any) {
      showError(error?.message || CONNECTION_ERROR_FALLBACK);
      button.disabled = false;
    }
  };

  root.addEventListener('click', onClick);

  return {
    destroy() {
      root.removeEventListener('click', onClick);
    },
  };
}

/**
 * Wires every `[data-route-list]` on the page. The action call is injected by
 * `route-list.boot.ts` so this module stays testable outside the Astro runtime.
 */
export function initRouteLists(doc: Document = document, deps?: RouteListDeps): number {
  const roots = Array.from(doc.querySelectorAll<HTMLElement>('[data-route-list]'));
  if (roots.length === 0 || !deps) return 0;

  for (const root of roots) {
    createRouteListController(root, {
      confirm: deps.confirm,
      deleteRoute: deps.deleteRoute,
      reload: deps.reload,
    });
  }

  return roots.length;
}

// @vitest-environment happy-dom
// T10.2: `RouteList` used to be a `client:load` React island. It is now
// server-rendered markup plus this small script; these tests drive the delete
// flow through the DOM (the public interface the user clicks).
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  DELETE_CONFIRM_MESSAGE,
  createRouteListController,
  initRouteLists,
} from './route-list.client';

const ROUTES = [
  { id: 'r1', name: 'Ruta 10K', distance_id: 'd1', total_distance_km: 10.2 },
  { id: 'r2', name: 'Ruta 21K', distance_id: '', total_distance_km: 21.1 },
];

function mountList(routes = ROUTES): HTMLElement {
  const rows = routes
    .map(
      (route) => `
      <tr data-route-row data-route-id="${route.id}">
        <td>${route.name}</td>
        <td><button type="button" data-route-delete="${route.id}" title="Eliminar ruta">delete</button></td>
      </tr>`,
    )
    .join('');

  document.body.innerHTML = `
    <div data-route-list>
      <div data-route-list-error hidden></div>
      <table data-route-table><tbody>${rows}</tbody></table>
      <p data-route-list-count>${routes.length} rutas registradas</p>
    </div>`;

  return document.querySelector('[data-route-list]') as HTMLElement;
}

const clickDelete = (id: string) => {
  (document.querySelector(`[data-route-delete="${id}"]`) as HTMLButtonElement).click();
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('createRouteListController', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('asks for confirmation before deleting anything', async () => {
    const root = mountList();
    const confirm = vi.fn(() => false);
    const deleteRoute = vi.fn(async () => ({ data: { success: true } }));
    createRouteListController(root, { confirm, deleteRoute, reload: vi.fn() });

    clickDelete('r1');
    await flush();

    expect(confirm).toHaveBeenCalledWith(DELETE_CONFIRM_MESSAGE);
    expect(deleteRoute).not.toHaveBeenCalled();
    expect(root.querySelector('[data-route-id="r1"]')).not.toBeNull();
  });

  it('deletes the route, removes the row, updates the counter and reloads', async () => {
    const root = mountList();
    const deleteRoute = vi.fn(async () => ({ data: { success: true } }));
    const reload = vi.fn();
    createRouteListController(root, { confirm: () => true, deleteRoute, reload });

    clickDelete('r1');
    await flush();

    expect(deleteRoute).toHaveBeenCalledWith('r1');
    expect(root.querySelector('[data-route-id="r1"]')).toBeNull();
    expect(root.querySelector('[data-route-id="r2"]')).not.toBeNull();
    expect(root.querySelector('[data-route-list-count]')!.textContent).toContain('1 ruta');
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('disables the button while the request is in flight', async () => {
    const root = mountList();
    let release: (value: unknown) => void = () => {};
    const deleteRoute = vi.fn(
      (_id: string) =>
        new Promise<{ data: { success: boolean } }>((resolve) => {
          release = resolve as (value: unknown) => void;
        }),
    );
    createRouteListController(root, { confirm: () => true, deleteRoute, reload: vi.fn() });

    clickDelete('r1');
    await flush();

    const button = root.querySelector('[data-route-delete="r1"]') as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    release({ data: { success: true } });
    await flush();
    expect(deleteRoute).toHaveBeenCalledTimes(1);
  });

  it('shows the action error and keeps the row when the delete fails', async () => {
    const root = mountList();
    const reload = vi.fn();
    createRouteListController(root, {
      confirm: () => true,
      deleteRoute: async () => ({ error: { message: 'La ruta no existe' } }),
      reload,
    });

    clickDelete('r1');
    await flush();

    const error = root.querySelector('[data-route-list-error]') as HTMLElement;
    expect(error.hidden).toBe(false);
    expect(error.textContent).toContain('La ruta no existe');
    expect(root.querySelector('[data-route-id="r1"]')).not.toBeNull();
    expect((root.querySelector('[data-route-delete="r1"]') as HTMLButtonElement).disabled).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it('reports a thrown error with the connection fallback message', async () => {
    const root = mountList();
    createRouteListController(root, {
      confirm: () => true,
      deleteRoute: async () => {
        throw new Error('red caída');
      },
      reload: vi.fn(),
    });

    clickDelete('r2');
    await flush();

    expect(root.querySelector('[data-route-list-error]')!.textContent).toContain('red caída');
    expect(root.querySelector('[data-route-id="r2"]')).not.toBeNull();
  });

  it('stops listening for clicks once destroyed', async () => {
    const root = mountList();
    const deleteRoute = vi.fn(async () => ({ data: { success: true } }));
    const controller = createRouteListController(root, {
      confirm: () => true,
      deleteRoute,
      reload: vi.fn(),
    });

    controller.destroy();
    clickDelete('r1');
    await flush();

    expect(deleteRoute).not.toHaveBeenCalled();
  });
});

describe('initRouteLists', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  const deps = {
    confirm: () => false,
    deleteRoute: async (_id: string) => ({ data: { success: true } }),
    reload: () => {},
  };

  it('does nothing when the page has no route list', () => {
    document.body.innerHTML = '<p>Sin rutas</p>';
    expect(initRouteLists(document, deps)).toBe(0);
  });

  it('returns the number of lists it wired', () => {
    mountList();
    document.body.innerHTML += '<div data-route-list></div>';

    expect(initRouteLists(document, deps)).toBe(2);
  });
});

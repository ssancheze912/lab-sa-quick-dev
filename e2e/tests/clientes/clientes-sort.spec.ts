import { test, expect } from '../../fixtures/base.fixture';
import { ClientesPage } from '../../pages/clientes.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente, uniqueDigits } from '../../helpers/data.helper';

/**
 * E2E tests: Sort Client List (Story 2.6, Epic 2: Client Management)
 * ATDD Acceptance Tests — RED Phase
 *
 * Covers `test-design-epic-2.md`'s explicit E2E designation (line 105: "E2E is reserved for
 * the critical user journeys... and sort behavior" — a full-stack round trip that unit/
 * component tests alone cannot verify: real UI wiring, real backend `createdAt` values, no
 * page reload). The 4 sort-mode / no-refetch assertions themselves are primarily proven at
 * the component level (TC-E2-P1-11, TC-E2-P1-12, TC-E2-P2-01, TC-E2-P2-02 in
 * `ClienteListView.sort.test.tsx`) — this file adds the one full-stack journey per the
 * project's "avoid duplicate coverage across levels" rule.
 *
 * These tests are intentionally FAILING until Story 2.6's Tasks 1-2 are implemented: the
 * `SortControl` component, `sortOption`/`sortClientes` wiring into `ClienteListView`, and the
 * `sortControl`/`seleccionarOrden` additions to `ClientesPage` (already added for this story).
 * This is the expected RED state (missing implementation, not a test bug), consistent with
 * the project's established ATDD convention (see `clientes-delete.spec.ts`, `clientes-edit.spec.ts`).
 *
 * Each test seeds its own uniquely-named clients (per worker/project) and scopes assertions
 * via an active search filter, so relative order can be asserted deterministically even
 * though the backend is shared across parallel Playwright workers/projects.
 */

test.describe('Ordenar Lista de Clientes', () => {
  let clientesPage: ClientesPage;
  let apiHelper: ApiHelper;
  const createdIds: string[] = [];

  test.beforeEach(async ({ page, request }) => {
    clientesPage = new ClientesPage(page);
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  test('AC #1 — "Nombre A→Z" reordena la lista alfabéticamente ascendente sin recargar la página', async ({}, testInfo) => {
    // GIVEN two seeded clients sharing a unique, worker-scoped search token, created in
    // non-alphabetical order
    const token = `SortAZ ${testInfo.project.name}-${testInfo.workerIndex}-${uniqueDigits(6)}`;
    const dataBeta = buildCliente({ nombre: `Beta ${token}` });
    const dataAlfa = buildCliente({ nombre: `Alfa ${token}` });
    const clienteBeta = await apiHelper.createCliente(dataBeta);
    createdIds.push(clienteBeta.id);
    const clienteAlfa = await apiHelper.createCliente(dataAlfa);
    createdIds.push(clienteAlfa.id);

    await clientesPage.goto();
    await clientesPage.buscar(token);
    await expect(clientesPage.clienteItems).toHaveCount(2);

    // WHEN the user selects "Nombre A→Z"
    await clientesPage.seleccionarOrden('Nombre A→Z');

    // THEN the list reorders alphabetically ascending, without a page reload
    const nombres = await clientesPage.clienteItems.allTextContents();
    expect(nombres[0]).toContain(dataAlfa.nombre);
    expect(nombres[1]).toContain(dataBeta.nombre);
    await expect(clientesPage.page).toHaveURL(/\/clientes$/);
  });

  test('AC #2 — "Nombre Z→A" reordena la lista alfabéticamente descendente', async ({}, testInfo) => {
    // GIVEN two seeded clients sharing a unique, worker-scoped search token
    const token = `SortZA ${testInfo.project.name}-${testInfo.workerIndex}-${uniqueDigits(6)}`;
    const dataBeta = buildCliente({ nombre: `Beta ${token}` });
    const dataAlfa = buildCliente({ nombre: `Alfa ${token}` });
    const clienteBeta = await apiHelper.createCliente(dataBeta);
    createdIds.push(clienteBeta.id);
    const clienteAlfa = await apiHelper.createCliente(dataAlfa);
    createdIds.push(clienteAlfa.id);

    await clientesPage.goto();
    await clientesPage.buscar(token);
    await expect(clientesPage.clienteItems).toHaveCount(2);

    // WHEN the user selects "Nombre Z→A"
    await clientesPage.seleccionarOrden('Nombre Z→A');

    // THEN the list reorders alphabetically descending
    const nombres = await clientesPage.clienteItems.allTextContents();
    expect(nombres[0]).toContain(dataBeta.nombre);
    expect(nombres[1]).toContain(dataAlfa.nombre);
  });

  test('AC #3 — "Más reciente" ordena la lista por fecha de creación descendente', async ({}, testInfo) => {
    // GIVEN two clients created sequentially — the second call happens strictly after the
    // first, so the backend's createdAt values are naturally ordered
    const token = `SortRecent ${testInfo.project.name}-${testInfo.workerIndex}-${uniqueDigits(6)}`;
    const dataOlder = buildCliente({ nombre: `Older ${token}` });
    const clienteOlder = await apiHelper.createCliente(dataOlder);
    createdIds.push(clienteOlder.id);
    const dataNewer = buildCliente({ nombre: `Newer ${token}` });
    const clienteNewer = await apiHelper.createCliente(dataNewer);
    createdIds.push(clienteNewer.id);

    await clientesPage.goto();
    await clientesPage.buscar(token);
    await expect(clientesPage.clienteItems).toHaveCount(2);

    // WHEN the user selects "Más reciente"
    await clientesPage.seleccionarOrden('Más reciente');

    // THEN the most recently created client appears first
    const nombres = await clientesPage.clienteItems.allTextContents();
    expect(nombres[0]).toContain(dataNewer.nombre);
    expect(nombres[1]).toContain(dataOlder.nombre);
  });

  test('AC #4 — "Más antiguo" ordena la lista por fecha de creación ascendente', async ({}, testInfo) => {
    // GIVEN two clients created sequentially
    const token = `SortOldest ${testInfo.project.name}-${testInfo.workerIndex}-${uniqueDigits(6)}`;
    const dataOlder = buildCliente({ nombre: `Older ${token}` });
    const clienteOlder = await apiHelper.createCliente(dataOlder);
    createdIds.push(clienteOlder.id);
    const dataNewer = buildCliente({ nombre: `Newer ${token}` });
    const clienteNewer = await apiHelper.createCliente(dataNewer);
    createdIds.push(clienteNewer.id);

    await clientesPage.goto();
    await clientesPage.buscar(token);
    await expect(clientesPage.clienteItems).toHaveCount(2);

    // WHEN the user selects "Más antiguo"
    await clientesPage.seleccionarOrden('Más antiguo');

    // THEN the oldest created client appears first
    const nombres = await clientesPage.clienteItems.allTextContents();
    expect(nombres[0]).toContain(dataOlder.nombre);
    expect(nombres[1]).toContain(dataNewer.nombre);
  });

  test('AC #5 — combinar una búsqueda activa con un cambio de orden no borra el valor del buscador', async ({}, testInfo) => {
    // GIVEN a seeded client matched by an active search filter
    const token = `SortSearch ${testInfo.project.name}-${testInfo.workerIndex}-${uniqueDigits(6)}`;
    const data = buildCliente({ nombre: `Cliente ${token}` });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    await clientesPage.goto();
    await clientesPage.buscar(token);
    await expect(clientesPage.clienteItems).toHaveCount(1);

    // WHEN the user changes the sort order while the search filter is active
    await clientesPage.seleccionarOrden('Nombre A→Z');

    // THEN the search input's value is unchanged and the filtered result set is preserved
    await expect(clientesPage.searchInput).toHaveValue(token);
    await expect(
      clientesPage.clienteItems.filter({ hasText: data.nombre })
    ).toBeVisible();
  });
});

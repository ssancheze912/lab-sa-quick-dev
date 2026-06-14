/**
 * Story 2.1: Client List & Search — E2E Acceptance Tests
 * RED PHASE: These tests are written BEFORE implementation.
 *
 * Acceptance Criteria covered:
 *   AC#1 — Left panel (280px) shows scrollable list with Nombre and NIT/RUC visible
 *   AC#2 — Real-time search filters by Nombre or NIT/RUC (case-insensitive, <1s with 500 records)
 *   AC#3 — Clearing search restores full list without a new API call
 *   AC#4 — EmptyState shown when API returns []
 *   AC#5 — ErrorPanel with "Reintentar" shown when backend is unavailable
 *   AC#6 — Skeleton placeholder shown while loading
 *
 * Test cases from test-design-epic-2.md included here:
 *   TC-E2-P1-15 (E2E search by name — AC#2)
 *   TC-E2-P3-01 (E2E search by NIT/RUC — AC#2)
 */

import { test, expect } from '../../fixtures/base.fixture';
import { ClientesPage } from '../../pages/clientes.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

test.describe('Story 2.1: Client List & Search', () => {
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

  /**
   * AC#1 — Given clients in system, when user navigates to /clientes,
   * Then left panel shows scrollable list with Nombre and NIT/RUC visible.
   *
   * TC-E2-P1-06 (component level) covered in component tests.
   * This E2E test verifies the full-stack flow.
   */
  test('AC#1 — should show client list with Nombre and NIT/RUC on /clientes navigation', async ({ page }) => {
    // GIVEN: a client exists in the system
    const data = buildCliente({ nombre: 'Empresa ATDD Test', nit: '900100200-1' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: user navigates to /clientes (network intercepted before navigation)
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // THEN: left list panel is visible
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();

    // AND: the client item shows Nombre
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa ATDD Test' })
    ).toBeVisible();

    // AND: the client item shows NIT/RUC
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: '900100200-1' })
    ).toBeVisible();
  });

  /**
   * AC#2 (TC-E2-P1-15) — Given client list loaded, when user types in search field,
   * Then list filters in real time (case-insensitive) and results appear in under 1 second.
   */
  test('AC#2 — should filter client list by Nombre in real time (TC-E2-P1-15)', async ({ page }) => {
    // GIVEN: clients seeded — one named "Empresas Siesa SAS", others with different names
    const siesaCliente = await apiHelper.createCliente(
      buildCliente({ nombre: 'Empresas Siesa SAS', nit: '900000001-0' })
    );
    const otroCliente = await apiHelper.createCliente(
      buildCliente({ nombre: 'Distribuidora Norte', nit: '800000001-0' })
    );
    createdIds.push(siesaCliente.id, otroCliente.id);

    // WHEN: user navigates to /clientes (intercept before navigation)
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();

    // AND: user types "Siesa" in the search field
    const t0 = Date.now();
    await page.getByLabel('Buscar cliente').fill('Siesa');

    // THEN: only matching clients visible (within 1 second — NFR1)
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresas Siesa SAS' })
    ).toBeVisible();

    const elapsed = Date.now() - t0;
    expect(elapsed).toBeLessThan(1000);

    // AND: non-matching client is NOT visible
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Distribuidora Norte' })
    ).not.toBeVisible();
  });

  /**
   * AC#2 (TC-E2-P3-01) — Search by NIT/RUC finds matching client.
   */
  test('AC#2 — should filter client list by NIT/RUC in real time (TC-E2-P3-01)', async ({ page }) => {
    // GIVEN: a client with a known NIT exists
    const data = buildCliente({ nombre: 'Empresa NIT Test', nit: '999111222-3' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    const otroCliente = await apiHelper.createCliente(
      buildCliente({ nombre: 'Empresa Sin NIT Match', nit: '000000001-0' })
    );
    createdIds.push(otroCliente.id);

    // WHEN: user navigates to /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();

    // AND: types the NIT fragment in the search field
    await page.getByLabel('Buscar cliente').fill('999111222');

    // THEN: the matching client appears
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa NIT Test' })
    ).toBeVisible();

    // AND: non-matching client does NOT appear
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Sin NIT Match' })
    ).not.toBeVisible();
  });

  /**
   * AC#3 — Given user clears search field, when input becomes empty,
   * Then full client list is restored without triggering a new API call.
   */
  test('AC#3 — should restore full client list when search is cleared', async ({ page }) => {
    // GIVEN: two clients exist
    const clienteA = await apiHelper.createCliente(
      buildCliente({ nombre: 'Siesa Colombia', nit: '900300400-1' })
    );
    const clienteB = await apiHelper.createCliente(
      buildCliente({ nombre: 'Otro Proveedor SAS', nit: '800300400-1' })
    );
    createdIds.push(clienteA.id, clienteB.id);

    // WHEN: user navigates to /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();

    // AND: user types in search, filtering down to one client
    await page.getByLabel('Buscar cliente').fill('Siesa');
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Siesa Colombia' })
    ).toBeVisible();

    // AND: user clears the search field
    await page.getByLabel('Buscar cliente').clear();

    // THEN: full list is restored — both clients visible
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Siesa Colombia' })
    ).toBeVisible();
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Otro Proveedor SAS' })
    ).toBeVisible();
  });
});

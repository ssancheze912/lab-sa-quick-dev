import { test, expect } from '../../fixtures/base.fixture';
import { ClientesPage } from '../../pages/clientes.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

/**
 * E2E tests: Client Detail View — Story 2.2
 *
 * Covers:
 *   TC-E2-P1-05  Deep link to /clientes/:clienteId loads correct detail (FR30, AC-2.2)
 *   TC-E2-P1-06  Deep link to non-existent clienteId shows not-found message (R-E2-07, AC-2.2)
 */

test.describe('TC-E2-P1-05 / TC-E2-P1-06: Client Detail View — deep linking', () => {
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

  // ---------------------------------------------------------------------------
  // TC-E2-P1-05: Deep link to /clientes/:clienteId loads correct detail
  // ---------------------------------------------------------------------------

  test('TC-E2-P1-05 — deep link to /clientes/:clienteId renders correct client Nombre', async ({
    page,
  }) => {
    // GIVEN: A client exists in the database with a known ID
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: User navigates directly to the deep link URL
    await page.goto(`/clientes/${cliente.id}`);
    await page.waitForURL(`**/clientes/${cliente.id}**`);

    // THEN: Client detail panel renders the correct Nombre
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await expect(page.getByText(data.nombre)).toBeVisible();
  });

  test('TC-E2-P1-05 — deep link does not redirect to home and shows no blank screen', async ({
    page,
  }) => {
    // GIVEN: A client exists in the database
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: User navigates directly to the deep link URL
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: URL stays at the deep link (no redirect)
    await expect(page).toHaveURL(new RegExp(cliente.id));

    // THEN: Navigation shell is still visible (no blank screen)
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // TC-E2-P1-06: Deep link to non-existent clienteId shows not-found, no crash
  // ---------------------------------------------------------------------------

  test('TC-E2-P1-06 — deep link to non-existent UUID shows not-found message', async ({
    page,
  }) => {
    // GIVEN: An ID that does not correspond to any existing client
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    // WHEN: User navigates directly to /clientes/:nonExistentId
    await page.goto(`/clientes/${nonExistentId}`);

    // THEN: A not-found message is displayed in Spanish
    await expect(page.getByText(/Cliente no encontrado/i)).toBeVisible();
  });

  test('TC-E2-P1-06 — navigation shell remains visible when detail is not found', async ({
    page,
  }) => {
    // GIVEN: An ID that does not exist
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    // WHEN: User navigates to the non-existent deep link
    await page.goto(`/clientes/${nonExistentId}`);

    // THEN: Navigation shell (left list panel) is still visible
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
  });

  test('TC-E2-P1-06 — no JavaScript crash when deep link points to non-existent client', async ({
    page,
  }) => {
    // GIVEN: An ID that does not exist
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    // Capture any uncaught JS errors
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    // WHEN: User navigates to the non-existent deep link
    await page.goto(`/clientes/${nonExistentId}`);

    // Wait for the not-found state to render
    await expect(page.getByText(/Cliente no encontrado/i)).toBeVisible();

    // THEN: No JavaScript errors were thrown
    expect(jsErrors).toHaveLength(0);
  });
});

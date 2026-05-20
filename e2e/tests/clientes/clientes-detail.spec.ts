import { test, expect } from '../../fixtures/base.fixture';
import { ClientesPage } from '../../pages/clientes.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

/**
 * ATDD — Story 2.2: Client Detail View
 *
 * Coverage:
 *   E2E-C-07  P0  AC-E2.3  — Clicking a client shows full detail in right panel
 *   E2E-C-08  P1  —        — URL updates to /clientes/:clienteId after clicking
 *   E2E-C-09  P1  —        — Direct navigation to /clientes/:clienteId loads correct detail
 *   E2E-C-10  P1  —        — Direct navigation to non-existent ID shows not-found message
 */

test.describe('Story 2.2 — Vista de detalle de cliente', () => {
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
  // E2E-C-07 (P0 · AC-E2.3)
  // Given the client list is displayed
  // When the user clicks on a client item
  // Then the right panel shows: Nombre, NIT/RUC, Teléfono, Ciudad
  // ---------------------------------------------------------------------------
  test('E2E-C-07 — hacer clic en un cliente muestra el detalle completo en el panel derecho', async ({ page }) => {
    // GIVEN — a client exists in the system
    const data = buildCliente({ nombre: 'Constructora Pacífico SAS' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN — user navigates to /clientes and clicks the client
    await clientesPage.goto();
    await expect(clientesPage.listPanel).toBeVisible();
    await expect(
      clientesPage.clienteItems.filter({ hasText: data.nombre })
    ).toBeVisible();

    await clientesPage.seleccionarCliente(data.nombre);

    // THEN — detail panel is visible
    await expect(clientesPage.detailPanel).toBeVisible();

    // AND — Nombre is displayed
    await expect(
      page.getByTestId('cliente-detail-nombre')
    ).toHaveText(data.nombre);

    // AND — NIT/RUC is displayed
    await expect(
      page.getByTestId('cliente-detail-nit')
    ).toHaveText(data.nit);

    // AND — Teléfono is displayed
    await expect(
      page.getByTestId('cliente-detail-telefono')
    ).toHaveText(data.telefono ?? '');

    // AND — Ciudad is displayed
    await expect(
      page.getByTestId('cliente-detail-ciudad')
    ).toHaveText(data.ciudad ?? '');
  });

  // ---------------------------------------------------------------------------
  // E2E-C-08 (P1 · FR30)
  // Given the client list is displayed
  // When the user clicks on a client item
  // Then the URL updates to /clientes/:clienteId
  // ---------------------------------------------------------------------------
  test('E2E-C-08 — la URL se actualiza a /clientes/:clienteId al hacer clic en un cliente', async ({ page }) => {
    // GIVEN — a client exists
    const data = buildCliente({ nombre: 'Importadora del Sur Ltda' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN — user navigates and clicks the client
    await clientesPage.goto();
    await expect(
      clientesPage.clienteItems.filter({ hasText: data.nombre })
    ).toBeVisible();

    await clientesPage.seleccionarCliente(data.nombre);

    // THEN — URL contains the client UUID
    await page.waitForURL(`**/clientes/${cliente.id}`);
    expect(page.url()).toContain(`/clientes/${cliente.id}`);
  });

  // ---------------------------------------------------------------------------
  // E2E-C-09 (P1 · FR30)
  // Given the user knows the clienteId
  // When the user navigates directly to /clientes/:clienteId
  // Then the correct client detail is loaded and displayed
  // ---------------------------------------------------------------------------
  test('E2E-C-09 — navegación directa a /clientes/:clienteId carga el detalle correcto', async ({ page }) => {
    // GIVEN — a client exists
    const data = buildCliente({ nombre: 'Tecnologías Andinas SA' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN — user navigates directly to the detail URL
    await page.goto(`/clientes/${cliente.id}`);

    // THEN — detail panel is visible with correct data
    await expect(clientesPage.detailPanel).toBeVisible();
    await expect(
      page.getByTestId('cliente-detail-nombre')
    ).toHaveText(data.nombre);
    await expect(
      page.getByTestId('cliente-detail-nit')
    ).toHaveText(data.nit);
  });

  // ---------------------------------------------------------------------------
  // E2E-C-10 (P1 · R6)
  // Given a clienteId in the URL does not exist
  // When the page loads
  // Then a not-found message is displayed gracefully (no unhandled JS error)
  // ---------------------------------------------------------------------------
  test('E2E-C-10 — navegar a un clienteId inexistente muestra mensaje de no encontrado', async ({ page }) => {
    // GIVEN — a non-existent UUID
    const nonExistentId = '00000000-0000-4000-8000-000000000000';

    // Listen for unhandled JS errors
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    // WHEN — user navigates directly to the non-existent detail URL
    await page.goto(`/clientes/${nonExistentId}`);

    // THEN — not-found message is visible
    await expect(
      page.getByTestId('cliente-not-found')
    ).toBeVisible();

    // AND — the text indicates the client was not found
    await expect(
      page.getByTestId('cliente-not-found')
    ).toHaveText(/cliente no encontrado/i);

    // AND — no unhandled JS errors were thrown
    expect(pageErrors).toHaveLength(0);
  });
});

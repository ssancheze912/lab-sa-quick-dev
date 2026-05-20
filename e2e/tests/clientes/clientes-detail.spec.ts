import { test, expect } from '../../fixtures/base.fixture';
import { ClientesPage } from '../../pages/clientes.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

/**
 * ATDD — Story 2.2: Client Detail View
 *
 * Tests are in RED phase — they define the expected behaviour BEFORE implementation.
 * Make these tests GREEN by implementing ClienteDetailPanel, the /clientes/:clienteId
 * TanStack Router route, and the GET /api/v1/clientes/:id endpoint as specified
 * in Story 2.2.
 *
 * Coverage:
 *   E2E-C-07  P0  AC1, AC-E2.3 — Clicking a client shows full detail (Nombre, NIT, Teléfono, Ciudad)
 *   E2E-C-08  P1  AC1          — URL updates to /clientes/:clienteId after clicking a client (FR30)
 *   E2E-C-09  P1  AC2          — Direct navigation to /clientes/:clienteId loads client without prior list click
 *   E2E-C-10  P1  AC3          — Direct navigation with non-existent ID shows not-found message gracefully
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
  // E2E-C-07 (P0 · AC1, AC-E2.3)
  // Given the client list is displayed
  // When the user clicks on a client item in the left panel
  // Then the right panel shows the complete client details:
  //   Nombre, NIT/RUC, Teléfono, Ciudad
  // ---------------------------------------------------------------------------
  test('E2E-C-07 — hacer clic en un cliente muestra Nombre, NIT, Teléfono y Ciudad en el panel derecho', async ({ page }) => {
    // GIVEN — a client exists with all fields populated
    const clienteData = buildCliente({
      nombre: 'Constructora Andina SA',
      nit: '900123456-7',
      telefono: '3001234567',
      ciudad: 'Medellín',
    });

    // Intercept network BEFORE creating data and navigating (network-first pattern)
    await page.route('**/api/v1/clientes', (route) => route.continue());
    await page.route('**/api/v1/clientes/**', (route) => route.continue());

    const cliente = await apiHelper.createCliente(clienteData);
    createdIds.push(cliente.id);

    // WHEN — user navigates to /clientes
    await clientesPage.goto();

    // AND — waits for the list to load
    await expect(clientesPage.listPanel).toBeVisible();
    await expect(
      clientesPage.clienteItems.filter({ hasText: clienteData.nombre })
    ).toBeVisible();

    // AND — clicks on the client item
    await clientesPage.seleccionarCliente(clienteData.nombre);

    // THEN — the right panel (detail panel) becomes visible
    await expect(clientesPage.detailPanel).toBeVisible();

    // AND — the panel shows the client's Nombre
    await expect(clientesPage.detailPanel).toContainText(clienteData.nombre);

    // AND — the panel shows the NIT/RUC
    await expect(clientesPage.detailPanel).toContainText(clienteData.nit);

    // AND — the panel shows the Teléfono
    await expect(clientesPage.detailPanel).toContainText(clienteData.telefono!);

    // AND — the panel shows the Ciudad
    await expect(clientesPage.detailPanel).toContainText(clienteData.ciudad!);
  });

  // ---------------------------------------------------------------------------
  // E2E-C-08 (P1 · AC1 · FR30)
  // Given the client list is loaded
  // When the user clicks on a client item
  // Then the URL updates to /clientes/:clienteId
  // ---------------------------------------------------------------------------
  test('E2E-C-08 — la URL se actualiza a /clientes/:clienteId al hacer clic en un cliente', async ({ page }) => {
    // GIVEN — a client exists in the system
    const clienteData = buildCliente({ nombre: 'Distribuidora del Pacífico Ltda' });

    // Intercept BEFORE navigation (network-first)
    await page.route('**/api/v1/clientes', (route) => route.continue());
    await page.route('**/api/v1/clientes/**', (route) => route.continue());

    const cliente = await apiHelper.createCliente(clienteData);
    createdIds.push(cliente.id);

    // WHEN — user navigates to /clientes
    await clientesPage.goto();
    await expect(clientesPage.listPanel).toBeVisible();
    await expect(
      clientesPage.clienteItems.filter({ hasText: clienteData.nombre })
    ).toBeVisible();

    // AND — clicks on the client item
    await clientesPage.seleccionarCliente(clienteData.nombre);

    // THEN — the URL is updated to include the client's UUID
    await page.waitForURL(`**/clientes/${cliente.id}`);
    expect(page.url()).toMatch(new RegExp(`/clientes/${cliente.id}$`));
  });

  // ---------------------------------------------------------------------------
  // E2E-C-09 (P1 · AC2)
  // Given a valid client exists in the system
  // When the user navigates directly to /clientes/:clienteId (deep link)
  // Then the correct client details are loaded and displayed
  //   WITHOUT requiring prior list interaction
  // ---------------------------------------------------------------------------
  test('E2E-C-09 — navegación directa a /clientes/:clienteId carga el detalle sin interacción previa con la lista', async ({ page }) => {
    // GIVEN — a client exists in the system
    const clienteData = buildCliente({
      nombre: 'Importadora Global SAS',
      nit: '800987654-3',
      telefono: '6017654321',
      ciudad: 'Bogotá',
    });

    // Intercept BEFORE navigation (network-first pattern for deep link)
    await page.route('**/api/v1/clientes/**', (route) => route.continue());

    const cliente = await apiHelper.createCliente(clienteData);
    createdIds.push(cliente.id);

    // WHEN — user navigates directly to the deep link URL (no prior list visit)
    await page.goto(`/clientes/${cliente.id}`);
    await page.waitForURL(`**/clientes/${cliente.id}`);

    // THEN — the detail panel is visible
    await expect(clientesPage.detailPanel).toBeVisible();

    // AND — the panel shows the client's Nombre without requiring a list click
    await expect(clientesPage.detailPanel).toContainText(clienteData.nombre);

    // AND — all required fields are displayed
    await expect(clientesPage.detailPanel).toContainText(clienteData.nit);
    await expect(clientesPage.detailPanel).toContainText(clienteData.telefono!);
    await expect(clientesPage.detailPanel).toContainText(clienteData.ciudad!);
  });

  // ---------------------------------------------------------------------------
  // E2E-C-10 (P1 · AC3 · Risk R6)
  // Given a clienteId in the URL does not exist in the system
  // When the user navigates directly to /clientes/:nonExistentId
  // Then a not-found message is displayed gracefully in the right panel
  // AND no unhandled JavaScript error is thrown
  // ---------------------------------------------------------------------------
  test('E2E-C-10 — navegar a un clienteId inexistente muestra mensaje "no encontrado" sin errores de JS', async ({ page }) => {
    // GIVEN — a UUID that does not correspond to any client
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    // Listen for unhandled JS errors BEFORE navigating (must be set up first)
    const jsErrors: Error[] = [];
    page.on('pageerror', (error) => jsErrors.push(error));

    // Intercept BEFORE navigation (network-first)
    await page.route(`**/api/v1/clientes/${nonExistentId}`, (route) => {
      route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          status: 404,
          title: 'Cliente no encontrado',
          detail: `No existe cliente con id '${nonExistentId}'.`,
        }),
      });
    });

    // WHEN — user navigates directly to the non-existent client URL
    await page.goto(`/clientes/${nonExistentId}`);

    // THEN — the page renders a not-found message (graceful handling)
    await expect(
      page.getByText(/cliente no encontrado/i)
    ).toBeVisible();

    // AND — the detail panel area does not show blank/broken UI
    await expect(clientesPage.detailPanel).toBeVisible();

    // AND — no unhandled JavaScript errors were thrown
    expect(jsErrors).toHaveLength(0);
  });

  // ---------------------------------------------------------------------------
  // E2E-C-04-DETAIL (AC4)
  // Given the /clientes route is loaded and no client has been selected
  // When the right panel is visible
  // Then a default empty state or placeholder is shown (no blank/broken UI)
  // ---------------------------------------------------------------------------
  test('E2E-C-07-EMPTY — el panel derecho muestra un placeholder cuando no hay cliente seleccionado', async ({ page }) => {
    // GIVEN — at least one client exists so the list renders
    const clienteData = buildCliente({ nombre: 'Servicios Integrales SAS' });

    // Intercept BEFORE navigation
    await page.route('**/api/v1/clientes', (route) => route.continue());

    const cliente = await apiHelper.createCliente(clienteData);
    createdIds.push(cliente.id);

    // WHEN — user navigates to /clientes (no :clienteId in URL)
    await clientesPage.goto();
    await expect(clientesPage.listPanel).toBeVisible();
    await expect(
      clientesPage.clienteItems.filter({ hasText: clienteData.nombre })
    ).toBeVisible();

    // THEN — the right panel area shows a selection placeholder (not blank/broken)
    // The EmptyState or placeholder component should be visible
    await expect(
      page.getByText(/selecciona un cliente/i)
    ).toBeVisible();

    // AND — there are no broken/undefined elements in the detail area
    // (detail panel with real data should NOT be visible when no client selected)
    await expect(
      page.getByTestId('cliente-detail-loading')
    ).not.toBeVisible();
  });
});

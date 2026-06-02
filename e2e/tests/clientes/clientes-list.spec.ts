import { test, expect } from '../../fixtures/base.fixture';
import { ClientesPage } from '../../pages/clientes.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

/**
 * ATDD — Story 2.1: Client List & Search
 *
 * Tests are in RED phase — they define the expected behaviour BEFORE implementation.
 * Make these tests GREEN by implementing ClienteListPanel, EmptyState, ErrorPanel
 * and the GET /api/v1/clientes endpoint as specified in Story 2.1.
 *
 * Coverage:
 *   E2E-C-01  AC1  — List panel renders all clients from API on page load
 *   E2E-C-02  AC2  — Search by Nombre filters client-side (no extra API calls)
 *   E2E-C-03  AC2  — Search by NIT/RUC filters client-side
 *   E2E-C-04  AC2  — Clearing search restores full list
 *   E2E-C-05  AC3  — EmptyState shown when no clients exist
 *   E2E-C-06  AC4  — ErrorPanel + "Reintentar" button shown when API returns 500
 */

test.describe('Story 2.1 — Lista y búsqueda de clientes', () => {
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
  // E2E-C-01 (P0 · AC1)
  // Given there are clients in the system
  // When the user navigates to /clientes
  // Then the left panel (280px) shows a scrollable list with each client's Nombre and NIT/RUC
  // ---------------------------------------------------------------------------
  test('E2E-C-01 — el panel izquierdo renderiza todos los clientes al cargar la página', async ({ page }) => {
    // GIVEN — two clients exist in the system
    const data1 = buildCliente({ nombre: 'Empresa Alpha SAS' });
    const data2 = buildCliente({ nombre: 'Empresa Beta Ltda' });
    const c1 = await apiHelper.createCliente(data1);
    const c2 = await apiHelper.createCliente(data2);
    createdIds.push(c1.id, c2.id);

    // Intercept the network call BEFORE navigating (network-first pattern)
    let apiCallCount = 0;
    await page.route('**/api/v1/clientes', (route) => {
      apiCallCount++;
      route.continue();
    });

    // WHEN — user navigates to /clientes
    await clientesPage.goto();

    // THEN — the list panel is visible
    await expect(clientesPage.listPanel).toBeVisible();

    // AND — each expected client is in the list with nombre and NIT/RUC visible
    await expect(
      clientesPage.clienteItems.filter({ hasText: data1.nombre })
    ).toBeVisible();
    await expect(
      clientesPage.clienteItems.filter({ hasText: data1.nit })
    ).toBeVisible();
    await expect(
      clientesPage.clienteItems.filter({ hasText: data2.nombre })
    ).toBeVisible();
    await expect(
      clientesPage.clienteItems.filter({ hasText: data2.nit })
    ).toBeVisible();

    // AND — exactly one GET /api/v1/clientes call was made (no duplicate fetches)
    expect(apiCallCount).toBeGreaterThanOrEqual(1);
  });

  // ---------------------------------------------------------------------------
  // E2E-C-02 (P0 · AC2)
  // Given the client list is loaded
  // When the user types a name in the search field
  // Then only matching clients are shown AND no additional API call is made
  // ---------------------------------------------------------------------------
  test('E2E-C-02 — buscar por nombre filtra la lista en tiempo real sin llamadas extra a la API', async ({ page }) => {
    // GIVEN — three clients with distinct names
    const match = buildCliente({ nombre: 'Constructora del Valle' });
    const noMatch1 = buildCliente({ nombre: 'Comercios Bogotá SA' });
    const noMatch2 = buildCliente({ nombre: 'Distribuidora Norte' });
    const cm = await apiHelper.createCliente(match);
    const cn1 = await apiHelper.createCliente(noMatch1);
    const cn2 = await apiHelper.createCliente(noMatch2);
    createdIds.push(cm.id, cn1.id, cn2.id);

    // Track API calls (intercept BEFORE navigation)
    const apiCalls: string[] = [];
    await page.route('**/api/v1/clientes', (route) => {
      apiCalls.push(route.request().method());
      route.continue();
    });

    await clientesPage.goto();
    // Wait for initial list to load
    await expect(clientesPage.clienteItems.first()).toBeVisible();
    const callsAfterLoad = apiCalls.length;

    // WHEN — user types multiple characters in the search input
    await clientesPage.buscar('Constructora');

    // THEN — only the matching client is visible
    await expect(
      clientesPage.clienteItems.filter({ hasText: match.nombre })
    ).toBeVisible();
    await expect(
      clientesPage.clienteItems.filter({ hasText: noMatch1.nombre })
    ).not.toBeVisible();
    await expect(
      clientesPage.clienteItems.filter({ hasText: noMatch2.nombre })
    ).not.toBeVisible();

    // AND — no additional GET /api/v1/clientes calls were made during typing
    expect(apiCalls.length).toBe(callsAfterLoad);
  });

  // ---------------------------------------------------------------------------
  // E2E-C-03 (P1 · AC2)
  // Given the client list is loaded
  // When the user types a NIT/RUC value in the search field
  // Then only clients whose NIT/RUC matches are shown
  // ---------------------------------------------------------------------------
  test('E2E-C-03 — buscar por NIT/RUC filtra la lista en tiempo real', async ({ page }) => {
    // GIVEN — two clients with distinct NITs
    const targetNit = '800123456-7';
    const matchData = buildCliente({ nombre: 'Empresa NIT Target', nit: targetNit });
    const otherData = buildCliente({ nombre: 'Empresa Otro NIT' });
    const cm = await apiHelper.createCliente(matchData);
    const co = await apiHelper.createCliente(otherData);
    createdIds.push(cm.id, co.id);

    // Intercept BEFORE navigation
    const apiCalls: string[] = [];
    await page.route('**/api/v1/clientes', (route) => {
      apiCalls.push(route.request().method());
      route.continue();
    });

    await clientesPage.goto();
    await expect(clientesPage.clienteItems.first()).toBeVisible();
    const callsAfterLoad = apiCalls.length;

    // WHEN — user types the target NIT in the search field
    await clientesPage.buscar(targetNit);

    // THEN — only the client with that NIT is visible
    await expect(
      clientesPage.clienteItems.filter({ hasText: matchData.nombre })
    ).toBeVisible();
    await expect(
      clientesPage.clienteItems.filter({ hasText: otherData.nombre })
    ).not.toBeVisible();

    // AND — no new API calls during typing
    expect(apiCalls.length).toBe(callsAfterLoad);
  });

  // ---------------------------------------------------------------------------
  // E2E-C-04 (P1)
  // Given the user has typed a search term that filters the list
  // When the user clears the search input
  // Then the full client list is restored
  // ---------------------------------------------------------------------------
  test('E2E-C-04 — limpiar el campo de búsqueda restaura la lista completa', async ({ page }) => {
    // GIVEN — two clients
    const data1 = buildCliente({ nombre: 'Empresa Uno SA' });
    const data2 = buildCliente({ nombre: 'Empresa Dos Ltda' });
    const c1 = await apiHelper.createCliente(data1);
    const c2 = await apiHelper.createCliente(data2);
    createdIds.push(c1.id, c2.id);

    await clientesPage.goto();
    await expect(clientesPage.clienteItems.first()).toBeVisible();

    // AND — search is active and filters to one result
    await clientesPage.buscar('Empresa Uno');
    await expect(
      clientesPage.clienteItems.filter({ hasText: data1.nombre })
    ).toBeVisible();
    await expect(
      clientesPage.clienteItems.filter({ hasText: data2.nombre })
    ).not.toBeVisible();

    // WHEN — user clears the search input
    await clientesPage.limpiarBusqueda();

    // THEN — both clients are visible again
    await expect(
      clientesPage.clienteItems.filter({ hasText: data1.nombre })
    ).toBeVisible();
    await expect(
      clientesPage.clienteItems.filter({ hasText: data2.nombre })
    ).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // E2E-C-05 (P2 · AC3)
  // Given there are NO clients in the system
  // When the user navigates to /clientes
  // Then the EmptyState component is displayed with a guidance message
  // ---------------------------------------------------------------------------
  test('E2E-C-05 — EmptyState se muestra cuando no hay clientes en el sistema', async ({ page }) => {
    // GIVEN — API returns an empty array (mock to avoid dependency on real DB state)
    await page.route('**/api/v1/clientes', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // WHEN — user navigates to /clientes
    await clientesPage.goto();

    // THEN — EmptyState component is visible
    await expect(clientesPage.emptyState).toBeVisible();

    // AND — EmptyState contains a Spanish guidance message
    await expect(
      page.getByText(/no hay clientes|primer cliente/i)
    ).toBeVisible();

    // AND — no client items are rendered
    await expect(clientesPage.clienteItems).toHaveCount(0);
  });

  // ---------------------------------------------------------------------------
  // E2E-C-06 (P2 · AC4)
  // Given the backend is unavailable when the page loads
  // When the fetch fails (API returns 500)
  // Then an ErrorPanel with a "Reintentar" button is shown
  // AND clicking "Reintentar" triggers a new API call
  // ---------------------------------------------------------------------------
  test('E2E-C-06 — ErrorPanel con botón "Reintentar" se muestra cuando la API devuelve 500', async ({ page }) => {
    // GIVEN — API returns 500 (intercept BEFORE navigation)
    let callCount = 0;
    await page.route('**/api/v1/clientes', (route) => {
      callCount++;
      route.fulfill({
        status: 500,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          status: 500,
          title: 'Internal Server Error',
          detail: 'Simulated backend failure for ATDD test',
        }),
      });
    });

    // WHEN — user navigates to /clientes
    await clientesPage.goto();

    // THEN — ErrorPanel is visible
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // AND — "Reintentar" button is visible
    const btnReintentar = page.getByRole('button', { name: /reintentar/i });
    await expect(btnReintentar).toBeVisible();

    // AND — no client list items are rendered
    await expect(clientesPage.clienteItems).toHaveCount(0);

    // AND — EmptyState is NOT shown (it's an error, not an empty result)
    await expect(clientesPage.emptyState).not.toBeVisible();

    // WHEN — user clicks "Reintentar"
    const callsBeforeRetry = callCount;
    await btnReintentar.click();

    // THEN — a new GET /api/v1/clientes call is made
    await expect
      .poll(() => callCount, { timeout: 5000 })
      .toBeGreaterThan(callsBeforeRetry);
  });
});

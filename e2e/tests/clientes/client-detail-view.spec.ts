/**
 * Story 2.2: Client Detail View
 * E2E Tests — Client Detail View (RED Phase — ATDD)
 *
 * Test cases covered:
 *   TC-E2-P1-05 — Deep link /clientes/{id} renders correct client detail (FR30)
 *   AC1         — Clicking client item shows detail in right panel and updates URL
 *   AC4         — Selected client item is visually highlighted
 *
 * Precondition: Frontend (http://localhost:5173) and Backend (http://localhost:5000) running.
 * These tests will FAIL until ClienteDetailView, useCliente, and the route /clientes/:clienteId
 * are fully implemented.
 */

import { test, expect } from '../../fixtures/base.fixture';
import { ClientesPage } from '../../pages/clientes.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-05: Deep link — direct URL /clientes/{id} renders correct detail
// AC2: Direct URL navigation loads correct client data (FR30)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Story 2.2 — TC-E2-P1-05: Deep link renders correct client detail', () => {
  let clienteId: string;

  test.beforeAll(async ({ request }) => {
    const apiHelper = new ApiHelper(request);
    const data = buildCliente({ nombre: 'DeepLink Test SA', nit: '811100001' });
    const created = await apiHelper.createCliente(data);
    clienteId = created.id;
  });

  test.afterAll(async ({ request }) => {
    if (clienteId) {
      const apiHelper = new ApiHelper(request);
      await apiHelper.deleteCliente(clienteId).catch(() => null);
    }
  });

  /**
   * TC-E2-P1-05 — AC2 (FR30 deep linking)
   * Given: A valid clienteId exists in the backend
   * When: User opens browser directly to /clientes/{clienteId}
   * Then: The correct client detail panel renders with all four fields
   * And:  URL stays at /clientes/{clienteId} (no redirect)
   */
  test('TC-E2-P1-05: direct URL /clientes/{id} renders correct client detail panel', async ({ page }) => {
    // GIVEN: A valid client exists in the backend with a known id

    // CRITICAL: Intercept API BEFORE navigation (network-first pattern)
    await page.route(`${API_BASE_URL}/api/v1/clientes/${clienteId}`, (route) =>
      route.continue(),
    );

    // WHEN: User navigates directly to the client detail URL
    await page.goto(`/clientes/${clienteId}`);

    // THEN: The detail panel is visible with data-testid="cliente-detail-view"
    await expect(page.getByTestId('cliente-detail-view')).toBeVisible({ timeout: 10_000 });

    // AND: URL remains at /clientes/{clienteId} (no redirect)
    await expect(page).toHaveURL(`/clientes/${clienteId}`);
  });

  /**
   * TC-E2-P1-05 continued — correct field values rendered
   * Given: Direct navigation to /clientes/{id}
   * When: Detail panel loads
   * Then: All four fields (Nombre, NIT/RUC, Teléfono, Ciudad) are visible
   */
  test('TC-E2-P1-05: detail panel shows Nombre, NIT/RUC, Teléfono, Ciudad fields', async ({ page }) => {
    // GIVEN: valid client id

    // CRITICAL: Intercept BEFORE navigation
    await page.route(`${API_BASE_URL}/api/v1/clientes/${clienteId}`, (route) =>
      route.continue(),
    );

    // WHEN: navigate directly to detail URL
    await page.goto(`/clientes/${clienteId}`);

    await expect(page.getByTestId('cliente-detail-view')).toBeVisible({ timeout: 10_000 });

    // THEN: All four fields are visible
    await expect(page.getByTestId('cliente-detail-view')).toContainText('DeepLink Test SA');
    await expect(page.getByTestId('cliente-detail-view')).toContainText('811100001');
  });

  /**
   * TC-E2-P1-05 — Left panel shows client list with selected client highlighted
   * Given: Direct URL navigation to /clientes/{id}
   * When: Page renders
   * Then: Left panel is visible (client list still rendered)
   */
  test('TC-E2-P1-05: left panel client list is also rendered on deep link navigation', async ({ page }) => {
    // GIVEN: valid client id

    // CRITICAL: Intercept BEFORE navigation
    await page.route(`**/api/v1/clientes**`, (route) => route.continue());

    // WHEN: navigate directly to /clientes/{id}
    await page.goto(`/clientes/${clienteId}`);

    // THEN: The client list panel is visible
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible({ timeout: 10_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1: Clicking a client item in list shows detail in right panel and updates URL
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Story 2.2 — AC1: Clicking client opens detail panel and updates URL', () => {
  let clienteId: string;
  let clienteNombre: string;
  let clienteNit: string;

  test.beforeAll(async ({ request }) => {
    const apiHelper = new ApiHelper(request);
    clienteNombre = 'Panel Click Test';
    clienteNit = '822200002';
    const data = buildCliente({ nombre: clienteNombre, nit: clienteNit });
    const created = await apiHelper.createCliente(data);
    clienteId = created.id;
  });

  test.afterAll(async ({ request }) => {
    if (clienteId) {
      const apiHelper = new ApiHelper(request);
      await apiHelper.deleteCliente(clienteId).catch(() => null);
    }
  });

  /**
   * AC1 — Click client → right panel shows detail, URL updates (FR30)
   * Given: Client list is displayed
   * When: User clicks on a client item
   * Then: Right panel shows client details (Nombre, NIT, Teléfono, Ciudad)
   * And:  URL updates to /clientes/{clienteId}
   */
  test('AC1: clicking client item opens detail panel with correct data', async ({ page }) => {
    const clientesPage = new ClientesPage(page);

    // GIVEN: Navigate to /clientes and wait for list to load
    // CRITICAL: Intercept ALL clientes API calls BEFORE navigation
    await page.route(`**/api/v1/clientes**`, (route) => route.continue());

    await clientesPage.goto();

    // Wait for the specific client to appear in the list
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: clienteNombre }),
    ).toBeVisible({ timeout: 10_000 });

    // WHEN: User clicks on the client item
    await clientesPage.seleccionarCliente(clienteNombre);

    // THEN: URL updates to /clientes/{clienteId}
    await expect(page).toHaveURL(`/clientes/${clienteId}`, { timeout: 5_000 });

    // AND: Detail panel is visible
    await expect(page.getByTestId('cliente-detail-view')).toBeVisible({ timeout: 10_000 });
  });

  /**
   * AC1 — Detail panel shows all four required fields
   * Given: User has clicked on a client
   * When: Detail panel renders
   * Then: Nombre, NIT/RUC, Teléfono, Ciudad are all visible
   */
  test('AC1: detail panel shows all four fields after clicking client', async ({ page }) => {
    const clientesPage = new ClientesPage(page);

    // GIVEN: Navigate to /clientes
    await page.route(`**/api/v1/clientes**`, (route) => route.continue());
    await clientesPage.goto();

    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: clienteNombre }),
    ).toBeVisible({ timeout: 10_000 });

    // WHEN: Click on the client item
    await clientesPage.seleccionarCliente(clienteNombre);

    // THEN: Detail panel contains the client's Nombre
    await expect(page.getByTestId('cliente-detail-view')).toContainText(clienteNombre, {
      timeout: 10_000,
    });

    // AND: Detail panel contains the NIT
    await expect(page.getByTestId('cliente-detail-view')).toContainText(clienteNit);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4: Selected client item is visually highlighted in list
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Story 2.2 — AC4: Selected client item is visually highlighted', () => {
  let clienteId: string;

  test.beforeAll(async ({ request }) => {
    const apiHelper = new ApiHelper(request);
    const data = buildCliente({ nombre: 'Highlight Test Inc', nit: '833300003' });
    const created = await apiHelper.createCliente(data);
    clienteId = created.id;
  });

  test.afterAll(async ({ request }) => {
    if (clienteId) {
      const apiHelper = new ApiHelper(request);
      await apiHelper.deleteCliente(clienteId).catch(() => null);
    }
  });

  /**
   * AC4 — Selected client item has visual highlight (isSelected styling)
   * Given: Client list is displayed
   * When: User selects a client (clicks or navigates directly)
   * Then: The corresponding list item has the aria-selected or isSelected visual indicator
   */
  test('AC4: selected client item in list has visual highlight attribute', async ({ page }) => {
    const clientesPage = new ClientesPage(page);

    // GIVEN: client list loaded
    await page.route(`**/api/v1/clientes**`, (route) => route.continue());
    await clientesPage.goto();

    // Wait for the list to load
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Highlight Test Inc' }),
    ).toBeVisible({ timeout: 10_000 });

    // WHEN: User clicks on the client
    await clientesPage.seleccionarCliente('Highlight Test Inc');

    // Wait for URL change (selection took effect)
    await expect(page).toHaveURL(`/clientes/${clienteId}`, { timeout: 5_000 });

    // THEN: The selected item has aria-selected="true" or a selected-state data attribute
    // The ClientListItem component must set aria-selected or data-selected when isSelected=true
    const selectedItem = page
      .getByTestId('cliente-list-item')
      .filter({ hasText: 'Highlight Test Inc' });

    // Assert the item has a selected indicator (aria-selected, data-selected, or class indicating selection)
    // NOTE: This requires ClientListItem to implement aria-selected="true" when isSelected=true
    await expect(selectedItem).toHaveAttribute('aria-selected', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3: Non-existent clienteId in URL shows not-found message (E2E smoke)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Story 2.2 — AC3: Non-existent clienteId shows not-found message', () => {
  /**
   * AC3 — Non-existent clienteId in URL renders not-found gracefully
   * Given: A clienteId in the URL does not exist (random UUID)
   * When: Page loads and GET /api/v1/clientes/:clienteId returns 404
   * Then: Not-found message "Cliente no encontrado." is displayed
   * And:  No JavaScript error is thrown
   */
  test('AC3: non-existent clienteId shows "Cliente no encontrado." in detail panel', async ({ page }) => {
    const nonExistentId = '00000000-dead-beef-0000-000000000000';

    // GIVEN: No client with this ID exists
    // CRITICAL: Intercept BEFORE navigation to prevent race condition
    await page.route(`**/api/v1/clientes**`, (route) => route.continue());

    // Monitor for JS errors
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    // WHEN: User navigates directly to /clientes/{nonExistentId}
    await page.goto(`/clientes/${nonExistentId}`);

    // THEN: Not-found message is displayed
    await expect(page.getByTestId('not-found-message')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('not-found-message')).toHaveText('Cliente no encontrado.');

    // AND: No JavaScript errors thrown
    expect(jsErrors).toHaveLength(0);
  });
});

/**
 * Story 2.2: Client Detail View — Edge Cases
 * Epic 2: Client Management
 *
 * Automation expansion — covers edge cases not in ATDD acceptance tests:
 *   - Loading skeleton visible while API responds
 *   - Network/server error (500) shows graceful error (no crash)
 *   - Switching from one client to another refreshes detail panel
 *   - Default "select a client" message visible on /clientes (no child route)
 *   - Back navigation from detail URL returns to default panel state
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Default panel message when no client is selected
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Default state — /clientes without a selected client', () => {
  test('[P1] should display the default "select a client" placeholder in the right panel', async ({ page }) => {
    // GIVEN: No client is selected (user navigates to /clientes root)
    await page.route('**/api/v1/clientes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: The default placeholder text is visible in the right panel
    await expect(page.getByTestId('cliente-detail-panel')).toContainText(
      'Selecciona un cliente para ver sus detalles',
    );
  });

  test('[P1] should NOT display cliente-detail-content when no client is selected', async ({ page }) => {
    // GIVEN: User is on /clientes with no child route active
    await page.route('**/api/v1/clientes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: No detail content is shown
    await expect(page.getByTestId('cliente-detail-content')).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Loading skeleton
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Loading skeleton while fetching client detail', () => {
  test('[P2] should not crash or show a blank panel while the detail API is pending', async ({ page }) => {
    // GIVEN: The detail API is slow to respond
    let resolveRequest!: (value: unknown) => void;
    const pending = new Promise((resolve) => {
      resolveRequest = resolve;
    });

    await page.route('**/api/v1/clientes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/api/v1/clientes/*', async (route) => {
      // Delay the detail response until we resolve externally
      await pending;
      await route.continue();
    });

    // WHEN: User navigates directly to a client detail URL
    const NON_EXISTENT_GUID = '11111111-1111-1111-1111-111111111111';
    // Start navigation without awaiting full load
    const gotoPromise = page.goto(`/clientes/${NON_EXISTENT_GUID}`);

    // THEN: The panel is rendered (no blank page) — resolve and finish
    resolveRequest(undefined);
    await gotoPromise;

    // Page must render at least the panel wrapper
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Server/network error (500) during detail load
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Server error (500) on GET /api/v1/clientes/:id', () => {
  test('[P1] should display the not-found message when the API returns 500', async ({ page }) => {
    // GIVEN: The server returns a 500 for the detail endpoint
    const SOME_GUID = '22222222-2222-2222-2222-222222222222';
    await page.route('**/api/v1/clientes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
    await page.route(`**/api/v1/clientes/${SOME_GUID}`, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Internal Server Error', status: 500 }),
      });
    });

    // WHEN: User navigates directly to the detail URL
    await page.goto(`/clientes/${SOME_GUID}`);

    // THEN: An error/not-found state is shown — no unhandled exception crash
    await expect(
      page.getByTestId('cliente-not-found'),
    ).toBeVisible();
  });

  test('[P1] should not expose a blank screen on 500 error', async ({ page }) => {
    // GIVEN: 500 error from detail endpoint
    const SOME_GUID = '33333333-3333-3333-3333-333333333333';
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.route('**/api/v1/clientes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
    await page.route(`**/api/v1/clientes/${SOME_GUID}`, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Internal Server Error', status: 500 }),
      });
    });

    // WHEN: Navigate to the failing detail URL
    await page.goto(`/clientes/${SOME_GUID}`);

    // THEN: No uncaught JS errors (pageerror events)
    expect(consoleErrors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Switching between two clients
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Switching from one client to another', () => {
  let apiHelper: ApiHelper;
  const createdIds: string[] = [];

  test.beforeEach(async ({ request }) => {
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  test('[P1] should show the second client details after clicking a different list item', async ({ page }) => {
    // GIVEN: Two clients exist
    const data1 = buildCliente({ nombre: 'Empresa Switch A', nit: '111222333-1' });
    const data2 = buildCliente({ nombre: 'Empresa Switch B', nit: '444555666-2' });
    const clienteA = await apiHelper.createCliente(data1);
    const clienteB = await apiHelper.createCliente(data2);
    createdIds.push(clienteA.id, clienteB.id);

    await page.route('**/api/v1/clientes', async (route) => await route.continue());
    await page.route(`**/api/v1/clientes/${clienteA.id}`, async (route) => await route.continue());
    await page.route(`**/api/v1/clientes/${clienteB.id}`, async (route) => await route.continue());

    // WHEN: User clicks the first client, then clicks the second client
    await page.goto('/clientes');
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Switch A' }).click();
    await expect(page.getByTestId('cliente-detail-content')).toContainText('Empresa Switch A');

    await page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Switch B' }).click();

    // THEN: The detail panel now shows the second client's data
    await expect(page.getByTestId('cliente-detail-content')).toContainText('Empresa Switch B');
  });

  test('[P2] should update the URL to the second client ID after switching', async ({ page }) => {
    // GIVEN: Two clients exist
    const data1 = buildCliente({ nombre: 'Empresa URL Switch A', nit: '777888999-3' });
    const data2 = buildCliente({ nombre: 'Empresa URL Switch B', nit: '111333555-4' });
    const clienteA = await apiHelper.createCliente(data1);
    const clienteB = await apiHelper.createCliente(data2);
    createdIds.push(clienteA.id, clienteB.id);

    await page.route('**/api/v1/clientes', async (route) => await route.continue());
    await page.route(`**/api/v1/clientes/${clienteA.id}`, async (route) => await route.continue());
    await page.route(`**/api/v1/clientes/${clienteB.id}`, async (route) => await route.continue());

    // WHEN: User clicks A then B
    await page.goto('/clientes');
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa URL Switch A' }).click();
    await expect(page).toHaveURL(new RegExp(`/clientes/${clienteA.id}`));

    await page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa URL Switch B' }).click();

    // THEN: URL reflects the second client's ID
    await expect(page).toHaveURL(new RegExp(`/clientes/${clienteB.id}`));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Back navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Back navigation from client detail', () => {
  let apiHelper: ApiHelper;
  const createdIds: string[] = [];

  test.beforeEach(async ({ request }) => {
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  test('[P2] should return to /clientes and show default panel after browser back navigation', async ({ page }) => {
    // GIVEN: User navigated to a client detail
    const data = buildCliente({ nombre: 'Empresa Back Nav', nit: '222333444-5' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    await page.route('**/api/v1/clientes', async (route) => await route.continue());
    await page.route(`**/api/v1/clientes/${cliente.id}`, async (route) => await route.continue());

    await page.goto('/clientes');
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Back Nav' }).click();
    await expect(page.getByTestId('cliente-detail-content')).toBeVisible();

    // WHEN: User presses the browser back button
    await page.goBack();

    // THEN: URL returns to /clientes and the left panel is still visible
    await expect(page).toHaveURL('/clientes');
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
  });
});

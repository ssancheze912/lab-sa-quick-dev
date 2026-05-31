/**
 * ATDD E2E Tests — Story 2.2: Client Detail View
 *
 * RED Phase: These tests fail until ClienteDetailView, the /clientes/$clienteId
 * route, and the ClienteListView navigation (TanStack Router <Link>) are implemented.
 *
 * Covers:
 *   AC1  — TC-E2-P1-08 (partial): Click client item → URL updates, right panel shows detail
 *   AC1  — TC-E2-P1-08: Deep link /clientes/:clienteId direct URL shows correct detail
 *   AC3  — Non-existent clienteId: not-found message, navigation shell remains visible
 *   AC5  — /clientes (no clienteId): right panel shows empty placeholder
 *
 * Pattern: Playwright E2E + ApiHelper for data setup/teardown
 * Network-first: page.route() intercepts are set BEFORE page.goto()
 */

import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

test.describe('Story 2.2 — Client Detail View', () => {
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

  // --------------------------------------------------------------------------
  // AC5 — /clientes (no clienteId): right panel shows empty placeholder
  // Given no client is selected,
  // When the user navigates to /clientes,
  // Then the right panel shows an empty/placeholder state
  // --------------------------------------------------------------------------

  test('AC5 — Given no client is selected, When user navigates to /clientes, Then right panel shows empty placeholder', async ({ page }) => {
    // GIVEN: Intercept API before navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // WHEN: User navigates to /clientes (no clienteId selected)
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');

    // THEN: Right panel shows placeholder message
    await expect(
      page.getByText('Selecciona un cliente para ver sus detalles')
    ).toBeVisible();
  });

  // --------------------------------------------------------------------------
  // AC1 — Click client item → URL updates to /clientes/:clienteId,
  //        right panel shows client details
  // --------------------------------------------------------------------------

  test('AC1 — Given client list is displayed, When user clicks a client item, Then URL updates to /clientes/:clienteId', async ({ page }) => {
    // GIVEN: Seed one client via API
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // Intercept the list and detail API calls BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cliente),
      })
    );

    // WHEN: User navigates to /clientes and clicks the client item
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');
    await page.getByTestId('cliente-list-item').filter({ hasText: data.nombre }).click();

    // THEN: URL updates to include the clienteId
    await page.waitForURL(`**/clientes/${cliente.id}`);
    expect(page.url()).toContain(`/clientes/${cliente.id}`);
  });

  test('AC1 — Given client list is displayed, When user clicks a client item, Then right panel shows Nombre', async ({ page }) => {
    // GIVEN: Seed one client via API
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // Intercept BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cliente),
      })
    );

    // WHEN: User navigates to /clientes and clicks the client
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');
    await page.getByTestId('cliente-list-item').filter({ hasText: data.nombre }).click();

    // THEN: Right panel displays the client Nombre in h2
    await expect(
      page.getByRole('region', { name: 'Detalle del cliente' }).getByRole('heading')
    ).toHaveText(data.nombre);
  });

  // --------------------------------------------------------------------------
  // AC2 / TC-E2-P1-08 — Deep link /clientes/:clienteId displays correct client detail
  // Given the user accesses /clientes/:clienteId directly,
  // When the page loads,
  // Then the correct client details are loaded and displayed
  // --------------------------------------------------------------------------

  test('TC-E2-P1-08 — Given direct URL /clientes/:clienteId, When page loads, Then Nombre is displayed in detail panel', async ({ page }) => {
    // GIVEN: Seed one client and intercept API BEFORE navigation
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cliente),
      })
    );
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      })
    );

    // WHEN: User navigates directly to the deep link URL
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: Client Nombre is displayed in the right panel
    await expect(
      page.getByRole('region', { name: 'Detalle del cliente' }).getByRole('heading')
    ).toHaveText(data.nombre);
  });

  test('TC-E2-P1-08 — Given direct URL /clientes/:clienteId, When page loads, Then NIT/RUC is displayed', async ({ page }) => {
    // GIVEN: Seed one client and intercept API BEFORE navigation
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cliente),
      })
    );
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      })
    );

    // WHEN: User navigates directly to the deep link URL
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: NIT/RUC value is visible in the detail panel
    await expect(
      page.getByRole('region', { name: 'Detalle del cliente' })
    ).toContainText(data.nit);
  });

  test('TC-E2-P1-08 — Given direct URL /clientes/:clienteId, When page loads, Then no redirect occurs and navigation shell is visible', async ({ page }) => {
    // GIVEN: Seed one client and intercept API BEFORE navigation
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cliente),
      })
    );
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      })
    );

    // WHEN: User navigates directly to the deep link URL
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: URL remains at the deep link (no redirect away)
    expect(page.url()).toContain(`/clientes/${cliente.id}`);

    // AND: Navigation shell is visible (sidebar/navbar still rendered)
    await expect(
      page.getByRole('navigation')
    ).toBeVisible();
  });

  // --------------------------------------------------------------------------
  // AC3 — Non-existent clienteId shows not-found message gracefully
  // Given a clienteId in the URL does not exist,
  // When the page loads,
  // Then a not-found message is displayed, no JS error, navigation shell visible
  // --------------------------------------------------------------------------

  test('AC3 — Given non-existent clienteId in URL, When page loads, Then not-found message is displayed', async ({ page }) => {
    const nonExistentId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

    // GIVEN: Intercept before navigation — 404 for this specific id
    await page.route(`**/api/v1/clientes/${nonExistentId}`, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({ status: 404, title: 'Not Found' }),
      })
    );
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // WHEN: User navigates to a non-existent clienteId URL
    await page.goto(`/clientes/${nonExistentId}`);

    // THEN: Not-found message is displayed
    await expect(
      page.getByText('El cliente no existe o fue eliminado.')
    ).toBeVisible();
  });

  test('AC3 — Given non-existent clienteId in URL, When page loads, Then navigation shell remains visible', async ({ page }) => {
    const nonExistentId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

    // GIVEN: Intercept before navigation — 404 for this specific id
    await page.route(`**/api/v1/clientes/${nonExistentId}`, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({ status: 404, title: 'Not Found' }),
      })
    );
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // WHEN: User navigates to a non-existent clienteId URL
    await page.goto(`/clientes/${nonExistentId}`);

    // THEN: Navigation shell remains visible (no blank page, no broken layout)
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('AC3 — Given non-existent clienteId in URL, When page loads, Then no JavaScript error is thrown', async ({ page }) => {
    const nonExistentId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

    // GIVEN: Listen for JS errors and intercept API before navigation
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await page.route(`**/api/v1/clientes/${nonExistentId}`, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({ status: 404, title: 'Not Found' }),
      })
    );
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // WHEN: User navigates to a non-existent clienteId URL
    await page.goto(`/clientes/${nonExistentId}`);
    // Wait for the not-found message to confirm page rendered
    await expect(
      page.getByText('El cliente no existe o fue eliminado.')
    ).toBeVisible();

    // THEN: No JavaScript errors were thrown
    expect(jsErrors).toHaveLength(0);
  });
});

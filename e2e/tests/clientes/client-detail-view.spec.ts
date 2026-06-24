/**
 * E2E Tests — Story 2.2: Client Detail View
 * RED PHASE — Tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Clicking a client item shows complete details in right panel + URL updates to /clientes/:clienteId (FR30)
 *   AC2 — Direct URL access /clientes/:clienteId fetches and displays correct client details
 *   AC3 — Non-existent clienteId (404) shows "Cliente no encontrado." gracefully — no error/stack trace
 *   AC4 — Backend unavailable: ErrorPanel + "Reintentar" button in right panel; retry triggers new fetch
 *   AC5 — Loading state: skeleton loader rendered (no spinner)
 *   AC6 — No clienteId (/clientes): right panel shows placeholder "Selecciona un cliente para ver sus detalles."
 *   AC7 — Selected ClientListItem shows active visual state (bg-primary-50 text-primary-700 via aria-selected)
 *
 * Required data-testid attributes (must be added during implementation):
 *   - cliente-detail-view            → ClienteDetailView root section
 *   - cliente-detail-nombre          → field value: Nombre
 *   - cliente-detail-nit             → field value: NIT/RUC
 *   - cliente-detail-telefono        → field value: Teléfono
 *   - cliente-detail-ciudad          → field value: Ciudad
 *   - cliente-detail-placeholder     → right panel placeholder when no client selected
 *   - cliente-detail-skeleton        → skeleton loader in right panel during fetch
 *   - cliente-not-found              → "Cliente no encontrado." message on 404
 *   - error-panel                    → ErrorPanel component in right panel on non-404 error
 *   - retry-button                   → "Reintentar" button inside ErrorPanel
 *   - client-list-item-{id}          → each ClientListItem (from Story 2.1)
 *
 * Network intercept strategy: ALWAYS intercept routes BEFORE navigation (network-first).
 */

import { test, expect } from '@playwright/test';
import { createClienteDto, createClienteDtos } from '../../support/factories/cliente.factory';

const API_CLIENTES = '**/api/v1/clientes';
const API_CLIENTE_BY_ID = '**/api/v1/clientes/**';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Click client item: right panel shows details + URL updates
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Clicking a client item shows detail in right panel and updates URL', () => {
  test('should update the URL to /clientes/:clienteId when a list item is clicked', async ({ page }) => {
    // GIVEN: A client exists in the list
    const cliente = createClienteDto({ id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' });

    // Network-first: intercept list and detail routes BEFORE navigation
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );

    await page.goto('/clientes');

    // WHEN: User clicks on a client list item
    await page.getByTestId(`client-list-item-${cliente.id}`).click();

    // THEN: URL updates to /clientes/:clienteId (client-side navigation, no page reload)
    await expect(page).toHaveURL(/\/clientes\/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/);
  });

  test('should display the right panel with ClienteDetailView after clicking a list item', async ({ page }) => {
    // GIVEN: A client exists in the list
    const cliente = createClienteDto({ id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );

    await page.goto('/clientes');

    // WHEN: User clicks on the client item
    await page.getByTestId(`client-list-item-${cliente.id}`).click();

    // THEN: ClienteDetailView is visible in the right panel
    await expect(page.getByTestId('cliente-detail-view')).toBeVisible();
  });

  test('should display client Nombre in the detail view after clicking a list item', async ({ page }) => {
    // GIVEN: A client with a specific Nombre
    const cliente = createClienteDto({ id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', nombre: 'Empresa Detalle SA' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );

    await page.goto('/clientes');
    await page.getByTestId(`client-list-item-${cliente.id}`).click();

    // THEN: Nombre is displayed in the detail panel
    await expect(page.getByTestId('cliente-detail-nombre')).toHaveText('Empresa Detalle SA');
  });

  test('should display client NIT/RUC in the detail view after clicking a list item', async ({ page }) => {
    // GIVEN: A client with a specific NIT
    const cliente = createClienteDto({ id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', nit: '900111222-3' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );

    await page.goto('/clientes');
    await page.getByTestId(`client-list-item-${cliente.id}`).click();

    // THEN: NIT/RUC is displayed in the detail panel
    await expect(page.getByTestId('cliente-detail-nit')).toHaveText('900111222-3');
  });

  test('should display client Teléfono in the detail view after clicking a list item', async ({ page }) => {
    // GIVEN: A client with a specific Teléfono
    const cliente = createClienteDto({ id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', telefono: '3205551234' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );

    await page.goto('/clientes');
    await page.getByTestId(`client-list-item-${cliente.id}`).click();

    // THEN: Teléfono is displayed in the detail panel
    await expect(page.getByTestId('cliente-detail-telefono')).toHaveText('3205551234');
  });

  test('should display client Ciudad in the detail view after clicking a list item', async ({ page }) => {
    // GIVEN: A client with a specific Ciudad
    const cliente = createClienteDto({ id: 'ffffffff-ffff-ffff-ffff-ffffffffffff', ciudad: 'Cali' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );

    await page.goto('/clientes');
    await page.getByTestId(`client-list-item-${cliente.id}`).click();

    // THEN: Ciudad is displayed in the detail panel
    await expect(page.getByTestId('cliente-detail-ciudad')).toHaveText('Cali');
  });

  test('should NOT trigger a full page reload when navigating to /clientes/:clienteId (client-side nav)', async ({ page }) => {
    // GIVEN: A client exists
    const cliente = createClienteDto({ id: '11111111-1111-1111-1111-111111111111' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );

    await page.goto('/clientes');

    // Track full page reloads
    let fullReloadDetected = false;
    page.on('load', () => { fullReloadDetected = true; });
    fullReloadDetected = false; // reset after initial load

    // WHEN: User clicks the client item
    await page.getByTestId(`client-list-item-${cliente.id}`).click();
    await page.waitForURL(/\/clientes\//);

    // THEN: No full page reload occurred
    expect(fullReloadDetected).toBe(false);
  });

  test('should keep ClienteListView visible in the left panel after navigating to detail', async ({ page }) => {
    // GIVEN: A client exists
    const cliente = createClienteDto({ id: '22222222-2222-2222-2222-222222222222' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );

    await page.goto('/clientes');
    await page.getByTestId(`client-list-item-${cliente.id}`).click();

    // THEN: The left panel list view is still visible (split layout maintained)
    await expect(page.getByTestId('cliente-list-view')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Direct URL access /clientes/:clienteId fetches and displays client
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Direct URL access /clientes/:clienteId loads client details', () => {
  test('should fetch and display client details when navigating directly to /clientes/:clienteId', async ({ page }) => {
    // GIVEN: A client exists with a known ID
    const cliente = createClienteDto({ id: '33333333-3333-3333-3333-333333333333', nombre: 'Direct Access Corp' });

    // Network-first: intercept both list and detail APIs BEFORE navigation
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );

    // WHEN: User navigates directly to the detail URL
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: The detail view shows the correct client Nombre
    await expect(page.getByTestId('cliente-detail-nombre')).toHaveText('Direct Access Corp');
  });

  test('should send a GET /api/v1/clientes/:id request when accessing detail URL directly', async ({ page }) => {
    // GIVEN: A client ID is in the URL
    const cliente = createClienteDto({ id: '44444444-4444-4444-4444-444444444444' });
    let detailApiCalled = false;

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) => {
      detailApiCalled = true;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    // WHEN: Direct URL navigation
    await page.goto(`/clientes/${cliente.id}`);
    await expect(page.getByTestId('cliente-detail-view')).toBeVisible();

    // THEN: The API was called for the individual client
    expect(detailApiCalled).toBe(true);
  });

  test('should display all four fields (Nombre, NIT/RUC, Teléfono, Ciudad) on direct URL access', async ({ page }) => {
    // GIVEN: A client with all fields populated
    const cliente = createClienteDto({
      id: '55555555-5555-5555-5555-555555555555',
      nombre: 'Full Fields SA',
      nit: '800999333-4',
      telefono: '3104445566',
      ciudad: 'Barranquilla',
    });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );

    // WHEN: Direct URL access
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: All four fields are rendered
    await expect(page.getByTestId('cliente-detail-nombre')).toHaveText('Full Fields SA');
    await expect(page.getByTestId('cliente-detail-nit')).toHaveText('800999333-4');
    await expect(page.getByTestId('cliente-detail-telefono')).toHaveText('3104445566');
    await expect(page.getByTestId('cliente-detail-ciudad')).toHaveText('Barranquilla');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Non-existent clienteId (404): graceful not-found message
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Non-existent clienteId shows graceful not-found message', () => {
  test('should display "Cliente no encontrado." when backend returns 404', async ({ page }) => {
    // GIVEN: A clienteId that does not exist (backend returns 404 Problem Details)
    const nonExistentId = '99999999-9999-9999-9999-999999999999';

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.route(`**/api/v1/clientes/${nonExistentId}`, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ status: 404, title: 'Not Found', detail: `Cliente with id '${nonExistentId}' was not found.` }),
      })
    );

    // WHEN: User navigates directly to the non-existent client URL
    await page.goto(`/clientes/${nonExistentId}`);

    // THEN: A graceful not-found message is displayed
    await expect(page.getByTestId('cliente-not-found')).toBeVisible();
    await expect(page.getByTestId('cliente-not-found')).toContainText('Cliente no encontrado.');
  });

  test('should NOT display an unhandled error or stack trace when backend returns 404', async ({ page }) => {
    // GIVEN: A clienteId that does not exist
    const nonExistentId = '88888888-8888-8888-8888-888888888888';

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.route(`**/api/v1/clientes/${nonExistentId}`, (route) =>
      route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ status: 404, title: 'Not Found' }) })
    );

    // Track uncaught JS errors (stack traces in the browser)
    const uncaughtErrors: string[] = [];
    page.on('pageerror', (err) => uncaughtErrors.push(err.message));

    // WHEN: User navigates to non-existent URL
    await page.goto(`/clientes/${nonExistentId}`);
    await expect(page.getByTestId('cliente-not-found')).toBeVisible();

    // THEN: No uncaught JS errors (no stack traces)
    expect(uncaughtErrors).toHaveLength(0);
  });

  test('should NOT render the ErrorPanel component when backend returns 404 (not-found is different from error)', async ({ page }) => {
    // GIVEN: A non-existent clienteId
    const nonExistentId = '77777777-7777-7777-7777-777777777777';

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.route(`**/api/v1/clientes/${nonExistentId}`, (route) =>
      route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ status: 404, title: 'Not Found' }) })
    );

    // WHEN: 404 scenario
    await page.goto(`/clientes/${nonExistentId}`);
    await expect(page.getByTestId('cliente-not-found')).toBeVisible();

    // THEN: ErrorPanel is NOT rendered (404 is a not-found state, not a generic error)
    await expect(page.getByTestId('error-panel')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Backend unavailable: ErrorPanel + Reintentar in right panel
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Backend unavailable: ErrorPanel with Reintentar in right panel', () => {
  test('should render ErrorPanel in the right panel when detail fetch returns 500', async ({ page }) => {
    // GIVEN: A client exists in the list but detail fetch fails with 500
    const cliente = createClienteDto({ id: '12121212-1212-1212-1212-121212121212' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ status: 500, title: 'Internal Server Error' }) })
    );

    // WHEN: User navigates directly to the detail URL
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: ErrorPanel is visible in the right panel
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('should render a "Reintentar" button inside the ErrorPanel in the right panel', async ({ page }) => {
    // GIVEN: Detail fetch fails
    const cliente = createClienteDto({ id: '13131313-1313-1313-1313-131313131313' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({ status: 503, contentType: 'application/json', body: '{}' })
    );

    // WHEN: User navigates to the detail URL
    await page.goto(`/clientes/${cliente.id}`);
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // THEN: A "Reintentar" button is present
    await expect(page.getByTestId('retry-button')).toBeVisible();
  });

  test('should trigger a new fetch when "Reintentar" is clicked in the detail right panel', async ({ page }) => {
    // GIVEN: First detail request fails, second succeeds
    const cliente = createClienteDto({ id: '14141414-1414-1414-1414-141414141414', nombre: 'Retry Success Corp' });
    let detailCallCount = 0;

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) => {
      detailCallCount++;
      if (detailCallCount === 1) {
        return route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    await page.goto(`/clientes/${cliente.id}`);
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // WHEN: User clicks "Reintentar"
    await page.getByTestId('retry-button').click();

    // THEN: A second API call is made and the detail view renders
    await expect(page.getByTestId('cliente-detail-view')).toBeVisible();
    expect(detailCallCount).toBe(2);
  });

  test('should render ErrorPanel when detail fetch fails with a network error (abort)', async ({ page }) => {
    // GIVEN: Detail fetch is aborted (network error)
    const cliente = createClienteDto({ id: '15151515-1515-1515-1515-151515151515' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) => route.abort('failed'));

    // WHEN: User navigates to the detail URL
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: ErrorPanel is displayed in the right panel
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Loading state: skeleton loader in right panel (no spinner)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Skeleton loader shown during detail fetch (no spinner)', () => {
  test('should render a skeleton loader in the right panel while the detail API is in flight', async ({ page }) => {
    // GIVEN: Detail API is held pending (deferred — no hard wait)
    const cliente = createClienteDto({ id: '16161616-1616-1616-1616-161616161616' });
    let releaseDetail!: () => void;
    const detailHeld = new Promise<void>((resolve) => { releaseDetail = resolve; });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, async (route) => {
      await detailHeld;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    // WHEN: User navigates to the detail URL (fetch is in-flight)
    const gotoPromise = page.goto(`/clientes/${cliente.id}`);

    // THEN: Skeleton loader is visible before data arrives
    await expect(page.getByTestId('cliente-detail-skeleton')).toBeVisible();

    // Cleanup: release the route and wait for navigation
    releaseDetail();
    await gotoPromise;
  });

  test('should NOT render a spinner in the right panel during loading (skeleton only)', async ({ page }) => {
    // GIVEN: Detail API is held pending
    const cliente = createClienteDto({ id: '17171717-1717-1717-1717-171717171717' });
    let releaseDetail!: () => void;
    const detailHeld = new Promise<void>((resolve) => { releaseDetail = resolve; });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, async (route) => {
      await detailHeld;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) });
    });

    // WHEN: User navigates (loading state active)
    const gotoPromise = page.goto(`/clientes/${cliente.id}`);

    // THEN: No spinner is present in the DOM
    const spinner = page.locator('[role="progressbar"], .spinner, [data-testid="spinner"]');
    await expect(spinner).toHaveCount(0);

    // Cleanup
    releaseDetail();
    await gotoPromise;
  });

  test('should hide the skeleton loader once the detail data is fully loaded', async ({ page }) => {
    // GIVEN: Detail API returns client data
    const cliente = createClienteDto({ id: '18181818-1818-1818-1818-181818181818' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );

    // WHEN: User navigates and data loads
    await page.goto(`/clientes/${cliente.id}`);
    await expect(page.getByTestId('cliente-detail-view')).toBeVisible();

    // THEN: Skeleton is no longer visible
    await expect(page.getByTestId('cliente-detail-skeleton')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — No clienteId selected: right panel shows placeholder
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — No client selected: right panel shows placeholder state', () => {
  test('should render the placeholder "Selecciona un cliente para ver sus detalles." when navigating to /clientes', async ({ page }) => {
    // GIVEN: Clients exist but no specific client is selected
    const clientes = createClienteDtos(2);

    // Network-first interception
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clientes) })
    );

    // WHEN: User navigates to /clientes (no clienteId in URL)
    await page.goto('/clientes');

    // THEN: The right panel placeholder is shown with Spanish message
    await expect(page.getByTestId('cliente-detail-placeholder')).toBeVisible();
    await expect(page.getByTestId('cliente-detail-placeholder')).toContainText('Selecciona un cliente para ver sus detalles.');
  });

  test('should NOT render ClienteDetailView when no clienteId is in the URL', async ({ page }) => {
    // GIVEN: Clients exist
    const clientes = createClienteDtos(1);

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clientes) })
    );

    // WHEN: User navigates to /clientes (no selection)
    await page.goto('/clientes');

    // THEN: The detail view is not rendered
    await expect(page.getByTestId('cliente-detail-view')).not.toBeVisible();
  });

  test('should show placeholder even when client list is empty', async ({ page }) => {
    // GIVEN: No clients in the system
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: The right panel shows the placeholder (not an error)
    await expect(page.getByTestId('cliente-detail-placeholder')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC7 — Selected ClientListItem shows active visual state
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 — Selected ClientListItem shows active visual state', () => {
  test('should apply aria-selected="true" to the clicked ClientListItem', async ({ page }) => {
    // GIVEN: A client exists in the list
    const cliente = createClienteDto({ id: '19191919-1919-1919-1919-191919191919' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );

    await page.goto('/clientes');

    // WHEN: User clicks on a client list item
    await page.getByTestId(`client-list-item-${cliente.id}`).click();

    // THEN: The clicked item has aria-selected="true" (accessible active state)
    await expect(page.getByTestId(`client-list-item-${cliente.id}`)).toHaveAttribute('aria-selected', 'true');
  });

  test('should remove active state from previously selected item when a new one is clicked', async ({ page }) => {
    // GIVEN: Two clients exist
    const clienteA = createClienteDto({ id: '20202020-2020-2020-2020-202020202020' });
    const clienteB = createClienteDto({ id: '21212121-2121-2121-2121-212121212121' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([clienteA, clienteB]) })
    );
    await page.route(`**/api/v1/clientes/${clienteA.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clienteA) })
    );
    await page.route(`**/api/v1/clientes/${clienteB.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clienteB) })
    );

    await page.goto('/clientes');

    // Select first client
    await page.getByTestId(`client-list-item-${clienteA.id}`).click();
    await expect(page.getByTestId(`client-list-item-${clienteA.id}`)).toHaveAttribute('aria-selected', 'true');

    // WHEN: User clicks second client
    await page.getByTestId(`client-list-item-${clienteB.id}`).click();

    // THEN: Second client is now selected, first is no longer selected
    await expect(page.getByTestId(`client-list-item-${clienteB.id}`)).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId(`client-list-item-${clienteA.id}`)).toHaveAttribute('aria-selected', 'false');
  });

  test('should pre-select the item matching clienteId when page is loaded via direct URL', async ({ page }) => {
    // GIVEN: A client with a known ID accessed via direct URL
    const cliente = createClienteDto({ id: '22222222-2222-2222-2222-222222222222' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );

    // WHEN: Direct URL access
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: The matching list item shows active/selected state
    await expect(page.getByTestId(`client-list-item-${cliente.id}`)).toHaveAttribute('aria-selected', 'true');
  });
});

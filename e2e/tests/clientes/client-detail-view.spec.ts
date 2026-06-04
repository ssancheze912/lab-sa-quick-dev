/**
 * Story 2.2: Client Detail View
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (E2E Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Clicking a client item shows complete details in right panel and URL updates to /clientes/:clienteId
 *   AC2 — Direct navigation to /clientes/:clienteId (deep link) loads and displays the correct client
 *   AC3 — Non-existent clienteId shows graceful not-found message; no JS exception; left panel still renders
 *
 * Test Cases:
 *   TC-E2-P1-06 — Click client item → right panel shows details + URL updates
 *   TC-E2-P1-07 — Deep link to /clientes/:knownId loads correct detail
 *   TC-E2-P1-08 — Deep link to invalid/non-existent id → graceful not-found
 */

import { test, expect } from '@playwright/test';

const API_CLIENTES = '**/api/v1/clientes';
const API_CLIENTE_BY_ID = '**/api/v1/clientes/*';

const CLIENTE_ALFA = {
  id: 'a1b2c3d4-0001-0000-0000-000000000001',
  nombre: 'Empresa Alfa',
  nit: '900100200-1',
  telefono: '3001234567',
  ciudad: 'Bogotá',
  createdAt: '2026-01-01T00:00:00Z',
};

const CLIENTE_BETA = {
  id: 'a1b2c3d4-0001-0000-0000-000000000002',
  nombre: 'Beta Ltda',
  nit: '800200300-2',
  telefono: '3109876543',
  ciudad: 'Medellín',
  createdAt: '2026-01-02T00:00:00Z',
};

const NON_EXISTENT_ID = '00000000-0000-0000-0000-000000000000';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 / TC-E2-P1-06: Click client item → right panel + URL update
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Click client item opens detail in right panel (TC-E2-P1-06)', () => {
  test('should show the right panel with client detail after clicking a list item', async ({
    page,
  }) => {
    // GIVEN: The client list is loaded with at least one client (intercept before navigate)
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([CLIENTE_ALFA, CLIENTE_BETA]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ALFA.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_ALFA),
      })
    );

    await page.goto('/clientes');

    // Wait for the list to render
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // WHEN: The user clicks on the first client item (Empresa Alfa)
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Alfa' }).click();

    // THEN: The right panel with client details is visible
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
  });

  test('should display Nombre in the right panel after clicking a client item', async ({ page }) => {
    // GIVEN: The client list is loaded and detail API is mocked
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([CLIENTE_ALFA]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ALFA.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_ALFA),
      })
    );

    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // WHEN: The user clicks on the client item
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Alfa' }).click();

    // THEN: The Nombre field is visible with the correct value
    await expect(page.getByTestId('cliente-nombre')).toHaveText('Empresa Alfa');
  });

  test('should display NIT/RUC in the right panel after clicking a client item', async ({ page }) => {
    // GIVEN: The client list and detail API are mocked
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([CLIENTE_ALFA]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ALFA.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_ALFA),
      })
    );

    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // WHEN: The user clicks on the client item
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Alfa' }).click();

    // THEN: The NIT/RUC field is visible with the correct value
    await expect(page.getByTestId('cliente-nit')).toHaveText('900100200-1');
  });

  test('should display Teléfono in the right panel after clicking a client item', async ({ page }) => {
    // GIVEN: The client list and detail API are mocked
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([CLIENTE_ALFA]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ALFA.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_ALFA),
      })
    );

    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // WHEN: The user clicks on the client item
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Alfa' }).click();

    // THEN: The Teléfono field is visible with the correct value
    await expect(page.getByTestId('cliente-telefono')).toHaveText('3001234567');
  });

  test('should display Ciudad in the right panel after clicking a client item', async ({ page }) => {
    // GIVEN: The client list and detail API are mocked
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([CLIENTE_ALFA]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ALFA.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_ALFA),
      })
    );

    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // WHEN: The user clicks on the client item
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Alfa' }).click();

    // THEN: The Ciudad field is visible with the correct value
    await expect(page.getByTestId('cliente-ciudad')).toHaveText('Bogotá');
  });

  test('should update the URL to /clientes/:clienteId after clicking a client item', async ({
    page,
  }) => {
    // GIVEN: The client list and detail API are mocked
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([CLIENTE_ALFA]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ALFA.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_ALFA),
      })
    );

    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // WHEN: The user clicks on the client item
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Alfa' }).click();

    // THEN: The URL updates to /clientes/:clienteId (FR30 deep linking)
    await expect(page).toHaveURL(new RegExp(`/clientes/${CLIENTE_ALFA.id}`));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 / TC-E2-P1-07: Deep link to /clientes/:knownId
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Deep link to /clientes/:clienteId (TC-E2-P1-07)', () => {
  test('should load and display correct client details when navigating directly to /clientes/:id', async ({
    page,
  }) => {
    // GIVEN: The API returns the client and list (intercept before navigate)
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([CLIENTE_ALFA]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ALFA.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_ALFA),
      })
    );

    // WHEN: The user navigates directly to the detail URL (deep link)
    await page.goto(`/clientes/${CLIENTE_ALFA.id}`);

    // THEN: The right panel with client details is visible
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
  });

  test('should show Nombre on deep link to /clientes/:id', async ({ page }) => {
    // GIVEN: API returns client on direct navigation
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([CLIENTE_ALFA]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ALFA.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_ALFA),
      })
    );

    // WHEN: The user navigates directly to the detail URL
    await page.goto(`/clientes/${CLIENTE_ALFA.id}`);

    // THEN: Nombre is displayed correctly
    await expect(page.getByTestId('cliente-nombre')).toHaveText('Empresa Alfa');
  });

  test('should show NIT/RUC on deep link to /clientes/:id', async ({ page }) => {
    // GIVEN: API returns client on direct navigation
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([CLIENTE_ALFA]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ALFA.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_ALFA),
      })
    );

    // WHEN: The user navigates directly to the detail URL
    await page.goto(`/clientes/${CLIENTE_ALFA.id}`);

    // THEN: NIT/RUC is displayed correctly
    await expect(page.getByTestId('cliente-nit')).toHaveText('900100200-1');
  });

  test('should preserve the left panel list on deep link navigation', async ({ page }) => {
    // GIVEN: Both list and detail APIs are mocked
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([CLIENTE_ALFA, CLIENTE_BETA]),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_ALFA.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_ALFA),
      })
    );

    // WHEN: The user navigates directly to the detail URL
    await page.goto(`/clientes/${CLIENTE_ALFA.id}`);

    // THEN: The left panel still shows client list items
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 / TC-E2-P1-08: Non-existent clienteId → graceful not-found
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Non-existent clienteId shows graceful not-found (TC-E2-P1-08)', () => {
  test('should display the not-found message when the clienteId does not exist', async ({ page }) => {
    // GIVEN: The list API returns clients; the detail API returns 404 (intercept before navigate)
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([CLIENTE_ALFA]),
      })
    );
    await page.route(`**/api/v1/clientes/${NON_EXISTENT_ID}`, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 404,
          title: 'Not Found',
          detail: 'El cliente no fue encontrado',
        }),
      })
    );

    // WHEN: The user navigates to a URL with a non-existent clienteId
    await page.goto(`/clientes/${NON_EXISTENT_ID}`);

    // THEN: The not-found message is displayed in the right panel
    await expect(page.getByTestId('cliente-not-found')).toBeVisible();
  });

  test('should NOT display the detail panel when the clienteId does not exist', async ({ page }) => {
    // GIVEN: The detail API returns 404
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([CLIENTE_ALFA]),
      })
    );
    await page.route(`**/api/v1/clientes/${NON_EXISTENT_ID}`, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 404,
          title: 'Not Found',
          detail: 'El cliente no fue encontrado',
        }),
      })
    );

    // WHEN: The user navigates to a URL with a non-existent clienteId
    await page.goto(`/clientes/${NON_EXISTENT_ID}`);

    // THEN: The data detail panel is NOT visible
    await expect(page.getByTestId('cliente-detail-panel')).not.toBeVisible();
  });

  test('should still render the left panel client list when the clienteId does not exist', async ({
    page,
  }) => {
    // GIVEN: The list API returns clients; the detail API returns 404
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([CLIENTE_ALFA]),
      })
    );
    await page.route(`**/api/v1/clientes/${NON_EXISTENT_ID}`, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 404,
          title: 'Not Found',
          detail: 'El cliente no fue encontrado',
        }),
      })
    );

    // WHEN: The user navigates to a URL with a non-existent clienteId
    await page.goto(`/clientes/${NON_EXISTENT_ID}`);

    // THEN: The left panel list still renders normally (AC3 constraint)
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
  });

  test('should NOT throw a JS exception when the clienteId does not exist', async ({ page }) => {
    // GIVEN: The detail API returns 404
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([CLIENTE_ALFA]),
      })
    );
    await page.route(`**/api/v1/clientes/${NON_EXISTENT_ID}`, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 404,
          title: 'Not Found',
          detail: 'El cliente no fue encontrado',
        }),
      })
    );

    // Capture uncaught page errors
    const pageErrors: Error[] = [];
    page.on('pageerror', (err) => pageErrors.push(err));

    // WHEN: The user navigates to a URL with a non-existent clienteId
    await page.goto(`/clientes/${NON_EXISTENT_ID}`);
    await expect(page.getByTestId('cliente-not-found')).toBeVisible();

    // THEN: No uncaught JS exceptions were thrown
    expect(pageErrors).toHaveLength(0);
  });
});

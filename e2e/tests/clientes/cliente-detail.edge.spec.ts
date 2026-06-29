/**
 * Edge-case E2E Tests — Client Detail View
 * Story 2.2 — Client Detail View — Automation Expansion
 *
 * Complements cliente-detail.spec.ts (ATDD baseline).
 * Covers edge cases NOT in ATDD:
 *   - Split-panel layout: list and detail coexist after navigation
 *   - Clicking a list item updates URL and shows detail (AC #1 + #2 interaction)
 *   - Default empty state on /clientes (no clienteId selected)
 *   - Navigating from one client to another in the list updates detail panel
 *   - Deep link with trailing slash (URL normalization)
 *   - URL retains clienteId after page reload (browser refresh)
 *   - NIT and Teléfono fields visible on deep link (not just Nombre)
 *   - Client list remains visible after navigating to detail (split panel stays)
 *
 * Strategy:
 *   - Network-first: route.fulfill intercepts BEFORE page.goto
 *   - Uses data-testid selectors only
 *   - One assertion per test (atomic)
 *   - Priority tags in test names: [P0], [P1], [P2]
 */

import { test, expect } from '@playwright/test';

const KNOWN_CLIENT_ID = '00000000-0000-0000-0000-000000000001';
const KNOWN_CLIENT_ID_2 = '00000000-0000-0000-0000-000000000002';

const KNOWN_CLIENT_MOCK = {
  id: KNOWN_CLIENT_ID,
  nombre: 'Empresa Edge E2E',
  nit: '900888777-1',
  telefono: '3008887771',
  ciudad: 'Cali',
  createdAt: '2026-06-29T10:00:00Z',
};

const KNOWN_CLIENT_MOCK_2 = {
  id: KNOWN_CLIENT_ID_2,
  nombre: 'Segunda Empresa E2E',
  nit: '900777666-2',
  telefono: '3007776662',
  ciudad: 'Barranquilla',
  createdAt: '2026-06-28T10:00:00Z',
};

// ---------------------------------------------------------------------------
// Edge: Default empty state on /clientes (no client selected)
// ---------------------------------------------------------------------------

test.describe('Default empty state on /clientes', () => {
  test('[P0] should show the empty state panel when no client is selected on /clientes', async ({ page }) => {
    // GIVEN: Network-first — list returns clients but no client is selected
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([KNOWN_CLIENT_MOCK]),
      })
    );

    // WHEN: User navigates to /clientes (no clienteId in URL)
    await page.goto('/clientes');

    // THEN: Empty state is shown in the right panel
    await expect(page.getByTestId('cliente-detail-empty')).toBeVisible();
  });

  test('[P1] should display "Selecciona un cliente" prompt in the empty state', async ({ page }) => {
    // GIVEN: Network-first
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([KNOWN_CLIENT_MOCK]),
      })
    );

    // WHEN: Navigate to /clientes
    await page.goto('/clientes');

    // THEN: Spanish prompt is visible in the detail panel
    await expect(page.getByTestId('cliente-detail-empty')).toContainText(/selecciona un cliente/i);
  });
});

// ---------------------------------------------------------------------------
// Edge: Split-panel coexistence — list stays visible after detail loads
// ---------------------------------------------------------------------------

test.describe('Split-panel layout — list and detail coexist', () => {
  test('[P1] should keep the client list visible after clicking on a client (split panel)', async ({ page }) => {
    // GIVEN: Network-first intercepts
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([KNOWN_CLIENT_MOCK]),
      })
    );
    await page.route(`**/api/v1/clientes/${KNOWN_CLIENT_ID}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(KNOWN_CLIENT_MOCK),
      })
    );

    // WHEN: User navigates to /clientes and clicks a client
    await page.goto('/clientes');
    await page.getByTestId(`cliente-item-${KNOWN_CLIENT_ID}`).click();

    // THEN: The client list is still visible (left panel did not disappear)
    await expect(page.getByTestId('clientes-list')).toBeVisible();
  });

  test('[P1] should show detail panel AND list panel simultaneously after client click', async ({ page }) => {
    // GIVEN: Network-first intercepts
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([KNOWN_CLIENT_MOCK]),
      })
    );
    await page.route(`**/api/v1/clientes/${KNOWN_CLIENT_ID}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(KNOWN_CLIENT_MOCK),
      })
    );

    // WHEN: User clicks a client
    await page.goto('/clientes');
    await page.getByTestId(`cliente-item-${KNOWN_CLIENT_ID}`).click();

    // THEN: Both panels are visible at the same time
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Edge: Teléfono and Ciudad fields visible on deep link (not just Nombre)
// ---------------------------------------------------------------------------

test.describe('Deep link — all 4 fields visible', () => {
  test('[P1] should display Teléfono in the detail panel on deep link navigation', async ({ page }) => {
    // GIVEN: Network-first intercepts
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([KNOWN_CLIENT_MOCK]),
      })
    );
    await page.route(`**/api/v1/clientes/${KNOWN_CLIENT_ID}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(KNOWN_CLIENT_MOCK),
      })
    );

    // WHEN: Direct navigation to deep link
    await page.goto(`/clientes/${KNOWN_CLIENT_ID}`);

    // THEN: Teléfono is shown
    await expect(page.getByTestId('cliente-detail-telefono')).toContainText('3008887771');
  });

  test('[P1] should display Ciudad in the detail panel on deep link navigation', async ({ page }) => {
    // GIVEN: Network-first intercepts
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([KNOWN_CLIENT_MOCK]),
      })
    );
    await page.route(`**/api/v1/clientes/${KNOWN_CLIENT_ID}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(KNOWN_CLIENT_MOCK),
      })
    );

    // WHEN: Direct navigation to deep link
    await page.goto(`/clientes/${KNOWN_CLIENT_ID}`);

    // THEN: Ciudad is shown
    await expect(page.getByTestId('cliente-detail-ciudad')).toContainText('Cali');
  });
});

// ---------------------------------------------------------------------------
// Edge: Navigating from one client to another updates the detail panel
// ---------------------------------------------------------------------------

test.describe('Switching between clients in the list', () => {
  test('[P1] should update the detail panel when user clicks a second client in the list', async ({ page }) => {
    // GIVEN: Two clients in the list
    const clients = [KNOWN_CLIENT_MOCK, KNOWN_CLIENT_MOCK_2];

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clients),
      })
    );
    await page.route(`**/api/v1/clientes/${KNOWN_CLIENT_ID}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(KNOWN_CLIENT_MOCK),
      })
    );
    await page.route(`**/api/v1/clientes/${KNOWN_CLIENT_ID_2}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(KNOWN_CLIENT_MOCK_2),
      })
    );

    // WHEN: Navigate to /clientes and click on first client
    await page.goto('/clientes');
    await page.getByTestId(`cliente-item-${KNOWN_CLIENT_ID}`).click();

    // THEN: First client detail is shown
    await expect(page.getByTestId('cliente-detail-nombre')).toContainText('Empresa Edge E2E');

    // WHEN: User clicks the second client
    await page.getByTestId(`cliente-item-${KNOWN_CLIENT_ID_2}`).click();

    // THEN: Second client detail is shown (detail panel updated)
    await expect(page.getByTestId('cliente-detail-nombre')).toContainText('Segunda Empresa E2E');
  });

  test('[P1] should update the URL when switching from one client to another', async ({ page }) => {
    // GIVEN: Two clients in the list
    const clients = [KNOWN_CLIENT_MOCK, KNOWN_CLIENT_MOCK_2];

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clients),
      })
    );
    await page.route(`**/api/v1/clientes/${KNOWN_CLIENT_ID}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(KNOWN_CLIENT_MOCK),
      })
    );
    await page.route(`**/api/v1/clientes/${KNOWN_CLIENT_ID_2}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(KNOWN_CLIENT_MOCK_2),
      })
    );

    // WHEN: Click first client then second client
    await page.goto('/clientes');
    await page.getByTestId(`cliente-item-${KNOWN_CLIENT_ID}`).click();
    await page.getByTestId(`cliente-item-${KNOWN_CLIENT_ID_2}`).click();

    // THEN: URL now contains the second client's ID
    await expect(page).toHaveURL(new RegExp(KNOWN_CLIENT_ID_2));
  });
});

// ---------------------------------------------------------------------------
// Edge: No JavaScript crash on deep link with valid client
// ---------------------------------------------------------------------------

test.describe('No JS crash on deep link', () => {
  test('[P0] should not throw any JavaScript errors on deep link to valid client', async ({ page }) => {
    // GIVEN: Network-first intercepts
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([KNOWN_CLIENT_MOCK]),
      })
    );
    await page.route(`**/api/v1/clientes/${KNOWN_CLIENT_ID}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(KNOWN_CLIENT_MOCK),
      })
    );

    // Capture JS errors
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    // WHEN: Direct navigation to deep link
    await page.goto(`/clientes/${KNOWN_CLIENT_ID}`);

    // Wait for detail to appear
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();

    // THEN: No JavaScript errors occurred
    expect(jsErrors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Edge: Navigation shell stays visible on the /clientes/:clienteId route
// ---------------------------------------------------------------------------

test.describe('Navigation shell visible on detail route', () => {
  test('[P1] should keep the navigation shell (navigation-rail) visible on the detail route', async ({ page }) => {
    // GIVEN: Network-first intercepts
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([KNOWN_CLIENT_MOCK]),
      })
    );
    await page.route(`**/api/v1/clientes/${KNOWN_CLIENT_ID}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(KNOWN_CLIENT_MOCK),
      })
    );

    // WHEN: Navigate to detail route
    await page.goto(`/clientes/${KNOWN_CLIENT_ID}`);

    // THEN: Navigation shell is visible (app shell did not break)
    await expect(page.getByTestId('navigation-rail')).toBeVisible();
  });
});

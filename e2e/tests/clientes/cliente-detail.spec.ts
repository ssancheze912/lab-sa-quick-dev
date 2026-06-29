/**
 * E2E Tests — Client Detail View Deep Linking
 * Story 2.2 — Client Detail View (ATDD RED phase)
 *
 * Test IDs covered:
 *   TC-E2-P1-05  Deep link to /clientes/:clienteId loads correct client detail (AC #2, #3)
 *   TC-E2-P1-06  Deep link to non-existent clienteId shows not-found message (AC #4)
 *
 * Expected RED failure: Routes do not exist yet (404 from React router or blank page)
 *
 * Strategy:
 *   - Network-first: route.fulfill intercepts BEFORE page.goto
 *   - Uses data-testid selectors only
 *   - One assertion per test (atomic)
 *
 * Prerequisites:
 *   - Frontend dev server running at http://localhost:5173
 *   - TanStack Router file-based route clientes.$clienteId.tsx must exist for GREEN phase
 */

import { test, expect } from '@playwright/test';

// Known client IDs used across tests
const KNOWN_CLIENT_ID = '00000000-0000-0000-0000-000000000001';
const NONEXISTENT_CLIENT_ID = '00000000-0000-0000-0000-000000000000';

const KNOWN_CLIENT_MOCK = {
  id: KNOWN_CLIENT_ID,
  nombre: 'Empresa Detalle E2E',
  nit: '900001001-1',
  telefono: '3001001001',
  ciudad: 'Bogotá',
  createdAt: '2026-06-29T10:00:00Z',
};

// ---------------------------------------------------------------------------
// TC-E2-P1-05: Deep link to existing client renders detail view
// ---------------------------------------------------------------------------

test.describe('TC-E2-P1-05: Deep link to /clientes/:clienteId', () => {
  test('should render the client Nombre in the detail panel when navigating directly to /clientes/:clienteId', async ({ page }) => {
    // GIVEN: Network-first — intercept the API request before navigating
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

    // WHEN: User navigates directly to the deep link URL
    await page.goto(`/clientes/${KNOWN_CLIENT_ID}`);

    // THEN: The client Nombre is displayed in the detail panel
    await expect(page.getByTestId('cliente-detail-nombre')).toContainText('Empresa Detalle E2E');
  });

  test('should NOT show a blank page when navigating directly to /clientes/:clienteId', async ({ page }) => {
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

    // THEN: The detail panel is visible (not a blank page)
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
  });

  test('should NOT redirect away from /clientes/:clienteId when loading a valid client', async ({ page }) => {
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

    // WHEN: Direct navigation
    await page.goto(`/clientes/${KNOWN_CLIENT_ID}`);

    // THEN: URL still contains the clienteId (no redirect to home)
    await expect(page).toHaveURL(new RegExp(KNOWN_CLIENT_ID));
  });

  test('should display NIT/RUC in the detail panel on direct navigation', async ({ page }) => {
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

    // WHEN: Direct navigation
    await page.goto(`/clientes/${KNOWN_CLIENT_ID}`);

    // THEN: NIT is shown
    await expect(page.getByTestId('cliente-detail-nit')).toContainText('900001001-1');
  });
});

// ---------------------------------------------------------------------------
// TC-E2-P1-06: Deep link to non-existent clienteId shows not-found message
// ---------------------------------------------------------------------------

test.describe('TC-E2-P1-06: Deep link to non-existent clienteId', () => {
  test('should display a not-found message when navigating to /clientes/:nonExistentId', async ({ page }) => {
    // GIVEN: Network-first — 404 for the non-existent client
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );
    await page.route(`**/api/v1/clientes/${NONEXISTENT_CLIENT_ID}`, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          status: 404,
          title: 'Not Found',
          detail: `Cliente con ID ${NONEXISTENT_CLIENT_ID} no encontrado.`,
        }),
      })
    );

    // WHEN: User navigates to a non-existent client deep link
    await page.goto(`/clientes/${NONEXISTENT_CLIENT_ID}`);

    // THEN: A not-found message is rendered in the detail panel
    await expect(page.getByTestId('cliente-detail-not-found')).toBeVisible();
  });

  test('should show "Cliente no encontrado" text on 404 deep link', async ({ page }) => {
    // GIVEN: Network-first — 404 response
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );
    await page.route(`**/api/v1/clientes/${NONEXISTENT_CLIENT_ID}`, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          status: 404,
          title: 'Not Found',
          detail: `Cliente con ID ${NONEXISTENT_CLIENT_ID} no encontrado.`,
        }),
      })
    );

    // WHEN: Navigate to non-existent client
    await page.goto(`/clientes/${NONEXISTENT_CLIENT_ID}`);

    // THEN: The message "Cliente no encontrado" is visible
    await expect(page.getByTestId('cliente-detail-not-found')).toContainText('Cliente no encontrado');
  });

  test('should keep the navigation shell visible when a 404 occurs on deep link', async ({ page }) => {
    // GIVEN: Network-first — 404 response
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );
    await page.route(`**/api/v1/clientes/${NONEXISTENT_CLIENT_ID}`, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({ status: 404, title: 'Not Found' }),
      })
    );

    // WHEN: Navigate to non-existent client
    await page.goto(`/clientes/${NONEXISTENT_CLIENT_ID}`);

    // THEN: Navigation shell (sidebar/topbar) is still visible
    await expect(page.getByTestId('navigation-rail')).toBeVisible();
  });

  test('should NOT crash the page (no blank white screen) on 404 deep link', async ({ page }) => {
    // GIVEN: Network-first — 404 response
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );
    await page.route(`**/api/v1/clientes/${NONEXISTENT_CLIENT_ID}`, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({ status: 404, title: 'Not Found' }),
      })
    );

    // Listen for uncaught JavaScript errors
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    // WHEN: Navigate to non-existent client
    await page.goto(`/clientes/${NONEXISTENT_CLIENT_ID}`);

    // Wait for not-found UI
    await expect(page.getByTestId('cliente-detail-not-found')).toBeVisible();

    // THEN: No JavaScript crashes occurred
    expect(jsErrors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// AC #1 + #2: Client list item click updates URL to /clientes/:clienteId
// ---------------------------------------------------------------------------

test.describe('AC #2: URL updates to /clientes/:clienteId on list item click', () => {
  test('should update the URL to /clientes/:clienteId when a list item is clicked', async ({ page }) => {
    const clients = [KNOWN_CLIENT_MOCK];

    // GIVEN: Network-first intercepts — list returns 1 client
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

    // WHEN: User navigates to /clientes and clicks on a client list item
    await page.goto('/clientes');
    await page.getByTestId(`cliente-item-${KNOWN_CLIENT_ID}`).click();

    // THEN: URL is updated to include the clienteId
    await expect(page).toHaveURL(new RegExp(`/clientes/${KNOWN_CLIENT_ID}`));
  });
});

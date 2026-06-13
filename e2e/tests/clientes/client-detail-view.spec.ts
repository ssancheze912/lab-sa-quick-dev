/**
 * Story 2.2: Client Detail View
 * Epic 2: Client Management
 *
 * E2E Acceptance Tests — RED Phase (Playwright)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Clicking a client item shows complete details in the right panel (flex-1)
 *         and URL updates to /clientes/:clienteId (FR30 deep linking)
 *   AC2 — Accessing /clientes/:clienteId directly loads correct client details
 *         from GET /api/v1/clientes/{id}
 *   AC3 — Non-existent clienteId (404 from API) shows "Cliente no encontrado." message
 *   AC4 — Backend unavailable while fetching detail shows ErrorPanel with "Reintentar"
 *         button; clicking it triggers a new fetch
 *   AC5 — While detail is loading, skeleton placeholders are shown (NOT a spinner)
 *   AC6 — No client selected (/clientes with no clienteId) shows placeholder state
 *
 * Network-first intercepts are applied BEFORE navigation to prevent race conditions.
 * All selectors use data-testid for stability.
 */

import { test, expect } from '@playwright/test';
import { buildCliente } from '../../helpers/data.helper';

const CLIENTE_STUB = {
  id: 'a1b2c3d4-0000-0000-0000-000000000001',
  nombre: 'Empresa Detalle SA',
  nit: '900111222',
  telefono: '3001234567',
  ciudad: 'Medellín',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const CLIENTE_LIST_STUB = [CLIENTE_STUB];

// ---------------------------------------------------------------------------
// AC1 — Clicking a client item shows full details and updates URL
// ---------------------------------------------------------------------------

test.describe('AC1 — Clicking a client item shows detail and updates URL', () => {
  test('should update the URL to /clientes/:clienteId when a client item is clicked', async ({ page }) => {
    // GIVEN: Client list is displayed with at least one client
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_LIST_STUB),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_STUB.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_STUB),
      })
    );

    await page.goto('/clientes');

    // WHEN: The user clicks on a client item
    await page.getByTestId('cliente-list-item').first().click();

    // THEN: The URL updates to /clientes/:clienteId
    await expect(page).toHaveURL(new RegExp(`/clientes/${CLIENTE_STUB.id}`));
  });

  test('should render the right panel with the detail container after clicking a client item', async ({ page }) => {
    // GIVEN: Client list is displayed
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_LIST_STUB),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_STUB.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_STUB),
      })
    );

    await page.goto('/clientes');

    // WHEN: The user clicks on a client item
    await page.getByTestId('cliente-list-item').first().click();

    // THEN: The detail panel container is visible
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
  });

  test('should display the client Nombre in the detail panel after clicking', async ({ page }) => {
    // GIVEN: A client item is in the list
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_LIST_STUB),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_STUB.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_STUB),
      })
    );

    await page.goto('/clientes');

    // WHEN: The user clicks on the client
    await page.getByTestId('cliente-list-item').first().click();

    // THEN: The client Nombre is shown in the right panel
    await expect(page.getByTestId('cliente-detail-panel')).toContainText(CLIENTE_STUB.nombre);
  });

  test('should display the client NIT/RUC in the detail panel after clicking', async ({ page }) => {
    // GIVEN: A client item is in the list
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_LIST_STUB),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_STUB.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_STUB),
      })
    );

    await page.goto('/clientes');
    await page.getByTestId('cliente-list-item').first().click();

    // THEN: The NIT/RUC field is shown in the right panel
    await expect(page.getByTestId('cliente-detail-panel')).toContainText(CLIENTE_STUB.nit);
  });

  test('should display the client Teléfono in the detail panel after clicking', async ({ page }) => {
    // GIVEN: A client item is in the list
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_LIST_STUB),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_STUB.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_STUB),
      })
    );

    await page.goto('/clientes');
    await page.getByTestId('cliente-list-item').first().click();

    // THEN: The Teléfono field is shown in the right panel
    await expect(page.getByTestId('cliente-detail-panel')).toContainText(CLIENTE_STUB.telefono);
  });

  test('should display the client Ciudad in the detail panel after clicking', async ({ page }) => {
    // GIVEN: A client item is in the list
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_LIST_STUB),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_STUB.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_STUB),
      })
    );

    await page.goto('/clientes');
    await page.getByTestId('cliente-list-item').first().click();

    // THEN: The Ciudad field is shown in the right panel
    await expect(page.getByTestId('cliente-detail-panel')).toContainText(CLIENTE_STUB.ciudad);
  });

  test('should highlight the selected client item in the list', async ({ page }) => {
    // GIVEN: Client list is displayed
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_LIST_STUB),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_STUB.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_STUB),
      })
    );

    await page.goto('/clientes');

    // WHEN: The user clicks on a client item
    await page.getByTestId('cliente-list-item').first().click();

    // THEN: The selected item has the aria-selected or data-selected attribute
    await expect(page.getByTestId('cliente-list-item').first()).toHaveAttribute('data-selected', 'true');
  });
});

// ---------------------------------------------------------------------------
// AC2 — Direct URL access /clientes/:clienteId loads correct client details
// ---------------------------------------------------------------------------

test.describe('AC2 — Direct URL /clientes/:clienteId loads client details (FR30)', () => {
  test('should load and display client details when navigating directly to /clientes/:clienteId', async ({ page }) => {
    // GIVEN: A valid clienteId in the URL and the API returns its data
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_LIST_STUB),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_STUB.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_STUB),
      })
    );

    // WHEN: The user navigates directly to the deep link URL
    await page.goto(`/clientes/${CLIENTE_STUB.id}`);

    // THEN: The detail panel shows the client's Nombre
    await expect(page.getByTestId('cliente-detail-panel')).toContainText(CLIENTE_STUB.nombre);
  });

  test('should show all four client fields when navigating directly to /clientes/:clienteId', async ({ page }) => {
    // GIVEN: Direct URL navigation with valid clienteId
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_LIST_STUB),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_STUB.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_STUB),
      })
    );

    await page.goto(`/clientes/${CLIENTE_STUB.id}`);

    const detailPanel = page.getByTestId('cliente-detail-panel');

    // THEN: All four core fields are visible
    await expect(detailPanel).toContainText(CLIENTE_STUB.nombre);
    await expect(detailPanel).toContainText(CLIENTE_STUB.nit);
    await expect(detailPanel).toContainText(CLIENTE_STUB.telefono);
    await expect(detailPanel).toContainText(CLIENTE_STUB.ciudad);
  });

  test('should render both the list panel and the detail panel on direct URL access', async ({ page }) => {
    // GIVEN: Direct URL /clientes/:clienteId — split-panel must be preserved
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_LIST_STUB),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_STUB.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_STUB),
      })
    );

    // WHEN: Direct URL access
    await page.goto(`/clientes/${CLIENTE_STUB.id}`);

    // THEN: Both panels are present in the split layout
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// AC3 — Non-existent clienteId (404) shows "Cliente no encontrado." message
// ---------------------------------------------------------------------------

test.describe('AC3 — Non-existent clienteId shows not-found message', () => {
  test('should display "Cliente no encontrado." when the API returns 404', async ({ page }) => {
    // GIVEN: A clienteId that does not exist in the backend
    const nonExistentId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );
    await page.route(`**/api/v1/clientes/${nonExistentId}`, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          type: 'https://tools.ietf.org/html/rfc7807',
          title: 'Not Found',
          status: 404,
          detail: 'Cliente not found.',
        }),
      })
    );

    // WHEN: The user navigates to /clientes/:nonExistentId
    await page.goto(`/clientes/${nonExistentId}`);

    // THEN: The right panel displays the not-found message
    await expect(page.getByTestId('cliente-detail-panel')).toContainText('Cliente no encontrado.');
  });

  test('should NOT render an ErrorPanel for 404 — only the not-found text message', async ({ page }) => {
    // GIVEN: A non-existent clienteId returns 404
    const nonExistentId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );
    await page.route(`**/api/v1/clientes/${nonExistentId}`, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({ title: 'Not Found', status: 404, detail: 'Cliente not found.' }),
      })
    );

    await page.goto(`/clientes/${nonExistentId}`);

    // THEN: The error panel with retry button is NOT shown
    await expect(page.getByTestId('error-panel')).toHaveCount(0);
  });

  test('should not crash the application when clienteId results in a 404', async ({ page }) => {
    // GIVEN: A non-existent ID
    const nonExistentId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );
    await page.route(`**/api/v1/clientes/${nonExistentId}`, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({ title: 'Not Found', status: 404 }),
      })
    );

    await page.goto(`/clientes/${nonExistentId}`);

    // THEN: The page does not show an unhandled error / blank screen
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// AC4 — Backend unavailable: ErrorPanel with "Reintentar" button
// ---------------------------------------------------------------------------

test.describe('AC4 — Backend unavailable shows ErrorPanel with retry', () => {
  test('should render an ErrorPanel when GET /api/v1/clientes/:id returns 500', async ({ page }) => {
    // GIVEN: The backend is unavailable when fetching client detail
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_LIST_STUB),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_STUB.id}`, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/problem+json',
        body: JSON.stringify({ title: 'Internal Server Error', status: 500 }),
      })
    );

    // WHEN: The user navigates directly to /clientes/:id
    await page.goto(`/clientes/${CLIENTE_STUB.id}`);

    // THEN: ErrorPanel is displayed in the right panel
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('should render a "Reintentar" button inside the ErrorPanel for detail fetch failure', async ({ page }) => {
    // GIVEN: Detail fetch fails with 500
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_LIST_STUB),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_STUB.id}`, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/problem+json',
        body: JSON.stringify({ title: 'Internal Server Error', status: 500 }),
      })
    );

    await page.goto(`/clientes/${CLIENTE_STUB.id}`);

    // THEN: The retry button is visible with the Spanish label
    await expect(page.getByTestId('error-panel-retry-button')).toBeVisible();
    await expect(page.getByTestId('error-panel-retry-button')).toContainText('Reintentar');
  });

  test('should trigger a new GET /api/v1/clientes/:id fetch when "Reintentar" is clicked', async ({ page }) => {
    // GIVEN: First call fails, second call succeeds
    let callCount = 0;
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_LIST_STUB),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_STUB.id}`, (route) => {
      callCount++;
      if (callCount === 1) {
        return route.fulfill({
          status: 500,
          contentType: 'application/problem+json',
          body: JSON.stringify({ title: 'Internal Server Error', status: 500 }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_STUB),
      });
    });

    await page.goto(`/clientes/${CLIENTE_STUB.id}`);

    // WHEN: The user clicks "Reintentar"
    await page.getByTestId('error-panel-retry-button').click();

    // THEN: The detail panel now shows the client data (retry succeeded)
    await expect(page.getByTestId('cliente-detail-panel')).toContainText(CLIENTE_STUB.nombre);
  });
});

// ---------------------------------------------------------------------------
// AC5 — Loading state shows skeleton placeholders (NOT a spinner)
// ---------------------------------------------------------------------------

test.describe('AC5 — Loading state shows skeleton placeholders', () => {
  test('should render skeleton elements (data-testid="cliente-detail-skeleton") while the detail is loading', async ({ page }) => {
    // GIVEN: The API is delayed so we can observe the loading state
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_LIST_STUB),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_STUB.id}`, async (route) => {
      // Simulate network delay — respond slowly so skeleton is visible
      await new Promise((resolve) => setTimeout(resolve, 800));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_STUB),
      });
    });

    // WHEN: The user navigates directly to the detail URL
    await page.goto(`/clientes/${CLIENTE_STUB.id}`);

    // THEN: Skeleton placeholders are rendered during loading
    await expect(page.getByTestId('cliente-detail-skeleton')).toBeVisible();
  });

  test('should NOT show a spinner (role="status" with spinning animation) during loading', async ({ page }) => {
    // GIVEN: Detail fetch is in-flight
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_LIST_STUB),
      })
    );
    await page.route(`**/api/v1/clientes/${CLIENTE_STUB.id}`, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_STUB),
      });
    });

    await page.goto(`/clientes/${CLIENTE_STUB.id}`);

    // THEN: There is no spinner element — react-loading-skeleton must be used instead
    await expect(page.getByTestId('loading-spinner')).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// AC6 — No client selected shows placeholder state
// ---------------------------------------------------------------------------

test.describe('AC6 — No client selected shows placeholder state', () => {
  test('should display the "Selecciona un cliente" placeholder when at /clientes with no clienteId', async ({ page }) => {
    // GIVEN: The user is at /clientes (no clienteId in URL)
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_LIST_STUB),
      })
    );

    // WHEN: The user navigates to /clientes (no selection)
    await page.goto('/clientes');

    // THEN: The right panel shows a placeholder/empty state
    await expect(page.getByTestId('cliente-detail-placeholder')).toBeVisible();
  });

  test('should display the text "Selecciona un cliente para ver su detalle." in the right panel when no client is selected', async ({ page }) => {
    // GIVEN: The user has not selected any client
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_LIST_STUB),
      })
    );

    await page.goto('/clientes');

    // THEN: The placeholder message is shown in Spanish
    await expect(page.getByTestId('cliente-detail-placeholder')).toContainText('Selecciona un cliente para ver su detalle.');
  });

  test('should NOT show the detail panel with client data when no client is selected', async ({ page }) => {
    // GIVEN: The user is at /clientes with no clienteId
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_LIST_STUB),
      })
    );

    await page.goto('/clientes');

    // THEN: The populated detail panel is not shown
    await expect(page.getByTestId('cliente-detail-fields')).toHaveCount(0);
  });
});

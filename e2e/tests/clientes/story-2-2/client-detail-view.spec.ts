/**
 * Story 2.2: Client Detail View
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (E2E Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Clicking a client item shows its full details in the right panel
 *         and the URL updates to /clientes/:clienteId (FR30 deep linking)
 *   AC2 — Navigating directly to /clientes/:clienteId loads the correct client detail (FR30)
 *   AC3 — When the clienteId in the URL does not exist a not-found message is shown gracefully
 *   AC4 — Skeleton placeholders (react-loading-skeleton) are shown while the detail fetch is in-flight
 *   AC5 — ErrorPanel with "Reintentar" button is shown when the detail fetch fails
 *   AC6 — EmptyState (variant no-selection) is shown when no clienteId is present
 */

import { test, expect } from '@playwright/test';
import { buildCliente } from '../../../factories/cliente.factory';

const API_CLIENTES_LIST = '**/api/v1/clientes';
const API_CLIENTE_DETAIL = (id: string) => `**/api/v1/clientes/${id}`;

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Clicking a client item shows its full details and updates the URL
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Clicking a client item shows its details in the right panel', () => {
  test('should navigate to /clientes/:clienteId when a client item is clicked', async ({ page }) => {
    // GIVEN: The client list is displayed with at least one client
    const cliente = buildCliente({ nombre: 'Acme Colombia SAS' });

    // CRITICAL: Intercept routes BEFORE navigation (network-first pattern)
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );

    await page.route(API_CLIENTE_DETAIL(cliente.id), (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cliente),
      }),
    );

    await page.goto('/clientes');

    // WHEN: The user clicks on the client item
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Acme Colombia SAS' }).click();

    // THEN: The URL updates to /clientes/:clienteId
    await expect(page).toHaveURL(new RegExp(`/clientes/${cliente.id}`));
  });

  test('should display the client Nombre in the right panel after clicking', async ({ page }) => {
    // GIVEN: The client list is displayed
    const cliente = buildCliente({ nombre: 'Global Tech SAS' });

    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );

    await page.route(API_CLIENTE_DETAIL(cliente.id), (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cliente),
      }),
    );

    await page.goto('/clientes');

    // WHEN: The user clicks on the client item
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Global Tech SAS' }).click();

    // THEN: The detail panel shows the Nombre as heading
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await expect(page.getByTestId('cliente-detail-nombre')).toHaveText('Global Tech SAS');
  });

  test('should display the client NIT/RUC in the right panel after clicking', async ({ page }) => {
    // GIVEN: The client list is displayed
    const cliente = buildCliente({ nit: '900123456', nombre: 'Empresa NIT Test' });

    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );

    await page.route(API_CLIENTE_DETAIL(cliente.id), (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cliente),
      }),
    );

    await page.goto('/clientes');

    // WHEN: The user clicks on the client item
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa NIT Test' }).click();

    // THEN: The detail panel shows the NIT/RUC value
    await expect(page.getByTestId('cliente-detail-nit')).toHaveText('900123456');
  });

  test('should display the client Teléfono in the right panel after clicking', async ({ page }) => {
    // GIVEN: The client list is displayed
    const cliente = buildCliente({ telefono: '3001234567', nombre: 'Empresa Telefono Test' });

    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );

    await page.route(API_CLIENTE_DETAIL(cliente.id), (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cliente),
      }),
    );

    await page.goto('/clientes');

    // WHEN: The user clicks on the client item
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Telefono Test' }).click();

    // THEN: The detail panel shows the Teléfono value
    await expect(page.getByTestId('cliente-detail-telefono')).toHaveText('3001234567');
  });

  test('should display the client Ciudad in the right panel after clicking', async ({ page }) => {
    // GIVEN: The client list is displayed
    const cliente = buildCliente({ ciudad: 'Medellín', nombre: 'Empresa Ciudad Test' });

    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );

    await page.route(API_CLIENTE_DETAIL(cliente.id), (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cliente),
      }),
    );

    await page.goto('/clientes');

    // WHEN: The user clicks on the client item
    await page
      .getByTestId('cliente-list-item')
      .filter({ hasText: 'Empresa Ciudad Test' })
      .click();

    // THEN: The detail panel shows the Ciudad value
    await expect(page.getByTestId('cliente-detail-ciudad')).toHaveText('Medellín');
  });

  test('should mark the clicked client item as selected (aria-selected=true)', async ({ page }) => {
    // GIVEN: The client list is displayed
    const cliente = buildCliente({ nombre: 'Empresa Seleccionada' });

    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );

    await page.route(API_CLIENTE_DETAIL(cliente.id), (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cliente),
      }),
    );

    await page.goto('/clientes');

    // WHEN: The user clicks on the client item
    const item = page
      .getByTestId('cliente-list-item')
      .filter({ hasText: 'Empresa Seleccionada' });
    await item.click();

    // THEN: The item has aria-selected="true"
    await expect(item).toHaveAttribute('aria-selected', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Navigating directly to /clientes/:clienteId loads the correct detail
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Direct navigation to /clientes/:clienteId loads client detail (FR30)', () => {
  test('should display the client detail panel when navigating directly to the deep-link URL', async ({
    page,
  }) => {
    // GIVEN: A client exists in the system
    const cliente = buildCliente({ nombre: 'Empresa Deep Link SAS' });

    // CRITICAL: Intercept routes BEFORE navigation
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );

    await page.route(API_CLIENTE_DETAIL(cliente.id), (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cliente),
      }),
    );

    // WHEN: The user navigates directly to /clientes/:clienteId
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: The detail panel is visible with the correct client
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await expect(page.getByTestId('cliente-detail-nombre')).toHaveText('Empresa Deep Link SAS');
  });

  test('should highlight the correct list item as selected when navigating via deep link', async ({
    page,
  }) => {
    // GIVEN: Multiple clients exist in the system
    const clienteA = buildCliente({ nombre: 'Empresa Alpha' });
    const clienteB = buildCliente({ nombre: 'Empresa Beta' });

    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([clienteA, clienteB]),
      }),
    );

    await page.route(API_CLIENTE_DETAIL(clienteA.id), (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clienteA),
      }),
    );

    // WHEN: The user navigates directly to /clientes/:clienteA.id
    await page.goto(`/clientes/${clienteA.id}`);

    // THEN: The corresponding list item is marked as selected
    const itemA = page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Alpha' });
    await expect(itemA).toHaveAttribute('aria-selected', 'true');
  });

  test('should call GET /api/v1/clientes/:id when navigating directly via deep link', async ({
    page,
  }) => {
    // GIVEN: A client exists
    const cliente = buildCliente({ nombre: 'Empresa API Test' });
    let detailCallCount = 0;

    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );

    await page.route(API_CLIENTE_DETAIL(cliente.id), (route) => {
      detailCallCount++;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cliente),
      });
    });

    // WHEN: The user navigates directly to /clientes/:clienteId
    await page.goto(`/clientes/${cliente.id}`);
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();

    // THEN: The detail API endpoint was called
    expect(detailCallCount).toBeGreaterThanOrEqual(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Not-found message shown when clienteId does not exist
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Not-found message displayed when clienteId does not exist', () => {
  test('should display "Cliente no encontrado" when the clienteId returns 404', async ({ page }) => {
    // GIVEN: A clienteId that does not exist in the backend
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    // CRITICAL: Intercept routes BEFORE navigation
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );

    await page.route(API_CLIENTE_DETAIL(nonExistentId), (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 404,
          title: 'Cliente no encontrado',
          detail: 'No existe un cliente con el ID proporcionado.',
        }),
      }),
    );

    // WHEN: The user navigates to a URL with a non-existent clienteId
    await page.goto(`/clientes/${nonExistentId}`);

    // THEN: The "Cliente no encontrado" message is displayed in the right panel
    await expect(page.getByTestId('cliente-not-found')).toBeVisible();
    await expect(page.getByText('Cliente no encontrado')).toBeVisible();
  });

  test('should NOT crash the application when clienteId returns 404', async ({ page }) => {
    // GIVEN: A clienteId that does not exist
    const nonExistentId = '00000000-0000-0000-0000-000000000001';

    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );

    await page.route(API_CLIENTE_DETAIL(nonExistentId), (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 404,
          title: 'Cliente no encontrado',
          detail: 'No existe un cliente con el ID proporcionado.',
        }),
      }),
    );

    // Listen for uncaught page errors
    const pageErrors: Error[] = [];
    page.on('pageerror', (err) => pageErrors.push(err));

    // WHEN: The user navigates to a URL with a non-existent clienteId
    await page.goto(`/clientes/${nonExistentId}`);

    // THEN: The application does not crash (the list panel is still visible)
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
    expect(pageErrors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Skeleton placeholders shown while the detail fetch is in-flight
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Skeleton placeholders shown while client detail is loading', () => {
  test('should show skeleton placeholders in the right panel while the detail fetch is in-flight', async ({
    page,
  }) => {
    // GIVEN: A client exists and the detail fetch will be delayed
    const cliente = buildCliente({ nombre: 'Empresa Skeleton Test' });
    let resolveRoute: ((value: unknown) => void) | null = null;
    const routeHeld = new Promise((resolve) => {
      resolveRoute = resolve;
    });

    // CRITICAL: Intercept routes BEFORE navigation
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );

    await page.route(API_CLIENTE_DETAIL(cliente.id), async (route) => {
      await routeHeld; // Hold the response to keep the loading state
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cliente),
      });
    });

    // Navigate to the detail URL directly so detail fetch starts immediately
    await page.goto(`/clientes/${cliente.id}`);

    // WHEN: The detail fetch is in-flight
    // THEN: Skeleton placeholders are visible in the right panel
    await expect(page.getByTestId('cliente-detail-skeleton')).toBeVisible();

    // Cleanup: resolve the pending route
    resolveRoute!(null);
  });

  test('should set aria-busy="true" on the detail panel while loading', async ({ page }) => {
    // GIVEN: A client detail fetch is in-flight
    const cliente = buildCliente({ nombre: 'Empresa AriaBusy Test' });
    let resolveRoute: ((value: unknown) => void) | null = null;
    const routeHeld = new Promise((resolve) => {
      resolveRoute = resolve;
    });

    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );

    await page.route(API_CLIENTE_DETAIL(cliente.id), async (route) => {
      await routeHeld;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cliente),
      });
    });

    await page.goto(`/clientes/${cliente.id}`);

    // WHEN: The detail fetch is in-flight
    // THEN: The detail panel container has aria-busy="true"
    await expect(page.getByTestId('cliente-detail-panel')).toHaveAttribute('aria-busy', 'true');

    resolveRoute!(null);
  });

  test('should replace skeleton with client details once fetch completes', async ({ page }) => {
    // GIVEN: A client exists
    const cliente = buildCliente({ nombre: 'Empresa Post-Skeleton' });

    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );

    await page.route(API_CLIENTE_DETAIL(cliente.id), (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cliente),
      }),
    );

    // WHEN: The user navigates to the detail URL and the fetch completes
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: The skeleton is gone and the client name is visible
    await expect(page.getByTestId('cliente-detail-skeleton')).not.toBeVisible();
    await expect(page.getByTestId('cliente-detail-nombre')).toHaveText('Empresa Post-Skeleton');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — ErrorPanel with "Reintentar" button when detail fetch fails
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — ErrorPanel displayed when client detail fetch fails', () => {
  test('should display ErrorPanel when GET /api/v1/clientes/:id returns a server error', async ({
    page,
  }) => {
    // GIVEN: The backend is unavailable for the detail endpoint
    const cliente = buildCliente({ nombre: 'Empresa Error Test' });

    // CRITICAL: Intercept routes BEFORE navigation
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );

    await page.route(API_CLIENTE_DETAIL(cliente.id), (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Internal Server Error', status: 500 }),
      }),
    );

    // WHEN: The user navigates to the detail URL and the fetch fails
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: ErrorPanel is displayed in the right panel
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('should display "No se pudo cargar el detalle del cliente" in the ErrorPanel', async ({
    page,
  }) => {
    // GIVEN: The detail fetch fails
    const cliente = buildCliente({ nombre: 'Empresa Error Mensaje' });

    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );

    await page.route(API_CLIENTE_DETAIL(cliente.id), (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Service Unavailable', status: 503 }),
      }),
    );

    // WHEN: The user navigates to the detail URL
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: The correct error message is shown
    await expect(
      page.getByText('No se pudo cargar el detalle del cliente'),
    ).toBeVisible();
  });

  test('should display "Intentar de nuevo" retry button in the ErrorPanel', async ({ page }) => {
    // GIVEN: The detail fetch fails
    const cliente = buildCliente({ nombre: 'Empresa Retry Test' });

    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );

    await page.route(API_CLIENTE_DETAIL(cliente.id), (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Internal Server Error', status: 500 }),
      }),
    );

    // WHEN: The user navigates to the detail URL
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: The "Intentar de nuevo" retry button is visible
    await expect(page.getByRole('button', { name: /intentar de nuevo/i })).toBeVisible();
  });

  test('should show client detail after clicking "Intentar de nuevo" when backend recovers', async ({
    page,
  }) => {
    // GIVEN: First detail fetch fails, second succeeds
    const cliente = buildCliente({ nombre: 'Empresa Recuperada SAS' });
    let detailCallCount = 0;

    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );

    await page.route(API_CLIENTE_DETAIL(cliente.id), (route) => {
      detailCallCount++;
      if (detailCallCount === 1) {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ title: 'Internal Server Error', status: 500 }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cliente),
      });
    });

    await page.goto(`/clientes/${cliente.id}`);
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // WHEN: The user clicks "Intentar de nuevo"
    await page.getByRole('button', { name: /intentar de nuevo/i }).click();

    // THEN: The client detail is now shown
    await expect(page.getByTestId('cliente-detail-nombre')).toHaveText('Empresa Recuperada SAS');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — EmptyState (no-selection) shown when no clienteId is in the URL
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — EmptyState (no-selection) shown when no client is selected', () => {
  test('should display EmptyState no-selection in the right panel when on /clientes without a clienteId', async ({
    page,
  }) => {
    // GIVEN: Clients exist in the system
    const clientes = [buildCliente(), buildCliente()];

    // CRITICAL: Intercept routes BEFORE navigation
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      }),
    );

    // WHEN: The user navigates to /clientes (no clienteId param)
    await page.goto('/clientes');

    // THEN: The right panel shows the no-selection EmptyState
    await expect(page.getByTestId('empty-state-no-selection')).toBeVisible();
  });

  test('should display "Selecciona un cliente para ver sus detalles" in the no-selection state', async ({
    page,
  }) => {
    // GIVEN: Clients exist and the user is on /clientes
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([buildCliente()]),
      }),
    );

    // WHEN: The user navigates to /clientes (no clienteId param)
    await page.goto('/clientes');

    // THEN: The correct guidance text is visible
    await expect(
      page.getByText('Selecciona un cliente para ver sus detalles'),
    ).toBeVisible();
  });

  test('should NOT display a CTA button in the no-selection EmptyState', async ({ page }) => {
    // GIVEN: Clients exist and the user is on /clientes
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([buildCliente()]),
      }),
    );

    // WHEN: The user navigates to /clientes (no clienteId param)
    await page.goto('/clientes');

    // THEN: No action button is present in the no-selection empty state
    const emptyState = page.getByTestId('empty-state-no-selection');
    await expect(emptyState).toBeVisible();
    await expect(emptyState.getByRole('button')).toHaveCount(0);
  });

  test('should replace the no-selection EmptyState with client details when a client is clicked', async ({
    page,
  }) => {
    // GIVEN: The no-selection state is visible on /clientes
    const cliente = buildCliente({ nombre: 'Empresa Selección Test' });

    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );

    await page.route(API_CLIENTE_DETAIL(cliente.id), (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cliente),
      }),
    );

    await page.goto('/clientes');
    await expect(page.getByTestId('empty-state-no-selection')).toBeVisible();

    // WHEN: The user clicks on a client item
    await page
      .getByTestId('cliente-list-item')
      .filter({ hasText: 'Empresa Selección Test' })
      .click();

    // THEN: The no-selection state is replaced by the client detail
    await expect(page.getByTestId('empty-state-no-selection')).not.toBeVisible();
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
  });
});

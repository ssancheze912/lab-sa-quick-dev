import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

/**
 * E2E Acceptance Tests — Story 2.2: Client Detail View
 *
 * Acceptance Criteria covered:
 *   AC1 — Clicking a client item in the left panel shows detail in right panel + URL updates to /clientes/:clienteId (FR30)
 *   AC2 — Direct URL /clientes/:clienteId (deep link) loads and displays correct client (FR30)
 *   AC3 — Unknown clienteId in URL shows graceful not-found message (no blank screen / unhandled JS error)
 *   AC6 — Backend unavailable → ErrorPanel with "Reintentar" button; raw error never shown (NFR6)
 *   AC7 — While loading, skeleton placeholders are rendered (aria-busy="true"); no spinner
 *
 * Test cases aligned with test-design-epic-2.md:
 *   TC-E2-P1-07 — Clicking client item → URL updates to /clientes/:clienteId
 *   TC-E2-P1-08 — Direct URL /clientes/:clienteId loads correct detail
 *   TC-E2-P1-09 — Non-existent clienteId shows graceful not-found message
 *
 * These tests are in RED phase — they will fail until implementation is complete.
 * Network-first intercepts are set BEFORE navigation per ATDD patterns.
 */

const API_LIST_PATTERN = '**/api/v1/clientes';
const API_DETAIL_PATTERN = '**/api/v1/clientes/*';

/**
 * Build a full ClienteDto mock matching the backend contract.
 */
function mockClienteDto(overrides: Partial<{
  id: string;
  nombre: string;
  nit: string;
  telefono: string;
  ciudad: string;
  createdAt: string;
  updatedAt: string;
}> = {}) {
  const ts = new Date().toISOString();
  return {
    id: `uuid-${Math.random().toString(36).slice(2, 10)}`,
    nombre: 'Empresa Demo S.A.S',
    nit: '900123456',
    telefono: '3001234567',
    ciudad: 'Bogotá',
    createdAt: ts,
    updatedAt: ts,
    ...overrides,
  };
}

test.describe('Story 2.2 — Client Detail View (E2E)', () => {
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

  // ──────────────────────────────────────────────────────────────────────────
  // AC1: Clicking client item shows detail + URL updates (TC-E2-P1-07)
  // ──────────────────────────────────────────────────────────────────────────

  test('AC1 — clicking a client item in the left panel displays its detail in the right panel', async ({ page }) => {
    // GIVEN: One client exists (intercept list API)
    const cliente = mockClienteDto({ id: 'uuid-ac1-click', nombre: 'Empresa Click Test', nit: '900111001' });

    // Network-first: intercept list BEFORE navigation
    await page.route(`${API_LIST_PATTERN}`, (route) => {
      if (!route.request().url().includes('/clientes/')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([cliente]),
        });
      } else {
        route.continue();
      }
    });

    // Network-first: intercept detail BEFORE navigation
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cliente),
      })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();

    // WHEN: User clicks on the client item
    await page.getByTestId('cliente-list-item').filter({ hasText: cliente.nombre }).click();

    // THEN: Right panel (cliente-detail-panel) shows the client's details
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await expect(page.getByTestId('cliente-detail-panel')).toContainText(cliente.nombre);
    await expect(page.getByTestId('cliente-detail-panel')).toContainText(cliente.nit);
    await expect(page.getByTestId('cliente-detail-panel')).toContainText(cliente.telefono);
    await expect(page.getByTestId('cliente-detail-panel')).toContainText(cliente.ciudad);
  });

  test('AC1 — clicking a client item updates the URL to /clientes/:clienteId (TC-E2-P1-07)', async ({ page }) => {
    // GIVEN: One client exists
    const cliente = mockClienteDto({ id: 'uuid-ac1-url', nombre: 'Empresa URL Test', nit: '900111002' });

    // Network-first: intercept BEFORE navigation
    await page.route(`**/api/v1/clientes`, (route) => {
      if (!route.request().url().match(/\/clientes\/[^/]+$/)) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([cliente]),
        });
      } else {
        route.continue();
      }
    });

    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cliente),
      })
    );

    // WHEN: User navigates to /clientes and clicks on the client
    await page.goto('/clientes');
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
    await page.getByTestId('cliente-list-item').filter({ hasText: cliente.nombre }).click();

    // THEN: URL updates to /clientes/:clienteId (FR30 deep linking)
    await expect(page).toHaveURL(new RegExp(`/clientes/${cliente.id}`));
  });

  test('AC1 — right panel shows field labels in Spanish (Nombre, NIT/RUC, Teléfono, Ciudad)', async ({ page }) => {
    // GIVEN: A client exists with all fields populated
    const cliente = mockClienteDto({
      id: 'uuid-ac1-labels',
      nombre: 'Empresa Etiquetas',
      nit: '900222001',
      telefono: '3109876543',
      ciudad: 'Medellín',
    });

    await page.route(`**/api/v1/clientes`, (route) => {
      if (!route.request().url().match(/\/clientes\/[^/]+$/)) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([cliente]),
        });
      } else {
        route.continue();
      }
    });

    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cliente),
      })
    );

    await page.goto('/clientes');
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
    await page.getByTestId('cliente-list-item').filter({ hasText: cliente.nombre }).click();
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();

    // THEN: Labels are displayed in Spanish (mandatory per company standards)
    await expect(page.getByTestId('cliente-detail-panel')).toContainText('Nombre');
    await expect(page.getByTestId('cliente-detail-panel')).toContainText('NIT/RUC');
    await expect(page.getByTestId('cliente-detail-panel')).toContainText('Teléfono');
    await expect(page.getByTestId('cliente-detail-panel')).toContainText('Ciudad');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // AC2: Deep link — direct URL /clientes/:clienteId (TC-E2-P1-08)
  // ──────────────────────────────────────────────────────────────────────────

  test('AC2 — accessing /clientes/:clienteId directly loads the correct client detail (TC-E2-P1-08)', async ({ page }) => {
    // GIVEN: A client exists with a known UUID
    const clienteId = 'uuid-deeplink-001';
    const cliente = mockClienteDto({
      id: clienteId,
      nombre: 'Empresa Deep Link',
      nit: '900333001',
      telefono: '3200001111',
      ciudad: 'Cali',
    });

    // Network-first: intercept list AND detail BEFORE navigation
    await page.route(`**/api/v1/clientes`, (route) => {
      if (!route.request().url().match(/\/clientes\/[^/]+$/)) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([cliente]),
        });
      } else {
        route.continue();
      }
    });

    await page.route(`**/api/v1/clientes/${clienteId}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cliente),
      })
    );

    // WHEN: User accesses the URL directly (deep link)
    await page.goto(`/clientes/${clienteId}`);

    // THEN: The correct client details are loaded and displayed
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await expect(page.getByTestId('cliente-detail-panel')).toContainText(cliente.nombre);
    await expect(page.getByTestId('cliente-detail-panel')).toContainText(cliente.nit);
    await expect(page.getByTestId('cliente-detail-panel')).toContainText(cliente.telefono);
    await expect(page.getByTestId('cliente-detail-panel')).toContainText(cliente.ciudad);
  });

  test('AC2 — deep link preserves the left panel (split layout remains intact)', async ({ page }) => {
    // GIVEN: A client accessible via deep link
    const clienteId = 'uuid-deeplink-002';
    const cliente = mockClienteDto({ id: clienteId, nombre: 'Empresa Split Test', nit: '900333002' });

    await page.route(`**/api/v1/clientes`, (route) => {
      if (!route.request().url().match(/\/clientes\/[^/]+$/)) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([cliente]),
        });
      } else {
        route.continue();
      }
    });

    await page.route(`**/api/v1/clientes/${clienteId}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cliente),
      })
    );

    // WHEN: User navigates directly to the deep link
    await page.goto(`/clientes/${clienteId}`);

    // THEN: Left panel (client list) is also visible — split layout is maintained
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
    // AND: Right panel shows the detail
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // AC3: Non-existent clienteId shows graceful not-found (TC-E2-P1-09)
  // ──────────────────────────────────────────────────────────────────────────

  test('AC3 — accessing /clientes/:unknownId shows graceful not-found message (TC-E2-P1-09)', async ({ page }) => {
    // GIVEN: A clienteId that does not exist in the system
    const unknownId = '00000000-0000-0000-0000-000000000000';

    // Network-first: intercept BEFORE navigation
    await page.route(`**/api/v1/clientes`, (route) => {
      if (!route.request().url().match(/\/clientes\/[^/]+$/)) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      } else {
        route.continue();
      }
    });

    await page.route(`**/api/v1/clientes/${unknownId}`, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          title: 'Cliente no encontrado',
          status: 404,
          detail: 'No se encontró el cliente solicitado.',
        }),
      })
    );

    // WHEN: User navigates to the non-existent URL
    await page.goto(`/clientes/${unknownId}`);

    // THEN: A not-found message is displayed gracefully (in Spanish, mandatory)
    await expect(page.getByText('No se encontró el cliente solicitado.')).toBeVisible();

    // AND: No blank screen — the page renders with the shell layout
    await expect(page.locator('body')).not.toBeEmpty();

    // AND: The error panel (non-404 error state) is NOT shown for a 404
    await expect(page.getByTestId('error-panel')).not.toBeVisible();
  });

  test('AC3 — no unhandled JS error is thrown for non-existent clienteId', async ({ page }) => {
    // GIVEN: A clienteId that does not exist
    const unknownId = '00000000-0000-0000-0000-000000000001';

    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    // Network-first: intercept BEFORE navigation
    await page.route(`**/api/v1/clientes`, (route) => {
      if (!route.request().url().match(/\/clientes\/[^/]+$/)) {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      } else {
        route.continue();
      }
    });

    await page.route(`**/api/v1/clientes/${unknownId}`, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({ title: 'Cliente no encontrado', status: 404 }),
      })
    );

    // WHEN: User navigates to a non-existent clienteId URL
    await page.goto(`/clientes/${unknownId}`);
    await page.waitForLoadState('networkidle');

    // THEN: No unhandled JS errors were thrown
    expect(jsErrors).toHaveLength(0);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // AC6: Backend unavailable → ErrorPanel + Reintentar (NFR6)
  // ──────────────────────────────────────────────────────────────────────────

  test('AC6 — ErrorPanel is shown when the detail fetch fails (backend unavailable)', async ({ page }) => {
    // GIVEN: A known clienteId exists in the list but backend fails for detail
    const clienteId = 'uuid-backend-down';
    const listaCliente = mockClienteDto({ id: clienteId, nombre: 'Empresa Caída', nit: '900500001' });

    // Network-first: intercept BEFORE navigation
    await page.route(`**/api/v1/clientes`, (route) => {
      if (!route.request().url().match(/\/clientes\/[^/]+$/)) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([listaCliente]),
        });
      } else {
        route.continue();
      }
    });

    await page.route(`**/api/v1/clientes/${clienteId}`, (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Service Unavailable' }),
      })
    );

    // WHEN: User navigates to the client detail URL
    await page.goto(`/clientes/${clienteId}`);

    // THEN: ErrorPanel component is displayed in the right panel
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // AND: "Reintentar" button is visible (NFR6 requirement)
    await expect(page.getByRole('button', { name: /reintentar/i })).toBeVisible();

    // AND: Raw error message is NEVER shown to the user (NFR6)
    await expect(page.getByText('Service Unavailable')).not.toBeVisible();
    await expect(page.getByText(/503/)).not.toBeVisible();
  });

  test('AC6 — clicking "Reintentar" triggers a new detail fetch', async ({ page }) => {
    // GIVEN: Detail fetch fails first, then succeeds on retry
    const clienteId = 'uuid-retry-detail';
    const listaCliente = mockClienteDto({ id: clienteId, nombre: 'Empresa Retry', nit: '900500002' });
    const detalleCliente = { ...listaCliente };

    let detailCallCount = 0;

    await page.route(`**/api/v1/clientes`, (route) => {
      if (!route.request().url().match(/\/clientes\/[^/]+$/)) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([listaCliente]),
        });
      } else {
        route.continue();
      }
    });

    await page.route(`**/api/v1/clientes/${clienteId}`, (route) => {
      detailCallCount++;
      if (detailCallCount === 1) {
        route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ title: 'Error' }) });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(detalleCliente),
        });
      }
    });

    // WHEN: User navigates to the detail page (first load fails)
    await page.goto(`/clientes/${clienteId}`);
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // WHEN: User clicks "Reintentar"
    await page.getByRole('button', { name: /reintentar/i }).click();

    // THEN: A new fetch is triggered and the detail is displayed
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await expect(page.getByTestId('cliente-detail-panel')).toContainText(detalleCliente.nombre);
    expect(detailCallCount).toBeGreaterThanOrEqual(2);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // AC7: Skeleton loading state (no spinner)
  // ──────────────────────────────────────────────────────────────────────────

  test('AC7 — skeleton placeholders with aria-busy="true" are shown while detail is loading (no spinner)', async ({ page }) => {
    // GIVEN: Detail fetch is delayed
    const clienteId = 'uuid-skeleton-detail';
    const listaCliente = mockClienteDto({ id: clienteId, nombre: 'Empresa Skeleton', nit: '900700001' });

    await page.route(`**/api/v1/clientes`, (route) => {
      if (!route.request().url().match(/\/clientes\/[^/]+$/)) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([listaCliente]),
        });
      } else {
        route.continue();
      }
    });

    await page.route(`**/api/v1/clientes/${clienteId}`, async (route) => {
      await new Promise((r) => setTimeout(r, 300)); // 300ms delay to observe loading state
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(listaCliente),
      });
    });

    // WHEN: User navigates directly to the detail URL
    await page.goto(`/clientes/${clienteId}`);

    // THEN: While loading, the detail panel has aria-busy="true"
    const detailPanel = page.getByTestId('cliente-detail-panel');
    await expect(detailPanel).toBeVisible();
    await expect(detailPanel).toHaveAttribute('aria-busy', 'true');

    // AND: After loading completes, aria-busy is removed and content is shown
    await expect(page.getByTestId('cliente-detail-panel')).toContainText(listaCliente.nombre);
    await expect(detailPanel).not.toHaveAttribute('aria-busy', 'true');

    // AND: No spinner element is present (skeleton only, per AC7)
    await expect(page.getByRole('progressbar')).not.toBeVisible();
    await expect(page.locator('[data-testid="spinner"]')).not.toBeVisible();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Default empty right panel state (no client selected)
  // ──────────────────────────────────────────────────────────────────────────

  test('right panel shows default placeholder when no client is selected', async ({ page }) => {
    // GIVEN: Client list is loaded but no client is selected
    const cliente = mockClienteDto({ id: 'uuid-default-state', nombre: 'Empresa Sin Seleccionar', nit: '900800001' });

    // Network-first: intercept BEFORE navigation
    await page.route(`**/api/v1/clientes`, (route) => {
      if (!route.request().url().match(/\/clientes\/[^/]+$/)) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([cliente]),
        });
      } else {
        route.continue();
      }
    });

    // WHEN: User navigates to /clientes (no :clienteId in URL)
    await page.goto('/clientes');
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();

    // THEN: Right panel shows a default placeholder message in Spanish
    await expect(page.getByText('Selecciona un cliente de la lista')).toBeVisible();

    // AND: Detail panel content is NOT shown (no client selected)
    await expect(page.getByTestId('cliente-detail-panel')).not.toBeVisible();
  });
});

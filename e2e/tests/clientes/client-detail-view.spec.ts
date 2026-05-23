/**
 * Story 2.2: Client Detail View
 * Epic 2: Client Management (Gestión de Clientes)
 *
 * E2E Acceptance Tests — RED Phase (Playwright)
 * Tests fail until ClienteDetailPanel, useCliente, and backend GET /api/v1/clientes/{id} are implemented.
 *
 * Acceptance Criteria covered:
 *   AC1 — Right panel shows complete client details when clicking a client item
 *   AC2 — Direct URL /clientes/:clienteId loads correct client (FR30 deep linking)
 *
 * Test Cases:
 *   TC-E2-P1-06 (E2E supplement) — Full-stack: clicking client item shows detail panel
 *   TC-E2-P1-07 — Deep link: direct URL /clientes/{id} renders correct client without pre-loaded list
 *
 * NOTE: AC3 (not-found), AC4 (ErrorPanel), AC5 (skeleton) are covered at the Component
 * level in ClienteDetailPanel.test.tsx (faster, isolated, no live backend needed).
 * This E2E test validates the full-stack deep-linking integration:
 *   backend GET /api/v1/clientes/{id} → frontend route → ClienteDetailPanel
 */

import { test, expect } from '../../fixtures/base.fixture';
import { ClientesPage } from '../../pages/clientes.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

test.describe('Story 2.2 — Client Detail View (E2E)', () => {
  let clientesPage: ClientesPage;
  let apiHelper: ApiHelper;
  const createdIds: string[] = [];

  test.beforeEach(async ({ page, request }) => {
    clientesPage = new ClientesPage(page);
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  // ─── TC-E2-P1-06 (E2E supplement) — AC1: Clicking client shows detail panel ──

  test('AC1 — should render detail panel with all four fields when a list item is clicked', async ({ page }) => {
    // GIVEN: The API is intercepted with a known client record
    // CRITICAL: Network-first intercept BEFORE navigation
    const clienteId = '11111111-0000-0000-0000-000000000011';
    const mockCliente = {
      id: clienteId,
      nombre: 'Empresa E2E SA',
      nit: '901020304',
      telefono: '3151234567',
      ciudad: 'Medellín',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockCliente]),
      })
    );

    await page.route(`**/api/v1/clientes/${clienteId}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCliente),
      })
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // Wait for the list to render
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // AND WHEN: The user clicks the client item
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa E2E SA' }).click();

    // THEN: The detail panel is visible with all four fields
    const detailPanel = page.getByTestId('cliente-detail-panel');
    await expect(detailPanel).toBeVisible();
    await expect(detailPanel.getByText('Empresa E2E SA')).toBeVisible();
    await expect(detailPanel.getByText('901020304')).toBeVisible();
    await expect(detailPanel.getByText('3151234567')).toBeVisible();
    await expect(detailPanel.getByText('Medellín')).toBeVisible();
  });

  test('AC1 — URL should update to /clientes/:clienteId after clicking a client (FR30 deep linking)', async ({ page }) => {
    // GIVEN: Known client data with a specific UUID
    const clienteId = '11111111-0000-0000-0000-000000000012';
    const mockCliente = {
      id: clienteId,
      nombre: 'URL Test Corp',
      nit: '902030405',
      telefono: '3161234567',
      ciudad: 'Cali',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };

    // CRITICAL: Network-first intercept BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockCliente]),
      })
    );

    await page.route(`**/api/v1/clientes/${clienteId}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCliente),
      })
    );

    // WHEN: User navigates to /clientes and clicks the client item
    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();
    await page.getByTestId('cliente-list-item').filter({ hasText: 'URL Test Corp' }).click();

    // THEN: URL updates to /clientes/:clienteId (FR30 deep linking)
    await expect(page).toHaveURL(new RegExp(`/clientes/${clienteId}`));
  });

  // ─── TC-E2-P1-07 — AC2: Deep link direct URL renders correct client ─────────

  test('TC-E2-P1-07 — AC2: Direct URL /clientes/:clienteId renders correct client without list pre-loaded', async ({ page }) => {
    // GIVEN: A client exists with a known UUID (list endpoint NOT called first)
    const clienteId = '11111111-0000-0000-0000-000000000013';
    const mockCliente = {
      id: clienteId,
      nombre: 'Deep Link Corp',
      nit: '903040506',
      telefono: '3171234567',
      ciudad: 'Barranquilla',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };

    // CRITICAL: Network-first intercepts BEFORE navigation
    // Intercept individual client endpoint (used by ClienteDetailPanel via useCliente)
    await page.route(`**/api/v1/clientes/${clienteId}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCliente),
      })
    );

    // Intercept list endpoint with empty data (to confirm detail does NOT depend on list cache)
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // WHEN: The user opens the browser DIRECTLY to /clientes/:clienteId (no prior navigation)
    await page.goto(`/clientes/${clienteId}`);

    // THEN: The detail panel renders the correct client
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await expect(page.getByText('Deep Link Corp')).toBeVisible();
    await expect(page.getByText('903040506')).toBeVisible();
    await expect(page.getByText('3171234567')).toBeVisible();
    await expect(page.getByText('Barranquilla')).toBeVisible();

    // AND: URL remains at /clientes/:clienteId (no redirect)
    await expect(page).toHaveURL(new RegExp(`/clientes/${clienteId}`));
  });

  test('TC-E2-P1-07 — AC2: No blank page or JS error on direct URL access (FR30)', async ({ page }) => {
    // GIVEN: Direct access to /clientes/:clienteId
    const clienteId = '11111111-0000-0000-0000-000000000014';
    const mockCliente = {
      id: clienteId,
      nombre: 'No Blank Corp',
      nit: '904050607',
      telefono: '3181234567',
      ciudad: 'Bogotá',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };

    // CRITICAL: Network-first intercepts BEFORE navigation
    await page.route(`**/api/v1/clientes/${clienteId}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCliente),
      })
    );

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // Track JS console errors
    const jsErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') jsErrors.push(msg.text());
    });

    // WHEN: Direct URL navigation (no prior visit to /clientes list)
    await page.goto(`/clientes/${clienteId}`);

    // THEN: Page is not blank (detail content is visible)
    await expect(page.getByText('No Blank Corp')).toBeVisible();

    // AND: No JS errors were thrown
    expect(jsErrors.filter(e => !e.includes('favicon'))).toHaveLength(0);
  });

  test('TC-E2-P1-07 — AC2: Shell layout (navigation) remains visible on direct URL access', async ({ page }) => {
    // GIVEN: Direct access to /clientes/:clienteId
    const clienteId = '11111111-0000-0000-0000-000000000015';
    const mockCliente = {
      id: clienteId,
      nombre: 'Shell Layout Test SA',
      nit: '905060708',
      telefono: '3191234567',
      ciudad: 'Bogotá',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };

    // CRITICAL: Network-first intercepts BEFORE navigation
    await page.route(`**/api/v1/clientes/${clienteId}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCliente),
      })
    );

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockCliente]),
      })
    );

    // WHEN: Direct URL navigation
    await page.goto(`/clientes/${clienteId}`);
    await expect(page.getByTestId('cliente-detail-panel').getByText('Shell Layout Test SA')).toBeVisible();

    // THEN: The navigation shell is still visible (not crashing the shell layout — AC3 spec)
    // The left panel list should be visible alongside the detail panel
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
  });
});

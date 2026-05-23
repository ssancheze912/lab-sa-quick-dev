/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management (Gestión de Clientes)
 *
 * E2E Acceptance Tests — RED Phase (Playwright)
 * Tests fail until ClienteListPanel component and backend GET /api/v1/clientes are implemented.
 *
 * Acceptance Criteria covered:
 *   AC1 — Left panel (280px) renders scrollable client list with Nombre and NIT/RUC per item
 *
 * Test Cases: TC-E2-P1-01 (E2E supplement — full stack list rendering)
 *
 * NOTE: AC2–AC5 (search, EmptyState, ErrorPanel, clear search) are covered at the
 * Component level in ClienteListPanel.test.tsx (faster, isolated, no live backend needed).
 * This E2E test validates the full-stack integration: backend → API → frontend list rendering.
 */

import { test, expect } from '../../fixtures/base.fixture';
import { ClientesPage } from '../../pages/clientes.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

test.describe('Story 2.1 — Client List & Search (E2E)', () => {
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

  // ─── AC1: Left panel renders scrollable list of clients ────────────────────

  test('AC1 — should render the left client list panel (280px) when navigating to /clientes', async ({ page }) => {
    // GIVEN: The app is accessible
    // WHEN: The user navigates to /clientes

    // CRITICAL: Intercept BEFORE navigation (network-first pattern)
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '11111111-0000-0000-0000-000000000001', nombre: 'Acme Colombia SA', nit: '900111222', telefono: '3001234567', ciudad: 'Bogotá', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
          { id: '11111111-0000-0000-0000-000000000002', nombre: 'Beta Ltda', nit: '800333444', telefono: '3109876543', ciudad: 'Medellín', createdAt: '2026-01-02T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z' },
        ]),
      })
    );

    await page.goto('/clientes');

    // THEN: The left panel with data-testid="clientes-list-panel" is visible
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
  });

  test('AC1 — should display Nombre and NIT/RUC for each client item in the list', async ({ page }) => {
    // GIVEN: Two clients exist in the system
    // CRITICAL: Intercept BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '11111111-0000-0000-0000-000000000001', nombre: 'Acme Colombia SA', nit: '900111222', telefono: '3001234567', ciudad: 'Bogotá', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
          { id: '11111111-0000-0000-0000-000000000002', nombre: 'Beta Ltda', nit: '800333444', telefono: '3109876543', ciudad: 'Medellín', createdAt: '2026-01-02T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z' },
        ]),
      })
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: Each list item shows the Nombre value
    await expect(page.getByTestId('cliente-list-item').filter({ hasText: 'Acme Colombia SA' })).toBeVisible();
    // AND: Each list item shows the NIT/RUC value
    await expect(page.getByTestId('cliente-list-item').filter({ hasText: '900111222' })).toBeVisible();
  });

  test('AC1 — should render exactly the number of client items returned by the API', async ({ page }) => {
    // GIVEN: Three clients exist in the system
    // CRITICAL: Intercept BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '11111111-0000-0000-0000-000000000001', nombre: 'Acme Colombia SA', nit: '900111222', telefono: '3001234567', ciudad: 'Bogotá', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
          { id: '11111111-0000-0000-0000-000000000002', nombre: 'Beta Ltda', nit: '800333444', telefono: '3109876543', ciudad: 'Medellín', createdAt: '2026-01-02T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z' },
          { id: '11111111-0000-0000-0000-000000000003', nombre: 'Gamma Corp', nit: '700555666', telefono: '3207654321', ciudad: 'Cali', createdAt: '2026-01-03T00:00:00Z', updatedAt: '2026-01-03T00:00:00Z' },
        ]),
      })
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: Exactly three client items are rendered
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(3);
  });

  test('AC1 — should render the search input field above the client list', async ({ page }) => {
    // GIVEN: The client list is loaded
    // CRITICAL: Intercept BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '11111111-0000-0000-0000-000000000001', nombre: 'Acme Colombia SA', nit: '900111222', telefono: '3001234567', ciudad: 'Bogotá', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        ]),
      })
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: The search input is present with the correct placeholder
    await expect(
      page.getByPlaceholder(/buscar por nombre o nit\/ruc/i)
    ).toBeVisible();
  });

  // ─── AC1 (Integration): Full-stack client list rendering ───────────────────

  test('AC1 — full-stack: should list a real client created via API', async ({ page, request }) => {
    // GIVEN: A client is seeded via the backend API
    const apiHelperLocal = new ApiHelper(request);
    const data = buildCliente();
    const cliente = await apiHelperLocal.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: The user navigates to /clientes (real backend call — no mock)
    await clientesPage.goto();

    // THEN: The created client is visible in the list
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: data.nombre })
    ).toBeVisible();
  });
});

/**
 * E2E Test — Client List & Search (Story 2.1)
 * RED phase: test fails until ClienteListView is fully implemented and wired to the backend.
 *
 * Acceptance Criteria covered:
 *   AC-1: navigating to /clientes shows the list panel with client rows
 *
 * Test matrix (test-design-epic-2.md — Story 2.1):
 *   E-01 — Navigate to /clientes; assert at least one client row visible (P0, R-202)
 *
 * Network-first strategy: route interception is set up BEFORE page.goto() to prevent
 * race conditions (network-first.md pattern).
 */

import { test, expect } from '@playwright/test';
import { ClientesPage } from '../../pages/clientes.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

// ---------------------------------------------------------------------------
// E-01 — List loads at /clientes (P0)
// ---------------------------------------------------------------------------
test.describe('Story 2.1 — Client List & Search', () => {
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

  test(
    'GIVEN there are clients in the system '
    + 'WHEN the user navigates to /clientes '
    + 'THEN the left panel shows at least one client row',
    async ({ page }) => {
      // GIVEN: at least one client exists in the backend
      const data = buildCliente({ nombre: 'E2E List Test Corp' });
      const created = await apiHelper.createCliente(data);
      createdIds.push(created.id);

      // CRITICAL: intercept BEFORE navigation (network-first pattern)
      // The route is already real (backend running); we verify the panel renders
      // after the real GET /api/v1/clientes succeeds.

      // WHEN: user navigates to /clientes
      await clientesPage.goto();

      // THEN: the list panel is visible and contains at least one item
      await expect(clientesPage.listPanel).toBeVisible();
      await expect(clientesPage.clienteItems.first()).toBeVisible({ timeout: 5000 });
    },
  );

  test(
    'GIVEN the list is loaded '
    + 'WHEN the user types in the search field '
    + 'THEN only matching clients are shown',
    async ({ page }) => {
      // GIVEN: two clients with distinct names
      const dataA = buildCliente({ nombre: 'Search Target Alpha' });
      const dataB = buildCliente({ nombre: 'Search Target Beta' });
      const cA = await apiHelper.createCliente(dataA);
      const cB = await apiHelper.createCliente(dataB);
      createdIds.push(cA.id, cB.id);

      // WHEN: navigate and wait for list
      await clientesPage.goto();
      await expect(clientesPage.clienteItems.first()).toBeVisible({ timeout: 5000 });

      // WHEN: search by partial name unique to Alpha
      await clientesPage.buscar('Alpha');

      // THEN: Alpha row is visible; Beta row is not
      await expect(
        clientesPage.clienteItems.filter({ hasText: 'Search Target Alpha' }),
      ).toBeVisible();

      await expect(
        clientesPage.clienteItems.filter({ hasText: 'Search Target Beta' }),
      ).not.toBeVisible();
    },
  );

  // -------------------------------------------------------------------------
  // Intercepted scenario — mocked backend to test EmptyState
  // -------------------------------------------------------------------------
  test(
    'GIVEN there are no clients in the system '
    + 'WHEN the user navigates to /clientes '
    + 'THEN an EmptyState message is displayed',
    async ({ page }) => {
      // GIVEN: intercept GET /api/v1/clientes BEFORE navigation (network-first)
      await page.route('**/api/v1/clientes', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        }),
      );

      // WHEN: navigate
      await clientesPage.goto();

      // THEN: EmptyState is shown
      await expect(clientesPage.emptyState).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(/No hay clientes registrados/i)).toBeVisible();
    },
  );

  // -------------------------------------------------------------------------
  // Intercepted scenario — mocked backend to test ErrorPanel
  // -------------------------------------------------------------------------
  test(
    'GIVEN the backend is unavailable '
    + 'WHEN GET /api/v1/clientes returns 500 '
    + 'THEN ErrorPanel with "Reintentar" button is shown',
    async ({ page }) => {
      // GIVEN: intercept BEFORE navigation (network-first)
      await page.route('**/api/v1/clientes', (route) =>
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ title: 'Internal Server Error', status: 500 }),
        }),
      );

      // WHEN: navigate
      await clientesPage.goto();

      // THEN: ErrorPanel with retry button is displayed (not the list)
      await expect(page.getByTestId('error-panel')).toBeVisible({ timeout: 5000 });
      await expect(page.getByRole('button', { name: /reintentar/i })).toBeVisible();
    },
  );
});

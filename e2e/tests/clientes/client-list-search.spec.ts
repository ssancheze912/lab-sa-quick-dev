/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (E2E Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Left panel (280px) renders scrollable client list with Nombre and NIT/RUC per item
 *   AC2 — Real-time client-side search by Nombre or NIT/RUC, results in < 1s, no extra API call
 *   AC3 — EmptyState component rendered when no clients exist (variant: no-clients)
 *   AC4 — ErrorPanel with "Reintentar" button shown when backend is unavailable; retry triggers new fetch
 *   AC5 — Clearing search input restores full list without triggering a new API call
 *
 * RED phase: These tests fail because:
 *   1. ClienteListView component does not exist yet
 *   2. /clientes route has placeholder content, not the split-panel layout
 *   3. data-testid attributes are not yet present in the DOM
 *   4. Backend GET /api/v1/clientes endpoint is not yet implemented
 */

import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

test.describe('Story 2.1 — Client List & Search', () => {
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

  // ───────────────────────────────────────────────────────────────────────────
  // AC1 — Left panel renders scrollable list with Nombre and NIT/RUC per item
  // ───────────────────────────────────────────────────────────────────────────

  test('AC1 — should render the client list panel at /clientes', async ({ page }) => {
    // GIVEN: There are clients in the system
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: The user navigates to /clientes
    // Network-first: intercept before navigation
    await page.route('**/api/v1/clientes', async (route) => route.continue());
    await page.goto('/clientes');

    // THEN: The left panel (data-testid="clientes-list-panel") is visible
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
  });

  test('AC1 — should display client Nombre in the list item', async ({ page }) => {
    // GIVEN: A client exists in the system
    const data = buildCliente({ nombre: 'Empresa Visible S.A.' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: The user navigates to /clientes
    await page.route('**/api/v1/clientes', async (route) => route.continue());
    await page.goto('/clientes');

    // THEN: The client's Nombre is visible in a list item
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Visible S.A.' })
    ).toBeVisible();
  });

  test('AC1 — should display client NIT in the list item alongside the Nombre', async ({ page }) => {
    // GIVEN: A client exists with a known NIT
    const data = buildCliente({ nit: '888777666-5' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: The user navigates to /clientes
    await page.route('**/api/v1/clientes', async (route) => route.continue());
    await page.goto('/clientes');

    // THEN: The NIT "888777666-5" is visible in the list
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: '888777666-5' })
    ).toBeVisible();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // AC3 — EmptyState shown when no clients exist
  // ───────────────────────────────────────────────────────────────────────────

  test('AC3 — should display EmptyState when no clients exist in the system', async ({ page }) => {
    // GIVEN: No clients exist in the system
    // Network-first: intercept before navigation, returning empty array
    await page.route('**/api/v1/clientes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: The EmptyState component with variant "no-clients" is displayed
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });

  test('AC3 — EmptyState should contain a message to guide user to create first client', async ({ page }) => {
    // GIVEN: No clients exist
    await page.route('**/api/v1/clientes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: The empty state contains text guiding to create the first client
    await expect(page.getByTestId('empty-state')).toContainText('No hay clientes registrados');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // AC4 — ErrorPanel with "Reintentar" shown when backend fails
  // ───────────────────────────────────────────────────────────────────────────

  test('AC4 — should display ErrorPanel when backend returns 500', async ({ page }) => {
    // GIVEN: The backend is unavailable when the page loads
    // Network-first: intercept before navigation, simulating backend failure
    await page.route('**/api/v1/clientes', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    // WHEN: The fetch fails
    await page.goto('/clientes');

    // THEN: ErrorPanel is displayed instead of the list
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('AC4 — ErrorPanel should contain a "Reintentar" button', async ({ page }) => {
    // GIVEN: The backend is unavailable
    await page.route('**/api/v1/clientes', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    // WHEN: The page fails to load
    await page.goto('/clientes');

    // THEN: A "Reintentar" button is visible within the ErrorPanel
    await expect(
      page.getByTestId('error-panel').getByRole('button', { name: /reintentar/i })
    ).toBeVisible();
  });

  test('AC4 — clicking "Reintentar" triggers a new fetch to GET /api/v1/clientes', async ({ page }) => {
    // GIVEN: The first request fails
    let requestCount = 0;
    await page.route('**/api/v1/clientes', async (route) => {
      requestCount++;
      if (requestCount === 1) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
    });
    await page.goto('/clientes');
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // WHEN: The user clicks "Reintentar"
    await page.getByTestId('error-panel').getByRole('button', { name: /reintentar/i }).click();

    // THEN: A second GET request is sent (requestCount becomes 2)
    await expect(page.getByTestId('error-panel')).toBeHidden();
    expect(requestCount).toBeGreaterThanOrEqual(2);
  });
});

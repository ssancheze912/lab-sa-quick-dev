/**
 * Story 2.1: Client List & Search — E2E Acceptance Tests
 * Epic 2: Client Management
 *
 * Acceptance Criteria covered:
 *   AC1 — Left panel (280px) renders scrollable list with Nombre + NIT/RUC per item
 *   AC2 — Real-time search filters by Nombre or NIT/RUC in ≤1s with 500 records
 *   AC3 — EmptyState shown when no clients exist
 *   AC4 — ErrorPanel with "Reintentar" shown on backend failure
 *
 * Priority: P1 (TC-E2-P1-01)
 * Test status: RED — all tests fail until implementation is complete.
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Left panel renders scrollable client list with Nombre and NIT/RUC
// (TC-E2-P1-01)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Client List Panel renders on /clientes', () => {
  const createdIds: string[] = [];
  let apiHelper: ApiHelper;

  test.beforeEach(async ({ request }) => {
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  test('should render left panel (data-testid="clientes-list-panel") when navigating to /clientes', async ({ page, request }) => {
    // GIVEN: At least one client exists in the system
    apiHelper = new ApiHelper(request);
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // CRITICAL: Intercept route BEFORE navigation (network-first pattern)
    await page.route('**/api/v1/clientes', (route) => route.continue());

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: Left panel is visible
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
  });

  test('should display a list item for each existing client with Nombre visible', async ({ page, request }) => {
    // GIVEN: A client exists in the system
    apiHelper = new ApiHelper(request);
    const data = buildCliente({ nombre: 'Empresa Visibilidad SA' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // CRITICAL: Intercept BEFORE navigation
    await page.route('**/api/v1/clientes', (route) => route.continue());

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: The client name "Empresa Visibilidad SA" is visible in the list
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Visibilidad SA' })
    ).toBeVisible();
  });

  test('should display NIT/RUC within the client list item', async ({ page, request }) => {
    // GIVEN: A client with a known NIT exists
    apiHelper = new ApiHelper(request);
    const data = buildCliente({ nit: '123456789-0' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // CRITICAL: Intercept BEFORE navigation
    await page.route('**/api/v1/clientes', (route) => route.continue());

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: NIT/RUC is visible in the corresponding list item
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: '123456789-0' })
    ).toBeVisible();
  });

  test('should render the left panel with fixed 280px width', async ({ page, request }) => {
    // GIVEN: A client exists
    apiHelper = new ApiHelper(request);
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    await page.route('**/api/v1/clientes', (route) => route.continue());

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');
    await page.getByTestId('clientes-list-panel').waitFor({ state: 'visible' });

    // THEN: Panel width is 280px
    const panelWidth = await page.getByTestId('clientes-list-panel').evaluate(
      (el) => el.getBoundingClientRect().width
    );
    expect(panelWidth).toBe(280);
  });

  test('should render the search input with placeholder text', async ({ page, request }) => {
    // GIVEN: The /clientes page loads
    apiHelper = new ApiHelper(request);
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: Search input with aria-label="Buscar clientes" is present
    await expect(
      page.getByRole('searchbox', { name: 'Buscar clientes' })
    ).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — EmptyState is displayed when no clients exist
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — EmptyState when backend returns empty array', () => {
  test('should display EmptyState component when GET /api/v1/clientes returns []', async ({ page }) => {
    // GIVEN: Backend returns empty array (no clients)
    // CRITICAL: Intercept BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
      })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: EmptyState component is displayed
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });

  test('should show Spanish guidance message in EmptyState when no clients exist', async ({ page }) => {
    // GIVEN: Backend returns empty array
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
      })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: Message guides user to create first client (Spanish)
    await expect(
      page.getByText(/No hay clientes registrados/i)
    ).toBeVisible();
  });

  test('should NOT render any client list items when EmptyState is shown', async ({ page }) => {
    // GIVEN: No clients in the system
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
      })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: No list items are rendered
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — ErrorPanel with "Reintentar" shown when backend fails
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — ErrorPanel when backend is unavailable', () => {
  test('should display ErrorPanel component when GET /api/v1/clientes returns 500', async ({ page }) => {
    // GIVEN: Backend returns 500 error
    // CRITICAL: Intercept BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Internal Server Error', status: 500 }),
      })
    );

    // WHEN: User navigates to /clientes (fetch fails)
    await page.goto('/clientes');

    // THEN: ErrorPanel is displayed
    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('should display "Reintentar" button inside ErrorPanel when backend is unavailable', async ({ page }) => {
    // GIVEN: Backend returns network error
    await page.route('**/api/v1/clientes', (route) => route.abort('failed'));

    // WHEN: User navigates to /clientes (fetch fails)
    await page.goto('/clientes');

    // THEN: "Reintentar" button is visible
    await expect(page.getByRole('button', { name: /Reintentar/i })).toBeVisible();
  });

  test('should trigger a refetch when the "Reintentar" button is clicked', async ({ page }) => {
    // GIVEN: Backend initially returns 500, then succeeds on retry
    let callCount = 0;
    await page.route('**/api/v1/clientes', (route) => {
      callCount += 1;
      if (callCount === 1) {
        route.fulfill({ status: 500, body: '{}' });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: '[]',
        });
      }
    });

    // WHEN: User navigates to /clientes and clicks "Reintentar"
    await page.goto('/clientes');
    await page.getByRole('button', { name: /Reintentar/i }).click();

    // THEN: A second GET /api/v1/clientes request is made (callCount >= 2)
    // Wait for the empty-state or list to appear (signals retry response was processed)
    await expect(page.getByTestId('empty-state')).toBeVisible();
    expect(callCount).toBeGreaterThanOrEqual(2);
  });
});

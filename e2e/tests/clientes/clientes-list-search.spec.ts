import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

/**
 * ATDD E2E tests — Story 2.1: Client List & Search (RED phase)
 *
 * Tests fail until:
 *   - GET /api/v1/clientes endpoint is implemented
 *   - ClienteListView with left panel (280px) is rendered at /clientes
 *   - EmptyState and ErrorPanel components exist
 *   - data-testid attributes are present in the implementation
 *
 * Test IDs:
 *   TC-E2-2-1-E2E-1 (P0) — Navigating to /clientes shows the left panel with client list
 *   TC-E2-2-1-E2E-2 (P1) — Real-time search filters list within 1 second (NFR1 smoke)
 *   TC-E2-2-1-E2E-3 (P1) — Empty state shown when no clients in system
 *   TC-E2-2-1-E2E-4 (P1) — ErrorPanel shown when backend returns error (mocked via route)
 */

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

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E2-2-1-E2E-1 (P0) — Left panel renders scrollable client list
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E2-2-1-E2E-1: should render left panel with client list when navigating to /clientes', async ({ page }) => {
    // GIVEN: A client exists in the system
    const data = buildCliente({ nombre: 'Empresa Lista Test' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // CRITICAL: Intercept routes BEFORE navigation (network-first pattern)
    // No route intercept needed here — uses real API

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // THEN: Left panel is rendered
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();

    // AND: The client appears in the list
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: data.nombre })
    ).toBeVisible();
  });

  test('should display Nombre and NIT/RUC for each client item', async ({ page }) => {
    // GIVEN: A client with known Nombre and NIT
    const data = buildCliente({ nombre: 'Empresa Visible Test', nit: '900500500-5' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // THEN: The item shows both Nombre and NIT
    const item = page.getByTestId('cliente-list-item').filter({ hasText: data.nombre });
    await expect(item).toContainText(data.nombre);
    await expect(item).toContainText(data.nit);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E2-2-1-E2E-2 (P1) — Real-time search filters within 1 second (NFR1)
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E2-2-1-E2E-2: should filter client list in real time when user types in search field (NFR1 ≤1s)', async ({ page }) => {
    // GIVEN: Two clients exist — only one matches the search term
    const matchingData = buildCliente({ nombre: 'Filtro Prueba Real' });
    const nonMatchingData = buildCliente({ nombre: 'Empresa No Coincide' });

    const matching = await apiHelper.createCliente(matchingData);
    const nonMatching = await apiHelper.createCliente(nonMatchingData);
    createdIds.push(matching.id, nonMatching.id);

    // WHEN: User navigates to /clientes (no route intercept — real backend)
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // Wait for list to fully load
    await expect(
      page.getByTestId('cliente-list-item').first()
    ).toBeVisible({ timeout: 5000 });

    const searchInput = page.getByPlaceholderText(/buscar por nombre o nit/i);
    await expect(searchInput).toBeVisible();

    // WHEN: User types the search term
    const start = Date.now();
    await searchInput.fill('Filtro Prueba Real');

    // THEN: Results appear in under 1 second (NFR1)
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Filtro Prueba Real' })
    ).toBeVisible({ timeout: 1000 });

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThanOrEqual(1000);

    // AND: Non-matching client is not visible
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa No Coincide' })
    ).toBeHidden();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E2-2-1-E2E-3 (P1) — EmptyState shown when no clients in system
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E2-2-1-E2E-3: should show EmptyState when there are no clients in the system', async ({ page }) => {
    // GIVEN: Backend returns empty array (intercepted BEFORE navigation)
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // THEN: EmptyState component is visible
    await expect(page.getByTestId('empty-state')).toBeVisible();

    // AND: No client list items are rendered
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(0);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E2-2-1-E2E-4 (P1) — ErrorPanel shown when backend returns error
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E2-2-1-E2E-4: should show ErrorPanel with "Reintentar" button when backend returns 500', async ({ page }) => {
    // GIVEN: Backend intercepted BEFORE navigation, returning 500
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Internal Server Error', status: 500 }),
      })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // THEN: ErrorPanel is visible
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // AND: "Reintentar" button is present
    await expect(page.getByRole('button', { name: /reintentar/i })).toBeVisible();

    // AND: No client list items are rendered
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(0);
  });

  test('should trigger a new fetch when "Reintentar" is clicked after an error', async ({ page }) => {
    // GIVEN: First request returns 500, subsequent requests succeed
    let requestCount = 0;

    // CRITICAL: Route intercept BEFORE navigation
    await page.route('**/api/v1/clientes', async (route) => {
      requestCount += 1;
      if (requestCount === 1) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ title: 'Internal Server Error', status: 500 }),
        });
      } else {
        const data = buildCliente({ nombre: 'Cliente Retry' });
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([data]),
        });
      }
    });

    // WHEN: User navigates to /clientes (first request fails)
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // Wait for ErrorPanel
    await expect(page.getByTestId('error-panel')).toBeVisible();

    const countBeforeRetry = requestCount;

    // WHEN: User clicks "Reintentar"
    await page.getByRole('button', { name: /reintentar/i }).click();

    // THEN: A new request was made
    await expect(async () => {
      expect(requestCount).toBeGreaterThan(countBeforeRetry);
    }).toPass({ timeout: 3000 });

    // AND: List is now populated
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Cliente Retry' })
    ).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // AC #5 — Default sort order is most recent first (fecha-desc)
  // ─────────────────────────────────────────────────────────────────────────

  test('should display all clients in default sort order (most recent first) when search is empty', async ({ page }) => {
    // GIVEN: Two clients with different creation dates (intercepted BEFORE navigation)
    const older = buildCliente({ nombre: 'Cliente Antiguo', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' });
    const newer = buildCliente({ nombre: 'Cliente Nuevo', createdAt: '2026-06-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' });

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([older, newer]),
      })
    );

    // WHEN: User navigates to /clientes with no search text
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // THEN: All clients are shown — newest first
    const items = page.getByTestId('cliente-list-item');
    await expect(items).toHaveCount(2);
    await expect(items.nth(0)).toContainText('Cliente Nuevo');
    await expect(items.nth(1)).toContainText('Cliente Antiguo');
  });
});

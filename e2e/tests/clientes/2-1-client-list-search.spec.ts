import { test, expect } from '../../fixtures/base.fixture';
import { ClientesPage } from '../../pages/clientes.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

/**
 * E2E Acceptance Tests — Story 2.1: Client List & Search
 *
 * Acceptance Criteria covered:
 *   AC1 — Left panel (280px) renders scrollable list with Nombre + NIT within 2 seconds
 *   AC3 — EmptyState shown when no clients exist in the system
 *   AC4 — ErrorPanel with "Reintentar" button shown when backend is unavailable
 *
 * These tests are in RED phase — they will fail until implementation is complete.
 * Network-first intercepts are set BEFORE navigation per ATDD patterns.
 */

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

  // ─────────────────────────────────────────────────────────────────────────
  // AC1: Left panel renders within 2 seconds
  // ─────────────────────────────────────────────────────────────────────────

  test('AC1 — left panel is visible and shows cliente Nombre and NIT within 2 seconds of navigation', async ({ page }) => {
    // GIVEN: There are clients in the system
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: User navigates to /clientes
    const start = Date.now();
    await page.goto('/clientes');

    // THEN: Left panel (clientes-list-panel) is rendered and shows Nombre and NIT
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();

    const item = page.getByTestId('cliente-list-item').filter({ hasText: data.nombre });
    await expect(item).toBeVisible();
    await expect(item).toContainText(data.nit);

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(2000);
  });

  test('AC1 — left panel has 280px fixed width', async ({ page }) => {
    // GIVEN: There are clients in the system
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();

    // THEN: Panel has 280px width (CSS constraint from architecture spec)
    const panelWidth = await page.getByTestId('clientes-list-panel').evaluate(
      (el) => el.getBoundingClientRect().width
    );
    expect(panelWidth).toBe(280);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // AC3: EmptyState when no clients exist
  // ─────────────────────────────────────────────────────────────────────────

  test('AC3 — EmptyState with guidance message is shown when no clients exist in the system', async ({ page }) => {
    // GIVEN: No clients exist (intercept API to return empty array)
    // Network-first: intercept BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: EmptyState component is displayed with the correct message
    await expect(page.getByTestId('empty-state')).toBeVisible();
    await expect(page.getByTestId('empty-state')).toContainText(
      'No hay clientes registrados. Crea el primero.'
    );
    // AND: No client list items are visible
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(0);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // AC4: ErrorPanel with Reintentar button when backend unavailable
  // ─────────────────────────────────────────────────────────────────────────

  test('AC4 — ErrorPanel is shown with "Reintentar" button when GET /api/v1/clientes fails', async ({ page }) => {
    // GIVEN: Backend is unavailable (intercept BEFORE navigation)
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Service Unavailable' }),
      })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: ErrorPanel component is displayed
    await expect(page.getByTestId('error-panel')).toBeVisible();
    // AND: "Reintentar" button is visible
    await expect(page.getByRole('button', { name: /reintentar/i })).toBeVisible();
    // AND: Raw error message is NOT shown to the user (NFR6)
    await expect(page.getByText('Service Unavailable')).not.toBeVisible();
    await expect(page.getByText(/503/)).not.toBeVisible();
  });

  test('AC4 — clicking "Reintentar" button triggers a new fetch request', async ({ page }) => {
    // GIVEN: Backend initially fails, then recovers
    let callCount = 0;
    const data = buildCliente();

    await page.route('**/api/v1/clientes', (route) => {
      callCount++;
      if (callCount === 1) {
        // First call fails
        route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ title: 'Service Unavailable' }),
        });
      } else {
        // Subsequent calls succeed
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'some-uuid',
              nombre: data.nombre,
              nit: data.nit,
              telefono: data.telefono,
              ciudad: data.ciudad,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]),
        });
      }
    });

    // WHEN: User navigates to /clientes (backend fails)
    await page.goto('/clientes');
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // WHEN: User clicks "Reintentar"
    await page.getByRole('button', { name: /reintentar/i }).click();

    // THEN: A new fetch is triggered and list renders
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
    await expect(page.getByTestId('cliente-list-item')).toBeVisible();
    expect(callCount).toBeGreaterThanOrEqual(2);
  });
});

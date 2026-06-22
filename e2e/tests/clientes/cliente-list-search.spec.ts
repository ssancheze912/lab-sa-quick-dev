import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

/**
 * ATDD — Story 2.1: Client List & Search
 *
 * RED phase: all tests FAIL until the implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Left panel (280px) renders scrollable client list with Nombre and NIT/RUC
 *   AC2 — Real-time search filters by Nombre or NIT/RUC (<1s for 500 records)
 *   AC3 — EmptyState shown when no clients exist
 *   AC4 — ErrorPanel + "Reintentar" shown when GET /api/v1/clientes fails
 *   AC5 — EmptyState shown when active search returns zero matches
 *
 * Priority alignment (test-design-epic-2.md):
 *   P0 → R-003 (NFR1 performance) — covered by component tests
 *   P1 → R-006 (EmptyState) + ErrorPanel — partially covered here (navigation)
 */

test.describe('Story 2.1 — Client List & Search (E2E, RED phase)', () => {
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
  // AC1 — Left panel renders scrollable list with Nombre and NIT/RUC per item
  // ─────────────────────────────────────────────────────────────────────────

  test('AC1 — clientes-list-panel is visible with 280px width when clients exist', async ({
    page,
  }) => {
    // GIVEN: A client exists in the system
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // THEN: The list panel is visible with the correct fixed width
    const listPanel = page.getByTestId('clientes-list-panel');
    await expect(listPanel).toBeVisible();

    const width = await listPanel.evaluate((el) =>
      parseInt(window.getComputedStyle(el).width, 10),
    );
    expect(width).toBe(280);
  });

  test('AC1 — each client item shows Nombre bold and NIT/RUC as subtext', async ({
    page,
  }) => {
    // GIVEN: A client exists in the system
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // THEN: The client item shows Nombre and NIT/RUC
    const item = page
      .getByTestId('cliente-list-item')
      .filter({ hasText: data.nombre });
    await expect(item).toBeVisible();
    await expect(item.getByTestId('cliente-item-nombre')).toContainText(
      data.nombre,
    );
    await expect(item.getByTestId('cliente-item-nit')).toContainText(data.nit);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // AC2 — Real-time search filters by Nombre or NIT/RUC
  // ─────────────────────────────────────────────────────────────────────────

  test('AC2 — search by Nombre filters the list in real time', async ({
    page,
  }) => {
    // GIVEN: Two clients exist with different names
    const matching = buildCliente({ nombre: 'Empresa Alpha Visible' });
    const nonMatching = buildCliente({ nombre: 'Corporacion Beta Oculta' });
    const c1 = await apiHelper.createCliente(matching);
    const c2 = await apiHelper.createCliente(nonMatching);
    createdIds.push(c1.id, c2.id);

    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // Wait for list to be populated
    await expect(
      page.getByTestId('cliente-list-item').first(),
    ).toBeVisible();

    // WHEN: The user types in the search field
    const searchInput = page.getByTestId('clientes-search-input');
    await searchInput.fill('Alpha Visible');

    // THEN: Only the matching client is visible
    await expect(
      page
        .getByTestId('cliente-list-item')
        .filter({ hasText: 'Alpha Visible' }),
    ).toBeVisible();
    await expect(
      page
        .getByTestId('cliente-list-item')
        .filter({ hasText: 'Beta Oculta' }),
    ).not.toBeVisible();
  });

  test('AC2 — search by NIT/RUC filters the list in real time', async ({
    page,
  }) => {
    // GIVEN: A client with a specific NIT exists
    const data = buildCliente({ nit: '987654321' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await expect(
      page.getByTestId('cliente-list-item').first(),
    ).toBeVisible();

    // WHEN: The user types the NIT in the search field
    await page.getByTestId('clientes-search-input').fill('987654321');

    // THEN: The client appears in the filtered list
    await expect(
      page
        .getByTestId('cliente-list-item')
        .filter({ hasText: data.nombre }),
    ).toBeVisible();
  });

  test('AC2 — search is case-insensitive', async ({ page }) => {
    // GIVEN: A client with uppercase name
    const data = buildCliente({ nombre: 'EMPRESA MAYUSCULA TEST' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await expect(
      page.getByTestId('cliente-list-item').first(),
    ).toBeVisible();

    // WHEN: User searches in lowercase
    await page.getByTestId('clientes-search-input').fill('empresa mayuscula');

    // THEN: The client still appears
    await expect(
      page
        .getByTestId('cliente-list-item')
        .filter({ hasText: 'EMPRESA MAYUSCULA TEST' }),
    ).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // AC3 — EmptyState when no clients in system
  // ─────────────────────────────────────────────────────────────────────────

  test('AC3 — empty-state is shown with CTA when no clients exist', async ({
    page,
  }) => {
    // GIVEN: No clients in the system (relying on clean state or empty DB)
    // Note: this test is fragile in shared environments;
    // prefer component test for isolation. Left here for E2E coverage.

    // WHEN: The user navigates to /clientes with an empty database
    // We intercept the API to simulate empty state
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // THEN: EmptyState component is visible with create-first CTA
    const emptyState = page.getByTestId('empty-state');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('No hay clientes registrados');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // AC4 — ErrorPanel with "Reintentar" when GET /api/v1/clientes fails
  // ─────────────────────────────────────────────────────────────────────────

  test('AC4 — error-panel is shown with Reintentar button on 503', async ({
    page,
  }) => {
    // GIVEN: The backend is unavailable
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Service Unavailable' }),
      }),
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // THEN: The ErrorPanel is displayed in place of the list
    const errorPanel = page.getByTestId('error-panel');
    await expect(errorPanel).toBeVisible();

    // AND: A "Reintentar" button is shown
    const retryButton = page.getByTestId('error-panel-retry');
    await expect(retryButton).toBeVisible();
    await expect(retryButton).toContainText('Reintentar');
  });

  test('AC4 — Reintentar button triggers a new fetch', async ({ page }) => {
    // GIVEN: First fetch fails, second succeeds
    let callCount = 0;
    const data = buildCliente();

    await page.route('**/api/v1/clientes', (route) => {
      callCount++;
      if (callCount === 1) {
        route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Service Unavailable' }),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([data]),
        });
      }
    });

    // WHEN: User navigates to /clientes (first load fails)
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // AND: User clicks "Reintentar"
    await page.getByTestId('error-panel-retry').click();

    // THEN: The list is re-fetched and the client appears
    await expect(
      page
        .getByTestId('cliente-list-item')
        .filter({ hasText: data.nombre }),
    ).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // AC5 — EmptyState for zero search matches (distinct from AC3)
  // ─────────────────────────────────────────────────────────────────────────

  test('AC5 — empty-state shows "Sin resultados" when search matches nothing', async ({
    page,
  }) => {
    // GIVEN: A client exists (so AC3 EmptyState is NOT triggered)
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await expect(
      page.getByTestId('cliente-list-item').first(),
    ).toBeVisible();

    // WHEN: The user searches for a term that matches nothing
    await page
      .getByTestId('clientes-search-input')
      .fill('XYZ_TERMINO_INEXISTENTE_999');

    // THEN: The EmptyState component is shown with "Sin resultados" text
    const emptyState = page.getByTestId('empty-state');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('Sin resultados');
  });
});

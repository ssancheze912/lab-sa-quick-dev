/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (E2E Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — /clientes renders scrollable left panel (280px) with client items showing Nombre and NIT/RUC
 *   AC2 — Search input filters list in real time by Nombre or NIT/RUC; results in under 1 second with 500 records
 *   AC3 — Empty state component shown when no clients exist
 *   AC4 — ErrorPanel with "Reintentar" button shown when backend fetch fails; no stack traces exposed
 */

import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Left panel renders scrollable client list with Nombre and NIT/RUC
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Client list panel renders with Nombre and NIT/RUC', () => {
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

  test('[P0] should render the list panel at /clientes route', async ({ page }) => {
    // GIVEN: The application is running
    // WHEN: The user navigates to /clientes

    // CRITICAL: Intercept routes BEFORE navigation (network-first pattern)
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await page.goto('/clientes');

    // THEN: The left panel (clientes-list-panel) is present in the DOM
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
  });

  test('[P0] should render client item showing Nombre in the list panel', async ({ page, request }) => {
    // GIVEN: There is at least one client in the system
    apiHelper = new ApiHelper(request);
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // THEN: The client's Nombre is visible in the list panel
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: data.nombre })
    ).toBeVisible();
  });

  test('[P0] should render client item showing NIT/RUC in the list panel', async ({ page, request }) => {
    // GIVEN: There is at least one client in the system
    apiHelper = new ApiHelper(request);
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // THEN: The client's NIT is visible in the list panel
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: data.nit })
    ).toBeVisible();
  });

  test('[P0] should render the list panel with fixed width of 280px', async ({ page }) => {
    // GIVEN: The application is running
    // WHEN: The user navigates to /clientes

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await page.goto('/clientes');

    // THEN: The list panel has a fixed width of 280px (shrink-0)
    const panel = page.getByTestId('clientes-list-panel');
    await expect(panel).toBeVisible();
    const boundingBox = await panel.boundingBox();
    expect(boundingBox?.width).toBe(280);
  });

  test('[P1] should render multiple client items when multiple clients exist', async ({ page, request }) => {
    // GIVEN: Two clients exist in the system
    apiHelper = new ApiHelper(request);
    const data1 = buildCliente();
    const data2 = buildCliente();
    const c1 = await apiHelper.createCliente(data1);
    const c2 = await apiHelper.createCliente(data2);
    createdIds.push(c1.id, c2.id);

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // THEN: Both client items are visible in the list
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: data1.nombre })
    ).toBeVisible();
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: data2.nombre })
    ).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Search input filters the list in real time by Nombre or NIT/RUC
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Real-time client-side search by Nombre and NIT/RUC', () => {
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

  test('[P0] should render a search input with placeholder "Buscar por nombre o NIT/RUC"', async ({ page }) => {
    // GIVEN: The user navigates to /clientes
    // WHEN: The list panel renders

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await page.goto('/clientes');

    // THEN: A search input with the correct placeholder is visible
    await expect(
      page.getByPlaceholder('Buscar por nombre o NIT/RUC')
    ).toBeVisible();
  });

  test('[P0] should filter list by Nombre when user types in search field', async ({ page, request }) => {
    // GIVEN: Two clients exist in the system
    apiHelper = new ApiHelper(request);
    const matchingData = buildCliente({ nombre: 'Empresa Alfa Colombia' });
    const nonMatchingData = buildCliente({ nombre: 'Comercial Beta SA' });
    const c1 = await apiHelper.createCliente(matchingData);
    const c2 = await apiHelper.createCliente(nonMatchingData);
    createdIds.push(c1.id, c2.id);

    // WHEN: The user navigates to /clientes and types in the search field
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await page.getByPlaceholder('Buscar por nombre o NIT/RUC').fill('Alfa');

    // THEN: Only the matching client is visible; the non-matching client is hidden
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Alfa Colombia' })
    ).toBeVisible();
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Comercial Beta SA' })
    ).toBeHidden();
  });

  test('[P0] should filter list by NIT/RUC when user types in search field', async ({ page, request }) => {
    // GIVEN: Two clients exist with different NITs
    apiHelper = new ApiHelper(request);
    const targetData = buildCliente({ nit: '900111222-3' });
    const otherData = buildCliente({ nit: '800999888-7' });
    const c1 = await apiHelper.createCliente(targetData);
    const c2 = await apiHelper.createCliente(otherData);
    createdIds.push(c1.id, c2.id);

    // WHEN: The user navigates to /clientes and searches by NIT
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await page.getByPlaceholder('Buscar por nombre o NIT/RUC').fill('900111222');

    // THEN: Only the client matching the NIT is visible
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: targetData.nombre })
    ).toBeVisible();
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: otherData.nombre })
    ).toBeHidden();
  });

  test('[P0] should perform case-insensitive search by Nombre', async ({ page, request }) => {
    // GIVEN: A client named "Empresa Gamma" exists
    apiHelper = new ApiHelper(request);
    const data = buildCliente({ nombre: 'Empresa Gamma SAS' });
    const c = await apiHelper.createCliente(data);
    createdIds.push(c.id);

    // WHEN: The user searches with lowercase "gamma"
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await page.getByPlaceholder('Buscar por nombre o NIT/RUC').fill('gamma');

    // THEN: The client is still visible (case-insensitive match)
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Gamma SAS' })
    ).toBeVisible();
  });

  test('[P1] should clear filter and show all clients when search input is cleared', async ({ page, request }) => {
    // GIVEN: Two clients exist and user has applied a search filter
    apiHelper = new ApiHelper(request);
    const data1 = buildCliente({ nombre: 'Delta Logistica' });
    const data2 = buildCliente({ nombre: 'Epsilon Tecnologia' });
    const c1 = await apiHelper.createCliente(data1);
    const c2 = await apiHelper.createCliente(data2);
    createdIds.push(c1.id, c2.id);

    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    const searchInput = page.getByPlaceholder('Buscar por nombre o NIT/RUC');
    await searchInput.fill('Delta');

    // WHEN: The user clears the search input
    await searchInput.clear();

    // THEN: Both clients are visible again
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Delta Logistica' })
    ).toBeVisible();
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Epsilon Tecnologia' })
    ).toBeVisible();
  });

  test('[P2] should not trigger a new API call when user types in search field', async ({ page }) => {
    // GIVEN: Clients are loaded (client-side filtering, no new API calls)
    let apiCallCount = 0;

    await page.route('**/api/v1/clientes', (route) => {
      apiCallCount++;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '1', nombre: 'Cliente Zeta', nit: '100200300', telefono: '300', ciudad: 'Bogotá', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        ]),
      });
    });

    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    const callCountAfterLoad = apiCallCount;

    // WHEN: User types in the search field
    await page.getByPlaceholder('Buscar por nombre o NIT/RUC').fill('Zeta');

    // THEN: No additional API calls were made (client-side filter)
    expect(apiCallCount).toBe(callCountAfterLoad);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — EmptyState component when no clients exist
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — EmptyState shown when no clients exist', () => {
  test('[P0] should display EmptyState when the client list is empty', async ({ page }) => {
    // GIVEN: No clients exist in the system
    // CRITICAL: Intercept BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: The EmptyState component is displayed
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });

  test('[P0] should display guidance message in EmptyState to create the first client', async ({ page }) => {
    // GIVEN: No clients exist in the system
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: The EmptyState contains a message guiding the user to create the first client
    const emptyState = page.getByTestId('empty-state');
    await expect(emptyState).toBeVisible();
    // Message should guide the user to create a client (in Spanish)
    await expect(emptyState).toContainText(/primer cliente|no hay clientes|crear/i);
  });

  test('[P1] should NOT display client list items when EmptyState is shown', async ({ page }) => {
    // GIVEN: No clients exist
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: No client list items are rendered
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — ErrorPanel with "Reintentar" button on backend fetch failure
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — ErrorPanel shown on backend fetch failure', () => {
  test('[P0] should display ErrorPanel when the backend is unavailable', async ({ page }) => {
    // GIVEN: The backend is unavailable
    // CRITICAL: Intercept BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Internal Server Error' }),
      })
    );

    // WHEN: The user navigates to /clientes and the fetch fails
    await page.goto('/clientes');

    // THEN: The ErrorPanel component is displayed
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('[P0] should display a "Reintentar" button in the ErrorPanel', async ({ page }) => {
    // GIVEN: The backend fetch failed
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Internal Server Error' }),
      })
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: A "Reintentar" button is present in the ErrorPanel
    await expect(
      page.getByTestId('error-panel').getByRole('button', { name: /reintentar/i })
    ).toBeVisible();
  });

  test('[P0] should NOT expose stack traces or technical error details to the user', async ({ page }) => {
    // GIVEN: The backend returns a 500 error with technical details
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          title: 'Internal Server Error',
          detail: 'NpgsqlException: connection refused at port 5432',
          stackTrace: 'at SiesaAgents.Infrastructure...',
        }),
      })
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: No stack trace or technical details are visible in the page content
    const pageContent = await page.content();
    expect(pageContent).not.toContain('NpgsqlException');
    expect(pageContent).not.toContain('stackTrace');
    expect(pageContent).not.toContain('SiesaAgents.Infrastructure');
  });

  test('[P1] should retry loading clients when "Reintentar" button is clicked', async ({ page }) => {
    // GIVEN: Initial fetch fails, then succeeds on retry
    let callCount = 0;

    await page.route('**/api/v1/clientes', (route) => {
      callCount++;
      if (callCount === 1) {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ title: 'Internal Server Error' }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '1', nombre: 'Cliente Recuperado', nit: '100200300', telefono: '300', ciudad: 'Bogotá', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        ]),
      });
    });

    await page.goto('/clientes');

    // Error panel is shown
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // WHEN: The user clicks "Reintentar"
    await page.getByTestId('error-panel').getByRole('button', { name: /reintentar/i }).click();

    // THEN: The client list loads successfully
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Cliente Recuperado' })
    ).toBeVisible();
  });

  test('[P1] should NOT display the client list when ErrorPanel is shown', async ({ page }) => {
    // GIVEN: Backend fetch fails
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Internal Server Error' }),
      })
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: No client list items are rendered
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(0);
  });
});

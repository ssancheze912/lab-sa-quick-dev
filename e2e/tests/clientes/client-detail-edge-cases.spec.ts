/**
 * Story 2.2: Client Detail View — E2E Edge Cases
 * Epic 2: Client Management
 *
 * Expands ATDD E2E coverage (client-detail.spec.ts) with edge cases and error
 * paths NOT covered in the ATDD tests:
 *
 *   - Loading skeleton visible when API response is slow
 *   - Network error (5xx) shows ErrorPanel with "Reintentar" button
 *   - "Reintentar" button triggers a refetch and shows data on success
 *   - Detail panel has aria-label="Detalle del cliente"
 *   - Special characters in client name/NIT render correctly (no encoding artifacts)
 *   - Rapid navigation between two clients shows correct detail for each
 *   - Navigating from /clientes/:id back to /clientes shows empty state
 *   - Right panel does NOT show stale data from a previous client after navigating
 *
 * Framework: Playwright
 * Patterns: network-first (intercepts before goto), data-testid and ARIA selectors,
 *           Given-When-Then structure, no hard waits.
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton visible during slow API response
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Loading state — skeleton visible during slow API response', () => {
  const createdIds: string[] = [];
  let apiHelper: ApiHelper;

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  test('[P1] should show skeleton rows (NOT a spinner) while detail is loading', async ({ page, request }) => {
    // GIVEN: A client exists and the API response is artificially delayed
    apiHelper = new ApiHelper(request);
    const data = buildCliente({ nombre: 'Slow Loader SA' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // CRITICAL: Intercept BEFORE navigation — delay the detail response
    await page.route('**/api/v1/clientes', (route) => route.continue());
    await page.route(`**/api/v1/clientes/${cliente.id}`, async (route) => {
      // Delay 300ms so skeleton state is observable
      await new Promise((resolve) => setTimeout(resolve, 300));
      await route.continue();
    });

    // WHEN: User navigates directly to /clientes/:clienteId
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: Skeleton rows are visible before data loads (react-loading-skeleton)
    // The detail panel should be in a loading state initially
    const skeletonRows = page.locator('[data-testid="skeleton-row"]');
    await expect(skeletonRows.first()).toBeVisible();

    // AND: No spinner element (company UX standard: skeleton not spinner)
    await expect(page.locator('[data-testid="spinner"]')).not.toBeVisible();

    // AND: Eventually data loads
    await expect(page.getByText('Slow Loader SA')).toBeVisible();
  });

  test('[P1] should set aria-busy="true" on detail container while loading', async ({ page, request }) => {
    // GIVEN: A client exists, API response is delayed
    apiHelper = new ApiHelper(request);
    const data = buildCliente({ nombre: 'Aria Busy Test SA' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    await page.route('**/api/v1/clientes', (route) => route.continue());
    await page.route(`**/api/v1/clientes/${cliente.id}`, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      await route.continue();
    });

    // WHEN: Navigate to deep link
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: Container has aria-busy="true" during load
    const busyContainer = page.locator('[aria-busy="true"]');
    await expect(busyContainer).toBeVisible();

    // AND: aria-busy is removed once data is loaded
    await expect(page.getByText('Aria Busy Test SA')).toBeVisible();
    await expect(page.locator('[aria-busy="true"]')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Network error (5xx) — ErrorPanel with "Reintentar" button
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Error state — 5xx response shows ErrorPanel with Reintentar', () => {
  const CLIENT_ID = '33333333-3333-4333-8333-333333333333';

  test('[P1] should display ErrorPanel when GET /api/v1/clientes/:id returns 500', async ({ page }) => {
    // GIVEN: The API returns a 500 error for the detail endpoint
    await page.route('**/api/v1/clientes', (route) => route.continue());
    await page.route(`**/api/v1/clientes/${CLIENT_ID}`, (route) =>
      route.fulfill({ status: 500, body: JSON.stringify({ error: 'Internal Server Error' }) })
    );

    // WHEN: User navigates to /clientes/:clienteId
    await page.goto(`/clientes/${CLIENT_ID}`);

    // THEN: An error state is shown (ErrorPanel with role="alert")
    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('[P1] should show "Reintentar" button inside ErrorPanel on 5xx', async ({ page }) => {
    // GIVEN: The API returns 500
    await page.route('**/api/v1/clientes', (route) => route.continue());
    await page.route(`**/api/v1/clientes/${CLIENT_ID}`, (route) =>
      route.fulfill({ status: 500, body: JSON.stringify({ error: 'Internal Server Error' }) })
    );

    // WHEN: Navigate to the client detail route
    await page.goto(`/clientes/${CLIENT_ID}`);

    // THEN: A "Reintentar" button is visible
    await expect(page.getByRole('button', { name: /reintentar/i })).toBeVisible();
  });

  test('[P1] should NOT show "Cliente no encontrado." when 5xx error occurs', async ({ page }) => {
    // GIVEN: A 500 error (system failure, not a missing resource)
    await page.route('**/api/v1/clientes', (route) => route.continue());
    await page.route(`**/api/v1/clientes/${CLIENT_ID}`, (route) =>
      route.fulfill({ status: 500, body: JSON.stringify({ error: 'Internal Server Error' }) })
    );

    // WHEN: Navigate to the client detail
    await page.goto(`/clientes/${CLIENT_ID}`);
    await page.getByRole('alert').waitFor({ state: 'visible' });

    // THEN: The "not found" message is NOT shown (wrong error type)
    await expect(page.getByText('Cliente no encontrado.')).not.toBeVisible();
  });

  test('[P1] should trigger a refetch when "Reintentar" is clicked — shows data on success', async ({ page, request }) => {
    // GIVEN: First request fails with 500, second request succeeds
    const apiHelper = new ApiHelper(request);
    const data = buildCliente({ nombre: 'Retry Success SA' });
    const cliente = await apiHelper.createCliente(data);

    let callCount = 0;
    await page.route('**/api/v1/clientes', (route) => route.continue());
    await page.route(`**/api/v1/clientes/${cliente.id}`, async (route) => {
      callCount++;
      if (callCount === 1) {
        await route.fulfill({ status: 500, body: JSON.stringify({ error: 'Server Error' }) });
      } else {
        await route.continue();
      }
    });

    // WHEN: Navigate to detail — first request fails
    await page.goto(`/clientes/${cliente.id}`);
    const retryBtn = page.getByRole('button', { name: /reintentar/i });
    await expect(retryBtn).toBeVisible();

    // AND: Click "Reintentar"
    await retryBtn.click();

    // THEN: The data is now shown
    await expect(page.getByText('Retry Success SA')).toBeVisible();

    // Cleanup
    await apiHelper.deleteCliente(cliente.id).catch(() => null);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Accessibility — detail panel aria-label
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Accessibility — detail panel aria-label', () => {
  const createdIds: string[] = [];
  let apiHelper: ApiHelper;

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  test('[P2] should have aria-label="Detalle del cliente" on the detail container', async ({ page, request }) => {
    // GIVEN: A valid client exists
    apiHelper = new ApiHelper(request);
    const data = buildCliente({ nombre: 'Aria Label Test SA' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    await page.route('**/api/v1/clientes', (route) => route.continue());
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) => route.continue());

    // WHEN: Navigate to the client detail
    await page.goto(`/clientes/${cliente.id}`);
    await page.getByText('Aria Label Test SA').waitFor({ state: 'visible' });

    // THEN: The detail section has the correct aria-label (WCAG 2.1 AA)
    const detailSection = page.getByRole('region', { name: 'Detalle del cliente' });
    await expect(detailSection).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Special characters in client fields
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Special characters in client fields render without encoding artifacts', () => {
  const createdIds: string[] = [];
  let apiHelper: ApiHelper;

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  test('[P2] should render a client name with accented characters correctly', async ({ page, request }) => {
    // GIVEN: A client with accented characters in the nombre
    apiHelper = new ApiHelper(request);
    const data = buildCliente({ nombre: 'Distribución Rápida Ltda', ciudad: 'Bogotá' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    await page.route('**/api/v1/clientes', (route) => route.continue());
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) => route.continue());

    // WHEN: Navigate to the detail view
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: Accented characters are rendered correctly (no HTML entity artifacts)
    await expect(page.getByText('Distribución Rápida Ltda')).toBeVisible();
    await expect(page.getByText('Bogotá')).toBeVisible();
  });

  test('[P2] should render a NIT with dash and special format without corruption', async ({ page, request }) => {
    // GIVEN: A client with NIT in Colombian tax format (with dash)
    apiHelper = new ApiHelper(request);
    const data = buildCliente({ nombre: 'NIT Format Test SA', nit: '900.123.456-7' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    await page.route('**/api/v1/clientes', (route) => route.continue());
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) => route.continue());

    // WHEN: Navigate to detail
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: NIT with dash and dots is rendered exactly as stored
    await expect(page.getByText('900.123.456-7')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rapid navigation between two clients
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Rapid navigation — correct detail shown after switching clients', () => {
  const createdIds: string[] = [];
  let apiHelper: ApiHelper;

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  test('[P1] should show correct detail after navigating from one client to another', async ({ page, request }) => {
    // GIVEN: Two clients exist with distinct data
    apiHelper = new ApiHelper(request);
    const dataA = buildCliente({ nombre: 'Cliente Alpha SA' });
    const dataB = buildCliente({ nombre: 'Cliente Beta Ltda' });
    const clienteA = await apiHelper.createCliente(dataA);
    const clienteB = await apiHelper.createCliente(dataB);
    createdIds.push(clienteA.id, clienteB.id);

    await page.route('**/api/v1/clientes', (route) => route.continue());
    await page.route(`**/api/v1/clientes/${clienteA.id}`, (route) => route.continue());
    await page.route(`**/api/v1/clientes/${clienteB.id}`, (route) => route.continue());

    // WHEN: Navigate to first client
    await page.goto(`/clientes/${clienteA.id}`);
    await page.getByText('Cliente Alpha SA').waitFor({ state: 'visible' });

    // AND: Click on the second client in the list (SPA navigation, no page reload)
    await page
      .getByTestId('cliente-list-item')
      .filter({ hasText: 'Cliente Beta Ltda' })
      .click();

    // THEN: The detail panel shows the SECOND client's data
    await expect(page.getByText('Cliente Beta Ltda')).toBeVisible();

    // AND: The FIRST client's name is NOT shown in the detail panel
    const detailPanel = page.getByTestId('cliente-detail-panel');
    await expect(detailPanel.getByText('Cliente Alpha SA')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Navigate back to /clientes — empty state restored
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Back navigation — /clientes shows empty state after visiting detail', () => {
  const createdIds: string[] = [];
  let apiHelper: ApiHelper;

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  test('[P2] should show empty state message when user navigates back to /clientes', async ({ page, request }) => {
    // GIVEN: A client detail was previously displayed
    apiHelper = new ApiHelper(request);
    const data = buildCliente({ nombre: 'Back Nav Test SA' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    await page.route('**/api/v1/clientes', (route) => route.continue());
    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) => route.continue());

    // Navigate to detail first
    await page.goto(`/clientes/${cliente.id}`);
    await page.getByText('Back Nav Test SA').waitFor({ state: 'visible' });

    // WHEN: User navigates to /clientes (root, no selection)
    await page.goto('/clientes');

    // THEN: The empty state is shown again
    await expect(
      page.getByText('Selecciona un cliente para ver sus detalles.')
    ).toBeVisible();

    // AND: The previous client's data is NOT shown
    await expect(page.getByText('Back Nav Test SA')).not.toBeVisible();
  });
});

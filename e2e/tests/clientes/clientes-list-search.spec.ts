/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (E2E Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Left panel (280px) shows scrollable client list with Nombre and NIT/RUC per item
 *   AC2 — Real-time search filters by Nombre or NIT/RUC (case-insensitive, < 1s for 500 records)
 *   AC3 — EmptyState component shown when no clients exist
 *   AC4 — ErrorPanel with "Reintentar" button shown when backend is unavailable
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';
import { ClientesPage } from '../../pages/clientes.page';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Client list displays all clients with Nombre and NIT/RUC in left panel
// TC-E2-P1-01 (E2E level — critical happy path)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Client list panel renders all clients', () => {
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

  test('should show scrollable client list in the left panel when clients exist', async ({ page }) => {
    // GIVEN: Three clients exist in the system
    const clienteA = buildCliente({ nombre: 'Empresa Alfa S.A.S.', nit: '900111001-1' });
    const clienteB = buildCliente({ nombre: 'Empresa Beta Ltda.', nit: '900222002-2' });
    const clienteC = buildCliente({ nombre: 'Empresa Gamma Corp.', nit: '900333003-3' });

    const respA = await apiHelper.createCliente(clienteA);
    const respB = await apiHelper.createCliente(clienteB);
    const respC = await apiHelper.createCliente(clienteC);
    createdIds.push(respA.id, respB.id, respC.id);

    // WHEN: User navigates to /clientes
    // Network-first: intercept must happen BEFORE navigation
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // THEN: The left panel (clientes-list-panel) is visible
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
  });

  test('should display client Nombre in each list item', async ({ page }) => {
    // GIVEN: A client "Empresa Alfa S.A.S." exists in the system
    const cliente = buildCliente({ nombre: 'Empresa Alfa S.A.S.', nit: '900111001-1' });
    const resp = await apiHelper.createCliente(cliente);
    createdIds.push(resp.id);

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // THEN: The client's Nombre is visible in the list
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Alfa S.A.S.' })
    ).toBeVisible();
  });

  test('should display client NIT/RUC in each list item', async ({ page }) => {
    // GIVEN: A client with NIT/RUC "900111001-1" exists in the system
    const cliente = buildCliente({ nombre: 'Empresa NIT Test', nit: '900111001-1' });
    const resp = await apiHelper.createCliente(cliente);
    createdIds.push(resp.id);

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // THEN: The client's NIT/RUC is visible in the list item
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: '900111001-1' })
    ).toBeVisible();
  });

  test('should have the left panel with a fixed width of 280px', async ({ page }) => {
    // GIVEN: Clients exist in the system
    const cliente = buildCliente();
    const resp = await apiHelper.createCliente(cliente);
    createdIds.push(resp.id);

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // THEN: The list panel has approximately 280px width
    const panel = page.getByTestId('clientes-list-panel');
    await expect(panel).toBeVisible();
    const boundingBox = await panel.boundingBox();
    expect(boundingBox).not.toBeNull();
    // Width should be ~280px (allowing ±10px tolerance for borders/padding)
    expect(boundingBox!.width).toBeGreaterThanOrEqual(270);
    expect(boundingBox!.width).toBeLessThanOrEqual(290);
  });

  test('should have a search input with correct aria-label for accessibility', async ({ page }) => {
    // GIVEN: The user navigates to /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // WHEN: The page loads
    // THEN: A search input with aria-label "Buscar cliente" exists
    await expect(
      page.getByRole('textbox', { name: /buscar cliente/i })
    ).toBeVisible();
  });

  test('should render client list with role="list" and items with role="listitem"', async ({ page }) => {
    // GIVEN: At least one client exists in the system
    const cliente = buildCliente({ nombre: 'Empresa Accesible S.A.' });
    const resp = await apiHelper.createCliente(cliente);
    createdIds.push(resp.id);

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // THEN: The list container has role="list" (WCAG 2.1 AA)
    await expect(page.getByRole('list')).toBeVisible();

    // THEN: Each client item has role="listitem"
    await expect(page.getByRole('listitem').first()).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Real-time search filters by Nombre or NIT/RUC
// TC-E2-P1-05, TC-E2-P1-06 (E2E level)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Real-time search filters client list', () => {
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

  test('should filter client list by Nombre when user types in search field', async ({ page }) => {
    // GIVEN: Two clients exist — "Acme Corp" and "Beta Industries"
    const acme = buildCliente({ nombre: 'Acme Corp S.A.S.', nit: '901001001-1' });
    const beta = buildCliente({ nombre: 'Beta Industries Ltda.', nit: '902002002-2' });
    const respA = await apiHelper.createCliente(acme);
    const respB = await apiHelper.createCliente(beta);
    createdIds.push(respA.id, respB.id);

    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    // Wait for list to load
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // WHEN: User types "acme" in the search field
    await page.getByRole('textbox', { name: /buscar cliente/i }).fill('acme');

    // THEN: Only the matching client is visible
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Acme Corp S.A.S.' })
    ).toBeVisible();

    // THEN: Non-matching client is NOT visible
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Beta Industries Ltda.' })
    ).not.toBeVisible();
  });

  test('should filter client list by NIT/RUC when user types in search field', async ({ page }) => {
    // GIVEN: Two clients exist with distinct NIT/RUC values
    const cliente1 = buildCliente({ nombre: 'Empresa NIT Uno', nit: '999888777-1' });
    const cliente2 = buildCliente({ nombre: 'Empresa NIT Dos', nit: '111222333-2' });
    const resp1 = await apiHelper.createCliente(cliente1);
    const resp2 = await apiHelper.createCliente(cliente2);
    createdIds.push(resp1.id, resp2.id);

    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // WHEN: User types a partial NIT/RUC "999888" in the search field
    await page.getByRole('textbox', { name: /buscar cliente/i }).fill('999888');

    // THEN: Only the client matching that NIT/RUC is visible
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa NIT Uno' })
    ).toBeVisible();

    // THEN: Client with non-matching NIT/RUC is NOT visible
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa NIT Dos' })
    ).not.toBeVisible();
  });

  test('should perform search case-insensitively', async ({ page }) => {
    // GIVEN: A client "EMPRESA MAYUSCULA" exists
    const cliente = buildCliente({ nombre: 'EMPRESA MAYUSCULA', nit: '900500500-5' });
    const resp = await apiHelper.createCliente(cliente);
    createdIds.push(resp.id);

    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // WHEN: User types in lowercase "empresa mayuscula"
    await page.getByRole('textbox', { name: /buscar cliente/i }).fill('empresa mayuscula');

    // THEN: The client is still visible (case-insensitive match)
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'EMPRESA MAYUSCULA' })
    ).toBeVisible();
  });

  test('should restore full list when search input is cleared', async ({ page }) => {
    // GIVEN: Two clients exist and search has been applied
    const clienteA = buildCliente({ nombre: 'Empresa Visible A', nit: '901001001-1' });
    const clienteB = buildCliente({ nombre: 'Empresa Visible B', nit: '902002002-2' });
    const respA = await apiHelper.createCliente(clienteA);
    const respB = await apiHelper.createCliente(clienteB);
    createdIds.push(respA.id, respB.id);

    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    const searchInput = page.getByRole('textbox', { name: /buscar cliente/i });
    await searchInput.fill('Visible A');
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Visible B' })
    ).not.toBeVisible();

    // WHEN: User clears the search input
    await searchInput.clear();

    // THEN: Both clients are visible again
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Visible A' })
    ).toBeVisible();
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Visible B' })
    ).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — EmptyState rendered when no clients exist
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — EmptyState shown when no clients exist', () => {
  test('should display EmptyState component when there are no clients', async ({ page }) => {
    // GIVEN: The database has no clients
    // Network-first: intercept GET /api/v1/clientes BEFORE navigating
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
  });

  test('should display guiding message in EmptyState when no clients exist', async ({ page }) => {
    // GIVEN: No clients in the system
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

    // THEN: The EmptyState contains the guiding message
    await expect(
      page.getByText(/no hay clientes registrados/i)
    ).toBeVisible();
  });

  test('should NOT show any list items when EmptyState is displayed', async ({ page }) => {
    // GIVEN: No clients in the system
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

    // THEN: No client list items are present in the DOM
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — ErrorPanel with "Reintentar" button when backend is unavailable
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — ErrorPanel shown when backend fetch fails', () => {
  test('should display ErrorPanel when backend returns a network error', async ({ page }) => {
    // GIVEN: The backend is unavailable (network failure)
    // Network-first: intercept BEFORE navigating
    await page.route('**/api/v1/clientes', (route) =>
      route.abort('connectionrefused')
    );

    // WHEN: User navigates to /clientes and the fetch fails
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // THEN: ErrorPanel is visible
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('should display "Reintentar" button in ErrorPanel when fetch fails', async ({ page }) => {
    // GIVEN: The backend is unavailable
    await page.route('**/api/v1/clientes', (route) =>
      route.abort('connectionrefused')
    );

    // WHEN: User navigates to /clientes and the fetch fails
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // THEN: A "Reintentar" button is visible inside the ErrorPanel
    await expect(
      page.getByRole('button', { name: /reintentar/i })
    ).toBeVisible();
  });

  test('should retry the API call when user clicks Reintentar button', async ({ page }) => {
    // GIVEN: Backend is initially unavailable, then recovers
    let requestCount = 0;

    await page.route('**/api/v1/clientes', (route) => {
      requestCount++;
      if (requestCount === 1) {
        route.abort('connectionrefused');
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
    });

    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // WHEN: User clicks the "Reintentar" button
    await page.getByRole('button', { name: /reintentar/i }).click();

    // THEN: A new API request is fired (requestCount > 1)
    await expect(page.getByTestId('error-panel')).not.toBeVisible({ timeout: 5000 });
    expect(requestCount).toBeGreaterThan(1);
  });

  test('should NOT show client list items when ErrorPanel is displayed', async ({ page }) => {
    // GIVEN: The backend is unavailable
    await page.route('**/api/v1/clientes', (route) =>
      route.abort('connectionrefused')
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // THEN: No client list items exist in the DOM
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(0);
  });
});

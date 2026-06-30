/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (E2E Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Left panel (280px) shows scrollable list with nombre and nit per item
 *   AC2 — Real-time case-insensitive search by nombre or nit (< 1s for 500 records)
 *   AC3 — EmptyState component shown when no clients exist
 *   AC4 — ErrorPanel with "Reintentar" button shown when GET /api/v1/clientes fails
 *   AC5 — Right panel shows neutral empty/default state when no client is selected
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Left panel (280px) shows scrollable list with nombre and nit per item
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Client list panel displays nombre and nit per item', () => {
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

  test('should display client list panel at /clientes with 280px fixed width', async ({ page }) => {
    // GIVEN: There are clients in the system
    const data = buildCliente({ nombre: 'Empresa Prueba AC1', nit: '900111222-1' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: User navigates to /clientes (intercept BEFORE navigation)
    await page.route('**/api/v1/clientes', async (route) => {
      await route.continue();
    });
    await page.goto('/clientes');

    // THEN: The left panel is visible and has the expected testid
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
  });

  test('should show client nombre in the list item', async ({ page }) => {
    // GIVEN: A client exists with a known nombre
    const data = buildCliente({ nombre: 'Empresa Visible Nombre', nit: '900222333-2' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');

    // THEN: The client nombre appears in the list
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Visible Nombre' })
    ).toBeVisible();
  });

  test('should show client nit in the list item', async ({ page }) => {
    // GIVEN: A client exists with a known nit
    const data = buildCliente({ nombre: 'Empresa Con Nit', nit: '811555666-3' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');

    // THEN: The client nit appears inside its list item
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: '811555666-3' })
    ).toBeVisible();
  });

  test('should render the search input with correct placeholder text', async ({ page }) => {
    // GIVEN: The /clientes page is loaded
    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: Search input is present with the expected placeholder
    await expect(
      page.getByPlaceholder(/buscar por nombre o nit/i)
    ).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Real-time case-insensitive filtering by nombre or nit
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Real-time case-insensitive search filters the client list', () => {
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

  test('should filter list to show only clients matching the typed nombre', async ({ page }) => {
    // GIVEN: Multiple clients exist
    const clienteA = buildCliente({ nombre: 'Busqueda Alpha Corp', nit: '700100200-1' });
    const clienteB = buildCliente({ nombre: 'Busqueda Beta Ltda', nit: '700100200-2' });
    const clienteC = buildCliente({ nombre: 'Empresa No Relacionada', nit: '700100200-3' });

    const a = await apiHelper.createCliente(clienteA);
    const b = await apiHelper.createCliente(clienteB);
    const c = await apiHelper.createCliente(clienteC);
    createdIds.push(a.id, b.id, c.id);

    await page.goto('/clientes');
    await page.waitForURL('**/clientes');

    // WHEN: User types in the search input
    await page.getByTestId('search-clientes').fill('Busqueda');

    // THEN: Only matching clients are visible
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Busqueda Alpha Corp' })
    ).toBeVisible();
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa No Relacionada' })
    ).toBeHidden();
  });

  test('should filter list case-insensitively (uppercase query matches lowercase nombre)', async ({ page }) => {
    // GIVEN: A client exists with mixed-case nombre
    const data = buildCliente({ nombre: 'innovaciones digitales sas', nit: '800400500-4' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    await page.goto('/clientes');
    await page.waitForURL('**/clientes');

    // WHEN: User types uppercase query
    await page.getByTestId('search-clientes').fill('INNOVACIONES');

    // THEN: The client is still visible (case-insensitive match)
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'innovaciones digitales sas' })
    ).toBeVisible();
  });

  test('should filter list by nit when user types in the search input', async ({ page }) => {
    // GIVEN: A client exists with a known nit
    const data = buildCliente({ nombre: 'Empresa Nit Search Test', nit: '999777888-5' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    await page.goto('/clientes');
    await page.waitForURL('**/clientes');

    // WHEN: User searches by nit fragment
    await page.getByTestId('search-clientes').fill('999777888');

    // THEN: The client appears in the filtered results
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Nit Search Test' })
    ).toBeVisible();
  });

  test('should complete filtering in under 1 second for 500 records', async ({ page }) => {
    // GIVEN: The client list is loaded (mocked with 500 records)
    const mockClientes = Array.from({ length: 500 }, (_, i) => ({
      id: `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`,
      nombre: `Cliente Performance ${i}`,
      nit: `${900000000 + i}-${i % 9}`,
      telefono: `3001234567`,
      ciudad: 'Bogotá',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }));

    // Network-first: intercept BEFORE navigation
    await page.route('**/api/v1/clientes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockClientes),
      });
    });

    await page.goto('/clientes');
    await page.waitForURL('**/clientes');

    // WHEN: User types a search query — measure time
    const start = Date.now();
    await page.getByTestId('search-clientes').fill('Cliente Performance 4');
    // Wait for filtered results to appear
    await expect(
      page.getByTestId('cliente-list-item').first()
    ).toBeVisible();
    const elapsed = Date.now() - start;

    // THEN: Filtering completes in under 1000ms
    expect(elapsed).toBeLessThan(1000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — EmptyState component is displayed when no clients exist
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — EmptyState is shown when no clients exist', () => {
  test('should display EmptyState in the left panel when there are no clients', async ({ page }) => {
    // GIVEN: The backend returns an empty array for GET /api/v1/clientes
    // Network-first: intercept BEFORE navigation
    await page.route('**/api/v1/clientes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: EmptyState component is visible inside the left panel
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });

  test('should display EmptyState with a message guiding user to create first client', async ({ page }) => {
    // GIVEN: No clients in the system
    await page.route('**/api/v1/clientes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: EmptyState has a message that guides creating the first client
    await expect(page.getByTestId('empty-state')).toContainText(/primer cliente|no hay clientes/i);
  });

  test('should display EmptyState when search query yields no matches', async ({ page }) => {
    // GIVEN: Clients exist but search has no matches
    await page.route('**/api/v1/clientes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '00000000-0000-0000-0000-000000000001',
            nombre: 'Empresa Existente',
            nit: '900000001-1',
            telefono: '3001234567',
            ciudad: 'Bogotá',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ]),
      });
    });

    await page.goto('/clientes');
    await page.waitForURL('**/clientes');

    // WHEN: User types a query that matches nothing
    await page.getByTestId('search-clientes').fill('xyzNoMatch987');

    // THEN: EmptyState is displayed (no results found)
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — ErrorPanel with "Reintentar" button when API fetch fails
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — ErrorPanel is shown when the backend is unavailable', () => {
  test('should display ErrorPanel in the left panel when GET /api/v1/clientes fails', async ({ page }) => {
    // GIVEN: The backend is unavailable (network error)
    // Network-first: intercept BEFORE navigation
    await page.route('**/api/v1/clientes', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Internal Server Error', status: 500 }),
      });
    });

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: ErrorPanel is visible in the left panel
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('should display "Reintentar" button inside ErrorPanel', async ({ page }) => {
    // GIVEN: The backend returns an error
    await page.route('**/api/v1/clientes', async (route) => {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Service Unavailable', status: 503 }),
      });
    });

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: ErrorPanel contains a "Reintentar" button
    await expect(page.getByRole('button', { name: /reintentar/i })).toBeVisible();
  });

  test('should NOT display the client list when ErrorPanel is visible', async ({ page }) => {
    // GIVEN: Fetch fails with a network-level error
    await page.route('**/api/v1/clientes', async (route) => {
      await route.abort('failed');
    });

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: No client list items are rendered
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(0);
  });

  test('should retry the API call when user clicks Reintentar', async ({ page }) => {
    // GIVEN: First request fails, second succeeds
    let callCount = 0;

    await page.route('**/api/v1/clientes', async (route) => {
      callCount++;
      if (callCount === 1) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ title: 'Error', status: 500 }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: '00000000-0000-0000-0000-000000000001',
              nombre: 'Empresa Recuperada',
              nit: '900000001-1',
              telefono: '3001234567',
              ciudad: 'Bogotá',
              createdAt: '2026-01-01T00:00:00Z',
              updatedAt: '2026-01-01T00:00:00Z',
            },
          ]),
        });
      }
    });

    await page.goto('/clientes');

    // ErrorPanel is visible after first failure
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // WHEN: User clicks Reintentar
    await page.getByRole('button', { name: /reintentar/i }).click();

    // THEN: Client list appears after successful retry
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Recuperada' })
    ).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Right panel shows neutral default state when no client is selected
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Right panel shows neutral default state when no client selected', () => {
  test('should display a neutral default state in the right panel at /clientes with no selection', async ({
    page,
  }) => {
    // GIVEN: /clientes route renders with some clients
    await page.route('**/api/v1/clientes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '00000000-0000-0000-0000-000000000001',
            nombre: 'Empresa Sin Seleccion',
            nit: '900000001-1',
            telefono: '3001234567',
            ciudad: 'Bogotá',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ]),
      });
    });

    // WHEN: User navigates to /clientes without selecting a client
    await page.goto('/clientes');

    // THEN: Right panel shows the default empty-selection state
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await expect(
      page.getByText(/selecciona un cliente para ver sus detalles/i)
    ).toBeVisible();
  });

  test('should NOT show client detail content in the right panel when no client is selected', async ({
    page,
  }) => {
    // GIVEN: /clientes route renders
    await page.route('**/api/v1/clientes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: No client detail content is shown (no nombre/nit detail block)
    await expect(page.getByTestId('cliente-detail-content')).toHaveCount(0);
  });
});

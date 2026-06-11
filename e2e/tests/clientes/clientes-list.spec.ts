/**
 * Story 2.1: Client List & Search — E2E Tests (RED Phase)
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (E2E Level)
 * These tests are intentionally FAILING until frontend implementation is complete.
 *
 * Test Cases covered:
 *   AC1 — /clientes renders left panel (280px) with scrollable client list (nombre + nit)
 *   AC2 — Search field filters list in real time by nombre or NIT (case-insensitive)
 *   AC3 — EmptyState rendered when no clients exist
 *   AC4 — ErrorPanel with "Reintentar" button shown on backend unavailability
 *
 * Patterns:
 *   - Network-first route interception (intercept BEFORE page.goto)
 *   - data-testid selectors only
 *   - Given-When-Then structure
 *   - No hard waits / sleeps
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Left panel renders scrollable list with nombre and nit visible
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — /clientes renders list panel with client items', () => {
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

  test('should render the clientes list panel at /clientes', async ({ page, request }) => {
    // GIVEN: At least one client exists in the system
    const clientData = buildCliente({ nombre: 'Empresa Lista Test' });
    const helper = new ApiHelper(request);
    const created = await helper.createCliente(clientData);
    if (created.id) createdIds.push(created.id);

    // WHEN: User navigates to /clientes
    // Network-first: route is intercepted by the live backend (no mock needed for E2E)
    await page.goto('/clientes');

    // THEN: The list panel is visible
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
  });

  test('should show nombre and nit in each client list item', async ({ page, request }) => {
    // GIVEN: A client with known nombre and NIT exists
    const clientData = buildCliente({
      nombre: 'Empresa Visible SA',
      nit: 'NIT-E2E-VISIBLE-001',
    });
    const helper = new ApiHelper(request);
    const created = await helper.createCliente(clientData);
    if (created.id) createdIds.push(created.id);

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: The client's nombre is visible in the list
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Visible SA' })
    ).toBeVisible();

    // AND: The client's NIT is visible in the list item
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'NIT-E2E-VISIBLE-001' })
    ).toBeVisible();
  });

  test('should render a search input with Spanish placeholder', async ({ page }) => {
    // GIVEN: User is on /clientes
    await page.goto('/clientes');

    // WHEN: Page is loaded
    // THEN: Search input with Spanish placeholder is visible
    await expect(page.getByTestId('search-input')).toBeVisible();
    const placeholder = await page.getByTestId('search-input').getAttribute('placeholder');
    expect(placeholder).toMatch(/buscar|nombre|NIT/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Real-time filter by nombre or NIT (case-insensitive)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Search filters list in real time by nombre or NIT', () => {
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

  test('should filter client list by nombre when user types in search field', async ({ page, request }) => {
    // GIVEN: Two clients with distinct nombres exist
    const helper = new ApiHelper(request);
    const clientA = await helper.createCliente(buildCliente({ nombre: 'Empresa Alpha Buscable' }));
    const clientB = await helper.createCliente(buildCliente({ nombre: 'Beta Corp Distinta' }));
    if (clientA.id) createdIds.push(clientA.id);
    if (clientB.id) createdIds.push(clientB.id);

    await page.goto('/clientes');

    // Wait for list to load
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Alpha Buscable' })
    ).toBeVisible();

    // WHEN: User types a search term that matches only Alpha
    await page.getByTestId('search-input').fill('Alpha Buscable');

    // THEN: Only the matching client is visible
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Alpha Buscable' })
    ).toBeVisible();

    // AND: The non-matching client is NOT visible
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Beta Corp Distinta' })
    ).not.toBeVisible();
  });

  test('should filter client list by NIT when user types NIT in search', async ({ page, request }) => {
    // GIVEN: Client with known NIT exists
    const helper = new ApiHelper(request);
    const clientA = await helper.createCliente(buildCliente({ nombre: 'Empresa NIT Busqueda', nit: 'NIT-E2E-BUSQUEDA-999' }));
    const clientB = await helper.createCliente(buildCliente({ nombre: 'Otra Empresa Sin NIT Match' }));
    if (clientA.id) createdIds.push(clientA.id);
    if (clientB.id) createdIds.push(clientB.id);

    await page.goto('/clientes');

    // Wait for list to load
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa NIT Busqueda' })
    ).toBeVisible();

    // WHEN: User types the NIT in the search field
    await page.getByTestId('search-input').fill('NIT-E2E-BUSQUEDA-999');

    // THEN: Only the matching client is shown
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa NIT Busqueda' })
    ).toBeVisible();

    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Otra Empresa Sin NIT Match' })
    ).not.toBeVisible();
  });

  test('should filter case-insensitively (lowercase search matches uppercase nombre)', async ({ page, request }) => {
    // GIVEN: Client with uppercase nombre exists
    const helper = new ApiHelper(request);
    const created = await helper.createCliente(buildCliente({ nombre: 'EMPRESA MAYÚSCULAS TEST' }));
    if (created.id) createdIds.push(created.id);

    await page.goto('/clientes');

    // Wait for list to load
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'EMPRESA MAYÚSCULAS TEST' })
    ).toBeVisible();

    // WHEN: User types in lowercase
    await page.getByTestId('search-input').fill('empresa mayúsculas');

    // THEN: The client is still found (case-insensitive filter)
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'EMPRESA MAYÚSCULAS TEST' })
    ).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — EmptyState displayed when no clients exist
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — EmptyState displayed when no clients exist', () => {
  test('should show EmptyState when no clients exist (using route interception)', async ({ page }) => {
    // GIVEN: No clients in the system (intercept BEFORE navigation)
    // Network-first: intercept GET /api/v1/clientes BEFORE goto
    await page.route(`${API_BASE}/api/v1/clientes`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: EmptyState component is rendered
    await expect(page.getByTestId('empty-state')).toBeVisible();

    // AND: A message guiding the user to create the first client is shown
    await expect(
      page.getByText(/crear.*primer cliente|no hay clientes/i)
    ).toBeVisible();
  });

  test('should NOT render list items when EmptyState is shown', async ({ page }) => {
    // GIVEN: No clients (intercepted before navigation)
    await page.route(`${API_BASE}/api/v1/clientes`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    await expect(page.getByTestId('empty-state')).toBeVisible();

    // THEN: No client list items exist in the DOM
    await expect(page.getByTestId('cliente-list-item')).not.toBeAttached();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — ErrorPanel + "Reintentar" button when backend is unavailable
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — ErrorPanel with "Reintentar" on backend unavailability', () => {
  test('should show ErrorPanel when backend returns 500', async ({ page }) => {
    // GIVEN: Backend returns 500 (intercepted BEFORE navigation)
    await page.route(`${API_BASE}/api/v1/clientes`, (route) => {
      route.fulfill({ status: 500 });
    });

    // WHEN: User navigates to /clientes and fetch fails
    await page.goto('/clientes');

    // THEN: ErrorPanel is rendered
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('should display "Reintentar" button in the ErrorPanel', async ({ page }) => {
    // GIVEN: Backend returns 500
    await page.route(`${API_BASE}/api/v1/clientes`, (route) => {
      route.fulfill({ status: 500 });
    });

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: A "Reintentar" button is visible
    await expect(
      page.getByRole('button', { name: /reintentar/i })
    ).toBeVisible();
  });

  test('should restore client list when "Reintentar" is clicked after error recovery', async ({ page }) => {
    // GIVEN: First call fails (500), second call succeeds (intercepted BEFORE navigation)
    let callCount = 0;
    await page.route(`${API_BASE}/api/v1/clientes`, (route) => {
      callCount++;
      if (callCount === 1) {
        route.fulfill({ status: 500 });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: '00000000-0000-0000-0000-000000000001',
              nombre: 'Cliente Recuperado',
              nit: 'NIT-RETRY-001',
              telefono: '300-0000',
              ciudad: 'Bogotá',
              createdAt: '2026-01-01T00:00:00Z',
              updatedAt: '2026-01-01T00:00:00Z',
            },
          ]),
        });
      }
    });

    // WHEN: User navigates and gets error
    await page.goto('/clientes');

    // Wait for error panel
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // WHEN: User clicks "Reintentar"
    await page.getByRole('button', { name: /reintentar/i }).click();

    // THEN: Client list appears (not error panel)
    await expect(page.getByTestId('error-panel')).not.toBeVisible();
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Cliente Recuperado' })
    ).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EXPANDED COVERAGE — Edge cases NOT in ATDD tests
// Generated by TEA testarch-automate (BMad-Integrated mode)
// ─────────────────────────────────────────────────────────────────────────────

// [P1] Search clears and restores full list
test.describe('AC2-Edge — Search clear restores full list', () => {
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

  test('[P1] should restore full list after user clears the search field', async ({ page, request }) => {
    // GIVEN: Two clients with distinct names
    const helper = new ApiHelper(request);
    const clientA = await helper.createCliente(buildCliente({ nombre: 'Empresa Clear Test Alpha' }));
    const clientB = await helper.createCliente(buildCliente({ nombre: 'Empresa Clear Test Beta' }));
    if (clientA.id) createdIds.push(clientA.id);
    if (clientB.id) createdIds.push(clientB.id);

    await page.goto('/clientes');

    // Wait for both to be visible
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Clear Test Alpha' })
    ).toBeVisible();

    // WHEN: User types a filter
    await page.getByTestId('search-input').fill('Alpha');

    // Verify Beta is filtered out
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Clear Test Beta' })
    ).not.toBeVisible();

    // WHEN: User clears the search
    await page.getByTestId('search-input').fill('');

    // THEN: Both clients are visible again
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Clear Test Alpha' })
    ).toBeVisible();
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Clear Test Beta' })
    ).toBeVisible();
  });
});

// [P1] Search producing no results shows empty state (not error panel)
test.describe('AC2-Edge — No-match search shows empty state', () => {
  test('[P1] should show EmptyState (not ErrorPanel) when search produces zero matches', async ({ page }) => {
    // GIVEN: One client in the system (intercepted before navigation)
    await page.route(`${API_BASE}/api/v1/clientes`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '00000000-0000-0000-0000-000000000002',
            nombre: 'Empresa Única',
            nit: 'NIT-UNIQUE-001',
            telefono: '300-0000',
            ciudad: 'Bogotá',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ]),
      });
    });

    await page.goto('/clientes');

    // Wait for client to load
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Única' })
    ).toBeVisible();

    // WHEN: User types a term that matches nothing
    await page.getByTestId('search-input').fill('XYZ NO MATCH AT ALL');

    // THEN: EmptyState is shown (not ErrorPanel)
    await expect(page.getByTestId('empty-state')).toBeVisible();
    await expect(page.getByTestId('error-panel')).not.toBeAttached();
  });
});

// [P1] Error state does NOT show the empty state or client list simultaneously
test.describe('AC4-Edge — ErrorPanel state isolation', () => {
  test('[P1] should NOT render empty-state or client list when error panel is shown', async ({ page }) => {
    // GIVEN: Backend returns 500 (intercepted BEFORE navigation)
    await page.route(`${API_BASE}/api/v1/clientes`, (route) => {
      route.fulfill({ status: 500 });
    });

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: Error panel is visible
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // AND: Empty state is NOT rendered simultaneously
    await expect(page.getByTestId('empty-state')).not.toBeAttached();

    // AND: No client list items are rendered
    await expect(page.getByTestId('cliente-list-item')).not.toBeAttached();
  });
});

// [P2] Panel has correct fixed width layout (accessibility / visual boundary)
test.describe('AC1-Edge — Panel layout', () => {
  test('[P2] should render the list panel with aria-label "Lista de clientes"', async ({ page }) => {
    // GIVEN: Empty client list (intercepted before navigation)
    await page.route(`${API_BASE}/api/v1/clientes`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: The aside panel has the correct aria-label for screen readers
    await expect(
      page.getByRole('complementary', { name: /lista de clientes/i })
    ).toBeVisible();
  });
});

/**
 * Story 2.1: Client List & Search
 * Epic 2: Gestión de Clientes
 *
 * ATDD Acceptance Tests — RED Phase (E2E Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Navigation to /clientes shows a 280px scrollable left panel
 *          with all clients (Nombre + NIT/RUC visible per item)
 *   AC2 — Typing in the search field filters the list in real time (< 1s, case-insensitive)
 *   AC3 — No clients in system → EmptyState component with Spanish guidance message
 *   AC4 — Backend unavailable → ErrorPanel with "Reintentar" button that triggers refetch
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — /clientes shows 280px left panel with scrollable client list
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Client list panel at /clientes', () => {
  test('should render the left list panel with fixed 280px width', async ({ page }) => {
    // GIVEN: The /clientes route exists
    // WHEN: User navigates to /clientes

    // Network-first: intercept GET /api/v1/clientes BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'aaaaaaaa-0000-0000-0000-000000000001',
            nombre: 'Empresa Alpha',
            nitRuc: '900100200-1',
            telefono: '+57 601 1111111',
            ciudad: 'Bogotá',
            creadoEn: '2026-01-10T08:00:00Z',
          },
        ]),
      }),
    );

    await page.goto('/clientes');

    // THEN: The list panel is present in the DOM
    const listPanel = page.getByTestId('clientes-list-panel');
    await expect(listPanel).toBeVisible();

    // AND: Its computed width is exactly 280px (fixed layout)
    const width = await listPanel.evaluate((el) => getComputedStyle(el).width);
    expect(width).toBe('280px');
  });

  test('should display client Nombre in each list item', async ({ page }) => {
    // GIVEN: There is one client in the system with nombre "Empresa Alpha"
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'aaaaaaaa-0000-0000-0000-000000000001',
            nombre: 'Empresa Alpha',
            nitRuc: '900100200-1',
            telefono: null,
            ciudad: null,
            creadoEn: '2026-01-10T08:00:00Z',
          },
        ]),
      }),
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: The client's nombre is visible in the list
    const item = page.getByTestId('cliente-list-item').first();
    await expect(item).toBeVisible();
    await expect(item).toContainText('Empresa Alpha');
  });

  test('should display client NIT/RUC in each list item', async ({ page }) => {
    // GIVEN: There is one client with nitRuc "900100200-1"
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'aaaaaaaa-0000-0000-0000-000000000001',
            nombre: 'Empresa Alpha',
            nitRuc: '900100200-1',
            telefono: null,
            ciudad: null,
            creadoEn: '2026-01-10T08:00:00Z',
          },
        ]),
      }),
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: The client's NIT/RUC is visible in the list item
    const item = page.getByTestId('cliente-list-item').first();
    await expect(item).toContainText('900100200-1');
  });

  test('should render multiple client items when API returns multiple clients', async ({ page }) => {
    // GIVEN: There are 3 clients in the system
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'id-1', nombre: 'Empresa Uno', nitRuc: '900000001-1', telefono: null, ciudad: null, creadoEn: '2026-01-01T00:00:00Z' },
          { id: 'id-2', nombre: 'Empresa Dos', nitRuc: '900000002-2', telefono: null, ciudad: null, creadoEn: '2026-01-02T00:00:00Z' },
          { id: 'id-3', nombre: 'Empresa Tres', nitRuc: '900000003-3', telefono: null, ciudad: null, creadoEn: '2026-01-03T00:00:00Z' },
        ]),
      }),
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: Three list items are rendered
    const items = page.getByTestId('cliente-list-item');
    await expect(items).toHaveCount(3);
  });

  test('should show skeleton placeholders while clients are loading', async ({ page }) => {
    // GIVEN: The API call is pending (network delayed)
    let resolveRoute!: () => void;
    await page.route('**/api/v1/clientes', async (route) => {
      await new Promise<void>((resolve) => { resolveRoute = resolve; });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // WHEN: User navigates to /clientes (API still loading)
    const gotoPromise = page.goto('/clientes');

    // THEN: Skeleton placeholder is visible before data arrives
    await expect(page.getByTestId('client-list-skeleton')).toBeVisible();

    // Cleanup: resolve the pending route and navigation
    resolveRoute();
    await gotoPromise;
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Real-time search filters list by Nombre or NIT/RUC (case-insensitive, < 1s)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Real-time search filtering', () => {
  const clientesFixture = [
    { id: 'id-1', nombre: 'Empresa Alpha', nitRuc: '900100001-1', telefono: null, ciudad: null, creadoEn: '2026-01-01T00:00:00Z' },
    { id: 'id-2', nombre: 'Beta Servicios', nitRuc: '900200002-2', telefono: null, ciudad: null, creadoEn: '2026-01-02T00:00:00Z' },
    { id: 'id-3', nombre: 'Gamma Corp', nitRuc: '900300003-3', telefono: null, ciudad: null, creadoEn: '2026-01-03T00:00:00Z' },
  ];

  test('should filter list in real time when user types in search field', async ({ page }) => {
    // GIVEN: Three clients are loaded
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clientesFixture) }),
    );
    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(3);

    // WHEN: User types "Alpha" in the search field
    await page.getByTestId('clientes-search-input').fill('Alpha');

    // THEN: Only "Empresa Alpha" is visible (1 item)
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(1);
    await expect(page.getByTestId('cliente-list-item').first()).toContainText('Empresa Alpha');
  });

  test('should filter by NIT/RUC when user types a NIT value', async ({ page }) => {
    // GIVEN: Three clients are loaded
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clientesFixture) }),
    );
    await page.goto('/clientes');

    // WHEN: User types part of a NIT in the search field
    await page.getByTestId('clientes-search-input').fill('900200002');

    // THEN: Only "Beta Servicios" is visible (matching NIT)
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(1);
    await expect(page.getByTestId('cliente-list-item').first()).toContainText('Beta Servicios');
  });

  test('should perform case-insensitive search', async ({ page }) => {
    // GIVEN: Three clients are loaded; search is case-insensitive
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clientesFixture) }),
    );
    await page.goto('/clientes');

    // WHEN: User types "gamma" (lowercase) — client nombre is "Gamma Corp"
    await page.getByTestId('clientes-search-input').fill('gamma');

    // THEN: "Gamma Corp" is still visible
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(1);
    await expect(page.getByTestId('cliente-list-item').first()).toContainText('Gamma Corp');
  });

  test('should restore full list when search field is cleared', async ({ page }) => {
    // GIVEN: A filter is active showing only 1 client
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clientesFixture) }),
    );
    await page.goto('/clientes');
    await page.getByTestId('clientes-search-input').fill('Alpha');
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(1);

    // WHEN: User clears the search field
    await page.getByTestId('clientes-search-input').clear();

    // THEN: All 3 clients are visible again
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(3);
  });

  test('should NOT trigger a new API call when user types in search (client-side filter)', async ({ page }) => {
    // GIVEN: The API was called once on load; search uses client-side filter
    let apiCallCount = 0;
    await page.route('**/api/v1/clientes', (route) => {
      apiCallCount++;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clientesFixture) });
    });
    await page.goto('/clientes');
    const callsAfterLoad = apiCallCount;

    // WHEN: User types multiple characters in the search
    await page.getByTestId('clientes-search-input').fill('Emp');
    await page.getByTestId('clientes-search-input').fill('Empresa A');

    // THEN: API was NOT called again (no additional fetch per keystroke)
    expect(apiCallCount).toBe(callsAfterLoad);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Empty system shows EmptyState with Spanish guidance message
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — EmptyState when no clients exist', () => {
  test('should display EmptyState component when API returns empty array', async ({ page }) => {
    // GIVEN: The system has no clients (API returns empty array)
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: EmptyState component is visible in the left panel
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });

  test('should display Spanish guidance message in EmptyState', async ({ page }) => {
    // GIVEN: The system has no clients
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: EmptyState shows a Spanish-language message guiding the user to create the first client
    const emptyState = page.getByTestId('empty-state');
    await expect(emptyState).toContainText(/crea|registra|primer cliente/i);
  });

  test('should NOT render client list items when EmptyState is shown', async ({ page }) => {
    // GIVEN: API returns empty array
    await page.route('**/api/vl/clientes', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: No client list items are rendered
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Backend unavailable → ErrorPanel with "Reintentar" button
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — ErrorPanel when backend is unavailable', () => {
  test('should display ErrorPanel when GET /api/v1/clientes returns 500', async ({ page }) => {
    // GIVEN: The backend is unavailable (simulated via 500 error)
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/problem+json',
        body: JSON.stringify({ title: 'An unexpected error occurred.', status: 500 }),
      }),
    );

    // WHEN: User navigates to /clientes and the fetch fails
    await page.goto('/clientes');

    // THEN: ErrorPanel is displayed in the left panel
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('should display ErrorPanel when GET /api/v1/clientes returns network failure', async ({ page }) => {
    // GIVEN: Network request to backend fails entirely
    await page.route('**/api/v1/clientes', (route) => route.abort('failed'));

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: ErrorPanel component is visible
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('should show "Reintentar" button inside ErrorPanel', async ({ page }) => {
    // GIVEN: Backend returns error, ErrorPanel is displayed
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }),
    );
    await page.goto('/clientes');
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // WHEN: ErrorPanel is rendered
    // THEN: A "Reintentar" button is visible inside it
    await expect(page.getByTestId('error-panel').getByRole('button', { name: /reintentar/i })).toBeVisible();
  });

  test('should trigger a new fetch when "Reintentar" button is clicked', async ({ page }) => {
    // GIVEN: First fetch fails, ErrorPanel is shown
    let callCount = 0;
    await page.route('**/api/v1/clientes', (route) => {
      callCount++;
      return route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
    });
    await page.goto('/clientes');
    await expect(page.getByTestId('error-panel')).toBeVisible();
    const callsBeforeRetry = callCount;

    // WHEN: User clicks "Reintentar"
    await page.getByTestId('error-panel').getByRole('button', { name: /reintentar/i }).click();

    // THEN: The API is called again (refetch triggered)
    await expect.poll(() => callCount).toBeGreaterThan(callsBeforeRetry);
  });

  test('should NOT render client list items when ErrorPanel is displayed', async ({ page }) => {
    // GIVEN: Backend returns an error
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }),
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: No list items are rendered alongside the ErrorPanel
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(0);
  });
});

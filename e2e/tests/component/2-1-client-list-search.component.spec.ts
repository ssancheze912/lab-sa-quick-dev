import { test, expect } from '@playwright/test';

/**
 * Component-level Acceptance Tests — Story 2.1: Client List & Search
 *
 * NOTE: These Playwright tests are integration/E2E-style component tests using
 * mocked API routes (network-first intercepts). The unit-level component tests
 * (Vitest + RTL) are defined separately in:
 *   frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx
 *
 * Acceptance Criteria covered:
 *   AC2 — Real-time filter (debounce ≤150ms), case-insensitive, no extra API call (NFR1)
 *   AC3 — EmptyState shown when API returns empty array (zero records)
 *   AC4 — ErrorPanel shown when fetch fails; raw error never shown (NFR6)
 *   AC5 — Default order: most recently created first (no search active)
 *   AC6 — Inline "no results" state shown when search matches nothing; EmptyState NOT shown
 *
 * These tests are in RED phase — they will fail until implementation is complete.
 * Network-first intercepts are set BEFORE navigation per ATDD patterns.
 */

const BASE_URL = 'http://localhost:5173';
const API_PATTERN = '**/api/v1/clientes';

/**
 * Build a minimal mock cliente object that matches the ClienteDto shape.
 */
function mockCliente(overrides: Partial<{
  id: string;
  nombre: string;
  nit: string;
  telefono: string;
  ciudad: string;
  createdAt: string;
  updatedAt: string;
}> = {}) {
  const ts = new Date().toISOString();
  return {
    id: `uuid-${Math.random().toString(36).slice(2)}`,
    nombre: 'Empresa Mock',
    nit: '900000001',
    telefono: '3001234567',
    ciudad: 'Bogotá',
    createdAt: ts,
    updatedAt: ts,
    ...overrides,
  };
}

/**
 * Build a list of N mock clients with unique NITs and nombres.
 */
function mockClientes(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const dt = new Date(Date.now() - i * 1000).toISOString(); // each 1s older
    return mockCliente({
      id: `uuid-${i}`,
      nombre: `Empresa ${i + 1}`,
      nit: `9000${String(i).padStart(5, '0')}`,
      createdAt: dt,
      updatedAt: dt,
    });
  });
}

test.describe('Story 2.1 — ClienteListView Component Acceptance Tests', () => {

  // ─────────────────────────────────────────────────────────────────────────
  // AC2: Real-time client-side filter — no extra API call, case-insensitive
  // This is P0 risk R-003 from test-design-epic-2.md (TC-E2-P0-06)
  // ─────────────────────────────────────────────────────────────────────────

  test('AC2 — filtering by nombre shows only matching clients without triggering extra API calls', async ({ page }) => {
    // GIVEN: MSW returns 10 clients (including "Empresa Filtrada" and others)
    const clientes = [
      mockCliente({ id: 'uuid-target', nombre: 'Empresa Filtrada', nit: '900000001' }),
      ...Array.from({ length: 9 }, (_, i) =>
        mockCliente({ id: `uuid-other-${i}`, nombre: `Otro ${i}`, nit: `80000${i}` })
      ),
    ];

    let apiCallCount = 0;

    // Network-first: intercept BEFORE navigation
    await page.route(API_PATTERN, (route) => {
      apiCallCount++;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      });
    });

    // WHEN: User navigates to /clientes
    await page.goto(`${BASE_URL}/clientes`);
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();

    // Wait for initial load
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();
    const initialCallCount = apiCallCount;

    // WHEN: User types in the search field
    await page.getByTestId('search-clientes').fill('filtrada');

    // THEN: Only the matching client is shown
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(1);
    await expect(page.getByTestId('cliente-list-item')).toContainText('Empresa Filtrada');

    // AND: No additional API calls were made during filtering
    expect(apiCallCount).toBe(initialCallCount);
  });

  test('AC2 — filtering is case-insensitive (uppercase input matches lowercase data)', async ({ page }) => {
    // GIVEN: Clients with mixed case nombres
    const clientes = [
      mockCliente({ id: 'uuid-1', nombre: 'empresa textil del norte', nit: '900000010' }),
      mockCliente({ id: 'uuid-2', nombre: 'Distribuidora Sur', nit: '900000011' }),
    ];

    await page.route(API_PATTERN, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      })
    );

    await page.goto(`${BASE_URL}/clientes`);
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // WHEN: User types uppercase search term
    await page.getByTestId('search-clientes').fill('EMPRESA TEXTIL');

    // THEN: Matching item visible despite case difference
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(1);
    await expect(page.getByTestId('cliente-list-item')).toContainText('empresa textil del norte');
  });

  test('AC2 — filtering by NIT shows only clients with matching NIT', async ({ page }) => {
    // GIVEN: Multiple clients with distinct NITs
    const clientes = [
      mockCliente({ id: 'uuid-a', nombre: 'Empresa Alpha', nit: '900111222' }),
      mockCliente({ id: 'uuid-b', nombre: 'Empresa Beta', nit: '800333444' }),
    ];

    await page.route(API_PATTERN, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      })
    );

    await page.goto(`${BASE_URL}/clientes`);
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // WHEN: User types a NIT into the search field
    await page.getByTestId('search-clientes').fill('800333444');

    // THEN: Only the client with that NIT is visible
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(1);
    await expect(page.getByTestId('cliente-list-item')).toContainText('Empresa Beta');
  });

  test('AC2 — real-time filter handles 500 records without extra API calls (NFR1 — <1s)', async ({ page }) => {
    // GIVEN: 500 clients (max MVP dataset per NFR1)
    const clientes = mockClientes(500);

    let apiCallCount = 0;
    await page.route(API_PATTERN, (route) => {
      apiCallCount++;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      });
    });

    await page.goto(`${BASE_URL}/clientes`);
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();
    const initialCallCount = apiCallCount;

    // WHEN: User types a search that matches only Empresa 1
    const filterStart = Date.now();
    await page.getByTestId('search-clientes').fill('Empresa 1');

    // THEN: Results appear (the exact match "Empresa 1" plus "Empresa 10", "Empresa 11"... etc.)
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();
    const filterDuration = Date.now() - filterStart;

    // AND: Filter completed in under 1 second (NFR1)
    expect(filterDuration).toBeLessThan(1000);
    // AND: No additional API calls triggered
    expect(apiCallCount).toBe(initialCallCount);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // AC3: EmptyState when API returns empty array (zero records in system)
  // ─────────────────────────────────────────────────────────────────────────

  test('AC3 — EmptyState component is shown when API returns empty array', async ({ page }) => {
    // GIVEN: API returns no clients (zero records in system)
    await page.route(API_PATTERN, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // WHEN: User navigates to /clientes
    await page.goto(`${BASE_URL}/clientes`);

    // THEN: EmptyState component is displayed
    await expect(page.getByTestId('empty-state')).toBeVisible();
    // AND: Message guides user to create first client
    await expect(page.getByTestId('empty-state')).toContainText(
      'No hay clientes registrados. Crea el primero.'
    );
    // AND: No cliente-list-item elements exist
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(0);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // AC4: ErrorPanel when fetch fails — no raw error shown (NFR6)
  // ─────────────────────────────────────────────────────────────────────────

  test('AC4 — ErrorPanel is shown when GET /api/v1/clientes fails with 500', async ({ page }) => {
    // GIVEN: Backend returns 500 error (network-first intercept)
    await page.route(API_PATTERN, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          title: 'Internal Server Error',
          status: 500,
          detail: 'Unhandled exception: NullReferenceException at line 42',
        }),
      })
    );

    // WHEN: User navigates to /clientes
    await page.goto(`${BASE_URL}/clientes`);

    // THEN: ErrorPanel is displayed
    await expect(page.getByTestId('error-panel')).toBeVisible();
    // AND: "Reintentar" button is present
    await expect(page.getByRole('button', { name: /reintentar/i })).toBeVisible();
    // AND: Raw error message is NOT exposed to the user (NFR6)
    await expect(page.getByText('NullReferenceException')).not.toBeVisible();
    await expect(page.getByText('line 42')).not.toBeVisible();
    // AND: EmptyState is NOT shown (ErrorPanel is exclusive of EmptyState)
    await expect(page.getByTestId('empty-state')).not.toBeVisible();
  });

  test('AC4 — ErrorPanel is shown when API fetch fails due to network error', async ({ page }) => {
    // GIVEN: Network is unavailable (abort the request)
    await page.route(API_PATTERN, (route) => route.abort('failed'));

    // WHEN: User navigates to /clientes
    await page.goto(`${BASE_URL}/clientes`);

    // THEN: ErrorPanel is displayed with Reintentar button
    await expect(page.getByTestId('error-panel')).toBeVisible();
    await expect(page.getByRole('button', { name: /reintentar/i })).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // AC5: Default order — most recently created first (no search active)
  // ─────────────────────────────────────────────────────────────────────────

  test('AC5 — clients are displayed in default order (most recently created first)', async ({ page }) => {
    // GIVEN: Three clients with distinct createdAt timestamps (index 0 is most recent)
    const now = Date.now();
    const clientes = [
      mockCliente({
        id: 'uuid-recent',
        nombre: 'Empresa Reciente',
        nit: '900001001',
        createdAt: new Date(now).toISOString(),
      }),
      mockCliente({
        id: 'uuid-middle',
        nombre: 'Empresa Media',
        nit: '900001002',
        createdAt: new Date(now - 60_000).toISOString(),
      }),
      mockCliente({
        id: 'uuid-oldest',
        nombre: 'Empresa Antigua',
        nit: '900001003',
        createdAt: new Date(now - 120_000).toISOString(),
      }),
    ];

    await page.route(API_PATTERN, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      })
    );

    // WHEN: User navigates to /clientes with no search text
    await page.goto(`${BASE_URL}/clientes`);
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();

    // THEN: First list item is the most recently created client
    const firstItem = page.getByTestId('cliente-list-item').first();
    await expect(firstItem).toContainText('Empresa Reciente');

    // AND: Last item is the oldest
    const lastItem = page.getByTestId('cliente-list-item').last();
    await expect(lastItem).toContainText('Empresa Antigua');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // AC6: Inline "no results" state — EmptyState NOT shown when search is active
  // ─────────────────────────────────────────────────────────────────────────

  test('AC6 — inline no-results message is shown when search matches nothing (EmptyState NOT shown)', async ({ page }) => {
    // GIVEN: There are clients in the system but none match the search query
    const clientes = [
      mockCliente({ id: 'uuid-1', nombre: 'Empresa Uno', nit: '900000100' }),
      mockCliente({ id: 'uuid-2', nombre: 'Empresa Dos', nit: '900000200' }),
    ];

    await page.route(API_PATTERN, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      })
    );

    await page.goto(`${BASE_URL}/clientes`);
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // WHEN: User types a query that matches nothing
    const searchQuery = 'zzz-no-existe';
    await page.getByTestId('search-clientes').fill(searchQuery);

    // THEN: Inline no-results message is shown with the query text
    await expect(page.getByTestId('no-results-message')).toBeVisible();
    await expect(page.getByTestId('no-results-message')).toContainText(
      `Sin resultados para '${searchQuery}'`
    );
    // AND: EmptyState component is NOT shown (reserved for zero records in system)
    await expect(page.getByTestId('empty-state')).not.toBeVisible();
    // AND: No list items are shown
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(0);
  });

  test('AC6 — clearing search after no-results restores full client list', async ({ page }) => {
    // GIVEN: Clients in system, user typed a non-matching search
    const clientes = [
      mockCliente({ id: 'uuid-1', nombre: 'Empresa Uno', nit: '900000100' }),
    ];

    await page.route(API_PATTERN, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      })
    );

    await page.goto(`${BASE_URL}/clientes`);
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // User types non-matching query
    await page.getByTestId('search-clientes').fill('nada');
    await expect(page.getByTestId('no-results-message')).toBeVisible();

    // WHEN: User clears the search input
    await page.getByTestId('search-clientes').fill('');

    // THEN: Full client list is restored
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(1);
    await expect(page.getByTestId('no-results-message')).not.toBeVisible();
    await expect(page.getByTestId('empty-state')).not.toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // AC1: Skeleton loading state while fetch is pending
  // ─────────────────────────────────────────────────────────────────────────

  test('AC1 — skeleton loading state is shown while API response is pending', async ({ page }) => {
    // GIVEN: API response is delayed
    await page.route(API_PATTERN, async (route) => {
      await new Promise((r) => setTimeout(r, 300)); // 300ms delay
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockCliente()]),
      });
    });

    // WHEN: User navigates to /clientes
    await page.goto(`${BASE_URL}/clientes`);

    // THEN: Skeleton loading state is visible during pending fetch
    // (aria-busy="true" on the list container per architecture spec)
    const panel = page.getByTestId('clientes-list-panel');
    await expect(panel).toBeVisible();
    // The panel should have aria-busy="true" while loading
    await expect(panel).toHaveAttribute('aria-busy', 'true');

    // THEN: After load completes, skeleton is gone and client list appears
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();
    await expect(panel).not.toHaveAttribute('aria-busy', 'true');
  });
});

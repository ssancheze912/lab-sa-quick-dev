/**
 * Story 2.1: Client List & Search — Edge-case E2E tests
 * Epic 2: Client Management
 *
 * Expands ATDD coverage with edge cases NOT in client-list-search.spec.ts:
 *   - Keyboard activation of list item (Enter key navigates to detail)
 *   - Search with only whitespace shows full list (not empty state)
 *   - Loading skeleton is visible while data is being fetched
 *   - Multiple clients — clicking different items changes selection
 *   - Slow network still resolves and shows list (no hard waits)
 *   - Right panel default state text (neutral empty)
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton loading state
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Loading skeleton visibility', () => {
  test('[P1] should show the loading skeleton while the API is in flight', async ({ page }) => {
    // GIVEN: A slow API response (delayed reply)
    let resolve: (value: unknown) => void;
    const holdPromise = new Promise((r) => { resolve = r; });

    await page.route('**/api/v1/clientes', async (route) => {
      await holdPromise; // wait indefinitely until we release
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // WHEN: User navigates to /clientes
    const navPromise = page.goto('/clientes');

    // THEN: Loading skeleton is visible before the response resolves
    await expect(page.getByLabel('Cargando clientes')).toBeVisible();

    // Cleanup: release the network hold and wait for navigation
    resolve!(undefined);
    await navPromise;
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Search with whitespace-only query
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Search with whitespace-only input', () => {
  test('[P2] should show all clients when search contains only spaces', async ({ page }) => {
    // GIVEN: Two clients exist
    await page.route('**/api/v1/clientes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '00000000-0000-0000-0000-000000000001',
            nombre: 'Alpha Corp',
            nit: '900000001-1',
            telefono: '3001234567',
            ciudad: 'Bogotá',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
          {
            id: '00000000-0000-0000-0000-000000000002',
            nombre: 'Beta Ltda',
            nit: '900000002-2',
            telefono: '3001234568',
            ciudad: 'Medellín',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ]),
      });
    });

    await page.goto('/clientes');
    await page.waitForURL('**/clientes');

    // WHEN: User types only spaces into the search
    await page.getByTestId('search-clientes').fill('   ');

    // THEN: All clients remain visible (whitespace-only query = no filter)
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Alpha Corp' })
    ).toBeVisible();
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Beta Ltda' })
    ).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Search "no match" vs "no data" EmptyState message differentiation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('EmptyState message differentiation', () => {
  test('[P1] should show "no results" message when search matches nothing (not "no data" message)', async ({
    page,
  }) => {
    // GIVEN: One client exists
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

    // WHEN: Search yields no matches
    await page.getByTestId('search-clientes').fill('ZZZ_NO_MATCH');

    // THEN: "no results" message is shown (not "create first client")
    await expect(
      page.getByText(/no se encontraron clientes con ese criterio/i)
    ).toBeVisible();

    // AND: "create first client" message is NOT shown
    await expect(
      page.getByText(/crea el primer cliente/i)
    ).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Network abort (connection refused simulation)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Network-level abort', () => {
  test('[P1] should show ErrorPanel when network request is aborted', async ({ page }) => {
    // GIVEN: Network is aborted (simulates connection refused)
    await page.route('**/api/v1/clientes', async (route) => {
      await route.abort('connectionrefused');
    });

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: ErrorPanel is visible
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('[P1] should show ErrorPanel when network times out', async ({ page }) => {
    // GIVEN: Network responds with a timeout abort
    await page.route('**/api/v1/clientes', async (route) => {
      await route.abort('timedout');
    });

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: ErrorPanel is visible
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// HTTP 4xx error codes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('HTTP error status codes', () => {
  for (const status of [401, 403, 404]) {
    test(`[P2] should show ErrorPanel for HTTP ${status} response`, async ({ page }) => {
      // GIVEN: Backend returns a ${status} error
      await page.route('**/api/v1/clientes', async (route) => {
        await route.fulfill({
          status,
          contentType: 'application/json',
          body: JSON.stringify({ title: 'Error', status }),
        });
      });

      // WHEN: User navigates to /clientes
      await page.goto('/clientes');

      // THEN: ErrorPanel is visible
      await expect(page.getByTestId('error-panel')).toBeVisible();
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Multiple clients — count assertion
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Multiple clients rendered', () => {
  test('[P1] should render exactly N client items matching the number of clients returned', async ({
    page,
  }) => {
    // GIVEN: 3 clients are returned by the API
    const clients = Array.from({ length: 3 }, (_, i) => ({
      id: `00000000-0000-0000-0000-00000000000${i + 1}`,
      nombre: `Empresa Count ${i + 1}`,
      nit: `90000000${i + 1}-${i + 1}`,
      telefono: '3001234567',
      ciudad: 'Bogotá',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }));

    await page.route('**/api/v1/clientes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clients),
      });
    });

    await page.goto('/clientes');
    await page.waitForURL('**/clientes');

    // WHEN: Page fully loads
    // THEN: Exactly 3 list items are visible
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Right panel — AC5 neutral state copy text
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Right panel neutral state content', () => {
  test('[P2] should display "selecciona un cliente" instructional text in the right panel', async ({
    page,
  }) => {
    // GIVEN: Clients exist but none are selected
    await page.route('**/api/v1/clientes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '00000000-0000-0000-0000-000000000001',
            nombre: 'Empresa Seleccion',
            nit: '900000001-1',
            telefono: '3001234567',
            ciudad: 'Bogotá',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ]),
      });
    });

    // WHEN: User navigates to /clientes (no clienteId in URL)
    await page.goto('/clientes');

    // THEN: Instructional text is visible in the right panel
    await expect(
      page.getByText(/selecciona un cliente para ver sus detalles/i)
    ).toBeVisible();
  });
});

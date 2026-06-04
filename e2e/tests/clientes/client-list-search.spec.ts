/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (E2E Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — /clientes shows a 280px fixed-width scrollable list with Nombre and NIT/RUC per item
 *   AC2 — Real-time client-side search by Nombre or NIT/RUC (no extra API call, <1s for 500 records)
 *   AC3 — EmptyState shown when API returns empty array
 *   AC4 — ErrorPanel with "Reintentar" button shown on backend failure; retry triggers new request
 *   AC5 — Clearing the search field restores full list without a new API call
 */

import { test, expect } from '@playwright/test';

const API_CLIENTES = '**/api/v1/clientes';

// ─────────────────────────────────────────────────────────────────────────────
// AC1: Left panel renders scrollable client list (280px fixed width)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Client list panel at /clientes', () => {
  test('should display the 280px fixed-width left panel with a scrollable list of clients', async ({
    page,
  }) => {
    // GIVEN: There are clients in the system (mocked before navigation)
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'a1b2c3d4-0000-0000-0000-000000000001',
            nombre: 'Empresa Alfa',
            nit: '900100200-1',
            telefono: '3001234567',
            ciudad: 'Bogotá',
            createdAt: '2026-01-01T00:00:00Z',
          },
          {
            id: 'a1b2c3d4-0000-0000-0000-000000000002',
            nombre: 'Beta Ltda',
            nit: '800200300-2',
            telefono: '3109876543',
            ciudad: 'Medellín',
            createdAt: '2026-01-02T00:00:00Z',
          },
        ]),
      })
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: The left panel (data-testid="clientes-list-panel") is visible
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
  });

  test('should show Nombre and NIT/RUC for each client item in the list', async ({ page }) => {
    // GIVEN: There are clients in the system
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'a1b2c3d4-0000-0000-0000-000000000001',
            nombre: 'Empresa Alfa',
            nit: '900100200-1',
            telefono: '3001234567',
            ciudad: 'Bogotá',
            createdAt: '2026-01-01T00:00:00Z',
          },
        ]),
      })
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: The client item shows the nombre
    await expect(page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Alfa' })).toBeVisible();
  });

  test('should show NIT/RUC for each client item in the list', async ({ page }) => {
    // GIVEN: There are clients in the system
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'a1b2c3d4-0000-0000-0000-000000000001',
            nombre: 'Empresa Alfa',
            nit: '900100200-1',
            telefono: '3001234567',
            ciudad: 'Bogotá',
            createdAt: '2026-01-01T00:00:00Z',
          },
        ]),
      })
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: The client item shows the nit
    await expect(page.getByTestId('cliente-list-item').filter({ hasText: '900100200-1' })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2: Real-time client-side search by Nombre or NIT/RUC
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Real-time client-side search', () => {
  const mockClientes = [
    {
      id: 'a1b2c3d4-0000-0000-0000-000000000001',
      nombre: 'Acero Andino',
      nit: '900100200-1',
      telefono: '3001234567',
      ciudad: 'Bogotá',
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'a1b2c3d4-0000-0000-0000-000000000002',
      nombre: 'Acero del Norte',
      nit: '800200300-2',
      telefono: '3109876543',
      ciudad: 'Medellín',
      createdAt: '2026-01-02T00:00:00Z',
    },
    {
      id: 'a1b2c3d4-0000-0000-0000-000000000003',
      nombre: 'Acero del Sur',
      nit: '700300400-3',
      telefono: '3208765432',
      ciudad: 'Cali',
      createdAt: '2026-01-03T00:00:00Z',
    },
    {
      id: 'a1b2c3d4-0000-0000-0000-000000000004',
      nombre: 'Beta Comercial',
      nit: '600400500-4',
      telefono: '3207654321',
      ciudad: 'Barranquilla',
      createdAt: '2026-01-04T00:00:00Z',
    },
    {
      id: 'a1b2c3d4-0000-0000-0000-000000000005',
      nombre: 'Gamma Ingeniería',
      nit: '500500600-5',
      telefono: '3206543210',
      ciudad: 'Bucaramanga',
      createdAt: '2026-01-05T00:00:00Z',
    },
  ];

  test('should filter list by nombre in real time without issuing a new API call', async ({
    page,
  }) => {
    // GIVEN: The client list is loaded (API called exactly once)
    let apiCallCount = 0;
    await page.route(API_CLIENTES, (route) => {
      apiCallCount++;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockClientes),
      });
    });

    await page.goto('/clientes');
    // Wait for the list to render
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();
    const callsAfterLoad = apiCallCount;

    // WHEN: The user types "Acero" in the search field
    await page.getByTestId('search-clientes').fill('Acero');

    // THEN: Only 3 items matching "Acero" are visible
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(3);

    // AND: No additional API call was issued
    expect(apiCallCount).toBe(callsAfterLoad);
  });

  test('should filter list by NIT/RUC in real time', async ({ page }) => {
    // GIVEN: The client list is loaded with a client whose NIT is "900123456-1"
    const clienteConNit = [
      {
        id: 'a1b2c3d4-0000-0000-0000-000000000010',
        nombre: 'Empresa Nit Exacto',
        nit: '900123456-1',
        telefono: '3001234567',
        ciudad: 'Bogotá',
        createdAt: '2026-01-01T00:00:00Z',
      },
      ...mockClientes.slice(3),
    ];

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clienteConNit),
      })
    );

    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // WHEN: The user types "900123456" in the search field
    await page.getByTestId('search-clientes').fill('900123456');

    // THEN: Only the matching client is visible
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(1);
    await expect(page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Nit Exacto' })).toBeVisible();
  });

  test('should display search results in under 1 second with 500 records (NFR1)', async ({
    page,
  }) => {
    // GIVEN: The client list is loaded with 500 records
    const clientes500 = Array.from({ length: 500 }, (_, i) => ({
      id: `a1b2c3d4-0000-0000-0000-${String(i).padStart(12, '0')}`,
      nombre: i < 100 ? `Acero Empresa ${i}` : `Beta Empresa ${i}`,
      nit: `9${String(i).padStart(8, '0')}-${i % 9}`,
      telefono: `300${String(i).padStart(7, '0')}`,
      ciudad: 'Bogotá',
      createdAt: '2026-01-01T00:00:00Z',
    }));

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes500),
      })
    );

    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // WHEN: The user types "Acero" and we measure the filtering time
    const start = Date.now();
    await page.getByTestId('search-clientes').fill('Acero');
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(100);
    const elapsed = Date.now() - start;

    // THEN: Results appear in under 1000ms
    expect(elapsed).toBeLessThan(1000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3: EmptyState shown when API returns empty array
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — EmptyState when no clients exist', () => {
  test('should display the EmptyState component when the API returns an empty array', async ({
    page,
  }) => {
    // GIVEN: There are no clients in the system (API returns [])
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: The EmptyState component is visible
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });

  test('should NOT show any list items when EmptyState is displayed', async ({ page }) => {
    // GIVEN: The API returns []
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: No cliente-list-item elements are rendered
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(0);
  });

  test('should show a guidance message to create the first client in EmptyState', async ({
    page,
  }) => {
    // GIVEN: The API returns []
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: A guidance message for creating the first client is visible
    await expect(page.getByTestId('empty-state')).toContainText(/primer cliente|crea.*cliente/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4: ErrorPanel + Reintentar on backend failure
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — ErrorPanel when backend is unavailable', () => {
  test('should display the ErrorPanel component when the fetch fails with a 5xx error', async ({
    page,
  }) => {
    // GIVEN: The backend returns a 500 error
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Internal Server Error', status: 500 }),
      })
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: The ErrorPanel component is visible
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('should display a "Reintentar" button inside the ErrorPanel', async ({ page }) => {
    // GIVEN: The backend returns a 500 error
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Internal Server Error', status: 500 }),
      })
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: A "Reintentar" button is visible inside the error panel
    await expect(page.getByTestId('error-panel').getByRole('button', { name: /reintentar/i })).toBeVisible();
  });

  test('should trigger a new GET /api/v1/clientes request when "Reintentar" is clicked', async ({
    page,
  }) => {
    // GIVEN: The backend fails on first load, then succeeds on retry
    let requestCount = 0;
    await page.route(API_CLIENTES, (route) => {
      requestCount++;
      if (requestCount === 1) {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ title: 'Internal Server Error', status: 500 }),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'a1b2c3d4-0000-0000-0000-000000000001',
              nombre: 'Recuperado SA',
              nit: '900000001-1',
              telefono: '3001234567',
              ciudad: 'Bogotá',
              createdAt: '2026-01-01T00:00:00Z',
            },
          ]),
        });
      }
    });

    await page.goto('/clientes');
    await expect(page.getByTestId('error-panel')).toBeVisible();
    const callsAfterError = requestCount;

    // WHEN: The user clicks "Reintentar"
    await page.getByTestId('error-panel').getByRole('button', { name: /reintentar/i }).click();

    // THEN: A new API call is issued (requestCount increases)
    await expect(page.getByTestId('cliente-list-item')).toBeVisible();
    expect(requestCount).toBeGreaterThan(callsAfterError);
  });

  test('should display ErrorPanel on network-level failure (aborted request)', async ({ page }) => {
    // GIVEN: The network call is aborted (simulates connectivity loss)
    await page.route(API_CLIENTES, (route) => route.abort());

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: The ErrorPanel component is visible
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5: Clearing the search field restores the full list without a new API call
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Clearing search restores full list', () => {
  const twoClientes = [
    {
      id: 'a1b2c3d4-0000-0000-0000-000000000001',
      nombre: 'Empresa Alfa',
      nit: '900100200-1',
      telefono: '3001234567',
      ciudad: 'Bogotá',
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'a1b2c3d4-0000-0000-0000-000000000002',
      nombre: 'Beta Ltda',
      nit: '800200300-2',
      telefono: '3109876543',
      ciudad: 'Medellín',
      createdAt: '2026-01-02T00:00:00Z',
    },
  ];

  test('should show the full client list again after clearing the search field', async ({
    page,
  }) => {
    // GIVEN: The client list is loaded and the user has typed a search term
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(twoClientes),
      })
    );

    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(2);

    await page.getByTestId('search-clientes').fill('Alfa');
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(1);

    // WHEN: The user clears the search field
    await page.getByTestId('search-clientes').fill('');

    // THEN: The full list of 2 clients is displayed again
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(2);
  });

  test('should NOT issue a new API call when the search field is cleared', async ({ page }) => {
    // GIVEN: The client list is loaded (API called once)
    let apiCallCount = 0;
    await page.route(API_CLIENTES, (route) => {
      apiCallCount++;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(twoClientes),
      });
    });

    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    await page.getByTestId('search-clientes').fill('Alfa');
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(1);
    const callsBeforeClear = apiCallCount;

    // WHEN: The user clears the search field
    await page.getByTestId('search-clientes').fill('');
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(2);

    // THEN: No additional API call was issued
    expect(apiCallCount).toBe(callsBeforeClear);
  });
});

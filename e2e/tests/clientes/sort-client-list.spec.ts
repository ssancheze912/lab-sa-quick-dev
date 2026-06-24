/**
 * E2E Tests — Story 2.6: Sort Client List
 * RED PHASE — Tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — "Nombre A→Z" sort reorders list alphabetically ascending, no new API call
 *   AC2 — "Nombre Z→A" sort reorders list alphabetically descending, no new API call
 *   AC3 — "Más reciente" sort orders by createdAt descending (newest first)
 *   AC4 — "Más antiguo" sort orders by createdAt ascending (oldest first)
 *   AC5 — Sort applies to already-filtered result set without clearing search input
 *   AC6 — Default sort on initial page load is "Más reciente" (fecha-desc)
 *
 * Required data-testid attributes (must be added during implementation):
 *   - sort-control                  → root element of SortControl component
 *
 * Network intercept strategy: ALWAYS intercept routes BEFORE navigation (network-first).
 */

import { test, expect } from '@playwright/test';
import { createClienteDto } from '../../support/factories/cliente.factory';

const API_CLIENTES = '**/api/v1/clientes';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers: build clients with deterministic names and dates for sort testing
// ─────────────────────────────────────────────────────────────────────────────

function makeNamedCliente(overrides: { nombre: string; createdAt?: string }) {
  return createClienteDto({
    nombre: overrides.nombre,
    createdAt: overrides.createdAt ?? new Date().toISOString(),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Default sort on initial page load is "Más reciente" (fecha-desc)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Default sort order on initial page load', () => {
  test('should render the SortControl component on the /clientes page', async ({ page }) => {
    // GIVEN: Clients are loaded
    const clientes = [
      makeNamedCliente({ nombre: 'Alfa Corp', createdAt: '2026-01-01T00:00:00Z' }),
      makeNamedCliente({ nombre: 'Beta SA',   createdAt: '2026-01-02T00:00:00Z' }),
    ];

    // WHEN: Route is intercepted before navigation (network-first)
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clientes) })
    );
    await page.goto('/clientes');

    // THEN: SortControl is visible
    await expect(page.getByTestId('sort-control')).toBeVisible();
  });

  test('should have "Más reciente" selected as the default sort option', async ({ page }) => {
    // GIVEN: Clients loaded with no prior sort preference
    const clientes = [
      makeNamedCliente({ nombre: 'Alfa Corp', createdAt: '2026-01-01T00:00:00Z' }),
    ];

    // WHEN: Page loads for the first time (network-first intercept)
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clientes) })
    );
    await page.goto('/clientes');

    // THEN: The SortControl shows "Más reciente" as the selected value
    const sortControl = page.getByTestId('sort-control');
    await expect(sortControl).toBeVisible();
    // The select element (or its accessible name) should indicate 'fecha-desc' / 'Más reciente'
    await expect(sortControl).toHaveValue('fecha-desc');
  });

  test('should order clients by newest first when default sort is applied', async ({ page }) => {
    // GIVEN: Two clients — Beta created more recently than Alfa
    const older  = makeNamedCliente({ nombre: 'Alfa Corp', createdAt: '2026-01-01T00:00:00Z' });
    const newer  = makeNamedCliente({ nombre: 'Beta SA',   createdAt: '2026-06-01T00:00:00Z' });

    // WHEN: Page loads (intercept before navigation)
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([older, newer]) })
    );
    await page.goto('/clientes');

    // THEN: Beta SA (newer) appears before Alfa Corp (older) in the DOM
    const items = page.locator('[data-testid^="client-list-item-"]');
    await expect(items.first()).toContainText('Beta SA');
    await expect(items.nth(1)).toContainText('Alfa Corp');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — "Nombre A→Z" sort (alphabetical ascending, no new API call)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Sort by Nombre A→Z (nombre-asc)', () => {
  test('should reorder the client list alphabetically ascending when "Nombre A→Z" is selected', async ({ page }) => {
    // GIVEN: Two clients whose names are currently unordered (Z before A in the default)
    const clienteA = makeNamedCliente({ nombre: 'Alfa Empresa', createdAt: '2026-06-01T00:00:00Z' });
    const clienteZ = makeNamedCliente({ nombre: 'Zeta Empresa', createdAt: '2026-01-01T00:00:00Z' });

    // WHEN: Intercept before navigation, then select "Nombre A→Z"
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([clienteZ, clienteA]) })
    );
    await page.goto('/clientes');
    await page.getByTestId('sort-control').selectOption('nombre-asc');

    // THEN: Alfa Empresa appears before Zeta Empresa
    const items = page.locator('[data-testid^="client-list-item-"]');
    await expect(items.first()).toContainText('Alfa Empresa');
    await expect(items.nth(1)).toContainText('Zeta Empresa');
  });

  test('should NOT trigger a new API call when sorting by nombre-asc', async ({ page }) => {
    // GIVEN: Initial load with 3 clients
    const clientes = [
      makeNamedCliente({ nombre: 'Zeta' }),
      makeNamedCliente({ nombre: 'Alfa' }),
      makeNamedCliente({ nombre: 'Beta' }),
    ];
    let apiCallCount = 0;

    await page.route(API_CLIENTES, (route) => {
      apiCallCount++;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clientes) });
    });
    await page.goto('/clientes');
    const countAfterLoad = apiCallCount;

    // WHEN: User selects "Nombre A→Z"
    await page.getByTestId('sort-control').selectOption('nombre-asc');

    // THEN: No new API call was triggered (client-side sort only)
    expect(apiCallCount).toBe(countAfterLoad);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — "Nombre Z→A" sort (alphabetical descending, no new API call)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Sort by Nombre Z→A (nombre-desc)', () => {
  test('should reorder the client list alphabetically descending when "Nombre Z→A" is selected', async ({ page }) => {
    // GIVEN: Two clients with distinct names
    const clienteA = makeNamedCliente({ nombre: 'Alfa Empresa' });
    const clienteZ = makeNamedCliente({ nombre: 'Zeta Empresa' });

    // WHEN: Intercept before navigation, then select "Nombre Z→A"
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([clienteA, clienteZ]) })
    );
    await page.goto('/clientes');
    await page.getByTestId('sort-control').selectOption('nombre-desc');

    // THEN: Zeta Empresa appears before Alfa Empresa
    const items = page.locator('[data-testid^="client-list-item-"]');
    await expect(items.first()).toContainText('Zeta Empresa');
    await expect(items.nth(1)).toContainText('Alfa Empresa');
  });

  test('should NOT trigger a new API call when sorting by nombre-desc', async ({ page }) => {
    // GIVEN: Initial load with clients
    const clientes = [
      makeNamedCliente({ nombre: 'Alfa' }),
      makeNamedCliente({ nombre: 'Zeta' }),
    ];
    let apiCallCount = 0;

    await page.route(API_CLIENTES, (route) => {
      apiCallCount++;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clientes) });
    });
    await page.goto('/clientes');
    const countAfterLoad = apiCallCount;

    // WHEN: User selects "Nombre Z→A"
    await page.getByTestId('sort-control').selectOption('nombre-desc');

    // THEN: No new API call
    expect(apiCallCount).toBe(countAfterLoad);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — "Más reciente" sort (createdAt descending, newest first)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Sort by Más reciente (fecha-desc)', () => {
  test('should order client list by createdAt descending when "Más reciente" is selected', async ({ page }) => {
    // GIVEN: Three clients with different creation dates
    const oldest = makeNamedCliente({ nombre: 'Empresa 2024', createdAt: '2024-01-15T00:00:00Z' });
    const middle = makeNamedCliente({ nombre: 'Empresa 2025', createdAt: '2025-06-01T00:00:00Z' });
    const newest = makeNamedCliente({ nombre: 'Empresa 2026', createdAt: '2026-05-10T00:00:00Z' });

    // WHEN: Intercept before navigation, then select "Más reciente"
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([oldest, middle, newest]) })
    );
    await page.goto('/clientes');
    // First switch to another sort, then back to fecha-desc to confirm it works
    await page.getByTestId('sort-control').selectOption('nombre-asc');
    await page.getByTestId('sort-control').selectOption('fecha-desc');

    // THEN: Empresa 2026 (newest) appears first
    const items = page.locator('[data-testid^="client-list-item-"]');
    await expect(items.first()).toContainText('Empresa 2026');
    await expect(items.nth(1)).toContainText('Empresa 2025');
    await expect(items.nth(2)).toContainText('Empresa 2024');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — "Más antiguo" sort (createdAt ascending, oldest first)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Sort by Más antiguo (fecha-asc)', () => {
  test('should order client list by createdAt ascending when "Más antiguo" is selected', async ({ page }) => {
    // GIVEN: Three clients with different creation dates
    const oldest = makeNamedCliente({ nombre: 'Empresa 2024', createdAt: '2024-01-15T00:00:00Z' });
    const middle = makeNamedCliente({ nombre: 'Empresa 2025', createdAt: '2025-06-01T00:00:00Z' });
    const newest = makeNamedCliente({ nombre: 'Empresa 2026', createdAt: '2026-05-10T00:00:00Z' });

    // WHEN: Intercept before navigation, then select "Más antiguo"
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([newest, middle, oldest]) })
    );
    await page.goto('/clientes');
    await page.getByTestId('sort-control').selectOption('fecha-asc');

    // THEN: Empresa 2024 (oldest) appears first
    const items = page.locator('[data-testid^="client-list-item-"]');
    await expect(items.first()).toContainText('Empresa 2024');
    await expect(items.nth(1)).toContainText('Empresa 2025');
    await expect(items.nth(2)).toContainText('Empresa 2026');
  });

  test('should NOT trigger a new API call when sorting by fecha-asc', async ({ page }) => {
    // GIVEN: Initial load with clients
    const clientes = [
      makeNamedCliente({ nombre: 'Beta', createdAt: '2026-01-01T00:00:00Z' }),
      makeNamedCliente({ nombre: 'Alfa', createdAt: '2025-01-01T00:00:00Z' }),
    ];
    let apiCallCount = 0;

    await page.route(API_CLIENTES, (route) => {
      apiCallCount++;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clientes) });
    });
    await page.goto('/clientes');
    const countAfterLoad = apiCallCount;

    // WHEN: User selects "Más antiguo"
    await page.getByTestId('sort-control').selectOption('fecha-asc');

    // THEN: No new API call
    expect(apiCallCount).toBe(countAfterLoad);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Sort applies to filtered result set without clearing search input
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Sort combines with active search filter', () => {
  test('should apply sort to the already-filtered result set', async ({ page }) => {
    // GIVEN: Three clients — two match search "Corp", one does not
    const clienteA = makeNamedCliente({ nombre: 'Alpha Corp', createdAt: '2026-01-01T00:00:00Z' });
    const clienteZ = makeNamedCliente({ nombre: 'Zeta Corp',  createdAt: '2026-06-01T00:00:00Z' });
    const noMatch  = makeNamedCliente({ nombre: 'Delta SA',   createdAt: '2025-01-01T00:00:00Z' });

    // WHEN: Network is intercepted before navigation (network-first)
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([clienteZ, clienteA, noMatch]),
      })
    );
    await page.goto('/clientes');

    // User applies search filter "Corp"
    await page.getByTestId('client-search-input').fill('Corp');

    // Only "Corp" items should be visible
    await expect(page.getByTestId(`client-list-item-${noMatch.id}`)).not.toBeVisible();

    // THEN: Sort by "Nombre A→Z" is applied to the filtered set
    await page.getByTestId('sort-control').selectOption('nombre-asc');

    const items = page.locator('[data-testid^="client-list-item-"]:visible');
    await expect(items.first()).toContainText('Alpha Corp');
    await expect(items.nth(1)).toContainText('Zeta Corp');
  });

  test('should NOT clear the search input when sort option changes', async ({ page }) => {
    // GIVEN: Clients loaded and search input has a value
    const clientes = [
      makeNamedCliente({ nombre: 'Corp One' }),
      makeNamedCliente({ nombre: 'Corp Two' }),
      makeNamedCliente({ nombre: 'Delta SA' }),
    ];

    // WHEN: Network is intercepted before navigation (network-first)
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clientes) })
    );
    await page.goto('/clientes');

    // User types a search term
    await page.getByTestId('client-search-input').fill('Corp');

    // User changes the sort option
    await page.getByTestId('sort-control').selectOption('nombre-desc');

    // THEN: The search input value remains intact
    const searchInput = page.getByTestId('client-search-input');
    await expect(searchInput).toHaveValue('Corp');
  });

  test('should NOT trigger a new API call when sort changes while search filter is active', async ({ page }) => {
    // GIVEN: Search is active, clients are loaded
    const clientes = [
      makeNamedCliente({ nombre: 'Zeta Corp' }),
      makeNamedCliente({ nombre: 'Alpha Corp' }),
      makeNamedCliente({ nombre: 'Beta SA' }),
    ];
    let apiCallCount = 0;

    await page.route(API_CLIENTES, (route) => {
      apiCallCount++;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clientes) });
    });
    await page.goto('/clientes');
    await page.getByTestId('client-search-input').fill('Corp');
    const countAfterLoad = apiCallCount;

    // WHEN: User changes sort
    await page.getByTestId('sort-control').selectOption('nombre-asc');

    // THEN: No new API call
    expect(apiCallCount).toBe(countAfterLoad);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SortControl accessibility
// ─────────────────────────────────────────────────────────────────────────────

test.describe('SortControl accessibility (WCAG 2.1 AA)', () => {
  test('should have an accessible label (aria-label="Ordenar clientes")', async ({ page }) => {
    // GIVEN: Clients loaded
    const clientes = [makeNamedCliente({ nombre: 'Alfa' })];

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clientes) })
    );
    await page.goto('/clientes');

    // THEN: SortControl has aria-label="Ordenar clientes" for keyboard/screen-reader users
    const sortControl = page.getByTestId('sort-control');
    await expect(sortControl).toHaveAttribute('aria-label', 'Ordenar clientes');
  });

  test('should expose four sort options with Spanish labels', async ({ page }) => {
    // GIVEN: Clients loaded
    const clientes = [makeNamedCliente({ nombre: 'Alfa' })];

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clientes) })
    );
    await page.goto('/clientes');

    // THEN: The four Spanish-labelled options are present in the select
    const sortControl = page.getByTestId('sort-control');
    await expect(sortControl.locator('option[value="nombre-asc"]')).toHaveText('Nombre A→Z');
    await expect(sortControl.locator('option[value="nombre-desc"]')).toHaveText('Nombre Z→A');
    await expect(sortControl.locator('option[value="fecha-desc"]')).toHaveText('Más reciente');
    await expect(sortControl.locator('option[value="fecha-asc"]')).toHaveText('Más antiguo');
  });
});

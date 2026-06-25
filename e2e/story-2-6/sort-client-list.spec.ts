/**
 * Story 2.6: Sort Client List
 * ATDD — RED Phase (Tests intentionally failing — no implementation yet)
 *
 * Acceptance Criteria covered:
 * - AC1: SortControl "Nombre A→Z" reorders list alphabetically ascending without new API call
 * - AC2: SortControl "Nombre Z→A" reorders list alphabetically descending without new API call
 * - AC3: SortControl "Más reciente" orders by createdAt descending without new API call
 * - AC4: SortControl "Más antiguo" orders by createdAt ascending without new API call
 * - AC5: Sort applied to already-filtered set; search input not cleared when sort changes
 * - AC6: Default sort order on initial load is "Más reciente" (fecha-desc)
 */

import { test, expect } from '@playwright/test';

const API_CLIENTES = '**/api/v1/clientes';

// ─── Shared helpers ───────────────────────────────────────────────────────────

function buildClienteStub(overrides: Partial<{
  id: string;
  nombre: string;
  nit: string;
  telefono: string;
  ciudad: string;
  createdAt: string;
  updatedAt: string;
}> = {}) {
  return {
    id: crypto.randomUUID(),
    nombre: 'Empresa Ejemplo S.A.',
    nit: '900123456-7',
    telefono: '6011234567',
    ciudad: 'Bogotá',
    createdAt: '2026-03-15T10:00:00Z',
    updatedAt: '2026-03-15T10:00:00Z',
    ...overrides,
  };
}

// Two clients for alphabetical sort tests
function buildAlphabeticPair() {
  return [
    buildClienteStub({ id: 'id-zafiro', nombre: 'Zafiro Corp', nit: '111-1', createdAt: '2026-01-01T08:00:00Z' }),
    buildClienteStub({ id: 'id-alfa', nombre: 'Alfa Industries', nit: '222-2', createdAt: '2026-06-01T08:00:00Z' }),
  ];
}

// ─── AC1: Nombre A→Z sort ─────────────────────────────────────────────────────

test.describe('AC1 — Sort by Nombre A→Z reorders list ascending without new API call', () => {
  test('should render the SortControl component on the client list page', async ({ page }) => {
    // GIVEN: API returns clients
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildAlphabeticPair()),
      }),
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: The SortControl component is visible
    const sortControl = page.getByTestId('sort-control');
    await expect(sortControl).toBeVisible();
  });

  test('should list first item before second when "Nombre A→Z" is selected', async ({ page }) => {
    // GIVEN: API returns two clients — Zafiro Corp and Alfa Industries
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildAlphabeticPair()),
      }),
    );
    await page.goto('/clientes');

    // Track API calls after initial load
    let extraApiCallCount = 0;
    await page.route(API_CLIENTES, () => { extraApiCallCount++; });

    // WHEN: User selects "Nombre A→Z" from the SortControl
    const sortControl = page.getByTestId('sort-control');
    await sortControl.selectOption('nombre-asc');

    // THEN: "Alfa Industries" appears before "Zafiro Corp" in the list
    const items = page.getByTestId('cliente-list-item');
    await expect(items.first()).toContainText('Alfa Industries');
  });

  test('should not trigger a new API call when "Nombre A→Z" is selected', async ({ page }) => {
    // GIVEN: API returns clients (initial load)
    let apiCallCount = 0;
    await page.route(API_CLIENTES, (route) => {
      apiCallCount++;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildAlphabeticPair()),
      });
    });
    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();
    const callsAfterLoad = apiCallCount;

    // WHEN: User selects "Nombre A→Z"
    await page.getByTestId('sort-control').selectOption('nombre-asc');

    // THEN: No additional API call is made
    expect(apiCallCount).toBe(callsAfterLoad);
  });
});

// ─── AC2: Nombre Z→A sort ─────────────────────────────────────────────────────

test.describe('AC2 — Sort by Nombre Z→A reorders list descending without new API call', () => {
  test('should list Zafiro Corp before Alfa Industries when "Nombre Z→A" is selected', async ({ page }) => {
    // GIVEN: API returns Zafiro Corp and Alfa Industries
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildAlphabeticPair()),
      }),
    );
    await page.goto('/clientes');

    // WHEN: User selects "Nombre Z→A"
    await page.getByTestId('sort-control').selectOption('nombre-desc');

    // THEN: "Zafiro Corp" appears before "Alfa Industries"
    const items = page.getByTestId('cliente-list-item');
    await expect(items.first()).toContainText('Zafiro Corp');
  });

  test('should not trigger a new API call when "Nombre Z→A" is selected', async ({ page }) => {
    // GIVEN: API returns clients (initial load)
    let apiCallCount = 0;
    await page.route(API_CLIENTES, (route) => {
      apiCallCount++;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildAlphabeticPair()),
      });
    });
    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();
    const callsAfterLoad = apiCallCount;

    // WHEN: User selects "Nombre Z→A"
    await page.getByTestId('sort-control').selectOption('nombre-desc');

    // THEN: No additional API call is made
    expect(apiCallCount).toBe(callsAfterLoad);
  });
});

// ─── AC3: Más reciente (fecha-desc) sort ─────────────────────────────────────

test.describe('AC3 — Sort by "Más reciente" orders by createdAt descending without new API call', () => {
  test('should list the newest client first when "Más reciente" is selected', async ({ page }) => {
    // GIVEN: API returns two clients — one older (Jan 2026) and one newer (Jun 2026)
    const clientes = [
      buildClienteStub({ id: 'old', nombre: 'Empresa Antigua', createdAt: '2026-01-10T08:00:00Z' }),
      buildClienteStub({ id: 'new', nombre: 'Empresa Nueva', createdAt: '2026-06-20T08:00:00Z' }),
    ];
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      }),
    );
    await page.goto('/clientes');

    // WHEN: User selects "Más reciente" (fecha-desc)
    await page.getByTestId('sort-control').selectOption('fecha-desc');

    // THEN: "Empresa Nueva" (newest) appears first
    const items = page.getByTestId('cliente-list-item');
    await expect(items.first()).toContainText('Empresa Nueva');
  });

  test('should not trigger a new API call when "Más reciente" is selected', async ({ page }) => {
    // GIVEN: API returns clients (initial load)
    let apiCallCount = 0;
    const clientes = [
      buildClienteStub({ id: 'old', nombre: 'Empresa Antigua', createdAt: '2026-01-10T08:00:00Z' }),
      buildClienteStub({ id: 'new', nombre: 'Empresa Nueva', createdAt: '2026-06-20T08:00:00Z' }),
    ];
    await page.route(API_CLIENTES, (route) => {
      apiCallCount++;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      });
    });
    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();
    const callsAfterLoad = apiCallCount;

    // WHEN: User selects "Más reciente"
    await page.getByTestId('sort-control').selectOption('fecha-desc');

    // THEN: No additional API call is made
    expect(apiCallCount).toBe(callsAfterLoad);
  });
});

// ─── AC4: Más antiguo (fecha-asc) sort ───────────────────────────────────────

test.describe('AC4 — Sort by "Más antiguo" orders by createdAt ascending without new API call', () => {
  test('should list the oldest client first when "Más antiguo" is selected', async ({ page }) => {
    // GIVEN: API returns two clients — one older (Jan 2026) and one newer (Jun 2026)
    const clientes = [
      buildClienteStub({ id: 'old', nombre: 'Empresa Antigua', createdAt: '2026-01-10T08:00:00Z' }),
      buildClienteStub({ id: 'new', nombre: 'Empresa Nueva', createdAt: '2026-06-20T08:00:00Z' }),
    ];
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      }),
    );
    await page.goto('/clientes');

    // WHEN: User selects "Más antiguo" (fecha-asc)
    await page.getByTestId('sort-control').selectOption('fecha-asc');

    // THEN: "Empresa Antigua" (oldest) appears first
    const items = page.getByTestId('cliente-list-item');
    await expect(items.first()).toContainText('Empresa Antigua');
  });

  test('should not trigger a new API call when "Más antiguo" is selected', async ({ page }) => {
    // GIVEN: API returns clients (initial load)
    let apiCallCount = 0;
    const clientes = [
      buildClienteStub({ id: 'old', nombre: 'Empresa Antigua', createdAt: '2026-01-10T08:00:00Z' }),
      buildClienteStub({ id: 'new', nombre: 'Empresa Nueva', createdAt: '2026-06-20T08:00:00Z' }),
    ];
    await page.route(API_CLIENTES, (route) => {
      apiCallCount++;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      });
    });
    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();
    const callsAfterLoad = apiCallCount;

    // WHEN: User selects "Más antiguo"
    await page.getByTestId('sort-control').selectOption('fecha-asc');

    // THEN: No additional API call is made
    expect(apiCallCount).toBe(callsAfterLoad);
  });
});

// ─── AC5: Sort applied to filtered result set; search input not cleared ────────

test.describe('AC5 — Sort applied to filtered result set; search input preserved', () => {
  test('should apply sort only to the already-filtered set when search is active', async ({ page }) => {
    // GIVEN: API returns three clients; two match the search "Corp"
    const clientes = [
      buildClienteStub({ id: '1', nombre: 'Zafiro Corp', nit: '111-1', createdAt: '2026-01-01T08:00:00Z' }),
      buildClienteStub({ id: '2', nombre: 'Alfa Corp', nit: '222-2', createdAt: '2026-06-01T08:00:00Z' }),
      buildClienteStub({ id: '3', nombre: 'Beta Industries', nit: '333-3', createdAt: '2026-03-01T08:00:00Z' }),
    ];
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      }),
    );
    await page.goto('/clientes');

    // AND: User has an active search filter
    const searchInput = page.getByTestId('clientes-search-input');
    await searchInput.fill('Corp');
    const filteredItems = page.getByTestId('cliente-list-item');
    await expect(filteredItems).toHaveCount(2);

    // WHEN: User changes sort to "Nombre A→Z"
    await page.getByTestId('sort-control').selectOption('nombre-asc');

    // THEN: Only the 2 Corp clients remain (filter not cleared)
    await expect(filteredItems).toHaveCount(2);

    // AND: They are sorted alphabetically — "Alfa Corp" before "Zafiro Corp"
    await expect(filteredItems.first()).toContainText('Alfa Corp');
  });

  test('should not clear the search input when sort order changes', async ({ page }) => {
    // GIVEN: API returns clients and user typed a search query
    const clientes = [
      buildClienteStub({ id: '1', nombre: 'Zafiro Corp', nit: '111-1' }),
      buildClienteStub({ id: '2', nombre: 'Alfa Corp', nit: '222-2' }),
    ];
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      }),
    );
    await page.goto('/clientes');
    const searchInput = page.getByTestId('clientes-search-input');
    await searchInput.fill('Corp');

    // WHEN: User changes sort order
    await page.getByTestId('sort-control').selectOption('nombre-asc');

    // THEN: The search input still contains the original query
    await expect(searchInput).toHaveValue('Corp');
  });
});

// ─── AC6: Default sort on initial load is "Más reciente" ─────────────────────

test.describe('AC6 — Default sort order on initial load is "Más reciente" (fecha-desc)', () => {
  test('should show SortControl with "Más reciente" selected on initial page load', async ({ page }) => {
    // GIVEN: No sort preference has been set
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([buildClienteStub()]),
      }),
    );

    // WHEN: User navigates to /clientes for the first time
    await page.goto('/clientes');

    // THEN: The SortControl has "fecha-desc" (Más reciente) as its selected value
    const sortControl = page.getByTestId('sort-control');
    await expect(sortControl).toBeVisible();
    await expect(sortControl).toHaveValue('fecha-desc');
  });

  test('should order newest client first on initial load', async ({ page }) => {
    // GIVEN: API returns two clients — older and newer
    const clientes = [
      buildClienteStub({ id: 'old', nombre: 'Empresa Antigua', createdAt: '2026-01-10T08:00:00Z' }),
      buildClienteStub({ id: 'new', nombre: 'Empresa Nueva', createdAt: '2026-06-20T08:00:00Z' }),
    ];
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      }),
    );

    // WHEN: User navigates to /clientes (no sort preference set)
    await page.goto('/clientes');

    // THEN: The newest client ("Empresa Nueva") appears first by default
    const items = page.getByTestId('cliente-list-item');
    await expect(items.first()).toContainText('Empresa Nueva');
  });
});

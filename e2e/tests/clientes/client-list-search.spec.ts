/**
 * E2E Tests — Story 2.1: Client List & Search
 * RED PHASE — Tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — /clientes shows scrollable list (280px panel) with Nombre + NIT/RUC per item
 *   AC2 — Real-time client-side search by Nombre or NIT/RUC (case-insensitive, < 1s with 500 records)
 *   AC3 — EmptyState shown when API returns empty array
 *   AC4 — ErrorPanel with "Reintentar" shown on network failure; retry triggers re-fetch
 *   AC5 — Clicking item highlights it (active state) and updates URL to /clientes/:clienteId
 *   AC6 — Single GET /api/v1/clientes on mount, cached under queryKey ['clientes']
 *   AC7 — Skeleton loader rendered while fetch is in-flight (no spinner)
 *
 * Required data-testid attributes (must be added during implementation):
 *   - clientes-view              → root wrapper of the /clientes page
 *   - cliente-list-view          → ClienteListView aside element
 *   - client-search-input        → search <input> in list panel
 *   - client-list-item-{id}      → each ClientListItem row
 *   - cliente-list-skeleton      → skeleton loader container
 *   - empty-state                → EmptyState component
 *   - error-panel                → ErrorPanel component
 *   - retry-button               → "Reintentar" button inside ErrorPanel
 *   - cliente-detail-placeholder → right panel placeholder div
 *
 * Network intercept strategy: ALWAYS intercept routes BEFORE navigation (network-first).
 */

import { test, expect } from '@playwright/test';
import { createClienteDto, createClienteDtos } from '../../support/factories/cliente.factory';

const API_CLIENTES = '**/api/v1/clientes';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — List rendering: left panel with clients
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Client list panel renders on /clientes', () => {
  test('should render the clientes-view wrapper with the list panel aside', async ({ page }) => {
    // GIVEN: Two clients exist in the system
    const clientes = createClienteDtos(2);

    // WHEN: Route is intercepted before navigation (network-first)
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clientes) })
    );
    await page.goto('/clientes');

    // THEN: The page wrapper and list panel are present
    await expect(page.getByTestId('clientes-view')).toBeVisible();
    await expect(page.getByTestId('cliente-list-view')).toBeVisible();
  });

  test('should render ClientListItem components for each client returned by the API', async ({ page }) => {
    // GIVEN: Three clients exist in the system
    const clientes = createClienteDtos(3);

    // WHEN: API returns the list and user navigates to /clientes
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clientes) })
    );
    await page.goto('/clientes');

    // THEN: Three client items are visible
    await expect(page.getByTestId(`client-list-item-${clientes[0].id}`)).toBeVisible();
    await expect(page.getByTestId(`client-list-item-${clientes[1].id}`)).toBeVisible();
    await expect(page.getByTestId(`client-list-item-${clientes[2].id}`)).toBeVisible();
  });

  test('should display client Nombre in each list item', async ({ page }) => {
    // GIVEN: A client with a specific Nombre
    const cliente = createClienteDto({ nombre: 'Empresa Visible SA' });

    // WHEN: The list renders
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.goto('/clientes');

    // THEN: The Nombre is visible inside the list item
    await expect(page.getByTestId(`client-list-item-${cliente.id}`)).toContainText('Empresa Visible SA');
  });

  test('should display client NIT/RUC in each list item', async ({ page }) => {
    // GIVEN: A client with a specific NIT
    const cliente = createClienteDto({ nit: '123456789' });

    // WHEN: The list renders
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.goto('/clientes');

    // THEN: The NIT is visible inside the list item
    await expect(page.getByTestId(`client-list-item-${cliente.id}`)).toContainText('123456789');
  });

  test('should render the list panel as an aside element (semantic HTML)', async ({ page }) => {
    // GIVEN: Clients exist
    const clientes = createClienteDtos(1);

    // WHEN: The page renders
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clientes) })
    );
    await page.goto('/clientes');

    // THEN: The list panel is an <aside> with aria-label="Lista de clientes"
    const aside = page.locator('aside[aria-label="Lista de clientes"]');
    await expect(aside).toBeVisible();
  });

  test('should render the list container as a listbox for accessibility', async ({ page }) => {
    // GIVEN: Clients exist
    const clientes = createClienteDtos(2);

    // WHEN: The list renders
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clientes) })
    );
    await page.goto('/clientes');

    // THEN: The <ul> has role="listbox"
    const listbox = page.locator('[role="listbox"]');
    await expect(listbox).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Real-time search filter (client-side, no new API call)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Real-time search filter', () => {
  test('should render the search input with correct placeholder text', async ({ page }) => {
    // GIVEN: Clients are loaded
    const clientes = createClienteDtos(1);

    // WHEN: The list panel renders
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clientes) })
    );
    await page.goto('/clientes');

    // THEN: The search input is visible with Spanish placeholder
    const searchInput = page.getByTestId('client-search-input');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', /buscar por nombre o nit/i);
  });

  test('should filter the list by Nombre when user types in the search input', async ({ page }) => {
    // GIVEN: Two clients with different names
    const match = createClienteDto({ nombre: 'Empresa Filtrar Esto' });
    const noMatch = createClienteDto({ nombre: 'Otra Empresa XYZ' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([match, noMatch]),
      })
    );
    await page.goto('/clientes');

    // WHEN: User types a partial Nombre into the search input
    await page.getByTestId('client-search-input').fill('Filtrar');

    // THEN: Only the matching client item is visible
    await expect(page.getByTestId(`client-list-item-${match.id}`)).toBeVisible();
    await expect(page.getByTestId(`client-list-item-${noMatch.id}`)).not.toBeVisible();
  });

  test('should filter the list by NIT/RUC when user types in the search input', async ({ page }) => {
    // GIVEN: Two clients with distinct NITs
    const match = createClienteDto({ nit: '555111222' });
    const noMatch = createClienteDto({ nit: '999888777' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([match, noMatch]),
      })
    );
    await page.goto('/clientes');

    // WHEN: User types a partial NIT
    await page.getByTestId('client-search-input').fill('555111');

    // THEN: Only the matching client item is visible
    await expect(page.getByTestId(`client-list-item-${match.id}`)).toBeVisible();
    await expect(page.getByTestId(`client-list-item-${noMatch.id}`)).not.toBeVisible();
  });

  test('should filter case-insensitively (lowercase input matches uppercase Nombre)', async ({ page }) => {
    // GIVEN: A client with a mixed-case Nombre
    const cliente = createClienteDto({ nombre: 'Empresa MAYUSCULAS' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.goto('/clientes');

    // WHEN: User types lowercase search term
    await page.getByTestId('client-search-input').fill('mayusculas');

    // THEN: The item is still visible (case-insensitive match)
    await expect(page.getByTestId(`client-list-item-${cliente.id}`)).toBeVisible();
  });

  test('should restore full list when search input is cleared', async ({ page }) => {
    // GIVEN: Two clients, one filtered out
    const clienteA = createClienteDto({ nombre: 'Alpha Corp' });
    const clienteB = createClienteDto({ nombre: 'Beta Industries' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([clienteA, clienteB]),
      })
    );
    await page.goto('/clientes');
    await page.getByTestId('client-search-input').fill('Alpha');
    await expect(page.getByTestId(`client-list-item-${clienteB.id}`)).not.toBeVisible();

    // WHEN: Search input is cleared
    await page.getByTestId('client-search-input').fill('');

    // THEN: Both clients are visible again
    await expect(page.getByTestId(`client-list-item-${clienteA.id}`)).toBeVisible();
    await expect(page.getByTestId(`client-list-item-${clienteB.id}`)).toBeVisible();
  });

  test('should NOT trigger a new API call when filtering (client-side only)', async ({ page }) => {
    // GIVEN: Initial GET returns client list
    const clientes = createClienteDtos(5);
    let apiCallCount = 0;

    await page.route(API_CLIENTES, (route) => {
      apiCallCount++;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      });
    });
    await page.goto('/clientes');

    // WHEN: User types in search
    await page.getByTestId('client-search-input').fill('empresa');
    await page.getByTestId('client-search-input').fill('emp');
    await page.getByTestId('client-search-input').fill('e');

    // THEN: Only the initial mount call was made (exactly 1)
    expect(apiCallCount).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — EmptyState when API returns empty array
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — EmptyState on empty client list', () => {
  test('should render the EmptyState component when API returns an empty array', async ({ page }) => {
    // GIVEN: No clients in the system (API returns [])
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: EmptyState component is displayed
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });

  test('should display Spanish guidance text in the EmptyState component', async ({ page }) => {
    // GIVEN: No clients (empty array)
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: Guidance message contains the expected Spanish text
    await expect(page.getByTestId('empty-state')).toContainText(/No hay clientes registrados/i);
  });

  test('should NOT render any ClientListItem when the list is empty', async ({ page }) => {
    // GIVEN: No clients (empty array)
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: No client list items exist in the DOM
    await expect(page.locator('[data-testid^="client-list-item-"]')).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — ErrorPanel on fetch failure + Reintentar retry
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — ErrorPanel on fetch failure', () => {
  test('should render the ErrorPanel component when the backend returns a 500 error', async ({ page }) => {
    // GIVEN: Backend is unavailable (returns 500)
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Error' }) })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: ErrorPanel is displayed instead of the client list
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('should render the ErrorPanel component on a network error', async ({ page }) => {
    // GIVEN: Network fails (connection refused simulation)
    await page.route(API_CLIENTES, (route) => route.abort('failed'));

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: ErrorPanel is displayed
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('should render a "Reintentar" button inside the ErrorPanel', async ({ page }) => {
    // GIVEN: Backend returns error
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: A "Reintentar" button is visible
    await expect(page.getByTestId('retry-button')).toBeVisible();
  });

  test('should trigger a new fetch when "Reintentar" button is clicked', async ({ page }) => {
    // GIVEN: First request fails, second succeeds
    let callCount = 0;
    const cliente = createClienteDto();

    await page.route(API_CLIENTES, (route) => {
      callCount++;
      if (callCount === 1) {
        return route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      });
    });

    await page.goto('/clientes');
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // WHEN: User clicks "Reintentar"
    await page.getByTestId('retry-button').click();

    // THEN: A second API call is made and the list renders
    await expect(page.getByTestId(`client-list-item-${cliente.id}`)).toBeVisible();
    expect(callCount).toBe(2);
  });

  test('should NOT render client list items when in error state', async ({ page }) => {
    // GIVEN: Backend error
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 503, contentType: 'application/json', body: '{}' })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: No client list items rendered
    await expect(page.locator('[data-testid^="client-list-item-"]')).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Click item: active highlight + URL update (/clientes/:clienteId)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Client item click: active state and URL navigation', () => {
  test('should update the URL to /clientes/:clienteId when a list item is clicked', async ({ page }) => {
    // GIVEN: A client exists in the list
    const cliente = createClienteDto({ id: '11111111-1111-1111-1111-111111111111' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.goto('/clientes');

    // WHEN: User clicks on the client list item
    await page.getByTestId(`client-list-item-${cliente.id}`).click();

    // THEN: URL changes to /clientes/:clienteId without full page reload
    await expect(page).toHaveURL(/\/clientes\/11111111-1111-1111-1111-111111111111/);
  });

  test('should apply aria-selected="true" to the clicked list item (active state)', async ({ page }) => {
    // GIVEN: A client exists in the list
    const cliente = createClienteDto({ id: '22222222-2222-2222-2222-222222222222' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.goto('/clientes');

    // WHEN: User clicks the client item
    await page.getByTestId(`client-list-item-${cliente.id}`).click();

    // THEN: The item has aria-selected="true" (accessible active state)
    await expect(page.getByTestId(`client-list-item-${cliente.id}`)).toHaveAttribute('aria-selected', 'true');
  });

  test('should NOT reload the full page when navigating to /clientes/:clienteId (client-side nav)', async ({ page }) => {
    // GIVEN: A client exists
    const cliente = createClienteDto({ id: '33333333-3333-3333-3333-333333333333' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.goto('/clientes');

    // Track navigation events — a full page reload triggers 'load' event
    let fullReloadDetected = false;
    page.on('load', () => { fullReloadDetected = true; });

    // Reset after initial load
    fullReloadDetected = false;

    // WHEN: User clicks the client item
    await page.getByTestId(`client-list-item-${cliente.id}`).click();
    await page.waitForURL(/\/clientes\//);

    // THEN: No full page reload occurred (client-side navigation)
    expect(fullReloadDetected).toBe(false);
  });

  test('should show the right panel placeholder when a client is selected', async ({ page }) => {
    // GIVEN: A client exists
    const cliente = createClienteDto({ id: '44444444-4444-4444-4444-444444444444' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) })
    );
    await page.goto('/clientes');

    // WHEN: User clicks the client item
    await page.getByTestId(`client-list-item-${cliente.id}`).click();

    // THEN: Detail placeholder (Story 2.2) is present
    await expect(page.getByTestId('cliente-detail-placeholder')).toBeVisible();
  });

  test('should deselect previous item and select new item when clicking a different client', async ({ page }) => {
    // GIVEN: Two clients exist
    const clienteA = createClienteDto({ id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' });
    const clienteB = createClienteDto({ id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' });

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([clienteA, clienteB]),
      })
    );
    await page.goto('/clientes');

    // WHEN: User clicks first client then second
    await page.getByTestId(`client-list-item-${clienteA.id}`).click();
    await page.getByTestId(`client-list-item-${clienteB.id}`).click();

    // THEN: Only clienteB is selected
    await expect(page.getByTestId(`client-list-item-${clienteB.id}`)).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId(`client-list-item-${clienteA.id}`)).toHaveAttribute('aria-selected', 'false');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Single GET /api/v1/clientes on mount, cached under ['clientes']
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Single API request on mount with TanStack Query caching', () => {
  test('should send exactly one GET /api/v1/clientes request when the page mounts', async ({ page }) => {
    // GIVEN: The clientes page is about to load
    const clientes = createClienteDtos(3);
    let getCallCount = 0;

    await page.route(API_CLIENTES, (route) => {
      getCallCount++;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      });
    });

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');
    // Wait for list to be fully rendered
    await expect(page.getByTestId(`client-list-item-${clientes[0].id}`)).toBeVisible();

    // THEN: Only one GET request was sent
    expect(getCallCount).toBe(1);
  });

  test('should NOT send additional GET requests when the search input is used', async ({ page }) => {
    // GIVEN: Initial load with 3 clients
    const clientes = createClienteDtos(3);
    let getCallCount = 0;

    await page.route(API_CLIENTES, (route) => {
      getCallCount++;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      });
    });
    await page.goto('/clientes');
    await expect(page.getByTestId(`client-list-item-${clientes[0].id}`)).toBeVisible();

    // WHEN: User searches multiple times
    await page.getByTestId('client-search-input').fill('test');
    await page.getByTestId('client-search-input').fill('empresa');
    await page.getByTestId('client-search-input').fill('');

    // THEN: Still only one GET request (cache hit)
    expect(getCallCount).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC7 — Skeleton loader while fetch is in-flight
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 — Skeleton loader during data fetch', () => {
  test('should render the skeleton loader while the API request is in flight', async ({ page }) => {
    // GIVEN: API is held pending via a deferred resolver (no hard wait — release-controlled)
    const clientes = createClienteDtos(3);
    let releaseRoute!: () => void;
    const routeHeld = new Promise<void>((resolve) => { releaseRoute = resolve; });

    await page.route(API_CLIENTES, async (route) => {
      await routeHeld; // blocks until released by the test
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      });
    });

    // WHEN: User navigates to /clientes (route is still held — loading state active)
    const gotoPromise = page.goto('/clientes');

    // THEN: Skeleton is visible before data arrives
    await expect(page.getByTestId('cliente-list-skeleton')).toBeVisible();

    // Cleanup: release the route and wait for navigation to complete
    releaseRoute();
    await gotoPromise;
  });

  test('should NOT render a spinner during loading (skeleton only, no spinner)', async ({ page }) => {
    // GIVEN: API is held pending via deferred resolver (no hard wait)
    let releaseRoute!: () => void;
    const routeHeld = new Promise<void>((resolve) => { releaseRoute = resolve; });

    await page.route(API_CLIENTES, async (route) => {
      await routeHeld;
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    // WHEN: User navigates to /clientes (loading state active)
    const gotoPromise = page.goto('/clientes');

    // THEN: No spinner element in the DOM while loading
    const spinner = page.locator('[role="progressbar"], .spinner, [data-testid="spinner"]');
    await expect(spinner).toHaveCount(0);

    // Cleanup
    releaseRoute();
    await gotoPromise;
  });

  test('should hide the skeleton loader once data is fully loaded', async ({ page }) => {
    // GIVEN: API returns clients after a brief delay
    const clientes = createClienteDtos(2);

    await page.route(API_CLIENTES, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clientes) })
    );

    // WHEN: User navigates and data loads
    await page.goto('/clientes');
    await expect(page.getByTestId(`client-list-item-${clientes[0].id}`)).toBeVisible();

    // THEN: Skeleton is no longer visible
    await expect(page.getByTestId('cliente-list-skeleton')).not.toBeVisible();
  });
});

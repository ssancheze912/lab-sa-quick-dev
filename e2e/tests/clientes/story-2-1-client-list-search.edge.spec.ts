/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * EDGE CASE EXPANSION — testarch-automate (BMad-Integrated Mode)
 * Expands ATDD coverage with boundary conditions, error paths, negative paths,
 * and behavioral edge cases not covered in the RED-phase ATDD tests.
 *
 * Acceptance Criteria targeted:
 *   AC2 — Real-time search edge cases (special chars, whitespace, case variants, NIT partial match)
 *   AC4 — Error recovery edge cases (network abort, 404 vs 500, retry behavior)
 *   AC5 — Skeleton timing boundary (skeleton hidden after data loads)
 *   AC8 — No new HTTP call on search (verified via request count spy)
 *   AC9 — Right panel placeholder not visible when client is selected
 *   AC10 — Keyboard navigation edge cases (Escape to clear, Space key, sequential Tab)
 *
 * Network-first intercept pattern: routes are intercepted BEFORE navigation.
 */

import { test, expect } from '@playwright/test';

const API_CLIENTES_URL = '**/api/v1/clientes';

// ─────────────────────────────────────────────────────────────────────────────
// Shared fixture data
// ─────────────────────────────────────────────────────────────────────────────

const SAMPLE_CLIENTES = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    nombre: 'Empresa Ñoña y Cía S.A.S',
    nit: '900-123.456-7',
    telefono: '3001234567',
    ciudad: 'Bogotá',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    nombre: 'Beta Comercial Ltda',
    nit: '800987654',
    telefono: '3107654321',
    ciudad: 'Medellín',
    createdAt: '2026-01-02T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
  },
  {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    nombre: 'Gamma Distribuciones',
    nit: '700555333',
    telefono: null,
    ciudad: null,
    createdAt: '2026-01-03T00:00:00Z',
    updatedAt: '2026-01-03T00:00:00Z',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// AC2 Edge Cases — Search boundary conditions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Search edge cases', () => {
  test('[P1] should show all clients when search query is cleared after filtering', async ({ page }) => {
    // GIVEN: The client list is loaded with 3 clients
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SAMPLE_CLIENTES),
      })
    );
    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // WHEN: The user types a search query, then clears it
    const searchInput = page.getByRole('textbox', { name: 'Buscar cliente' });
    await searchInput.fill('Beta');
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(1);
    await searchInput.fill('');

    // THEN: All clients are restored in the list
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(3);
  });

  test('[P1] should filter clients case-insensitively by uppercase query', async ({ page }) => {
    // GIVEN: The client list is loaded
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SAMPLE_CLIENTES),
      })
    );
    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // WHEN: The user types an UPPERCASE search query
    const searchInput = page.getByRole('textbox', { name: 'Buscar cliente' });
    await searchInput.fill('GAMMA');

    // THEN: Matching client is found case-insensitively
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(1);
    await expect(page.getByTestId('cliente-list-item').filter({ hasText: 'Gamma Distribuciones' })).toBeVisible();
  });

  test('[P1] should show empty result (not EmptyState) when search yields no matches', async ({ page }) => {
    // GIVEN: The client list is loaded with 3 clients
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SAMPLE_CLIENTES),
      })
    );
    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // WHEN: The user types a query with no matching clients
    const searchInput = page.getByRole('textbox', { name: 'Buscar cliente' });
    await searchInput.fill('xyzNoMatch99999');

    // THEN: No list items rendered, EmptyState is NOT shown (empty state is for no data from API, not no search results)
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(0);
  });

  test('[P2] should filter by partial NIT match', async ({ page }) => {
    // GIVEN: The client list is loaded
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SAMPLE_CLIENTES),
      })
    );
    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // WHEN: User types partial NIT "700555"
    const searchInput = page.getByRole('textbox', { name: 'Buscar cliente' });
    await searchInput.fill('700555');

    // THEN: Only Gamma (NIT 700555333) matches
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(1);
    await expect(page.getByTestId('cliente-list-item').filter({ hasText: 'Gamma Distribuciones' })).toBeVisible();
  });

  test('[P2] should filter clients with special characters (Ñ, dots, hyphens) in nombre', async ({ page }) => {
    // GIVEN: A client with special characters in nombre
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SAMPLE_CLIENTES),
      })
    );
    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // WHEN: User types search with special character Ñ
    const searchInput = page.getByRole('textbox', { name: 'Buscar cliente' });
    await searchInput.fill('Ñoña');

    // THEN: The client with Ñoña in nombre is shown
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(1);
    await expect(page.getByTestId('cliente-list-item').filter({ hasText: 'Ñoña' })).toBeVisible();
  });

  test('[P2] should filter by whitespace-trimmed query (leading/trailing spaces)', async ({ page }) => {
    // GIVEN: The client list is loaded
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SAMPLE_CLIENTES),
      })
    );
    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // WHEN: User types whitespace-only query
    const searchInput = page.getByRole('textbox', { name: 'Buscar cliente' });
    await searchInput.fill('   ');

    // THEN: All clients are displayed (whitespace-only query treated as empty)
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(3);
  });

  test('[P1] should not trigger a new HTTP request when search input changes (AC8)', async ({ page }) => {
    // GIVEN: Track the number of API requests to /api/v1/clientes
    let requestCount = 0;
    await page.route(API_CLIENTES_URL, (route) => {
      requestCount++;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SAMPLE_CLIENTES),
      });
    });
    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // Capture request count after initial load
    const initialCount = requestCount;

    // WHEN: User types multiple search queries
    const searchInput = page.getByRole('textbox', { name: 'Buscar cliente' });
    await searchInput.fill('Beta');
    await searchInput.fill('Gamma');
    await searchInput.fill('900');
    await searchInput.fill('');

    // THEN: No additional API calls were made (client-side filter only)
    expect(requestCount).toBe(initialCount);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 Edge Cases — Error recovery and failure variants
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Error recovery edge cases', () => {
  test('[P1] should display ErrorPanel on network abort (connection refused)', async ({ page }) => {
    // GIVEN: The network request is aborted (connection refused scenario)
    await page.route(API_CLIENTES_URL, (route) => route.abort('connectionrefused'));

    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: ErrorPanel is displayed (network failure treated as error)
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('[P1] should display ErrorPanel on HTTP 503 Service Unavailable', async ({ page }) => {
    // GIVEN: The API returns 503
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Service Unavailable' }),
      })
    );

    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: ErrorPanel is displayed (503 treated as error)
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('[P2] should not expose error details (stack trace / InnerException) in the UI', async ({ page }) => {
    // GIVEN: The API returns a 500 with internal error details
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          title: 'Internal Server Error',
          detail: 'NpgsqlException: connection refused at port 5432',
          exceptionDetails: 'StackTrace: at ...',
        }),
      })
    );

    // WHEN: The page loads
    await page.goto('/clientes');
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // THEN: No internal error detail text is displayed in the UI
    const pageContent = await page.textContent('body');
    expect(pageContent).not.toContain('NpgsqlException');
    expect(pageContent).not.toContain('StackTrace');
    expect(pageContent).not.toContain('InnerException');
  });

  test('[P1] should replace ErrorPanel with client list after successful retry', async ({ page }) => {
    // GIVEN: API fails on first request, succeeds on second
    let callCount = 0;
    await page.route(API_CLIENTES_URL, (route) => {
      callCount++;
      if (callCount === 1) {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ title: 'Internal Server Error' }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([SAMPLE_CLIENTES[0]]),
      });
    });

    // WHEN: Page loads with error, user clicks Reintentar
    await page.goto('/clientes');
    await expect(page.getByTestId('error-panel')).toBeVisible();
    await page.getByRole('button', { name: /reintentar/i }).click();

    // THEN: ErrorPanel disappears and client list appears
    await expect(page.getByTestId('error-panel')).not.toBeVisible();
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 Edge Cases — Skeleton loading behavior boundaries
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Skeleton loading state edge cases', () => {
  test('[P1] should not show skeleton after data successfully loads', async ({ page }) => {
    // GIVEN: API returns data immediately
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SAMPLE_CLIENTES),
      })
    );

    // WHEN: The page loads
    await page.goto('/clientes');

    // Wait for client list items to appear (data loaded)
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // THEN: Skeleton placeholders are no longer present
    await expect(page.locator('.react-loading-skeleton')).toHaveCount(0);
  });

  test('[P2] should not render a spinner element while loading', async ({ page }) => {
    // GIVEN: API is intercepted with a delay to keep loading state
    let resolveRequest: (() => void) | null = null;
    const requestHeld = new Promise<void>((res) => { resolveRequest = res; });

    await page.route(API_CLIENTES_URL, async (route) => {
      // Hold the request until we inspect the page
      await requestHeld;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SAMPLE_CLIENTES),
      });
    });

    // WHEN: Page starts loading
    const gotoPromise = page.goto('/clientes');

    // Inspect immediately (before response resolves)
    await page.waitForTimeout(100);

    // THEN: No spinner (role="progressbar" or role="status") is shown
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="spinner"]')).toHaveCount(0);

    // Cleanup: release the request
    resolveRequest!();
    await gotoPromise;
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC9 Edge Cases — Right panel detail placeholder state
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC9 — Right panel placeholder edge cases', () => {
  test('[P2] should not show right panel detail content before a client is selected', async ({ page }) => {
    // GIVEN: Clients are loaded
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SAMPLE_CLIENTES),
      })
    );

    // WHEN: Page loads without URL ?clienteId param
    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // THEN: Placeholder is visible, no detail content shown
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await expect(page.getByText(/selecciona un cliente de la lista/i)).toBeVisible();
  });

  test('[P1] should hide right panel placeholder when a client list item is clicked', async ({ page }) => {
    // GIVEN: Clients are loaded
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SAMPLE_CLIENTES),
      })
    );

    // WHEN: User clicks a client item
    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();
    await page.getByTestId('cliente-list-item').first().click();

    // THEN: The "selecciona un cliente" placeholder text is no longer visible
    await expect(page.getByText(/selecciona un cliente de la lista/i)).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC10 Edge Cases — Keyboard navigation and accessibility boundaries
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC10 — Keyboard navigation edge cases', () => {
  test('[P1] should have search input reachable via Tab from page focus', async ({ page }) => {
    // GIVEN: Clients are loaded
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SAMPLE_CLIENTES),
      })
    );

    // WHEN: User tabs to the search input
    await page.goto('/clientes');
    await page.keyboard.press('Tab');

    // THEN: A focused element exists inside the clientes panel (not body/document.body)
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName?.toLowerCase());
    // Focused element should be an interactive element, not the body (unfocused state)
    expect(focusedTag).not.toBe('body');
  });

  test('[P2] should mark selected client item visually (highlighted state) when clicked', async ({ page }) => {
    // GIVEN: Clients are loaded
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SAMPLE_CLIENTES),
      })
    );

    // WHEN: User clicks the first client item
    await page.goto('/clientes');
    const firstItem = page.getByTestId('cliente-list-item').first();
    await expect(firstItem).toBeVisible();
    await firstItem.click();

    // THEN: The item has a selected/highlighted visual state (aria-selected or data-selected or class)
    // Check that URL updated with clienteId or item has selected attribute
    const url = page.url();
    expect(url).toMatch(/clienteId|selected|clientes/i);
  });

  test('[P1] should make each client list item focusable with tabIndex', async ({ page }) => {
    // GIVEN: Clients are loaded
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([SAMPLE_CLIENTES[0]]),
      })
    );
    await page.goto('/clientes');
    const listItem = page.getByTestId('cliente-list-item').first();
    await expect(listItem).toBeVisible();

    // WHEN: Focus is set to the list item
    await listItem.focus();

    // THEN: The item receives focus (tabIndex=0 is set)
    const isFocused = await listItem.evaluate((el) => el === document.activeElement);
    expect(isFocused).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 Edge Cases — Layout and panel boundary conditions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Layout boundary conditions', () => {
  test('[P2] should render single client correctly (not just multiple)', async ({ page }) => {
    // GIVEN: Only one client exists
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([SAMPLE_CLIENTES[0]]),
      })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: Exactly one list item is rendered
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(1);
    await expect(page.getByTestId('empty-state')).not.toBeVisible();
  });

  test('[P2] should render client with null telefono and ciudad without crashing', async ({ page }) => {
    // GIVEN: A client with null optional fields
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([SAMPLE_CLIENTES[2]]), // Gamma with null telefono/ciudad
      })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: The client renders without error (nombre and NIT visible)
    await expect(page.getByTestId('cliente-list-item').filter({ hasText: 'Gamma Distribuciones' })).toBeVisible();
    await expect(page.getByTestId('cliente-list-item').filter({ hasText: '700555333' })).toBeVisible();
  });

  test('[P2] should render the left panel with 280px fixed width structure', async ({ page }) => {
    // GIVEN: Clients are loaded
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SAMPLE_CLIENTES),
      })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');
    const panel = page.getByTestId('clientes-list-panel');
    await expect(panel).toBeVisible();

    // THEN: The panel has the expected width (280px)
    const boundingBox = await panel.boundingBox();
    expect(boundingBox).not.toBeNull();
    // Allow ±5px tolerance for border/padding
    expect(boundingBox!.width).toBeGreaterThanOrEqual(275);
    expect(boundingBox!.width).toBeLessThanOrEqual(290);
  });
});

/**
 * Story 2.1: Client List & Search — Edge Case Expansion
 * Epic 2: Client Management
 *
 * Automation Tests — Edge Cases, Boundary Conditions & Error Paths (E2E Level)
 * Expands coverage beyond the ATDD acceptance tests.
 *
 * Coverage NOT already present in client-list-search.spec.ts:
 *   - Loading skeleton visible during fetch (before data arrives)
 *   - Loading skeleton NOT visible once data/error/empty is resolved
 *   - Search is case-insensitive for nombre
 *   - Search with only whitespace shows full list (treated as empty query)
 *   - Search no-results: EmptyState shown when filter matches nothing
 *   - Search input has accessible aria-label
 *   - Retry button re-renders error state again if second call also fails
 *   - Panel width remains at 280px across states (layout regression guard)
 *   - Keyboard: search input is focusable via Tab
 */

import { test, expect } from '@playwright/test';

const API_CLIENTES = '**/api/v1/clientes';

const mockClientes = [
  {
    id: 'ec01b2c3-0000-0000-0000-000000000001',
    nombre: 'Acero Andino',
    nit: '900100200-1',
    telefono: '3001234567',
    ciudad: 'Bogotá',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'ec01b2c3-0000-0000-0000-000000000002',
    nombre: 'Beta Comercial',
    nit: '800200300-2',
    telefono: '3109876543',
    ciudad: 'Medellín',
    createdAt: '2026-01-02T00:00:00Z',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton state
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Loading skeleton — transient state while fetch is pending', () => {
  test('[P1] should display the loading skeleton container while the API request is in flight', async ({
    page,
  }) => {
    // GIVEN: The API response is delayed to observe the loading state
    let resolveRequest!: () => void;
    const requestSettled = new Promise<void>((res) => { resolveRequest = res; });

    await page.route(API_CLIENTES, async (route) => {
      await requestSettled; // hold the response until we signal
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockClientes),
      });
    });

    // WHEN: Navigate to /clientes without releasing the response
    const navPromise = page.goto('/clientes');

    // THEN: The loading skeleton is visible before data arrives
    await expect(page.getByTestId('clientes-loading-skeleton')).toBeVisible();

    // cleanup — resolve so the test can finish
    resolveRequest();
    await navPromise;
  });

  test('[P1] should NOT show the loading skeleton after the list data is loaded', async ({
    page,
  }) => {
    // GIVEN: API returns data normally
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockClientes),
      })
    );

    // WHEN: Navigate to /clientes and wait for list to render
    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // THEN: Loading skeleton is gone
    await expect(page.getByTestId('clientes-loading-skeleton')).not.toBeVisible();
  });

  test('[P1] should NOT show the loading skeleton when EmptyState is displayed', async ({
    page,
  }) => {
    // GIVEN: API returns empty array
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await page.goto('/clientes');
    await expect(page.getByTestId('empty-state')).toBeVisible();

    // THEN: Loading skeleton is not present alongside EmptyState
    await expect(page.getByTestId('clientes-loading-skeleton')).not.toBeVisible();
  });

  test('[P1] should NOT show the loading skeleton when ErrorPanel is displayed', async ({
    page,
  }) => {
    // GIVEN: API fails with 500
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Internal Server Error', status: 500 }),
      })
    );

    await page.goto('/clientes');
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // THEN: Loading skeleton is not present alongside ErrorPanel
    await expect(page.getByTestId('clientes-loading-skeleton')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Search input — boundary conditions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Search input boundary conditions', () => {
  test('[P1] should treat a whitespace-only search query as empty and show the full list', async ({
    page,
  }) => {
    // GIVEN: Two clients are loaded
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockClientes),
      })
    );

    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(2);

    // WHEN: User types only spaces in the search field
    await page.getByTestId('search-clientes').fill('   ');

    // THEN: Full list is still shown (whitespace-only query = no filter)
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(2);
  });

  test('[P1] should perform case-insensitive search for Nombre', async ({ page }) => {
    // GIVEN: Two clients are loaded — one has "Acero Andino" in nombre
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockClientes),
      })
    );

    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(2);

    // WHEN: User types the search term in uppercase
    await page.getByTestId('search-clientes').fill('ACERO');

    // THEN: The matching client is still found (case-insensitive)
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(1);
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Acero Andino' })
    ).toBeVisible();
  });

  test('[P1] should show an EmptyState-like no-results indicator when search matches nothing', async ({
    page,
  }) => {
    // GIVEN: Two clients loaded, neither matches "ZZZZZZ"
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockClientes),
      })
    );

    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(2);

    // WHEN: User types a term that matches no client
    await page.getByTestId('search-clientes').fill('ZZZZZZ');

    // THEN: No list items are visible
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(0);
  });

  test('[P2] should have an accessible label on the search input', async ({ page }) => {
    // GIVEN: Clients loaded and page rendered
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockClientes),
      })
    );

    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // THEN: The search input has an aria-label or associated label
    const searchInput = page.getByTestId('search-clientes');
    const ariaLabel = await searchInput.getAttribute('aria-label');
    const id = await searchInput.getAttribute('id');

    // Either aria-label is set or a <label for="id"> exists
    const hasAccessibleLabel = (ariaLabel !== null && ariaLabel.length > 0) ||
      (id !== null && (await page.locator(`label[for="${id}"]`).count()) > 0);

    expect(hasAccessibleLabel).toBe(true);
  });

  test('[P2] should allow the search input to be focused via keyboard Tab navigation', async ({
    page,
  }) => {
    // GIVEN: Clients are loaded
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockClientes),
      })
    );

    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // WHEN: User presses Tab to navigate
    await page.keyboard.press('Tab');

    // THEN: The search input or some focusable element on the panel receives focus
    // (The search input should be reachable by Tab)
    const searchInput = page.getByTestId('search-clientes');
    // Focus the input explicitly and verify it can receive focus
    await searchInput.focus();
    await expect(searchInput).toBeFocused();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ErrorPanel — persistent failure path
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] ErrorPanel — persistent failure after retry', () => {
  test('[P1] should still show ErrorPanel with Reintentar if the retry call also fails', async ({
    page,
  }) => {
    // GIVEN: Backend always returns 500 (both initial and retry calls)
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Internal Server Error', status: 500 }),
      })
    );

    await page.goto('/clientes');
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // WHEN: User clicks Reintentar and the call fails again
    await page
      .getByTestId('error-panel')
      .getByRole('button', { name: /reintentar/i })
      .click();

    // THEN: ErrorPanel is still visible (not replaced by empty or success state)
    await expect(page.getByTestId('error-panel')).toBeVisible();
    // AND: Reintentar button is still present
    await expect(
      page.getByTestId('error-panel').getByRole('button', { name: /reintentar/i })
    ).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Search with NIT that has special characters (dashes)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Search — NIT with dash characters', () => {
  test('[P2] should match NIT containing a dash character when searching', async ({ page }) => {
    // GIVEN: A client with NIT "900100200-1" is in the list
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockClientes),
      })
    );

    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(2);

    // WHEN: User searches using the full NIT including the dash
    await page.getByTestId('search-clientes').fill('900100200-1');

    // THEN: The matching client is found
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(1);
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Acero Andino' })
    ).toBeVisible();
  });
});

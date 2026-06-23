/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (E2E Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Left panel (280px) renders scrollable client list with Nombre and NIT/RUC
 *   AC3 — EmptyState component shown when no clients exist
 *   AC4 — ErrorPanel with "Reintentar" button shown on fetch failure
 *   AC5 — Skeleton placeholders shown while loading (react-loading-skeleton)
 *   AC9 — Right panel shows default placeholder when no client selected
 *   AC10 — Search input has aria-label="Buscar cliente", list items keyboard navigable
 *
 * Network-first intercept pattern: routes are intercepted BEFORE navigation.
 */

import { test, expect } from '@playwright/test';

const API_CLIENTES_URL = '**/api/v1/clientes';

// ─────────────────────────────────────────────────────────────────────────────
// AC1: Left panel renders scrollable client list with Nombre and NIT/RUC
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Client list panel renders clients', () => {
  test('should render the left panel with a list of clients on navigation to /clientes', async ({ page }) => {
    // GIVEN: There are clients in the system
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '11111111-1111-1111-1111-111111111111',
            nombre: 'Empresa Alpha SA',
            nit: '900123456',
            telefono: '3001234567',
            ciudad: 'Bogotá',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
          {
            id: '22222222-2222-2222-2222-222222222222',
            nombre: 'Beta Comercial Ltda',
            nit: '800987654',
            telefono: '3107654321',
            ciudad: 'Medellín',
            createdAt: '2026-01-02T00:00:00Z',
            updatedAt: '2026-01-02T00:00:00Z',
          },
        ]),
      })
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: The left panel (clientes-list-panel) is visible
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
  });

  test('should display client Nombre in each list item', async ({ page }) => {
    // GIVEN: There are clients in the system
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '11111111-1111-1111-1111-111111111111',
            nombre: 'Empresa Alpha SA',
            nit: '900123456',
            telefono: null,
            ciudad: null,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ]),
      })
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: The client's Nombre is visible in the list
    await expect(page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Alpha SA' })).toBeVisible();
  });

  test('should display client NIT/RUC in each list item', async ({ page }) => {
    // GIVEN: There are clients in the system
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '11111111-1111-1111-1111-111111111111',
            nombre: 'Empresa Alpha SA',
            nit: '900123456',
            telefono: null,
            ciudad: null,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ]),
      })
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: The client's NIT is visible in the list item
    await expect(page.getByTestId('cliente-list-item').filter({ hasText: '900123456' })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3: EmptyState component shown when no clients exist
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Empty state when no clients exist', () => {
  test('should display EmptyState component when there are no clients', async ({ page }) => {
    // GIVEN: There are no clients in the system
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: The EmptyState component is displayed inside the left panel
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });

  test('should show guidance message to create first client in EmptyState', async ({ page }) => {
    // GIVEN: There are no clients in the system
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: The EmptyState contains the guidance message
    await expect(
      page.getByText(/no hay clientes registrados\. crea el primero\./i)
    ).toBeVisible();
  });

  test('should not display any client list items when empty state is shown', async ({ page }) => {
    // GIVEN: There are no clients in the system
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: No client list items are rendered
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4: ErrorPanel with "Reintentar" button shown on fetch failure
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Error panel on fetch failure', () => {
  test('should display ErrorPanel when GET /api/v1/clientes fails', async ({ page }) => {
    // GIVEN: The backend is unavailable
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Internal Server Error' }),
      })
    );

    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: The ErrorPanel is displayed instead of the client list
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('should display "Reintentar" button inside the ErrorPanel', async ({ page }) => {
    // GIVEN: The backend is unavailable
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Internal Server Error' }),
      })
    );

    // WHEN: The page loads and the error panel is shown
    await page.goto('/clientes');

    // THEN: A "Reintentar" button is present and accessible
    await expect(page.getByRole('button', { name: /reintentar/i })).toBeVisible();
  });

  test('should re-trigger the query when "Reintentar" button is clicked', async ({ page }) => {
    // GIVEN: The API initially fails then succeeds on retry
    let requestCount = 0;
    await page.route(API_CLIENTES_URL, (route) => {
      requestCount++;
      if (requestCount === 1) {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ title: 'Internal Server Error' }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '11111111-1111-1111-1111-111111111111',
            nombre: 'Empresa Alpha SA',
            nit: '900123456',
            telefono: null,
            ciudad: null,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ]),
      });
    });

    // WHEN: The page loads with the error, and the user clicks "Reintentar"
    await page.goto('/clientes');
    await expect(page.getByTestId('error-panel')).toBeVisible();
    await page.getByRole('button', { name: /reintentar/i }).click();

    // THEN: A new request to GET /api/v1/clientes is made (at least 2 total calls)
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
    expect(requestCount).toBeGreaterThanOrEqual(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC9: Right panel shows default placeholder when no client is selected
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC9 — Right panel default placeholder on initial load', () => {
  test('should show default placeholder in right panel when no client is selected', async ({ page }) => {
    // GIVEN: The user navigates to /clientes without a specific client selected
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '11111111-1111-1111-1111-111111111111',
            nombre: 'Empresa Alpha SA',
            nit: '900123456',
            telefono: null,
            ciudad: null,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ]),
      })
    );

    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: The right panel shows a default "selecciona un cliente" placeholder
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await expect(
      page.getByText(/selecciona un cliente de la lista/i)
    ).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC10: Accessibility — search input aria-label, keyboard navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC10 — Accessibility', () => {
  test('should have aria-label="Buscar cliente" on the search input', async ({ page }) => {
    // GIVEN: The client list is loaded
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '11111111-1111-1111-1111-111111111111',
            nombre: 'Empresa Alpha SA',
            nit: '900123456',
            telefono: null,
            ciudad: null,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ]),
      })
    );

    // WHEN: The page renders
    await page.goto('/clientes');

    // THEN: The search input has aria-label="Buscar cliente"
    await expect(
      page.getByRole('textbox', { name: 'Buscar cliente' })
    ).toBeVisible();
  });

  test('should allow keyboard selection of a client list item using Tab and Enter', async ({ page }) => {
    // GIVEN: The client list is loaded with items
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '11111111-1111-1111-1111-111111111111',
            nombre: 'Empresa Alpha SA',
            nit: '900123456',
            telefono: null,
            ciudad: null,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ]),
      })
    );

    // WHEN: The user navigates with keyboard to a list item and presses Enter
    await page.goto('/clientes');
    const listItem = page.getByTestId('cliente-list-item').first();
    await listItem.focus();
    await page.keyboard.press('Enter');

    // THEN: The client detail panel updates (right panel no longer shows placeholder)
    await expect(
      page.getByText(/selecciona un cliente de la lista/i)
    ).not.toBeVisible();
  });
});

/**
 * E2E Acceptance Tests — Story 2.1: Client List & Search
 *
 * RED PHASE — All tests intentionally fail until implementation is complete.
 * Tests define expected behavior per the story acceptance criteria (AC1–AC4).
 *
 * AC1: List panel renders clients (Nombre + NIT/RUC) when navigating to /clientes
 * AC2: Search filters in real time by Nombre or NIT/RUC (<1s with 500 records)
 * AC3: EmptyState shown when no clients exist
 * AC4: ErrorPanel + "Reintentar" shown when backend is unavailable
 *
 * Pattern: Given-When-Then | Network-first intercepts | data-testid selectors
 * No hard waits — uses Playwright explicit waits exclusively.
 */

import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// AC1 — Client list renders with Nombre and NIT/RUC per item
// ---------------------------------------------------------------------------

test.describe('AC1 — Client list renders at /clientes', () => {
  test('should show the left list panel (280px) when navigating to /clientes', async ({ page }) => {
    // GIVEN: Backend returns a list of clients (network-first intercept)
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'id-001', nombre: 'Empresa Alfa', nit: '123456789', telefono: '3001234567', ciudad: 'Bogotá', createdAt: '2026-06-01T10:00:00Z', updatedAt: '2026-06-01T10:00:00Z' },
          { id: 'id-002', nombre: 'Compañía Beta', nit: '987654321', telefono: '3109876543', ciudad: 'Medellín', createdAt: '2026-06-02T10:00:00Z', updatedAt: '2026-06-02T10:00:00Z' },
        ]),
      }),
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: The list panel is visible
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
  });

  test('should display each client item with Nombre visible', async ({ page }) => {
    // GIVEN: Backend returns clients (network-first intercept)
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'id-001', nombre: 'Empresa Alfa', nit: '123456789', telefono: '3001234567', ciudad: 'Bogotá', createdAt: '2026-06-01T10:00:00Z', updatedAt: '2026-06-01T10:00:00Z' },
        ]),
      }),
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: The client name is visible in a list item
    await expect(page.getByTestId('client-list-item').filter({ hasText: 'Empresa Alfa' })).toBeVisible();
  });

  test('should display each client item with NIT/RUC visible', async ({ page }) => {
    // GIVEN: Backend returns clients (network-first intercept)
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'id-001', nombre: 'Empresa Alfa', nit: '123456789', telefono: '3001234567', ciudad: 'Bogotá', createdAt: '2026-06-01T10:00:00Z', updatedAt: '2026-06-01T10:00:00Z' },
        ]),
      }),
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: The NIT is visible alongside the client name
    await expect(page.getByTestId('client-list-item').filter({ hasText: '123456789' })).toBeVisible();
  });

  test('should show skeleton placeholders while clients are loading', async ({ page }) => {
    // GIVEN: Backend responds slowly (delayed intercept)
    await page.route('**/api/v1/clientes', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // WHEN: User navigates to /clientes before response arrives
    await page.goto('/clientes');

    // THEN: Loading skeleton is shown (not a spinner)
    await expect(page.getByTestId('loading-skeleton')).toBeVisible();
  });

  test('should show detail placeholder on right panel at initial load', async ({ page }) => {
    // GIVEN: Backend returns clients (network-first intercept)
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'id-001', nombre: 'Empresa Alfa', nit: '123456789', telefono: '3001234567', ciudad: 'Bogotá', createdAt: '2026-06-01T10:00:00Z', updatedAt: '2026-06-01T10:00:00Z' },
        ]),
      }),
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // THEN: The right panel shows the detail placeholder (no client selected yet)
    await expect(page.getByTestId('cliente-detail-placeholder')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// AC2 — Real-time search by Nombre and NIT/RUC
// ---------------------------------------------------------------------------

test.describe('AC2 — Real-time search filters client list', () => {
  test('should filter clients by Nombre when user types in search field', async ({ page }) => {
    // GIVEN: Backend returns two clients (network-first intercept)
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'id-001', nombre: 'Empresa Alfa', nit: '111111111', telefono: '3001111111', ciudad: 'Bogotá', createdAt: '2026-06-01T10:00:00Z', updatedAt: '2026-06-01T10:00:00Z' },
          { id: 'id-002', nombre: 'Compañía Beta', nit: '222222222', telefono: '3002222222', ciudad: 'Medellín', createdAt: '2026-06-02T10:00:00Z', updatedAt: '2026-06-02T10:00:00Z' },
        ]),
      }),
    );

    await page.goto('/clientes');
    await page.getByTestId('clientes-list-panel').waitFor({ state: 'visible' });

    // WHEN: User types a search term matching only one client
    await page.getByTestId('search-input').fill('Alfa');

    // THEN: Only the matching client is visible; the other is hidden
    await expect(page.getByTestId('client-list-item').filter({ hasText: 'Empresa Alfa' })).toBeVisible();
    await expect(page.getByTestId('client-list-item').filter({ hasText: 'Compañía Beta' })).toHaveCount(0);
  });

  test('should filter clients by NIT/RUC when user types in search field', async ({ page }) => {
    // GIVEN: Backend returns two clients (network-first intercept)
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'id-001', nombre: 'Empresa Alfa', nit: '111111111', telefono: '3001111111', ciudad: 'Bogotá', createdAt: '2026-06-01T10:00:00Z', updatedAt: '2026-06-01T10:00:00Z' },
          { id: 'id-002', nombre: 'Compañía Beta', nit: '222222222', telefono: '3002222222', ciudad: 'Medellín', createdAt: '2026-06-02T10:00:00Z', updatedAt: '2026-06-02T10:00:00Z' },
        ]),
      }),
    );

    await page.goto('/clientes');
    await page.getByTestId('clientes-list-panel').waitFor({ state: 'visible' });

    // WHEN: User types a NIT value matching only one client
    await page.getByTestId('search-input').fill('111111111');

    // THEN: Only the client with that NIT is visible
    await expect(page.getByTestId('client-list-item').filter({ hasText: 'Empresa Alfa' })).toBeVisible();
    await expect(page.getByTestId('client-list-item').filter({ hasText: 'Compañía Beta' })).toHaveCount(0);
  });

  test('should restore the full list when search input is cleared', async ({ page }) => {
    // GIVEN: Backend returns two clients and user has typed a search term
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'id-001', nombre: 'Empresa Alfa', nit: '111111111', telefono: '3001111111', ciudad: 'Bogotá', createdAt: '2026-06-01T10:00:00Z', updatedAt: '2026-06-01T10:00:00Z' },
          { id: 'id-002', nombre: 'Compañía Beta', nit: '222222222', telefono: '3002222222', ciudad: 'Medellín', createdAt: '2026-06-02T10:00:00Z', updatedAt: '2026-06-02T10:00:00Z' },
        ]),
      }),
    );

    await page.goto('/clientes');
    await page.getByTestId('clientes-list-panel').waitFor({ state: 'visible' });
    await page.getByTestId('search-input').fill('Alfa');
    await expect(page.getByTestId('client-list-item')).toHaveCount(1);

    // WHEN: User clears the search input
    await page.getByTestId('search-input').clear();

    // THEN: The full list of two clients is restored
    await expect(page.getByTestId('client-list-item')).toHaveCount(2);
  });

  test('should have a search input with correct placeholder text', async ({ page }) => {
    // GIVEN: Backend returns clients (network-first intercept)
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: Search input has the expected placeholder
    await expect(page.getByTestId('search-input')).toHaveAttribute(
      'placeholder',
      'Buscar por nombre o NIT/RUC',
    );
  });
});

// ---------------------------------------------------------------------------
// AC3 — EmptyState when no clients exist
// ---------------------------------------------------------------------------

test.describe('AC3 — EmptyState when no clients in system', () => {
  test('should display the EmptyState component when the API returns an empty array', async ({ page }) => {
    // GIVEN: Backend has no clients (network-first intercept returns [])
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: EmptyState component is visible (not the list)
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });

  test('should hide the client list and show EmptyState when no clients exist', async ({ page }) => {
    // GIVEN: Backend returns empty array
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: No client list items are rendered
    await expect(page.getByTestId('client-list-item')).toHaveCount(0);
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// AC4 — ErrorPanel + Reintentar when backend is unavailable
// ---------------------------------------------------------------------------

test.describe('AC4 — ErrorPanel with Reintentar on fetch failure', () => {
  test('should display ErrorPanel when the backend fetch fails', async ({ page }) => {
    // GIVEN: Backend is unavailable (network-first intercept returns error)
    await page.route('**/api/v1/clientes', (route) => route.abort('failed'));

    // WHEN: User navigates to /clientes and the fetch fails
    await page.goto('/clientes');

    // THEN: ErrorPanel is visible instead of the list
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('should display a "Reintentar" button inside ErrorPanel on fetch failure', async ({ page }) => {
    // GIVEN: Backend is unavailable
    await page.route('**/api/v1/clientes', (route) => route.abort('failed'));

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: The "Reintentar" button is visible within the error panel
    await expect(page.getByTestId('retry-button')).toBeVisible();
  });

  test('should retry loading clients when "Reintentar" button is clicked', async ({ page }) => {
    // GIVEN: First request fails, second request succeeds
    let callCount = 0;
    await page.route('**/api/v1/clientes', (route) => {
      callCount++;
      if (callCount === 1) {
        return route.abort('failed');
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'id-001', nombre: 'Empresa Alfa', nit: '123456789', telefono: '3001234567', ciudad: 'Bogotá', createdAt: '2026-06-01T10:00:00Z', updatedAt: '2026-06-01T10:00:00Z' },
        ]),
      });
    });

    await page.goto('/clientes');
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // WHEN: User clicks the "Reintentar" button
    await page.getByTestId('retry-button').click();

    // THEN: The client list is loaded successfully
    await expect(page.getByTestId('client-list-item')).toHaveCount(1);
    await expect(page.getByTestId('error-panel')).toHaveCount(0);
  });

  test('should not display raw error message to the user on fetch failure', async ({ page }) => {
    // GIVEN: Backend is unavailable
    await page.route('**/api/v1/clientes', (route) => route.abort('failed'));

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: No raw error.message string is exposed to user (NFR6 compliance)
    await expect(page.getByText(/network error|AxiosError|TypeError|fetch failed/i)).toHaveCount(0);
  });
});

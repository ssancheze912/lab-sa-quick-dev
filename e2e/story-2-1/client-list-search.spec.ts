/**
 * Story 2.1: Client List & Search
 * ATDD — RED Phase (Tests intentionally failing — no implementation yet)
 *
 * Acceptance Criteria covered:
 * - AC1: Left panel (280px) renders scrollable list with Nombre + NIT/RUC per item
 * - AC2: Search field filters in real time (case-insensitive, < 1 second with 500 records)
 * - AC3: Empty state shown when API returns empty array
 * - AC4: ErrorPanel shown on backend failure; "Reintentar" triggers refetch
 * - AC5: Right panel stays in placeholder state when no client is selected; URL stays at /clientes
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
  const ts = new Date().toISOString();
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    nombre: 'Empresa Ejemplo S.A.',
    nit: '900123456-7',
    telefono: '6011234567',
    ciudad: 'Bogotá',
    createdAt: ts,
    updatedAt: ts,
    ...overrides,
  };
}

// ─── AC1: Left panel renders client list ─────────────────────────────────────

test.describe('AC1 — Lista de clientes en panel izquierdo', () => {
  test('should render the left list panel with fixed 280px width when clients exist', async ({ page }) => {
    // GIVEN: API returns a list with one client
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([buildClienteStub()]),
      }),
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: The left list panel is visible
    const listPanel = page.getByTestId('clientes-list-panel');
    await expect(listPanel).toBeVisible();
  });

  test('should display client Nombre in each list item', async ({ page }) => {
    // GIVEN: API returns a client with a known nombre
    const cliente = buildClienteStub({ nombre: 'Acme Corp' });
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: The client nombre is visible in the list
    const item = page.getByTestId('cliente-list-item').first();
    await expect(item).toContainText('Acme Corp');
  });

  test('should display client NIT/RUC in each list item', async ({ page }) => {
    // GIVEN: API returns a client with a known NIT
    const cliente = buildClienteStub({ nit: '900999888-1' });
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: The client NIT is visible in the list
    const item = page.getByTestId('cliente-list-item').first();
    await expect(item).toContainText('900999888-1');
  });

  test('should render a scrollable list container', async ({ page }) => {
    // GIVEN: API returns clients
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([buildClienteStub()]),
      }),
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: The list container exists and supports vertical scrolling
    const listContainer = page.getByTestId('clientes-list-container');
    await expect(listContainer).toBeVisible();
  });

  test('should render the search input field', async ({ page }) => {
    // GIVEN: API returns clients
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([buildClienteStub()]),
      }),
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: The search input is rendered with an accessible aria-label
    const searchInput = page.getByTestId('clientes-search-input');
    await expect(searchInput).toBeVisible();
  });
});

// ─── AC2: Real-time search filtering ─────────────────────────────────────────

test.describe('AC2 — Filtrado en tiempo real por nombre o NIT/RUC', () => {
  test('should filter list by nombre when user types in search field', async ({ page }) => {
    // GIVEN: API returns two clients with different nombres
    const clientes = [
      buildClienteStub({ id: '1', nombre: 'Inversiones Beta', nit: '111111111-1' }),
      buildClienteStub({ id: '2', nombre: 'Constructora Alfa', nit: '222222222-2' }),
    ];
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      }),
    );
    await page.goto('/clientes');

    // WHEN: User types a nombre substring in the search field
    const searchInput = page.getByTestId('clientes-search-input');
    await searchInput.fill('Beta');

    // THEN: Only the matching client is shown
    const items = page.getByTestId('cliente-list-item');
    await expect(items).toHaveCount(1);
    await expect(items.first()).toContainText('Inversiones Beta');
  });

  test('should filter list by NIT when user types in search field', async ({ page }) => {
    // GIVEN: API returns two clients with different NITs
    const clientes = [
      buildClienteStub({ id: '1', nombre: 'Empresa Uno', nit: '900111222-3' }),
      buildClienteStub({ id: '2', nombre: 'Empresa Dos', nit: '800333444-5' }),
    ];
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      }),
    );
    await page.goto('/clientes');

    // WHEN: User types a NIT substring in the search field
    const searchInput = page.getByTestId('clientes-search-input');
    await searchInput.fill('800333');

    // THEN: Only the matching client is shown
    const items = page.getByTestId('cliente-list-item');
    await expect(items).toHaveCount(1);
    await expect(items.first()).toContainText('Empresa Dos');
  });

  test('should perform case-insensitive filtering by nombre', async ({ page }) => {
    // GIVEN: API returns a client with mixed-case nombre
    const clientes = [buildClienteStub({ nombre: 'Tecnologías Avanzadas' })];
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      }),
    );
    await page.goto('/clientes');

    // WHEN: User types a lowercase substring
    const searchInput = page.getByTestId('clientes-search-input');
    await searchInput.fill('tecnologías');

    // THEN: The client is still visible (case-insensitive match)
    const items = page.getByTestId('cliente-list-item');
    await expect(items).toHaveCount(1);
  });

  test('should show all clients when search field is cleared', async ({ page }) => {
    // GIVEN: API returns two clients; user had previously filtered
    const clientes = [
      buildClienteStub({ id: '1', nombre: 'Alpha', nit: '111-1' }),
      buildClienteStub({ id: '2', nombre: 'Beta', nit: '222-2' }),
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
    await searchInput.fill('Alpha');

    // WHEN: User clears the search field
    await searchInput.clear();

    // THEN: All clients are shown again
    const items = page.getByTestId('cliente-list-item');
    await expect(items).toHaveCount(2);
  });

  test('should show empty result set when search text matches no client', async ({ page }) => {
    // GIVEN: API returns clients; none match the search term
    const clientes = [buildClienteStub({ nombre: 'Empresa XYZ', nit: '123-4' })];
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      }),
    );
    await page.goto('/clientes');

    // WHEN: User types a term that matches nothing
    const searchInput = page.getByTestId('clientes-search-input');
    await searchInput.fill('ZZZNOMATCH');

    // THEN: The list has zero items
    const items = page.getByTestId('cliente-list-item');
    await expect(items).toHaveCount(0);
  });
});

// ─── AC3: Empty state when no clients ─────────────────────────────────────────

test.describe('AC3 — Estado vacío cuando no hay clientes', () => {
  test('should display EmptyState component when API returns empty array', async ({ page }) => {
    // GIVEN: API returns empty array
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: EmptyState component is displayed
    const emptyState = page.getByTestId('empty-state');
    await expect(emptyState).toBeVisible();
  });

  test('should display a Spanish guidance message in the EmptyState', async ({ page }) => {
    // GIVEN: API returns empty array
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: EmptyState contains a Spanish message guiding user to create first client
    const emptyState = page.getByTestId('empty-state');
    await expect(emptyState).toContainText(/cliente/i);
  });

  test('should still render search field and list container when empty', async ({ page }) => {
    // GIVEN: API returns empty array
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: Search input is still rendered
    const searchInput = page.getByTestId('clientes-search-input');
    await expect(searchInput).toBeVisible();
  });
});

// ─── AC4: Error state and retry ────────────────────────────────────────────────

test.describe('AC4 — ErrorPanel y botón Reintentar en fallo de red', () => {
  test('should display ErrorPanel when API returns 500', async ({ page }) => {
    // GIVEN: API returns a 500 server error
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ status: 500, title: 'Internal Server Error' }),
      }),
    );

    // WHEN: User navigates to /clientes and fetch fails
    await page.goto('/clientes');

    // THEN: ErrorPanel component is displayed
    const errorPanel = page.getByTestId('error-panel');
    await expect(errorPanel).toBeVisible();
  });

  test('should display ErrorPanel when API call fails with network error', async ({ page }) => {
    // GIVEN: API call results in a network error (connection refused)
    await page.route(API_CLIENTES, (route) => route.abort('connectionrefused'));

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: ErrorPanel component is displayed
    const errorPanel = page.getByTestId('error-panel');
    await expect(errorPanel).toBeVisible();
  });

  test('should display a "Reintentar" button inside ErrorPanel', async ({ page }) => {
    // GIVEN: API returns 500
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ status: 500, title: 'Internal Server Error' }),
      }),
    );

    // WHEN: User navigates to /clientes and sees ErrorPanel
    await page.goto('/clientes');

    // THEN: A "Reintentar" button is present inside the error panel
    const retryButton = page.getByTestId('error-panel-retry-button');
    await expect(retryButton).toBeVisible();
  });

  test('should trigger a new fetch when "Reintentar" button is clicked', async ({ page }) => {
    // GIVEN: First API call fails with 500; second returns data
    let callCount = 0;
    await page.route(API_CLIENTES, (route) => {
      callCount++;
      if (callCount === 1) {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ status: 500, title: 'Internal Server Error' }),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([buildClienteStub({ nombre: 'Cliente Recuperado' })]),
        });
      }
    });

    // WHEN: User navigates, sees ErrorPanel, then clicks Reintentar
    await page.goto('/clientes');
    const retryButton = page.getByTestId('error-panel-retry-button');
    await expect(retryButton).toBeVisible();
    await retryButton.click();

    // THEN: The list now shows the client from the successful second fetch
    const item = page.getByTestId('cliente-list-item').first();
    await expect(item).toContainText('Cliente Recuperado');
  });
});

// ─── AC5: Right panel placeholder when no client selected ────────────────────

test.describe('AC5 — Panel derecho en estado placeholder sin cliente seleccionado', () => {
  test('should show right panel placeholder when no client is selected', async ({ page }) => {
    // GIVEN: API returns clients
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([buildClienteStub()]),
      }),
    );

    // WHEN: User navigates to /clientes without selecting a client
    await page.goto('/clientes');

    // THEN: Right panel shows placeholder state (no client detail rendered)
    const detailPanel = page.getByTestId('cliente-detail-panel');
    await expect(detailPanel).toBeVisible();
  });

  test('should not render client detail content when no client is selected', async ({ page }) => {
    // GIVEN: API returns clients
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([buildClienteStub()]),
      }),
    );

    // WHEN: User navigates to /clientes without selecting a client
    await page.goto('/clientes');

    // THEN: No client detail content is present
    const clientDetail = page.getByTestId('cliente-detail-content');
    await expect(clientDetail).not.toBeVisible();
  });

  test('should keep URL at /clientes without a client ID segment when none is selected', async ({ page }) => {
    // GIVEN: API returns clients
    await page.route(API_CLIENTES, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([buildClienteStub()]),
      }),
    );

    // WHEN: User navigates to /clientes and does not select a client
    await page.goto('/clientes');

    // THEN: The URL remains at /clientes with no client ID appended
    await expect(page).toHaveURL(/\/clientes$/);
  });
});

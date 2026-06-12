/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (E2E Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Client list displayed in left panel (280px) with Nombre and NIT/RUC per item
 *   AC2 — Real-time search by Nombre or NIT/RUC, results < 1s with up to 500 records
 *   AC3 — EmptyState (variant: no-clients) when no clients exist
 *   AC4 — EmptyState (variant: search-empty) with "No se encontró ningún cliente" when search yields no matches
 *   AC5 — ErrorPanel with "Reintentar" button when backend is unavailable
 *   AC6 — Skeleton placeholders shown during initial fetch (not a spinner)
 *   AC7 — Amber badge (⚠) on list item when contactCount === 0
 *   AC8 — Item becomes visually selected (left border primary-600, bg primary-50) and right panel loads
 */

import { test, expect } from '@playwright/test';
import { buildCliente } from '../../../factories/cliente.factory';

const API_URL = '**/api/v1/clientes';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Client list displayed in left panel with Nombre and NIT/RUC per item
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Client list displayed in left panel', () => {
  test('should display the left panel with fixed 280px width on desktop', async ({ page }) => {
    // GIVEN: Clients exist in the system
    const clientes = [buildCliente(), buildCliente()];

    // CRITICAL: Intercept routes BEFORE navigation (network-first pattern)
    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      }),
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: The left panel is visible and has correct 280px width on desktop
    const listPanel = page.getByTestId('clientes-list-panel');
    await expect(listPanel).toBeVisible();
    const box = await listPanel.boundingBox();
    expect(box?.width).toBe(280);
  });

  test('should display each client item with Nombre visible', async ({ page }) => {
    // GIVEN: Clients exist in the system
    const cliente = buildCliente({ nombre: 'Acme Colombia SAS' });

    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: The client item displays the Nombre
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Acme Colombia SAS' }),
    ).toBeVisible();
  });

  test('should display each client item with NIT/RUC visible', async ({ page }) => {
    // GIVEN: Clients exist in the system
    const cliente = buildCliente({ nit: '900123456' });

    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: The client item displays the NIT/RUC
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: '900123456' }),
    ).toBeVisible();
  });

  test('should render a scrollable client list when there are multiple clients', async ({ page }) => {
    // GIVEN: Multiple clients exist
    const clientes = Array.from({ length: 10 }, (_, i) =>
      buildCliente({ nombre: `Empresa ${i + 1}` }),
    );

    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      }),
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: All client items are in the list panel (scrollable)
    const listPanel = page.getByTestId('clientes-list-panel');
    await expect(listPanel).toBeVisible();
    const items = page.getByTestId('cliente-list-item');
    await expect(items).toHaveCount(10);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Real-time search by Nombre or NIT/RUC
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Real-time search filters the client list', () => {
  test('should display the search input with correct placeholder', async ({ page }) => {
    // GIVEN: The client list is loaded
    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([buildCliente()]),
      }),
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: Search input is visible with correct placeholder in Spanish
    const searchInput = page.getByRole('searchbox', { name: /buscar clientes/i });
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', 'Buscar por nombre o NIT...');
  });

  test('should filter list in real time when user types a name match', async ({ page }) => {
    // GIVEN: Multiple clients exist
    const clienteA = buildCliente({ nombre: 'Acme Colombia SAS', nit: '111111111' });
    const clienteB = buildCliente({ nombre: 'Beta Corp Ltda', nit: '222222222' });

    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([clienteA, clienteB]),
      }),
    );

    await page.goto('/clientes');

    // WHEN: The user types a search term matching only one client
    const searchInput = page.getByRole('searchbox', { name: /buscar clientes/i });
    await searchInput.fill('Acme');

    // THEN: Only the matching client is visible
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Acme Colombia SAS' }),
    ).toBeVisible();
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Beta Corp' }),
    ).not.toBeVisible();
  });

  test('should filter list in real time when user types a NIT match', async ({ page }) => {
    // GIVEN: Multiple clients exist
    const clienteA = buildCliente({ nombre: 'Acme Colombia SAS', nit: '900123456' });
    const clienteB = buildCliente({ nombre: 'Beta Corp Ltda', nit: '800999888' });

    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([clienteA, clienteB]),
      }),
    );

    await page.goto('/clientes');

    // WHEN: The user types a NIT in the search field
    const searchInput = page.getByRole('searchbox', { name: /buscar clientes/i });
    await searchInput.fill('900123456');

    // THEN: Only the matching client by NIT is visible
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Acme Colombia SAS' }),
    ).toBeVisible();
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Beta Corp' }),
    ).not.toBeVisible();
  });

  test('should search be case-insensitive for Nombre', async ({ page }) => {
    // GIVEN: A client named "Acme Colombia SAS"
    const cliente = buildCliente({ nombre: 'Acme Colombia SAS' });

    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );

    await page.goto('/clientes');

    // WHEN: The user types a lowercase version of the name
    const searchInput = page.getByRole('searchbox', { name: /buscar clientes/i });
    await searchInput.fill('acme colombia');

    // THEN: The matching client is still visible (case-insensitive)
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Acme Colombia SAS' }),
    ).toBeVisible();
  });

  test('should wrap search input in a role=search container', async ({ page }) => {
    // GIVEN: The client list is loaded
    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([buildCliente()]),
      }),
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: There is a search landmark container wrapping the input
    await expect(page.getByRole('search', { name: /buscar clientes/i })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — EmptyState (no-clients) when no clients exist
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — EmptyState displayed when no clients exist', () => {
  test('should display EmptyState no-clients when client list is empty and no search is active', async ({
    page,
  }) => {
    // GIVEN: No clients exist in the system
    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: EmptyState with variant no-clients is shown
    const emptyState = page.getByTestId('empty-state-no-clients');
    await expect(emptyState).toBeVisible();
  });

  test('should display "No hay clientes registrados" title in empty state (no-clients)', async ({
    page,
  }) => {
    // GIVEN: No clients exist
    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: The empty state shows the correct title
    await expect(page.getByText('No hay clientes registrados')).toBeVisible();
  });

  test('should display "Nuevo cliente" CTA in no-clients empty state', async ({ page }) => {
    // GIVEN: No clients exist
    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: A CTA button "Nuevo cliente" is visible
    await expect(page.getByRole('button', { name: /nuevo cliente/i })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — EmptyState (search-empty) when search yields no results
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — EmptyState (search-empty) when search yields no matches', () => {
  test('should display EmptyState search-empty when search term has no matches', async ({ page }) => {
    // GIVEN: Clients exist but search term will not match any
    const cliente = buildCliente({ nombre: 'Empresa ABC', nit: '100200300' });

    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );

    await page.goto('/clientes');

    // WHEN: The user types a search term that matches nothing
    const searchInput = page.getByRole('searchbox', { name: /buscar clientes/i });
    await searchInput.fill('XXXXXXXXXXXXXXXXXX');

    // THEN: EmptyState search-empty variant is displayed
    const emptyState = page.getByTestId('empty-state-search-empty');
    await expect(emptyState).toBeVisible();
  });

  test('should display "No se encontró ningún cliente" in search-empty state', async ({ page }) => {
    // GIVEN: Clients exist but search will yield no matches
    const cliente = buildCliente({ nombre: 'Empresa ABC' });

    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );

    await page.goto('/clientes');

    // WHEN: The user types a non-matching search
    await page.getByRole('searchbox', { name: /buscar clientes/i }).fill('XXXXXXXXXX');

    // THEN: The correct message is shown
    await expect(page.getByText('No se encontró ningún cliente')).toBeVisible();
  });

  test('should display "Crear cliente" CTA in search-empty state', async ({ page }) => {
    // GIVEN: Clients exist but search will yield no matches
    const cliente = buildCliente({ nombre: 'Empresa ABC' });

    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );

    await page.goto('/clientes');

    // WHEN: The user types a non-matching search
    await page.getByRole('searchbox', { name: /buscar clientes/i }).fill('XXXXXXXXXX');

    // THEN: "Crear cliente" CTA is visible
    await expect(page.getByRole('button', { name: /crear cliente/i })).toBeVisible();
  });

  test('should restore client list when search field is cleared', async ({ page }) => {
    // GIVEN: A client exists and search was applied
    const cliente = buildCliente({ nombre: 'Empresa ABC', nit: '100200300' });

    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );

    await page.goto('/clientes');
    const searchInput = page.getByRole('searchbox', { name: /buscar clientes/i });
    await searchInput.fill('XXXXXXXXXX');
    await expect(page.getByTestId('empty-state-search-empty')).toBeVisible();

    // WHEN: The user clears the search field
    await searchInput.clear();

    // THEN: The full client list is restored
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa ABC' }),
    ).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — ErrorPanel when backend is unavailable
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — ErrorPanel displayed when backend fetch fails', () => {
  test('should display ErrorPanel when GET /api/v1/clientes returns a server error', async ({
    page,
  }) => {
    // GIVEN: The backend is unavailable
    // CRITICAL: Intercept BEFORE navigation
    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Internal Server Error', status: 500 }),
      }),
    );

    // WHEN: The user navigates to /clientes and the fetch fails
    await page.goto('/clientes');

    // THEN: ErrorPanel is displayed instead of the list
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('should display "No se pudo cargar la lista de clientes" in ErrorPanel', async ({ page }) => {
    // GIVEN: The backend is unavailable
    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Service Unavailable', status: 503 }),
      }),
    );

    // WHEN: The user navigates to /clientes and the fetch fails
    await page.goto('/clientes');

    // THEN: Error message text is correct
    await expect(page.getByText('No se pudo cargar la lista de clientes')).toBeVisible();
  });

  test('should display "Intentar de nuevo" retry button in ErrorPanel', async ({ page }) => {
    // GIVEN: The backend is unavailable
    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Internal Server Error', status: 500 }),
      }),
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: "Intentar de nuevo" retry button is visible
    await expect(page.getByRole('button', { name: /intentar de nuevo/i })).toBeVisible();
  });

  test('should retry and show client list when "Intentar de nuevo" is clicked after recovery', async ({
    page,
  }) => {
    // GIVEN: First fetch fails, second succeeds
    const cliente = buildCliente();
    let requestCount = 0;

    await page.route(API_URL, (route) => {
      requestCount++;
      if (requestCount === 1) {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ title: 'Internal Server Error', status: 500 }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      });
    });

    await page.goto('/clientes');
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // WHEN: The user clicks "Intentar de nuevo"
    await page.getByRole('button', { name: /intentar de nuevo/i }).click();

    // THEN: The client list is now visible
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: cliente.nombre }),
    ).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Skeleton placeholders shown during initial fetch (not a spinner)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Skeleton placeholders shown while client list is loading', () => {
  test('should show skeleton placeholders (not a spinner) while fetch is in-flight', async ({
    page,
  }) => {
    // GIVEN: The fetch is in-flight (delayed response)
    let resolveRoute: ((value: unknown) => void) | null = null;
    const routeHeld = new Promise((resolve) => {
      resolveRoute = resolve;
    });

    // CRITICAL: Intercept BEFORE navigation
    await page.route(API_URL, async (route) => {
      await routeHeld; // Hold the response
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([buildCliente()]),
      });
    });

    // WHEN: The user navigates to /clientes before the fetch completes
    await page.goto('/clientes');

    // THEN: Skeleton placeholders are shown (not a spinner)
    await expect(page.getByTestId('client-list-skeleton')).toBeVisible();
    await expect(page.getByRole('status', { name: /cargando/i })).not.toBeVisible();

    // Cleanup: resolve the pending route
    resolveRoute!(null);
  });

  test('should set aria-busy="true" on list panel while loading', async ({ page }) => {
    // GIVEN: The fetch is in-flight (delayed response)
    let resolveRoute: ((value: unknown) => void) | null = null;
    const routeHeld = new Promise((resolve) => {
      resolveRoute = resolve;
    });

    await page.route(API_URL, async (route) => {
      await routeHeld;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([buildCliente()]),
      });
    });

    // WHEN: The user navigates to /clientes before the fetch completes
    await page.goto('/clientes');

    // THEN: The list panel has aria-busy="true"
    const listPanel = page.getByTestId('clientes-list-panel');
    await expect(listPanel).toHaveAttribute('aria-busy', 'true');

    resolveRoute!(null);
  });

  test('should replace skeleton with client list once fetch completes', async ({ page }) => {
    // GIVEN: Fetch completes with client data
    const cliente = buildCliente({ nombre: 'Empresa Cargada' });

    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );

    // WHEN: The user navigates to /clientes and fetch completes
    await page.goto('/clientes');

    // THEN: Skeleton is gone and the real list item is visible
    await expect(page.getByTestId('client-list-skeleton')).not.toBeVisible();
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Cargada' }),
    ).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC7 — Amber ⚠ badge shown when contactCount === 0
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 — Amber badge shown for clients with zero contacts', () => {
  test('should display amber ⚠ badge for a client with contactCount 0', async ({ page }) => {
    // GIVEN: A client with zero associated contacts
    const clienteConSinContactos = buildCliente({ contactCount: 0 });

    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([clienteConSinContactos]),
      }),
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: The amber ⚠ badge is visible on the client item
    const clienteItem = page
      .getByTestId('cliente-list-item')
      .filter({ hasText: clienteConSinContactos.nombre });
    await expect(clienteItem.getByTestId('sin-contactos-badge')).toBeVisible();
  });

  test('should show "Sin contactos asignados" tooltip on the amber badge', async ({ page }) => {
    // GIVEN: A client with zero contacts
    const clienteSinContactos = buildCliente({ contactCount: 0 });

    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([clienteSinContactos]),
      }),
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: The badge has title "Sin contactos asignados" for accessibility
    const badge = page
      .getByTestId('cliente-list-item')
      .filter({ hasText: clienteSinContactos.nombre })
      .getByTestId('sin-contactos-badge');
    await expect(badge).toHaveAttribute('title', 'Sin contactos asignados');
  });

  test('should NOT display amber ⚠ badge for a client with one or more contacts', async ({
    page,
  }) => {
    // GIVEN: A client with at least one contact
    const clienteConContacto = buildCliente({ contactCount: 3 });

    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([clienteConContacto]),
      }),
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: No amber badge is shown
    const clienteItem = page
      .getByTestId('cliente-list-item')
      .filter({ hasText: clienteConContacto.nombre });
    await expect(clienteItem.getByTestId('sin-contactos-badge')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC8 — Client item becomes selected and right panel loads
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC8 — Client item selection and right panel loading', () => {
  test('should apply selected visual state (aria-selected=true) when a client is clicked', async ({
    page,
  }) => {
    // GIVEN: The client list is displayed
    const cliente = buildCliente({ nombre: 'Empresa Seleccionada' });

    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );

    await page.goto('/clientes');

    // WHEN: The user clicks on a client item
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Seleccionada' }).click();

    // THEN: The item is marked as selected (aria-selected or data-selected)
    const item = page
      .getByTestId('cliente-list-item')
      .filter({ hasText: 'Empresa Seleccionada' });
    await expect(item).toHaveAttribute('aria-selected', 'true');
  });

  test('should load the right panel with client detail when a client is clicked', async ({
    page,
  }) => {
    // GIVEN: The client list is displayed
    const cliente = buildCliente({ nombre: 'Empresa Detalle Test' });

    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );

    await page.goto('/clientes');

    // WHEN: The user clicks on a client item
    await page
      .getByTestId('cliente-list-item')
      .filter({ hasText: 'Empresa Detalle Test' })
      .click();

    // THEN: The right panel becomes visible with client details
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
  });

  test('should be keyboard navigable (Tab + Enter) to select a client item', async ({ page }) => {
    // GIVEN: The client list is displayed
    const cliente = buildCliente({ nombre: 'Empresa Teclado' });

    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );

    await page.goto('/clientes');

    // WHEN: The user navigates to the client item via keyboard and presses Enter
    const clienteItem = page
      .getByTestId('cliente-list-item')
      .filter({ hasText: 'Empresa Teclado' });
    await clienteItem.focus();
    await page.keyboard.press('Enter');

    // THEN: The item is selected
    await expect(clienteItem).toHaveAttribute('aria-selected', 'true');
  });

  test('should have role=button and aria-label for each client list item', async ({ page }) => {
    // GIVEN: The client list is displayed
    const cliente = buildCliente({ nombre: 'Empresa Accesible' });

    await page.route(API_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: Each item has role=button and aria-label for accessibility
    const item = page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Accesible' });
    await expect(item).toHaveAttribute('role', 'button');
    await expect(item).toHaveAttribute('aria-label', 'Ver cliente: Empresa Accesible');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// API Contract Tests — GET /api/v1/clientes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('API — GET /api/v1/clientes contract', () => {
  const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

  test('should return HTTP 200 with an array when clients exist', async ({ request }) => {
    // GIVEN: The backend is running and has client records
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: Response is 200 with an array body
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('should return HTTP 200 with empty array when no clients exist', async ({ request }) => {
    // GIVEN: The backend has no client records (or we test the empty case)
    // NOTE: This test assumes a clean test environment or dedicated test database
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: Response is 200 (not 404 or 204)
    expect(response.status()).toBe(200);
  });

  test('should return client objects with required ClienteDto fields', async ({ request }) => {
    // GIVEN: At least one client exists in the backend
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    expect(response.status()).toBe(200);
    const body = await response.json();

    // THEN: Each item has the required ClienteDto shape
    if (body.length > 0) {
      const item = body[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('nombre');
      expect(item).toHaveProperty('nit');
      expect(item).toHaveProperty('telefono');
      expect(item).toHaveProperty('ciudad');
      expect(item).toHaveProperty('createdAt');
      expect(item).toHaveProperty('contactCount');
      expect(typeof item.contactCount).toBe('number');
    }
  });

  test('should return a direct array (not wrapped in an object)', async ({ request }) => {
    // GIVEN: The backend endpoint is configured to return a direct array per API contract
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json();

    // THEN: Body is an array (not { data: [], total: 0 } or similar wrapper)
    expect(Array.isArray(body)).toBe(true);
  });

  test('should return Content-Type application/json', async ({ request }) => {
    // GIVEN: The backend is running
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: Content-Type is JSON
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');
  });
});

/**
 * Story 2.1: Client List & Search
 * E2E Acceptance Tests — RED Phase (Playwright)
 *
 * These tests are intentionally FAILING until implementation is complete.
 * They define the expected behavior BEFORE any code is written (TDD red-green-refactor).
 *
 * Acceptance Criteria covered:
 *   AC1 — Navigating to /clientes renders a scrollable list of clients (280px left panel)
 *         with Nombre and NIT/RUC visible per item.
 *   AC2 — Typing in the search field filters the list client-side in real time
 *         (no additional API call is triggered; results appear in < 1 s).
 *   AC3 — When there are no clients, an EmptyState component is displayed.
 *   AC4 — When the backend is unavailable, an ErrorPanel with a "Reintentar" button
 *         is shown; clicking it calls refetch().
 *
 * Pattern: network-first route interception (CRITICAL: intercept BEFORE navigation).
 * Selectors: data-testid — never fragile CSS selectors.
 */

import { test, expect } from '@playwright/test';
import { buildCliente } from '../../helpers/data.helper';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Build a full Cliente API response object (as returned by GET /api/v1/clientes) */
function buildClienteResponse(overrides?: Partial<{
  id: string;
  nombre: string;
  nit: string;
  telefono: string;
  ciudad: string;
  createdAt: string;
  updatedAt: string;
}>) {
  const base = buildCliente(overrides);
  return {
    id: `00000000-0000-0000-0000-${Date.now().toString().padStart(12, '0')}`,
    nombre: base.nombre,
    nit: base.nit,
    telefono: base.telefono,
    ciudad: base.ciudad,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Client list renders on /clientes (280px left panel, scrollable)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Client list renders on /clientes', () => {
  test('should render the left panel with data-testid="cliente-list-view"', async ({ page }) => {
    // GIVEN: Two clients exist in the system (intercepted at network level)
    const clientes = [buildClienteResponse(), buildClienteResponse()];

    // CRITICAL: Intercept BEFORE navigation to prevent race condition
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: The client list view panel is present
    await expect(page.getByTestId('cliente-list-view')).toBeVisible();
  });

  test('should display each client item with data-testid="cliente-item"', async ({ page }) => {
    // GIVEN: One client in the system
    const cliente = buildClienteResponse({ nombre: 'Empresa Alpha S.A.', nit: '900100200-1' });

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: At least one client item is visible
    await expect(page.getByTestId('cliente-item').first()).toBeVisible();
  });

  test('should display the client Nombre in each list item', async ({ page }) => {
    // GIVEN: A client with a known nombre
    const cliente = buildClienteResponse({ nombre: 'Empresa Beta Ltda' });

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: The client's nombre is visible in the list
    await expect(page.getByTestId('cliente-item').filter({ hasText: 'Empresa Beta Ltda' })).toBeVisible();
  });

  test('should display the client NIT/RUC in each list item', async ({ page }) => {
    // GIVEN: A client with a known NIT
    const cliente = buildClienteResponse({ nombre: 'Empresa Gamma', nit: '800500300-2' });

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: The client's NIT is visible in the list
    await expect(page.getByTestId('cliente-item').filter({ hasText: '800500300-2' })).toBeVisible();
  });

  test('should render the search input with data-testid="search-input"', async ({ page }) => {
    // GIVEN: The /clientes page loads (even with an empty list)
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: The search input is present and accessible
    await expect(page.getByTestId('search-input')).toBeVisible();
  });

  test('should render search input with placeholder "Buscar por nombre o NIT/RUC"', async ({ page }) => {
    // GIVEN: The page loads
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: Search input has correct Spanish placeholder
    const searchInput = page.getByTestId('search-input');
    await expect(searchInput).toHaveAttribute('placeholder', 'Buscar por nombre o NIT/RUC');
  });

  test('should render search input with aria-label="Buscar clientes" for accessibility', async ({ page }) => {
    // GIVEN: The page loads
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: Search input has correct aria-label (WCAG 2.1 AA)
    await expect(page.getByTestId('search-input')).toHaveAttribute('aria-label', 'Buscar clientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Real-time client-side search (no additional API call)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Real-time client-side search filtering', () => {
  test('TC-E2-P0-03 — should filter list by nombre without triggering a new API call', async ({ page }) => {
    // GIVEN: 10 clients loaded from API (intercepted once)
    let apiCallCount = 0;
    const clientes = Array.from({ length: 10 }, (_, i) =>
      buildClienteResponse({ nombre: i === 0 ? 'Empresa Filtro Especial SAS' : `Cliente Generico ${i}` })
    );

    await page.route('**/api/v1/clientes', (route) => {
      apiCallCount++;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      });
    });

    await page.goto('/clientes');

    // Wait for initial list to render
    await expect(page.getByTestId('cliente-item').first()).toBeVisible();

    const initialCount = await page.getByTestId('cliente-item').count();
    expect(initialCount).toBe(10);

    // WHEN: User types a search term (partial nombre match)
    await page.getByTestId('search-input').fill('Filtro Especial');

    // THEN: Only matching clients are shown
    await expect(page.getByTestId('cliente-item')).toHaveCount(1);
    await expect(page.getByTestId('cliente-item').filter({ hasText: 'Filtro Especial' })).toBeVisible();

    // AND: No additional API call was made (client-side filter — R-004 mitigation)
    expect(apiCallCount).toBe(1);
  });

  test('TC-E2-P0-04 — should filter list by NIT/RUC without triggering a new API call', async ({ page }) => {
    // GIVEN: 10 clients loaded from API
    let apiCallCount = 0;
    const targetNit = '999888777-0';
    const clientes = [
      buildClienteResponse({ nombre: 'Empresa Con NIT Especial', nit: targetNit }),
      ...Array.from({ length: 9 }, () => buildClienteResponse()),
    ];

    await page.route('**/api/v1/clientes', (route) => {
      apiCallCount++;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      });
    });

    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-item').first()).toBeVisible();

    // WHEN: User types a partial NIT in the search field
    await page.getByTestId('search-input').fill('999888777');

    // THEN: Only the matching client is shown
    await expect(page.getByTestId('cliente-item')).toHaveCount(1);
    await expect(page.getByTestId('cliente-item').filter({ hasText: targetNit })).toBeVisible();

    // AND: No additional API call triggered (R-004)
    expect(apiCallCount).toBe(1);
  });

  test('should show all clients when search field is cleared', async ({ page }) => {
    // GIVEN: 5 clients are loaded and user previously applied a filter
    const clientes = Array.from({ length: 5 }, (_, i) =>
      buildClienteResponse({ nombre: `Cliente ${i}` })
    );

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      })
    );

    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-item').first()).toBeVisible();

    // WHEN: User types a filter and then clears it
    await page.getByTestId('search-input').fill('Cliente 0');
    await expect(page.getByTestId('cliente-item')).toHaveCount(1);
    await page.getByTestId('search-input').clear();

    // THEN: All clients are shown again
    await expect(page.getByTestId('cliente-item')).toHaveCount(5);
  });

  test('should perform search filter in under 1 second (NFR1)', async ({ page }) => {
    // GIVEN: 500 clients are pre-loaded (max NFR1 requirement)
    const clientes = Array.from({ length: 500 }, (_, i) =>
      buildClienteResponse({ nombre: i === 250 ? 'Empresa Rapida SAS' : `Cliente ${i}` })
    );

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      })
    );

    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-item').first()).toBeVisible();

    // WHEN: User types in the search field — measure time
    const startTime = Date.now();
    await page.getByTestId('search-input').fill('Empresa Rapida');
    await expect(page.getByTestId('cliente-item')).toHaveCount(1);
    const elapsed = Date.now() - startTime;

    // THEN: Filter completes in under 1 second
    expect(elapsed).toBeLessThan(1000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — EmptyState when no clients exist
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — EmptyState component when no clients exist', () => {
  test('TC-E2-P1-01 — should display data-testid="empty-state" when API returns empty array', async ({ page }) => {
    // GIVEN: Backend returns an empty client list
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
      })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: EmptyState component is displayed
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });

  test('should display the guidance message in EmptyState', async ({ page }) => {
    // GIVEN: No clients in the system
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: EmptyState shows guidance message in Spanish
    await expect(page.getByTestId('empty-state')).toContainText(
      'Aún no hay clientes registrados'
    );
  });

  test('should NOT display data-testid="cliente-item" when list is empty', async ({ page }) => {
    // GIVEN: No clients in the system
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: No client items are rendered
    await expect(page.getByTestId('cliente-item')).toHaveCount(0);
  });

  test('should display EmptyState when search filter reduces results to zero', async ({ page }) => {
    // GIVEN: 3 clients loaded, none matching the search term
    const clientes = Array.from({ length: 3 }, () => buildClienteResponse({ nombre: 'Alpha SAS' }));

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clientes) })
    );

    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-item').first()).toBeVisible();

    // WHEN: User types a term that matches no clients
    await page.getByTestId('search-input').fill('ZZZNOMATCH');

    // THEN: EmptyState is displayed with zero items
    await expect(page.getByTestId('empty-state')).toBeVisible();
    await expect(page.getByTestId('cliente-item')).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — ErrorPanel when backend is unavailable
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — ErrorPanel when backend is unavailable', () => {
  test('TC-E2-P1-02 — should display data-testid="error-panel" when API fails', async ({ page }) => {
    // GIVEN: Backend is unavailable (network error)
    await page.route('**/api/v1/clientes', (route) =>
      route.abort('failed')
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: ErrorPanel is displayed instead of the list
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('should display the Spanish error message in ErrorPanel', async ({ page }) => {
    // GIVEN: Backend returns 500
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: ErrorPanel shows user-friendly Spanish message
    await expect(page.getByTestId('error-panel')).toContainText(
      'No se pudo cargar la información'
    );
  });

  test('should display a "Reintentar" button in the ErrorPanel', async ({ page }) => {
    // GIVEN: Backend is unavailable
    await page.route('**/api/v1/clientes', (route) => route.abort('failed'));

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: A "Reintentar" button is visible
    await expect(page.getByTestId('retry-button')).toBeVisible();
    await expect(page.getByTestId('retry-button')).toContainText('Reintentar');
  });

  test('TC-E2-P1-02 — clicking "Reintentar" triggers a new API call (refetch)', async ({ page }) => {
    // GIVEN: First call fails, second call succeeds (simulating recovery)
    let callCount = 0;
    const clientes = [buildClienteResponse({ nombre: 'Empresa Recuperada SAS' })];

    await page.route('**/api/v1/clientes', (route) => {
      callCount++;
      if (callCount === 1) {
        return route.abort('failed');
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      });
    });

    await page.goto('/clientes');

    // Wait for ErrorPanel to appear
    await expect(page.getByTestId('error-panel')).toBeVisible();
    expect(callCount).toBe(1);

    // WHEN: User clicks "Reintentar"
    await page.getByTestId('retry-button').click();

    // THEN: A second API call is triggered (refetch)
    await expect(page.getByTestId('cliente-item').first()).toBeVisible();
    expect(callCount).toBe(2);
  });

  test('should NOT display the client list when ErrorPanel is shown', async ({ page }) => {
    // GIVEN: Backend is unavailable
    await page.route('**/api/v1/clientes', (route) => route.abort('failed'));

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: No client items are rendered (ErrorPanel takes their place)
    await expect(page.getByTestId('error-panel')).toBeVisible();
    await expect(page.getByTestId('cliente-item')).toHaveCount(0);
  });
});

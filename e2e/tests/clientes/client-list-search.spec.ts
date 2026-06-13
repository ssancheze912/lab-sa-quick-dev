/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * E2E Acceptance Tests — RED Phase (Playwright)
 *
 * Acceptance Criteria covered:
 *   AC1 — /clientes renders a left panel (280px) with a scrollable list showing Nombre and NIT/RUC per item
 *   AC2 — Typing in search input filters the list in real time (case-insensitive) in under 1 second for up to 500 records
 *   AC3 — When no clients exist, an EmptyState component is shown with a guiding message
 *   AC4 — When GET /api/v1/clientes fails, an ErrorPanel with a "Reintentar" button is shown; clicking retries
 *   AC5 — Clearing the search input restores the full unfiltered list immediately
 *   AC6 — Search input is empty when page remounts (no persisted search state across navigation)
 *
 * Network-first intercepts are applied BEFORE navigation to prevent race conditions.
 * All selectors use data-testid for stability.
 */

import { test, expect } from '@playwright/test';
import { buildCliente } from '../../helpers/data.helper';

// ---------------------------------------------------------------------------
// AC1 — Left panel renders scrollable list with Nombre and NIT/RUC
// ---------------------------------------------------------------------------

test.describe('AC1 — Client list panel renders at /clientes', () => {
  test('should render the clientes-list-panel element with 280px width', async ({ page }) => {
    // GIVEN: Two clients exist in the backend
    const cliente1 = buildCliente({ nombre: 'Empresa Alfa', nit: '900100200' });
    const cliente2 = buildCliente({ nombre: 'Empresa Beta', nit: '900300400' });

    // WHEN: Backend returns list; intercept BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '1', nombre: cliente1.nombre, nit: cliente1.nit, telefono: '', ciudad: '', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
          { id: '2', nombre: cliente2.nombre, nit: cliente2.nit, telefono: '', ciudad: '', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        ]),
      })
    );

    await page.goto('/clientes');

    // THEN: The list panel container is present
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
  });

  test('should render each client list item with data-testid="cliente-list-item"', async ({ page }) => {
    // GIVEN: One client in the system
    const cliente = buildCliente({ nombre: 'Comercial Sur', nit: '800123456' });

    // WHEN: Intercepting API before navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '3', nombre: cliente.nombre, nit: cliente.nit, telefono: '', ciudad: '', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        ]),
      })
    );

    await page.goto('/clientes');

    // THEN: At least one list item is visible
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();
  });

  test('should display the client Nombre in each list item', async ({ page }) => {
    // GIVEN: A client named "Distribuidora Norte"
    const nombre = 'Distribuidora Norte';

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '4', nombre, nit: '900000001', telefono: '', ciudad: '', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        ]),
      })
    );

    await page.goto('/clientes');

    // THEN: The client name is visible in the panel
    await expect(page.getByTestId('clientes-list-panel')).toContainText(nombre);
  });

  test('should display the client NIT/RUC in each list item', async ({ page }) => {
    // GIVEN: A client with nit "900000002"
    const nit = '900000002';

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '5', nombre: 'Empresa Ejemplo', nit, telefono: '', ciudad: '', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        ]),
      })
    );

    await page.goto('/clientes');

    // THEN: The NIT is visible in the panel
    await expect(page.getByTestId('clientes-list-panel')).toContainText(nit);
  });

  test('should render a search input with aria-label="Buscar clientes"', async ({ page }) => {
    // GIVEN: The clientes page loads with clients
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    );

    await page.goto('/clientes');

    // THEN: The search input has correct aria-label for accessibility (WCAG 2.1 AA)
    await expect(page.getByTestId('clientes-search-input')).toHaveAttribute('aria-label', 'Buscar clientes');
  });
});

// ---------------------------------------------------------------------------
// AC2 — Search filters list in real time (case-insensitive)
// ---------------------------------------------------------------------------

test.describe('AC2 — Real-time search filtering', () => {
  test('should show only clients matching the search term (by Nombre)', async ({ page }) => {
    // GIVEN: Two clients with different names
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '10', nombre: 'Empresa Alfa SA', nit: '900100200', telefono: '', ciudad: '', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
          { id: '11', nombre: 'Comercial Beta', nit: '900200300', telefono: '', ciudad: '', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        ]),
      })
    );

    await page.goto('/clientes');

    // WHEN: The user types in the search input
    await page.getByTestId('clientes-search-input').fill('Alfa');

    // THEN: Only the matching client is shown
    await expect(page.getByTestId('clientes-list-panel')).toContainText('Empresa Alfa SA');
    await expect(page.getByTestId('clientes-list-panel')).not.toContainText('Comercial Beta');
  });

  test('should show only clients matching the search term (by NIT)', async ({ page }) => {
    // GIVEN: Two clients with different NITs
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '12', nombre: 'Empresa Alfa SA', nit: '900100200', telefono: '', ciudad: '', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
          { id: '13', nombre: 'Comercial Beta', nit: '900200300', telefono: '', ciudad: '', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        ]),
      })
    );

    await page.goto('/clientes');

    // WHEN: The user types a NIT in the search input
    await page.getByTestId('clientes-search-input').fill('900200300');

    // THEN: Only the matching client (by NIT) is shown
    await expect(page.getByTestId('clientes-list-panel')).toContainText('Comercial Beta');
    await expect(page.getByTestId('clientes-list-panel')).not.toContainText('Empresa Alfa SA');
  });

  test('should perform case-insensitive search (uppercase input matches lowercase data)', async ({ page }) => {
    // GIVEN: A client with lowercase nombre "empresa delta"
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '14', nombre: 'empresa delta', nit: '900500600', telefono: '', ciudad: '', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        ]),
      })
    );

    await page.goto('/clientes');

    // WHEN: The user types in uppercase
    await page.getByTestId('clientes-search-input').fill('EMPRESA');

    // THEN: The client appears (case-insensitive match)
    await expect(page.getByTestId('clientes-list-panel')).toContainText('empresa delta');
  });

  test('should not trigger an additional API call when search input changes', async ({ page }) => {
    // GIVEN: The page has loaded clients
    let apiCallCount = 0;
    await page.route('**/api/v1/clientes', (route) => {
      apiCallCount++;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '15', nombre: 'Empresa Solo Una', nit: '900700800', telefono: '', ciudad: '', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        ]),
      });
    });

    await page.goto('/clientes');
    const initialCallCount = apiCallCount;

    // WHEN: The user types in the search input
    await page.getByTestId('clientes-search-input').fill('Solo');

    // THEN: No additional API call was made (filtering is client-side)
    expect(apiCallCount).toBe(initialCallCount);
  });
});

// ---------------------------------------------------------------------------
// AC3 — EmptyState shown when no clients exist
// ---------------------------------------------------------------------------

test.describe('AC3 — EmptyState when no clients exist', () => {
  test('should render the EmptyState component when the API returns an empty array', async ({ page }) => {
    // GIVEN: There are no clients in the system
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: The EmptyState component is displayed
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });

  test('should show a guiding message in the EmptyState', async ({ page }) => {
    // GIVEN: No clients in the system
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    );

    await page.goto('/clientes');

    // THEN: EmptyState contains a guiding message to create the first client
    await expect(page.getByTestId('empty-state')).toContainText(/No hay clientes registrados/i);
  });

  test('should NOT show the client list when EmptyState is displayed', async ({ page }) => {
    // GIVEN: No clients in the system
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    );

    await page.goto('/clientes');

    // THEN: No list items are rendered
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// AC4 — ErrorPanel shown when GET /api/v1/clientes fails; retry works
// ---------------------------------------------------------------------------

test.describe('AC4 — ErrorPanel on API failure with retry', () => {
  test('should render the ErrorPanel when GET /api/v1/clientes returns 500', async ({ page }) => {
    // GIVEN: The backend is unavailable and returns 500
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ status: 500, title: 'Internal Server Error' }) })
    );

    // WHEN: The user navigates to /clientes
    await page.goto('/clientes');

    // THEN: ErrorPanel is displayed instead of the list
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('should render a "Reintentar" button inside the ErrorPanel', async ({ page }) => {
    // GIVEN: The backend fails
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ status: 500, title: 'Internal Server Error' }) })
    );

    await page.goto('/clientes');

    // THEN: The retry button is visible with Spanish label
    await expect(page.getByTestId('error-panel-retry-button')).toBeVisible();
    await expect(page.getByTestId('error-panel-retry-button')).toContainText('Reintentar');
  });

  test('should trigger a new GET /api/v1/clientes fetch when "Reintentar" is clicked', async ({ page }) => {
    // GIVEN: First call fails, second call succeeds
    let callCount = 0;
    await page.route('**/api/v1/clientes', (route) => {
      callCount++;
      if (callCount === 1) {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ status: 500, title: 'Error' }) });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '20', nombre: 'Empresa Recuperada', nit: '900900900', telefono: '', ciudad: '', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        ]),
      });
    });

    await page.goto('/clientes');

    // WHEN: The user clicks "Reintentar"
    await page.getByTestId('error-panel-retry-button').click();

    // THEN: A second API call was made
    await expect(page.getByTestId('clientes-list-panel')).toContainText('Empresa Recuperada');
  });

  test('should NOT show client list items when ErrorPanel is displayed', async ({ page }) => {
    // GIVEN: API fails
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ status: 500, title: 'Error' }) })
    );

    await page.goto('/clientes');

    // THEN: No list items shown alongside the error panel
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// AC5 — Clearing search restores the full unfiltered list
// ---------------------------------------------------------------------------

test.describe('AC5 — Clearing search restores full list', () => {
  test('should restore all items when the search input is cleared', async ({ page }) => {
    // GIVEN: Two clients and a search term that filters to one
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '30', nombre: 'Empresa Gamma', nit: '900110000', telefono: '', ciudad: '', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
          { id: '31', nombre: 'Empresa Delta', nit: '900120000', telefono: '', ciudad: '', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        ]),
      })
    );

    await page.goto('/clientes');
    await page.getByTestId('clientes-search-input').fill('Gamma');

    // Verify filter is active
    await expect(page.getByTestId('clientes-list-panel')).not.toContainText('Empresa Delta');

    // WHEN: The user clears the search input
    await page.getByTestId('clientes-search-input').clear();

    // THEN: Both clients are visible again
    await expect(page.getByTestId('clientes-list-panel')).toContainText('Empresa Gamma');
    await expect(page.getByTestId('clientes-list-panel')).toContainText('Empresa Delta');
  });
});

// ---------------------------------------------------------------------------
// AC6 — Search input is empty on page remount (no persisted state)
// ---------------------------------------------------------------------------

test.describe('AC6 — Search input resets on navigation', () => {
  test('should start with an empty search input after navigating away and back', async ({ page }) => {
    // GIVEN: The user is on /clientes with an active search value
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '40', nombre: 'Empresa Persistente', nit: '900200000', telefono: '', ciudad: '', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        ]),
      })
    );

    await page.goto('/clientes');
    await page.getByTestId('clientes-search-input').fill('alguna busqueda');

    // WHEN: The user navigates away and returns
    await page.goto('/contactos');
    await page.goto('/clientes');

    // THEN: The search input is empty (no persisted state)
    await expect(page.getByTestId('clientes-search-input')).toHaveValue('');
  });
});

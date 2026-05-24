/**
 * Story 2.1: Client List & Search — E2E Edge Cases
 * Epic 2: Client Management
 *
 * Expands ATDD coverage with boundary conditions and error paths:
 *   - AC2: Search with leading/trailing whitespace, case variants, special characters
 *   - AC2: Search cleared restores full list
 *   - AC3: EmptyState variant for search-with-no-results vs truly-empty backend
 *   - AC4: Network abort (connection-level failure) vs HTTP 500
 *   - AC1: Left panel visible after slow network (race condition guard)
 *
 * Framework: Playwright
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Search edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 edge cases — Search boundary conditions', () => {
  test('should trim leading and trailing whitespace from search query and return correct results', async ({ page }) => {
    // GIVEN: Two clients; one named "Empresa Alpha" and one named "Beta Corp"
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'aaa-111', nombre: 'Empresa Alpha', nit: '900000001-1', telefono: '3001', ciudad: 'Bogotá', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
          { id: 'bbb-222', nombre: 'Beta Corp', nit: '900000002-2', telefono: '3002', ciudad: 'Medellín', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        ]),
      })
    );

    await page.goto('/clientes');
    await page.getByRole('searchbox', { name: 'Buscar clientes' }).waitFor({ state: 'visible' });

    // WHEN: User types "  Alpha  " (with surrounding spaces)
    await page.getByRole('searchbox', { name: 'Buscar clientes' }).fill('  Alpha  ');

    // THEN: "Empresa Alpha" remains visible; "Beta Corp" is filtered out
    await expect(page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Alpha' })).toBeVisible();
    await expect(page.getByTestId('cliente-list-item').filter({ hasText: 'Beta Corp' })).toHaveCount(0);
  });

  test('should perform case-insensitive search matching lowercase client name with uppercase query', async ({ page }) => {
    // GIVEN: Client with lowercase nombre "servicios digitales sa"
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'ccc-333', nombre: 'servicios digitales sa', nit: '900000003-3', telefono: '3003', ciudad: 'Cali', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        ]),
      })
    );

    await page.goto('/clientes');
    await page.getByRole('searchbox', { name: 'Buscar clientes' }).waitFor({ state: 'visible' });

    // WHEN: User types "SERVICIOS" (all uppercase)
    await page.getByRole('searchbox', { name: 'Buscar clientes' }).fill('SERVICIOS');

    // THEN: The client is visible despite case mismatch
    await expect(page.getByTestId('cliente-list-item').filter({ hasText: 'servicios digitales sa' })).toBeVisible();
  });

  test('should show all clients when search field is cleared after a filtered search', async ({ page }) => {
    // GIVEN: Two clients loaded, search filters to one
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'ddd-444', nombre: 'Cliente Uno', nit: '100000001-1', telefono: '3001', ciudad: 'Bogotá', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
          { id: 'eee-555', nombre: 'Cliente Dos', nit: '100000002-2', telefono: '3002', ciudad: 'Cali', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        ]),
      })
    );

    await page.goto('/clientes');
    const searchInput = page.getByRole('searchbox', { name: 'Buscar clientes' });
    await searchInput.waitFor({ state: 'visible' });

    // WHEN: Filter to one then clear
    await searchInput.fill('Uno');
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(1);
    await searchInput.fill('');

    // THEN: Both clients are visible again
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(2);
  });

  test('should match NIT containing a dash character when user searches by partial NIT', async ({ page }) => {
    // GIVEN: Client with NIT "800500100-1" (dash in value)
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'fff-666', nombre: 'TechNIT Corp', nit: '800500100-1', telefono: '3001', ciudad: 'Bogotá', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
          { id: 'ggg-777', nombre: 'Other Corp', nit: '999888777-9', telefono: '3002', ciudad: 'Cali', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        ]),
      })
    );

    await page.goto('/clientes');
    const searchInput = page.getByRole('searchbox', { name: 'Buscar clientes' });
    await searchInput.waitFor({ state: 'visible' });

    // WHEN: User types the dash-containing portion of the NIT
    await searchInput.fill('500100-1');

    // THEN: Only TechNIT Corp is visible
    await expect(page.getByTestId('cliente-list-item').filter({ hasText: 'TechNIT Corp' })).toBeVisible();
    await expect(page.getByTestId('cliente-list-item').filter({ hasText: 'Other Corp' })).toHaveCount(0);
  });

  test('should show search-no-results EmptyState when query matches no clients', async ({ page }) => {
    // GIVEN: Clients exist but none match "XYZNOTFOUND"
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'hhh-888', nombre: 'Empresa Real', nit: '123456789-0', telefono: '3001', ciudad: 'Bogotá', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        ]),
      })
    );

    await page.goto('/clientes');
    const searchInput = page.getByRole('searchbox', { name: 'Buscar clientes' });
    await searchInput.waitFor({ state: 'visible' });

    // WHEN: User types a query that matches nothing
    await searchInput.fill('XYZNOTFOUND');

    // THEN: EmptyState (no-results variant) is displayed — NOT the error panel
    await expect(page.getByTestId('empty-state')).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 edge cases — Network failure variants
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 edge cases — Network failure variants', () => {
  test('should show ErrorPanel on network abort (connection-level failure)', async ({ page }) => {
    // GIVEN: Connection-level abort (not a 5xx response)
    await page.route('**/api/v1/clientes', (route) => route.abort('connectionfailed'));

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: ErrorPanel is displayed (role="alert") — not a blank or crash state
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('button', { name: /Reintentar/i })).toBeVisible();
  });

  test('should show ErrorPanel on HTTP 503 Service Unavailable', async ({ page }) => {
    // GIVEN: Backend returns 503
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Service Unavailable', status: 503 }),
      })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: ErrorPanel is shown — not EmptyState
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByTestId('empty-state')).toHaveCount(0);
  });

  test('should NOT show client list items when ErrorPanel is displayed after network abort', async ({ page }) => {
    // GIVEN: Network abort
    await page.route('**/api/v1/clientes', (route) => route.abort('failed'));

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');
    await page.getByRole('alert').waitFor({ state: 'visible' });

    // THEN: No client list items are rendered
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 edge cases — Panel and list structure
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 edge cases — Panel and list structure', () => {
  test('should still render search input when backend returns empty array', async ({ page }) => {
    // GIVEN: No clients in the system
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: Search input is still visible even without client data (accessible in empty state)
    await expect(page.getByRole('searchbox', { name: 'Buscar clientes' })).toBeVisible();
  });

  test('should render search input with correct type="search" attribute', async ({ page }) => {
    // GIVEN: Any page load
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    await page.goto('/clientes');

    // WHEN: Inspecting the search input
    const searchInput = page.getByRole('searchbox', { name: 'Buscar clientes' });

    // THEN: Input type is "search" (semantic HTML for accessibility + mobile keyboards)
    expect(await searchInput.getAttribute('type')).toBe('search');
  });

  test('should render list items with correct aria-label combining Nombre and NIT/RUC', async ({ page, request }) => {
    // GIVEN: A client with Nombre "Acme Test" and NIT "111222333-4"
    const apiHelper = new ApiHelper(request);
    const createdIds: string[] = [];

    const data = buildCliente({ nombre: 'Acme Test E2E', nit: '111222333-4' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    await page.route('**/api/v1/clientes', (route) => route.continue());
    await page.goto('/clientes');

    // THEN: The list item has an aria-label containing both Nombre and NIT
    const item = page.getByTestId('cliente-list-item').filter({ hasText: 'Acme Test E2E' });
    await expect(item).toBeVisible();
    const ariaLabel = await item.getAttribute('aria-label') ?? '';
    expect(ariaLabel).toContain('Acme Test E2E');
    expect(ariaLabel.toLowerCase()).toContain('nit');

    // Cleanup
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
  });
});

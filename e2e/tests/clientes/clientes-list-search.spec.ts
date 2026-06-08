/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (E2E Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Left panel renders scrollable client list with Nombre and NIT/RUC
 *   AC2 — Real-time search filter by Nombre or NIT (< 1 second, up to 500 records)
 *   AC3 — Clearing search restores full list without a new API call
 *   AC4 — EmptyState shown when no clients exist (Spanish message)
 *   AC5 — ErrorPanel with "Reintentar" button shown when backend is unavailable
 */

import { test, expect } from '@playwright/test';
import { buildCliente } from '../../helpers/data.helper';
import { ApiHelper } from '../../helpers/api.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Left panel renders scrollable client list showing Nombre and NIT/RUC
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Client list panel renders all clients', () => {
  test('should render the left panel at /clientes with the client list container', async ({ page }) => {
    // GIVEN: The application is loaded and clients route exists
    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: The left list panel is visible
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
  });

  test('should display a client item with Nombre when clients exist', async ({ page, request }) => {
    // GIVEN: A client exists in the system
    const apiHelper = new ApiHelper(request);
    const data = buildCliente();
    const created = await apiHelper.createCliente(data);

    try {
      // Network-first: intercept GET /clientes before navigating
      await page.route(`${API_BASE_URL}/api/v1/clientes`, async (route) => {
        const response = await route.fetch();
        await route.fulfill({ response });
      });

      // WHEN: User navigates to /clientes
      await page.goto('/clientes');

      // THEN: The client's Nombre appears in the list
      await expect(
        page.getByTestId('cliente-list-item').filter({ hasText: data.nombre })
      ).toBeVisible();
    } finally {
      await apiHelper.deleteCliente(created.id).catch(() => null);
    }
  });

  test('should display a client item with NIT when clients exist', async ({ page, request }) => {
    // GIVEN: A client with a known NIT exists in the system
    const apiHelper = new ApiHelper(request);
    const data = buildCliente();
    const created = await apiHelper.createCliente(data);

    try {
      // Network-first: intercept GET /clientes before navigating
      await page.route(`${API_BASE_URL}/api/v1/clientes`, async (route) => {
        const response = await route.fetch();
        await route.fulfill({ response });
      });

      // WHEN: User navigates to /clientes
      await page.goto('/clientes');

      // THEN: The client's NIT appears in the list item
      await expect(
        page.getByTestId('cliente-list-item').filter({ hasText: data.nit })
      ).toBeVisible();
    } finally {
      await apiHelper.deleteCliente(created.id).catch(() => null);
    }
  });

  test('should render the search input with placeholder "Buscar cliente..."', async ({ page }) => {
    // GIVEN: The clients page is loaded
    // Network-first: stub empty list to avoid loading state interference
    await page.route(`${API_BASE_URL}/api/v1/clientes`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: Search input with Spanish placeholder is visible
    await expect(page.getByPlaceholder('Buscar cliente...')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Real-time search filter by Nombre or NIT (< 1s, up to 500 records)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Real-time search filters the client list', () => {
  test('should filter clients by Nombre when user types in the search field', async ({ page }) => {
    // GIVEN: The client list is loaded with known clients
    const targetNombre = 'Empresa Única de Prueba';
    const otherNombre = 'Otra Compañía sin Relación';

    await page.route(`${API_BASE_URL}/api/v1/clientes`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'uuid-1', nombre: targetNombre, nit: '111111111', telefono: '3001234567', ciudad: 'Bogotá', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
          { id: 'uuid-2', nombre: otherNombre, nit: '222222222', telefono: '3009876543', ciudad: 'Medellín', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        ]),
      })
    );

    await page.goto('/clientes');

    // WHEN: User types a search term matching only the target
    await page.getByPlaceholder('Buscar cliente...').fill('Única');

    // THEN: Only the matching client is shown
    await expect(page.getByTestId('cliente-list-item').filter({ hasText: targetNombre })).toBeVisible();
    await expect(page.getByTestId('cliente-list-item').filter({ hasText: otherNombre })).not.toBeVisible();
  });

  test('should filter clients by NIT when user types in the search field', async ({ page }) => {
    // GIVEN: The client list is loaded with known clients
    const targetNit = '900555888';
    const targetNombre = 'Constructora Del Norte';

    await page.route(`${API_BASE_URL}/api/v1/clientes`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'uuid-3', nombre: targetNombre, nit: targetNit, telefono: '3001111111', ciudad: 'Cali', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
          { id: 'uuid-4', nombre: 'Empresa Diferente', nit: '100200300', telefono: '3002222222', ciudad: 'Bogotá', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        ]),
      })
    );

    await page.goto('/clientes');

    // WHEN: User types the NIT in the search field
    await page.getByPlaceholder('Buscar cliente...').fill(targetNit);

    // THEN: Only the client with that NIT is shown
    await expect(page.getByTestId('cliente-list-item').filter({ hasText: targetNombre })).toBeVisible();
    await expect(page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Diferente' })).not.toBeVisible();
  });

  test('should filter within 1 second when list has 500 records (NFR1)', async ({ page }) => {
    // GIVEN: The client list is loaded with 500 records
    const clients = Array.from({ length: 500 }, (_, i) => ({
      id: `uuid-${i}`,
      nombre: `Cliente Generado ${i}`,
      nit: `${900000000 + i}`,
      telefono: '3001234567',
      ciudad: 'Bogotá',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }));

    await page.route(`${API_BASE_URL}/api/v1/clientes`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clients),
      })
    );

    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();

    // WHEN: User types a search term and records the time
    const before = Date.now();
    await page.getByPlaceholder('Buscar cliente...').fill('Cliente Generado 1');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();
    const elapsed = Date.now() - before;

    // THEN: Filter completes in under 1000ms
    expect(elapsed).toBeLessThan(1000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Clearing search restores full list without a new API call
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Clearing search field restores the full list', () => {
  test('should show all clients again after clearing the search field', async ({ page }) => {
    // GIVEN: The client list is loaded and a search filter is active
    const clients = [
      { id: 'uuid-a', nombre: 'Alpha Corp', nit: '100000001', telefono: '3001111111', ciudad: 'Bogotá', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      { id: 'uuid-b', nombre: 'Beta Industries', nit: '100000002', telefono: '3002222222', ciudad: 'Medellín', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    ];

    await page.route(`${API_BASE_URL}/api/v1/clientes`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clients) })
    );

    await page.goto('/clientes');

    const searchInput = page.getByPlaceholder('Buscar cliente...');
    await searchInput.fill('Alpha');
    await expect(page.getByTestId('cliente-list-item').filter({ hasText: 'Beta Industries' })).not.toBeVisible();

    // WHEN: User clears the search field
    await searchInput.clear();

    // THEN: Full list is restored — both clients are visible
    await expect(page.getByTestId('cliente-list-item').filter({ hasText: 'Alpha Corp' })).toBeVisible();
    await expect(page.getByTestId('cliente-list-item').filter({ hasText: 'Beta Industries' })).toBeVisible();
  });

  test('should NOT trigger a new API call when search is cleared', async ({ page }) => {
    // GIVEN: Client list is loaded (exactly 1 fetch) and a search is active
    let fetchCount = 0;

    await page.route(`${API_BASE_URL}/api/v1/clientes`, (route) => {
      fetchCount++;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'uuid-c', nombre: 'Gamma SA', nit: '300000001', telefono: '3003333333', ciudad: 'Cali', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        ]),
      });
    });

    await page.goto('/clientes');
    await expect(page.getByTestId('cliente-list-item').first()).toBeVisible();
    const fetchCountAfterLoad = fetchCount;

    const searchInput = page.getByPlaceholder('Buscar cliente...');
    await searchInput.fill('Gamma');

    // WHEN: User clears the search field
    await searchInput.clear();
    await page.waitForTimeout(300); // Allow any potential debounce to settle

    // THEN: No additional API calls were made (filter is client-side)
    expect(fetchCount).toBe(fetchCountAfterLoad);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — EmptyState shown when no clients exist
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — EmptyState component shown when no clients exist', () => {
  test('should display the EmptyState component when the client list is empty', async ({ page }) => {
    // GIVEN: The system has no clients
    await page.route(`${API_BASE_URL}/api/v1/clientes`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: The EmptyState component is rendered
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });

  test('should display a Spanish message guiding user to create first client', async ({ page }) => {
    // GIVEN: The system has no clients
    await page.route(`${API_BASE_URL}/api/v1/clientes`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: The EmptyState shows a Spanish guide message
    await expect(
      page.getByText(/no hay clientes registrados/i)
    ).toBeVisible();
  });

  test('should NOT show EmptyState when search yields no results (only when no clients exist)', async ({ page }) => {
    // GIVEN: Clients exist but search query matches nothing
    await page.route(`${API_BASE_URL}/api/v1/clientes`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'uuid-e', nombre: 'Delta Corp', nit: '400000001', telefono: '3004444444', ciudad: 'Bogotá', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        ]),
      })
    );

    await page.goto('/clientes');

    // WHEN: Search returns no results
    await page.getByPlaceholder('Buscar cliente...').fill('zzz_no_match_zzz');

    // THEN: EmptyState (the "create first client" message) is NOT shown
    await expect(page.getByText(/no hay clientes registrados/i)).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — ErrorPanel with "Reintentar" button shown when backend is unavailable
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — ErrorPanel with Reintentar button on fetch failure', () => {
  test('should display the ErrorPanel when the API call fails', async ({ page }) => {
    // GIVEN: The backend is unavailable (network error on GET /clientes)
    await page.route(`${API_BASE_URL}/api/v1/clientes`, (route) =>
      route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Service Unavailable' }) })
    );

    // WHEN: User navigates to /clientes and the fetch fails
    await page.goto('/clientes');

    // THEN: The ErrorPanel is displayed (not the list)
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('should display a "Reintentar" button inside the ErrorPanel', async ({ page }) => {
    // GIVEN: The backend is unavailable
    await page.route(`${API_BASE_URL}/api/v1/clientes`, (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Internal Server Error' }) })
    );

    // WHEN: User navigates to /clientes and the fetch fails
    await page.goto('/clientes');

    // THEN: The "Reintentar" button is visible within the ErrorPanel
    await expect(page.getByRole('button', { name: /reintentar/i })).toBeVisible();
  });

  test('should NOT show the client list when ErrorPanel is displayed', async ({ page }) => {
    // GIVEN: The backend is unavailable
    await page.route(`${API_BASE_URL}/api/v1/clientes`, (route) =>
      route.fulfill({ status: 503, contentType: 'application/json', body: '{}' })
    );

    // WHEN: User navigates to /clientes and the fetch fails
    await page.goto('/clientes');

    // THEN: No client list items are rendered
    await expect(page.getByTestId('cliente-list-item')).not.toBeVisible();
  });

  test('should re-fetch clients when the "Reintentar" button is clicked', async ({ page }) => {
    // GIVEN: First fetch fails, second fetch succeeds
    let callCount = 0;

    await page.route(`${API_BASE_URL}/api/v1/clientes`, (route) => {
      callCount++;
      if (callCount === 1) {
        route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 'uuid-retry', nombre: 'Cliente Retry', nit: '500000001', telefono: '3005555555', ciudad: 'Bogotá', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
          ]),
        });
      }
    });

    await page.goto('/clientes');
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // WHEN: User clicks the "Reintentar" button
    await page.getByRole('button', { name: /reintentar/i }).click();

    // THEN: The client list is loaded on retry
    await expect(page.getByTestId('cliente-list-item').filter({ hasText: 'Cliente Retry' })).toBeVisible();
  });
});

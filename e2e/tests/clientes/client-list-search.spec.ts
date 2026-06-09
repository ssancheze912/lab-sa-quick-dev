/**
 * E2E Acceptance Tests — Story 2.1: Client List & Search
 *
 * RED PHASE: These tests are intentionally written to FAIL until the implementation
 * described in story 2-1-client-list-search.md is complete.
 *
 * Acceptance Criteria covered:
 *   AC#1 — Left panel (280px) renders scrollable list with Nombre + NIT per item
 *   AC#2 — Real-time search filters by Nombre or NIT/RUC (< 1s, up to 500 records)
 *   AC#3 — EmptyState shown when no clients exist
 *   AC#4 — ErrorPanel + "Reintentar" button when GET /api/v1/clientes fails
 *   AC#5 — Clearing search shows all clients without a new API call
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ---------------------------------------------------------------------------
// AC#1 — Left panel renders scrollable list with Nombre + NIT per item
// ---------------------------------------------------------------------------

test.describe('AC#1 — Client list panel', () => {
  test('should render the 280px left panel at /clientes when clients exist', async ({ page, request }) => {
    const apiHelper = new ApiHelper(request);
    const clienteData = buildCliente();
    const created = await apiHelper.createCliente(clienteData);

    try {
      // GIVEN: A client exists in the system
      // WHEN: User navigates to /clientes — intercept BEFORE navigation (network-first)
      const clientesResponse = page.waitForResponse(
        (resp) =>
          resp.url().includes('/api/v1/clientes') && resp.status() === 200,
      );

      await page.goto('/clientes');
      await clientesResponse;

      // THEN: The left panel is visible
      await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
    } finally {
      await apiHelper.deleteCliente(created.id).catch(() => null);
    }
  });

  test('should display Nombre for each client in the list', async ({ page, request }) => {
    const apiHelper = new ApiHelper(request);
    const clienteData = buildCliente({ nombre: 'Empresa Acme SA' });
    const created = await apiHelper.createCliente(clienteData);

    try {
      // GIVEN: A client "Empresa Acme SA" exists
      // WHEN: User navigates to /clientes
      const clientesResponse = page.waitForResponse(
        (resp) =>
          resp.url().includes('/api/v1/clientes') && resp.status() === 200,
      );
      await page.goto('/clientes');
      await clientesResponse;

      // THEN: The client's Nombre is displayed in the list
      await expect(
        page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Acme SA' }),
      ).toBeVisible();
    } finally {
      await apiHelper.deleteCliente(created.id).catch(() => null);
    }
  });

  test('should display NIT for each client in the list', async ({ page, request }) => {
    const apiHelper = new ApiHelper(request);
    const clienteData = buildCliente({ nit: '900123456-1' });
    const created = await apiHelper.createCliente(clienteData);

    try {
      // GIVEN: A client with NIT "900123456-1" exists
      // WHEN: User navigates to /clientes
      const clientesResponse = page.waitForResponse(
        (resp) =>
          resp.url().includes('/api/v1/clientes') && resp.status() === 200,
      );
      await page.goto('/clientes');
      await clientesResponse;

      // THEN: The NIT is shown alongside the client item
      await expect(
        page.getByTestId('cliente-list-item').filter({ hasText: '900123456-1' }),
      ).toBeVisible();
    } finally {
      await apiHelper.deleteCliente(created.id).catch(() => null);
    }
  });

  test('should have the list panel with a width of 280px', async ({ page, request }) => {
    const apiHelper = new ApiHelper(request);
    const clienteData = buildCliente();
    const created = await apiHelper.createCliente(clienteData);

    try {
      // GIVEN: Clients exist
      // WHEN: User navigates to /clientes
      const clientesResponse = page.waitForResponse(
        (resp) =>
          resp.url().includes('/api/v1/clientes') && resp.status() === 200,
      );
      await page.goto('/clientes');
      await clientesResponse;

      // THEN: The left panel width is approximately 280px
      const panel = page.getByTestId('clientes-list-panel');
      await expect(panel).toBeVisible();
      const box = await panel.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(270);
      expect(box?.width).toBeLessThanOrEqual(290);
    } finally {
      await apiHelper.deleteCliente(created.id).catch(() => null);
    }
  });
});

// ---------------------------------------------------------------------------
// AC#2 — Real-time search filters by Nombre or NIT/RUC
// ---------------------------------------------------------------------------

test.describe('AC#2 — Real-time search', () => {
  test('should filter client list by Nombre when user types in the search field', async ({ page, request }) => {
    const apiHelper = new ApiHelper(request);
    const matchingData = buildCliente({ nombre: 'Acme Global Corp' });
    const nonMatchingData = buildCliente({ nombre: 'Otro Negocio SAS' });
    const created1 = await apiHelper.createCliente(matchingData);
    const created2 = await apiHelper.createCliente(nonMatchingData);

    try {
      // GIVEN: Two clients exist — "Acme Global Corp" and "Otro Negocio SAS"
      const clientesResponse = page.waitForResponse(
        (resp) =>
          resp.url().includes('/api/v1/clientes') && resp.status() === 200,
      );
      await page.goto('/clientes');
      await clientesResponse;

      // WHEN: User types "Acme" in the search field
      await page.getByTestId('clientes-search-input').fill('Acme');

      // THEN: Only matching client is visible; non-matching is hidden
      await expect(
        page.getByTestId('cliente-list-item').filter({ hasText: 'Acme Global Corp' }),
      ).toBeVisible();
      await expect(
        page.getByTestId('cliente-list-item').filter({ hasText: 'Otro Negocio SAS' }),
      ).not.toBeVisible();
    } finally {
      await apiHelper.deleteCliente(created1.id).catch(() => null);
      await apiHelper.deleteCliente(created2.id).catch(() => null);
    }
  });

  test('should filter client list by NIT/RUC when user types in the search field', async ({ page, request }) => {
    const apiHelper = new ApiHelper(request);
    const matchingData = buildCliente({ nit: '999888777-6' });
    const nonMatchingData = buildCliente({ nit: '111222333-4' });
    const created1 = await apiHelper.createCliente(matchingData);
    const created2 = await apiHelper.createCliente(nonMatchingData);

    try {
      // GIVEN: Two clients with distinct NITs exist
      const clientesResponse = page.waitForResponse(
        (resp) =>
          resp.url().includes('/api/v1/clientes') && resp.status() === 200,
      );
      await page.goto('/clientes');
      await clientesResponse;

      // WHEN: User types partial NIT "999888" in the search field
      await page.getByTestId('clientes-search-input').fill('999888');

      // THEN: Only the matching client is visible
      await expect(
        page.getByTestId('cliente-list-item').filter({ hasText: matchingData.nombre }),
      ).toBeVisible();
      await expect(
        page.getByTestId('cliente-list-item').filter({ hasText: nonMatchingData.nombre }),
      ).not.toBeVisible();
    } finally {
      await apiHelper.deleteCliente(created1.id).catch(() => null);
      await apiHelper.deleteCliente(created2.id).catch(() => null);
    }
  });

  test('should show search field with Spanish placeholder text', async ({ page }) => {
    // GIVEN: User is on the /clientes page
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );
    await page.goto('/clientes');

    // WHEN: The page loads
    // THEN: Search input has Spanish placeholder
    await expect(page.getByTestId('clientes-search-input')).toHaveAttribute(
      'placeholder',
      /buscar por nombre o nit/i,
    );
  });
});

// ---------------------------------------------------------------------------
// AC#3 — EmptyState shown when no clients exist
// ---------------------------------------------------------------------------

test.describe('AC#3 — Empty state', () => {
  test('should display EmptyState component with Spanish guidance when no clients exist', async ({ page }) => {
    // GIVEN: The backend returns an empty array (no clients in the system)
    // Network-first: intercept BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );

    // WHEN: User navigates to /clientes
    const clientesResponse = page.waitForResponse((resp) =>
      resp.url().includes('/api/v1/clientes'),
    );
    await page.goto('/clientes');
    await clientesResponse;

    // THEN: EmptyState component is displayed with Spanish guidance message
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });

  test('should display Spanish guidance message inside the EmptyState component', async ({ page }) => {
    // GIVEN: No clients exist
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );
    const clientesResponse = page.waitForResponse((resp) =>
      resp.url().includes('/api/v1/clientes'),
    );
    await page.goto('/clientes');
    await clientesResponse;

    // WHEN: EmptyState is shown
    // THEN: Contains Spanish guidance text (instructs to create first client)
    await expect(page.getByTestId('empty-state')).toContainText(
      /cliente|crear|primero/i,
    );
  });
});

// ---------------------------------------------------------------------------
// AC#4 — ErrorPanel + "Reintentar" button when API call fails
// ---------------------------------------------------------------------------

test.describe('AC#4 — Error handling', () => {
  test('should display ErrorPanel when GET /api/v1/clientes returns 500', async ({ page }) => {
    // GIVEN: The backend is unavailable (simulated 500)
    // Network-first: intercept BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal Server Error' }),
      }),
    );

    // WHEN: Page loads and GET /api/v1/clientes fails
    const clientesResponse = page.waitForResponse((resp) =>
      resp.url().includes('/api/v1/clientes'),
    );
    await page.goto('/clientes');
    await clientesResponse;

    // THEN: ErrorPanel component is displayed
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('should display "Reintentar" button inside ErrorPanel', async ({ page }) => {
    // GIVEN: Backend returns 500
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal Server Error' }),
      }),
    );
    const clientesResponse = page.waitForResponse((resp) =>
      resp.url().includes('/api/v1/clientes'),
    );
    await page.goto('/clientes');
    await clientesResponse;

    // WHEN: ErrorPanel is visible
    // THEN: "Reintentar" button is present
    await expect(
      page.getByTestId('error-panel').getByRole('button', { name: /reintentar/i }),
    ).toBeVisible();
  });

  test('should trigger a refetch when user clicks "Reintentar" button', async ({ page }) => {
    // GIVEN: First request fails with 500
    let callCount = 0;
    await page.route('**/api/v1/clientes', (route) => {
      callCount++;
      if (callCount === 1) {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Error' }),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
    });

    const firstResponse = page.waitForResponse((resp) =>
      resp.url().includes('/api/v1/clientes'),
    );
    await page.goto('/clientes');
    await firstResponse;

    // WHEN: User clicks "Reintentar"
    const retryResponse = page.waitForResponse((resp) =>
      resp.url().includes('/api/v1/clientes'),
    );
    await page.getByTestId('error-panel').getByRole('button', { name: /reintentar/i }).click();
    await retryResponse;

    // THEN: A second API call was made (refetch triggered)
    expect(callCount).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// AC#5 — Clearing search shows all clients without a new API call
// ---------------------------------------------------------------------------

test.describe('AC#5 — Clear search restores full list without extra API call', () => {
  test('should show all clients again when search field is cleared', async ({ page }) => {
    // GIVEN: Clients list loaded with two clients
    const mockClientes = [
      {
        id: 'aaaaaaaa-0000-0000-0000-000000000001',
        nombre: 'Empresa Alfa SAS',
        nit: '800100200-1',
        telefono: '3001234567',
        ciudad: 'Bogotá',
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'bbbbbbbb-0000-0000-0000-000000000002',
        nombre: 'Empresa Beta Ltda',
        nit: '900200300-2',
        telefono: '3107654321',
        ciudad: 'Medellín',
        createdAt: '2026-01-02T00:00:00Z',
      },
    ];

    let apiCallCount = 0;
    await page.route('**/api/v1/clientes', (route) => {
      apiCallCount++;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockClientes),
      });
    });

    const clientesResponse = page.waitForResponse((resp) =>
      resp.url().includes('/api/v1/clientes'),
    );
    await page.goto('/clientes');
    await clientesResponse;

    // Initial API call count (1 expected)
    const initialApiCallCount = apiCallCount;

    // WHEN: User types a search term to filter
    await page.getByTestId('clientes-search-input').fill('Alfa');
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Alfa SAS' }),
    ).toBeVisible();
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Beta Ltda' }),
    ).not.toBeVisible();

    // AND: User clears the search field
    await page.getByTestId('clientes-search-input').clear();

    // THEN: All clients are visible again
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Alfa SAS' }),
    ).toBeVisible();
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Beta Ltda' }),
    ).toBeVisible();

    // AND: No additional API call was triggered (still at initial count)
    expect(apiCallCount).toBe(initialApiCallCount);
  });
});

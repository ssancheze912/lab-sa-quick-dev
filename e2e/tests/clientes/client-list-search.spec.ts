/**
 * E2E Tests — Story 2.1: Client List & Search
 * Epic 2: Client Management (Gestión de Clientes)
 *
 * Acceptance Criteria covered:
 *   AC1 — Left panel (280px) shows scrollable client list with Nombre and NIT/RUC per item
 *   AC2 — Real-time search filters list by Nombre or NIT/RUC (case-insensitive, < 1s)
 *   AC3 — EmptyState shown when no clients exist
 *   AC4 — ErrorPanel with "Reintentar" button shown on fetch failure; Reintentar calls refetch
 *   AC5 — Left panel has fixed width of 280px on desktop viewport (>= 1024px)
 *
 * Test level rationale:
 *   E2E tests cover the critical user journey: real browser + network route interception.
 *   Network-first interception pattern: routes intercepted BEFORE navigation (no race condition).
 *   Component-level tests cover search filter performance and isolated state (see component spec).
 *
 * GREEN PHASE: All tests pass — ClienteListView and supporting components implemented.
 */

import { test, expect } from '@playwright/test';
import { buildCliente } from '../../helpers/data.helper';

// ---------------------------------------------------------------------------
// AC1 — Left panel renders client list with Nombre and NIT/RUC
// ---------------------------------------------------------------------------

test.describe('AC1 — Lista de clientes en panel izquierdo', () => {
  test('debe mostrar la lista de clientes con Nombre y NIT/RUC visibles', async ({ page }) => {
    // GIVEN: Two clients exist in the system (via network intercept)
    const cliente1 = buildCliente({ nombre: 'Empresa Alpha SAS', nit: '900111222' });
    const cliente2 = buildCliente({ nombre: 'Distribuidora Beta Ltda', nit: '800333444' });

    // CRITICAL: Intercept routes BEFORE navigation (network-first pattern)
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'id-1', ...cliente1, telefono: '3001111111', ciudad: 'Bogotá', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
          { id: 'id-2', ...cliente2, telefono: '3002222222', ciudad: 'Medellín', createdAt: '2026-01-02T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z' },
        ]),
      }),
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: Client list panel is visible
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
  });

  test('debe mostrar el nombre del primer cliente en la lista', async ({ page }) => {
    // GIVEN: Clients exist in the system
    const cliente = buildCliente({ nombre: 'Empresa Alpha SAS', nit: '900111222' });

    // CRITICAL: Intercept BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'id-1', ...cliente, telefono: '3001111111', ciudad: 'Bogotá', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        ]),
      }),
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: Client Nombre is visible in the list
    await expect(page.getByTestId('cliente-list-item').first()).toContainText('Empresa Alpha SAS');
  });

  test('debe mostrar el NIT/RUC del cliente en cada item de la lista', async ({ page }) => {
    // GIVEN: A client with a known NIT exists in the system
    const cliente = buildCliente({ nombre: 'Empresa Alpha SAS', nit: '900111222' });

    // CRITICAL: Intercept BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'id-1', ...cliente, telefono: '3001111111', ciudad: 'Bogotá', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        ]),
      }),
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: NIT is visible in the client list item
    await expect(page.getByTestId('cliente-list-item').first()).toContainText('900111222');
  });

  test('debe mostrar la lista desplazable con múltiples clientes', async ({ page }) => {
    // GIVEN: Multiple clients exist in the system
    const clientes = Array.from({ length: 5 }, (_, i) =>
      buildCliente({ nombre: `Empresa ${String.fromCharCode(65 + i)} SAS`, nit: `9001${i}0000` }),
    );

    // CRITICAL: Intercept BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          clientes.map((c, i) => ({
            id: `id-${i + 1}`,
            ...c,
            telefono: '3001111111',
            ciudad: 'Bogotá',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          })),
        ),
      }),
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: All 5 client items are rendered
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(5);
  });
});

// ---------------------------------------------------------------------------
// AC2 — Real-time search filters by Nombre or NIT/RUC
// ---------------------------------------------------------------------------

test.describe('AC2 — Búsqueda en tiempo real por Nombre o NIT/RUC', () => {
  test('debe filtrar la lista por nombre en tiempo real', async ({ page }) => {
    // GIVEN: Multiple clients are loaded
    const clientes = [
      { id: 'id-1', nombre: 'Empresa Filtro Especial', nit: '900111000', telefono: '3001111111', ciudad: 'Bogotá', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      { id: 'id-2', nombre: 'Otra Empresa SAS', nit: '800222000', telefono: '3002222222', ciudad: 'Medellín', createdAt: '2026-01-02T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z' },
    ];

    // CRITICAL: Intercept BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      }),
    );

    await page.goto('/clientes');

    // WHEN: User types in the search field
    await page.getByTestId('clientes-search-input').fill('Filtro Especial');

    // THEN: Only matching clients are shown
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(1);
    await expect(page.getByTestId('cliente-list-item').first()).toContainText('Empresa Filtro Especial');
  });

  test('debe filtrar la lista por NIT/RUC en tiempo real', async ({ page }) => {
    // GIVEN: Multiple clients are loaded
    const clientes = [
      { id: 'id-1', nombre: 'Empresa Alpha', nit: '999888777', telefono: '3001111111', ciudad: 'Bogotá', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      { id: 'id-2', nombre: 'Empresa Beta', nit: '111222333', telefono: '3002222222', ciudad: 'Cali', createdAt: '2026-01-02T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z' },
    ];

    // CRITICAL: Intercept BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      }),
    );

    await page.goto('/clientes');

    // WHEN: User types a NIT in the search field
    await page.getByTestId('clientes-search-input').fill('999888777');

    // THEN: Only the matching client is shown
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(1);
    await expect(page.getByTestId('cliente-list-item').first()).toContainText('Empresa Alpha');
  });

  test('debe realizar búsqueda sin distinción de mayúsculas', async ({ page }) => {
    // GIVEN: A client with known nombre is loaded
    const clientes = [
      { id: 'id-1', nombre: 'Empresa Alpha SAS', nit: '900111222', telefono: '3001111111', ciudad: 'Bogotá', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    ];

    // CRITICAL: Intercept BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clientes),
      }),
    );

    await page.goto('/clientes');

    // WHEN: User types in lowercase
    await page.getByTestId('clientes-search-input').fill('empresa alpha');

    // THEN: The client is still found (case-insensitive match)
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(1);
  });

  test('debe tener campo de búsqueda con placeholder en español', async ({ page }) => {
    // GIVEN: The client list page is loaded
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: Search input has Spanish placeholder text
    await expect(page.getByTestId('clientes-search-input')).toHaveAttribute(
      'placeholder',
      'Buscar por nombre o NIT/RUC...',
    );
  });
});

// ---------------------------------------------------------------------------
// AC3 — EmptyState shown when no clients exist
// ---------------------------------------------------------------------------

test.describe('AC3 — EmptyState cuando no hay clientes', () => {
  test('debe mostrar EmptyState cuando el sistema no tiene clientes', async ({ page }) => {
    // GIVEN: No clients exist in the system

    // CRITICAL: Intercept BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: EmptyState component is visible
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });

  test('no debe renderizar lista vacía cuando no hay clientes', async ({ page }) => {
    // GIVEN: No clients exist in the system

    // CRITICAL: Intercept BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: No empty list element is rendered
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(0);
  });

  test('EmptyState debe mostrar mensaje guía en español', async ({ page }) => {
    // GIVEN: No clients exist

    // CRITICAL: Intercept BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: EmptyState shows a Spanish guidance message
    await expect(page.getByTestId('empty-state')).toContainText(/cliente/i);
  });
});

// ---------------------------------------------------------------------------
// AC4 — ErrorPanel with "Reintentar" button on fetch failure
// ---------------------------------------------------------------------------

test.describe('AC4 — ErrorPanel con botón "Reintentar" en fallo de backend', () => {
  test('debe mostrar ErrorPanel cuando el backend no está disponible', async ({ page }) => {
    // GIVEN: Backend is unavailable (returns 500)

    // CRITICAL: Intercept BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      }),
    );

    // WHEN: User navigates to /clientes (fetch fails)
    await page.goto('/clientes');

    // THEN: ErrorPanel is displayed instead of the client list
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('debe mostrar botón "Reintentar" en el ErrorPanel', async ({ page }) => {
    // GIVEN: Backend returns an error

    // CRITICAL: Intercept BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      }),
    );

    // WHEN: User navigates to /clientes (fetch fails)
    await page.goto('/clientes');

    // THEN: A "Reintentar" button is present inside the ErrorPanel
    await expect(page.getByTestId('error-panel').getByRole('button', { name: /reintentar/i })).toBeVisible();
  });

  test('debe ocultar la lista cuando el fetch falla', async ({ page }) => {
    // GIVEN: Backend is unavailable

    // CRITICAL: Intercept BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Service Unavailable' }),
      }),
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: No client list items are rendered
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(0);
  });

  test('debe llamar refetch al hacer clic en "Reintentar"', async ({ page }) => {
    // GIVEN: Initial request fails, then succeeds on retry
    let requestCount = 0;

    // CRITICAL: Intercept BEFORE navigation
    await page.route('**/api/v1/clientes', (route) => {
      requestCount++;
      if (requestCount === 1) {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 'id-1', nombre: 'Empresa Alpha', nit: '900111222', telefono: '3001111111', ciudad: 'Bogotá', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
          ]),
        });
      }
    });

    // WHEN: User navigates and sees the error
    await page.goto('/clientes');
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // AND: User clicks "Reintentar"
    await page.getByTestId('error-panel').getByRole('button', { name: /reintentar/i }).click();

    // THEN: The query was refetched and client list is now shown
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(1);
  });
});

// ---------------------------------------------------------------------------
// AC5 — Left panel has fixed 280px width on desktop viewport
// ---------------------------------------------------------------------------

test.describe('AC5 — Panel izquierdo con ancho fijo de 280px en escritorio', () => {
  test('el panel izquierdo debe tener clase CSS w-[280px] en viewport de escritorio', async ({ page }) => {
    // GIVEN: Desktop viewport (>= 1024px)
    await page.setViewportSize({ width: 1280, height: 800 });

    // CRITICAL: Intercept BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: Left panel has w-[280px] Tailwind class
    const panel = page.getByTestId('clientes-list-panel');
    await expect(panel).toHaveClass(/w-\[280px\]/);
  });

  test('el panel izquierdo debe tener exactamente 280px de ancho en escritorio', async ({ page }) => {
    // GIVEN: Desktop viewport >= 1024px
    await page.setViewportSize({ width: 1440, height: 900 });

    // CRITICAL: Intercept BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: The panel has exactly 280px computed width
    const panel = page.getByTestId('clientes-list-panel');
    const boundingBox = await panel.boundingBox();
    expect(boundingBox?.width).toBe(280);
  });
});

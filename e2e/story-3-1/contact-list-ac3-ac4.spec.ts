/**
 * Story 3.1: Contact List & Search — E2E Tests (AC3 + AC4)
 * ATDD — RED Phase (Tests intentionally failing — no implementation yet)
 *
 * Acceptance Criteria covered:
 * - AC3: EmptyState shown when API returns empty array; search and list container still rendered
 * - AC4: ErrorPanel shown on backend failure; "Reintentar" triggers refetch via TanStack Query
 *
 * Split from contact-list-search.spec.ts to comply with 300-line file limit.
 */

import { test, expect } from '@playwright/test';

const API_CONTACTOS = '**/api/v1/contactos';

// ─── Shared helpers ───────────────────────────────────────────────────────────

function buildContactoStub(overrides: Partial<{
  id: string;
  nombre: string;
  cargo: string;
  telefono: string;
  email: string;
  clienteId: string | null;
  createdAt: string;
  updatedAt: string;
}> = {}) {
  const ts = new Date().toISOString();
  return {
    id: '550e8400-e29b-41d4-a716-446655440001',
    nombre: 'Juan Pérez',
    cargo: 'Gerente Comercial',
    telefono: '3001234567',
    email: 'juan.perez@empresa.com',
    clienteId: '550e8400-e29b-41d4-a716-446655440000',
    createdAt: ts,
    updatedAt: ts,
    ...overrides,
  };
}

// ─── AC3: Empty state when no contacts ───────────────────────────────────────

test.describe('AC3 — Estado vacío cuando no hay contactos', () => {
  test('should display EmptyState component when API returns empty array', async ({ page }) => {
    // GIVEN: API returns empty array
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: EmptyState component is displayed
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });

  test('should display a Spanish guidance message in the EmptyState', async ({ page }) => {
    // GIVEN: API returns empty array
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: EmptyState contains a Spanish message guiding user to create first contact
    await expect(page.getByTestId('empty-state')).toContainText(/contacto/i);
  });

  test('should still render search input when API returns empty array', async ({ page }) => {
    // GIVEN: API returns empty array
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: Search input is still rendered
    await expect(page.getByTestId('contactos-search-input')).toBeVisible();
  });

  test('should still render list container when API returns empty array', async ({ page }) => {
    // GIVEN: API returns empty array
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: List container is still rendered (but empty)
    await expect(page.getByTestId('contactos-list-container')).toBeVisible();
  });
});

// ─── AC4: ErrorPanel and retry ────────────────────────────────────────────────

test.describe('AC4 — ErrorPanel y botón Reintentar en fallo de backend', () => {
  test('should display ErrorPanel when API returns 500', async ({ page }) => {
    // GIVEN: API returns a 500 server error
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ status: 500, title: 'Internal Server Error' }),
      }),
    );

    // WHEN: User navigates to /contactos and fetch fails
    await page.goto('/contactos');

    // THEN: ErrorPanel component is displayed
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('should display ErrorPanel when API call fails with network error', async ({ page }) => {
    // GIVEN: API call results in a network error (connection refused)
    await page.route(API_CONTACTOS, (route) => route.abort('connectionrefused'));

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: ErrorPanel component is displayed
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('should display a "Reintentar" button inside ErrorPanel', async ({ page }) => {
    // GIVEN: API returns 500
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ status: 500, title: 'Internal Server Error' }),
      }),
    );

    // WHEN: User navigates to /contactos and sees ErrorPanel
    await page.goto('/contactos');

    // THEN: A "Reintentar" button is present inside the error panel
    await expect(page.getByTestId('error-panel-retry-button')).toBeVisible();
  });

  test('should trigger a new fetch when "Reintentar" button is clicked', async ({ page }) => {
    // GIVEN: First API call fails with 500; second returns data
    let callCount = 0;
    await page.route(API_CONTACTOS, (route) => {
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
          body: JSON.stringify([buildContactoStub({ nombre: 'Contacto Recuperado' })]),
        });
      }
    });

    // WHEN: User navigates, sees ErrorPanel, then clicks Reintentar
    await page.goto('/contactos');
    await expect(page.getByTestId('error-panel-retry-button')).toBeVisible();
    await page.getByTestId('error-panel-retry-button').click();

    // THEN: The list now shows the contact from the successful second fetch
    await expect(page.getByTestId('contacto-list-item').first()).toContainText('Contacto Recuperado');
  });
});

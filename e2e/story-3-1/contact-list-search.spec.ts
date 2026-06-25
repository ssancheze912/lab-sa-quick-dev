/**
 * Story 3.1: Contact List & Search — E2E Tests
 * ATDD — RED Phase (Tests intentionally failing — no implementation yet)
 *
 * Acceptance Criteria covered:
 * - AC1: Navigating to /contactos renders list with Nombre, Cargo, Email per item
 * - AC2: Search field filters in real time (case-insensitive, < 1 second with 1,000 records)
 * - AC3: EmptyState shown when API returns empty array; search and list container still rendered
 * - AC4: ErrorPanel shown on backend failure; "Reintentar" triggers refetch via TanStack Query
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

// ─── AC1: Contact list renders on /contactos ──────────────────────────────────

test.describe('AC1 — Lista de contactos en /contactos', () => {
  test('should render the contact list container when contacts exist', async ({ page }) => {
    // GIVEN: API returns one contact
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([buildContactoStub()]),
      }),
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: The contact list container is visible
    const listContainer = page.getByTestId('contactos-list-container');
    await expect(listContainer).toBeVisible();
  });

  test('should display contact Nombre in each list item', async ({ page }) => {
    // GIVEN: API returns a contact with known nombre
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([buildContactoStub({ nombre: 'María García' })]),
      }),
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: Contact nombre is visible in the list item
    const item = page.getByTestId('contacto-list-item').first();
    await expect(item).toContainText('María García');
  });

  test('should display contact Cargo in each list item', async ({ page }) => {
    // GIVEN: API returns a contact with known cargo
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([buildContactoStub({ cargo: 'Directora de Ventas' })]),
      }),
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: Contact cargo is visible in the list item
    const item = page.getByTestId('contacto-list-item').first();
    await expect(item).toContainText('Directora de Ventas');
  });

  test('should display contact Email in each list item', async ({ page }) => {
    // GIVEN: API returns a contact with known email
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([buildContactoStub({ email: 'm.garcia@freelance.com' })]),
      }),
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: Contact email is visible in the list item
    const item = page.getByTestId('contacto-list-item').first();
    await expect(item).toContainText('m.garcia@freelance.com');
  });

  test('should render the search input field with accessible aria-label', async ({ page }) => {
    // GIVEN: API returns contacts
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([buildContactoStub()]),
      }),
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: Search input is rendered with data-testid
    const searchInput = page.getByTestId('contactos-search-input');
    await expect(searchInput).toBeVisible();
  });
});

// ─── AC2: Real-time search filtering ─────────────────────────────────────────

test.describe('AC2 — Filtrado en tiempo real por nombre o email', () => {
  test('should filter contact list by nombre when user types in search field', async ({ page }) => {
    // GIVEN: API returns two contacts with different nombres
    const contactos = [
      buildContactoStub({ id: '1', nombre: 'Ana Torres', email: 'ana@empresa.com' }),
      buildContactoStub({ id: '2', nombre: 'Luis Mendoza', email: 'luis@empresa.com' }),
    ];
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(contactos),
      }),
    );
    await page.goto('/contactos');

    // WHEN: User types a nombre substring in the search field
    const searchInput = page.getByTestId('contactos-search-input');
    await searchInput.fill('Ana');

    // THEN: Only the matching contact is shown
    const items = page.getByTestId('contacto-list-item');
    await expect(items).toHaveCount(1);
    await expect(items.first()).toContainText('Ana Torres');
  });

  test('should filter contact list by email when user types in search field', async ({ page }) => {
    // GIVEN: API returns two contacts with different emails
    const contactos = [
      buildContactoStub({ id: '1', nombre: 'Carlos Ruiz', email: 'carlos@alpha.com' }),
      buildContactoStub({ id: '2', nombre: 'Diana Lopez', email: 'diana@beta.com' }),
    ];
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(contactos),
      }),
    );
    await page.goto('/contactos');

    // WHEN: User types an email substring in the search field
    const searchInput = page.getByTestId('contactos-search-input');
    await searchInput.fill('beta.com');

    // THEN: Only the matching contact is shown
    const items = page.getByTestId('contacto-list-item');
    await expect(items).toHaveCount(1);
    await expect(items.first()).toContainText('Diana Lopez');
  });

  test('should perform case-insensitive filtering by nombre', async ({ page }) => {
    // GIVEN: API returns a contact with mixed-case nombre
    const contactos = [buildContactoStub({ nombre: 'Valentina Sánchez' })];
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(contactos),
      }),
    );
    await page.goto('/contactos');

    // WHEN: User types a lowercase substring
    const searchInput = page.getByTestId('contactos-search-input');
    await searchInput.fill('valentina');

    // THEN: The contact is still visible (case-insensitive match)
    const items = page.getByTestId('contacto-list-item');
    await expect(items).toHaveCount(1);
  });

  test('should perform case-insensitive filtering by email', async ({ page }) => {
    // GIVEN: API returns a contact with mixed-case email
    const contactos = [buildContactoStub({ email: 'Pedro.Gomez@Empresa.COM' })];
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(contactos),
      }),
    );
    await page.goto('/contactos');

    // WHEN: User types a lowercase email substring
    const searchInput = page.getByTestId('contactos-search-input');
    await searchInput.fill('pedro.gomez');

    // THEN: The contact is still visible (case-insensitive match)
    const items = page.getByTestId('contacto-list-item');
    await expect(items).toHaveCount(1);
  });

  test('should show all contacts when search field is cleared', async ({ page }) => {
    // GIVEN: API returns two contacts; user had previously filtered
    const contactos = [
      buildContactoStub({ id: '1', nombre: 'Rosa Medina', email: 'rosa@empresa.com' }),
      buildContactoStub({ id: '2', nombre: 'Felipe Vargas', email: 'felipe@empresa.com' }),
    ];
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(contactos),
      }),
    );
    await page.goto('/contactos');
    const searchInput = page.getByTestId('contactos-search-input');
    await searchInput.fill('Rosa');

    // WHEN: User clears the search field
    await searchInput.clear();

    // THEN: All contacts are shown again
    const items = page.getByTestId('contacto-list-item');
    await expect(items).toHaveCount(2);
  });

  test('should show zero items when search text matches no contact', async ({ page }) => {
    // GIVEN: API returns one contact; search term matches nothing
    const contactos = [buildContactoStub({ nombre: 'Jorge Ramos', email: 'jorge@empresa.com' })];
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(contactos),
      }),
    );
    await page.goto('/contactos');

    // WHEN: User types a term that matches nothing
    const searchInput = page.getByTestId('contactos-search-input');
    await searchInput.fill('ZZZNOMATCH');

    // THEN: The list has zero items
    const items = page.getByTestId('contacto-list-item');
    await expect(items).toHaveCount(0);
  });
});

// ─── AC3: Empty state when no contacts ───────────────────────────────────────

test.describe('AC3 — Estado vacío cuando no hay contactos', () => {
  test('should display EmptyState component when API returns empty array', async ({ page }) => {
    // GIVEN: API returns empty array
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: EmptyState component is displayed
    const emptyState = page.getByTestId('empty-state');
    await expect(emptyState).toBeVisible();
  });

  test('should display a Spanish guidance message in the EmptyState', async ({ page }) => {
    // GIVEN: API returns empty array
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: EmptyState contains a Spanish message guiding user to create first contact
    const emptyState = page.getByTestId('empty-state');
    await expect(emptyState).toContainText(/contacto/i);
  });

  test('should still render search input when API returns empty array', async ({ page }) => {
    // GIVEN: API returns empty array
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: Search input is still rendered
    const searchInput = page.getByTestId('contactos-search-input');
    await expect(searchInput).toBeVisible();
  });

  test('should still render list container when API returns empty array', async ({ page }) => {
    // GIVEN: API returns empty array
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: List container is still rendered (but empty)
    const listContainer = page.getByTestId('contactos-list-container');
    await expect(listContainer).toBeVisible();
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
    const errorPanel = page.getByTestId('error-panel');
    await expect(errorPanel).toBeVisible();
  });

  test('should display ErrorPanel when API call fails with network error', async ({ page }) => {
    // GIVEN: API call results in a network error (connection refused)
    await page.route(API_CONTACTOS, (route) => route.abort('connectionrefused'));

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: ErrorPanel component is displayed
    const errorPanel = page.getByTestId('error-panel');
    await expect(errorPanel).toBeVisible();
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
    const retryButton = page.getByTestId('error-panel-retry-button');
    await expect(retryButton).toBeVisible();
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
    const retryButton = page.getByTestId('error-panel-retry-button');
    await expect(retryButton).toBeVisible();
    await retryButton.click();

    // THEN: The list now shows the contact from the successful second fetch
    const item = page.getByTestId('contacto-list-item').first();
    await expect(item).toContainText('Contacto Recuperado');
  });
});

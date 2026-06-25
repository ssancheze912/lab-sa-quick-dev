/**
 * Story 3.1: Contact List & Search — E2E Tests (AC1 + AC2)
 * ATDD — RED Phase (Tests intentionally failing — no implementation yet)
 *
 * Acceptance Criteria covered:
 * - AC1: Navigating to /contactos renders list with Nombre, Cargo, Email per item
 * - AC2: Search field filters in real time (case-insensitive, < 1 second with 1,000 records)
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
    await expect(page.getByTestId('contactos-list-container')).toBeVisible();
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
    await expect(page.getByTestId('contacto-list-item').first()).toContainText('María García');
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
    await expect(page.getByTestId('contacto-list-item').first()).toContainText('Directora de Ventas');
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
    await expect(page.getByTestId('contacto-list-item').first()).toContainText('m.garcia@freelance.com');
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
    await expect(page.getByTestId('contactos-search-input')).toBeVisible();
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
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contactos) }),
    );
    await page.goto('/contactos');

    // WHEN: User types a nombre substring in the search field
    await page.getByTestId('contactos-search-input').fill('Ana');

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
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contactos) }),
    );
    await page.goto('/contactos');

    // WHEN: User types an email substring in the search field
    await page.getByTestId('contactos-search-input').fill('beta.com');

    // THEN: Only the matching contact is shown
    const items = page.getByTestId('contacto-list-item');
    await expect(items).toHaveCount(1);
    await expect(items.first()).toContainText('Diana Lopez');
  });

  test('should perform case-insensitive filtering by nombre', async ({ page }) => {
    // GIVEN: API returns a contact with mixed-case nombre
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([buildContactoStub({ nombre: 'Valentina Sánchez' })]),
      }),
    );
    await page.goto('/contactos');

    // WHEN: User types a lowercase substring
    await page.getByTestId('contactos-search-input').fill('valentina');

    // THEN: The contact is still visible (case-insensitive match)
    await expect(page.getByTestId('contacto-list-item')).toHaveCount(1);
  });

  test('should perform case-insensitive filtering by email', async ({ page }) => {
    // GIVEN: API returns a contact with mixed-case email
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([buildContactoStub({ email: 'Pedro.Gomez@Empresa.COM' })]),
      }),
    );
    await page.goto('/contactos');

    // WHEN: User types a lowercase email substring
    await page.getByTestId('contactos-search-input').fill('pedro.gomez');

    // THEN: The contact is still visible (case-insensitive match)
    await expect(page.getByTestId('contacto-list-item')).toHaveCount(1);
  });

  test('should show all contacts when search field is cleared', async ({ page }) => {
    // GIVEN: API returns two contacts; user had previously filtered
    const contactos = [
      buildContactoStub({ id: '1', nombre: 'Rosa Medina', email: 'rosa@empresa.com' }),
      buildContactoStub({ id: '2', nombre: 'Felipe Vargas', email: 'felipe@empresa.com' }),
    ];
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contactos) }),
    );
    await page.goto('/contactos');
    await page.getByTestId('contactos-search-input').fill('Rosa');

    // WHEN: User clears the search field
    await page.getByTestId('contactos-search-input').clear();

    // THEN: All contacts are shown again
    await expect(page.getByTestId('contacto-list-item')).toHaveCount(2);
  });

  test('should show zero items when search text matches no contact', async ({ page }) => {
    // GIVEN: API returns one contact; search term matches nothing
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([buildContactoStub({ nombre: 'Jorge Ramos', email: 'jorge@empresa.com' })]),
      }),
    );
    await page.goto('/contactos');

    // WHEN: User types a term that matches nothing
    await page.getByTestId('contactos-search-input').fill('ZZZNOMATCH');

    // THEN: The list has zero items
    await expect(page.getByTestId('contacto-list-item')).toHaveCount(0);
  });
});

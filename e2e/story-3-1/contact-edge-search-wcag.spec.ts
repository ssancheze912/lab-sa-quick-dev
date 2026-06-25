/**
 * Story 3.1: Contact List & Search — Edge Cases (Search + Keyboard + WCAG)
 * testarch-automate expansion (BMad-Integrated Mode)
 *
 * Covers:
 * - Search field placeholder text
 * - No matches: search field still visible
 * - Search input clears filter (shows all again)
 * - Keyboard navigation on list items (tabIndex=0)
 * - WCAG aria-label on search input
 *
 * Split from contact-list-search-edge-cases.spec.ts to comply with 300-line file limit.
 */

import { test, expect } from '@playwright/test';

const API_CONTACTOS = '**/api/v1/contactos';

// ─── Shared helpers ───────────────────────────────────────────────────────────

function makeContacto(overrides: Partial<{
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
    id: crypto.randomUUID(),
    nombre: 'Contacto Test',
    cargo: 'Cargo Test',
    telefono: '3001234567',
    email: 'test@empresa.com',
    clienteId: null,
    createdAt: ts,
    updatedAt: ts,
    ...overrides,
  };
}

// ─── Search input — field behaviour ──────────────────────────────────────────

test.describe('[P1] Search field — placeholder text', () => {
  test('[P1] should render search input with a non-empty placeholder text', async ({ page }) => {
    // GIVEN: API returns contacts
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([makeContacto()]),
      }),
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: Search input has a truthy placeholder attribute
    const placeholder = await page.getByTestId('contactos-search-input').getAttribute('placeholder');
    expect(placeholder).toBeTruthy();
  });

  test('[P1] should render search input with placeholder referencing nombre, email or buscar', async ({ page }) => {
    // GIVEN: API returns contacts
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([makeContacto()]),
      }),
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: Placeholder indicates the search scope (nombre / email / buscar)
    const placeholder = await page.getByTestId('contactos-search-input').getAttribute('placeholder');
    expect(placeholder!.toLowerCase()).toMatch(/nombre|email|buscar/);
  });
});

test.describe('[P1] Search field — interaction', () => {
  test('[P1] should keep search input visible when no items match the search term', async ({ page }) => {
    // GIVEN: API returns one contact; user types a non-matching term
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([makeContacto({ nombre: 'Único Contacto' })]),
      }),
    );
    await page.goto('/contactos');

    // WHEN: User types a non-matching term
    await page.getByTestId('contactos-search-input').fill('ZZZNOMATCH');

    // THEN: Search input is still visible
    await expect(page.getByTestId('contactos-search-input')).toBeVisible();
  });

  test('[P1] should show zero list items when search term matches nothing', async ({ page }) => {
    // GIVEN: API returns one contact; user types a non-matching term
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([makeContacto({ nombre: 'Único Contacto' })]),
      }),
    );
    await page.goto('/contactos');

    // WHEN: User types a non-matching term
    await page.getByTestId('contactos-search-input').fill('ZZZNOMATCH');

    // THEN: No list items are shown
    await expect(page.getByTestId('contacto-list-item')).toHaveCount(0);
  });

  test('[P2] should restore all items after clearing a previously typed search', async ({ page }) => {
    // GIVEN: API returns two contacts; user has typed a filter term
    const contactos = [
      makeContacto({ id: '1', nombre: 'Primero García', email: 'p@test.com' }),
      makeContacto({ id: '2', nombre: 'Segundo López', email: 's@test.com' }),
    ];
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contactos) }),
    );
    await page.goto('/contactos');
    await page.getByTestId('contactos-search-input').fill('Primero');
    await expect(page.getByTestId('contacto-list-item')).toHaveCount(1);

    // WHEN: User clears the search field
    await page.getByTestId('contactos-search-input').clear();

    // THEN: All two contacts are shown again
    await expect(page.getByTestId('contacto-list-item')).toHaveCount(2);
  });
});

// ─── Keyboard navigation ──────────────────────────────────────────────────────

test.describe('[P2] Keyboard navigation — list item accessibility', () => {
  test('[P2] should allow focusing list items via Tab key (tabIndex=0)', async ({ page }) => {
    // GIVEN: API returns one contact
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([makeContacto({ nombre: 'Teclado Navegar' })]),
      }),
    );

    // WHEN: User navigates to /contactos and uses Tab to focus list
    await page.goto('/contactos');
    await page.keyboard.press('Tab'); // Focus search input first
    await page.keyboard.press('Tab'); // Tab to next focusable element (list item)

    // THEN: A contacto list item is focusable (tabIndex=0)
    const tabIndex = await page.getByTestId('contacto-list-item').first().getAttribute('tabindex');
    expect(tabIndex).toBe('0');
  });
});

// ─── WCAG — search input accessible label ─────────────────────────────────────

test.describe('[P0] WCAG — search input accessible label', () => {
  test('[P0] should have an aria-label on the search input', async ({ page }) => {
    // GIVEN: API returns contacts
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([makeContacto()]),
      }),
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: Search input has an aria-label attribute set (accessible to screen readers)
    const ariaLabel = await page.getByTestId('contactos-search-input').getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel!.length).toBeGreaterThan(0);
  });
});

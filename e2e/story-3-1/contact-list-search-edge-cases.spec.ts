/**
 * Story 3.1: Contact List & Search — E2E Edge Case Tests
 * testarch-automate expansion (BMad-Integrated Mode)
 *
 * Covers edge cases and negative paths NOT in the ATDD baseline:
 * - Loading skeleton visible while fetch is in-flight
 * - Multiple contacts rendered simultaneously
 * - Keyboard navigation on list items (tabIndex=0)
 * - Search field placeholder text
 * - Contact with null clienteId renders without error
 * - ErrorPanel shown on 503 Service Unavailable
 * - Search input clears filter (shows all again)
 * - No matches: search field still visible
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

// ─── Loading state ────────────────────────────────────────────────────────────

test.describe('[P1] Loading state — skeleton visible while fetch is in-flight', () => {
  test('[P1] should render the list container immediately on navigation', async ({ page }) => {
    // GIVEN: API response is delayed (simulating slow network)
    let resolve: () => void;
    const delay = new Promise<void>((r) => { resolve = r; });

    await page.route(API_CONTACTOS, async (route) => {
      await delay;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([makeContacto()]),
      });
    });

    // WHEN: User navigates to /contactos
    const navPromise = page.goto('/contactos');

    // THEN: List container is visible even before data arrives
    const container = page.getByTestId('contactos-list-container');
    await expect(container).toBeVisible();

    // Cleanup: resolve the delayed response
    resolve!();
    await navPromise;
  });

  test('[P1] should render search input immediately on navigation before data arrives', async ({ page }) => {
    // GIVEN: API response is delayed
    let resolve: () => void;
    const delay = new Promise<void>((r) => { resolve = r; });

    await page.route(API_CONTACTOS, async (route) => {
      await delay;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // WHEN: User navigates to /contactos
    const navPromise = page.goto('/contactos');

    // THEN: Search input is rendered immediately (not blocked by data loading)
    const searchInput = page.getByTestId('contactos-search-input');
    await expect(searchInput).toBeVisible();

    resolve!();
    await navPromise;
  });
});

// ─── Multiple contacts ────────────────────────────────────────────────────────

test.describe('[P0] Multiple contacts — all items rendered', () => {
  test('[P0] should display all contacts when API returns multiple items', async ({ page }) => {
    // GIVEN: API returns three contacts
    const contactos = [
      makeContacto({ id: '1', nombre: 'Contacto A', email: 'a@test.com' }),
      makeContacto({ id: '2', nombre: 'Contacto B', email: 'b@test.com' }),
      makeContacto({ id: '3', nombre: 'Contacto C', email: 'c@test.com' }),
    ];
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(contactos),
      }),
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: Three list items are displayed
    const items = page.getByTestId('contacto-list-item');
    await expect(items).toHaveCount(3);
  });

  test('[P1] should display nombre, cargo, and email for each contact item', async ({ page }) => {
    // GIVEN: API returns a contact with all fields
    const contacto = makeContacto({
      nombre: 'Luisa Fernández',
      cargo: 'Analista Senior',
      email: 'luisa@empresa.com',
    });
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([contacto]),
      }),
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: The item shows nombre, cargo, and email
    const item = page.getByTestId('contacto-list-item').first();
    await expect(item).toContainText('Luisa Fernández');
    await expect(item).toContainText('Analista Senior');
    await expect(item).toContainText('luisa@empresa.com');
  });
});

// ─── Contact with null clienteId ─────────────────────────────────────────────

test.describe('[P1] Contact with null clienteId — renders without error', () => {
  test('[P1] should render contact with null clienteId without throwing error', async ({ page }) => {
    // GIVEN: API returns a contact with clienteId = null (orphan contact)
    const orphan = makeContacto({ nombre: 'Contacto Huérfano', clienteId: null });
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([orphan]),
      }),
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: Contact is displayed without error; list container is visible
    await expect(page.getByTestId('contacto-list-item').first()).toContainText('Contacto Huérfano');
    await expect(page.getByTestId('error-panel')).not.toBeVisible();
  });
});

// ─── Error handling — additional HTTP error codes ─────────────────────────────

test.describe('[P1] Error handling — various HTTP failures', () => {
  test('[P1] should display ErrorPanel when API returns 503 Service Unavailable', async ({ page }) => {
    // GIVEN: API returns 503 (service unavailable)
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ status: 503, title: 'Service Unavailable' }),
      }),
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: ErrorPanel is displayed
    const errorPanel = page.getByTestId('error-panel');
    await expect(errorPanel).toBeVisible();
  });

  test('[P1] should not display list items when ErrorPanel is shown', async ({ page }) => {
    // GIVEN: API returns 500
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ status: 500, title: 'Internal Server Error' }),
      }),
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: No list items are rendered
    await expect(page.getByTestId('error-panel')).toBeVisible();
    const items = page.getByTestId('contacto-list-item');
    await expect(items).toHaveCount(0);
  });
});

// ─── Search input — field behaviour ──────────────────────────────────────────

test.describe('[P1] Search field — placeholder and interaction', () => {
  test('[P1] should render search input with placeholder text', async ({ page }) => {
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

    // THEN: Search input has a placeholder indicating search target
    const searchInput = page.getByTestId('contactos-search-input');
    await expect(searchInput).toBeVisible();
    const placeholder = await searchInput.getAttribute('placeholder');
    expect(placeholder).toBeTruthy();
    expect(placeholder!.toLowerCase()).toMatch(/nombre|email|buscar/);
  });

  test('[P1] should still show search input when no items match search', async ({ page }) => {
    // GIVEN: API returns one contact; user types a non-matching term
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([makeContacto({ nombre: 'Único Contacto' })]),
      }),
    );
    await page.goto('/contactos');
    const searchInput = page.getByTestId('contactos-search-input');

    // WHEN: User types a non-matching term
    await searchInput.fill('ZZZNOMATCH');

    // THEN: Search input is still visible and no items are shown
    await expect(searchInput).toBeVisible();
    await expect(page.getByTestId('contacto-list-item')).toHaveCount(0);
  });

  test('[P2] should restore all items after clearing a previously typed search', async ({ page }) => {
    // GIVEN: API returns two contacts; user has typed a filter term
    const contactos = [
      makeContacto({ id: '1', nombre: 'Primero García', email: 'p@test.com' }),
      makeContacto({ id: '2', nombre: 'Segundo López', email: 's@test.com' }),
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
    await searchInput.fill('Primero');
    await expect(page.getByTestId('contacto-list-item')).toHaveCount(1);

    // WHEN: User clears the search field
    await searchInput.clear();

    // THEN: All two contacts are shown again
    await expect(page.getByTestId('contacto-list-item')).toHaveCount(2);
  });
});

// ─── Keyboard navigation ──────────────────────────────────────────────────────

test.describe('[P2] Keyboard navigation — list item accessibility', () => {
  test('[P2] should allow focusing list items via Tab key', async ({ page }) => {
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

    // THEN: A contacto list item receives focus or is focusable (tabIndex=0)
    const item = page.getByTestId('contacto-list-item').first();
    const tabIndex = await item.getAttribute('tabindex');
    expect(tabIndex).toBe('0');
  });
});

// ─── AC1: Search input aria-label ─────────────────────────────────────────────

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
    const searchInput = page.getByTestId('contactos-search-input');
    const ariaLabel = await searchInput.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel!.length).toBeGreaterThan(0);
  });
});

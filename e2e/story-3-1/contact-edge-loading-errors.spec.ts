/**
 * Story 3.1: Contact List & Search — Edge Cases (Loading + Contacts + Errors)
 * testarch-automate expansion (BMad-Integrated Mode)
 *
 * Covers:
 * - Loading skeleton visible while fetch is in-flight
 * - Multiple contacts rendered simultaneously
 * - Contact with null clienteId renders without error
 * - ErrorPanel shown on 503 / 500
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
    await expect(page.getByTestId('contactos-list-container')).toBeVisible();

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
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    // WHEN: User navigates to /contactos
    const navPromise = page.goto('/contactos');

    // THEN: Search input is rendered immediately (not blocked by data loading)
    await expect(page.getByTestId('contactos-search-input')).toBeVisible();

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
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contactos) }),
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: Three list items are displayed
    await expect(page.getByTestId('contacto-list-item')).toHaveCount(3);
  });

  test('[P1] should display nombre for each contact item', async ({ page }) => {
    // GIVEN: API returns a contact with known nombre
    const contacto = makeContacto({ nombre: 'Luisa Fernández', cargo: 'Analista Senior', email: 'luisa@empresa.com' });
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([contacto]) }),
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: The item shows the nombre
    await expect(page.getByTestId('contacto-list-item').first()).toContainText('Luisa Fernández');
  });

  test('[P1] should display cargo for each contact item', async ({ page }) => {
    // GIVEN: API returns a contact with known cargo
    const contacto = makeContacto({ nombre: 'Luisa Fernández', cargo: 'Analista Senior', email: 'luisa@empresa.com' });
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([contacto]) }),
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: The item shows the cargo
    await expect(page.getByTestId('contacto-list-item').first()).toContainText('Analista Senior');
  });

  test('[P1] should display email for each contact item', async ({ page }) => {
    // GIVEN: API returns a contact with known email
    const contacto = makeContacto({ nombre: 'Luisa Fernández', cargo: 'Analista Senior', email: 'luisa@empresa.com' });
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([contacto]) }),
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: The item shows the email
    await expect(page.getByTestId('contacto-list-item').first()).toContainText('luisa@empresa.com');
  });
});

// ─── Contact with null clienteId ─────────────────────────────────────────────

test.describe('[P1] Contact with null clienteId — renders without error', () => {
  test('[P1] should render orphan contact (null clienteId) in the list', async ({ page }) => {
    // GIVEN: API returns a contact with clienteId = null (orphan contact)
    const orphan = makeContacto({ nombre: 'Contacto Huérfano', clienteId: null });
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([orphan]) }),
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: Contact nombre is displayed in the list
    await expect(page.getByTestId('contacto-list-item').first()).toContainText('Contacto Huérfano');
  });

  test('[P1] should NOT show ErrorPanel for orphan contact (null clienteId)', async ({ page }) => {
    // GIVEN: API returns a contact with clienteId = null (orphan contact)
    const orphan = makeContacto({ nombre: 'Contacto Huérfano', clienteId: null });
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([orphan]) }),
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: ErrorPanel is NOT shown (no rendering error)
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
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('[P1] should display ErrorPanel when API returns 500', async ({ page }) => {
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

    // THEN: ErrorPanel is displayed
    await expect(page.getByTestId('error-panel')).toBeVisible();
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
    await expect(page.getByTestId('contacto-list-item')).toHaveCount(0);
  });
});

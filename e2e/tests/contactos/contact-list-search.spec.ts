/**
 * E2E Tests — Story 3.1: Contact List & Search
 * RED PHASE — Tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — /contactos renders full-page table view (ContactoListView) with Nombre, Cargo, Email per item
 *   AC2 — Real-time client-side search by Nombre or Email (case-insensitive, < 1s with 1,000 records, no new API call)
 *   AC3 — EmptyState shown when API returns empty array (Spanish guidance message)
 *   AC4 — ErrorPanel with "Reintentar" shown on fetch failure; retry triggers re-fetch
 *   AC5 — Clicking a contact row updates URL to /contactos/:contactoId (client-side nav, no full reload)
 *   AC6 — Single GET /api/v1/contactos on mount, response cached under queryKey ['contactos']
 *   AC7 — Skeleton loader rendered while fetch is in-flight (no spinner)
 *
 * Required data-testid attributes (must be added during implementation):
 *   - contactos-view              → root wrapper of the /contactos page
 *   - contacto-list-view          → ContactoListView root element
 *   - contact-search-input        → search <input> with placeholder "Buscar por nombre o email..."
 *   - contact-list-item-{id}      → each contact row in the table
 *   - contacto-list-skeleton      → skeleton loader container
 *   - empty-state                 → EmptyState component
 *   - error-panel                 → ErrorPanel component
 *   - retry-button                → "Reintentar" button inside ErrorPanel
 *
 * Network intercept strategy: ALWAYS intercept routes BEFORE navigation (network-first).
 */

import { test, expect } from '@playwright/test';
import { createContactoDto, createContactoDtos } from '../../support/factories/contacto.factory';

const API_CONTACTOS = '**/api/v1/contactos';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Full-page table view with Nombre, Cargo, Email per contact item
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Contact list renders full-page table on /contactos', () => {
  test('should render the contactos-view wrapper and the ContactoListView root', async ({ page }) => {
    // GIVEN: Two contacts exist in the system
    const contactos = createContactoDtos(2);

    // WHEN: Route is intercepted before navigation (network-first)
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contactos) })
    );
    await page.goto('/contactos');

    // THEN: The page wrapper and list view are visible
    await expect(page.getByTestId('contactos-view')).toBeVisible();
    await expect(page.getByTestId('contacto-list-view')).toBeVisible();
  });

  test('should render a contact row for each contact returned by the API', async ({ page }) => {
    // GIVEN: Three contacts exist in the system
    const contactos = createContactoDtos(3);

    // WHEN: API returns the list and user navigates to /contactos
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contactos) })
    );
    await page.goto('/contactos');

    // THEN: Three contact rows are visible
    await expect(page.getByTestId(`contact-list-item-${contactos[0].id}`)).toBeVisible();
    await expect(page.getByTestId(`contact-list-item-${contactos[1].id}`)).toBeVisible();
    await expect(page.getByTestId(`contact-list-item-${contactos[2].id}`)).toBeVisible();
  });

  test('should display Nombre in each contact row', async ({ page }) => {
    // GIVEN: A contact with a specific Nombre
    const contacto = createContactoDto({ nombre: 'Juan Pérez López' });

    // WHEN: The list renders
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([contacto]) })
    );
    await page.goto('/contactos');

    // THEN: The Nombre is visible inside the contact row
    await expect(page.getByTestId(`contact-list-item-${contacto.id}`)).toContainText('Juan Pérez López');
  });

  test('should display Cargo in each contact row', async ({ page }) => {
    // GIVEN: A contact with a specific Cargo
    const contacto = createContactoDto({ cargo: 'Director de Ventas' });

    // WHEN: The list renders
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([contacto]) })
    );
    await page.goto('/contactos');

    // THEN: The Cargo is visible inside the contact row
    await expect(page.getByTestId(`contact-list-item-${contacto.id}`)).toContainText('Director de Ventas');
  });

  test('should display Email in each contact row', async ({ page }) => {
    // GIVEN: A contact with a specific Email
    const contacto = createContactoDto({ email: 'juan.perez@empresa.com' });

    // WHEN: The list renders
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([contacto]) })
    );
    await page.goto('/contactos');

    // THEN: The Email is visible inside the contact row
    await expect(page.getByTestId(`contact-list-item-${contacto.id}`)).toContainText('juan.perez@empresa.com');
  });

  test('should render list wrapped in a section with aria-label="Lista de contactos" (WCAG 2.1 AA)', async ({ page }) => {
    // GIVEN: Contacts exist
    const contactos = createContactoDtos(1);

    // WHEN: The page renders
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contactos) })
    );
    await page.goto('/contactos');

    // THEN: The list is wrapped in a <section> with the correct ARIA label
    const section = page.locator('section[aria-label="Lista de contactos"]');
    await expect(section).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Real-time search filter (client-side, no new API call)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Real-time search filter by Nombre or Email', () => {
  test('should render the search input with correct Spanish placeholder text', async ({ page }) => {
    // GIVEN: Contacts are loaded
    const contactos = createContactoDtos(1);

    // WHEN: The list view renders
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contactos) })
    );
    await page.goto('/contactos');

    // THEN: The search input is visible with Spanish placeholder
    const searchInput = page.getByTestId('contact-search-input');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', /buscar por nombre o email/i);
  });

  test('should filter the list by Nombre when user types in the search input', async ({ page }) => {
    // GIVEN: Two contacts with different names
    const match = createContactoDto({ nombre: 'Contacto Para Filtrar' });
    const noMatch = createContactoDto({ nombre: 'Otro Contacto XYZ' });

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([match, noMatch]),
      })
    );
    await page.goto('/contactos');

    // WHEN: User types a partial Nombre into the search input
    await page.getByTestId('contact-search-input').fill('Para Filtrar');

    // THEN: Only the matching contact row is visible
    await expect(page.getByTestId(`contact-list-item-${match.id}`)).toBeVisible();
    await expect(page.getByTestId(`contact-list-item-${noMatch.id}`)).not.toBeVisible();
  });

  test('should filter the list by Email when user types in the search input', async ({ page }) => {
    // GIVEN: Two contacts with distinct emails
    const match = createContactoDto({ email: 'filtrar.esto@empresa.com' });
    const noMatch = createContactoDto({ email: 'otro.correo@distinto.com' });

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([match, noMatch]),
      })
    );
    await page.goto('/contactos');

    // WHEN: User types a partial email
    await page.getByTestId('contact-search-input').fill('filtrar.esto');

    // THEN: Only the matching contact row is visible
    await expect(page.getByTestId(`contact-list-item-${match.id}`)).toBeVisible();
    await expect(page.getByTestId(`contact-list-item-${noMatch.id}`)).not.toBeVisible();
  });

  test('should filter case-insensitively (lowercase input matches uppercase Nombre)', async ({ page }) => {
    // GIVEN: A contact with a mixed-case Nombre
    const contacto = createContactoDto({ nombre: 'Empresa MAYUSCULAS Contact' });

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([contacto]) })
    );
    await page.goto('/contactos');

    // WHEN: User types lowercase search term
    await page.getByTestId('contact-search-input').fill('mayusculas');

    // THEN: The item is still visible (case-insensitive match)
    await expect(page.getByTestId(`contact-list-item-${contacto.id}`)).toBeVisible();
  });

  test('should restore the full list when search input is cleared', async ({ page }) => {
    // GIVEN: Two contacts, one filtered out
    const contactoA = createContactoDto({ nombre: 'Alpha Contact' });
    const contactoB = createContactoDto({ nombre: 'Beta Contact' });

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([contactoA, contactoB]),
      })
    );
    await page.goto('/contactos');
    await page.getByTestId('contact-search-input').fill('Alpha');
    await expect(page.getByTestId(`contact-list-item-${contactoB.id}`)).not.toBeVisible();

    // WHEN: Search input is cleared
    await page.getByTestId('contact-search-input').fill('');

    // THEN: Both contacts are visible again
    await expect(page.getByTestId(`contact-list-item-${contactoA.id}`)).toBeVisible();
    await expect(page.getByTestId(`contact-list-item-${contactoB.id}`)).toBeVisible();
  });

  test('should NOT trigger a new API call when filtering (client-side only)', async ({ page }) => {
    // GIVEN: Initial GET returns contact list
    const contactos = createContactoDtos(5);
    let apiCallCount = 0;

    await page.route(API_CONTACTOS, (route) => {
      apiCallCount++;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(contactos),
      });
    });
    await page.goto('/contactos');

    // WHEN: User types in search multiple times
    await page.getByTestId('contact-search-input').fill('contacto');
    await page.getByTestId('contact-search-input').fill('con');
    await page.getByTestId('contact-search-input').fill('c');

    // THEN: Only the initial mount call was made (exactly 1)
    expect(apiCallCount).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — EmptyState when API returns empty array
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — EmptyState on empty contact list', () => {
  test('should render the EmptyState component when API returns an empty array', async ({ page }) => {
    // GIVEN: No contacts in the system (API returns [])
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: EmptyState component is displayed
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });

  test('should display Spanish guidance text in EmptyState pointing to contact creation', async ({ page }) => {
    // GIVEN: No contacts (empty array)
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: Guidance message contains expected Spanish text
    await expect(page.getByTestId('empty-state')).toContainText(/No hay contactos registrados/i);
  });

  test('should NOT render any contact rows when the list is empty', async ({ page }) => {
    // GIVEN: No contacts (empty array)
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: No contact list items exist in the DOM
    await expect(page.locator('[data-testid^="contact-list-item-"]')).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — ErrorPanel on fetch failure + Reintentar retry
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — ErrorPanel on fetch failure with Reintentar retry', () => {
  test('should render the ErrorPanel component when the backend returns a 500 error', async ({ page }) => {
    // GIVEN: Backend is unavailable (returns 500)
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Error' }) })
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: ErrorPanel is displayed instead of the contact list
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('should render the ErrorPanel component on a network error', async ({ page }) => {
    // GIVEN: Network fails (connection refused simulation)
    await page.route(API_CONTACTOS, (route) => route.abort('failed'));

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: ErrorPanel is displayed
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('should render a "Reintentar" button inside the ErrorPanel', async ({ page }) => {
    // GIVEN: Backend returns error
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: A "Reintentar" button is visible
    await expect(page.getByTestId('retry-button')).toBeVisible();
  });

  test('should trigger a new fetch when "Reintentar" button is clicked', async ({ page }) => {
    // GIVEN: First request fails, second succeeds
    let callCount = 0;
    const contacto = createContactoDto();

    await page.route(API_CONTACTOS, (route) => {
      callCount++;
      if (callCount === 1) {
        return route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([contacto]),
      });
    });

    await page.goto('/contactos');
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // WHEN: User clicks "Reintentar"
    await page.getByTestId('retry-button').click();

    // THEN: A second API call is made and the list renders
    await expect(page.getByTestId(`contact-list-item-${contacto.id}`)).toBeVisible();
    expect(callCount).toBe(2);
  });

  test('should NOT render contact rows when in error state', async ({ page }) => {
    // GIVEN: Backend error
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 503, contentType: 'application/json', body: '{}' })
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: No contact rows rendered
    await expect(page.locator('[data-testid^="contact-list-item-"]')).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Click contact row: URL updates to /contactos/:contactoId (client-side nav)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Contact row click navigates to /contactos/:contactoId', () => {
  test('should update URL to /contactos/:contactoId when a row is clicked', async ({ page }) => {
    // GIVEN: A contact exists in the list
    const contacto = createContactoDto({ id: '11111111-1111-1111-1111-111111111111' });

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([contacto]) })
    );
    await page.goto('/contactos');

    // WHEN: User clicks on the contact row
    await page.getByTestId(`contact-list-item-${contacto.id}`).click();

    // THEN: URL changes to /contactos/:contactoId without full page reload
    await expect(page).toHaveURL(/\/contactos\/11111111-1111-1111-1111-111111111111/);
  });

  test('should NOT reload the full page when navigating to /contactos/:contactoId (client-side nav)', async ({ page }) => {
    // GIVEN: A contact exists
    const contacto = createContactoDto({ id: '22222222-2222-2222-2222-222222222222' });

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([contacto]) })
    );
    await page.goto('/contactos');

    // Track navigation events — a full page reload triggers 'load' event
    let fullReloadDetected = false;
    page.on('load', () => { fullReloadDetected = true; });
    fullReloadDetected = false; // Reset after initial load

    // WHEN: User clicks the contact row
    await page.getByTestId(`contact-list-item-${contacto.id}`).click();
    await page.waitForURL(/\/contactos\//);

    // THEN: No full page reload occurred (TanStack Router client-side navigation)
    expect(fullReloadDetected).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Single GET /api/v1/contactos on mount, cached under queryKey ['contactos']
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Single API request on mount with TanStack Query caching', () => {
  test('should send exactly one GET /api/v1/contactos request when the page mounts', async ({ page }) => {
    // GIVEN: The contactos page is about to load
    const contactos = createContactoDtos(3);
    let getCallCount = 0;

    await page.route(API_CONTACTOS, (route) => {
      getCallCount++;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(contactos),
      });
    });

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');
    await expect(page.getByTestId(`contact-list-item-${contactos[0].id}`)).toBeVisible();

    // THEN: Only one GET request was sent
    expect(getCallCount).toBe(1);
  });

  test('should NOT send additional GET requests when the search input is used', async ({ page }) => {
    // GIVEN: Initial load with 3 contacts
    const contactos = createContactoDtos(3);
    let getCallCount = 0;

    await page.route(API_CONTACTOS, (route) => {
      getCallCount++;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(contactos),
      });
    });
    await page.goto('/contactos');
    await expect(page.getByTestId(`contact-list-item-${contactos[0].id}`)).toBeVisible();

    // WHEN: User searches multiple times
    await page.getByTestId('contact-search-input').fill('test');
    await page.getByTestId('contact-search-input').fill('contacto');
    await page.getByTestId('contact-search-input').fill('');

    // THEN: Still only one GET request (TanStack Query cache hit)
    expect(getCallCount).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC7 — Skeleton loader while fetch is in-flight (no spinner)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 — Skeleton loader during data fetch', () => {
  test('should render the skeleton loader while the API request is in flight', async ({ page }) => {
    // GIVEN: API is held pending via a deferred resolver (no hard wait — release-controlled)
    const contactos = createContactoDtos(3);
    let releaseRoute!: () => void;
    const routeHeld = new Promise<void>((resolve) => { releaseRoute = resolve; });

    await page.route(API_CONTACTOS, async (route) => {
      await routeHeld; // blocks until released by the test
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(contactos),
      });
    });

    // WHEN: User navigates to /contactos (route is still held — loading state active)
    const gotoPromise = page.goto('/contactos');

    // THEN: Skeleton is visible before data arrives
    await expect(page.getByTestId('contacto-list-skeleton')).toBeVisible();

    // Cleanup: release the route and wait for navigation to complete
    releaseRoute();
    await gotoPromise;
  });

  test('should NOT render a spinner during loading (skeleton only, no spinner)', async ({ page }) => {
    // GIVEN: API is held pending via deferred resolver (no hard wait)
    let releaseRoute!: () => void;
    const routeHeld = new Promise<void>((resolve) => { releaseRoute = resolve; });

    await page.route(API_CONTACTOS, async (route) => {
      await routeHeld;
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    // WHEN: User navigates to /contactos (loading state active)
    const gotoPromise = page.goto('/contactos');

    // THEN: No spinner element in the DOM while loading
    const spinner = page.locator('[role="progressbar"], .spinner, [data-testid="spinner"]');
    await expect(spinner).toHaveCount(0);

    // Cleanup
    releaseRoute();
    await gotoPromise;
  });

  test('should hide the skeleton loader once contact data is fully loaded', async ({ page }) => {
    // GIVEN: API returns contacts normally
    const contactos = createContactoDtos(2);

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contactos) })
    );

    // WHEN: User navigates and data loads
    await page.goto('/contactos');
    await expect(page.getByTestId(`contact-list-item-${contactos[0].id}`)).toBeVisible();

    // THEN: Skeleton is no longer visible
    await expect(page.getByTestId('contacto-list-skeleton')).not.toBeVisible();
  });
});

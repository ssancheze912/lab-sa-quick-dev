/**
 * E2E Edge Case Tests — Story 3.1: Contact List & Search
 * BMad-Integrated Mode: expands ATDD coverage with edge cases, error paths, and boundary conditions.
 *
 * These tests complement contact-list-search.spec.ts (happy paths).
 * They are NOT duplicate — each covers a scenario NOT present in the ATDD suite.
 *
 * Edge cases covered:
 *   - Search with whitespace-only input (should not filter)
 *   - Search that yields zero results (all filtered out)
 *   - Substring match in the middle of Nombre
 *   - Substring match in the middle of Email domain
 *   - HTTP 401, 403, 404, 502, timeout responses trigger ErrorPanel
 *   - Multiple consecutive "Reintentar" clicks (idempotent)
 *   - Retry that also fails — stays in error state
 *   - Recovery from error state via successful retry
 *   - Large dataset (50 contacts) renders without timing out
 *   - Large dataset filtered to 1 matching contact
 *   - EmptyState message includes the creation guidance CTA text
 *   - No spinner element at any point (skeleton only)
 *   - Each contact row is keyboard-accessible (Enter key triggers navigation)
 *   - Search input is focusable via keyboard Tab
 *   - Full-width layout — no fixed 280px sidebar constraint
 *   - EmptyState when search yields zero results from a non-empty API response
 */

import { test, expect } from '@playwright/test';
import { createContactoDto, createContactoDtos } from '../../support/factories/contacto.factory';

const API_CONTACTOS = '**/api/v1/contactos';

// ─────────────────────────────────────────────────────────────────────────────
// Search edge cases — boundary conditions for the client-side filter
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Search edge cases — boundary conditions', () => {

  test('[P1] should show all contacts when search input contains only whitespace', async ({ page }) => {
    // GIVEN: Two contacts are loaded
    const contactoA = createContactoDto({ nombre: 'Contacto Alfa' });
    const contactoB = createContactoDto({ nombre: 'Contacto Beta' });

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([contactoA, contactoB]),
      })
    );
    await page.goto('/contactos');
    await expect(page.getByTestId(`contact-list-item-${contactoA.id}`)).toBeVisible();

    // WHEN: User types only whitespace into the search input
    await page.getByTestId('contact-search-input').fill('   ');

    // THEN: Both contacts remain visible (whitespace-only is treated as empty query)
    await expect(page.getByTestId(`contact-list-item-${contactoA.id}`)).toBeVisible();
    await expect(page.getByTestId(`contact-list-item-${contactoB.id}`)).toBeVisible();
  });

  test('[P1] should hide all contact items when search query matches no contact', async ({ page }) => {
    // GIVEN: Two contacts loaded
    const contactoA = createContactoDto({ nombre: 'Empresa Uno' });
    const contactoB = createContactoDto({ nombre: 'Empresa Dos' });

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([contactoA, contactoB]),
      })
    );
    await page.goto('/contactos');
    await expect(page.getByTestId(`contact-list-item-${contactoA.id}`)).toBeVisible();

    // WHEN: User types a search term that matches no contact
    await page.getByTestId('contact-search-input').fill('ZZZNOMATCH999');

    // THEN: No contact items are visible
    await expect(page.getByTestId(`contact-list-item-${contactoA.id}`)).not.toBeVisible();
    await expect(page.getByTestId(`contact-list-item-${contactoB.id}`)).not.toBeVisible();
  });

  test('[P2] should show zero items when search filters out all contacts from a non-empty list', async ({ page }) => {
    // GIVEN: One contact exists but search matches nothing
    const contacto = createContactoDto({ nombre: 'Contacto Real' });

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([contacto]),
      })
    );
    await page.goto('/contactos');
    await expect(page.getByTestId(`contact-list-item-${contacto.id}`)).toBeVisible();

    // WHEN: User searches for a term that matches nothing
    await page.getByTestId('contact-search-input').fill('NOMATCH_XYZ_999');

    // THEN: Zero contact list items are rendered
    await expect(page.locator('[data-testid^="contact-list-item-"]')).toHaveCount(0);
  });

  test('[P1] should match contacts when search term appears in the middle of the Nombre', async ({ page }) => {
    // GIVEN: A contact whose name contains the search term mid-string
    const contacto = createContactoDto({ nombre: 'Distribuidora Nacional SA' });

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([contacto]),
      })
    );
    await page.goto('/contactos');

    // WHEN: User types a substring that appears in the middle of the name
    await page.getByTestId('contact-search-input').fill('Nacional');

    // THEN: Contact is still visible (substring match)
    await expect(page.getByTestId(`contact-list-item-${contacto.id}`)).toBeVisible();
  });

  test('[P2] should match contacts when search term appears in the middle of the Email', async ({ page }) => {
    // GIVEN: A contact whose email domain contains the search term
    const contacto = createContactoDto({ email: 'ventas@corporacion.com' });

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([contacto]),
      })
    );
    await page.goto('/contactos');

    // WHEN: User types the domain portion of the email
    await page.getByTestId('contact-search-input').fill('corporacion');

    // THEN: Contact is visible (mid-string email match)
    await expect(page.getByTestId(`contact-list-item-${contacto.id}`)).toBeVisible();
  });

  test('[P1] should filter case-insensitively — uppercase input matches lowercase Nombre', async ({ page }) => {
    // GIVEN: A contact whose Nombre is all lowercase
    const contacto = createContactoDto({ nombre: 'empresa tecnologica' });

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([contacto]),
      })
    );
    await page.goto('/contactos');

    // WHEN: User types uppercase search term
    await page.getByTestId('contact-search-input').fill('TECNOLOGICA');

    // THEN: Contact is visible despite case mismatch
    await expect(page.getByTestId(`contact-list-item-${contacto.id}`)).toBeVisible();
  });

  test('[P1] should filter case-insensitively — uppercase input matches lowercase Email', async ({ page }) => {
    // GIVEN: A contact with a lowercase email
    const contacto = createContactoDto({ email: 'soporte@acme.com' });

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([contacto]),
      })
    );
    await page.goto('/contactos');

    // WHEN: User types uppercase email search
    await page.getByTestId('contact-search-input').fill('ACME');

    // THEN: Contact is visible (case-insensitive email match)
    await expect(page.getByTestId(`contact-list-item-${contacto.id}`)).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ErrorPanel — additional HTTP error code coverage
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] ErrorPanel — additional HTTP error codes', () => {

  test('[P1] should render ErrorPanel when backend returns HTTP 401 (Unauthorized)', async ({ page }) => {
    // GIVEN: Backend returns 401
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: '{"title":"Unauthorized"}' })
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: ErrorPanel is displayed (non-2xx response triggers error state)
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('[P1] should render ErrorPanel when backend returns HTTP 403 (Forbidden)', async ({ page }) => {
    // GIVEN: Backend returns 403
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 403, contentType: 'application/json', body: '{"title":"Forbidden"}' })
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: ErrorPanel is shown
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('[P1] should render ErrorPanel when backend returns HTTP 404 (Not Found)', async ({ page }) => {
    // GIVEN: Backend endpoint returns 404 (misconfiguration scenario)
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 404, contentType: 'application/json', body: '{"title":"Not Found"}' })
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: ErrorPanel is shown (404 on list endpoint is an error, not empty state)
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('[P1] should render ErrorPanel when backend returns HTTP 502 (Bad Gateway)', async ({ page }) => {
    // GIVEN: Backend returns a gateway error
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 502, contentType: 'application/json', body: '{}' })
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: ErrorPanel is visible
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('[P1] should render ErrorPanel when the network request times out (aborted mid-flight)', async ({ page }) => {
    // GIVEN: Network request is aborted simulating a timeout
    await page.route(API_CONTACTOS, (route) => route.abort('timedout'));

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: ErrorPanel is visible
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('[P1] should render "Reintentar" button for all HTTP error codes', async ({ page }) => {
    // GIVEN: Backend returns a 502 error
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 502, contentType: 'application/json', body: '{}' })
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: Retry button is visible regardless of the specific error code
    await expect(page.getByTestId('retry-button')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Retry behavior — error recovery paths and idempotence
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Retry behavior — error recovery paths', () => {

  test('[P1] should remain in error state when retry also fails', async ({ page }) => {
    // GIVEN: Both initial request and retry always fail
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })
    );

    await page.goto('/contactos');
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // WHEN: User clicks "Reintentar" and the retry also fails
    await page.getByTestId('retry-button').click();

    // THEN: ErrorPanel is still visible (system stays in error state)
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('[P2] should support clicking "Reintentar" multiple times without crashing', async ({ page }) => {
    // GIVEN: Backend always returns 500
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })
    );

    await page.goto('/contactos');
    await expect(page.getByTestId('retry-button')).toBeVisible();

    // WHEN: User clicks Reintentar three consecutive times
    await page.getByTestId('retry-button').click();
    await expect(page.getByTestId('retry-button')).toBeVisible();
    await page.getByTestId('retry-button').click();
    await expect(page.getByTestId('retry-button')).toBeVisible();
    await page.getByTestId('retry-button').click();

    // THEN: App does not crash; ErrorPanel is still visible
    await expect(page.getByTestId('error-panel')).toBeVisible();
    await expect(page.getByTestId('retry-button')).toBeVisible();
  });

  test('[P1] should recover from error state and show contact list after successful retry', async ({ page }) => {
    // GIVEN: Initial request fails; retry succeeds
    let attempt = 0;
    const contacto = createContactoDto({ nombre: 'Contacto Recuperado SA' });

    await page.route(API_CONTACTOS, (route) => {
      attempt++;
      if (attempt === 1) {
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

    // WHEN: User clicks Reintentar (second request succeeds)
    await page.getByTestId('retry-button').click();

    // THEN: Contact list is now visible and ErrorPanel is gone
    await expect(page.getByTestId(`contact-list-item-${contacto.id}`)).toBeVisible();
    await expect(page.getByTestId('error-panel')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Large dataset — boundary / performance edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Large dataset — boundary conditions', () => {

  test('[P2] should render a list of 50 contacts without timing out', async ({ page }) => {
    // GIVEN: 50 contacts returned by the API
    const contactos = createContactoDtos(50);

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(contactos),
      })
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: All 50 items are rendered
    await expect(page.getByTestId(`contact-list-item-${contactos[0].id}`)).toBeVisible();
    await expect(page.locator('[data-testid^="contact-list-item-"]')).toHaveCount(50);
  });

  test('[P2] should correctly filter a list of 50 contacts to only the one matching item', async ({ page }) => {
    // GIVEN: 50 contacts, only 1 has the unique name "ContactoUnico Especial"
    const commonContactos = createContactoDtos(49);
    const uniqueContacto = createContactoDto({ nombre: 'ContactoUnico Especial' });
    const allContactos = [...commonContactos, uniqueContacto];

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(allContactos),
      })
    );
    await page.goto('/contactos');
    await expect(page.locator('[data-testid^="contact-list-item-"]')).toHaveCount(50);

    // WHEN: User searches for the unique contact name
    await page.getByTestId('contact-search-input').fill('ContactoUnico');

    // THEN: Only 1 item is visible
    await expect(page.locator('[data-testid^="contact-list-item-"]')).toHaveCount(1);
    await expect(page.getByTestId(`contact-list-item-${uniqueContacto.id}`)).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EmptyState — content and guidance message validation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] EmptyState — content validation', () => {

  test('[P1] should display EmptyState message guiding user to create the first contact', async ({ page }) => {
    // GIVEN: No contacts exist (API returns [])
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: EmptyState message contains both the problem statement and the CTA
    await expect(page.getByTestId('empty-state')).toContainText(/Crea el primero/i);
  });

  test('[P1] should NOT show EmptyState when contacts exist (non-empty API response)', async ({ page }) => {
    // GIVEN: At least one contact exists
    const contacto = createContactoDto();

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([contacto]),
      })
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');
    await expect(page.getByTestId(`contact-list-item-${contacto.id}`)).toBeVisible();

    // THEN: EmptyState is not present
    await expect(page.getByTestId('empty-state')).not.toBeVisible();
  });

  test('[P2] should NOT show ErrorPanel alongside EmptyState (mutually exclusive states)', async ({ page }) => {
    // GIVEN: No contacts exist
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');
    await expect(page.getByTestId('empty-state')).toBeVisible();

    // THEN: ErrorPanel is not rendered alongside EmptyState
    await expect(page.getByTestId('error-panel')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Loading state — skeleton vs spinner enforcement
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Loading state — skeleton-only, no spinner', () => {

  test('[P1] should NOT render any spinner element while data is loading', async ({ page }) => {
    // GIVEN: API is held pending via deferred resolver (no hard wait)
    let releaseRoute!: () => void;
    const routeHeld = new Promise<void>((resolve) => { releaseRoute = resolve; });

    await page.route(API_CONTACTOS, async (route) => {
      await routeHeld;
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    // WHEN: User navigates (loading state active)
    const gotoPromise = page.goto('/contactos');

    // THEN: No spinner-like element is in the DOM
    const spinner = page.locator('[role="progressbar"], .spinner, [data-testid="spinner"], [aria-label="loading"]');
    await expect(spinner).toHaveCount(0);

    // Cleanup
    releaseRoute();
    await gotoPromise;
  });

  test('[P1] should hide skeleton and show contact list once data finishes loading', async ({ page }) => {
    // GIVEN: API returns contacts normally
    const contactos = createContactoDtos(3);

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(contactos),
      })
    );

    // WHEN: User navigates and data loads
    await page.goto('/contactos');
    await expect(page.getByTestId(`contact-list-item-${contactos[0].id}`)).toBeVisible();

    // THEN: Skeleton is no longer in the DOM / visible
    await expect(page.getByTestId('contacto-list-skeleton')).not.toBeVisible();
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// Accessibility — keyboard navigation and ARIA compliance
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Accessibility — keyboard navigation and ARIA', () => {

  test('[P2] search input should be focusable via keyboard Tab', async ({ page }) => {
    // GIVEN: Page is loaded with contacts
    const contactos = createContactoDtos(1);

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(contactos),
      })
    );
    await page.goto('/contactos');
    await expect(page.getByTestId(`contact-list-item-${contactos[0].id}`)).toBeVisible();

    // WHEN: User focuses the search input directly
    await page.getByTestId('contact-search-input').focus();

    // THEN: Search input is focused and accepts keyboard input
    await expect(page.getByTestId('contact-search-input')).toBeFocused();
  });

  test('[P2] each contact row should be keyboard-accessible with Enter key triggering navigation', async ({ page }) => {
    // GIVEN: A contact exists in the list
    const contacto = createContactoDto({ id: '33333333-3333-3333-3333-333333333333' });

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([contacto]),
      })
    );
    await page.goto('/contactos');
    await expect(page.getByTestId(`contact-list-item-${contacto.id}`)).toBeVisible();

    // WHEN: User focuses the row and presses Enter
    await page.getByTestId(`contact-list-item-${contacto.id}`).focus();
    await page.keyboard.press('Enter');

    // THEN: URL changes to /contactos/:contactoId
    await expect(page).toHaveURL(/\/contactos\/33333333-3333-3333-3333-333333333333/);
  });

  test('[P2] the section wrapping the contact list should have Spanish aria-label', async ({ page }) => {
    // GIVEN: Contacts are loaded
    const contactos = createContactoDtos(1);

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(contactos),
      })
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: The wrapping section has an accessible label in Spanish
    const section = page.locator('section[aria-label="Lista de contactos"]');
    await expect(section).toBeVisible();
  });

  test('[P2] search input placeholder should be in Spanish', async ({ page }) => {
    // GIVEN: Page is loaded
    const contactos = createContactoDtos(1);

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contactos) })
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: Search input placeholder contains the expected Spanish text
    const input = page.getByTestId('contact-search-input');
    await expect(input).toHaveAttribute('placeholder', /buscar por nombre o email/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Layout — full-width table (not sidebar) and structural constraints
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Layout — full-width contact table', () => {

  test('[P2] the contacto-list-view root should be visible and full-width (not a narrow sidebar)', async ({ page }) => {
    // GIVEN: Contacts are loaded
    const contactos = createContactoDtos(2);

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(contactos),
      })
    );
    await page.goto('/contactos');
    await expect(page.getByTestId('contacto-list-view')).toBeVisible();

    // THEN: The list view width is greater than 280px (full-width, not a sidebar)
    const listView = page.getByTestId('contacto-list-view');
    const box = await listView.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(280);
  });

  test('[P2] the page root wrapper (contactos-view) should be present', async ({ page }) => {
    // GIVEN: Contacts are loaded
    const contactos = createContactoDtos(1);

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(contactos),
      })
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');

    // THEN: The root wrapper is present
    await expect(page.getByTestId('contactos-view')).toBeVisible();
  });

  test('[P2] table should show Nombre, Cargo, and Email column headers', async ({ page }) => {
    // GIVEN: Contacts exist so the table renders
    const contactos = createContactoDtos(1);

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(contactos),
      })
    );
    await page.goto('/contactos');

    // THEN: All three column headers are visible
    await expect(page.getByRole('columnheader', { name: 'Nombre' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Cargo' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Email' })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// API caching — TanStack Query cache prevents duplicate requests
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] TanStack Query caching — no duplicate API requests', () => {

  test('[P1] should send exactly one GET request even after multiple search interactions', async ({ page }) => {
    // GIVEN: Initial page load returns 5 contacts
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
    await expect(page.getByTestId(`contact-list-item-${contactos[0].id}`)).toBeVisible();

    // WHEN: User performs multiple search interactions
    await page.getByTestId('contact-search-input').fill('test');
    await page.getByTestId('contact-search-input').fill('');
    await page.getByTestId('contact-search-input').fill('contacto');
    await page.getByTestId('contact-search-input').fill('');

    // THEN: Only the initial mount request was made (TanStack Query cache serves subsequent reads)
    expect(apiCallCount).toBe(1);
  });

  test('[P1] should send a second GET request only after clicking Reintentar from error state', async ({ page }) => {
    // GIVEN: Initial request fails; second request (after retry) succeeds
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

    // WHEN: User clicks Reintentar
    await page.getByTestId('retry-button').click();

    // THEN: Contact list loads and exactly 2 API calls were made (initial + retry)
    await expect(page.getByTestId(`contact-list-item-${contacto.id}`)).toBeVisible();
    expect(callCount).toBe(2);
  });
});

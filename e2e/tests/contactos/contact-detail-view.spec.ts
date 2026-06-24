/**
 * E2E Tests — Story 3.2: Contact Detail View
 * RED PHASE — Tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Clicking a contact row shows all details (Nombre, Cargo, Teléfono, Email) +
 *          URL updates to /contactos/:contactoId via client-side navigation (no full reload)
 *   AC2 — Direct URL access /contactos/:contactoId fetches correct details from
 *          GET /api/v1/contactos/{id} and displays them
 *   AC3 — Non-existent contactoId (404): displays "Contacto no encontrado." gracefully —
 *          no unhandled error, no stack trace (NFR6)
 *   AC4 — Backend unavailable: ErrorPanel + "Reintentar" button; clicking retry triggers new fetch
 *   AC5 — Loading state: skeleton loader (4 rows, matching 4 visible fields) — no spinner
 *
 * Required data-testid attributes (must be added during implementation):
 *   - contacto-detail-view       → ContactoDetailView root <section>
 *   - contacto-detail-nombre     → field value: Nombre
 *   - contacto-detail-cargo      → field value: Cargo
 *   - contacto-detail-telefono   → field value: Teléfono
 *   - contacto-detail-email      → field value: Email
 *   - contacto-detail-skeleton   → skeleton loader container (4 rows)
 *   - contacto-not-found         → "Contacto no encontrado." message on 404
 *   - error-panel                → ErrorPanel component on non-404 error
 *   - retry-button               → "Reintentar" button inside ErrorPanel
 *   - contact-list-item-{id}     → each contact row in the table (from Story 3.1)
 *
 * Network intercept strategy: ALWAYS intercept routes BEFORE navigation (network-first).
 */

import { test, expect } from '@playwright/test';
import { createContactoDto, createContactoDtos } from '../../support/factories/contacto.factory';

const API_CONTACTOS = '**/api/v1/contactos';
const API_CONTACTO_BY_ID = '**/api/v1/contactos/**';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Clicking a contact row navigates to detail view and updates URL
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Clicking a contact row shows details and updates URL', () => {
  test('should update the URL to /contactos/:contactoId when a contact row is clicked', async ({ page }) => {
    // GIVEN: A contact exists in the list
    const contacto = createContactoDto({ id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' });

    // Network-first: intercept list and detail routes BEFORE navigation
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([contacto]) })
    );
    await page.route(`**/api/v1/contactos/${contacto.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contacto) })
    );

    await page.goto('/contactos');

    // WHEN: User clicks on a contact row
    await page.getByTestId(`contact-list-item-${contacto.id}`).click();

    // THEN: URL updates to /contactos/:contactoId (client-side navigation)
    await expect(page).toHaveURL(/\/contactos\/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/);
  });

  test('should display ContactoDetailView after clicking a contact row', async ({ page }) => {
    // GIVEN: A contact exists in the list
    const contacto = createContactoDto({ id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' });

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([contacto]) })
    );
    await page.route(`**/api/v1/contactos/${contacto.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contacto) })
    );

    await page.goto('/contactos');

    // WHEN: User clicks on the contact row
    await page.getByTestId(`contact-list-item-${contacto.id}`).click();

    // THEN: ContactoDetailView is visible
    await expect(page.getByTestId('contacto-detail-view')).toBeVisible();
  });

  test('should display Nombre in the detail view after clicking a contact row', async ({ page }) => {
    // GIVEN: A contact with a specific Nombre
    const contacto = createContactoDto({
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      nombre: 'Ana García López',
    });

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([contacto]) })
    );
    await page.route(`**/api/v1/contactos/${contacto.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contacto) })
    );

    await page.goto('/contactos');
    await page.getByTestId(`contact-list-item-${contacto.id}`).click();

    // THEN: Nombre is displayed in the detail view
    await expect(page.getByTestId('contacto-detail-nombre')).toHaveText('Ana García López');
  });

  test('should display Cargo in the detail view after clicking a contact row', async ({ page }) => {
    // GIVEN: A contact with a specific Cargo
    const contacto = createContactoDto({
      id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      cargo: 'Directora de Ventas',
    });

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([contacto]) })
    );
    await page.route(`**/api/v1/contactos/${contacto.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contacto) })
    );

    await page.goto('/contactos');
    await page.getByTestId(`contact-list-item-${contacto.id}`).click();

    // THEN: Cargo is displayed in the detail view
    await expect(page.getByTestId('contacto-detail-cargo')).toHaveText('Directora de Ventas');
  });

  test('should display Teléfono in the detail view after clicking a contact row', async ({ page }) => {
    // GIVEN: A contact with a specific Teléfono
    const contacto = createContactoDto({
      id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      telefono: '3175559876',
    });

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([contacto]) })
    );
    await page.route(`**/api/v1/contactos/${contacto.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contacto) })
    );

    await page.goto('/contactos');
    await page.getByTestId(`contact-list-item-${contacto.id}`).click();

    // THEN: Teléfono is displayed in the detail view
    await expect(page.getByTestId('contacto-detail-telefono')).toHaveText('3175559876');
  });

  test('should display Email in the detail view after clicking a contact row', async ({ page }) => {
    // GIVEN: A contact with a specific Email
    const contacto = createContactoDto({
      id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      email: 'ana.garcia@empresa.com',
    });

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([contacto]) })
    );
    await page.route(`**/api/v1/contactos/${contacto.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contacto) })
    );

    await page.goto('/contactos');
    await page.getByTestId(`contact-list-item-${contacto.id}`).click();

    // THEN: Email is displayed in the detail view
    await expect(page.getByTestId('contacto-detail-email')).toHaveText('ana.garcia@empresa.com');
  });

  test('should NOT trigger a full page reload when navigating to /contactos/:contactoId (client-side nav, FR30)', async ({ page }) => {
    // GIVEN: A contact exists
    const contacto = createContactoDto({ id: '11111111-1111-1111-1111-111111111111' });

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([contacto]) })
    );
    await page.route(`**/api/v1/contactos/${contacto.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contacto) })
    );

    await page.goto('/contactos');

    // Track full page reloads
    let fullReloadDetected = false;
    page.on('load', () => { fullReloadDetected = true; });
    fullReloadDetected = false; // reset after initial page load

    // WHEN: User clicks the contact row
    await page.getByTestId(`contact-list-item-${contacto.id}`).click();
    await page.waitForURL(/\/contactos\//);

    // THEN: No full page reload occurred (TanStack Router client-side navigation)
    expect(fullReloadDetected).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Direct URL access /contactos/:contactoId fetches and displays contact
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Direct URL access /contactos/:contactoId loads contact details', () => {
  test('should fetch and display contact details when navigating directly to /contactos/:contactoId', async ({ page }) => {
    // GIVEN: A contact with a known ID
    const contacto = createContactoDto({
      id: '33333333-3333-3333-3333-333333333333',
      nombre: 'Carlos Rodríguez Peña',
    });

    // Network-first: intercept BEFORE navigation
    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([contacto]) })
    );
    await page.route(`**/api/v1/contactos/${contacto.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contacto) })
    );

    // WHEN: User navigates directly to the detail URL
    await page.goto(`/contactos/${contacto.id}`);

    // THEN: The detail view shows the correct contact Nombre
    await expect(page.getByTestId('contacto-detail-nombre')).toHaveText('Carlos Rodríguez Peña');
  });

  test('should send a GET /api/v1/contactos/:id request when accessing detail URL directly', async ({ page }) => {
    // GIVEN: A contact ID is in the URL
    const contacto = createContactoDto({ id: '44444444-4444-4444-4444-444444444444' });
    let detailApiCalled = false;

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([contacto]) })
    );
    await page.route(`**/api/v1/contactos/${contacto.id}`, (route) => {
      detailApiCalled = true;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contacto) });
    });

    // WHEN: Direct URL navigation
    await page.goto(`/contactos/${contacto.id}`);
    await expect(page.getByTestId('contacto-detail-view')).toBeVisible();

    // THEN: The API was called for the individual contact
    expect(detailApiCalled).toBe(true);
  });

  test('should display all four fields (Nombre, Cargo, Teléfono, Email) on direct URL access', async ({ page }) => {
    // GIVEN: A contact with all four fields populated
    const contacto = createContactoDto({
      id: '55555555-5555-5555-5555-555555555555',
      nombre: 'María Fernanda Ospina',
      cargo: 'Gerente Comercial',
      telefono: '3104445566',
      email: 'mfernanda@empresa.co',
    });

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([contacto]) })
    );
    await page.route(`**/api/v1/contactos/${contacto.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contacto) })
    );

    // WHEN: Direct URL access
    await page.goto(`/contactos/${contacto.id}`);

    // THEN: All four fields are rendered
    await expect(page.getByTestId('contacto-detail-nombre')).toHaveText('María Fernanda Ospina');
    await expect(page.getByTestId('contacto-detail-cargo')).toHaveText('Gerente Comercial');
    await expect(page.getByTestId('contacto-detail-telefono')).toHaveText('3104445566');
    await expect(page.getByTestId('contacto-detail-email')).toHaveText('mfernanda@empresa.co');
  });

  test('should render ContactoDetailView within a section with aria-label "Detalle del contacto" (WCAG 2.1 AA)', async ({ page }) => {
    // GIVEN: A contact with a known ID
    const contacto = createContactoDto({ id: '66666666-6666-6666-6666-666666666666' });

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([contacto]) })
    );
    await page.route(`**/api/v1/contactos/${contacto.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contacto) })
    );

    // WHEN: Direct URL access
    await page.goto(`/contactos/${contacto.id}`);
    await expect(page.getByTestId('contacto-detail-view')).toBeVisible();

    // THEN: The root element is a section with the correct aria-label
    await expect(page.getByRole('region', { name: 'Detalle del contacto' })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Non-existent contactoId (404): graceful not-found message
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Non-existent contactoId shows graceful not-found message (NFR6)', () => {
  test('should display "Contacto no encontrado." when backend returns 404', async ({ page }) => {
    // GIVEN: A contactoId that does not exist (backend returns 404 Problem Details)
    const nonExistentId = '99999999-9999-9999-9999-999999999999';

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.route(`**/api/v1/contactos/${nonExistentId}`, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 404,
          title: 'Not Found',
          detail: `Contacto with id '${nonExistentId}' was not found.`,
        }),
      })
    );

    // WHEN: User navigates directly to the non-existent contact URL
    await page.goto(`/contactos/${nonExistentId}`);

    // THEN: A graceful not-found message is displayed
    await expect(page.getByTestId('contacto-not-found')).toBeVisible();
    await expect(page.getByTestId('contacto-not-found')).toContainText('Contacto no encontrado.');
  });

  test('should NOT display an unhandled error or stack trace when backend returns 404', async ({ page }) => {
    // GIVEN: A contactoId that does not exist
    const nonExistentId = '88888888-8888-8888-8888-888888888888';

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.route(`**/api/v1/contactos/${nonExistentId}`, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ status: 404, title: 'Not Found' }),
      })
    );

    // Track uncaught JS errors (stack traces in the browser)
    const uncaughtErrors: string[] = [];
    page.on('pageerror', (err) => uncaughtErrors.push(err.message));

    // WHEN: User navigates to non-existent URL
    await page.goto(`/contactos/${nonExistentId}`);
    await expect(page.getByTestId('contacto-not-found')).toBeVisible();

    // THEN: No uncaught JS errors (no stack traces shown in browser)
    expect(uncaughtErrors).toHaveLength(0);
  });

  test('should NOT render the ErrorPanel component when backend returns 404 (not-found is different from error)', async ({ page }) => {
    // GIVEN: A non-existent contactoId
    const nonExistentId = '77777777-7777-7777-7777-777777777777';

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.route(`**/api/v1/contactos/${nonExistentId}`, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ status: 404, title: 'Not Found' }),
      })
    );

    // WHEN: 404 scenario
    await page.goto(`/contactos/${nonExistentId}`);
    await expect(page.getByTestId('contacto-not-found')).toBeVisible();

    // THEN: ErrorPanel is NOT rendered (404 is a not-found state, not a generic error)
    await expect(page.getByTestId('error-panel')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Backend unavailable: ErrorPanel with Reintentar button
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Backend unavailable: ErrorPanel with Reintentar', () => {
  test('should render ErrorPanel when the detail fetch returns 500', async ({ page }) => {
    // GIVEN: A contactoId for which the backend returns 500
    const contacto = createContactoDto({ id: '12121212-1212-1212-1212-121212121212' });

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([contacto]) })
    );
    await page.route(`**/api/v1/contactos/${contacto.id}`, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ status: 500, title: 'Internal Server Error' }),
      })
    );

    // WHEN: User navigates directly to the detail URL
    await page.goto(`/contactos/${contacto.id}`);

    // THEN: ErrorPanel is visible
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('should render a "Reintentar" button inside the ErrorPanel on fetch failure', async ({ page }) => {
    // GIVEN: Detail fetch fails with 503
    const contacto = createContactoDto({ id: '13131313-1313-1313-1313-131313131313' });

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([contacto]) })
    );
    await page.route(`**/api/v1/contactos/${contacto.id}`, (route) =>
      route.fulfill({ status: 503, contentType: 'application/json', body: '{}' })
    );

    // WHEN: User navigates to the detail URL
    await page.goto(`/contactos/${contacto.id}`);
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // THEN: A "Reintentar" button is present
    await expect(page.getByTestId('retry-button')).toBeVisible();
  });

  test('should trigger a new fetch when "Reintentar" is clicked', async ({ page }) => {
    // GIVEN: First detail request fails with 500, second succeeds
    const contacto = createContactoDto({
      id: '14141414-1414-1414-1414-141414141414',
      nombre: 'Reintento Exitoso',
    });
    let detailCallCount = 0;

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([contacto]) })
    );
    await page.route(`**/api/v1/contactos/${contacto.id}`, (route) => {
      detailCallCount++;
      if (detailCallCount === 1) {
        return route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contacto) });
    });

    await page.goto(`/contactos/${contacto.id}`);
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // WHEN: User clicks "Reintentar"
    await page.getByTestId('retry-button').click();

    // THEN: A second API call is made and the detail view renders
    await expect(page.getByTestId('contacto-detail-view')).toBeVisible();
    expect(detailCallCount).toBe(2);
  });

  test('should render ErrorPanel when the detail fetch fails with a network error (abort)', async ({ page }) => {
    // GIVEN: Detail fetch is aborted (network error)
    const contacto = createContactoDto({ id: '15151515-1515-1515-1515-151515151515' });

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([contacto]) })
    );
    await page.route(`**/api/v1/contactos/${contacto.id}`, (route) => route.abort('failed'));

    // WHEN: User navigates to the detail URL
    await page.goto(`/contactos/${contacto.id}`);

    // THEN: ErrorPanel is displayed
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Loading state: skeleton loader (4 rows), no spinner
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Skeleton loader (4 rows) shown during detail fetch (no spinner)', () => {
  test('should render a skeleton loader while the detail API is in flight', async ({ page }) => {
    // GIVEN: Detail API is held pending (deferred — no hard wait)
    const contacto = createContactoDto({ id: '16161616-1616-1616-1616-161616161616' });
    let releaseDetail!: () => void;
    const detailHeld = new Promise<void>((resolve) => { releaseDetail = resolve; });

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([contacto]) })
    );
    await page.route(`**/api/v1/contactos/${contacto.id}`, async (route) => {
      await detailHeld;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contacto) });
    });

    // WHEN: User navigates to the detail URL (fetch is in-flight)
    const gotoPromise = page.goto(`/contactos/${contacto.id}`);

    // THEN: Skeleton loader is visible before data arrives
    await expect(page.getByTestId('contacto-detail-skeleton')).toBeVisible();

    // Cleanup: release the route and wait for navigation
    releaseDetail();
    await gotoPromise;
  });

  test('should NOT render a spinner during loading (skeleton only — no spinner allowed)', async ({ page }) => {
    // GIVEN: Detail API is held pending
    const contacto = createContactoDto({ id: '17171717-1717-1717-1717-171717171717' });
    let releaseDetail!: () => void;
    const detailHeld = new Promise<void>((resolve) => { releaseDetail = resolve; });

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([contacto]) })
    );
    await page.route(`**/api/v1/contactos/${contacto.id}`, async (route) => {
      await detailHeld;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contacto) });
    });

    // WHEN: User navigates (loading state is active)
    const gotoPromise = page.goto(`/contactos/${contacto.id}`);

    // THEN: No spinner is present in the DOM
    const spinner = page.locator('[role="progressbar"], .spinner, [data-testid="spinner"]');
    await expect(spinner).toHaveCount(0);

    // Cleanup
    releaseDetail();
    await gotoPromise;
  });

  test('should hide the skeleton loader once the contact data is fully loaded', async ({ page }) => {
    // GIVEN: Detail API returns contact data
    const contacto = createContactoDto({ id: '18181818-1818-1818-1818-181818181818' });

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([contacto]) })
    );
    await page.route(`**/api/v1/contactos/${contacto.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contacto) })
    );

    // WHEN: User navigates and data loads
    await page.goto(`/contactos/${contacto.id}`);
    await expect(page.getByTestId('contacto-detail-view')).toBeVisible();

    // THEN: Skeleton is no longer visible
    await expect(page.getByTestId('contacto-detail-skeleton')).not.toBeVisible();
  });

  test('should render exactly 4 skeleton rows matching the 4 visible fields (Nombre, Cargo, Teléfono, Email)', async ({ page }) => {
    // GIVEN: Detail API is held pending
    const contacto = createContactoDto({ id: '19191919-1919-1919-1919-191919191919' });
    let releaseDetail!: () => void;
    const detailHeld = new Promise<void>((resolve) => { releaseDetail = resolve; });

    await page.route(API_CONTACTOS, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([contacto]) })
    );
    await page.route(`**/api/v1/contactos/${contacto.id}`, async (route) => {
      await detailHeld;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contacto) });
    });

    // WHEN: User navigates (loading state is active)
    const gotoPromise = page.goto(`/contactos/${contacto.id}`);
    await expect(page.getByTestId('contacto-detail-skeleton')).toBeVisible();

    // THEN: Skeleton container has exactly 4 child rows (one per field)
    const skeletonRows = page
      .getByTestId('contacto-detail-skeleton')
      .locator('[class*="react-loading-skeleton"], .skeleton-row, [aria-hidden="true"]');
    await expect(skeletonRows).toHaveCount(4);

    // Cleanup
    releaseDetail();
    await gotoPromise;
  });
});

import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper } from '../../helpers/api.helper';
import { buildContacto } from '../../helpers/data.helper';

/**
 * ATDD E2E tests — Story 3.1: Contact List & Search (RED phase)
 *
 * Tests fail until:
 *   - GET /api/v1/contactos endpoint is implemented
 *   - ContactoListView (full-page at /contactos) is rendered
 *   - EmptyState and ErrorPanel components exist with data-testid
 *   - data-testid attributes are present in the implementation
 *
 * Test IDs:
 *   TC-E3-3-1-E2E-1 (P0) — Navigating to /contactos shows full-page contact list with Nombre, Cargo, Email
 *   TC-E3-3-1-E2E-2 (P1) — Real-time search by nombre filters list within 1 second (NFR1)
 *   TC-E3-3-1-E2E-3 (P1) — Real-time search by email filters list within 1 second
 *   TC-E3-3-1-E2E-4 (P1) — EmptyState shown when no contacts in system
 *   TC-E3-3-1-E2E-5 (P1) — ErrorPanel shown when backend returns error (mocked via route)
 *   TC-E3-3-1-E2E-6 (P1) — Clicking "Reintentar" triggers a new GET request
 */

test.describe('Story 3.1 — Contact List & Search', () => {
  let apiHelper: ApiHelper;
  const createdIds: string[] = [];

  test.beforeEach(async ({ request }) => {
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteContacto(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E3-3-1-E2E-1 (P0) — Full-page list shows Nombre, Cargo, Email per item
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E3-3-1-E2E-1: should render full-page contact list with Nombre, Cargo, and Email per item', async ({ page }) => {
    // GIVEN: A contact exists in the system
    const data = buildContacto({ nombre: 'María López', cargo: 'Gerente Comercial', email: 'maria.lopez@empresa.com' });
    const created = await apiHelper.createContacto(data);
    createdIds.push(created.id);

    // CRITICAL: Intercept routes BEFORE navigation (network-first pattern)
    // No route intercept needed here — uses real API

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');
    await page.waitForURL('**/contactos**');

    // THEN: The page heading "Contactos" is visible
    await expect(page.getByRole('heading', { name: /contactos/i })).toBeVisible();

    // AND: The contact list item is visible
    await expect(
      page.getByTestId('contacto-list-item').filter({ hasText: data.nombre })
    ).toBeVisible();

    // AND: The item shows Nombre
    const item = page.getByTestId('contacto-list-item').filter({ hasText: data.nombre });
    await expect(item).toContainText(data.nombre);

    // AND: The item shows Cargo
    await expect(item).toContainText(data.cargo!);

    // AND: The item shows Email
    await expect(item).toContainText(data.email);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E3-3-1-E2E-2 (P1) — Real-time search by nombre filters within 1 second
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E3-3-1-E2E-2: should filter contact list by nombre in real time within 1 second (NFR1)', async ({ page }) => {
    // GIVEN: Two contacts exist — only one matches the search term
    const matchingData = buildContacto({ nombre: 'Ana Gómez Filtro', email: 'ana.gomez@test.co' });
    const nonMatchingData = buildContacto({ nombre: 'Pedro Ramírez', email: 'pedro.ramirez@test.co' });

    const matching = await apiHelper.createContacto(matchingData);
    const nonMatching = await apiHelper.createContacto(nonMatchingData);
    createdIds.push(matching.id, nonMatching.id);

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');
    await page.waitForURL('**/contactos**');

    // Wait for list to fully load
    await expect(
      page.getByTestId('contacto-list-item').first()
    ).toBeVisible({ timeout: 5000 });

    const searchInput = page.getByPlaceholder(/buscar por nombre o email/i);
    await expect(searchInput).toBeVisible();

    // WHEN: User types the search term
    const start = Date.now();
    await searchInput.fill('Ana Gómez Filtro');

    // THEN: Results appear in under 1 second (NFR1)
    await expect(
      page.getByTestId('contacto-list-item').filter({ hasText: 'Ana Gómez Filtro' })
    ).toBeVisible({ timeout: 1000 });

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThanOrEqual(1000);

    // AND: Non-matching contact is not visible
    await expect(
      page.getByTestId('contacto-list-item').filter({ hasText: 'Pedro Ramírez' })
    ).toBeHidden();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E3-3-1-E2E-3 (P1) — Real-time search by email filters within 1 second
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E3-3-1-E2E-3: should filter contact list by email in real time within 1 second', async ({ page }) => {
    // GIVEN: Two contacts exist — only one matches the email search
    const matchingData = buildContacto({ nombre: 'Carlos Torres', email: 'carlos.torres.unico@empresa.co' });
    const nonMatchingData = buildContacto({ nombre: 'Laura Sánchez', email: 'laura.sanchez@empresa.co' });

    const matching = await apiHelper.createContacto(matchingData);
    const nonMatching = await apiHelper.createContacto(nonMatchingData);
    createdIds.push(matching.id, nonMatching.id);

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');
    await page.waitForURL('**/contactos**');

    // Wait for list to fully load
    await expect(
      page.getByTestId('contacto-list-item').first()
    ).toBeVisible({ timeout: 5000 });

    const searchInput = page.getByPlaceholder(/buscar por nombre o email/i);

    // WHEN: User types an email fragment
    const start = Date.now();
    await searchInput.fill('carlos.torres.unico');

    // THEN: Only the matching contact is visible within 1 second
    await expect(
      page.getByTestId('contacto-list-item').filter({ hasText: 'Carlos Torres' })
    ).toBeVisible({ timeout: 1000 });

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThanOrEqual(1000);

    // AND: Non-matching contact is not visible
    await expect(
      page.getByTestId('contacto-list-item').filter({ hasText: 'Laura Sánchez' })
    ).toBeHidden();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E3-3-1-E2E-4 (P1) — EmptyState shown when no contacts in system
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E3-3-1-E2E-4: should show EmptyState when there are no contacts in the system', async ({ page }) => {
    // GIVEN: Backend returns empty array (intercepted BEFORE navigation)
    await page.route('**/api/v1/contactos', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');
    await page.waitForURL('**/contactos**');

    // THEN: EmptyState component is visible
    await expect(page.getByTestId('empty-state')).toBeVisible();

    // AND: No contact list items are rendered
    await expect(page.getByTestId('contacto-list-item')).toHaveCount(0);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E3-3-1-E2E-5 (P1) — ErrorPanel shown when backend returns 500
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E3-3-1-E2E-5: should show ErrorPanel with "Reintentar" button when backend returns 500', async ({ page }) => {
    // GIVEN: Backend intercepted BEFORE navigation, returning 500
    await page.route('**/api/v1/contactos', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Internal Server Error', status: 500 }),
      })
    );

    // WHEN: User navigates to /contactos
    await page.goto('/contactos');
    await page.waitForURL('**/contactos**');

    // THEN: ErrorPanel is visible
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // AND: "Reintentar" button is present
    await expect(page.getByRole('button', { name: /reintentar/i })).toBeVisible();

    // AND: No contact list items are rendered
    await expect(page.getByTestId('contacto-list-item')).toHaveCount(0);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E3-3-1-E2E-6 (P1) — Clicking "Reintentar" triggers a new GET request
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E3-3-1-E2E-6: should trigger a new fetch when "Reintentar" is clicked after an error', async ({ page }) => {
    // GIVEN: First request returns 500, subsequent requests succeed
    let requestCount = 0;

    // CRITICAL: Route intercept BEFORE navigation
    await page.route('**/api/v1/contactos', async (route) => {
      requestCount += 1;
      if (requestCount === 1) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ title: 'Internal Server Error', status: 500 }),
        });
      } else {
        const data = buildContacto({ nombre: 'Contacto Retry', email: 'retry@test.co' });
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([data]),
        });
      }
    });

    // WHEN: User navigates to /contactos (first request fails)
    await page.goto('/contactos');
    await page.waitForURL('**/contactos**');

    // Wait for ErrorPanel
    await expect(page.getByTestId('error-panel')).toBeVisible();

    const countBeforeRetry = requestCount;

    // WHEN: User clicks "Reintentar"
    await page.getByRole('button', { name: /reintentar/i }).click();

    // THEN: A new request was made
    await expect(async () => {
      expect(requestCount).toBeGreaterThan(countBeforeRetry);
    }).toPass({ timeout: 3000 });

    // AND: List is now populated
    await expect(
      page.getByTestId('contacto-list-item').filter({ hasText: 'Contacto Retry' })
    ).toBeVisible();
  });
});

import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper } from '../../helpers/api.helper';
import { buildContacto } from '../../helpers/data.helper';

/**
 * ATDD E2E tests — Story 3.2: Contact Detail View (RED phase)
 *
 * Tests fail until:
 *   - GET /api/v1/contactos/:id endpoint responds correctly (backend — verified from Story 3.1)
 *   - ContactoDetailView component renders with all 4 fields (Nombre, Cargo, Teléfono, Email)
 *   - TanStack Router dynamic route contactos.$contactoId.tsx is fully wired (not a stub)
 *   - URL updates to /contactos/:contactoId on contact selection (FR30 deep linking)
 *   - NotFoundPanel renders for unknown contactoId
 *   - data-testid attributes are present in the implementation
 *
 * Test IDs:
 *   TC-E3-3-2-E2E-1 (P1) — Navigate directly to /contactos/:id → detail shows all four fields
 *   TC-E3-3-2-E2E-2 (P3) — Navigate to /contactos/00000000... → not-found message rendered
 */

const UNKNOWN_UUID = '00000000-0000-0000-0000-000000000000';

test.describe('Story 3.2 — Contact Detail View (E2E)', () => {
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
  // TC-E3-3-2-E2E-1 (P1) — Direct navigation to /contactos/:id loads detail
  // Risk: R-006 (deep linking for contact detail — FR30)
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E3-3-2-E2E-1: should show Nombre, Cargo, Teléfono, and Email in detail view when navigating directly to /contactos/:id', async ({ page }) => {
    // GIVEN: A contact exists in the system with known field values
    const data = buildContacto({
      nombre: 'María López Detail E2E',
      cargo: 'Gerente Comercial',
      telefono: '3001234567',
      email: 'maria.lopez.e2e@empresa.co',
    });
    const created = await apiHelper.createContacto(data);
    createdIds.push(created.id);

    // CRITICAL: Route intercept BEFORE navigation (network-first pattern)
    // No route intercept needed — uses real API for deep link test

    // WHEN: User navigates directly to /contactos/:id (deep link — FR30)
    await page.goto(`/contactos/${created.id}`);
    await page.waitForURL(`**/contactos/${created.id}`);

    // THEN: The contact detail view is visible
    await expect(page.getByTestId('contacto-detail-view')).toBeVisible();

    // AND: Nombre is displayed in the detail view
    await expect(
      page.getByTestId('contacto-detail-view').getByText(data.nombre)
    ).toBeVisible();

    // AND: Cargo is displayed in the detail view
    await expect(
      page.getByTestId('contacto-detail-view').getByText(data.cargo!)
    ).toBeVisible();

    // AND: Teléfono is displayed in the detail view
    await expect(
      page.getByTestId('contacto-detail-view').getByText(data.telefono!)
    ).toBeVisible();

    // AND: Email is displayed in the detail view
    await expect(
      page.getByTestId('contacto-detail-view').getByText(data.email)
    ).toBeVisible();
  });

  test('should update URL to /contactos/:contactoId when user clicks a contact item in the list', async ({ page }) => {
    // GIVEN: A contact exists and the list is displayed at /contactos
    const data = buildContacto({ nombre: 'Contacto Click Navigation E2E' });
    const created = await apiHelper.createContacto(data);
    createdIds.push(created.id);

    // WHEN: User navigates to /contactos (no deep link)
    await page.goto('/contactos');
    await page.waitForURL('**/contactos');

    // Wait for the list to load
    await expect(
      page.getByTestId('contacto-list-item').filter({ hasText: data.nombre })
    ).toBeVisible({ timeout: 5000 });

    // WHEN: User clicks on the contact item in the list
    await page.getByTestId('contacto-list-item').filter({ hasText: data.nombre }).click();

    // THEN: URL updates to /contactos/:contactoId (FR30 deep linking)
    await page.waitForURL(`**/contactos/${created.id}`, { timeout: 3000 });

    // AND: The contact detail view becomes visible
    await expect(page.getByTestId('contacto-detail-view')).toBeVisible();

    // AND: Nombre is shown in the detail view
    await expect(
      page.getByTestId('contacto-detail-view').getByText(data.nombre)
    ).toBeVisible();
  });

  test('should show ErrorPanel with "Reintentar" button when backend fails with non-404 error on contact detail', async ({ page }) => {
    // GIVEN: A contacto ID exists but the per-contact endpoint returns 500
    const contactoId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

    // CRITICAL: Route intercept BEFORE navigation
    await page.route(`**/api/v1/contactos/${contactoId}`, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Internal Server Error', status: 500 }),
      })
    );

    // WHEN: User navigates directly to the contacto URL
    await page.goto(`/contactos/${contactoId}`);
    await page.waitForURL(`**/contactos/${contactoId}`);

    // THEN: ErrorPanel is displayed instead of contact data
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // AND: "Reintentar" button is present (AC #4)
    await expect(page.getByRole('button', { name: /reintentar/i })).toBeVisible();

    // AND: No contact detail fields are shown
    await expect(page.getByTestId('contacto-detail-view')).not.toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E3-3-2-E2E-2 (P3) — Unknown contactoId shows not-found message
  // Risk: R-006
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E3-3-2-E2E-2: should display not-found message when navigating to /contactos/00000000-0000-0000-0000-000000000000', async ({ page }) => {
    // GIVEN: The contactoId in the URL does not correspond to any existing contact
    // CRITICAL: Intercept the specific contact fetch BEFORE navigation to return 404
    await page.route(`**/api/v1/contactos/${UNKNOWN_UUID}`, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          type: 'https://tools.ietf.org/html/rfc7807',
          title: 'Contacto no encontrado',
          status: 404,
          detail: 'El contacto solicitado no fue encontrado.',
        }),
      })
    );

    // WHEN: User navigates directly to the non-existent contact URL
    await page.goto(`/contactos/${UNKNOWN_UUID}`);
    await page.waitForURL(`**/contactos/${UNKNOWN_UUID}`);

    // THEN: A not-found panel is displayed (no crash, no blank page — AC #3)
    await expect(page.getByTestId('not-found-panel')).toBeVisible();

    // AND: Not-found message is shown in Spanish
    await expect(
      page.getByTestId('not-found-panel').getByText(/contacto no encontrado/i)
    ).toBeVisible();

    // AND: Generic ErrorPanel is NOT shown (404 uses distinct NotFoundPanel UX)
    await expect(page.getByTestId('error-panel')).not.toBeVisible();
  });
});

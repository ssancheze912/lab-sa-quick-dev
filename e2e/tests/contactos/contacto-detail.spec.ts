import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper } from '../../helpers/api.helper';
import { buildContacto } from '../../helpers/data.helper';

/**
 * E2E tests: Contact Detail View — Story 3.2
 *
 * Covers:
 *   AC #2  Deep link to /contactos/:contactoId loads correct contact details (FR30)
 *   AC #3  Deep link to non-existent contactoId shows "Contacto no encontrado" (NFR6)
 *
 * Network-first: route interception is set BEFORE navigation (no race conditions).
 * Selectors: data-testid attributes — no fragile CSS selectors.
 */

test.describe('Story 3.2 — Contact Detail View: deep linking', () => {
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

  // ---------------------------------------------------------------------------
  // AC #2: Deep link to /contactos/:contactoId loads correct contact details
  // ---------------------------------------------------------------------------

  test('AC#2 — deep link to /contactos/:contactoId renders correct contact Nombre', async ({
    page,
  }) => {
    // GIVEN: A contact exists in the database with a known ID
    const data = buildContacto({ nombre: 'María Rodríguez' });
    const contacto = await apiHelper.createContacto(data);
    createdIds.push(contacto.id);

    // WHEN: User navigates directly to the deep link URL
    await page.goto(`/contactos/${contacto.id}`);
    await page.waitForURL(`**/contactos/${contacto.id}**`);

    // THEN: Contact detail panel renders the correct Nombre
    await expect(page.getByTestId('contacto-detail-panel')).toBeVisible();
    await expect(page.getByText(data.nombre)).toBeVisible();
  });

  test('AC#2 — deep link renders correct Cargo field', async ({ page }) => {
    // GIVEN: A contact exists with a specific Cargo
    const data = buildContacto({ cargo: 'Director Comercial' });
    const contacto = await apiHelper.createContacto(data);
    createdIds.push(contacto.id);

    // WHEN: User navigates directly to the deep link URL
    await page.goto(`/contactos/${contacto.id}`);

    // THEN: Cargo field value is visible
    await expect(page.getByText(data.cargo)).toBeVisible();
  });

  test('AC#2 — deep link renders correct Teléfono field', async ({ page }) => {
    // GIVEN: A contact exists with a specific Teléfono
    const data = buildContacto({ telefono: '3009871234' });
    const contacto = await apiHelper.createContacto(data);
    createdIds.push(contacto.id);

    // WHEN: User navigates to the deep link
    await page.goto(`/contactos/${contacto.id}`);

    // THEN: Teléfono value is visible in the detail view
    await expect(page.getByText(data.telefono)).toBeVisible();
  });

  test('AC#2 — deep link renders correct Email field', async ({ page }) => {
    // GIVEN: A contact with a specific Email
    const data = buildContacto({ email: 'contacto.detalle@siesa.com' });
    const contacto = await apiHelper.createContacto(data);
    createdIds.push(contacto.id);

    // WHEN: User navigates to the deep link
    await page.goto(`/contactos/${contacto.id}`);

    // THEN: Email value is visible
    await expect(page.getByText(data.email)).toBeVisible();
  });

  test('AC#2 — URL updates to /contactos/:contactoId on deep link navigation', async ({
    page,
  }) => {
    // GIVEN: A contact exists
    const data = buildContacto();
    const contacto = await apiHelper.createContacto(data);
    createdIds.push(contacto.id);

    // WHEN: User navigates directly to /contactos/:contactoId
    await page.goto(`/contactos/${contacto.id}`);

    // THEN: URL stays at the deep link (no redirect to another page)
    await expect(page).toHaveURL(new RegExp(contacto.id));
  });

  test('AC#2 — deep link does not show blank screen', async ({ page }) => {
    // GIVEN: A contact exists
    const data = buildContacto();
    const contacto = await apiHelper.createContacto(data);
    createdIds.push(contacto.id);

    // WHEN: User navigates directly to the deep link URL
    await page.goto(`/contactos/${contacto.id}`);

    // THEN: Detail panel is visible (no blank screen)
    await expect(page.getByTestId('contacto-detail-panel')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // AC #3: Deep link to non-existent contactoId shows "Contacto no encontrado"
  // ---------------------------------------------------------------------------

  test('AC#3 — deep link to non-existent UUID shows "Contacto no encontrado"', async ({
    page,
  }) => {
    // GIVEN: An ID that does not correspond to any existing contact
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    // WHEN: User navigates directly to /contactos/:nonExistentId
    await page.goto(`/contactos/${nonExistentId}`);

    // THEN: A not-found message is displayed in Spanish
    await expect(page.getByText(/Contacto no encontrado/i)).toBeVisible();
  });

  test('AC#3 — not-found message does not expose stack trace or technical details (NFR6)', async ({
    page,
  }) => {
    // GIVEN: An ID that does not exist
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    // WHEN: User navigates to the non-existent deep link
    await page.goto(`/contactos/${nonExistentId}`);

    // THEN: Not-found message shown
    await expect(page.getByText(/Contacto no encontrado/i)).toBeVisible();

    // THEN: No stack trace, exception details, or raw HTTP errors are exposed
    await expect(page.getByText(/stackTrace/i)).not.toBeVisible();
    await expect(page.getByText(/exception/i)).not.toBeVisible();
  });

  test('AC#3 — no JavaScript crash when deep link points to non-existent contact', async ({
    page,
  }) => {
    // GIVEN: An ID that does not exist
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    // Capture any uncaught JS errors
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    // WHEN: User navigates to the non-existent deep link
    await page.goto(`/contactos/${nonExistentId}`);

    // Wait for the not-found state to render
    await expect(page.getByText(/Contacto no encontrado/i)).toBeVisible();

    // THEN: No JavaScript errors were thrown
    expect(jsErrors).toHaveLength(0);
  });
});

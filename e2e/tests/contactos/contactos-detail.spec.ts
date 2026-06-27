import { test, expect } from '../../fixtures/base.fixture';
import { ContactosPage } from '../../pages/contactos.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildContacto } from '../../helpers/data.helper';

/**
 * ATDD — Story 3.2: Contact Detail View
 *
 * Tests are in RED phase — they define the expected behaviour BEFORE implementation.
 * Make these tests GREEN by implementing:
 *   - GET /api/v1/contactos/:id endpoint (Task 1)
 *   - useContactoById TanStack Query hook (Task 2)
 *   - ContactoDetailPanel presentation component (Task 3)
 *   - /contactos/$contactoId TanStack Router route (Task 4)
 *   - ContactoListView click navigation (Task 5)
 *   - /contactos route <Outlet /> for nested route (Task 6)
 *
 * Coverage:
 *   E2E-CT-07  P0  AC1  — Click contact row → detail panel shows all 4 fields (Nombre, Cargo, Teléfono, Email)
 *   E2E-CT-08  P1  AC1  — Click contact row → URL updates to /contactos/{uuid}
 *   E2E-CT-09  P1  AC2  — Direct navigation to /contactos/:id loads correct contact detail
 *   E2E-CT-10  P1  AC3  — Navigate to non-existent ID shows not-found message, no JS errors
 */

test.describe('Story 3.2 — Vista de detalle de contacto', () => {
  let contactosPage: ContactosPage;
  let apiHelper: ApiHelper;
  const createdIds: string[] = [];

  test.beforeEach(async ({ page, request }) => {
    contactosPage = new ContactosPage(page);
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteContacto(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  // ---------------------------------------------------------------------------
  // E2E-CT-07 (P0 · AC1)
  // Given the contact list is displayed
  // When the user clicks on a contact item
  // Then the contact detail panel is visible and shows Nombre, Cargo, Teléfono, and Email
  // ---------------------------------------------------------------------------
  test('E2E-CT-07 — hacer clic en un contacto muestra el panel de detalle con los 4 campos', async ({ page }) => {
    // GIVEN — a contact exists in the system with known field values
    const data = buildContacto({
      nombre: 'María García',
      cargo: 'Gerente Comercial',
      telefono: '+57 1 234 5679',
      email: 'm.garcia@empresa.com',
    });

    // Intercept BEFORE navigation (network-first pattern)
    await page.route('**/api/v1/contactos', (route) => route.continue());

    const contacto = await apiHelper.createContacto(data);
    createdIds.push(contacto.id);

    // WHEN — user navigates to /contactos
    await contactosPage.goto();

    // AND — the contact row is visible in the list
    await expect(
      contactosPage.contactoRows.filter({ hasText: data.nombre })
    ).toBeVisible();

    // AND — user clicks the contact row
    await contactosPage.seleccionarContacto(data.nombre);

    // THEN — the detail panel is visible
    await expect(contactosPage.detailPanel).toBeVisible();

    // AND — Nombre is displayed with the correct value
    await expect(
      page.getByTestId('contacto-detail-nombre')
    ).toHaveText(data.nombre);

    // AND — Cargo is displayed with the correct value
    await expect(
      page.getByTestId('contacto-detail-cargo')
    ).toHaveText(data.cargo ?? '');

    // AND — Teléfono is displayed with the correct value
    await expect(
      page.getByTestId('contacto-detail-telefono')
    ).toHaveText(data.telefono ?? '');

    // AND — Email is displayed with the correct value
    await expect(
      page.getByTestId('contacto-detail-email')
    ).toHaveText(data.email);
  });

  // ---------------------------------------------------------------------------
  // E2E-CT-08 (P1 · AC1 · FR30)
  // Given the contact list is displayed
  // When the user clicks on a contact item
  // Then the URL updates to /contactos/:contactoId with the contact's UUID
  // ---------------------------------------------------------------------------
  test('E2E-CT-08 — la URL se actualiza a /contactos/:contactoId al hacer clic en un contacto', async ({ page }) => {
    // GIVEN — a contact exists in the system
    const data = buildContacto({ nombre: 'Carlos López' });

    // Intercept BEFORE navigation (network-first pattern)
    await page.route('**/api/v1/contactos', (route) => route.continue());

    const contacto = await apiHelper.createContacto(data);
    createdIds.push(contacto.id);

    // WHEN — user navigates to /contactos and clicks the contact row
    await contactosPage.goto();
    await expect(
      contactosPage.contactoRows.filter({ hasText: data.nombre })
    ).toBeVisible();

    await contactosPage.seleccionarContacto(data.nombre);

    // THEN — URL updates to /contactos/{uuid}
    await page.waitForURL(`**/contactos/${contacto.id}`);
    expect(page.url()).toMatch(/\/contactos\/[0-9a-f]{8}-[0-9a-f]{4}-/i);
    expect(page.url()).toContain(`/contactos/${contacto.id}`);
  });

  // ---------------------------------------------------------------------------
  // E2E-CT-09 (P1 · AC2 · FR30)
  // Given the user knows a contact's ID
  // When the user navigates directly to /contactos/:contactoId
  // Then the correct contact detail is displayed without prior list interaction
  // ---------------------------------------------------------------------------
  test('E2E-CT-09 — navegación directa a /contactos/:id carga el detalle correcto', async ({ page }) => {
    // GIVEN — a contact exists in the system
    const data = buildContacto({
      nombre: 'Ana Martínez',
      cargo: 'Analista TI',
      email: 'a.martinez@empresa.com',
    });

    // Intercept the single-contact API BEFORE navigating (network-first pattern)
    const contacto = await apiHelper.createContacto(data);
    createdIds.push(contacto.id);

    await page.route(`**/api/v1/contactos/${contacto.id}`, (route) =>
      route.continue()
    );

    // WHEN — user navigates directly to the detail URL (no list interaction)
    await page.goto(`/contactos/${contacto.id}`);

    // THEN — detail panel is visible
    await expect(contactosPage.detailPanel).toBeVisible();

    // AND — Nombre matches the created contact
    await expect(
      page.getByTestId('contacto-detail-nombre')
    ).toHaveText(data.nombre);

    // AND — Email matches the created contact
    await expect(
      page.getByTestId('contacto-detail-email')
    ).toHaveText(data.email);
  });

  // ---------------------------------------------------------------------------
  // E2E-CT-10 (P1 · AC3 · R5)
  // Given a contactoId in the URL does not exist in the system
  // When the page loads with that ID
  // Then a not-found message is displayed gracefully with no unhandled JS errors
  // ---------------------------------------------------------------------------
  test('E2E-CT-10 — navegar a un contactoId inexistente muestra "Contacto no encontrado" sin errores JS', async ({ page }) => {
    // GIVEN — a UUID that does not correspond to any existing contact
    const nonExistentId = '00000000-0000-4000-8000-000000000000';

    // AND — a listener for unhandled JS errors is registered BEFORE navigation
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    // AND — the API route for this ID is intercepted BEFORE navigation (network-first pattern)
    await page.route(`**/api/v1/contactos/${nonExistentId}`, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          type: 'https://tools.ietf.org/html/rfc7807',
          title: 'Not Found',
          status: 404,
          detail: `Contacto con id '${nonExistentId}' no encontrado.`,
        }),
      })
    );

    // WHEN — user navigates to the non-existent contact detail URL
    await page.goto(`/contactos/${nonExistentId}`);

    // THEN — the not-found component is visible
    await expect(
      page.getByTestId('contacto-not-found')
    ).toBeVisible();

    // AND — the not-found message is in Spanish
    await expect(
      page.getByTestId('contacto-not-found')
    ).toHaveText(/contacto no encontrado/i);

    // AND — no unhandled JS errors were thrown
    expect(pageErrors).toHaveLength(0);
  });
});

import { test, expect } from '../../fixtures/base.fixture';
import { ContactosPage } from '../../pages/contactos.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildContacto } from '../../helpers/data.helper';

/**
 * E2E tests: Gestión de Contactos — Contact List & Search (Story 3.1)
 *
 * Covers:
 *   AC-E3.1 (AC#1) — Listar todos los contactos: mostrando Nombre, Cargo, Email
 *   AC-E3.2 (AC#2) — Búsqueda en tiempo real por Nombre o Email (case-insensitive, substring)
 *   AC-E3.1 (AC#3) — EmptyState cuando no existen contactos
 *   AC#4            — ErrorPanel + Reintentar cuando el backend falla
 *
 * These tests are in RED phase — the /contactos route only has a placeholder.
 *
 * Expected RED failures:
 *   - Route /contactos renders placeholder "Próximamente" instead of ContactoListView
 *   - data-testid="contacto-item" elements are not present
 *   - Search input is not present
 *   - EmptyState and ErrorPanel components are not wired
 */

test.describe('Story 3.1 — Contact List & Search', () => {
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

  // -------------------------------------------------------------------------
  // AC#1 — Given contacts exist, When navigating to /contactos, Then list shows
  //          Nombre, Cargo, Email for each contact
  // -------------------------------------------------------------------------

  test('AC#1 — debe mostrar lista de contactos con Nombre, Cargo y Email', async ({ page }) => {
    // GIVEN: A contact exists in the system
    const data = buildContacto({
      nombre: 'Ana García Test E3',
      cargo: 'Directora Comercial',
      email: `ana.garcia.e3.${Date.now()}@siesa.com`,
    });
    const contacto = await apiHelper.createContacto(data);
    createdIds.push(contacto.id);

    // WHEN: User navigates to /contactos
    await contactosPage.goto();

    // THEN: The contact list is visible
    await expect(contactosPage.contactoRows.first()).toBeVisible({ timeout: 5000 });

    // THEN: The contact item shows Nombre, Cargo, Email
    const contactoRow = contactosPage.contactoRows.filter({ hasText: data.nombre });
    await expect(contactoRow).toBeVisible();
    await expect(contactoRow).toContainText(data.cargo!);
    await expect(contactoRow).toContainText(data.email!);
  });

  test('AC#1 — debe mostrar múltiples contactos en la lista', async ({ page }) => {
    // GIVEN: Multiple contacts exist
    const contactos = await Promise.all([
      apiHelper.createContacto(buildContacto({ nombre: 'Contacto E3A' })),
      apiHelper.createContacto(buildContacto({ nombre: 'Contacto E3B' })),
    ]);
    for (const c of contactos) createdIds.push(c.id);

    // WHEN: User navigates to /contactos
    await contactosPage.goto();

    // THEN: Both contacts appear in the list
    await expect(
      contactosPage.contactoRows.filter({ hasText: 'Contacto E3A' })
    ).toBeVisible({ timeout: 5000 });
    await expect(
      contactosPage.contactoRows.filter({ hasText: 'Contacto E3B' })
    ).toBeVisible({ timeout: 5000 });
  });

  // -------------------------------------------------------------------------
  // AC#2 — Given list loaded, When user types in search, Then real-time filter
  //         by Nombre (case-insensitive, substring, < 1s with 1,000 records)
  // -------------------------------------------------------------------------

  test('AC#2 — debe filtrar contactos en tiempo real por Nombre', async ({ page }) => {
    // GIVEN: Two contacts with distinct names
    const contactoA = await apiHelper.createContacto(
      buildContacto({ nombre: 'Búsqueda Nombre Especial' })
    );
    const contactoB = await apiHelper.createContacto(
      buildContacto({ nombre: 'Otro Contacto Diferente' })
    );
    createdIds.push(contactoA.id, contactoB.id);

    // WHEN: User navigates to /contactos and waits for list
    await contactosPage.goto();
    await expect(
      contactosPage.contactoRows.filter({ hasText: 'Búsqueda Nombre Especial' })
    ).toBeVisible({ timeout: 5000 });

    // WHEN: User types partial name in search input
    await contactosPage.buscar('Nombre Especial');

    // THEN: Matching contact is visible
    await expect(
      contactosPage.contactoRows.filter({ hasText: 'Búsqueda Nombre Especial' })
    ).toBeVisible();

    // THEN: Non-matching contact is hidden
    await expect(
      contactosPage.contactoRows.filter({ hasText: 'Otro Contacto Diferente' })
    ).not.toBeVisible();
  });

  test('AC#2 — debe filtrar contactos en tiempo real por Email', async ({ page }) => {
    // GIVEN: Two contacts with distinct emails
    const uniqueEmail = `busqueda.email.test.${Date.now()}@siesa.com`;
    const contactoA = await apiHelper.createContacto(
      buildContacto({ nombre: 'Contacto Email Test', email: uniqueEmail })
    );
    const contactoB = await apiHelper.createContacto(
      buildContacto({ nombre: 'Otro Contacto', email: `otro.${Date.now()}@diferente.co` })
    );
    createdIds.push(contactoA.id, contactoB.id);

    // WHEN: User navigates to /contactos and waits for list
    await contactosPage.goto();
    await expect(
      contactosPage.contactoRows.filter({ hasText: 'Contacto Email Test' })
    ).toBeVisible({ timeout: 5000 });

    // WHEN: User types partial email in search input
    await contactosPage.buscar('@siesa.com');

    // THEN: Contact with matching email is visible
    await expect(
      contactosPage.contactoRows.filter({ hasText: 'Contacto Email Test' })
    ).toBeVisible();
  });

  test('AC#2 — búsqueda por Nombre debe ser case-insensitive', async ({ page }) => {
    // GIVEN: A contact with mixed-case name
    const contacto = await apiHelper.createContacto(
      buildContacto({ nombre: 'CaseSensitiveTest García' })
    );
    createdIds.push(contacto.id);

    // WHEN: User navigates and list loads
    await contactosPage.goto();
    await expect(
      contactosPage.contactoRows.filter({ hasText: 'CaseSensitiveTest García' })
    ).toBeVisible({ timeout: 5000 });

    // WHEN: User types lowercase version
    await contactosPage.buscar('casesensitivetest');

    // THEN: Contact still matches (case-insensitive)
    await expect(
      contactosPage.contactoRows.filter({ hasText: 'CaseSensitiveTest García' })
    ).toBeVisible();
  });

  test('AC#2 — limpiar búsqueda restaura lista completa', async ({ page }) => {
    // GIVEN: Two contacts exist
    const contactoA = await apiHelper.createContacto(
      buildContacto({ nombre: 'Restaurar ListaA E3' })
    );
    const contactoB = await apiHelper.createContacto(
      buildContacto({ nombre: 'Restaurar ListaB E3' })
    );
    createdIds.push(contactoA.id, contactoB.id);

    // WHEN: User navigates, filters, then clears
    await contactosPage.goto();
    await expect(
      contactosPage.contactoRows.filter({ hasText: 'Restaurar ListaA E3' })
    ).toBeVisible({ timeout: 5000 });

    await contactosPage.buscar('ListaA');
    await expect(
      contactosPage.contactoRows.filter({ hasText: 'Restaurar ListaB E3' })
    ).not.toBeVisible();

    await contactosPage.searchInput.clear();

    // THEN: Both contacts are visible again
    await expect(
      contactosPage.contactoRows.filter({ hasText: 'Restaurar ListaA E3' })
    ).toBeVisible();
    await expect(
      contactosPage.contactoRows.filter({ hasText: 'Restaurar ListaB E3' })
    ).toBeVisible();
  });

  test('AC#2 — no debe llamar al API en cada keystroke (filtrado client-side)', async ({ page }) => {
    // GIVEN: A contact exists
    const contacto = await apiHelper.createContacto(
      buildContacto({ nombre: 'ClientSide Filter Test' })
    );
    createdIds.push(contacto.id);

    // GIVEN: Track API calls to /api/v1/contactos
    let apiCallCount = 0;
    await page.route('**/api/v1/contactos', async (route) => {
      apiCallCount += 1;
      await route.continue();
    });

    // WHEN: User navigates (initial fetch)
    await contactosPage.goto();
    await expect(
      contactosPage.contactoRows.filter({ hasText: 'ClientSide Filter Test' })
    ).toBeVisible({ timeout: 5000 });

    const callsAfterLoad = apiCallCount;

    // WHEN: User types multiple characters in search (triggers client-side filter)
    await contactosPage.buscar('Client');
    await contactosPage.buscar('ClientSide');

    // THEN: No additional API calls were made during search
    expect(apiCallCount).toBe(callsAfterLoad);
  });

  // -------------------------------------------------------------------------
  // AC#3 — Given no contacts, When navigating to /contactos, Then EmptyState shown
  // -------------------------------------------------------------------------

  test('AC#3 — debe mostrar EmptyState cuando no hay contactos', async ({ page }) => {
    // GIVEN: No contacts exist (intercept API to return empty)
    await page.route('**/api/v1/contactos', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // WHEN: User navigates to /contactos
    await contactosPage.goto();

    // THEN: EmptyState is shown with Spanish guidance text
    await expect(page.getByTestId('contactos-empty-state')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('contactos-empty-state')).toContainText(/contacto/i);
  });

  // -------------------------------------------------------------------------
  // AC#4 — Given backend unavailable, When page loads, Then ErrorPanel shown
  //          and Reintentar button triggers new fetch
  // -------------------------------------------------------------------------

  test('AC#4 — debe mostrar ErrorPanel cuando el backend falla al cargar', async ({ page }) => {
    // GIVEN: Backend returns 500 (network-first intercept before navigation)
    await page.route('**/api/v1/contactos', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ status: 500, title: 'Internal Server Error' }),
      });
    });

    // WHEN: User navigates to /contactos
    await contactosPage.goto();

    // THEN: ErrorPanel is shown instead of the list
    await expect(page.getByTestId('contactos-error-panel')).toBeVisible({ timeout: 5000 });

    // THEN: No contact rows are displayed
    await expect(contactosPage.contactoRows).toHaveCount(0);
  });

  test('AC#4 — debe mostrar botón Reintentar que dispara nuevo fetch', async ({ page }) => {
    // GIVEN: First call returns 500, second returns data (network-first intercept)
    let callCount = 0;
    await page.route('**/api/v1/contactos', async (route) => {
      callCount += 1;
      if (callCount === 1) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ status: 500, title: 'Internal Server Error' }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: '10000000-0000-0000-0000-000000000099',
              nombre: 'Contacto Reintentado',
              cargo: 'Analista',
              telefono: '3100000001',
              email: 'reintento@siesa.com',
              clienteId: null,
              createdAt: '2026-06-29T10:00:00Z',
            },
          ]),
        });
      }
    });

    // WHEN: User navigates to /contactos (first call → 500)
    await contactosPage.goto();

    // THEN: ErrorPanel appears with Reintentar button
    await expect(page.getByTestId('contactos-error-panel')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('contactos-retry-button')).toBeVisible();
    await expect(page.getByTestId('contactos-retry-button')).toContainText(/reintentar/i);

    // WHEN: User clicks Reintentar (second call → 200 with data)
    await page.getByTestId('contactos-retry-button').click();

    // THEN: ErrorPanel disappears and contacts are shown
    await expect(page.getByTestId('contactos-error-panel')).not.toBeVisible({ timeout: 5000 });
    await expect(
      contactosPage.contactoRows.filter({ hasText: 'Contacto Reintentado' })
    ).toBeVisible({ timeout: 5000 });
  });
});

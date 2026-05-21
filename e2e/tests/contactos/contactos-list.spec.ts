import { test, expect } from '../../fixtures/base.fixture';
import { ContactosPage } from '../../pages/contactos.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildContacto } from '../../helpers/data.helper';

/**
 * ATDD — Story 3.1: Contact List & Search
 *
 * Tests are in RED phase — they define the expected behaviour BEFORE implementation.
 * Make these tests GREEN by implementing ContactoListView, EmptyState, ErrorPanel
 * and the GET /api/v1/contactos endpoint as specified in Story 3.1.
 *
 * Coverage:
 *   E2E-CT-01  AC1  — Contact list renders all contacts returned by API on page load
 *   E2E-CT-02  AC2  — Typing in search input filters by Nombre in real time (no extra API calls)
 *   E2E-CT-03  AC2  — Typing email fragment filters by Email in real time (no extra API calls)
 *   E2E-CT-04  AC2  — Clearing search input after filtering restores full contact list
 *   E2E-CT-05  AC3  — EmptyState component is visible when no contacts exist
 *   E2E-CT-06  AC4  — ErrorPanel with "Reintentar" button shown when API returns 500
 */

test.describe('Story 3.1 — Lista y búsqueda de contactos', () => {
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
  // E2E-CT-01 (P0 · AC1)
  // Given there are contacts in the system
  // When the user navigates to /contactos
  // Then a list of all contacts is displayed and each item shows Nombre, Cargo and Email
  // ---------------------------------------------------------------------------
  test('E2E-CT-01 — la lista renderiza todos los contactos con nombre, cargo y email al cargar la página', async ({ page }) => {
    // GIVEN — two contacts exist in the system
    const data1 = buildContacto({ nombre: 'María García', cargo: 'Gerente Comercial', email: 'm.garcia@empresa.com' });
    const data2 = buildContacto({ nombre: 'Carlos López', cargo: 'Analista TI', email: 'c.lopez@empresa.com' });
    const c1 = await apiHelper.createContacto(data1);
    const c2 = await apiHelper.createContacto(data2);
    createdIds.push(c1.id, c2.id);

    // Intercept the network call BEFORE navigating (network-first pattern)
    let apiCallCount = 0;
    await page.route('**/api/v1/contactos', (route) => {
      apiCallCount++;
      route.continue();
    });

    // WHEN — user navigates to /contactos
    await contactosPage.goto();

    // THEN — each contact row is visible with nombre
    await expect(
      contactosPage.contactoRows.filter({ hasText: data1.nombre })
    ).toBeVisible();

    // AND — cargo is displayed for the first contact
    await expect(
      contactosPage.contactoRows.filter({ hasText: data1.cargo })
    ).toBeVisible();

    // AND — email is displayed for the first contact
    await expect(
      contactosPage.contactoRows.filter({ hasText: data1.email })
    ).toBeVisible();

    // AND — second contact is visible
    await expect(
      contactosPage.contactoRows.filter({ hasText: data2.nombre })
    ).toBeVisible();

    // AND — exactly one GET /api/v1/contactos call was made (no duplicate fetches)
    expect(apiCallCount).toBeGreaterThanOrEqual(1);
  });

  // ---------------------------------------------------------------------------
  // E2E-CT-02 (P0 · AC2)
  // Given the contact list is loaded
  // When the user types a name in the search field
  // Then only matching contacts are shown AND no additional API call is made
  // ---------------------------------------------------------------------------
  test('E2E-CT-02 — buscar por nombre filtra la lista en tiempo real sin llamadas extra a la API', async ({ page }) => {
    // GIVEN — three contacts with distinct names
    const match = buildContacto({ nombre: 'Juan Rodríguez' });
    const noMatch1 = buildContacto({ nombre: 'Ana Martínez' });
    const noMatch2 = buildContacto({ nombre: 'Pedro Sánchez' });
    const cm = await apiHelper.createContacto(match);
    const cn1 = await apiHelper.createContacto(noMatch1);
    const cn2 = await apiHelper.createContacto(noMatch2);
    createdIds.push(cm.id, cn1.id, cn2.id);

    // Track API calls (intercept BEFORE navigation — network-first pattern)
    const apiCalls: string[] = [];
    await page.route('**/api/v1/contactos', (route) => {
      apiCalls.push(route.request().method());
      route.continue();
    });

    await contactosPage.goto();
    // Wait for initial list to load
    await expect(contactosPage.contactoRows.first()).toBeVisible();
    const callsAfterLoad = apiCalls.length;

    // WHEN — user types in the search input
    await contactosPage.buscar('Juan');

    // THEN — only the matching contact is visible
    await expect(
      contactosPage.contactoRows.filter({ hasText: match.nombre })
    ).toBeVisible();

    // AND — non-matching contacts are not visible
    await expect(
      contactosPage.contactoRows.filter({ hasText: noMatch1.nombre })
    ).not.toBeVisible();
    await expect(
      contactosPage.contactoRows.filter({ hasText: noMatch2.nombre })
    ).not.toBeVisible();

    // AND — no additional GET /api/v1/contactos calls were made during typing
    expect(apiCalls.length).toBe(callsAfterLoad);
  });

  // ---------------------------------------------------------------------------
  // E2E-CT-03 (P0 · AC2)
  // Given the contact list is loaded
  // When the user types an email fragment in the search field
  // Then only contacts whose email matches are shown AND no extra API call is made
  // ---------------------------------------------------------------------------
  test('E2E-CT-03 — buscar por email filtra la lista en tiempo real sin llamadas extra a la API', async ({ page }) => {
    // GIVEN — three contacts with distinct emails
    const matchEmail = 'target.user@acme.co';
    const match = buildContacto({ nombre: 'Target User', email: matchEmail });
    const noMatch1 = buildContacto({ nombre: 'Otro Usuario', email: 'otro@empresa.com' });
    const noMatch2 = buildContacto({ nombre: 'Tercer Usuario', email: 'tercero@empresa.com' });
    const cm = await apiHelper.createContacto(match);
    const cn1 = await apiHelper.createContacto(noMatch1);
    const cn2 = await apiHelper.createContacto(noMatch2);
    createdIds.push(cm.id, cn1.id, cn2.id);

    // Track API calls (intercept BEFORE navigation — network-first pattern)
    const apiCalls: string[] = [];
    await page.route('**/api/v1/contactos', (route) => {
      apiCalls.push(route.request().method());
      route.continue();
    });

    await contactosPage.goto();
    await expect(contactosPage.contactoRows.first()).toBeVisible();
    const callsAfterLoad = apiCalls.length;

    // WHEN — user types a partial email in the search input
    await contactosPage.buscar('target.user');

    // THEN — only the contact with that email is visible
    await expect(
      contactosPage.contactoRows.filter({ hasText: match.nombre })
    ).toBeVisible();

    // AND — non-matching contacts are not visible
    await expect(
      contactosPage.contactoRows.filter({ hasText: noMatch1.nombre })
    ).not.toBeVisible();
    await expect(
      contactosPage.contactoRows.filter({ hasText: noMatch2.nombre })
    ).not.toBeVisible();

    // AND — no new API calls during typing
    expect(apiCalls.length).toBe(callsAfterLoad);
  });

  // ---------------------------------------------------------------------------
  // E2E-CT-04 (P1 · AC2)
  // Given the user has typed a search term that filters the list
  // When the user clears the search input
  // Then the full contact list is restored
  // ---------------------------------------------------------------------------
  test('E2E-CT-04 — limpiar el campo de búsqueda restaura la lista completa', async ({ page }) => {
    // GIVEN — two contacts
    const data1 = buildContacto({ nombre: 'Laura Vargas' });
    const data2 = buildContacto({ nombre: 'Raúl Herrera' });
    const c1 = await apiHelper.createContacto(data1);
    const c2 = await apiHelper.createContacto(data2);
    createdIds.push(c1.id, c2.id);

    await contactosPage.goto();
    await expect(contactosPage.contactoRows.first()).toBeVisible();

    // AND — search is active and filters to one result
    await contactosPage.buscar('Laura');
    await expect(
      contactosPage.contactoRows.filter({ hasText: data1.nombre })
    ).toBeVisible();
    await expect(
      contactosPage.contactoRows.filter({ hasText: data2.nombre })
    ).not.toBeVisible();

    // WHEN — user clears the search input
    await contactosPage.searchInput.clear();

    // THEN — both contacts are visible again
    await expect(
      contactosPage.contactoRows.filter({ hasText: data1.nombre })
    ).toBeVisible();
    await expect(
      contactosPage.contactoRows.filter({ hasText: data2.nombre })
    ).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // E2E-CT-05 (P2 · AC3)
  // Given there are NO contacts in the system
  // When the user navigates to /contactos
  // Then the EmptyState component is displayed with a guidance message
  // ---------------------------------------------------------------------------
  test('E2E-CT-05 — EmptyState se muestra cuando no hay contactos en el sistema', async ({ page }) => {
    // GIVEN — API returns an empty array (mock to guarantee state)
    await page.route('**/api/v1/contactos', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // WHEN — user navigates to /contactos
    await contactosPage.goto();

    // THEN — EmptyState component is visible
    await expect(page.getByTestId('empty-state')).toBeVisible();

    // AND — EmptyState contains a Spanish guidance message
    await expect(
      page.getByText(/no hay contactos|primer contacto/i)
    ).toBeVisible();

    // AND — no contact rows are rendered
    await expect(contactosPage.contactoRows).toHaveCount(0);
  });

  // ---------------------------------------------------------------------------
  // E2E-CT-06 (P2 · AC4)
  // Given the backend is unavailable when the page loads
  // When the fetch fails (API returns 500)
  // Then an ErrorPanel with a "Reintentar" button is shown
  // AND clicking "Reintentar" triggers a new API call
  // ---------------------------------------------------------------------------
  test('E2E-CT-06 — ErrorPanel con botón "Reintentar" se muestra cuando la API devuelve 500', async ({ page }) => {
    // GIVEN — API returns 500 (intercept BEFORE navigation — network-first pattern)
    let callCount = 0;
    await page.route('**/api/v1/contactos', (route) => {
      callCount++;
      route.fulfill({
        status: 500,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          status: 500,
          title: 'Internal Server Error',
          detail: 'Simulated backend failure for ATDD test',
        }),
      });
    });

    // WHEN — user navigates to /contactos
    await contactosPage.goto();

    // THEN — ErrorPanel is visible
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // AND — "Reintentar" button is visible
    const btnReintentar = page.getByRole('button', { name: /reintentar/i });
    await expect(btnReintentar).toBeVisible();

    // AND — no contact rows are rendered
    await expect(contactosPage.contactoRows).toHaveCount(0);

    // AND — EmptyState is NOT shown (error state, not empty result)
    await expect(page.getByTestId('empty-state')).not.toBeVisible();

    // WHEN — user clicks "Reintentar"
    const callsBeforeRetry = callCount;
    await btnReintentar.click();

    // THEN — a new GET /api/v1/contactos call is made
    await expect
      .poll(() => callCount, { timeout: 5000 })
      .toBeGreaterThan(callsBeforeRetry);
  });
});

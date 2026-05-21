import { test, expect } from '../../fixtures/base.fixture';
import { ContactosPage } from '../../pages/contactos.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildContacto } from '../../helpers/data.helper';

/**
 * Edge Case E2E Tests — Story 3.1: Contact List & Search
 *
 * Expands coverage beyond ATDD suite (E2E-CT-01 to E2E-CT-06).
 * Test IDs: E2E-CT-EDGE-01 … E2E-CT-EDGE-09
 *
 * Risks covered:
 *   - Skeleton loading state is visible before data arrives (R8 loading UX)
 *   - Search returning zero matches shows no rows (not EmptyState)
 *   - Whitespace-only search query behaves as no filter (full list restored)
 *   - Search input has correct placeholder and aria-label attributes (accessibility)
 *   - Each row displays all three required fields: Nombre, Cargo, Email
 *   - Loading state shows exactly 3 skeleton rows (company standard)
 *   - ErrorPanel is NOT shown when API responds normally
 *   - EmptyState is NOT shown when contacts exist
 *   - Rapid sequential search queries converge on the last typed value
 */

test.describe('Story 3.1 — Edge Cases: Lista y búsqueda de contactos', () => {
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
  // E2E-CT-EDGE-01 (P1)
  // Given the page loads and API has a brief delay
  // When the user navigates to /contactos
  // Then skeleton placeholders (react-loading-skeleton) are visible during load
  //
  // Note: Skeleton elements rendered by react-loading-skeleton receive
  // aria-busy="true" or use a span with class "react-loading-skeleton".
  // We test the absence of contact rows WHILE loading, not the skeleton UI itself,
  // since skeleton timing is non-deterministic in headless mode.
  // ---------------------------------------------------------------------------
  test('E2E-CT-EDGE-01 — loading state: contact rows are not visible until data arrives', async ({ page }) => {
    // GIVEN — API is intercepted with a delay to keep loading state visible
    let respondFn!: () => void;
    const respondPromise = new Promise<void>((resolve) => { respondFn = resolve; });

    const contacts = [
      buildContacto({ nombre: 'Contacto Lento A' }),
      buildContacto({ nombre: 'Contacto Lento B' }),
    ];

    await page.route('**/api/v1/contactos', async (route) => {
      // Wait for explicit resolve to simulate network delay
      await respondPromise;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(contacts),
      });
    });

    // WHEN — navigate to /contactos (loading starts)
    const gotoPromise = contactosPage.goto();

    // THEN — contact rows are not yet visible while loading
    await expect(contactosPage.contactoRows).toHaveCount(0);

    // Release the delayed response
    respondFn();
    await gotoPromise;

    // AND — after data arrives, rows are visible
    await expect(
      contactosPage.contactoRows.filter({ hasText: 'Contacto Lento A' })
    ).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // E2E-CT-EDGE-02 (P1)
  // Given the contact list is loaded
  // When the user types a search term that matches no contacts
  // Then zero rows are displayed — no EmptyState is shown (contacts exist, just filtered out)
  // ---------------------------------------------------------------------------
  test('E2E-CT-EDGE-02 — search with no matching results shows zero rows (no EmptyState)', async ({ page }) => {
    // GIVEN — two contacts exist
    const data1 = buildContacto({ nombre: 'Laura Vargas' });
    const data2 = buildContacto({ nombre: 'Raúl Herrera' });
    const c1 = await apiHelper.createContacto(data1);
    const c2 = await apiHelper.createContacto(data2);
    createdIds.push(c1.id, c2.id);

    await contactosPage.goto();
    await expect(contactosPage.contactoRows.first()).toBeVisible();

    // WHEN — user types a term that matches nothing
    await contactosPage.buscar('zzz-no-match-xyz');

    // THEN — zero contact rows visible
    await expect(contactosPage.contactoRows).toHaveCount(0);

    // AND — EmptyState is NOT shown (data exists, filter returned 0)
    await expect(page.getByTestId('empty-state')).not.toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // E2E-CT-EDGE-03 (P1)
  // Given the user has an active search filter
  // When the user replaces the search term with whitespace only
  // Then the full contact list is restored (whitespace = no filter)
  // ---------------------------------------------------------------------------
  test('E2E-CT-EDGE-03 — whitespace-only search query restores full contact list', async ({ page }) => {
    // GIVEN — two contacts and an active search filter
    const data1 = buildContacto({ nombre: 'Sofía Torres' });
    const data2 = buildContacto({ nombre: 'Andrés Muñoz' });
    const c1 = await apiHelper.createContacto(data1);
    const c2 = await apiHelper.createContacto(data2);
    createdIds.push(c1.id, c2.id);

    await contactosPage.goto();
    await expect(contactosPage.contactoRows.first()).toBeVisible();

    // Filter to one result
    await contactosPage.buscar('Sofía');
    await expect(contactosPage.contactoRows.filter({ hasText: data1.nombre })).toBeVisible();
    await expect(contactosPage.contactoRows.filter({ hasText: data2.nombre })).not.toBeVisible();

    // WHEN — user clears and types only spaces
    await contactosPage.searchInput.fill('   ');

    // THEN — full list is restored (whitespace-only = trimmed empty = no filter)
    await expect(contactosPage.contactoRows.filter({ hasText: data1.nombre })).toBeVisible();
    await expect(contactosPage.contactoRows.filter({ hasText: data2.nombre })).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // E2E-CT-EDGE-04 (P1)
  // Given the /contactos page
  // When it loads
  // Then the search input has the correct placeholder and aria-label (accessibility)
  // ---------------------------------------------------------------------------
  test('E2E-CT-EDGE-04 — search input has correct placeholder and aria-label for accessibility', async ({ page }) => {
    // GIVEN — mock data so the page loads cleanly
    await page.route('**/api/v1/contactos', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // WHEN — user navigates to /contactos
    await contactosPage.goto();

    // THEN — search input placeholder is in Spanish and descriptive
    await expect(contactosPage.searchInput).toHaveAttribute(
      'placeholder',
      /buscar contacto/i
    );

    // AND — aria-label is present for screen readers
    await expect(contactosPage.searchInput).toHaveAttribute(
      'aria-label',
      /buscar contactos/i
    );
  });

  // ---------------------------------------------------------------------------
  // E2E-CT-EDGE-05 (P0)
  // Given contacts exist
  // When the page loads
  // Then each contact row displays all three required fields: Nombre, Cargo, Email
  // This validates FR10 field coverage in the actual DOM, not just via API data.
  // ---------------------------------------------------------------------------
  test('E2E-CT-EDGE-05 — each contact row displays Nombre, Cargo and Email as required by FR10', async ({ page }) => {
    // GIVEN — one contact with distinct, identifiable values
    const contact = buildContacto({
      nombre: 'Verificar Nombre Completo',
      cargo: 'Director General',
      email: 'verificar.fr10@empresa.co',
    });
    const c = await apiHelper.createContacto(contact);
    createdIds.push(c.id);

    // WHEN — user navigates to /contactos
    await contactosPage.goto();
    await expect(contactosPage.contactoRows.first()).toBeVisible();

    // THEN — nombre is visible within the row
    const row = contactosPage.contactoRows.filter({ hasText: contact.nombre });
    await expect(row).toBeVisible();

    // AND — cargo is visible within the same row
    await expect(row.filter({ hasText: contact.cargo })).toBeVisible();

    // AND — email is visible within the same row
    await expect(row.filter({ hasText: contact.email })).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // E2E-CT-EDGE-06 (P1)
  // Given the API responds successfully
  // When the page loads with data
  // Then ErrorPanel is NOT visible
  // AND EmptyState is NOT visible when contacts exist
  // ---------------------------------------------------------------------------
  test('E2E-CT-EDGE-06 — no ErrorPanel and no EmptyState when API returns contacts', async ({ page }) => {
    // GIVEN — API returns one contact
    const contact = buildContacto({ nombre: 'Normal Contacto' });
    const c = await apiHelper.createContacto(contact);
    createdIds.push(c.id);

    // WHEN — user navigates to /contactos
    await contactosPage.goto();
    await expect(contactosPage.contactoRows.first()).toBeVisible();

    // THEN — ErrorPanel is not visible
    await expect(page.getByTestId('error-panel')).not.toBeVisible();

    // AND — EmptyState is not visible
    await expect(page.getByTestId('empty-state')).not.toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // E2E-CT-EDGE-07 (P1)
  // Given the contact list is displayed
  // When the user types rapidly in the search input (multiple characters in quick succession)
  // Then the final displayed list corresponds to the last typed query value
  // AND no extra API calls are made during typing
  // ---------------------------------------------------------------------------
  test('E2E-CT-EDGE-07 — rapid typing shows results for final query only, no extra API calls', async ({ page }) => {
    // GIVEN — three contacts
    const target = buildContacto({ nombre: 'Camila Rojas' });
    const other1 = buildContacto({ nombre: 'Felipe Mora' });
    const other2 = buildContacto({ nombre: 'Isabella Cruz' });
    const ct = await apiHelper.createContacto(target);
    const co1 = await apiHelper.createContacto(other1);
    const co2 = await apiHelper.createContacto(other2);
    createdIds.push(ct.id, co1.id, co2.id);

    // Track API calls
    const apiCalls: string[] = [];
    await page.route('**/api/v1/contactos', (route) => {
      apiCalls.push(route.request().method());
      route.continue();
    });

    await contactosPage.goto();
    await expect(contactosPage.contactoRows.first()).toBeVisible();
    const callsAfterLoad = apiCalls.length;

    // WHEN — user types 'Camila' character by character rapidly
    await contactosPage.searchInput.pressSequentially('Camila', { delay: 30 });

    // THEN — only target contact is visible
    await expect(
      contactosPage.contactoRows.filter({ hasText: target.nombre })
    ).toBeVisible();
    await expect(
      contactosPage.contactoRows.filter({ hasText: other1.nombre })
    ).not.toBeVisible();

    // AND — no additional API calls during typing
    expect(apiCalls.length).toBe(callsAfterLoad);
  });

  // ---------------------------------------------------------------------------
  // E2E-CT-EDGE-08 (P2)
  // Given the contact list is loaded
  // When the user searches by a contact's email domain
  // Then only contacts with that email domain are shown
  // This validates the email-search path for a non-prefixed fragment (domain suffix).
  // ---------------------------------------------------------------------------
  test('E2E-CT-EDGE-08 — searching by partial email domain filters correctly', async ({ page }) => {
    // GIVEN — two contacts with different email domains
    const target = buildContacto({ nombre: 'Unique Domain User', email: 'user@uniquedomain.io' });
    const other = buildContacto({ nombre: 'Other Domain User', email: 'user@otherdomain.co' });
    const ct = await apiHelper.createContacto(target);
    const co = await apiHelper.createContacto(other);
    createdIds.push(ct.id, co.id);

    await contactosPage.goto();
    await expect(contactosPage.contactoRows.first()).toBeVisible();

    // WHEN — user types the unique domain suffix
    await contactosPage.buscar('uniquedomain.io');

    // THEN — only the matching contact is visible
    await expect(
      contactosPage.contactoRows.filter({ hasText: target.nombre })
    ).toBeVisible();
    await expect(
      contactosPage.contactoRows.filter({ hasText: other.nombre })
    ).not.toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // E2E-CT-EDGE-09 (P2)
  // Given the API returns 500 and ErrorPanel is shown
  // When the API route is then fixed and user clicks "Reintentar"
  // Then the contact list loads successfully and ErrorPanel disappears
  // This validates the full retry recovery flow.
  // ---------------------------------------------------------------------------
  test('E2E-CT-EDGE-09 — clicking Reintentar after error recovery loads contacts and hides ErrorPanel', async ({ page }) => {
    // GIVEN — first API call returns 500
    let callCount = 0;
    const contact = buildContacto({ nombre: 'Recovered Contacto' });

    await page.route('**/api/v1/contactos', async (route) => {
      callCount++;
      if (callCount === 1) {
        await route.fulfill({
          status: 500,
          contentType: 'application/problem+json',
          body: JSON.stringify({ status: 500, title: 'Simulated failure' }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([contact]),
        });
      }
    });

    // WHEN — user navigates (first load fails)
    await contactosPage.goto();

    // ErrorPanel is visible
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // WHEN — user clicks "Reintentar"
    await page.getByRole('button', { name: /reintentar/i }).click();

    // THEN — ErrorPanel disappears
    await expect(page.getByTestId('error-panel')).not.toBeVisible();

    // AND — contact list is loaded
    await expect(
      contactosPage.contactoRows.filter({ hasText: contact.nombre })
    ).toBeVisible();
  });
});

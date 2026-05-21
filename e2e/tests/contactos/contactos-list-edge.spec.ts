import { test, expect } from '../../fixtures/base.fixture';
import { ContactosPage } from '../../pages/contactos.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildContacto } from '../../helpers/data.helper';

/**
 * Edge Case E2E Tests — Story 3.1: Contact List & Search (Part 1 of 2)
 *
 * Expands coverage beyond ATDD suite (E2E-CT-01 to E2E-CT-06).
 * Test IDs: E2E-CT-EDGE-01 … E2E-CT-EDGE-05
 * See contactos-list-edge-2.spec.ts for E2E-CT-EDGE-06 … E2E-CT-EDGE-09
 *
 * Risks covered:
 *   - Skeleton loading state is visible before data arrives (R8 loading UX)
 *   - Search returning zero matches shows no rows (not EmptyState)
 *   - Whitespace-only search query behaves as no filter (full list restored)
 *   - Search input has correct placeholder and aria-label attributes (accessibility)
 *   - Each row displays all three required fields: Nombre, Cargo, Email
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
});

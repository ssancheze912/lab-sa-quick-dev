import { test, expect } from '../../fixtures/base.fixture';
import { ContactosPage } from '../../pages/contactos.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildContacto } from '../../helpers/data.helper';

/**
 * Edge Case E2E Tests — Story 3.1: Contact List & Search (Part 2 of 2)
 *
 * Expands coverage beyond ATDD suite (E2E-CT-01 to E2E-CT-06).
 * Test IDs: E2E-CT-EDGE-06 … E2E-CT-EDGE-09
 * See contactos-list-edge.spec.ts for E2E-CT-EDGE-01 … E2E-CT-EDGE-05
 *
 * Risks covered:
 *   - ErrorPanel is NOT shown when API responds normally
 *   - EmptyState is NOT shown when contacts exist
 *   - Rapid sequential search queries converge on the last typed value
 *   - Full retry recovery flow: ErrorPanel disappears after successful retry
 */

test.describe('Story 3.1 — Edge Cases (Part 2): Lista y búsqueda de contactos', () => {
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

    // THEN — ErrorPanel is visible
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

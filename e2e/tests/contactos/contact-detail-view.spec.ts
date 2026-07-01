import { test, expect } from '../../fixtures/base.fixture';
import { ContactosPage } from '../../pages/contactos.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildContacto } from '../../helpers/data.helper';

/**
 * E2E tests: Story 3.2 — Contact Detail View
 *
 * Covers TC-E3-P1-06 (deep link loads the correct contact, real seeded data,
 * full stack) and TC-E3-P1-07 (non-existent contactoId shows a graceful
 * not-found UI with zero console errors) — the two P1 test-design scenarios
 * mapped to Story 3.2 in test-design-epic-3.md (risk R5).
 *
 * RED PHASE: routes/_app/contactos.$contactoId.tsx, ContactoDetailView and the
 * `GET /api/v1/contactos/{id}` endpoint do not exist yet (Story 3.2, Tasks
 * 1-4). Additionally, `POST /api/v1/contactos` (used here via ApiHelper to
 * seed a contact) does not exist until Story 3.3 — per the story's Dev Notes,
 * this is an accepted RED-phase dependency in this pipeline ordering (3.2
 * before 3.3); these tests will start passing their seeding step once 3.3
 * lands, same as 2.2's equivalent tests depended on 2.3's POST endpoint.
 *
 * These tests exercise the real backend (seeded via ApiHelper), not mocked
 * network responses — TC-E3-P1-06 explicitly validates the full-stack path
 * (frontend deep link -> real endpoint -> real DB record).
 */

test.describe('Story 3.2 — Contact Detail View', () => {
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

  test('TC-E3-P1-06 — should load and display the correct contact when navigating directly to /contactos/:contactoId', async () => {
    // GIVEN: a contact is seeded via the real API
    const data = buildContacto({ nombre: 'Camila Restrepo Duque' });
    const contacto = await apiHelper.createContacto(data);
    createdIds.push(contacto.id);

    // WHEN: the user navigates directly to /contactos/{uuid} (no prior in-app navigation)
    await contactosPage.gotoDetail(contacto.id);

    // THEN: the correct contact details render (Nombre, Cargo, Teléfono, Email)
    await expect(contactosPage.detailPanel).toBeVisible();
    await expect(contactosPage.detailPanel.getByText(data.nombre)).toBeVisible();
    await expect(contactosPage.detailPanel.getByText(data.cargo!)).toBeVisible();
    await expect(contactosPage.detailPanel.getByText(data.telefono!)).toBeVisible();
    await expect(contactosPage.detailPanel.getByText(data.email)).toBeVisible();
  });

  test('TC-E3-P1-06 — should not redirect to /contactos root when deep-linking to an existing contact', async ({ page }) => {
    // GIVEN: a contact is seeded via the real API
    const data = buildContacto();
    const contacto = await apiHelper.createContacto(data);
    createdIds.push(contacto.id);

    // WHEN: the user navigates directly to /contactos/{uuid}
    await contactosPage.gotoDetail(contacto.id);

    // THEN: the URL remains at the deep-linked detail route (no redirect to /contactos root)
    expect(page.url()).toContain(`/contactos/${contacto.id}`);
  });

  test('TC-E3-P1-07 — should show a graceful not-found UI for a well-formed but non-existent contactoId', async () => {
    // GIVEN: a UUID that does not match any contact record
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    // WHEN: the user navigates to /contactos/{nonExistentId}
    await contactosPage.gotoDetail(nonExistentId);

    // THEN: a graceful not-found message renders — no blank page, no crash
    await expect(contactosPage.detailNotFound).toBeVisible();
  });

  test('TC-E3-P1-07 — should log zero console errors when the contactoId does not exist', async ({ page }) => {
    // GIVEN: a console error listener attached before navigation (R5 risk mitigation)
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    // WHEN: the user navigates to the non-existent contact's URL
    await contactosPage.gotoDetail(nonExistentId);
    await expect(contactosPage.detailNotFound).toBeVisible();

    // THEN: zero console error entries were logged (no unhandled JS error)
    expect(consoleErrors).toHaveLength(0);
  });

  test('AC #4 — should show the empty/default state on /contactos when no contact is selected', async () => {
    // GIVEN: at least one contact exists in the system
    const data = buildContacto();
    const contacto = await apiHelper.createContacto(data);
    createdIds.push(contacto.id);

    // WHEN: the user navigates to /contactos without selecting any contact
    await contactosPage.goto();

    // THEN: the right panel shows the empty/default "no contact selected" state
    await expect(contactosPage.detailEmptyState).toBeVisible();
  });

  test('AC #1 — should navigate to /contactos/:contactoId and show its details when a list item is clicked', async () => {
    // GIVEN: a contact is seeded and the list is displayed
    const data = buildContacto({ nombre: 'Selección Contacto Click' });
    const contacto = await apiHelper.createContacto(data);
    createdIds.push(contacto.id);
    await contactosPage.goto();

    // WHEN: the user clicks the contact's row in the list
    await contactosPage.seleccionarContacto(data.nombre);

    // THEN: the URL updates to the deep-link route and the detail panel shows its data
    await expect
      .poll(() => contactosPage.page.url())
      .toContain(`/contactos/${contacto.id}`);
    await expect(contactosPage.detailPanel.getByText(data.nombre)).toBeVisible();
  });
});

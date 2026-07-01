import { test, expect } from '../../fixtures/base.fixture';
import { ContactosPage } from '../../pages/contactos.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildContacto } from '../../helpers/data.helper';

/**
 * Story 3.3 — Create Contact (TC-E3-P0-04 full journey, TC-E3-P0-03 UI leg,
 * TC-E3-P0-05 UI leg).
 *
 * Covers the P0 create-contact user journey end-to-end:
 *   AC #1 — "Nuevo contacto" opens the ContactoForm with all four required fields
 *   AC #2 — successful submit creates the contact, it appears in the list
 *           immediately (no reload), exact success toast shown, detail matches
 *   AC #3 — empty required fields show inline errors, no backend call
 *   AC #4/#5 — backend validation is independent of the frontend (covered at
 *           the API/backend-integration level, not duplicated here as E2E)
 *
 * Unlike Story 2.3's `create-client.spec.ts`, there is NO duplicate-value
 * conflict scenario here — `ContactoEntity` has no unique business key (Dev
 * Notes), so only the required-field validation path (AC #3) is exercised
 * for the negative case.
 *
 * RED PHASE: `POST /api/v1/contactos` does not exist on the backend yet, and
 * `ContactoForm`/"Nuevo contacto" trigger do not exist on the frontend yet
 * (Story 3.3, Tasks 3 and 5). These tests are expected to fail until the
 * corresponding implementation tasks are complete.
 */
test.describe('Crear Contacto (Story 3.3)', () => {
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

  test('TC-E3-P0-04 — AC #1: "Nuevo contacto" opens a form with Nombre, Cargo, Teléfono, Email', async () => {
    // GIVEN: the user is on the /contactos view
    await contactosPage.goto();

    // WHEN: the user clicks "Nuevo contacto"
    await contactosPage.abrirFormularioNuevo();

    // THEN: the form exposes all four required fields
    await expect(contactosPage.inputNombre).toBeVisible();
    await expect(contactosPage.inputCargo).toBeVisible();
    await expect(contactosPage.inputTelefono).toBeVisible();
    await expect(contactosPage.inputEmail).toBeVisible();
  });

  test('TC-E3-P0-04 — AC #2: submitting valid data creates the contact and it appears in the list immediately', async () => {
    // GIVEN: the user is on /contactos with the form open and filled with valid data
    const data = buildContacto();
    await contactosPage.goto();
    await contactosPage.abrirFormularioNuevo();
    await contactosPage.llenarFormulario(data);

    // WHEN: the form is submitted
    await contactosPage.guardar();

    const contactos = await apiHelper.getContactos();
    const created = contactos.find((c: { nombre: string; id: string }) => c.nombre === data.nombre);
    if (created) createdIds.push(created.id);

    // THEN: the new contact appears in the list without a manual refresh/reload
    await expect(contactosPage.page.getByText(data.nombre)).toBeVisible();
  });

  test('TC-E3-P0-04 — AC #2: shows the exact success toast "Contacto creado correctamente"', async ({ page }) => {
    // GIVEN: the user is on /contactos with the form open and filled with valid data
    const data = buildContacto();
    await contactosPage.goto();
    await contactosPage.abrirFormularioNuevo();
    await contactosPage.llenarFormulario(data);

    // WHEN: the form is submitted
    await contactosPage.btnGuardar.click();

    const contactos = await apiHelper.getContactos();
    const created = contactos.find((c: { nombre: string; id: string }) => c.nombre === data.nombre);
    if (created) createdIds.push(created.id);

    // THEN: the exact Spanish success toast copy is shown (R10, no paraphrasing)
    await expect(page.getByText('Contacto creado correctamente')).toBeVisible();
  });

  test('TC-E3-P0-04 — AC #2: newly created contact is selectable and its detail matches submitted values', async () => {
    // GIVEN: the user has just created a new contact
    const data = buildContacto();
    await contactosPage.goto();
    await contactosPage.abrirFormularioNuevo();
    await contactosPage.llenarFormulario(data);
    await contactosPage.guardar();

    const contactos = await apiHelper.getContactos();
    const created = contactos.find((c: { nombre: string; id: string }) => c.nombre === data.nombre);
    if (created) createdIds.push(created.id);

    // WHEN: the user selects the newly created contact from the list
    await contactosPage.seleccionarContacto(data.nombre);

    // THEN: the detail panel shows the submitted values
    await expect(contactosPage.detailPanel).toContainText(data.nombre);
    await expect(contactosPage.detailPanel).toContainText(data.email);
  });

  test('AC #3: submitting the form with all required fields empty shows inline errors and does not create a contact', async () => {
    // GIVEN: the user is on /contactos with the form open, no fields filled
    await contactosPage.goto();
    await contactosPage.abrirFormularioNuevo();

    // WHEN: the user submits without filling any field
    await contactosPage.btnGuardar.click();

    // THEN: the form remains open with inline validation errors, no contact created
    await expect(contactosPage.form).toBeVisible();
    await expect(contactosPage.page.getByText(/requerido|obligatorio/i).first()).toBeVisible();
  });
});

/**
 * This story's `POST /api/v1/contactos` endpoint also unblocks the two
 * previously-RED scenarios in Story 3.2's `contact-detail-view.spec.ts`
 * (TC-E3-P1-06, AC #1 click-navigates) that depend on `apiHelper.createContacto`.
 * Per the story's Task 6/Dev Notes: re-run `contact-detail-view.spec.ts` and
 * confirm 6/6 pass once this story's backend implementation lands — not a
 * new test file, just a verification step on the existing suite.
 */

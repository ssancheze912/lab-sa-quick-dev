import { test, expect } from '@playwright/test';
import { ContactosPage } from '../../pages/contactos.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildContacto } from '../../helpers/data.helper';

/**
 * ATDD — Story 3.3: Create Contact
 *
 * Tests are in RED phase — they define the expected behaviour BEFORE implementation.
 * Make these tests GREEN by implementing ContactoFormDialog, useCreateContacto,
 * contactoSchema, and wiring the "Nuevo contacto" button in ContactoListView
 * as specified in Story 3.3.
 *
 * E2E Coverage:
 *   E2E-CT-11  P0  AC1  — "Nuevo contacto" opens dialog with 4 visible required fields
 *   E2E-CT-12  P0  AC2  — Submitting valid form creates contact and it appears in table immediately (no reload)
 *   E2E-CT-13  P0  AC3  — Submitting empty form shows inline errors on all 4 fields; no POST fired
 *   E2E-CT-14  P0  AC3  — Submitting partially empty form shows errors only on empty required fields
 *   E2E-CT-15  P1  AC2  — Success toast "Contacto creado correctamente" appears after successful create
 *   E2E-CT-16  P1  AC2  — Form dialog closes automatically after successful create
 *   E2E-CT-17  P1  —    — Contact created via form has clienteId = null (Epic 3 scope boundary)
 */

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ---------------------------------------------------------------------------
// E2E Tests
// ---------------------------------------------------------------------------

test.describe('Story 3.3 — Crear contacto (E2E)', () => {
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
  // E2E-CT-11 (P0 · AC1)
  // Given the user is on the /contactos view
  // When the user clicks "Nuevo contacto"
  // Then a dialog form opens with four fields: Nombre, Cargo, Teléfono, Email
  //   AND all four fields are visible and required
  // -------------------------------------------------------------------------
  test('E2E-CT-11 — "Nuevo contacto" abre el formulario con los 4 campos requeridos visibles', async ({ page }) => {
    // GIVEN — intercept network BEFORE navigation (network-first pattern)
    await page.route('**/api/v1/contactos', (route) => route.continue());

    await contactosPage.goto();

    // THEN — "Nuevo contacto" button is visible
    await expect(contactosPage.btnNuevoContacto).toBeVisible();

    // WHEN — user clicks "Nuevo contacto"
    await contactosPage.btnNuevoContacto.click();

    // THEN — dialog opens
    await expect(contactosPage.form).toBeVisible();
    await expect(page.getByTestId('contacto-form-dialog')).toBeVisible();

    // AND — all four fields are visible
    await expect(page.getByTestId('input-nombre')).toBeVisible();
    await expect(page.getByTestId('input-cargo')).toBeVisible();
    await expect(page.getByTestId('input-telefono')).toBeVisible();
    await expect(page.getByTestId('input-email')).toBeVisible();

    // AND — action buttons are visible
    await expect(page.getByTestId('btn-guardar')).toBeVisible();
    await expect(page.getByTestId('btn-cancelar')).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // E2E-CT-12 (P0 · AC2 — Risk R2)
  // Given the user fills all required fields and clicks "Guardar"
  // When the form is submitted
  // Then the contact is created via POST /api/v1/contactos,
  //   the dialog closes,
  //   the new contact appears in the contact list immediately (no page reload — FR27)
  // -------------------------------------------------------------------------
  test('E2E-CT-12 — enviar formulario completo crea el contacto y lo muestra en la tabla sin recargar', async ({ page }) => {
    // GIVEN — intercept network BEFORE navigation (network-first pattern)
    let postCallCount = 0;
    await page.route('**/api/v1/contactos', (route) => {
      if (route.request().method() === 'POST') {
        postCallCount++;
      }
      route.continue();
    });

    await contactosPage.goto();

    const data = buildContacto({ nombre: 'Contacto Create E2E-CT-12' });

    // WHEN — user opens the form and fills all required fields
    await contactosPage.btnNuevoContacto.click();
    await expect(contactosPage.form).toBeVisible();

    await page.getByTestId('input-nombre').fill(data.nombre);
    await page.getByTestId('input-cargo').fill(data.cargo);
    await page.getByTestId('input-telefono').fill(data.telefono);
    await page.getByTestId('input-email').fill(data.email);

    // AND — user clicks "Guardar"
    await page.getByTestId('btn-guardar').click();

    // THEN — dialog closes automatically (form hidden)
    await expect(contactosPage.form).toBeHidden();

    // AND — exactly one POST call was made to the backend
    expect(postCallCount).toBe(1);

    // AND — new contact appears in the list WITHOUT a page reload (FR27)
    await expect(
      contactosPage.contactoRows.filter({ hasText: data.nombre })
    ).toBeVisible();

    // Track created id for cleanup
    const contactos = await apiHelper.getContactos();
    const created = contactos.find((c: { nombre: string; id: string }) => c.nombre === data.nombre);
    if (created) createdIds.push(created.id);
  });

  // -------------------------------------------------------------------------
  // E2E-CT-13 (P0 · AC3 — Risk R3)
  // Given the user clicks "Guardar" with all required fields empty
  // When the Zod schema validation runs on submit (frontend-only, before API call)
  // Then inline error messages appear under each empty field (FR16),
  //   the form does NOT send any request to the backend,
  //   and the dialog remains open
  // -------------------------------------------------------------------------
  test('E2E-CT-13 — enviar formulario vacío muestra errores inline en los 4 campos y no lanza petición POST', async ({ page }) => {
    // GIVEN — network intercept BEFORE navigation; fail test if POST fires unexpectedly
    let postFired = false;
    await page.route('**/api/v1/contactos', (route) => {
      if (route.request().method() === 'POST') {
        postFired = true;
        route.abort();
      } else {
        route.continue();
      }
    });

    await contactosPage.goto();

    // WHEN — user opens the form without filling any field
    await contactosPage.btnNuevoContacto.click();
    await expect(contactosPage.form).toBeVisible();

    // AND — user clicks "Guardar" immediately (all fields empty)
    await page.getByTestId('btn-guardar').click();

    // THEN — form remains open (dialog did not close)
    await expect(contactosPage.form).toBeVisible();

    // AND — inline validation errors are visible for all four required fields
    await expect(page.getByTestId('error-nombre')).toBeVisible();
    await expect(page.getByTestId('error-cargo')).toBeVisible();
    await expect(page.getByTestId('error-telefono')).toBeVisible();
    await expect(page.getByTestId('error-email')).toBeVisible();

    // AND — no POST request was fired (frontend validation blocked the call — R3)
    expect(postFired).toBe(false);
  });

  // -------------------------------------------------------------------------
  // E2E-CT-14 (P0 · AC3)
  // Given the user fills some required fields but leaves others empty
  // When the form is submitted
  // Then inline error messages appear ONLY on the empty required fields
  //   AND no POST request is fired
  // -------------------------------------------------------------------------
  test('E2E-CT-14 — formulario parcialmente vacío muestra errores solo en los campos vacíos', async ({ page }) => {
    // GIVEN — network intercept BEFORE navigation; fail if POST fires
    let postFired = false;
    await page.route('**/api/v1/contactos', (route) => {
      if (route.request().method() === 'POST') {
        postFired = true;
        route.abort();
      } else {
        route.continue();
      }
    });

    await contactosPage.goto();

    // WHEN — user opens form and fills only Nombre and Cargo, leaves Teléfono and Email empty
    await contactosPage.btnNuevoContacto.click();
    await expect(contactosPage.form).toBeVisible();

    await page.getByTestId('input-nombre').fill('María García Parcial');
    await page.getByTestId('input-cargo').fill('Gerente Comercial');
    // Teléfono and Email intentionally left empty

    await page.getByTestId('btn-guardar').click();

    // THEN — form remains open
    await expect(contactosPage.form).toBeVisible();

    // AND — error appears for Teléfono (empty)
    await expect(page.getByTestId('error-telefono')).toBeVisible();

    // AND — error appears for Email (empty)
    await expect(page.getByTestId('error-email')).toBeVisible();

    // AND — NO error appears for Nombre (filled)
    await expect(page.getByTestId('error-nombre')).not.toBeVisible();

    // AND — NO error appears for Cargo (filled)
    await expect(page.getByTestId('error-cargo')).not.toBeVisible();

    // AND — no POST request was fired
    expect(postFired).toBe(false);
  });

  // -------------------------------------------------------------------------
  // E2E-CT-15 (P1 · AC2)
  // Given all required fields are filled and the backend returns 201
  // When the form is successfully submitted
  // Then a toast notification "Contacto creado correctamente" appears
  // -------------------------------------------------------------------------
  test('E2E-CT-15 — toast "Contacto creado correctamente" aparece tras creación exitosa', async ({ page }) => {
    // GIVEN — intercept network BEFORE navigation
    await page.route('**/api/v1/contactos', (route) => route.continue());

    await contactosPage.goto();

    const data = buildContacto({ nombre: 'Contacto Toast E2E-CT-15' });

    // WHEN — user fills the form and saves
    await contactosPage.btnNuevoContacto.click();
    await expect(contactosPage.form).toBeVisible();

    await page.getByTestId('input-nombre').fill(data.nombre);
    await page.getByTestId('input-cargo').fill(data.cargo);
    await page.getByTestId('input-telefono').fill(data.telefono);
    await page.getByTestId('input-email').fill(data.email);

    await page.getByTestId('btn-guardar').click();

    // THEN — success toast with Spanish message is visible
    await expect(
      page.getByText(/contacto creado correctamente/i)
    ).toBeVisible();

    // Cleanup
    const contactos = await apiHelper.getContactos();
    const created = contactos.find((c: { nombre: string; id: string }) => c.nombre === data.nombre);
    if (created) createdIds.push(created.id);
  });

  // -------------------------------------------------------------------------
  // E2E-CT-16 (P1 · AC2)
  // Given all required fields are filled and the backend returns 201
  // When the form is successfully submitted
  // Then the dialog closes automatically WITHOUT the user clicking "Cancelar"
  // -------------------------------------------------------------------------
  test('E2E-CT-16 — el formulario se cierra automáticamente tras una creación exitosa', async ({ page }) => {
    // GIVEN — intercept network BEFORE navigation
    await page.route('**/api/v1/contactos', (route) => route.continue());

    await contactosPage.goto();

    const data = buildContacto({ nombre: 'Contacto Autoclose E2E-CT-16' });

    // WHEN — user opens form, fills all fields, and clicks "Guardar"
    await contactosPage.btnNuevoContacto.click();
    await expect(contactosPage.form).toBeVisible();

    await page.getByTestId('input-nombre').fill(data.nombre);
    await page.getByTestId('input-cargo').fill(data.cargo);
    await page.getByTestId('input-telefono').fill(data.telefono);
    await page.getByTestId('input-email').fill(data.email);

    await page.getByTestId('btn-guardar').click();

    // THEN — dialog closes automatically (without pressing Cancelar)
    await expect(contactosPage.form).toBeHidden();

    // AND — the contacts list is still visible (no full-page navigation)
    await expect(contactosPage.contactoRows.first().or(page.getByTestId('contactos-list'))).toBeVisible();

    // Cleanup
    const contactos = await apiHelper.getContactos();
    const created = contactos.find((c: { nombre: string; id: string }) => c.nombre === data.nombre);
    if (created) createdIds.push(created.id);
  });

  // -------------------------------------------------------------------------
  // E2E-CT-17 (P1 · Epic 3 scope boundary — Risk R7)
  // Given the user creates a contact via the form
  // When the contact is persisted
  // Then the contact has clienteId = null (no automatic client association)
  // -------------------------------------------------------------------------
  test('E2E-CT-17 — el contacto creado por el formulario tiene clienteId null (sin asociación a cliente)', async ({ page }) => {
    // GIVEN — intercept network BEFORE navigation
    await page.route('**/api/v1/contactos', (route) => route.continue());

    await contactosPage.goto();

    const data = buildContacto({ nombre: 'Contacto ClienteNull E2E-CT-17' });

    // WHEN — user creates a contact via the form
    await contactosPage.btnNuevoContacto.click();
    await expect(contactosPage.form).toBeVisible();

    await page.getByTestId('input-nombre').fill(data.nombre);
    await page.getByTestId('input-cargo').fill(data.cargo);
    await page.getByTestId('input-telefono').fill(data.telefono);
    await page.getByTestId('input-email').fill(data.email);

    await page.getByTestId('btn-guardar').click();

    // Wait for dialog to close (creation succeeded)
    await expect(contactosPage.form).toBeHidden();

    // THEN — contact has clienteId = null via API verification
    const contactos = await apiHelper.getContactos();
    const created = contactos.find((c: { nombre: string; id: string; clienteId: string | null }) => c.nombre === data.nombre);

    expect(created).toBeDefined();
    expect(created.clienteId).toBeNull();

    createdIds.push(created.id);
  });
});

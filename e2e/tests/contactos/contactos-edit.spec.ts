import { test, expect } from '@playwright/test';
import { ContactosPage } from '../../pages/contactos.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildContacto } from '../../helpers/data.helper';

/**
 * ATDD — Story 3.4: Edit Contact
 *
 * Tests are in RED phase — they define the expected behaviour BEFORE implementation.
 * Make these tests GREEN by:
 *   - Creating `useUpdateContacto` mutation hook
 *   - Extending `ContactoFormDialog` to support edit mode via optional `contacto` prop
 *   - Adding "Editar" button (data-testid="btn-editar") to `ContactoDetailView`
 *   - Wiring `PUT /api/v1/contactos/:id` endpoint in the backend
 *
 * E2E Coverage:
 *   E2E-CT-18  P0  AC1  — Clicking "Editar" opens form pre-filled with current values of all 4 fields
 *   E2E-CT-19  P0  AC2  — Modifying a field and saving updates detail panel and list immediately (no reload, FR27)
 *   E2E-CT-20  P0  AC3  — Clearing a required field and saving shows inline error; no PUT fired
 *   E2E-CT-21  P1  AC2  — Toast "Contacto actualizado correctamente" appears after successful edit
 *   E2E-CT-22  P1  AC4  — Clicking "Cancelar" closes form without making PUT request; original data unchanged
 */

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ---------------------------------------------------------------------------
// E2E Tests
// ---------------------------------------------------------------------------

test.describe('Story 3.4 — Editar contacto (E2E)', () => {
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
  // E2E-CT-18 (P0 · AC1)
  // Given the user is viewing a contact's detail
  // When the user clicks "Editar"
  // Then the contact form dialog opens pre-filled with the current values of all four fields:
  //   Nombre, Cargo, Teléfono, Email (FR14)
  // -------------------------------------------------------------------------
  test('E2E-CT-18 — "Editar" abre el formulario con los 4 campos pre-llenados con los valores actuales', async ({ page }) => {
    // GIVEN — a contact exists in the system
    const contactoData = buildContacto({ nombre: 'Contacto Pre-filled E2E-CT-18' });
    const created = await apiHelper.createContacto(contactoData);
    createdIds.push(created.id);

    // GIVEN — intercept network BEFORE navigation (network-first pattern)
    await page.route('**/api/v1/contactos**', (route) => route.continue());

    await contactosPage.goto();

    // WHEN — user selects the contact from the list to view its detail
    await contactosPage.seleccionarContacto(contactoData.nombre);

    // AND — the detail panel is visible
    await expect(contactosPage.detailPanel).toBeVisible();

    // AND — user clicks "Editar" in the detail panel
    await page.getByTestId('btn-editar').click();

    // THEN — the form dialog opens
    await expect(page.getByTestId('contacto-form-dialog')).toBeVisible();

    // AND — the dialog title indicates edit mode
    await expect(page.getByRole('dialog')).toContainText(/editar contacto/i);

    // AND — the Nombre field is pre-filled with the contact's current value
    await expect(page.getByTestId('input-nombre')).toHaveValue(contactoData.nombre);

    // AND — the Cargo field is pre-filled with the contact's current value
    await expect(page.getByTestId('input-cargo')).toHaveValue(contactoData.cargo);

    // AND — the Teléfono field is pre-filled with the contact's current value
    await expect(page.getByTestId('input-telefono')).toHaveValue(contactoData.telefono);

    // AND — the Email field is pre-filled with the contact's current value
    await expect(page.getByTestId('input-email')).toHaveValue(contactoData.email);
  });

  // -------------------------------------------------------------------------
  // E2E-CT-19 (P0 · AC2 — Risk R2)
  // Given the user has the edit form open with a contact's data
  // When the user modifies a field and clicks "Guardar"
  // Then the changes are persisted via PUT /api/v1/contactos/:id,
  //   the dialog closes,
  //   the updated values are reflected in the contact detail panel AND list immediately
  //   WITHOUT a full page reload (FR27)
  // -------------------------------------------------------------------------
  test('E2E-CT-19 — guardar cambios actualiza el panel de detalle y la fila de lista inmediatamente sin recargar', async ({ page }) => {
    // GIVEN — a contact exists in the system
    const contactoData = buildContacto({ nombre: 'Contacto Original E2E-CT-19' });
    const created = await apiHelper.createContacto(contactoData);
    createdIds.push(created.id);

    // GIVEN — intercept network BEFORE navigation; track PUT calls (network-first)
    let putCallCount = 0;
    await page.route('**/api/v1/contactos/**', (route) => {
      if (route.request().method() === 'PUT') {
        putCallCount++;
      }
      route.continue();
    });
    await page.route('**/api/v1/contactos', (route) => route.continue());

    await contactosPage.goto();

    // WHEN — user selects the contact and opens the edit form
    await contactosPage.seleccionarContacto(contactoData.nombre);
    await expect(contactosPage.detailPanel).toBeVisible();
    await page.getByTestId('btn-editar').click();
    await expect(page.getByTestId('contacto-form-dialog')).toBeVisible();

    // AND — user modifies the Nombre field
    const updatedNombre = 'Contacto Actualizado E2E-CT-19';
    await page.getByTestId('input-nombre').fill(updatedNombre);

    // AND — user clicks "Guardar"
    await page.getByTestId('btn-guardar').click();

    // THEN — dialog closes automatically
    await expect(page.getByTestId('contacto-form-dialog')).toBeHidden();

    // AND — exactly one PUT request was fired to the backend
    expect(putCallCount).toBe(1);

    // AND — updated contact name is visible in the detail panel WITHOUT page reload
    await expect(contactosPage.detailPanel).toContainText(updatedNombre);

    // AND — updated contact name is visible in the list WITHOUT page reload
    await expect(
      contactosPage.contactoRows.filter({ hasText: updatedNombre })
    ).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // E2E-CT-20 (P0 · AC3 — Risk R3)
  // Given the user has the edit form open
  // When the user clears a required field and clicks "Guardar"
  // Then the Zod schema validation runs on submit:
  //   an inline error message appears under the empty field (FR16),
  //   the form does NOT send any PUT request to the backend,
  //   and the dialog remains open
  // -------------------------------------------------------------------------
  test('E2E-CT-20 — limpiar un campo requerido y guardar muestra error inline; no se envía petición PUT', async ({ page }) => {
    // GIVEN — a contact exists in the system
    const contactoData = buildContacto({ nombre: 'Contacto Validacion E2E-CT-20' });
    const created = await apiHelper.createContacto(contactoData);
    createdIds.push(created.id);

    // GIVEN — intercept network BEFORE navigation; abort if PUT fires (network-first)
    let putFired = false;
    await page.route('**/api/v1/contactos/**', (route) => {
      if (route.request().method() === 'PUT') {
        putFired = true;
        route.abort();
      } else {
        route.continue();
      }
    });
    await page.route('**/api/v1/contactos', (route) => route.continue());

    await contactosPage.goto();

    // WHEN — user selects the contact and opens the edit form
    await contactosPage.seleccionarContacto(contactoData.nombre);
    await expect(contactosPage.detailPanel).toBeVisible();
    await page.getByTestId('btn-editar').click();
    await expect(page.getByTestId('contacto-form-dialog')).toBeVisible();

    // AND — user clears the required Nombre field
    await page.getByTestId('input-nombre').clear();

    // AND — user clicks "Guardar"
    await page.getByTestId('btn-guardar').click();

    // THEN — dialog remains open (form was NOT submitted)
    await expect(page.getByTestId('contacto-form-dialog')).toBeVisible();

    // AND — inline validation error appears for the empty Nombre field
    await expect(
      page.getByText(/nombre es requerido|el nombre/i).first()
    ).toBeVisible();

    // AND — no PUT request was fired (frontend validation blocked — R3)
    expect(putFired).toBe(false);
  });

  // -------------------------------------------------------------------------
  // E2E-CT-21 (P1 · AC2)
  // Given the user has successfully saved changes to a contact
  // When the PUT /api/v1/contactos/:id returns 200
  // Then a toast notification "Contacto actualizado correctamente" appears
  // -------------------------------------------------------------------------
  test('E2E-CT-21 — toast "Contacto actualizado correctamente" aparece tras edición exitosa', async ({ page }) => {
    // GIVEN — a contact exists in the system
    const contactoData = buildContacto({ nombre: 'Contacto Toast E2E-CT-21' });
    const created = await apiHelper.createContacto(contactoData);
    createdIds.push(created.id);

    // GIVEN — intercept network BEFORE navigation (network-first pattern)
    await page.route('**/api/v1/contactos**', (route) => route.continue());

    await contactosPage.goto();

    // WHEN — user selects the contact, opens the edit form, modifies a field, and saves
    await contactosPage.seleccionarContacto(contactoData.nombre);
    await expect(contactosPage.detailPanel).toBeVisible();
    await page.getByTestId('btn-editar').click();
    await expect(page.getByTestId('contacto-form-dialog')).toBeVisible();

    const updatedNombre = 'Contacto Toast Actualizado E2E-CT-21';
    await page.getByTestId('input-nombre').fill(updatedNombre);
    await page.getByTestId('btn-guardar').click();

    // THEN — success toast with the Spanish message is visible
    await expect(
      page.getByText(/contacto actualizado correctamente/i)
    ).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // E2E-CT-22 (P1 · AC4 — Risk R6)
  // Given the user has the edit form open and has modified a field
  // When the user clicks "Cancelar"
  // Then the dialog closes WITHOUT firing a PUT request to the backend,
  //   AND the original contact data remains unchanged in the detail panel and list
  // -------------------------------------------------------------------------
  test('E2E-CT-22 — "Cancelar" cierra el formulario sin hacer PUT; los datos originales se conservan', async ({ page }) => {
    // GIVEN — a contact exists in the system
    const contactoData = buildContacto({ nombre: 'Contacto Cancelar E2E-CT-22' });
    const created = await apiHelper.createContacto(contactoData);
    createdIds.push(created.id);

    // GIVEN — intercept network BEFORE navigation; track PUT calls (network-first)
    let putFired = false;
    await page.route('**/api/v1/contactos/**', (route) => {
      if (route.request().method() === 'PUT') {
        putFired = true;
      }
      route.continue();
    });
    await page.route('**/api/v1/contactos', (route) => route.continue());

    await contactosPage.goto();

    // WHEN — user selects the contact and opens the edit form
    await contactosPage.seleccionarContacto(contactoData.nombre);
    await expect(contactosPage.detailPanel).toBeVisible();
    await page.getByTestId('btn-editar').click();
    await expect(page.getByTestId('contacto-form-dialog')).toBeVisible();

    // AND — user modifies the Nombre field (but does NOT save)
    await page.getByTestId('input-nombre').fill('Nombre Modificado Sin Guardar CT-22');

    // AND — user clicks "Cancelar" (risk R6: must NOT fire PUT)
    await page.getByTestId('btn-cancelar').click();

    // THEN — dialog closes
    await expect(page.getByTestId('contacto-form-dialog')).toBeHidden();

    // AND — no PUT request was fired (R6 validated)
    expect(putFired).toBe(false);

    // AND — the original contact name is still visible in the detail panel
    await expect(contactosPage.detailPanel).toContainText(contactoData.nombre);

    // AND — the original contact name is still visible in the list
    await expect(
      contactosPage.contactoRows.filter({ hasText: contactoData.nombre })
    ).toBeVisible();
  });
});

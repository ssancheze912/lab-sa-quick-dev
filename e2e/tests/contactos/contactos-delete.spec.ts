import { test, expect } from '@playwright/test';
import { ContactosPage } from '../../pages/contactos.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildContacto } from '../../helpers/data.helper';

/**
 * ATDD — Story 3.5: Delete Contact
 *
 * Tests are in RED phase — they define the expected behaviour BEFORE implementation.
 * Make these tests GREEN by:
 *   - Adding "Eliminar" button (data-testid="btn-eliminar") to ContactoDetailPanel
 *   - Creating DeleteContactoDialog component with Confirmar / Cancelar buttons
 *   - Creating useDeleteContacto mutation hook
 *   - Wiring DELETE /api/v1/contactos/:id endpoint in the backend
 *   - Invalidating ['contactos'] query cache on success (FR27, R2)
 *
 * Coverage:
 *   E2E-CT-23  P0  AC1  — Clicking "Eliminar" shows confirmation dialog; no DELETE fired yet
 *   E2E-CT-24  P0  AC2  — Confirming deletion removes contact from list immediately (no reload — FR27); URL → /contactos
 *   E2E-CT-25  P1  AC2  — Toast "Contacto eliminado correctamente" appears after confirmation
 *   E2E-CT-26  P1  AC3  — Clicking "Cancelar" closes dialog without firing DELETE; contact remains in list
 */

// ---------------------------------------------------------------------------
// E2E Tests
// ---------------------------------------------------------------------------

test.describe('Story 3.5 — Eliminar contacto (E2E)', () => {
  let contactosPage: ContactosPage;
  let apiHelper: ApiHelper;
  const createdContactoIds: string[] = [];

  test.beforeEach(async ({ page, request }) => {
    contactosPage = new ContactosPage(page);
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdContactoIds) {
      await apiHelper.deleteContacto(id).catch(() => null);
    }
    createdContactoIds.length = 0;
  });

  // -------------------------------------------------------------------------
  // E2E-CT-23 (P0 · AC1)
  // Given the user is viewing a contact's detail
  // When the user clicks "Eliminar"
  // Then a confirmation dialog appears with "¿Eliminar este contacto?"
  //   AND two buttons: "Confirmar" and "Cancelar"
  //   AND no DELETE request has been fired
  // -------------------------------------------------------------------------
  test('E2E-CT-23 — "Eliminar" abre el diálogo de confirmación con "Confirmar" y "Cancelar"; no se dispara DELETE', async ({ page }) => {
    // GIVEN — a contact exists in the system
    const contactoData = buildContacto({ nombre: 'Contacto Eliminar E2E-CT-23' });
    const created = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(created.id);

    // GIVEN — intercept network BEFORE navigation; track DELETE calls (network-first pattern)
    let deleteFired = false;
    await page.route('**/api/v1/contactos/**', (route) => {
      if (route.request().method() === 'DELETE') {
        deleteFired = true;
      }
      route.continue();
    });
    await page.route('**/api/v1/contactos', (route) => route.continue());

    await contactosPage.goto();

    // WHEN — user selects the contact from the list to view its detail
    await contactosPage.seleccionarContacto(contactoData.nombre);

    // AND — the detail panel is visible
    await expect(contactosPage.detailPanel).toBeVisible();

    // AND — user clicks "Eliminar" in the detail panel
    await page.getByTestId('btn-eliminar').click();

    // THEN — confirmation dialog opens
    await expect(page.getByTestId('delete-contacto-dialog')).toBeVisible();

    // AND — dialog contains the confirmation question
    await expect(page.getByTestId('delete-contacto-dialog')).toContainText(/eliminar este contacto/i);

    // AND — "Confirmar" button is visible
    await expect(page.getByTestId('btn-confirmar-eliminar')).toBeVisible();

    // AND — "Cancelar" button is visible
    await expect(page.getByTestId('btn-cancelar-eliminar')).toBeVisible();

    // AND — no DELETE request was fired before confirmation
    expect(deleteFired).toBe(false);
  });

  // -------------------------------------------------------------------------
  // E2E-CT-24 (P0 · AC2)
  // Given the user has the confirmation dialog open
  // When the user clicks "Confirmar"
  // Then the DELETE /api/v1/contactos/:id request is fired exactly once,
  //   the contact is removed from the list immediately WITHOUT a page reload (FR27),
  //   and the URL changes to /contactos
  // -------------------------------------------------------------------------
  test('E2E-CT-24 — confirmar eliminación quita el contacto de la lista inmediatamente; URL cambia a /contactos', async ({ page }) => {
    // GIVEN — a contact exists in the system
    const contactoData = buildContacto({ nombre: 'Contacto Confirmar E2E-CT-24' });
    const created = await apiHelper.createContacto(contactoData);
    // NOTE: No cleanup push — the test itself deletes the contact

    // GIVEN — intercept network BEFORE navigation; track DELETE calls (network-first)
    let deleteCallCount = 0;
    await page.route('**/api/v1/contactos/**', (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCallCount++;
      }
      route.continue();
    });
    await page.route('**/api/v1/contactos', (route) => route.continue());

    await contactosPage.goto();

    // WHEN — user selects the contact and opens the confirmation dialog
    await contactosPage.seleccionarContacto(contactoData.nombre);
    await expect(contactosPage.detailPanel).toBeVisible();
    await page.getByTestId('btn-eliminar').click();
    await expect(page.getByTestId('delete-contacto-dialog')).toBeVisible();

    // AND — user clicks "Confirmar"
    await page.getByTestId('btn-confirmar-eliminar').click();

    // THEN — confirmation dialog closes automatically
    await expect(page.getByTestId('delete-contacto-dialog')).toBeHidden();

    // AND — exactly one DELETE request was fired to the backend
    expect(deleteCallCount).toBe(1);

    // AND — deleted contact is no longer visible in the list WITHOUT a page reload
    await expect(
      contactosPage.contactoRows.filter({ hasText: contactoData.nombre })
    ).toHaveCount(0);

    // AND — URL has returned to /contactos (not a detail URL)
    await expect(page).toHaveURL(/\/contactos$/);
  });

  // -------------------------------------------------------------------------
  // E2E-CT-25 (P1 · AC2)
  // Given the user confirms the deletion of a contact
  // When the DELETE /api/v1/contactos/:id returns 204
  // Then a toast notification "Contacto eliminado correctamente" appears
  // -------------------------------------------------------------------------
  test('E2E-CT-25 — toast "Contacto eliminado correctamente" aparece tras eliminación exitosa', async ({ page }) => {
    // GIVEN — a contact exists in the system
    const contactoData = buildContacto({ nombre: 'Contacto Toast E2E-CT-25' });
    const created = await apiHelper.createContacto(contactoData);
    // NOTE: No cleanup push — the test itself deletes the contact

    // GIVEN — intercept network BEFORE navigation (network-first pattern)
    await page.route('**/api/v1/contactos**', (route) => route.continue());

    await contactosPage.goto();

    // WHEN — user selects the contact, opens the confirmation dialog, and confirms
    await contactosPage.seleccionarContacto(contactoData.nombre);
    await expect(contactosPage.detailPanel).toBeVisible();
    await page.getByTestId('btn-eliminar').click();
    await expect(page.getByTestId('delete-contacto-dialog')).toBeVisible();
    await page.getByTestId('btn-confirmar-eliminar').click();

    // THEN — success toast with the Spanish message is visible
    await expect(
      page.getByText(/contacto eliminado correctamente/i)
    ).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // E2E-CT-26 (P1 · AC3)
  // Given the user has the confirmation dialog open
  // When the user clicks "Cancelar"
  // Then the dialog closes WITHOUT firing any DELETE request,
  //   AND the contact record remains visible in the list unchanged
  // -------------------------------------------------------------------------
  test('E2E-CT-26 — "Cancelar" cierra el diálogo sin hacer DELETE; el contacto permanece en la lista', async ({ page }) => {
    // GIVEN — a contact exists in the system
    const contactoData = buildContacto({ nombre: 'Contacto Cancelar E2E-CT-26' });
    const created = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(created.id);

    // GIVEN — intercept network BEFORE navigation; track DELETE calls (network-first)
    let deleteFired = false;
    await page.route('**/api/v1/contactos/**', (route) => {
      if (route.request().method() === 'DELETE') {
        deleteFired = true;
      }
      route.continue();
    });
    await page.route('**/api/v1/contactos', (route) => route.continue());

    await contactosPage.goto();

    // WHEN — user selects the contact and opens the confirmation dialog
    await contactosPage.seleccionarContacto(contactoData.nombre);
    await expect(contactosPage.detailPanel).toBeVisible();
    await page.getByTestId('btn-eliminar').click();
    await expect(page.getByTestId('delete-contacto-dialog')).toBeVisible();

    // AND — user clicks "Cancelar"
    await page.getByTestId('btn-cancelar-eliminar').click();

    // THEN — dialog closes
    await expect(page.getByTestId('delete-contacto-dialog')).toBeHidden();

    // AND — no DELETE request was fired (R6: cancel must not invoke mutation)
    expect(deleteFired).toBe(false);

    // AND — the contact row is still visible in the list (record unchanged)
    await expect(
      contactosPage.contactoRows.filter({ hasText: contactoData.nombre })
    ).toBeVisible();

    // AND — detail panel still shows the contact (it was not removed)
    await expect(contactosPage.detailPanel).toContainText(contactoData.nombre);
  });
});

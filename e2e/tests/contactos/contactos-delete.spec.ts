import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper } from '../../helpers/api.helper';
import { buildContacto } from '../../helpers/data.helper';

/**
 * ATDD E2E tests — Story 3.5: Delete Contact (RED phase)
 *
 * Tests fail until:
 *   - DELETE /api/v1/contactos/:id endpoint is implemented (backend)
 *   - ContactoDetailView: "Eliminar" button (data-testid="btn-eliminar") wired
 *   - AlertDialog confirmation with "¿Eliminar este contacto?", btn-confirm-delete, btn-cancel-delete
 *   - useDeleteContacto mutation: invalidates ['contactos'] and removes ['contactos', id] (FR27)
 *   - onContactoDeleted prop navigates to /contactos (empty right panel) after deletion (AC #2)
 *   - Toast "Contacto eliminado correctamente" on 204 response (AC #2, R-010)
 *   - No DELETE call when "Cancelar" is clicked (AC #3)
 *
 * Test IDs:
 *   TC-E3-3-5-E2E-1 (P0) — Full delete journey: contact removed from list + navigation to /contactos
 */

test.describe('Story 3.5 — Delete Contact (E2E)', () => {
  let apiHelper: ApiHelper;
  const createdIds: string[] = [];

  test.beforeEach(async ({ request }) => {
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteContacto(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  // ─────────────────────────────────────────────────────────────────────────
  // AC #1 — Confirmation dialog appears when "Eliminar" button is clicked
  // ─────────────────────────────────────────────────────────────────────────

  test('should show confirmation dialog with "¿Eliminar este contacto?" when "Eliminar" button is clicked (AC #1)', async ({ page }) => {
    // GIVEN: A contact exists in the system
    const contactoData = buildContacto({ nombre: 'Contacto Dialog E2E' });
    const created = await apiHelper.createContacto(contactoData);
    createdIds.push(created.id);

    // GIVEN: CRITICAL — Intercept DELETE BEFORE navigation (network-first pattern)
    let deleteCalled = false;
    await page.route(`**/api/v1/contactos/${created.id}`, (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true;
        route.continue();
      } else {
        route.continue();
      }
    });

    // GIVEN: User navigates to the contact's detail view
    await page.goto(`/contactos/${created.id}`);
    await page.waitForURL(`**/contactos/${created.id}`);

    // AND: "Eliminar" button is visible in the data-loaded state (not during loading)
    await expect(page.getByTestId('btn-eliminar')).toBeVisible({ timeout: 5000 });

    // WHEN: User clicks "Eliminar"
    await page.getByTestId('btn-eliminar').click();

    // THEN: Confirmation dialog appears with exact title text (AC #1)
    await expect(page.getByText('¿Eliminar este contacto?')).toBeVisible({ timeout: 3000 });

    // AND: "Confirmar" button is visible in the dialog (AC #1)
    await expect(page.getByTestId('btn-confirm-delete')).toBeVisible();

    // AND: "Cancelar" button is visible in the dialog (AC #1)
    await expect(page.getByTestId('btn-cancel-delete')).toBeVisible();

    // AND: No DELETE was triggered by merely opening the dialog
    expect(deleteCalled).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // AC #3 — Clicking "Cancelar" closes dialog, no DELETE called
  // ─────────────────────────────────────────────────────────────────────────

  test('should close dialog and make no DELETE API call when "Cancelar" is clicked (AC #3)', async ({ page }) => {
    // GIVEN: A contact exists
    const contactoData = buildContacto({ nombre: 'Contacto Cancel E2E' });
    const created = await apiHelper.createContacto(contactoData);
    createdIds.push(created.id);

    // GIVEN: CRITICAL — Intercept DELETE BEFORE navigation to assert it is never called
    let deleteCalled = false;
    await page.route(`**/api/v1/contactos/${created.id}`, (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true;
        route.continue();
      } else {
        route.continue();
      }
    });

    // GIVEN: User is at the contact detail view
    await page.goto(`/contactos/${created.id}`);
    await page.waitForURL(`**/contactos/${created.id}`);
    await expect(page.getByTestId('btn-eliminar')).toBeVisible({ timeout: 5000 });

    // WHEN: User opens confirmation dialog
    await page.getByTestId('btn-eliminar').click();
    await expect(page.getByTestId('btn-cancel-delete')).toBeVisible({ timeout: 3000 });

    // WHEN: User clicks "Cancelar"
    await page.getByTestId('btn-cancel-delete').click();

    // THEN: Dialog closes (confirmation dialog is no longer visible)
    await expect(page.getByText('¿Eliminar este contacto?')).not.toBeVisible({ timeout: 3000 });

    // AND: DELETE API was NEVER called (AC #3 — no mutation on cancel)
    expect(deleteCalled).toBe(false);

    // AND: Contact data is still shown in the detail panel (record unchanged)
    await expect(page.getByText(contactoData.nombre)).toBeVisible({ timeout: 3000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E3-3-5-E2E-1 (P0) — Full delete flow: contact removed from left panel,
  // right panel returns to empty state (FR27, R-002, R-003)
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E3-3-5-E2E-1: should remove contact from left panel and navigate to /contactos after deletion (FR27, AC #2)', async ({ page }) => {
    // GIVEN: A contact exists in the system
    const contactoData = buildContacto({ nombre: 'Contacto Eliminar Flujo Completo' });
    const created = await apiHelper.createContacto(contactoData);
    // DO NOT push to createdIds — contact will be deleted by the test itself

    // GIVEN: CRITICAL — Intercept routes BEFORE navigation (network-first pattern)
    // The real backend DELETE endpoint is used for this P0 full-stack test.

    // GIVEN: User navigates to the contact's detail view
    await page.goto(`/contactos/${created.id}`);
    await page.waitForURL(`**/contactos/${created.id}`);

    // AND: "Eliminar" button is visible in the data-loaded state
    await expect(page.getByTestId('btn-eliminar')).toBeVisible({ timeout: 5000 });

    // AND: Contact name is visible in the left panel list (present before deletion)
    await expect(
      page.getByTestId('contacto-list-item').filter({ hasText: contactoData.nombre })
    ).toBeVisible({ timeout: 5000 });

    // WHEN: User clicks "Eliminar" to open the confirmation dialog
    await page.getByTestId('btn-eliminar').click();

    // AND: Dialog is visible with the title
    await expect(page.getByText('¿Eliminar este contacto?')).toBeVisible({ timeout: 3000 });

    // WHEN: User clicks "Confirmar" to proceed with deletion
    await page.getByTestId('btn-confirm-delete').click();

    // THEN: Toast "Contacto eliminado correctamente" appears (AC #2, R-010 — exact Spanish text)
    await expect(page.getByText('Contacto eliminado correctamente')).toBeVisible({ timeout: 5000 });

    // AND: Contact is removed from the LEFT PANEL list immediately (FR27 — no page reload)
    await expect(
      page.getByTestId('contacto-list-item').filter({ hasText: contactoData.nombre })
    ).not.toBeVisible({ timeout: 5000 });

    // AND: URL returns to /contactos (no contactoId in URL — AC #2, onContactoDeleted → navigate('/contactos'))
    await expect(page).toHaveURL(/\/contactos$/, { timeout: 3000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // "Eliminar" button visibility — only in data-loaded state (AC #1)
  // ─────────────────────────────────────────────────────────────────────────

  test('should show "Eliminar" button only when contact detail is in data-loaded state (not in empty/placeholder state)', async ({ page }) => {
    // GIVEN: A contact exists
    const contactoData = buildContacto({ nombre: 'Contacto Btn Visibility' });
    const created = await apiHelper.createContacto(contactoData);
    createdIds.push(created.id);

    // GIVEN: CRITICAL — Intercept routes BEFORE navigation (network-first)
    // Navigate to /contactos (no contact selected — btn-eliminar must NOT be visible)
    await page.goto('/contactos');
    await page.waitForURL('**/contactos');

    // THEN: btn-eliminar is NOT visible in the empty/placeholder state
    await expect(page.getByTestId('btn-eliminar')).not.toBeVisible();

    // WHEN: User navigates to contact detail
    await page.goto(`/contactos/${created.id}`);
    await page.waitForURL(`**/contactos/${created.id}`);

    // THEN: btn-eliminar IS visible in the data-loaded state
    await expect(page.getByTestId('btn-eliminar')).toBeVisible({ timeout: 5000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Regression guard: "Editar" button must remain functional after delete flow
  // Story 3.4 regression — Editar must not break after Eliminar is added
  // ─────────────────────────────────────────────────────────────────────────

  test('should keep "Editar" button functional after the delete dialog is cancelled (regression guard for Story 3.4)', async ({ page }) => {
    // GIVEN: A contact exists
    const contactoData = buildContacto({ nombre: 'Contacto Editar Regression' });
    const created = await apiHelper.createContacto(contactoData);
    createdIds.push(created.id);

    // GIVEN: CRITICAL — Intercept DELETE BEFORE navigation
    await page.route(`**/api/v1/contactos/${created.id}`, (route) => {
      if (route.request().method() === 'DELETE') {
        // Fulfill immediately so the test doesn't depend on real backend for delete assertion
        route.fulfill({ status: 204, body: '' });
      } else {
        route.continue();
      }
    });

    await page.goto(`/contactos/${created.id}`);
    await page.waitForURL(`**/contactos/${created.id}`);
    await expect(page.getByTestId('btn-eliminar')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('btn-editar')).toBeVisible({ timeout: 5000 });

    // WHEN: User opens the delete dialog
    await page.getByTestId('btn-eliminar').click();
    await expect(page.getByTestId('btn-cancel-delete')).toBeVisible({ timeout: 3000 });

    // WHEN: User cancels
    await page.getByTestId('btn-cancel-delete').click();
    await expect(page.getByText('¿Eliminar este contacto?')).not.toBeVisible({ timeout: 3000 });

    // THEN: "Editar" button is still visible and clickable (no regression from Story 3.4)
    await expect(page.getByTestId('btn-editar')).toBeVisible({ timeout: 3000 });
    await page.getByTestId('btn-editar').click();

    // AND: ContactoForm opens correctly (edit flow not broken)
    await expect(page.getByTestId('contacto-form')).toBeVisible({ timeout: 3000 });
  });
});

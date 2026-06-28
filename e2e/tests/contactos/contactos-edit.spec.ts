import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper } from '../../helpers/api.helper';
import { buildContacto } from '../../helpers/data.helper';

/**
 * ATDD E2E tests — Story 3.4: Edit Contact (RED phase)
 *
 * Tests fail until:
 *   - PUT /api/v1/contactos/:id endpoint is implemented (backend)
 *   - ContactoForm extended with contactoId + defaultValues edit-mode props
 *   - ContactoDetailView: "Editar" button (data-testid="btn-editar") wired with isEditFormOpen state
 *   - useUpdateContacto mutation invalidates ['contactos'] queries (FR27, R-002)
 *   - Toast "Contacto actualizado correctamente" is displayed on success (R-010)
 *   - Inline validation errors appear on empty field submission in edit mode
 *   - Cancel in edit mode keeps original data unchanged (AC #4, R-008)
 *
 * Test ID:
 *   TC-E3-3-4-E2E-1 (P1) — Edit contact end-to-end → updated Nombre appears in list and
 *                           detail view without page reload (FR27, R-002)
 */

test.describe('Story 3.4 — Edit Contact (E2E)', () => {
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
  // TC-E3-3-4-E2E-1 (P1) — Edit contact end-to-end → updated Nombre in left panel
  // and detail view without page reload (FR27, R-002)
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E3-3-4-E2E-1: should show updated Nombre in list and detail view immediately after edit without page reload', async ({ page }) => {
    // GIVEN: A contact exists in the system
    const originalData = buildContacto({ nombre: 'Contacto Original E2E' });
    const created = await apiHelper.createContacto(originalData);
    createdIds.push(created.id);

    // GIVEN: CRITICAL — Intercept PUT BEFORE navigation (network-first pattern)
    // We use the real backend for this P1 full-stack test.
    // The test verifies the full stack: form → PUT → invalidateQueries → list refetch (FR27, R-002).

    // GIVEN: User navigates to the contact's detail view
    await page.goto(`/contactos/${created.id}`);
    await page.waitForURL(`**/contactos/${created.id}`);

    // AND: "Editar" button is visible in the detail panel (data-loaded state — AC #1)
    await expect(page.getByTestId('btn-editar')).toBeVisible({ timeout: 5000 });

    // WHEN: User clicks "Editar"
    await page.getByTestId('btn-editar').click();

    // THEN: ContactoForm opens as an accessible modal overlay (role="dialog")
    await expect(page.getByTestId('contacto-form')).toBeVisible({ timeout: 3000 });

    // AND: Form is pre-filled with the current contact values (AC #1, FR14)
    await expect(page.getByTestId('input-nombre')).toHaveValue(originalData.nombre);
    await expect(page.getByTestId('input-cargo')).toHaveValue(originalData.cargo ?? '');
    await expect(page.getByTestId('input-telefono')).toHaveValue(originalData.telefono ?? '');
    await expect(page.getByTestId('input-email')).toHaveValue(originalData.email);

    // WHEN: User modifies the Nombre field
    const newNombre = 'Contacto Editado E2E';
    await page.getByTestId('input-nombre').clear();
    await page.getByTestId('input-nombre').fill(newNombre);

    // WHEN: User clicks "Guardar cambios"
    await page.getByTestId('btn-submit').click();

    // THEN: Success toast "Contacto actualizado correctamente" appears (AC #2, R-010)
    await expect(page.getByText('Contacto actualizado correctamente')).toBeVisible({ timeout: 5000 });

    // AND: Updated Nombre appears in the LEFT PANEL list immediately without page reload (FR27, R-002)
    await expect(
      page.getByTestId('contacto-list-item').filter({ hasText: newNombre })
    ).toBeVisible({ timeout: 5000 });

    // AND: Updated Nombre appears in the RIGHT PANEL detail view (FR27)
    await expect(page.getByTestId('contacto-detail-view').getByText(newNombre)).toBeVisible({ timeout: 5000 });

    // AND: Original Nombre is no longer shown in the list (replaced by updated value)
    await expect(
      page.getByTestId('contacto-list-item').filter({ hasText: originalData.nombre })
    ).not.toBeVisible({ timeout: 3000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // "Editar" button visibility — only in data-loaded state (AC #1)
  // ─────────────────────────────────────────────────────────────────────────

  test('should show "Editar" button only when contact detail is loaded (not during loading or no-selection state)', async ({ page }) => {
    // GIVEN: A contact exists
    const data = buildContacto({ nombre: 'Contacto Para Editar Btn' });
    const created = await apiHelper.createContacto(data);
    createdIds.push(created.id);

    // GIVEN: CRITICAL — Navigate to /contactos (no contact selected — btn-editar must NOT be visible)
    await page.goto('/contactos');
    await page.waitForURL('**/contactos');

    // THEN: btn-editar is NOT visible when no contact is selected (empty/placeholder state)
    await expect(page.getByTestId('btn-editar')).not.toBeVisible();

    // WHEN: User navigates to contact detail
    await page.goto(`/contactos/${created.id}`);
    await page.waitForURL(`**/contactos/${created.id}`);

    // THEN: btn-editar IS visible in the data-loaded state
    await expect(page.getByTestId('btn-editar')).toBeVisible({ timeout: 5000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Cancel in edit mode — original data remains unchanged (AC #4, R-008)
  // ─────────────────────────────────────────────────────────────────────────

  test('should keep original contact data unchanged when "Cancelar" is clicked in edit form', async ({ page }) => {
    // GIVEN: A contact exists
    const originalData = buildContacto({ nombre: 'Contacto Sin Cambios E2E' });
    const created = await apiHelper.createContacto(originalData);
    createdIds.push(created.id);

    // GIVEN: CRITICAL — Intercept PUT BEFORE navigation to assert it is never called
    let putCalled = false;
    await page.route(`**/api/v1/contactos/${created.id}`, (route) => {
      if (route.request().method() === 'PUT') {
        putCalled = true;
        route.continue();
      } else {
        route.continue();
      }
    });

    // GIVEN: User is at the contact detail view
    await page.goto(`/contactos/${created.id}`);
    await page.waitForURL(`**/contactos/${created.id}`);
    await expect(page.getByTestId('btn-editar')).toBeVisible({ timeout: 5000 });

    // WHEN: User opens the edit form
    await page.getByTestId('btn-editar').click();
    await expect(page.getByTestId('contacto-form')).toBeVisible();

    // WHEN: User modifies Nombre
    await page.getByTestId('input-nombre').clear();
    await page.getByTestId('input-nombre').fill('Nombre Que No Se Guardará');

    // WHEN: User clicks "Cancelar"
    await page.getByTestId('btn-cancel').click();

    // THEN: Form closes
    await expect(page.getByTestId('contacto-form')).not.toBeVisible({ timeout: 3000 });

    // AND: PUT to backend was NEVER called (AC #4 — no API call on cancel, R-008)
    expect(putCalled).toBe(false);

    // AND: Original Nombre still shown in detail view (original data unchanged)
    await expect(page.getByTestId('contacto-detail-view').getByText(originalData.nombre)).toBeVisible({ timeout: 3000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Inline validation in edit mode — empty submission shows errors (AC #3)
  // ─────────────────────────────────────────────────────────────────────────

  test('should show inline validation errors when a required field is cleared and submitted in edit mode', async ({ page }) => {
    // GIVEN: A contact exists
    const data = buildContacto({ nombre: 'Contacto Para Validar E2E' });
    const created = await apiHelper.createContacto(data);
    createdIds.push(created.id);

    // GIVEN: CRITICAL — Intercept PUT BEFORE navigation to assert it is never called
    let putCalled = false;
    await page.route(`**/api/v1/contactos/${created.id}`, (route) => {
      if (route.request().method() === 'PUT') {
        putCalled = true;
        route.continue();
      } else {
        route.continue();
      }
    });

    // GIVEN: User navigates to contact detail and opens edit form
    await page.goto(`/contactos/${created.id}`);
    await page.waitForURL(`**/contactos/${created.id}`);
    await expect(page.getByTestId('btn-editar')).toBeVisible({ timeout: 5000 });
    await page.getByTestId('btn-editar').click();
    await expect(page.getByTestId('contacto-form')).toBeVisible();

    // WHEN: User clears the Nombre field (required)
    await page.getByTestId('input-nombre').clear();

    // WHEN: User submits the form
    await page.getByTestId('btn-submit').click();

    // THEN: Inline validation error appears for the empty Nombre field (FR16, Zod client-side)
    await expect(page.locator('[role="alert"]').first()).toBeVisible({ timeout: 3000 });

    // AND: PUT to backend was NEVER called (Zod client-side guard prevents submission)
    expect(putCalled).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 409 conflict in edit mode — inline error on Email field (AC #2 edge case)
  // ─────────────────────────────────────────────────────────────────────────

  test('should show "El email ya está registrado" inline error when backend returns 409 on edit', async ({ page }) => {
    // GIVEN: Contact A exists
    const contactoA = buildContacto({ nombre: 'Contacto A Para Conflicto' });
    const createdA = await apiHelper.createContacto(contactoA);
    createdIds.push(createdA.id);

    // GIVEN: Contact B exists with a different email
    const contactoB = buildContacto({ nombre: 'Contacto B Con Email Distinto' });
    const createdB = await apiHelper.createContacto(contactoB);
    createdIds.push(createdB.id);

    // GIVEN: CRITICAL — Intercept PUT BEFORE navigation, returning 409 for email conflict
    await page.route(`**/api/v1/contactos/${createdA.id}`, (route) => {
      if (route.request().method() === 'PUT') {
        route.fulfill({
          status: 409,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            type: 'https://tools.ietf.org/html/rfc7807',
            title: 'Conflicto de datos',
            status: 409,
            detail: 'El email ya está registrado',
          }),
        });
      } else {
        route.continue();
      }
    });

    // GIVEN: User navigates to Contact A's detail and opens edit form
    await page.goto(`/contactos/${createdA.id}`);
    await page.waitForURL(`**/contactos/${createdA.id}`);
    await expect(page.getByTestId('btn-editar')).toBeVisible({ timeout: 5000 });
    await page.getByTestId('btn-editar').click();
    await expect(page.getByTestId('contacto-form')).toBeVisible();

    // WHEN: User changes Email to match Contact B's email and submits
    await page.getByTestId('input-email').clear();
    await page.getByTestId('input-email').fill(contactoB.email);
    await page.getByTestId('btn-submit').click();

    // THEN: Inline error "El email ya está registrado" appears on Email field (NFR6)
    await expect(page.getByText('El email ya está registrado')).toBeVisible({ timeout: 5000 });
  });
});

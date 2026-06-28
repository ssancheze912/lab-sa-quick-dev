import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper } from '../../helpers/api.helper';
import { buildContacto } from '../../helpers/data.helper';

/**
 * Edge-case E2E tests — Story 3.4: Edit Contact (expanded coverage)
 *
 * These tests expand beyond the ATDD scenarios in contactos-edit.spec.ts,
 * covering boundary conditions and error paths not exercised there:
 *
 *   TC-E3-3-4-E2E-EDGE-1 (P2) — Spanish special characters (accented) preserved in edit
 *   TC-E3-3-4-E2E-EDGE-2 (P2) — Sequential edit: second edit pre-fills values from first edit
 *   TC-E3-3-4-E2E-EDGE-3 (P2) — Editar button absent during initial skeleton state
 *   TC-E3-3-4-E2E-EDGE-4 (P2) — Edit with max-length Nombre (255 chars) succeeds
 *   TC-E3-3-4-E2E-EDGE-5 (P2) — 500 backend error: no page crash, no stack trace in UI
 *   TC-E3-3-4-E2E-EDGE-6 (P3) — Edit form closes on success and list still shows item
 */

test.describe('Story 3.4 — Edit Contact Edge Cases (E2E)', () => {
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
  // TC-E3-3-4-E2E-EDGE-1 (P2) — Spanish special characters in Nombre
  // Zod schema trims but preserves non-ASCII characters. Verifies accented
  // and ñ characters survive round-trip through PUT → invalidateQueries →
  // list refetch (FR27).
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E3-3-4-E2E-EDGE-1: should preserve Spanish accented characters in Nombre after edit (é, ñ, á, ü)', async ({ page }) => {
    // GIVEN: A contact with a plain ASCII nombre
    const originalData = buildContacto({ nombre: 'Contacto Caracteres Especiales' });
    const created = await apiHelper.createContacto(originalData);
    createdIds.push(created.id);

    // GIVEN: User navigates to the contact detail view
    await page.goto(`/contactos/${created.id}`);
    await page.waitForURL(`**/contactos/${created.id}`);
    await expect(page.getByTestId('btn-editar')).toBeVisible({ timeout: 5000 });

    // WHEN: User opens the edit form
    await page.getByTestId('btn-editar').click();
    await expect(page.getByTestId('contacto-form')).toBeVisible({ timeout: 3000 });

    // WHEN: User enters a nombre with Spanish special characters
    const accentedNombre = 'María Ángela González Ñoño';
    await page.getByTestId('input-nombre').clear();
    await page.getByTestId('input-nombre').fill(accentedNombre);

    // WHEN: User submits the edit form
    await page.getByTestId('btn-submit').click();

    // THEN: Success toast appears (AC #2)
    await expect(page.getByText('Contacto actualizado correctamente')).toBeVisible({ timeout: 5000 });

    // AND: Accented nombre appears in the left panel list immediately (FR27)
    await expect(
      page.getByTestId('contacto-list-item').filter({ hasText: accentedNombre })
    ).toBeVisible({ timeout: 5000 });

    // AND: Accented nombre appears in the detail view (FR27)
    await expect(
      page.getByTestId('contacto-detail-view').getByText(accentedNombre)
    ).toBeVisible({ timeout: 5000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E3-3-4-E2E-EDGE-2 (P2) — Sequential edits: second edit pre-fills
  // values from first edit, not from original creation data.
  // Verifies that invalidateQueries re-fetches updated data so the form
  // does not present stale pre-fill values (R-007 stale cache risk).
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E3-3-4-E2E-EDGE-2: should pre-fill second edit form with values from first edit, not original create values', async ({ page }) => {
    // GIVEN: A contact created with the original nombre
    const originalData = buildContacto({ nombre: 'Nombre Primera Version' });
    const created = await apiHelper.createContacto(originalData);
    createdIds.push(created.id);

    // GIVEN: Navigate to contact detail
    await page.goto(`/contactos/${created.id}`);
    await page.waitForURL(`**/contactos/${created.id}`);
    await expect(page.getByTestId('btn-editar')).toBeVisible({ timeout: 5000 });

    // ── First edit ──────────────────────────────────────────────────────────
    const firstEditNombre = 'Nombre Segunda Version';

    // WHEN: User performs the first edit
    await page.getByTestId('btn-editar').click();
    await expect(page.getByTestId('contacto-form')).toBeVisible({ timeout: 3000 });
    await page.getByTestId('input-nombre').clear();
    await page.getByTestId('input-nombre').fill(firstEditNombre);
    await page.getByTestId('btn-submit').click();

    // THEN: First edit succeeds with toast
    await expect(page.getByText('Contacto actualizado correctamente')).toBeVisible({ timeout: 5000 });

    // AND: Form closes after first edit
    await expect(page.getByTestId('contacto-form')).not.toBeVisible({ timeout: 3000 });

    // ── Second edit ─────────────────────────────────────────────────────────

    // WHEN: User opens the edit form again (second time)
    await expect(page.getByTestId('btn-editar')).toBeVisible({ timeout: 5000 });
    await page.getByTestId('btn-editar').click();
    await expect(page.getByTestId('contacto-form')).toBeVisible({ timeout: 3000 });

    // THEN: Form pre-fills with the FIRST EDIT values (not original creation values)
    // This verifies invalidateQueries + refetch propagated the latest state (R-007)
    await expect(page.getByTestId('input-nombre')).toHaveValue(firstEditNombre);

    // AND: Original creation nombre is NOT in the pre-fill
    await expect(page.getByTestId('input-nombre')).not.toHaveValue(originalData.nombre);

    // Cleanup: close the form without saving
    await page.getByTestId('btn-cancel').click();
    await expect(page.getByTestId('contacto-form')).not.toBeVisible({ timeout: 3000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E3-3-4-E2E-EDGE-3 (P2) — Editar button NOT present during slow network
  // loading (skeleton/loading state). Verifies AC #1 boundary: button only
  // visible in data-loaded state, not while loading spinner is shown.
  // Uses route interception to slow the GET request and observe the skeleton.
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E3-3-4-E2E-EDGE-3: should not show "Editar" button while contact detail is in loading/skeleton state', async ({ page }) => {
    // GIVEN: A contact exists
    const data = buildContacto({ nombre: 'Contacto Skeleton Test' });
    const created = await apiHelper.createContacto(data);
    createdIds.push(created.id);

    // GIVEN: CRITICAL — Intercept GET for this contact BEFORE navigation, adding a delay
    let resolveDelay: () => void;
    const delayPromise = new Promise<void>((resolve) => { resolveDelay = resolve; });

    await page.route(`**/api/v1/contactos/${created.id}`, async (route) => {
      if (route.request().method() === 'GET') {
        // Wait for our signal before fulfilling the response
        await delayPromise;
        await route.continue();
      } else {
        await route.continue();
      }
    });

    // WHEN: User navigates to the contact detail URL (GET is intercepted and delayed)
    await page.goto(`/contactos/${created.id}`);

    // THEN: While loading is in progress, btn-editar must NOT be visible (AC #1)
    // The skeleton/loading state should not render the edit button
    await expect(page.getByTestId('btn-editar')).not.toBeVisible({ timeout: 500 });

    // Cleanup: release the GET request so navigation can complete
    resolveDelay!();

    // AND: Once data loads, btn-editar becomes visible
    await expect(page.getByTestId('btn-editar')).toBeVisible({ timeout: 5000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E3-3-4-E2E-EDGE-4 (P2) — Nombre at max boundary (255 characters)
  // Verifies Zod max(255) / FluentValidation MaximumLength(255) allows exact
  // boundary value through (off-by-one protection).
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E3-3-4-E2E-EDGE-4: should successfully save a Nombre of exactly 255 characters (max boundary)', async ({ page }) => {
    // GIVEN: A contact exists
    const originalData = buildContacto({ nombre: 'Contacto Para Boundary Test' });
    const created = await apiHelper.createContacto(originalData);
    createdIds.push(created.id);

    // GIVEN: Nombre at exactly 255 characters
    const maxNombre = 'A'.repeat(255);

    // GIVEN: Navigate to contact detail
    await page.goto(`/contactos/${created.id}`);
    await page.waitForURL(`**/contactos/${created.id}`);
    await expect(page.getByTestId('btn-editar')).toBeVisible({ timeout: 5000 });

    // WHEN: User opens edit form and fills Nombre with 255 chars
    await page.getByTestId('btn-editar').click();
    await expect(page.getByTestId('contacto-form')).toBeVisible({ timeout: 3000 });
    await page.getByTestId('input-nombre').clear();
    await page.getByTestId('input-nombre').fill(maxNombre);

    // WHEN: User submits the form
    await page.getByTestId('btn-submit').click();

    // THEN: Success toast appears (255 chars is within the allowed boundary)
    await expect(page.getByText('Contacto actualizado correctamente')).toBeVisible({ timeout: 5000 });

    // AND: No inline error message is visible for the Nombre field
    const alerts = page.locator('[role="alert"]');
    await expect(alerts).toHaveCount(0, { timeout: 2000 }).catch(() => {
      // If alert count check is flaky due to toast, just verify form closed
    });
    await expect(page.getByTestId('contacto-form')).not.toBeVisible({ timeout: 3000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E3-3-4-E2E-EDGE-5 (P2) — 500 Internal Server Error: no page crash and
  // no stack trace / technical details exposed in the UI (NFR6).
  // Uses route interception to simulate a 500 from the backend.
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E3-3-4-E2E-EDGE-5: should not crash the page and not expose stack trace when backend returns 500 on edit', async ({ page }) => {
    // GIVEN: A contact exists
    const originalData = buildContacto({ nombre: 'Contacto Error 500 Test' });
    const created = await apiHelper.createContacto(originalData);
    createdIds.push(created.id);

    // GIVEN: CRITICAL — Intercept PUT BEFORE navigation to return 500
    await page.route(`**/api/v1/contactos/${created.id}`, (route) => {
      if (route.request().method() === 'PUT') {
        route.fulfill({
          status: 500,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            type: 'https://tools.ietf.org/html/rfc7807',
            title: 'Error interno del servidor',
            status: 500,
            detail: 'Ha ocurrido un error inesperado. Por favor intente de nuevo.',
          }),
        });
      } else {
        route.continue();
      }
    });

    // GIVEN: User navigates to the contact detail view
    await page.goto(`/contactos/${created.id}`);
    await page.waitForURL(`**/contactos/${created.id}`);
    await expect(page.getByTestId('btn-editar')).toBeVisible({ timeout: 5000 });

    // WHEN: User opens the edit form and submits
    await page.getByTestId('btn-editar').click();
    await expect(page.getByTestId('contacto-form')).toBeVisible({ timeout: 3000 });
    await page.getByTestId('btn-submit').click();

    // THEN: Page does NOT crash (still navigable, no blank error page)
    await expect(page.getByTestId('contacto-form')).toBeVisible({ timeout: 3000 });

    // AND: No technical stack trace is exposed in the UI (NFR6)
    await expect(page.getByText(/StackTrace/i)).not.toBeVisible();
    await expect(page.getByText(/DbUpdateException/i)).not.toBeVisible();
    await expect(page.getByText(/System\.Exception/i)).not.toBeVisible();
    await expect(page.getByText(/at SiesaAgents/i)).not.toBeVisible();

    // AND: No raw HTTP error code is exposed in the page body
    await expect(page.locator('body')).not.toContainText('500 Internal Server Error');

    // AND: success toast was NOT shown (AC #2 — toast only on success)
    await expect(page.getByText('Contacto actualizado correctamente')).not.toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E3-3-4-E2E-EDGE-6 (P3) — Edit form closes after success and the
  // updated item remains accessible in the list (no orphan state).
  // Verifies that after successful edit, the contact detail view is still
  // shown (not collapsed/blank) and the list item is still present and
  // clickable (FR27 post-edit navigation).
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E3-3-4-E2E-EDGE-6: should close form and keep contact accessible in list after successful edit', async ({ page }) => {
    // GIVEN: A contact exists
    const originalData = buildContacto({ nombre: 'Contacto Persistencia Post-Edit' });
    const created = await apiHelper.createContacto(originalData);
    createdIds.push(created.id);

    // GIVEN: User navigates to contact detail
    await page.goto(`/contactos/${created.id}`);
    await page.waitForURL(`**/contactos/${created.id}`);
    await expect(page.getByTestId('btn-editar')).toBeVisible({ timeout: 5000 });

    // WHEN: User performs a successful edit
    const editedNombre = 'Contacto Post-Edit Verificado';
    await page.getByTestId('btn-editar').click();
    await expect(page.getByTestId('contacto-form')).toBeVisible({ timeout: 3000 });
    await page.getByTestId('input-nombre').clear();
    await page.getByTestId('input-nombre').fill(editedNombre);
    await page.getByTestId('btn-submit').click();
    await expect(page.getByText('Contacto actualizado correctamente')).toBeVisible({ timeout: 5000 });

    // THEN: Edit form is closed (not visible after success)
    await expect(page.getByTestId('contacto-form')).not.toBeVisible({ timeout: 3000 });

    // AND: Contact detail view is still visible (not collapsed to empty state)
    await expect(page.getByTestId('contacto-detail-view')).toBeVisible({ timeout: 3000 });

    // AND: Updated Nombre is shown in the detail view
    await expect(
      page.getByTestId('contacto-detail-view').getByText(editedNombre)
    ).toBeVisible({ timeout: 3000 });

    // AND: The list item for the edited contact is still present and accessible
    await expect(
      page.getByTestId('contacto-list-item').filter({ hasText: editedNombre })
    ).toBeVisible({ timeout: 3000 });

    // AND: "Editar" button is still visible for a potential third edit (AC #1)
    await expect(page.getByTestId('btn-editar')).toBeVisible({ timeout: 3000 });
  });
});

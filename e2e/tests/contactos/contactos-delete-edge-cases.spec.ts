import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper } from '../../helpers/api.helper';
import { buildContacto } from '../../helpers/data.helper';

/**
 * Automation expansion — Story 3.5: Delete Contact — E2E edge cases.
 *
 * Expands ATDD E2E coverage (contactos-delete.spec.ts) with:
 *
 *   [P1] Backend DELETE fails (500) → error toast shown, URL stays at /contactos/:id
 *   [P1] "btn-eliminar" has aria-label attribute (WCAG 2.1 AA)
 *   [P1] "Confirmar" button is disabled while DELETE is in-flight (isPending guard)
 *   [P2] Dialog description "Esta acción no se puede deshacer." is shown (AC #1)
 *   [P2] URL returns to /contactos (no contactoId) after deletion (navigation contract — AC #2)
 *   [P2] Contacto no longer appears in left panel list after deletion (FR27)
 *   [P3] Navigating to deleted contacto URL shows not-found state (bookmark edge case)
 *   [P3] Dialog has role="alertdialog" (semantic accessibility — not role="dialog")
 */

test.describe('Story 3.5 — Delete Contact E2E Edge Cases', () => {
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
  // [P1] Backend DELETE fails (500) → error toast, URL stays at /contactos/:id
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1] should show error toast and keep URL unchanged when DELETE returns 500', async ({ page }) => {
    // GIVEN: A contacto exists
    const contactoData = buildContacto({ nombre: 'Contacto Error 500 E2E Edge' });
    const created = await apiHelper.createContacto(contactoData);
    createdIds.push(created.id);

    // GIVEN: CRITICAL — Intercept DELETE BEFORE navigation (network-first)
    // Mock DELETE to return 500 (simulates backend failure)
    await page.route(`**/api/v1/contactos/${created.id}`, (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({ status: 500, body: '{}' });
      } else {
        route.continue();
      }
    });

    // GIVEN: User navigates to the contacto's detail view
    await page.goto(`/contactos/${created.id}`);
    await page.waitForURL(`**/contactos/${created.id}`);
    await expect(page.getByTestId('btn-eliminar')).toBeVisible({ timeout: 5000 });

    // WHEN: User opens dialog and confirms
    await page.getByTestId('btn-eliminar').click();
    await expect(page.getByTestId('btn-confirm-delete')).toBeVisible({ timeout: 3000 });
    await page.getByTestId('btn-confirm-delete').click();

    // THEN: Error toast appears (exact Spanish text — R-010 enforcement)
    await expect(
      page.getByText(/no se pudo eliminar el contacto/i)
    ).toBeVisible({ timeout: 5000 });

    // AND: URL stays at the contacto detail view (no navigation on error)
    await expect(page).toHaveURL(new RegExp(`/contactos/${created.id}`), { timeout: 3000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // [P1] "btn-eliminar" has aria-label for accessibility (WCAG 2.1 AA)
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1] "Eliminar" button should have an aria-label attribute (WCAG 2.1 AA)', async ({ page }) => {
    // GIVEN: A contacto exists and its detail is loaded
    const contactoData = buildContacto({ nombre: 'Contacto Aria Label E2E Edge' });
    const created = await apiHelper.createContacto(contactoData);
    createdIds.push(created.id);

    await page.goto(`/contactos/${created.id}`);
    await page.waitForURL(`**/contactos/${created.id}`);
    await expect(page.getByTestId('btn-eliminar')).toBeVisible({ timeout: 5000 });

    // THEN: The "Eliminar" button has an aria-label attribute (WCAG 2.1 AA)
    const ariaLabel = await page.getByTestId('btn-eliminar').getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel!.length).toBeGreaterThan(0);

    // AND: The aria-label contains meaningful accessibility text (Spanish)
    expect(ariaLabel!.toLowerCase()).toContain('eliminar');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // [P1] "Confirmar" button disabled during in-flight DELETE (full-stack guard)
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1] "Confirmar" button should be disabled while DELETE request is in-flight', async ({ page }) => {
    // GIVEN: A contacto exists
    const contactoData = buildContacto({ nombre: 'Contacto Confirmar Pending E2E Edge' });
    const created = await apiHelper.createContacto(contactoData);
    createdIds.push(created.id);

    // GIVEN: CRITICAL — Mock DELETE with a delay BEFORE navigation (network-first)
    await page.route(`**/api/v1/contactos/${created.id}`, async (route) => {
      if (route.request().method() === 'DELETE') {
        // Delay 800ms to give time to check the disabled state before fulfillment
        await new Promise((resolve) => setTimeout(resolve, 800));
        await route.fulfill({ status: 204, body: '' });
      } else {
        await route.continue();
      }
    });

    await page.goto(`/contactos/${created.id}`);
    await page.waitForURL(`**/contactos/${created.id}`);
    await expect(page.getByTestId('btn-eliminar')).toBeVisible({ timeout: 5000 });

    // WHEN: User opens dialog
    await page.getByTestId('btn-eliminar').click();
    await expect(page.getByTestId('btn-confirm-delete')).toBeVisible({ timeout: 3000 });

    // WHEN: User clicks "Confirmar" (mutation starts, isPending becomes true)
    await page.getByTestId('btn-confirm-delete').click();

    // THEN: "Confirmar" button is disabled while DELETE is in-flight (isPending guard)
    await expect(page.getByTestId('btn-confirm-delete')).toBeDisabled({ timeout: 2000 });

    // AND: Button shows "Eliminando..." while pending (label change from ContactoDetailView.tsx)
    await expect(page.getByTestId('btn-confirm-delete')).toHaveText(/eliminando/i, { timeout: 2000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // [P2] Dialog description text is "Esta acción no se puede deshacer." (AC #1)
  // ─────────────────────────────────────────────────────────────────────────

  test('[P2] confirmation dialog should show "Esta acción no se puede deshacer." description (AC #1)', async ({ page }) => {
    // GIVEN: A contacto exists
    const contactoData = buildContacto({ nombre: 'Contacto Dialog Desc E2E Edge' });
    const created = await apiHelper.createContacto(contactoData);
    createdIds.push(created.id);

    // GIVEN: CRITICAL — Intercept DELETE BEFORE navigation
    await page.route(`**/api/v1/contactos/${created.id}`, (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({ status: 204, body: '' });
      } else {
        route.continue();
      }
    });

    await page.goto(`/contactos/${created.id}`);
    await page.waitForURL(`**/contactos/${created.id}`);
    await expect(page.getByTestId('btn-eliminar')).toBeVisible({ timeout: 5000 });

    // WHEN: User opens dialog
    await page.getByTestId('btn-eliminar').click();
    await expect(page.getByText('¿Eliminar este contacto?')).toBeVisible({ timeout: 3000 });

    // THEN: AlertDialogDescription "Esta acción no se puede deshacer." is present (AC #1)
    await expect(page.getByText('Esta acción no se puede deshacer.')).toBeVisible({ timeout: 3000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // [P2] URL returns to /contactos (exact path — no contactoId) after deletion (AC #2)
  // ─────────────────────────────────────────────────────────────────────────

  test('[P2] URL should navigate to /contactos (no contactoId) after successful deletion (AC #2)', async ({ page }) => {
    // GIVEN: A contacto exists
    const contactoData = buildContacto({ nombre: 'Contacto URL Check E2E Edge' });
    const created = await apiHelper.createContacto(contactoData);
    // Do NOT push to createdIds — test deletes the contacto itself

    // GIVEN: Navigate to detail view
    await page.goto(`/contactos/${created.id}`);
    await page.waitForURL(`**/contactos/${created.id}`);
    await expect(page.getByTestId('btn-eliminar')).toBeVisible({ timeout: 5000 });

    // WHEN: Full delete flow (uses real backend)
    await page.getByTestId('btn-eliminar').click();
    await expect(page.getByText('¿Eliminar este contacto?')).toBeVisible({ timeout: 3000 });
    await page.getByTestId('btn-confirm-delete').click();

    // THEN: URL navigates to /contactos with NO trailing UUID (AC #2 — onContactoDeleted → navigate('/contactos'))
    await expect(page).toHaveURL(/\/contactos$/, { timeout: 5000 });

    // AND: URL does NOT contain the deleted contacto's ID
    const currentUrl = page.url();
    expect(currentUrl).not.toContain(created.id);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // [P2] Left panel list no longer contains the deleted contacto (FR27)
  // ─────────────────────────────────────────────────────────────────────────

  test('[P2] deleted contacto should not appear in the left panel list after deletion (FR27)', async ({ page }) => {
    // GIVEN: A contacto exists
    const contactoData = buildContacto({ nombre: 'Contacto FR27 Left Panel E2E Edge' });
    const created = await apiHelper.createContacto(contactoData);
    // Do NOT track for cleanup — test deletes it

    await page.goto(`/contactos/${created.id}`);
    await page.waitForURL(`**/contactos/${created.id}`);
    await expect(page.getByTestId('btn-eliminar')).toBeVisible({ timeout: 5000 });

    // AND: Contacto name is visible in the left panel BEFORE deletion
    await expect(
      page.getByTestId('contacto-list-item').filter({ hasText: contactoData.nombre })
    ).toBeVisible({ timeout: 5000 });

    // WHEN: Full delete flow
    await page.getByTestId('btn-eliminar').click();
    await expect(page.getByTestId('btn-confirm-delete')).toBeVisible({ timeout: 3000 });
    await page.getByTestId('btn-confirm-delete').click();

    // THEN: Contacto is removed from the left panel list (FR27 — immediate removal without page reload)
    await expect(
      page.getByTestId('contacto-list-item').filter({ hasText: contactoData.nombre })
    ).not.toBeVisible({ timeout: 5000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // [P3] Navigating to deleted contacto URL shows not-found state
  // Edge: user bookmarks the contacto URL and tries to access it after deletion
  // ─────────────────────────────────────────────────────────────────────────

  test('[P3] navigating directly to the URL of a deleted contacto should show not-found state', async ({ page }) => {
    // GIVEN: A contacto exists — then is deleted via API directly
    const contactoData = buildContacto({ nombre: 'Contacto Bookmark Deleted E2E Edge' });
    const created = await apiHelper.createContacto(contactoData);

    // Delete contacto directly via API (simulates deletion by another user/session)
    await apiHelper.deleteContacto(created.id);
    // Do NOT push to createdIds (already deleted)

    // WHEN: User navigates directly to the deleted contacto's URL (bookmark scenario)
    await page.goto(`/contactos/${created.id}`);

    // THEN: Not-found state is shown in the right panel
    // ContactoDetailView renders NotFoundPanel when GET returns 404
    await expect(
      page.getByText(/contacto no encontrado/i)
    ).toBeVisible({ timeout: 5000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // [P3] Delete dialog has role="alertdialog" (semantic accessibility)
  // AlertDialog component from shadcn/ui renders with role="alertdialog" by default
  // ─────────────────────────────────────────────────────────────────────────

  test('[P3] confirmation dialog should have role="alertdialog" (semantic accessibility)', async ({ page }) => {
    // GIVEN: A contacto exists
    const contactoData = buildContacto({ nombre: 'Contacto AlertDialog Role E2E Edge' });
    const created = await apiHelper.createContacto(contactoData);
    createdIds.push(created.id);

    // GIVEN: CRITICAL — Intercept DELETE BEFORE navigation
    await page.route(`**/api/v1/contactos/${created.id}`, (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({ status: 204, body: '' });
      } else {
        route.continue();
      }
    });

    await page.goto(`/contactos/${created.id}`);
    await page.waitForURL(`**/contactos/${created.id}`);
    await expect(page.getByTestId('btn-eliminar')).toBeVisible({ timeout: 5000 });

    // WHEN: User opens the dialog
    await page.getByTestId('btn-eliminar').click();
    await expect(page.getByText('¿Eliminar este contacto?')).toBeVisible({ timeout: 3000 });

    // THEN: The dialog element has role="alertdialog" (shadcn AlertDialog semantic — not role="dialog")
    const alertDialog = page.getByRole('alertdialog');
    await expect(alertDialog).toBeVisible({ timeout: 3000 });
  });
});

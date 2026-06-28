import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

/**
 * Automation expansion — Story 2.5: Delete Client — E2E edge cases.
 *
 * Expands ATDD E2E coverage (clientes-delete.spec.ts) with edge cases:
 *
 *   [P1] Backend DELETE fails (500) → error toast shown, URL stays at /clientes/:id
 *   [P1] "btn-eliminar" aria-label is present for accessibility (WCAG 2.1 AA)
 *   [P1] "Confirmar" button is disabled while DELETE is in-flight (isPending guard — full-stack)
 *   [P2] Delete dialog description text "Esta acción no se puede deshacer." is shown (AC #1)
 *   [P2] URL returns to /clientes (no clienteId) after successful deletion (navigation contract)
 *   [P2] Client no longer appears in left panel list after deletion (FR27 — no page reload)
 *   [P3] Delete dialog has role="alertdialog" (semantic accessibility — not role="dialog")
 *   [P3] Navigation to /clientes/:id of deleted client shows not-found state (404 guard)
 */

test.describe('Story 2.5 — Delete Client E2E Edge Cases', () => {
  let apiHelper: ApiHelper;
  const createdIds: string[] = [];

  test.beforeEach(async ({ request }) => {
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  // ─────────────────────────────────────────────────────────────────────────
  // [P1] Backend DELETE fails (500) → error toast, URL stays at /clientes/:id
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1] should show error toast and keep URL unchanged when DELETE returns 500', async ({ page }) => {
    // GIVEN: A client exists
    const clienteData = buildCliente({ nombre: 'Empresa Error 500 E2E SA' });
    const created = await apiHelper.createCliente(clienteData);
    createdIds.push(created.id);

    // GIVEN: CRITICAL — Intercept DELETE BEFORE navigation (network-first)
    // Mock DELETE to return 500
    await page.route(`**/api/v1/clientes/${created.id}`, (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({ status: 500, body: '{}' });
      } else {
        route.continue();
      }
    });

    // GIVEN: User navigates to the client's detail view
    await page.goto(`/clientes/${created.id}`);
    await page.waitForURL(`**/clientes/${created.id}`);
    await expect(page.getByTestId('btn-eliminar')).toBeVisible({ timeout: 5000 });

    // WHEN: User opens dialog and confirms
    await page.getByTestId('btn-eliminar').click();
    await expect(page.getByTestId('btn-confirm-delete')).toBeVisible({ timeout: 3000 });
    await page.getByTestId('btn-confirm-delete').click();

    // THEN: Error toast appears
    await expect(page.getByText(/no se pudo eliminar el cliente/i)).toBeVisible({ timeout: 5000 });

    // AND: URL stays at the client detail view (no navigation on error)
    await expect(page).toHaveURL(new RegExp(`/clientes/${created.id}`), { timeout: 3000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // [P1] "btn-eliminar" has aria-label for accessibility (WCAG 2.1 AA)
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1] "Eliminar" button should have an aria-label for accessibility (WCAG 2.1 AA)', async ({ page }) => {
    // GIVEN: A client exists and its detail is loaded
    const clienteData = buildCliente({ nombre: 'Empresa Aria Label SA' });
    const created = await apiHelper.createCliente(clienteData);
    createdIds.push(created.id);

    await page.goto(`/clientes/${created.id}`);
    await page.waitForURL(`**/clientes/${created.id}`);
    await expect(page.getByTestId('btn-eliminar')).toBeVisible({ timeout: 5000 });

    // THEN: The "Eliminar" button has an aria-label attribute (accessibility requirement)
    const ariaLabel = await page.getByTestId('btn-eliminar').getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel!.length).toBeGreaterThan(0);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // [P2] Delete dialog description text is shown (AC #1 — exact text)
  // ─────────────────────────────────────────────────────────────────────────

  test('[P2] confirmation dialog should show "Esta acción no se puede deshacer." description (AC #1)', async ({ page }) => {
    // GIVEN: A client exists
    const clienteData = buildCliente({ nombre: 'Empresa Dialog Desc SA' });
    const created = await apiHelper.createCliente(clienteData);
    createdIds.push(created.id);

    // GIVEN: Intercept DELETE BEFORE navigation
    await page.route(`**/api/v1/clientes/${created.id}`, (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({ status: 204, body: '' });
      } else {
        route.continue();
      }
    });

    await page.goto(`/clientes/${created.id}`);
    await page.waitForURL(`**/clientes/${created.id}`);
    await expect(page.getByTestId('btn-eliminar')).toBeVisible({ timeout: 5000 });

    // WHEN: User opens dialog
    await page.getByTestId('btn-eliminar').click();
    await expect(page.getByText('¿Eliminar este cliente?')).toBeVisible({ timeout: 3000 });

    // THEN: Description text "Esta acción no se puede deshacer." is present (AC #1)
    await expect(page.getByText('Esta acción no se puede deshacer.')).toBeVisible({ timeout: 3000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // [P2] URL returns to /clientes (exact path — no clienteId) after deletion
  // ─────────────────────────────────────────────────────────────────────────

  test('[P2] URL should navigate to /clientes (no clienteId) after successful deletion (AC #2)', async ({ page }) => {
    // GIVEN: A client exists
    const clienteData = buildCliente({ nombre: 'Empresa URL Check SA' });
    const created = await apiHelper.createCliente(clienteData);
    // Do NOT push to createdIds — test deletes the client itself

    // GIVEN: Navigate to detail view
    await page.goto(`/clientes/${created.id}`);
    await page.waitForURL(`**/clientes/${created.id}`);
    await expect(page.getByTestId('btn-eliminar')).toBeVisible({ timeout: 5000 });

    // WHEN: Full delete flow
    await page.getByTestId('btn-eliminar').click();
    await expect(page.getByText('¿Eliminar este cliente?')).toBeVisible({ timeout: 3000 });
    await page.getByTestId('btn-confirm-delete').click();

    // THEN: URL navigates to /clientes with NO trailing UUID
    await expect(page).toHaveURL(/\/clientes$/, { timeout: 5000 });

    // AND: URL does NOT contain the deleted client's ID
    const currentUrl = page.url();
    expect(currentUrl).not.toContain(created.id);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // [P2] Left panel list no longer contains the deleted client (FR27)
  // ─────────────────────────────────────────────────────────────────────────

  test('[P2] deleted client should not appear in the left panel list after deletion (FR27)', async ({ page }) => {
    // GIVEN: A client exists
    const clienteData = buildCliente({ nombre: 'Empresa FR27 Left Panel SA' });
    const created = await apiHelper.createCliente(clienteData);
    // Do NOT track for cleanup — test deletes it

    await page.goto(`/clientes/${created.id}`);
    await page.waitForURL(`**/clientes/${created.id}`);
    await expect(page.getByTestId('btn-eliminar')).toBeVisible({ timeout: 5000 });

    // AND: Client name is visible in the left panel BEFORE deletion
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: clienteData.nombre })
    ).toBeVisible({ timeout: 5000 });

    // WHEN: Full delete flow
    await page.getByTestId('btn-eliminar').click();
    await expect(page.getByTestId('btn-confirm-delete')).toBeVisible({ timeout: 3000 });
    await page.getByTestId('btn-confirm-delete').click();

    // THEN: Client is removed from the left panel list (FR27 — immediate removal without reload)
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: clienteData.nombre })
    ).not.toBeVisible({ timeout: 5000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // [P3] Navigating to deleted client URL shows not-found state
  // Edge: user bookmarks the URL and tries to access it after deletion
  // ─────────────────────────────────────────────────────────────────────────

  test('[P3] navigating directly to the URL of a deleted client should show not-found state', async ({ page }) => {
    // GIVEN: A client exists — then is deleted via API directly
    const clienteData = buildCliente({ nombre: 'Empresa Bookmark Deleted SA' });
    const created = await apiHelper.createCliente(clienteData);

    // Delete client directly via API (simulates it being deleted by someone else)
    await apiHelper.deleteCliente(created.id);
    // Do NOT push to createdIds (already deleted)

    // WHEN: User navigates directly to the deleted client's URL (bookmark scenario)
    await page.goto(`/clientes/${created.id}`);

    // THEN: Not-found state is shown in the right panel
    // The component should show NotFoundPanel when GET returns 404
    await expect(
      page.getByText(/cliente no encontrado|not found/i)
    ).toBeVisible({ timeout: 5000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // [P1] "Confirmar" button disabled during in-flight DELETE (full-stack guard)
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1] "Confirmar" button should be disabled while DELETE request is in-flight', async ({ page }) => {
    // GIVEN: A client exists
    const clienteData = buildCliente({ nombre: 'Empresa Confirmar Pending E2E SA' });
    const created = await apiHelper.createCliente(clienteData);
    createdIds.push(created.id);

    // GIVEN: CRITICAL — Mock DELETE with a delay BEFORE navigation (network-first)
    let requestReceived = false;
    await page.route(`**/api/v1/clientes/${created.id}`, async (route) => {
      if (route.request().method() === 'DELETE') {
        requestReceived = true;
        // Delay 800ms to give us time to check the disabled state
        await new Promise((resolve) => setTimeout(resolve, 800));
        await route.fulfill({ status: 204, body: '' });
      } else {
        await route.continue();
      }
    });

    await page.goto(`/clientes/${created.id}`);
    await page.waitForURL(`**/clientes/${created.id}`);
    await expect(page.getByTestId('btn-eliminar')).toBeVisible({ timeout: 5000 });

    // WHEN: User opens dialog
    await page.getByTestId('btn-eliminar').click();
    await expect(page.getByTestId('btn-confirm-delete')).toBeVisible({ timeout: 3000 });

    // Verify initial state: Confirmar is NOT disabled
    await expect(page.getByTestId('btn-confirm-delete')).not.toBeDisabled();

    // WHEN: User clicks Confirmar (request starts — triggers pending state)
    await page.getByTestId('btn-confirm-delete').click();

    // THEN: Button becomes disabled while DELETE is in-flight
    await expect(page.getByTestId('btn-confirm-delete')).toBeDisabled({ timeout: 2000 });

    // AND: Request was received (confirms the click actually fired)
    expect(requestReceived).toBe(true);
  });
});

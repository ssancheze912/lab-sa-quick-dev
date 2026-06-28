import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

/**
 * ATDD E2E tests — Story 2.5: Delete Client (RED phase)
 *
 * Tests fail until:
 *   - DELETE /api/v1/clientes/:id endpoint is implemented (backend)
 *   - ClienteDetailView: "Eliminar" button (data-testid="btn-eliminar") wired
 *   - AlertDialog confirmation with "¿Eliminar este cliente?", btn-confirm-delete, btn-cancel-delete
 *   - useDeleteCliente mutation: invalidates ['clientes'] and ['clientes', id] queries (FR27)
 *   - onClienteDeleted prop navigates to /clientes (empty right panel) after deletion (AC #2)
 *   - Toast "Cliente eliminado correctamente" on 204 response (AC #2, R-010)
 *   - No DELETE call when "Cancelar" is clicked (AC #3)
 *
 * Test IDs:
 *   TC-E2-2-5-E2E-P0-1 (P0) — Delete client from detail panel → removed from left panel,
 *                              right panel returns to empty state (FR27, R-002, R-003)
 */

test.describe('Story 2.5 — Delete Client (E2E)', () => {
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
  // AC #1 — Confirmation dialog appears when "Eliminar" button is clicked
  // ─────────────────────────────────────────────────────────────────────────

  test('should show confirmation dialog with "¿Eliminar este cliente?" when "Eliminar" button is clicked (AC #1)', async ({ page }) => {
    // GIVEN: A client exists in the system
    const clienteData = buildCliente({ nombre: 'Empresa Dialog E2E SA' });
    const created = await apiHelper.createCliente(clienteData);
    createdIds.push(created.id);

    // GIVEN: CRITICAL — Intercept DELETE BEFORE navigation (network-first pattern)
    let deleteCalled = false;
    await page.route(`**/api/v1/clientes/${created.id}`, (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true;
        route.continue();
      } else {
        route.continue();
      }
    });

    // GIVEN: User navigates to the client's detail view
    await page.goto(`/clientes/${created.id}`);
    await page.waitForURL(`**/clientes/${created.id}`);

    // AND: "Eliminar" button is visible in the data-loaded state (not during loading)
    await expect(page.getByTestId('btn-eliminar')).toBeVisible({ timeout: 5000 });

    // WHEN: User clicks "Eliminar"
    await page.getByTestId('btn-eliminar').click();

    // THEN: Confirmation dialog appears with exact title text (AC #1)
    await expect(page.getByText('¿Eliminar este cliente?')).toBeVisible({ timeout: 3000 });

    // AND: "Confirmar" button is visible in the dialog
    await expect(page.getByTestId('btn-confirm-delete')).toBeVisible();

    // AND: "Cancelar" button is visible in the dialog
    await expect(page.getByTestId('btn-cancel-delete')).toBeVisible();

    // AND: No DELETE was triggered by merely opening the dialog
    expect(deleteCalled).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // AC #3 — Clicking "Cancelar" closes dialog, no DELETE called
  // ─────────────────────────────────────────────────────────────────────────

  test('should close dialog and make no DELETE API call when "Cancelar" is clicked (AC #3)', async ({ page }) => {
    // GIVEN: A client exists
    const clienteData = buildCliente({ nombre: 'Empresa Cancel E2E SA' });
    const created = await apiHelper.createCliente(clienteData);
    createdIds.push(created.id);

    // GIVEN: CRITICAL — Intercept DELETE BEFORE navigation to assert it is never called
    let deleteCalled = false;
    await page.route(`**/api/v1/clientes/${created.id}`, (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true;
        route.continue();
      } else {
        route.continue();
      }
    });

    // GIVEN: User is at the client detail view
    await page.goto(`/clientes/${created.id}`);
    await page.waitForURL(`**/clientes/${created.id}`);
    await expect(page.getByTestId('btn-eliminar')).toBeVisible({ timeout: 5000 });

    // WHEN: User opens confirmation dialog
    await page.getByTestId('btn-eliminar').click();
    await expect(page.getByTestId('btn-cancel-delete')).toBeVisible({ timeout: 3000 });

    // WHEN: User clicks "Cancelar"
    await page.getByTestId('btn-cancel-delete').click();

    // THEN: Dialog closes (confirmation dialog is no longer visible)
    await expect(page.getByText('¿Eliminar este cliente?')).not.toBeVisible({ timeout: 3000 });

    // AND: DELETE API was NEVER called (AC #3 — no mutation on cancel)
    expect(deleteCalled).toBe(false);

    // AND: Client data is still shown in the detail panel (record unchanged)
    await expect(page.getByText(clienteData.nombre)).toBeVisible({ timeout: 3000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E2-2-5-E2E-P0-1 (P0) — Full delete flow: item removed from left panel,
  // right panel returns to empty state (FR27, R-002, R-003)
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E2-2-5-E2E-P0-1: should remove client from left panel and return right panel to empty state after deletion (FR27, AC #2)', async ({ page }) => {
    // GIVEN: A client exists in the system
    const clienteData = buildCliente({ nombre: 'Empresa Eliminar Flujo Completo SA' });
    const created = await apiHelper.createCliente(clienteData);
    // DO NOT push to createdIds — client will be deleted by the test itself

    // GIVEN: CRITICAL — Intercept routes BEFORE navigation (network-first pattern)
    // The real backend DELETE endpoint is used for this P0 full-stack test.

    // GIVEN: User navigates to the client's detail view
    await page.goto(`/clientes/${created.id}`);
    await page.waitForURL(`**/clientes/${created.id}`);

    // AND: "Eliminar" button is visible in the data-loaded state
    await expect(page.getByTestId('btn-eliminar')).toBeVisible({ timeout: 5000 });

    // AND: Client name is visible in the left panel list (present before deletion)
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: clienteData.nombre })
    ).toBeVisible({ timeout: 5000 });

    // WHEN: User clicks "Eliminar" to open the confirmation dialog
    await page.getByTestId('btn-eliminar').click();

    // AND: Dialog is visible with the title
    await expect(page.getByText('¿Eliminar este cliente?')).toBeVisible({ timeout: 3000 });

    // WHEN: User clicks "Confirmar" to proceed with deletion
    await page.getByTestId('btn-confirm-delete').click();

    // THEN: Toast "Cliente eliminado correctamente" appears (AC #2, R-010 — exact text)
    await expect(page.getByText('Cliente eliminado correctamente')).toBeVisible({ timeout: 5000 });

    // AND: Client is removed from the LEFT PANEL list immediately (FR27 — no page reload)
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: clienteData.nombre })
    ).not.toBeVisible({ timeout: 5000 });

    // AND: Right panel returns to the empty/placeholder state (AC #2 — onClienteDeleted → navigate('/clientes'))
    await expect(page.getByText(/selecciona un cliente para ver su detalle/i)).toBeVisible({
      timeout: 5000,
    });

    // AND: URL returns to /clientes (no clienteId in URL)
    await expect(page).toHaveURL(/\/clientes$/, { timeout: 3000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // "Eliminar" button visibility — only in data-loaded state (AC #1)
  // ─────────────────────────────────────────────────────────────────────────

  test('should show "Eliminar" button only when client detail is in data-loaded state (not in empty/placeholder state)', async ({ page }) => {
    // GIVEN: A client exists
    const clienteData = buildCliente({ nombre: 'Empresa Btn Visibility SA' });
    const created = await apiHelper.createCliente(clienteData);
    createdIds.push(created.id);

    // GIVEN: CRITICAL — Intercept routes BEFORE navigation (network-first)
    // Navigate to /clientes (no client selected — btn-eliminar must NOT be visible)
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');

    // THEN: btn-eliminar is NOT visible in the empty/placeholder state
    await expect(page.getByTestId('btn-eliminar')).not.toBeVisible();

    // WHEN: User navigates to client detail
    await page.goto(`/clientes/${created.id}`);
    await page.waitForURL(`**/clientes/${created.id}`);

    // THEN: btn-eliminar IS visible in the data-loaded state
    await expect(page.getByTestId('btn-eliminar')).toBeVisible({ timeout: 5000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // AC #2 — "Editar" button remains functional after delete flow is cancelled
  // Regression guard: Eliminar must not break "Editar" (Story 2.4)
  // ─────────────────────────────────────────────────────────────────────────

  test('should keep "Editar" button functional after the delete dialog is cancelled (regression guard for Story 2.4)', async ({ page }) => {
    // GIVEN: A client exists
    const clienteData = buildCliente({ nombre: 'Empresa Editar Regression SA' });
    const created = await apiHelper.createCliente(clienteData);
    createdIds.push(created.id);

    // GIVEN: CRITICAL — Intercept DELETE BEFORE navigation
    await page.route(`**/api/v1/clientes/${created.id}`, (route) => {
      if (route.request().method() === 'DELETE') {
        // Fulfill immediately so the test doesn't depend on real backend for delete
        route.fulfill({ status: 204, body: '' });
      } else {
        route.continue();
      }
    });

    await page.goto(`/clientes/${created.id}`);
    await page.waitForURL(`**/clientes/${created.id}`);
    await expect(page.getByTestId('btn-eliminar')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('btn-editar')).toBeVisible({ timeout: 5000 });

    // WHEN: User opens the delete dialog
    await page.getByTestId('btn-eliminar').click();
    await expect(page.getByTestId('btn-cancel-delete')).toBeVisible({ timeout: 3000 });

    // WHEN: User cancels
    await page.getByTestId('btn-cancel-delete').click();
    await expect(page.getByText('¿Eliminar este cliente?')).not.toBeVisible({ timeout: 3000 });

    // THEN: "Editar" button is still visible and clickable (no regression)
    await expect(page.getByTestId('btn-editar')).toBeVisible({ timeout: 3000 });
    await page.getByTestId('btn-editar').click();

    // AND: ClienteForm opens correctly (edit flow not broken)
    await expect(page.getByTestId('cliente-form')).toBeVisible({ timeout: 3000 });
  });
});

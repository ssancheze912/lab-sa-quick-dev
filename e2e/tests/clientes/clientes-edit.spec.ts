import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

/**
 * ATDD E2E tests — Story 2.4: Edit Client (RED phase)
 *
 * Tests fail until:
 *   - PUT /api/v1/clientes/:id endpoint is implemented (backend)
 *   - ClienteForm extended with clienteId + defaultValues edit-mode props
 *   - ClienteDetailView: "Editar" button (data-testid="btn-editar") wired
 *   - useUpdateCliente mutation invalidates ['clientes'] and ['clientes', id] queries (FR27)
 *   - Toast "Cliente actualizado correctamente" is displayed on success
 *   - Inline validation errors appear on empty field submission in edit mode
 *   - Cancel in edit mode keeps original data unchanged (AC #4, R-009)
 *
 * Test IDs:
 *   TC-E2-2-4-E2E-1 (P1) — Edit client end-to-end → updated Nombre in left panel and
 *                           detail view without page reload (FR27, R-002)
 */

test.describe('Story 2.4 — Edit Client (E2E)', () => {
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
  // TC-E2-2-4-E2E-1 (P1) — Edit client end-to-end → updated Nombre in left panel
  // and detail view without page reload (FR27, R-002)
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E2-2-4-E2E-1: should show updated Nombre in left panel and detail view immediately after edit without page reload', async ({ page }) => {
    // GIVEN: A client exists in the system
    const originalData = buildCliente({ nombre: 'Empresa Original E2E SA' });
    const created = await apiHelper.createCliente(originalData);
    createdIds.push(created.id);

    // GIVEN: CRITICAL — Intercept PUT BEFORE navigation (network-first pattern)
    // We use the real backend for this P1 full-stack test — no mock needed.
    // The test verifies the full stack: form → PUT → invalidateQueries → list refetch (FR27).

    // GIVEN: User navigates to the client's detail view
    await page.goto(`/clientes/${created.id}`);
    await page.waitForURL(`**/clientes/${created.id}`);

    // AND: "Editar" button is visible in the detail panel (data state — not loading/error)
    await expect(page.getByTestId('btn-editar')).toBeVisible({ timeout: 5000 });

    // WHEN: User clicks "Editar"
    await page.getByTestId('btn-editar').click();

    // THEN: ClienteForm opens as a modal/overlay
    await expect(page.getByTestId('cliente-form')).toBeVisible({ timeout: 3000 });

    // AND: Form is pre-filled with the current client values (AC #1)
    await expect(page.getByTestId('input-nombre')).toHaveValue(originalData.nombre);
    await expect(page.getByTestId('input-nit')).toHaveValue(originalData.nit);
    await expect(page.getByTestId('input-telefono')).toHaveValue(originalData.telefono);
    await expect(page.getByTestId('input-ciudad')).toHaveValue(originalData.ciudad);

    // WHEN: User modifies the Nombre field
    const newNombre = 'Empresa Editada E2E SA';
    await page.getByTestId('input-nombre').clear();
    await page.getByTestId('input-nombre').fill(newNombre);

    // WHEN: User clicks "Guardar cambios"
    await page.getByTestId('btn-submit').click();

    // THEN: Success toast "Cliente actualizado correctamente" appears (AC #2, R-010)
    await expect(page.getByText('Cliente actualizado correctamente')).toBeVisible({ timeout: 5000 });

    // AND: Updated Nombre appears in the LEFT PANEL list without page reload (FR27, R-002)
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: newNombre })
    ).toBeVisible({ timeout: 5000 });

    // AND: Updated Nombre appears in the RIGHT PANEL detail view (FR27)
    await expect(page.getByText(newNombre)).toBeVisible({ timeout: 5000 });

    // AND: Original Nombre is no longer shown in the list (replaced by updated value)
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: originalData.nombre })
    ).not.toBeVisible({ timeout: 3000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // "Editar" button visibility — only in data-loaded state (AC #1)
  // ─────────────────────────────────────────────────────────────────────────

  test('should show "Editar" button only when client detail is loaded (not during loading or no-selection state)', async ({ page }) => {
    // GIVEN: A client exists
    const data = buildCliente({ nombre: 'Empresa Para Editar Btn' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // GIVEN: CRITICAL — Intercept routes BEFORE navigation (network-first)
    // Navigate to /clientes (no client selected — btn-editar must NOT be visible)
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');

    // THEN: btn-editar is NOT visible when no client is selected (empty/placeholder state)
    await expect(page.getByTestId('btn-editar')).not.toBeVisible();

    // WHEN: User navigates to client detail
    await page.goto(`/clientes/${created.id}`);
    await page.waitForURL(`**/clientes/${created.id}`);

    // THEN: btn-editar IS visible in the data-loaded state
    await expect(page.getByTestId('btn-editar')).toBeVisible({ timeout: 5000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Cancel in edit mode — original data remains unchanged (AC #4, R-009)
  // ─────────────────────────────────────────────────────────────────────────

  test('should keep original client data unchanged when "Cancelar" is clicked in edit form', async ({ page }) => {
    // GIVEN: A client exists
    const originalData = buildCliente({ nombre: 'Empresa Sin Cambios E2E SA' });
    const created = await apiHelper.createCliente(originalData);
    createdIds.push(created.id);

    // GIVEN: CRITICAL — Intercept PUT BEFORE navigation to assert it is never called
    let putCalled = false;
    await page.route(`**/api/v1/clientes/${created.id}`, (route) => {
      if (route.request().method() === 'PUT') {
        putCalled = true;
        route.continue();
      } else {
        route.continue();
      }
    });

    // GIVEN: User is at the client detail view
    await page.goto(`/clientes/${created.id}`);
    await page.waitForURL(`**/clientes/${created.id}`);
    await expect(page.getByTestId('btn-editar')).toBeVisible({ timeout: 5000 });

    // WHEN: User opens the edit form
    await page.getByTestId('btn-editar').click();
    await expect(page.getByTestId('cliente-form')).toBeVisible();

    // WHEN: User modifies Nombre
    await page.getByTestId('input-nombre').clear();
    await page.getByTestId('input-nombre').fill('Nombre Que No Se Guardara');

    // WHEN: User clicks "Cancelar"
    await page.getByTestId('btn-cancel').click();

    // THEN: Form closes
    await expect(page.getByTestId('cliente-form')).not.toBeVisible({ timeout: 3000 });

    // AND: PUT to backend was NEVER called (AC #4 — no API call on cancel)
    expect(putCalled).toBe(false);

    // AND: Original Nombre still shown in detail view (original data unchanged)
    await expect(page.getByText(originalData.nombre)).toBeVisible({ timeout: 3000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Inline validation in edit mode — empty submission shows errors (AC #3)
  // ─────────────────────────────────────────────────────────────────────────

  test('should show inline validation errors when a required field is cleared and submitted in edit mode', async ({ page }) => {
    // GIVEN: A client exists
    const data = buildCliente({ nombre: 'Empresa Para Validar E2E SA' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // GIVEN: CRITICAL — Intercept PUT BEFORE navigation to assert it is never called
    let putCalled = false;
    await page.route(`**/api/v1/clientes/${created.id}`, (route) => {
      if (route.request().method() === 'PUT') {
        putCalled = true;
        route.continue();
      } else {
        route.continue();
      }
    });

    // GIVEN: User navigates to client detail and opens edit form
    await page.goto(`/clientes/${created.id}`);
    await page.waitForURL(`**/clientes/${created.id}`);
    await expect(page.getByTestId('btn-editar')).toBeVisible({ timeout: 5000 });
    await page.getByTestId('btn-editar').click();
    await expect(page.getByTestId('cliente-form')).toBeVisible();

    // WHEN: User clears the Nombre field
    await page.getByTestId('input-nombre').clear();

    // WHEN: User submits the form
    await page.getByTestId('btn-submit').click();

    // THEN: Inline validation error appears for the empty Nombre field
    await expect(page.locator('[role="alert"]').first()).toBeVisible({ timeout: 3000 });

    // AND: PUT to backend was NEVER called (client-side Zod guard prevents submission)
    expect(putCalled).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 409 conflict in edit mode — inline error on NIT field (AC #2 edge case)
  // ─────────────────────────────────────────────────────────────────────────

  test('should show "El NIT/RUC ya está registrado" inline error when backend returns 409 on edit', async ({ page }) => {
    // GIVEN: Client A exists
    const clienteA = buildCliente({ nombre: 'Empresa A Para Conflicto' });
    const createdA = await apiHelper.createCliente(clienteA);
    createdIds.push(createdA.id);

    // GIVEN: Client B exists with a different NIT
    const clienteB = buildCliente({ nombre: 'Empresa B Con NIT Distinto' });
    const createdB = await apiHelper.createCliente(clienteB);
    createdIds.push(createdB.id);

    // GIVEN: CRITICAL — Intercept PUT BEFORE navigation, returning 409 for NIT conflict
    await page.route(`**/api/v1/clientes/${createdA.id}`, (route) => {
      if (route.request().method() === 'PUT') {
        route.fulfill({
          status: 409,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            type: 'https://tools.ietf.org/html/rfc7807',
            title: 'Conflicto de datos',
            status: 409,
            detail: 'El NIT/RUC ya está registrado',
          }),
        });
      } else {
        route.continue();
      }
    });

    // GIVEN: User navigates to Client A's detail and opens edit form
    await page.goto(`/clientes/${createdA.id}`);
    await page.waitForURL(`**/clientes/${createdA.id}`);
    await expect(page.getByTestId('btn-editar')).toBeVisible({ timeout: 5000 });
    await page.getByTestId('btn-editar').click();
    await expect(page.getByTestId('cliente-form')).toBeVisible();

    // WHEN: User changes NIT to match Client B's NIT and submits
    await page.getByTestId('input-nit').clear();
    await page.getByTestId('input-nit').fill(clienteB.nit);
    await page.getByTestId('btn-submit').click();

    // THEN: Inline error "El NIT/RUC ya está registrado" appears on NIT field
    await expect(page.getByText('El NIT/RUC ya está registrado')).toBeVisible({ timeout: 5000 });
  });
});

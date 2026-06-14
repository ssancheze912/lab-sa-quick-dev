/**
 * Story 2.3: Create Client — E2E Acceptance Tests (RED PHASE)
 *
 * Tests are written BEFORE implementation. They will fail because:
 * - ClienteForm component does not exist yet
 * - "Nuevo cliente" button does not exist in ClienteListView yet
 * - Dialog wrapping form in /clientes route does not exist yet
 * - useCreateCliente mutation hook does not exist yet
 * - POST /api/v1/clientes endpoint does not exist yet
 *
 * Acceptance Criteria covered:
 *   AC#1 — "Nuevo cliente" button opens a Dialog with 4 required fields
 *   AC#2 — Submitting valid form creates client (POST /api/v1/clientes), list updates, toast shown
 *   AC#3 — Submitting with empty fields shows inline errors, no API call made
 *   AC#4 — Submitting duplicate NIT shows inline error on NIT field (409 → field error)
 *   AC#5 — Clicking "Cancelar" closes form without API call
 *
 * Test cases from test-design-epic-2.md:
 *   TC-E2-P1-14: E2E — Full Create Client Flow
 */

import { test, expect } from '../../fixtures/base.fixture';
import { ClientesPage } from '../../pages/clientes.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

test.describe('Story 2.3: Create Client', () => {
  let clientesPage: ClientesPage;
  let apiHelper: ApiHelper;
  const createdIds: string[] = [];

  test.beforeEach(async ({ page, request }) => {
    clientesPage = new ClientesPage(page);
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  // ─── AC#1: "Nuevo cliente" button opens Dialog with 4 required fields ────────

  test('AC#1 — "Nuevo cliente" button should be visible on /clientes page', async ({ page }) => {
    // GIVEN: user navigates to /clientes (network intercepted before navigation)
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // WHEN: page is loaded

    // THEN: "Nuevo cliente" button is visible in the left panel
    const btnNuevoCliente = page.getByTestId('btn-nuevo-cliente');
    await expect(btnNuevoCliente).toBeVisible();
  });

  test('AC#1 — clicking "Nuevo cliente" opens a Dialog/modal', async ({ page }) => {
    // GIVEN: user is on /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // WHEN: user clicks "Nuevo cliente"
    await page.getByTestId('btn-nuevo-cliente').click();

    // THEN: a dialog/modal appears
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('AC#1 — dialog title should be "Nuevo cliente"', async ({ page }) => {
    // GIVEN: user is on /clientes and clicks the button
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await page.getByTestId('btn-nuevo-cliente').click();

    // WHEN: dialog opens

    // THEN: dialog title is "Nuevo cliente"
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog')).toContainText('Nuevo cliente');
  });

  test('AC#1 — dialog contains Nombre field', async ({ page }) => {
    // GIVEN: dialog is open
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await page.getByTestId('btn-nuevo-cliente').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // THEN: Nombre input is visible inside the dialog
    const inputNombre = page.getByTestId('input-nombre');
    await expect(inputNombre).toBeVisible();
  });

  test('AC#1 — dialog contains NIT/RUC field', async ({ page }) => {
    // GIVEN: dialog is open
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await page.getByTestId('btn-nuevo-cliente').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // THEN: NIT input is visible inside the dialog
    const inputNit = page.getByTestId('input-nit');
    await expect(inputNit).toBeVisible();
  });

  test('AC#1 — dialog contains Teléfono field', async ({ page }) => {
    // GIVEN: dialog is open
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await page.getByTestId('btn-nuevo-cliente').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // THEN: Teléfono input is visible inside the dialog
    const inputTelefono = page.getByTestId('input-telefono');
    await expect(inputTelefono).toBeVisible();
  });

  test('AC#1 — dialog contains Ciudad field', async ({ page }) => {
    // GIVEN: dialog is open
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await page.getByTestId('btn-nuevo-cliente').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // THEN: Ciudad input is visible inside the dialog
    const inputCiudad = page.getByTestId('input-ciudad');
    await expect(inputCiudad).toBeVisible();
  });

  // ─── AC#2: Valid form submission creates client and updates list ───────────

  /**
   * TC-E2-P1-14: Full Create Client Flow (P1 — core user journey)
   */
  test('AC#2 — TC-E2-P1-14: valid form submission creates client and shows success toast', async ({ page }) => {
    // GIVEN: user is on /clientes and opens "Nuevo cliente" form
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await page.getByTestId('btn-nuevo-cliente').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const data = buildCliente({ nombre: 'Empresa E2E Creación', nit: '900200300-4' });

    // WHEN: user fills all required fields and clicks "Guardar"
    await page.getByTestId('input-nombre').fill(data.nombre);
    await page.getByTestId('input-nit').fill(data.nit);
    await page.getByTestId('input-telefono').fill(data.telefono);
    await page.getByTestId('input-ciudad').fill(data.ciudad);
    await page.getByTestId('btn-guardar').click();

    // THEN: success toast "Cliente creado correctamente" is visible
    await expect(page.getByText('Cliente creado correctamente')).toBeVisible();

    // AND: the new client appears in the left panel list
    await expect(
      page.getByTestId('clientes-list-panel').getByText(data.nombre)
    ).toBeVisible();

    // Cleanup: find and register id
    const clientes: Array<{ id: string; nit: string }> = await apiHelper.getClientes();
    const created = clientes.find((c) => c.nit === data.nit);
    if (created) createdIds.push(created.id);
  });

  test('AC#2 — dialog closes after successful submission (FR1)', async ({ page }) => {
    // GIVEN: user fills form and submits
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await page.getByTestId('btn-nuevo-cliente').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const data = buildCliente({ nombre: 'Empresa Close Test', nit: '900300400-5' });
    await page.getByTestId('input-nombre').fill(data.nombre);
    await page.getByTestId('input-nit').fill(data.nit);
    await page.getByTestId('input-telefono').fill(data.telefono);
    await page.getByTestId('input-ciudad').fill(data.ciudad);
    await page.getByTestId('btn-guardar').click();

    // WHEN: form is submitted successfully

    // THEN: dialog closes
    await expect(page.getByRole('dialog')).toBeHidden();

    // Cleanup
    const clientes: Array<{ id: string; nit: string }> = await apiHelper.getClientes();
    const created = clientes.find((c) => c.nit === data.nit);
    if (created) createdIds.push(created.id);
  });

  // ─── AC#3: Empty fields show inline errors, no API call ───────────────────

  test('AC#3 — submitting empty form shows inline error for Nombre field', async ({ page }) => {
    // GIVEN: dialog is open and all fields are empty
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await page.getByTestId('btn-nuevo-cliente').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: user clicks "Guardar" without filling any field
    await page.getByTestId('btn-guardar').click();

    // THEN: inline error for Nombre is visible
    await expect(page.getByText('El nombre es requerido')).toBeVisible();
  });

  test('AC#3 — submitting empty form shows inline error for NIT/RUC field', async ({ page }) => {
    // GIVEN: dialog is open and all fields are empty
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await page.getByTestId('btn-nuevo-cliente').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: user clicks "Guardar" without filling any field
    await page.getByTestId('btn-guardar').click();

    // THEN: inline error for NIT/RUC is visible
    await expect(page.getByText('El NIT/RUC es requerido')).toBeVisible();
  });

  test('AC#3 — submitting empty form shows inline error for Teléfono field', async ({ page }) => {
    // GIVEN: dialog is open and all fields are empty
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await page.getByTestId('btn-nuevo-cliente').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: user clicks "Guardar" without filling any field
    await page.getByTestId('btn-guardar').click();

    // THEN: inline error for Teléfono is visible
    await expect(page.getByText('El teléfono es requerido')).toBeVisible();
  });

  test('AC#3 — submitting empty form shows inline error for Ciudad field', async ({ page }) => {
    // GIVEN: dialog is open and all fields are empty
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await page.getByTestId('btn-nuevo-cliente').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: user clicks "Guardar" without filling any field
    await page.getByTestId('btn-guardar').click();

    // THEN: inline error for Ciudad is visible
    await expect(page.getByText('La ciudad es requerida')).toBeVisible();
  });

  // ─── AC#4: Duplicate NIT shows inline error on NIT field ──────────────────

  test('AC#4 — submitting duplicate NIT shows inline error "El NIT/RUC ya está registrado"', async ({ page }) => {
    // GIVEN: a client with nit "900444555-6" already exists
    const existingData = buildCliente({ nombre: 'Empresa Existente NIT', nit: '900444555-6' });
    const seeded = await apiHelper.createCliente(existingData);
    createdIds.push(seeded.id);

    // AND: user opens the create form
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await page.getByTestId('btn-nuevo-cliente').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: user fills form with the same NIT and submits
    await page.getByTestId('input-nombre').fill('Empresa Duplicada');
    await page.getByTestId('input-nit').fill('900444555-6');
    await page.getByTestId('input-telefono').fill('3005551111');
    await page.getByTestId('input-ciudad').fill('Bogotá');
    await page.getByTestId('btn-guardar').click();

    // THEN: inline error "El NIT/RUC ya está registrado" appears on the NIT field
    await expect(page.getByText('El NIT/RUC ya está registrado')).toBeVisible();

    // AND: no technical details are exposed (NFR6)
    await expect(page.getByRole('dialog')).not.toContainText('Exception');
    await expect(page.getByRole('dialog')).not.toContainText('StackTrace');
  });

  // ─── AC#5: "Cancelar" closes form without API call ────────────────────────

  test('AC#5 — clicking "Cancelar" closes the dialog', async ({ page }) => {
    // GIVEN: dialog is open
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await page.getByTestId('btn-nuevo-cliente').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // WHEN: user clicks "Cancelar"
    await page.getByTestId('btn-cancelar').click();

    // THEN: dialog closes
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('AC#5 — clicking "Cancelar" does not create any client', async ({ page }) => {
    // GIVEN: dialog is open and user fills fields but clicks cancel
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    const countBefore = (await apiHelper.getClientes()).length;

    await page.getByTestId('btn-nuevo-cliente').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByTestId('input-nombre').fill('Empresa Cancelada');
    await page.getByTestId('input-nit').fill('900999888-7');
    await page.getByTestId('input-telefono').fill('3009998887');
    await page.getByTestId('input-ciudad').fill('Cali');

    // WHEN: user clicks "Cancelar"
    await page.getByTestId('btn-cancelar').click();

    // THEN: dialog closes and no new client was created
    await expect(page.getByRole('dialog')).toBeHidden();
    const countAfter = (await apiHelper.getClientes()).length;
    expect(countAfter).toBe(countBefore);
  });
});

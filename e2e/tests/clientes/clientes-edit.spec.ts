import { test, expect } from '../../fixtures/base.fixture';
import { ClientesPage } from '../../pages/clientes.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

/**
 * ATDD — Story 2.4: Edit Client
 *
 * Tests are in RED phase — they define the expected behaviour BEFORE implementation.
 * Make these tests GREEN by:
 *   - Creating `useUpdateCliente` mutation hook
 *   - Extending `ClienteFormDialog` to support edit mode via `cliente` prop
 *   - Adding "Editar" button to `ClienteDetailPanel`
 *   - Wiring `PUT /api/v1/clientes/:id` endpoint in the backend
 *
 * Coverage:
 *   E2E-C-18  P0  AC1     — Clicking "Editar" opens form pre-filled with current field values
 *   E2E-C-19  P0  AC2     — Modifying a field and saving updates detail panel and list immediately (no reload, FR27)
 *   E2E-C-20  P0  AC3     — Clearing a required field and saving shows inline error; no PUT API call fired (FR8)
 *   E2E-C-21  P1  AC2     — Toast "Cliente actualizado correctamente" appears after successful edit
 *   E2E-C-22  P1  AC4     — Clicking "Cancelar" closes form without making PUT request; original data unchanged
 */

// ---------------------------------------------------------------------------
// E2E Tests
// ---------------------------------------------------------------------------

test.describe('Story 2.4 — Editar cliente (E2E)', () => {
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

  // -------------------------------------------------------------------------
  // E2E-C-18 (P0 · AC1)
  // Given the user is viewing a client's detail
  // When the user clicks "Editar"
  // Then the client form opens pre-filled with the current values of all fields:
  //   Nombre, NIT/RUC, Teléfono, Ciudad (FR6)
  // -------------------------------------------------------------------------
  test('E2E-C-18 — "Editar" abre el formulario con los campos pre-llenados con los valores actuales', async ({ page }) => {
    // GIVEN — a client exists in the system
    const clienteData = buildCliente({ nombre: 'Empresa Pre-filled E2E-C-18' });
    const created = await apiHelper.createCliente(clienteData);
    createdIds.push(created.id);

    // GIVEN — intercept network BEFORE navigation (network-first pattern)
    await page.route('**/api/v1/clientes**', (route) => route.continue());

    await clientesPage.goto();

    // WHEN — user selects the client from the list to view its detail
    await clientesPage.seleccionarCliente(clienteData.nombre);

    // AND — the detail panel is visible
    await expect(clientesPage.detailPanel).toBeVisible();

    // AND — user clicks "Editar" in the detail panel
    await page.getByTestId('btn-editar').click();

    // THEN — the form dialog opens
    await expect(page.getByTestId('cliente-form-dialog')).toBeVisible();

    // AND — the dialog title indicates edit mode
    await expect(page.getByRole('dialog')).toContainText(/editar cliente/i);

    // AND — the Nombre field is pre-filled with the client's current value
    await expect(page.getByTestId('input-nombre')).toHaveValue(clienteData.nombre);

    // AND — the NIT field is pre-filled with the client's current value
    await expect(page.getByTestId('input-nit')).toHaveValue(clienteData.nit);

    // AND — the Teléfono field is pre-filled with the client's current value
    await expect(page.getByTestId('input-telefono')).toHaveValue(clienteData.telefono);

    // AND — the Ciudad field is pre-filled with the client's current value
    await expect(page.getByTestId('input-ciudad')).toHaveValue(clienteData.ciudad);
  });

  // -------------------------------------------------------------------------
  // E2E-C-19 (P0 · AC2)
  // Given the user has the edit form open with a client's data
  // When the user modifies a field and clicks "Guardar"
  // Then the changes are persisted via PUT /api/v1/clientes/:id,
  //   the dialog closes,
  //   the updated values are reflected in the client detail panel AND list immediately
  //   WITHOUT a full page reload (FR27)
  // -------------------------------------------------------------------------
  test('E2E-C-19 — guardar cambios actualiza el panel de detalle y la lista inmediatamente sin recargar', async ({ page }) => {
    // GIVEN — a client exists in the system
    const clienteData = buildCliente({ nombre: 'Empresa Original E2E-C-19' });
    const created = await apiHelper.createCliente(clienteData);
    createdIds.push(created.id);

    // GIVEN — intercept network BEFORE navigation; track PUT calls
    let putCallCount = 0;
    await page.route('**/api/v1/clientes/**', (route) => {
      if (route.request().method() === 'PUT') {
        putCallCount++;
      }
      route.continue();
    });
    await page.route('**/api/v1/clientes', (route) => route.continue());

    await clientesPage.goto();

    // WHEN — user selects the client and opens the edit form
    await clientesPage.seleccionarCliente(clienteData.nombre);
    await expect(clientesPage.detailPanel).toBeVisible();
    await page.getByTestId('btn-editar').click();
    await expect(page.getByTestId('cliente-form-dialog')).toBeVisible();

    // AND — user modifies the Nombre field
    const updatedNombre = 'Empresa Actualizada E2E-C-19';
    await page.getByTestId('input-nombre').fill(updatedNombre);

    // AND — user clicks "Guardar"
    await page.getByTestId('btn-guardar').click();

    // THEN — dialog closes automatically
    await expect(page.getByTestId('cliente-form-dialog')).toBeHidden();

    // AND — exactly one PUT request was fired to the backend
    expect(putCallCount).toBe(1);

    // AND — updated client name is visible in the detail panel WITHOUT page reload
    await expect(clientesPage.detailPanel).toContainText(updatedNombre);

    // AND — updated client name is visible in the list WITHOUT page reload
    await expect(
      clientesPage.clienteItems.filter({ hasText: updatedNombre })
    ).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // E2E-C-20 (P0 · AC3)
  // Given the user has the edit form open
  // When the user clears a required field and clicks "Guardar"
  // Then the Zod schema validation runs on submit:
  //   an inline error message appears under the empty field (FR8),
  //   the form does NOT send any PUT request to the backend,
  //   and the dialog remains open
  // -------------------------------------------------------------------------
  test('E2E-C-20 — limpiar un campo requerido y guardar muestra error inline; no se envía PUT', async ({ page }) => {
    // GIVEN — a client exists in the system
    const clienteData = buildCliente({ nombre: 'Empresa Validacion E2E-C-20' });
    const created = await apiHelper.createCliente(clienteData);
    createdIds.push(created.id);

    // GIVEN — intercept network BEFORE navigation; abort if PUT fires
    let putFired = false;
    await page.route('**/api/v1/clientes/**', (route) => {
      if (route.request().method() === 'PUT') {
        putFired = true;
        route.abort();
      } else {
        route.continue();
      }
    });
    await page.route('**/api/v1/clientes', (route) => route.continue());

    await clientesPage.goto();

    // WHEN — user selects the client and opens the edit form
    await clientesPage.seleccionarCliente(clienteData.nombre);
    await expect(clientesPage.detailPanel).toBeVisible();
    await page.getByTestId('btn-editar').click();
    await expect(page.getByTestId('cliente-form-dialog')).toBeVisible();

    // AND — user clears the required Nombre field
    await page.getByTestId('input-nombre').clear();

    // AND — user clicks "Guardar"
    await page.getByTestId('btn-guardar').click();

    // THEN — dialog remains open (form was NOT submitted)
    await expect(page.getByTestId('cliente-form-dialog')).toBeVisible();

    // AND — inline validation error appears for the empty Nombre field
    await expect(
      page.getByText(/nombre es requerido|el nombre/i).first()
    ).toBeVisible();

    // AND — no PUT request was fired
    expect(putFired).toBe(false);
  });

  // -------------------------------------------------------------------------
  // E2E-C-21 (P1 · AC2)
  // Given the user has successfully saved changes to a client
  // When the PUT /api/v1/clientes/:id returns 200
  // Then a toast notification "Cliente actualizado correctamente" appears
  // -------------------------------------------------------------------------
  test('E2E-C-21 — toast "Cliente actualizado correctamente" aparece tras edición exitosa', async ({ page }) => {
    // GIVEN — a client exists in the system
    const clienteData = buildCliente({ nombre: 'Empresa Toast E2E-C-21' });
    const created = await apiHelper.createCliente(clienteData);
    createdIds.push(created.id);

    // GIVEN — intercept network BEFORE navigation (network-first pattern)
    await page.route('**/api/v1/clientes**', (route) => route.continue());

    await clientesPage.goto();

    // WHEN — user selects the client, opens the edit form, modifies a field, and saves
    await clientesPage.seleccionarCliente(clienteData.nombre);
    await expect(clientesPage.detailPanel).toBeVisible();
    await page.getByTestId('btn-editar').click();
    await expect(page.getByTestId('cliente-form-dialog')).toBeVisible();

    const updatedNombre = 'Empresa Toast Actualizada E2E-C-21';
    await page.getByTestId('input-nombre').fill(updatedNombre);
    await page.getByTestId('btn-guardar').click();

    // THEN — success toast with the Spanish message is visible
    await expect(
      page.getByText(/cliente actualizado correctamente/i)
    ).toBeVisible();

    // Track created id for cleanup (nombre changed so need to find by original id)
    // already tracked via createdIds
  });

  // -------------------------------------------------------------------------
  // E2E-C-22 (P1 · AC4)
  // Given the user has the edit form open and has modified a field
  // When the user clicks "Cancelar"
  // Then the dialog closes WITHOUT firing a PUT request to the backend,
  //   AND the original client data remains unchanged in the detail panel and list
  // -------------------------------------------------------------------------
  test('E2E-C-22 — "Cancelar" cierra el formulario sin hacer PUT; los datos originales se conservan', async ({ page }) => {
    // GIVEN — a client exists in the system
    const clienteData = buildCliente({ nombre: 'Empresa Cancelar E2E-C-22' });
    const created = await apiHelper.createCliente(clienteData);
    createdIds.push(created.id);

    // GIVEN — intercept network BEFORE navigation; track PUT calls
    let putFired = false;
    await page.route('**/api/v1/clientes/**', (route) => {
      if (route.request().method() === 'PUT') {
        putFired = true;
      }
      route.continue();
    });
    await page.route('**/api/v1/clientes', (route) => route.continue());

    await clientesPage.goto();

    // WHEN — user selects the client and opens the edit form
    await clientesPage.seleccionarCliente(clienteData.nombre);
    await expect(clientesPage.detailPanel).toBeVisible();
    await page.getByTestId('btn-editar').click();
    await expect(page.getByTestId('cliente-form-dialog')).toBeVisible();

    // AND — user modifies the Nombre field (but does NOT save)
    await page.getByTestId('input-nombre').fill('Nombre Modificado Sin Guardar');

    // AND — user clicks "Cancelar"
    await page.getByTestId('btn-cancelar').click();

    // THEN — dialog closes
    await expect(page.getByTestId('cliente-form-dialog')).toBeHidden();

    // AND — no PUT request was fired
    expect(putFired).toBe(false);

    // AND — the original client name is still visible in the detail panel
    await expect(clientesPage.detailPanel).toContainText(clienteData.nombre);

    // AND — the original client name is still visible in the list
    await expect(
      clientesPage.clienteItems.filter({ hasText: clienteData.nombre })
    ).toBeVisible();
  });
});

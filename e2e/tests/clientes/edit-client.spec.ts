import { test, expect } from '../../fixtures/base.fixture';
import { ClientesPage } from '../../pages/clientes.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

/**
 * Story 2.4 — Edit Client (TC-E2-P1-08, TC-E2-P1-09, TC-E2-P1-10, TC-E2-P1-15).
 *
 * Covers the full edit-client user journey end-to-end:
 *   AC #1 — "Editar" opens the ClienteForm pre-filled with the current values
 *   AC #2 — successful submit updates the client, reflected in detail + list
 *           immediately (no reload), exact success toast shown
 *   AC #3 — backend independently validates (covered at the API/component level,
 *           not duplicated here as a UI journey)
 *   AC #4 — clearing a required field shows an inline error, no backend call
 *   AC #5 — duplicate NIT/RUC (from a different client) shows a friendly error,
 *           form stays open with data intact
 *   AC #6 — "Cancelar" makes zero API calls, original data remains unchanged
 *   AC #7 — self-update with the client's own unchanged NIT/RUC succeeds
 *
 * RED PHASE: `PUT /api/v1/clientes/{id}` does not exist on the backend yet, and
 * the "Editar" trigger/edit-mode wiring do not exist on the frontend yet
 * (Story 2.4, Tasks 3 and 5). These tests are expected to fail until the
 * corresponding implementation tasks are complete.
 */
test.describe('Editar Cliente (Story 2.4)', () => {
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

  test('TC-E2-P1-08 — AC #1: "Editar" opens the form pre-filled with the current values', async () => {
    // GIVEN: an existing client is selected in the detail view
    const data = buildCliente();
    const seeded = await apiHelper.createCliente(data);
    createdIds.push(seeded.id);
    await clientesPage.gotoDetail(seeded.id);

    // WHEN: the user clicks "Editar"
    await clientesPage.abrirFormularioEditar();

    // THEN: the form is pre-filled with the client's current values
    await expect(clientesPage.inputNombre).toHaveValue(data.nombre);
    await expect(clientesPage.inputNit).toHaveValue(data.nit);
    await expect(clientesPage.inputTelefono).toHaveValue(data.telefono);
    await expect(clientesPage.inputCiudad).toHaveValue(data.ciudad);
  });

  test('TC-E2-P1-09 — AC #2: saving changes updates the detail panel immediately and shows the exact success toast', async ({ page }) => {
    // GIVEN: an existing client is selected, edit form open
    const data = buildCliente();
    const seeded = await apiHelper.createCliente(data);
    createdIds.push(seeded.id);
    await clientesPage.gotoDetail(seeded.id);
    await clientesPage.abrirFormularioEditar();

    // WHEN: the user changes Ciudad and saves
    await clientesPage.inputCiudad.fill('Cartagena');
    await clientesPage.guardar();

    // THEN: the detail panel reflects the change immediately, no manual refresh
    await expect(clientesPage.detailPanel).toContainText('Cartagena');
    // AND: the exact Spanish success toast copy is shown
    await expect(page.getByText('Cliente actualizado correctamente')).toBeVisible();
  });

  test('TC-E2-P1-09 — AC #2: the updated client also reflects the change in the list without a page reload', async () => {
    // GIVEN: an existing client is selected, edit form open
    const data = buildCliente();
    const seeded = await apiHelper.createCliente(data);
    createdIds.push(seeded.id);
    await clientesPage.gotoDetail(seeded.id);
    await clientesPage.abrirFormularioEditar();

    // WHEN: the user changes Nombre and saves
    const nuevoNombre = `${data.nombre} Actualizado`;
    await clientesPage.inputNombre.fill(nuevoNombre);
    await clientesPage.guardar();

    // THEN: the client list shows the updated Nombre immediately
    await expect(clientesPage.clienteItems.filter({ hasText: nuevoNombre })).toBeVisible();
  });

  test('AC #4 — TC-E2-P1-10: clearing a required field blocks submit with an inline error', async () => {
    // GIVEN: an existing client selected, edit form open
    const data = buildCliente();
    const seeded = await apiHelper.createCliente(data);
    createdIds.push(seeded.id);
    await clientesPage.gotoDetail(seeded.id);
    await clientesPage.abrirFormularioEditar();

    // WHEN: the user clears the required Nombre field and submits
    await clientesPage.inputNombre.fill('');
    await clientesPage.btnGuardar.click();

    // THEN: the form remains open with an inline validation error, no update persisted
    await expect(clientesPage.form).toBeVisible();
    await expect(clientesPage.page.getByText(/requerido|obligatorio/i).first()).toBeVisible();
  });

  test('AC #5: submitting a NIT/RUC that collides with a different client shows the conflict error and keeps data intact', async () => {
    // GIVEN: two existing clients
    const other = buildCliente();
    const seededOther = await apiHelper.createCliente(other);
    createdIds.push(seededOther.id);
    const data = buildCliente();
    const seeded = await apiHelper.createCliente(data);
    createdIds.push(seeded.id);

    await clientesPage.gotoDetail(seeded.id);
    await clientesPage.abrirFormularioEditar();

    // WHEN: the user changes the NIT/RUC to the OTHER client's NIT and submits
    await clientesPage.inputNit.fill(other.nit);
    await clientesPage.btnGuardar.click();

    // THEN: a friendly error is shown, the form stays open, entered data is intact
    await expect(clientesPage.form).toBeVisible();
    await expect(clientesPage.page.getByText('El NIT/RUC ya está registrado')).toBeVisible();
    await expect(clientesPage.inputNit).toHaveValue(other.nit);
  });

  test('AC #6 — TC-E2-P1-15: "Cancelar" makes zero API calls and preserves the original client data', async ({ page }) => {
    // GIVEN: an existing client selected, edit form open
    const data = buildCliente();
    const seeded = await apiHelper.createCliente(data);
    createdIds.push(seeded.id);
    await clientesPage.gotoDetail(seeded.id);
    await clientesPage.abrirFormularioEditar();

    // GIVEN: a spy on any PUT request to the clientes endpoint
    let putCallCount = 0;
    await page.route('**/api/v1/clientes/**', async (route) => {
      if (route.request().method() === 'PUT') {
        putCallCount += 1;
      }
      await route.continue();
    });

    // WHEN: the user modifies a field but clicks "Cancelar" instead of saving
    await clientesPage.inputCiudad.fill('Ciudad Que No Debe Guardarse');
    await clientesPage.cancelar();

    // THEN: zero API calls were made and the original data remains displayed
    expect(putCallCount).toBe(0);
    await expect(clientesPage.detailPanel).toContainText(data.ciudad);
    await expect(clientesPage.detailPanel).not.toContainText('Ciudad Que No Debe Guardarse');
  });

  test('AC #7: editing with the client\'s own unchanged NIT/RUC succeeds (self-exclusion)', async ({ page }) => {
    // GIVEN: an existing client selected, edit form open
    const data = buildCliente();
    const seeded = await apiHelper.createCliente(data);
    createdIds.push(seeded.id);
    await clientesPage.gotoDetail(seeded.id);
    await clientesPage.abrirFormularioEditar();

    // WHEN: the user changes only Ciudad, leaving NIT/RUC untouched, and saves
    await clientesPage.inputCiudad.fill('Ibagué');
    await clientesPage.guardar();

    // THEN: the update succeeds — no false 409 for the unchanged NIT/RUC
    await expect(page.getByText('Cliente actualizado correctamente')).toBeVisible();
    await expect(clientesPage.detailPanel).toContainText('Ibagué');
  });
});

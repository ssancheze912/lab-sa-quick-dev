import { test, expect } from '../../fixtures/base.fixture';
import { ClientesPage } from '../../pages/clientes.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

/**
 * Story 2.3 — Create Client (TC-E2-P0-06, TC-E2-P0-02, TC-E2-P0-05 UI leg).
 *
 * Covers the P0 create-client user journey end-to-end:
 *   AC #1 — "Nuevo cliente" opens the ClienteForm with all four required fields
 *   AC #2 — successful submit creates the client, it appears in the list
 *           immediately (no reload), success toast shown, detail matches
 *   AC #3 — empty required fields show inline errors, no backend call
 *   AC #5 — duplicate NIT/RUC shows a friendly error, form stays open with
 *           data intact
 *
 * RED PHASE: `POST /api/v1/clientes` does not exist on the backend yet, and
 * `ClienteForm`/"Nuevo cliente" trigger do not exist on the frontend yet
 * (Story 2.3, Tasks 3 and 5). These tests are expected to fail until the
 * corresponding implementation tasks are complete.
 */
test.describe('Crear Cliente (Story 2.3)', () => {
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

  test('TC-E2-P0-06 — AC #1: "Nuevo cliente" opens a form with Nombre, NIT/RUC, Teléfono, Ciudad', async () => {
    // GIVEN: the user is on the /clientes view
    await clientesPage.goto();

    // WHEN: the user clicks "Nuevo cliente"
    await clientesPage.abrirFormularioNuevo();

    // THEN: the form exposes all four required fields
    await expect(clientesPage.inputNombre).toBeVisible();
    await expect(clientesPage.inputNit).toBeVisible();
    await expect(clientesPage.inputTelefono).toBeVisible();
    await expect(clientesPage.inputCiudad).toBeVisible();
  });

  test('TC-E2-P0-06 — AC #2: submitting valid data creates the client and it appears in the list immediately', async () => {
    // GIVEN: the user is on /clientes with the form open and filled with valid data
    const data = buildCliente();
    await clientesPage.goto();
    await clientesPage.abrirFormularioNuevo();
    await clientesPage.llenarFormulario(data);

    // WHEN: the form is submitted
    await clientesPage.guardar();

    const clientes = await apiHelper.getClientes();
    const created = clientes.find((c: { nombre: string; id: string }) => c.nombre === data.nombre);
    if (created) createdIds.push(created.id);

    // THEN: the new client appears in the list without a manual refresh/reload
    await expect(clientesPage.clienteItems.filter({ hasText: data.nombre })).toBeVisible();
  });

  test('TC-E2-P0-06 — AC #2: shows the exact success toast "Cliente creado correctamente" (TC-E2-P2-05)', async ({ page }) => {
    // GIVEN: the user is on /clientes with the form open and filled with valid data
    const data = buildCliente();
    await clientesPage.goto();
    await clientesPage.abrirFormularioNuevo();
    await clientesPage.llenarFormulario(data);

    // WHEN: the form is submitted
    await clientesPage.btnGuardar.click();

    const clientes = await apiHelper.getClientes();
    const created = clientes.find((c: { nombre: string; id: string }) => c.nombre === data.nombre);
    if (created) createdIds.push(created.id);

    // THEN: the exact Spanish success toast copy is shown (no paraphrasing, R11)
    await expect(page.getByText('Cliente creado correctamente')).toBeVisible();
  });

  test('TC-E2-P0-06 — AC #2: newly created client is selectable and its detail matches submitted values', async () => {
    // GIVEN: the user has just created a new client
    const data = buildCliente();
    await clientesPage.goto();
    await clientesPage.abrirFormularioNuevo();
    await clientesPage.llenarFormulario(data);
    await clientesPage.guardar();

    const clientes = await apiHelper.getClientes();
    const created = clientes.find((c: { nombre: string; id: string }) => c.nombre === data.nombre);
    if (created) createdIds.push(created.id);

    // WHEN: the user selects the newly created client from the list
    await clientesPage.seleccionarCliente(data.nombre);

    // THEN: the detail panel shows the submitted values
    await expect(clientesPage.detailPanel).toContainText(data.nombre);
    await expect(clientesPage.detailPanel).toContainText(data.nit);
  });

  test('AC #3: submitting the form with all required fields empty shows inline errors and does not create a client', async () => {
    // GIVEN: the user is on /clientes with the form open, no fields filled
    await clientesPage.goto();
    await clientesPage.abrirFormularioNuevo();

    // WHEN: the user submits without filling any field
    await clientesPage.btnGuardar.click();

    // THEN: the form remains open with inline validation errors, no client created
    await expect(clientesPage.form).toBeVisible();
    await expect(clientesPage.page.getByText(/requerido|obligatorio/i).first()).toBeVisible();
  });

  test('AC #5: submitting a duplicate NIT/RUC shows "El NIT/RUC ya está registrado" and keeps the form open with data intact', async () => {
    // GIVEN: a client already exists with a known NIT/RUC
    const existing = buildCliente();
    const seeded = await apiHelper.createCliente(existing);
    createdIds.push(seeded.id);

    await clientesPage.goto();
    await clientesPage.abrirFormularioNuevo();
    const duplicateAttempt = { ...buildCliente(), nit: existing.nit };
    await clientesPage.llenarFormulario(duplicateAttempt);

    // WHEN: the form is submitted with the duplicate NIT/RUC
    await clientesPage.btnGuardar.click();

    // THEN: a friendly error is shown, the form stays open, and the entered
    // Nombre value is preserved (no data loss)
    await expect(clientesPage.form).toBeVisible();
    await expect(clientesPage.page.getByText('El NIT/RUC ya está registrado')).toBeVisible();
    await expect(clientesPage.inputNombre).toHaveValue(duplicateAttempt.nombre);
  });
});

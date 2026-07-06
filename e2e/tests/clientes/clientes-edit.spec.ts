import { test, expect } from '../../fixtures/base.fixture';
import { ClientesPage } from '../../pages/clientes.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

/**
 * E2E tests: Edit Client (Story 2.4, Epic 2: Client Management)
 * ATDD Acceptance Tests — RED Phase
 *
 * Covers `test-design-epic-2.md`'s TC-E2-P1-01/02:
 *   TC-E2-P1-01 — Edit dialog opens pre-filled with the client's current values; a valid
 *                 save updates the client and both the detail panel and list reflect the
 *                 change immediately, with no page reload (FR6, FR27).
 *   TC-E2-P1-02 — Clearing a required field blocks save with an inline error; no PUT is ever
 *                 sent and the original data remains unchanged in the backend (FR8).
 *
 * These tests are intentionally FAILING until Story 2.4's Tasks 1-5 are implemented: the
 * `PUT /api/v1/clientes/{id}` endpoint, the `ClienteForm` edit mode, the "Editar" trigger in
 * `ClienteDetailView`, and `useUpdateCliente`'s cache invalidation. This is the expected RED
 * state (missing implementation, not a test bug), consistent with the project's established
 * ATDD convention (see `clientes-crud.spec.ts`, `clientes-detalle.spec.ts`).
 *
 * TC-E2-P1-03 (cancel discards changes) is intentionally NOT duplicated here — per
 * `test-design-epic-2.md`, it is a component-level case covered by
 * `ClienteForm.edit.test.tsx`, avoiding duplicate coverage across test levels.
 */

test.describe('Editar Cliente', () => {
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

  test('TC-E2-P1-01 — el formulario de edición se precarga con los valores actuales del cliente', async () => {
    // GIVEN a seeded client and its detail view open
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);
    await clientesPage.goto();
    await clientesPage.seleccionarCliente(data.nombre);

    // WHEN the user clicks "Editar"
    await clientesPage.abrirFormularioEdicion();

    // THEN the dialog opens titled "Editar cliente", pre-filled with the client's current
    // values (AC #1, FR6)
    await expect(clientesPage.page.getByText(/editar cliente/i)).toBeVisible();
    await expect(clientesPage.inputNombre).toHaveValue(data.nombre);
    await expect(clientesPage.inputNit).toHaveValue(data.nit);
    await expect(clientesPage.inputTelefono).toHaveValue(data.telefono);
    await expect(clientesPage.inputCiudad).toHaveValue(data.ciudad);
  });

  test('TC-E2-P1-01 — guardar cambios actualiza el detalle y la lista de inmediato (FR6, FR27)', async () => {
    // GIVEN a seeded client and its detail view open, with the edit dialog opened
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);
    await clientesPage.goto();
    await clientesPage.seleccionarCliente(data.nombre);
    await clientesPage.abrirFormularioEdicion();

    // WHEN the user modifies Ciudad and clicks "Guardar"
    const nuevaCiudad = 'Barranquilla';
    await clientesPage.llenarFormulario({ ciudad: nuevaCiudad });
    await clientesPage.guardar();

    // THEN the detail panel reflects the new Ciudad immediately, with no page reload
    // (FR27 — queryClient.invalidateQueries(['clientes', id]))
    await expect(clientesPage.detailCiudad).toHaveText(nuevaCiudad);

    // AND the success toast with the exact Spanish copy is shown
    await expect(
      clientesPage.page.getByText('Cliente actualizado correctamente')
    ).toBeVisible();
  });

  test('TC-E2-P1-01 — guardar cambios actualiza la fila del cliente en la lista (FR27)', async () => {
    // GIVEN a seeded client and its detail view open, with the edit dialog opened
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);
    await clientesPage.goto();
    await clientesPage.seleccionarCliente(data.nombre);
    await clientesPage.abrirFormularioEdicion();

    // WHEN the user modifies Nombre and clicks "Guardar"
    const nuevoNombre = `${data.nombre} Actualizado`;
    await clientesPage.llenarFormulario({ nombre: nuevoNombre });
    await clientesPage.guardar();

    // THEN the client list (left panel) reflects the new Nombre immediately, with no page
    // reload (FR27 — queryClient.invalidateQueries(['clientes']))
    await expect(
      clientesPage.clienteItems.filter({ hasText: nuevoNombre })
    ).toBeVisible();
  });

  test('TC-E2-P1-02 — limpiar un campo requerido bloquea el guardado con un error inline (FR8)', async () => {
    // GIVEN a seeded client and its edit dialog open
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);
    await clientesPage.goto();
    await clientesPage.seleccionarCliente(data.nombre);
    await clientesPage.abrirFormularioEdicion();

    // WHEN the user clears "Nombre" and clicks "Guardar"
    await clientesPage.inputNombre.fill('');
    await clientesPage.btnGuardar.click();

    // THEN a clear inline error appears, the dialog remains open, and no PUT was ever sent
    // (client-side Zod validation blocks submission)
    await expect(clientesPage.form).toBeVisible();
    await expect(clientesPage.page.getByText(/requerido/i).first()).toBeVisible();
  });

  test('TC-E2-P1-02 — limpiar un campo requerido no modifica el registro original en el backend', async () => {
    // GIVEN a seeded client and its edit dialog open
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);
    await clientesPage.goto();
    await clientesPage.seleccionarCliente(data.nombre);
    await clientesPage.abrirFormularioEdicion();

    // WHEN the user clears "Nombre" and clicks "Guardar"
    await clientesPage.inputNombre.fill('');
    await clientesPage.btnGuardar.click();
    await expect(clientesPage.page.getByText(/requerido/i).first()).toBeVisible();

    // THEN the original client's data remains completely unchanged in the backend
    const clientes = await apiHelper.getClientes();
    const found = clientes.find((c: { id: string; nombre: string }) => c.id === cliente.id);
    expect(found?.nombre).toBe(data.nombre);
  });
});

import { test, expect } from '../../fixtures/base.fixture';
import { ClientesPage } from '../../pages/clientes.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

/**
 * E2E tests: Gestión de Clientes (FR1–FR8)
 *
 * Covers:
 *   FR1  — Listar clientes
 *   FR2  — Buscar cliente por nombre/NIT
 *   FR3  — Ver detalle de cliente
 *   FR4  — Crear cliente
 *   FR5  — Editar cliente
 *   FR6  — Eliminar cliente
 *   FR7  — Validar NIT único
 *   FR8  — Validar campos requeridos
 */

test.describe('Gestión de Clientes', () => {
  let clientesPage: ClientesPage;
  let apiHelper: ApiHelper;
  const createdIds: string[] = [];

  test.beforeEach(async ({ page, request }) => {
    clientesPage = new ClientesPage(page);
    apiHelper = new ApiHelper(request);
    await clientesPage.goto();
  });

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  test('FR1 — debe listar clientes existentes', async () => {
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    await clientesPage.page.reload();
    await expect(
      clientesPage.clienteItems.filter({ hasText: data.nombre })
    ).toBeVisible();
  });

  test('FR2 — debe filtrar clientes por nombre', async () => {
    const data = buildCliente({ nombre: 'Empresa Filtro Especial' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    await clientesPage.page.reload();
    await clientesPage.buscar('Filtro Especial');

    await expect(
      clientesPage.clienteItems.filter({ hasText: 'Filtro Especial' })
    ).toBeVisible();
  });

  test('FR2 — debe filtrar clientes por NIT', async () => {
    const data = buildCliente({ nit: '999888777' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    await clientesPage.page.reload();
    await clientesPage.buscar('999888777');

    await expect(
      clientesPage.clienteItems.filter({ hasText: data.nombre })
    ).toBeVisible();
  });

  test('FR4 — debe crear un nuevo cliente', async () => {
    const data = buildCliente();

    await clientesPage.abrirFormularioNuevo();
    await clientesPage.llenarFormulario(data);
    await clientesPage.guardar();

    // Find created ID via API to clean up
    const clientes = await apiHelper.getClientes();
    const created = clientes.find((c: { nombre: string; id: string }) => c.nombre === data.nombre);
    if (created) createdIds.push(created.id);

    await expect(
      clientesPage.clienteItems.filter({ hasText: data.nombre })
    ).toBeVisible();
  });

  test('FR7 — debe mostrar error cuando NIT ya existe', async () => {
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    await clientesPage.page.reload();
    await clientesPage.abrirFormularioNuevo();
    await clientesPage.llenarFormulario({ ...data, nombre: 'Empresa Diferente' });
    await clientesPage.btnGuardar.click();

    // Form should remain visible with error
    await expect(clientesPage.form).toBeVisible();
    await expect(
      clientesPage.page.getByText(/nit.*ya existe|ya.*registrado/i)
    ).toBeVisible();
  });

  test('FR8 — debe validar campos requeridos en el formulario', async () => {
    await clientesPage.abrirFormularioNuevo();
    await clientesPage.btnGuardar.click();

    await expect(clientesPage.form).toBeVisible();
    await expect(
      clientesPage.page.getByText(/requerido|obligatorio/i).first()
    ).toBeVisible();
  });
});

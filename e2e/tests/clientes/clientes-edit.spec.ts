import { test, expect } from '../../fixtures/base.fixture';
import { ClientesPage } from '../../pages/clientes.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

/**
 * Story 2.4 — E2E tests for editing a cliente.
 *
 * Scenarios (AC #16):
 *   1. Happy path edit
 *   2. Cancelar keeps original data + no stale state on re-open
 *   3. Duplicate NIT shows inline error
 *   4. Required field cleared blocks save
 */
test.describe('Edición de Clientes — Story 2.4', () => {
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

  test('edit cliente happy path', async ({ page }) => {
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    await page.goto(`/clientes/${cliente.id}`);
    await expect(clientesPage.detailPanel).toBeVisible();
    await expect(clientesPage.btnEditarCliente).toBeVisible();

    await clientesPage.btnEditarCliente.click();
    await expect(clientesPage.form).toBeVisible();

    // Verify pre-fill.
    await expect(clientesPage.inputNombre).toHaveValue(data.nombre);
    await expect(clientesPage.inputNit).toHaveValue(data.nit);

    const nuevoNombre = `${data.nombre} EDITADO`;
    await clientesPage.inputNombre.fill(nuevoNombre);
    await clientesPage.btnGuardar.click();

    await expect(clientesPage.toastUpdateSuccess).toBeVisible();
    await expect(clientesPage.detailNombre).toHaveText(nuevoNombre);
    // List item also reflects new nombre.
    await expect(
      clientesPage.clienteItems.filter({ hasText: nuevoNombre }),
    ).toBeVisible();
  });

  test('cancel keeps original data', async ({ page }) => {
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    await page.goto(`/clientes/${cliente.id}`);
    await clientesPage.btnEditarCliente.click();
    await expect(clientesPage.form).toBeVisible();

    await clientesPage.inputNombre.fill('Garbage Draft');
    await clientesPage.btnCancelar.click();

    await expect(clientesPage.form).toBeHidden();
    await expect(clientesPage.toastUpdateSuccess).toBeHidden();
    await expect(clientesPage.detailNombre).toHaveText(data.nombre);

    // Re-open — should show ORIGINAL value, not the garbage draft.
    await clientesPage.btnEditarCliente.click();
    await expect(clientesPage.form).toBeVisible();
    await expect(clientesPage.inputNombre).toHaveValue(data.nombre);
  });

  test('duplicate NIT shows inline error in edit', async ({ page }) => {
    const dataA = buildCliente();
    const dataB = buildCliente();
    const a = await apiHelper.createCliente(dataA);
    const b = await apiHelper.createCliente(dataB);
    createdIds.push(a.id, b.id);

    await page.goto(`/clientes/${b.id}`);
    await clientesPage.btnEditarCliente.click();
    await expect(clientesPage.form).toBeVisible();

    // Change B's NIT to A's NIT — duplicate.
    await clientesPage.inputNit.fill(dataA.nit);
    await clientesPage.btnGuardar.click();

    await expect(clientesPage.formErrorNit).toHaveText(
      /el nit\/ruc ya está registrado/i,
    );
    await expect(clientesPage.form).toBeVisible();
  });

  test('required field cleared blocks save', async ({ page }) => {
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // Intercept PUT and fail if it fires.
    let putCount = 0;
    await page.route(`**/api/v1/clientes/${cliente.id}`, async (route) => {
      if (route.request().method() === 'PUT') {
        putCount += 1;
      }
      await route.continue();
    });

    await page.goto(`/clientes/${cliente.id}`);
    await clientesPage.btnEditarCliente.click();
    await expect(clientesPage.form).toBeVisible();

    await clientesPage.inputNombre.fill('');
    await clientesPage.btnGuardar.click();

    await expect(clientesPage.formErrorNombre).toBeVisible();
    await expect(clientesPage.form).toBeVisible();
    expect(putCount).toBe(0);
  });
});

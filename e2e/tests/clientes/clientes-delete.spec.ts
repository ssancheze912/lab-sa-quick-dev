import { test, expect } from '../../fixtures/base.fixture';
import { ClientesPage } from '../../pages/clientes.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

/**
 * Story 2.5 — E2E tests for deleting a cliente.
 *
 * Scenarios (AC #13):
 *   1. Happy path delete → success toast + URL changes + list removes item
 *   2. Cancel keeps cliente unchanged
 *   3. Esc closes dialog without deletion
 */
test.describe('Eliminación de Clientes — Story 2.5', () => {
  let clientesPage: ClientesPage;
  let apiHelper: ApiHelper;
  const createdIds: string[] = [];

  test.beforeEach(async ({ page, request }) => {
    clientesPage = new ClientesPage(page);
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    // Best-effort cleanup — the happy-path test already deletes; the cancel
    // / esc paths leave the cliente in place. Ignore 404s from already-deleted
    // rows.
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  test('delete cliente happy path', async ({ page }) => {
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    await page.goto(`/clientes/${cliente.id}`);
    await expect(clientesPage.detailPanel).toBeVisible();
    await expect(clientesPage.btnEliminarCliente).toBeVisible();

    await clientesPage.btnEliminarCliente.click();
    await expect(clientesPage.deleteDialog).toBeVisible();

    await clientesPage.btnConfirmarEliminarTestid.click();

    // Success toast visible.
    await expect(clientesPage.toastDeleteSuccess).toBeVisible();

    // URL no longer references the deleted id.
    await page.waitForURL('**/clientes', { timeout: 5_000 });
    expect(page.url()).not.toContain(cliente.id);

    // The cliente is gone from the list.
    await expect(
      clientesPage.clienteItems.filter({ hasText: data.nombre }),
    ).toHaveCount(0);
  });

  test('cancel keeps cliente unchanged', async ({ page }) => {
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    await page.goto(`/clientes/${cliente.id}`);
    await expect(clientesPage.btnEliminarCliente).toBeVisible();

    await clientesPage.btnEliminarCliente.click();
    await expect(clientesPage.deleteDialog).toBeVisible();

    await clientesPage.btnCancelarEliminarTestid.click();

    await expect(clientesPage.deleteDialog).toBeHidden();
    await expect(clientesPage.toastDeleteSuccess).toBeHidden();
    expect(page.url()).toContain(cliente.id);
    await expect(clientesPage.detailNombre).toHaveText(data.nombre);
  });

  test('esc closes delete dialog without deletion', async ({ page }) => {
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // Intercept DELETE — must NOT fire.
    let deleteCount = 0;
    await page.route(`**/api/v1/clientes/${cliente.id}`, async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCount += 1;
      }
      await route.continue();
    });

    await page.goto(`/clientes/${cliente.id}`);
    await clientesPage.btnEliminarCliente.click();
    await expect(clientesPage.deleteDialog).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(clientesPage.deleteDialog).toBeHidden();
    expect(deleteCount).toBe(0);
    expect(page.url()).toContain(cliente.id);
    await expect(clientesPage.detailNombre).toHaveText(data.nombre);
  });
});

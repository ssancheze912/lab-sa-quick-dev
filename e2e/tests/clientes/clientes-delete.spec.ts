import { test, expect } from '../../fixtures/base.fixture';
import { ClientesPage } from '../../pages/clientes.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

/**
 * E2E tests: Delete Client (Story 2.5, Epic 2: Client Management)
 * ATDD Acceptance Tests — RED Phase
 *
 * Covers `test-design-epic-2.md`'s:
 *   TC-E2-P0-05 (Cliente-only portion) — client row removed from the list, list updated with
 *                no page reload, success toast shown. The contacts-cascade portion of this
 *                test case ("contacts survive with clienteId = null, appear under 'Sin
 *                cliente'") is explicitly OUT OF SCOPE for this story — the `Contacto` entity
 *                does not exist yet (created in Story 3.1) and the `contactos.cliente_id` FK
 *                does not exist either (added in Epic 4). See Story 2.5 AC #4 / Dev Notes.
 *   TC-E2-P1-10 — cancel preserves the record (dialog closes, no DELETE sent, record
 *                 unchanged in list and backend).
 *
 * These tests are intentionally FAILING until Story 2.5's Tasks 1-5 are implemented: the
 * `DELETE /api/v1/clientes/{id}` endpoint, the "Eliminar" trigger + confirmation dialog in
 * `ClienteDetailView`, `useDeleteCliente`'s cache invalidation, and the route-level
 * `onDeleted` → `navigate({ to: '/clientes' })` wiring in `clientes.$clienteId.tsx`. This is
 * the expected RED state (missing implementation, not a test bug), consistent with the
 * project's established ATDD convention (see `clientes-edit.spec.ts`, `clientes-crud.spec.ts`).
 *
 * The `btnEliminar`/`btnConfirmarEliminar` locators already exist in `clientes.page.ts`
 * (pre-added for this story).
 */

test.describe('Eliminar Cliente', () => {
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

  test('TC-E2-P0-05 — confirmar eliminación quita el cliente de la lista y muestra el toast de éxito (Cliente-only)', async () => {
    // GIVEN a seeded client and its detail view open
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);
    await clientesPage.goto();
    await clientesPage.seleccionarCliente(data.nombre);

    // WHEN the user clicks "Eliminar" and confirms in the dialog
    await clientesPage.btnEliminar.click();
    await expect(clientesPage.page.getByRole('dialog')).toBeVisible();
    await expect(clientesPage.page.getByText('¿Eliminar este cliente?')).toBeVisible();
    await clientesPage.btnConfirmarEliminar.click();

    // THEN the client row disappears from the list immediately, with no page reload
    // (FR27 — queryClient.invalidateQueries(['clientes']))
    await expect(
      clientesPage.clienteItems.filter({ hasText: data.nombre })
    ).toHaveCount(0);

    // AND the exact Spanish success toast copy is shown
    await expect(
      clientesPage.page.getByText('Cliente eliminado correctamente')
    ).toBeVisible();
  });

  test('TC-E2-P0-05 — confirmar eliminación navega de vuelta al estado vacío por defecto de /clientes', async () => {
    // GIVEN a seeded client and its detail view open
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);
    await clientesPage.goto();
    await clientesPage.seleccionarCliente(data.nombre);

    // WHEN the user clicks "Eliminar" and confirms in the dialog
    await clientesPage.btnEliminar.click();
    await clientesPage.btnConfirmarEliminar.click();

    // THEN the app navigates away from /clientes/:clienteId back to /clientes, so the right
    // panel returns to the default empty state (AC #2) — NOT the "Cliente no encontrado"
    // not-found variant
    await expect(clientesPage.page).toHaveURL(/\/clientes$/);
    await expect(clientesPage.page.getByText(/selecciona un cliente/i)).toBeVisible();
    await expect(clientesPage.notFoundMessage).not.toBeVisible();
  });

  test('TC-E2-P0-05 — la eliminación es persistente en el backend', async () => {
    // GIVEN a seeded client and its detail view open
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);
    await clientesPage.goto();
    await clientesPage.seleccionarCliente(data.nombre);

    // WHEN the user clicks "Eliminar" and confirms in the dialog
    await clientesPage.btnEliminar.click();
    await clientesPage.btnConfirmarEliminar.click();
    await expect(
      clientesPage.page.getByText('Cliente eliminado correctamente')
    ).toBeVisible();

    // THEN the client is genuinely gone from the backend, not just hidden client-side
    const clientes = await apiHelper.getClientes();
    const found = clientes.find((c: { id: string }) => c.id === cliente.id);
    expect(found).toBeUndefined();
  });

  test('TC-E2-P1-10 — cancelar la eliminación cierra el diálogo sin enviar DELETE', async () => {
    // GIVEN a seeded client and its detail view open, with the delete confirmation dialog open
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);
    await clientesPage.goto();
    await clientesPage.seleccionarCliente(data.nombre);
    await clientesPage.btnEliminar.click();
    await expect(clientesPage.page.getByRole('dialog')).toBeVisible();

    // WHEN the user clicks "Cancelar" instead of "Confirmar"
    await clientesPage.btnCancelar.click();

    // THEN the dialog closes and the record remains completely unchanged — still selected
    // in the detail panel, still present in the list
    await expect(clientesPage.page.getByRole('dialog')).toBeHidden();
    await expect(clientesPage.detailNombre).toHaveText(data.nombre);
    await expect(
      clientesPage.clienteItems.filter({ hasText: data.nombre })
    ).toBeVisible();
  });

  test('TC-E2-P1-10 — cancelar la eliminación no modifica el registro original en el backend', async () => {
    // GIVEN a seeded client and its delete confirmation dialog open
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);
    await clientesPage.goto();
    await clientesPage.seleccionarCliente(data.nombre);
    await clientesPage.btnEliminar.click();
    await expect(clientesPage.page.getByRole('dialog')).toBeVisible();

    // WHEN the user clicks "Cancelar"
    await clientesPage.btnCancelar.click();
    await expect(clientesPage.page.getByRole('dialog')).toBeHidden();

    // THEN the client still exists, unchanged, in the backend
    const clientes = await apiHelper.getClientes();
    const found = clientes.find((c: { id: string; nombre: string }) => c.id === cliente.id);
    expect(found?.nombre).toBe(data.nombre);
  });
});

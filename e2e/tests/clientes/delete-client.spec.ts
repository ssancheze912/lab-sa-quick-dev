import { test, expect } from '../../fixtures/base.fixture';
import { ClientesPage } from '../../pages/clientes.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente, buildContacto } from '../../helpers/data.helper';

/**
 * Story 2.5 — Delete Client (TC-E2-P0-03, TC-E2-P0-04, TC-E2-P1-11, TC-E2-P2-03,
 * TC-E2-P2-07).
 *
 * Covers the full delete-client user journey end-to-end:
 *   AC #1 — "Eliminar" opens a confirmation dialog (siesa-ui-kit AlertDialog)
 *           asking "¿Eliminar este cliente?" with "Confirmar"/"Cancelar"
 *   AC #2 — confirming deletion of a client with NO associated contacts
 *           removes it from the list immediately, right panel returns to
 *           empty state, exact toast "Cliente eliminado correctamente"
 *   AC #3 — confirming deletion of a client WITH associated contacts deletes
 *           the client but preserves the contacts (orphaned, cliente_id =
 *           NULL at the DB/FK level), exact orphaning toast copy
 *   AC #4 — "Cancelar" makes zero DELETE calls, client remains unchanged
 *   AC #5 — Esc/backdrop dismissal makes zero DELETE calls (covered at the
 *           component level in ClienteDetailView.test.tsx; not duplicated
 *           here as a full E2E journey per test-level selection guidance)
 *   AC #6 — 404 for a non-existent id (covered at the API/component level)
 *
 * RED PHASE: `DELETE /api/v1/clientes/{id}` does not exist on the backend
 * yet, and the "Eliminar" trigger/confirmation dialog do not exist on the
 * frontend yet (Story 2.5, Tasks 2 and 5). These tests are expected to fail
 * until the corresponding implementation tasks are complete.
 *
 * Contact seeding for AC #3 (R2/TC-E2-P0-03): Contacto has no CRUD API yet
 * (full Contacto feature is Epic 3 scope) — `ApiHelper.createContacto`
 * targets `POST /api/v1/contactos`, a minimal test-only seeding surface this
 * story's Task 1 groundwork (ContactoEntity + migration) is expected to make
 * available at least for direct-insert/test purposes. If that seed endpoint
 * is not exposed by the time this story reaches GREEN, the dev team must
 * provide an equivalent minimal seeding mechanism (e.g. a test-only endpoint
 * or direct DB insert helper) — the assertions below (contacts survive with
 * clienteId === null after the parent client is deleted) are the acceptance
 * contract regardless of the seeding mechanism's final shape.
 */
test.describe('Eliminar Cliente (Story 2.5)', () => {
  let clientesPage: ClientesPage;
  let apiHelper: ApiHelper;
  const createdClienteIds: string[] = [];
  const createdContactoIds: string[] = [];

  test.beforeEach(async ({ page, request }) => {
    clientesPage = new ClientesPage(page);
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdContactoIds) {
      await apiHelper.deleteContacto(id).catch(() => null);
    }
    createdContactoIds.length = 0;
    for (const id of createdClienteIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdClienteIds.length = 0;
  });

  test('TC-E2-P0-04 — AC #1: "Eliminar" opens a confirmation dialog asking "¿Eliminar este cliente?"', async () => {
    // GIVEN: an existing client is selected in the detail view
    const data = buildCliente();
    const seeded = await apiHelper.createCliente(data);
    createdClienteIds.push(seeded.id);
    await clientesPage.gotoDetail(seeded.id);

    // WHEN: the user clicks "Eliminar"
    await clientesPage.abrirDialogoEliminar();

    // THEN: the dialog shows "Confirmar" and "Cancelar" actions
    await expect(clientesPage.btnConfirmarEliminar).toBeVisible();
    await expect(clientesPage.btnCancelar).toBeVisible();
  });

  test('TC-E2-P2-07 — AC #2: deleting a client with no contacts removes it from the list and shows the exact success toast', async ({ page }) => {
    // GIVEN: an existing client with no associated contacts, selected in the detail view
    const data = buildCliente();
    const seeded = await apiHelper.createCliente(data);
    createdClienteIds.push(seeded.id);
    await clientesPage.gotoDetail(seeded.id);
    await clientesPage.abrirDialogoEliminar();

    // WHEN: the user confirms the deletion
    await clientesPage.confirmarEliminar();

    // THEN: the exact Spanish success toast copy is shown
    await expect(page.getByText('Cliente eliminado correctamente')).toBeVisible();
    // AND: the client is removed from the list immediately (no manual refresh)
    await expect(clientesPage.clienteItems.filter({ hasText: data.nombre })).toHaveCount(0);
    // AND: the right panel returns to the empty/default state
    await expect(clientesPage.detailEmptyState).toBeVisible();
    createdClienteIds.splice(createdClienteIds.indexOf(seeded.id), 1);
  });

  test('AC #2: the deleted client is not retrievable via the API afterwards (actually persisted, not just UI-hidden)', async () => {
    // GIVEN: an existing client with no contacts, selected in the detail view
    const data = buildCliente();
    const seeded = await apiHelper.createCliente(data);
    createdClienteIds.push(seeded.id);
    await clientesPage.gotoDetail(seeded.id);
    await clientesPage.abrirDialogoEliminar();

    // WHEN: the user confirms the deletion
    await clientesPage.confirmarEliminar();
    await expect(clientesPage.detailEmptyState).toBeVisible();

    // THEN: the client no longer appears in a fresh API-level fetch of all clients
    const remaining = await apiHelper.getClientes();
    expect(remaining.some((c: { id: string }) => c.id === seeded.id)).toBe(false);
    createdClienteIds.splice(createdClienteIds.indexOf(seeded.id), 1);
  });

  test('TC-E2-P0-03/TC-E2-P0-04 — AC #3: deleting a client WITH associated contacts preserves the contacts and shows the orphaning toast', async ({ page }) => {
    // GIVEN: an existing client seeded with an associated contact
    const data = buildCliente();
    const seeded = await apiHelper.createCliente(data);
    createdClienteIds.push(seeded.id);
    const contactoData = buildContacto({ clienteId: seeded.id });
    const seededContacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(seededContacto.id);
    await clientesPage.gotoDetail(seeded.id);
    await clientesPage.abrirDialogoEliminar();

    // WHEN: the user confirms the deletion
    await clientesPage.confirmarEliminar();

    // THEN: the exact orphaning toast copy is shown — must never be the plain variant (R11)
    await expect(
      page.getByText('Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.'),
    ).toBeVisible();
    await expect(page.getByText('Cliente eliminado correctamente', { exact: true })).not.toBeVisible();
    createdClienteIds.splice(createdClienteIds.indexOf(seeded.id), 1);
  });

  test('TC-E2-P0-03 (R2) — AC #3: the associated contact still exists with clienteId null after the parent client is deleted', async () => {
    // GIVEN: an existing client seeded with an associated contact
    const data = buildCliente();
    const seeded = await apiHelper.createCliente(data);
    createdClienteIds.push(seeded.id);
    const contactoData = buildContacto({ clienteId: seeded.id });
    const seededContacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(seededContacto.id);
    await clientesPage.gotoDetail(seeded.id);
    await clientesPage.abrirDialogoEliminar();

    // WHEN: the user confirms the deletion
    await clientesPage.confirmarEliminar();
    await expect(clientesPage.detailEmptyState).toBeVisible();
    createdClienteIds.splice(createdClienteIds.indexOf(seeded.id), 1);

    // THEN: the contact record survives (NOT cascade-deleted) with clienteId
    // orphaned to null — the single most important assertion in the epic (R2)
    const contactos = await apiHelper.getContactos();
    const survivingContacto = contactos.find((c: { id: string }) => c.id === seededContacto.id);
    expect(survivingContacto).toBeDefined();
    expect(survivingContacto.clienteId).toBeNull();
  });

  test('TC-E2-P1-11 — AC #4: "Cancelar" makes zero DELETE calls and the client remains unchanged', async () => {
    // GIVEN: an existing client selected, delete confirmation dialog open
    const data = buildCliente();
    const seeded = await apiHelper.createCliente(data);
    createdClienteIds.push(seeded.id);
    await clientesPage.gotoDetail(seeded.id);
    await clientesPage.abrirDialogoEliminar();

    // GIVEN: a spy on any DELETE request to the clientes endpoint
    let deleteCallCount = 0;
    await clientesPage.page.route('**/api/v1/clientes/**', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCallCount += 1;
      }
      await route.continue();
    });

    // WHEN: the user clicks "Cancelar" instead of confirming
    await clientesPage.btnCancelar.click();

    // THEN: zero DELETE API calls were made
    expect(deleteCallCount).toBe(0);
    // AND: the client detail panel still shows the (unchanged) client
    await expect(clientesPage.detailPanel).toContainText(data.nombre);
    // AND: the client still exists via the API
    const remaining = await apiHelper.getClientes();
    expect(remaining.some((c: { id: string }) => c.id === seeded.id)).toBe(true);
  });

  test('the full clientes E2E suite journey remains green: creating, then deleting, a client with no contacts', async ({ page }) => {
    // GIVEN: a brand-new client created directly through the UI flow (not the API)
    const data = buildCliente();
    await clientesPage.goto();
    await clientesPage.abrirFormularioNuevo();
    await clientesPage.llenarFormulario(data);
    await clientesPage.guardar();
    await expect(page.getByText('Cliente creado correctamente')).toBeVisible();
    await clientesPage.seleccionarCliente(data.nombre);

    // WHEN: the user deletes that same client
    await clientesPage.abrirDialogoEliminar();
    await clientesPage.confirmarEliminar();

    // THEN: the success toast and empty state confirm the full create->delete
    // journey works end-to-end without regressing Stories 2.1-2.4's flows
    await expect(page.getByText('Cliente eliminado correctamente')).toBeVisible();
    await expect(clientesPage.clienteItems.filter({ hasText: data.nombre })).toHaveCount(0);
  });
});

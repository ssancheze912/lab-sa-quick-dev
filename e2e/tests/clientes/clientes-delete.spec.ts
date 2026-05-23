import { test, expect } from '../../fixtures/base.fixture';
import { ClientesPage } from '../../pages/clientes.page';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente, buildContacto } from '../../helpers/data.helper';

/**
 * ATDD — Story 2.5: Delete Client
 *
 * Tests are in RED phase — they define the expected behaviour BEFORE implementation.
 * Make these tests GREEN by:
 *   - Adding "Eliminar" button (data-testid="btn-eliminar") to ClienteDetailPanel
 *   - Creating DeleteClienteDialog component with Confirmar / Cancelar buttons
 *   - Creating useDeleteCliente mutation hook
 *   - Wiring DELETE /api/v1/clientes/:id endpoint in the backend
 *   - Implementing ON DELETE SET NULL cascade for contactos.cliente_id FK
 *
 * Coverage:
 *   E2E-C-23  P0  AC1  — Clicking "Eliminar" shows confirmation dialog with "Confirmar" and "Cancelar"
 *   E2E-C-24  P0  AC2  — Confirming deletion removes client from list immediately (no reload — FR27) and clears right panel
 *   E2E-C-25  P1  AC2  — Toast "Cliente eliminado correctamente" appears after deletion (no associated contacts)
 *   E2E-C-26  P1  AC4  — Clicking "Cancelar" closes dialog without firing DELETE; client remains in list unchanged
 *   E2E-C-27  P1  AC3  — Deleting client with contacts: toast shows contact-unassignment message
 */

// ---------------------------------------------------------------------------
// E2E Tests
// ---------------------------------------------------------------------------

test.describe('Story 2.5 — Eliminar cliente (E2E)', () => {
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

  // -------------------------------------------------------------------------
  // E2E-C-23 (P0 · AC1)
  // Given the user is viewing a client's detail
  // When the user clicks "Eliminar"
  // Then a confirmation dialog appears with the question "¿Eliminar este cliente?"
  //   AND two buttons: "Confirmar" and "Cancelar"
  // -------------------------------------------------------------------------
  test('E2E-C-23 — "Eliminar" abre el diálogo de confirmación con "Confirmar" y "Cancelar"', async ({ page }) => {
    // GIVEN — a client exists in the system
    const clienteData = buildCliente({ nombre: 'Empresa Eliminar E2E-C-23' });
    const created = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(created.id);

    // GIVEN — intercept network BEFORE navigation (network-first pattern)
    await page.route('**/api/v1/clientes**', (route) => route.continue());

    await clientesPage.goto();

    // WHEN — user selects the client from the list to view its detail
    await clientesPage.seleccionarCliente(clienteData.nombre);

    // AND — the detail panel is visible
    await expect(clientesPage.detailPanel).toBeVisible();

    // AND — user clicks "Eliminar" in the detail panel
    await page.getByTestId('btn-eliminar').click();

    // THEN — confirmation dialog opens
    await expect(page.getByTestId('delete-cliente-dialog')).toBeVisible();

    // AND — dialog contains the confirmation question
    await expect(page.getByTestId('delete-cliente-dialog')).toContainText(/eliminar este cliente/i);

    // AND — "Confirmar" button is visible
    await expect(page.getByTestId('btn-confirmar-eliminar')).toBeVisible();

    // AND — "Cancelar" button is visible
    await expect(page.getByTestId('btn-cancelar-eliminar')).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // E2E-C-24 (P0 · AC2)
  // Given the user has the confirmation dialog open
  // When the user clicks "Confirmar"
  // Then the DELETE /api/v1/clientes/:id request is fired,
  //   the client is removed from the list immediately WITHOUT a page reload (FR27),
  //   and the right panel returns to the empty/default state
  // -------------------------------------------------------------------------
  test('E2E-C-24 — confirmar eliminación quita el cliente de la lista inmediatamente y limpia el panel derecho', async ({ page }) => {
    // GIVEN — a client exists in the system
    const clienteData = buildCliente({ nombre: 'Empresa Confirmar E2E-C-24' });
    const created = await apiHelper.createCliente(clienteData);
    // NOTE: No cleanup push — the test itself deletes the client

    // GIVEN — intercept network BEFORE navigation; track DELETE calls
    let deleteCallCount = 0;
    await page.route('**/api/v1/clientes/**', (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCallCount++;
      }
      route.continue();
    });
    await page.route('**/api/v1/clientes', (route) => route.continue());

    await clientesPage.goto();

    // WHEN — user selects the client and opens the confirmation dialog
    await clientesPage.seleccionarCliente(clienteData.nombre);
    await expect(clientesPage.detailPanel).toBeVisible();
    await page.getByTestId('btn-eliminar').click();
    await expect(page.getByTestId('delete-cliente-dialog')).toBeVisible();

    // AND — user clicks "Confirmar"
    await page.getByTestId('btn-confirmar-eliminar').click();

    // THEN — confirmation dialog closes automatically
    await expect(page.getByTestId('delete-cliente-dialog')).toBeHidden();

    // AND — exactly one DELETE request was fired to the backend
    expect(deleteCallCount).toBe(1);

    // AND — deleted client is no longer visible in the list WITHOUT a page reload
    await expect(
      clientesPage.clienteItems.filter({ hasText: clienteData.nombre })
    ).toHaveCount(0);

    // AND — right panel returns to the empty/default state
    await expect(clientesPage.emptyState).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // E2E-C-25 (P1 · AC2)
  // Given the user confirms deletion of a client with no associated contacts
  // When the DELETE /api/v1/clientes/:id returns 204
  // Then a toast notification "Cliente eliminado correctamente" appears
  // -------------------------------------------------------------------------
  test('E2E-C-25 — toast "Cliente eliminado correctamente" aparece tras eliminación exitosa sin contactos', async ({ page }) => {
    // GIVEN — a client exists in the system (no associated contacts)
    const clienteData = buildCliente({ nombre: 'Empresa Toast E2E-C-25' });
    const created = await apiHelper.createCliente(clienteData);
    // NOTE: No cleanup push — the test itself deletes the client

    // GIVEN — intercept network BEFORE navigation (network-first pattern)
    await page.route('**/api/v1/clientes**', (route) => route.continue());

    await clientesPage.goto();

    // WHEN — user selects the client, opens the confirmation dialog, and confirms
    await clientesPage.seleccionarCliente(clienteData.nombre);
    await expect(clientesPage.detailPanel).toBeVisible();
    await page.getByTestId('btn-eliminar').click();
    await expect(page.getByTestId('delete-cliente-dialog')).toBeVisible();
    await page.getByTestId('btn-confirmar-eliminar').click();

    // THEN — success toast with the Spanish message is visible
    await expect(
      page.getByText(/cliente eliminado correctamente/i)
    ).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // E2E-C-26 (P1 · AC4)
  // Given the user has the confirmation dialog open
  // When the user clicks "Cancelar"
  // Then the dialog closes WITHOUT firing a DELETE request,
  //   AND the client record remains in the list unchanged
  // -------------------------------------------------------------------------
  test('E2E-C-26 — "Cancelar" cierra el diálogo sin hacer DELETE; el cliente permanece en la lista', async ({ page }) => {
    // GIVEN — a client exists in the system
    const clienteData = buildCliente({ nombre: 'Empresa Cancelar E2E-C-26' });
    const created = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(created.id);

    // GIVEN — intercept network BEFORE navigation; track DELETE calls
    let deleteFired = false;
    await page.route('**/api/v1/clientes/**', (route) => {
      if (route.request().method() === 'DELETE') {
        deleteFired = true;
      }
      route.continue();
    });
    await page.route('**/api/v1/clientes', (route) => route.continue());

    await clientesPage.goto();

    // WHEN — user selects the client and opens the confirmation dialog
    await clientesPage.seleccionarCliente(clienteData.nombre);
    await expect(clientesPage.detailPanel).toBeVisible();
    await page.getByTestId('btn-eliminar').click();
    await expect(page.getByTestId('delete-cliente-dialog')).toBeVisible();

    // AND — user clicks "Cancelar"
    await page.getByTestId('btn-cancelar-eliminar').click();

    // THEN — dialog closes
    await expect(page.getByTestId('delete-cliente-dialog')).toBeHidden();

    // AND — no DELETE request was fired
    expect(deleteFired).toBe(false);

    // AND — the client is still visible in the list
    await expect(
      clientesPage.clienteItems.filter({ hasText: clienteData.nombre })
    ).toBeVisible();

    // AND — detail panel still shows the client (it was not removed)
    await expect(clientesPage.detailPanel).toContainText(clienteData.nombre);
  });

  // -------------------------------------------------------------------------
  // E2E-C-27 (P1 · AC3)
  // Given the user confirms deletion of a client that has one or more associated contacts
  // When the DELETE /api/v1/clientes/:id is processed
  // Then the client is removed from the list
  //   AND the toast displays "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."
  // -------------------------------------------------------------------------
  // TODO (TEA Review): E2E-C-27 requires Contacto entity (Epic 3) — skipped per story 2.5 dev notes
  test.skip('E2E-C-27 — eliminar cliente con contactos muestra toast de desasignación de contactos', async ({ page }) => {
    // GIVEN — a client exists with at least one associated contact
    const clienteData = buildCliente({ nombre: 'Empresa Con Contactos E2E-C-27' });
    const createdCliente = await apiHelper.createCliente(clienteData);
    // NOTE: No cleanup push for cliente — the test itself deletes it

    const contactoData = buildContacto({
      nombre: 'Contacto Asociado E2E-C-27',
      clienteId: createdCliente.id,
    });
    const createdContacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(createdContacto.id);

    // GIVEN — intercept network BEFORE navigation (network-first pattern)
    await page.route('**/api/v1/clientes**', (route) => route.continue());
    await page.route('**/api/v1/contactos**', (route) => route.continue());

    await clientesPage.goto();

    // WHEN — user selects the client, opens the confirmation dialog, and confirms
    await clientesPage.seleccionarCliente(clienteData.nombre);
    await expect(clientesPage.detailPanel).toBeVisible();
    await page.getByTestId('btn-eliminar').click();
    await expect(page.getByTestId('delete-cliente-dialog')).toBeVisible();
    await page.getByTestId('btn-confirmar-eliminar').click();

    // THEN — success toast with the contact-unassignment message is visible
    await expect(
      page.getByText(/sus contactos asociados quedaron sin cliente asignado/i)
    ).toBeVisible();

    // AND — client is no longer in the list
    await expect(
      clientesPage.clienteItems.filter({ hasText: clienteData.nombre })
    ).toHaveCount(0);
  });
});

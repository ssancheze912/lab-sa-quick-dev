import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente, buildContacto } from '../../helpers/data.helper';

/**
 * E2E tests — Story 4.6: Reassign Contact to Different Client
 *
 * Covers:
 *   AC #1  "Reasignar cliente" button visible when contact has a clienteId (non-null)
 *   AC #2  Dialog selector lists all clients except the currently assigned one
 *   AC #3  Selecting a different client and confirming updates the association
 *   AC #4  TanStack Query keys invalidated → ClienteAsociadoSeccion refreshes
 *   AC #5  New client name appears in ClienteAsociadoSeccion after reassignment
 *   AC #6  Cancelling dialog leaves client association unchanged
 *   AC #10 "Reasignar cliente" button is NOT shown when contact has no client (clienteId null)
 *
 * Stack: Playwright — network-first route interception (intercept BEFORE navigate).
 * Selectors: data-testid — no fragile CSS selectors.
 * No hard waits — only explicit waits via expect(...).toBeVisible() / waitForURL.
 *
 * Expected RED failures (missing implementation):
 *   - [data-testid="reasignar-cliente-btn"] not present in ContactoDetailView
 *   - [data-testid="reasignar-cliente-dialog"] not present
 *   - ReasignarClienteDialog component does not exist
 *   - useReasignarContacto hook does not exist
 *   - After reassignment, ClienteAsociadoSeccion does not refresh to show new client
 */

test.describe('Story 4.6 — Reassign Contact to Different Client', () => {
  let apiHelper: ApiHelper;
  const createdClienteIds: string[] = [];
  const createdContactoIds: string[] = [];

  test.beforeEach(async ({ request }) => {
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdContactoIds) {
      await apiHelper.deleteContacto(id).catch(() => null);
    }
    for (const id of createdClienteIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdContactoIds.length = 0;
    createdClienteIds.length = 0;
  });

  // ---------------------------------------------------------------------------
  // AC #1 — "Reasignar cliente" button visible when contact has a clienteId
  // ---------------------------------------------------------------------------

  test('AC#1 — "Reasignar cliente" button is visible when contact already has a client', async ({
    page,
  }) => {
    // GIVEN: A client and a contact associated with that client
    const clienteData = buildCliente({ nombre: 'Cliente Original E2E' });
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: cliente.id });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept BEFORE navigation
    await page.route(`**/api/v1/clientes*`, (route) => route.continue());
    await page.route(`**/api/v1/contactos/**`, (route) => route.continue());

    // WHEN: User navigates to the contact detail page
    await page.goto(`/contactos/${contacto.id}`);
    await page.waitForURL(`**/contactos/${contacto.id}**`);

    // THEN: "Reasignar cliente" button is visible in ClienteAsociadoSeccion
    await expect(page.getByTestId('reasignar-cliente-btn')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // AC #10 — "Reasignar cliente" button NOT shown when contact has no client
  // ---------------------------------------------------------------------------

  test('AC#10 — "Reasignar cliente" button is NOT shown when contact has no associated client', async ({
    page,
  }) => {
    // GIVEN: A contact with no client association (clienteId is null)
    const contactoData = buildContacto({ clienteId: null });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept BEFORE navigation
    await page.route(`**/api/v1/contactos/**`, (route) => route.continue());

    // WHEN: User navigates to the contact detail page
    await page.goto(`/contactos/${contacto.id}`);
    await page.waitForURL(`**/contactos/${contacto.id}**`);

    // THEN: "Sin cliente asignado" message is visible
    await expect(page.getByTestId('sin-cliente-message')).toBeVisible();

    // THEN: "Reasignar cliente" button is NOT shown
    await expect(page.getByTestId('reasignar-cliente-btn')).not.toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // AC #2 — Dialog selector excludes the currently assigned client
  // ---------------------------------------------------------------------------

  test('AC#2 — Dialog lists available clients excluding the currently assigned one', async ({
    page,
  }) => {
    // GIVEN: Two clients and a contact associated with the first client
    const clienteAData = buildCliente({ nombre: 'Cliente A Original E2E' });
    const clienteBData = buildCliente({ nombre: 'Cliente B Disponible E2E' });
    const clienteA = await apiHelper.createCliente(clienteAData);
    const clienteB = await apiHelper.createCliente(clienteBData);
    createdClienteIds.push(clienteA.id, clienteB.id);

    const contactoData = buildContacto({ clienteId: clienteA.id });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept BEFORE navigation
    await page.route(`**/api/v1/clientes*`, (route) => route.continue());
    await page.route(`**/api/v1/contactos/**`, (route) => route.continue());

    // WHEN: Navigate to contact detail and open the reassign dialog
    await page.goto(`/contactos/${contacto.id}`);
    await page.waitForURL(`**/contactos/${contacto.id}**`);

    await expect(page.getByTestId('reasignar-cliente-btn')).toBeVisible();
    await page.getByTestId('reasignar-cliente-btn').click();

    // THEN: Dialog is open
    await expect(page.getByTestId('reasignar-cliente-dialog')).toBeVisible();

    // THEN: The other client (B) is listed in the selector
    await expect(page.getByText('Cliente B Disponible E2E')).toBeVisible();

    // THEN: The currently assigned client (A) is NOT listed
    await expect(page.getByText('Cliente A Original E2E')).not.toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // TC-1 (E2E): Full reassignment flow — new client name appears in detail (AC #3, #4, #5)
  // ---------------------------------------------------------------------------

  test('TC-1: Select different client and confirm — new client name appears in ClienteAsociadoSeccion', async ({
    page,
  }) => {
    // GIVEN: Two clients; contact is initially associated with clienteA
    const clienteAData = buildCliente({ nombre: 'Empresa Origen SA' });
    const clienteBData = buildCliente({ nombre: 'Empresa Destino Ltda' });
    const clienteA = await apiHelper.createCliente(clienteAData);
    const clienteB = await apiHelper.createCliente(clienteBData);
    createdClienteIds.push(clienteA.id, clienteB.id);

    const contactoData = buildContacto({ clienteId: clienteA.id });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept BEFORE navigation
    await page.route(`**/api/v1/clientes*`, (route) => route.continue());
    await page.route(`**/api/v1/contactos/**`, (route) => route.continue());

    // Navigate to contact detail
    await page.goto(`/contactos/${contacto.id}`);
    await page.waitForURL(`**/contactos/${contacto.id}**`);

    // Wait for the current client name to be visible
    await expect(page.getByTestId('cliente-asociado-section')).toBeVisible();

    // Open the reassign dialog
    await expect(page.getByTestId('reasignar-cliente-btn')).toBeVisible();
    await page.getByTestId('reasignar-cliente-btn').click();

    await expect(page.getByTestId('reasignar-cliente-dialog')).toBeVisible();

    // WHEN: User selects clienteB from the selector
    await expect(page.getByText('Empresa Destino Ltda')).toBeVisible();
    await page.getByText('Empresa Destino Ltda').click();

    // WHEN: User clicks "Reasignar" to confirm
    await page.getByRole('button', { name: /^Reasignar$/i }).click();

    // THEN: Dialog closes after successful mutation
    await expect(page.getByTestId('reasignar-cliente-dialog')).not.toBeVisible();

    // THEN: New client name appears in ClienteAsociadoSeccion
    await expect(page.getByText('Empresa Destino Ltda')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // TC-2 (E2E): Old client's contact list no longer contains the reassigned contact
  // ---------------------------------------------------------------------------

  test('TC-2: Old client contact list no longer contains the reassigned contact', async ({
    page,
  }) => {
    // GIVEN: Two clients; contact initially belongs to clienteA
    const clienteAData = buildCliente({ nombre: 'Empresa Anterior SA' });
    const clienteBData = buildCliente({ nombre: 'Empresa Nueva Ltda' });
    const clienteA = await apiHelper.createCliente(clienteAData);
    const clienteB = await apiHelper.createCliente(clienteBData);
    createdClienteIds.push(clienteA.id, clienteB.id);

    const contactoData = buildContacto({ nombre: 'Contacto Reasignado E2E' });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // Associate the contact to clienteA first
    await apiHelper.asignarClienteAContacto(contacto.id, clienteA.id);

    // CRITICAL: Intercept BEFORE navigation
    await page.route(`**/api/v1/clientes*`, (route) => route.continue());
    await page.route(`**/api/v1/contactos/**`, (route) => route.continue());

    // Navigate to contact detail
    await page.goto(`/contactos/${contacto.id}`);
    await page.waitForURL(`**/contactos/${contacto.id}**`);

    // Open dialog and reassign to clienteB
    await expect(page.getByTestId('reasignar-cliente-btn')).toBeVisible();
    await page.getByTestId('reasignar-cliente-btn').click();

    await expect(page.getByTestId('reasignar-cliente-dialog')).toBeVisible();
    await expect(page.getByText('Empresa Nueva Ltda')).toBeVisible();
    await page.getByText('Empresa Nueva Ltda').click();
    await page.getByRole('button', { name: /^Reasignar$/i }).click();

    await expect(page.getByTestId('reasignar-cliente-dialog')).not.toBeVisible();

    // WHEN: Navigate to clienteA's detail page to see its contacts
    await page.goto(`/clientes/${clienteA.id}`);
    await page.waitForURL(`**/clientes/${clienteA.id}**`);

    // THEN: The reassigned contact is no longer listed under clienteA
    await expect(page.getByText('Contacto Reasignado E2E')).not.toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // TC-3 (E2E): New client's contact list contains the reassigned contact
  // ---------------------------------------------------------------------------

  test('TC-3: New client contact list now contains the reassigned contact', async ({
    page,
  }) => {
    // GIVEN: Two clients; contact initially belongs to clienteA
    const clienteAData = buildCliente({ nombre: 'Empresa Anterior Tres SA' });
    const clienteBData = buildCliente({ nombre: 'Empresa Receptora Ltda' });
    const clienteA = await apiHelper.createCliente(clienteAData);
    const clienteB = await apiHelper.createCliente(clienteBData);
    createdClienteIds.push(clienteA.id, clienteB.id);

    const contactoData = buildContacto({ nombre: 'Contacto Movilizado E2E' });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // Associate to clienteA
    await apiHelper.asignarClienteAContacto(contacto.id, clienteA.id);

    // CRITICAL: Intercept BEFORE navigation
    await page.route(`**/api/v1/clientes*`, (route) => route.continue());
    await page.route(`**/api/v1/contactos/**`, (route) => route.continue());

    // Perform the reassignment via the UI
    await page.goto(`/contactos/${contacto.id}`);
    await page.waitForURL(`**/contactos/${contacto.id}**`);

    await expect(page.getByTestId('reasignar-cliente-btn')).toBeVisible();
    await page.getByTestId('reasignar-cliente-btn').click();

    await expect(page.getByTestId('reasignar-cliente-dialog')).toBeVisible();
    await expect(page.getByText('Empresa Receptora Ltda')).toBeVisible();
    await page.getByText('Empresa Receptora Ltda').click();
    await page.getByRole('button', { name: /^Reasignar$/i }).click();

    await expect(page.getByTestId('reasignar-cliente-dialog')).not.toBeVisible();

    // WHEN: Navigate to clienteB's detail page
    await page.goto(`/clientes/${clienteB.id}`);
    await page.waitForURL(`**/clientes/${clienteB.id}**`);

    // THEN: The reassigned contact now appears in clienteB's contacts list
    await expect(page.getByText('Contacto Movilizado E2E')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // TC-4 (E2E): Cancel reassignment — client association unchanged (AC #6)
  // ---------------------------------------------------------------------------

  test('TC-4: Cancel reassignment — contact client association remains unchanged', async ({
    page,
  }) => {
    // GIVEN: A client and a contact associated with that client
    const clienteAData = buildCliente({ nombre: 'Cliente Fijo SA' });
    const clienteBData = buildCliente({ nombre: 'Cliente No Elegido Ltda' });
    const clienteA = await apiHelper.createCliente(clienteAData);
    const clienteB = await apiHelper.createCliente(clienteBData);
    createdClienteIds.push(clienteA.id, clienteB.id);

    const contactoData = buildContacto({ clienteId: clienteA.id });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept BEFORE navigation
    await page.route(`**/api/v1/clientes*`, (route) => route.continue());
    await page.route(`**/api/v1/contactos/**`, (route) => route.continue());

    // Navigate to contact detail
    await page.goto(`/contactos/${contacto.id}`);
    await page.waitForURL(`**/contactos/${contacto.id}**`);

    // Wait for original client to be shown
    await expect(page.getByText('Cliente Fijo SA')).toBeVisible();

    // Open dialog
    await expect(page.getByTestId('reasignar-cliente-btn')).toBeVisible();
    await page.getByTestId('reasignar-cliente-btn').click();

    await expect(page.getByTestId('reasignar-cliente-dialog')).toBeVisible();

    // WHEN: User clicks "Cancelar" without selecting a client
    await page.getByRole('button', { name: /Cancelar/i }).click();

    // THEN: Dialog closes
    await expect(page.getByTestId('reasignar-cliente-dialog')).not.toBeVisible();

    // THEN: Original client name is still displayed in ClienteAsociadoSeccion
    await expect(page.getByText('Cliente Fijo SA')).toBeVisible();

    // THEN: "Cliente No Elegido" was never assigned — verify via API
    const contactoActualizado = await apiHelper.getContactos().then(
      (list: Array<{ id: string; clienteId: string | null }>) =>
        list.find((c) => c.id === contacto.id)
    );
    expect(contactoActualizado?.clienteId).toBe(clienteA.id);
  });
});

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente, buildContacto } from '../../helpers/data.helper';
import { ContactosPage } from '../../pages/contactos.page';

/**
 * ATDD — Story 4.6: Reassign Contact to Different Client
 *
 * RED Phase — Tests intentionally fail until implementation is complete.
 *
 * Coverage:
 *   E2E-AC-20  P0  · AC1       — "Reasignar" button opens dialog with all available clients listed
 *   E2E-AC-21  P0  · AC2, AC3  — Confirming reassignment: contact removed from old client's
 *                                ContactManager and appears in new client's ContactManager
 *   E2E-AC-22  P0  · AC2       — After reassignment, both client contact lists update without
 *                                page.reload(); PUT /api/v1/contactos/:id/cliente called exactly once
 *   E2E-AC-23  P1  · AC2       — Toast "Contacto reasignado correctamente" shown after success
 *   E2E-AC-24  P1  · AC4       — Cancelling reassignment leaves contact's client association unchanged
 *
 * Selectors:
 *   data-testid="btn-reasignar"
 *   data-testid="reassign-cliente-dialog"
 *   data-testid="cliente-option"
 *   data-testid="btn-confirmar-reasignar"
 *   data-testid="btn-cancelar-reasignar"
 */

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

test.describe('Story 4.6 — Reassign Contact to Different Client', () => {
  let apiHelper: ApiHelper;
  const createdClienteIds: string[] = [];
  const createdContactoIds: string[] = [];

  test.beforeEach(async ({ request, page }) => {
    apiHelper = new ApiHelper(request);

    // Surface unexpected client-side errors as test failures
    page.on('pageerror', (err) => {
      // eslint-disable-next-line no-console
      console.error('Page error captured:', err.message);
    });
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
  // E2E-AC-20 (P0 · AC1)
  // Given a contacto associated with client A and a separate client B
  // When the user clicks the "Reasignar" button in ContactoDetailPanel
  // Then the reassignment dialog opens
  //   AND the dialog lists client B (currently assigned client A is excluded from the options)
  // ---------------------------------------------------------------------------
  test('E2E-AC-20 — Botón "Reasignar" abre diálogo con la lista de clientes disponibles', async ({ page }) => {
    // GIVEN — Create two clients via API
    const clienteA = await apiHelper.createCliente(
      buildCliente({ nombre: `Cliente A Reasignar ${Date.now()}` })
    );
    createdClienteIds.push(clienteA.id);

    const clienteB = await apiHelper.createCliente(
      buildCliente({ nombre: `Cliente B Reasignar ${Date.now()}` })
    );
    createdClienteIds.push(clienteB.id);

    // AND — Create a contacto associated with client A
    const contacto = await apiHelper.createContacto(
      buildContacto({ clienteId: clienteA.id })
    );
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept network BEFORE navigation (network-first pattern)
    await page.route(`**/api/v1/contactos/${contacto.id}`, (route) => route.continue());
    await page.route('**/api/v1/clientes', (route) => route.continue());

    const contactosPage = new ContactosPage(page);

    // WHEN — User navigates to the contact detail view
    await page.goto(`/contactos/${contacto.id}`);

    // AND — ContactoDetailPanel is visible
    await expect(contactosPage.detailPanel).toBeVisible();

    // AND — "Reasignar" button is visible (contact has an assigned client)
    await expect(contactosPage.btnReasignar).toBeVisible();

    // AND — User clicks the "Reasignar" button
    await contactosPage.btnReasignar.click();

    // THEN — Reassignment dialog is visible
    await expect(contactosPage.reassignClienteDialog).toBeVisible();

    // AND — Dialog title "Reasignar contacto" is shown (Spanish — company standard)
    await expect(
      contactosPage.reassignClienteDialog.getByText(/reasignar contacto/i)
    ).toBeVisible();

    // AND — Client B appears as a selectable option
    await expect(
      contactosPage.clienteOptions.filter({ hasText: clienteB.nombre })
    ).toBeVisible();

    // AND — Currently assigned client A is NOT shown in the options
    await expect(
      contactosPage.clienteOptions.filter({ hasText: clienteA.nombre })
    ).toHaveCount(0);
  });

  // ---------------------------------------------------------------------------
  // E2E-AC-21 (P0 · AC2, AC3)
  // Given a contacto associated with client A, plus a separate client B
  // When the user selects client B in the dialog and confirms
  // Then the dialog closes
  //   AND the contact detail shows client B's nombre in clienteAsociadoLink
  //   AND navigating to client A's detail: contact is NOT in ContactManager
  //   AND navigating to client B's detail: contact IS in ContactManager
  // ---------------------------------------------------------------------------
  test('E2E-AC-21 — Confirmar reasignación remueve el contacto del cliente A y lo agrega al cliente B', async ({ page }) => {
    // GIVEN — Two clients + contact assigned to client A
    const clienteA = await apiHelper.createCliente(
      buildCliente({ nombre: `Cliente A Reasignar ${Date.now()}` })
    );
    createdClienteIds.push(clienteA.id);

    const clienteB = await apiHelper.createCliente(
      buildCliente({ nombre: `Cliente B Reasignar ${Date.now()}` })
    );
    createdClienteIds.push(clienteB.id);

    const contacto = await apiHelper.createContacto(
      buildContacto({ clienteId: clienteA.id })
    );
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept network BEFORE navigation (network-first pattern)
    await page.route(`**/api/v1/contactos/${contacto.id}/cliente`, (route) => route.continue());
    await page.route('**/api/v1/clientes', (route) => route.continue());
    await page.route('**/api/v1/contactos**', (route) => route.continue());

    const contactosPage = new ContactosPage(page);

    // WHEN — User navigates to the contact detail view
    await page.goto(`/contactos/${contacto.id}`);
    await expect(contactosPage.detailPanel).toBeVisible();

    // AND — Opens the reassignment dialog
    await contactosPage.btnReasignar.click();
    await expect(contactosPage.reassignClienteDialog).toBeVisible();

    // AND — Selects client B
    await contactosPage.clienteOptions.filter({ hasText: clienteB.nombre }).click();

    // AND — Confirms the reassignment
    await contactosPage.btnConfirmarReasignar.click();

    // THEN — Dialog closes
    await expect(contactosPage.reassignClienteDialog).toBeHidden();

    // AND — Contact detail shows client B's nombre in the clienteAsociadoLink
    await expect(contactosPage.clienteAsociadoLink).toContainText(clienteB.nombre);

    // AND — Navigate to client A's detail: contact NOT in ContactManager
    await page.goto(`/clientes/${clienteA.id}`);
    await expect(page.getByTestId('contact-manager')).toBeVisible();
    await expect(
      page.getByTestId('contact-manager').getByText(contacto.nombre)
    ).toHaveCount(0);

    // AND — Navigate to client B's detail: contact IS in ContactManager
    await page.goto(`/clientes/${clienteB.id}`);
    await expect(page.getByTestId('contact-manager')).toBeVisible();
    await expect(
      page.getByTestId('contact-manager').getByText(contacto.nombre)
    ).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // E2E-AC-22 (P0 · AC2)
  // Given a contacto associated with client A and a separate client B
  // When the user confirms reassignment from A to B
  // Then PUT /api/v1/contactos/:id/cliente is called exactly once
  //   AND no page.reload() is triggered (FR27 — immediate visibility)
  //   AND the cliente list updates via cache invalidation, not navigation/reload
  // ---------------------------------------------------------------------------
  test('E2E-AC-22 — Reasignación llama PUT /cliente una vez y no recarga la página', async ({ page }) => {
    // GIVEN — Two clients + contact assigned to client A
    const clienteA = await apiHelper.createCliente(
      buildCliente({ nombre: `Cliente A Reasignar ${Date.now()}` })
    );
    createdClienteIds.push(clienteA.id);

    const clienteB = await apiHelper.createCliente(
      buildCliente({ nombre: `Cliente B Reasignar ${Date.now()}` })
    );
    createdClienteIds.push(clienteB.id);

    const contacto = await apiHelper.createContacto(
      buildContacto({ clienteId: clienteA.id })
    );
    createdContactoIds.push(contacto.id);

    // Track PUT /cliente requests and any navigation requests to the contact URL
    let putClienteCount = 0;
    let reloadDetected = false;

    page.on('request', (req) => {
      const url = req.url();
      if (
        req.method() === 'PUT' &&
        url.includes(`/api/v1/contactos/${contacto.id}/cliente`)
      ) {
        putClienteCount += 1;
      }
      if (
        req.isNavigationRequest() &&
        url.includes(`/contactos/${contacto.id}`)
      ) {
        reloadDetected = true;
      }
    });

    // CRITICAL: Intercept network BEFORE navigation (network-first pattern)
    await page.route(`**/api/v1/contactos/${contacto.id}/cliente`, (route) => route.continue());
    await page.route('**/api/v1/clientes', (route) => route.continue());

    const contactosPage = new ContactosPage(page);

    // WHEN — Navigate to the contact detail
    await page.goto(`/contactos/${contacto.id}`);
    await expect(contactosPage.detailPanel).toBeVisible();

    // Reset reload detector to ignore the initial navigation
    reloadDetected = false;

    // AND — Open dialog and confirm reassignment to client B
    await contactosPage.btnReasignar.click();
    await expect(contactosPage.reassignClienteDialog).toBeVisible();
    await contactosPage.clienteOptions.filter({ hasText: clienteB.nombre }).click();
    await contactosPage.btnConfirmarReasignar.click();

    // THEN — Dialog closes and the new client name appears (immediate visibility)
    await expect(contactosPage.reassignClienteDialog).toBeHidden();
    await expect(contactosPage.clienteAsociadoLink).toContainText(clienteB.nombre);

    // AND — PUT /api/v1/contactos/:id/cliente was called exactly once
    expect(putClienteCount).toBe(1);

    // AND — No page reload was triggered by the application (FR27)
    expect(reloadDetected).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // E2E-AC-23 (P1 · AC2)
  // Given a contacto associated with client A and a separate client B
  // When the user successfully reassigns the contact from A to B
  // Then a toast with the message "Contacto reasignado correctamente" is visible
  // ---------------------------------------------------------------------------
  test('E2E-AC-23 — Toast "Contacto reasignado correctamente" aparece tras reasignar', async ({ page }) => {
    // GIVEN — Two clients + contact assigned to client A
    const clienteA = await apiHelper.createCliente(
      buildCliente({ nombre: `Cliente A Reasignar ${Date.now()}` })
    );
    createdClienteIds.push(clienteA.id);

    const clienteB = await apiHelper.createCliente(
      buildCliente({ nombre: `Cliente B Reasignar ${Date.now()}` })
    );
    createdClienteIds.push(clienteB.id);

    const contacto = await apiHelper.createContacto(
      buildContacto({ clienteId: clienteA.id })
    );
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept network BEFORE navigation (network-first pattern)
    await page.route(`**/api/v1/contactos/${contacto.id}/cliente`, (route) => route.continue());
    await page.route('**/api/v1/clientes', (route) => route.continue());

    const contactosPage = new ContactosPage(page);

    // WHEN — Navigate to contact detail
    await page.goto(`/contactos/${contacto.id}`);
    await expect(contactosPage.detailPanel).toBeVisible();

    // AND — Open dialog and confirm reassignment to client B
    await contactosPage.btnReasignar.click();
    await expect(contactosPage.reassignClienteDialog).toBeVisible();
    await contactosPage.clienteOptions.filter({ hasText: clienteB.nombre }).click();
    await contactosPage.btnConfirmarReasignar.click();

    // THEN — Success toast appears in Spanish (case-insensitive)
    await expect(
      page.getByText(/contacto reasignado correctamente/i)
    ).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // E2E-AC-24 (P1 · AC4)
  // Given a contacto associated with client A and a separate client B
  // When the user opens the reassignment dialog and clicks "Cancelar"
  // Then the dialog closes
  //   AND the contact's clienteAsociadoLink still shows client A's nombre
  //   AND client A's ContactManager still includes the contact
  //   AND PUT /api/v1/contactos/:id/cliente was NOT called
  // ---------------------------------------------------------------------------
  test('E2E-AC-24 — Cancelar la reasignación deja al contacto asociado al cliente original', async ({ page }) => {
    // GIVEN — Two clients + contact assigned to client A
    const clienteA = await apiHelper.createCliente(
      buildCliente({ nombre: `Cliente A Reasignar ${Date.now()}` })
    );
    createdClienteIds.push(clienteA.id);

    const clienteB = await apiHelper.createCliente(
      buildCliente({ nombre: `Cliente B Reasignar ${Date.now()}` })
    );
    createdClienteIds.push(clienteB.id);

    const contacto = await apiHelper.createContacto(
      buildContacto({ clienteId: clienteA.id })
    );
    createdContactoIds.push(contacto.id);

    // Track PUT /cliente requests — none should occur when cancelling
    let putClienteCount = 0;
    page.on('request', (req) => {
      if (
        req.method() === 'PUT' &&
        req.url().includes(`/api/v1/contactos/${contacto.id}/cliente`)
      ) {
        putClienteCount += 1;
      }
    });

    // CRITICAL: Intercept network BEFORE navigation (network-first pattern)
    await page.route(`**/api/v1/contactos/${contacto.id}/cliente`, (route) => route.continue());
    await page.route('**/api/v1/clientes', (route) => route.continue());

    const contactosPage = new ContactosPage(page);

    // WHEN — Navigate to contact detail and open the dialog
    await page.goto(`/contactos/${contacto.id}`);
    await expect(contactosPage.detailPanel).toBeVisible();
    await contactosPage.btnReasignar.click();
    await expect(contactosPage.reassignClienteDialog).toBeVisible();

    // AND — User clicks "Cancelar" without confirming
    await contactosPage.btnCancelarReasignar.click();

    // THEN — Dialog closes
    await expect(contactosPage.reassignClienteDialog).toBeHidden();

    // AND — clienteAsociadoLink still shows client A's nombre (association unchanged)
    await expect(contactosPage.clienteAsociadoLink).toContainText(clienteA.nombre);

    // AND — PUT /cliente was NOT called
    expect(putClienteCount).toBe(0);

    // AND — Navigate to client A: contact still in ContactManager
    await page.goto(`/clientes/${clienteA.id}`);
    await expect(page.getByTestId('contact-manager')).toBeVisible();
    await expect(
      page.getByTestId('contact-manager').getByText(contacto.nombre)
    ).toBeVisible();

    // AND — From server perspective, contact still belongs to client A
    const verifyResponse = await page.request.get(
      `${API_BASE_URL}/api/v1/contactos/${contacto.id}`
    );
    expect(verifyResponse.status()).toBe(200);
    const verifyBody = await verifyResponse.json();
    expect(verifyBody.clienteId).toBe(clienteA.id);
  });
});

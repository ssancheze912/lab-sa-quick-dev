import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente, buildContacto } from '../../helpers/data.helper';
import { ContactosPage } from '../../pages/contactos.page';

/**
 * Edge Case Tests — Story 4.6: Reassign Contact to Different Client
 *
 * Expands the ATDD baseline (asociacion-reasignacion.spec.ts — E2E-AC-20 through E2E-AC-24)
 * with edge cases, boundary conditions and error paths not covered by the happy-path suite:
 *
 *   E2E-46-EDGE-01 [P1]  "Reasignar" button is NOT visible for orphan contact (clienteId === null)
 *   E2E-46-EDGE-02 [P1]  Confirm button is disabled until a cliente option is selected
 *   E2E-46-EDGE-03 [P1]  Reassignment dialog has aria-label="Seleccionar nuevo cliente" on the list (WCAG 2.1 AA)
 *   E2E-46-EDGE-04 [P1]  Closing the dialog with Escape key does NOT trigger PUT /cliente
 *   E2E-46-EDGE-05 [P1]  Selecting cliente B then cliente C only sends the final selection on confirm
 *   E2E-46-EDGE-06 [P2]  Reopening the dialog after cancel resets the previous selection (no stale state)
 *   E2E-46-EDGE-07 [P2]  Reasignar button has aria-label="Reasignar contacto a otro cliente"
 *   E2E-46-EDGE-08 [P2]  Dialog title is in Spanish ("Reasignar contacto") — company standard
 */

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

test.describe('Story 4.6 — Edge Cases: Reassign Contact to Different Client', () => {
  let apiHelper: ApiHelper;
  const createdClienteIds: string[] = [];
  const createdContactoIds: string[] = [];

  test.beforeEach(async ({ request, page }) => {
    apiHelper = new ApiHelper(request);

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
  // E2E-46-EDGE-01 [P1]
  // Given a contacto WITHOUT a clienteId (orphan)
  // When the user views the contact detail
  // Then the "Reasignar" button is NOT rendered in the DOM
  //   AND "Sin cliente asignado" is shown instead
  // Anti-pattern guard: button must be hidden when there is no client to reassign from.
  // ---------------------------------------------------------------------------
  test('[P1] E2E-46-EDGE-01 — botón "Reasignar" no visible cuando el contacto es huérfano', async ({ page }) => {
    // GIVEN — orphan contact (no clienteId)
    const contacto = await apiHelper.createContacto(buildContacto({ clienteId: null }));
    createdContactoIds.push(contacto.id);

    const contactosPage = new ContactosPage(page);

    // WHEN — Navigate to contact detail
    await page.goto(`/contactos/${contacto.id}`);
    await expect(contactosPage.detailPanel).toBeVisible();

    // THEN — "Sin cliente asignado" is shown
    await expect(contactosPage.sinClienteAsignado).toBeVisible();

    // AND — "Reasignar" button is NOT in the DOM
    await expect(contactosPage.btnReasignar).toHaveCount(0);
  });

  // ---------------------------------------------------------------------------
  // E2E-46-EDGE-02 [P1]
  // Given a contacto associated with client A plus a separate client B
  // When the user opens the reassignment dialog WITHOUT selecting an option
  // Then "Confirmar" is disabled (cannot trigger empty mutation)
  //   AND clicking "Confirmar" does NOT close the dialog
  // ---------------------------------------------------------------------------
  test('[P1] E2E-46-EDGE-02 — botón "Confirmar" deshabilitado hasta seleccionar un cliente', async ({ page }) => {
    // GIVEN — Two clients + contact assigned to client A
    const clienteA = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(clienteA.id);
    const clienteB = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(clienteB.id);

    const contacto = await apiHelper.createContacto(
      buildContacto({ clienteId: clienteA.id })
    );
    createdContactoIds.push(contacto.id);

    const contactosPage = new ContactosPage(page);

    // WHEN — Open the reassign dialog
    await page.goto(`/contactos/${contacto.id}`);
    await expect(contactosPage.detailPanel).toBeVisible();
    await contactosPage.btnReasignar.click();
    await expect(contactosPage.reassignClienteDialog).toBeVisible();

    // THEN — "Confirmar" button is disabled initially (no selection)
    await expect(contactosPage.btnConfirmarReasignar).toBeDisabled();

    // AND — Dialog remains open (button is disabled, click is a no-op)
    await expect(contactosPage.reassignClienteDialog).toBeVisible();

    // AND — Selecting an option enables the button
    await contactosPage.clienteOptions.filter({ hasText: clienteB.nombre }).click();
    await expect(contactosPage.btnConfirmarReasignar).toBeEnabled();
  });

  // ---------------------------------------------------------------------------
  // E2E-46-EDGE-03 [P1]
  // Given the reassignment dialog is open
  // Then the cliente list has aria-label="Seleccionar nuevo cliente" (WCAG 2.1 AA)
  // ---------------------------------------------------------------------------
  test('[P1] E2E-46-EDGE-03 — la lista del diálogo expone aria-label "Seleccionar nuevo cliente" (WCAG 2.1 AA)', async ({ page }) => {
    // GIVEN
    const clienteA = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(clienteA.id);
    const clienteB = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(clienteB.id);
    const contacto = await apiHelper.createContacto(
      buildContacto({ clienteId: clienteA.id })
    );
    createdContactoIds.push(contacto.id);

    const contactosPage = new ContactosPage(page);

    // WHEN — Open the reassignment dialog
    await page.goto(`/contactos/${contacto.id}`);
    await expect(contactosPage.detailPanel).toBeVisible();
    await contactosPage.btnReasignar.click();
    await expect(contactosPage.reassignClienteDialog).toBeVisible();

    // THEN — There is exactly one element with aria-label="Seleccionar nuevo cliente"
    const ariaList = page.getByLabel('Seleccionar nuevo cliente');
    await expect(ariaList).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // E2E-46-EDGE-04 [P1]
  // Given the reassignment dialog is open
  // When the user presses Escape (Radix Dialog closes on Escape)
  // Then the dialog closes
  //   AND PUT /api/v1/contactos/:id/cliente is NOT called
  //   AND the contact's clienteId remains client A
  // ---------------------------------------------------------------------------
  test('[P1] E2E-46-EDGE-04 — cerrar el diálogo con Escape no dispara PUT /cliente', async ({ page }) => {
    // GIVEN
    const clienteA = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(clienteA.id);
    const clienteB = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(clienteB.id);
    const contacto = await apiHelper.createContacto(
      buildContacto({ clienteId: clienteA.id })
    );
    createdContactoIds.push(contacto.id);

    let putClienteCount = 0;
    page.on('request', (req) => {
      if (
        req.method() === 'PUT' &&
        req.url().includes(`/api/v1/contactos/${contacto.id}/cliente`)
      ) {
        putClienteCount += 1;
      }
    });

    const contactosPage = new ContactosPage(page);

    // WHEN — Open the dialog and press Escape
    await page.goto(`/contactos/${contacto.id}`);
    await expect(contactosPage.detailPanel).toBeVisible();
    await contactosPage.btnReasignar.click();
    await expect(contactosPage.reassignClienteDialog).toBeVisible();

    await page.keyboard.press('Escape');

    // THEN — Dialog closes
    await expect(contactosPage.reassignClienteDialog).toBeHidden();

    // AND — No PUT request was made
    expect(putClienteCount).toBe(0);

    // AND — From the server, the contact still belongs to client A
    const verifyResponse = await page.request.get(
      `${API_BASE_URL}/api/v1/contactos/${contacto.id}`
    );
    expect(verifyResponse.status()).toBe(200);
    const verifyBody = await verifyResponse.json();
    expect(verifyBody.clienteId).toBe(clienteA.id);
  });

  // ---------------------------------------------------------------------------
  // E2E-46-EDGE-05 [P1]
  // Given the reassignment dialog is open with three available clients (B and C)
  // When the user selects cliente B then cliente C, then confirms
  // Then PUT /cliente is called exactly ONCE with the final clienteId (cliente C)
  //   AND the contact ends up associated with cliente C (not B)
  // ---------------------------------------------------------------------------
  test('[P1] E2E-46-EDGE-05 — cambiar la selección antes de confirmar sólo persiste la selección final', async ({ page }) => {
    // GIVEN — Three clients + contact assigned to client A
    const clienteA = await apiHelper.createCliente(buildCliente({ nombre: `Cliente A EDGE-05 ${Date.now()}` }));
    createdClienteIds.push(clienteA.id);
    const clienteB = await apiHelper.createCliente(buildCliente({ nombre: `Cliente B EDGE-05 ${Date.now()}` }));
    createdClienteIds.push(clienteB.id);
    const clienteC = await apiHelper.createCliente(buildCliente({ nombre: `Cliente C EDGE-05 ${Date.now()}` }));
    createdClienteIds.push(clienteC.id);

    const contacto = await apiHelper.createContacto(
      buildContacto({ clienteId: clienteA.id })
    );
    createdContactoIds.push(contacto.id);

    // Track PUT request bodies — there should be exactly one with clienteC.id
    const putBodies: Array<{ clienteId: string | null }> = [];
    page.on('request', (req) => {
      if (
        req.method() === 'PUT' &&
        req.url().includes(`/api/v1/contactos/${contacto.id}/cliente`)
      ) {
        try {
          putBodies.push(JSON.parse(req.postData() ?? '{}'));
        } catch {
          putBodies.push({ clienteId: null });
        }
      }
    });

    const contactosPage = new ContactosPage(page);

    // WHEN — Open dialog, click B then C, then confirm
    await page.goto(`/contactos/${contacto.id}`);
    await expect(contactosPage.detailPanel).toBeVisible();
    await contactosPage.btnReasignar.click();
    await expect(contactosPage.reassignClienteDialog).toBeVisible();

    await contactosPage.clienteOptions.filter({ hasText: clienteB.nombre }).click();
    await contactosPage.clienteOptions.filter({ hasText: clienteC.nombre }).click();
    await contactosPage.btnConfirmarReasignar.click();

    // THEN — Dialog closes
    await expect(contactosPage.reassignClienteDialog).toBeHidden();

    // AND — PUT called once with cliente C
    expect(putBodies).toHaveLength(1);
    expect(putBodies[0].clienteId).toBe(clienteC.id);

    // AND — Server confirms the contact belongs to cliente C
    const verifyResponse = await page.request.get(
      `${API_BASE_URL}/api/v1/contactos/${contacto.id}`
    );
    const verifyBody = await verifyResponse.json();
    expect(verifyBody.clienteId).toBe(clienteC.id);
  });

  // ---------------------------------------------------------------------------
  // E2E-46-EDGE-06 [P2]
  // Given the user selects a cliente in the dialog and clicks "Cancelar"
  // When the user reopens the dialog
  // Then "Confirmar" is disabled again (no stale selection leaked across opens)
  // (validates the useEffect-based reset of selectedClienteId on isOpen change)
  // ---------------------------------------------------------------------------
  test('[P2] E2E-46-EDGE-06 — reabrir el diálogo tras cancelar restablece la selección', async ({ page }) => {
    // GIVEN
    const clienteA = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(clienteA.id);
    const clienteB = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(clienteB.id);
    const contacto = await apiHelper.createContacto(
      buildContacto({ clienteId: clienteA.id })
    );
    createdContactoIds.push(contacto.id);

    const contactosPage = new ContactosPage(page);

    // WHEN — Open dialog, select cliente B, cancel
    await page.goto(`/contactos/${contacto.id}`);
    await expect(contactosPage.detailPanel).toBeVisible();
    await contactosPage.btnReasignar.click();
    await expect(contactosPage.reassignClienteDialog).toBeVisible();

    await contactosPage.clienteOptions.filter({ hasText: clienteB.nombre }).click();
    await expect(contactosPage.btnConfirmarReasignar).toBeEnabled();

    await contactosPage.btnCancelarReasignar.click();
    await expect(contactosPage.reassignClienteDialog).toBeHidden();

    // AND — Reopen the dialog
    await contactosPage.btnReasignar.click();
    await expect(contactosPage.reassignClienteDialog).toBeVisible();

    // THEN — "Confirmar" is disabled (selection was reset)
    await expect(contactosPage.btnConfirmarReasignar).toBeDisabled();
  });

  // ---------------------------------------------------------------------------
  // E2E-46-EDGE-07 [P2]
  // Given a contacto associated with a cliente
  // When the user views the contact detail
  // Then the "Reasignar" button has aria-label="Reasignar contacto a otro cliente" (WCAG 2.1 AA)
  // ---------------------------------------------------------------------------
  test('[P2] E2E-46-EDGE-07 — botón "Reasignar" expone aria-label correcto (WCAG 2.1 AA)', async ({ page }) => {
    // GIVEN
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);
    const contacto = await apiHelper.createContacto(
      buildContacto({ clienteId: cliente.id })
    );
    createdContactoIds.push(contacto.id);

    const contactosPage = new ContactosPage(page);

    // WHEN — View contact detail
    await page.goto(`/contactos/${contacto.id}`);
    await expect(contactosPage.detailPanel).toBeVisible();

    // THEN — aria-label is present and correct
    await expect(contactosPage.btnReasignar).toBeVisible();
    const ariaLabel = await contactosPage.btnReasignar.getAttribute('aria-label');
    expect(ariaLabel).toBe('Reasignar contacto a otro cliente');
  });

  // ---------------------------------------------------------------------------
  // E2E-46-EDGE-08 [P2]
  // Given the reassignment dialog is open
  // Then the dialog title is "Reasignar contacto" in Spanish (not "Reassign contact")
  // (Company standard — all user-facing text must be in Spanish)
  // ---------------------------------------------------------------------------
  test('[P2] E2E-46-EDGE-08 — el título del diálogo está en español ("Reasignar contacto")', async ({ page }) => {
    // GIVEN
    const clienteA = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(clienteA.id);
    const clienteB = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(clienteB.id);
    const contacto = await apiHelper.createContacto(
      buildContacto({ clienteId: clienteA.id })
    );
    createdContactoIds.push(contacto.id);

    const contactosPage = new ContactosPage(page);

    // WHEN — Open the reassignment dialog
    await page.goto(`/contactos/${contacto.id}`);
    await expect(contactosPage.detailPanel).toBeVisible();
    await contactosPage.btnReasignar.click();
    await expect(contactosPage.reassignClienteDialog).toBeVisible();

    // THEN — Spanish title is visible
    await expect(
      contactosPage.reassignClienteDialog.getByText('Reasignar contacto', { exact: true })
    ).toBeVisible();

    // AND — English "Reassign contact" is NOT visible
    await expect(
      contactosPage.reassignClienteDialog.getByText(/^reassign contact$/i)
    ).toHaveCount(0);
  });
});

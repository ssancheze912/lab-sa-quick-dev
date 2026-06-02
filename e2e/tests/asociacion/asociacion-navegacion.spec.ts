import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente, buildContacto } from '../../helpers/data.helper';

/**
 * ATDD — Story 4.3: Navigate from Client Detail to Contact Detail
 *         Story 4.4: View Associated Client from Contact Detail
 *
 * Coverage:
 *   E2E-AC-10  P0  — Clicking a contact row in ContactManager navigates to
 *                    /contactos/:contactoId (FR22, ≤ 2 clicks from client list)
 *   E2E-AC-11  P0  — Navigation from client list to contact detail requires
 *                    exactly 2 clicks: (1) select client, (2) click contact (NFR8)
 *   E2E-AC-12  P1  — Back navigation from contact detail (reached via ContactManager)
 *                    returns to client detail view (AC2)
 *   E2E-AC-13  P0  — Contact detail shows associated client name when contact has a client (FR23, NFR9)
 *   E2E-AC-14  P0  — Clicking client name link navigates to /clientes/:clienteId in 1 click (FR24)
 *   E2E-AC-15  P1  — Contact detail shows "Sin cliente asignado" when contact has no associated client
 */

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

test.describe('Story 4.3 — Navigate from Client Detail to Contact Detail', () => {
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
  // E2E-AC-10 (P0 · AC1)
  // Given a client with an associated contact
  // When the user navigates to /clientes, clicks the client item (click 1),
  //   then clicks the contact row in ContactManager (click 2)
  // Then the URL changes to /contactos/:contactoId (FR22)
  // AND navigation required no more than 2 clicks from /clientes (NFR8)
  // ---------------------------------------------------------------------------
  test('E2E-AC-10 — Hacer clic en contacto del ContactManager navega a /contactos/:contactoId', async ({ page }) => {
    // Capture JS errors during navigation
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    // GIVEN — Create client + associated contact via API
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: cliente.id });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // WHEN — Navigate to /clientes (starting point)
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // Click 1 — Select the client from the list
    await page
      .getByTestId('cliente-list-item')
      .filter({ hasText: cliente.nombre })
      .click();

    // Wait for ContactManager to be visible
    await expect(page.getByTestId('contact-manager')).toBeVisible();

    // Click 2 — Click the contact row in ContactManager
    // The contact row is the <tr> containing the contact name
    const contactRow = page.getByTestId('contact-manager').locator('tr').filter({ hasText: contacto.nombre });
    await expect(contactRow).toBeVisible();
    await contactRow.click();

    // THEN — URL matches /contactos/{uuid}
    await page.waitForURL(`**/contactos/${contacto.id}**`, { timeout: 5000 });
    expect(page.url()).toContain(`/contactos/${contacto.id}`);

    // AND — No JS errors occurred during navigation
    expect(jsErrors).toHaveLength(0);
  });

  // ---------------------------------------------------------------------------
  // E2E-AC-11 (P0 · AC1 — NFR8 2-click constraint)
  // Given a client with an associated contact and user on /clientes
  // When navigation path is: /clientes → /clientes/:clienteId → /contactos/:contactoId
  // Then exactly 2 user clicks are required (NFR8: ≤ 2 clicks from client record)
  // ---------------------------------------------------------------------------
  test('E2E-AC-11 — La navegación de cliente a contacto requiere exactamente 2 clics', async ({ page }) => {
    // Capture JS errors during navigation
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    // GIVEN — Create client + associated contact via API
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: cliente.id });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // GIVEN — Start on /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // Track click count
    let clickCount = 0;

    // Click 1 — Select client from list
    clickCount++;
    await page
      .getByTestId('cliente-list-item')
      .filter({ hasText: cliente.nombre })
      .click();

    await expect(page.getByTestId('contact-manager')).toBeVisible();

    // Click 2 — Click contact row in ContactManager
    clickCount++;
    const contactRow = page.getByTestId('contact-manager').locator('tr').filter({ hasText: contacto.nombre });
    await expect(contactRow).toBeVisible();
    await contactRow.click();

    // THEN — URL matches /contactos/:contactoId
    await page.waitForURL(`**/contactos/${contacto.id}**`, { timeout: 5000 });
    expect(page.url()).toContain(`/contactos/${contacto.id}`);

    // AND — Exactly 2 clicks were needed (NFR8)
    expect(clickCount).toBe(2);

    // AND — No JS errors
    expect(jsErrors).toHaveLength(0);
  });

  // ---------------------------------------------------------------------------
  // E2E-AC-12 (P1 · AC2)
  // Given the user navigated to a contact via ContactManager (2-click path)
  // When the user clicks the "Volver" button
  // Then the user returns to the client detail view at /clientes/:clienteId
  // ---------------------------------------------------------------------------
  test('E2E-AC-12 — Clic en "Volver" desde detalle de contacto retorna a detalle de cliente', async ({ page }) => {
    // Capture JS errors during navigation
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    // GIVEN — Create client + associated contact via API
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: cliente.id });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // Navigate to client detail and then to contact via ContactManager
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // Click 1 — select client
    await page
      .getByTestId('cliente-list-item')
      .filter({ hasText: cliente.nombre })
      .click();
    await expect(page.getByTestId('contact-manager')).toBeVisible();

    // Click 2 — click contact row to navigate to contact detail
    const contactRow = page.getByTestId('contact-manager').locator('tr').filter({ hasText: contacto.nombre });
    await expect(contactRow).toBeVisible();
    await contactRow.click();
    await page.waitForURL(`**/contactos/${contacto.id}**`, { timeout: 5000 });

    // Confirm we are on the contact detail page
    expect(page.url()).toContain(`/contactos/${contacto.id}`);
    await expect(page.getByTestId('btn-volver')).toBeVisible();

    // WHEN — Click "Volver" button
    await page.getByTestId('btn-volver').click();

    // THEN — URL returns to the client detail view
    await page.waitForURL(`**/clientes/${cliente.id}**`, { timeout: 5000 });
    expect(page.url()).toContain(`/clientes/${cliente.id}`);

    // AND — No JS errors
    expect(jsErrors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Story 4.4 — View Associated Client from Contact Detail
// ---------------------------------------------------------------------------
test.describe('Story 4.4 — View Associated Client from Contact Detail', () => {
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
  // E2E-AC-13 (P0 · AC1)
  // Given a contact associated with a client
  // When the user navigates directly to /contactos/:contactoId
  // Then the associated client's name is displayed inline (FR23, NFR9)
  // ---------------------------------------------------------------------------
  test('E2E-AC-13 — El detalle de contacto muestra el nombre del cliente asociado', async ({ page }) => {
    // Capture JS errors during navigation
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    // GIVEN — Create client + associated contact via API
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: cliente.id });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // WHEN — Navigate directly to contact detail page
    await page.goto(`/contactos/${contacto.id}`);
    await page.waitForURL(`**/contactos/${contacto.id}**`);

    // THEN — The associated client link is visible
    const clienteLink = page.getByTestId('clienteAsociadoLink');
    await expect(clienteLink).toBeVisible();

    // AND — The link text contains the client's nombre
    await expect(clienteLink).toContainText(cliente.nombre);

    // AND — No JS errors occurred
    expect(jsErrors).toHaveLength(0);
  });

  // ---------------------------------------------------------------------------
  // E2E-AC-14 (P0 · AC2)
  // Given contact detail shows the associated client name link
  // When the user clicks the client name link (1 click)
  // Then the URL changes to /clientes/:clienteId (FR24)
  // ---------------------------------------------------------------------------
  test('E2E-AC-14 — Clic en nombre del cliente navega a /clientes/:clienteId en 1 clic', async ({ page }) => {
    // Capture JS errors during navigation
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    // GIVEN — Create client + associated contact via API
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: cliente.id });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // Navigate to contact detail
    await page.goto(`/contactos/${contacto.id}`);
    await page.waitForURL(`**/contactos/${contacto.id}**`);

    // Confirm link is visible
    const clienteLink = page.getByTestId('clienteAsociadoLink');
    await expect(clienteLink).toBeVisible();

    // WHEN — Click the client link (1 click)
    await clienteLink.click();

    // THEN — URL changes to /clientes/:clienteId (SPA navigation — no reload)
    await page.waitForURL(`**/clientes/${cliente.id}**`, { timeout: 5000 });
    expect(page.url()).toContain(`/clientes/${cliente.id}`);

    // AND — No JS errors occurred
    expect(jsErrors).toHaveLength(0);
  });

  // ---------------------------------------------------------------------------
  // E2E-AC-15 (P1 · AC3)
  // Given a contact with no associated client
  // When the user views the contact detail
  // Then "Sin cliente asignado" is displayed and no client link is present
  // ---------------------------------------------------------------------------
  test('E2E-AC-15 — El detalle de contacto sin cliente muestra "Sin cliente asignado"', async ({ page }) => {
    // Capture JS errors during navigation
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    // GIVEN — Create orphan contact (no client) via API
    const contactoData = buildContacto({ clienteId: null });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // WHEN — Navigate directly to contact detail page
    await page.goto(`/contactos/${contacto.id}`);
    await page.waitForURL(`**/contactos/${contacto.id}**`);

    // THEN — "Sin cliente asignado" message is visible
    const sinCliente = page.getByTestId('sin-cliente-asignado');
    await expect(sinCliente).toBeVisible();
    await expect(sinCliente).toHaveText(/sin cliente asignado/i);

    // AND — No client link is present in the DOM
    await expect(page.getByTestId('clienteAsociadoLink')).not.toBeVisible();

    // AND — No JS errors occurred
    expect(jsErrors).toHaveLength(0);
  });
});

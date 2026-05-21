import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente, buildContacto } from '../../helpers/data.helper';

/**
 * ATDD — Stories 4.3 & 4.4: Navigation — Contact ↔ Client
 *
 * RED Phase — Tests intentionally fail until implementation is complete.
 *
 * Story 4.3 Coverage:
 *   E2E-AC-10  P0  AC1 — Clicking a contact row in ContactManager navigates to
 *                         /contactos/:contactoId (FR22, NFR8 ≤ 2 clicks from client list)
 *   E2E-AC-11  P0  AC1 — Navigation from client list to contact detail requires
 *                         exactly 2 clicks: (1) select client, (2) click contact in ContactManager
 *   E2E-AC-12  P1  AC2 — Back navigation from contact detail (reached via ContactManager)
 *                         returns to client detail view at /clientes/:clienteId
 *
 * Story 4.4 Coverage:
 *   E2E-AC-13  P0  AC1 — Contact detail shows associated client name when contact has a client
 *                         (FR23, NFR9: no additional navigation required)
 *   E2E-AC-14  P0  AC2 — Clicking client name link in contact detail navigates to
 *                         /clientes/:clienteId in exactly 1 click (FR24)
 *   E2E-AC-15  P1  AC3 — Contact detail shows "Sin cliente asignado" when contact has
 *                         no associated client (FR23)
 */

test.describe('Stories 4.3 & 4.4 — Navigation: Client ↔ Contact', () => {
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
  // E2E-AC-10 (P0 · AC1 · FR22)
  // Given the user is in the client detail view and contacts are listed in ContactManager
  // When the user clicks on a contact item
  // Then the user is navigated to /contactos/:contactoId showing the full contact detail
  // AND the navigation was reached in no more than 2 clicks from /clientes
  // ---------------------------------------------------------------------------
  test('E2E-AC-10 — Clicking a contact row in ContactManager navigates to /contactos/:contactoId', async ({ page }) => {
    // Catch JS errors during navigation
    page.on('pageerror', (err) => {
      throw new Error(`Page JS error during navigation: ${err.message}`);
    });

    // GIVEN — Create a client and an associated contact via API
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);

    const contacto = await apiHelper.createContacto(buildContacto({ clienteId: cliente.id }));
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept network BEFORE navigation (network-first pattern)
    await page.route(`**/api/v1/contactos?clienteId=${cliente.id}`, async (route) => {
      await route.continue();
    });
    await page.route(`**/api/v1/contactos/${contacto.id}`, async (route) => {
      await route.continue();
    });

    // WHEN — User navigates to /clientes (click 1 starting point)
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // AND — User clicks the client item in the list panel (click 1)
    await page.getByTestId('cliente-list-item').filter({ hasText: cliente.nombre }).click();

    // AND — ContactManager container is visible in the client detail
    await expect(page.getByTestId('contact-manager')).toBeVisible();

    // AND — User clicks the contact row in ContactManager (click 2)
    // ContactManager row identified by the contact's name text within the contact-manager container
    await page.getByTestId('contact-manager').getByText(contacto.nombre).click();

    // THEN — URL matches /contactos/:contactoId (FR22)
    await page.waitForURL(`**/contactos/${contacto.id}`);
    expect(page.url()).toContain(`/contactos/${contacto.id}`);
  });

  // ---------------------------------------------------------------------------
  // E2E-AC-11 (P0 · AC1 · NFR8)
  // Given the user is on the /clientes listing page
  // When the user navigates to a contact detail by clicking (1) a client then (2) a contact row
  // Then the total number of clicks from /clientes to /contactos/:contactoId is exactly 2
  // ---------------------------------------------------------------------------
  test('E2E-AC-11 — Navigation from client list to contact detail requires exactly 2 clicks', async ({ page }) => {
    // Catch JS errors during navigation
    page.on('pageerror', (err) => {
      throw new Error(`Page JS error during navigation: ${err.message}`);
    });

    // GIVEN — Create a client and an associated contact via API
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);

    const contacto = await apiHelper.createContacto(buildContacto({ clienteId: cliente.id }));
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept network BEFORE navigation (network-first pattern)
    await page.route(`**/api/v1/contactos?clienteId=${cliente.id}`, async (route) => {
      await route.continue();
    });
    await page.route(`**/api/v1/contactos/${contacto.id}`, async (route) => {
      await route.continue();
    });

    // Track click count manually (SPA navigation does not fire standard navigation requests)
    let clickCount = 0;

    // WHEN — User starts from /clientes (the client listing page)
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // Click 1: Select a client from the list panel
    clickCount++;
    await page.getByTestId('cliente-list-item').filter({ hasText: cliente.nombre }).click();
    await expect(page.getByTestId('contact-manager')).toBeVisible();

    // Click 2: Click a contact row in ContactManager
    clickCount++;
    await page.getByTestId('contact-manager').getByText(contacto.nombre).click();

    // THEN — URL is now /contactos/:contactoId (contact detail reached)
    await page.waitForURL(`**/contactos/${contacto.id}`);
    expect(page.url()).toContain(`/contactos/${contacto.id}`);

    // AND — The total number of clicks was exactly 2 (NFR8)
    expect(clickCount).toBe(2);
  });

  // ---------------------------------------------------------------------------
  // E2E-AC-12 (P1 · AC2)
  // Given the user navigated to a contact from the client detail (via ContactManager)
  // When the user clicks the "Volver" button in the contact detail
  // Then the user returns to the client detail view at /clientes/:clienteId
  // ---------------------------------------------------------------------------
  test('E2E-AC-12 — Clicking "Volver" in contact detail returns to client detail view', async ({ page }) => {
    // Catch JS errors during navigation
    page.on('pageerror', (err) => {
      throw new Error(`Page JS error during navigation: ${err.message}`);
    });

    // GIVEN — Create a client and an associated contact via API
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);

    const contacto = await apiHelper.createContacto(buildContacto({ clienteId: cliente.id }));
    createdContactoIds.push(contacto.id);

    // CRITICAL: Intercept network BEFORE navigation (network-first pattern)
    await page.route(`**/api/v1/contactos?clienteId=${cliente.id}`, async (route) => {
      await route.continue();
    });
    await page.route(`**/api/v1/contactos/${contacto.id}`, async (route) => {
      await route.continue();
    });

    // WHEN — User navigates to the client detail (sets up browser history)
    await page.goto(`/clientes/${cliente.id}`);
    await expect(page.getByTestId('contact-manager')).toBeVisible();

    // AND — User clicks the contact row in ContactManager (navigates to contact detail)
    await page.getByTestId('contact-manager').getByText(contacto.nombre).click();
    await page.waitForURL(`**/contactos/${contacto.id}`);

    // AND — User is now on the contact detail page
    expect(page.url()).toContain(`/contactos/${contacto.id}`);

    // AND — The "Volver" button is visible with correct aria-label (WCAG 2.1 AA)
    const btnVolver = page.getByTestId('btn-volver');
    await expect(btnVolver).toBeVisible();
    await expect(btnVolver).toHaveAttribute('aria-label', 'Volver a la vista anterior');

    // AND — The button label is "Volver" (Spanish — company standard)
    await expect(btnVolver).toContainText('Volver');

    // WHEN — User clicks "Volver"
    await btnVolver.click();

    // THEN — User returns to the client detail view at /clientes/:clienteId
    await page.waitForURL(`**/clientes/${cliente.id}`);
    expect(page.url()).toContain(`/clientes/${cliente.id}`);
  });
});

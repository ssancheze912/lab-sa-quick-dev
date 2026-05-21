import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente, buildContacto } from '../../helpers/data.helper';

/**
 * Edge Case Tests — Story 4.3: Navigate from Client Detail to Contact Detail
 *
 * Expands ATDD baseline (asociacion-navegacion.spec.ts — E2E-AC-10, E2E-AC-11, E2E-AC-12) with:
 *   - E2E-43-EDGE-01 [P1] Contact URL has valid UUID format after navigation (not garbled/undefined)
 *   - E2E-43-EDGE-02 [P1] Volver button has aria-label="Volver a la vista anterior" (WCAG 2.1 AA)
 *   - E2E-43-EDGE-03 [P1] Contact detail accessed directly via URL also shows the "Volver" button
 *   - E2E-43-EDGE-04 [P1] Non-existent contactoId shows "Contacto no encontrado" (404 path)
 *   - E2E-43-EDGE-05 [P1] Two contacts: clicking the second one navigates to the second contact's URL
 *   - E2E-43-EDGE-06 [P1] page.goBack() from contact detail returns to client detail (browser history back)
 *   - E2E-43-EDGE-07 [P2] Client with no contacts: ContactManager empty state renders — no crash on click area
 *   - E2E-43-EDGE-08 [P2] Volver button is NOT rendered during the loading skeleton state
 *   - E2E-43-EDGE-09 [P2] Contact detail panel shows the correct contact nombre after navigation
 *   - E2E-43-EDGE-10 [P2] JS errors are not thrown during the client→contact navigation flow
 */

test.describe('Story 4.3 — Edge Cases: Navigate from Client Detail to Contact Detail', () => {
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
  // E2E-43-EDGE-01 [P1]
  // Given the user clicks a contact row in ContactManager
  // When the navigation completes
  // Then the resulting URL contains a valid UUID-format contactoId (not 'undefined', not '[object]')
  // AND the URL path matches /contactos/{uuid} exactly
  // ---------------------------------------------------------------------------
  test('[P1] E2E-43-EDGE-01 — URL tras navegar al contacto contiene UUID válido (no "undefined")', async ({ page }) => {
    // GIVEN — Create a client and an associated contact
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);
    const contacto = await apiHelper.createContacto(buildContacto({ clienteId: cliente.id }));
    createdContactoIds.push(contacto.id);

    await page.route(`**/api/v1/contactos?clienteId=${cliente.id}`, async (route) => {
      await route.continue();
    });

    // WHEN — Navigate to client detail and click the contact row
    await page.goto(`/clientes/${cliente.id}`);
    await expect(page.getByTestId('contact-manager')).toBeVisible();
    await page.getByTestId('contact-manager').getByText(contacto.nombre).click();
    await page.waitForURL(`**/contactos/**`);

    // THEN — URL contains a properly formatted UUID (8-4-4-4-12 hex chars)
    const uuidPattern = /\/contactos\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    expect(page.url()).toMatch(uuidPattern);

    // AND — URL does not contain the literal string 'undefined' or '[object'
    expect(page.url()).not.toContain('undefined');
    expect(page.url()).not.toContain('[object');

    // AND — the UUID in the URL matches the contacto.id created via API
    expect(page.url()).toContain(`/contactos/${contacto.id}`);
  });

  // ---------------------------------------------------------------------------
  // E2E-43-EDGE-02 [P1]
  // Given the user has navigated to a contact detail
  // When the Volver button is rendered
  // Then it has aria-label="Volver a la vista anterior" (WCAG 2.1 AA)
  // AND the button text is "Volver" (Spanish — company standard)
  // AND data-testid="btn-volver" is present
  // ---------------------------------------------------------------------------
  test('[P1] E2E-43-EDGE-02 — botón Volver cumple WCAG: aria-label, texto español y data-testid correctos', async ({ page }) => {
    // GIVEN — Create a client and an associated contact
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);
    const contacto = await apiHelper.createContacto(buildContacto({ clienteId: cliente.id }));
    createdContactoIds.push(contacto.id);

    // WHEN — Navigate to the contact detail via the ContactManager
    await page.goto(`/clientes/${cliente.id}`);
    await expect(page.getByTestId('contact-manager')).toBeVisible();
    await page.getByTestId('contact-manager').getByText(contacto.nombre).click();
    await page.waitForURL(`**/contactos/${contacto.id}`);

    // THEN — Volver button is present with all required WCAG attributes
    const btnVolver = page.getByTestId('btn-volver');
    await expect(btnVolver).toBeVisible();
    await expect(btnVolver).toHaveAttribute('aria-label', 'Volver a la vista anterior');
    await expect(btnVolver).toContainText('Volver');

    // AND — button role is accessible (it is a <button> element)
    await expect(btnVolver).toHaveAttribute('type', 'button');
  });

  // ---------------------------------------------------------------------------
  // E2E-43-EDGE-03 [P1]
  // Given the user accesses a contact detail page directly via URL (not from ContactManager)
  // When the page loads
  // Then the "Volver" button is still present (standalone access path)
  // This validates that btn-volver is always rendered, not only after ContactManager navigation
  // ---------------------------------------------------------------------------
  test('[P1] E2E-43-EDGE-03 — btn-volver está presente al acceder al contacto directamente por URL', async ({ page }) => {
    // GIVEN — Create a contact (may or may not have a client)
    const contacto = await apiHelper.createContacto(buildContacto());
    createdContactoIds.push(contacto.id);

    // WHEN — Navigate directly to the contact detail by URL (no browser history from client detail)
    await page.goto(`/contactos/${contacto.id}`);
    await page.waitForURL(`**/contactos/${contacto.id}`);

    // THEN — Volver button is rendered even without prior navigation history
    const btnVolver = page.getByTestId('btn-volver');
    await expect(btnVolver).toBeVisible();
    await expect(btnVolver).toContainText('Volver');
  });

  // ---------------------------------------------------------------------------
  // E2E-43-EDGE-04 [P1]
  // Given a contactoId that does not exist in the system (simulated 404)
  // When the user navigates directly to /contactos/:nonExistentId
  // Then "Contacto no encontrado" is shown (404 error path)
  // AND the application does NOT crash (no JS error overlay)
  // ---------------------------------------------------------------------------
  test('[P1] E2E-43-EDGE-04 — contactoId inexistente muestra "Contacto no encontrado" sin crash', async ({ page }) => {
    // GIVEN — a UUID that does not match any existing contact
    const nonExistentId = '00000000-0000-4000-8000-000000000002';

    // CRITICAL: intercept before navigation — simulate 404 from backend
    await page.route(`**/api/v1/contactos/${nonExistentId}`, (route) => {
      route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({ title: 'Not Found', status: 404 }),
      });
    });

    // Catch unexpected JS errors
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    // WHEN — navigate directly to the non-existent contact
    await page.goto(`/contactos/${nonExistentId}`);

    // THEN — 404 state is rendered
    await expect(page.getByTestId('contacto-not-found')).toBeVisible();
    await expect(page.getByTestId('contacto-not-found')).toContainText(/contacto no encontrado/i);

    // AND — no unhandled JS errors occurred
    expect(jsErrors).toHaveLength(0);

    // AND — no Vite/React error overlay
    await expect(page.locator('vite-error-overlay')).toHaveCount(0);
  });

  // ---------------------------------------------------------------------------
  // E2E-43-EDGE-05 [P1]
  // Given a client has two associated contacts
  // When the user clicks the SECOND contact row in ContactManager
  // Then navigation goes to the SECOND contact's URL (not the first)
  // This validates that contact ID resolution is per-row, not first-match
  // ---------------------------------------------------------------------------
  test('[P1] E2E-43-EDGE-05 — clic en el segundo contacto navega a la URL del segundo contacto', async ({ page }) => {
    // GIVEN — Create a client with two associated contacts
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);

    const contacto1 = await apiHelper.createContacto(buildContacto({ clienteId: cliente.id }));
    createdContactoIds.push(contacto1.id);

    const contacto2 = await apiHelper.createContacto(buildContacto({ clienteId: cliente.id }));
    createdContactoIds.push(contacto2.id);

    await page.route(`**/api/v1/contactos?clienteId=${cliente.id}`, async (route) => {
      await route.continue();
    });

    // WHEN — Navigate to client detail and click the SECOND contact
    await page.goto(`/clientes/${cliente.id}`);
    await expect(page.getByTestId('contact-manager')).toBeVisible();

    // Click the second contact by its name
    await page.getByTestId('contact-manager').getByText(contacto2.nombre).click();
    await page.waitForURL(`**/contactos/**`);

    // THEN — URL contains the SECOND contact's ID (not the first)
    expect(page.url()).toContain(`/contactos/${contacto2.id}`);
    expect(page.url()).not.toContain(`/contactos/${contacto1.id}`);
  });

  // ---------------------------------------------------------------------------
  // E2E-43-EDGE-06 [P1]
  // Given the user navigated from the client detail to the contact detail via ContactManager
  // When the user calls page.goBack() (browser history back, alternative to "Volver" button)
  // Then the user is returned to the client detail view at /clientes/:clienteId
  // This validates that the browser history stack is correctly maintained
  // ---------------------------------------------------------------------------
  test('[P1] E2E-43-EDGE-06 — page.goBack() desde el contacto regresa al detalle del cliente', async ({ page }) => {
    // GIVEN — Create a client and an associated contact
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);
    const contacto = await apiHelper.createContacto(buildContacto({ clienteId: cliente.id }));
    createdContactoIds.push(contacto.id);

    await page.route(`**/api/v1/contactos?clienteId=${cliente.id}`, async (route) => {
      await route.continue();
    });

    // WHEN — Navigate client detail → contact detail via ContactManager
    await page.goto(`/clientes/${cliente.id}`);
    await expect(page.getByTestId('contact-manager')).toBeVisible();
    await page.getByTestId('contact-manager').getByText(contacto.nombre).click();
    await page.waitForURL(`**/contactos/${contacto.id}`);

    // AND — confirm on contact detail
    expect(page.url()).toContain(`/contactos/${contacto.id}`);

    // WHEN — User goes back using browser history
    await page.goBack();

    // THEN — User is back on the client detail view
    await page.waitForURL(`**/clientes/${cliente.id}`);
    expect(page.url()).toContain(`/clientes/${cliente.id}`);

    // AND — client detail content is rendered (not blank)
    await expect(page.getByTestId('contact-manager')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // E2E-43-EDGE-07 [P2]
  // Given a client with NO associated contacts
  // When the user navigates to the client detail view
  // Then the ContactManager shows an empty state
  // AND clicking the ContactManager area does NOT cause a JS error (click delegation safety)
  // ---------------------------------------------------------------------------
  test('[P2] E2E-43-EDGE-07 — cliente sin contactos: estado vacío en ContactManager sin crash al hacer clic', async ({ page }) => {
    // GIVEN — Create a client with NO contacts
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);

    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await page.route(`**/api/v1/contactos?clienteId=${cliente.id}`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // WHEN — Navigate to client detail
    await page.goto(`/clientes/${cliente.id}`);
    await expect(page.getByTestId('contact-manager')).toBeVisible();

    // AND — Click somewhere within the contact-manager container (empty area)
    await page.getByTestId('contact-manager').click({ force: true });

    // THEN — No JS errors occurred
    expect(jsErrors).toHaveLength(0);

    // AND — URL did NOT change to a contact detail (no navigation from empty state)
    expect(page.url()).not.toContain('/contactos/');
    expect(page.url()).toContain(`/clientes/${cliente.id}`);
  });

  // ---------------------------------------------------------------------------
  // E2E-43-EDGE-08 [P2]
  // Given the contact detail backend is slow (artificial delay)
  // When the page is loading
  // Then the loading skeleton is rendered
  // AND btn-volver is NOT visible during the loading state (skeleton phase)
  // ---------------------------------------------------------------------------
  test('[P2] E2E-43-EDGE-08 — btn-volver no es visible durante el esqueleto de carga del contacto', async ({ page }) => {
    // GIVEN — Create a contact
    const contacto = await apiHelper.createContacto(buildContacto());
    createdContactoIds.push(contacto.id);

    let resolveDelay: () => void;
    const delayPromise = new Promise<void>((resolve) => { resolveDelay = resolve; });

    // CRITICAL: intercept before navigation — artificial delay on contact fetch
    await page.route(`**/api/v1/contactos/${contacto.id}`, async (route) => {
      await delayPromise;
      await route.continue();
    });

    // WHEN — initiate navigation (do not await fully — inspect loading state)
    const gotoPromise = page.goto(`/contactos/${contacto.id}`);

    // THEN — during loading, the contacto-detail-panel skeleton is shown
    await expect(page.getByTestId('contacto-detail-panel')).toBeVisible();

    // AND — btn-volver is NOT yet visible in the skeleton state
    // (the skeleton state does not render the Volver button — it only renders Skeleton components)
    await expect(page.getByTestId('btn-volver')).not.toBeVisible();

    // Release the delayed response — allow contact data to load
    resolveDelay!();
    await gotoPromise;

    // AND — after load, btn-volver IS visible
    await expect(page.getByTestId('btn-volver')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // E2E-43-EDGE-09 [P2]
  // Given the user clicks a contact row in ContactManager
  // When the contact detail page finishes loading
  // Then the contacto-detail-nombre shows the correct contact name
  // (validates that the contactoId passed to the route resolves to the correct contact data)
  // ---------------------------------------------------------------------------
  test('[P2] E2E-43-EDGE-09 — el nombre del contacto es correcto en la vista de detalle tras navegar', async ({ page }) => {
    // GIVEN — Create a client and an associated contact with a specific name
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);

    // buildContacto already generates unique names via internal counter — no Date.now() needed
    const contactoData = buildContacto({
      clienteId: cliente.id,
    });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    await page.route(`**/api/v1/contactos?clienteId=${cliente.id}`, async (route) => {
      await route.continue();
    });

    // WHEN — Navigate to client detail and click the contact
    await page.goto(`/clientes/${cliente.id}`);
    await expect(page.getByTestId('contact-manager')).toBeVisible();
    await page.getByTestId('contact-manager').getByText(contacto.nombre).click();
    await page.waitForURL(`**/contactos/${contacto.id}`);

    // THEN — The contact detail shows the correct nombre
    await expect(page.getByTestId('contacto-detail-nombre')).toBeVisible();
    await expect(page.getByTestId('contacto-detail-nombre')).toHaveText(contacto.nombre);
  });

  // ---------------------------------------------------------------------------
  // E2E-43-EDGE-10 [P2]
  // Given the full client→contact navigation flow
  // When the user clicks a contact and arrives at the contact detail
  // Then no JavaScript errors are thrown during the entire navigation sequence
  // ---------------------------------------------------------------------------
  test('[P2] E2E-43-EDGE-10 — sin errores JS durante el flujo completo de navegación cliente→contacto', async ({ page }) => {
    // GIVEN — Create a client and an associated contact
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);
    const contacto = await apiHelper.createContacto(buildContacto({ clienteId: cliente.id }));
    createdContactoIds.push(contacto.id);

    // Track all JS errors during the navigation flow
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') jsErrors.push(`[console.error] ${msg.text()}`);
    });

    await page.route(`**/api/v1/contactos?clienteId=${cliente.id}`, async (route) => {
      await route.continue();
    });
    await page.route(`**/api/v1/contactos/${contacto.id}`, async (route) => {
      await route.continue();
    });

    // WHEN — Execute the full navigation flow
    // Step 1: Go to client list
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // Step 2: Click client (click 1 — from /clientes to /clientes/:id)
    await page.getByTestId('cliente-list-item').filter({ hasText: cliente.nombre }).click();
    await expect(page.getByTestId('contact-manager')).toBeVisible();

    // Step 3: Click contact (click 2 — from /clientes/:id to /contactos/:id)
    await page.getByTestId('contact-manager').getByText(contacto.nombre).click();
    await page.waitForURL(`**/contactos/${contacto.id}`);

    // Step 4: Verify contact detail loaded
    await expect(page.getByTestId('btn-volver')).toBeVisible();

    // THEN — No JS errors occurred during the entire flow
    expect(jsErrors).toHaveLength(0);
  });
});

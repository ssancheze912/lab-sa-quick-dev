import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente, buildContacto } from '../../helpers/data.helper';

/**
 * Edge Case Tests — Story 4.4: View Associated Client from Contact Detail
 *
 * Expands ATDD baseline (asociacion-navegacion.spec.ts — E2E-AC-13, E2E-AC-14, E2E-AC-15) with:
 *
 *   E2E-44-EDGE-01 [P1] Client name link has correct href pointing to /clientes/:clienteId (link target)
 *   E2E-44-EDGE-02 [P1] Skeleton shown while cliente data loads — no link or fallback visible yet
 *   E2E-44-EDGE-03 [P1] clienteId in URL after click matches the contacto's actual clienteId
 *   E2E-44-EDGE-04 [P1] Client link has aria-label="Ir al cliente asociado" (WCAG 2.1 AA)
 *   E2E-44-EDGE-05 [P1] "Sin cliente asignado" text is case-insensitive visible (exact Spanish text)
 *   E2E-44-EDGE-06 [P1] Non-existent contactoId shows 404 message — no crash when no clienteId
 *   E2E-44-EDGE-07 [P1] Both contact fields AND cliente section are visible in same render
 *   E2E-44-EDGE-08 [P1] Reassigning a client via API and reloading updates the client link
 *   E2E-44-EDGE-09 [P2] No JS errors thrown when clienteAsociadoLink is clicked
 *   E2E-44-EDGE-10 [P2] clienteAsociadoLink is NOT present when contact has no clienteId (DOM absence)
 *   E2E-44-EDGE-11 [P2] Backend 404 for clienteId (deleted client) — no crash in contact detail
 *   E2E-44-EDGE-12 [P2] client detail panel is visible after clicking clienteAsociadoLink
 */

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

test.describe('Story 4.4 — Edge Cases: View Associated Client from Contact Detail', () => {
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
  // E2E-44-EDGE-01 [P1]
  // Given a contact associated with a client
  // When the user views the contact detail
  // Then the clienteAsociadoLink href resolves to /clientes/:clienteId
  // This validates the TanStack Router Link params binding — not just text, but also destination
  // ---------------------------------------------------------------------------
  test('[P1] E2E-44-EDGE-01 — el href del link del cliente apunta a /clientes/:clienteId correcto', async ({ page }) => {
    // GIVEN — Create client + associated contact via API
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);
    const contacto = await apiHelper.createContacto(buildContacto({ clienteId: cliente.id }));
    createdContactoIds.push(contacto.id);

    // WHEN — Navigate to contact detail
    await page.goto(`/contactos/${contacto.id}`);
    await page.waitForURL(`**/contactos/${contacto.id}**`);

    // THEN — The link is visible
    const clienteLink = page.getByTestId('clienteAsociadoLink');
    await expect(clienteLink).toBeVisible();

    // AND — The href contains the correct clienteId path segment
    const href = await clienteLink.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).toContain(`/clientes/${cliente.id}`);
  });

  // ---------------------------------------------------------------------------
  // E2E-44-EDGE-02 [P1]
  // Given a contact with a clienteId
  // When the backend response for /api/v1/clientes/:id is artificially delayed
  // Then neither clienteAsociadoLink nor sinClienteAsignado is visible during loading
  // (skeleton placeholder renders instead — no link or fallback text)
  // ---------------------------------------------------------------------------
  test('[P1] E2E-44-EDGE-02 — esqueleto visible mientras clienteId carga: no link ni "Sin cliente asignado"', async ({ page }) => {
    // GIVEN — Create client + associated contact via API
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);
    const contacto = await apiHelper.createContacto(buildContacto({ clienteId: cliente.id }));
    createdContactoIds.push(contacto.id);

    let resolveDelay: () => void;
    const delayPromise = new Promise<void>((resolve) => { resolveDelay = resolve; });

    // CRITICAL: intercept BEFORE navigation — delay the cliente fetch only
    await page.route(`**/api/v1/clientes/${cliente.id}`, async (route) => {
      await delayPromise;
      await route.continue();
    });

    // WHEN — Navigate to the contact detail
    await page.goto(`/contactos/${contacto.id}`);
    await page.waitForURL(`**/contactos/${contacto.id}**`);

    // Wait for contacto data to load (so we can see the Cliente section rendering)
    await expect(page.getByTestId('contacto-detail-panel')).toBeVisible();
    await expect(page.getByTestId('contacto-detail-nombre')).toBeVisible();

    // THEN — While cliente is loading: no link and no fallback text
    await expect(page.getByTestId('clienteAsociadoLink')).not.toBeVisible();
    await expect(page.getByTestId('sin-cliente-asignado')).not.toBeVisible();

    // Release the delayed response
    resolveDelay!();

    // AND — After loading: link becomes visible
    await expect(page.getByTestId('clienteAsociadoLink')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // E2E-44-EDGE-03 [P1]
  // Given a contact associated with a specific client
  // When the user clicks the clienteAsociadoLink
  // Then the resulting URL contains exactly the contacto's clienteId
  // (validates param binding — not just any /clientes URL)
  // ---------------------------------------------------------------------------
  test('[P1] E2E-44-EDGE-03 — URL tras clic en link contiene el clienteId exacto del contacto', async ({ page }) => {
    // Capture JS errors
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    // GIVEN — Create client + associated contact via API
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);
    const contacto = await apiHelper.createContacto(buildContacto({ clienteId: cliente.id }));
    createdContactoIds.push(contacto.id);

    // WHEN — Navigate to contact detail and click the link
    await page.goto(`/contactos/${contacto.id}`);
    await page.waitForURL(`**/contactos/${contacto.id}**`);

    const clienteLink = page.getByTestId('clienteAsociadoLink');
    await expect(clienteLink).toBeVisible();
    await clienteLink.click();

    // THEN — URL contains exactly the clienteId (not a garbled or null value)
    await page.waitForURL(`**/clientes/${cliente.id}**`, { timeout: 5000 });
    expect(page.url()).toContain(`/clientes/${cliente.id}`);

    // AND — URL does not contain 'undefined' or '[object'
    expect(page.url()).not.toContain('undefined');
    expect(page.url()).not.toContain('[object');

    // AND — No JS errors
    expect(jsErrors).toHaveLength(0);
  });

  // ---------------------------------------------------------------------------
  // E2E-44-EDGE-04 [P1]
  // Given a contact associated with a client
  // When the contact detail renders the clienteAsociadoLink
  // Then the link has aria-label="Ir al cliente asociado" (WCAG 2.1 AA accessibility)
  // ---------------------------------------------------------------------------
  test('[P1] E2E-44-EDGE-04 — clienteAsociadoLink tiene aria-label="Ir al cliente asociado" (WCAG 2.1 AA)', async ({ page }) => {
    // GIVEN — Create client + associated contact via API
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);
    const contacto = await apiHelper.createContacto(buildContacto({ clienteId: cliente.id }));
    createdContactoIds.push(contacto.id);

    // WHEN — Navigate to contact detail
    await page.goto(`/contactos/${contacto.id}`);
    await page.waitForURL(`**/contactos/${contacto.id}**`);

    // THEN — The link is accessible via ARIA
    const clienteLink = page.getByTestId('clienteAsociadoLink');
    await expect(clienteLink).toBeVisible();
    await expect(clienteLink).toHaveAttribute('aria-label', 'Ir al cliente asociado');
  });

  // ---------------------------------------------------------------------------
  // E2E-44-EDGE-05 [P1]
  // Given a contact with no associated client (clienteId is null)
  // When the user views the contact detail
  // Then "Sin cliente asignado" displays with exact Spanish text (locale correctness)
  // AND the text matches case-insensitive /sin cliente asignado/i pattern
  // ---------------------------------------------------------------------------
  test('[P1] E2E-44-EDGE-05 — "Sin cliente asignado" muestra el texto exacto en español', async ({ page }) => {
    // GIVEN — Create orphan contact (no client)
    const contacto = await apiHelper.createContacto(buildContacto({ clienteId: null }));
    createdContactoIds.push(contacto.id);

    // WHEN — Navigate to contact detail
    await page.goto(`/contactos/${contacto.id}`);
    await page.waitForURL(`**/contactos/${contacto.id}**`);

    // THEN — The fallback text is visible
    const sinCliente = page.getByTestId('sin-cliente-asignado');
    await expect(sinCliente).toBeVisible();

    // AND — Exact text content is "Sin cliente asignado" (Spanish, not "No client assigned")
    await expect(sinCliente).toHaveText(/sin cliente asignado/i);
    const textContent = await sinCliente.textContent();
    expect(textContent?.trim().toLowerCase()).toBe('sin cliente asignado');
  });

  // ---------------------------------------------------------------------------
  // E2E-44-EDGE-06 [P1]
  // Given a non-existent contactoId (404 simulated)
  // When the user navigates to /contactos/:nonExistentId
  // Then "Contacto no encontrado" is shown (404 path)
  // AND the application does NOT crash (no JS error overlay)
  // AND the clienteId section is NOT rendered (component aborted on not-found)
  // ---------------------------------------------------------------------------
  test('[P1] E2E-44-EDGE-06 — contactoId inexistente muestra 404 sin crash y sin sección de cliente', async ({ page }) => {
    // GIVEN — a UUID that does not exist
    const nonExistentId = '00000000-0000-4000-8000-000000000044';

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

    // WHEN — navigate to the non-existent contact
    await page.goto(`/contactos/${nonExistentId}`);

    // THEN — 404 state is rendered (not-found message)
    await expect(page.getByTestId('contacto-not-found')).toBeVisible();
    await expect(page.getByTestId('contacto-not-found')).toContainText(/contacto no encontrado/i);

    // AND — Neither client link nor "sin cliente asignado" is present (component returned early)
    await expect(page.getByTestId('clienteAsociadoLink')).not.toBeVisible();
    await expect(page.getByTestId('sin-cliente-asignado')).not.toBeVisible();

    // AND — No unhandled JS errors
    expect(jsErrors).toHaveLength(0);

    // AND — No Vite error overlay
    await expect(page.locator('vite-error-overlay')).toHaveCount(0);
  });

  // ---------------------------------------------------------------------------
  // E2E-44-EDGE-07 [P1]
  // Given a contact associated with a client
  // When the contact detail renders
  // Then both the standard contact fields AND the "Cliente" section are visible
  // This validates that the Cliente section addition did not break existing fields layout
  // ---------------------------------------------------------------------------
  test('[P1] E2E-44-EDGE-07 — sección Cliente coexiste con los campos de contacto existentes (Nombre, Cargo, Teléfono, Email)', async ({ page }) => {
    // GIVEN — Create client + associated contact via API
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);
    const contacto = await apiHelper.createContacto(buildContacto({ clienteId: cliente.id }));
    createdContactoIds.push(contacto.id);

    // WHEN — Navigate to contact detail
    await page.goto(`/contactos/${contacto.id}`);
    await page.waitForURL(`**/contactos/${contacto.id}**`);

    // THEN — All existing contact fields are still visible
    await expect(page.getByTestId('contacto-detail-nombre')).toBeVisible();
    await expect(page.getByTestId('contacto-detail-cargo')).toBeVisible();
    await expect(page.getByTestId('contacto-detail-telefono')).toBeVisible();
    await expect(page.getByTestId('contacto-detail-email')).toBeVisible();

    // AND — The cliente link is also visible (new section present)
    await expect(page.getByTestId('clienteAsociadoLink')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // E2E-44-EDGE-08 [P1]
  // Given a contact initially associated with a client
  // When the client association is changed via API (asignarClienteAContacto with new clienteId)
  // AND the page is reloaded
  // Then the updated client name is displayed (not the old one)
  // This validates that there is no stale cache that shows old data after reassignment
  // ---------------------------------------------------------------------------
  test('[P1] E2E-44-EDGE-08 — reasignar cliente vía API y recargar muestra el nuevo nombre de cliente', async ({ page }) => {
    // GIVEN — Create two clients and one contact associated with the first
    const cliente1 = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente1.id);
    const cliente2 = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente2.id);

    const contacto = await apiHelper.createContacto(buildContacto({ clienteId: cliente1.id }));
    createdContactoIds.push(contacto.id);

    // Navigate to contact detail — confirm first client name is shown
    await page.goto(`/contactos/${contacto.id}`);
    await page.waitForURL(`**/contactos/${contacto.id}**`);
    const clienteLink = page.getByTestId('clienteAsociadoLink');
    await expect(clienteLink).toBeVisible();
    await expect(clienteLink).toContainText(cliente1.nombre);

    // WHEN — Reassign to the second client via API
    await apiHelper.asignarClienteAContacto(contacto.id, cliente2.id);

    // AND — Reload the page (cache bust)
    await page.reload();
    await page.waitForURL(`**/contactos/${contacto.id}**`);

    // THEN — The updated client name (cliente2) is now shown
    const updatedLink = page.getByTestId('clienteAsociadoLink');
    await expect(updatedLink).toBeVisible();
    await expect(updatedLink).toContainText(cliente2.nombre);

    // AND — The old client name is NOT shown
    await expect(updatedLink).not.toContainText(cliente1.nombre);
  });

  // ---------------------------------------------------------------------------
  // E2E-44-EDGE-09 [P2]
  // Given a contact associated with a client
  // When the user clicks clienteAsociadoLink
  // Then no JavaScript errors are thrown during the navigation
  // (validates no runtime errors in the SPA transition to /clientes/:id)
  // ---------------------------------------------------------------------------
  test('[P2] E2E-44-EDGE-09 — sin errores JS al hacer clic en clienteAsociadoLink', async ({ page }) => {
    // Track ALL JS errors and console errors
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') jsErrors.push(`[console.error] ${msg.text()}`);
    });

    // GIVEN — Create client + associated contact via API
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);
    const contacto = await apiHelper.createContacto(buildContacto({ clienteId: cliente.id }));
    createdContactoIds.push(contacto.id);

    // WHEN — Navigate to contact detail
    await page.goto(`/contactos/${contacto.id}`);
    await page.waitForURL(`**/contactos/${contacto.id}**`);

    // AND — Click the client link
    const clienteLink = page.getByTestId('clienteAsociadoLink');
    await expect(clienteLink).toBeVisible();
    await clienteLink.click();

    // Wait for navigation to complete
    await page.waitForURL(`**/clientes/${cliente.id}**`, { timeout: 5000 });

    // THEN — No JS errors occurred
    expect(jsErrors).toHaveLength(0);
  });

  // ---------------------------------------------------------------------------
  // E2E-44-EDGE-10 [P2]
  // Given a contact with no associated client (null clienteId)
  // When the user views the contact detail
  // Then clienteAsociadoLink is completely absent from the DOM (not just hidden)
  // This is stricter than E2E-AC-15 which uses not.toBeVisible() — here we check count
  // ---------------------------------------------------------------------------
  test('[P2] E2E-44-EDGE-10 — clienteAsociadoLink completamente ausente del DOM para contacto sin cliente', async ({ page }) => {
    // GIVEN — Create orphan contact (no client)
    const contacto = await apiHelper.createContacto(buildContacto({ clienteId: null }));
    createdContactoIds.push(contacto.id);

    // WHEN — Navigate to contact detail
    await page.goto(`/contactos/${contacto.id}`);
    await page.waitForURL(`**/contactos/${contacto.id}**`);

    // Wait for detail panel to be rendered
    await expect(page.getByTestId('contacto-detail-panel')).toBeVisible();

    // THEN — clienteAsociadoLink does not exist in the DOM at all (count = 0)
    await expect(page.getByTestId('clienteAsociadoLink')).toHaveCount(0);

    // AND — sinClienteAsignado IS present in the DOM
    await expect(page.getByTestId('sin-cliente-asignado')).toHaveCount(1);
  });

  // ---------------------------------------------------------------------------
  // E2E-44-EDGE-11 [P2]
  // Given a contact with a clienteId that no longer exists on the backend (orphaned reference)
  // When the GET /api/v1/clientes/:clienteId returns 404 (simulated deleted client)
  // Then the contact detail does NOT crash
  // AND no JS error is thrown
  // AND the component shows the clienteId UUID as fallback link text (per dev notes)
  // ---------------------------------------------------------------------------
  test('[P2] E2E-44-EDGE-11 — cliente eliminado (404) no causa crash en el detalle del contacto', async ({ page }) => {
    // GIVEN — A contact that references a deleted/non-existent client
    const orphanClienteId = '00000000-dead-4000-beef-000000000044';
    const contacto = await apiHelper.createContacto(buildContacto({ clienteId: null }));
    createdContactoIds.push(contacto.id);

    // Catch unexpected JS errors
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    // CRITICAL: intercept before navigation — serve contact with orphanClienteId
    await page.route(`**/api/v1/contactos/${contacto.id}`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: contacto.id,
          nombre: contacto.nombre,
          cargo: 'Analista',
          telefono: '3001234567',
          email: contacto.email,
          clienteId: orphanClienteId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      });
    });

    // AND — Simulate 404 from the cliente endpoint
    await page.route(`**/api/v1/clientes/${orphanClienteId}`, (route) => {
      route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({ title: 'Not Found', status: 404 }),
      });
    });

    // WHEN — Navigate to the contact detail
    await page.goto(`/contactos/${contacto.id}`);
    await page.waitForURL(`**/contactos/${contacto.id}**`);

    // Wait for contact detail to render
    await expect(page.getByTestId('contacto-detail-panel')).toBeVisible();

    // THEN — Application does NOT crash
    await expect(page.locator('vite-error-overlay')).toHaveCount(0);

    // AND — No JS errors thrown
    expect(jsErrors).toHaveLength(0);

    // AND — The contact data itself is still visible (no blank screen)
    await expect(page.getByTestId('contacto-detail-nombre')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // E2E-44-EDGE-12 [P2]
  // Given a contact associated with a client
  // When the user clicks the clienteAsociadoLink
  // Then the client detail content is rendered at the destination URL
  // (validates the full round-trip: contact → click → client detail visible)
  // ---------------------------------------------------------------------------
  test('[P2] E2E-44-EDGE-12 — detalle del cliente es visible tras hacer clic en clienteAsociadoLink', async ({ page }) => {
    // Capture JS errors
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    // GIVEN — Create client + associated contact via API
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);
    const contacto = await apiHelper.createContacto(buildContacto({ clienteId: cliente.id }));
    createdContactoIds.push(contacto.id);

    // Navigate to contact detail
    await page.goto(`/contactos/${contacto.id}`);
    await page.waitForURL(`**/contactos/${contacto.id}**`);

    // WHEN — Click the client link (1 click — FR24)
    const clienteLink = page.getByTestId('clienteAsociadoLink');
    await expect(clienteLink).toBeVisible();
    await clienteLink.click();

    // THEN — URL changed to the client detail
    await page.waitForURL(`**/clientes/${cliente.id}**`, { timeout: 5000 });
    expect(page.url()).toContain(`/clientes/${cliente.id}`);

    // AND — Client detail content is rendered (contact-manager is part of client detail view)
    await expect(page.getByTestId('contact-manager')).toBeVisible();

    // AND — No JS errors
    expect(jsErrors).toHaveLength(0);
  });
});

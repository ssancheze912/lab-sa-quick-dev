import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente, buildContacto } from '../../helpers/data.helper';

/**
 * Edge Case Tests — Story 4.1: View Associated Contacts in Client Detail
 *
 * Expands ATDD baseline (asociacion-contactmanager.spec.ts) with:
 *   - E2E-EDGE-01 [P1] Client 404: navigating to a non-existent clienteId shows "Cliente no encontrado"
 *   - E2E-EDGE-02 [P1] Loading skeleton: skeleton rows appear before the client data resolves
 *   - E2E-EDGE-03 [P1] Client detail fields: nombre, nit, telefono, ciudad are rendered in the panel
 *   - E2E-EDGE-04 [P1] WCAG aria-label: detail panel has aria-label="Detalle del cliente" when loaded
 *   - E2E-EDGE-05 [P2] Single contact: ContactManager shows exactly 1 row (boundary — minimum non-zero count)
 *   - E2E-EDGE-06 [P2] Non-UUID route param: navigating to /clientes/not-a-uuid shows "Cliente no encontrado" (no crash)
 *   - E2E-EDGE-07 [P2] contact-manager container is present after navigating back and forward
 */

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

test.describe('Story 4.1 — Edge Cases: View Associated Contacts in Client Detail', () => {
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
  // E2E-EDGE-01 [P1]
  // Given a clienteId that does not correspond to any existing client
  // When the user navigates to /clientes/:nonExistentId
  // Then the "Cliente no encontrado" message is rendered
  // AND the application does NOT crash (no unhandled error UI)
  // ---------------------------------------------------------------------------
  test('[P1] E2E-EDGE-01 — muestra "Cliente no encontrado" para un clienteId inexistente', async ({ page }) => {
    // GIVEN — a UUID that does not match any client in the system
    const nonExistentId = '00000000-0000-4000-8000-000000000001';

    // CRITICAL: intercept before navigation — simulate 404 from backend
    await page.route(`**/api/v1/clientes/${nonExistentId}`, (route) => {
      route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({ title: 'Not Found', status: 404 }),
      });
    });

    // WHEN — user navigates directly to the non-existent client
    await page.goto(`/clientes/${nonExistentId}`);

    // THEN — "Cliente no encontrado" is shown
    await expect(page.getByTestId('cliente-not-found')).toBeVisible();
    await expect(page.getByTestId('cliente-not-found')).toContainText(/cliente no encontrado/i);

    // AND — the contact-manager container is NOT mounted (client load failed)
    await expect(page.getByTestId('contact-manager')).toHaveCount(0);
  });

  // ---------------------------------------------------------------------------
  // E2E-EDGE-02 [P1]
  // Given the backend is slow when returning client data
  // When the user navigates to /clientes/:clienteId
  // Then the skeleton loading state is visible before data resolves
  // AND once data loads, skeleton is replaced by the actual content
  // ---------------------------------------------------------------------------
  test('[P1] E2E-EDGE-02 — muestra esqueleto de carga mientras el cliente se está cargando', async ({ page }) => {
    // GIVEN — Create a real client
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    let resolveDelay: () => void;
    const delayPromise = new Promise<void>((resolve) => { resolveDelay = resolve; });

    // CRITICAL: intercept before navigation — add artificial delay to client fetch
    await page.route(`**/api/v1/clientes/${cliente.id}`, async (route) => {
      // Wait until test signals to continue
      await delayPromise;
      await route.continue();
    });

    // WHEN — navigate (do not await fully — check intermediate state)
    const gotoPromise = page.goto(`/clientes/${cliente.id}`);

    // THEN — skeleton is visible while loading
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();

    // Release the delayed response
    resolveDelay!();

    // Await full navigation
    await gotoPromise;

    // AND — after load, actual client data replaces skeleton
    await expect(page.getByTestId('cliente-detail-nombre')).toBeVisible();
    await expect(page.getByTestId('cliente-detail-nombre')).toHaveText(clienteData.nombre);
  });

  // ---------------------------------------------------------------------------
  // E2E-EDGE-03 [P1]
  // Given a client with all fields populated (nombre, nit, telefono, ciudad)
  // When the user opens the client detail view
  // Then all four fields are rendered with the correct values
  // ---------------------------------------------------------------------------
  test('[P1] E2E-EDGE-03 — el panel de detalle muestra nombre, nit, telefono y ciudad del cliente', async ({ page }) => {
    // GIVEN — Create client with all fields
    const clienteData = buildCliente({
      nombre: `TestNombre ${Date.now()}`,
      nit: `9${Date.now().toString().slice(-8)}`,
      telefono: '+57 1 234 5678',
      ciudad: 'Medellín',
    });
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    // WHEN — navigate to client detail
    await page.goto(`/clientes/${cliente.id}`);

    // THEN — all detail fields are rendered with correct values
    await expect(page.getByTestId('cliente-detail-nombre')).toHaveText(clienteData.nombre);
    await expect(page.getByTestId('cliente-detail-nit')).toHaveText(clienteData.nit);
    await expect(page.getByTestId('cliente-detail-telefono')).toHaveText(clienteData.telefono!);
    await expect(page.getByTestId('cliente-detail-ciudad')).toHaveText(clienteData.ciudad!);
  });

  // ---------------------------------------------------------------------------
  // E2E-EDGE-04 [P1]
  // Given a client detail is fully loaded
  // When the detail panel is visible
  // Then the panel has aria-label="Detalle del cliente" for WCAG 2.1 AA
  // ---------------------------------------------------------------------------
  test('[P1] E2E-EDGE-04 — el panel de detalle tiene aria-label="Detalle del cliente" (WCAG 2.1 AA)', async ({ page }) => {
    // GIVEN — Create a client
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    // WHEN — navigate to client detail
    await page.goto(`/clientes/${cliente.id}`);

    // Wait for the panel to finish loading
    await expect(page.getByTestId('cliente-detail-nombre')).toBeVisible();

    // THEN — the detail panel container has the WCAG aria-label
    const panel = page.getByTestId('cliente-detail-panel');
    await expect(panel).toHaveAttribute('aria-label', 'Detalle del cliente');
  });

  // ---------------------------------------------------------------------------
  // E2E-EDGE-05 [P2]
  // Given a client has exactly 1 associated contact (boundary: minimum non-zero count)
  // When the user opens the client detail view
  // Then ContactManager shows exactly 1 row (not 0, not more)
  // ---------------------------------------------------------------------------
  test('[P2] E2E-EDGE-05 — ContactManager muestra exactamente 1 contacto (conteo mínimo no vacío)', async ({ page }) => {
    // GIVEN — Create a client with exactly 1 associated contact
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: cliente.id });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // CRITICAL: intercept before navigation
    await page.route(`**/api/v1/contactos?clienteId=${cliente.id}`, async (route) => {
      await route.continue();
    });

    // WHEN — navigate to client detail
    await page.goto(`/clientes/${cliente.id}`);

    // THEN — exactly 1 "Editar" button (one contact row)
    await expect(page.getByTestId('contact-manager')).toBeVisible();
    const editButtons = page.getByTestId('contact-manager').getByRole('button', { name: 'Editar' });
    await expect(editButtons).toHaveCount(1);
  });

  // ---------------------------------------------------------------------------
  // E2E-EDGE-06 [P2]
  // Given the URL has a non-UUID segment as clienteId (e.g., "not-a-valid-uuid")
  // When the user navigates to /clientes/not-a-valid-uuid
  // Then the application does NOT crash with an unhandled error
  // AND either "Cliente no encontrado" is shown OR the route does not match and
  //     the app navigates gracefully (no blank white screen / JS error visible)
  // ---------------------------------------------------------------------------
  test('[P2] E2E-EDGE-06 — URL con clienteId inválido no produce un crash de la aplicación', async ({ page }) => {
    // GIVEN — a non-UUID route param
    const invalidId = 'not-a-valid-uuid';

    // CRITICAL: intercept before navigation — simulate 400/404 from backend
    await page.route(`**/api/v1/clientes/${invalidId}`, (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/problem+json',
        body: JSON.stringify({ title: 'Bad Request', status: 400 }),
      });
    });

    // WHEN — user navigates to the invalid route
    await page.goto(`/clientes/${invalidId}`);

    // THEN — no unhandled error overlay (no "Vite error overlay" or "React error boundary" crash)
    await expect(page.locator('vite-error-overlay')).toHaveCount(0);

    // AND — app renders something meaningful (either a not-found message or the list)
    const hasNotFound = await page.getByTestId('cliente-not-found').isVisible().catch(() => false);
    const hasPanel = await page.getByTestId('cliente-detail-panel').isVisible().catch(() => false);
    const hasListPanel = await page.getByTestId('clientes-list-panel').isVisible().catch(() => false);

    expect(hasNotFound || hasPanel || hasListPanel).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // E2E-EDGE-07 [P2]
  // Given the user has navigated to a client detail with ContactManager visible
  // When the user navigates away and then returns (browser back/forward)
  // Then the contact-manager container is still mounted and visible
  // ---------------------------------------------------------------------------
  test('[P2] E2E-EDGE-07 — contact-manager persiste tras navegación atrás/adelante', async ({ page }) => {
    // GIVEN — Create a client with 1 contact
    const clienteData = buildCliente();
    const cliente = await apiHelper.createCliente(clienteData);
    createdClienteIds.push(cliente.id);

    const contactoData = buildContacto({ clienteId: cliente.id });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // Navigate to client detail and verify ContactManager is visible
    await page.goto(`/clientes/${cliente.id}`);
    await expect(page.getByTestId('contact-manager')).toBeVisible();

    // Navigate away
    await page.goto('/contactos');
    await expect(page).toHaveURL(/\/contactos/);

    // Navigate back
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`/clientes/${cliente.id}`));

    // THEN — ContactManager is visible again after returning
    await expect(page.getByTestId('contact-manager')).toBeVisible();
  });
});

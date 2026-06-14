/**
 * Story 2.2: Client Detail View — E2E Edge Case Tests
 *
 * Expands coverage beyond ATDD tests (story-2-2-client-detail-view.spec.ts).
 * Covers:
 *   - Skeleton loading state visible during slow network response
 *   - Malformed (non-UUID) clienteId in URL does not crash the app
 *   - Left panel remains interactive after deep link navigation
 *   - Right panel placeholder is not shown when a client is selected
 *   - Client detail does not show stale data immediately after switching clients
 *   - Browser history: back navigation returns to base /clientes (placeholder)
 *   - Selected client highlighted in list after deep link access
 *
 * Does NOT duplicate coverage from story-2-2-client-detail-view.spec.ts.
 */

import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

test.describe('Story 2.2 — E2E Edge Cases', () => {
  let apiHelper: ApiHelper;
  const createdIds: string[] = [];

  test.beforeEach(async ({ request }) => {
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  // ─── Skeleton visible during slow API response ──────────────────────────────

  /**
   * [P1] AC#5 — Given a valid clienteId in the URL,
   * When the API response is delayed,
   * Then a skeleton placeholder is visible in the right panel before data arrives.
   */
  test('[P1] should display skeleton placeholder while API response is delayed', async ({ page }) => {
    // GIVEN: a client exists in the system
    const data = buildCliente({ nombre: 'Skeleton Delay Test', nit: '900600001-1' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // AND: the detail API endpoint is intercepted to add a delay
    await page.route(`**/api/v1/clientes/${cliente.id}`, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.continue();
    });

    // WHEN: user navigates directly to /clientes/:id
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: skeleton is visible before data loads
    await expect(page.getByTestId('cliente-detail-skeleton')).toBeVisible();

    // AND: detail view is not yet shown (still loading)
    await expect(page.getByTestId('cliente-detail-view')).not.toBeVisible();
  });

  // ─── Placeholder not shown when a client IS selected ────────────────────────

  /**
   * [P1] AC#1 — Given a valid clienteId is in the URL and data has loaded,
   * When the detail view is rendered,
   * Then the placeholder "Selecciona un cliente…" is NOT shown.
   */
  test('[P1] should NOT show placeholder message when client is selected and loaded', async ({ page }) => {
    // GIVEN: a client exists
    const data = buildCliente({ nombre: 'No Placeholder Test', nit: '900600002-2' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: user navigates directly to /clientes/:id
    await page.goto(`/clientes/${cliente.id}`);
    await page.waitForURL(`**/clientes/${cliente.id}`);

    // AND: detail view has loaded
    await expect(page.getByTestId('cliente-detail-view')).toBeVisible();

    // THEN: placeholder is NOT visible
    await expect(
      page.getByText('Selecciona un cliente para ver sus detalles.')
    ).not.toBeVisible();
  });

  // ─── Skeleton not shown once detail data is loaded ──────────────────────────

  /**
   * [P2] AC#5 — Given a client detail has finished loading,
   * When the data is displayed,
   * Then the skeleton is no longer visible.
   */
  test('[P2] should NOT show skeleton after client detail data has loaded', async ({ page }) => {
    // GIVEN: a client exists
    const data = buildCliente({ nombre: 'No Skeleton After Load', nit: '900600003-3' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: user navigates to /clientes/:id and data loads
    await page.goto(`/clientes/${cliente.id}`);
    await page.waitForURL(`**/clientes/${cliente.id}`);
    await expect(page.getByTestId('cliente-detail-view')).toBeVisible();

    // THEN: skeleton is no longer visible
    await expect(page.getByTestId('cliente-detail-skeleton')).not.toBeVisible();
  });

  // ─── Malformed (non-UUID) clienteId does not crash the app ──────────────────

  /**
   * [P1] AC#4 — Given a non-UUID string in the clienteId URL segment,
   * When the page loads,
   * Then the app does not crash (no blank screen, some content is rendered).
   */
  test('[P1] should not crash when clienteId URL segment is not a valid UUID', async ({ page }) => {
    // GIVEN: a non-UUID string in the URL
    const malformedId = 'not-a-valid-uuid-123';

    // Track JS console errors to detect React crashes
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // WHEN: navigating to /clientes/{malformed-id}
    await page.goto(`/clientes/${malformedId}`);

    // THEN: page body is not empty (app did not blank-screen crash)
    await expect(page.locator('body')).not.toBeEmpty();

    // AND: no uncaught React/TypeError exceptions in console
    const fatalErrors = consoleErrors.filter(
      (msg) =>
        msg.includes('Uncaught') ||
        msg.includes('TypeError') ||
        msg.includes('ReferenceError')
    );
    expect(fatalErrors).toHaveLength(0);
  });

  // ─── Left panel remains visible after deep link ──────────────────────────────

  /**
   * [P2] AC#3 — Given a deep link access to /clientes/:id,
   * When the page loads,
   * Then the left panel (client list) is interactive — search input is accessible.
   */
  test('[P2] left panel search should be interactive after deep link navigation', async ({ page }) => {
    // GIVEN: a client exists
    const data = buildCliente({ nombre: 'Deep Link Interactive', nit: '900600004-4' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: user navigates directly to /clientes/:id
    await page.goto(`/clientes/${cliente.id}`);
    await page.waitForURL(`**/clientes/${cliente.id}`);

    // THEN: the search input in the left panel is visible and accessible
    await expect(page.getByLabel('Buscar cliente')).toBeVisible();

    // AND: user can type in the search input (it is interactive)
    await page.getByLabel('Buscar cliente').fill('Deep Link');
    const searchValue = await page.getByLabel('Buscar cliente').inputValue();
    expect(searchValue).toBe('Deep Link');
  });

  // ─── Browser back navigation returns to base /clientes (placeholder) ────────

  /**
   * [P2] AC#2 — Given a user navigated from /clientes to /clientes/:id,
   * When the user presses the browser back button,
   * Then the URL returns to /clientes and the placeholder message is shown.
   */
  test('[P2] browser back navigation from detail view returns to /clientes with placeholder', async ({ page }) => {
    // GIVEN: a client exists and user visits /clientes first
    const data = buildCliente({ nombre: 'Back Navigation Test', nit: '900600005-5' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: user navigates to /clientes first
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();

    // AND: user clicks the client to navigate to detail
    await page.getByTestId('cliente-list-item')
      .filter({ hasText: 'Back Navigation Test' })
      .click();
    await expect(page).toHaveURL(new RegExp(`/clientes/${cliente.id}`));
    await expect(page.getByTestId('cliente-detail-view')).toBeVisible();

    // WHEN: user presses back
    await page.goBack();
    await page.waitForURL('**/clientes');

    // THEN: URL is back to /clientes
    await expect(page).toHaveURL(/\/clientes$/);

    // AND: placeholder message is shown again
    await expect(
      page.getByText('Selecciona un cliente para ver sus detalles.')
    ).toBeVisible();
  });

  // ─── Stale data not shown after switching clients ────────────────────────────

  /**
   * [P1] AC#6 — Given a client A is displayed in the right panel,
   * When the user clicks client B in the list,
   * Then client A data is no longer visible (no stale data bleed).
   */
  test('[P1] should not show stale data from previous client after switching clients', async ({ page }) => {
    // GIVEN: two clients exist
    const clienteA = await apiHelper.createCliente(
      buildCliente({ nombre: 'Cliente Stale A', nit: '900600006-6' })
    );
    const clienteB = await apiHelper.createCliente(
      buildCliente({ nombre: 'Cliente Fresh B', nit: '900600007-7' })
    );
    createdIds.push(clienteA.id, clienteB.id);

    // WHEN: user navigates and selects client A
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();

    await page.getByTestId('cliente-list-item')
      .filter({ hasText: 'Cliente Stale A' })
      .click();
    await expect(page.getByTestId('cliente-detail-view').getByText('Cliente Stale A')).toBeVisible();

    // AND: user clicks client B
    await page.getByTestId('cliente-list-item')
      .filter({ hasText: 'Cliente Fresh B' })
      .click();

    // THEN: client B data is shown
    await expect(page.getByTestId('cliente-detail-view').getByText('Cliente Fresh B')).toBeVisible();

    // AND: client A data is no longer visible in the detail panel
    await expect(
      page.getByTestId('cliente-detail-view').getByText('Cliente Stale A')
    ).not.toBeVisible();
  });

  // ─── Right panel shows not-found even when list panel is visible ─────────────

  /**
   * [P1] AC#4 — Given a non-existent UUID in the URL,
   * When the page loads,
   * Then both panels render — left panel list is visible, right panel shows not-found.
   */
  test('[P1] should show not-found in right panel while left panel list remains visible', async ({ page }) => {
    // GIVEN: a UUID that does not exist
    const nonExistentId = '00000000-0000-0000-0000-000000000001';

    // WHEN: navigating directly to /clientes/{non-existent-uuid}
    await page.goto(`/clientes/${nonExistentId}`);
    await page.waitForURL(`**/clientes/${nonExistentId}`);

    // THEN: left panel (list) is still visible
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();

    // AND: right panel shows "Cliente no encontrado."
    await expect(page.getByText('Cliente no encontrado.')).toBeVisible();
  });

  // ─── WCAG — not-found message has role="status" ──────────────────────────────

  /**
   * [P2] WCAG — Given a non-existent UUID in the URL,
   * When "Cliente no encontrado." is displayed,
   * Then it is wrapped in an element with role="status" (accessible status announcement).
   */
  test('[P2] not-found message should have role="status" for accessibility', async ({ page }) => {
    // GIVEN: a UUID that does not exist
    const nonExistentId = '00000000-0000-0000-0000-000000000002';

    // WHEN: navigating to the non-existent URL
    await page.goto(`/clientes/${nonExistentId}`);
    await page.waitForURL(`**/clientes/${nonExistentId}`);

    // THEN: status element with "Cliente no encontrado." text is present
    const statusEl = page.getByRole('status');
    await expect(statusEl).toBeVisible();
    await expect(statusEl).toHaveText('Cliente no encontrado.');
  });

  // ─── WCAG — placeholder message has role="status" ───────────────────────────

  /**
   * [P2] WCAG — Given /clientes base route with no client selected,
   * When placeholder is shown,
   * Then it has role="status" (screen reader accessible).
   */
  test('[P2] placeholder message should have role="status" for accessibility', async ({ page }) => {
    // WHEN: navigating to /clientes (no client selected)
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');

    // THEN: status element with placeholder text is present
    const statusEl = page.getByRole('status');
    await expect(statusEl).toBeVisible();
    await expect(statusEl).toHaveText('Selecciona un cliente para ver sus detalles.');
  });

  // ─── URL reflects clienteId as a valid UUID ──────────────────────────────────

  /**
   * [P1] AC#1 — Given a user clicks on a client in the list,
   * When the URL updates to /clientes/:clienteId,
   * Then the clienteId segment in the URL matches the server-assigned UUID format.
   */
  test('[P1] URL should contain a valid UUID-format clienteId after client selection', async ({ page }) => {
    // GIVEN: a client exists
    const data = buildCliente({ nombre: 'UUID URL Test', nit: '900600008-8' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: user navigates to /clientes and selects the client
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();

    await page.getByTestId('cliente-list-item')
      .filter({ hasText: 'UUID URL Test' })
      .click();

    await expect(page).toHaveURL(new RegExp(`/clientes/${cliente.id}`));

    // THEN: the URL clienteId segment is a valid UUID (8-4-4-4-12 hex)
    const currentUrl = page.url();
    const clienteIdSegment = currentUrl.split('/clientes/')[1];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(clienteIdSegment).toMatch(uuidRegex);
  });
});

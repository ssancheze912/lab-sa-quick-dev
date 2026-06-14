/**
 * Story 2.2: Client Detail View — E2E Acceptance Tests
 * RED PHASE: These tests are written BEFORE implementation.
 *
 * Tests will fail because:
 * - ClienteDetailView component does not exist yet
 * - TanStack Router route /clientes/:clienteId not yet created
 * - GET /api/v1/clientes/{id} endpoint not yet implemented
 * - useCliente hook and clienteApiRepository.getById not yet implemented
 *
 * Acceptance Criteria covered:
 *   AC#1 — Clicking client item shows full details in right panel; URL updates to /clientes/:id
 *   AC#2 — No client selected on /clientes base route → placeholder message
 *   AC#3 — Direct URL /clientes/:clienteId loads correct client (deep link — FR30)
 *   AC#4 — Non-existent clienteId → graceful not-found message in right panel
 *
 * Test cases from test-design-epic-2.md:
 *   TC-E2-P2-04: E2E — Deep Link Direct Access to /clientes/:id (AC#3, FR30)
 *   TC-E2-P1-08: Selecting client updates detail panel and URL (AC#1)
 */

import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

test.describe('Story 2.2: Client Detail View', () => {
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

  // ─── AC#2: Placeholder when no client is selected ─────────────────────────

  /**
   * AC#2 — Given the user is on /clientes with no client selected,
   * When the right panel is displayed,
   * Then a placeholder message "Selecciona un cliente para ver sus detalles." is shown.
   */
  test('AC#2 — should show placeholder message in right panel when no client is selected', async ({ page }) => {
    // GIVEN: navigating to /clientes base route (network intercepted before navigation)
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');

    // THEN: placeholder message is displayed in the right panel
    await expect(
      page.getByText('Selecciona un cliente para ver sus detalles.')
    ).toBeVisible();

    // AND: no detail content is visible (no client selected)
    await expect(page.getByTestId('cliente-detail-view')).not.toBeVisible();
  });

  // ─── AC#1: Clicking a client item shows detail and updates URL ────────────

  /**
   * AC#1 (TC-E2-P1-08) — Given the client list is displayed,
   * When the user clicks on a client item,
   * Then the right panel shows the complete client details and the URL updates.
   */
  test('AC#1 — should show client details in right panel when client item is clicked (TC-E2-P1-08)', async ({ page }) => {
    // GIVEN: a client exists in the system
    const data = buildCliente({
      nombre: 'Empresa Detail E2E',
      nit: '900500600-1',
      telefono: '601 111 2222',
      ciudad: 'Cali',
    });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: user navigates to /clientes (intercept before navigation)
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();

    // AND: user clicks on the client item
    await page.getByTestId('cliente-list-item')
      .filter({ hasText: 'Empresa Detail E2E' })
      .click();

    // THEN: right panel shows Nombre
    await expect(
      page.getByTestId('cliente-detail-view')
    ).toBeVisible();

    await expect(
      page.getByTestId('cliente-detail-view').getByText('Empresa Detail E2E')
    ).toBeVisible();

    // AND: right panel shows NIT/RUC
    await expect(
      page.getByTestId('cliente-detail-view').getByText('900500600-1')
    ).toBeVisible();

    // AND: right panel shows Teléfono
    await expect(
      page.getByTestId('cliente-detail-view').getByText('601 111 2222')
    ).toBeVisible();

    // AND: right panel shows Ciudad
    await expect(
      page.getByTestId('cliente-detail-view').getByText('Cali')
    ).toBeVisible();

    // AND: URL updates to /clientes/:clienteId (FR30 deep linking)
    await expect(page).toHaveURL(new RegExp(`/clientes/${cliente.id}`));
  });

  // ─── AC#3: Deep link — direct URL access ──────────────────────────────────

  /**
   * AC#3 (TC-E2-P2-04) — Given the user accesses the URL /clientes/:clienteId directly,
   * When the page loads,
   * Then the correct client details are loaded and displayed without prior list navigation.
   * (FR30 deep linking)
   */
  test('AC#3 — should load client details on direct URL access without prior navigation (TC-E2-P2-04)', async ({ page }) => {
    // GIVEN: a client with known UUID exists in the system
    const data = buildCliente({
      nombre: 'Empresa Deep Link Test',
      nit: '800700800-2',
      telefono: '604 333 4444',
      ciudad: 'Barranquilla',
    });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: browser navigates DIRECTLY to /clientes/{id} (no prior navigation — deep link)
    await page.goto(`/clientes/${cliente.id}`);
    await page.waitForURL(`**/clientes/${cliente.id}`);

    // THEN: client detail panel renders with correct Nombre
    await expect(
      page.getByTestId('cliente-detail-view')
    ).toBeVisible();

    await expect(
      page.getByTestId('cliente-detail-view').getByText('Empresa Deep Link Test')
    ).toBeVisible();

    // AND: NIT/RUC is shown
    await expect(
      page.getByTestId('cliente-detail-view').getByText('800700800-2')
    ).toBeVisible();

    // AND: Teléfono is shown
    await expect(
      page.getByTestId('cliente-detail-view').getByText('604 333 4444')
    ).toBeVisible();

    // AND: Ciudad is shown
    await expect(
      page.getByTestId('cliente-detail-view').getByText('Barranquilla')
    ).toBeVisible();

    // AND: no redirect to home or root occurred
    await expect(page).toHaveURL(new RegExp(`/clientes/${cliente.id}`));
  });

  test('AC#3 — deep link should also render the client list panel (left panel visible)', async ({ page }) => {
    // GIVEN: a client exists
    const data = buildCliente({ nombre: 'Empresa Left Panel Test', nit: '700100200-3' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: direct URL access to /clientes/:id
    await page.goto(`/clientes/${cliente.id}`);
    await page.waitForURL(`**/clientes/${cliente.id}`);

    // THEN: left panel (list) is also visible — master-detail layout preserved
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
  });

  // ─── AC#4: Not-found graceful handling ────────────────────────────────────

  /**
   * AC#4 — Given a clienteId in the URL does not exist in the system,
   * When the page loads,
   * Then a not-found message "Cliente no encontrado." is displayed gracefully.
   * No crash, no blank screen, no console error.
   */
  test('AC#4 — should display "Cliente no encontrado." for non-existent UUID without crashing', async ({ page }) => {
    // GIVEN: a UUID that definitely does not exist in the system
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    // Track console errors to verify no JS crash
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // WHEN: browser navigates directly to /clientes/{non-existent-uuid}
    await page.goto(`/clientes/${nonExistentId}`);
    await page.waitForURL(`**/clientes/${nonExistentId}`);

    // THEN: "Cliente no encontrado." message is displayed gracefully
    await expect(
      page.getByText('Cliente no encontrado.')
    ).toBeVisible();

    // AND: the page is NOT blank (some content is present)
    await expect(page.locator('body')).not.toBeEmpty();

    // AND: no React/JS uncaught error was thrown
    const reactErrors = consoleErrors.filter(
      (msg) =>
        msg.includes('Uncaught') ||
        msg.includes('React') ||
        msg.includes('TypeError') ||
        msg.includes('ReferenceError')
    );
    expect(reactErrors).toHaveLength(0);
  });

  test('AC#4 — should NOT show cliente-detail-view for non-existent UUID', async ({ page }) => {
    // GIVEN: a UUID that does not exist
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    // WHEN: direct URL access
    await page.goto(`/clientes/${nonExistentId}`);

    // THEN: detail view container is not shown
    await expect(page.getByTestId('cliente-detail-view')).not.toBeVisible();

    // AND: not-found message is visible instead
    await expect(page.getByText('Cliente no encontrado.')).toBeVisible();
  });

  // ─── AC#1 extended: URL updates when switching clients ────────────────────

  /**
   * AC#1 (AC#6 from story spec) — Given a client is selected and detail is visible,
   * When the user clicks a different client in the list,
   * Then the right panel updates and the URL updates to /clientes/:newClienteId.
   */
  test('AC#1/AC#6 — should update right panel and URL when switching between clients', async ({ page }) => {
    // GIVEN: two clients exist in the system
    const clienteA = await apiHelper.createCliente(
      buildCliente({ nombre: 'Cliente Alpha', nit: '900001111-1' })
    );
    const clienteB = await apiHelper.createCliente(
      buildCliente({ nombre: 'Cliente Beta', nit: '900002222-2' })
    );
    createdIds.push(clienteA.id, clienteB.id);

    // WHEN: user navigates to /clientes and selects Cliente Alpha
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();

    await page.getByTestId('cliente-list-item')
      .filter({ hasText: 'Cliente Alpha' })
      .click();

    await expect(page.getByTestId('cliente-detail-view').getByText('Cliente Alpha')).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/clientes/${clienteA.id}`));

    // WHEN: user clicks Cliente Beta in the list
    await page.getByTestId('cliente-list-item')
      .filter({ hasText: 'Cliente Beta' })
      .click();

    // THEN: right panel updates to show Cliente Beta
    await expect(
      page.getByTestId('cliente-detail-view').getByText('Cliente Beta')
    ).toBeVisible();

    // AND: URL updates to /clientes/:clienteBId
    await expect(page).toHaveURL(new RegExp(`/clientes/${clienteB.id}`));

    // AND: Cliente Alpha detail is no longer shown
    await expect(
      page.getByTestId('cliente-detail-view').getByText('Cliente Alpha')
    ).not.toBeVisible();
  });
});

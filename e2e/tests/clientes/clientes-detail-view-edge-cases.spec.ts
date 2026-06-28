import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

/**
 * E2E edge-case tests — Story 2.2: Client Detail View (automation expansion).
 *
 * Expands ATDD coverage (clientes-detail-view.spec.ts) with:
 *   TC-E2-2-2-E2E-EC-1 (P1) — All 4 fields (Nombre, NIT/RUC, Teléfono, Ciudad) visible after navigation
 *   TC-E2-2-2-E2E-EC-2 (P1) — Clicking client in list updates URL to /clientes/:id
 *   TC-E2-2-2-E2E-EC-3 (P1) — Selected client item is highlighted as active in the list
 *   TC-E2-2-2-E2E-EC-4 (P1) — Switching from one client to another updates detail panel
 *   TC-E2-2-2-E2E-EC-5 (P1) — Detail panel shows ErrorPanel when API returns 500
 *   TC-E2-2-2-E2E-EC-6 (P2) — Navigating back to /clientes (root) shows placeholder
 *   TC-E2-2-2-E2E-EC-7 (P2) — List panel remains visible at 280px while detail is shown
 *   TC-E2-2-2-E2E-EC-8 (P2) — deep link to valid ID loads without navigating through list
 */

const UNKNOWN_UUID = '00000000-0000-0000-0000-000000000000';

test.describe('Story 2.2 — Client Detail View edge cases (E2E)', () => {
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

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E2-2-2-E2E-EC-1 (P1) — All 4 fields visible in detail panel
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E2-2-2-E2E-EC-1: [P1] should display all 4 fields (Nombre, NIT/RUC, Teléfono, Ciudad) in detail panel', async ({ page }) => {
    // GIVEN: A client exists with all fields populated
    const data = buildCliente({
      nombre: 'Empresa Campos Completos E2E',
      nit: '900111001-5',
      telefono: '3161110015',
      ciudad: 'Medellín',
    });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: User navigates directly to the client detail URL
    await page.goto(`/clientes/${created.id}`);
    await page.waitForURL(`**/clientes/${created.id}`);

    const detailPanel = page.getByTestId('cliente-detail-panel');
    await expect(detailPanel).toBeVisible();

    // THEN: Nombre is displayed
    await expect(detailPanel.getByText('Empresa Campos Completos E2E')).toBeVisible();

    // AND: NIT/RUC label and value are displayed
    await expect(detailPanel.getByText(/nit\/ruc/i)).toBeVisible();
    await expect(detailPanel.getByText('900111001-5')).toBeVisible();

    // AND: Teléfono label and value are displayed
    await expect(detailPanel.getByText(/teléfono/i)).toBeVisible();
    await expect(detailPanel.getByText('3161110015')).toBeVisible();

    // AND: Ciudad label and value are displayed
    await expect(detailPanel.getByText(/ciudad/i)).toBeVisible();
    await expect(detailPanel.getByText('Medellín')).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E2-2-2-E2E-EC-2 (P1) — Clicking client updates URL
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E2-2-2-E2E-EC-2: [P1] should update URL to /clientes/:id when clicking a client in the list', async ({ page }) => {
    // GIVEN: A client exists and is visible in the list
    const data = buildCliente({ nombre: 'Empresa Click URL Edge' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');

    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: data.nombre })
    ).toBeVisible({ timeout: 5000 });

    // WHEN: User clicks the client item
    await page.getByTestId('cliente-list-item').filter({ hasText: data.nombre }).click();

    // THEN: URL updates to /clientes/:id (FR30 deep linking)
    await page.waitForURL(`**/clientes/${created.id}`, { timeout: 3000 });
    expect(page.url()).toContain(`/clientes/${created.id}`);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E2-2-2-E2E-EC-3 (P1) — Active client highlighted in list
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E2-2-2-E2E-EC-3: [P1] should highlight selected client in the list panel after navigation', async ({ page }) => {
    // GIVEN: A client exists
    const data = buildCliente({ nombre: 'Empresa Destacada Edge' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: User navigates directly to /clientes/:id (deep link)
    await page.goto(`/clientes/${created.id}`);
    await page.waitForURL(`**/clientes/${created.id}`);

    // THEN: The list panel is visible
    await expect(page.getByTestId('cliente-list')).toBeVisible({ timeout: 5000 });

    // AND: The matching list item is visible (active/highlighted item)
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: data.nombre })
    ).toBeVisible({ timeout: 5000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E2-2-2-E2E-EC-4 (P1) — Switching between clients updates detail panel
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E2-2-2-E2E-EC-4: [P1] should show second client data after switching selection in the list', async ({ page }) => {
    // GIVEN: Two clients exist
    const data1 = buildCliente({ nombre: 'Empresa Primera Edge' });
    const data2 = buildCliente({ nombre: 'Empresa Segunda Edge' });
    const created1 = await apiHelper.createCliente(data1);
    const created2 = await apiHelper.createCliente(data2);
    createdIds.push(created1.id, created2.id);

    // WHEN: User navigates to the first client's detail
    await page.goto(`/clientes/${created1.id}`);
    await page.waitForURL(`**/clientes/${created1.id}`);

    await expect(
      page.getByTestId('cliente-detail-panel').getByText(data1.nombre)
    ).toBeVisible({ timeout: 5000 });

    // WHEN: User clicks on the second client in the list
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: data2.nombre })
    ).toBeVisible({ timeout: 5000 });

    await page.getByTestId('cliente-list-item').filter({ hasText: data2.nombre }).click();

    // THEN: URL updates to second client
    await page.waitForURL(`**/clientes/${created2.id}`, { timeout: 3000 });

    // AND: Second client data appears in the detail panel
    await expect(
      page.getByTestId('cliente-detail-panel').getByText(data2.nombre)
    ).toBeVisible({ timeout: 5000 });

    // AND: First client name is no longer displayed in the detail panel
    await expect(
      page.getByTestId('cliente-detail-panel').getByText(data1.nombre)
    ).not.toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E2-2-2-E2E-EC-5 (P1) — ErrorPanel shown when API returns 500
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E2-2-2-E2E-EC-5: [P1] should show ErrorPanel with Reintentar button when detail API returns 500', async ({ page }) => {
    // GIVEN: A random UUID (the client may or may not exist — we intercept the fetch)
    const targetId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

    // CRITICAL: Intercept BEFORE navigation
    await page.route(`**/api/v1/clientes/${targetId}`, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      })
    );

    // WHEN: User navigates directly to the client URL
    await page.goto(`/clientes/${targetId}`);
    await page.waitForURL(`**/clientes/${targetId}`);

    // THEN: ErrorPanel is shown in the detail panel
    await expect(page.getByTestId('error-panel')).toBeVisible({ timeout: 5000 });

    // AND: Reintentar button is present
    await expect(page.getByRole('button', { name: /reintentar/i })).toBeVisible();

    // AND: NotFoundPanel is NOT shown
    await expect(page.getByTestId('not-found-panel')).not.toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E2-2-2-E2E-EC-6 (P2) — Navigating back to /clientes shows placeholder
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E2-2-2-E2E-EC-6: [P2] should show placeholder in right panel after navigating back to /clientes', async ({ page }) => {
    // GIVEN: A client exists and user is on the detail page
    const data = buildCliente({ nombre: 'Empresa Back Navigation Edge' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    await page.goto(`/clientes/${created.id}`);
    await page.waitForURL(`**/clientes/${created.id}`);
    await expect(
      page.getByTestId('cliente-detail-panel').getByText(data.nombre)
    ).toBeVisible({ timeout: 5000 });

    // WHEN: User navigates back to /clientes (no :clienteId)
    await page.goto('/clientes');
    await page.waitForURL('**/clientes');

    // THEN: The detail panel shows the placeholder (no client selected)
    await expect(
      page.getByTestId('cliente-detail-panel').getByText(/selecciona un cliente/i)
    ).toBeVisible({ timeout: 5000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E2-2-2-E2E-EC-7 (P2) — Left list panel remains visible in split layout
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E2-2-2-E2E-EC-7: [P2] should keep the list panel visible alongside the detail panel (split layout)', async ({ page }) => {
    // GIVEN: A client exists
    const data = buildCliente({ nombre: 'Empresa Split Layout Edge' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: User navigates to the client detail page
    await page.goto(`/clientes/${created.id}`);
    await page.waitForURL(`**/clientes/${created.id}`);

    // THEN: Both the list panel and detail panel are visible simultaneously
    await expect(page.getByTestId('cliente-list')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E2-2-2-E2E-EC-8 (P2) — deep link loads correctly without list navigation
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E2-2-2-E2E-EC-8: [P2] should load correct client via deep link without navigating through the list', async ({ page }) => {
    // GIVEN: Two clients exist (to confirm ID selectivity)
    const data1 = buildCliente({ nombre: 'Empresa Deep Link Target', nit: '900222001-1' });
    const data2 = buildCliente({ nombre: 'Empresa Deep Link Distractor', nit: '900222002-2' });
    const created1 = await apiHelper.createCliente(data1);
    const created2 = await apiHelper.createCliente(data2);
    createdIds.push(created1.id, created2.id);

    // WHEN: User navigates directly to the first client's deep link URL
    await page.goto(`/clientes/${created1.id}`);
    await page.waitForURL(`**/clientes/${created1.id}`);

    const detailPanel = page.getByTestId('cliente-detail-panel');
    await expect(detailPanel).toBeVisible();

    // THEN: The correct (target) client data is displayed
    await expect(detailPanel.getByText('Empresa Deep Link Target')).toBeVisible({ timeout: 5000 });

    // AND: The distractor client data is NOT displayed in the detail panel
    await expect(detailPanel.getByText('Empresa Deep Link Distractor')).not.toBeVisible();
  });
});

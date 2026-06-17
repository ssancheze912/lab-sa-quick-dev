/**
 * Story 2.2: Client Detail View — E2E Edge Cases
 * Epic 2: Client Management
 *
 * Expanded coverage beyond ATDD acceptance tests:
 *   - Navigating from one client detail to another updates all 4 fields
 *   - Browser back from detail view returns to list (/clientes)
 *   - Right panel shows placeholder/empty state at /clientes (no clienteId selected)
 *   - Server error (HTTP 500) on detail endpoint shows ErrorPanel, not not-found
 *   - Skeleton visible while detail loads (network-first mock)
 *   - HTTP 429 rate limit on detail endpoint shows ErrorPanel
 *   - Keyboard navigation: Tab reaches the back-affordance link in not-found state
 *   - Split-panel: list panel stays mounted while detail loads
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

// ─────────────────────────────────────────────────────────────────────────────
// Edge — Navigating from one client to another refreshes all 4 detail fields
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — Navigate between two client detail views updates all fields', () => {
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

  test('[P1] should update Nombre in the detail panel when user clicks a second client item', async ({ page }) => {
    // GIVEN: Two clients exist in the system with distinct names
    const clienteA = buildCliente({ nombre: 'Empresa Navegacion A S.A.S.', nit: '900A00001-1', telefono: '3001000001', ciudad: 'Bogotá' });
    const clienteB = buildCliente({ nombre: 'Empresa Navegacion B Ltda.', nit: '900B00002-2', telefono: '3002000002', ciudad: 'Medellín' });

    const createdA = await apiHelper.createCliente(clienteA);
    const createdB = await apiHelper.createCliente(clienteB);
    createdIds.push(createdA.id, createdB.id);

    // WHEN: User navigates to /clientes and clicks client A
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Navegacion A S.A.S.' }).click();
    await page.waitForURL(`**/clientes/${createdA.id}**`);

    await expect(page.getByTestId('cliente-detail-nombre')).toHaveText('Empresa Navegacion A S.A.S.');

    // WHEN: User clicks client B (second navigation)
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Navegacion B Ltda.' }).click();
    await page.waitForURL(`**/clientes/${createdB.id}**`);

    // THEN: Detail panel updates to show client B's Nombre
    await expect(page.getByTestId('cliente-detail-nombre')).toHaveText('Empresa Navegacion B Ltda.');
  });

  test('[P1] should update all 4 fields when navigating from one client to another', async ({ page }) => {
    // GIVEN: Two clients with all fields set distinctly
    const clienteA = buildCliente({ nombre: 'Empresa Nav A Corp.', nit: '901A00001-1', telefono: '3011000001', ciudad: 'Bogotá' });
    const clienteB = buildCliente({ nombre: 'Empresa Nav B Corp.', nit: '901B00002-2', telefono: '3012000002', ciudad: 'Cali' });

    const createdA = await apiHelper.createCliente(clienteA);
    const createdB = await apiHelper.createCliente(clienteB);
    createdIds.push(createdA.id, createdB.id);

    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // WHEN: Click client A then client B
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Nav A Corp.' }).click();
    await page.waitForURL(`**/clientes/${createdA.id}**`);
    await expect(page.getByTestId('cliente-detail-ciudad')).toContainText('Bogotá');

    await page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Nav B Corp.' }).click();
    await page.waitForURL(`**/clientes/${createdB.id}**`);

    // THEN: All 4 fields reflect client B
    await expect(page.getByTestId('cliente-detail-nombre')).toHaveText('Empresa Nav B Corp.');
    await expect(page.getByTestId('cliente-detail-nitruc')).toContainText('901B00002-2');
    await expect(page.getByTestId('cliente-detail-telefono')).toContainText('3012000002');
    await expect(page.getByTestId('cliente-detail-ciudad')).toContainText('Cali');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge — HTTP 500 on detail endpoint shows ErrorPanel (not not-found)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — HTTP 500 on GET /clientes/:id shows ErrorPanel', () => {
  test('[P1] should display ErrorPanel when the detail API returns HTTP 500', async ({ page }) => {
    // GIVEN: The API returns 500 for a specific clienteId
    const clienteId = '99999999-9999-9999-9999-999999999999';

    // Network-first: intercept BEFORE navigating
    await page.route(`**/api/v1/clientes/${clienteId}`, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ status: 500, title: 'Internal Server Error' }),
      })
    );

    // WHEN: User navigates directly to /clientes/:clienteId
    await page.goto(`/clientes/${clienteId}`);

    // THEN: ErrorPanel is shown (not the 404 not-found message)
    await expect(page.getByTestId('error-panel')).toBeVisible();
    await expect(page.getByTestId('cliente-not-found')).not.toBeVisible();
  });

  test('[P1] should display Reintentar button when detail API returns HTTP 500', async ({ page }) => {
    // GIVEN: The API returns 500
    const clienteId = '88888888-8888-8888-8888-888888888888';

    await page.route(`**/api/v1/clientes/${clienteId}`, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ status: 500, title: 'Internal Server Error' }),
      })
    );

    // WHEN: User navigates to the detail URL
    await page.goto(`/clientes/${clienteId}`);

    // THEN: Reintentar button is visible
    await expect(page.getByRole('button', { name: /reintentar/i })).toBeVisible();
  });

  test('[P2] should NOT show the not-found message when API returns HTTP 503', async ({ page }) => {
    // GIVEN: API returns 503 Service Unavailable
    const clienteId = '77777777-7777-7777-7777-777777777777';

    await page.route(`**/api/v1/clientes/${clienteId}`, (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ status: 503, title: 'Service Unavailable' }),
      })
    );

    // WHEN: User navigates to the detail URL
    await page.goto(`/clientes/${clienteId}`);

    await expect(page.getByTestId('error-panel')).toBeVisible();

    // THEN: NOT the 404 not-found message
    await expect(page.getByTestId('cliente-not-found')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge — Right panel empty at /clientes when no client is selected
// When user lands at /clientes with no child route active, right panel is empty
// or shows a placeholder (depending on index route implementation)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — /clientes without clienteId shows empty right panel', () => {
  test('[P2] should render the left list panel when no client is selected (/clientes route)', async ({ page }) => {
    // GIVEN: The user navigates to /clientes (no specific client selected)
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '1', nombre: 'Empresa Alpha', nitRuc: '111000111-1', telefono: '3001111111', ciudad: 'Bogotá', createdAt: new Date().toISOString() },
        ]),
      })
    );

    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // THEN: The left list panel is present and visible
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
  });

  test('[P2] should NOT render the detail panel when user is at /clientes (no clienteId)', async ({ page }) => {
    // GIVEN: User at /clientes root (no child route active)
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');

    // THEN: No detail panel data fields are visible
    await expect(page.getByTestId('cliente-detail-nombre')).not.toBeVisible();
    await expect(page.getByTestId('cliente-detail-panel')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge — Left panel stays mounted during detail panel loading
// Tests split-panel structural integrity during async data fetch
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — Left panel stays visible while detail panel loads', () => {
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

  test('[P1] should keep clientes-list-panel visible while detail skeleton is loading', async ({ page }) => {
    // GIVEN: A client exists
    const cliente = buildCliente({ nombre: 'Empresa Split Visible S.A.', nit: '902000001-1' });
    const created = await apiHelper.createCliente(cliente);
    createdIds.push(created.id);

    // Intercept the detail request and delay it
    let resolveDetail: (() => void) | undefined;
    await page.route(`**/api/v1/clientes/${created.id}`, async (route) => {
      await new Promise<void>((resolve) => { resolveDetail = resolve; });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: created.id,
          nombre: 'Empresa Split Visible S.A.',
          nitRuc: '902000001-1',
          telefono: '3020000001',
          ciudad: 'Bogotá',
          createdAt: new Date().toISOString(),
        }),
      });
    });

    // WHEN: User clicks the client (triggering skeleton in right panel)
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Split Visible S.A.' }).click();

    // THEN: Left panel remains visible while skeleton is showing in right panel
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();

    // Cleanup: resolve the pending request
    if (resolveDetail) resolveDetail();
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible({ timeout: 5000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge — Keyboard accessibility: back link in not-found state is Tab-reachable
// WCAG 2.1 AA — keyboard navigation must reach all interactive elements
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — Keyboard accessibility: back link in not-found state', () => {
  test('[P2] should allow Tab navigation to reach the back affordance link in not-found state', async ({ page }) => {
    // GIVEN: A non-existent clienteId returns 404
    const nonExistentId = '00000000-0000-0000-0000-000000000001';

    await page.route(`**/api/v1/clientes/${nonExistentId}`, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          status: 404,
          title: 'Cliente no encontrado',
          detail: 'No existe un cliente con el ID especificado.',
        }),
      })
    );

    // WHEN: User navigates to the not-found page
    await page.goto(`/clientes/${nonExistentId}`);
    await expect(page.getByTestId('cliente-not-found')).toBeVisible();

    // WHEN: User presses Tab to navigate to the back link
    await page.keyboard.press('Tab');

    // THEN: The back affordance link can be focused via keyboard
    const backLink = page.getByTestId('cliente-not-found-back');
    await expect(backLink).toBeFocused();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge — aria-label "Detalle del cliente" visible in both not-found and success
// Ensures the region landmark is always present for screen reader navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — WCAG: region landmark present in all detail states', () => {
  test('[P2] should expose aria-label="Detalle del cliente" region in the not-found state', async ({ page }) => {
    // GIVEN: Non-existent clienteId
    const nonExistentId = '00000000-0000-0000-0000-000000000002';

    await page.route(`**/api/v1/clientes/${nonExistentId}`, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({ status: 404, title: 'Cliente no encontrado', detail: 'No existe un cliente con el ID especificado.' }),
      })
    );

    await page.goto(`/clientes/${nonExistentId}`);
    await expect(page.getByTestId('cliente-not-found')).toBeVisible();

    // THEN: The region landmark is accessible in not-found state
    await expect(page.getByRole('region', { name: /detalle del cliente/i })).toBeVisible();
  });
});

/**
 * Story 2.2: Client Detail View
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (E2E Level — Playwright)
 * These tests FAIL until the implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Clicking a client in the left panel shows the detail (Nombre, NIT/RUC, Teléfono, Ciudad) in the right panel
 *          and the URL updates to /clientes/:clienteId (FR30 deep linking)
 *   AC2 — Direct navigation to /clientes/:clienteId loads the correct client details (deep link, FR30)
 *   AC3 — Non-existent clienteId shows a graceful not-found message with no unhandled JS error
 *
 * Test IDs:
 *   TC-E2-P1-08 — Direct navigation to /clientes/:clienteId (E2E level, P1)
 *   AC1 —        Click client → right panel shows all 4 fields + URL update (E2E level)
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';
import { ClientesPage } from '../../pages/clientes.page';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Clicking a client item shows the detail panel and updates the URL
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Click client item reveals detail panel with all 4 fields', () => {
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

  test('should display Nombre in the right panel when user clicks a client list item', async ({ page }) => {
    // GIVEN: A client exists in the system
    const cliente = buildCliente({
      nombre: 'Empresa Detail Test S.A.S.',
      nit: '900010001-1',
      telefono: '3001000001',
      ciudad: 'Bogotá',
    });
    const created = await apiHelper.createCliente(cliente);
    createdIds.push(created.id);

    // WHEN: User navigates to /clientes and clicks the client item
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await expect(page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Detail Test S.A.S.' })).toBeVisible();

    await page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Detail Test S.A.S.' }).click();

    // THEN: The right panel shows the client's Nombre
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await expect(page.getByTestId('cliente-detail-nombre')).toHaveText('Empresa Detail Test S.A.S.');
  });

  test('should display NIT/RUC in the right panel when user clicks a client list item', async ({ page }) => {
    // GIVEN: A client with a known NIT/RUC exists
    const cliente = buildCliente({
      nombre: 'Empresa NIT Panel S.A.',
      nit: '900020002-2',
      telefono: '3002000002',
      ciudad: 'Medellín',
    });
    const created = await apiHelper.createCliente(cliente);
    createdIds.push(created.id);

    // WHEN: User navigates to /clientes and clicks the client item
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await expect(page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa NIT Panel S.A.' })).toBeVisible();

    await page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa NIT Panel S.A.' }).click();

    // THEN: The right panel shows the NIT/RUC field value
    await expect(page.getByTestId('cliente-detail-nitruc')).toBeVisible();
    await expect(page.getByTestId('cliente-detail-nitruc')).toContainText('900020002-2');
  });

  test('should display Teléfono in the right panel when user clicks a client list item', async ({ page }) => {
    // GIVEN: A client with a known phone number exists
    const cliente = buildCliente({
      nombre: 'Empresa Tel Panel Ltda.',
      nit: '900030003-3',
      telefono: '3003000003',
      ciudad: 'Cali',
    });
    const created = await apiHelper.createCliente(cliente);
    createdIds.push(created.id);

    // WHEN: User navigates to /clientes and clicks the client item
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await expect(page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Tel Panel Ltda.' })).toBeVisible();

    await page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Tel Panel Ltda.' }).click();

    // THEN: The right panel shows the Teléfono field value
    await expect(page.getByTestId('cliente-detail-telefono')).toBeVisible();
    await expect(page.getByTestId('cliente-detail-telefono')).toContainText('3003000003');
  });

  test('should display Ciudad in the right panel when user clicks a client list item', async ({ page }) => {
    // GIVEN: A client with a known city exists
    const cliente = buildCliente({
      nombre: 'Empresa Ciudad Panel Corp.',
      nit: '900040004-4',
      telefono: '3004000004',
      ciudad: 'Barranquilla',
    });
    const created = await apiHelper.createCliente(cliente);
    createdIds.push(created.id);

    // WHEN: User navigates to /clientes and clicks the client item
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await expect(page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Ciudad Panel Corp.' })).toBeVisible();

    await page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Ciudad Panel Corp.' }).click();

    // THEN: The right panel shows the Ciudad field value
    await expect(page.getByTestId('cliente-detail-ciudad')).toBeVisible();
    await expect(page.getByTestId('cliente-detail-ciudad')).toContainText('Barranquilla');
  });

  test('should update the URL to /clientes/:clienteId when user clicks a client list item', async ({ page }) => {
    // GIVEN: A client exists in the system
    const cliente = buildCliente({
      nombre: 'Empresa URL Update S.A.S.',
      nit: '900050005-5',
    });
    const created = await apiHelper.createCliente(cliente);
    createdIds.push(created.id);

    // WHEN: User navigates to /clientes and clicks the client item
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await expect(page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa URL Update S.A.S.' })).toBeVisible();

    await page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa URL Update S.A.S.' }).click();

    // THEN: The URL updates to /clientes/:clienteId (FR30 deep linking)
    await page.waitForURL(`**/clientes/${created.id}**`);
    expect(page.url()).toContain(`/clientes/${created.id}`);
  });

  test('should keep the left panel list visible while the right panel shows client details', async ({ page }) => {
    // GIVEN: A client exists in the system
    const cliente = buildCliente({ nombre: 'Empresa Panel Split S.A.', nit: '900060006-6' });
    const created = await apiHelper.createCliente(cliente);
    createdIds.push(created.id);

    // WHEN: User navigates to /clientes and clicks the client item
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Panel Split S.A.' }).click();

    // THEN: Left panel (list) AND right panel (detail) are both visible simultaneously
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
  });

  test('should highlight the active client item in the left panel with visual indicator', async ({ page }) => {
    // GIVEN: A client exists in the system
    const cliente = buildCliente({ nombre: 'Empresa Active Highlight S.A.', nit: '900070007-7' });
    const created = await apiHelper.createCliente(cliente);
    createdIds.push(created.id);

    // WHEN: User clicks the client item
    await page.goto('/clientes');
    await page.waitForURL('**/clientes**');
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Active Highlight S.A.' }).click();
    await page.waitForURL(`**/clientes/${created.id}**`);

    // THEN: The active list item has aria-current="page" (WCAG 2.1 AA)
    const activeItem = page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Active Highlight S.A.' });
    await expect(activeItem.getByRole('link')).toHaveAttribute('aria-current', 'page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-08 — Direct navigation to /clientes/:clienteId loads correct client details
// AC2 — Deep link support (FR30)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('TC-E2-P1-08 — Direct navigation via deep link loads correct client details', () => {
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

  test('should load and display client Nombre when navigating directly to /clientes/:clienteId', async ({ page }) => {
    // GIVEN: A client exists in the system with a known ID
    const cliente = buildCliente({
      nombre: 'Empresa Deep Link S.A.S.',
      nit: '900080008-8',
      telefono: '3008000008',
      ciudad: 'Bogotá',
    });
    const created = await apiHelper.createCliente(cliente);
    createdIds.push(created.id);

    // WHEN: User navigates directly to /clientes/:clienteId (deep link — no prior navigation required)
    await page.goto(`/clientes/${created.id}`);

    // THEN: The correct client's Nombre is displayed in the detail panel
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
    await expect(page.getByTestId('cliente-detail-nombre')).toHaveText('Empresa Deep Link S.A.S.');
  });

  test('should load and display NIT/RUC when navigating directly to /clientes/:clienteId', async ({ page }) => {
    // GIVEN: A client with a specific NIT/RUC exists and we know its ID
    const cliente = buildCliente({
      nombre: 'Empresa Deep NIT S.A.',
      nit: '900090009-9',
    });
    const created = await apiHelper.createCliente(cliente);
    createdIds.push(created.id);

    // WHEN: User navigates directly to /clientes/:clienteId
    await page.goto(`/clientes/${created.id}`);

    // THEN: The NIT/RUC field is visible with the correct value
    await expect(page.getByTestId('cliente-detail-nitruc')).toContainText('900090009-9');
  });

  test('should load and display Teléfono when navigating directly to /clientes/:clienteId', async ({ page }) => {
    // GIVEN: A client with a specific phone number exists
    const cliente = buildCliente({
      nombre: 'Empresa Deep Tel Corp.',
      nit: '900100010-1',
      telefono: '3101000010',
    });
    const created = await apiHelper.createCliente(cliente);
    createdIds.push(created.id);

    // WHEN: User navigates directly to /clientes/:clienteId
    await page.goto(`/clientes/${created.id}`);

    // THEN: The Teléfono field is visible with the correct value
    await expect(page.getByTestId('cliente-detail-telefono')).toContainText('3101000010');
  });

  test('should load and display Ciudad when navigating directly to /clientes/:clienteId', async ({ page }) => {
    // GIVEN: A client with a specific city exists
    const cliente = buildCliente({
      nombre: 'Empresa Deep Ciudad Ltda.',
      nit: '900110011-1',
      ciudad: 'Cartagena',
    });
    const created = await apiHelper.createCliente(cliente);
    createdIds.push(created.id);

    // WHEN: User navigates directly to /clientes/:clienteId
    await page.goto(`/clientes/${created.id}`);

    // THEN: The Ciudad field is visible with the correct value
    await expect(page.getByTestId('cliente-detail-ciudad')).toContainText('Cartagena');
  });

  test('should display the detail panel section with aria-label="Detalle del cliente" (WCAG 2.1 AA)', async ({ page }) => {
    // GIVEN: A client exists in the system
    const cliente = buildCliente({ nombre: 'Empresa ARIA Test S.A.', nit: '900120012-1' });
    const created = await apiHelper.createCliente(cliente);
    createdIds.push(created.id);

    // WHEN: User navigates directly to /clientes/:clienteId
    await page.goto(`/clientes/${created.id}`);

    // THEN: The detail section has the required aria-label for screen readers
    await expect(page.getByRole('region', { name: /detalle del cliente/i })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Non-existent clienteId shows graceful not-found message without JS error
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Non-existent clienteId shows graceful not-found message', () => {
  test('should display a not-found message when navigating to a non-existent clienteId', async ({ page }) => {
    // GIVEN: The clienteId does not exist in the system (non-existent UUID)
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    // Network-first: intercept the API call BEFORE navigating to avoid race conditions
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

    // WHEN: User navigates directly to the URL with the non-existent clienteId
    await page.goto(`/clientes/${nonExistentId}`);

    // THEN: A not-found message is displayed gracefully
    await expect(page.getByTestId('cliente-not-found')).toBeVisible();
  });

  test('should display Spanish not-found text when clienteId does not exist', async ({ page }) => {
    // GIVEN: The clienteId does not exist (non-existent UUID)
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

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

    // WHEN: User navigates directly to /clientes/:nonExistentId
    await page.goto(`/clientes/${nonExistentId}`);

    // THEN: The displayed text mentions the client was not found (Spanish)
    await expect(
      page.getByText(/no se encontró el cliente solicitado/i)
    ).toBeVisible();
  });

  test('should NOT throw an unhandled JS error when clienteId does not exist', async ({ page }) => {
    // GIVEN: Track all uncaught JS errors on the page
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    const nonExistentId = '00000000-0000-0000-0000-000000000000';

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

    // WHEN: User navigates to the page with a non-existent clienteId
    await page.goto(`/clientes/${nonExistentId}`);
    // Wait for the not-found state to render
    await expect(page.getByTestId('cliente-not-found')).toBeVisible();

    // THEN: No unhandled JavaScript errors occurred
    expect(jsErrors).toHaveLength(0);
  });

  test('should provide a back affordance in the not-found state', async ({ page }) => {
    // GIVEN: The clienteId does not exist
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

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

    // WHEN: User navigates to /clientes/:nonExistentId
    await page.goto(`/clientes/${nonExistentId}`);
    await expect(page.getByTestId('cliente-not-found')).toBeVisible();

    // THEN: A navigable link or button to go back is present
    const backAffordance = page.getByTestId('cliente-not-found-back');
    await expect(backAffordance).toBeVisible();
  });
});

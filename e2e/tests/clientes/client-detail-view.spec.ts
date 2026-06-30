/**
 * Story 2.2: Client Detail View
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (E2E Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Clicking a client in the list shows its full details in the right panel
 *         and updates the URL to /clientes/:clienteId
 *   AC2 — Navigating directly to /clientes/:clienteId loads and displays the correct client
 *
 * Note: AC3 (non-existent ID not-found message) is in client-detail-view.ac3.spec.ts
 *       to keep each file within the 300-line quality standard.
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Clicking a client item shows full details and updates the URL
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Clicking a client item opens detail panel and updates URL', () => {
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

  test('should show the client Nombre in the right panel after clicking a list item', async ({ page }) => {
    // GIVEN: A client exists in the system
    const data = buildCliente({ nombre: 'Empresa Detalle Nombre', nit: '900100200-1' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // Network-first: intercept BEFORE navigation
    await page.route('**/api/v1/clientes', async (route) => {
      await route.continue();
    });
    await page.route(`**/api/v1/clientes/${cliente.id}`, async (route) => {
      await route.continue();
    });

    // WHEN: User navigates to /clientes and clicks the client item
    await page.goto('/clientes');
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Detalle Nombre' }).click();

    // THEN: The right panel shows the client's Nombre
    await expect(page.getByTestId('cliente-detail-content')).toContainText('Empresa Detalle Nombre');
  });

  test('should show the client NIT/RUC in the right panel after clicking a list item', async ({ page }) => {
    // GIVEN: A client with a known NIT exists
    const data = buildCliente({ nombre: 'Empresa Detalle Nit', nit: '800200300-2' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    await page.route('**/api/v1/clientes', async (route) => {
      await route.continue();
    });
    await page.route(`**/api/v1/clientes/${cliente.id}`, async (route) => {
      await route.continue();
    });

    // WHEN: User navigates to /clientes and clicks the client item
    await page.goto('/clientes');
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Detalle Nit' }).click();

    // THEN: The right panel shows the client's NIT
    await expect(page.getByTestId('cliente-detail-content')).toContainText('800200300-2');
  });

  test('should show the client Teléfono in the right panel after clicking a list item', async ({ page }) => {
    // GIVEN: A client with a known telefono exists
    const data = buildCliente({ nombre: 'Empresa Detalle Telefono', nit: '700300400-3', telefono: '3009876543' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    await page.route('**/api/v1/clientes', async (route) => {
      await route.continue();
    });
    await page.route(`**/api/v1/clientes/${cliente.id}`, async (route) => {
      await route.continue();
    });

    // WHEN: User navigates to /clientes and clicks the client item
    await page.goto('/clientes');
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Detalle Telefono' }).click();

    // THEN: The right panel shows the client's Teléfono
    await expect(page.getByTestId('cliente-detail-content')).toContainText('3009876543');
  });

  test('should show the client Ciudad in the right panel after clicking a list item', async ({ page }) => {
    // GIVEN: A client with a known ciudad exists
    const data = buildCliente({ nombre: 'Empresa Detalle Ciudad', nit: '600400500-4', ciudad: 'Medellín' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    await page.route('**/api/v1/clientes', async (route) => {
      await route.continue();
    });
    await page.route(`**/api/v1/clientes/${cliente.id}`, async (route) => {
      await route.continue();
    });

    // WHEN: User navigates to /clientes and clicks the client item
    await page.goto('/clientes');
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Detalle Ciudad' }).click();

    // THEN: The right panel shows the client's Ciudad
    await expect(page.getByTestId('cliente-detail-content')).toContainText('Medellín');
  });

  test('should update the URL to /clientes/:clienteId after clicking a list item', async ({ page }) => {
    // GIVEN: A client exists
    const data = buildCliente({ nombre: 'Empresa URL Update', nit: '500500600-5' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    await page.route('**/api/v1/clientes', async (route) => {
      await route.continue();
    });
    await page.route(`**/api/v1/clientes/${cliente.id}`, async (route) => {
      await route.continue();
    });

    // WHEN: User navigates to /clientes and clicks the client item
    await page.goto('/clientes');
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa URL Update' }).click();

    // THEN: The URL updates to /clientes/:clienteId (deep linking FR30)
    await expect(page).toHaveURL(new RegExp(`/clientes/${cliente.id}`));
  });

  test('should show cliente-detail-content testid after clicking a list item', async ({ page }) => {
    // GIVEN: A client exists
    const data = buildCliente({ nombre: 'Empresa Detail TestId', nit: '400600700-6' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    await page.route('**/api/v1/clientes', async (route) => {
      await route.continue();
    });
    await page.route(`**/api/v1/clientes/${cliente.id}`, async (route) => {
      await route.continue();
    });

    // WHEN: User navigates to /clientes and clicks the client item
    await page.goto('/clientes');
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Detail TestId' }).click();

    // THEN: data-testid="cliente-detail-content" container is visible in the right panel
    await expect(page.getByTestId('cliente-detail-content')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Direct URL navigation to /clientes/:clienteId loads correct client
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Direct URL /clientes/:clienteId loads and displays the correct client', () => {
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

  test('should load and display the correct Nombre when accessing /clientes/:clienteId directly', async ({ page }) => {
    // GIVEN: A known client exists in the system
    const data = buildCliente({ nombre: 'Empresa Deep Link Nombre', nit: '300700800-7' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // Network-first: intercept BEFORE navigation
    await page.route('**/api/v1/clientes', async (route) => {
      await route.continue();
    });
    await page.route(`**/api/v1/clientes/${cliente.id}`, async (route) => {
      await route.continue();
    });

    // WHEN: User accesses /clientes/:clienteId directly
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: The detail panel shows the correct Nombre
    await expect(page.getByTestId('cliente-detail-content')).toContainText('Empresa Deep Link Nombre');
  });

  test('should load and display the correct NIT when accessing /clientes/:clienteId directly', async ({ page }) => {
    // GIVEN: A known client exists
    const data = buildCliente({ nombre: 'Empresa Deep Link Nit', nit: '200800900-8' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    await page.route('**/api/v1/clientes', async (route) => {
      await route.continue();
    });
    await page.route(`**/api/v1/clientes/${cliente.id}`, async (route) => {
      await route.continue();
    });

    // WHEN: User accesses /clientes/:clienteId directly
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: The detail panel shows the correct NIT
    await expect(page.getByTestId('cliente-detail-content')).toContainText('200800900-8');
  });

  test('should display cliente-detail-content when navigating directly to /clientes/:clienteId', async ({ page }) => {
    // GIVEN: A client exists
    const data = buildCliente({ nombre: 'Empresa Direct Nav', nit: '100900100-9' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    await page.route('**/api/v1/clientes', async (route) => {
      await route.continue();
    });
    await page.route(`**/api/v1/clientes/${cliente.id}`, async (route) => {
      await route.continue();
    });

    // WHEN: User navigates directly to the detail URL
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: The detail content is rendered (not the default right-panel placeholder)
    await expect(page.getByTestId('cliente-detail-content')).toBeVisible();
  });

  test('should keep the left panel visible when navigating directly to /clientes/:clienteId', async ({ page }) => {
    // GIVEN: A client exists and direct URL is used
    const data = buildCliente({ nombre: 'Empresa Panel Visible', nit: '555333444-1' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    await page.route('**/api/v1/clientes', async (route) => {
      await route.continue();
    });
    await page.route(`**/api/v1/clientes/${cliente.id}`, async (route) => {
      await route.continue();
    });

    // WHEN: User navigates directly to /clientes/:clienteId
    await page.goto(`/clientes/${cliente.id}`);

    // THEN: The left panel (client list) is still visible (two-panel layout)
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
  });
});


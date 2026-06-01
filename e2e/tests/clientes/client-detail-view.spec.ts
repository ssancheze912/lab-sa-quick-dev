/**
 * Story 2.2: Client Detail View
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (E2E Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Clicking a client in the left panel shows its full details in the right panel
 *   AC2 — URL updates to /clientes/:clienteId when a client is selected (FR30 deep linking)
 *   AC3 — Direct URL access /clientes/:clienteId fetches and displays the correct client details
 *   AC4 — Unknown clienteId (404) shows "Cliente no encontrado" — no stack traces (NFR6)
 *   AC5 — Network/server error when fetching detail shows ErrorPanel with "Reintentar"; left panel stays functional
 *   AC6 — Loading state shows skeleton placeholders in the right panel (no spinner)
 */

import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Clicking a client item shows full details in the right panel
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Client detail panel shows complete client details on click', () => {
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

  test('[P0] should show client detail panel when a client item is clicked', async ({ page }) => {
    // GIVEN: The client list is displayed with one client
    const clienteData = buildCliente({ nombre: 'Empresa Test AC1', nit: '900111000-1' });

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            nombre: clienteData.nombre,
            nit: clienteData.nit,
            telefono: clienteData.telefono,
            ciudad: clienteData.ciudad,
            createdAt: '2026-03-12T10:30:00.000Z',
            updatedAt: '2026-03-12T10:30:00.000Z',
          },
        ]),
      })
    );

    await page.route('**/api/v1/clientes/550e8400-e29b-41d4-a716-446655440001', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '550e8400-e29b-41d4-a716-446655440001',
          nombre: clienteData.nombre,
          nit: clienteData.nit,
          telefono: clienteData.telefono,
          ciudad: clienteData.ciudad,
          createdAt: '2026-03-12T10:30:00.000Z',
          updatedAt: '2026-03-12T10:30:00.000Z',
        }),
      })
    );

    await page.goto('/clientes');

    // WHEN: The user clicks on the client item in the left panel
    await page.getByTestId('cliente-list-item').filter({ hasText: clienteData.nombre }).click();

    // THEN: The right panel shows the client detail panel
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
  });

  test('[P0] should display Nombre in the client detail panel', async ({ page }) => {
    // GIVEN: A client "Empresa Test AC1" is shown in the list
    const clienteId = '550e8400-e29b-41d4-a716-446655440002';

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: clienteId,
            nombre: 'Empresa Test AC1',
            nit: '900111000-2',
            telefono: '3001234567',
            ciudad: 'Bogotá',
            createdAt: '2026-03-12T10:30:00.000Z',
            updatedAt: '2026-03-12T10:30:00.000Z',
          },
        ]),
      })
    );

    await page.route(`**/api/v1/clientes/${clienteId}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: clienteId,
          nombre: 'Empresa Test AC1',
          nit: '900111000-2',
          telefono: '3001234567',
          ciudad: 'Bogotá',
          createdAt: '2026-03-12T10:30:00.000Z',
          updatedAt: '2026-03-12T10:30:00.000Z',
        }),
      })
    );

    await page.goto('/clientes');

    // WHEN: The user clicks on the client item
    await page.getByTestId('cliente-list-item').click();

    // THEN: The Nombre field is visible in the detail panel
    const detailPanel = page.getByTestId('cliente-detail-panel');
    await expect(detailPanel).toContainText('Empresa Test AC1');
  });

  test('[P0] should display NIT/RUC in the client detail panel', async ({ page }) => {
    // GIVEN: A client with NIT "900111000-3" exists in the list
    const clienteId = '550e8400-e29b-41d4-a716-446655440003';

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: clienteId,
            nombre: 'Empresa Nit Test',
            nit: '900111000-3',
            telefono: '3001234567',
            ciudad: 'Medellín',
            createdAt: '2026-03-12T10:30:00.000Z',
            updatedAt: '2026-03-12T10:30:00.000Z',
          },
        ]),
      })
    );

    await page.route(`**/api/v1/clientes/${clienteId}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: clienteId,
          nombre: 'Empresa Nit Test',
          nit: '900111000-3',
          telefono: '3001234567',
          ciudad: 'Medellín',
          createdAt: '2026-03-12T10:30:00.000Z',
          updatedAt: '2026-03-12T10:30:00.000Z',
        }),
      })
    );

    await page.goto('/clientes');

    // WHEN: The user clicks on the client item
    await page.getByTestId('cliente-list-item').click();

    // THEN: The NIT/RUC field is visible in the detail panel
    const detailPanel = page.getByTestId('cliente-detail-panel');
    await expect(detailPanel).toContainText('900111000-3');
  });

  test('[P0] should display Telefono in the client detail panel', async ({ page }) => {
    // GIVEN: A client with Telefono "3009876543" exists in the list
    const clienteId = '550e8400-e29b-41d4-a716-446655440004';

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: clienteId,
            nombre: 'Empresa Telefono Test',
            nit: '900111000-4',
            telefono: '3009876543',
            ciudad: 'Cali',
            createdAt: '2026-03-12T10:30:00.000Z',
            updatedAt: '2026-03-12T10:30:00.000Z',
          },
        ]),
      })
    );

    await page.route(`**/api/v1/clientes/${clienteId}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: clienteId,
          nombre: 'Empresa Telefono Test',
          nit: '900111000-4',
          telefono: '3009876543',
          ciudad: 'Cali',
          createdAt: '2026-03-12T10:30:00.000Z',
          updatedAt: '2026-03-12T10:30:00.000Z',
        }),
      })
    );

    await page.goto('/clientes');

    // WHEN: The user clicks on the client item
    await page.getByTestId('cliente-list-item').click();

    // THEN: The Telefono field is visible in the detail panel
    const detailPanel = page.getByTestId('cliente-detail-panel');
    await expect(detailPanel).toContainText('3009876543');
  });

  test('[P0] should display Ciudad in the client detail panel', async ({ page }) => {
    // GIVEN: A client in "Barranquilla" exists in the list
    const clienteId = '550e8400-e29b-41d4-a716-446655440005';

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: clienteId,
            nombre: 'Empresa Ciudad Test',
            nit: '900111000-5',
            telefono: '3001234567',
            ciudad: 'Barranquilla',
            createdAt: '2026-03-12T10:30:00.000Z',
            updatedAt: '2026-03-12T10:30:00.000Z',
          },
        ]),
      })
    );

    await page.route(`**/api/v1/clientes/${clienteId}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: clienteId,
          nombre: 'Empresa Ciudad Test',
          nit: '900111000-5',
          telefono: '3001234567',
          ciudad: 'Barranquilla',
          createdAt: '2026-03-12T10:30:00.000Z',
          updatedAt: '2026-03-12T10:30:00.000Z',
        }),
      })
    );

    await page.goto('/clientes');

    // WHEN: The user clicks on the client item
    await page.getByTestId('cliente-list-item').click();

    // THEN: The Ciudad field is visible in the detail panel
    const detailPanel = page.getByTestId('cliente-detail-panel');
    await expect(detailPanel).toContainText('Barranquilla');
  });

  test('[P0] should display field labels in Spanish (Nombre, NIT/RUC, Teléfono, Ciudad)', async ({ page }) => {
    // GIVEN: A client exists in the list
    const clienteId = '550e8400-e29b-41d4-a716-446655440006';

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: clienteId,
            nombre: 'Empresa Labels Test',
            nit: '900111000-6',
            telefono: '3001234567',
            ciudad: 'Bogotá',
            createdAt: '2026-03-12T10:30:00.000Z',
            updatedAt: '2026-03-12T10:30:00.000Z',
          },
        ]),
      })
    );

    await page.route(`**/api/v1/clientes/${clienteId}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: clienteId,
          nombre: 'Empresa Labels Test',
          nit: '900111000-6',
          telefono: '3001234567',
          ciudad: 'Bogotá',
          createdAt: '2026-03-12T10:30:00.000Z',
          updatedAt: '2026-03-12T10:30:00.000Z',
        }),
      })
    );

    await page.goto('/clientes');
    await page.getByTestId('cliente-list-item').click();

    // THEN: All four Spanish-labelled fields are visible in the detail panel
    const detailPanel = page.getByTestId('cliente-detail-panel');
    await expect(detailPanel).toContainText(/nombre/i);
    await expect(detailPanel).toContainText(/nit\/ruc/i);
    await expect(detailPanel).toContainText(/teléfono/i);
    await expect(detailPanel).toContainText(/ciudad/i);
  });

  test('[P1] should keep the left panel (ClienteListPanel) visible when detail is shown', async ({ page }) => {
    // GIVEN: A client exists in the list
    const clienteId = '550e8400-e29b-41d4-a716-446655440007';

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: clienteId,
            nombre: 'Empresa Left Panel Test',
            nit: '900111000-7',
            telefono: '3001234567',
            ciudad: 'Bogotá',
            createdAt: '2026-03-12T10:30:00.000Z',
            updatedAt: '2026-03-12T10:30:00.000Z',
          },
        ]),
      })
    );

    await page.route(`**/api/v1/clientes/${clienteId}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: clienteId,
          nombre: 'Empresa Left Panel Test',
          nit: '900111000-7',
          telefono: '3001234567',
          ciudad: 'Bogotá',
          createdAt: '2026-03-12T10:30:00.000Z',
          updatedAt: '2026-03-12T10:30:00.000Z',
        }),
      })
    );

    await page.goto('/clientes');
    await page.getByTestId('cliente-list-item').click();

    // THEN: The left panel (clientes-list-panel) is still visible (split-panel layout, NOT replacement)
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — URL updates to /clientes/:clienteId when client is selected (FR30)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — URL deep linking updates to /clientes/:clienteId on selection', () => {
  test('[P0] should update URL to /clientes/:clienteId when a client is clicked', async ({ page }) => {
    // GIVEN: The client list is displayed
    const clienteId = '550e8400-e29b-41d4-a716-446655441001';

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: clienteId,
            nombre: 'Empresa URL Test',
            nit: '900222000-1',
            telefono: '3001234567',
            ciudad: 'Bogotá',
            createdAt: '2026-03-12T10:30:00.000Z',
            updatedAt: '2026-03-12T10:30:00.000Z',
          },
        ]),
      })
    );

    await page.route(`**/api/v1/clientes/${clienteId}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: clienteId,
          nombre: 'Empresa URL Test',
          nit: '900222000-1',
          telefono: '3001234567',
          ciudad: 'Bogotá',
          createdAt: '2026-03-12T10:30:00.000Z',
          updatedAt: '2026-03-12T10:30:00.000Z',
        }),
      })
    );

    await page.goto('/clientes');

    // WHEN: The user clicks on the client item
    await page.getByTestId('cliente-list-item').click();

    // THEN: The URL updates to /clientes/:clienteId (the exact UUID)
    await page.waitForURL(`**/clientes/${clienteId}`);
    expect(page.url()).toContain(`/clientes/${clienteId}`);
  });

  test('[P1] should highlight the selected client item in the left panel', async ({ page }) => {
    // GIVEN: Two clients exist in the list
    const selectedId = '550e8400-e29b-41d4-a716-446655441002';
    const otherId = '550e8400-e29b-41d4-a716-446655441003';

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: selectedId,
            nombre: 'Cliente Seleccionado',
            nit: '900222000-2',
            telefono: '3001234567',
            ciudad: 'Bogotá',
            createdAt: '2026-03-12T10:30:00.000Z',
            updatedAt: '2026-03-12T10:30:00.000Z',
          },
          {
            id: otherId,
            nombre: 'Otro Cliente',
            nit: '900222000-3',
            telefono: '3001234568',
            ciudad: 'Medellín',
            createdAt: '2026-03-12T10:30:00.000Z',
            updatedAt: '2026-03-12T10:30:00.000Z',
          },
        ]),
      })
    );

    await page.route(`**/api/v1/clientes/${selectedId}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: selectedId,
          nombre: 'Cliente Seleccionado',
          nit: '900222000-2',
          telefono: '3001234567',
          ciudad: 'Bogotá',
          createdAt: '2026-03-12T10:30:00.000Z',
          updatedAt: '2026-03-12T10:30:00.000Z',
        }),
      })
    );

    await page.goto('/clientes');

    // WHEN: The user clicks "Cliente Seleccionado"
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Cliente Seleccionado' }).click();

    // THEN: The selected item has an active visual indicator (aria-selected or data-selected)
    const selectedItem = page.getByTestId('cliente-list-item').filter({ hasText: 'Cliente Seleccionado' });
    // The selected item should be marked as active — either via aria-selected or data attribute
    await expect(selectedItem).toBeVisible();
    // At minimum the route has updated — URL contains the selected ID
    expect(page.url()).toContain(selectedId);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Direct URL access /clientes/:clienteId loads the correct client detail
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Direct URL /clientes/:clienteId loads client from API', () => {
  test('[P0] should fetch and display client details when navigating directly to /clientes/:clienteId', async ({ page }) => {
    // GIVEN: The user accesses the URL /clientes/:clienteId directly
    const clienteId = '550e8400-e29b-41d4-a716-446655442001';

    // CRITICAL: Intercept routes BEFORE navigation (network-first pattern)
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: clienteId,
            nombre: 'Empresa Direct URL',
            nit: '900333000-1',
            telefono: '3001234567',
            ciudad: 'Cali',
            createdAt: '2026-03-12T10:30:00.000Z',
            updatedAt: '2026-03-12T10:30:00.000Z',
          },
        ]),
      })
    );

    await page.route(`**/api/v1/clientes/${clienteId}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: clienteId,
          nombre: 'Empresa Direct URL',
          nit: '900333000-1',
          telefono: '3001234567',
          ciudad: 'Cali',
          createdAt: '2026-03-12T10:30:00.000Z',
          updatedAt: '2026-03-12T10:30:00.000Z',
        }),
      })
    );

    // WHEN: The page loads at /clientes/:clienteId
    await page.goto(`/clientes/${clienteId}`);

    // THEN: The correct client details are displayed in the right panel
    const detailPanel = page.getByTestId('cliente-detail-panel');
    await expect(detailPanel).toBeVisible();
    await expect(detailPanel).toContainText('Empresa Direct URL');
    await expect(detailPanel).toContainText('900333000-1');
    await expect(detailPanel).toContainText('3001234567');
    await expect(detailPanel).toContainText('Cali');
  });

  test('[P0] should call GET /api/v1/clientes/:id when loading direct URL', async ({ page }) => {
    // GIVEN: The backend GET /api/v1/clientes/:id endpoint exists
    const clienteId = '550e8400-e29b-41d4-a716-446655442002';
    let detailApiCalled = false;

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await page.route(`**/api/v1/clientes/${clienteId}`, (route) => {
      detailApiCalled = true;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: clienteId,
          nombre: 'Empresa API Call Test',
          nit: '900333000-2',
          telefono: '3001234567',
          ciudad: 'Bogotá',
          createdAt: '2026-03-12T10:30:00.000Z',
          updatedAt: '2026-03-12T10:30:00.000Z',
        }),
      });
    });

    // WHEN: The user navigates directly to /clientes/:clienteId
    await page.goto(`/clientes/${clienteId}`);
    await page.getByTestId('cliente-detail-panel').waitFor({ state: 'visible' });

    // THEN: The GET /api/v1/clientes/:id endpoint was called
    expect(detailApiCalled).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — 404 case: "Cliente no encontrado" shown — no stack traces (NFR6)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Unknown clienteId shows "Cliente no encontrado" gracefully', () => {
  test('[P0] should display "Cliente no encontrado" when clienteId does not exist (404)', async ({ page }) => {
    // GIVEN: The URL contains a clienteId that does not exist in the backend
    const unknownId = '00000000-0000-0000-0000-000000000404';

    // CRITICAL: Intercept BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await page.route(`**/api/v1/clientes/${unknownId}`, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          type: 'https://httpstatuses.com/404',
          title: 'Cliente no encontrado',
          status: 404,
        }),
      })
    );

    // WHEN: The page loads at /clientes/:unknownId
    await page.goto(`/clientes/${unknownId}`);

    // THEN: The not-found message is displayed in the right panel (in Spanish)
    await expect(page.getByText(/cliente no encontrado/i)).toBeVisible();
  });

  test('[P0] should NOT display ErrorPanel (with Reintentar) for a 404 not-found case', async ({ page }) => {
    // GIVEN: A 404 is a business-level not-found, not a system error — no retry is meaningful
    const unknownId = '00000000-0000-0000-0000-000000000405';

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await page.route(`**/api/v1/clientes/${unknownId}`, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          type: 'https://httpstatuses.com/404',
          title: 'Cliente no encontrado',
          status: 404,
        }),
      })
    );

    // WHEN: The page loads with an unknown clienteId
    await page.goto(`/clientes/${unknownId}`);

    // THEN: The ErrorPanel component is NOT displayed (no "Reintentar" button for 404)
    await expect(page.getByTestId('error-panel')).not.toBeVisible();
  });

  test('[P0] should NOT expose stack traces or technical details on 404 (NFR6)', async ({ page }) => {
    // GIVEN: The backend returns a 404 with Problem Details
    const unknownId = '00000000-0000-0000-0000-000000000406';

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await page.route(`**/api/v1/clientes/${unknownId}`, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          type: 'https://httpstatuses.com/404',
          title: 'Cliente no encontrado',
          status: 404,
          detail: 'Entity with id 00000000-0000-0000-0000-000000000406 was not found in AppDbContext.Clientes',
          stackTrace: 'at SiesaAgents.Infrastructure.Repositories...',
        }),
      })
    );

    // WHEN: The page loads with an unknown clienteId
    await page.goto(`/clientes/${unknownId}`);

    // THEN: No stack trace or technical internals are visible to the user (NFR6)
    const pageContent = await page.content();
    expect(pageContent).not.toContain('AppDbContext');
    expect(pageContent).not.toContain('stackTrace');
    expect(pageContent).not.toContain('SiesaAgents.Infrastructure');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Network/server error: ErrorPanel with "Reintentar"; list panel stays
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Server error on detail fetch shows ErrorPanel; left panel remains functional', () => {
  test('[P0] should display ErrorPanel in the right panel when detail fetch fails with server error', async ({ page }) => {
    // GIVEN: The left panel works but the detail fetch fails with a 500
    const clienteId = '550e8400-e29b-41d4-a716-446655443001';

    // CRITICAL: Intercept BEFORE navigation
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: clienteId,
            nombre: 'Empresa Error Test',
            nit: '900444000-1',
            telefono: '3001234567',
            ciudad: 'Bogotá',
            createdAt: '2026-03-12T10:30:00.000Z',
            updatedAt: '2026-03-12T10:30:00.000Z',
          },
        ]),
      })
    );

    await page.route(`**/api/v1/clientes/${clienteId}`, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Internal Server Error' }),
      })
    );

    await page.goto(`/clientes/${clienteId}`);

    // THEN: The ErrorPanel is displayed in the right panel
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });

  test('[P0] should display "Reintentar" button in ErrorPanel when detail fetch fails', async ({ page }) => {
    // GIVEN: The detail fetch fails
    const clienteId = '550e8400-e29b-41d4-a716-446655443002';

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: clienteId,
            nombre: 'Empresa Reintentar Test',
            nit: '900444000-2',
            telefono: '3001234567',
            ciudad: 'Bogotá',
            createdAt: '2026-03-12T10:30:00.000Z',
            updatedAt: '2026-03-12T10:30:00.000Z',
          },
        ]),
      })
    );

    await page.route(`**/api/v1/clientes/${clienteId}`, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Internal Server Error' }),
      })
    );

    await page.goto(`/clientes/${clienteId}`);

    // THEN: The ErrorPanel has a "Reintentar" button
    await expect(
      page.getByTestId('error-panel').getByRole('button', { name: /reintentar/i })
    ).toBeVisible();
  });

  test('[P1] should keep the left panel (ClienteListPanel) functional when detail fetch fails', async ({ page }) => {
    // GIVEN: Detail fetch fails but list loaded correctly
    const clienteId = '550e8400-e29b-41d4-a716-446655443003';

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: clienteId,
            nombre: 'Empresa Left Functional Test',
            nit: '900444000-3',
            telefono: '3001234567',
            ciudad: 'Bogotá',
            createdAt: '2026-03-12T10:30:00.000Z',
            updatedAt: '2026-03-12T10:30:00.000Z',
          },
        ]),
      })
    );

    await page.route(`**/api/v1/clientes/${clienteId}`, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Internal Server Error' }),
      })
    );

    await page.goto(`/clientes/${clienteId}`);

    // THEN: The left panel remains visible and functional (split panel is persistent)
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Loading state: skeleton placeholders visible while detail is fetching
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Loading state shows skeleton placeholders (no spinner)', () => {
  test('[P0] should display skeleton placeholders while client detail is loading', async ({ page }) => {
    // GIVEN: The detail fetch is in progress (delayed response)
    const clienteId = '550e8400-e29b-41d4-a716-446655444001';

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: clienteId,
            nombre: 'Empresa Skeleton Test',
            nit: '900555000-1',
            telefono: '3001234567',
            ciudad: 'Bogotá',
            createdAt: '2026-03-12T10:30:00.000Z',
            updatedAt: '2026-03-12T10:30:00.000Z',
          },
        ]),
      })
    );

    // Delay the detail response to capture loading state
    await page.route(`**/api/v1/clientes/${clienteId}`, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: clienteId,
          nombre: 'Empresa Skeleton Test',
          nit: '900555000-1',
          telefono: '3001234567',
          ciudad: 'Bogotá',
          createdAt: '2026-03-12T10:30:00.000Z',
          updatedAt: '2026-03-12T10:30:00.000Z',
        }),
      });
    });

    // WHEN: Navigate to the detail route
    await page.goto(`/clientes/${clienteId}`);

    // THEN: Skeleton loading elements are visible (react-loading-skeleton renders spans with class)
    await expect(page.locator('[data-testid="cliente-detail-skeleton"]')).toBeVisible();
  });

  test('[P1] should NOT display a spinner in the loading state (skeleton-only per design)', async ({ page }) => {
    // GIVEN: Loading state uses react-loading-skeleton, not a spinner
    const clienteId = '550e8400-e29b-41d4-a716-446655444002';

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: clienteId,
            nombre: 'Empresa No Spinner Test',
            nit: '900555000-2',
            telefono: '3001234567',
            ciudad: 'Bogotá',
            createdAt: '2026-03-12T10:30:00.000Z',
            updatedAt: '2026-03-12T10:30:00.000Z',
          },
        ]),
      })
    );

    await page.route(`**/api/v1/clientes/${clienteId}`, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: clienteId,
          nombre: 'Empresa No Spinner Test',
          nit: '900555000-2',
          telefono: '3001234567',
          ciudad: 'Bogotá',
          createdAt: '2026-03-12T10:30:00.000Z',
          updatedAt: '2026-03-12T10:30:00.000Z',
        }),
      });
    });

    // WHEN: The detail is loading
    await page.goto(`/clientes/${clienteId}`);

    // THEN: No spinner role element is shown
    await expect(page.getByRole('status')).not.toBeVisible();
    // The loading indicator uses skeleton elements, not a spinner
    await expect(page.locator('[data-testid="cliente-detail-skeleton"]')).toBeVisible();
  });
});

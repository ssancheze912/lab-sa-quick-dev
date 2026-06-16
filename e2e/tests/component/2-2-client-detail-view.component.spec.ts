import { test, expect } from '@playwright/test';

/**
 * Component-level Acceptance Tests — Story 2.2: Client Detail View
 *
 * NOTE: These Playwright tests are integration/E2E-style component tests using
 * mocked API routes (network-first intercepts). The unit-level component tests
 * (Vitest + RTL) are defined separately in:
 *   frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx
 *   frontend/src/modules/crm/clientes/application/useCliente.test.ts
 *
 * Acceptance Criteria covered:
 *   AC1 — Right panel displays Nombre, NIT/RUC, Teléfono, Ciudad after clicking a client
 *   AC3 — Non-existent clienteId shows graceful not-found message (no blank panel)
 *   AC6 — Backend fail → ErrorPanel shown; raw error never exposed (NFR6)
 *   AC7 — Skeleton placeholders (react-loading-skeleton) during fetch; no spinner; aria-busy="true"
 *
 * These tests are in RED phase — they will fail until implementation is complete.
 * Network-first intercepts are set BEFORE navigation per ATDD patterns.
 */

const BASE_URL = 'http://localhost:5173';
const API_LIST_PATTERN = '**/api/v1/clientes';

/**
 * Build a minimal mock ClienteDto matching the backend contract.
 */
function mockClienteDto(overrides: Partial<{
  id: string;
  nombre: string;
  nit: string;
  telefono: string;
  ciudad: string;
  createdAt: string;
  updatedAt: string;
}> = {}) {
  const ts = new Date().toISOString();
  return {
    id: `uuid-comp-${Math.random().toString(36).slice(2, 10)}`,
    nombre: 'Empresa Componente S.A.',
    nit: '900200001',
    telefono: '3101234567',
    ciudad: 'Bogotá',
    createdAt: ts,
    updatedAt: ts,
    ...overrides,
  };
}

test.describe('Story 2.2 — ClienteDetailView Component Acceptance Tests', () => {

  // ──────────────────────────────────────────────────────────────────────────
  // AC1: Detail panel renders all four fields on success
  // ──────────────────────────────────────────────────────────────────────────

  test('AC1 — detail panel renders Nombre field and value after selecting a client', async ({ page }) => {
    // GIVEN: A client exists and is accessible via both list and detail APIs
    const cliente = mockClienteDto({ id: 'uuid-nombre-field', nombre: 'Empresa Nombre Test', nit: '900200010' });

    // Network-first: intercept BEFORE navigation
    await page.route(API_LIST_PATTERN, (route) => {
      if (!route.request().url().match(/\/clientes\/[^/]+$/)) {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) });
      } else {
        route.continue();
      }
    });

    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );

    // WHEN: User navigates to /clientes and clicks on the client
    await page.goto(`${BASE_URL}/clientes`);
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
    await page.getByTestId('cliente-list-item').filter({ hasText: cliente.nombre }).click();

    // THEN: "Nombre" label and its value are visible in the detail panel
    const detailPanel = page.getByTestId('cliente-detail-panel');
    await expect(detailPanel).toBeVisible();
    await expect(detailPanel).toContainText('Nombre');
    await expect(detailPanel).toContainText(cliente.nombre);
  });

  test('AC1 — detail panel renders NIT/RUC field and value', async ({ page }) => {
    // GIVEN: A client with a specific NIT
    const cliente = mockClienteDto({ id: 'uuid-nit-field', nombre: 'Empresa NIT Test', nit: '900200020' });

    await page.route(API_LIST_PATTERN, (route) => {
      if (!route.request().url().match(/\/clientes\/[^/]+$/)) {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) });
      } else {
        route.continue();
      }
    });

    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );

    // WHEN: User navigates to /clientes and clicks on the client
    await page.goto(`${BASE_URL}/clientes`);
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
    await page.getByTestId('cliente-list-item').filter({ hasText: cliente.nombre }).click();

    // THEN: "NIT/RUC" label and NIT value are visible
    const detailPanel = page.getByTestId('cliente-detail-panel');
    await expect(detailPanel).toContainText('NIT/RUC');
    await expect(detailPanel).toContainText(cliente.nit);
  });

  test('AC1 — detail panel renders Teléfono field and value', async ({ page }) => {
    // GIVEN: A client with a specific phone number
    const cliente = mockClienteDto({ id: 'uuid-tel-field', nombre: 'Empresa Tel Test', telefono: '3209998877' });

    await page.route(API_LIST_PATTERN, (route) => {
      if (!route.request().url().match(/\/clientes\/[^/]+$/)) {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) });
      } else {
        route.continue();
      }
    });

    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );

    // WHEN: User selects the client
    await page.goto(`${BASE_URL}/clientes`);
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
    await page.getByTestId('cliente-list-item').filter({ hasText: cliente.nombre }).click();

    // THEN: "Teléfono" label and value are visible
    const detailPanel = page.getByTestId('cliente-detail-panel');
    await expect(detailPanel).toContainText('Teléfono');
    await expect(detailPanel).toContainText(cliente.telefono);
  });

  test('AC1 — detail panel renders Ciudad field and value', async ({ page }) => {
    // GIVEN: A client with a specific city
    const cliente = mockClienteDto({ id: 'uuid-ciudad-field', nombre: 'Empresa Ciudad Test', ciudad: 'Cartagena' });

    await page.route(API_LIST_PATTERN, (route) => {
      if (!route.request().url().match(/\/clientes\/[^/]+$/)) {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([cliente]) });
      } else {
        route.continue();
      }
    });

    await page.route(`**/api/v1/clientes/${cliente.id}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cliente) })
    );

    // WHEN: User selects the client
    await page.goto(`${BASE_URL}/clientes`);
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
    await page.getByTestId('cliente-list-item').filter({ hasText: cliente.nombre }).click();

    // THEN: "Ciudad" label and value are visible
    const detailPanel = page.getByTestId('cliente-detail-panel');
    await expect(detailPanel).toContainText('Ciudad');
    await expect(detailPanel).toContainText('Cartagena');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // AC3: Not-found state — graceful message when 404 returned
  // ──────────────────────────────────────────────────────────────────────────

  test('AC3 — not-found message is shown in the right panel when 404 is returned for clienteId', async ({ page }) => {
    // GIVEN: A non-existent clienteId
    const fakeId = '00000000-0000-0000-0000-000000000000';

    // Network-first: intercept BEFORE navigation
    await page.route(API_LIST_PATTERN, (route) => {
      if (!route.request().url().match(/\/clientes\/[^/]+$/)) {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      } else {
        route.continue();
      }
    });

    await page.route(`**/api/v1/clientes/${fakeId}`, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          title: 'Cliente no encontrado',
          status: 404,
          detail: 'No se encontró el cliente solicitado.',
        }),
      })
    );

    // WHEN: User navigates directly to the non-existent clienteId URL
    await page.goto(`${BASE_URL}/clientes/${fakeId}`);

    // THEN: Not-found message is displayed gracefully in Spanish (mandatory)
    await expect(page.getByText('No se encontró el cliente solicitado.')).toBeVisible();

    // AND: ErrorPanel (for generic errors) is NOT shown for 404 — different state
    await expect(page.getByTestId('error-panel')).not.toBeVisible();

    // AND: The right panel does not show a blank screen
    await expect(page.getByTestId('cliente-detail-panel')).not.toBeEmpty();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // AC6: Backend failure → ErrorPanel; never show raw error (NFR6)
  // ──────────────────────────────────────────────────────────────────────────

  test('AC6 — ErrorPanel is shown when detail fetch fails with a non-404 error', async ({ page }) => {
    // GIVEN: Backend returns 500 for the detail endpoint
    const clienteId = 'uuid-500-error';
    const listaCliente = mockClienteDto({ id: clienteId, nombre: 'Empresa 500 Error', nit: '900600001' });

    // Network-first: intercept BEFORE navigation
    await page.route(API_LIST_PATTERN, (route) => {
      if (!route.request().url().match(/\/clientes\/[^/]+$/)) {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([listaCliente]) });
      } else {
        route.continue();
      }
    });

    await page.route(`**/api/v1/clientes/${clienteId}`, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          title: 'Internal Server Error',
          status: 500,
          detail: 'Unhandled exception: NullReferenceException at ClienteRepository.GetByIdAsync line 42',
        }),
      })
    );

    // WHEN: User navigates to the detail page
    await page.goto(`${BASE_URL}/clientes/${clienteId}`);

    // THEN: ErrorPanel is displayed
    await expect(page.getByTestId('error-panel')).toBeVisible();

    // AND: "Reintentar" button is visible (allows retry)
    await expect(page.getByRole('button', { name: /reintentar/i })).toBeVisible();

    // AND: Raw error details are NEVER shown (NFR6)
    await expect(page.getByText('NullReferenceException')).not.toBeVisible();
    await expect(page.getByText('line 42')).not.toBeVisible();
    await expect(page.getByText('ClienteRepository')).not.toBeVisible();
  });

  test('AC6 — ErrorPanel is shown when network is completely unavailable for detail fetch', async ({ page }) => {
    // GIVEN: Network fails for the detail endpoint (connection refused)
    const clienteId = 'uuid-network-fail';
    const listaCliente = mockClienteDto({ id: clienteId, nombre: 'Empresa Network Fail', nit: '900600002' });

    await page.route(API_LIST_PATTERN, (route) => {
      if (!route.request().url().match(/\/clientes\/[^/]+$/)) {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([listaCliente]) });
      } else {
        route.continue();
      }
    });

    // Abort the detail request (simulates network failure)
    await page.route(`**/api/v1/clientes/${clienteId}`, (route) => route.abort('failed'));

    // WHEN: User navigates to the detail page
    await page.goto(`${BASE_URL}/clientes/${clienteId}`);

    // THEN: ErrorPanel is displayed with Reintentar button
    await expect(page.getByTestId('error-panel')).toBeVisible();
    await expect(page.getByRole('button', { name: /reintentar/i })).toBeVisible();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // AC7: Skeleton loading — aria-busy="true", no spinner
  // ──────────────────────────────────────────────────────────────────────────

  test('AC7 — detail panel container has aria-busy="true" while fetching client data', async ({ page }) => {
    // GIVEN: Detail API is delayed (simulates slow network)
    const clienteId = 'uuid-aria-busy';
    const listaCliente = mockClienteDto({ id: clienteId, nombre: 'Empresa Aria Busy', nit: '900700010' });

    await page.route(API_LIST_PATTERN, (route) => {
      if (!route.request().url().match(/\/clientes\/[^/]+$/)) {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([listaCliente]) });
      } else {
        route.continue();
      }
    });

    await page.route(`**/api/v1/clientes/${clienteId}`, async (route) => {
      await new Promise((r) => setTimeout(r, 400)); // 400ms delay
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(listaCliente) });
    });

    // WHEN: User navigates to the detail URL
    await page.goto(`${BASE_URL}/clientes/${clienteId}`);

    // THEN: The detail panel container has aria-busy="true" during loading
    const detailPanel = page.getByTestId('cliente-detail-panel');
    await expect(detailPanel).toBeVisible();
    await expect(detailPanel).toHaveAttribute('aria-busy', 'true');

    // AND: After loading, aria-busy is removed
    await expect(detailPanel).toContainText(listaCliente.nombre);
    await expect(detailPanel).not.toHaveAttribute('aria-busy', 'true');
  });

  test('AC7 — no spinner element is visible during loading (skeleton-only loading pattern)', async ({ page }) => {
    // GIVEN: Detail API is delayed
    const clienteId = 'uuid-no-spinner';
    const listaCliente = mockClienteDto({ id: clienteId, nombre: 'Empresa No Spinner', nit: '900700020' });

    await page.route(API_LIST_PATTERN, (route) => {
      if (!route.request().url().match(/\/clientes\/[^/]+$/)) {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([listaCliente]) });
      } else {
        route.continue();
      }
    });

    await page.route(`**/api/v1/clientes/${clienteId}`, async (route) => {
      await new Promise((r) => setTimeout(r, 300));
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(listaCliente) });
    });

    // WHEN: User navigates to the detail URL
    await page.goto(`${BASE_URL}/clientes/${clienteId}`);

    // THEN: No spinner element is present (only skeleton placeholders, per AC7)
    await expect(page.getByRole('progressbar')).not.toBeVisible();
    await expect(page.locator('[data-testid="spinner"]')).not.toBeVisible();
    await expect(page.locator('[role="status"]').filter({ hasText: /loading/i })).not.toBeVisible();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Accessibility: keyboard navigation and ARIA
  // ──────────────────────────────────────────────────────────────────────────

  test('detail panel is keyboard navigable and meets basic ARIA requirements', async ({ page }) => {
    // GIVEN: A client is displayed in the detail panel
    const clienteId = 'uuid-a11y';
    const listaCliente = mockClienteDto({ id: clienteId, nombre: 'Empresa Accesibilidad', nit: '900900001', ciudad: 'Bucaramanga' });

    await page.route(API_LIST_PATTERN, (route) => {
      if (!route.request().url().match(/\/clientes\/[^/]+$/)) {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([listaCliente]) });
      } else {
        route.continue();
      }
    });

    await page.route(`**/api/v1/clientes/${clienteId}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(listaCliente) })
    );

    // WHEN: User navigates directly to the detail URL
    await page.goto(`${BASE_URL}/clientes/${clienteId}`);
    await expect(page.getByTestId('cliente-detail-panel')).toContainText(listaCliente.nombre);

    // THEN: The page has a proper heading hierarchy (WCAG 2.1 AA — heading navigable)
    // The detail view should have a heading for the client name or "Detalle del cliente"
    const headings = page.getByRole('heading');
    await expect(headings.first()).toBeVisible();

    // AND: There are no ARIA violations (basic structural check)
    // Detail panel should be reachable via Tab key
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});

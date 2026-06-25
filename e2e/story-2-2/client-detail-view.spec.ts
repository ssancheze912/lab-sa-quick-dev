/**
 * Story 2.2: Client Detail View
 * ATDD — RED Phase (Tests intentionally failing — no implementation yet)
 *
 * Acceptance Criteria covered:
 * - AC1: Clicking a client in the left panel renders detail in right panel + highlights item in Siesa Blue
 * - AC2: Clicking a client updates URL to /clientes/:clienteId without full page reload
 * - AC3: Accessing /clientes/:clienteId directly (deep link) fetches client by ID and highlights it in list
 * - AC4: 404 clienteId shows "Cliente no encontrado" message in the right panel in Spanish
 * - AC5: Backend unavailable shows ErrorPanel with "Reintentar" button that triggers refetch
 * - AC6: Loading state shows skeleton screen (NOT a spinner) in the right panel
 * - AC7: /clientes with no clienteId selected shows placeholder "Selecciona un cliente para ver el detalle"
 *
 * Network-first pattern: ALL route intercepts are registered BEFORE navigation.
 * Selectors: data-testid attributes only — no fragile CSS selectors.
 */

import { test, expect } from '@playwright/test';

const API_CLIENTES_LIST = '**/api/v1/clientes';
const API_CLIENTE_DETAIL = '**/api/v1/clientes/*';

// ─── Shared stubs ─────────────────────────────────────────────────────────────

function buildClienteStub(overrides: Partial<{
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
    id: '550e8400-e29b-41d4-a716-446655440001',
    nombre: 'Empresa Ejemplo S.A.',
    nit: '900123456-7',
    telefono: '6011234567',
    ciudad: 'Bogotá',
    createdAt: ts,
    updatedAt: ts,
    ...overrides,
  };
}

// ─── AC1: Clicking a client renders full detail in right panel + highlights ────

test.describe('AC1 — Detalle de cliente al seleccionar en lista', () => {
  test('should render the detail panel with Nombre when a client is clicked', async ({ page }) => {
    // GIVEN: API returns a client list and the detail endpoint is ready
    const cliente = buildClienteStub({ nombre: 'Acme Corp Ltda' });
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );
    await page.route(API_CLIENTE_DETAIL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cliente),
      }),
    );

    // WHEN: User navigates to /clientes and clicks on the client list item
    await page.goto('/clientes');
    await page.getByTestId('cliente-list-item').first().click();

    // THEN: The right panel shows the client Nombre
    const detailContent = page.getByTestId('cliente-detail-content');
    await expect(detailContent).toContainText('Acme Corp Ltda');
  });

  test('should render NIT/RUC in the detail panel when a client is clicked', async ({ page }) => {
    // GIVEN: API returns a client with a known NIT
    const cliente = buildClienteStub({ nit: '900999888-1' });
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );
    await page.route(API_CLIENTE_DETAIL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cliente),
      }),
    );

    // WHEN: User navigates to /clientes and clicks on the client list item
    await page.goto('/clientes');
    await page.getByTestId('cliente-list-item').first().click();

    // THEN: The detail panel shows the client NIT
    const detailContent = page.getByTestId('cliente-detail-content');
    await expect(detailContent).toContainText('900999888-1');
  });

  test('should render Telefono in the detail panel when a client is clicked', async ({ page }) => {
    // GIVEN: API returns a client with a known Teléfono
    const cliente = buildClienteStub({ telefono: '3001234567' });
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );
    await page.route(API_CLIENTE_DETAIL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cliente),
      }),
    );

    // WHEN: User navigates to /clientes and clicks on the client list item
    await page.goto('/clientes');
    await page.getByTestId('cliente-list-item').first().click();

    // THEN: The detail panel shows the client Teléfono
    const detailContent = page.getByTestId('cliente-detail-content');
    await expect(detailContent).toContainText('3001234567');
  });

  test('should render Ciudad in the detail panel when a client is clicked', async ({ page }) => {
    // GIVEN: API returns a client with a known Ciudad
    const cliente = buildClienteStub({ ciudad: 'Medellín' });
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );
    await page.route(API_CLIENTE_DETAIL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cliente),
      }),
    );

    // WHEN: User navigates to /clientes and clicks on the client list item
    await page.goto('/clientes');
    await page.getByTestId('cliente-list-item').first().click();

    // THEN: The detail panel shows the client Ciudad
    const detailContent = page.getByTestId('cliente-detail-content');
    await expect(detailContent).toContainText('Medellín');
  });

  test('should visually highlight the selected client list item', async ({ page }) => {
    // GIVEN: API returns a client
    const cliente = buildClienteStub();
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );
    await page.route(API_CLIENTE_DETAIL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cliente),
      }),
    );

    // WHEN: User navigates to /clientes and clicks on the client list item
    await page.goto('/clientes');
    const listItem = page.getByTestId('cliente-list-item').first();
    await listItem.click();

    // THEN: The list item has the aria-selected or data-active attribute indicating it is active
    await expect(listItem).toHaveAttribute('data-active', 'true');
  });
});

// ─── AC2: URL updates to /clientes/:clienteId on click ────────────────────────

test.describe('AC2 — URL actualiza a /clientes/:clienteId al seleccionar cliente', () => {
  test('should update the URL to /clientes/:clienteId when a client is clicked', async ({ page }) => {
    // GIVEN: API returns a client with a known UUID
    const clienteId = '550e8400-e29b-41d4-a716-446655440001';
    const cliente = buildClienteStub({ id: clienteId });
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );
    await page.route(API_CLIENTE_DETAIL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cliente),
      }),
    );

    // WHEN: User navigates to /clientes and clicks on the client list item
    await page.goto('/clientes');
    await page.getByTestId('cliente-list-item').first().click();

    // THEN: The URL changes to /clientes/:clienteId
    await expect(page).toHaveURL(new RegExp(`/clientes/${clienteId}`));
  });

  test('should not trigger a full page reload when a client is clicked', async ({ page }) => {
    // GIVEN: API returns a client
    const cliente = buildClienteStub();
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );
    await page.route(API_CLIENTE_DETAIL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cliente),
      }),
    );

    // WHEN: Track navigation and click a client
    await page.goto('/clientes');
    let reloaded = false;
    page.on('load', () => {
      reloaded = true;
    });
    // Reset the flag after initial page load
    reloaded = false;
    await page.getByTestId('cliente-list-item').first().click();

    // THEN: No full page reload occurred (client-side routing)
    expect(reloaded).toBe(false);
  });
});

// ─── AC3: Deep link /clientes/:clienteId fetches client and highlights in list ─

test.describe('AC3 — Deep link /clientes/:clienteId carga cliente y resalta en lista', () => {
  test('should render client detail when accessing deep link URL directly', async ({ page }) => {
    // GIVEN: API returns a client by ID and the list endpoint is ready
    const clienteId = '550e8400-e29b-41d4-a716-446655440001';
    const cliente = buildClienteStub({ id: clienteId, nombre: 'Deep Link Corp' });
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );
    await page.route(API_CLIENTE_DETAIL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cliente),
      }),
    );

    // WHEN: User navigates directly to /clientes/:clienteId
    await page.goto(`/clientes/${clienteId}`);

    // THEN: The detail panel shows the client Nombre
    const detailContent = page.getByTestId('cliente-detail-content');
    await expect(detailContent).toContainText('Deep Link Corp');
  });

  test('should highlight the corresponding client item in the list on deep link access', async ({ page }) => {
    // GIVEN: API returns a client by ID and the list endpoint with matching client
    const clienteId = '550e8400-e29b-41d4-a716-446655440001';
    const cliente = buildClienteStub({ id: clienteId });
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );
    await page.route(API_CLIENTE_DETAIL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cliente),
      }),
    );

    // WHEN: User navigates directly to /clientes/:clienteId
    await page.goto(`/clientes/${clienteId}`);

    // THEN: The client list item is highlighted as active
    const listItem = page.getByTestId('cliente-list-item').first();
    await expect(listItem).toHaveAttribute('data-active', 'true');
  });
});

// ─── AC4: 404 clienteId shows "Cliente no encontrado" ─────────────────────────

test.describe('AC4 — 404 muestra "Cliente no encontrado" en panel derecho', () => {
  test('should display "Cliente no encontrado" when the clienteId does not exist', async ({ page }) => {
    // GIVEN: API returns 404 for the specific client ID
    const unknownId = '00000000-0000-0000-0000-000000000000';
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );
    await page.route(API_CLIENTE_DETAIL, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          type: 'https://tools.ietf.org/html/rfc7807',
          title: 'Not Found',
          status: 404,
          detail: `Cliente con id ${unknownId} no encontrado.`,
        }),
      }),
    );

    // WHEN: User accesses /clientes/:unknownId directly
    await page.goto(`/clientes/${unknownId}`);

    // THEN: The right panel displays the not-found message in Spanish
    const notFoundMessage = page.getByTestId('cliente-not-found');
    await expect(notFoundMessage).toContainText('Cliente no encontrado');
  });

  test('should NOT show ErrorPanel for a 404 response (only not-found message)', async ({ page }) => {
    // GIVEN: API returns 404 for the specific client ID
    const unknownId = '00000000-0000-0000-0000-000000000000';
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );
    await page.route(API_CLIENTE_DETAIL, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ status: 404, title: 'Not Found' }),
      }),
    );

    // WHEN: User accesses /clientes/:unknownId directly
    await page.goto(`/clientes/${unknownId}`);

    // THEN: The ErrorPanel is NOT displayed (404 has its own distinct UI)
    const errorPanel = page.getByTestId('error-panel');
    await expect(errorPanel).not.toBeVisible();
  });
});

// ─── AC5: Backend unavailable shows ErrorPanel with "Reintentar" button ────────

test.describe('AC5 — ErrorPanel con "Reintentar" cuando el backend falla', () => {
  test('should display ErrorPanel in the detail panel when backend returns 500', async ({ page }) => {
    // GIVEN: List API succeeds but detail API returns 500
    const clienteId = '550e8400-e29b-41d4-a716-446655440001';
    const cliente = buildClienteStub({ id: clienteId });
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );
    await page.route(API_CLIENTE_DETAIL, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ status: 500, title: 'Internal Server Error' }),
      }),
    );

    // WHEN: User navigates to /clientes/:clienteId (deep link or click)
    await page.goto(`/clientes/${clienteId}`);

    // THEN: ErrorPanel is displayed in the right panel
    const errorPanel = page.getByTestId('error-panel');
    await expect(errorPanel).toBeVisible();
  });

  test('should display a "Reintentar" button in the detail ErrorPanel', async ({ page }) => {
    // GIVEN: Detail API returns 500
    const clienteId = '550e8400-e29b-41d4-a716-446655440001';
    const cliente = buildClienteStub({ id: clienteId });
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );
    await page.route(API_CLIENTE_DETAIL, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ status: 500, title: 'Internal Server Error' }),
      }),
    );

    // WHEN: User navigates to /clientes/:clienteId
    await page.goto(`/clientes/${clienteId}`);

    // THEN: The "Reintentar" button is visible inside the ErrorPanel
    const retryButton = page.getByTestId('error-panel-retry-button');
    await expect(retryButton).toBeVisible();
  });

  test('should refetch and show client detail when "Reintentar" is clicked after 5xx failure', async ({ page }) => {
    // GIVEN: First detail call fails with 500; second call succeeds
    const clienteId = '550e8400-e29b-41d4-a716-446655440001';
    const cliente = buildClienteStub({ id: clienteId, nombre: 'Recuperado S.A.' });
    let detailCallCount = 0;
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );
    await page.route(API_CLIENTE_DETAIL, (route) => {
      detailCallCount++;
      if (detailCallCount === 1) {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ status: 500, title: 'Internal Server Error' }),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(cliente),
        });
      }
    });

    // WHEN: User navigates to /clientes/:clienteId, sees ErrorPanel, then clicks Reintentar
    await page.goto(`/clientes/${clienteId}`);
    const retryButton = page.getByTestId('error-panel-retry-button');
    await expect(retryButton).toBeVisible();
    await retryButton.click();

    // THEN: Client detail is now displayed (the second fetch succeeded)
    const detailContent = page.getByTestId('cliente-detail-content');
    await expect(detailContent).toContainText('Recuperado S.A.');
  });

  test('should display ErrorPanel in the detail panel when detail fetch has a network error', async ({ page }) => {
    // GIVEN: List API succeeds but detail API fails with network error
    const clienteId = '550e8400-e29b-41d4-a716-446655440001';
    const cliente = buildClienteStub({ id: clienteId });
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );
    await page.route(API_CLIENTE_DETAIL, (route) => route.abort('connectionrefused'));

    // WHEN: User navigates to /clientes/:clienteId
    await page.goto(`/clientes/${clienteId}`);

    // THEN: ErrorPanel is displayed in the right panel
    const errorPanel = page.getByTestId('error-panel');
    await expect(errorPanel).toBeVisible();
  });
});

// ─── AC6: Loading state shows skeleton screen (NOT spinner) ───────────────────

test.describe('AC6 — Estado de carga muestra skeleton screen, NO spinner', () => {
  test('should display skeleton screen while client detail is loading', async ({ page }) => {
    // GIVEN: Detail API is slow (delayed response)
    const clienteId = '550e8400-e29b-41d4-a716-446655440001';
    const cliente = buildClienteStub({ id: clienteId });
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );
    await page.route(API_CLIENTE_DETAIL, async (route) => {
      // Delay the response so we can capture the loading state
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cliente),
      });
    });

    // WHEN: User navigates to /clientes/:clienteId (loading state is active)
    await page.goto(`/clientes/${clienteId}`);

    // THEN: Skeleton screen is visible before data arrives
    const skeleton = page.getByTestId('cliente-detail-skeleton');
    await expect(skeleton).toBeVisible();
  });

  test('should NOT display a spinner while client detail is loading', async ({ page }) => {
    // GIVEN: Detail API is slow
    const clienteId = '550e8400-e29b-41d4-a716-446655440001';
    const cliente = buildClienteStub({ id: clienteId });
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );
    await page.route(API_CLIENTE_DETAIL, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cliente),
      });
    });

    // WHEN: User navigates to /clientes/:clienteId (loading state is active)
    await page.goto(`/clientes/${clienteId}`);

    // THEN: No spinner element exists (company standard: skeleton only)
    const spinner = page.getByTestId('loading-spinner');
    await expect(spinner).not.toBeVisible();
  });
});

// ─── AC7: /clientes without clienteId shows placeholder ──────────────────────

test.describe('AC7 — /clientes sin clienteId seleccionado muestra placeholder', () => {
  test('should show placeholder text "Selecciona un cliente para ver el detalle" when no client is selected', async ({ page }) => {
    // GIVEN: API returns a client list
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([buildClienteStub()]),
      }),
    );

    // WHEN: User navigates to /clientes without selecting any client
    await page.goto('/clientes');

    // THEN: The right panel shows the placeholder text in Spanish
    const placeholder = page.getByTestId('cliente-detail-placeholder');
    await expect(placeholder).toContainText('Selecciona un cliente para ver el detalle');
  });

  test('should not make a detail API request when no client is selected', async ({ page }) => {
    // GIVEN: API returns a client list
    let detailCallMade = false;
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([buildClienteStub()]),
      }),
    );
    await page.route(API_CLIENTE_DETAIL, (route) => {
      detailCallMade = true;
      route.continue();
    });

    // WHEN: User navigates to /clientes without selecting a client
    await page.goto('/clientes');
    // Brief wait to ensure any unintended calls would have fired
    await page.waitForTimeout(300);

    // THEN: No detail API call was made
    expect(detailCallMade).toBe(false);
  });

  test('should show the right panel container (detail panel) even with no client selected', async ({ page }) => {
    // GIVEN: API returns a client list
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([buildClienteStub()]),
      }),
    );

    // WHEN: User navigates to /clientes without selecting any client
    await page.goto('/clientes');

    // THEN: The right panel container is still visible
    const detailPanel = page.getByTestId('cliente-detail-panel');
    await expect(detailPanel).toBeVisible();
  });
});

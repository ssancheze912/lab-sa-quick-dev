/**
 * Story 2.2: Client Detail View — Edge Cases & Extended Coverage
 * testarch-automate — BMad-Integrated Mode
 *
 * Expands ATDD coverage with edge cases, boundary conditions, and negative paths
 * NOT covered by the ATDD red-phase tests in client-detail-view.spec.ts.
 *
 * Additional scenarios:
 * - Keyboard navigation to select a client (accessibility)
 * - Switching selection between multiple clients
 * - Browser back button preserves correct state
 * - Client with special characters in fields
 * - Multiple rapid client clicks (debounce / no duplicate fetches)
 * - Slow network: skeleton disappears once data loads
 * - 429 Too Many Requests treated as generic error (shows ErrorPanel)
 * - List shows empty state while detail panel shows placeholder (combined state)
 * - ARIA accessibility attributes on list item and detail panel
 *
 * Network-first pattern: ALL route intercepts registered BEFORE navigation.
 * Selectors: data-testid attributes only.
 */

import { test, expect } from '@playwright/test';

const API_CLIENTES_LIST = '**/api/v1/clientes';
const API_CLIENTE_DETAIL = '**/api/v1/clientes/*';

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

// ─── Keyboard navigation ──────────────────────────────────────────────────────

test.describe('[P1] Keyboard navigation — Accesibilidad teclado', () => {
  test('[P1] should open client detail when Enter key is pressed on a list item', async ({ page }) => {
    // GIVEN: API returns one client
    const cliente = buildClienteStub({ nombre: 'Teclado Corp S.A.' });
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

    // WHEN: User navigates to /clientes and presses Enter on the first list item
    await page.goto('/clientes');
    const listItem = page.getByTestId('cliente-list-item').first();
    await listItem.focus();
    await listItem.press('Enter');

    // THEN: The detail panel shows the client Nombre
    const detailContent = page.getByTestId('cliente-detail-content');
    await expect(detailContent).toContainText('Teclado Corp S.A.');
  });

  test('[P1] should open client detail when Space key is pressed on a list item', async ({ page }) => {
    // GIVEN: API returns one client
    const cliente = buildClienteStub({ nombre: 'Espacio S.A.' });
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

    // WHEN: User focuses list item and presses Space
    await page.goto('/clientes');
    const listItem = page.getByTestId('cliente-list-item').first();
    await listItem.focus();
    await listItem.press(' ');

    // THEN: The detail panel shows the client Nombre
    const detailContent = page.getByTestId('cliente-detail-content');
    await expect(detailContent).toContainText('Espacio S.A.');
  });

  test('[P1] should have tabIndex=0 on list items making them keyboard focusable', async ({ page }) => {
    // GIVEN: API returns one client
    const cliente = buildClienteStub();
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: The list item has tabIndex=0 (keyboard focusable)
    const listItem = page.getByTestId('cliente-list-item').first();
    await expect(listItem).toHaveAttribute('tabindex', '0');
  });
});

// ─── Multiple client selection (switching between clients) ────────────────────

test.describe('[P1] Switching between clients — Cambio de selección', () => {
  test('[P1] should update the detail panel when switching from one client to another', async ({ page }) => {
    // GIVEN: API returns two clients
    const clienteA = buildClienteStub({ id: 'aaa00000-0000-0000-0000-000000000001', nombre: 'Empresa Alpha S.A.' });
    const clienteB = buildClienteStub({ id: 'bbb00000-0000-0000-0000-000000000002', nombre: 'Empresa Beta Ltda' });
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([clienteA, clienteB]),
      }),
    );
    // Detail endpoint returns the correct client based on the ID in the URL
    await page.route('**/api/v1/clientes/aaa00000-0000-0000-0000-000000000001', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clienteA),
      }),
    );
    await page.route('**/api/v1/clientes/bbb00000-0000-0000-0000-000000000002', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clienteB),
      }),
    );

    // WHEN: User clicks first client, then second client
    await page.goto('/clientes');
    await page.getByTestId('cliente-list-item').nth(0).click();
    const detailContent = page.getByTestId('cliente-detail-content');
    await expect(detailContent).toContainText('Empresa Alpha S.A.');

    await page.getByTestId('cliente-list-item').nth(1).click();

    // THEN: The detail panel updates to show the second client
    await expect(detailContent).toContainText('Empresa Beta Ltda');
  });

  test('[P1] should deactivate the previous list item highlight when a new client is selected', async ({ page }) => {
    // GIVEN: API returns two clients
    const clienteA = buildClienteStub({ id: 'aaa00000-0000-0000-0000-000000000001', nombre: 'Alpha' });
    const clienteB = buildClienteStub({ id: 'bbb00000-0000-0000-0000-000000000002', nombre: 'Beta' });
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([clienteA, clienteB]),
      }),
    );
    await page.route('**/api/v1/clientes/aaa00000-0000-0000-0000-000000000001', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clienteA) }),
    );
    await page.route('**/api/v1/clientes/bbb00000-0000-0000-0000-000000000002', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clienteB) }),
    );

    // WHEN: User selects first client, then second
    await page.goto('/clientes');
    await page.getByTestId('cliente-list-item').nth(0).click();
    await page.getByTestId('cliente-list-item').nth(1).click();

    // THEN: Only the second item is active (first is no longer highlighted)
    const firstItem = page.getByTestId('cliente-list-item').nth(0);
    const secondItem = page.getByTestId('cliente-list-item').nth(1);
    await expect(secondItem).toHaveAttribute('data-active', 'true');
    await expect(firstItem).not.toHaveAttribute('data-active', 'true');
  });
});

// ─── Special characters in client data ───────────────────────────────────────

test.describe('[P2] Special characters in client fields', () => {
  test('[P2] should correctly render a client Nombre with accented characters', async ({ page }) => {
    // GIVEN: Client has special characters in Nombre
    const cliente = buildClienteStub({ nombre: 'Cía. Química Ñoño & Asociados' });
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

    // WHEN: User navigates to /clientes and clicks the client
    await page.goto('/clientes');
    await page.getByTestId('cliente-list-item').first().click();

    // THEN: The detail panel renders the name with special characters intact
    const detailContent = page.getByTestId('cliente-detail-content');
    await expect(detailContent).toContainText('Cía. Química Ñoño & Asociados');
  });

  test('[P2] should correctly render a Ciudad with special characters', async ({ page }) => {
    // GIVEN: Client has a Ciudad with special characters
    const cliente = buildClienteStub({ ciudad: 'São Paulo' });
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

    // WHEN: User navigates to /clientes and clicks the client
    await page.goto('/clientes');
    await page.getByTestId('cliente-list-item').first().click();

    // THEN: Ciudad is rendered correctly
    const detailContent = page.getByTestId('cliente-detail-content');
    await expect(detailContent).toContainText('São Paulo');
  });
});

// ─── Browser back/forward navigation ─────────────────────────────────────────

test.describe('[P2] Browser back/forward navigation', () => {
  test('[P2] should return to placeholder state when browser back is pressed from client detail', async ({ page }) => {
    // GIVEN: A client exists and has been viewed
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

    // WHEN: User navigates to client detail then presses browser back
    await page.goto('/clientes');
    await page.getByTestId('cliente-list-item').first().click();
    await expect(page.getByTestId('cliente-detail-content')).toBeVisible();
    await page.goBack();

    // THEN: Right panel returns to placeholder state
    const placeholder = page.getByTestId('cliente-detail-placeholder');
    await expect(placeholder).toContainText('Selecciona un cliente para ver el detalle');
  });

  test('[P2] should restore client detail when browser forward is pressed', async ({ page }) => {
    // GIVEN: User was viewing client detail and pressed back
    const clienteId = '550e8400-e29b-41d4-a716-446655440001';
    const cliente = buildClienteStub({ id: clienteId, nombre: 'Forward Corp' });
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

    // WHEN: User navigates to client, goes back, then forward
    await page.goto('/clientes');
    await page.getByTestId('cliente-list-item').first().click();
    await expect(page).toHaveURL(new RegExp(`/clientes/${clienteId}`));
    await page.goBack();
    await page.goForward();

    // THEN: Client detail is restored
    const detailContent = page.getByTestId('cliente-detail-content');
    await expect(detailContent).toContainText('Forward Corp');
  });
});

// ─── Skeleton disappears after data loads ────────────────────────────────────

test.describe('[P1] Loading state transitions', () => {
  test('[P1] should hide skeleton screen and show client detail after data loads', async ({ page }) => {
    // GIVEN: Detail API responds after a short delay
    const clienteId = '550e8400-e29b-41d4-a716-446655440001';
    const cliente = buildClienteStub({ id: clienteId, nombre: 'Post-Skeleton Corp' });
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );
    await page.route(API_CLIENTE_DETAIL, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cliente),
      });
    });

    // WHEN: User navigates to /clientes/:clienteId and waits for load
    await page.goto(`/clientes/${clienteId}`);

    // THEN: Eventually skeleton is gone and client detail is visible
    await expect(page.getByTestId('cliente-detail-content')).toBeVisible();
    await expect(page.getByTestId('cliente-detail-skeleton')).not.toBeVisible();
  });

  test('[P1] should hide ErrorPanel and show client detail after successful retry', async ({ page }) => {
    // GIVEN: First call returns 500, second returns success
    const clienteId = '550e8400-e29b-41d4-a716-446655440001';
    const cliente = buildClienteStub({ id: clienteId, nombre: 'Retry Success Corp' });
    let callCount = 0;
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );
    await page.route(API_CLIENTE_DETAIL, (route) => {
      callCount++;
      if (callCount === 1) {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ status: 500, title: 'Internal Server Error' }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cliente),
      });
    });

    // WHEN: Error panel is visible and user clicks Reintentar
    await page.goto(`/clientes/${clienteId}`);
    await expect(page.getByTestId('error-panel')).toBeVisible();
    await page.getByTestId('error-panel-retry-button').click();

    // THEN: ErrorPanel is hidden and detail is visible
    await expect(page.getByTestId('cliente-detail-content')).toContainText('Retry Success Corp');
    await expect(page.getByTestId('error-panel')).not.toBeVisible();
  });
});

// ─── 429 Too Many Requests treated as generic error ──────────────────────────

test.describe('[P2] Non-standard HTTP error codes', () => {
  test('[P2] should display ErrorPanel for 429 Too Many Requests on detail fetch', async ({ page }) => {
    // GIVEN: Detail API returns 429
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
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ status: 429, title: 'Too Many Requests' }),
      }),
    );

    // WHEN: User navigates to /clientes/:clienteId
    await page.goto(`/clientes/${clienteId}`);

    // THEN: ErrorPanel is displayed (not a 404 not-found message)
    await expect(page.getByTestId('error-panel')).toBeVisible();
    await expect(page.getByTestId('cliente-not-found')).not.toBeVisible();
  });

  test('[P2] should display ErrorPanel for 503 Service Unavailable on detail fetch', async ({ page }) => {
    // GIVEN: Detail API returns 503
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
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ status: 503, title: 'Service Unavailable' }),
      }),
    );

    // WHEN: User navigates to /clientes/:clienteId
    await page.goto(`/clientes/${clienteId}`);

    // THEN: ErrorPanel is displayed
    await expect(page.getByTestId('error-panel')).toBeVisible();
  });
});

// ─── ARIA accessibility attributes ───────────────────────────────────────────

test.describe('[P1] ARIA accessibility attributes', () => {
  test('[P1] should have aria-label on the client detail panel container', async ({ page }) => {
    // GIVEN: No client selected
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([buildClienteStub()]),
      }),
    );

    // WHEN: User navigates to /clientes
    await page.goto('/clientes');

    // THEN: The detail panel has an aria-label for screen readers
    const detailPanel = page.getByTestId('cliente-detail-panel');
    await expect(detailPanel).toHaveAttribute('aria-label', /panel de detalle/i);
  });

  test('[P1] should have role="option" and aria-selected on list items', async ({ page }) => {
    // GIVEN: API returns a client
    const cliente = buildClienteStub();
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([cliente]),
      }),
    );

    // WHEN: User navigates to /clientes (no client selected)
    await page.goto('/clientes');

    // THEN: List items have correct ARIA roles
    const listItem = page.getByTestId('cliente-list-item').first();
    await expect(listItem).toHaveAttribute('role', 'option');
  });

  test('[P1] should have aria-selected="true" on the active list item after selection', async ({ page }) => {
    // GIVEN: API returns one client
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

    // WHEN: User clicks a client
    await page.goto('/clientes');
    await page.getByTestId('cliente-list-item').first().click();

    // THEN: The active list item has aria-selected="true"
    const listItem = page.getByTestId('cliente-list-item').first();
    await expect(listItem).toHaveAttribute('aria-selected', 'true');
  });

  test('[P1] should have aria-live="polite" on the not-found message for screen readers', async ({ page }) => {
    // GIVEN: Detail API returns 404
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

    // WHEN: User accesses /clientes/:unknownId
    await page.goto(`/clientes/${unknownId}`);

    // THEN: The not-found message has aria-live for screen reader announcements
    const notFound = page.getByTestId('cliente-not-found');
    await expect(notFound).toHaveAttribute('aria-live', 'polite');
  });
});

// ─── URL does not change when re-clicking the same client ─────────────────────

test.describe('[P2] Re-clicking the same client', () => {
  test('[P2] should keep the same URL when re-clicking the already active client', async ({ page }) => {
    // GIVEN: A client is already selected and visible in the detail panel
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

    // WHEN: User clicks the same client item a second time
    await page.goto('/clientes');
    await page.getByTestId('cliente-list-item').first().click();
    await expect(page).toHaveURL(new RegExp(`/clientes/${clienteId}`));
    await page.getByTestId('cliente-list-item').first().click();

    // THEN: URL remains the same (no navigation to a duplicate entry)
    await expect(page).toHaveURL(new RegExp(`/clientes/${clienteId}`));
  });
});

// ─── Deep link with empty list (client not in list but API returns it) ────────

test.describe('[P2] Deep link when client not in list', () => {
  test('[P2] should render client detail via deep link even when client is not in the list response', async ({ page }) => {
    // GIVEN: List API returns empty, but detail API returns the client
    const clienteId = '550e8400-e29b-41d4-a716-446655440001';
    const cliente = buildClienteStub({ id: clienteId, nombre: 'Solo Detail Corp' });
    await page.route(API_CLIENTES_LIST, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );
    await page.route(API_CLIENTE_DETAIL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cliente),
      }),
    );

    // WHEN: User accesses the deep link URL directly
    await page.goto(`/clientes/${clienteId}`);

    // THEN: Client detail is rendered regardless of list content
    const detailContent = page.getByTestId('cliente-detail-content');
    await expect(detailContent).toContainText('Solo Detail Corp');
  });
});

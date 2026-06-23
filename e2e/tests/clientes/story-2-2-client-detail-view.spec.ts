/**
 * Story 2.2: Client Detail View
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (E2E Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Detail panel renders on client selection; URL updates to /clientes/:clienteId
 *   AC2 — Direct URL access (deep linking) loads correct client and highlights list item
 *   AC3 — 404 not-found: graceful message "Cliente no encontrado." in right panel
 *   AC4 — Loading skeleton shown in right panel during detail fetch (no spinner)
 *   AC5 — ErrorPanel + "Reintentar" button on non-404 fetch failure
 *   AC6 — Default empty state shown on /clientes without clienteId
 *   AC8 — Active list item highlighted with Siesa Blue accent
 *   AC9 — Accessibility: detail panel heading is h2, fields have visible labels
 *
 * Network-first intercept pattern: routes are intercepted BEFORE navigation.
 * Uses data-testid selectors exclusively — no fragile CSS selectors.
 */

import { test, expect } from '@playwright/test';
import { buildClienteFixture, buildClienteFixtures } from '../../support/factories/cliente.factory';

const API_CLIENTES_URL = '**/api/v1/clientes';
const API_CLIENTE_BY_ID_URL = '**/api/v1/clientes/*';

// Shared test fixtures
const CLIENTE_ALPHA = buildClienteFixture({
  id: 'aaaaaaaa-aaaa-4000-8000-aaaaaaaaaaaa',
  nombre: 'Empresa Alpha SA',
  nit: '900123456',
  telefono: '3001234567',
  ciudad: 'Bogotá',
});

const CLIENTE_BETA = buildClienteFixture({
  id: 'bbbbbbbb-bbbb-4000-8000-bbbbbbbbbbbb',
  nombre: 'Beta Comercial Ltda',
  nit: '800987654',
  telefono: null,
  ciudad: null,
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1: Detail panel renders on client selection; URL updates to /clientes/:clienteId
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Detail panel on client selection', () => {
  test('should render the right panel with client detail when a client list item is clicked', async ({ page }) => {
    // GIVEN: The client list is displayed in the left panel
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([CLIENTE_ALPHA, CLIENTE_BETA]),
      })
    );
    await page.route(API_CLIENTE_BY_ID_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_ALPHA),
      })
    );

    // WHEN: The user navigates to /clientes and clicks on a client
    await page.goto('/clientes');
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Alpha SA' }).click();

    // THEN: The right panel renders the client detail panel
    await expect(page.getByTestId('cliente-detail-panel')).toBeVisible();
  });

  test('should display the selected client Nombre in the detail panel after clicking a list item', async ({ page }) => {
    // GIVEN: The client list is displayed in the left panel
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([CLIENTE_ALPHA, CLIENTE_BETA]),
      })
    );
    await page.route(API_CLIENTE_BY_ID_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_ALPHA),
      })
    );

    // WHEN: The user clicks on the client item
    await page.goto('/clientes');
    await page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Alpha SA' }).click();

    // THEN: The detail panel shows the client's Nombre
    await expect(page.getByTestId('cliente-detail-nombre')).toHaveText('Empresa Alpha SA');
  });

  test('should display the selected client NIT/RUC in the detail panel after clicking a list item', async ({ page }) => {
    // GIVEN: The client list is displayed in the left panel
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([CLIENTE_ALPHA]),
      })
    );
    await page.route(API_CLIENTE_BY_ID_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_ALPHA),
      })
    );

    // WHEN: The user clicks on the client item
    await page.goto('/clientes');
    await page.getByTestId('cliente-list-item').first().click();

    // THEN: The detail panel shows the client's NIT
    await expect(page.getByTestId('cliente-detail-nit')).toHaveText('900123456');
  });

  test('should update the URL to /clientes/:clienteId when a client item is clicked', async ({ page }) => {
    // GIVEN: The client list is displayed in the left panel
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([CLIENTE_ALPHA]),
      })
    );
    await page.route(API_CLIENTE_BY_ID_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_ALPHA),
      })
    );

    // WHEN: The user clicks on the client item
    await page.goto('/clientes');
    await page.getByTestId('cliente-list-item').first().click();

    // THEN: The URL updates to /clientes/:clienteId (FR30 deep linking)
    await expect(page).toHaveURL(`/clientes/${CLIENTE_ALPHA.id}`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2: Direct URL access — deep linking
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Direct URL access (deep linking)', () => {
  test('should load the correct client detail when navigating directly to /clientes/:clienteId', async ({ page }) => {
    // GIVEN: The user accesses /clientes/:clienteId directly (e.g., via bookmark)
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([CLIENTE_ALPHA, CLIENTE_BETA]),
      })
    );
    await page.route(API_CLIENTE_BY_ID_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_ALPHA),
      })
    );

    // WHEN: The page loads at the direct URL
    await page.goto(`/clientes/${CLIENTE_ALPHA.id}`);

    // THEN: The client detail panel displays the correct client's Nombre
    await expect(page.getByTestId('cliente-detail-nombre')).toHaveText('Empresa Alpha SA');
  });

  test('should display all client detail fields when navigating directly to /clientes/:clienteId', async ({ page }) => {
    // GIVEN: The user accesses /clientes/:clienteId directly
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([CLIENTE_ALPHA]),
      })
    );
    await page.route(API_CLIENTE_BY_ID_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_ALPHA),
      })
    );

    // WHEN: The page loads
    await page.goto(`/clientes/${CLIENTE_ALPHA.id}`);

    // THEN: Teléfono and Ciudad are displayed
    await expect(page.getByTestId('cliente-detail-telefono')).toHaveText('3001234567');
    await expect(page.getByTestId('cliente-detail-ciudad')).toHaveText('Bogotá');
  });

  test('should highlight the matching list item when navigating directly to /clientes/:clienteId', async ({ page }) => {
    // GIVEN: The user accesses /clientes/:clienteId directly
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([CLIENTE_ALPHA, CLIENTE_BETA]),
      })
    );
    await page.route(API_CLIENTE_BY_ID_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_ALPHA),
      })
    );

    // WHEN: The page loads at the direct URL
    await page.goto(`/clientes/${CLIENTE_ALPHA.id}`);

    // THEN: The matching item in the left list is in the active/highlighted state
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Alpha SA' })
    ).toHaveAttribute('data-active', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3: Not-found handling — 404 clienteId
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Not-found handling on 404', () => {
  test('should display graceful not-found message when clienteId does not exist (404)', async ({ page }) => {
    // GIVEN: A clienteId in the URL does not correspond to any existing client
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );
    await page.route(API_CLIENTE_BY_ID_URL, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          type: 'https://tools.ietf.org/html/rfc7807',
          title: 'Cliente no encontrado.',
          status: 404,
          detail: "No existe un cliente con id 'nonexistent-id'.",
        }),
      })
    );

    // WHEN: The page loads with a non-existent clienteId
    await page.goto('/clientes/00000000-0000-4000-8000-000000000000');

    // THEN: The right panel displays a graceful not-found message
    await expect(page.getByTestId('cliente-not-found')).toBeVisible();
  });

  test('should display "Cliente no encontrado." text when 404 is returned', async ({ page }) => {
    // GIVEN: A clienteId in the URL does not correspond to any existing client
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    );
    await page.route(API_CLIENTE_BY_ID_URL, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({ title: 'Cliente no encontrado.', status: 404 }),
      })
    );

    // WHEN: GET /api/v1/clientes/{id} returns 404
    await page.goto('/clientes/00000000-0000-4000-8000-000000000000');

    // THEN: The text "Cliente no encontrado." is shown in the right panel
    await expect(page.getByText('Cliente no encontrado.')).toBeVisible();
  });

  test('should not expose raw error data or crash when 404 is returned', async ({ page }) => {
    // GIVEN: A clienteId that does not exist
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    );
    await page.route(API_CLIENTE_BY_ID_URL, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({ title: 'Cliente no encontrado.', status: 404, detail: 'internal detail' }),
      })
    );

    // WHEN: The page loads
    await page.goto('/clientes/00000000-0000-4000-8000-000000000000');

    // THEN: The right panel does NOT show raw "internal detail" or stack traces
    await expect(page.getByTestId('cliente-detail-panel')).not.toContainText('internal detail');
    await expect(page.getByTestId('cliente-detail-panel')).not.toContainText('StackTrace');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4: Loading skeleton on detail fetch
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Loading skeleton in right panel during detail fetch', () => {
  test('should display skeleton placeholders in right panel while detail fetch is in flight', async ({ page }) => {
    // GIVEN: The right panel is fetching a client by ID (slow response)
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([CLIENTE_ALPHA]),
      })
    );

    let resolveDetail!: () => void;
    const detailPromise = new Promise<void>((resolve) => { resolveDetail = resolve; });

    await page.route(API_CLIENTE_BY_ID_URL, async (route) => {
      await detailPromise; // hold the response
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_ALPHA),
      });
    });

    // WHEN: The user navigates directly to the detail URL (request in flight)
    await page.goto(`/clientes/${CLIENTE_ALPHA.id}`);

    // THEN: Skeleton placeholders are visible in the right panel
    await expect(page.getByTestId('cliente-detail-skeleton')).toBeVisible();

    // AND: No spinner is shown
    await expect(page.getByRole('progressbar')).toHaveCount(0);

    // Cleanup: resolve the pending request
    resolveDetail();
  });

  test('should not show a spinner while the detail fetch is in flight', async ({ page }) => {
    // GIVEN: The detail fetch is slow
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([CLIENTE_ALPHA]) })
    );

    let resolveDetail!: () => void;
    const detailPromise = new Promise<void>((resolve) => { resolveDetail = resolve; });

    await page.route(API_CLIENTE_BY_ID_URL, async (route) => {
      await detailPromise;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_ALPHA),
      });
    });

    // WHEN: The request is in flight
    await page.goto(`/clientes/${CLIENTE_ALPHA.id}`);

    // THEN: No spinner role is present in the detail panel
    await expect(page.getByTestId('cliente-detail-panel').getByRole('progressbar')).toHaveCount(0);

    resolveDetail();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5: Error panel on fetch failure (non-404)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — ErrorPanel on non-404 detail fetch failure', () => {
  test('should display ErrorPanel in the right panel when GET /api/v1/clientes/{id} fails with 500', async ({ page }) => {
    // GIVEN: The backend is unavailable when the detail fetch runs
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([CLIENTE_ALPHA]) })
    );
    await page.route(API_CLIENTE_BY_ID_URL, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Internal Server Error', status: 500 }),
      })
    );

    // WHEN: The user navigates directly to the detail URL
    await page.goto(`/clientes/${CLIENTE_ALPHA.id}`);

    // THEN: The ErrorPanel is displayed in the right panel
    await expect(page.getByTestId('cliente-detail-error')).toBeVisible();
  });

  test('should display a "Reintentar" button in the right panel ErrorPanel on non-404 failure', async ({ page }) => {
    // GIVEN: The backend returns 500 for GET /api/v1/clientes/{id}
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([CLIENTE_ALPHA]) })
    );
    await page.route(API_CLIENTE_BY_ID_URL, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Internal Server Error', status: 500 }),
      })
    );

    // WHEN: The error panel is shown
    await page.goto(`/clientes/${CLIENTE_ALPHA.id}`);

    // THEN: A "Reintentar" button is visible in the right panel
    await expect(page.getByTestId('cliente-detail-panel').getByRole('button', { name: /reintentar/i })).toBeVisible();
  });

  test('should re-trigger the detail query when "Reintentar" button is clicked', async ({ page }) => {
    // GIVEN: The API initially fails then succeeds on retry
    let detailRequestCount = 0;
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([CLIENTE_ALPHA]) })
    );
    await page.route(API_CLIENTE_BY_ID_URL, (route) => {
      detailRequestCount++;
      if (detailRequestCount === 1) {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ title: 'Internal Server Error', status: 500 }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLIENTE_ALPHA),
      });
    });

    // WHEN: The error panel is shown and the user clicks "Reintentar"
    await page.goto(`/clientes/${CLIENTE_ALPHA.id}`);
    await expect(page.getByTestId('cliente-detail-error')).toBeVisible();
    await page.getByTestId('cliente-detail-panel').getByRole('button', { name: /reintentar/i }).click();

    // THEN: A new request to GET /api/v1/clientes/{id} is made and detail renders
    await expect(page.getByTestId('cliente-detail-nombre')).toBeVisible();
    expect(detailRequestCount).toBeGreaterThanOrEqual(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6: Default empty state — no client selected
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Default empty state when no client is selected', () => {
  test('should show default placeholder in right panel when on /clientes without a clienteId', async ({ page }) => {
    // GIVEN: The user is on /clientes without a clienteId in the URL
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([CLIENTE_ALPHA, CLIENTE_BETA]),
      })
    );

    // WHEN: The page loads at /clientes base route
    await page.goto('/clientes');

    // THEN: The right panel shows the default placeholder message
    await expect(page.getByText(/selecciona un cliente de la lista/i)).toBeVisible();
  });

  test('should not show the detail panel content when no client is selected on /clientes', async ({ page }) => {
    // GIVEN: The user is on /clientes with no clienteId
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([CLIENTE_ALPHA]) })
    );

    // WHEN: The page loads
    await page.goto('/clientes');

    // THEN: No detail fields (NIT, Teléfono, Ciudad) are rendered
    await expect(page.getByTestId('cliente-detail-nit')).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC8: Selected item highlighted in list
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC8 — Selected list item highlighted', () => {
  test('should apply active state to the ClienteListItem matching the active clienteId URL param', async ({ page }) => {
    // GIVEN: A clienteId is active in the URL
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([CLIENTE_ALPHA, CLIENTE_BETA]),
      })
    );
    await page.route(API_CLIENTE_BY_ID_URL, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CLIENTE_ALPHA) })
    );

    // WHEN: The left panel renders the client list
    await page.goto(`/clientes/${CLIENTE_ALPHA.id}`);

    // THEN: The corresponding ClienteListItem displays in the highlighted/active state
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Alpha SA' })
    ).toHaveAttribute('data-active', 'true');
  });

  test('should NOT apply active state to non-selected list items', async ({ page }) => {
    // GIVEN: A clienteId (ALPHA) is active in the URL
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([CLIENTE_ALPHA, CLIENTE_BETA]),
      })
    );
    await page.route(API_CLIENTE_BY_ID_URL, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CLIENTE_ALPHA) })
    );

    // WHEN: The left panel renders the client list
    await page.goto(`/clientes/${CLIENTE_ALPHA.id}`);

    // THEN: The non-selected item (BETA) does NOT have the active attribute
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Beta Comercial Ltda' })
    ).not.toHaveAttribute('data-active', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC9: Accessibility — ARIA heading and labeled fields
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC9 — Accessibility in detail panel', () => {
  test('should render the client Nombre as an h2 heading in the detail panel', async ({ page }) => {
    // GIVEN: The detail panel is rendered with a client
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([CLIENTE_ALPHA]) })
    );
    await page.route(API_CLIENTE_BY_ID_URL, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CLIENTE_ALPHA) })
    );

    // WHEN: The page is inspected
    await page.goto(`/clientes/${CLIENTE_ALPHA.id}`);

    // THEN: The panel heading is an h2 element with the client's Nombre
    await expect(
      page.getByTestId('cliente-detail-panel').getByRole('heading', { level: 2, name: 'Empresa Alpha SA' })
    ).toBeVisible();
  });

  test('should render field labels (NIT/RUC, Teléfono, Ciudad) visible to screen readers in the detail panel', async ({ page }) => {
    // GIVEN: The detail panel is rendered
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([CLIENTE_ALPHA]) })
    );
    await page.route(API_CLIENTE_BY_ID_URL, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CLIENTE_ALPHA) })
    );

    // WHEN: The page is inspected
    await page.goto(`/clientes/${CLIENTE_ALPHA.id}`);

    // THEN: The visible label "NIT/RUC" is present in the detail panel
    await expect(page.getByTestId('cliente-detail-panel').getByText('NIT/RUC')).toBeVisible();
  });

  test('should render "Teléfono" label visible in the detail panel', async ({ page }) => {
    // GIVEN: The detail panel is rendered with a client
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([CLIENTE_ALPHA]) })
    );
    await page.route(API_CLIENTE_BY_ID_URL, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CLIENTE_ALPHA) })
    );

    // WHEN: The page is inspected
    await page.goto(`/clientes/${CLIENTE_ALPHA.id}`);

    // THEN: The "Teléfono" label is visible in the detail panel
    await expect(page.getByTestId('cliente-detail-panel').getByText('Teléfono')).toBeVisible();
  });

  test('should render "Ciudad" label visible in the detail panel', async ({ page }) => {
    // GIVEN: The detail panel is rendered with a client
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([CLIENTE_ALPHA]) })
    );
    await page.route(API_CLIENTE_BY_ID_URL, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CLIENTE_ALPHA) })
    );

    // WHEN: The page is inspected
    await page.goto(`/clientes/${CLIENTE_ALPHA.id}`);

    // THEN: The "Ciudad" label is visible in the detail panel
    await expect(page.getByTestId('cliente-detail-panel').getByText('Ciudad')).toBeVisible();
  });

  test('should render "—" for null Teléfono field in the detail panel', async ({ page }) => {
    // GIVEN: The client has null Teléfono and Ciudad
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([CLIENTE_BETA]) })
    );
    await page.route(API_CLIENTE_BY_ID_URL, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CLIENTE_BETA) })
    );

    // WHEN: The detail panel renders with null optional fields
    await page.goto(`/clientes/${CLIENTE_BETA.id}`);

    // THEN: Teléfono displays "—" instead of null/empty
    await expect(page.getByTestId('cliente-detail-telefono')).toHaveText('—');
  });

  test('should render "—" for null Ciudad field in the detail panel', async ({ page }) => {
    // GIVEN: The client has null Ciudad
    await page.route(API_CLIENTES_URL, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([CLIENTE_BETA]) })
    );
    await page.route(API_CLIENTE_BY_ID_URL, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CLIENTE_BETA) })
    );

    // WHEN: The detail panel renders with null optional fields
    await page.goto(`/clientes/${CLIENTE_BETA.id}`);

    // THEN: Ciudad displays "—" instead of null/empty
    await expect(page.getByTestId('cliente-detail-ciudad')).toHaveText('—');
  });
});

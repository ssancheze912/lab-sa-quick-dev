import { test, expect } from '../../fixtures/base.fixture';
import { ClientesPage } from '../../pages/clientes.page';

/**
 * ATDD (RED phase) E2E tests for Story 2.1 — Client List & Search.
 *
 * These tests assert the user-facing behaviour of the split-panel
 * `/clientes` view BEFORE implementation lands. Every test uses
 * Playwright's `page.route` to intercept `/api/v1/clientes` BEFORE
 * navigation (network-first pattern) so the suite is self-contained
 * and deterministic — no backend boot or DB seed required.
 *
 * Acceptance Criteria covered:
 *   AC #1 — left panel `<aside data-testid="clientes-list-panel">` (280px) renders one item per record.
 *   AC #2 — search filters client-side by `nombre` OR `nit`, no extra network call.
 *   AC #3 — empty `/api/v1/clientes` response → `clientes-empty-state` panel.
 *   AC #4 — 5xx response → `clientes-error-panel` + `Reintentar` recovers on success.
 *   AC #5 — search with zero matches → `clientes-search-empty` panel, input stays editable.
 *
 * Test IDs map to test-design-epic-2.md P0 set for Story 2.1.
 */

const API_CLIENTES_PATTERN = '**/api/v1/clientes';

/** Three deterministic clientes used for happy-path search tests. */
const SAMPLE_CLIENTES = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    nombre: 'Acme Industrial S.A.S.',
    nit: '900111222-1',
    telefono: '3001112233',
    ciudad: 'Bogotá',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    nombre: 'Comercializadora Andina Ltda.',
    nit: '901222333-2',
    telefono: '3002223344',
    ciudad: 'Medellín',
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    nombre: 'Distribuciones del Pacífico',
    nit: '902333444-3',
    telefono: '3003334455',
    ciudad: 'Cali',
    createdAt: '2026-01-03T00:00:00.000Z',
    updatedAt: '2026-01-03T00:00:00.000Z',
  },
];

test.describe('Story 2.1 — Clientes list & search (P0)', () => {
  let clientesPage: ClientesPage;

  test.beforeEach(async ({ page }) => {
    clientesPage = new ClientesPage(page);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // AC #1 / AC #2 — search by `nombre` (P0)
  // ───────────────────────────────────────────────────────────────────────────
  test('GIVEN three clientes WHEN user searches by nombre "Acme" THEN only the matching item is visible', async ({ page }) => {
    // GIVEN: backend returns three clientes — intercept BEFORE navigation.
    await page.route(API_CLIENTES_PATTERN, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SAMPLE_CLIENTES),
      }),
    );

    // Track requests to the endpoint to assert no extra calls during filtering.
    const requestUrls: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/v1/clientes')) requestUrls.push(req.url());
    });

    // WHEN: user navigates to /clientes and types into the search input
    await clientesPage.goto();
    await expect(clientesPage.listPanel).toBeVisible();
    await expect(clientesPage.clienteItems).toHaveCount(3);

    await clientesPage.buscar('Acme');

    // THEN: only the matching item is rendered.
    await expect(clientesPage.clienteItems).toHaveCount(1);
    await expect(
      clientesPage.clienteItems.filter({ hasText: 'Acme Industrial' }),
    ).toBeVisible();

    // AND: no additional `/api/v1/clientes` requests were fired by typing.
    const callsAfterMount = requestUrls.length;
    expect(callsAfterMount).toBeLessThanOrEqual(1);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // AC #2 — search by `nit` (P0)
  // ───────────────────────────────────────────────────────────────────────────
  test('GIVEN three clientes WHEN user searches by a NIT substring "901222" THEN only the matching item is visible', async ({ page }) => {
    // GIVEN
    await page.route(API_CLIENTES_PATTERN, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SAMPLE_CLIENTES),
      }),
    );

    // WHEN
    await clientesPage.goto();
    await expect(clientesPage.clienteItems).toHaveCount(3);

    await clientesPage.buscar('901222');

    // THEN
    await expect(clientesPage.clienteItems).toHaveCount(1);
    await expect(
      clientesPage.clienteItems.filter({ hasText: 'Comercializadora Andina' }),
    ).toBeVisible();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // AC #3 — empty backend → EmptyState (P0)
  // ───────────────────────────────────────────────────────────────────────────
  test('GIVEN backend returns an empty list WHEN /clientes loads THEN the empty-state panel is shown', async ({ page }) => {
    // GIVEN
    await page.route(API_CLIENTES_PATTERN, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
      }),
    );

    // WHEN
    await clientesPage.goto();

    // THEN
    await expect(clientesPage.emptyStatePanel).toBeVisible();
    await expect(clientesPage.emptyStatePanel).toContainText(/aún no hay clientes/i);
    await expect(clientesPage.clienteItems).toHaveCount(0);
    // Search input MUST stay visible even when there are no clientes.
    await expect(clientesPage.searchInput).toBeVisible();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // AC #4 — 5xx → ErrorPanel + Reintentar recovers (P0)
  // ───────────────────────────────────────────────────────────────────────────
  test('GIVEN GET /clientes returns 500 WHEN ErrorPanel is shown AND user clicks Reintentar AND second call returns 200 THEN list renders', async ({ page }) => {
    // GIVEN: first call fails, second call succeeds.
    let callCount = 0;
    await page.route(API_CLIENTES_PATTERN, async (route) => {
      callCount += 1;
      if (callCount === 1) {
        await route.fulfill({
          status: 500,
          contentType: 'application/problem+json',
          body: JSON.stringify({ status: 500, title: 'Internal Server Error' }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(SAMPLE_CLIENTES),
        });
      }
    });

    // WHEN: navigate → ErrorPanel appears.
    await clientesPage.goto();
    await expect(clientesPage.errorPanel).toBeVisible();
    await expect(clientesPage.errorPanel).toContainText(/no se pudieron cargar los clientes/i);

    // AND: click "Reintentar".
    await clientesPage.btnReintentar.click();

    // THEN: ErrorPanel goes away and the list renders.
    await expect(clientesPage.errorPanel).toBeHidden();
    await expect(clientesPage.clienteItems).toHaveCount(3);
    expect(callCount).toBeGreaterThanOrEqual(2);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // AC #5 — search with zero matches → search-empty panel (P0)
  // ───────────────────────────────────────────────────────────────────────────
  test('GIVEN three clientes WHEN user searches "zzz-no-match" THEN search-empty panel is shown and input remains editable', async ({ page }) => {
    // GIVEN
    await page.route(API_CLIENTES_PATTERN, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SAMPLE_CLIENTES),
      }),
    );

    // WHEN
    await clientesPage.goto();
    await expect(clientesPage.clienteItems).toHaveCount(3);

    await clientesPage.buscar('zzz-no-match');

    // THEN
    await expect(clientesPage.searchEmptyPanel).toBeVisible();
    await expect(clientesPage.searchEmptyPanel).toContainText(/sin resultados/i);
    await expect(clientesPage.clienteItems).toHaveCount(0);

    // Search input stays editable — clearing it restores the list.
    await clientesPage.limpiarBusqueda();
    await expect(clientesPage.clienteItems).toHaveCount(3);
    await expect(clientesPage.searchEmptyPanel).toBeHidden();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // AC #1 — list panel width is exactly 280px (P0 visual contract)
  // ───────────────────────────────────────────────────────────────────────────
  test('GIVEN clientes are loaded WHEN /clientes renders THEN the list panel reports a width of 280px', async ({ page }) => {
    // GIVEN
    await page.route(API_CLIENTES_PATTERN, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SAMPLE_CLIENTES),
      }),
    );

    // WHEN
    await clientesPage.goto();
    await expect(clientesPage.listPanel).toBeVisible();

    // THEN: computed width is 280px (matches `w-[280px]` in ClienteListView).
    const widthPx = await clientesPage.listPanel.evaluate(
      (el) => Math.round(el.getBoundingClientRect().width),
    );
    expect(widthPx).toBe(280);
  });
});

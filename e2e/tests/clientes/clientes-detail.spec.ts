import { test, expect } from '../../fixtures/base.fixture';
import { ClientesPage } from '../../pages/clientes.page';

/**
 * E2E tests for Story 2.2 — Client Detail View.
 *
 * Acceptance Criterion #12 — four P0/P1 scenarios:
 *   - deep-link valid uuid shows detail
 *   - deep-link unknown uuid shows not-found (no console error)
 *   - click on item updates url to /clientes/:id
 *   - browser back navigates between two detail urls
 *
 * Network-first pattern: every test installs `page.route` interceptors BEFORE
 * navigation so the spec is self-contained — no backend or Story 2.3 POST
 * dependency.
 */

const API_LIST_PATTERN = '**/api/v1/clientes';
const API_DETAIL_PATTERN = /\/api\/v1\/clientes\/[a-f0-9-]{36}$/i;

const CLIENTE_1 = {
  id: '00000000-0000-0000-0000-000000000001',
  nombre: 'Acme Industrial S.A.S.',
  nit: '900111222-1',
  telefono: '3001112233',
  ciudad: 'Bogotá',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const CLIENTE_2 = {
  id: '00000000-0000-0000-0000-000000000002',
  nombre: 'Comercializadora Andina Ltda.',
  nit: '901222333-2',
  telefono: '3002223344',
  ciudad: 'Medellín',
  createdAt: '2026-01-02T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

const UNKNOWN_ID = '00000000-0000-0000-0000-000000000000';

test.describe('Story 2.2 — Cliente detail view (P0)', () => {
  let clientesPage: ClientesPage;

  test.beforeEach(async ({ page }) => {
    clientesPage = new ClientesPage(page);

    // List endpoint — always returns the two sample clientes.
    await page.route(API_LIST_PATTERN, (route) => {
      if (route.request().url().match(API_DETAIL_PATTERN)) {
        return route.fallback();
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([CLIENTE_1, CLIENTE_2]),
      });
    });

    // Detail endpoint — returns the matching cliente or 404 Problem Details.
    await page.route(API_DETAIL_PATTERN, (route) => {
      const url = route.request().url();
      if (url.endsWith(CLIENTE_1.id)) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(CLIENTE_1),
        });
      }
      if (url.endsWith(CLIENTE_2.id)) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(CLIENTE_2),
        });
      }
      return route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          status: 404,
          title: 'Cliente no encontrado.',
          type: 'https://tools.ietf.org/html/rfc7231#section-6.5.4',
        }),
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // AC #12.1 — deep-link valid uuid shows detail (P0)
  // ───────────────────────────────────────────────────────────────────────────
  test('GIVEN a known UUID WHEN /clientes/<uuid> is opened directly THEN detail panel shows the four fields', async ({ page }) => {
    await page.goto(`/clientes/${CLIENTE_1.id}`);

    await expect(clientesPage.detailPanel).toBeVisible();
    await expect(clientesPage.detailNombre).toHaveText(CLIENTE_1.nombre);
    await expect(clientesPage.detailNit).toHaveText(CLIENTE_1.nit);
    await expect(clientesPage.detailTelefono).toHaveText(CLIENTE_1.telefono);
    await expect(clientesPage.detailCiudad).toHaveText(CLIENTE_1.ciudad);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // AC #12.2 — deep-link unknown uuid shows not-found, NO console error (P0)
  // ───────────────────────────────────────────────────────────────────────────
  test('GIVEN an unknown UUID WHEN /clientes/<unknown-uuid> is opened directly THEN cliente-not-found is visible and no console error', async ({ page }) => {
    const pageErrors: Error[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(`/clientes/${UNKNOWN_ID}`);

    await expect(clientesPage.detailNotFound).toBeVisible();
    await expect(clientesPage.detailNotFound).toContainText(/cliente no encontrado/i);
    await expect(clientesPage.detailNotFound).toContainText(/el cliente solicitado no existe o fue eliminado/i);
    await expect(clientesPage.btnVolverALaLista).toBeVisible();

    // List panel stays functional on the left.
    await expect(clientesPage.listPanel).toBeVisible();

    // No uncaught exceptions or console errors.
    expect(pageErrors).toHaveLength(0);
    expect(consoleErrors).toHaveLength(0);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // AC #12.3 — click on item updates url to /clientes/:id (P0)
  // ───────────────────────────────────────────────────────────────────────────
  test('GIVEN /clientes is rendered WHEN user clicks the second item THEN URL updates to /clientes/<id> and detail panel renders', async ({ page }) => {
    await clientesPage.goto();

    await expect(clientesPage.clienteItems).toHaveCount(2);

    // Click the second item (Comercializadora Andina).
    await clientesPage.clienteItems.nth(1).click();

    await expect(page).toHaveURL(new RegExp(`/clientes/${CLIENTE_2.id}$`));
    await expect(clientesPage.detailNombre).toHaveText(CLIENTE_2.nombre);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // AC #12.4 — browser back navigates between two detail urls (P1)
  // ───────────────────────────────────────────────────────────────────────────
  test('GIVEN two detail urls are visited WHEN browser back is invoked THEN the first detail url is restored and its item is active', async ({ page }) => {
    await clientesPage.goto();
    await expect(clientesPage.clienteItems).toHaveCount(2);

    // Navigate to the first cliente.
    await clientesPage.clienteItems.nth(0).click();
    await expect(page).toHaveURL(new RegExp(`/clientes/${CLIENTE_1.id}$`));
    await expect(clientesPage.detailNombre).toHaveText(CLIENTE_1.nombre);

    // Navigate to the second cliente.
    await clientesPage.clienteItems.nth(1).click();
    await expect(page).toHaveURL(new RegExp(`/clientes/${CLIENTE_2.id}$`));
    await expect(clientesPage.detailNombre).toHaveText(CLIENTE_2.nombre);

    // Browser back → first cliente again.
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`/clientes/${CLIENTE_1.id}$`));
    await expect(clientesPage.detailNombre).toHaveText(CLIENTE_1.nombre);

    // Active-item indicator moved back to the first item.
    await expect(clientesPage.clienteItems.nth(0)).toHaveAttribute('data-active', 'true');
    await expect(clientesPage.clienteItems.nth(1)).toHaveAttribute('data-active', 'false');
  });
});

import { test, expect } from '../../fixtures/base.fixture';

/**
 * Story 2.1 — ATDD (RED phase).
 *
 * E2E acceptance tests for `/clientes`. Uses `page.route` interception (BEFORE
 * navigation — the network-first pattern) so the tests are hermetic and do
 * not depend on a live backend or a specific DB state.
 *
 * These will FAIL until Story 2.1 implementation is complete:
 *   - ClienteListView renders in the split-panel
 *   - Search input filters in-memory
 *   - EmptyState variants render
 *   - ErrorPanel renders on 500
 *   - Selecting a row updates the URL to /clientes/:id
 *
 * Covered acceptance criteria: #1 #2 #3 #4 #5 #6 #7
 */

const API_BASE = /\/api\/v1\/clientes(\?.*)?$/;

type ClienteDto = {
  id: string;
  nombre: string;
  nit: string;
  telefono: string;
  ciudad: string;
  createdAt: string;
  updatedAt: string;
};

function buildCliente(overrides: Partial<ClienteDto> = {}): ClienteDto {
  const suffix = `${Math.floor(Math.random() * 1_000_000_000)}`.padStart(9, '0');
  const now = new Date().toISOString();
  return {
    id: `00000000-0000-0000-0000-${suffix.padStart(12, '0')}`,
    nombre: `Cliente ${suffix}`,
    nit: `9${suffix}`,
    telefono: `300${suffix.slice(-7)}`,
    ciudad: 'Bogotá',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

test.describe('Story 2.1 — Client List & Search (E2E)', () => {
  test('AC #1 — GIVEN 3 clientes seeded, WHEN /clientes is visited, THEN the split-panel renders 3 items in the 280 px left panel', async ({ page }) => {
    const fixture = [
      buildCliente({ nombre: 'Empresa A', nit: '900000001' }),
      buildCliente({ nombre: 'Empresa B', nit: '900000002' }),
      buildCliente({ nombre: 'Empresa C', nit: '900000003' }),
    ];

    await page.route(API_BASE, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixture) })
    );

    await page.goto('/clientes');

    const aside = page.getByRole('complementary', { name: /lista de clientes/i });
    await expect(aside).toBeVisible();
    await expect(page.getByRole('button', { name: /ver cliente:\s*empresa a/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /ver cliente:\s*empresa b/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /ver cliente:\s*empresa c/i })).toBeVisible();
  });

  test('AC #2 — GIVEN 2 clientes, WHEN searching by nombre, THEN only matching items remain', async ({ page }) => {
    const fixture = [
      buildCliente({ nombre: 'Acosta SAS', nit: '111111111' }),
      buildCliente({ nombre: 'Bermudez LTDA', nit: '222222222' }),
    ];

    await page.route(API_BASE, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixture) })
    );

    await page.goto('/clientes');

    const input = page.getByLabel(/buscar clientes/i);
    await input.fill('aco');

    await expect(page.getByRole('button', { name: /ver cliente:\s*acosta/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /ver cliente:\s*bermudez/i })).toBeHidden();
  });

  test('AC #2 — GIVEN typed keystrokes, THEN NO additional API calls fire (client-side filter only)', async ({ page }) => {
    let calls = 0;
    await page.route(API_BASE, (route) => {
      calls += 1;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([buildCliente({ nombre: 'Empresa Alpha' })]),
      });
    });

    await page.goto('/clientes');
    await expect(page.getByRole('button', { name: /ver cliente:\s*empresa alpha/i })).toBeVisible();

    const input = page.getByLabel(/buscar clientes/i);
    await input.fill('alp');
    await input.fill('alph');
    await input.fill('alpha');

    // Give the debounce a chance to expire.
    await page.waitForTimeout(300);

    expect(calls).toBe(1);
  });

  test('AC #4 — GIVEN backend returns [], THEN the "no-clients" EmptyState renders', async ({ page }) => {
    await page.route(API_BASE, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    await page.goto('/clientes');

    await expect(page.getByText('No hay clientes registrados')).toBeVisible();
    await expect(page.getByText('Crea el primer cliente del sistema')).toBeVisible();
  });

  test('AC #3 — GIVEN a non-matching search, THEN the "search-empty" EmptyState renders', async ({ page }) => {
    const fixture = [buildCliente({ nombre: 'Acosta SAS' })];
    await page.route(API_BASE, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixture) })
    );

    await page.goto('/clientes');
    await page.getByLabel(/buscar clientes/i).fill('zzz-imposible');

    await expect(page.getByText('No se encontró ningún cliente')).toBeVisible();
    await expect(page.getByText('Intenta con otro nombre o NIT')).toBeVisible();
  });

  test('AC #5 — GIVEN backend returns 500, THEN the ErrorPanel with a Reintentar button renders', async ({ page }) => {
    await page.route(API_BASE, (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })
    );

    await page.goto('/clientes');

    await expect(page.getByText('No se pudo cargar la lista de clientes')).toBeVisible();
    await expect(page.getByText('Comprueba tu conexión e intenta nuevamente.')).toBeVisible();
    await expect(page.getByRole('button', { name: /reintentar/i })).toBeVisible();
    // NFR6 — raw error internals never leak to the user
    await expect(page.getByText(/exception|stack/i)).toHaveCount(0);
  });

  test('AC #7 — GIVEN a click on a list item, THEN the URL updates to /clientes/:id', async ({ page }) => {
    const target = buildCliente({ nombre: 'Empresa A', nit: '900000001' });
    await page.route(API_BASE, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([target]) })
    );

    await page.goto('/clientes');
    await page.getByRole('button', { name: /ver cliente:\s*empresa a/i }).click();

    await page.waitForURL(new RegExp(`/clientes/${target.id}$`));
    expect(page.url()).toContain(`/clientes/${target.id}`);
  });

  test('AC #6 — GIVEN a slow backend, WHEN the list first mounts, THEN 6 skeleton items are visible', async ({ page }) => {
    await page.route(API_BASE, async (route) => {
      // Delay the response so the loading state is observable.
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('/clientes');

    const skeletons = page.getByTestId('cliente-skeleton');
    await expect(skeletons).toHaveCount(6);
  });
});

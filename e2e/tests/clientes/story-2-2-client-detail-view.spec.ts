import { test, expect } from '../../fixtures/base.fixture';

/**
 * Story 2.2 — ATDD (RED phase).
 *
 * E2E acceptance tests for `/clientes/:clienteId`. Uses `page.route`
 * interception (BEFORE navigation — the network-first pattern) so the tests
 * are hermetic and do not depend on a live backend.
 *
 * These will FAIL until Story 2.2 implementation is complete:
 *   - ClienteDetailView is wired into `/clientes/:clienteId`
 *   - ClienteNotFound renders on 404 and non-UUID paths
 *   - ErrorPanel renders on non-404 failures with a Reintentar retry
 *   - The list panel keeps working while the detail branch shows edge states
 *
 * Covered acceptance criteria: #1 #2 #3 #4 #5 #6 #7
 */

const LIST_API = /\/api\/v1\/clientes(\?[^/]*)?$/;
const DETAIL_API = /\/api\/v1\/clientes\/[^/?]+$/;

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

test.describe('Story 2.2 — Client Detail View (E2E)', () => {
  test('AC #1 — GIVEN /clientes rendered, WHEN a list item is clicked, THEN URL updates to /clientes/:id AND the detail card shows the four fields', async ({
    page,
  }) => {
    const target = buildCliente({
      nombre: 'Empresa Detalle',
      nit: '900555111',
      telefono: '3005551110',
      ciudad: 'Medellín',
    });

    await page.route(LIST_API, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([target]),
      }),
    );

    await page.route(DETAIL_API, (route) => {
      if (route.request().url().endsWith(`/${target.id}`)) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(target),
        });
      }
      return route.fulfill({ status: 404, contentType: 'application/problem+json', body: '{}' });
    });

    await page.goto('/clientes');
    await page.getByRole('button', { name: /ver cliente:\s*empresa detalle/i }).click();

    await page.waitForURL(new RegExp(`/clientes/${target.id}$`));
    expect(page.url()).toContain(`/clientes/${target.id}`);

    const card = page.getByTestId('cliente-detail');
    await expect(card).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Empresa Detalle' })).toBeVisible();
    await expect(page.getByTestId('detail-nit')).toHaveText('900555111');
    await expect(page.getByTestId('detail-telefono')).toHaveText('3005551110');
    await expect(page.getByTestId('detail-ciudad')).toHaveText('Medellín');

    // AC #1 — Selected row carries data-selected="true".
    await expect(
      page.getByRole('button', { name: /ver cliente:\s*empresa detalle/i }),
    ).toHaveAttribute('data-selected', 'true');
  });

  test('AC #2 — GIVEN /clientes/:id opened directly (deep link), THEN the split panel + detail card render without going through the list first', async ({
    page,
  }) => {
    const target = buildCliente({ nombre: 'Deep Link Co', nit: '900222333' });

    await page.route(LIST_API, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([target]),
      }),
    );
    await page.route(DETAIL_API, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(target),
      }),
    );

    await page.goto(`/clientes/${target.id}`);

    await expect(page.getByRole('complementary', { name: /lista de clientes/i })).toBeVisible();
    await expect(page.getByTestId('cliente-detail')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Deep Link Co' })).toBeVisible();
  });

  test('AC #3 — GIVEN a well-formed UUID that does NOT exist, WHEN the detail query resolves, THEN ClienteNotFound with exact Spanish copy renders', async ({
    page,
  }) => {
    await page.route(LIST_API, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );
    await page.route(DETAIL_API, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          type: 'about:blank',
          title: 'Not Found',
          status: 404,
          instance: '/api/v1/clientes/xxx',
        }),
      }),
    );

    await page.goto('/clientes/00000000-0000-0000-0000-000000000000');

    const status = page.getByRole('status');
    await expect(status).toBeVisible();
    await expect(status).toHaveAttribute('aria-live', 'polite');
    await expect(page.getByText('Cliente no encontrado')).toBeVisible();
    await expect(page.getByText('El cliente que buscas no existe o fue eliminado.')).toBeVisible();
    await expect(page.getByRole('button', { name: /volver a la lista/i })).toBeVisible();
  });

  test('AC #3 — GIVEN ClienteNotFound is visible, WHEN "Volver a la lista" is clicked, THEN URL updates to /clientes', async ({
    page,
  }) => {
    await page.route(LIST_API, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );
    await page.route(DETAIL_API, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({ title: 'Not Found', status: 404 }),
      }),
    );

    await page.goto('/clientes/00000000-0000-0000-0000-000000000000');
    await page.getByRole('button', { name: /volver a la lista/i }).click();

    await page.waitForURL(/\/clientes$/);
    expect(page.url()).toMatch(/\/clientes$/);
  });

  test('AC #4 — GIVEN /clientes/:clienteId with a non-UUID segment, THEN ClienteNotFound renders AND NO request is fired against the detail endpoint', async ({
    page,
  }) => {
    let detailCalls = 0;

    await page.route(LIST_API, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );
    await page.route(DETAIL_API, (route) => {
      detailCalls += 1;
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.goto('/clientes/abc123');

    await expect(page.getByRole('status')).toBeVisible();
    await expect(page.getByText('Cliente no encontrado')).toBeVisible();

    // Give any accidental fetch a chance to fire.
    await page.waitForTimeout(300);
    expect(detailCalls).toBe(0);

    // List panel remains interactive (aside visible).
    await expect(page.getByRole('complementary', { name: /lista de clientes/i })).toBeVisible();
  });

  test('AC #5 — GIVEN the detail query is in flight, THEN four skeleton placeholders are visible on aria-busy="true" container', async ({
    page,
  }) => {
    const target = buildCliente({ nombre: 'Loading Co' });

    await page.route(LIST_API, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([target]) }),
    );
    await page.route(DETAIL_API, async (route) => {
      // Delay so the loading state is observable.
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(target),
      });
    });

    await page.goto(`/clientes/${target.id}`);

    const skeleton = page.getByTestId('cliente-detail-skeleton');
    await expect(skeleton).toBeVisible();
    await expect(skeleton).toHaveAttribute('aria-busy', 'true');
  });

  test('AC #6 — GIVEN backend returns 500, THEN ErrorPanel renders with the exact Spanish copy and a Reintentar button (no raw error leaks — NFR6)', async ({
    page,
  }) => {
    await page.route(LIST_API, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );
    await page.route(DETAIL_API, (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }),
    );

    await page.goto('/clientes/a3d81b62-9c9d-4a3d-9c8e-2b1f4d1a0e77');

    await expect(page.getByText('No se pudo cargar el cliente')).toBeVisible();
    await expect(page.getByText('Comprueba tu conexión e intenta nuevamente.')).toBeVisible();
    await expect(page.getByRole('button', { name: /reintentar/i })).toBeVisible();
    // NFR6 — raw internals never leak.
    await expect(page.getByText(/exception|stack/i)).toHaveCount(0);
  });

  test('AC #7 — GIVEN /clientes/:A open, WHEN a different list item :B is clicked, THEN URL updates to :B AND detail card re-renders with B\'s data', async ({
    page,
  }) => {
    const a = buildCliente({
      id: '11111111-1111-1111-1111-111111111111',
      nombre: 'Empresa A',
      nit: '900000001',
    });
    const b = buildCliente({
      id: '22222222-2222-2222-2222-222222222222',
      nombre: 'Empresa B',
      nit: '900000002',
    });

    await page.route(LIST_API, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([a, b]),
      }),
    );
    await page.route(DETAIL_API, (route) => {
      if (route.request().url().endsWith(`/${a.id}`)) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(a),
        });
      }
      if (route.request().url().endsWith(`/${b.id}`)) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(b),
        });
      }
      return route.fulfill({ status: 404, contentType: 'application/problem+json', body: '{}' });
    });

    await page.goto(`/clientes/${a.id}`);
    await expect(page.getByRole('heading', { name: 'Empresa A' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: /ver cliente:\s*empresa a/i }),
    ).toHaveAttribute('data-selected', 'true');

    await page.getByRole('button', { name: /ver cliente:\s*empresa b/i }).click();

    await page.waitForURL(new RegExp(`/clientes/${b.id}$`));
    await expect(page.getByRole('heading', { name: 'Empresa B' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: /ver cliente:\s*empresa b/i }),
    ).toHaveAttribute('data-selected', 'true');
    await expect(
      page.getByRole('button', { name: /ver cliente:\s*empresa a/i }),
    ).toHaveAttribute('data-selected', 'false');
  });
});

import { test, expect } from '../../fixtures/base.fixture';

/**
 * Story 2.4 — ATDD (RED phase).
 *
 * E2E acceptance tests for the `Editar cliente` flow. Uses `page.route`
 * interception (BEFORE navigation — the network-first pattern) so the tests
 * are hermetic and do not depend on a live backend.
 *
 * Scenarios (all P0):
 *   - AC #1 / #2 (R-011): open detail view → click "Editar" → change Nombre →
 *     submit → assert the detail card shows the new Nombre AND the list row
 *     shows the new Nombre (both without a page reload); assert the success
 *     toast contains "Cliente actualizado correctamente".
 *   - AC #5 (R-002): submit with a NIT that returns 409 → assert the inline
 *     NIT error is exactly "El NIT/RUC ya está registrado"; no toast; dialog
 *     stays open.
 *   - AC #5 / NFR6 (R-001): assert the 409 response body preview does NOT
 *     contain the strings "stackTrace", "exception", "SqlException",
 *     "NpgsqlException" anywhere in the visible DOM.
 *
 * RED until Story 2.4 wires:
 *   - The "Editar" button in ClienteDetailCard header.
 *   - ClienteEditDialog mounts and hosts the reusable ClienteForm.
 *   - useUpdateCliente invalidates ['clientes'] AND ['clientes', id] and fires
 *     the Spanish toast.
 */

const LIST_API = /\/api\/v1\/clientes(\?[^/]*)?$/;
const DETAIL_API = /\/api\/v1\/clientes\/[0-9a-f-]{36}$/i;

type ClienteDto = {
  id: string;
  nombre: string;
  nit: string;
  telefono: string;
  ciudad: string;
  createdAt: string;
  updatedAt: string;
};

const TARGET_ID = '11111111-1111-1111-1111-111111111111';

function buildCliente(overrides: Partial<ClienteDto> = {}): ClienteDto {
  const now = new Date().toISOString();
  return {
    id: TARGET_ID,
    nombre: 'Original Nombre',
    nit: '900111000',
    telefono: '3001110000',
    ciudad: 'Bogotá',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

test.describe('Story 2.4 — Edit Client (E2E)', () => {
  test('AC #1 / #2 (R-011) — GIVEN /clientes/:id, WHEN Nombre is edited and backend returns 200, THEN detail card AND list row show the new Nombre AND success toast displays exact Spanish copy', async ({
    page,
  }) => {
    const initial = buildCliente({ nombre: 'Original Nombre' });
    const updated: ClienteDto = { ...initial, nombre: 'Renamed Corp' };

    let listCalls = 0;
    let detailCalls = 0;

    // Intercept BEFORE navigation (network-first pattern).
    await page.route(LIST_API, async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        listCalls += 1;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(listCalls === 1 ? [initial] : [updated]),
        });
      }
      return route.continue();
    });

    await page.route(DETAIL_API, async (route) => {
      const method = route.request().method();
      if (method === 'PUT') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(updated),
        });
      }
      if (method === 'GET') {
        detailCalls += 1;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(detailCalls === 1 ? initial : updated),
        });
      }
      return route.continue();
    });

    // Deep-link into the detail view.
    await page.goto(`/clientes/${TARGET_ID}`);

    // Detail card renders with the original Nombre.
    await expect(page.getByRole('heading', { name: 'Original Nombre' })).toBeVisible();

    // Click "Editar" to open the dialog.
    await page.getByRole('button', { name: /editar cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Editar cliente')).toBeVisible();

    // Inputs pre-filled with the current values.
    await expect(page.getByLabel(/^Nombre$/)).toHaveValue('Original Nombre');
    await expect(page.getByLabel(/NIT\/RUC/)).toHaveValue('900111000');

    // Edit Nombre and submit.
    await page.getByLabel(/^Nombre$/).fill('Renamed Corp');
    await page.getByRole('button', { name: /^guardar$/i }).click();

    // Dialog closes.
    await expect(page.getByRole('dialog')).toHaveCount(0);

    // Detail card shows the new Nombre (invalidation-driven refetch).
    await expect(page.getByRole('heading', { name: 'Renamed Corp' })).toBeVisible();

    // List row shows the new Nombre — no page reload.
    await expect(page.getByRole('button', { name: /ver cliente:\s*renamed corp/i })).toBeVisible();

    // Success toast — exact Spanish copy.
    await expect(page.getByText('Cliente actualizado correctamente')).toBeVisible();
  });

  test('AC #5 (R-002) — GIVEN duplicate NIT returns 409, THEN inline NIT error surfaces AND dialog stays open AND toast does NOT fire', async ({
    page,
  }) => {
    const initial = buildCliente({ nombre: 'Original Nombre' });

    await page.route(LIST_API, async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([initial]),
        });
      }
      return route.continue();
    });

    await page.route(DETAIL_API, async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(initial),
        });
      }
      if (method === 'PUT') {
        return route.fulfill({
          status: 409,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            type: 'https://tools.ietf.org/html/rfc7231#section-6.5.8',
            title: 'Conflict',
            status: 409,
            detail: 'El NIT/RUC ya está registrado',
          }),
        });
      }
      return route.continue();
    });

    await page.goto(`/clientes/${TARGET_ID}`);
    await expect(page.getByRole('heading', { name: 'Original Nombre' })).toBeVisible();

    await page.getByRole('button', { name: /editar cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Trigger a change so the submit fires the PUT.
    await page.getByLabel(/NIT\/RUC/).fill('900999888');
    await page.getByRole('button', { name: /^guardar$/i }).click();

    // Inline NIT error appears.
    await expect(page.getByText('El NIT/RUC ya está registrado')).toBeVisible();

    // Dialog stays open.
    await expect(page.getByRole('dialog')).toBeVisible();

    // Toast NOT visible.
    await expect(page.getByText('Cliente actualizado correctamente')).toHaveCount(0);
  });

  test('AC #5 / NFR6 (R-001) — GIVEN 409 response body, THEN raw internals are NEVER leaked to the DOM', async ({
    page,
  }) => {
    const initial = buildCliente({ nombre: 'Original Nombre' });

    await page.route(LIST_API, async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([initial]),
        });
      }
      return route.continue();
    });

    await page.route(DETAIL_API, async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(initial),
        });
      }
      if (method === 'PUT') {
        return route.fulfill({
          status: 409,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            type: 'https://tools.ietf.org/html/rfc7231#section-6.5.8',
            title: 'Conflict',
            status: 409,
            detail: 'El NIT/RUC ya está registrado',
          }),
        });
      }
      return route.continue();
    });

    await page.goto(`/clientes/${TARGET_ID}`);
    await page.getByRole('button', { name: /editar cliente/i }).click();

    await page.getByLabel(/NIT\/RUC/).fill('900999888');
    await page.getByRole('button', { name: /^guardar$/i }).click();

    await expect(page.getByText('El NIT/RUC ya está registrado')).toBeVisible();

    // NFR6 anti-leak — none of these strings must ever appear in the DOM.
    for (const sentinel of ['stackTrace', 'SqlException', 'NpgsqlException']) {
      await expect(page.getByText(new RegExp(sentinel, 'i'))).toHaveCount(0);
    }
    // The word "exception" must not leak — the visible copy uses "El NIT/RUC…" only.
    await expect(page.getByText(/exception/i)).toHaveCount(0);
  });

  test('AC #7 — GIVEN 404 on submit (row deleted by another user), THEN top-of-form alert "El cliente ya no existe" appears AND dialog stays open', async ({
    page,
  }) => {
    const initial = buildCliente({ nombre: 'Original Nombre' });

    await page.route(LIST_API, async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([initial]),
        });
      }
      return route.continue();
    });

    await page.route(DETAIL_API, async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(initial),
        });
      }
      if (method === 'PUT') {
        return route.fulfill({
          status: 404,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            type: 'https://tools.ietf.org/html/rfc7231#section-6.5.4',
            title: 'Not Found',
            status: 404,
          }),
        });
      }
      return route.continue();
    });

    await page.goto(`/clientes/${TARGET_ID}`);
    await page.getByRole('button', { name: /editar cliente/i }).click();

    await page.getByLabel(/^Nombre$/).fill('Anything');
    await page.getByRole('button', { name: /^guardar$/i }).click();

    await expect(page.getByText('El cliente ya no existe')).toBeVisible();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Cliente actualizado correctamente')).toHaveCount(0);
  });
});

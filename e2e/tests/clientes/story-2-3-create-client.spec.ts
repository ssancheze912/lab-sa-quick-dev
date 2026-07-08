import { test, expect } from '../../fixtures/base.fixture';

/**
 * Story 2.3 — ATDD (RED phase).
 *
 * E2E acceptance tests for the `Nuevo cliente` flow. Uses `page.route`
 * interception (BEFORE navigation — the network-first pattern) so the tests
 * are hermetic and do not depend on a live backend.
 *
 * Scenarios (all P0):
 *   - AC #1 / #2 (R-011): open dialog → fill 4 fields → 201 → new row appears
 *     in the list WITHOUT reload; success toast displays exact Spanish copy.
 *   - AC #4 (R-002): duplicate NIT returns 409 → inline NIT error surfaces
 *     with the exact Spanish copy; dialog stays open; toast does NOT fire.
 *   - AC #7 / NFR6 (R-001): the 409 body is NOT leaked to the DOM (no
 *     `stackTrace`, `exception`, `SqlException`, `NpgsqlException` strings).
 *   - AC #3: empty-field submit renders four Spanish inline errors AND no POST
 *     request is fired (the Zod resolver short-circuits the mutation).
 *
 * RED until Story 2.3 wires:
 *   - The `Nuevo cliente` button is enabled on `ClienteListView`.
 *   - `ClienteFormDialog` mounts and hosts the form.
 *   - `useCreateCliente` invalidates ['clientes'] and fires the Spanish toast.
 */

const LIST_API = /\/api\/v1\/clientes(\?[^/]*)?$/;
const CREATE_API_METHOD = 'POST';

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

test.describe('Story 2.3 — Create Client (E2E)', () => {
  test('AC #1 / #2 (R-011) — GIVEN /clientes, WHEN 4 fields submitted and backend returns 201, THEN new row appears without reload AND success toast displays exact Spanish copy', async ({
    page,
  }) => {
    const initial = buildCliente({ nombre: 'Existing Corp' });
    const created = buildCliente({
      id: '99999999-9999-9999-9999-999999999999',
      nombre: 'Acme SAS',
      nit: '900123456',
      telefono: '3001234567',
      ciudad: 'Cali',
    });

    let listCalls = 0;
    await page.route(LIST_API, async (route) => {
      const method = route.request().method();
      if (method === CREATE_API_METHOD) {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          headers: { Location: `/api/v1/clientes/${created.id}` },
          body: JSON.stringify(created),
        });
      }
      listCalls += 1;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(listCalls === 1 ? [initial] : [created, initial]),
      });
    });

    await page.goto('/clientes');
    await expect(page.getByRole('button', { name: /ver cliente:\s*existing corp/i })).toBeVisible();

    // Open dialog.
    await page.getByRole('button', { name: /nuevo cliente/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Nuevo cliente')).toBeVisible();

    // Fill and submit.
    await page.getByLabel(/^Nombre$/).fill('Acme SAS');
    await page.getByLabel(/NIT\/RUC/).fill('900123456');
    await page.getByLabel(/Teléfono/).fill('3001234567');
    await page.getByLabel(/Ciudad/).fill('Cali');

    await page.getByRole('button', { name: /^guardar$/i }).click();

    // Dialog closes.
    await expect(page.getByRole('dialog')).toHaveCount(0);

    // New row appears in the list without reload.
    await expect(page.getByRole('button', { name: /ver cliente:\s*acme sas/i })).toBeVisible();

    // Success toast — exact Spanish copy.
    await expect(page.getByText('Cliente creado correctamente')).toBeVisible();
  });

  test('AC #4 (R-002) — GIVEN duplicate NIT causes 409, THEN inline NIT error surfaces AND dialog stays open AND toast does NOT fire', async ({
    page,
  }) => {
    const initial = buildCliente({ nombre: 'Existing Corp' });

    await page.route(LIST_API, async (route) => {
      const method = route.request().method();
      if (method === CREATE_API_METHOD) {
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
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([initial]),
      });
    });

    await page.goto('/clientes');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();

    await page.getByLabel(/^Nombre$/).fill('Acme SAS');
    await page.getByLabel(/NIT\/RUC/).fill('900123456');
    await page.getByLabel(/Teléfono/).fill('3001234567');
    await page.getByLabel(/Ciudad/).fill('Cali');

    await page.getByRole('button', { name: /^guardar$/i }).click();

    // Inline NIT error appears.
    await expect(page.getByText('El NIT/RUC ya está registrado')).toBeVisible();

    // Dialog stays open.
    await expect(page.getByRole('dialog')).toBeVisible();

    // Toast NOT visible.
    await expect(page.getByText('Cliente creado correctamente')).toHaveCount(0);
  });

  test('AC #7 / NFR6 (R-001) — GIVEN 409 response body, THEN raw internals are NEVER leaked to the DOM', async ({
    page,
  }) => {
    await page.route(LIST_API, async (route) => {
      const method = route.request().method();
      if (method === CREATE_API_METHOD) {
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
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
      });
    });

    await page.goto('/clientes');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();

    await page.getByLabel(/^Nombre$/).fill('Acme SAS');
    await page.getByLabel(/NIT\/RUC/).fill('900123456');
    await page.getByLabel(/Teléfono/).fill('3001234567');
    await page.getByLabel(/Ciudad/).fill('Cali');
    await page.getByRole('button', { name: /^guardar$/i }).click();

    await expect(page.getByText('El NIT/RUC ya está registrado')).toBeVisible();

    // NFR6 anti-leak — none of the following strings must ever appear in the DOM.
    for (const sentinel of ['stackTrace', 'SqlException', 'NpgsqlException']) {
      await expect(page.getByText(new RegExp(sentinel, 'i'))).toHaveCount(0);
    }
    // The word "exception" must not leak — the visible copy uses "El NIT/RUC…" only.
    await expect(page.getByText(/exception/i)).toHaveCount(0);
  });

  test('AC #3 — GIVEN empty form, WHEN Guardar is clicked, THEN four Spanish inline errors render AND NO POST request is fired', async ({
    page,
  }) => {
    let postCalls = 0;

    await page.route(LIST_API, async (route) => {
      const method = route.request().method();
      if (method === CREATE_API_METHOD) {
        postCalls += 1;
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: '{}',
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
      });
    });

    await page.goto('/clientes');
    await page.getByRole('button', { name: /nuevo cliente/i }).click();

    await page.getByRole('button', { name: /^guardar$/i }).click();

    await expect(page.getByText('El nombre es obligatorio')).toBeVisible();
    await expect(page.getByText('El NIT/RUC es obligatorio')).toBeVisible();
    await expect(page.getByText('El teléfono es obligatorio')).toBeVisible();
    await expect(page.getByText('La ciudad es obligatoria')).toBeVisible();

    // Give any accidental fetch a chance to fire.
    await page.waitForTimeout(200);
    expect(postCalls).toBe(0);
  });
});

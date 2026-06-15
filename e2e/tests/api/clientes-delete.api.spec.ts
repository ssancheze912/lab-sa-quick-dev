import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

/**
 * Story 2.5 — API-level tests for DELETE /api/v1/clientes/{id}. Five scenarios
 * (AC #13 API contract block):
 *   1. Valid id → 204 + empty body + X-Contactos-Orphaned header NOT present
 *   2. Unknown id → 404 Problem Details (Spanish title, no stack trace)
 *   3. Non-uuid → 400 Problem Details (Spanish title, no stack trace)
 *   4. DELETE then GET same id → 404
 *   5. DELETE twice → 204 then 404
 */
test.describe('DELETE /api/v1/clientes/{id} — Story 2.5 API contract', () => {
  let apiHelper: ApiHelper;
  const createdIds: string[] = [];

  test.beforeEach(({ request }) => {
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  test('valid id → 204 with no body and no X-Contactos-Orphaned header', async ({
    request,
  }) => {
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    // Do NOT push to createdIds — we are about to delete it ourselves.

    const response = await request.delete(
      `${API_BASE_URL}/api/v1/clientes/${cliente.id}`,
    );

    expect(response.status()).toBe(204);
    const body = await response.text();
    expect(body).toBe('');

    // Header must NOT be present in Story 2.5 (no contactos table yet).
    const headers = response.headers();
    expect(headers['x-contactos-orphaned']).toBeUndefined();
  });

  test('unknown id → 404 Problem Details with Spanish title and no stack trace', async ({
    request,
  }) => {
    const randomId = '00000000-0000-0000-0000-000000000999';
    const response = await request.delete(
      `${API_BASE_URL}/api/v1/clientes/${randomId}`,
    );

    expect(response.status()).toBe(404);
    expect(response.headers()['content-type']).toContain('application/problem+json');

    const body = await response.json();
    expect(body.title).toBe('Cliente no encontrado.');
    expect(body.instance).toBe(`/api/v1/clientes/${randomId}`);

    // NFR6 — no stack trace / internal type leakage.
    expect(body.stackTrace).toBeUndefined();
    expect(body.exception).toBeUndefined();
  });

  test('non-uuid → 400 Problem Details with Spanish title', async ({ request }) => {
    const response = await request.delete(
      `${API_BASE_URL}/api/v1/clientes/not-a-guid`,
    );

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/problem+json');

    const body = await response.json();
    expect(body.title).toBe('Identificador de cliente inválido.');
    expect(body.detail).toBe('El identificador debe ser un UUID válido.');

    expect(body.stackTrace).toBeUndefined();
    expect(body.exception).toBeUndefined();
  });

  test('DELETE then GET same id → 404', async ({ request }) => {
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);

    const deleteResponse = await request.delete(
      `${API_BASE_URL}/api/v1/clientes/${cliente.id}`,
    );
    expect(deleteResponse.status()).toBe(204);

    const getResponse = await request.get(
      `${API_BASE_URL}/api/v1/clientes/${cliente.id}`,
    );
    expect(getResponse.status()).toBe(404);

    const body = await getResponse.json();
    expect(body.title).toBe('Cliente no encontrado.');
  });

  test('DELETE twice → first 204, second 404 (REST-semantic idempotency)', async ({
    request,
  }) => {
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);

    const first = await request.delete(
      `${API_BASE_URL}/api/v1/clientes/${cliente.id}`,
    );
    expect(first.status()).toBe(204);

    const second = await request.delete(
      `${API_BASE_URL}/api/v1/clientes/${cliente.id}`,
    );
    expect(second.status()).toBe(404);

    const body = await second.json();
    expect(body.title).toBe('Cliente no encontrado.');
  });
});

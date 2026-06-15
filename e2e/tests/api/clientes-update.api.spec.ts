import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

/**
 * Story 2.4 — API-level tests for PUT /api/v1/clientes/{id}. R-003 mitigation
 * (server-side NIT uniqueness contract). Five scenarios:
 *   1. Valid payload → 200 + updated body
 *   2. Unchanged NIT → 200 (AC #8 regression)
 *   3. Duplicate NIT from another cliente → 409 + Spanish title
 *   4. Unknown id → 404 + Spanish title
 *   5. Missing nombre → 400 + errors.nombre
 */
test.describe('PUT /api/v1/clientes/{id} — Story 2.4 API contract', () => {
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

  test('valid payload → 200 with updated body', async ({ request }) => {
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    const updated = {
      nombre: `${data.nombre} V2`,
      nit: data.nit,
      telefono: data.telefono,
      ciudad: 'Medellín',
    };

    const response = await request.put(
      `${API_BASE_URL}/api/v1/clientes/${cliente.id}`,
      { data: updated },
    );
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.nombre).toBe(updated.nombre);
    expect(body.ciudad).toBe('Medellín');
    expect(body.id).toBe(cliente.id);
  });

  test('unchanged NIT → 200 (AC #8 regression)', async ({ request }) => {
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    const response = await request.put(
      `${API_BASE_URL}/api/v1/clientes/${cliente.id}`,
      {
        data: {
          nombre: data.nombre,
          nit: data.nit, // unchanged
          telefono: data.telefono,
          ciudad: data.ciudad,
        },
      },
    );
    expect(response.status()).toBe(200);
  });

  test('duplicate NIT from another cliente → 409 + Spanish title', async ({
    request,
  }) => {
    const dataA = buildCliente();
    const dataB = buildCliente();
    const a = await apiHelper.createCliente(dataA);
    const b = await apiHelper.createCliente(dataB);
    createdIds.push(a.id, b.id);

    const response = await request.put(
      `${API_BASE_URL}/api/v1/clientes/${b.id}`,
      {
        data: {
          nombre: dataB.nombre,
          nit: dataA.nit, // duplicate of A
          telefono: dataB.telefono,
          ciudad: dataB.ciudad,
        },
      },
    );
    expect(response.status()).toBe(409);
    expect(response.headers()['content-type']).toContain('application/problem+json');

    const body = await response.json();
    expect(body.title).toBe('El NIT/RUC ya está registrado.');
  });

  test('unknown id → 404 + Spanish title', async ({ request }) => {
    const randomId = '00000000-0000-0000-0000-000000000999';
    const response = await request.put(
      `${API_BASE_URL}/api/v1/clientes/${randomId}`,
      {
        data: {
          nombre: 'Cualquiera',
          nit: '999999999-0',
          telefono: null,
          ciudad: null,
        },
      },
    );
    expect(response.status()).toBe(404);

    const body = await response.json();
    expect(body.title).toBe('Cliente no encontrado.');
  });

  test('missing nombre → 400 + errors.nombre', async ({ request }) => {
    const data = buildCliente();
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    const response = await request.put(
      `${API_BASE_URL}/api/v1/clientes/${cliente.id}`,
      {
        data: {
          nit: data.nit,
          telefono: data.telefono,
          ciudad: data.ciudad,
        },
      },
    );
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.errors).toBeDefined();
    // FluentValidation emits PascalCase property names; the keys may also be
    // camelCased by Results.ValidationProblem — accept either.
    const errorKeys = Object.keys(body.errors);
    expect(
      errorKeys.includes('Nombre') || errorKeys.includes('nombre'),
    ).toBe(true);
  });
});

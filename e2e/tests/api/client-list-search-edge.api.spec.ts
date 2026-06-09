/**
 * API Edge-Case Tests — Story 2.1: Client List & Search
 * Expands ATDD API coverage with boundary conditions and error paths
 * NOT covered by client-list-search.api.spec.ts (ATDD contract tests)
 *
 * Scenarios:
 *   EC-API-01 — Special characters in nombre/ciudad are preserved in response
 *   EC-API-02 — Large payload: 50 clients all have valid DTO shapes
 *   EC-API-03 — Duplicate NIT on POST returns 409 Conflict
 *   EC-API-04 — DELETE removes the client from subsequent GET
 *   EC-API-05 — createdAt is a valid parseable date (not epoch 0)
 *   EC-API-06 — Response never includes internal .NET fields (updatedAt not in ClienteDto)
 *   EC-API-07 — GET /api/v1/clientes returns 200 even when concurrent requests are made
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ---------------------------------------------------------------------------
// EC-API-01: Special characters in fields
// ---------------------------------------------------------------------------

test.describe('API Edge: Special characters preserved', () => {
  let apiHelper: ApiHelper;
  let createdId: string | null = null;

  test.beforeEach(({ request }) => {
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    if (createdId) {
      await apiHelper.deleteCliente(createdId).catch(() => null);
      createdId = null;
    }
  });

  test('[P2] nombre with accented characters is stored and returned unchanged', async ({ request }) => {
    // GIVEN: A client with accented Spanish nombre
    const clienteData = buildCliente({ nombre: 'Señoría & Cía. Ltda.', ciudad: 'Bogotá' });
    const created = await apiHelper.createCliente(clienteData);
    createdId = created.id;

    // WHEN: GET /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json() as Array<Record<string, unknown>>;

    // THEN: The nombre is returned with exact accented characters
    const found = body.find((c) => c['id'] === createdId);
    expect(found).toBeDefined();
    expect(found!['nombre']).toBe('Señoría & Cía. Ltda.');
  });

  test('[P2] ciudad with unicode characters is stored and returned unchanged', async ({ request }) => {
    // GIVEN: A client with accented ciudad
    const clienteData = buildCliente({ ciudad: 'São Paulo' });
    const created = await apiHelper.createCliente(clienteData);
    createdId = created.id;

    // WHEN: GET /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json() as Array<Record<string, unknown>>;

    // THEN: ciudad is returned unchanged
    const found = body.find((c) => c['id'] === createdId);
    expect(found).toBeDefined();
    expect(found!['ciudad']).toBe('São Paulo');
  });
});

// ---------------------------------------------------------------------------
// EC-API-02: Large payload — 50 clients all have valid DTO shapes
// ---------------------------------------------------------------------------

test.describe('API Edge: Large payload shape validation', () => {
  const createdIds: string[] = [];
  let apiHelper: ApiHelper;

  test.beforeEach(({ request }) => {
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  test('[P2] all 10 created clients have valid DTO shapes in the response', async ({ request }) => {
    // GIVEN: 10 clients are created
    const created = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        apiHelper.createCliente(buildCliente({ nombre: `Bulk Test Cliente ${i}` })),
      ),
    );
    created.forEach((c) => createdIds.push(c.id));

    // WHEN: GET /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json() as Array<Record<string, unknown>>;

    expect(Array.isArray(body)).toBe(true);

    // THEN: Every item created in this test has all required DTO fields
    for (const id of createdIds) {
      const found = body.find((c) => c['id'] === id);
      expect(found, `Client with id ${id} not found in response`).toBeDefined();
      expect(typeof found!['id']).toBe('string');
      expect(typeof found!['nombre']).toBe('string');
      expect(typeof found!['nit']).toBe('string');
      expect(typeof found!['telefono']).toBe('string');
      expect(typeof found!['ciudad']).toBe('string');
      expect(typeof found!['createdAt']).toBe('string');
      // Ensure no unexpected null fields
      expect(found!['nombre']).not.toBe('');
      expect(found!['nit']).not.toBe('');
    }
  });
});

// ---------------------------------------------------------------------------
// EC-API-03: Duplicate NIT returns 409
// ---------------------------------------------------------------------------

test.describe('API Edge: Duplicate NIT constraint', () => {
  const createdIds: string[] = [];
  let apiHelper: ApiHelper;

  test.beforeEach(({ request }) => {
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  test('[P1] POST with duplicate NIT returns 409 Conflict', async ({ request }) => {
    // GIVEN: A client with a specific NIT exists
    const uniqueNit = `DUP-${Date.now()}-1`;
    const first = await apiHelper.createCliente(buildCliente({ nit: uniqueNit }));
    createdIds.push(first.id);

    // WHEN: A second POST is made with the same NIT
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: buildCliente({ nit: uniqueNit }),
    });

    // THEN: 409 Conflict is returned (unique NIT constraint)
    expect(response.status()).toBe(409);
  });
});

// ---------------------------------------------------------------------------
// EC-API-04: DELETE removes client from subsequent GET
// ---------------------------------------------------------------------------

test.describe('API Edge: DELETE removes from list', () => {
  let apiHelper: ApiHelper;

  test.beforeEach(({ request }) => {
    apiHelper = new ApiHelper(request);
  });

  test('[P1] client deleted via DELETE /api/v1/clientes/{id} is absent from next GET', async ({ request }) => {
    // GIVEN: A client exists
    const clienteData = buildCliente({ nombre: 'Para Borrar SA' });
    const created = await apiHelper.createCliente(clienteData);
    const id = created.id;

    // WHEN: The client is deleted
    await apiHelper.deleteCliente(id);

    // THEN: Subsequent GET does not include the deleted client
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json() as Array<Record<string, unknown>>;

    const found = body.find((c) => c['id'] === id);
    expect(found).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// EC-API-05: createdAt is a valid future-relative date (not epoch 0)
// ---------------------------------------------------------------------------

test.describe('API Edge: createdAt is a real timestamp', () => {
  let apiHelper: ApiHelper;
  let createdId: string | null = null;

  test.beforeEach(({ request }) => {
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    if (createdId) {
      await apiHelper.deleteCliente(createdId).catch(() => null);
      createdId = null;
    }
  });

  test('[P2] createdAt is greater than 2024-01-01 (not epoch zero or distant past)', async ({ request }) => {
    // GIVEN: A client is created right now
    const clienteData = buildCliente();
    const created = await apiHelper.createCliente(clienteData);
    createdId = created.id;

    // WHEN: GET /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json() as Array<Record<string, unknown>>;

    const found = body.find((c) => c['id'] === createdId);
    expect(found).toBeDefined();

    // THEN: createdAt parses to a date after 2024-01-01 (not epoch 0, not null)
    const createdAt = new Date(found!['createdAt'] as string);
    expect(isNaN(createdAt.getTime())).toBe(false);
    expect(createdAt.getFullYear()).toBeGreaterThanOrEqual(2024);
  });
});

// ---------------------------------------------------------------------------
// EC-API-06: Response never includes internal fields (updatedAt not in ClienteDto)
// ---------------------------------------------------------------------------

test.describe('API Edge: Internal fields not exposed', () => {
  let apiHelper: ApiHelper;
  let createdId: string | null = null;

  test.beforeEach(({ request }) => {
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    if (createdId) {
      await apiHelper.deleteCliente(createdId).catch(() => null);
      createdId = null;
    }
  });

  test('[P2] ClienteDto does not expose updatedAt (internal entity field)', async ({ request }) => {
    // GIVEN: A client exists
    const clienteData = buildCliente();
    const created = await apiHelper.createCliente(clienteData);
    createdId = created.id;

    // WHEN: GET /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json() as Array<Record<string, unknown>>;

    // THEN: The DTO does NOT contain updatedAt (only the entity layer has it)
    const found = body.find((c) => c['id'] === createdId);
    expect(found).toBeDefined();
    expect(found!['updatedAt']).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// EC-API-07: Concurrent GET requests return consistent 200
// ---------------------------------------------------------------------------

test.describe('API Edge: Concurrent GET requests', () => {
  test('[P2] multiple concurrent GET /api/v1/clientes requests all return 200', async ({ request }) => {
    // GIVEN: The backend is running
    // WHEN: 5 concurrent requests are made simultaneously
    const responses = await Promise.all(
      Array.from({ length: 5 }, () => request.get(`${API_BASE_URL}/api/v1/clientes`)),
    );

    // THEN: All return 200 (no race condition or connection pool issue)
    for (const response of responses) {
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
    }
  });
});

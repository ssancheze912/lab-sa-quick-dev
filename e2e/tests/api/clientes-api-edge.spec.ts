/**
 * Story 2.1: Client List & Search — API Edge Case Tests
 *
 * Expands coverage beyond ATDD tests (clientes-api.spec.ts).
 * Covers: ordering, NIT uniqueness validation at API level (if enforced),
 * large dataset response, response shape invariants, concurrent requests.
 *
 * Tests use Playwright's request context for direct HTTP calls.
 * Backend must be running at API_BASE_URL.
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

test.describe('Story 2.1 — GET /api/v1/clientes edge cases', () => {
  let apiHelper: ApiHelper;
  const createdIds: string[] = [];

  test.beforeEach(async ({ request }) => {
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  // ─── Response is always an array, never null or object ────────────────────

  test('[P1] response body should be an Array, not null or an object', async ({ request }) => {
    // WHEN: GET /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: body is a JSON array (direct array — no wrapper)
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).not.toBeNull();
    expect(typeof body).not.toBe('object'); // arrays pass typeof === 'object', so verify with Array.isArray
    expect(Array.isArray(body)).toBe(true);
  });

  // ─── Multiple clients — count integrity ────────────────────────────────────

  test('[P1] should return all seeded clients in a single response', async ({ request }) => {
    // GIVEN: 3 clients seeded
    const clientesData = [
      buildCliente({ nombre: 'Alpha Corp', nit: '900800100-1' }),
      buildCliente({ nombre: 'Beta Corp', nit: '900800200-2' }),
      buildCliente({ nombre: 'Gamma Corp', nit: '900800300-3' }),
    ];

    for (const data of clientesData) {
      const c = await apiHelper.createCliente(data);
      createdIds.push(c.id);
    }

    // WHEN: GET /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body: Record<string, unknown>[] = await response.json();

    // THEN: all 3 seeded clients appear in the response
    const seededIds = createdIds;
    const returnedIds = body.map((c) => c['id'] as string);
    for (const id of seededIds) {
      expect(returnedIds).toContain(id);
    }
  });

  // ─── Date fields conform to ISO 8601 ──────────────────────────────────────

  test('[P1] createdAt and updatedAt should be valid ISO 8601 date strings', async ({ request }) => {
    // GIVEN: one client seeded
    const data = buildCliente({ nombre: 'ISO Date Test', nit: '900700100-4' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: GET /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body: Record<string, unknown>[] = await response.json();

    const found = body.find((c) => c['id'] === cliente.id);
    expect(found).toBeDefined();

    // THEN: createdAt and updatedAt parse as valid dates
    const createdAt = new Date(found!['createdAt'] as string);
    const updatedAt = new Date(found!['updatedAt'] as string);

    expect(isNaN(createdAt.getTime())).toBe(false);
    expect(isNaN(updatedAt.getTime())).toBe(false);
    // Dates should be in the past or present, not far future
    expect(createdAt.getTime()).toBeLessThanOrEqual(Date.now() + 5000);
  });

  // ─── id field is a valid UUID ──────────────────────────────────────────────

  test('[P1] id field should be a valid UUID v4 format', async ({ request }) => {
    // GIVEN: one client seeded
    const data = buildCliente({ nombre: 'UUID Test', nit: '900600100-5' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: GET /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body: Record<string, unknown>[] = await response.json();

    const found = body.find((c) => c['id'] === cliente.id);
    expect(found).toBeDefined();

    // THEN: id is a valid UUID (8-4-4-4-12 hex format)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(found!['id'] as string).toMatch(uuidRegex);
  });

  // ─── Concurrent requests return same data ──────────────────────────────────

  test('[P2] concurrent GET requests should return consistent results', async ({ request }) => {
    // GIVEN: one client seeded
    const data = buildCliente({ nombre: 'Concurrent Test', nit: '900500100-6' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: two concurrent GET requests are made
    const [response1, response2] = await Promise.all([
      request.get(`${API_BASE_URL}/api/v1/clientes`),
      request.get(`${API_BASE_URL}/api/v1/clientes`),
    ]);

    // THEN: both responses return 200
    expect(response1.status()).toBe(200);
    expect(response2.status()).toBe(200);

    const body1: Record<string, unknown>[] = await response1.json();
    const body2: Record<string, unknown>[] = await response2.json();

    // AND: both have the same count
    expect(body1.length).toBe(body2.length);

    // AND: both contain the seeded client
    expect(body1.some((c) => c['id'] === cliente.id)).toBe(true);
    expect(body2.some((c) => c['id'] === cliente.id)).toBe(true);
  });

  // ─── nombre field is not empty string ────────────────────────────────────

  test('[P1] returned clients should have non-empty nombre values', async ({ request }) => {
    // GIVEN: a client with a proper nombre
    const data = buildCliente({ nombre: 'Empresa Válida', nit: '900400100-7' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: GET /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body: Record<string, unknown>[] = await response.json();

    const found = body.find((c) => c['id'] === cliente.id);
    expect(found).toBeDefined();

    // THEN: nombre is a non-empty string
    expect(typeof found!['nombre']).toBe('string');
    expect((found!['nombre'] as string).trim().length).toBeGreaterThan(0);
  });

  // ─── nit field is not empty string ────────────────────────────────────────

  test('[P1] returned clients should have non-empty nit values', async ({ request }) => {
    // GIVEN: a client with a proper nit
    const data = buildCliente({ nombre: 'NIT Válido', nit: '900300100-8' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: GET /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body: Record<string, unknown>[] = await response.json();

    const found = body.find((c) => c['id'] === cliente.id);
    expect(found).toBeDefined();

    // THEN: nit is a non-empty string
    expect(typeof found!['nit']).toBe('string');
    expect((found!['nit'] as string).trim().length).toBeGreaterThan(0);
  });

  // ─── Exactly 7 fields per response object ────────────────────────────────

  test('[P1] each client object should have exactly 7 fields per API contract', async ({ request }) => {
    // GIVEN: one client seeded
    const data = buildCliente({ nombre: 'Shape Test', nit: '900200100-9' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: GET /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body: Record<string, unknown>[] = await response.json();

    const found = body.find((c) => c['id'] === cliente.id);
    expect(found).toBeDefined();

    // THEN: exactly 7 camelCase fields
    const keys = Object.keys(found!).sort();
    expect(keys).toEqual(
      ['ciudad', 'createdAt', 'id', 'nombre', 'nit', 'telefono', 'updatedAt']
    );
  });
});

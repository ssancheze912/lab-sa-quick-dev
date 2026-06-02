import { test, expect } from '@playwright/test';

/**
 * Edge-case expansion for Story 2.4: Edit Client — API Edge Cases
 * BMad-Integrated: covers API paths not in the 2 GREEN ATDD API tests (API-C-04, API-C-10).
 *
 * API Edge Cases:
 *   API-C-EC-11  P0  AC2     — PUT /api/v1/clientes/:id with non-existent valid UUID → 404 Problem Details
 *   API-C-EC-12  P1  AC3     — PUT with all four fields empty → 400 with multiple validation errors
 *   API-C-EC-13  P1  AC2     — updatedAt in response is >= createdAt (temporal integrity)
 *   API-C-EC-14  P1  AC2     — PUT with identical values (no actual change) still returns 200 and body
 *   API-C-EC-15  P2  AC3     — PUT with nombre exceeding 200 chars → 400 Problem Details
 *   API-C-EC-16  P2  NFR6    — PUT to non-existent ID does NOT expose stack trace in response body
 */

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ---------------------------------------------------------------------------
// API Edge Cases
// ---------------------------------------------------------------------------

test.describe('Story 2.4 edge cases — API: PUT /api/v1/clientes/:id', () => {
  const createdIds: string[] = [];

  test.afterEach(async ({ request }) => {
    for (const id of createdIds) {
      await request.delete(`${API_BASE_URL}/api/v1/clientes/${id}`).catch(() => null);
    }
    createdIds.length = 0;
  });

  // -------------------------------------------------------------------------
  // API-C-EC-11 (P0 · AC2)
  // PUT to a valid UUID that does not exist → 404 Problem Details, not 500
  // -------------------------------------------------------------------------
  test('API-C-EC-11 — PUT with valid but non-existent UUID returns 404 Problem Details', async ({ request }) => {
    const nonExistentId = '00000000-0000-4000-8000-000000000099';
    const updatePayload = {
      nombre: 'Empresa EC-11',
      nit: '900000011-0',
      telefono: '3001234567',
      ciudad: 'Bogotá',
    };

    const response = await request.put(
      `${API_BASE_URL}/api/v1/clientes/${nonExistentId}`,
      { data: updatePayload }
    );

    expect(response.status()).toBe(404);

    const body = await response.json();
    expect(body.status).toBe(404);
    expect(typeof body.title).toBe('string');
    expect(body.title.length).toBeGreaterThan(0);

    // Must not expose stack trace (NFR6)
    expect(body.stackTrace).toBeUndefined();
    expect(body.StackTrace).toBeUndefined();
    expect(JSON.stringify(body)).not.toMatch(/at SiesaAgents/i);
  });

  // -------------------------------------------------------------------------
  // API-C-EC-12 (P1 · AC3)
  // PUT with ALL four required fields empty → 400 with error detail for each field
  // -------------------------------------------------------------------------
  test('API-C-EC-12 — PUT with all four fields empty returns 400 with multiple validation errors', async ({ request }) => {
    // Create a client first so the ID is valid
    const original = {
      nombre: 'Empresa All Empty EC-12',
      nit: `902${Date.now().toString().slice(-9)}`,
      telefono: '+57 1 234 5678',
      ciudad: 'Cali',
    };
    const createResp = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data: original });
    expect(createResp.status()).toBe(201);
    const created = await createResp.json();
    createdIds.push(created.id);

    const emptyPayload = { nombre: '', nit: '', telefono: '', ciudad: '' };
    const response = await request.put(
      `${API_BASE_URL}/api/v1/clientes/${created.id}`,
      { data: emptyPayload }
    );

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.status).toBe(400);
    expect(typeof body.title).toBe('string');

    // No stack trace (NFR6)
    expect(body.stackTrace).toBeUndefined();
    expect(JSON.stringify(body)).not.toMatch(/at SiesaAgents/i);
  });

  // -------------------------------------------------------------------------
  // API-C-EC-13 (P1 · AC2)
  // updatedAt in the response must be >= createdAt (temporal integrity of timestamps)
  // -------------------------------------------------------------------------
  test('API-C-EC-13 — updatedAt in PUT response is >= createdAt (temporal integrity)', async ({ request }) => {
    const original = {
      nombre: 'Empresa Temporal EC-13',
      nit: `903${Date.now().toString().slice(-9)}`,
      telefono: '+57 1 234 5678',
      ciudad: 'Medellín',
    };
    const createResp = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data: original });
    expect(createResp.status()).toBe(201);
    const created = await createResp.json();
    createdIds.push(created.id);

    const updatePayload = { ...original, nombre: 'Empresa Temporal Actualizada EC-13' };
    const response = await request.put(
      `${API_BASE_URL}/api/v1/clientes/${created.id}`,
      { data: updatePayload }
    );

    expect(response.status()).toBe(200);

    const body = await response.json();
    const createdAtMs = new Date(body.createdAt).getTime();
    const updatedAtMs = new Date(body.updatedAt).getTime();

    expect(Number.isNaN(createdAtMs)).toBe(false);
    expect(Number.isNaN(updatedAtMs)).toBe(false);
    expect(updatedAtMs).toBeGreaterThanOrEqual(createdAtMs);
  });

  // -------------------------------------------------------------------------
  // API-C-EC-14 (P1 · AC2)
  // PUT with identical values (no actual data change) still returns 200 and
  // the full updated client body — idempotent operation.
  // -------------------------------------------------------------------------
  test('API-C-EC-14 — PUT with unchanged values (idempotent) returns 200 and full body', async ({ request }) => {
    const original = {
      nombre: 'Empresa Idempotente EC-14',
      nit: `904${Date.now().toString().slice(-9)}`,
      telefono: '+57 1 234 5678',
      ciudad: 'Barranquilla',
    };
    const createResp = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data: original });
    expect(createResp.status()).toBe(201);
    const created = await createResp.json();
    createdIds.push(created.id);

    // PUT with identical payload
    const response = await request.put(
      `${API_BASE_URL}/api/v1/clientes/${created.id}`,
      { data: original }
    );

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.id).toBe(created.id);
    expect(body.nombre).toBe(original.nombre);
    expect(body.nit).toBe(original.nit);
    expect(body.telefono).toBe(original.telefono);
    expect(body.ciudad).toBe(original.ciudad);

    // Must not be a wrapper object
    expect(body.data).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // API-C-EC-15 (P2 · AC3)
  // PUT with nombre exceeding 200 characters → 400 Problem Details (MaximumLength rule)
  // -------------------------------------------------------------------------
  test('API-C-EC-15 — PUT with nombre > 200 chars returns 400 Problem Details', async ({ request }) => {
    const original = {
      nombre: 'Empresa Long Name EC-15',
      nit: `905${Date.now().toString().slice(-9)}`,
      telefono: '+57 1 234 5678',
      ciudad: 'Cúcuta',
    };
    const createResp = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data: original });
    expect(createResp.status()).toBe(201);
    const created = await createResp.json();
    createdIds.push(created.id);

    const longNombre = 'A'.repeat(201); // one character over the 200-char limit
    const invalidPayload = { ...original, nombre: longNombre };

    const response = await request.put(
      `${API_BASE_URL}/api/v1/clientes/${created.id}`,
      { data: invalidPayload }
    );

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.status).toBe(400);
    expect(typeof body.title).toBe('string');
    expect(body.stackTrace).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // API-C-EC-16 (P2 · NFR6)
  // PUT to a non-existent client ID does NOT expose internal stack trace or
  // exception type names in the response body.
  // -------------------------------------------------------------------------
  test('API-C-EC-16 — PUT 404 response does not expose stack trace or exception details (NFR6)', async ({ request }) => {
    const nonExistentId = '00000000-0000-4000-8000-000000000016';
    const payload = {
      nombre: 'NFR6 Test EC-16',
      nit: '900000016-0',
      telefono: '3001234567',
      ciudad: 'Bogotá',
    };

    const response = await request.put(
      `${API_BASE_URL}/api/v1/clientes/${nonExistentId}`,
      { data: payload }
    );

    expect(response.status()).toBe(404);

    const body = await response.json();
    const bodyString = JSON.stringify(body);

    // No stack trace fields
    expect(body.stackTrace).toBeUndefined();
    expect(body.StackTrace).toBeUndefined();
    expect(body.exception).toBeUndefined();
    expect(body.Exception).toBeUndefined();

    // No .NET type names or method call frames
    expect(bodyString).not.toMatch(/at SiesaAgents/i);
    expect(bodyString).not.toMatch(/KeyNotFoundException/i);
    expect(bodyString).not.toMatch(/System\.Collections/i);
  });
});

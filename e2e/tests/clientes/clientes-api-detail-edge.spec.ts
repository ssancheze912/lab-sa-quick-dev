import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

/**
 * Story 2.2 — API: GET /api/v1/clientes/:id — Edge Cases
 *
 * Expands coverage of API-C-08 and API-C-09 in clientes-api.spec.ts.
 * Targets boundary conditions, contract validation, and error response shape.
 *
 * Test IDs: API-C-DET-EDGE-01 … API-C-DET-EDGE-08
 */

test.describe('Story 2.2 — API: GET /api/v1/clientes/:id edge cases', () => {
  const createdIds: string[] = [];

  test.afterEach(async ({ request }) => {
    for (const id of createdIds) {
      await request.delete(`${API_BASE_URL}/api/v1/clientes/${id}`).catch(() => null);
    }
    createdIds.length = 0;
  });

  // ---------------------------------------------------------------------------
  // API-C-DET-EDGE-01 (P1)
  // GET by ID returns exactly the same schema fields as the list endpoint
  // Boundary: no additional or missing fields vs. the list response shape
  // ---------------------------------------------------------------------------
  test('API-C-DET-EDGE-01 — GET /api/v1/clientes/:id devuelve el mismo esquema que el endpoint de lista', async ({ request }) => {
    // GIVEN — a client is created
    const payload = {
      nombre: 'Empresa Schema Check Detail',
      nit: `901${Date.now().toString().slice(-9)}`,
      telefono: '+57 300 000 0010',
      ciudad: 'Medellín',
    };
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data: payload });
    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();
    createdIds.push(created.id);

    // WHEN — GET by ID
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    expect(response.status()).toBe(200);
    const body = await response.json();

    // THEN — only the expected public fields are present
    const expectedKeys = new Set(['id', 'nombre', 'nit', 'telefono', 'ciudad', 'createdAt', 'updatedAt']);
    const actualKeys = Object.keys(body);
    for (const key of actualKeys) {
      expect(expectedKeys.has(key)).toBe(true);
    }
    // AND — all expected keys are present
    for (const key of expectedKeys) {
      expect(actualKeys).toContain(key);
    }
  });

  // ---------------------------------------------------------------------------
  // API-C-DET-EDGE-02 (P1)
  // GET by ID response Content-Type is application/json (not problem+json)
  // Boundary: happy-path response must not be mistaken for an error envelope
  // ---------------------------------------------------------------------------
  test('API-C-DET-EDGE-02 — GET /api/v1/clientes/:id con ID válido devuelve Content-Type application/json', async ({ request }) => {
    // GIVEN — a client is created
    const payload = {
      nombre: 'Empresa ContentType Detail',
      nit: `902${Date.now().toString().slice(-9)}`,
      telefono: '+57 300 000 0011',
      ciudad: 'Cali',
    };
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data: payload });
    const created = await createResponse.json();
    createdIds.push(created.id);

    // WHEN — GET by ID
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);

    // THEN — Content-Type is JSON, not problem+json
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');
    expect(contentType).not.toContain('problem+json');
  });

  // ---------------------------------------------------------------------------
  // API-C-DET-EDGE-03 (P1)
  // GET by ID returns updatedAt as ISO 8601 with timezone
  // Boundary: DateTimeOffset serialization for the by-ID endpoint (same as list)
  // ---------------------------------------------------------------------------
  test('API-C-DET-EDGE-03 — GET /api/v1/clientes/:id — updatedAt es ISO 8601 con zona horaria', async ({ request }) => {
    const payload = {
      nombre: 'Empresa UpdatedAt Detail Check',
      nit: `903${Date.now().toString().slice(-9)}`,
      telefono: '+57 300 000 0012',
      ciudad: 'Barranquilla',
    };
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data: payload });
    const created = await createResponse.json();
    createdIds.push(created.id);

    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body.updatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
    );
  });

  // ---------------------------------------------------------------------------
  // API-C-DET-EDGE-04 (P1)
  // GET by ID after DELETE returns 404
  // Boundary: once a client is deleted, its by-ID endpoint must return 404
  // ---------------------------------------------------------------------------
  test('API-C-DET-EDGE-04 — GET /api/v1/clientes/:id tras DELETE devuelve 404', async ({ request }) => {
    // GIVEN — a client is created and then deleted
    const payload = {
      nombre: 'Empresa Para Borrar Detail',
      nit: `904${Date.now().toString().slice(-9)}`,
      telefono: '+57 300 000 0013',
      ciudad: 'Bogotá',
    };
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data: payload });
    const created = await createResponse.json();

    await request.delete(`${API_BASE_URL}/api/v1/clientes/${created.id}`);

    // WHEN — GET by ID for the deleted client
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);

    // THEN — 404 Not Found
    expect(response.status()).toBe(404);
  });

  // ---------------------------------------------------------------------------
  // API-C-DET-EDGE-05 (P1)
  // GET by ID with non-existent ID returns Problem Details Content-Type
  // Boundary: 404 response must have content-type problem+json per RFC 7807
  // ---------------------------------------------------------------------------
  test('API-C-DET-EDGE-05 — GET /api/v1/clientes/:id inexistente devuelve Content-Type problem+json', async ({ request }) => {
    const nonExistentId = '00000000-0000-4000-8000-000000000001';

    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${nonExistentId}`);

    expect(response.status()).toBe(404);

    // Content-Type must be problem+json for RFC 7807 compliance
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('problem+json');
  });

  // ---------------------------------------------------------------------------
  // API-C-DET-EDGE-06 (P2)
  // GET by ID with non-existent ID — Problem Details body has the 'detail' field
  // Boundary: RFC 7807 requires 'detail' to give human-readable context
  // ---------------------------------------------------------------------------
  test('API-C-DET-EDGE-06 — GET /api/v1/clientes/:id inexistente incluye campo "detail" en Problem Details', async ({ request }) => {
    const nonExistentId = '00000000-0000-4000-8000-000000000002';

    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${nonExistentId}`);
    expect(response.status()).toBe(404);

    const body = await response.json();
    expect(typeof body.detail).toBe('string');
    expect(body.detail.length).toBeGreaterThan(0);
  });

  // ---------------------------------------------------------------------------
  // API-C-DET-EDGE-07 (P1)
  // GET by ID returns data consistent with what was sent on creation (round-trip)
  // Boundary: all fields written via POST must be readable via GET by ID
  // ---------------------------------------------------------------------------
  test('API-C-DET-EDGE-07 — GET /api/v1/clientes/:id devuelve exactamente los datos enviados al crear', async ({ request }) => {
    const payload = {
      nombre: 'Empresa Roundtrip Verification',
      nit: `905${Date.now().toString().slice(-9)}`,
      telefono: '+57 320 555 1234',
      ciudad: 'Pereira',
    };
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data: payload });
    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();
    createdIds.push(created.id);

    // WHEN — GET by the created ID
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    expect(response.status()).toBe(200);
    const body = await response.json();

    // THEN — all fields match what was POSTed
    expect(body.nombre).toBe(payload.nombre);
    expect(body.nit).toBe(payload.nit);
    expect(body.telefono).toBe(payload.telefono);
    expect(body.ciudad).toBe(payload.ciudad);
    expect(body.id).toBe(created.id);
  });

  // ---------------------------------------------------------------------------
  // API-C-DET-EDGE-08 (P2)
  // GET /api/v1/clientes/:id — id field in response is a UUID v4
  // Boundary: the serialized ID must preserve UUID format (not an integer or other type)
  // ---------------------------------------------------------------------------
  test('API-C-DET-EDGE-08 — GET /api/v1/clientes/:id — el campo "id" es un UUID v4 válido', async ({ request }) => {
    const payload = {
      nombre: 'Empresa UUID Validation Detail',
      nit: `906${Date.now().toString().slice(-9)}`,
      telefono: '+57 301 111 2222',
      ciudad: 'Manizales',
    };
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data: payload });
    const created = await createResponse.json();
    createdIds.push(created.id);

    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    const body = await response.json();

    expect(body.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });
});

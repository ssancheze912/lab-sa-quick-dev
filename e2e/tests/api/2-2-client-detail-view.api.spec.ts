import { test, expect } from '@playwright/test';

/**
 * API Integration Tests — Story 2.2: Client Detail View
 *
 * Acceptance Criteria covered:
 *   AC4 — GET /api/v1/clientes/:id returns HTTP 200 with all fields:
 *          id, nombre, nit, telefono, ciudad, createdAt, updatedAt (TC-E2-P1-01)
 *   AC5 — GET /api/v1/clientes/:id with non-existent UUID returns HTTP 404 Problem Details RFC 7807
 *          without stack trace (TC-E2-P1-02, NFR6)
 *
 * Test cases aligned with test-design-epic-2.md:
 *   TC-E2-P1-01 — GET /api/v1/clientes/{id} returns 200 + all fields
 *   TC-E2-P1-02 — GET /api/v1/clientes/{id} with unknown UUID → 404 Problem Details
 *
 * These tests are in RED phase — they will fail until the backend endpoint is implemented.
 * Tests use Playwright's APIRequestContext (no browser).
 *
 * Note: xUnit integration tests are defined separately in:
 *   backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs
 *   These Playwright API tests verify the contract from the frontend/E2E perspective.
 */

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5000';

test.describe('Story 2.2 — GET /api/v1/clientes/{id} API Contract', () => {

  // ──────────────────────────────────────────────────────────────────────────
  // AC4: GET /api/v1/clientes/{id} → 200 + all required fields (TC-E2-P1-01)
  // ──────────────────────────────────────────────────────────────────────────

  test('AC4 TC-E2-P1-01 — GET /api/v1/clientes/{id} returns HTTP 200 when client exists', async ({ request }) => {
    // GIVEN: A client exists in the system (create via POST)
    const createResp = await request.post(`${API_BASE}/api/v1/clientes`, {
      data: {
        nombre: 'Empresa ATDD Detail 2.2',
        nit: `910${Date.now().toString().slice(-6)}`,
        telefono: '3001234567',
        ciudad: 'Bogotá',
      },
    });
    expect(createResp.status()).toBe(201);
    const created = await createResp.json();
    const clienteId = created?.id;

    try {
      // WHEN: GET /api/v1/clientes/{id} with valid UUID
      const response = await request.get(`${API_BASE}/api/v1/clientes/${clienteId}`);

      // THEN: HTTP 200
      expect(response.status()).toBe(200);
    } finally {
      // Cleanup
      if (clienteId) {
        await request.delete(`${API_BASE}/api/v1/clientes/${clienteId}`);
      }
    }
  });

  test('AC4 TC-E2-P1-01 — GET /api/v1/clientes/{id} returns Content-Type application/json', async ({ request }) => {
    // GIVEN: A client exists
    const createResp = await request.post(`${API_BASE}/api/v1/clientes`, {
      data: {
        nombre: 'Empresa Content-Type Test',
        nit: `911${Date.now().toString().slice(-6)}`,
        telefono: '3002345678',
        ciudad: 'Medellín',
      },
    });
    const created = await createResp.json();
    const clienteId = created?.id;

    try {
      // WHEN: GET /api/v1/clientes/{id}
      const response = await request.get(`${API_BASE}/api/v1/clientes/${clienteId}`);

      // THEN: Content-Type is application/json
      expect(response.headers()['content-type']).toContain('application/json');
    } finally {
      if (clienteId) await request.delete(`${API_BASE}/api/v1/clientes/${clienteId}`);
    }
  });

  test('AC4 TC-E2-P1-01 — response body contains all required fields: id, nombre, nit, telefono, ciudad, createdAt, updatedAt', async ({ request }) => {
    // GIVEN: A client exists with known data
    const clientData = {
      nombre: 'Empresa Campos Completos',
      nit: `912${Date.now().toString().slice(-6)}`,
      telefono: '3003456789',
      ciudad: 'Cali',
    };

    const createResp = await request.post(`${API_BASE}/api/v1/clientes`, { data: clientData });
    const created = await createResp.json();
    const clienteId = created?.id;

    try {
      // WHEN: GET /api/v1/clientes/{id}
      const response = await request.get(`${API_BASE}/api/v1/clientes/${clienteId}`);
      const body = await response.json();

      // THEN: All required fields are present in the response body
      expect(body).toMatchObject({
        id: expect.any(String),
        nombre: clientData.nombre,
        nit: clientData.nit,
        telefono: clientData.telefono,
        ciudad: clientData.ciudad,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    } finally {
      if (clienteId) await request.delete(`${API_BASE}/api/v1/clientes/${clienteId}`);
    }
  });

  test('AC4 — response body does NOT expose internal fields (stack traces, entity internals)', async ({ request }) => {
    // GIVEN: A client exists
    const createResp = await request.post(`${API_BASE}/api/v1/clientes`, {
      data: {
        nombre: 'Empresa NFR6 Test',
        nit: `913${Date.now().toString().slice(-6)}`,
        telefono: '3004567890',
        ciudad: 'Barranquilla',
      },
    });
    const created = await createResp.json();
    const clienteId = created?.id;

    try {
      // WHEN: GET /api/v1/clientes/{id}
      const response = await request.get(`${API_BASE}/api/v1/clientes/${clienteId}`);
      const body = await response.json();

      // THEN: Body does NOT contain internal properties (NFR6 — no stack trace or raw error exposed)
      expect(body).not.toHaveProperty('stackTrace');
      expect(body).not.toHaveProperty('exception');
      expect(body).not.toHaveProperty('innerException');
    } finally {
      if (clienteId) await request.delete(`${API_BASE}/api/v1/clientes/${clienteId}`);
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // AC5: Non-existent UUID → 404 Problem Details RFC 7807 (TC-E2-P1-02)
  // ──────────────────────────────────────────────────────────────────────────

  test('AC5 TC-E2-P1-02 — GET /api/v1/clientes/{unknown-uuid} returns HTTP 404', async ({ request }) => {
    // GIVEN: A UUID that does not exist in the system
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    // WHEN: GET /api/v1/clientes/{unknown-uuid}
    const response = await request.get(`${API_BASE}/api/v1/clientes/${nonExistentId}`);

    // THEN: HTTP 404 Not Found
    expect(response.status()).toBe(404);
  });

  test('AC5 TC-E2-P1-02 — 404 response uses Problem Details format (RFC 7807) with Content-Type application/problem+json', async ({ request }) => {
    // GIVEN: A non-existent UUID
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    // WHEN: GET /api/v1/clientes/{unknown-uuid}
    const response = await request.get(`${API_BASE}/api/v1/clientes/${nonExistentId}`);

    // THEN: Content-Type follows RFC 7807 (Problem Details)
    expect(response.headers()['content-type']).toContain('application/problem+json');
  });

  test('AC5 TC-E2-P1-02 — 404 body conforms to RFC 7807 shape (title + status fields)', async ({ request }) => {
    // GIVEN: A non-existent UUID
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    // WHEN: GET /api/v1/clientes/{unknown-uuid}
    const response = await request.get(`${API_BASE}/api/v1/clientes/${nonExistentId}`);
    const body = await response.json();

    // THEN: Body has required RFC 7807 fields
    expect(body).toHaveProperty('title');
    expect(body).toHaveProperty('status');
    expect(body.status).toBe(404);
  });

  test('AC5 TC-E2-P1-02 — 404 body does NOT expose stack traces or internal details (NFR6)', async ({ request }) => {
    // GIVEN: A non-existent UUID
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    // WHEN: GET /api/v1/clientes/{unknown-uuid}
    const response = await request.get(`${API_BASE}/api/v1/clientes/${nonExistentId}`);
    const body = await response.json();

    // THEN: Body does NOT contain stack trace or exception details (NFR6)
    expect(body).not.toHaveProperty('stackTrace');
    expect(body).not.toHaveProperty('exception');
    expect(body).not.toHaveProperty('innerException');

    // AND: Body string does NOT contain stack trace keywords
    const bodyStr = JSON.stringify(body);
    expect(bodyStr).not.toContain('at System.');
    expect(bodyStr).not.toContain('in C:\\');
    expect(bodyStr).not.toContain('Exception:');
  });

  test('AC5 — GET with a valid but non-existent UUID returns 404 (not 400 or 500)', async ({ request }) => {
    // GIVEN: A valid UUID format but non-existent record
    const validFormatNonExistentId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

    // WHEN: GET /api/v1/clientes/{valid-uuid-non-existent}
    const response = await request.get(`${API_BASE}/api/v1/clientes/${validFormatNonExistentId}`);

    // THEN: 404 (not 400 — valid UUID format should not fail validation)
    expect(response.status()).toBe(404);
  });
});

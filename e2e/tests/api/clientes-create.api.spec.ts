/**
 * Story 2.3: Create Client
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (API Level)
 * These tests INTENTIONALLY FAIL until implementation is complete.
 * Tests verify the POST /api/v1/clientes contract directly.
 *
 * Acceptance Criteria covered:
 *   AC2 — POST creates client, returns 201 + ClienteDto
 *   AC3 — POST with missing fields returns 400 Problem Details
 *   AC4 — POST with duplicate NIT returns 409 Conflict with specific detail
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — POST /api/v1/clientes happy-path contract
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — POST /api/v1/clientes creates client successfully', () => {
  const createdIds: string[] = [];

  test.afterEach(async ({ request }) => {
    for (const id of createdIds) {
      await request.delete(`${API_BASE_URL}/api/v1/clientes/${id}`).catch(() => null);
    }
    createdIds.length = 0;
  });

  test('should return 201 Created when all required fields are provided', async ({ request }) => {
    // GIVEN: Valid client payload with all required fields
    const payload = {
      nombre: `Cliente API Test ${Date.now()}`,
      nit: `9${Date.now().toString().slice(-8)}`,
      telefono: '3001234567',
      ciudad: 'Bogotá',
    };

    // WHEN: POST /api/v1/clientes
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: payload,
    });

    // THEN: Response is 201 Created
    expect(response.status()).toBe(201);
    const body = await response.json();
    if (body?.id) createdIds.push(body.id);
  });

  test('should return ClienteDto with correct shape on 201', async ({ request }) => {
    // GIVEN: Valid client payload
    const payload = {
      nombre: `Cliente Shape Test ${Date.now()}`,
      nit: `8${Date.now().toString().slice(-8)}`,
      telefono: '3101234567',
      ciudad: 'Medellín',
    };

    // WHEN: POST /api/v1/clientes
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: payload,
    });

    // THEN: Response body matches ClienteDto shape
    const body = await response.json();
    if (body?.id) createdIds.push(body.id);

    expect(typeof body.id).toBe('string');
    expect(body.nombre).toBe(payload.nombre);
    expect(body.nit).toBe(payload.nit);
    expect(body.telefono).toBe(payload.telefono);
    expect(body.ciudad).toBe(payload.ciudad);
    expect(typeof body.createdAt).toBe('string');
    expect(typeof body.updatedAt).toBe('string');
  });

  test('should return content-type application/json on 201', async ({ request }) => {
    // GIVEN: Valid client payload
    const payload = {
      nombre: `Cliente ContentType Test ${Date.now()}`,
      nit: `7${Date.now().toString().slice(-8)}`,
      telefono: '3201234567',
      ciudad: 'Cali',
    };

    // WHEN: POST /api/v1/clientes
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: payload,
    });

    // THEN: Content-Type is application/json
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');
    const body = await response.json();
    if (body?.id) createdIds.push(body.id);
  });

  test('should have the new client appear in GET /api/v1/clientes list', async ({ request }) => {
    // GIVEN: A new client is created
    const payload = {
      nombre: `Cliente List Refresh Test ${Date.now()}`,
      nit: `6${Date.now().toString().slice(-8)}`,
      telefono: '3401234567',
      ciudad: 'Barranquilla',
    };

    const postResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: payload,
    });
    expect(postResponse.status()).toBe(201);
    const created = await postResponse.json();
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes is called
    const listResponse = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const list = await listResponse.json() as Array<{ id: string; nombre: string }>;

    // THEN: New client appears in the list immediately (FR27)
    expect(list.some((c) => c.id === created.id)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — POST with missing required fields returns 400 with Problem Details
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — POST /api/v1/clientes validates required fields', () => {
  test('should return 400 when nombre is missing', async ({ request }) => {
    // GIVEN: Payload without nombre
    const payload = { nit: '9001234567', telefono: '3001234567', ciudad: 'Bogotá' };

    // WHEN: POST /api/v1/clientes
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: payload,
    });

    // THEN: 400 Bad Request
    expect(response.status()).toBe(400);
  });

  test('should return 400 when nit is missing', async ({ request }) => {
    // GIVEN: Payload without nit
    const payload = { nombre: 'Empresa Test', telefono: '3001234567', ciudad: 'Bogotá' };

    // WHEN: POST /api/v1/clientes
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: payload,
    });

    // THEN: 400 Bad Request
    expect(response.status()).toBe(400);
  });

  test('should return 400 when telefono is missing', async ({ request }) => {
    // GIVEN: Payload without telefono
    const payload = { nombre: 'Empresa Test', nit: '9001234567', ciudad: 'Bogotá' };

    // WHEN: POST /api/v1/clientes
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: payload,
    });

    // THEN: 400 Bad Request
    expect(response.status()).toBe(400);
  });

  test('should return 400 when ciudad is missing', async ({ request }) => {
    // GIVEN: Payload without ciudad
    const payload = { nombre: 'Empresa Test', nit: '9001234567', telefono: '3001234567' };

    // WHEN: POST /api/v1/clientes
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: payload,
    });

    // THEN: 400 Bad Request
    expect(response.status()).toBe(400);
  });

  test('should return Problem Details RFC 7807 format on 400', async ({ request }) => {
    // GIVEN: Empty payload
    const payload = {};

    // WHEN: POST /api/v1/clientes
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: payload,
    });

    // THEN: Response follows Problem Details RFC 7807
    expect(response.status()).toBe(400);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toMatch(/application\/(json|problem\+json)/);

    const body = await response.json();
    // Problem Details must include status field
    expect(body.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — POST with duplicate NIT returns 409 Conflict
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — POST /api/v1/clientes returns 409 for duplicate NIT', () => {
  let createdId: string | null = null;

  test.afterEach(async ({ request }) => {
    if (createdId) {
      await request.delete(`${API_BASE_URL}/api/v1/clientes/${createdId}`).catch(() => null);
      createdId = null;
    }
  });

  test('should return 409 Conflict when NIT already exists', async ({ request }) => {
    // GIVEN: A client with a specific NIT already exists
    const uniqueNit = `5${Date.now().toString().slice(-8)}`;
    const firstPayload = {
      nombre: `Empresa Original ${Date.now()}`,
      nit: uniqueNit,
      telefono: '3001234567',
      ciudad: 'Bogotá',
    };

    const firstResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: firstPayload,
    });
    expect(firstResponse.status()).toBe(201);
    const firstBody = await firstResponse.json();
    createdId = firstBody.id;

    // WHEN: A second client is created with the same NIT
    const duplicatePayload = {
      nombre: `Empresa Duplicada ${Date.now()}`,
      nit: uniqueNit,
      telefono: '3109876543',
      ciudad: 'Medellín',
    };

    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: duplicatePayload,
    });

    // THEN: Response is 409 Conflict
    expect(response.status()).toBe(409);
  });

  test('should return detail "El NIT/RUC ya está registrado" on 409', async ({ request }) => {
    // GIVEN: A client with a specific NIT already exists
    const uniqueNit = `4${Date.now().toString().slice(-8)}`;

    const firstResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        nombre: `Empresa Original 2 ${Date.now()}`,
        nit: uniqueNit,
        telefono: '3001234567',
        ciudad: 'Bogotá',
      },
    });
    const firstBody = await firstResponse.json();
    createdId = firstBody.id;

    // WHEN: Duplicate NIT is submitted
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        nombre: `Empresa Duplicada 2 ${Date.now()}`,
        nit: uniqueNit,
        telefono: '3109876543',
        ciudad: 'Medellín',
      },
    });

    // THEN: Problem Details contains the expected human-readable detail (NFR6)
    expect(response.status()).toBe(409);
    const body = await response.json();
    expect(body.detail).toBe('El NIT/RUC ya está registrado');
  });

  test('should NOT expose internal stack trace or technical details on 409 (NFR6)', async ({ request }) => {
    // GIVEN: A client with a specific NIT already exists
    const uniqueNit = `3${Date.now().toString().slice(-8)}`;

    const firstResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        nombre: `Empresa NFR6 Test ${Date.now()}`,
        nit: uniqueNit,
        telefono: '3001234567',
        ciudad: 'Bogotá',
      },
    });
    const firstBody = await firstResponse.json();
    createdId = firstBody.id;

    // WHEN: Duplicate NIT triggers 409
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        nombre: `Empresa NFR6 Dup ${Date.now()}`,
        nit: uniqueNit,
        telefono: '3009876543',
        ciudad: 'Cali',
      },
    });

    // THEN: Response body does NOT contain stack trace or internal technical details
    const body = await response.json();
    const bodyStr = JSON.stringify(body);
    expect(bodyStr).not.toMatch(/stackTrace|exception|at System\.|at Microsoft\./i);
  });
});

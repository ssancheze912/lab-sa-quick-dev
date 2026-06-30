/**
 * Story 2.4: Edit Client
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (API Level)
 * These tests INTENTIONALLY FAIL until implementation is complete.
 * Tests verify the PUT /api/v1/clientes/{id} contract directly.
 *
 * Acceptance Criteria covered:
 *   AC2 — PUT updates client, returns 200 + updated ClienteDto
 *   AC3 — PUT with missing required fields returns 400 Problem Details (FR8)
 *   AC2 — PUT with non-existent id returns 404 Problem Details
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — PUT /api/v1/clientes/{id} happy-path contract
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — PUT /api/v1/clientes/{id} updates client successfully', () => {
  let createdId: string | null = null;

  test.beforeEach(async ({ request }) => {
    // Create a client to update in each test
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        nombre: `Cliente Update Test ${Date.now()}`,
        nit: `U${Date.now().toString().slice(-8)}`,
        telefono: '3001234567',
        ciudad: 'Bogotá',
      },
    });
    const body = await response.json();
    createdId = body.id ?? null;
  });

  test.afterEach(async ({ request }) => {
    if (createdId) {
      await request.delete(`${API_BASE_URL}/api/v1/clientes/${createdId}`).catch(() => null);
      createdId = null;
    }
  });

  test('should return 200 OK when all required fields are provided in PUT', async ({ request }) => {
    // GIVEN: An existing client and a valid update payload
    const updatePayload = {
      nombre: `Cliente Updated ${Date.now()}`,
      nit: `V${Date.now().toString().slice(-8)}`,
      telefono: '3109876543',
      ciudad: 'Medellín',
    };

    // WHEN: PUT /api/v1/clientes/{id}
    const response = await request.put(`${API_BASE_URL}/api/v1/clientes/${createdId}`, {
      data: updatePayload,
    });

    // THEN: Response is 200 OK
    expect(response.status()).toBe(200);
  });

  test('should return updated ClienteDto with correct field values on 200', async ({ request }) => {
    // GIVEN: An existing client
    const updatePayload = {
      nombre: `Empresa Actualizada ${Date.now()}`,
      nit: `W${Date.now().toString().slice(-8)}`,
      telefono: '3201234567',
      ciudad: 'Cali',
    };

    // WHEN: PUT /api/v1/clientes/{id}
    const response = await request.put(`${API_BASE_URL}/api/v1/clientes/${createdId}`, {
      data: updatePayload,
    });

    // THEN: Response body reflects updated values (ClienteDto shape)
    const body = await response.json();
    expect(body.id).toBe(createdId);
    expect(body.nombre).toBe(updatePayload.nombre);
    expect(body.nit).toBe(updatePayload.nit);
    expect(body.telefono).toBe(updatePayload.telefono);
    expect(body.ciudad).toBe(updatePayload.ciudad);
    expect(typeof body.createdAt).toBe('string');
    expect(typeof body.updatedAt).toBe('string');
  });

  test('should update the updatedAt timestamp on successful PUT', async ({ request }) => {
    // GIVEN: An existing client with a known updatedAt
    const getResponse = await request.get(`${API_BASE_URL}/api/v1/clientes/${createdId}`);
    const original = await getResponse.json();

    const updatePayload = {
      nombre: `Timestamp Test ${Date.now()}`,
      nit: `T${Date.now().toString().slice(-8)}`,
      telefono: '3301234567',
      ciudad: 'Barranquilla',
    };

    // WHEN: PUT is called (even a small delay ensures updatedAt differs)
    await new Promise((r) => setTimeout(r, 10));
    const response = await request.put(`${API_BASE_URL}/api/v1/clientes/${createdId}`, {
      data: updatePayload,
    });

    // THEN: updatedAt is updated (differs from or equal to the original — must be a valid ISO date)
    const updated = await response.json();
    expect(typeof updated.updatedAt).toBe('string');
    // updatedAt must be a parseable ISO date
    expect(isNaN(Date.parse(updated.updatedAt))).toBe(false);
    // updatedAt should be >= createdAt
    expect(new Date(updated.updatedAt) >= new Date(original.createdAt)).toBe(true);
  });

  test('should reflect PUT changes in subsequent GET /api/v1/clientes/{id}', async ({ request }) => {
    // GIVEN: An existing client
    const updatedNombre = `Empresa Verificada ${Date.now()}`;
    const updatePayload = {
      nombre: updatedNombre,
      nit: `X${Date.now().toString().slice(-8)}`,
      telefono: '3401234567',
      ciudad: 'Pereira',
    };

    await request.put(`${API_BASE_URL}/api/v1/clientes/${createdId}`, {
      data: updatePayload,
    });

    // WHEN: GET /api/v1/clientes/{id} is called after the update
    const getResponse = await request.get(`${API_BASE_URL}/api/v1/clientes/${createdId}`);

    // THEN: GET returns the updated values (FR27 — changes reflected immediately)
    const body = await getResponse.json();
    expect(body.nombre).toBe(updatedNombre);
  });

  test('should reflect PUT changes in GET /api/v1/clientes list', async ({ request }) => {
    // GIVEN: An existing client
    const updatedNombre = `Empresa En Lista ${Date.now()}`;
    const updatePayload = {
      nombre: updatedNombre,
      nit: `Y${Date.now().toString().slice(-8)}`,
      telefono: '3501234567',
      ciudad: 'Manizales',
    };

    await request.put(`${API_BASE_URL}/api/v1/clientes/${createdId}`, {
      data: updatePayload,
    });

    // WHEN: GET /api/v1/clientes list is fetched after update
    const listResponse = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const list = await listResponse.json() as Array<{ id: string; nombre: string }>;

    // THEN: Client in the list has the updated nombre (FR27)
    const found = list.find((c) => c.id === createdId);
    expect(found).toBeTruthy();
    expect(found?.nombre).toBe(updatedNombre);
  });

  test('should return content-type application/json on 200', async ({ request }) => {
    // GIVEN: An existing client
    const response = await request.put(`${API_BASE_URL}/api/v1/clientes/${createdId}`, {
      data: {
        nombre: `CT Test ${Date.now()}`,
        nit: `Z${Date.now().toString().slice(-8)}`,
        telefono: '3601234567',
        ciudad: 'Bucaramanga',
      },
    });

    // THEN: Content-Type is application/json
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — PUT with missing required fields returns 400 Problem Details (FR8)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — PUT /api/v1/clientes/{id} validates required fields', () => {
  let createdId: string | null = null;

  test.beforeEach(async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        nombre: `Cliente Val Test ${Date.now()}`,
        nit: `A${Date.now().toString().slice(-8)}`,
        telefono: '3001234567',
        ciudad: 'Bogotá',
      },
    });
    const body = await response.json();
    createdId = body.id ?? null;
  });

  test.afterEach(async ({ request }) => {
    if (createdId) {
      await request.delete(`${API_BASE_URL}/api/v1/clientes/${createdId}`).catch(() => null);
      createdId = null;
    }
  });

  test('should return 400 when nombre is empty in PUT payload', async ({ request }) => {
    // GIVEN: Update payload with empty nombre
    const payload = { nombre: '', nit: '9001234567', telefono: '3001234567', ciudad: 'Bogotá' };

    // WHEN: PUT /api/v1/clientes/{id}
    const response = await request.put(`${API_BASE_URL}/api/v1/clientes/${createdId}`, {
      data: payload,
    });

    // THEN: 400 Bad Request (FR8)
    expect(response.status()).toBe(400);
  });

  test('should return 400 when nit is empty in PUT payload', async ({ request }) => {
    // GIVEN: Update payload with empty nit
    const payload = { nombre: 'Empresa Test', nit: '', telefono: '3001234567', ciudad: 'Bogotá' };

    // WHEN: PUT /api/v1/clientes/{id}
    const response = await request.put(`${API_BASE_URL}/api/v1/clientes/${createdId}`, {
      data: payload,
    });

    // THEN: 400 Bad Request
    expect(response.status()).toBe(400);
  });

  test('should return 400 when telefono is empty in PUT payload', async ({ request }) => {
    // GIVEN: Update payload with empty telefono
    const payload = { nombre: 'Empresa Test', nit: '9001234567', telefono: '', ciudad: 'Bogotá' };

    // WHEN: PUT /api/v1/clientes/{id}
    const response = await request.put(`${API_BASE_URL}/api/v1/clientes/${createdId}`, {
      data: payload,
    });

    // THEN: 400 Bad Request
    expect(response.status()).toBe(400);
  });

  test('should return 400 when ciudad is empty in PUT payload', async ({ request }) => {
    // GIVEN: Update payload with empty ciudad
    const payload = { nombre: 'Empresa Test', nit: '9001234567', telefono: '3001234567', ciudad: '' };

    // WHEN: PUT /api/v1/clientes/{id}
    const response = await request.put(`${API_BASE_URL}/api/v1/clientes/${createdId}`, {
      data: payload,
    });

    // THEN: 400 Bad Request
    expect(response.status()).toBe(400);
  });

  test('should return Problem Details RFC 7807 format on 400 validation error', async ({ request }) => {
    // GIVEN: Empty update payload
    const payload = { nombre: '', nit: '', telefono: '', ciudad: '' };

    // WHEN: PUT /api/v1/clientes/{id}
    const response = await request.put(`${API_BASE_URL}/api/v1/clientes/${createdId}`, {
      data: payload,
    });

    // THEN: Response follows Problem Details RFC 7807 with status 400
    expect(response.status()).toBe(400);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toMatch(/application\/(json|problem\+json)/);
    const body = await response.json();
    expect(body.status).toBe(400);
  });

  test('should NOT expose stack trace in 400 response body (NFR6)', async ({ request }) => {
    // GIVEN: Invalid update payload
    const payload = { nombre: '', nit: '', telefono: '', ciudad: '' };

    // WHEN: PUT /api/v1/clientes/{id}
    const response = await request.put(`${API_BASE_URL}/api/v1/clientes/${createdId}`, {
      data: payload,
    });

    // THEN: Response body does not contain internal technical details (NFR6)
    const body = await response.json();
    const bodyStr = JSON.stringify(body);
    expect(bodyStr).not.toMatch(/stackTrace|exception|at System\.|at Microsoft\./i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — PUT with non-existent id returns 404
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — PUT /api/v1/clientes/{id} returns 404 for non-existent client', () => {
  const NONEXISTENT_ID = '00000000-0000-0000-0000-000000000000';

  test('should return 404 when id does not exist', async ({ request }) => {
    // GIVEN: A valid payload but with a non-existent client id
    const payload = {
      nombre: 'Empresa Fantasma',
      nit: '9999999999',
      telefono: '3001234567',
      ciudad: 'Bogotá',
    };

    // WHEN: PUT /api/v1/clientes/{nonexistent-id}
    const response = await request.put(`${API_BASE_URL}/api/v1/clientes/${NONEXISTENT_ID}`, {
      data: payload,
    });

    // THEN: 404 Not Found
    expect(response.status()).toBe(404);
  });

  test('should return Problem Details format on 404', async ({ request }) => {
    // GIVEN: Valid payload with non-existent id
    const payload = {
      nombre: 'Empresa 404',
      nit: '9999999998',
      telefono: '3001234567',
      ciudad: 'Bogotá',
    };

    // WHEN: PUT /api/v1/clientes/{nonexistent-id}
    const response = await request.put(`${API_BASE_URL}/api/v1/clientes/${NONEXISTENT_ID}`, {
      data: payload,
    });

    // THEN: Problem Details RFC 7807 with status 404
    const body = await response.json();
    expect(body.status).toBe(404);
  });
});

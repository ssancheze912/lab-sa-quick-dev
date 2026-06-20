// ─────────────────────────────────────────────────────────────────────────────
// ATDD — Story 2.4: Edit Client
// Test Level: API (Playwright request context)
// Phase: RED — all tests fail until backend implementation exists
//
// Acceptance Criteria covered:
//   AC2 — PUT /api/v1/clientes/{id} returns 200 OK + ClienteDto body
//   AC3 — PUT /api/v1/clientes/{id} with empty fields returns 400 Problem Details (RFC 7807)
//   AC5 — PUT /api/v1/clientes/{id} with duplicate NIT (different client)
//          returns 409 Problem Details (RFC 7807)
//   Also covers: 404 when client ID does not exist
//
// Backend endpoint contract:
//   PUT /api/v1/clientes/{id} (success)           → 200 OK + ClienteDto
//   PUT /api/v1/clientes/{id} (invalid data)      → 400 Problem Details RFC 7807
//   PUT /api/v1/clientes/{id} (not found)         → 404 Problem Details RFC 7807
//   PUT /api/v1/clientes/{id} (NIT conflict)      → 409 Problem Details RFC 7807
// ─────────────────────────────────────────────────────────────────────────────

import { test, expect } from '@playwright/test';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function createCliente(request: import('@playwright/test').APIRequestContext) {
  const data = buildCliente();
  const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });
  const body = await response.json();
  return { id: body.id as string, data };
}

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — PUT /api/v1/clientes/{id} returns 200 OK with updated ClienteDto
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — PUT /api/v1/clientes/{id} updates client successfully', () => {
  const createdIds: string[] = [];

  test.afterEach(async ({ request }) => {
    for (const id of createdIds) {
      await request.delete(`${API_BASE_URL}/api/v1/clientes/${id}`).catch(() => null);
    }
    createdIds.length = 0;
  });

  test('should return 200 OK when all required fields are provided and client exists', async ({ request }) => {
    // GIVEN: A client exists in the backend
    const { id, data } = await createCliente(request);
    createdIds.push(id);

    // WHEN: PUT /api/v1/clientes/{id} is called with updated data
    const updateData = { ...data, nombre: 'Nombre Actualizado', ciudad: 'Medellín' };
    const response = await request.put(`${API_BASE_URL}/api/v1/clientes/${id}`, { data: updateData });

    // THEN: Response status is 200 OK
    expect(response.status()).toBe(200);
  });

  test('should return ClienteDto with id matching the updated client', async ({ request }) => {
    // GIVEN: A client exists
    const { id, data } = await createCliente(request);
    createdIds.push(id);

    // WHEN: PUT is called
    const updateData = { ...data, nombre: 'Corp Actualizada' };
    const response = await request.put(`${API_BASE_URL}/api/v1/clientes/${id}`, { data: updateData });
    const body = await response.json();

    // THEN: Body contains the same id
    expect(body.id).toBe(id);
  });

  test('should return ClienteDto with the updated Nombre value', async ({ request }) => {
    // GIVEN: A client exists
    const { id, data } = await createCliente(request);
    createdIds.push(id);

    // WHEN: PUT is called with a new Nombre
    const updateData = { ...data, nombre: 'Nombre Nuevo Verificado' };
    const response = await request.put(`${API_BASE_URL}/api/v1/clientes/${id}`, { data: updateData });
    const body = await response.json();

    // THEN: Nombre in response matches the updated value
    expect(body.nombre).toBe('Nombre Nuevo Verificado');
  });

  test('should return ClienteDto with updated Teléfono and Ciudad values', async ({ request }) => {
    // GIVEN: A client exists
    const { id, data } = await createCliente(request);
    createdIds.push(id);

    // WHEN: PUT is called with new Teléfono and Ciudad
    const updateData = { ...data, telefono: '6017654321', ciudad: 'Cali' };
    const response = await request.put(`${API_BASE_URL}/api/v1/clientes/${id}`, { data: updateData });
    const body = await response.json();

    // THEN: Response reflects the updated values
    expect(body.telefono).toBe('6017654321');
    expect(body.ciudad).toBe('Cali');
  });

  test('should return ClienteDto with non-null updatedAt timestamp', async ({ request }) => {
    // GIVEN: A client exists
    const { id, data } = await createCliente(request);
    createdIds.push(id);

    // WHEN: PUT is called
    const updateData = { ...data, nombre: 'Updated TS Test' };
    const response = await request.put(`${API_BASE_URL}/api/v1/clientes/${id}`, { data: updateData });
    const body = await response.json();

    // THEN: updatedAt is present and is an ISO date string
    expect(body.updatedAt).toBeTruthy();
    expect(new Date(body.updatedAt).getTime()).not.toBeNaN();
  });

  test('should return Content-Type application/json for successful update', async ({ request }) => {
    // GIVEN: A client exists
    const { id, data } = await createCliente(request);
    createdIds.push(id);

    // WHEN: PUT is called
    const response = await request.put(`${API_BASE_URL}/api/v1/clientes/${id}`, { data });

    // THEN: Content-Type is application/json
    expect(response.headers()['content-type']).toContain('application/json');
  });

  test('should allow updating a client with its own NIT (no self-conflict)', async ({ request }) => {
    // GIVEN: A client exists with NIT "900123456-1"
    const { id, data } = await createCliente(request);
    createdIds.push(id);

    // WHEN: PUT is called keeping the same NIT
    const updateData = { ...data, nombre: 'Updated Same NIT' };
    const response = await request.put(`${API_BASE_URL}/api/v1/clientes/${id}`, { data: updateData });

    // THEN: Response is 200 OK (same-client NIT reuse is not a conflict)
    expect(response.status()).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — PUT returns 400 for missing required fields
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — PUT /api/v1/clientes/{id} returns 400 for invalid data', () => {
  const createdIds: string[] = [];

  test.afterEach(async ({ request }) => {
    for (const id of createdIds) {
      await request.delete(`${API_BASE_URL}/api/v1/clientes/${id}`).catch(() => null);
    }
    createdIds.length = 0;
  });

  test('should return 400 when Nombre is empty', async ({ request }) => {
    // GIVEN: A client exists
    const { id, data } = await createCliente(request);
    createdIds.push(id);

    // WHEN: PUT is called with empty Nombre
    const response = await request.put(`${API_BASE_URL}/api/v1/clientes/${id}`, {
      data: { ...data, nombre: '' },
    });

    // THEN: 400 Bad Request
    expect(response.status()).toBe(400);
  });

  test('should return 400 when NIT is empty', async ({ request }) => {
    // GIVEN: A client exists
    const { id, data } = await createCliente(request);
    createdIds.push(id);

    // WHEN: PUT is called with empty NIT
    const response = await request.put(`${API_BASE_URL}/api/v1/clientes/${id}`, {
      data: { ...data, nit: '' },
    });

    // THEN: 400 Bad Request
    expect(response.status()).toBe(400);
  });

  test('should return 400 when Teléfono is empty', async ({ request }) => {
    // GIVEN: A client exists
    const { id, data } = await createCliente(request);
    createdIds.push(id);

    // WHEN: PUT is called with empty Teléfono
    const response = await request.put(`${API_BASE_URL}/api/v1/clientes/${id}`, {
      data: { ...data, telefono: '' },
    });

    // THEN: 400 Bad Request
    expect(response.status()).toBe(400);
  });

  test('should return 400 when Ciudad is empty', async ({ request }) => {
    // GIVEN: A client exists
    const { id, data } = await createCliente(request);
    createdIds.push(id);

    // WHEN: PUT is called with empty Ciudad
    const response = await request.put(`${API_BASE_URL}/api/v1/clientes/${id}`, {
      data: { ...data, ciudad: '' },
    });

    // THEN: 400 Bad Request
    expect(response.status()).toBe(400);
  });

  test('should return Problem Details format (RFC 7807) for 400 response', async ({ request }) => {
    // GIVEN: A client exists
    const { id, data } = await createCliente(request);
    createdIds.push(id);

    // WHEN: PUT is called with empty Nombre
    const response = await request.put(`${API_BASE_URL}/api/v1/clientes/${id}`, {
      data: { ...data, nombre: '' },
    });
    const body = await response.json();

    // THEN: Problem Details fields are present
    expect(body).toHaveProperty('status', 400);
    expect(body).toHaveProperty('title');
    expect(body).not.toHaveProperty('stackTrace');
    expect(body).not.toHaveProperty('StackTrace');
  });

  test('should NOT expose stack traces in 400 validation error response (NFR6)', async ({ request }) => {
    // GIVEN: A client exists
    const { id, data } = await createCliente(request);
    createdIds.push(id);

    // WHEN: PUT is called with invalid data
    const response = await request.put(`${API_BASE_URL}/api/v1/clientes/${id}`, {
      data: { ...data, nombre: '' },
    });
    const body = await response.json();
    const bodyText = JSON.stringify(body);

    // THEN: No stack trace keywords in response
    expect(bodyText).not.toContain('StackTrace');
    expect(bodyText).not.toContain('System.');
    expect(bodyText).not.toContain('at SiesaAgents');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 404 — PUT when client ID does not exist
// ─────────────────────────────────────────────────────────────────────────────

test.describe('404 — PUT /api/v1/clientes/{id} returns 404 when client not found', () => {
  test('should return 404 when client ID does not exist', async ({ request }) => {
    // GIVEN: Non-existent client ID
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    // WHEN: PUT is called with a non-existent ID
    const response = await request.put(`${API_BASE_URL}/api/v1/clientes/${nonExistentId}`, {
      data: buildCliente(),
    });

    // THEN: 404 Not Found
    expect(response.status()).toBe(404);
  });

  test('should return Problem Details format (RFC 7807) for 404 response', async ({ request }) => {
    // GIVEN: Non-existent client ID
    const nonExistentId = '00000000-0000-0000-0000-000000000001';

    // WHEN: PUT is called
    const response = await request.put(`${API_BASE_URL}/api/v1/clientes/${nonExistentId}`, {
      data: buildCliente(),
    });
    const body = await response.json();

    // THEN: Problem Details fields are present
    expect(body).toHaveProperty('status', 404);
    expect(body).toHaveProperty('title');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — PUT returns 409 for NIT conflict with different client
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — PUT /api/v1/clientes/{id} returns 409 for NIT conflict', () => {
  const createdIds: string[] = [];

  test.afterEach(async ({ request }) => {
    for (const id of createdIds) {
      await request.delete(`${API_BASE_URL}/api/v1/clientes/${id}`).catch(() => null);
    }
    createdIds.length = 0;
  });

  test('should return 409 when NIT already belongs to a different client', async ({ request }) => {
    // GIVEN: Two clients exist with different NITs
    const { id: idA, data: dataA } = await createCliente(request);
    const { id: idB, data: dataB } = await createCliente(request);
    createdIds.push(idA, idB);

    // WHEN: Client B tries to adopt Client A's NIT
    const response = await request.put(`${API_BASE_URL}/api/v1/clientes/${idB}`, {
      data: { ...dataB, nit: dataA.nit },
    });

    // THEN: 409 Conflict
    expect(response.status()).toBe(409);
  });

  test('should return Problem Details format (RFC 7807) for 409 response', async ({ request }) => {
    // GIVEN: Two clients exist
    const { id: idA, data: dataA } = await createCliente(request);
    const { id: idB, data: dataB } = await createCliente(request);
    createdIds.push(idA, idB);

    // WHEN: PUT is called with conflicting NIT
    const response = await request.put(`${API_BASE_URL}/api/v1/clientes/${idB}`, {
      data: { ...dataB, nit: dataA.nit },
    });
    const body = await response.json();

    // THEN: Problem Details fields are present
    expect(body).toHaveProperty('status', 409);
    expect(body).toHaveProperty('title');
    expect(body).toHaveProperty('detail');
  });

  test('should NOT expose stack traces in 409 conflict response body (NFR6)', async ({ request }) => {
    // GIVEN: Two clients exist
    const { id: idA, data: dataA } = await createCliente(request);
    const { id: idB, data: dataB } = await createCliente(request);
    createdIds.push(idA, idB);

    // WHEN: PUT is called with conflicting NIT
    const response = await request.put(`${API_BASE_URL}/api/v1/clientes/${idB}`, {
      data: { ...dataB, nit: dataA.nit },
    });
    const body = await response.json();
    const bodyText = JSON.stringify(body);

    // THEN: No stack trace keywords in response
    expect(bodyText).not.toContain('StackTrace');
    expect(bodyText).not.toContain('System.');
    expect(bodyText).not.toContain('at SiesaAgents');
  });

  test('should include conflict detail message mentioning the NIT value', async ({ request }) => {
    // GIVEN: Two clients exist
    const { id: idA, data: dataA } = await createCliente(request);
    const { id: idB, data: dataB } = await createCliente(request);
    createdIds.push(idA, idB);

    // WHEN: PUT is called with conflicting NIT
    const response = await request.put(`${API_BASE_URL}/api/v1/clientes/${idB}`, {
      data: { ...dataB, nit: dataA.nit },
    });
    const body = await response.json();

    // THEN: detail field mentions the conflicting NIT
    expect(body.detail).toContain(dataA.nit);
  });
});

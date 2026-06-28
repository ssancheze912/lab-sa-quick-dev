import { test, expect } from '@playwright/test';

/**
 * ATDD API tests — Story 2.2: Client Detail View (RED phase)
 *
 * Tests fail until:
 *   - GET /api/v1/clientes/:id endpoint is implemented in ClienteEndpoints.cs
 *   - GetClienteByIdQueryHandler.cs is created and wired
 *   - IClienteRepository.GetByIdAsync is implemented
 *   - 404 response uses Results.Problem(...) with Problem Details RFC 7807
 *
 * Test IDs:
 *   TC-E2-2-2-API-1 (P1) — GET /api/v1/clientes/:id returns 200 + correct ClienteDto
 *   TC-E2-2-2-API-2 (P1) — GET /api/v1/clientes/{unknown-uuid} returns 404 + Problem Details
 */

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';
const CLIENTES_URL = `${API_BASE_URL}/api/v1/clientes`;
const UNKNOWN_UUID = '00000000-0000-0000-0000-000000000000';

/**
 * Seed a cliente via POST and return the created DTO.
 * Used to set up data for each test without depending on pre-existing data.
 */
async function seedCliente(
  request: import('@playwright/test').APIRequestContext,
  overrides: { nombre?: string; nit?: string; telefono?: string; ciudad?: string } = {}
) {
  const now = Date.now();
  const data = {
    nombre: overrides.nombre ?? `API Test Cliente ${now}`,
    nit: overrides.nit ?? `${now}`.slice(-9),
    telefono: overrides.telefono ?? `300${String(now).slice(-7)}`,
    ciudad: overrides.ciudad ?? 'Bogotá',
  };

  const response = await request.post(CLIENTES_URL, { data });
  expect(response.status()).toBe(201);
  return response.json() as Promise<{
    id: string;
    nombre: string;
    nit: string;
    telefono: string;
    ciudad: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

test.describe('Story 2.2 — API: GET /api/v1/clientes/:id', () => {
  const createdIds: string[] = [];

  test.afterEach(async ({ request }) => {
    for (const id of createdIds) {
      await request.delete(`${CLIENTES_URL}/${id}`).catch(() => null);
    }
    createdIds.length = 0;
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E2-2-2-API-1 (P1) — 200 + correct ClienteDto on valid ID
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E2-2-2-API-1: should return 200 with correct ClienteDto when fetching an existing client by id', async ({ request }) => {
    // GIVEN: A cliente was previously created
    const seeded = await seedCliente(request, {
      nombre: 'Empresa API Detail',
      nit: '900123001-5',
      telefono: '3001230015',
      ciudad: 'Bogotá',
    });
    createdIds.push(seeded.id);

    // WHEN: GET /api/v1/clientes/:id is called with the seeded ID
    const response = await request.get(`${CLIENTES_URL}/${seeded.id}`);

    // THEN: Response status is 200 OK
    expect(response.status()).toBe(200);

    const body = await response.json();

    // AND: Response body contains the correct ClienteDto fields
    expect(body).toMatchObject({
      id: seeded.id,
      nombre: seeded.nombre,
      nit: seeded.nit,
      telefono: seeded.telefono,
      ciudad: seeded.ciudad,
    });

    // AND: Response includes audit timestamps (DateTimeOffset format)
    expect(body).toHaveProperty('createdAt');
    expect(body).toHaveProperty('updatedAt');
    expect(typeof body.createdAt).toBe('string');
    expect(typeof body.updatedAt).toBe('string');
  });

  test('should return correct content-type application/json for a valid client', async ({ request }) => {
    // GIVEN: A cliente was created
    const seeded = await seedCliente(request);
    createdIds.push(seeded.id);

    // WHEN: GET /api/v1/clientes/:id is called
    const response = await request.get(`${CLIENTES_URL}/${seeded.id}`);

    // THEN: Content-Type is application/json
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');
  });

  test('should return all required ClienteDto fields (id, nombre, nit, telefono, ciudad, createdAt, updatedAt)', async ({ request }) => {
    // GIVEN: A cliente was created with all fields
    const seeded = await seedCliente(request, {
      nombre: 'Campos Completos SA',
      nit: '900444001-9',
      telefono: '3154440019',
      ciudad: 'Medellín',
    });
    createdIds.push(seeded.id);

    // WHEN: GET /api/v1/clientes/:id is called
    const response = await request.get(`${CLIENTES_URL}/${seeded.id}`);
    const body = await response.json();

    // THEN: All required fields are present in the response
    expect(Object.keys(body)).toEqual(
      expect.arrayContaining(['id', 'nombre', 'nit', 'telefono', 'ciudad', 'createdAt', 'updatedAt'])
    );
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E2-2-2-API-2 (P1) — 404 + Problem Details for unknown UUID
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E2-2-2-API-2: should return 404 with Problem Details RFC 7807 when client id does not exist', async ({ request }) => {
    // GIVEN: No client with UNKNOWN_UUID exists in the system

    // WHEN: GET /api/v1/clientes/{unknown-uuid} is called
    const response = await request.get(`${CLIENTES_URL}/${UNKNOWN_UUID}`);

    // THEN: Response status is 404 Not Found
    expect(response.status()).toBe(404);

    const body = await response.json();

    // AND: Response body conforms to Problem Details RFC 7807
    expect(body).toHaveProperty('status', 404);
    expect(body).toHaveProperty('title');
    expect(typeof body.title).toBe('string');

    // AND: Problem Details detail field is present (describes what happened)
    expect(body).toHaveProperty('detail');
    expect(typeof body.detail).toBe('string');
  });

  test('should return content-type application/problem+json for a 404 response', async ({ request }) => {
    // GIVEN: No client with UNKNOWN_UUID exists

    // WHEN: GET /api/v1/clientes/{unknown-uuid} is called
    const response = await request.get(`${CLIENTES_URL}/${UNKNOWN_UUID}`);

    // THEN: Content-Type includes problem+json (RFC 7807)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toMatch(/application\/(problem\+json|json)/);
  });

  test('should return 404 for a syntactically valid but non-existent UUID', async ({ request }) => {
    // GIVEN: A well-formed UUID that was never seeded
    const nonExistentUuid = 'aaaabbbb-cccc-dddd-eeee-ffffffffffff';

    // WHEN: GET /api/v1/clientes/{non-existent-uuid} is called
    const response = await request.get(`${CLIENTES_URL}/${nonExistentUuid}`);

    // THEN: Response is 404 (not 500 or unhandled error)
    expect(response.status()).toBe(404);
  });
});

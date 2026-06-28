import { test, expect } from '@playwright/test';

/**
 * ATDD API tests — Story 3.2: Contact Detail View (RED phase)
 *
 * Tests fail until:
 *   - GET /api/v1/contactos/:id endpoint is confirmed working (already in ContactoEndpoints.cs from Story 3.1)
 *   - IContactoRepository.GetByIdAsync is implemented (confirmed from Story 3.1)
 *   - 404 response uses Results.Problem(...) with Problem Details RFC 7807
 *   - ContactoDto includes all 4 fields: nombre, cargo, telefono, email
 *
 * NOTE: The backend endpoint is implemented in Story 3.1. These tests verify it
 *       behaves correctly and returns the expected ContactoDto shape per Story 3.2 AC.
 *
 * Test IDs:
 *   TC-E3-3-2-API-1 (P1) — GET /api/v1/contactos/:id returns 200 + correct ContactoDto with all 4 fields
 *   TC-E3-3-2-API-2 (P1) — GET /api/v1/contactos/{unknown-uuid} returns 404 + Problem Details
 */

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';
const CONTACTOS_URL = `${API_BASE_URL}/api/v1/contactos`;
const UNKNOWN_UUID = '00000000-0000-0000-0000-000000000000';

/**
 * Seed a contacto via POST and return the created DTO.
 * Used to set up data for each test without depending on pre-existing data.
 */
async function seedContacto(
  request: import('@playwright/test').APIRequestContext,
  overrides: {
    nombre?: string;
    email?: string;
    cargo?: string;
    telefono?: string;
    clienteId?: string | null;
  } = {}
) {
  const now = Date.now();
  const data = {
    nombre: overrides.nombre ?? `API Test Contacto ${now}`,
    email: overrides.email ?? `api.test.${now}@empresa.co`,
    cargo: overrides.cargo ?? 'Analista de Ventas',
    telefono: overrides.telefono ?? `300${String(now).slice(-7)}`,
    clienteId: overrides.clienteId ?? null,
  };

  const response = await request.post(CONTACTOS_URL, { data });
  expect(response.status()).toBe(201);
  return response.json() as Promise<{
    id: string;
    nombre: string;
    cargo: string;
    telefono: string;
    email: string;
    clienteId: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
}

test.describe('Story 3.2 — API: GET /api/v1/contactos/:id', () => {
  const createdIds: string[] = [];

  test.afterEach(async ({ request }) => {
    for (const id of createdIds) {
      await request.delete(`${CONTACTOS_URL}/${id}`).catch(() => null);
    }
    createdIds.length = 0;
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E3-3-2-API-1 (P1) — 200 + correct ContactoDto on valid ID
  // AC #2: GET /api/v1/contactos/:contactoId returns all 4 FR13 fields
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E3-3-2-API-1: should return 200 with correct ContactoDto including all 4 FR13 fields when fetching an existing contact by id', async ({ request }) => {
    // GIVEN: A contacto was previously created with known Nombre, Cargo, Teléfono, Email
    const seeded = await seedContacto(request, {
      nombre: 'María López API Detail',
      email: 'maria.lopez.api@empresa.co',
      cargo: 'Gerente Comercial',
      telefono: '3001234567',
    });
    createdIds.push(seeded.id);

    // WHEN: GET /api/v1/contactos/:id is called with the seeded ID
    const response = await request.get(`${CONTACTOS_URL}/${seeded.id}`);

    // THEN: Response status is 200 OK
    expect(response.status()).toBe(200);

    const body = await response.json();

    // AND: Response body contains the correct ContactoDto fields (FR13)
    expect(body).toMatchObject({
      id: seeded.id,
      nombre: seeded.nombre,
      cargo: seeded.cargo,
      telefono: seeded.telefono,
      email: seeded.email,
    });

    // AND: Response includes audit timestamps
    expect(body).toHaveProperty('createdAt');
    expect(body).toHaveProperty('updatedAt');
    expect(typeof body.createdAt).toBe('string');
    expect(typeof body.updatedAt).toBe('string');
  });

  test('should return correct content-type application/json for a valid contact', async ({ request }) => {
    // GIVEN: A contacto was created
    const seeded = await seedContacto(request);
    createdIds.push(seeded.id);

    // WHEN: GET /api/v1/contactos/:id is called
    const response = await request.get(`${CONTACTOS_URL}/${seeded.id}`);

    // THEN: Content-Type is application/json
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');
  });

  test('should return all required ContactoDto fields (id, nombre, cargo, telefono, email, clienteId, createdAt, updatedAt)', async ({ request }) => {
    // GIVEN: A contacto was created with all fields
    const seeded = await seedContacto(request, {
      nombre: 'Campos Completos SA',
      email: 'campos.completos@empresa.co',
      cargo: 'Director de Marketing',
      telefono: '3154440019',
    });
    createdIds.push(seeded.id);

    // WHEN: GET /api/v1/contactos/:id is called
    const response = await request.get(`${CONTACTOS_URL}/${seeded.id}`);
    const body = await response.json();

    // THEN: All required fields are present in the response (FR13 — Nombre, Cargo, Teléfono, Email)
    expect(Object.keys(body)).toEqual(
      expect.arrayContaining(['id', 'nombre', 'cargo', 'telefono', 'email', 'clienteId', 'createdAt', 'updatedAt'])
    );
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E3-3-2-API-2 (P1) — 404 + Problem Details for unknown UUID
  // AC #3: not-found scenario — no crash, Problem Details RFC 7807
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E3-3-2-API-2: should return 404 with Problem Details RFC 7807 when contact id does not exist', async ({ request }) => {
    // GIVEN: No contact with UNKNOWN_UUID exists in the system

    // WHEN: GET /api/v1/contactos/{unknown-uuid} is called
    const response = await request.get(`${CONTACTOS_URL}/${UNKNOWN_UUID}`);

    // THEN: Response status is 404 Not Found
    expect(response.status()).toBe(404);

    const body = await response.json();

    // AND: Response body conforms to Problem Details RFC 7807
    expect(body).toHaveProperty('status', 404);
    expect(body).toHaveProperty('title');
    expect(typeof body.title).toBe('string');

    // AND: Problem Details detail field is present (describes what happened in Spanish)
    expect(body).toHaveProperty('detail');
    expect(typeof body.detail).toBe('string');
  });

  test('should return content-type application/problem+json for a 404 response', async ({ request }) => {
    // GIVEN: No contact with UNKNOWN_UUID exists

    // WHEN: GET /api/v1/contactos/{unknown-uuid} is called
    const response = await request.get(`${CONTACTOS_URL}/${UNKNOWN_UUID}`);

    // THEN: Content-Type includes problem+json (RFC 7807 — NFR6)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toMatch(/application\/(problem\+json|json)/);
  });

  test('should return 404 for a syntactically valid but non-existent UUID', async ({ request }) => {
    // GIVEN: A well-formed UUID that was never seeded
    const nonExistentUuid = 'aaaabbbb-cccc-dddd-eeee-ffffffffffff';

    // WHEN: GET /api/v1/contactos/{non-existent-uuid} is called
    const response = await request.get(`${CONTACTOS_URL}/${nonExistentUuid}`);

    // THEN: Response is 404 (not 500 or unhandled error — AC #3 no crash)
    expect(response.status()).toBe(404);
  });
});

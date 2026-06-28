import { test, expect } from '@playwright/test';

/**
 * ATDD API tests — Story 4.1: View Associated Contacts in Client Detail (RED phase)
 *
 * Tests fail until:
 *   - GetContactosQuery.cs is extended with optional Guid? ClienteId param
 *   - GetContactosQueryHandler.cs applies .Where(c => c.ClienteId == query.ClienteId)
 *   - ContactoEndpoints.cs reads optional clienteId query param and passes it to the query
 *   - ix_contactos_cliente_id index is configured in ContactoConfiguration.cs
 *
 * Test IDs:
 *   TC-E4-4-1-API-1 (P1) — GET /api/v1/contactos?clienteId={uuid} returns 200 + array of ContactoDto for that client
 *   TC-E4-4-1-API-2 (P1) — GET /api/v1/contactos?clienteId={uuid} returns 200 + empty array [] when no contacts linked
 *   TC-E4-4-1-API-3 (P2) — GET /api/v1/contactos without clienteId still returns all contacts (backwards compatibility)
 */

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';
const CLIENTES_URL = `${API_BASE_URL}/api/v1/clientes`;
const CONTACTOS_URL = `${API_BASE_URL}/api/v1/contactos`;

// ─────────────────────────────────────────────────────────────────────────────
// Seed helpers
// ─────────────────────────────────────────────────────────────────────────────

async function seedCliente(
  request: import('@playwright/test').APIRequestContext,
  overrides: { nombre?: string; nit?: string } = {}
) {
  const now = Date.now();
  const data = {
    nombre: overrides.nombre ?? `API Cliente 4.1 ${now}`,
    nit: overrides.nit ?? `${now}`.slice(-9),
    telefono: `300${String(now).slice(-7)}`,
    ciudad: 'Bogotá',
  };
  const response = await request.post(CLIENTES_URL, { data });
  expect(response.status()).toBe(201);
  return response.json() as Promise<{ id: string; nombre: string; nit: string }>;
}

async function seedContacto(
  request: import('@playwright/test').APIRequestContext,
  overrides: {
    nombre?: string;
    email?: string;
    cargo?: string;
    clienteId?: string | null;
  } = {}
) {
  const now = Date.now();
  const data = {
    nombre: overrides.nombre ?? `API Contacto 4.1 ${now}`,
    email: overrides.email ?? `api.contacto.41.${now}@empresa.co`,
    cargo: overrides.cargo ?? 'Analista de Ventas',
    telefono: `310${String(now).slice(-7)}`,
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

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Story 4.1 — API: GET /api/v1/contactos?clienteId=', () => {
  const createdClienteIds: string[] = [];
  const createdContactoIds: string[] = [];

  test.afterEach(async ({ request }) => {
    for (const id of createdContactoIds) {
      await request.delete(`${CONTACTOS_URL}/${id}`).catch(() => null);
    }
    for (const id of createdClienteIds) {
      await request.delete(`${CLIENTES_URL}/${id}`).catch(() => null);
    }
    createdContactoIds.length = 0;
    createdClienteIds.length = 0;
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E4-4-1-API-1 (P1) — clienteId filter returns only linked contacts (AC #1)
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E4-4-1-API-1: should return 200 with only ContactoDto objects belonging to clienteId when GET /api/v1/contactos?clienteId={uuid}', async ({ request }) => {
    // GIVEN: Cliente X with 2 associated contacts, and Cliente Y with 1 contact
    const clienteX = await seedCliente(request, { nombre: 'Cliente X API 4.1' });
    createdClienteIds.push(clienteX.id);

    const clienteY = await seedCliente(request, { nombre: 'Cliente Y API 4.1' });
    createdClienteIds.push(clienteY.id);

    const contacto1 = await seedContacto(request, {
      nombre: 'Contacto X1 API',
      email: `x1.api.${Date.now()}@empresa.co`,
      clienteId: clienteX.id,
    });
    createdContactoIds.push(contacto1.id);

    const contacto2 = await seedContacto(request, {
      nombre: 'Contacto X2 API',
      email: `x2.api.${Date.now() + 1}@empresa.co`,
      clienteId: clienteX.id,
    });
    createdContactoIds.push(contacto2.id);

    const contactoY = await seedContacto(request, {
      nombre: 'Contacto Y1 API',
      email: `y1.api.${Date.now() + 2}@empresa.co`,
      clienteId: clienteY.id,
    });
    createdContactoIds.push(contactoY.id);

    // WHEN: GET /api/v1/contactos?clienteId={clienteX.id}
    const response = await request.get(`${CONTACTOS_URL}?clienteId=${clienteX.id}`);

    // THEN: Response status is 200 OK
    expect(response.status()).toBe(200);

    const body = await response.json();

    // AND: Response contains exactly the 2 contacts for clienteX
    expect(Array.isArray(body)).toBe(true);

    const ids = (body as { id: string }[]).map((c) => c.id);
    expect(ids).toContain(contacto1.id);
    expect(ids).toContain(contacto2.id);

    // AND: Contact from clienteY is NOT included
    expect(ids).not.toContain(contactoY.id);
  });

  test('should return ContactoDto objects with clienteId field matching the filter value', async ({ request }) => {
    // GIVEN: Cliente with 1 associated contact
    const cliente = await seedCliente(request, { nombre: 'Cliente ClienteId Field Test' });
    createdClienteIds.push(cliente.id);

    const contacto = await seedContacto(request, {
      nombre: 'Contacto ClienteId Field',
      email: `field.test.${Date.now()}@empresa.co`,
      clienteId: cliente.id,
    });
    createdContactoIds.push(contacto.id);

    // WHEN: GET /api/v1/contactos?clienteId={cliente.id}
    const response = await request.get(`${CONTACTOS_URL}?clienteId=${cliente.id}`);
    expect(response.status()).toBe(200);

    const body = await response.json() as { id: string; clienteId: string | null }[];

    // THEN: The returned contact has clienteId matching the filter
    const found = body.find((c) => c.id === contacto.id);
    expect(found).toBeDefined();
    expect(found!.clienteId).toBe(cliente.id);
  });

  test('should return contacts ordered by nombre (alphabetical order per handler spec)', async ({ request }) => {
    // GIVEN: Cliente with 3 contacts in non-alphabetical insertion order
    const cliente = await seedCliente(request, { nombre: 'Cliente Orden Test' });
    createdClienteIds.push(cliente.id);

    const contactoC = await seedContacto(request, {
      nombre: 'Zara Última',
      email: `zara.${Date.now()}@empresa.co`,
      clienteId: cliente.id,
    });
    createdContactoIds.push(contactoC.id);

    const contactoA = await seedContacto(request, {
      nombre: 'Ana Primera',
      email: `ana.${Date.now() + 1}@empresa.co`,
      clienteId: cliente.id,
    });
    createdContactoIds.push(contactoA.id);

    const contactoB = await seedContacto(request, {
      nombre: 'Mario Segundo',
      email: `mario.${Date.now() + 2}@empresa.co`,
      clienteId: cliente.id,
    });
    createdContactoIds.push(contactoB.id);

    // WHEN: GET /api/v1/contactos?clienteId={cliente.id}
    const response = await request.get(`${CONTACTOS_URL}?clienteId=${cliente.id}`);
    expect(response.status()).toBe(200);

    const body = await response.json() as { id: string; nombre: string }[];
    const returnedIds = body.filter((c) =>
      [contactoA.id, contactoB.id, contactoC.id].includes(c.id)
    ).map((c) => c.id);

    // THEN: Contacts appear in alphabetical nombre order
    expect(returnedIds).toEqual([contactoA.id, contactoB.id, contactoC.id]);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E4-4-1-API-2 (P1) — clienteId with no contacts returns [] (AC #2)
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E4-4-1-API-2: should return 200 with empty array [] (NOT 404) when GET /api/v1/contactos?clienteId= has no linked contacts', async ({ request }) => {
    // GIVEN: A client that exists but has no associated contacts
    const cliente = await seedCliente(request, { nombre: 'Cliente Sin Contactos API' });
    createdClienteIds.push(cliente.id);

    // WHEN: GET /api/v1/contactos?clienteId={cliente.id}
    const response = await request.get(`${CONTACTOS_URL}?clienteId=${cliente.id}`);

    // THEN: Response status is 200 OK — NOT 404 (empty means no contacts, not not-found)
    expect(response.status()).toBe(200);

    const body = await response.json();

    // AND: Response is an empty array []
    expect(Array.isArray(body)).toBe(true);
    expect((body as unknown[]).length).toBe(0);
  });

  test('should return 200 empty array for a valid UUID clienteId that has no contacts at all', async ({ request }) => {
    // GIVEN: A UUID that belongs to a valid client but was never linked to any contact
    const cliente = await seedCliente(request, { nombre: 'Cliente UUID Sin Contactos' });
    createdClienteIds.push(cliente.id);

    // WHEN: GET /api/v1/contactos?clienteId={uuid}
    const response = await request.get(`${CONTACTOS_URL}?clienteId=${cliente.id}`);

    // THEN: 200 OK
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect((body as unknown[]).length).toBe(0);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E4-4-1-API-3 (P2) — Without clienteId still returns all contacts (AC #1 backwards compat)
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E4-4-1-API-3: should return 200 with all contacts (not filtered) when GET /api/v1/contactos is called without clienteId param', async ({ request }) => {
    // GIVEN: Two contacts exist — one linked to a client, one orphan
    const cliente = await seedCliente(request, { nombre: 'Cliente Compat Test' });
    createdClienteIds.push(cliente.id);

    const contactoLinked = await seedContacto(request, {
      nombre: 'Contacto Vinculado Compat',
      email: `vinculado.compat.${Date.now()}@empresa.co`,
      clienteId: cliente.id,
    });
    createdContactoIds.push(contactoLinked.id);

    const contactoOrfano = await seedContacto(request, {
      nombre: 'Contacto Orfano Compat',
      email: `orfano.compat.${Date.now() + 1}@empresa.co`,
      clienteId: null,
    });
    createdContactoIds.push(contactoOrfano.id);

    // WHEN: GET /api/v1/contactos (no clienteId param — existing endpoint without new filter)
    const response = await request.get(CONTACTOS_URL);

    // THEN: Response status is 200 OK
    expect(response.status()).toBe(200);

    const body = await response.json() as { id: string }[];

    // AND: Both contacts appear in the response (backwards compatibility — not filtered)
    const ids = body.map((c) => c.id);
    expect(ids).toContain(contactoLinked.id);
    expect(ids).toContain(contactoOrfano.id);
  });

  test('should return correct ContactoDto shape in the clienteId-filtered response', async ({ request }) => {
    // GIVEN: A contact linked to a client
    const cliente = await seedCliente(request, { nombre: 'Cliente Shape Test' });
    createdClienteIds.push(cliente.id);

    const contacto = await seedContacto(request, {
      nombre: 'Contacto Shape Verificar',
      email: `shape.verify.${Date.now()}@empresa.co`,
      cargo: 'Directora de Operaciones',
      clienteId: cliente.id,
    });
    createdContactoIds.push(contacto.id);

    // WHEN: GET /api/v1/contactos?clienteId={cliente.id}
    const response = await request.get(`${CONTACTOS_URL}?clienteId=${cliente.id}`);
    expect(response.status()).toBe(200);

    const body = await response.json() as Record<string, unknown>[];
    const found = body.find((c) => c['id'] === contacto.id);
    expect(found).toBeDefined();

    // THEN: ContactoDto contains all required fields (FR21 — complete contact data)
    expect(Object.keys(found!)).toEqual(
      expect.arrayContaining(['id', 'nombre', 'cargo', 'telefono', 'email', 'clienteId', 'createdAt', 'updatedAt'])
    );

    // AND: Audit timestamps are DateTimeOffset strings
    expect(typeof found!['createdAt']).toBe('string');
    expect(typeof found!['updatedAt']).toBe('string');
  });
});

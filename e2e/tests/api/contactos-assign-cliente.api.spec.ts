import { test, expect } from '@playwright/test';

/**
 * ATDD API tests — Story 4.2: Associate & Disassociate Contacts from Client (RED phase)
 *
 * Tests fail until:
 *   - AssignContactoClienteCommand.cs is created
 *   - AssignContactoClienteCommandHandler.cs is created
 *   - AssignContactoClienteRequest.cs is created
 *   - ContactoEntity.AssignCliente(Guid? clienteId) domain method is added
 *   - PUT /api/v1/contactos/{id}/cliente endpoint is registered in ContactoEndpoints.cs
 *   - AssignContactoClienteCommandHandler is registered in DI in Program.cs
 *
 * Test IDs:
 *   TC-E4-4-2-API-1 (P0) — PUT /api/v1/contactos/{id}/cliente with { clienteId: uuid } → 200 OK + ContactoDto with new clienteId
 *   TC-E4-4-2-API-2 (P1) — PUT /api/v1/contactos/{id}/cliente with { clienteId: null } → 200 OK + ContactoDto with clienteId: null
 *   TC-E4-4-2-API-3 (P1) — PUT /api/v1/contactos/{id}/cliente with non-existent id → 404 Problem Details RFC 7807
 *   TC-E4-4-2-API-4 (P1) — PUT disassociate → contact still retrievable via GET /api/v1/contactos (record preserved)
 *   TC-E4-4-2-API-5 (P1) — Response shape contains all ContactoDto fields after association
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
    nombre: overrides.nombre ?? `API Cliente 4.2 ${now}`,
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
    nombre: overrides.nombre ?? `API Contacto 4.2 ${now}`,
    email: overrides.email ?? `api.contacto.42.${now}@empresa.co`,
    cargo: overrides.cargo ?? 'Analista Comercial',
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

test.describe('Story 4.2 — API: PUT /api/v1/contactos/{id}/cliente', () => {
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
  // TC-E4-4-2-API-1 (P0) — Associate contact to client → 200 OK + updated ContactoDto (AC #1)
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E4-4-2-API-1: should return 200 OK with ContactoDto containing the new clienteId when PUT /api/v1/contactos/{id}/cliente with { clienteId: uuid }', async ({ request }) => {
    // GIVEN: An orphan contact and a client exist
    const cliente = await seedCliente(request, { nombre: 'Cliente Asociar Contacto API' });
    createdClienteIds.push(cliente.id);

    const contacto = await seedContacto(request, {
      nombre: 'Contacto Huerfano Para Asociar',
      email: `huerfano.asociar.${Date.now()}@empresa.co`,
      clienteId: null,
    });
    createdContactoIds.push(contacto.id);

    // WHEN: PUT /api/v1/contactos/{id}/cliente with { clienteId: uuid }
    const response = await request.put(`${CONTACTOS_URL}/${contacto.id}/cliente`, {
      data: { clienteId: cliente.id },
    });

    // THEN: Response status is 200 OK
    expect(response.status()).toBe(200);

    const body = await response.json() as {
      id: string;
      clienteId: string | null;
    };

    // AND: Returned ContactoDto has the new clienteId
    expect(body.id).toBe(contacto.id);
    expect(body.clienteId).toBe(cliente.id);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E4-4-2-API-2 (P1) — Disassociate contact → 200 OK + contacteId: null (AC #3)
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E4-4-2-API-2: should return 200 OK with clienteId: null when PUT /api/v1/contactos/{id}/cliente with { clienteId: null }', async ({ request }) => {
    // GIVEN: A contact already linked to a client
    const cliente = await seedCliente(request, { nombre: 'Cliente Desasociar API' });
    createdClienteIds.push(cliente.id);

    const contacto = await seedContacto(request, {
      nombre: 'Contacto Vinculado Para Desasociar',
      email: `vinculado.desasociar.${Date.now()}@empresa.co`,
      clienteId: cliente.id,
    });
    createdContactoIds.push(contacto.id);

    // WHEN: PUT /api/v1/contactos/{id}/cliente with { clienteId: null }
    const response = await request.put(`${CONTACTOS_URL}/${contacto.id}/cliente`, {
      data: { clienteId: null },
    });

    // THEN: Response status is 200 OK
    expect(response.status()).toBe(200);

    const body = await response.json() as {
      id: string;
      clienteId: string | null;
    };

    // AND: Returned ContactoDto has clienteId: null (disassociated)
    expect(body.id).toBe(contacto.id);
    expect(body.clienteId).toBeNull();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E4-4-2-API-3 (P1) — Non-existent contacto id → 404 Problem Details RFC 7807 (AC #1, #3)
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E4-4-2-API-3: should return 404 Problem Details when PUT /api/v1/contactos/{id}/cliente with a non-existent contacto id', async ({ request }) => {
    // GIVEN: A UUID that does not correspond to any existing contact
    const nonExistentId = '00000000-0000-0000-0000-999999999999';

    // WHEN: PUT /api/v1/contactos/{nonExistentId}/cliente
    const response = await request.put(`${CONTACTOS_URL}/${nonExistentId}/cliente`, {
      data: { clienteId: null },
    });

    // THEN: Response status is 404 Not Found
    expect(response.status()).toBe(404);

    const body = await response.json() as { status?: number; title?: string };

    // AND: Response follows RFC 7807 Problem Details format
    expect(body.status).toBe(404);
    expect(typeof body.title).toBe('string');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E4-4-2-API-4 (P1) — Disassociated contact still exists in GET /api/v1/contactos (AC #3)
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E4-4-2-API-4: disassociated contact should still be retrievable via GET /api/v1/contactos after PUT with clienteId: null', async ({ request }) => {
    // GIVEN: A contact linked to a client
    const cliente = await seedCliente(request, { nombre: 'Cliente Para Verificar Registro' });
    createdClienteIds.push(cliente.id);

    const contacto = await seedContacto(request, {
      nombre: 'Contacto Persistente Post-Desasociacion',
      email: `persistente.${Date.now()}@empresa.co`,
      clienteId: cliente.id,
    });
    createdContactoIds.push(contacto.id);

    // WHEN: Disassociate the contact via PUT
    const putResponse = await request.put(`${CONTACTOS_URL}/${contacto.id}/cliente`, {
      data: { clienteId: null },
    });
    expect(putResponse.status()).toBe(200);

    // AND: GET /api/v1/contactos is called
    const getResponse = await request.get(CONTACTOS_URL);
    expect(getResponse.status()).toBe(200);

    const allContactos = await getResponse.json() as { id: string; clienteId: string | null }[];

    // THEN: The disassociated contact is still present in the full list (record preserved)
    const found = allContactos.find((c) => c.id === contacto.id);
    expect(found).toBeDefined();

    // AND: Its clienteId is now null
    expect(found!.clienteId).toBeNull();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E4-4-2-API-5 (P1) — Response shape includes all ContactoDto fields (AC #1)
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E4-4-2-API-5: should return ContactoDto with all required fields after successful association', async ({ request }) => {
    // GIVEN: An orphan contact and a client
    const cliente = await seedCliente(request, { nombre: 'Cliente Shape Verificar' });
    createdClienteIds.push(cliente.id);

    const contacto = await seedContacto(request, {
      nombre: 'Contacto Shape Verificar',
      email: `shape.42.${Date.now()}@empresa.co`,
      cargo: 'Directora de Operaciones',
      clienteId: null,
    });
    createdContactoIds.push(contacto.id);

    // WHEN: PUT /api/v1/contactos/{id}/cliente with clienteId
    const response = await request.put(`${CONTACTOS_URL}/${contacto.id}/cliente`, {
      data: { clienteId: cliente.id },
    });
    expect(response.status()).toBe(200);

    const body = await response.json() as Record<string, unknown>;

    // THEN: Response contains all ContactoDto fields
    expect(Object.keys(body)).toEqual(
      expect.arrayContaining(['id', 'nombre', 'cargo', 'telefono', 'email', 'clienteId', 'createdAt', 'updatedAt'])
    );

    // AND: Audit timestamps are DateTimeOffset strings
    expect(typeof body['createdAt']).toBe('string');
    expect(typeof body['updatedAt']).toBe('string');

    // AND: updatedAt has been updated (not equal to createdAt after assignment)
    // (Server sets updatedAt = DateTimeOffset.UtcNow in AssignCliente domain method)
    expect(body['updatedAt']).toBeDefined();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Extra: PUT is idempotent — associating same clienteId twice still returns 200 (AC #1)
  // ─────────────────────────────────────────────────────────────────────────

  test('should return 200 OK when PUT /api/v1/contactos/{id}/cliente is called twice with the same clienteId (idempotent)', async ({ request }) => {
    // GIVEN: A contact linked to a client
    const cliente = await seedCliente(request, { nombre: 'Cliente Idempotent Test' });
    createdClienteIds.push(cliente.id);

    const contacto = await seedContacto(request, {
      nombre: 'Contacto Idempotent Test',
      email: `idempotent.${Date.now()}@empresa.co`,
      clienteId: cliente.id,
    });
    createdContactoIds.push(contacto.id);

    // WHEN: PUT is called a second time with the same clienteId
    const response = await request.put(`${CONTACTOS_URL}/${contacto.id}/cliente`, {
      data: { clienteId: cliente.id },
    });

    // THEN: Second call also returns 200 OK (idempotent)
    expect(response.status()).toBe(200);

    const body = await response.json() as { clienteId: string | null };
    expect(body.clienteId).toBe(cliente.id);
  });
});

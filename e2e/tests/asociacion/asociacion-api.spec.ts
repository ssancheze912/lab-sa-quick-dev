import { test, expect } from '@playwright/test';

/**
 * ATDD — Story 4.1: View Associated Contacts in Client Detail
 * API Integration Tests
 *
 * RED Phase — Tests intentionally fail until backend implementation is complete.
 *
 * Coverage:
 *   API-AC-07  P1  — GET /api/v1/contactos?clienteId={id} returns ONLY the
 *                    contacts belonging to that client (server-side filtering)
 *                    (AC1, AC2, AC3)
 */

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

test.describe('Story 4.1 — API: GET /api/v1/contactos?clienteId={id}', () => {
  const createdClienteIds: string[] = [];
  const createdContactoIds: string[] = [];

  test.afterEach(async ({ request }) => {
    for (const id of createdContactoIds) {
      await request.delete(`${API_BASE_URL}/api/v1/contactos/${id}`).catch(() => null);
    }
    for (const id of createdClienteIds) {
      await request.delete(`${API_BASE_URL}/api/v1/clientes/${id}`).catch(() => null);
    }
    createdContactoIds.length = 0;
    createdClienteIds.length = 0;
  });

  // ---------------------------------------------------------------------------
  // API-AC-07 (P1 · AC1)
  // Given a client exists with 2 associated contacts
  //   AND a 3rd contact associated with a different client (or no client)
  // When GET /api/v1/contactos?clienteId={clienteId} is called
  // Then the response is 200 OK
  //   AND the body is a JSON array containing ONLY the 2 contacts for that client
  //   AND the 3rd contact (from another client) is NOT included
  //   AND each item contains the complete ContactoDto contract (id, nombre, cargo,
  //       telefono, email, clienteId, createdAt, updatedAt)
  //   AND clienteId in each item matches the requested clienteId
  // ---------------------------------------------------------------------------
  test('API-AC-07 — GET /api/v1/contactos?clienteId={id} devuelve solo los contactos de ese cliente', async ({ request }) => {
    // GIVEN — Create the target client
    const clienteResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        nombre: `Cliente API-AC-07 ${Date.now()}`,
        nit: `88${Date.now().toString().slice(-9)}`,
        telefono: '+57 1 234 5678',
        ciudad: 'Bogotá',
      },
    });
    expect(clienteResponse.status()).toBe(201);
    const cliente = await clienteResponse.json();
    createdClienteIds.push(cliente.id);

    // AND — Create another client (to isolate contacts)
    const otroClienteResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        nombre: `Otro Cliente API-AC-07 ${Date.now()}`,
        nit: `89${Date.now().toString().slice(-9)}`,
        telefono: '+57 1 234 5679',
        ciudad: 'Medellín',
      },
    });
    expect(otroClienteResponse.status()).toBe(201);
    const otroCliente = await otroClienteResponse.json();
    createdClienteIds.push(otroCliente.id);

    // AND — Create 2 contacts associated with the target client
    const contacto1Response = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
      data: {
        nombre: `Contacto AC-07-A ${Date.now()}`,
        email: `ac07a.${Date.now()}@ejemplo.co`,
        cargo: 'Gerente',
        clienteId: cliente.id,
      },
    });
    expect(contacto1Response.status()).toBe(201);
    const contacto1 = await contacto1Response.json();
    createdContactoIds.push(contacto1.id);

    const contacto2Response = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
      data: {
        nombre: `Contacto AC-07-B ${Date.now()}`,
        email: `ac07b.${Date.now()}@ejemplo.co`,
        cargo: 'Analista',
        clienteId: cliente.id,
      },
    });
    expect(contacto2Response.status()).toBe(201);
    const contacto2 = await contacto2Response.json();
    createdContactoIds.push(contacto2.id);

    // AND — Create a 3rd contact associated with a DIFFERENT client
    const contactoOtroResponse = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
      data: {
        nombre: `Contacto Otro Cliente ${Date.now()}`,
        email: `otro.${Date.now()}@ejemplo.co`,
        cargo: 'Director',
        clienteId: otroCliente.id,
      },
    });
    expect(contactoOtroResponse.status()).toBe(201);
    const contactoOtro = await contactoOtroResponse.json();
    createdContactoIds.push(contactoOtro.id);

    // WHEN — GET /api/v1/contactos?clienteId={clienteId}
    const response = await request.get(
      `${API_BASE_URL}/api/v1/contactos?clienteId=${cliente.id}`
    );

    // THEN — response is 200 OK
    expect(response.status()).toBe(200);

    // AND — body is a direct JSON array (no wrapper object)
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);

    // AND — array contains exactly 2 items (the contacts for this client)
    expect(body).toHaveLength(2);

    // AND — the 3rd contact (from another client) is NOT present
    const returnedIds = body.map((c: { id: string }) => c.id);
    expect(returnedIds).not.toContain(contactoOtro.id);

    // AND — each item matches the complete ContactoDto contract
    for (const item of body) {
      // id must be a UUID v4 string
      expect(typeof item.id).toBe('string');
      expect(item.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );

      // nombre and email must be non-empty strings
      expect(typeof item.nombre).toBe('string');
      expect(item.nombre.length).toBeGreaterThan(0);

      expect(typeof item.email).toBe('string');
      expect(item.email.length).toBeGreaterThan(0);

      // clienteId must match the requested clienteId (server-side filter validated)
      expect(item.clienteId).toBe(cliente.id);

      // createdAt must be ISO 8601 with timezone (DateTimeOffset — not plain DateTime)
      expect(typeof item.createdAt).toBe('string');
      expect(item.createdAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
      );

      // updatedAt must be ISO 8601 with timezone
      expect(typeof item.updatedAt).toBe('string');
      expect(item.updatedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
      );

      // Response must NOT be a wrapper object
      expect((body as Record<string, unknown>).data).toBeUndefined();
    }
  });

  // ---------------------------------------------------------------------------
  // API-AC-07b (P1 · AC2)
  // Given a client exists with NO associated contacts
  // When GET /api/v1/contactos?clienteId={clienteId} is called
  // Then the response is 200 OK with an empty JSON array
  //   AND the response is NOT a 404 (client exists, just no contacts)
  // ---------------------------------------------------------------------------
  test('API-AC-07b — GET /api/v1/contactos?clienteId={id} devuelve array vacío cuando el cliente no tiene contactos', async ({ request }) => {
    // GIVEN — Create a client with no contacts
    const clienteResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        nombre: `Cliente Sin Contactos ${Date.now()}`,
        nit: `87${Date.now().toString().slice(-9)}`,
        telefono: '+57 1 000 0000',
        ciudad: 'Cali',
      },
    });
    expect(clienteResponse.status()).toBe(201);
    const cliente = await clienteResponse.json();
    createdClienteIds.push(cliente.id);

    // WHEN — GET /api/v1/contactos?clienteId={clienteId} (no contacts associated)
    const response = await request.get(
      `${API_BASE_URL}/api/v1/contactos?clienteId=${cliente.id}`
    );

    // THEN — response is 200 OK (not 404 — client exists but has 0 contacts)
    expect(response.status()).toBe(200);

    // AND — body is an empty array
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(0);
  });

  // ---------------------------------------------------------------------------
  // API-AC-07c (P1 · Contract Guard)
  // Given a valid clienteId query parameter is provided
  // When GET /api/v1/contactos?clienteId={id} is called
  // Then the response Content-Type is application/json
  //   AND the response is NOT a Problem Details object (not an error)
  //   AND the endpoint does NOT return the global contacts list (no clienteId filter bypass)
  // ---------------------------------------------------------------------------
  test('API-AC-07c — GET /api/v1/contactos?clienteId={id} devuelve Content-Type application/json y no filtra por clienteId globalmente', async ({ request }) => {
    // GIVEN — Create two clients each with a contact
    const cliente1Response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        nombre: `Cliente A AC-07c ${Date.now()}`,
        nit: `86${Date.now().toString().slice(-9)}`,
        ciudad: 'Barranquilla',
      },
    });
    expect(cliente1Response.status()).toBe(201);
    const cliente1 = await cliente1Response.json();
    createdClienteIds.push(cliente1.id);

    const cliente2Response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        nombre: `Cliente B AC-07c ${Date.now()}`,
        nit: `85${Date.now().toString().slice(-9)}`,
        ciudad: 'Cartagena',
      },
    });
    expect(cliente2Response.status()).toBe(201);
    const cliente2 = await cliente2Response.json();
    createdClienteIds.push(cliente2.id);

    // Create contact for cliente1
    const contacto1Response = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
      data: {
        nombre: `Contacto Cliente1 AC-07c ${Date.now()}`,
        email: `c1.ac07c.${Date.now()}@ejemplo.co`,
        clienteId: cliente1.id,
      },
    });
    expect(contacto1Response.status()).toBe(201);
    const contacto1 = await contacto1Response.json();
    createdContactoIds.push(contacto1.id);

    // Create contact for cliente2
    const contacto2Response = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
      data: {
        nombre: `Contacto Cliente2 AC-07c ${Date.now()}`,
        email: `c2.ac07c.${Date.now()}@ejemplo.co`,
        clienteId: cliente2.id,
      },
    });
    expect(contacto2Response.status()).toBe(201);
    const contacto2 = await contacto2Response.json();
    createdContactoIds.push(contacto2.id);

    // WHEN — GET /api/v1/contactos?clienteId={cliente1.id}
    const response = await request.get(
      `${API_BASE_URL}/api/v1/contactos?clienteId=${cliente1.id}`
    );

    // THEN — status 200
    expect(response.status()).toBe(200);

    // AND — Content-Type is application/json (not problem+json)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');
    expect(contentType).not.toContain('problem+json');

    // AND — body is an array (not a Problem Details object)
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.title).toBeUndefined();
    expect(body.status).toBeUndefined();

    // AND — response does NOT include cliente2's contact (filter is applied)
    const returnedIds = body.map((c: { id: string }) => c.id);
    expect(returnedIds).not.toContain(contacto2.id);
  });
});

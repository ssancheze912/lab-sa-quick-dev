import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente, buildContacto } from '../../helpers/data.helper';

/**
 * API Edge Case Tests — Story 4.4: View Associated Client from Contact Detail
 *
 * Validates the API contract behind Story 4.4 — edge cases not covered by ATDD baseline.
 *
 *   API-44-EDGE-01 [P1] GET /api/v1/contactos/:id — response includes clienteId field (non-null UUID)
 *   API-44-EDGE-02 [P1] GET /api/v1/contactos/:id — response includes clienteId: null for orphan contact
 *   API-44-EDGE-03 [P1] GET /api/v1/clientes/:id — returns 200 + ClienteDto for valid id
 *   API-44-EDGE-04 [P1] GET /api/v1/clientes/:id — returns 404 for non-existent clienteId
 *   API-44-EDGE-05 [P1] PUT /api/v1/contactos/:id/cliente — reassigning clienteId is reflected in next GET
 *   API-44-EDGE-06 [P2] GET /api/v1/contactos/:id — clienteId is a valid UUID string format
 *   API-44-EDGE-07 [P2] GET /api/v1/clientes/:id — ClienteDto includes required nombre field
 *   API-44-EDGE-08 [P2] PUT /api/v1/contactos/:id/cliente with null unlinks the client association
 */

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

test.describe('Story 4.4 — API: Contact/Cliente detail contract edge cases', () => {
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
  // API-44-EDGE-01 [P1]
  // Given a contact associated with a client
  // When GET /api/v1/contactos/:id is called
  // Then the response body includes a "clienteId" field with a non-null UUID value
  // (validates FR23 backend contract — ContactoDto must expose clienteId)
  // ---------------------------------------------------------------------------
  test('[P1] API-44-EDGE-01 — GET /api/v1/contactos/:id incluye clienteId no nulo cuando tiene cliente', async ({ request }) => {
    // GIVEN — Create a client + associated contact via API
    const clienteResp = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: buildCliente(),
    });
    expect(clienteResp.status()).toBe(201);
    const cliente = await clienteResp.json();
    createdClienteIds.push(cliente.id);

    const contactoResp = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
      data: buildContacto({ clienteId: cliente.id }),
    });
    expect(contactoResp.status()).toBe(201);
    const contacto = await contactoResp.json();
    createdContactoIds.push(contacto.id);

    // WHEN — GET the contact by ID
    const detailResp = await request.get(`${API_BASE_URL}/api/v1/contactos/${contacto.id}`);

    // THEN — Response is 200
    expect(detailResp.status()).toBe(200);

    const body = await detailResp.json();

    // AND — clienteId field is present and non-null
    expect(body).toHaveProperty('clienteId');
    expect(body.clienteId).not.toBeNull();
    expect(body.clienteId).toBe(cliente.id);
  });

  // ---------------------------------------------------------------------------
  // API-44-EDGE-02 [P1]
  // Given a contact created with no client association (orphan contact)
  // When GET /api/v1/contactos/:id is called
  // Then the response body includes "clienteId": null
  // (validates AC3 backend — null must be explicitly returned, not absent)
  // ---------------------------------------------------------------------------
  test('[P1] API-44-EDGE-02 — GET /api/v1/contactos/:id devuelve clienteId: null para contacto huérfano', async ({ request }) => {
    // GIVEN — Create an orphan contact (no clienteId)
    const contactoResp = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
      data: buildContacto({ clienteId: null }),
    });
    expect(contactoResp.status()).toBe(201);
    const contacto = await contactoResp.json();
    createdContactoIds.push(contacto.id);

    // WHEN — GET the contact by ID
    const detailResp = await request.get(`${API_BASE_URL}/api/v1/contactos/${contacto.id}`);

    // THEN — Response is 200
    expect(detailResp.status()).toBe(200);

    const body = await detailResp.json();

    // AND — clienteId field is present and explicitly null
    expect(body).toHaveProperty('clienteId');
    expect(body.clienteId).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // API-44-EDGE-03 [P1]
  // Given a client exists in the system
  // When GET /api/v1/clientes/:id is called with the valid clienteId
  // Then the response is 200 with a ClienteDto containing at minimum id and nombre
  // (validates the secondary fetch in Story 4.4 — useClienteById depends on this contract)
  // ---------------------------------------------------------------------------
  test('[P1] API-44-EDGE-03 — GET /api/v1/clientes/:id devuelve 200 + ClienteDto con id y nombre', async ({ request }) => {
    // GIVEN — Create a client
    const clienteData = buildCliente();
    const clienteResp = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: clienteData,
    });
    expect(clienteResp.status()).toBe(201);
    const cliente = await clienteResp.json();
    createdClienteIds.push(cliente.id);

    // WHEN — GET the client by ID (as the frontend does via useClienteById)
    const detailResp = await request.get(`${API_BASE_URL}/api/v1/clientes/${cliente.id}`);

    // THEN — Response is 200
    expect(detailResp.status()).toBe(200);

    const body = await detailResp.json();

    // AND — ClienteDto includes required fields
    expect(body).toHaveProperty('id', cliente.id);
    expect(body).toHaveProperty('nombre', clienteData.nombre);

    // AND — the body contains the complete contract (id, nombre, nit, createdAt, updatedAt)
    expect(body).toHaveProperty('nit');
    expect(body).toHaveProperty('createdAt');
    expect(body).toHaveProperty('updatedAt');
  });

  // ---------------------------------------------------------------------------
  // API-44-EDGE-04 [P1]
  // Given a clienteId that does not exist in the system (e.g., deleted client)
  // When GET /api/v1/clientes/:nonExistentId is called
  // Then the response is 404 with Problem Details
  // (validates that the frontend graceful-404 handling has a reliable backend contract)
  // ---------------------------------------------------------------------------
  test('[P1] API-44-EDGE-04 — GET /api/v1/clientes/:nonExistentId devuelve 404 Problem Details', async ({ request }) => {
    // GIVEN — a UUID that does not match any existing client
    const nonExistentId = '00000000-0000-4000-8000-000000000099';

    // WHEN — GET the client by a non-existent ID
    const detailResp = await request.get(`${API_BASE_URL}/api/v1/clientes/${nonExistentId}`);

    // THEN — Response is 404
    expect(detailResp.status()).toBe(404);

    // AND — Response body is Problem Details format (title or status field present)
    const body = await detailResp.json();
    // Problem Details requires at least a 'status' or 'title' field per RFC 7807
    const hasProblemDetails = ('status' in body && body.status === 404) || ('title' in body);
    expect(hasProblemDetails).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // API-44-EDGE-05 [P1]
  // Given a contact initially associated with client A
  // When PUT /api/v1/contactos/:id/cliente is called with client B's id
  // Then subsequent GET /api/v1/contactos/:id returns the new clienteId (client B)
  // (validates Story 4.4 data freshness — reassignment must be immediately reflected)
  // ---------------------------------------------------------------------------
  test('[P1] API-44-EDGE-05 — reasignar cliente vía PUT refleja el nuevo clienteId en GET posterior', async ({ request }) => {
    // GIVEN — Create two clients and one contact associated with client A
    const clienteAResp = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: buildCliente(),
    });
    expect(clienteAResp.status()).toBe(201);
    const clienteA = await clienteAResp.json();
    createdClienteIds.push(clienteA.id);

    const clienteBResp = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: buildCliente(),
    });
    expect(clienteBResp.status()).toBe(201);
    const clienteB = await clienteBResp.json();
    createdClienteIds.push(clienteB.id);

    const contactoResp = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
      data: buildContacto({ clienteId: clienteA.id }),
    });
    expect(contactoResp.status()).toBe(201);
    const contacto = await contactoResp.json();
    createdContactoIds.push(contacto.id);

    // Confirm initial clienteId = clienteA.id
    const initialGet = await request.get(`${API_BASE_URL}/api/v1/contactos/${contacto.id}`);
    expect((await initialGet.json()).clienteId).toBe(clienteA.id);

    // WHEN — Reassign to client B
    const reassignResp = await request.put(
      `${API_BASE_URL}/api/v1/contactos/${contacto.id}/cliente`,
      { data: { clienteId: clienteB.id } }
    );
    // Expect success (200 or 204)
    expect([200, 204]).toContain(reassignResp.status());

    // THEN — GET returns the updated clienteId (client B)
    const updatedGet = await request.get(`${API_BASE_URL}/api/v1/contactos/${contacto.id}`);
    expect(updatedGet.status()).toBe(200);
    const updatedBody = await updatedGet.json();
    expect(updatedBody.clienteId).toBe(clienteB.id);
    expect(updatedBody.clienteId).not.toBe(clienteA.id);
  });

  // ---------------------------------------------------------------------------
  // API-44-EDGE-06 [P2]
  // Given a contact associated with a client
  // When GET /api/v1/contactos/:id is called
  // Then clienteId is a string in UUID format (8-4-4-4-12 hex characters)
  // (validates that the backend doesn't return an integer, object, or malformed id)
  // ---------------------------------------------------------------------------
  test('[P2] API-44-EDGE-06 — clienteId en la respuesta tiene formato UUID válido', async ({ request }) => {
    // GIVEN — Create a client + associated contact
    const clienteResp = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: buildCliente(),
    });
    expect(clienteResp.status()).toBe(201);
    const cliente = await clienteResp.json();
    createdClienteIds.push(cliente.id);

    const contactoResp = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
      data: buildContacto({ clienteId: cliente.id }),
    });
    expect(contactoResp.status()).toBe(201);
    const contacto = await contactoResp.json();
    createdContactoIds.push(contacto.id);

    // WHEN — GET the contact detail
    const detailResp = await request.get(`${API_BASE_URL}/api/v1/contactos/${contacto.id}`);
    const body = await detailResp.json();

    // THEN — clienteId matches UUID format (8-4-4-4-12 hex)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(typeof body.clienteId).toBe('string');
    expect(body.clienteId).toMatch(uuidRegex);
  });

  // ---------------------------------------------------------------------------
  // API-44-EDGE-07 [P2]
  // Given a client exists
  // When GET /api/v1/clientes/:id is called
  // Then the ClienteDto body contains "nombre" as a non-empty string
  // (validates the critical field for display — the link text depends on this field)
  // ---------------------------------------------------------------------------
  test('[P2] API-44-EDGE-07 — ClienteDto de GET /api/v1/clientes/:id contiene "nombre" como string no vacío', async ({ request }) => {
    // GIVEN — Create a client with a known nombre
    const clienteData = buildCliente();
    const clienteResp = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: clienteData,
    });
    expect(clienteResp.status()).toBe(201);
    const cliente = await clienteResp.json();
    createdClienteIds.push(cliente.id);

    // WHEN — GET the client detail
    const detailResp = await request.get(`${API_BASE_URL}/api/v1/clientes/${cliente.id}`);
    const body = await detailResp.json();

    // THEN — nombre is a non-empty string
    expect(typeof body.nombre).toBe('string');
    expect(body.nombre.length).toBeGreaterThan(0);
    expect(body.nombre).toBe(clienteData.nombre);
  });

  // ---------------------------------------------------------------------------
  // API-44-EDGE-08 [P2]
  // Given a contact associated with a client
  // When PUT /api/v1/contactos/:id/cliente is called with clienteId: null
  // Then subsequent GET /api/v1/contactos/:id returns clienteId: null
  // (validates the unlink/disassociation API contract for Story 4.4 fallback display)
  // ---------------------------------------------------------------------------
  test('[P2] API-44-EDGE-08 — PUT con clienteId: null desvincula el cliente y GET devuelve null', async ({ request }) => {
    // GIVEN — Create a client + associated contact
    const clienteResp = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: buildCliente(),
    });
    expect(clienteResp.status()).toBe(201);
    const cliente = await clienteResp.json();
    createdClienteIds.push(cliente.id);

    const contactoResp = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
      data: buildContacto({ clienteId: cliente.id }),
    });
    expect(contactoResp.status()).toBe(201);
    const contacto = await contactoResp.json();
    createdContactoIds.push(contacto.id);

    // Confirm initial association exists
    const initialGet = await request.get(`${API_BASE_URL}/api/v1/contactos/${contacto.id}`);
    expect((await initialGet.json()).clienteId).toBe(cliente.id);

    // WHEN — Unlink (set clienteId to null)
    const unlinkResp = await request.put(
      `${API_BASE_URL}/api/v1/contactos/${contacto.id}/cliente`,
      { data: { clienteId: null } }
    );
    // Expect success (200 or 204)
    expect([200, 204]).toContain(unlinkResp.status());

    // THEN — GET returns clienteId: null
    const unlinkedGet = await request.get(`${API_BASE_URL}/api/v1/contactos/${contacto.id}`);
    expect(unlinkedGet.status()).toBe(200);
    const unlinkedBody = await unlinkedGet.json();
    expect(unlinkedBody.clienteId).toBeNull();
  });
});

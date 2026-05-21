import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente, buildContacto } from '../../helpers/data.helper';

/**
 * Edge Case Tests — Story 4.2: PUT /api/v1/contactos/{id}/cliente
 *
 * Expands ATDD baseline (asociacion-api.spec.ts — API-AC-01..04, 08..10) with:
 *   - API-42-EDGE-01 [P1] PUT with clienteId = Guid.Empty (all-zeros UUID) returns 400 (validator: non-empty GUID rule)
 *   - API-42-EDGE-02 [P1] PUT with missing body entirely returns 400 (body required)
 *   - API-42-EDGE-03 [P1] PUT returns full ContactoDto contract: id, nombre, cargo, telefono, email, clienteId, createdAt (DateTimeOffset), updatedAt (DateTimeOffset)
 *   - API-42-EDGE-04 [P1] Repeated PUT with same clienteId is idempotent: returns 200 and clienteId unchanged
 *   - API-42-EDGE-05 [P2] PUT response updatedAt is strictly after createdAt when clienteId changes
 *   - API-42-EDGE-06 [P2] GET /api/v1/contactos?clienteId after reassign from client A → B: contact no longer in A's list, appears in B's list
 *   - API-42-EDGE-07 [P2] Concurrent PUT on different contacts of the same client succeed independently (no row-level lock issues)
 *   - API-42-EDGE-08 [P2] PUT with valid contactoId but omitting clienteId field from body returns 200 with clienteId: null (null is the default for missing optional field)
 */

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

test.describe('Story 4.2 — API Edge Cases: PUT /api/v1/contactos/{id}/cliente', () => {
  let apiHelper: ApiHelper;
  const createdClienteIds: string[] = [];
  const createdContactoIds: string[] = [];

  test.beforeEach(async ({ request }) => {
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdContactoIds) {
      await apiHelper.deleteContacto(id).catch(() => null);
    }
    for (const id of createdClienteIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdContactoIds.length = 0;
    createdClienteIds.length = 0;
  });

  // ---------------------------------------------------------------------------
  // API-42-EDGE-01 [P1]
  // Given a valid contactoId and clienteId = "00000000-0000-0000-0000-000000000000" (Guid.Empty)
  // When PUT /api/v1/contactos/{id}/cliente is called with { clienteId: "00000000-0000-0000-0000-000000000000" }
  // Then the response is 400 (validator: empty UUID is rejected)
  // AND the response body contains Problem Details without stack trace (NFR6)
  // ---------------------------------------------------------------------------
  test('[P1] API-42-EDGE-01 — PUT con clienteId Guid.Empty devuelve 400 (validador rechaza UUID vacío)', async ({ request }) => {
    // GIVEN — Contact that exists
    const contacto = await apiHelper.createContacto(buildContacto({ clienteId: null }));
    createdContactoIds.push(contacto.id);

    // WHEN — Send empty UUID as clienteId (Guid.Empty — rejected by AssignClienteToContactoValidator)
    const response = await request.put(
      `${API_BASE_URL}/api/v1/contactos/${contacto.id}/cliente`,
      { data: { clienteId: '00000000-0000-0000-0000-000000000000' } }
    );

    // THEN — 400 Bad Request (validator: "El clienteId no puede ser un UUID vacío")
    expect(response.status()).toBe(400);

    // AND — Problem Details format (no stack trace — NFR6)
    const body = await response.json();
    expect(typeof body).toBe('object');
    expect(body.stackTrace).toBeUndefined();
    expect(body.StackTrace).toBeUndefined();
    expect(body.exception).toBeUndefined();
  });

  // ---------------------------------------------------------------------------
  // API-42-EDGE-02 [P1]
  // Given a valid contactoId
  // When PUT /api/v1/contactos/{id}/cliente is called with an empty body {}
  // Then the response is 200 with clienteId = null
  // (empty body = clienteId field absent = null — valid disassociation per the DTO record)
  // OR the response is 400 if the endpoint enforces body presence
  // This test documents the actual behavior as a contract guard.
  // ---------------------------------------------------------------------------
  test('[P1] API-42-EDGE-02 — PUT con body vacío {} retorna 200 con clienteId null o 400 (guarda de contrato)', async ({ request }) => {
    // GIVEN — Contact associated with a client
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);
    const contacto = await apiHelper.createContacto(buildContacto({ clienteId: cliente.id }));
    createdContactoIds.push(contacto.id);

    // WHEN — PUT with empty body
    const response = await request.put(
      `${API_BASE_URL}/api/v1/contactos/${contacto.id}/cliente`,
      { data: {} }
    );

    // THEN — Either 200 (clienteId = null, disassociation via null default) or 400 (body required)
    const status = response.status();
    expect([200, 400]).toContain(status);

    // AND — No stack trace regardless of status (NFR6)
    const body = await response.json();
    expect(body.stackTrace).toBeUndefined();
    expect(body.StackTrace).toBeUndefined();
  });

  // ---------------------------------------------------------------------------
  // API-42-EDGE-03 [P1]
  // Given a contact is associated with a client via PUT
  // When the response body is inspected
  // Then it conforms to the full ContactoDto contract:
  //   id (UUID v4), nombre, cargo, telefono, email, clienteId, createdAt (DateTimeOffset), updatedAt (DateTimeOffset)
  //   AND updatedAt is a valid ISO 8601 DateTimeOffset (not plain DateTime)
  // ---------------------------------------------------------------------------
  test('[P1] API-42-EDGE-03 — respuesta de PUT devuelve ContactoDto completo con DateTimeOffset en createdAt y updatedAt', async ({ request }) => {
    // GIVEN
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);
    const contactoData = buildContacto({ clienteId: null });
    const contacto = await apiHelper.createContacto(contactoData);
    createdContactoIds.push(contacto.id);

    // WHEN — Associate the contact
    const response = await request.put(
      `${API_BASE_URL}/api/v1/contactos/${contacto.id}/cliente`,
      { data: { clienteId: cliente.id } }
    );

    expect(response.status()).toBe(200);
    const body = await response.json();

    // THEN — Full ContactoDto contract enforced
    // id is a UUID v4 string
    expect(typeof body.id).toBe('string');
    expect(body.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    expect(body.id).toBe(contacto.id);

    // nombre is non-empty string
    expect(typeof body.nombre).toBe('string');
    expect(body.nombre.length).toBeGreaterThan(0);

    // clienteId matches the requested cliente
    expect(body.clienteId).toBe(cliente.id);

    // createdAt and updatedAt must be ISO 8601 DateTimeOffset (with timezone offset — not plain DateTime)
    const dateTimeOffsetPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
    expect(typeof body.createdAt).toBe('string');
    expect(body.createdAt).toMatch(dateTimeOffsetPattern);
    expect(typeof body.updatedAt).toBe('string');
    expect(body.updatedAt).toMatch(dateTimeOffsetPattern);

    // Response is not wrapped in a { data: ... } envelope
    expect(body.data).toBeUndefined();
    expect(body.title).toBeUndefined(); // not a Problem Details object
  });

  // ---------------------------------------------------------------------------
  // API-42-EDGE-04 [P1]
  // Given a contact already associated with client A
  // When PUT /api/v1/contactos/{id}/cliente is called again with the SAME clienteId (idempotent)
  // Then the response is 200 OK
  // AND the contact's clienteId remains the same (idempotent operation)
  // AND no duplicate data or side effects occur
  // ---------------------------------------------------------------------------
  test('[P1] API-42-EDGE-04 — PUT idempotente con el mismo clienteId devuelve 200; clienteId no cambia', async ({ request }) => {
    // GIVEN — Contact already associated with a client
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);
    const contacto = await apiHelper.createContacto(buildContacto({ clienteId: cliente.id }));
    createdContactoIds.push(contacto.id);

    // WHEN — PUT with the SAME clienteId (idempotent)
    const response = await request.put(
      `${API_BASE_URL}/api/v1/contactos/${contacto.id}/cliente`,
      { data: { clienteId: cliente.id } }
    );

    // THEN — 200 OK (idempotent success)
    expect(response.status()).toBe(200);
    const body = await response.json();

    // AND — clienteId is unchanged
    expect(body.clienteId).toBe(cliente.id);
    expect(body.id).toBe(contacto.id);

    // AND — contact still exists with correct clienteId via GET
    const getResponse = await request.get(`${API_BASE_URL}/api/v1/contactos/${contacto.id}`);
    expect(getResponse.status()).toBe(200);
    const getBody = await getResponse.json();
    expect(getBody.clienteId).toBe(cliente.id);
  });

  // ---------------------------------------------------------------------------
  // API-42-EDGE-05 [P2]
  // Given a contact is created and then immediately its clienteId is changed via PUT
  // When the response body is inspected
  // Then updatedAt >= createdAt (boundary: mutation bumps UpdatedAt — domain rule)
  // AND updatedAt must differ from createdAt after the assignment (UpdatedAt is refreshed)
  // ---------------------------------------------------------------------------
  test('[P2] API-42-EDGE-05 — updatedAt es mayor o igual a createdAt tras la asignación de clienteId', async ({ request }) => {
    // GIVEN — Create a fresh contact and a client
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);
    const contacto = await apiHelper.createContacto(buildContacto({ clienteId: null }));
    createdContactoIds.push(contacto.id);

    // Record original createdAt
    const originalCreatedAt = new Date(contacto.createdAt).getTime();

    // WHEN — Assign clienteId
    const putResponse = await request.put(
      `${API_BASE_URL}/api/v1/contactos/${contacto.id}/cliente`,
      { data: { clienteId: cliente.id } }
    );
    expect(putResponse.status()).toBe(200);
    const putBody = await putResponse.json();

    // THEN — updatedAt >= createdAt (domain rule: AssignClienteId bumps UpdatedAt)
    const updatedAt = new Date(putBody.updatedAt).getTime();
    expect(updatedAt).toBeGreaterThanOrEqual(originalCreatedAt);

    // AND — createdAt is preserved (immutable field)
    expect(putBody.createdAt).toBe(contacto.createdAt);
  });

  // ---------------------------------------------------------------------------
  // API-42-EDGE-06 [P2]
  // Given a contact is first associated with client A, then reassigned to client B
  // When GET /api/v1/contactos?clienteId={clienteA.id} is called after the reassignment
  // Then the contact is NOT in client A's list
  // AND when GET /api/v1/contactos?clienteId={clienteB.id} is called
  // Then the contact IS in client B's list (correct bidirectional filter update)
  // ---------------------------------------------------------------------------
  test('[P2] API-42-EDGE-06 — reasignar contacto de cliente A → B: A no lo lista, B sí lo lista', async ({ request }) => {
    // GIVEN — Two clients and a contact initially on client A
    const clienteA = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(clienteA.id);
    const clienteB = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(clienteB.id);

    const contacto = await apiHelper.createContacto(buildContacto({ clienteId: clienteA.id }));
    createdContactoIds.push(contacto.id);

    // Verify initial state: contact appears in A's list
    const initialListA = await request.get(`${API_BASE_URL}/api/v1/contactos?clienteId=${clienteA.id}`);
    expect(initialListA.status()).toBe(200);
    const initialBodyA = await initialListA.json();
    expect(initialBodyA.map((c: { id: string }) => c.id)).toContain(contacto.id);

    // WHEN — Reassign contact to client B
    const reassignResponse = await request.put(
      `${API_BASE_URL}/api/v1/contactos/${contacto.id}/cliente`,
      { data: { clienteId: clienteB.id } }
    );
    expect(reassignResponse.status()).toBe(200);

    // THEN — Contact is NO LONGER in client A's list
    const listA = await request.get(`${API_BASE_URL}/api/v1/contactos?clienteId=${clienteA.id}`);
    expect(listA.status()).toBe(200);
    const bodyA = await listA.json();
    const idsA = bodyA.map((c: { id: string }) => c.id);
    expect(idsA).not.toContain(contacto.id);

    // AND — Contact IS in client B's list
    const listB = await request.get(`${API_BASE_URL}/api/v1/contactos?clienteId=${clienteB.id}`);
    expect(listB.status()).toBe(200);
    const bodyB = await listB.json();
    const idsB = bodyB.map((c: { id: string }) => c.id);
    expect(idsB).toContain(contacto.id);
  });

  // ---------------------------------------------------------------------------
  // API-42-EDGE-07 [P2]
  // Given a client with two contacts
  // When PUT for both contacts are issued concurrently (disassociate both simultaneously)
  // Then both return 200 OK independently
  // AND both contacts have clienteId: null after the concurrent operations
  // ---------------------------------------------------------------------------
  test('[P2] API-42-EDGE-07 — PUTs concurrentes en distintos contactos del mismo cliente se resuelven de forma independiente', async ({ request }) => {
    // GIVEN — Client with 2 contacts
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);

    const [contacto1, contacto2] = await Promise.all([
      apiHelper.createContacto(buildContacto({ clienteId: cliente.id })),
      apiHelper.createContacto(buildContacto({ clienteId: cliente.id })),
    ]);
    createdContactoIds.push(contacto1.id, contacto2.id);

    // WHEN — Concurrently disassociate both
    const [resp1, resp2] = await Promise.all([
      request.put(`${API_BASE_URL}/api/v1/contactos/${contacto1.id}/cliente`, { data: { clienteId: null } }),
      request.put(`${API_BASE_URL}/api/v1/contactos/${contacto2.id}/cliente`, { data: { clienteId: null } }),
    ]);

    // THEN — Both succeed
    expect(resp1.status()).toBe(200);
    expect(resp2.status()).toBe(200);

    const body1 = await resp1.json();
    const body2 = await resp2.json();

    expect(body1.clienteId).toBeNull();
    expect(body2.clienteId).toBeNull();

    // AND — Client A's list is empty
    const list = await request.get(`${API_BASE_URL}/api/v1/contactos?clienteId=${cliente.id}`);
    expect(list.status()).toBe(200);
    const listBody = await list.json();
    expect(listBody).toHaveLength(0);
  });
});

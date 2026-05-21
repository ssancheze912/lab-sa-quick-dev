import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente, buildContacto } from '../../helpers/data.helper';

/**
 * API Edge Case Tests — Story 4.6: Reassign Contact to Different Client
 *
 * Expands the ATDD baseline (asociacion-api.spec.ts — API-AC-05) with reassignment-specific
 * edge cases that the happy path does not cover:
 *
 *   API-46-EDGE-01 [P1] Reassigning to the SAME clienteId returns 200 and preserves clienteId (idempotency)
 *   API-46-EDGE-02 [P1] Reassigning to a NON-EXISTENT clienteId returns 4xx (no orphan reference)
 *   API-46-EDGE-03 [P1] Reassigning back-and-forth (A → B → A) leaves the contact on A
 *   API-46-EDGE-04 [P1] Reassignment updates the updatedAt timestamp (boundary: monotonically increases)
 *   API-46-EDGE-05 [P2] PUT /cliente with malformed body returns 400 with Problem Details (no stack trace, NFR6)
 *   API-46-EDGE-06 [P2] Reassignment moves the contact in GET /contactos?clienteId={old} → {new} filter results
 */

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

test.describe('Story 4.6 — API Edge: PUT /api/v1/contactos/{id}/cliente (reassignment)', () => {
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
  // API-46-EDGE-01 [P1]
  // Given a contacto associated with cliente A
  // When PUT /cliente is called with { clienteId: clienteA.id } (same client)
  // Then response is 200 OK with clienteId === clienteA.id (idempotent operation)
  // (Backend should not error out — frontend filters this out in the UI but the API must be permissive)
  // ---------------------------------------------------------------------------
  test('[P1] API-46-EDGE-01 — PUT /cliente con el mismo clienteId actual devuelve 200 y mantiene la asociación', async ({ request }) => {
    // GIVEN
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);
    const contacto = await apiHelper.createContacto(buildContacto({ clienteId: cliente.id }));
    createdContactoIds.push(contacto.id);

    // WHEN — Reassign to the same client
    const response = await request.put(
      `${API_BASE_URL}/api/v1/contactos/${contacto.id}/cliente`,
      { data: { clienteId: cliente.id } }
    );

    // THEN — 200 OK, clienteId unchanged
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.id).toBe(contacto.id);
    expect(body.clienteId).toBe(cliente.id);
  });

  // ---------------------------------------------------------------------------
  // API-46-EDGE-02 [P1]
  // Given a contacto associated with cliente A
  // When PUT /cliente is called with { clienteId: <non-existent UUID> }
  // Then response is a client-error status (400 or 404) — NOT 200 — and clienteId is NOT updated
  // (Prevents orphan FK reference — backend must validate clienteId existence)
  // ---------------------------------------------------------------------------
  test('[P1] API-46-EDGE-02 — PUT /cliente con clienteId inexistente devuelve 4xx y no modifica el contacto', async ({ request }) => {
    // GIVEN
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);
    const contacto = await apiHelper.createContacto(buildContacto({ clienteId: cliente.id }));
    createdContactoIds.push(contacto.id);

    const nonExistentClienteId = '00000000-0000-4000-8000-000000000999';

    // WHEN — Attempt reassignment to non-existent client
    const response = await request.put(
      `${API_BASE_URL}/api/v1/contactos/${contacto.id}/cliente`,
      { data: { clienteId: nonExistentClienteId } }
    );

    // THEN — Status is in the 4xx range (Bad Request or Not Found)
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);

    // AND — Body is Problem Details (no stack trace exposed, NFR6)
    const body = await response.json();
    expect(body.stackTrace).toBeUndefined();
    expect(body.StackTrace).toBeUndefined();
    expect(body.exception).toBeUndefined();

    // AND — Contact still belongs to cliente A (server-side validation prevented the change)
    const verifyGet = await request.get(`${API_BASE_URL}/api/v1/contactos/${contacto.id}`);
    expect(verifyGet.status()).toBe(200);
    const verifyBody = await verifyGet.json();
    expect(verifyBody.clienteId).toBe(cliente.id);
  });

  // ---------------------------------------------------------------------------
  // API-46-EDGE-03 [P1]
  // Given a contacto associated with cliente A and a separate cliente B
  // When the contact is reassigned A → B and then B → A
  // Then the final state has clienteId === clienteA.id
  // (Validates that reassignment is reversible without state corruption)
  // ---------------------------------------------------------------------------
  test('[P1] API-46-EDGE-03 — reasignación de A → B → A deja al contacto en A (estado final consistente)', async ({ request }) => {
    // GIVEN
    const clienteA = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(clienteA.id);
    const clienteB = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(clienteB.id);
    const contacto = await apiHelper.createContacto(buildContacto({ clienteId: clienteA.id }));
    createdContactoIds.push(contacto.id);

    // WHEN — Reassign A → B
    const respAtoB = await request.put(
      `${API_BASE_URL}/api/v1/contactos/${contacto.id}/cliente`,
      { data: { clienteId: clienteB.id } }
    );
    expect(respAtoB.status()).toBe(200);
    expect((await respAtoB.json()).clienteId).toBe(clienteB.id);

    // AND — Reassign B → A
    const respBtoA = await request.put(
      `${API_BASE_URL}/api/v1/contactos/${contacto.id}/cliente`,
      { data: { clienteId: clienteA.id } }
    );
    expect(respBtoA.status()).toBe(200);

    // THEN — Final clienteId is clienteA.id
    const verifyGet = await request.get(`${API_BASE_URL}/api/v1/contactos/${contacto.id}`);
    expect(verifyGet.status()).toBe(200);
    const verifyBody = await verifyGet.json();
    expect(verifyBody.clienteId).toBe(clienteA.id);
    expect(verifyBody.clienteId).not.toBe(clienteB.id);
  });

  // ---------------------------------------------------------------------------
  // API-46-EDGE-04 [P1]
  // Given a contacto associated with cliente A
  // When the contact is reassigned to cliente B
  // Then the response's updatedAt is greater than the pre-reassignment updatedAt
  // (Boundary: timestamp progression on mutation — supports cache invalidation policies)
  // ---------------------------------------------------------------------------
  test('[P1] API-46-EDGE-04 — reasignación actualiza updatedAt (monotonically increases)', async ({ request }) => {
    // GIVEN
    const clienteA = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(clienteA.id);
    const clienteB = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(clienteB.id);
    const contacto = await apiHelper.createContacto(buildContacto({ clienteId: clienteA.id }));
    createdContactoIds.push(contacto.id);

    // Capture initial updatedAt
    const beforeGet = await request.get(`${API_BASE_URL}/api/v1/contactos/${contacto.id}`);
    const beforeBody = await beforeGet.json();
    const beforeUpdatedAt = new Date(beforeBody.updatedAt).getTime();

    // WHEN — Reassign A → B. The backend may use datetime granularity of up to 1 s,
    // so we poll the endpoint with the reassignment payload until the server reports a
    // newer updatedAt (deterministic alternative to a hard sleep — TEA standard).
    let reassignBody: { id: string; clienteId: string; updatedAt: string } | undefined;
    await expect
      .poll(
        async () => {
          const resp = await request.put(
            `${API_BASE_URL}/api/v1/contactos/${contacto.id}/cliente`,
            { data: { clienteId: clienteB.id } }
          );
          expect(resp.status()).toBe(200);
          reassignBody = await resp.json();
          return new Date(reassignBody!.updatedAt).getTime();
        },
        {
          message: 'updatedAt should advance after reassignment',
          timeout: 5_000,
          intervals: [200, 400, 800, 1200],
        }
      )
      .toBeGreaterThan(beforeUpdatedAt);

    if (!reassignBody) throw new Error('reassignBody was not populated');

    // THEN — updatedAt advanced (asserted above via expect.poll)
    const afterUpdatedAt = new Date(reassignBody.updatedAt).getTime();
    expect(afterUpdatedAt).toBeGreaterThan(beforeUpdatedAt);

    // AND — The format is ISO 8601 with timezone offset (DateTimeOffset — anti-pattern guard)
    expect(typeof reassignBody.updatedAt).toBe('string');
    expect(reassignBody.updatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
    );
  });

  // ---------------------------------------------------------------------------
  // API-46-EDGE-05 [P2]
  // When PUT /cliente is called with a malformed body (missing clienteId field)
  // Then response is 400 with Problem Details — no stack trace exposed (NFR6)
  // (Validates input contract enforcement; FR26 expects { clienteId: <uuid|null> })
  // ---------------------------------------------------------------------------
  test('[P2] API-46-EDGE-05 — PUT /cliente con body vacío devuelve 400 Problem Details sin stack trace', async ({ request }) => {
    // GIVEN
    const cliente = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(cliente.id);
    const contacto = await apiHelper.createContacto(buildContacto({ clienteId: cliente.id }));
    createdContactoIds.push(contacto.id);

    // WHEN — PUT with malformed body (empty object)
    const response = await request.put(
      `${API_BASE_URL}/api/v1/contactos/${contacto.id}/cliente`,
      { data: {} }
    );

    // THEN — 400 Bad Request
    expect(response.status()).toBe(400);

    // AND — Problem Details body without stack trace (NFR6)
    const body = await response.json();
    expect(body.stackTrace).toBeUndefined();
    expect(body.StackTrace).toBeUndefined();
    expect(body.exception).toBeUndefined();
  });

  // ---------------------------------------------------------------------------
  // API-46-EDGE-06 [P2]
  // Given a contacto associated with cliente A
  // When the contact is reassigned to cliente B
  // Then GET /contactos?clienteId=clienteA.id does NOT include the contact anymore
  //   AND GET /contactos?clienteId=clienteB.id DOES include the contact
  // (Backend filter must stay in sync with the new association)
  // ---------------------------------------------------------------------------
  test('[P2] API-46-EDGE-06 — reasignación cambia el contacto entre filtros GET ?clienteId={old} y {new}', async ({ request }) => {
    // GIVEN
    const clienteA = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(clienteA.id);
    const clienteB = await apiHelper.createCliente(buildCliente());
    createdClienteIds.push(clienteB.id);
    const contacto = await apiHelper.createContacto(buildContacto({ clienteId: clienteA.id }));
    createdContactoIds.push(contacto.id);

    // Confirm contact is in client A's filter before reassignment
    const beforeA = await request.get(`${API_BASE_URL}/api/v1/contactos?clienteId=${clienteA.id}`);
    const beforeAIds = (await beforeA.json()).map((c: { id: string }) => c.id);
    expect(beforeAIds).toContain(contacto.id);

    // WHEN — Reassign to client B
    const reassignResp = await request.put(
      `${API_BASE_URL}/api/v1/contactos/${contacto.id}/cliente`,
      { data: { clienteId: clienteB.id } }
    );
    expect(reassignResp.status()).toBe(200);

    // THEN — Contact is NO LONGER in client A's filter
    const afterA = await request.get(`${API_BASE_URL}/api/v1/contactos?clienteId=${clienteA.id}`);
    const afterAIds = (await afterA.json()).map((c: { id: string }) => c.id);
    expect(afterAIds).not.toContain(contacto.id);

    // AND — Contact IS in client B's filter
    const afterB = await request.get(`${API_BASE_URL}/api/v1/contactos?clienteId=${clienteB.id}`);
    const afterBIds = (await afterB.json()).map((c: { id: string }) => c.id);
    expect(afterBIds).toContain(contacto.id);
  });
});

import { test, expect } from '@playwright/test';

/**
 * ATDD API tests — Story 3.5: Delete Contact (RED phase)
 *
 * Tests fail until:
 *   - DELETE /api/v1/contactos/:id endpoint is implemented in ContactoEndpoints.cs
 *   - DeleteContactoCommandHandler.cs is created and wired (returns bool)
 *   - IContactoRepository.DeleteAsync + GetByIdAsync are implemented
 *   - 204 returned when contact exists and is deleted successfully
 *   - 404 returned using Results.Problem(...) with Problem Details RFC 7807 (NOT Results.NotFound())
 *   - No stack traces exposed in any error response (NFR6)
 *
 * Test IDs:
 *   TC-E3-3-5-API-1 (P1) — DELETE valid ID → 204 No Content
 *   TC-E3-3-5-API-2 (P1) — DELETE unknown UUID → 404 Problem Details
 */

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';
const CONTACTOS_URL = `${API_BASE_URL}/api/v1/contactos`;
const UNKNOWN_UUID = '00000000-0000-0000-0000-000000000000';

// ─────────────────────────────────────────────────────────────────────────────
// Seed helpers — create data for each test, track IDs for cleanup
// ─────────────────────────────────────────────────────────────────────────────

async function seedContacto(
  request: import('@playwright/test').APIRequestContext,
  overrides: { nombre?: string; email?: string; cargo?: string; telefono?: string; clienteId?: string | null } = {}
) {
  const now = Date.now();
  const data = {
    nombre: overrides.nombre ?? `API Delete Test Contacto ${now}`,
    email: overrides.email ?? `contacto.delete.${now}@test.com`,
    cargo: overrides.cargo ?? 'Analista de Pruebas',
    telefono: overrides.telefono ?? `310${String(now).slice(-7)}`,
    clienteId: overrides.clienteId ?? null,
  };

  const response = await request.post(CONTACTOS_URL, { data });
  expect(response.status()).toBe(201);
  return response.json() as Promise<{
    id: string;
    nombre: string;
    email: string;
    cargo: string;
    telefono: string;
    clienteId: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-E3-3-5-API-1 (P1) — DELETE valid ID → 204 No Content
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Story 3.5 — API: DELETE /api/v1/contactos/:id (P1)', () => {
  const createdContactoIds: string[] = [];

  test.afterEach(async ({ request }) => {
    for (const id of createdContactoIds) {
      await request.delete(`${CONTACTOS_URL}/${id}`).catch(() => null);
    }
    createdContactoIds.length = 0;
  });

  test('TC-E3-3-5-API-1: should return 204 No Content when deleting an existing contact', async ({ request }) => {
    // GIVEN: A contact exists in the system
    const seeded = await seedContacto(request, {
      nombre: 'Contacto Para Eliminar API P1',
    });
    // Track ID for cleanup only if DELETE fails (test verifies it is removed)
    createdContactoIds.push(seeded.id);

    // WHEN: DELETE /api/v1/contactos/:id is called with the seeded ID
    const response = await request.delete(`${CONTACTOS_URL}/${seeded.id}`);

    // THEN: Response status is 204 No Content (not 200 with empty body — architecture mandate)
    expect(response.status()).toBe(204);

    // AND: Response body is empty (no body on 204)
    const bodyText = await response.text();
    expect(bodyText).toBe('');

    // AND: Contact is no longer accessible via GET (removed from the system)
    const getAfterDelete = await request.get(`${CONTACTOS_URL}/${seeded.id}`);
    expect(getAfterDelete.status()).toBe(404);

    // Cleanup not needed (already deleted) — remove from tracking
    createdContactoIds.splice(createdContactoIds.indexOf(seeded.id), 1);
  });

  test('should remove the deleted contact from the GET /api/v1/contactos list response (FR27)', async ({ request }) => {
    // GIVEN: A contact exists in the system
    const seeded = await seedContacto(request, {
      nombre: 'Contacto Lista Check',
    });
    createdContactoIds.push(seeded.id);

    // AND: The contact appears in the list before deletion
    const listBefore = await request.get(CONTACTOS_URL);
    const bodyBefore = await listBefore.json();
    const items: { id: string }[] = Array.isArray(bodyBefore)
      ? bodyBefore
      : (bodyBefore?.items ?? bodyBefore?.contactos ?? []);
    expect(items.some((c) => c.id === seeded.id)).toBe(true);

    // WHEN: Contact is deleted
    const deleteResponse = await request.delete(`${CONTACTOS_URL}/${seeded.id}`);
    expect(deleteResponse.status()).toBe(204);

    // THEN: Contact is no longer in the list (FR27 — immediate removal, no page reload)
    const listAfter = await request.get(CONTACTOS_URL);
    const bodyAfter = await listAfter.json();
    const itemsAfter: { id: string }[] = Array.isArray(bodyAfter)
      ? bodyAfter
      : (bodyAfter?.items ?? bodyAfter?.contactos ?? []);
    expect(itemsAfter.some((c) => c.id === seeded.id)).toBe(false);

    createdContactoIds.splice(createdContactoIds.indexOf(seeded.id), 1);
  });

  test('should NOT affect other contacts when one contact is deleted', async ({ request }) => {
    // GIVEN: Two contacts exist in the system
    const contactoToDelete = await seedContacto(request, {
      nombre: 'Contacto A Eliminar Aislado',
    });
    const contactoToKeep = await seedContacto(request, {
      nombre: 'Contacto A Mantener',
    });
    createdContactoIds.push(contactoToDelete.id, contactoToKeep.id);

    // WHEN: Only the first contact is deleted
    const deleteResponse = await request.delete(`${CONTACTOS_URL}/${contactoToDelete.id}`);
    expect(deleteResponse.status()).toBe(204);

    // THEN: The second contact is still accessible
    const getKept = await request.get(`${CONTACTOS_URL}/${contactoToKeep.id}`);
    expect(getKept.status()).toBe(200);
    const body = await getKept.json();
    expect(body.id).toBe(contactoToKeep.id);

    createdContactoIds.splice(createdContactoIds.indexOf(contactoToDelete.id), 1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E3-3-5-API-2 (P1) — DELETE unknown UUID → 404 Problem Details
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Story 3.5 — API: DELETE non-existent contact (P1)', () => {
  test('TC-E3-3-5-API-2: should return 404 with Problem Details RFC 7807 when deleting a non-existent contact UUID', async ({ request }) => {
    // GIVEN: No contact with UNKNOWN_UUID exists in the system

    // WHEN: DELETE /api/v1/contactos/{unknown-uuid} is called
    const response = await request.delete(`${CONTACTOS_URL}/${UNKNOWN_UUID}`);

    // THEN: Response status is 404 Not Found
    expect(response.status()).toBe(404);

    const body = await response.json();

    // AND: Response body conforms to Problem Details RFC 7807 (NOT Results.NotFound() bare 404)
    expect(body).toHaveProperty('status', 404);
    expect(body).toHaveProperty('title');
    expect(typeof body.title).toBe('string');
    expect(body).toHaveProperty('detail');
    expect(typeof body.detail).toBe('string');

    // AND: The title matches the expected Spanish message from architecture
    expect(body.title).toMatch(/contacto no encontrado/i);

    // AND: The detail explains what happened (not a bare 404)
    expect(body.detail).toMatch(/no fue encontrado|not found/i);
  });

  test('should return content-type application/problem+json or application/json for a 404 DELETE response', async ({ request }) => {
    // GIVEN: No contact with UNKNOWN_UUID exists

    // WHEN: DELETE /api/v1/contactos/{unknown-uuid} is called
    const response = await request.delete(`${CONTACTOS_URL}/${UNKNOWN_UUID}`);

    // THEN: Content-Type includes problem+json (RFC 7807) — NOT bare text
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toMatch(/application\/(problem\+json|json)/);
    expect(response.status()).toBe(404);
  });

  test('should NOT expose stack traces in 404 DELETE response (NFR6 — no technical details)', async ({ request }) => {
    // GIVEN: No contact with UNKNOWN_UUID exists

    // WHEN: DELETE called with unknown UUID
    const response = await request.delete(`${CONTACTOS_URL}/${UNKNOWN_UUID}`);
    const body = await response.json();

    // THEN: No stack trace fields in the response (NFR6 — ExceptionHandlingMiddleware from Story 1.3)
    expect(body).not.toHaveProperty('stackTrace');
    expect(body).not.toHaveProperty('exception');
    expect(body).not.toHaveProperty('exceptionMessage');
  });

  test('should return 404 for a second DELETE call to an already-deleted contact UUID', async ({ request }) => {
    // GIVEN: A contact exists and is deleted
    const seeded = await seedContacto(request, {
      nombre: 'Contacto Doble Delete Test',
    });

    const firstDelete = await request.delete(`${CONTACTOS_URL}/${seeded.id}`);
    expect(firstDelete.status()).toBe(204);

    // WHEN: The same UUID is deleted again
    const secondDelete = await request.delete(`${CONTACTOS_URL}/${seeded.id}`);

    // THEN: Response is 404 (contact no longer exists)
    expect(secondDelete.status()).toBe(404);
  });
});

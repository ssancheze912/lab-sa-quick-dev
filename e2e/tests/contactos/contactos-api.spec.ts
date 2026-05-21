import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

/**
 * ATDD — Contact API Integration Tests
 *
 * Tests are in RED phase — they define the expected behaviour BEFORE implementation.
 *
 * Story 3.1 Coverage:
 *   API-CT-07  P1  — GET /api/v1/contactos returns array; each item has id, nombre, email, cargo
 *   API-CT-07b P1  — GET /api/v1/contactos returns Content-Type application/json (not problem+json)
 *
 * Story 3.2 Coverage:
 *   API-CT-08  P1  — GET /api/v1/contactos/:id valid ID → 200 + full ContactoDto with clienteId: null
 *   API-CT-09  P1  — GET /api/v1/contactos/:id non-existent ID → 404 Problem Details (no stackTrace key)
 */

test.describe('Story 3.1 — API: GET /api/v1/contactos', () => {

  // ---------------------------------------------------------------------------
  // API-CT-07 (P1 · AC1)
  // Given the backend is running and the contactos table exists
  // When a GET /api/v1/contactos request is made
  // Then the response is 200 OK with a JSON array
  //   AND each element contains id (UUID v4), nombre, email, and cargo fields
  //   AND createdAt serialises as ISO 8601 with timezone (DateTimeOffset)
  //   AND the response is a direct array — NOT a wrapper object { data: [...] }
  // ---------------------------------------------------------------------------
  test('API-CT-07 — GET /api/v1/contactos devuelve un array; cada item contiene id, nombre, email y cargo', async ({ request }) => {
    // WHEN — performing a direct GET to the contactos endpoint
    const response = await request.get(`${API_BASE_URL}/api/v1/contactos`);

    // THEN — response is 200 OK
    expect(response.status()).toBe(200);

    // AND — body is a JSON array (not a wrapper object)
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);

    // AND — if there are results, each item satisfies the API contract
    if (body.length > 0) {
      const item = body[0];

      // id must be a UUID v4 string
      expect(typeof item.id).toBe('string');
      expect(item.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );

      // nombre must be a non-empty string
      expect(typeof item.nombre).toBe('string');
      expect(item.nombre.length).toBeGreaterThan(0);

      // email must be a non-empty string
      expect(typeof item.email).toBe('string');
      expect(item.email.length).toBeGreaterThan(0);

      // cargo must be a non-empty string
      expect(typeof item.cargo).toBe('string');
      expect(item.cargo.length).toBeGreaterThan(0);

      // createdAt must be ISO 8601 with timezone (DateTimeOffset — not plain DateTime)
      expect(typeof item.createdAt).toBe('string');
      expect(item.createdAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
      );

      // updatedAt must also be ISO 8601 with timezone
      expect(typeof item.updatedAt).toBe('string');
      expect(item.updatedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
      );

      // clienteId must be either null or a UUID string (nullable FK)
      if (item.clienteId !== null) {
        expect(typeof item.clienteId).toBe('string');
        expect(item.clienteId).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        );
      }

      // Response must be a direct array — no wrapper object { data: [...] }
      expect((body as Record<string, unknown>).data).toBeUndefined();
    }
  });

  // ---------------------------------------------------------------------------
  // API-CT-07b (P1 · AC1 — contract guard)
  // Given the backend is running
  // When GET /api/v1/contactos is called under normal conditions
  // Then Content-Type is application/json (NOT application/problem+json)
  //   AND the response body is a plain array, not a Problem Details object
  // ---------------------------------------------------------------------------
  test('API-CT-07b — GET /api/v1/contactos devuelve Content-Type application/json en condiciones normales', async ({ request }) => {
    // WHEN — making the request
    const response = await request.get(`${API_BASE_URL}/api/v1/contactos`);

    // THEN — status is 200 (not 404 meaning route not registered, not 500)
    expect(response.status()).toBe(200);

    // AND — Content-Type is application/json
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');
    expect(contentType).not.toContain('problem+json');

    // AND — body is not a Problem Details object (it is a direct JSON array)
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect((body as Record<string, unknown>).title).toBeUndefined();
    expect((body as Record<string, unknown>).status).toBeUndefined();
  });
});

// =============================================================================
// Story 3.2 — API: GET /api/v1/contactos/:id
// =============================================================================

test.describe('Story 3.2 — API: GET /api/v1/contactos/:id', () => {
  const createdIds: string[] = [];

  test.afterAll(async ({ request }) => {
    for (const id of createdIds) {
      await request.delete(`${API_BASE_URL}/api/v1/contactos/${id}`).catch(() => null);
    }
    createdIds.length = 0;
  });

  // ---------------------------------------------------------------------------
  // API-CT-08 (P1 · AC2)
  // Given a valid contactoId exists in the system
  // When GET /api/v1/contactos/:id is called
  // Then the response is 200 OK with a full ContactoDto
  //   AND the response includes all required fields
  //   AND clienteId is null (no client association in Epic 3 scope)
  //   AND the response is a direct object — NOT a wrapper { data: {...} }
  // ---------------------------------------------------------------------------
  test('API-CT-08 — GET /api/v1/contactos/:id con ID válido devuelve 200 + ContactoDto completo con clienteId: null', async ({ request }) => {
    // GIVEN — a contact is created via the API
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
      data: {
        nombre: 'María García',
        cargo: 'Gerente Comercial',
        telefono: '+57 1 234 5679',
        email: 'm.garcia.api08@empresa.com',
      },
    });
    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();
    createdIds.push(created.id);

    // WHEN — GET by the returned id
    const response = await request.get(`${API_BASE_URL}/api/v1/contactos/${created.id}`);

    // THEN — status is 200 OK
    expect(response.status()).toBe(200);

    // AND — body is a direct object (not an array, not a wrapper)
    const body = await response.json();
    expect(typeof body).toBe('object');
    expect(Array.isArray(body)).toBe(false);
    expect((body as Record<string, unknown>).data).toBeUndefined();

    // AND — id matches and is a valid UUID
    expect(body.id).toBe(created.id);
    expect(body.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );

    // AND — nombre is the correct value
    expect(body.nombre).toBe('María García');

    // AND — cargo is the correct value
    expect(body.cargo).toBe('Gerente Comercial');

    // AND — telefono is the correct value
    expect(body.telefono).toBe('+57 1 234 5679');

    // AND — email is the correct value
    expect(body.email).toBe('m.garcia.api08@empresa.com');

    // AND — clienteId is null (Epic 3 scope: standalone contact, no client association)
    expect(body.clienteId).toBeNull();

    // AND — createdAt serialises as ISO 8601 with timezone (DateTimeOffset)
    expect(typeof body.createdAt).toBe('string');
    expect(body.createdAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
    );

    // AND — updatedAt serialises as ISO 8601 with timezone
    expect(typeof body.updatedAt).toBe('string');
    expect(body.updatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
    );
  });

  // ---------------------------------------------------------------------------
  // API-CT-09 (P1 · AC3 · NFR6)
  // Given a contactoId that does not exist in the system
  // When GET /api/v1/contactos/:id is called with that ID
  // Then the response is 404 Not Found
  //   AND the body is a Problem Details object (RFC 7807)
  //   AND the body does NOT contain a stackTrace key (NFR6 compliance)
  // ---------------------------------------------------------------------------
  test('API-CT-09 — GET /api/v1/contactos/:id con ID inexistente devuelve 404 Problem Details sin stackTrace', async ({ request }) => {
    // GIVEN — a UUID that does not correspond to any existing contact
    const nonExistentId = '00000000-0000-4000-8000-000000000000';

    // WHEN — GET with the non-existent id
    const response = await request.get(`${API_BASE_URL}/api/v1/contactos/${nonExistentId}`);

    // THEN — status is 404 Not Found
    expect(response.status()).toBe(404);

    // AND — Content-Type is application/problem+json (Problem Details RFC 7807)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('problem+json');

    // AND — body is a valid Problem Details object
    const body = await response.json();
    expect(typeof body).toBe('object');
    expect(Array.isArray(body)).toBe(false);

    // AND — body contains status 404
    expect(body.status).toBe(404);

    // AND — body contains a title
    expect(typeof body.title).toBe('string');
    expect(body.title.length).toBeGreaterThan(0);

    // AND — body does NOT expose a stackTrace key (NFR6: no internal error details)
    expect((body as Record<string, unknown>).stackTrace).toBeUndefined();
    expect((body as Record<string, unknown>).StackTrace).toBeUndefined();
    expect((body as Record<string, unknown>).stack_trace).toBeUndefined();
  });
});

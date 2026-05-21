import { test, expect } from '@playwright/test';
import { buildContacto } from '../../helpers/data.helper';

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
 *
 * Story 3.3 Coverage:
 *   API-CT-01  P0  — POST valid payload → 201 + body with UUID id, clienteId: null, ISO 8601 createdAt
 *   API-CT-02  P0  — POST missing nombre → 400 Problem Details (no stackTrace key)
 *   API-CT-03  P0  — POST missing email → 400 Problem Details (no stackTrace key)
 *   API-CT-04  P0  — POST missing cargo → 400 Problem Details (no stackTrace key)
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

// =============================================================================
// Story 3.3 — API: POST /api/v1/contactos
// =============================================================================

test.describe('Story 3.3 — API: POST /api/v1/contactos', () => {
  const createdIds: string[] = [];

  test.afterAll(async ({ request }) => {
    for (const id of createdIds) {
      await request.delete(`${API_BASE_URL}/api/v1/contactos/${id}`).catch(() => null);
    }
    createdIds.length = 0;
  });

  // ---------------------------------------------------------------------------
  // API-CT-01 (P0 · AC2)
  // Given a valid payload with nombre, cargo, telefono, email
  // When POST /api/v1/contactos is called
  // Then the response is 201 Created
  //   AND the body includes a UUID id, all fields, clienteId: null, ISO 8601 createdAt
  // ---------------------------------------------------------------------------
  test('API-CT-01 — POST payload válido → 201 + body con UUID id, clienteId: null, createdAt ISO 8601', async ({ request }) => {
    // GIVEN — a valid payload (all 4 required fields)
    const data = buildContacto({ nombre: 'María García API-CT-01' });

    // WHEN — POST request
    const response = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
      data: {
        nombre: data.nombre,
        cargo: data.cargo,
        telefono: data.telefono,
        email: data.email,
      },
    });

    // THEN — status is 201 Created
    expect(response.status()).toBe(201);

    // AND — body matches the ContactoDto contract
    const body = await response.json();

    // id must be a non-empty UUID v4 string
    expect(typeof body.id).toBe('string');
    expect(body.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );

    // Fields must match the submitted payload
    expect(body.nombre).toBe(data.nombre);
    expect(body.cargo).toBe(data.cargo);
    expect(body.telefono).toBe(data.telefono);
    expect(body.email).toBe(data.email);

    // clienteId must be null (Epic 3 scope: no automatic client association)
    expect(body.clienteId).toBeNull();

    // createdAt must be ISO 8601 with timezone (DateTimeOffset — not plain DateTime)
    expect(typeof body.createdAt).toBe('string');
    expect(body.createdAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
    );

    // updatedAt must also be ISO 8601 with timezone
    expect(typeof body.updatedAt).toBe('string');
    expect(body.updatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
    );

    // Response must NOT contain a stackTrace key (NFR6)
    expect((body as Record<string, unknown>).stackTrace).toBeUndefined();
    expect((body as Record<string, unknown>).StackTrace).toBeUndefined();

    createdIds.push(body.id);
  });

  // ---------------------------------------------------------------------------
  // API-CT-02 (P0 · AC3, AC4 — NFR6)
  // Given a payload missing the nombre field
  // When POST /api/v1/contactos is called
  // Then the response is 400 Bad Request
  //   AND the body is Problem Details (RFC 7807)
  //   AND the body does NOT contain a stackTrace key (NFR6)
  // ---------------------------------------------------------------------------
  test('API-CT-02 — POST sin nombre → 400 Problem Details sin stackTrace', async ({ request }) => {
    // GIVEN — payload with missing nombre
    const data = buildContacto();

    // WHEN — POST request with nombre omitted
    const response = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
      data: {
        // nombre intentionally omitted
        cargo: data.cargo,
        telefono: data.telefono,
        email: data.email,
      },
    });

    // THEN — status is 400 Bad Request
    expect(response.status()).toBe(400);

    // AND — body is a Problem Details object (RFC 7807)
    const body = await response.json();
    expect(typeof body).toBe('object');
    expect(Array.isArray(body)).toBe(false);

    // AND — status field is 400
    expect(body.status).toBe(400);

    // AND — body does NOT expose a stackTrace key (NFR6)
    expect((body as Record<string, unknown>).stackTrace).toBeUndefined();
    expect((body as Record<string, unknown>).StackTrace).toBeUndefined();
    expect((body as Record<string, unknown>).stack_trace).toBeUndefined();
  });

  // ---------------------------------------------------------------------------
  // API-CT-03 (P0 · AC3, AC4 — NFR6)
  // Given a payload missing the email field
  // When POST /api/v1/contactos is called
  // Then the response is 400 Bad Request
  //   AND the body is Problem Details without stackTrace (NFR6)
  // ---------------------------------------------------------------------------
  test('API-CT-03 — POST sin email → 400 Problem Details sin stackTrace', async ({ request }) => {
    // GIVEN — payload with missing email
    const data = buildContacto();

    // WHEN — POST request with email omitted
    const response = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
      data: {
        nombre: data.nombre,
        cargo: data.cargo,
        telefono: data.telefono,
        // email intentionally omitted
      },
    });

    // THEN — status is 400 Bad Request
    expect(response.status()).toBe(400);

    // AND — body is a valid Problem Details object
    const body = await response.json();
    expect(typeof body).toBe('object');
    expect(Array.isArray(body)).toBe(false);
    expect(body.status).toBe(400);

    // AND — no stackTrace exposed (NFR6)
    expect((body as Record<string, unknown>).stackTrace).toBeUndefined();
    expect((body as Record<string, unknown>).StackTrace).toBeUndefined();
    expect((body as Record<string, unknown>).stack_trace).toBeUndefined();
  });

  // ---------------------------------------------------------------------------
  // API-CT-04 (P0 · AC3, AC4 — NFR6)
  // Given a payload missing the cargo field
  // When POST /api/v1/contactos is called
  // Then the response is 400 Bad Request
  //   AND the body is Problem Details without stackTrace (NFR6)
  // ---------------------------------------------------------------------------
  test('API-CT-04 — POST sin cargo → 400 Problem Details sin stackTrace', async ({ request }) => {
    // GIVEN — payload with missing cargo
    const data = buildContacto();

    // WHEN — POST request with cargo omitted
    const response = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
      data: {
        nombre: data.nombre,
        // cargo intentionally omitted
        telefono: data.telefono,
        email: data.email,
      },
    });

    // THEN — status is 400 Bad Request
    expect(response.status()).toBe(400);

    // AND — body is a valid Problem Details object
    const body = await response.json();
    expect(typeof body).toBe('object');
    expect(Array.isArray(body)).toBe(false);
    expect(body.status).toBe(400);

    // AND — no stackTrace exposed (NFR6)
    expect((body as Record<string, unknown>).stackTrace).toBeUndefined();
    expect((body as Record<string, unknown>).StackTrace).toBeUndefined();
    expect((body as Record<string, unknown>).stack_trace).toBeUndefined();
  });
});

// =============================================================================
// Story 3.4 — API: PUT /api/v1/contactos/:id
// =============================================================================

test.describe('Story 3.4 — API: PUT /api/v1/contactos/:id', () => {
  const createdIds: string[] = [];

  test.afterEach(async ({ request }) => {
    for (const id of createdIds) {
      await request.delete(`${API_BASE_URL}/api/v1/contactos/${id}`).catch(() => null);
    }
    createdIds.length = 0;
  });

  // ---------------------------------------------------------------------------
  // API-CT-05 (P0 · AC2)
  // Given a contactoId that exists in the system
  //   AND a valid update payload with all four required fields
  // When PUT /api/v1/contactos/:id is called
  // Then the response is 200 OK
  //   AND the body contains the updated field values
  //   AND the body contains a non-null updatedAt that is ISO 8601 with timezone
  //   AND the body does NOT contain a stackTrace key (NFR6)
  // ---------------------------------------------------------------------------
  test('API-CT-05 — PUT payload válido → 200 + cuerpo actualizado con todos los campos y updatedAt', async ({ request }) => {
    // GIVEN — a contact is created via the API
    const original = buildContacto({ nombre: 'María García API-CT-05' });
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
      data: {
        nombre: original.nombre,
        cargo: original.cargo,
        telefono: original.telefono,
        email: original.email,
      },
    });
    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();
    createdIds.push(created.id);

    // WHEN — PUT /api/v1/contactos/:id is called with updated fields
    const updatePayload = {
      nombre: 'María García Actualizada API-CT-05',
      cargo: 'Directora Comercial',
      telefono: '+57 1 234 5680',
      email: 'm.garcia.new@empresa.com',
    };
    const response = await request.put(`${API_BASE_URL}/api/v1/contactos/${created.id}`, {
      data: updatePayload,
    });

    // THEN — response is 200 OK
    expect(response.status()).toBe(200);

    // AND — body matches the updated ContactoDto contract
    const body = await response.json();

    // id is unchanged and matches the created contact
    expect(body.id).toBe(created.id);

    // all updated fields are reflected in the response body
    expect(body.nombre).toBe(updatePayload.nombre);
    expect(body.cargo).toBe(updatePayload.cargo);
    expect(body.telefono).toBe(updatePayload.telefono);
    expect(body.email).toBe(updatePayload.email);

    // clienteId must be null (standalone contact — Epic 3 scope)
    expect(body.clienteId).toBeNull();

    // createdAt must be ISO 8601 with timezone (DateTimeOffset)
    expect(typeof body.createdAt).toBe('string');
    expect(body.createdAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
    );

    // updatedAt must be ISO 8601 with timezone and present (DateTimeOffset — NEVER DateTime)
    expect(typeof body.updatedAt).toBe('string');
    expect(body.updatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
    );

    // Response must NOT be a wrapper object { data: {...} }
    expect((body as Record<string, unknown>).data).toBeUndefined();

    // Response must NOT contain a stackTrace key (NFR6)
    expect((body as Record<string, unknown>).stackTrace).toBeUndefined();
    expect((body as Record<string, unknown>).StackTrace).toBeUndefined();
  });

  // ---------------------------------------------------------------------------
  // API-CT-10 (P1 · AC3)
  // Given a contactoId that exists in the system
  //   AND an update payload with a required field (nombre) missing / empty
  // When PUT /api/v1/contactos/:id is called
  // Then the response is 400 Bad Request
  //   AND the body is Problem Details (RFC 7807)
  //   AND no stack trace is exposed (NFR6)
  // ---------------------------------------------------------------------------
  test('API-CT-10 — PUT con campo requerido vacío → 400 Problem Details sin stackTrace', async ({ request }) => {
    // GIVEN — a contact is created via the API
    const original = buildContacto({ nombre: 'Contacto Validacion API-CT-10' });
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
      data: {
        nombre: original.nombre,
        cargo: original.cargo,
        telefono: original.telefono,
        email: original.email,
      },
    });
    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();
    createdIds.push(created.id);

    // WHEN — PUT /api/v1/contactos/:id with nombre as empty string (missing required field)
    const invalidPayload = {
      nombre: '',
      cargo: original.cargo,
      telefono: original.telefono,
      email: original.email,
    };
    const response = await request.put(`${API_BASE_URL}/api/v1/contactos/${created.id}`, {
      data: invalidPayload,
    });

    // THEN — response is 400 Bad Request
    expect(response.status()).toBe(400);

    // AND — body is Problem Details (RFC 7807)
    const body = await response.json();
    expect(typeof body).toBe('object');
    expect(Array.isArray(body)).toBe(false);
    expect(body.status).toBe(400);
    expect(typeof body.title).toBe('string');
    expect(body.title.length).toBeGreaterThan(0);

    // AND — no stack trace or internal information is exposed (NFR6)
    expect((body as Record<string, unknown>).stackTrace).toBeUndefined();
    expect((body as Record<string, unknown>).StackTrace).toBeUndefined();
    expect((body as Record<string, unknown>).stack_trace).toBeUndefined();
    const bodyText = JSON.stringify(body);
    expect(bodyText).not.toMatch(/at SiesaAgents/i);
  });

  // ---------------------------------------------------------------------------
  // API-CT-11 (P1 · AC2)
  // Given a contactoId that does NOT exist in the system
  // When PUT /api/v1/contactos/:id is called with a valid payload
  // Then the response is 404 Not Found
  //   AND the body is Problem Details (RFC 7807)
  //   AND no stack trace is exposed (NFR6)
  // ---------------------------------------------------------------------------
  test('API-CT-11 — PUT con ID inexistente → 404 Problem Details sin stackTrace', async ({ request }) => {
    // GIVEN — a UUID that does not correspond to any existing contact
    const nonExistentId = '00000000-0000-4000-8000-000000000099';

    // WHEN — PUT /api/v1/contactos/:id with a valid payload but non-existent ID
    const validPayload = {
      nombre: 'Contacto Inexistente API-CT-11',
      cargo: 'Analista',
      telefono: '+57 1 234 5679',
      email: 'no.existe@empresa.com',
    };
    const response = await request.put(`${API_BASE_URL}/api/v1/contactos/${nonExistentId}`, {
      data: validPayload,
    });

    // THEN — response is 404 Not Found
    expect(response.status()).toBe(404);

    // AND — body is Problem Details (RFC 7807)
    const body = await response.json();
    expect(typeof body).toBe('object');
    expect(Array.isArray(body)).toBe(false);
    expect(body.status).toBe(404);
    expect(typeof body.title).toBe('string');
    expect(body.title.length).toBeGreaterThan(0);

    // AND — no stack trace or internal information is exposed (NFR6)
    expect((body as Record<string, unknown>).stackTrace).toBeUndefined();
    expect((body as Record<string, unknown>).StackTrace).toBeUndefined();
    expect((body as Record<string, unknown>).stack_trace).toBeUndefined();
    const bodyText = JSON.stringify(body);
    expect(bodyText).not.toMatch(/at SiesaAgents/i);
  });
});

// =============================================================================
// Story 3.5 — API: DELETE /api/v1/contactos/:id
// =============================================================================

test.describe('Story 3.5 — API: DELETE /api/v1/contactos/:id', () => {
  // ---------------------------------------------------------------------------
  // API-CT-06 (P0 · AC2)
  // Given a contactoId that exists in the system
  // When DELETE /api/v1/contactos/:id is called
  // Then the response is 204 No Content
  //   AND a subsequent GET /api/v1/contactos/:id returns 404 Problem Details
  //   AND that 404 body does NOT contain a stackTrace key (NFR6)
  // ---------------------------------------------------------------------------
  test('API-CT-06 — DELETE /api/v1/contactos/:id devuelve 204; GET posterior devuelve 404 Problem Details sin stackTrace', async ({ request }) => {
    // GIVEN — a contact is created via the API
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
      data: {
        nombre: 'Contacto Para Eliminar API-CT-06',
        cargo: 'Analista',
        telefono: '+57 1 234 5670',
        email: 'api.ct06@empresa.com',
      },
    });
    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();

    // WHEN — DELETE /api/v1/contactos/:id is called with the existing id
    const deleteResponse = await request.delete(
      `${API_BASE_URL}/api/v1/contactos/${created.id}`
    );

    // THEN — response is 204 No Content (no response body)
    expect(deleteResponse.status()).toBe(204);

    // AND — response body is empty (no JSON body on 204)
    const deleteBody = await deleteResponse.text();
    expect(deleteBody).toBe('');

    // AND — subsequent GET /api/v1/contactos/:id returns 404 Not Found
    const getResponse = await request.get(
      `${API_BASE_URL}/api/v1/contactos/${created.id}`
    );
    expect(getResponse.status()).toBe(404);

    // AND — 404 body is Problem Details (RFC 7807)
    const getBody = await getResponse.json();
    expect(typeof getBody).toBe('object');
    expect(Array.isArray(getBody)).toBe(false);
    expect(getBody.status).toBe(404);
    expect(typeof getBody.title).toBe('string');
    expect(getBody.title.length).toBeGreaterThan(0);

    // AND — 404 body does NOT contain stackTrace key (NFR6)
    expect((getBody as Record<string, unknown>).stackTrace).toBeUndefined();
    expect((getBody as Record<string, unknown>).StackTrace).toBeUndefined();
    expect((getBody as Record<string, unknown>).stack_trace).toBeUndefined();
  });
});

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
    // GIVEN — a contact is created via the API using the factory
    const data = buildContacto({
      nombre: 'María García API-CT-08',
      cargo: 'Gerente Comercial',
      telefono: '+57 1 234 5679',
    });
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
      data: {
        nombre: data.nombre,
        cargo: data.cargo,
        telefono: data.telefono,
        email: data.email,
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
    expect(body.nombre).toBe(data.nombre);

    // AND — cargo is the correct value
    expect(body.cargo).toBe(data.cargo);

    // AND — telefono is the correct value
    expect(body.telefono).toBe(data.telefono);

    // AND — email is the correct value
    expect(body.email).toBe(data.email);

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

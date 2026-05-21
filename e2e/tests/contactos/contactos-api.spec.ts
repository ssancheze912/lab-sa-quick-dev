import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

/**
 * ATDD — Story 3.1: Contact API Integration Tests
 *
 * Tests are in RED phase — they define the expected behaviour BEFORE implementation.
 * Make these tests GREEN by implementing GET /api/v1/contactos as specified in Story 3.1.
 *
 * Coverage:
 *   API-CT-07  P1  — GET /api/v1/contactos returns array; each item has id, nombre, email, cargo
 *   API-CT-07b P1  — GET /api/v1/contactos returns Content-Type application/json (not problem+json)
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

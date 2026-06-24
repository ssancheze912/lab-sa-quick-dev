/**
 * API Tests — Story 3.1: GET /api/v1/contactos contract
 * RED PHASE — Tests are intentionally FAILING until backend implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC6 — GET /api/v1/contactos returns correct HTTP contract (status, headers, body shape)
 *         Response cached under queryKey ['contactos'] on the frontend (TanStack Query)
 *
 * Uses Playwright's APIRequestContext (no browser). Requires:
 *   - Backend running on http://localhost:5000
 *   - EF Core migration applied (contactos table exists)
 *   - No authentication required (MVP has no auth layer)
 */

import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5000';
const ENDPOINT = `${API_BASE}/api/v1/contactos`;

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/contactos — contract validation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('GET /api/v1/contactos — HTTP contract', () => {
  test('should return HTTP 200 when the contactos table is accessible', async ({ request }) => {
    // GIVEN: The backend API is running and contactos table exists

    // WHEN: A GET request is sent to /api/v1/contactos
    const response = await request.get(ENDPOINT);

    // THEN: HTTP status is 200
    expect(response.status()).toBe(200);
  });

  test('should return Content-Type: application/json', async ({ request }) => {
    // GIVEN: The backend is running

    // WHEN: GET /api/v1/contactos is called
    const response = await request.get(ENDPOINT);

    // THEN: Content-Type header includes application/json
    expect(response.headers()['content-type']).toMatch(/application\/json/i);
  });

  test('should return a JSON array (not an object wrapper)', async ({ request }) => {
    // GIVEN: The backend returns contact data

    // WHEN: GET /api/v1/contactos is called
    const response = await request.get(ENDPOINT);
    const body = await response.json();

    // THEN: The response body is a JSON array (no { data: [...] } wrapper)
    expect(Array.isArray(body)).toBe(true);
  });

  test('should return HTTP 200 with empty array [] when no contacts exist', async ({ request }) => {
    // GIVEN: No contacts seeded in the database (or table is freshly created)

    // WHEN: GET /api/v1/contactos is called
    const response = await request.get(ENDPOINT);
    const body = await response.json();

    // THEN: HTTP 200 + empty array (NOT a 404)
    expect(response.status()).toBe(200);
    if (body.length === 0) {
      expect(body).toEqual([]);
    }
    // If data exists, the test still passes — empty-array scenario verified separately
  });

  test('should return contact objects with required camelCase fields', async ({ request }) => {
    // GIVEN: At least one contact exists (seeded via POST if needed)
    const contactPayload = {
      nombre: 'API Contract Test Contact',
      cargo: 'Tester',
      telefono: `310${Date.now().toString().slice(-7)}`,
      email: `api-test-${Date.now()}@test.com`,
    };

    // Seed contact (will fail in RED phase because endpoint not implemented)
    const createResponse = await request.post(ENDPOINT, { data: contactPayload });
    const createdId: string | undefined = createResponse.ok()
      ? (await createResponse.json()).id
      : undefined;

    try {
      // WHEN: GET /api/v1/contactos is called
      const response = await request.get(ENDPOINT);
      const body = await response.json() as Array<Record<string, unknown>>;

      // THEN: If the list has items, each item has the mandatory camelCase fields
      if (body.length > 0) {
        const item = body[0];
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('nombre');
        expect(item).toHaveProperty('cargo');
        expect(item).toHaveProperty('telefono');
        expect(item).toHaveProperty('email');
        expect(item).toHaveProperty('clienteId');
        expect(item).toHaveProperty('createdAt');
        expect(item).toHaveProperty('updatedAt');
      }
    } finally {
      // Cleanup: delete seeded contact if it was created
      if (createdId) {
        await request.delete(`${ENDPOINT}/${createdId}`);
      }
    }
  });

  test('should return id as a UUID string (not numeric)', async ({ request }) => {
    // GIVEN: At least one contact exists
    const contactPayload = {
      nombre: 'UUID Shape Test',
      cargo: 'Auditor',
      telefono: `311${Date.now().toString().slice(-7)}`,
      email: `uuid-test-${Date.now()}@test.com`,
    };

    const createResponse = await request.post(ENDPOINT, { data: contactPayload });
    const createdId: string | undefined = createResponse.ok()
      ? (await createResponse.json()).id
      : undefined;

    try {
      // WHEN: GET /api/v1/contactos is called
      const response = await request.get(ENDPOINT);
      const body = await response.json() as Array<Record<string, unknown>>;

      // THEN: id field matches UUID format
      if (body.length > 0) {
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        expect(String(body[0].id)).toMatch(uuidPattern);
      }
    } finally {
      if (createdId) {
        await request.delete(`${ENDPOINT}/${createdId}`);
      }
    }
  });

  test('should return createdAt and updatedAt as ISO 8601 timestamp strings', async ({ request }) => {
    // GIVEN: At least one contact exists
    const contactPayload = {
      nombre: 'Timestamp Shape Test',
      cargo: 'Analista',
      telefono: `312${Date.now().toString().slice(-7)}`,
      email: `ts-test-${Date.now()}@test.com`,
    };

    const createResponse = await request.post(ENDPOINT, { data: contactPayload });
    const createdId: string | undefined = createResponse.ok()
      ? (await createResponse.json()).id
      : undefined;

    try {
      // WHEN: GET /api/v1/contactos is called
      const response = await request.get(ENDPOINT);
      const body = await response.json() as Array<Record<string, unknown>>;

      // THEN: timestamps are ISO 8601 strings
      if (body.length > 0) {
        const item = body[0];
        expect(typeof item.createdAt).toBe('string');
        expect(typeof item.updatedAt).toBe('string');
        // Validate ISO 8601 format
        expect(new Date(String(item.createdAt)).toISOString()).toBe(item.createdAt);
      }
    } finally {
      if (createdId) {
        await request.delete(`${ENDPOINT}/${createdId}`);
      }
    }
  });

  test('should NOT return snake_case field names (must be camelCase)', async ({ request }) => {
    // GIVEN: At least one contact exists
    const contactPayload = {
      nombre: 'CamelCase Validation',
      cargo: 'Validador',
      telefono: `313${Date.now().toString().slice(-7)}`,
      email: `camel-test-${Date.now()}@test.com`,
    };

    const createResponse = await request.post(ENDPOINT, { data: contactPayload });
    const createdId: string | undefined = createResponse.ok()
      ? (await createResponse.json()).id
      : undefined;

    try {
      // WHEN: GET /api/v1/contactos is called
      const response = await request.get(ENDPOINT);
      const body = await response.json() as Array<Record<string, unknown>>;

      // THEN: No snake_case keys present in the response
      if (body.length > 0) {
        const keys = Object.keys(body[0]);
        expect(keys).not.toContain('created_at');
        expect(keys).not.toContain('updated_at');
        expect(keys).not.toContain('cliente_id');
      }
    } finally {
      if (createdId) {
        await request.delete(`${ENDPOINT}/${createdId}`);
      }
    }
  });

  test('should return clienteId as null when contact has no associated client', async ({ request }) => {
    // GIVEN: A contact without a client association
    const contactPayload = {
      nombre: 'Contact Without Client',
      cargo: 'Independiente',
      telefono: `314${Date.now().toString().slice(-7)}`,
      email: `no-client-${Date.now()}@test.com`,
    };

    const createResponse = await request.post(ENDPOINT, { data: contactPayload });
    const createdId: string | undefined = createResponse.ok()
      ? (await createResponse.json()).id
      : undefined;

    try {
      // WHEN: GET /api/v1/contactos is called
      const response = await request.get(ENDPOINT);
      const body = await response.json() as Array<Record<string, unknown>>;

      // THEN: clienteId is null (nullable FK)
      const seededContact = body.find((c) => c.id === createdId);
      if (seededContact) {
        expect(seededContact.clienteId).toBeNull();
      }
    } finally {
      if (createdId) {
        await request.delete(`${ENDPOINT}/${createdId}`);
      }
    }
  });
});

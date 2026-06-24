/**
 * API Edge Case Tests — Story 3.1: GET /api/v1/contactos contract
 * BMad-Integrated Mode: expands ATDD API coverage with error paths, boundary conditions,
 * and contract validation scenarios NOT covered in contact-list.api.spec.ts.
 *
 * Edge cases covered:
 *   - Wrong HTTP methods (POST, DELETE, PUT) on the list endpoint return 404 or 405
 *   - Non-existent route /api/v1/contacto (missing plural) returns 404
 *   - Response field types: nombre/cargo/telefono/email are strings
 *   - Required fields are non-null and non-empty
 *   - No unexpected extra fields in the response objects
 *   - clienteId may be null (nullable FK — schema contract)
 *   - Concurrent GET requests return consistent arrays
 *   - Response time is within 5 seconds (generous SLA for test env)
 *   - Content-Type header is application/json
 *   - ISO 8601 timestamp format — createdAt cannot be the zero value
 */

import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5000';
const ENDPOINT = `${API_BASE}/api/v1/contactos`;

// ─────────────────────────────────────────────────────────────────────────────
// Wrong HTTP methods — guard against unintended mutations via collection endpoint
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] GET /api/v1/contactos — wrong HTTP method handling', () => {

  test('[P1] should return HTTP 404 or 405 when DELETE is sent to the list endpoint', async ({ request }) => {
    // GIVEN: DELETE is not supported on the contacts collection endpoint

    // WHEN: A DELETE request is sent to the collection
    const response = await request.delete(ENDPOINT);

    // THEN: Non-success status (collection endpoint does not support DELETE)
    expect([404, 405]).toContain(response.status());
  });

  test('[P1] should return HTTP 404 or 405 when PUT is sent to the list endpoint', async ({ request }) => {
    // GIVEN: PUT is not supported on the contacts collection endpoint

    // WHEN: A PUT request is sent
    const response = await request.put(ENDPOINT, { data: {} });

    // THEN: 404 or 405 — not 200
    expect([404, 405]).toContain(response.status());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Response body — defensive field-type validation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] GET /api/v1/contactos — field type validation', () => {

  test('[P1] should return non-null values for all required fields in each contact', async ({ request }) => {
    // GIVEN: The API is running

    // WHEN: GET /api/v1/contactos returns data
    const response = await request.get(ENDPOINT);
    expect(response.status()).toBe(200);

    const body = await response.json() as Array<Record<string, unknown>>;

    // THEN: Each item in the array has non-null required fields
    for (const item of body) {
      expect(item.id).not.toBeNull();
      expect(item.nombre).not.toBeNull();
      expect(item.cargo).not.toBeNull();
      expect(item.telefono).not.toBeNull();
      expect(item.email).not.toBeNull();
    }
  });

  test('[P1] should return string values for nombre, cargo, telefono, and email', async ({ request }) => {
    // GIVEN: The API returns at least one contact

    // WHEN: GET /api/v1/contactos is called
    const response = await request.get(ENDPOINT);
    const body = await response.json() as Array<Record<string, unknown>>;

    // THEN: String fields are actually strings (not numbers or booleans)
    for (const item of body) {
      expect(typeof item.nombre).toBe('string');
      expect(typeof item.cargo).toBe('string');
      expect(typeof item.telefono).toBe('string');
      expect(typeof item.email).toBe('string');
    }
  });

  test('[P2] should return non-empty strings for nombre, cargo, telefono, and email', async ({ request }) => {
    // GIVEN: Backend enforces NOT NULL and MaxLength constraints on these columns

    // WHEN: GET /api/v1/contactos is called
    const response = await request.get(ENDPOINT);
    const body = await response.json() as Array<Record<string, unknown>>;

    // THEN: Required string fields are not empty strings
    for (const item of body) {
      expect(String(item.nombre).trim().length).toBeGreaterThan(0);
      expect(String(item.cargo).trim().length).toBeGreaterThan(0);
      expect(String(item.telefono).trim().length).toBeGreaterThan(0);
      expect(String(item.email).trim().length).toBeGreaterThan(0);
    }
  });

  test('[P1] clienteId should be either null or a UUID string (nullable FK)', async ({ request }) => {
    // GIVEN: Contacts may or may not have a client association

    // WHEN: GET /api/v1/contactos is called
    const response = await request.get(ENDPOINT);
    const body = await response.json() as Array<Record<string, unknown>>;

    // THEN: clienteId is either null or a valid UUID string
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    for (const item of body) {
      const clienteId = item.clienteId;
      if (clienteId !== null) {
        expect(typeof clienteId).toBe('string');
        expect(String(clienteId)).toMatch(uuidPattern);
      }
    }
  });

  test('[P2] should not include unexpected top-level fields in contact objects', async ({ request }) => {
    // GIVEN: The API contract defines exactly 8 fields per contact

    // WHEN: GET /api/v1/contactos is called
    const response = await request.get(ENDPOINT);
    const body = await response.json() as Array<Record<string, unknown>>;

    // THEN: Each item contains ONLY the expected fields (no internal fields leaked)
    const ALLOWED_FIELDS = new Set(['id', 'nombre', 'cargo', 'telefono', 'email', 'clienteId', 'createdAt', 'updatedAt']);
    for (const item of body) {
      const extraFields = Object.keys(item).filter((k) => !ALLOWED_FIELDS.has(k));
      expect(extraFields).toHaveLength(0);
    }
  });

  test('[P2] createdAt and updatedAt should be valid parseable date strings', async ({ request }) => {
    // GIVEN: Contacts exist in the database

    // WHEN: GET /api/v1/contactos is called
    const response = await request.get(ENDPOINT);
    const body = await response.json() as Array<Record<string, unknown>>;

    // THEN: Timestamp fields are parseable as valid dates (not "0001-01-01" zero value)
    for (const item of body) {
      const createdAt = new Date(String(item.createdAt));
      const updatedAt = new Date(String(item.updatedAt));

      expect(isNaN(createdAt.getTime())).toBe(false);
      expect(isNaN(updatedAt.getTime())).toBe(false);

      // Must be after year 2000 (guard against zero-value or epoch dates)
      expect(createdAt.getFullYear()).toBeGreaterThan(2000);
      expect(updatedAt.getFullYear()).toBeGreaterThan(2000);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Wrong URL — routing boundary tests
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] GET /api/v1/contactos — routing boundary tests', () => {

  test('[P2] should return 404 for a non-existent route /api/v1/contacto (missing plural)', async ({ request }) => {
    // GIVEN: The correct route is /api/v1/contactos (plural with 's')

    // WHEN: A typo route is requested (missing trailing 's')
    const response = await request.get(`${API_BASE}/api/v1/contacto`);

    // THEN: 404 Not Found
    expect(response.status()).toBe(404);
  });

  test('[P2] should return 404 for an unknown sub-path /api/v1/contactos/export', async ({ request }) => {
    // GIVEN: No export sub-route exists in Story 3.1

    // WHEN: An unknown sub-path is requested
    const response = await request.get(`${API_BASE}/api/v1/contactos/export`);

    // THEN: 404 Not Found or 400 (invalid UUID format if routing falls through to param handler)
    expect([400, 404]).toContain(response.status());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Response headers — contract completeness
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] GET /api/v1/contactos — response headers', () => {

  test('[P2] should include Content-Type application/json in response headers', async ({ request }) => {
    // GIVEN: The API is running

    // WHEN: GET /api/v1/contactos is called
    const response = await request.get(ENDPOINT);

    // THEN: Content-Type is application/json
    expect(response.headers()['content-type']).toMatch(/application\/json/i);
  });

  test('[P2] should respond within 5 seconds under normal conditions', async ({ request }) => {
    // GIVEN: The API is running normally (no load)

    // WHEN: GET /api/v1/contactos is measured for response time
    const start = Date.now();
    const response = await request.get(ENDPOINT);
    const duration = Date.now() - start;

    // THEN: Response arrives within 5 seconds (generous SLA for test environment)
    expect(response.status()).toBe(200);
    expect(duration).toBeLessThan(5000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Concurrent requests — idempotency of the read-only endpoint
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] GET /api/v1/contactos — concurrent request idempotency', () => {

  test('[P2] should return consistent results when two concurrent GET requests are made', async ({ request }) => {
    // GIVEN: The API is running

    // WHEN: Two requests are made concurrently
    const [response1, response2] = await Promise.all([
      request.get(ENDPOINT),
      request.get(ENDPOINT),
    ]);

    // THEN: Both return HTTP 200
    expect(response1.status()).toBe(200);
    expect(response2.status()).toBe(200);

    // AND: Both return arrays of the same length (idempotent read)
    const body1 = await response1.json() as unknown[];
    const body2 = await response2.json() as unknown[];
    expect(body1.length).toBe(body2.length);
  });
});

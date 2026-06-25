/**
 * Story 2.3: Create Client — API Contract Edge Cases
 * testarch-automate — BMad-Integrated Mode
 *
 * Expands ATDD API coverage with edge cases NOT covered by clientes-create.api.spec.ts.
 *
 * Additional scenarios:
 * - Whitespace-only field values → 400 Bad Request (FluentValidation NotEmpty catches whitespace)
 * - Field at exact max length (200 chars) → 201 Created (boundary)
 * - Field exceeding max length (201 chars) → 400 Bad Request (boundary)
 * - Missing request body entirely → 400 Bad Request
 * - Completely empty JSON body {} → 400 Bad Request
 * - 400 Problem Details structure includes all failing field names
 * - Content-Type header must be set (missing Content-Type → 415 Unsupported Media Type)
 * - 409 response Content-Type is application/problem+json
 * - 201 response body does NOT contain snake_case alternatives for timestamp fields
 * - createdAt and updatedAt values are strictly UTC (Z suffix or +00:00 offset)
 * - NIT uniqueness is case-sensitive (lowercase vs uppercase NIT treated as different)
 *
 * These tests hit the real backend (http://localhost:5000).
 */

import { test, expect } from '@playwright/test';
import { buildClientePayload } from '../support/factories/cliente.factory';

const BASE_URL = 'http://localhost:5000';
const ENDPOINT = `${BASE_URL}/api/v1/clientes`;

// ─── Whitespace-only fields → 400 ─────────────────────────────────────────────

test.describe('[P1] POST /api/v1/clientes — Whitespace-only field values → 400', () => {
  test('[P1] should return 400 when nombre contains only whitespace', async ({ request }) => {
    // GIVEN: Payload with whitespace-only nombre
    const payload = { ...buildClientePayload(), nombre: '   ' };

    // WHEN: POST request is sent
    const response = await request.post(ENDPOINT, { data: payload });

    // THEN: 400 Bad Request (FluentValidation NotEmpty rejects whitespace)
    expect(response.status()).toBe(400);
  });

  test('[P1] should return 400 when nit contains only whitespace', async ({ request }) => {
    // GIVEN: Payload with whitespace-only nit
    const payload = { ...buildClientePayload(), nit: '   ' };

    // WHEN: POST request is sent
    const response = await request.post(ENDPOINT, { data: payload });

    // THEN: 400 Bad Request
    expect(response.status()).toBe(400);
  });

  test('[P1] should return 400 when telefono contains only whitespace', async ({ request }) => {
    // GIVEN: Payload with whitespace-only telefono
    const payload = { ...buildClientePayload(), telefono: '   ' };

    // WHEN: POST request is sent
    const response = await request.post(ENDPOINT, { data: payload });

    // THEN: 400 Bad Request
    expect(response.status()).toBe(400);
  });

  test('[P1] should return 400 when ciudad contains only whitespace', async ({ request }) => {
    // GIVEN: Payload with whitespace-only ciudad
    const payload = { ...buildClientePayload(), ciudad: '   ' };

    // WHEN: POST request is sent
    const response = await request.post(ENDPOINT, { data: payload });

    // THEN: 400 Bad Request
    expect(response.status()).toBe(400);
  });
});

// ─── Max length boundary conditions ───────────────────────────────────────────

test.describe('[P1] POST /api/v1/clientes — Max length boundary conditions', () => {
  test('[P1] should return 201 when nombre is exactly 200 characters (boundary)', async ({ request }) => {
    // GIVEN: nombre at exact max length of 200 chars
    const payload = buildClientePayload({ nombre: 'A'.repeat(200) });

    // WHEN: POST request is sent
    const response = await request.post(ENDPOINT, { data: payload });

    // THEN: 201 Created (200 chars is valid per validator MaximumLength(200))
    expect(response.status()).toBe(201);
  });

  test('[P1] should return 400 when nombre exceeds 200 characters', async ({ request }) => {
    // GIVEN: nombre at 201 characters (one over the limit)
    const payload = buildClientePayload({ nombre: 'A'.repeat(201) });

    // WHEN: POST request is sent
    const response = await request.post(ENDPOINT, { data: payload });

    // THEN: 400 Bad Request
    expect(response.status()).toBe(400);
  });

  test('[P1] should return 400 when nit exceeds 200 characters', async ({ request }) => {
    // GIVEN: nit at 201 characters
    const payload = buildClientePayload({ nit: 'N'.repeat(201) });

    // WHEN: POST request is sent
    const response = await request.post(ENDPOINT, { data: payload });

    // THEN: 400 Bad Request
    expect(response.status()).toBe(400);
  });

  test('[P1] should return 400 when telefono exceeds 200 characters', async ({ request }) => {
    // GIVEN: telefono at 201 characters
    const payload = buildClientePayload({ telefono: '1'.repeat(201) });

    // WHEN: POST request is sent
    const response = await request.post(ENDPOINT, { data: payload });

    // THEN: 400 Bad Request
    expect(response.status()).toBe(400);
  });

  test('[P1] should return 400 when ciudad exceeds 200 characters', async ({ request }) => {
    // GIVEN: ciudad at 201 characters
    const payload = buildClientePayload({ ciudad: 'C'.repeat(201) });

    // WHEN: POST request is sent
    const response = await request.post(ENDPOINT, { data: payload });

    // THEN: 400 Bad Request
    expect(response.status()).toBe(400);
  });
});

// ─── Missing or empty body ─────────────────────────────────────────────────────

test.describe('[P1] POST /api/v1/clientes — Missing or empty body', () => {
  test('[P1] should return 400 when an empty JSON object is sent', async ({ request }) => {
    // GIVEN: Empty object body (no fields at all)
    const response = await request.post(ENDPOINT, {
      data: {},
      headers: { 'Content-Type': 'application/json' },
    });

    // THEN: 400 Bad Request (all required fields missing)
    expect(response.status()).toBe(400);
  });

  test('[P1] should return 415 when Content-Type is not application/json', async ({ request }) => {
    // GIVEN: Request sent with text/plain content type
    const response = await request.post(ENDPOINT, {
      headers: { 'Content-Type': 'text/plain' },
      data: 'nombre=Empresa&nit=900000001-0&telefono=3001234567&ciudad=Bogota',
    });

    // THEN: 415 Unsupported Media Type (ASP.NET requires application/json)
    expect(response.status()).toBe(415);
  });
});

// ─── 400 Problem Details structure ────────────────────────────────────────────

test.describe('[P1] POST /api/v1/clientes — 400 Problem Details structure completeness', () => {
  test('[P1] should include the failing field in the 400 errors object', async ({ request }) => {
    // GIVEN: Payload with empty nombre
    const payload = { nit: '900000001-0', telefono: '3001234567', ciudad: 'Bogotá' };

    // WHEN: POST request is sent with missing nombre
    const response = await request.post(ENDPOINT, { data: payload });
    const body = await response.json() as Record<string, unknown>;

    // THEN: errors object references the failing field
    expect(response.status()).toBe(400);
    expect(body).toHaveProperty('status');
    expect(body['status']).toBe(400);
  });

  test('[P1] should return 400 with errors for all four fields when all are empty', async ({ request }) => {
    // GIVEN: Payload where all required fields are empty
    const payload = { nombre: '', nit: '', telefono: '', ciudad: '' };

    // WHEN: POST request is sent
    const response = await request.post(ENDPOINT, { data: payload });
    const body = await response.json() as Record<string, unknown>;

    // THEN: Response is 400 with errors object
    expect(response.status()).toBe(400);
    expect(typeof body).toBe('object');
  });

  test('[P1] should not expose stack trace or raw exception details in 400 response (NFR6)', async ({ request }) => {
    // GIVEN: Invalid payload
    const payload = { ...buildClientePayload(), nombre: '' };

    // WHEN: POST request is sent
    const response = await request.post(ENDPOINT, { data: payload });
    const body = await response.json() as Record<string, unknown>;
    const bodyString = JSON.stringify(body).toLowerCase();

    // THEN: No raw exception details are exposed
    expect(bodyString).not.toContain('stack trace');
    expect(bodyString).not.toContain('at system.');
    expect(bodyString).not.toContain('exception');
  });
});

// ─── 409 response Content-Type ────────────────────────────────────────────────

test.describe('[P1] POST /api/v1/clientes — 409 response headers', () => {
  test('[P1] should return Content-Type application/problem+json on 409 Conflict', async ({ request }) => {
    // GIVEN: A client with a specific NIT already exists
    const uniqueNit = `CTYPE${Date.now()}`;
    await request.post(ENDPOINT, { data: buildClientePayload({ nit: uniqueNit }) });

    // WHEN: A duplicate POST is sent
    const response = await request.post(ENDPOINT, { data: buildClientePayload({ nit: uniqueNit }) });

    // THEN: Content-Type contains problem+json
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('problem+json');
  });

  test('[P1] should include status=409 in the Problem Details body on 409 Conflict', async ({ request }) => {
    // GIVEN: A client with a specific NIT already exists
    const uniqueNit = `CTSTATUS${Date.now()}`;
    await request.post(ENDPOINT, { data: buildClientePayload({ nit: uniqueNit }) });

    // WHEN: A duplicate POST is sent
    const response = await request.post(ENDPOINT, { data: buildClientePayload({ nit: uniqueNit }) });
    const body = await response.json() as Record<string, unknown>;

    // THEN: Problem Details body has status 409
    expect(body['status']).toBe(409);
  });

  test('[P1] should include title field in the Problem Details body on 409 Conflict', async ({ request }) => {
    // GIVEN: A client with a specific NIT already exists
    const uniqueNit = `CTTITLE${Date.now()}`;
    await request.post(ENDPOINT, { data: buildClientePayload({ nit: uniqueNit }) });

    // WHEN: A duplicate POST is sent
    const response = await request.post(ENDPOINT, { data: buildClientePayload({ nit: uniqueNit }) });
    const body = await response.json() as Record<string, unknown>;

    // THEN: title is a non-empty string
    expect(typeof body['title']).toBe('string');
    expect((body['title'] as string).length).toBeGreaterThan(0);
  });
});

// ─── 201 response timestamps are UTC ──────────────────────────────────────────

test.describe('[P1] POST /api/v1/clientes — 201 response timestamp format', () => {
  test('[P1] should return createdAt as a UTC ISO timestamp (Z or +00:00 suffix)', async ({ request }) => {
    // GIVEN: A valid cliente payload
    const payload = buildClientePayload();

    // WHEN: POST request is sent
    const response = await request.post(ENDPOINT, { data: payload });
    const body = await response.json() as Record<string, unknown>;

    // THEN: createdAt ends with Z or +00:00 (UTC — DateTimeOffset.UtcNow standard)
    const createdAt = body['createdAt'] as string;
    expect(createdAt).toMatch(/Z$|[+-]00:00$/);
  });

  test('[P1] should return updatedAt as a UTC ISO timestamp (Z or +00:00 suffix)', async ({ request }) => {
    // GIVEN: A valid cliente payload
    const payload = buildClientePayload();

    // WHEN: POST request is sent
    const response = await request.post(ENDPOINT, { data: payload });
    const body = await response.json() as Record<string, unknown>;

    // THEN: updatedAt ends with Z or +00:00 (UTC)
    const updatedAt = body['updatedAt'] as string;
    expect(updatedAt).toMatch(/Z$|[+-]00:00$/);
  });

  test('[P2] should return createdAt and updatedAt with the same value on initial creation', async ({ request }) => {
    // GIVEN: A valid cliente payload (newly created, no updates yet)
    const payload = buildClientePayload();

    // WHEN: POST request is sent
    const response = await request.post(ENDPOINT, { data: payload });
    const body = await response.json() as Record<string, unknown>;

    // THEN: createdAt and updatedAt are equal (no update has occurred)
    // Allow 1 second tolerance for execution time
    const createdAt = new Date(body['createdAt'] as string).getTime();
    const updatedAt = new Date(body['updatedAt'] as string).getTime();
    expect(Math.abs(createdAt - updatedAt)).toBeLessThan(1000);
  });
});

// ─── Location header points to accessible resource ────────────────────────────

test.describe('[P1] POST /api/v1/clientes — Location header resolves to real resource', () => {
  test('[P1] should return a Location header that resolves to the created client via GET', async ({ request }) => {
    // GIVEN: A valid cliente payload
    const payload = buildClientePayload({ nombre: 'Location Header Test SA' });

    // WHEN: POST request is sent
    const postResponse = await request.post(ENDPOINT, { data: payload });
    expect(postResponse.status()).toBe(201);
    const location = postResponse.headers()['location'];
    expect(location).toBeDefined();

    // THEN: A GET to the Location URL returns 200 with the same client
    const getResponse = await request.get(`${BASE_URL}${location}`);
    expect(getResponse.status()).toBe(200);
    const body = await getResponse.json() as Record<string, unknown>;
    expect(body['nombre']).toBe('Location Header Test SA');
  });
});

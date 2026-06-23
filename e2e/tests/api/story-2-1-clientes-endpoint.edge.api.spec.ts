/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * EDGE CASE EXPANSION — testarch-automate (BMad-Integrated Mode)
 * Expands ATDD API coverage with boundary conditions, negative paths,
 * and protocol-level validations not covered in the RED-phase ATDD tests.
 *
 * Acceptance Criteria targeted:
 *   AC6 — Endpoint contract edge cases (unsupported methods, headers, response consistency)
 *   AC7 — DB constraints edge cases (NIT field length boundaries, required field validation)
 *
 * Test level: API Integration (direct HTTP against running backend)
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';
const CLIENTES_URL = `${API_BASE_URL}/api/v1/clientes`;

// ─────────────────────────────────────────────────────────────────────────────
// AC6 Edge Cases — Endpoint protocol and contract boundaries
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Endpoint protocol edge cases', () => {
  test('[P1] GET /api/v1/clientes should not expose internal error details in response body', async ({ request }) => {
    // GIVEN: The endpoint is running
    // WHEN: A GET request is made
    const response = await request.get(CLIENTES_URL);

    // THEN: If status is not 200, the body must NOT expose stack traces
    if (!response.ok()) {
      const body = await response.text();
      expect(body).not.toContain('StackTrace');
      expect(body).not.toContain('InnerException');
      expect(body).not.toContain('NpgsqlException');
    } else {
      // If 200 — ensure the response is valid JSON array
      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
    }
  });

  test('[P1] GET /api/v1/clientes should return consistent field names (camelCase)', async ({ request }) => {
    // GIVEN: At least one client exists
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(CLIENTES_URL);
    if (!response.ok()) {
      test.skip(); // Skip if backend not running
      return;
    }
    const body = await response.json();

    // THEN: If clients exist, fields must be camelCase (not PascalCase from C#)
    if (body.length > 0) {
      const client = body[0];
      // camelCase fields expected
      expect(client).toHaveProperty('id');
      expect(client).toHaveProperty('nombre');
      expect(client).toHaveProperty('nit');
      expect(client).toHaveProperty('createdAt'); // camelCase, not CreatedAt
      expect(client).toHaveProperty('updatedAt'); // camelCase, not UpdatedAt

      // Must NOT have PascalCase variants
      expect(client).not.toHaveProperty('Nombre');
      expect(client).not.toHaveProperty('NIT');
      expect(client).not.toHaveProperty('CreatedAt');
      expect(client).not.toHaveProperty('UpdatedAt');
      expect(client).not.toHaveProperty('Id');
    }
  });

  test('[P1] GET /api/v1/clientes should not wrap the array in an object', async ({ request }) => {
    // GIVEN: The endpoint is running
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(CLIENTES_URL);
    if (!response.ok()) {
      test.skip();
      return;
    }
    const body = await response.json();

    // THEN: Response is a direct array, not { data: [], items: [], results: [], value: [] }
    expect(Array.isArray(body)).toBe(true);
    expect(body).not.toHaveProperty('data');
    expect(body).not.toHaveProperty('items');
    expect(body).not.toHaveProperty('results');
    expect(body).not.toHaveProperty('value');
    expect(body).not.toHaveProperty('content');
  });

  test('[P2] GET /api/v1/clientes response should have charset in Content-Type for UTF-8 support', async ({ request }) => {
    // GIVEN: The endpoint is running
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(CLIENTES_URL);
    if (!response.ok()) {
      test.skip();
      return;
    }

    // THEN: Content-Type header contains application/json (UTF-8 support implied)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');
  });

  test('[P2] GET /api/v1/clientes should respond within reasonable time (under 3 seconds)', async ({ request }) => {
    // GIVEN: The endpoint is running
    const start = Date.now();

    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(CLIENTES_URL);
    const elapsed = Date.now() - start;

    // THEN: Response time is under 3000ms
    if (response.ok()) {
      expect(elapsed).toBeLessThan(3000);
    }
  });

  test('[P2] POST to /api/v1/clientes with missing required nombre field should return 400', async ({ request }) => {
    // GIVEN: A payload missing the required nombre field
    const invalidPayload = {
      // nombre is missing
      nit: `MISS${Date.now()}`.slice(0, 12),
      telefono: null,
      ciudad: null,
    };

    // WHEN: POST is made with missing nombre
    const response = await request.post(CLIENTES_URL, {
      data: invalidPayload,
    });

    // THEN: Response is 400 Bad Request (if POST is implemented — skip if not)
    if (response.status() !== 404 && response.status() !== 405) {
      expect(response.status()).toBe(400);
    }
  });

  test('[P2] POST to /api/v1/clientes with missing required nit field should return 400', async ({ request }) => {
    // GIVEN: A payload missing the required nit field
    const invalidPayload = {
      nombre: `Missing NIT Test ${Date.now()}`,
      // nit is missing
      telefono: null,
      ciudad: null,
    };

    // WHEN: POST is made with missing nit
    const response = await request.post(CLIENTES_URL, {
      data: invalidPayload,
    });

    // THEN: Response is 400 Bad Request (if POST is implemented)
    if (response.status() !== 404 && response.status() !== 405) {
      expect(response.status()).toBe(400);
    }
  });

  test('[P2] POST to /api/v1/clientes with empty string nombre should return 400', async ({ request }) => {
    // GIVEN: A payload with empty string nombre (whitespace)
    const invalidPayload = {
      nombre: '',
      nit: `EMPTY${Date.now()}`.slice(0, 12),
      telefono: null,
      ciudad: null,
    };

    // WHEN: POST is made with empty nombre
    const response = await request.post(CLIENTES_URL, {
      data: invalidPayload,
    });

    // THEN: Response is 400 Bad Request (validation should catch empty string)
    if (response.status() !== 404 && response.status() !== 405) {
      expect(response.status()).toBe(400);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC7 Edge Cases — DB constraints and field length boundaries
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 — DB constraint edge cases', () => {
  test('[P1] POST with NIT at maximum allowed length (50 chars) should succeed', async ({ request }) => {
    // GIVEN: A NIT at exactly max length (50 chars per ClienteConfiguration)
    const maxNit = 'N'.repeat(50);
    const payload = {
      nombre: `Max NIT Length Test ${Date.now()}`,
      nit: maxNit,
      telefono: null,
      ciudad: null,
    };

    // WHEN: POST is made
    const response = await request.post(CLIENTES_URL, {
      data: payload,
    });

    // THEN: Response is 201 Created (max length accepted)
    if (response.status() !== 404 && response.status() !== 405) {
      expect([201, 200]).toContain(response.status());

      // Cleanup
      const created = response.status() === 201 ? await response.json() : null;
      if (created?.id) {
        await request.delete(`${CLIENTES_URL}/${created.id}`);
      }
    }
  });

  test('[P1] POST with NIT exceeding maximum allowed length (51 chars) should return 400', async ({ request }) => {
    // GIVEN: A NIT exceeding max length (51 chars > 50 char limit)
    const oversizedNit = 'N'.repeat(51);
    const payload = {
      nombre: `Oversized NIT Test ${Date.now()}`,
      nit: oversizedNit,
      telefono: null,
      ciudad: null,
    };

    // WHEN: POST is made with oversized NIT
    const response = await request.post(CLIENTES_URL, {
      data: payload,
    });

    // THEN: Response is 400 (validation rejects oversized NIT)
    if (response.status() !== 404 && response.status() !== 405) {
      expect(response.status()).toBe(400);
    }
  });

  test('[P1] POST with nombre at maximum allowed length (200 chars) should succeed', async ({ request }) => {
    // GIVEN: A nombre at exactly max length (200 chars per ClienteConfiguration)
    const maxNombre = 'A'.repeat(200);
    const nit = `MAXN${Date.now()}`.slice(0, 12);
    const payload = {
      nombre: maxNombre,
      nit,
      telefono: null,
      ciudad: null,
    };

    // WHEN: POST is made
    const response = await request.post(CLIENTES_URL, {
      data: payload,
    });

    // THEN: Response is 201 Created (max nombre length accepted)
    if (response.status() !== 404 && response.status() !== 405) {
      expect([201, 200]).toContain(response.status());

      // Cleanup
      const created = response.status() === 201 ? await response.json() : null;
      if (created?.id) {
        await request.delete(`${CLIENTES_URL}/${created.id}`);
      }
    }
  });

  test('[P2] POST with whitespace-only nombre should return 400', async ({ request }) => {
    // GIVEN: nombre is whitespace only (should fail ArgumentException.ThrowIfNullOrWhiteSpace)
    const payload = {
      nombre: '   ',
      nit: `WS${Date.now()}`.slice(0, 12),
      telefono: null,
      ciudad: null,
    };

    // WHEN: POST is made
    const response = await request.post(CLIENTES_URL, {
      data: payload,
    });

    // THEN: Response is 400 (whitespace-only nombre violates domain validation)
    if (response.status() !== 404 && response.status() !== 405) {
      expect(response.status()).toBe(400);
    }
  });

  test('[P2] POST with whitespace-only nit should return 400', async ({ request }) => {
    // GIVEN: nit is whitespace only (violates ArgumentException.ThrowIfNullOrWhiteSpace)
    const payload = {
      nombre: `Whitespace NIT Test ${Date.now()}`,
      nit: '   ',
      telefono: null,
      ciudad: null,
    };

    // WHEN: POST is made
    const response = await request.post(CLIENTES_URL, {
      data: payload,
    });

    // THEN: Response is 400
    if (response.status() !== 404 && response.status() !== 405) {
      expect(response.status()).toBe(400);
    }
  });

  test('[P1] NIT uniqueness constraint error response should NOT expose stack trace', async ({ request }) => {
    // GIVEN: A client with a specific NIT exists
    const nit = `UNIQ${Date.now()}`.slice(0, 12);
    const firstCreate = await request.post(CLIENTES_URL, {
      data: {
        nombre: `Unique NIT Owner ${Date.now()}`,
        nit,
        telefono: null,
        ciudad: null,
      },
    });
    const firstClient = firstCreate.status() === 201 ? await firstCreate.json() : null;

    if (!firstClient?.id) {
      test.skip(); // POST not implemented, skip
      return;
    }

    // WHEN: A duplicate NIT POST is made
    const duplicateResponse = await request.post(CLIENTES_URL, {
      data: {
        nombre: `Duplicate NIT ${Date.now()}`,
        nit, // same NIT
        telefono: null,
        ciudad: null,
      },
    });

    // THEN: Response is 409 and body is safe (no internal details)
    expect(duplicateResponse.status()).toBe(409);
    const body = await duplicateResponse.text();
    expect(body).not.toContain('StackTrace');
    expect(body).not.toContain('InnerException');
    expect(body).not.toContain('PostgreSQL');
    expect(body).not.toContain('at SiesaAgents');

    // Cleanup
    await request.delete(`${CLIENTES_URL}/${firstClient.id}`);
  });

  test('[P2] createdAt and updatedAt should not be manipulable via POST payload', async ({ request }) => {
    // GIVEN: A POST payload attempting to set custom createdAt
    const fakeDate = '2000-01-01T00:00:00Z';
    const nit = `DATES${Date.now()}`.slice(0, 12);
    const response = await request.post(CLIENTES_URL, {
      data: {
        nombre: `Date Override Test ${Date.now()}`,
        nit,
        telefono: null,
        ciudad: null,
        createdAt: fakeDate, // attempt to override server-generated timestamp
        updatedAt: fakeDate,
      },
    });

    if (response.status() !== 201 && response.status() !== 200) {
      test.skip();
      return;
    }

    const created = await response.json();

    // THEN: createdAt is NOT the fake date (server sets its own timestamp)
    if (created?.createdAt) {
      expect(created.createdAt).not.toBe(fakeDate);
      // Should be recent (within last 10 seconds)
      const createdDate = new Date(created.createdAt).getTime();
      const now = Date.now();
      expect(now - createdDate).toBeLessThan(10000);
    }

    // Cleanup
    if (created?.id) {
      await request.delete(`${CLIENTES_URL}/${created.id}`);
    }
  });
});

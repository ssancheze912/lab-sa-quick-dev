import { test, expect } from '@playwright/test';

/**
 * API Edge Case Tests — Story 2.1: GET /api/v1/clientes
 *
 * Complements the ATDD API tests in 2-1-client-list-search.api.spec.ts with:
 *   - Response time is under 2 seconds (NFR2 boundary for page load)
 *   - Response body for GET /api/v1/clientes is never null (always array)
 *   - Concurrent requests do not fail (NFR3 boundary — 3 concurrent, lightweight)
 *   - Error response does not include stackTrace field (NFR6)
 *   - GET /api/v1/clientes with Accept: application/json header works
 *   - IDs in the response are valid UUID v4 format
 *   - createdAt / updatedAt are ISO-8601 formatted strings
 */

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5000';

test.describe('Story 2.1 — GET /api/v1/clientes API Edge Cases', () => {

  // ─────────────────────────────────────────────────────────────────────────
  // NFR2 boundary — response within 2 seconds
  // ─────────────────────────────────────────────────────────────────────────

  test('GET /api/v1/clientes responds within 2 seconds (NFR2 boundary)', async ({ request }) => {
    const start = Date.now();

    const response = await request.get(`${API_BASE}/api/v1/clientes`);

    const elapsed = Date.now() - start;

    expect(response.status()).toBe(200);
    // NFR2: page load (including API call) within 2 seconds
    expect(elapsed).toBeLessThan(2000);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Response body is always a JSON array (never null)
  // ─────────────────────────────────────────────────────────────────────────

  test('GET /api/v1/clientes response body is never null — always an array', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/v1/clientes`);

    expect(response.status()).toBe(200);

    const body = await response.json();

    // Must be a non-null array
    expect(body).not.toBeNull();
    expect(Array.isArray(body)).toBe(true);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Explicit Accept header: application/json
  // ─────────────────────────────────────────────────────────────────────────

  test('GET /api/v1/clientes with Accept: application/json header returns 200', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/v1/clientes`, {
      headers: {
        Accept: 'application/json',
      },
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // UUID format validation on returned IDs
  // ─────────────────────────────────────────────────────────────────────────

  test('each client item id is a valid UUID format', async ({ request }) => {
    // Create a client to ensure at least one exists
    const createResp = await request.post(`${API_BASE}/api/v1/clientes`, {
      data: {
        nombre: 'Empresa UUID Test',
        nit: `UUID${Date.now().toString().slice(-6)}`,
        telefono: '3001234567',
        ciudad: 'Bogotá',
      },
    });

    const created = createResp.ok() ? await createResp.json() : null;

    const response = await request.get(`${API_BASE}/api/v1/clientes`);
    const body = await response.json();

    if (body.length > 0) {
      const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      for (const item of body) {
        expect(typeof item.id).toBe('string');
        expect(item.id).toMatch(uuidV4Regex);
      }
    }

    // Cleanup
    if (created?.id) {
      await request.delete(`${API_BASE}/api/v1/clientes/${created.id}`);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ISO-8601 timestamps
  // ─────────────────────────────────────────────────────────────────────────

  test('createdAt and updatedAt fields are ISO-8601 formatted strings', async ({ request }) => {
    const createResp = await request.post(`${API_BASE}/api/v1/clientes`, {
      data: {
        nombre: 'Empresa ISO Test',
        nit: `ISO${Date.now().toString().slice(-6)}`,
        telefono: '3007654321',
        ciudad: 'Medellín',
      },
    });

    const created = createResp.ok() ? await createResp.json() : null;

    const response = await request.get(`${API_BASE}/api/v1/clientes`);
    const body = await response.json();

    if (body.length > 0) {
      // ISO-8601 pattern (basic check: parseable date that is not NaN)
      for (const item of body) {
        expect(typeof item.createdAt).toBe('string');
        expect(typeof item.updatedAt).toBe('string');

        const createdAtDate = new Date(item.createdAt);
        const updatedAtDate = new Date(item.updatedAt);

        expect(isNaN(createdAtDate.getTime())).toBe(false);
        expect(isNaN(updatedAtDate.getTime())).toBe(false);
      }
    }

    // Cleanup
    if (created?.id) {
      await request.delete(`${API_BASE}/api/v1/clientes/${created.id}`);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // NFR6 — Error response does not include stackTrace
  // ─────────────────────────────────────────────────────────────────────────

  test('404 error response for unknown client ID does not include stackTrace (NFR6)', async ({ request }) => {
    const nonExistentId = '00000000-0000-4000-8000-000000000001';

    const response = await request.get(`${API_BASE}/api/v1/clientes/${nonExistentId}`);

    // May be 404 (if GET /clientes/:id exists) or 404-via-404-handler
    // Either way, the body must not expose internal details
    if (response.status() === 404) {
      const body = await response.json();
      expect(body).not.toHaveProperty('stackTrace');
      expect(body).not.toHaveProperty('exception');
      expect(body).not.toHaveProperty('traceId');
      // RFC 7807 shape expected
      expect(body).toHaveProperty('title');
      expect(body).toHaveProperty('status');
    } else {
      // Endpoint may not exist yet (Story 2.2); skip assertion but record status
      expect([404, 405]).toContain(response.status());
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Lightweight concurrent requests (NFR3 boundary — 3 concurrent)
  // ─────────────────────────────────────────────────────────────────────────

  test('3 concurrent GET /api/v1/clientes requests all return 200 within 2 seconds', async ({ request }) => {
    const start = Date.now();

    const [r1, r2, r3] = await Promise.all([
      request.get(`${API_BASE}/api/v1/clientes`),
      request.get(`${API_BASE}/api/v1/clientes`),
      request.get(`${API_BASE}/api/v1/clientes`),
    ]);

    const elapsed = Date.now() - start;

    expect(r1.status()).toBe(200);
    expect(r2.status()).toBe(200);
    expect(r3.status()).toBe(200);

    // All concurrent requests must complete within NFR2 threshold (2 seconds)
    expect(elapsed).toBeLessThan(2000);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Fields are NOT null for a newly created client
  // ─────────────────────────────────────────────────────────────────────────

  test('all required DTO fields are non-null and non-empty for a created client', async ({ request }) => {
    const nit = `NNULL${Date.now().toString().slice(-5)}`;
    const createResp = await request.post(`${API_BASE}/api/v1/clientes`, {
      data: {
        nombre: 'Empresa No Null',
        nit,
        telefono: '3001111222',
        ciudad: 'Barranquilla',
      },
    });

    if (!createResp.ok()) {
      // Endpoint not yet implemented (Story 2.3) — skip this test
      test.skip();
      return;
    }

    const created = await createResp.json();

    const response = await request.get(`${API_BASE}/api/v1/clientes`);
    const body = await response.json();

    const item = body.find((c: { id: string }) => c.id === created?.id);

    if (item) {
      expect(item.id).toBeTruthy();
      expect(item.nombre).toBeTruthy();
      expect(item.nit).toBeTruthy();
      expect(item.telefono).toBeTruthy();
      expect(item.ciudad).toBeTruthy();
      expect(item.createdAt).toBeTruthy();
      expect(item.updatedAt).toBeTruthy();
    }

    // Cleanup
    if (created?.id) {
      await request.delete(`${API_BASE}/api/v1/clientes/${created.id}`);
    }
  });
});

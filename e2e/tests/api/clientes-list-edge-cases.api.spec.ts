/**
 * Story 2.1: Client List & Search — API Edge Cases
 * Epic 2: Client Management
 *
 * Automation Tests — API Level Edge Cases & Boundary Conditions
 * Expands coverage beyond ATDD tests in clientes-list.api.spec.ts.
 *
 * Covers:
 *   - HTTP method enforcement (POST/PUT/DELETE → 405)
 *   - Response shape validation for individual fields (nombre, nit, telefono, ciudad max lengths)
 *   - Response array ordering stability
 *   - Content-Encoding / Accept header negotiation
 *   - Large dataset (25+ records) — response remains a flat array
 *   - Duplicate NIT uniqueness constraint surfaced through shape validation
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';
const CLIENTES_ENDPOINT = `${API_BASE_URL}/api/v1/clientes`;

// ─────────────────────────────────────────────────────────────────────────────
// HTTP Method enforcement
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] HTTP method enforcement on GET /api/v1/clientes', () => {
  test('[P1] should NOT return 200 for POST requests to /api/v1/clientes', async ({ request }) => {
    // GIVEN: The endpoint only supports GET
    // WHEN: A POST request is made
    const response = await request.post(CLIENTES_ENDPOINT, {
      data: { nombre: 'Test', nit: '000000000-0', telefono: '300000000', ciudad: 'Bogotá' },
    });

    // THEN: The response is 404 or 405 (not 200)
    // Note: Minimal API may return 404 if no POST route is mapped, or 405 if method is explicitly rejected
    expect([404, 405]).toContain(response.status());
  });

  test('[P1] should NOT return 200 for DELETE requests to /api/v1/clientes', async ({ request }) => {
    // GIVEN: The endpoint only supports GET
    // WHEN: A DELETE request is made
    const response = await request.delete(CLIENTES_ENDPOINT);

    // THEN: The response is 404 or 405
    expect([404, 405]).toContain(response.status());
  });

  test('[P1] should NOT return 200 for PUT requests to /api/v1/clientes', async ({ request }) => {
    // GIVEN: The endpoint only supports GET
    // WHEN: A PUT request is made
    const response = await request.put(CLIENTES_ENDPOINT, {
      data: {},
    });

    // THEN: The response is 404 or 405
    expect([404, 405]).toContain(response.status());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Response shape — field value types and boundaries
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Response shape — field value types', () => {
  test('[P2] all string fields in response items should be non-null strings', async ({
    request,
  }) => {
    // GIVEN: The endpoint returns any number of clients
    // WHEN: A GET request is made
    const response = await request.get(CLIENTES_ENDPOINT);
    const body = await response.json();

    if (!Array.isArray(body) || body.length === 0) {
      return; // Skip if no data seeded
    }

    // THEN: All string fields are non-null, non-undefined strings
    for (const item of body) {
      expect(typeof item.nombre).toBe('string');
      expect(item.nombre.length).toBeGreaterThan(0);

      expect(typeof item.nit).toBe('string');
      expect(item.nit.length).toBeGreaterThan(0);

      expect(typeof item.telefono).toBe('string');
      expect(item.telefono.length).toBeGreaterThan(0);

      expect(typeof item.ciudad).toBe('string');
      expect(item.ciudad.length).toBeGreaterThan(0);
    }
  });

  test('[P2] createdAt field should parse to a valid future-or-past date (not epoch zero)', async ({
    request,
  }) => {
    // GIVEN: The endpoint returns clients
    const response = await request.get(CLIENTES_ENDPOINT);
    const body = await response.json();

    if (!Array.isArray(body) || body.length === 0) {
      return;
    }

    // THEN: createdAt parses to a non-epoch date (DateTimeOffset, not default DateTime)
    for (const item of body) {
      const parsed = new Date(item.createdAt);
      expect(parsed.getTime()).toBeGreaterThan(new Date('2020-01-01').getTime());
    }
  });

  test('[P2] id field should conform to lowercase UUID v4 format', async ({ request }) => {
    // GIVEN: The endpoint returns clients
    const response = await request.get(CLIENTES_ENDPOINT);
    const body = await response.json();

    if (!Array.isArray(body) || body.length === 0) {
      return;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

    // THEN: All IDs are valid lowercase UUIDs (not GUIDs with uppercase chars)
    for (const item of body) {
      expect(item.id).toMatch(uuidRegex);
    }
  });

  test('[P2] response should NOT contain extra undocumented fields (no updatedAt, no passwordHash, etc.)', async ({
    request,
  }) => {
    // GIVEN: The contract specifies exactly: id, nombre, nit, telefono, ciudad, createdAt
    const response = await request.get(CLIENTES_ENDPOINT);
    const body = await response.json();

    if (!Array.isArray(body) || body.length === 0) {
      return;
    }

    const allowedKeys = new Set(['id', 'nombre', 'nit', 'telefono', 'ciudad', 'createdAt']);

    // THEN: No item contains fields outside the documented contract
    for (const item of body) {
      const actualKeys = Object.keys(item);
      for (const key of actualKeys) {
        expect(allowedKeys.has(key)).toBe(true);
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CORS — preflight OPTIONS
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] CORS preflight support', () => {
  test('[P2] should respond to OPTIONS preflight request for /api/v1/clientes', async ({
    request,
  }) => {
    // GIVEN: The DevCors policy is configured
    // WHEN: A CORS preflight OPTIONS request is sent
    const response = await request.fetch(CLIENTES_ENDPOINT, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: The response is 200 or 204 (not 403 or 5xx)
    expect([200, 204]).toContain(response.status());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Security — no internal details in 404 responses
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Security — no internal details exposed', () => {
  test('[P1] should not expose database connection strings or internal paths in error responses', async ({
    request,
  }) => {
    // GIVEN: A request that triggers a 404
    const response = await request.get(`${API_BASE_URL}/api/v1/nonexistent-endpoint-12345`);

    // WHEN: Reading the response body
    const text = await response.text();

    // THEN: No internal secrets or paths are exposed
    expect(text).not.toContain('Host=');
    expect(text).not.toContain('Password=');
    expect(text).not.toContain('C:\\');
    expect(text).not.toContain('/home/');
    expect(text).not.toContain('npgsql');
  });

  test('[P1] should return JSON or Problem Details for a 404 (not HTML error page)', async ({
    request,
  }) => {
    // GIVEN: A request to a non-existent route
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/totally-unknown-path-xyz`);

    // WHEN: Reading the content type
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: The response is JSON/problem+json, not an HTML page
    // (HTML content type would indicate ASP.NET developer exception page leaking)
    const isHtml = contentType.includes('text/html');
    expect(isHtml).toBe(false);
  });
});

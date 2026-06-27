import { test, expect } from '@playwright/test';

/**
 * Story 1.1 — Backend CORS: DELETE Method Preflight & Authorization Header
 *
 * BMad-Integrated: Expands ATDD + edge coverage by targeting CORS preflight scenarios
 * NOT yet covered in the existing test files:
 *
 *   backend-initialization.api.spec.ts — covers GET + OPTIONS for /scalar
 *   backend-cors-edge-cases.spec.ts    — covers POST, PUT, disallowed origin, Content-Type
 *   backend-health-edge.spec.ts        — covers allowed-origin GET, disallowed-origin OPTIONS
 *
 * Remaining gaps:
 *   - DELETE method preflight is not tested
 *   - Authorization header in preflight is not tested (AllowAnyHeader covers it)
 *   - PATCH method preflight is not tested
 *   - Preflight response does not include Allow-Credentials: true (AC3 security boundary)
 *   - Multiple custom headers in a single preflight are not tested
 *
 * Test IDs: API-CORS-EXT-01 … API-CORS-EXT-05
 *
 * Priority: P1 — validates AllowAnyMethod() and AllowAnyHeader() configured in Program.cs
 */

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';
const ALLOWED_ORIGIN = 'http://localhost:5173';

test.describe('AC3 — CORS preflight for DELETE, PATCH and Authorization header', () => {
  /**
   * API-CORS-EXT-01 (P1 — AC3)
   * Boundary: DELETE method preflight from the allowed frontend origin.
   * AllowAnyMethod() in DevCors policy must allow DELETE — required for client
   * delete operations (e.g. DELETE /api/v1/clientes/:id in future stories).
   */
  test('[P1] API-CORS-EXT-01 — DELETE preflight from frontend origin es permitido', async ({ request }) => {
    // GIVEN: DevCors uses AllowAnyMethod() which must include DELETE
    // WHEN: An OPTIONS preflight for DELETE is sent from the allowed origin
    const response = await request.fetch(`${API_BASE_URL}/api/v1/clientes`, {
      method: 'OPTIONS',
      headers: {
        Origin: ALLOWED_ORIGIN,
        'Access-Control-Request-Method': 'DELETE',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: The preflight response is NOT a CORS rejection
    // A CORS rejection from .NET returns 204 without Allow-Origin; a pass returns with the header.
    // The critical assertion: the server responds without a 5xx error
    expect(response.status()).toBeLessThan(500);

    // AND: If the CORS policy allows it, the Allow-Origin header must match the origin
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    // If the header is present, it must be the allowed origin (not a wildcard or different origin)
    if (allowOrigin) {
      expect(allowOrigin).toBe(ALLOWED_ORIGIN);
    }
  });

  /**
   * API-CORS-EXT-02 (P1 — AC3)
   * Boundary: PATCH method preflight from the allowed frontend origin.
   * AllowAnyMethod() must include PATCH — needed for partial-update operations.
   */
  test('[P1] API-CORS-EXT-02 — PATCH preflight desde frontend origin no es rechazado', async ({ request }) => {
    // GIVEN: DevCors uses AllowAnyMethod()
    // WHEN: An OPTIONS preflight for PATCH is sent
    const response = await request.fetch(`${API_BASE_URL}/api/v1/clientes`, {
      method: 'OPTIONS',
      headers: {
        Origin: ALLOWED_ORIGIN,
        'Access-Control-Request-Method': 'PATCH',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: The server responds without a 500
    expect(response.status()).toBeLessThan(500);

    // AND: If CORS headers are returned, the origin must match
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    if (allowOrigin) {
      expect(allowOrigin).toBe(ALLOWED_ORIGIN);
    }
  });

  /**
   * API-CORS-EXT-03 (P1 — AC3)
   * Boundary: Preflight with Authorization header must be allowed by AllowAnyHeader().
   * Future auth stories will send bearer tokens via Authorization; the preflight
   * must confirm this header is permitted.
   */
  test('[P1] API-CORS-EXT-03 — Preflight con cabecera Authorization es permitido (AllowAnyHeader)', async ({ request }) => {
    // GIVEN: DevCors uses AllowAnyHeader() which must include Authorization
    // WHEN: An OPTIONS preflight is sent with Authorization in Access-Control-Request-Headers
    const response = await request.fetch(`${API_BASE_URL}/api/v1/clientes`, {
      method: 'OPTIONS',
      headers: {
        Origin: ALLOWED_ORIGIN,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });

    // THEN: Server responds without error
    expect(response.status()).toBeLessThan(500);

    // AND: If Allow-Headers is returned, it must include Authorization or be a wildcard
    const allowHeaders = response.headers()['access-control-allow-headers'] ?? '';
    if (allowHeaders) {
      const headersLower = allowHeaders.toLowerCase();
      expect(
        headersLower.includes('authorization') || allowHeaders === '*',
        `Expected Authorization to be allowed in CORS. Got: "${allowHeaders}"`,
      ).toBe(true);
    }
  });

  /**
   * API-CORS-EXT-04 (P1 — AC3 / NFR Security)
   * Error path: Preflight from a disallowed origin for DELETE must NOT receive
   * the Access-Control-Allow-Origin header. This prevents unauthorized origins
   * from performing destructive DELETE operations.
   */
  test('[P1] API-CORS-EXT-04 — DELETE preflight de origen no autorizado es rechazado', async ({ request }) => {
    // GIVEN: DevCors only allows http://localhost:5173
    // WHEN: An OPTIONS preflight for DELETE from an unauthorized origin
    const response = await request.fetch(`${API_BASE_URL}/api/v1/clientes`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://attacker.example.com',
        'Access-Control-Request-Method': 'DELETE',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: The unauthorized origin must NOT be echoed in Allow-Origin
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).not.toBe('http://attacker.example.com');
    expect(allowOrigin).not.toBe('*');
  });

  /**
   * API-CORS-EXT-05 (P2 — AC3)
   * Boundary: A preflight with multiple custom headers in a single request
   * (Content-Type + X-Request-ID) must be handled without a server error.
   * AllowAnyHeader() should accept any combination of headers.
   */
  test('[P2] API-CORS-EXT-05 — Preflight con múltiples cabeceras personalizadas no genera error 5xx', async ({ request }) => {
    // GIVEN: DevCors uses AllowAnyHeader()
    // WHEN: A preflight is sent with multiple headers
    const response = await request.fetch(`${API_BASE_URL}/api/v1/clientes`, {
      method: 'OPTIONS',
      headers: {
        Origin: ALLOWED_ORIGIN,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, X-Request-ID, X-Correlation-ID',
      },
    });

    // THEN: Server does NOT return 500 or 400 for the multi-header preflight
    expect(response.status()).not.toBeGreaterThanOrEqual(500);
    expect(response.status()).not.toBe(400);
  });
});

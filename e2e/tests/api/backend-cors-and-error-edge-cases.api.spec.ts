/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Test Automation Expansion (testarch-automate) — GREEN phase
 * Expands beyond the ATDD suite (e2e/tests/api/backend-initialization.api.spec.ts)
 * with edge cases, negative paths, and boundary conditions:
 *   - CORS negative cases (disallowed origin must NOT be granted access)
 *   - CORS method boundary (uncommon HTTP verb via AllowAnyMethod)
 *   - Problem Details (RFC 7807) structural validation, not just content-type
 *   - Routing case-insensitivity boundary
 *   - Malformed request body resilience
 *   - Concurrent request stability
 *
 * Acceptance Criteria covered: AC2, AC3, AC5
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';
const DISALLOWED_ORIGIN = 'http://evil.example.com';
const ALLOWED_ORIGIN = 'http://localhost:5173';

test.describe('CORS — negative cases for disallowed origins', () => {
  test('[P1] should NOT grant Access-Control-Allow-Origin to a disallowed origin on a simple GET', async ({
    request,
  }) => {
    // GIVEN: CORS policy "DevCors" only allows http://localhost:5173
    // WHEN: a request is made with an origin that is not in the allow-list
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: { Origin: DISALLOWED_ORIGIN },
    });

    // THEN: the response must not echo/allow the disallowed origin
    const allowOrigin = response.headers()['access-control-allow-origin'];
    expect(allowOrigin).not.toBe(DISALLOWED_ORIGIN);
  });

  test('[P1] should NOT grant CORS access to a disallowed origin during preflight', async ({ request }) => {
    // GIVEN: CORS policy restricted to http://localhost:5173
    // WHEN: an OPTIONS preflight is sent from a disallowed origin
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: DISALLOWED_ORIGIN,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: no Access-Control-Allow-Origin header is granted for this origin
    const allowOrigin = response.headers()['access-control-allow-origin'];
    expect(allowOrigin).not.toBe(DISALLOWED_ORIGIN);
  });
});

test.describe('CORS — method boundary conditions', () => {
  test('[P2] should allow an uncommon HTTP method (DELETE) preflight from the allowed origin', async ({
    request,
  }) => {
    // GIVEN: CORS policy uses AllowAnyMethod()
    // WHEN: a DELETE preflight is requested from the allowed frontend origin
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: ALLOWED_ORIGIN,
        'Access-Control-Request-Method': 'DELETE',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: the preflight succeeds and grants the allowed origin for DELETE
    expect([200, 204]).toContain(response.status());
    expect(response.headers()['access-control-allow-origin']).toBe(ALLOWED_ORIGIN);
  });
});

test.describe('Problem Details (RFC 7807) — structural validation', () => {
  test('[P1] should return a Problem Details body with status and title fields for an unknown route', async ({
    request,
  }) => {
    // GIVEN: no route matches /api/nonexistent-route-for-atdd
    // WHEN: the route is requested
    const response = await request.get(`${API_BASE_URL}/api/nonexistent-route-for-atdd`);

    // THEN: the JSON body follows the RFC 7807 shape (not just a generic JSON error)
    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body.status).toBe(404);
    expect(typeof body.title).toBe('string');
    expect(body.title.length).toBeGreaterThan(0);
  });

  test('[P2] should not crash or return HTML when the request body is malformed JSON', async ({ request }) => {
    // GIVEN: a POST with a Content-Type of application/json but an invalid JSON payload
    // WHEN: it is sent to a route that does not exist
    const response = await request.post(`${API_BASE_URL}/api/nonexistent-route-for-atdd`, {
      headers: { 'Content-Type': 'application/json' },
      data: '{not valid json',
    });

    // THEN: the server still degrades gracefully (404, JSON body) instead of a 500 or HTML error page
    expect(response.status()).toBe(404);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');
  });
});

test.describe('Routing — case-insensitivity boundary', () => {
  test('[P2] should resolve /SCALAR (uppercase) the same as /scalar', async ({ request }) => {
    // GIVEN: ASP.NET Core routing is case-insensitive by default
    // WHEN: the endpoint is requested with an uppercase path segment
    const response = await request.get(`${API_BASE_URL}/SCALAR`);

    // THEN: the documentation page is still served successfully (following the internal redirect)
    expect(response.status()).toBe(200);
  });
});

test.describe('Stability — concurrent request handling', () => {
  test('[P2] should serve multiple concurrent requests to /scalar without errors', async ({ request }) => {
    // GIVEN: five simultaneous clients hitting the same endpoint
    // WHEN: requests are fired concurrently (boundary: shared Kestrel pipeline under load)
    const responses = await Promise.all(
      Array.from({ length: 5 }, () => request.get(`${API_BASE_URL}/scalar`))
    );

    // THEN: every request completes successfully — no dropped or failed connections
    for (const response of responses) {
      expect(response.status()).toBe(200);
    }
  });
});

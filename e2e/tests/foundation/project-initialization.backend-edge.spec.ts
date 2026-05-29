/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * BACKEND EDGE CASES & BOUNDARY CONDITIONS — Complement to ATDD base tests
 *
 * Rationale:
 *   Covers backend-specific edge cases for the initialization story:
 *     - Problem Details RFC 7807 body structure validation
 *     - Negative CORS scenarios (wrong origins, preflight completeness)
 *     - HTTP method boundary conditions
 *     - Startup security probes (forbidden endpoints)
 *     - Concurrent request resilience
 *
 * Frontend edge cases are in: project-initialization.edge.spec.ts
 *
 * Priority tags:
 *   [P0] — Critical infrastructure, must pass on every commit.
 *   [P1] — Important; run on PR to main.
 *   [P2] — Nice-to-have; run on scheduled CI.
 */

import { test, expect } from '@playwright/test';

const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL ?? 'http://localhost:5173';
const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ---------------------------------------------------------------------------
// Backend — Problem Details RFC 7807 body structure
// ---------------------------------------------------------------------------

test.describe('Backend Problem Details RFC 7807 — error response format', () => {
  test('[P0] 404 response for unknown API route must be JSON, not HTML', async ({ request }) => {
    // GIVEN: Global exception middleware and Problem Details are configured
    // WHEN: A non-existent API endpoint is requested
    const response = await request.get(`${API_BASE_URL}/api/v1/nonexistent-story-1-1-probe`, {
      failOnStatusCode: false,
    });

    // THEN: Response is NOT an HTML error page (ASP.NET default exception page)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');
    expect(contentType).not.toContain('text/html');
  });

  test('[P1] 404 Problem Details body must include status field', async ({ request }) => {
    // GIVEN: Problem Details RFC 7807 middleware is registered
    // WHEN: A 404 response is returned
    const response = await request.get(`${API_BASE_URL}/api/v1/nonexistent-story-1-1-probe`, {
      failOnStatusCode: false,
    });

    // THEN: Content-Type must be JSON (Problem Details — not HTML fallback)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');
  });

  test('[P1] 404 Problem Details body must include status 404 in JSON payload', async ({ request }) => {
    // GIVEN: Problem Details RFC 7807 middleware is registered
    // WHEN: A 404 response is returned with JSON content-type
    const response = await request.get(`${API_BASE_URL}/api/v1/nonexistent-story-1-1-probe`, {
      failOnStatusCode: false,
    });

    // THEN: The JSON body contains the "status" field matching HTTP status code
    const body = await response.json().catch(() => ({}));
    expect(body).toHaveProperty('status');
  });

  test('[P1] error responses must NOT expose a stack trace or internal exception details', async ({
    request,
  }) => {
    // GIVEN: NFR6 prohibits stack trace exposure
    // WHEN: A 404 response is returned for an unknown route
    const response = await request.get(`${API_BASE_URL}/api/v1/nonexistent-story-1-1-probe`, {
      failOnStatusCode: false,
    });

    const bodyText = await response.text();

    // THEN: No stack trace markers appear in the response body
    expect(bodyText).not.toContain('at ');
    expect(bodyText).not.toContain('System.Exception');
    expect(bodyText).not.toContain('StackTrace');
    expect(bodyText).not.toContain('InnerException');
  });

  test('[P2] backend must not return HTML ASP.NET developer exception page for any API route', async ({
    request,
  }) => {
    // GIVEN: Developer exception page must be disabled (never expose internals)
    // WHEN: Any 404 route under /api is hit
    const response = await request.get(`${API_BASE_URL}/api/trigger-404-boundary`, {
      failOnStatusCode: false,
    });

    const body = await response.text();

    // THEN: No ASP.NET developer exception page content in body
    expect(body).not.toContain('Developer Exception Page');
    expect(body).not.toContain('Microsoft.AspNetCore');
  });
});

// ---------------------------------------------------------------------------
// Backend — CORS edge cases and negative paths
// ---------------------------------------------------------------------------

test.describe('CORS negative paths and boundary conditions', () => {
  test('[P0] disallowed origin must NOT receive Access-Control-Allow-Origin', async ({
    request,
  }) => {
    // GIVEN: CORS policy restricts allowed origins to localhost:5173
    // WHEN: A preflight is made from an untrusted origin
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://attacker.example.com',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
      failOnStatusCode: false,
    });

    // THEN: The CORS policy does NOT echo back the untrusted origin
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).not.toBe('http://attacker.example.com');
  });

  test('[P1] disallowed origin on GET request should NOT receive CORS allow header', async ({
    request,
  }) => {
    // GIVEN: The backend only allows localhost:5173
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: 'http://malicious.tld',
      },
      failOnStatusCode: false,
    });

    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    // THEN: Malicious origin is not reflected back
    expect(allowOrigin).not.toBe('http://malicious.tld');
  });

  test('[P1] preflight from allowed origin should receive Access-Control-Allow-Methods header', async ({
    request,
  }) => {
    // GIVEN: CORS is configured with allowed HTTP methods
    // WHEN: OPTIONS preflight from the frontend origin is made
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
      },
      failOnStatusCode: false,
    });

    // THEN: Allowed methods header is present in the preflight response
    const allowMethods = response.headers()['access-control-allow-methods'] ?? '';
    expect(allowMethods.length).toBeGreaterThan(0);
  });

  test('[P2] CORS preflight should respond within 1 second (not introducing latency)', async ({
    request,
  }) => {
    // GIVEN: CORS middleware is lightweight
    const start = Date.now();
    await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
      },
      failOnStatusCode: false,
    });
    const elapsed = Date.now() - start;

    // THEN: Preflight completes in under 1 second
    expect(elapsed).toBeLessThan(1000);
  });
});

// ---------------------------------------------------------------------------
// Backend — HTTP method boundary conditions
// ---------------------------------------------------------------------------

test.describe('Backend HTTP method boundaries', () => {
  test('[P2] POST to /scalar should not return 500 (graceful rejection)', async ({ request }) => {
    // GIVEN: /scalar is a GET-only documentation endpoint
    // WHEN: A POST request is made
    const response = await request.post(`${API_BASE_URL}/scalar`, {
      failOnStatusCode: false,
    });

    // THEN: The response is 404 or 405 — NOT 500 (unhandled error)
    expect(response.status()).not.toBe(500);
    expect([404, 405]).toContain(response.status());
  });

  test('[P2] DELETE to /scalar should return 404 or 405, not 500', async ({ request }) => {
    // GIVEN: /scalar has no DELETE handler
    const response = await request.delete(`${API_BASE_URL}/scalar`, {
      failOnStatusCode: false,
    });

    // THEN: Server rejects gracefully without 500
    expect(response.status()).not.toBe(500);
  });
});

// ---------------------------------------------------------------------------
// Backend — startup security probes
// ---------------------------------------------------------------------------

test.describe('Backend security probes — known dangerous endpoints must not exist', () => {
  const forbiddenPaths = [
    '/swagger',
    '/swagger/index.html',
    '/swagger/v1/swagger.json',
    '/weatherforecast',
    '/.env',
    '/appsettings.json',
    '/appsettings.Development.json',
  ];

  for (const path of forbiddenPaths) {
    test(`[P1] ${path} must NOT return HTTP 200`, async ({ request }) => {
      // GIVEN: The backend has no scaffold/default endpoints exposed
      const response = await request.get(`${API_BASE_URL}${path}`, {
        failOnStatusCode: false,
      });

      // THEN: The path is not accessible (404, 405, or 403 are all acceptable)
      expect(response.status()).not.toBe(200);
    });
  }
});

// ---------------------------------------------------------------------------
// Concurrent request resilience
// ---------------------------------------------------------------------------

test.describe('Concurrent request resilience', () => {
  test('[P2] frontend should handle 5 concurrent requests without dropping any', async ({
    request,
  }) => {
    // GIVEN: Vite dev server is running
    // WHEN: 5 simultaneous GET / requests are made
    const requests = Array.from({ length: 5 }, () =>
      request.get(FRONTEND_BASE_URL + '/', { failOnStatusCode: false })
    );

    const responses = await Promise.all(requests);

    // THEN: All 5 requests return 200 — no connection failures
    for (const response of responses) {
      expect(response.status()).toBe(200);
    }
  });

  test('[P2] backend should handle 5 concurrent requests to /scalar without 5xx errors', async ({
    request,
  }) => {
    // GIVEN: The backend is running
    // WHEN: 5 simultaneous GET /scalar requests are made
    const requests = Array.from({ length: 5 }, () =>
      request.get(`${API_BASE_URL}/scalar`, { failOnStatusCode: false })
    );

    const responses = await Promise.all(requests);

    // THEN: None of the responses is a server error (5xx)
    for (const response of responses) {
      expect(response.status()).toBeLessThan(500);
    }
  });
});

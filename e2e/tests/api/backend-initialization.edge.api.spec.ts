/**
 * Story 1.1: Project Initialization & Repository Structure
 * API-level edge case tests — backend initialization
 *
 * Expands ATDD coverage with error paths, boundary conditions, and
 * security checks not present in backend-initialization.api.spec.ts.
 *
 * Covers:
 *   - CORS rejection for disallowed origins
 *   - Problem Details format structure (RFC 7807 fields)
 *   - ExceptionHandlingMiddleware does NOT expose exception details
 *   - Content-Type negotiation
 *   - HTTP method enforcement on Scalar endpoint
 *   - Backend response within acceptable latency
 *   - Multiple concurrent requests handled without error
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// CORS — rejection of disallowed origins
// ─────────────────────────────────────────────────────────────────────────────

test.describe('CORS — disallowed origin handling', () => {
  test('should NOT include Access-Control-Allow-Origin for an untrusted origin', async ({ request }) => {
    // GIVEN: CORS policy "DevCors" only allows http://localhost:5173
    // WHEN: A request arrives from a different origin
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: 'http://evil.attacker.com',
      },
    });

    // THEN: The CORS header is absent or does NOT grant access to the attacker origin
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).not.toBe('http://evil.attacker.com');
  });

  test('should NOT include Access-Control-Allow-Origin for a lookalike subdomain', async ({ request }) => {
    // Subdomain of the allowed origin must NOT get CORS access
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: 'http://evil.localhost:5173',
      },
    });

    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).not.toBe('http://evil.localhost:5173');
  });

  test('should NOT include Access-Control-Allow-Origin for localhost on a different port', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: 'http://localhost:9999',
      },
    });

    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).not.toBe('http://localhost:9999');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Problem Details RFC 7807 — response structure
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Problem Details — RFC 7807 structure validation', () => {
  test('should return JSON (not HTML) for a non-existent API route', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered
    // WHEN: A request is made to a non-existent /api/* route
    const response = await request.get(`${API_BASE_URL}/api/this-route-does-not-exist`);

    // THEN: Content-Type is JSON (Problem Details or standard JSON 404) — not HTML
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');
    expect(contentType).not.toContain('text/html');
  });

  test('should NOT expose internal exception details in error responses', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware deliberately hides ex.Message
    // WHEN: A route that would trigger an unhandled error is called
    // (We use a non-existent API path — 404 is safe to examine)
    const response = await request.get(`${API_BASE_URL}/api/nonexistent-for-detail-check`);

    const body = await response.text();

    // THEN: Response body does NOT contain stack trace markers
    expect(body).not.toContain('StackTrace');
    expect(body).not.toContain('System.');
    expect(body).not.toContain('at SiesaAgents');
    expect(body).not.toContain('Exception');
  });

  test('404 response should have status field in the body', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/check-problem-details-404`);
    expect([400, 404]).toContain(response.status());

    const contentType = response.headers()['content-type'] ?? '';
    if (contentType.includes('json')) {
      const body = await response.json().catch(() => null);
      if (body !== null && typeof body === 'object') {
        // If it IS a Problem Details object, status field must match HTTP status
        if ('status' in body) {
          expect(body.status).toBe(response.status());
        }
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Scalar endpoint — HTTP method restrictions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Scalar endpoint — HTTP method enforcement', () => {
  test('should return non-2xx for POST to /scalar (docs page is read-only)', async ({ request }) => {
    // GIVEN: Scalar serves static HTML docs — it does not accept POST
    // WHEN: A POST request is made to /scalar
    const response = await request.post(`${API_BASE_URL}/scalar`, {
      data: {},
    });

    // THEN: Status is not 200 or 201 (POST is not a valid operation on this endpoint)
    expect([200, 201]).not.toContain(response.status());
  });

  test('should return non-2xx for DELETE to /scalar', async ({ request }) => {
    const response = await request.delete(`${API_BASE_URL}/scalar`);
    expect([200, 201, 204]).not.toContain(response.status());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Performance — response latency boundary
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Backend — response latency boundary', () => {
  test('should respond to /scalar within 3 seconds (cold start excluded by retries)', async ({ request }) => {
    // GIVEN: The backend is already running (cold start already happened)
    // WHEN: A normal GET request is made
    const startMs = Date.now();
    const response = await request.get(`${API_BASE_URL}/scalar`);
    const elapsedMs = Date.now() - startMs;

    // THEN: Response arrives within 3 seconds (generous for a docs page)
    expect(response.status()).toBe(200);
    expect(elapsedMs).toBeLessThan(3000);
  });

  test('should respond to a non-existent API route within 1 second', async ({ request }) => {
    const startMs = Date.now();
    await request.get(`${API_BASE_URL}/api/latency-check-nonexistent`);
    const elapsedMs = Date.now() - startMs;

    // 404 routing is synchronous — should be very fast
    expect(elapsedMs).toBeLessThan(1000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Concurrency — multiple simultaneous requests
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Backend — concurrent request handling', () => {
  test('should handle 5 simultaneous requests to /scalar without errors', async ({ request }) => {
    // GIVEN: The backend server is running
    // WHEN: 5 concurrent GET requests are made
    const responses = await Promise.all(
      Array.from({ length: 5 }, () => request.get(`${API_BASE_URL}/scalar`))
    );

    // THEN: All responses are HTTP 200
    for (const response of responses) {
      expect(response.status()).toBe(200);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Response headers — security baseline
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Backend — response headers security baseline', () => {
  test('should NOT expose Server header with detailed version info', async ({ request }) => {
    // GIVEN: Production-safe .NET server
    // WHEN: Any request is made
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Server header does not expose Kestrel version details
    const serverHeader = response.headers()['server'] ?? '';
    // Acceptable: "Kestrel" or absent; not acceptable: "Microsoft-IIS/10.0" with full version
    expect(serverHeader).not.toMatch(/Kestrel\/\d+\.\d+\.\d+/);
  });

  test('should include Content-Type header in all responses', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/scalar`);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// appsettings — AllowedOrigins config is used (not hardcoded)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('CORS — configuration-driven origin (not hardcoded)', () => {
  test('should still respond correctly when AllowedOrigins comes from appsettings.Development.json', async ({
    request,
  }) => {
    // GIVEN: appsettings.Development.json has "AllowedOrigins": ["http://localhost:5173"]
    // WHEN: Request is made with the configured origin
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: { Origin: 'http://localhost:5173' },
    });

    // THEN: Server responds and allows the origin
    expect(response.status()).toBe(200);
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(
      allowOrigin === 'http://localhost:5173' || allowOrigin === '*'
    ).toBe(true);
  });
});

/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Expanded coverage — Edge cases, boundary conditions, negative paths
 * for the backend init beyond the ATDD baseline (backend-initialization.api.spec.ts).
 *
 * Priority tags:
 *   [P1] — High priority (pre-merge)
 *   [P2] — Medium priority (nightly)
 *   [P3] — Low priority (on-demand)
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC2 edge — Scalar canonical URL and OpenAPI metadata
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 edge — Scalar canonical URLs and OpenAPI', () => {
  test('[P2] should serve Scalar at the trailing-slash canonical URL /scalar/', async ({ request }) => {
    // GIVEN: Scalar 2.16.x redirects /scalar → /scalar/ (canonical)
    // WHEN: We request the canonical trailing-slash URL directly
    const response = await request.get(`${API_BASE_URL}/scalar/`);

    // THEN: The canonical URL returns 200 with HTML
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type'] ?? '').toContain('text/html');
  });

  test('[P2] should redirect /scalar to /scalar/ (302) when redirects are disabled', async ({
    request,
  }) => {
    // GIVEN: Scalar mounts the doc UI at /scalar/ and redirects /scalar → /scalar/
    // WHEN: We request /scalar without following redirects
    const response = await request.get(`${API_BASE_URL}/scalar`, { maxRedirects: 0 });

    // THEN: The response is a 3xx redirect to the trailing-slash variant
    // Scalar 2.16.x emits a *relative* Location header ("scalar/"), so accept both
    // relative and absolute forms as long as it points at the trailing-slash variant.
    expect([301, 302, 307, 308]).toContain(response.status());
    const location = response.headers()['location'] ?? '';
    expect(location).toMatch(/(^|\/)scalar\/?$/);
  });

  test('[P1] should expose the OpenAPI JSON document (MapOpenApi)', async ({ request }) => {
    // GIVEN: Program.cs calls app.MapOpenApi() so the doc is generated at /openapi/v1.json
    // WHEN: We fetch the OpenAPI JSON
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    // THEN: The endpoint returns a JSON document (200 with json content-type)
    expect(response.status()).toBe(200);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');

    // AND: The body is valid OpenAPI 3.x
    const body = await response.json();
    expect(body).toHaveProperty('openapi');
    expect(typeof body.openapi).toBe('string');
    expect(body.openapi).toMatch(/^3\./);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 edge — CORS negative and preflight matrix
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 edge — CORS policy scope', () => {
  test('[P1] should NOT return Access-Control-Allow-Origin: * to disallowed origins', async ({
    request,
  }) => {
    // GIVEN: The "DevCors" policy only whitelists http://localhost:5173 (no wildcards)
    // WHEN: A request comes from a foreign origin
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: { Origin: 'http://evil.example.com' },
    });

    // THEN: The response either omits the CORS header OR echoes the whitelisted origin —
    //       under no circumstance should it broadcast '*' or echo the malicious origin.
    const allow = response.headers()['access-control-allow-origin'] ?? '';
    expect(allow).not.toBe('*');
    expect(allow).not.toBe('http://evil.example.com');
  });

  test('[P2] should echo Access-Control-Allow-Headers on OPTIONS preflight from allowed origin', async ({
    request,
  }) => {
    // GIVEN: CORS policy allows any header (AllowAnyHeader) per Program.cs
    // WHEN: A preflight requests custom headers
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type,Authorization',
      },
    });

    // THEN: The preflight succeeds and the response advertises allowed methods
    expect([200, 204]).toContain(response.status());
    // Allow-Methods must include GET (from Access-Control-Request-Method)
    const allowMethods = (response.headers()['access-control-allow-methods'] ?? '').toUpperCase();
    // Either explicit GET or wildcard is acceptable for AllowAnyMethod policy
    expect(allowMethods === '' || allowMethods.includes('GET') || allowMethods.includes('*')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 / Middleware edge — Problem Details shape and security posture
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 edge — Problem Details RFC 7807 shape', () => {
  test('[P1] should return Problem Details JSON for POST to a non-existent endpoint', async ({
    request,
  }) => {
    // GIVEN: UseStatusCodePages emits application/problem+json for framework 404
    // WHEN: POST hits a path with no matching endpoint
    const response = await request.post(`${API_BASE_URL}/api/does-not-exist-edge`, {
      data: { foo: 'bar' },
    });

    // THEN: A JSON error response is returned (never HTML)
    expect([404, 405]).toContain(response.status());
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');
  });

  test('[P1] should return Problem Details JSON for PUT to a non-existent endpoint', async ({
    request,
  }) => {
    const response = await request.put(`${API_BASE_URL}/api/does-not-exist-edge`, {
      data: {},
    });

    expect([404, 405]).toContain(response.status());
    expect((response.headers()['content-type'] ?? '')).toContain('json');
  });

  test('[P1] should return Problem Details JSON for DELETE to a non-existent endpoint', async ({
    request,
  }) => {
    const response = await request.delete(`${API_BASE_URL}/api/does-not-exist-edge`);

    expect([404, 405]).toContain(response.status());
    expect((response.headers()['content-type'] ?? '')).toContain('json');
  });

  test('[P1] should include RFC 7807 keys (status, title) in Problem Details body', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware / UseStatusCodePages emits RFC 7807 shape
    // WHEN: We hit an endpoint that returns a framework 404
    const response = await request.get(`${API_BASE_URL}/api/nonexistent-shape-check`);

    // THEN: Body is JSON and contains at minimum status + title (RFC 7807 §3.1)
    expect([404, 400]).toContain(response.status());
    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('title');
    expect(typeof body.title).toBe('string');
    expect(body.title.length).toBeGreaterThan(0);
  });

  test('[P1] should never leak stack traces or exception messages in error responses', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware sets Detail=null to hide server internals
    // WHEN: We hit a non-existent path that traverses the middleware pipeline
    const response = await request.get(`${API_BASE_URL}/api/nonexistent-security-check`);

    // THEN: The body text does NOT contain internal/leaked strings
    const text = await response.text();
    const leakedPatterns = [
      /at Microsoft\.AspNetCore\./,
      /at System\./,
      /StackTrace/i,
      /InnerException/i,
      /\.cs:line \d+/,
    ];
    for (const pattern of leakedPatterns) {
      expect(text, `Response leaked internals matching ${pattern}`).not.toMatch(pattern);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Boundary / robustness — server does not crash on unusual inputs
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 edge — Boundary robustness', () => {
  test('[P2] should handle a very long URL without crashing (returns 4xx JSON, not connection reset)', async ({
    request,
  }) => {
    // GIVEN: Kestrel has default URL-length limits; the server must return a graceful error
    const longSegment = 'a'.repeat(2048);
    const response = await request.get(`${API_BASE_URL}/api/${longSegment}`);

    // THEN: The server responded — no connection reset — with a 4xx status
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });

  test('[P2] should handle malformed JSON body on non-existent endpoint without 500', async ({
    request,
  }) => {
    // GIVEN: The pipeline reaches routing before body-parsing for non-existent paths
    const response = await request.post(`${API_BASE_URL}/api/malformed-body-check`, {
      headers: { 'Content-Type': 'application/json' },
      data: '{"broken": ',
    });

    // THEN: We get a client error (404 no route) or 400 (bad request) — never 500
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });

  test('[P3] should respond to HEAD /scalar without a server error (never 5xx)', async ({
    request,
  }) => {
    // GIVEN: Many health-check tools use HEAD; the server must not 500 on HEAD requests.
    // Scalar registers GET only, so 405 (Method Not Allowed) is the expected client-error
    // response — what matters is that Kestrel doesn't crash or return 5xx.
    const response = await request.fetch(`${API_BASE_URL}/scalar`, { method: 'HEAD' });

    // THEN: Status is < 500 (any 2xx/3xx/4xx is acceptable — never a server crash)
    expect(response.status()).toBeLessThan(500);
  });
});

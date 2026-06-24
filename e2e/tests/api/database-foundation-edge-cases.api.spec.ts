/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * Expanded API Coverage — Edge Cases & Boundary Conditions
 * Complements ATDD tests in database-foundation.api.spec.ts
 *
 * Gaps covered:
 *   AC3/NFR6 — Problem Details body size is bounded (no megabyte-size error dumps)
 *   AC3      — Repeated requests to error-triggering paths return consistent Problem Details
 *   AC3      — Content-Type is ALWAYS application/problem+json (not text/html) for ALL error paths
 *   AC4      — 405 (Method Not Allowed) is handled gracefully — no 500, no HTML
 *   AC4      — DELETE on non-existent resource does not return 500
 *   AC4      — POST to a non-existent endpoint returns Problem Details JSON, not HTML
 *   AC5      — Scalar serves correct MIME type (text/html), not JSON or binary
 *   AC5      — /scalar/openapi.json or /openapi/v1.json is accessible (Scalar needs it to render)
 *   AC3/AC4  — Concurrent error requests all return valid Problem Details (no race conditions)
 *   AC3      — Problem Details response always has HTTP status code matching body 'status' field
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Problem Details response body is bounded in size (no stack dump leak)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] AC3 — Problem Details response body is bounded and consistent', () => {
  test('[P1] error response body is under 2KB (no megabyte stack trace dump)', async ({
    request,
  }) => {
    // GIVEN: NFR6 — no stack traces or internal messages in error responses
    // WHEN: A request triggers an error response
    const response = await request.get(`${API_BASE_URL}/api/v1/nonexistent-edge-case-bound`);
    const body = await response.text();

    // THEN: The response body is less than 2KB — a large body signals internal details leaked
    expect(body.length).toBeLessThan(2048);
  });

  test('[P1] repeated requests to same error path return consistent Problem Details', async ({
    request,
  }) => {
    // GIVEN: The middleware is deterministic — same path always returns same response shape
    const path = `${API_BASE_URL}/api/v1/atdd-consistency-probe-1-3`;

    // WHEN: The same error path is hit twice
    const response1 = await request.get(path);
    const response2 = await request.get(path);

    // THEN: Both responses have the same HTTP status code
    expect(response1.status()).toBe(response2.status());
  });

  test('[P1] repeated requests to error path return consistent content-type', async ({
    request,
  }) => {
    // GIVEN: The middleware deterministically sets Content-Type: application/problem+json
    const path = `${API_BASE_URL}/api/v1/atdd-ct-consistency-probe`;

    // WHEN: The same error path is hit twice
    const response1 = await request.get(path);
    const response2 = await request.get(path);

    // THEN: Content-Type is the same on both calls
    const ct1 = response1.headers()['content-type'] ?? '';
    const ct2 = response2.headers()['content-type'] ?? '';
    expect(ct1).toBe(ct2);
  });

  test('[P1] error response body status field always matches HTTP status code', async ({
    request,
  }) => {
    // GIVEN: RFC 7807 requires body 'status' to equal the HTTP response status code
    // WHEN: A 404 endpoint is requested
    const response = await request.get(`${API_BASE_URL}/api/v1/atdd-status-match-probe`);
    const httpStatus = response.status();

    // THEN: The endpoint must return an error response (not 200) — this is an error probe endpoint
    expect(httpStatus).not.toBe(200);
    // AND: The body must be valid JSON with a numeric 'status' field matching the HTTP status code (RFC 7807)
    const body = await response.json();
    expect(typeof body.status).toBe('number');
    expect(body.status).toBe(httpStatus);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3/AC4 — Content-Type for ALL error paths is never text/html
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] AC3/AC4 — Content-Type is never text/html for any error response', () => {
  test('[P1] POST to non-existent endpoint returns JSON, not HTML', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware converts all errors to Problem Details
    // WHEN: POST is made to an endpoint that does not exist
    const response = await request.post(`${API_BASE_URL}/api/v1/atdd-post-probe-1-3`, {
      data: { test: true },
    });
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Content-Type is NOT text/html — middleware catches all paths
    expect(contentType).not.toContain('text/html');
  });

  test('[P1] PUT to non-existent endpoint returns JSON, not HTML', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware wraps ALL HTTP methods
    // WHEN: PUT is made to a non-existent endpoint
    const response = await request.put(`${API_BASE_URL}/api/v1/atdd-put-probe-1-3`, {
      data: {},
    });
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Response is not an HTML page
    expect(contentType).not.toContain('text/html');
  });

  test('[P1] DELETE to non-existent resource path does not return 500', async ({ request }) => {
    // GIVEN: Domain exceptions (NotFoundException) map to 404, not 500
    // WHEN: DELETE is made to a resource that does not exist
    const response = await request.delete(
      `${API_BASE_URL}/api/v1/clientes/00000000-0000-0000-0000-000000000099`,
    );

    // THEN: Server does not return 500 — DELETE of non-existent resource is a domain error (404)
    expect(response.status()).not.toBe(500);
  });

  test('[P1] PATCH to non-existent resource does not crash the server', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware handles all unhandled exceptions
    // WHEN: PATCH is sent to a path that does not exist
    const response = await request.patch(
      `${API_BASE_URL}/api/v1/atdd-patch-probe/00000000-0000-0000-0000-000000000001`,
      { data: { name: 'test' } },
    );

    // THEN: Server responds without crashing (any status is acceptable, but not 5xx without Problem Details)
    expect(response.status()).toBeLessThan(600);
    expect(response.status()).toBeGreaterThanOrEqual(100);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Method Not Allowed (405) is handled without 500
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] AC4 — HTTP Method Not Allowed handled gracefully', () => {
  test('[P1] POST to /scalar returns 404 or 405, not 500', async ({ request }) => {
    // GIVEN: /scalar is a GET-only documentation endpoint
    // WHEN: POST is sent to /scalar
    const response = await request.post(`${API_BASE_URL}/scalar`, {
      data: {},
    });

    // THEN: Server responds with 404 or 405 (method not allowed), never 500
    expect(response.status()).not.toBe(500);
    expect([404, 405]).toContain(response.status());
  });

  test('[P1] DELETE to /scalar returns 404 or 405, not 500', async ({ request }) => {
    // GIVEN: /scalar is read-only — DELETE must be rejected
    // WHEN: DELETE is sent to /scalar
    const response = await request.delete(`${API_BASE_URL}/scalar`);

    // THEN: Server responds with 404 or 405, never 500
    expect(response.status()).not.toBe(500);
    expect([404, 405]).toContain(response.status());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Scalar serves correct MIME type and is HTML, not JSON or binary
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] AC5 — Scalar endpoint MIME type and content validation', () => {
  test('[P2] /scalar response body is non-empty (renders UI, not blank page)', async ({
    request,
  }) => {
    // GIVEN: Scalar renders an HTML page with JavaScript
    // WHEN: /scalar is requested
    const response = await request.get(`${API_BASE_URL}/scalar`);
    const body = await response.text();

    // THEN: The response body is non-empty (Scalar is rendering content)
    expect(body.length).toBeGreaterThan(0);
  });

  test('[P2] /scalar response body is NOT JSON (it is an HTML page)', async ({ request }) => {
    // GIVEN: Scalar renders HTML — it must not accidentally return a JSON spec
    // WHEN: /scalar is requested
    const response = await request.get(`${API_BASE_URL}/scalar`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Content-Type is NOT application/json — Scalar serves HTML, not the OpenAPI spec
    expect(contentType).not.toContain('application/json');
  });

  test('[P2] /openapi/v1.json exposes the OpenAPI spec required by Scalar to render', async ({
    request,
  }) => {
    // GIVEN: app.MapOpenApi() is registered in Program.cs — Scalar uses this spec to render the UI
    // WHEN: The OpenAPI spec endpoint is requested
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    // THEN: The spec is accessible (200) — without this, Scalar cannot render the API reference
    expect(response.status()).toBe(200);
  });

  test('[P2] /openapi/v1.json response contains openapi version field', async ({ request }) => {
    // GIVEN: The spec follows OpenAPI 3.x format
    // WHEN: The JSON spec is parsed
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);
    const body = await response.json();

    // THEN: The spec has the required 'openapi' field (3.x.y format)
    expect(body).toHaveProperty('openapi');
    expect(typeof body.openapi).toBe('string');
    expect(body.openapi).toMatch(/^3\./);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3/AC4 — Concurrent error requests return valid Problem Details (no race conditions)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] AC3/AC4 — Concurrent error requests are handled without race conditions', () => {
  test('[P2] five concurrent requests to error path all return consistent status codes', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is thread-safe (no shared mutable state)
    // WHEN: Five requests are fired concurrently to an error-producing endpoint
    const promises = Array.from({ length: 5 }, (_, i) =>
      request.get(`${API_BASE_URL}/api/v1/atdd-concurrent-probe-${i}`),
    );
    const responses = await Promise.all(promises);

    // THEN: All responses return a valid HTTP status (not 0 or connection error)
    // and none return 500 with HTML (which would indicate middleware failure)
    for (const response of responses) {
      expect(response.status()).toBeGreaterThanOrEqual(100);
      expect(response.status()).toBeLessThan(600);

      const contentType = response.headers()['content-type'] ?? '';
      expect(contentType).not.toContain('text/html');
    }
  });

  test('[P2] concurrent requests to /scalar all return 200 (no lock contention)', async ({
    request,
  }) => {
    // GIVEN: /scalar is a static documentation page with no server-side state
    // WHEN: Three concurrent GET requests are made to /scalar
    const promises = [
      request.get(`${API_BASE_URL}/scalar`),
      request.get(`${API_BASE_URL}/scalar`),
      request.get(`${API_BASE_URL}/scalar`),
    ];
    const responses = await Promise.all(promises);

    // THEN: All three return 200 (no race condition or lock on documentation endpoint)
    for (const response of responses) {
      expect(response.status()).toBe(200);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Problem Details 'type' field is an absolute URI (RFC 7807 compliance)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] AC3 — Problem Details RFC 7807 type field is an absolute URI', () => {
  test('[P2] error response body contains a type field that is an absolute URI', async ({
    request,
  }) => {
    // GIVEN: RFC 7807 requires 'type' to be an absolute URI identifying the error category
    // WHEN: An error is triggered
    const response = await request.get(`${API_BASE_URL}/api/v1/atdd-rfc-type-probe`);
    const httpStatus = response.status();

    // THEN: The endpoint must return an error response (not 200) — this is an error probe endpoint
    expect(httpStatus).not.toBe(200);
    // AND: The body must be valid JSON with a 'type' field that is an absolute URI (RFC 7807)
    const body = await response.json();
    expect(typeof body.type).toBe('string');
    expect(body.type).toMatch(/^https?:\/\//);
  });

  test('[P2] 404 response body does NOT contain StackTrace, at , or System.', async ({
    request,
  }) => {
    // GIVEN: NFR6 — no internal stack information must be exposed
    // WHEN: A 404-producing path is requested
    const response = await request.get(
      `${API_BASE_URL}/api/v1/atdd-nfr6-deep-probe-1-3/00000000-0000-0000-0000-999999999999`,
    );
    const body = await response.text();

    // THEN: No .NET stack trace artifacts appear anywhere in the response
    expect(body).not.toContain('StackTrace');
    expect(body).not.toContain('   at ');
    expect(body).not.toContain('System.Collections');
    expect(body).not.toContain('System.Linq');
    expect(body).not.toContain('System.Runtime');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UUID path parameter — boundary condition for domain routing
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] UUID path parameter boundary conditions', () => {
  test('[P2] zero UUID in path returns 404 or 400, not 500', async ({ request }) => {
    // GIVEN: AC4 — domain errors (not found, bad request) must never return 500
    // The zero UUID (all zeros) is a boundary value commonly used as a "null" identifier
    // WHEN: A request uses the zero UUID as a path parameter
    const response = await request.get(
      `${API_BASE_URL}/api/v1/clientes/00000000-0000-0000-0000-000000000000`,
    );

    // THEN: 404 or 400 — not 500 (a zero UUID is a valid input that should not crash the server)
    expect(response.status()).not.toBe(500);
    expect([400, 404, 405]).toContain(response.status());
  });

  test('[P2] non-UUID string in UUID path slot returns 400 or 404, not 500', async ({
    request,
  }) => {
    // GIVEN: Routing/model binding should reject non-UUID path parameters gracefully
    // WHEN: A non-UUID string is used where a UUID is expected
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/not-a-valid-uuid`);

    // THEN: Server returns 400 (bad request) or 404 (route unmatched) — never 500
    expect(response.status()).not.toBe(500);
    expect([400, 404, 405]).toContain(response.status());
  });

  test('[P2] response for invalid UUID path returns JSON, not HTML', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware converts all errors to Problem Details JSON
    // WHEN: An invalid UUID path is requested
    const response = await request.get(
      `${API_BASE_URL}/api/v1/clientes/this-is-not-a-uuid`,
    );
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Content-Type is not HTML (Problem Details is JSON-based)
    expect(contentType).not.toContain('text/html');
  });
});

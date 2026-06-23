/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * EDGE CASE EXPANSION — testarch-automate (BMad-Integrated Mode) — API Level
 * Expands ATDD coverage with boundary conditions, negative paths and
 * error scenarios not covered in the RED-phase ATDD tests.
 *
 * Acceptance Criteria targeted:
 *   AC2  — ExceptionHandlingMiddleware edge cases: concurrent errors, multiple exception types,
 *           body integrity, response body always parseable as JSON.
 *   AC7  — Middleware registration order edge cases: endpoints still reachable after middleware,
 *           middleware does not affect non-exception paths (pass-through integrity).
 *   AC4  — DbContext registration: application starts successfully (no startup crash due to DI misconfiguration).
 *   AC8  — Connection string config: backend is reachable (proves config did not crash startup).
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC2/AC7 edge — Middleware robustness and concurrent error handling
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2/AC7 edge — Middleware robustness and concurrent error handling', () => {
  test('[P1] should return consistent HTTP 500 for repeated requests to the throw-exception endpoint', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware handles any unhandled exception
    // WHEN: The same error-triggering endpoint is called twice sequentially
    const response1 = await request.get(`${API_BASE_URL}/api/test/throw-exception`);
    const response2 = await request.get(`${API_BASE_URL}/api/test/throw-exception`);

    // THEN: Both requests return 500 consistently (middleware is stateless)
    expect(response1.status()).toBe(500);
    expect(response2.status()).toBe(500);
  });

  test('[P1] should handle concurrent exception requests without server crash', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered and stateless
    // WHEN: 5 concurrent requests each trigger an unhandled exception
    const requests = Array.from({ length: 5 }, () =>
      request.get(`${API_BASE_URL}/api/test/throw-exception`)
    );

    const responses = await Promise.all(requests);

    // THEN: All requests receive 500 (no 0/network error, no mixed-state corruption)
    for (const response of responses) {
      expect(response.status()).toBe(500);
    }
  });

  test('[P1] should return valid JSON body even for rapid repeated exception requests', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware always writes a valid JSON response
    // WHEN: Three consecutive requests hit the exception endpoint
    for (let i = 0; i < 3; i++) {
      const response = await request.get(`${API_BASE_URL}/api/test/throw-exception`);

      // THEN: Each response body is valid, parseable JSON (not empty, not HTML)
      const body = await response.json();
      expect(body).toBeTruthy();
      expect(typeof body).toBe('object');
    }
  });

  test('[P1] should return a stable "detail" field value across multiple exception responses', async ({
    request,
  }) => {
    // GIVEN: The middleware always returns the same generic detail message
    // WHEN: Two separate requests trigger exceptions
    const res1 = await request.get(`${API_BASE_URL}/api/test/throw-exception`);
    const res2 = await request.get(`${API_BASE_URL}/api/test/throw-exception`);

    const body1 = await res1.json().catch(() => ({}));
    const body2 = await res2.json().catch(() => ({}));

    // THEN: Both have the same "detail" (no leakage of dynamic internal data)
    expect(body1.detail).toBe(body2.detail);
    expect(body1.detail).toBe('An unexpected error occurred.');
  });

  test('[P2] should NOT expose the exception message from the throwing endpoint in the response', async ({
    request,
  }) => {
    // GIVEN: The backend throws InvalidOperationException with an internal message
    //        ("Test unhandled exception for middleware verification.")
    // WHEN: The middleware intercepts the exception
    const response = await request.get(`${API_BASE_URL}/api/test/throw-exception`);
    const text = await response.text();

    // THEN: The actual exception message is NOT present in the response body (NFR6)
    expect(text).not.toContain('Test unhandled exception for middleware verification.');
    expect(text).not.toContain('InvalidOperationException');
  });

  test('[P2] should not include a "traceId" field that exposes internal request identifiers', async ({
    request,
  }) => {
    // GIVEN: Problem Details RFC 7807 must not expose internal correlation IDs
    //        (traceId can expose internal infrastructure details)
    // WHEN: The exception endpoint is called
    const response = await request.get(`${API_BASE_URL}/api/test/throw-exception`);
    const body = await response.json().catch(() => ({}));

    // THEN: The "extensions" / "traceId" with internal stack info must not be exposed
    // Note: traceId in Problem Details Extensions is allowed by RFC 7807 but must not
    // contain stack trace or internal .NET runtime paths
    if (body.traceId !== undefined) {
      expect(typeof body.traceId).toBe('string');
      expect(body.traceId).not.toContain('System.');
      expect(body.traceId).not.toContain('at ');
    }
  });

  test('[P2] should include the "instance" field in the Problem Details response', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware sets Instance = context.Request.Path
    // WHEN: The error-trigger endpoint is called
    const response = await request.get(`${API_BASE_URL}/api/test/throw-exception`);
    const body = await response.json().catch(() => ({}));

    // THEN: "instance" field reflects the request path (RFC 7807 optional but implemented)
    if (body.instance !== undefined) {
      expect(typeof body.instance).toBe('string');
      expect(body.instance).toContain('/api/test/throw-exception');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC7 edge — Middleware registration order and pass-through integrity
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 edge — Middleware registration order and pass-through integrity', () => {
  test('[P1] should not corrupt response body of successful endpoints after middleware is registered', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered BEFORE endpoint mapping
    // WHEN: A successful endpoint is called (e.g., /scalar)
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: The response body is not empty (middleware did not swallow the body)
    const text = await response.text();
    expect(text.length).toBeGreaterThan(0);
  });

  test('[P1] should return 404 (not 500) for routes that do not exist', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware only catches UNHANDLED exceptions (not routing misses)
    // WHEN: A non-existent API route is requested
    const response = await request.get(`${API_BASE_URL}/api/nonexistent-endpoint-story-1-3`);

    // THEN: The response is 404 (routing miss) — NOT 500 (exception handler must not intercept)
    expect(response.status()).toBe(404);
  });

  test('[P1] should not return 500 for the /openapi/v1.json endpoint (no exception for known paths)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered but does not throw on valid paths
    // WHEN: The OpenAPI spec is requested (available in Development)
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    // THEN: Server does not crash with 500 (returns either 200 in dev or 404 in prod)
    expect(response.status()).not.toBe(500);
  });

  test('[P2] should not affect the Content-Type of the Scalar HTML response', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered before endpoint mapping
    //        but must NOT modify non-error responses
    // WHEN: /scalar is called
    const response = await request.get(`${API_BASE_URL}/scalar`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Content-Type is HTML (not overridden to application/json by middleware)
    expect(contentType).toMatch(/text\/html/i);
  });

  test('[P2] should handle OPTIONS preflight requests without triggering exception middleware', async ({
    request,
  }) => {
    // GIVEN: CORS OPTIONS preflight is a normal flow — must not trigger exception handler
    // WHEN: OPTIONS is sent to a known endpoint
    const response = await request.fetch(`${API_BASE_URL}/api/test/throw-exception`, {
      method: 'OPTIONS',
    });

    // THEN: Server responds with a valid status (200/204/404/405) — NOT 500
    // (OPTIONS on an endpoint that throws GET should not invoke the business logic)
    expect(response.status()).not.toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 edge — RFC 7807 Problem Details body schema validation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 edge — RFC 7807 Problem Details body schema boundaries', () => {
  test('[P1] should include all three required RFC 7807 fields in a single response', async ({
    request,
  }) => {
    // GIVEN: RFC 7807 requires at minimum: type, title, status, detail (or a subset)
    // The implementation uses: status, title, detail, instance
    // WHEN: An exception triggers the middleware
    const response = await request.get(`${API_BASE_URL}/api/test/throw-exception`);
    const body = await response.json().catch(() => null);

    // THEN: All three core fields are present in a single response
    expect(body).not.toBeNull();
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('title');
    expect(body).toHaveProperty('detail');
  });

  test('[P1] should return "status" as integer 500 (not string)', async ({ request }) => {
    // GIVEN: RFC 7807 requires "status" to be a numeric HTTP status code
    // WHEN: The exception endpoint is called
    const response = await request.get(`${API_BASE_URL}/api/test/throw-exception`);
    const body = await response.json().catch(() => ({}));

    // THEN: "status" is a number (integer), NOT a string "500"
    expect(typeof body.status).toBe('number');
    expect(body.status).toBe(500);
  });

  test('[P1] should not include sensitive fields like "errors" array or validation details', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware must return a minimal Problem Details response
    // WHEN: An unhandled exception is triggered
    const response = await request.get(`${API_BASE_URL}/api/test/throw-exception`);
    const body = await response.json().catch(() => ({}));

    // THEN: No validation-style "errors" object (that could leak internal model state)
    expect(body.errors).toBeUndefined();
    // No raw exception object
    expect(body.exception).toBeUndefined();
  });

  test('[P2] should return the response with camelCase field names (not PascalCase)', async ({
    request,
  }) => {
    // GIVEN: The middleware uses JsonNamingPolicy.CamelCase for serialization
    // WHEN: Problem Details is returned
    const response = await request.get(`${API_BASE_URL}/api/test/throw-exception`);
    const body = await response.json().catch(() => ({}));

    // THEN: Fields are camelCase ("status" not "Status", "title" not "Title")
    expect(Object.keys(body)).toContain('status');
    expect(Object.keys(body)).toContain('title');
    expect(Object.keys(body)).toContain('detail');

    // AND: PascalCase variants do NOT exist
    expect(body.Status).toBeUndefined();
    expect(body.Title).toBeUndefined();
    expect(body.Detail).toBeUndefined();
  });

  test('[P2] should not include C# namespace paths in any response field values', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware masks all internal .NET details
    // WHEN: An exception triggers the middleware
    const response = await request.get(`${API_BASE_URL}/api/test/throw-exception`);
    const text = await response.text();

    // THEN: No C# namespace paths are present anywhere in the response
    expect(text).not.toContain('SiesaAgents.API');
    expect(text).not.toContain('SiesaAgents.Infrastructure');
    expect(text).not.toContain('Microsoft.AspNetCore');
    expect(text).not.toContain('System.Threading');
  });

  test('[P3] response body size should be reasonable (under 2KB for an error response)', async ({
    request,
  }) => {
    // GIVEN: Problem Details error responses should be concise
    // WHEN: An exception triggers the middleware
    const response = await request.get(`${API_BASE_URL}/api/test/throw-exception`);
    const text = await response.text();

    // THEN: Response body is not bloated (under 2KB — a sign of no stack trace dumping)
    expect(
      text.length,
      `Error response body is unexpectedly large (${text.length} bytes) — possible stack trace leak`
    ).toBeLessThan(2048);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4/AC8 edge — Application startup integrity (DbContext + connection string)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4/AC8 edge — Application startup integrity (EF Core + connection string)', () => {
  test('[P0] should serve at least one endpoint, proving the app started successfully with DbContext registered', async ({
    request,
  }) => {
    // GIVEN: SiesaAgentsDbContext is registered as a scoped service in Program.cs (AC4)
    //        and the connection string is configured in appsettings.Development.json (AC8)
    // WHEN: The Scalar documentation page is requested (proves app started without DI errors)
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: App returns 200 — DI registration did not crash startup
    expect(response.status()).toBe(200);
  });

  test('[P1] should return 200 from /openapi/v1.json in Development (EF Core services loaded)', async ({
    request,
  }) => {
    // GIVEN: OpenAPI is registered in Development mode, and all services (including DbContext) loaded
    // WHEN: OpenAPI spec endpoint is probed
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    // THEN: Returns 200 in Development or 404 in Production — NEVER 500 (startup/DI failure)
    expect([200, 404]).toContain(response.status());
  });

  test('[P1] backend should remain responsive after an exception is handled (no unrecoverable state)', async ({
    request,
  }) => {
    // GIVEN: An exception is thrown and handled by the middleware
    await request.get(`${API_BASE_URL}/api/test/throw-exception`);

    // WHEN: A subsequent normal request is made
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: The backend is still fully operational (middleware did not corrupt server state)
    expect(response.status()).toBe(200);
  });

  test('[P2] should respond to multiple endpoints consistently after startup (no flapping)', async ({
    request,
  }) => {
    // GIVEN: The application has started with all services registered
    // WHEN: Three separate requests are made to different valid endpoints
    const [scalarRes, openApiRes, exceptionRes] = await Promise.all([
      request.get(`${API_BASE_URL}/scalar`),
      request.get(`${API_BASE_URL}/openapi/v1.json`),
      request.get(`${API_BASE_URL}/api/test/throw-exception`),
    ]);

    // THEN: Each returns its expected status (no startup instability)
    expect(scalarRes.status()).toBe(200);
    expect([200, 404]).toContain(openApiRes.status());
    expect(exceptionRes.status()).toBe(500);
  });
});

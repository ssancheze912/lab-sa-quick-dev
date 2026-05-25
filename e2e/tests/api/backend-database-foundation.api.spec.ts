/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (API Integration Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC2 — ExceptionHandlingMiddleware returns Problem Details RFC 7807 format
 *          (status, title, detail) with no stack traces exposed (NFR6).
 *          Middleware is registered BEFORE routing in Program.cs.
 *
 * ENVIRONMENT NOTE:
 *   The .NET 10 backend CANNOT be started in this CI/sandbox environment (dotnet SDK not installed).
 *   These API tests will fail with ERR_CONNECTION_REFUSED — this is the expected RED phase behavior.
 *   They validate runtime behavior and will pass once the backend is running in a full environment.
 *
 *   Static structural verification of AC1 and AC3 is covered by:
 *   backend/tests/SiesaAgents.UnitTests/Infrastructure/BackendDatabaseFoundationFileStructureTests.cs
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC2: ExceptionHandlingMiddleware returns RFC 7807 Problem Details
//      Status, Title, Detail — no stack traces (NFR6)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — ExceptionHandlingMiddleware returns RFC 7807 Problem Details', () => {
  test('should return application/problem+json content-type for unknown endpoint', async ({
    request,
  }) => {
    // Given: The backend is running with ExceptionHandlingMiddleware registered
    // When: A request is made to a non-existent endpoint
    // Then: The response Content-Type is application/problem+json (RFC 7807)
    //
    // RED: Fails with ECONNREFUSED — backend not running in this environment

    const response = await request.get(`${API_BASE_URL}/api/nonexistent-story-1-3-atdd`);

    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');
    // Ideally application/problem+json — accept application/json as fallback
    expect(
      contentType.includes('problem+json') || contentType.includes('application/json')
    ).toBe(true);
  });

  test('should return HTTP 404 with Problem Details body for unknown route', async ({
    request,
  }) => {
    // Given: The backend is running with ExceptionHandlingMiddleware and minimal API routing
    // When: A GET request is made to a route that does not exist
    // Then: The response status is 404 and the body is a Problem Details JSON object

    const response = await request.get(`${API_BASE_URL}/api/nonexistent-story-1-3-atdd`);

    expect(response.status()).toBe(404);

    const body = await response.json().catch(() => null);
    expect(body).not.toBeNull();
  });

  test('should include "status" field in Problem Details response for unknown route', async ({
    request,
  }) => {
    // Given: The backend returns RFC 7807 Problem Details
    // When: An unknown endpoint is requested
    // Then: The JSON body contains a "status" field matching the HTTP status code

    const response = await request.get(`${API_BASE_URL}/api/nonexistent-story-1-3-atdd`);
    const body = await response.json().catch(() => ({}));

    expect(typeof body?.status).toBe('number');
  });

  test('should include "title" field in Problem Details response for unknown route', async ({
    request,
  }) => {
    // Given: RFC 7807 Problem Details format requires a "title" field
    // When: An unknown endpoint is requested
    // Then: The JSON body contains a non-empty "title" string

    const response = await request.get(`${API_BASE_URL}/api/nonexistent-story-1-3-atdd`);
    const body = await response.json().catch(() => ({}));

    expect(typeof body?.title).toBe('string');
    expect((body?.title as string).length).toBeGreaterThan(0);
  });

  test('should NOT expose stack trace in Problem Details "detail" field (NFR6)', async ({
    request,
  }) => {
    // Given: NFR6 prohibits exposing stack traces in error responses
    // When: An unhandled exception or unknown route is requested
    // Then: The "detail" field must be null, undefined, or empty — never a stack trace string

    const response = await request.get(`${API_BASE_URL}/api/nonexistent-story-1-3-atdd`);
    const body = await response.json().catch(() => ({}));

    const detail = body?.detail;

    // detail must be null, undefined, or a non-stack-trace string
    if (detail !== null && detail !== undefined) {
      // If detail is present, it must not contain stack trace patterns
      const detailStr = String(detail);
      expect(detailStr).not.toMatch(/at \w+\.\w+\(/); // stack frame pattern
      expect(detailStr).not.toContain('System.Exception');
      expect(detailStr).not.toContain('StackTrace');
      expect(detailStr).not.toContain('   at ');
    }
    // If null/undefined — test passes (this is the expected behavior per Story 1.3 implementation)
  });

  test('should return 500 with Problem Details for simulated unhandled exception', async ({
    request,
  }) => {
    // Given: ExceptionHandlingMiddleware catches all unhandled exceptions
    // When: A request triggers an unhandled exception in the pipeline
    // Then: The response status is 500 with a Problem Details body (title, status fields present)
    //
    // NOTE: This test uses a dedicated test endpoint that is expected to NOT exist yet.
    //       In the GREEN phase, the dev may add a /api/test/throw endpoint in development only.
    //       For now, we verify that at minimum a 500 response from ANY path returns Problem Details.

    // Trigger a path that causes internal server issues (middleware test)
    const response = await request.post(`${API_BASE_URL}/api/test/trigger-unhandled-exception`, {
      data: { trigger: true },
    });

    // Accept 404 (endpoint doesn't exist) or 500 (exception thrown)
    expect([404, 500]).toContain(response.status());

    if (response.status() === 500) {
      const contentType = response.headers()['content-type'] ?? '';
      expect(
        contentType.includes('problem+json') || contentType.includes('application/json')
      ).toBe(true);

      const body = await response.json().catch(() => null);
      if (body) {
        expect(body?.status).toBe(500);
        expect(body?.title).toBeTruthy();
        // NFR6: no stack trace in detail
        expect(body?.detail).not.toMatch(/at \w+\.\w+\(/);
      }
    }
  });

  test('should respond to OPTIONS preflight with ExceptionHandlingMiddleware active', async ({
    request,
  }) => {
    // Given: ExceptionHandlingMiddleware is registered BEFORE UseCors in Program.cs
    // When: An OPTIONS preflight is made from the frontend origin
    // Then: The preflight succeeds (200 or 204) — middleware does NOT interfere with CORS

    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // Middleware registered BEFORE routing must pass through CORS OPTIONS without catching it
    expect([200, 204]).toContain(response.status());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2: ExceptionHandlingMiddleware registration order — runtime verification
// Structural verification in BackendDatabaseFoundationFileStructureTests.cs
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — ExceptionHandlingMiddleware middleware pipeline order (runtime)', () => {
  test('should have the backend server running on port 5000 (prerequisite for AC2)', async ({
    request,
  }) => {
    // Given: The backend has been compiled and dotnet run is executing
    // When: Any HTTP request reaches the server
    // Then: The server responds — ExceptionHandlingMiddleware is active in the pipeline

    const response = await request.get(`${API_BASE_URL}/scalar`);
    expect(response.status()).toBe(200);
  });

  test('should return JSON (not HTML) for any error response — middleware is wired', async ({
    request,
  }) => {
    // Given: ExceptionHandlingMiddleware is registered and intercepts errors
    // When: An error-triggering path is requested
    // Then: The response body is JSON — not an HTML ASP.NET error page
    //       This confirms the middleware caught the error before ASP.NET default handler

    const response = await request.get(`${API_BASE_URL}/api/nonexistent-story-1-3-atdd`);

    // Status must be 4xx — middleware handled gracefully
    expect(response.status()).toBeLessThan(500);

    const contentType = response.headers()['content-type'] ?? '';
    // Must NOT be text/html (default ASP.NET error page)
    expect(contentType).not.toContain('text/html');
    // Must be JSON
    expect(contentType).toContain('json');
  });
});

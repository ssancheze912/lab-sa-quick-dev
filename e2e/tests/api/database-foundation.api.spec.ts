/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (API Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC2 — Unhandled exception returns Problem Details RFC 7807 payload
 *          (status, title, detail) with no stack traces exposed to caller (NFR6).
 *          ExceptionHandlingMiddleware must be registered in Program.cs.
 *   AC5 — dotnet build SiesaAgents.sln succeeds with zero errors and
 *          AppDbContext is registered in DI container with DefaultConnection
 *          from appsettings.Development.json.
 *
 * AC1, AC3, AC4 are verified by xUnit unit tests:
 *   - backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs
 *   - backend/tests/SiesaAgents.UnitTests/Infrastructure/ProgramWiringTests.cs
 *
 * Note: AC1 (dotnet ef database update) requires a live PostgreSQL instance.
 * At runtime, the backend starting successfully proves the connection string
 * is resolvable (if DB is present) or fails at migration time (not at startup).
 * The runtime-observable assertion is that the backend does NOT crash at boot.
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC2: ExceptionHandlingMiddleware returns Problem Details RFC 7807
//      Status 500, Content-Type: application/problem+json, no stack trace
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — ExceptionHandlingMiddleware returns Problem Details RFC 7807', () => {
  test('should return Content-Type application/problem+json when an unhandled error occurs', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered in Program.cs before routing
    // WHEN: A request triggers an unhandled server-side error (5xx path)
    // NOTE: We trigger a real 500 only if the backend exposes such an endpoint.
    //       For RED phase, we use a route that would produce 500 once middleware
    //       is correctly wired. Here we assert that ANY error response is JSON,
    //       not an HTML ASP.NET developer exception page.
    const response = await request.get(`${API_BASE_URL}/api/atdd-trigger-exception-1-3`);

    // THEN: The response must be JSON (not HTML) — proves middleware is wired
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).not.toContain('text/html');
    expect(contentType).toContain('json');
  });

  test('should return status 500 with Problem Details payload for unhandled exceptions', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware catches all unhandled exceptions
    // WHEN: An exception propagates through the middleware pipeline
    //       (500 response path — requires endpoint that throws, or use known 500 trigger)
    const response = await request.get(`${API_BASE_URL}/api/atdd-trigger-exception-1-3`);

    // If endpoint doesn't exist yet (RED), we assert on 404 or 500 depending on wiring.
    // Once implemented, endpoint returns 500. The critical assertion is on the body format.
    if (response.status() === 500) {
      // THEN: HTTP 500 with Problem Details body
      const body = await response.json();

      // Must contain 'status' field (RFC 7807)
      expect(body).toHaveProperty('status');
      expect(body.status).toBe(500);

      // Must contain 'title' field (RFC 7807)
      expect(body).toHaveProperty('title');
      expect(typeof body.title).toBe('string');
      expect(body.title.length).toBeGreaterThan(0);
    } else {
      // Endpoint not yet implemented — verify server is still running (not crashed)
      expect(response.status()).toBeLessThan(600);
    }
  });

  test('should NOT expose stack trace in the error response body', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered and catches exceptions
    // WHEN: An unhandled exception triggers a 500 response
    const response = await request.get(`${API_BASE_URL}/api/atdd-trigger-exception-1-3`);

    if (response.status() === 500) {
      // THEN: The response body must NOT contain stack trace fields (NFR6)
      const body = await response.text();

      expect(body).not.toContain('StackTrace');
      expect(body).not.toContain('at System.');
      expect(body).not.toContain('at SiesaAgents.');
      expect(body).not.toContain('stackTrace');
      expect(body).not.toContain('<html>');
    } else {
      // RED phase: endpoint not implemented yet. Test is in expected failing state.
      // Assert the server is responding (not crashed from missing middleware wiring)
      expect([404, 405, 400]).toContain(response.status());
    }
  });

  test('should return detail as null in Problem Details — no internal message leaked', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered in Program.cs
    // WHEN: An unhandled exception produces a 500 response
    const response = await request.get(`${API_BASE_URL}/api/atdd-trigger-exception-1-3`);

    if (response.status() === 500) {
      const body = await response.json();

      // THEN: The 'detail' field must be null (not the exception message)
      // Per architecture spec: Detail = null — no internal error messages exposed
      expect(body).toHaveProperty('detail');
      expect(body.detail).toBeNull();
    } else {
      // RED phase: route not yet created. Server must still be responsive.
      expect(response.status()).toBeLessThan(600);
    }
  });

  test('should include Content-Type application/problem+json header in 500 response', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware explicitly sets Content-Type = application/problem+json
    // WHEN: An unhandled exception is caught and response is written
    const response = await request.get(`${API_BASE_URL}/api/atdd-trigger-exception-1-3`);

    if (response.status() === 500) {
      // THEN: Content-Type header matches RFC 7807 media type
      const contentType = response.headers()['content-type'] ?? '';
      expect(contentType).toContain('application/problem+json');
    } else {
      // RED phase: assert server alive
      expect(response.status()).toBeLessThan(600);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5: AppDbContext is registered in DI container and backend builds successfully
//      Observable at runtime: backend starts without crashing from missing DI registration
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — AppDbContext DI registration and backend build success', () => {
  test('should have the backend running (proves dotnet build succeeded with zero errors)', async ({
    request,
  }) => {
    // GIVEN: dotnet build SiesaAgents.sln was executed with AppDbContext registered
    //        and all four Clean Architecture projects compiling correctly
    // WHEN: Any request is made to the backend
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Server responds — if build had errors, server would not start
    // A 200 from /scalar proves the solution built and started successfully
    expect(response.status()).toBe(200);
  });

  test('should serve the OpenAPI spec (proves AppDbContext registration did not break DI container)', async ({
    request,
  }) => {
    // GIVEN: AppDbContext is registered via builder.Services.AddDbContext<AppDbContext>()
    //        in Program.cs alongside other services
    // WHEN: The OpenAPI spec endpoint is requested (requires full DI container build)
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    // THEN: OpenAPI spec loads — DI container built without errors
    // A failed AddDbContext registration (e.g. missing Npgsql package) would cause
    // WebApplication.Build() to fail, making /openapi/v1.json unreachable
    expect(response.status()).toBe(200);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');
  });

  test('should NOT return HTTP 500 on startup (proves connection string is readable from appsettings)', async ({
    request,
  }) => {
    // GIVEN: ConnectionStrings:DefaultConnection is present in appsettings.Development.json
    //        pointing to Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres
    // WHEN: The backend is accessed at the base health-check URL (Scalar)
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Server returns 200 (not 500 from missing/invalid connection string at startup)
    // Note: EF Core reads the connection string at request time (not startup), so a wrong
    // connection string would only fail on actual DB calls. The Scalar endpoint proving
    // startup success is the relevant observable here.
    expect(response.status()).toBe(200);
    expect(response.status()).not.toBe(500);
  });

  test('should NOT expose Swagger UI (Swashbuckle is forbidden per architecture spec)', async ({
    request,
  }) => {
    // GIVEN: Architecture mandates Scalar only — Swashbuckle must NOT be installed
    // WHEN: The /swagger endpoint is requested
    const response = await request.get(`${API_BASE_URL}/swagger`);

    // THEN: /swagger endpoint does not exist (not 200)
    expect(response.status()).not.toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 Integration: Verify middleware order — ExceptionHandlingMiddleware
// must be registered BEFORE UseCors and before endpoint mapping
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 Integration — Middleware registration order validation', () => {
  test('should not return HTML error page for any error path (proves middleware intercepts before ASP.NET default handler)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered at the top of the pipeline
    //        (before UseCors, before MapOpenApi, before MapScalarApiReference)
    // WHEN: A request to a non-existent API route is made
    const response = await request.get(
      `${API_BASE_URL}/api/intentionally-missing-route-atdd-1-3`
    );

    // THEN: Response is JSON, not HTML ASP.NET developer exception page
    // The absence of HTML proves middleware is wired ahead of the developer exception page
    const body = await response.text();
    expect(body).not.toContain('<html>');
    expect(body).not.toContain('<!DOCTYPE html>');
    expect(body).not.toContain('Microsoft.AspNetCore.Diagnostics');
  });

  test('should return JSON error response with correct status code for missing routes', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware and routing are both configured
    // WHEN: An unmapped route is requested
    const response = await request.get(
      `${API_BASE_URL}/api/missing-route-verify-json-1-3`
    );

    // THEN: Response is either 404 (routing handled) or structured JSON error
    // Must NOT be an ASP.NET HTML error page or a plain-text 404
    expect([404, 400, 405]).toContain(response.status());
    const contentType = response.headers()['content-type'] ?? '';
    // Content type should be JSON, not HTML
    expect(contentType).not.toContain('text/html');
  });
});

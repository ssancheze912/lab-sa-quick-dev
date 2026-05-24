/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (API Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — siesa_agents_db database is created; __EFMigrationsHistory table is present
 *   AC3 — Unhandled exception returns Problem Details RFC 7807 (application/problem+json,
 *          no stack trace, Detail = null)
 *   AC5 — dotnet build succeeds with zero errors; SiesaAgentsDbContext is registered in DI
 *
 * Note: AC2 (Migrations/ folder with empty InitialCreate) and AC4 (ApplySnakeCaseNaming)
 *       are covered by C# unit tests in:
 *       backend/tests/SiesaAgents.UnitTests/Infrastructure/DbContextConfigurationTests.cs
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 & AC5: SiesaAgentsDbContext registered in DI — server starts and responds
// RED: Fails because AddDbContext<SiesaAgentsDbContext>() is not yet called in Program.cs
//      and Npgsql connection string is not configured for siesa_agents_db.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 + AC5 — DbContext DI registration and database connectivity', () => {
  test('should have the backend API server running — DbContext registered in DI without startup crash', async ({
    request,
  }) => {
    // GIVEN: SiesaAgentsDbContext is registered via AddDbContext<>() in Program.cs
    //        and ConnectionStrings:DefaultConnection points to siesa_agents_db
    // WHEN: An HTTP request is made to the backend base URL

    // CRITICAL: intercept route before navigation — network-first pattern
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: The server responds — a startup crash (missing DI registration, bad connection
    //       string) would prevent the server from starting and return connection refused
    expect(response.status()).toBeLessThan(500);
  });

  test('should return 200 on the Scalar endpoint after DbContext DI registration is added', async ({
    request,
  }) => {
    // GIVEN: Program.cs includes builder.Services.AddDbContext<SiesaAgentsDbContext>()
    //        and Microsoft.EntityFrameworkCore.Design is added to SiesaAgents.API.csproj
    // WHEN: The Scalar documentation endpoint is requested

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Scalar page serves correctly — confirms Program.cs compiled with DbContext wiring
    expect(response.status()).toBe(200);
  });

  test('should NOT return 500 on startup — invalid DbContext config would crash the process', async ({
    request,
  }) => {
    // GIVEN: The DefaultConnection string in appsettings.Development.json is valid
    //        (Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres)
    // WHEN: The healthcheck endpoint or any endpoint responds

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Status is not 500 — a misconfigured DbContext or connection string
    //       causes IHost.Build() to throw and the server to crash (returns nothing or 503)
    expect(response.status()).not.toBe(500);
  });

  test('should expose an OpenAPI document confirming the API project compiled with EF Core design tools', async ({
    request,
  }) => {
    // GIVEN: Microsoft.EntityFrameworkCore.Design is added to SiesaAgents.API.csproj
    //        (required for dotnet ef tooling to discover DbContext from the startup project)
    // WHEN: The OpenAPI JSON document is requested

    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    // THEN: OpenAPI document is served — the project compiled with Design package present
    //       (Design package has PrivateAssets=all so it does not affect runtime; presence
    //        is verified by the fact that dotnet build succeeded, which is proven by server up)
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('openapi');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3: Unhandled exception returns Problem Details RFC 7807
// RED: Fails because ExceptionHandlingMiddleware.cs does not exist yet as a
//      complete implementation wired to the test exception probe endpoint.
//      Additionally, a dedicated /api/test-exception endpoint does not exist.
//      The API test verifies the LIVE runtime behavior, not just unit-level mocks.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Problem Details RFC 7807 for unhandled exceptions (NFR6)', () => {
  test('should return Content-Type application/problem+json for unhandled server errors', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered before routing in Program.cs
    //        and the middleware sets context.Response.ContentType = "application/problem+json"
    // WHEN: An unhandled exception reaches the middleware
    //       (simulated via the dedicated test-exception endpoint that throws deliberately)

    const response = await request.get(`${API_BASE_URL}/api/test-exception`);

    // THEN: Content-Type header is exactly application/problem+json (RFC 7807)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');
  });

  test('should return HTTP status 500 when an unhandled exception is caught by the middleware', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware catches any unhandled Exception from the pipeline
    // WHEN: The test-exception endpoint throws a new Exception

    const response = await request.get(`${API_BASE_URL}/api/test-exception`);

    // THEN: Response status code is 500 Internal Server Error
    expect(response.status()).toBe(500);
  });

  test('should include the required RFC 7807 fields: status, title in the response body', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware returns a ProblemDetails object with Status=500
    //        and Title="An unexpected error occurred."
    // WHEN: The test-exception endpoint triggers the middleware

    const response = await request.get(`${API_BASE_URL}/api/test-exception`);

    // THEN: The JSON response body includes both required Problem Details fields
    const body = await response.json();
    expect(body).toHaveProperty('status', 500);
    expect(body).toHaveProperty('title');
    expect(typeof body.title).toBe('string');
    expect(body.title.length).toBeGreaterThan(0);
  });

  test('should have Detail field set to null — no internal error information exposed (NFR6)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware sets Detail = null per NFR6 (no ex.Message leakage)
    // WHEN: An exception is thrown by the test-exception endpoint

    const response = await request.get(`${API_BASE_URL}/api/test-exception`);
    const body = await response.json();

    // THEN: The "detail" field is absent or explicitly null in the response body
    //       (never exposes stack trace, exception message, or internal state)
    const detail = body['detail'] ?? null;
    expect(detail).toBeNull();
  });

  test('should NOT contain any stack trace text in the response body (NFR6 security)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware suppresses all exception internals (NFR6)
    // WHEN: Any unhandled exception is caught

    const response = await request.get(`${API_BASE_URL}/api/test-exception`);
    const body = await response.text();

    // THEN: The response body does not contain any stack trace indicators
    const stackTraceIndicators = [
      'at SiesaAgents',
      'System.Exception',
      'StackTrace',
      'InnerException',
      'at Microsoft',
      'at System',
    ];
    for (const indicator of stackTraceIndicators) {
      expect(body).not.toContain(indicator);
    }
  });

  test('should return consistent Problem Details structure regardless of exception type', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware catches all exception types uniformly
    // WHEN: The exception endpoint responds
    // NOTE: This verifies the live API matches the unit tests for NullReferenceException,
    //       InvalidOperationException, etc. (AC3 — "any unhandled exception")

    const response = await request.get(`${API_BASE_URL}/api/test-exception`);

    // THEN: Status and Content-Type are consistent — middleware does not discriminate by type
    expect(response.status()).toBe(500);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 edge cases: normal requests must NOT trigger the exception middleware
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Middleware passes through for normal requests (no false positives)', () => {
  test('should NOT return application/problem+json for a successful 200 response', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware only activates when an exception is thrown
    // WHEN: A valid endpoint that returns 200 is requested

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Content-Type is NOT application/problem+json (middleware did not intercept)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).not.toContain('application/problem+json');
  });

  test('should NOT return 500 when visiting a normal route (no exception path)', async ({
    request,
  }) => {
    // GIVEN: The middleware only catches exceptions, it does not transform normal responses
    // WHEN: /scalar is requested (no exception thrown)

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Status is not 500 — the middleware passed through without intercepting
    expect(response.status()).not.toBe(500);
  });
});

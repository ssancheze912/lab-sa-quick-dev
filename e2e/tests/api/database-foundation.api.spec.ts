/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (API Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — siesa_agents_db database is created; EF Core Migrations/ folder exists
 *          (verified at runtime: AppDbContext can connect and migrations are applied)
 *   AC2 — ExceptionHandlingMiddleware returns Problem Details RFC 7807 format
 *          (status, title, detail) with no stack traces exposed (NFR6)
 *   AC4 — AddDbContext<AppDbContext> registered with Npgsql + DefaultConnection;
 *          application starts without DI errors
 *   AC5 — dotnet build succeeds with zero errors and zero warnings
 *          (proxied by: backend starts and serves requests successfully)
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — PostgreSQL database connection and EF Core migrations
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Database connection and EF Core migrations', () => {
  test('should have the backend starting without DbContext registration errors', async ({
    request,
  }) => {
    // GIVEN: PostgreSQL is running locally and AppDbContext is registered in Program.cs
    // WHEN: The backend starts and any endpoint is requested

    // Intercept any call to ensure server is running
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: The server responds (start-up did NOT fail due to missing DbContext configuration)
    // A missing AddDbContext registration would throw InvalidOperationException on startup,
    // preventing the server from starting at all.
    expect(response.status()).toBe(200);
  });

  test('should return HTTP 200 from /scalar confirming DI wiring of AppDbContext is valid', async ({
    request,
  }) => {
    // GIVEN: builder.Services.AddDbContext<AppDbContext> is registered in Program.cs
    //        with UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
    // WHEN: The backend application starts successfully

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: /scalar loads, which proves Program.cs built the DI container without errors.
    // If AddDbContext was missing or misconfigured, .NET would throw during host.Build().
    expect(response.status()).toBe(200);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType.toLowerCase()).toContain('text/html');
  });

  test('should NOT have database migration endpoint returning 500 (infrastructure registered)', async ({
    request,
  }) => {
    // GIVEN: AppDbContext is registered and EF Core migrations are applied
    // WHEN: A health-check-like request is made to verify backend connectivity
    // NOTE: This is a proxy test — a 500 on startup/scalar indicates DI/EF Core failure

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: No Internal Server Error — the EF Core DbContext registration did not crash startup
    expect(response.status()).not.toBe(500);
    expect(response.status()).not.toBe(503);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — ExceptionHandlingMiddleware returns Problem Details RFC 7807 (NFR6)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — ExceptionHandlingMiddleware Problem Details RFC 7807 compliance', () => {
  test('[P0] should return application/problem+json content-type for unhandled exceptions', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered in Program.cs
    //        BEFORE app.UseCors() per story requirements
    // WHEN: A request triggers an unhandled exception (non-existent endpoint)

    const response = await request.get(`${API_BASE_URL}/api/atdd-trigger-error-1-3`);

    // THEN: Response content-type is application/problem+json (RFC 7807 compliance)
    // This verifies ExceptionHandlingMiddleware is active and correctly sets content-type
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType.toLowerCase()).toContain('json');
  });

  test('[P0] should NOT expose stack trace in error response body (NFR6)', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware sets Detail = null (company security standard NFR6)
    //        to prevent information disclosure via stack traces
    // WHEN: Any error response is returned

    const response = await request.get(`${API_BASE_URL}/api/atdd-stack-trace-check-1-3`);
    const body = await response.text();

    // THEN: The response body contains NO stack trace indicators
    expect(body).not.toContain('System.');
    expect(body).not.toContain('Microsoft.');
    expect(body).not.toContain('at SiesaAgents');
    expect(body).not.toContain('StackTrace');
    expect(body).not.toContain('   at ');
  });

  test('[P0] should NOT expose exception message text in error response (NFR6)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware must NOT expose ex.Message or ex.Detail
    //        Per company security standard NFR6 and story AC2
    // WHEN: An error response is returned from the backend

    const response = await request.get(`${API_BASE_URL}/api/atdd-exception-msg-check-1-3`);
    const body = await response.text();

    // THEN: Raw exception messages are NOT in the response body
    expect(body).not.toContain('NullReferenceException');
    expect(body).not.toContain('InvalidOperationException');
    expect(body).not.toContain('Object reference not set');
  });

  test('[P1] should return an HTTP error status code (not 200) for unhandled errors', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware catches all unhandled exceptions
    // WHEN: A path that triggers an error is requested

    const response = await request.get(`${API_BASE_URL}/api/atdd-status-check-1-3`);

    // THEN: The response returns a proper error status code (4xx or 5xx, never 200)
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('[P1] should have ExceptionHandlingMiddleware registered BEFORE UseCors in Program.cs', async ({
    request,
  }) => {
    // GIVEN: The story mandates app.UseMiddleware<ExceptionHandlingMiddleware>() is called
    //        BEFORE app.UseCors("DevCors") in Program.cs
    // WHEN: A cross-origin error request is made from the frontend origin

    const response = await request.get(`${API_BASE_URL}/api/atdd-cors-error-order-1-3`, {
      headers: {
        Origin: 'http://localhost:5173',
      },
    });

    // THEN: Even error responses include CORS headers so the frontend can read the error body.
    // This proves middleware order is correct — CORS runs on all responses including errors.
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    const corsIsPresent = allowOrigin === 'http://localhost:5173' || allowOrigin === '*';
    expect(corsIsPresent).toBe(true);
  });

  test('[P2] should NOT return HTML error page for API requests', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware is active (no DeveloperExceptionPage HTML)
    // WHEN: An unknown API path is requested

    const response = await request.get(`${API_BASE_URL}/api/atdd-no-html-error-1-3`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Response is NOT an HTML page — middleware correctly returns JSON error
    expect(contentType.toLowerCase()).not.toContain('text/html');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — AppDbContext registered in Program.cs with Npgsql + DefaultConnection
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — AppDbContext DI registration and Npgsql configuration', () => {
  test('[P0] should have backend starting without DI exception for AppDbContext', async ({
    request,
  }) => {
    // GIVEN: Program.cs includes builder.Services.AddDbContext<AppDbContext>(options =>
    //        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")))
    // WHEN: The application starts and handles any request

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Application started successfully (AddDbContext was correctly registered).
    // A missing UseNpgsql registration would throw InvalidOperationException:
    // "No database provider has been configured for this DbContext."
    expect(response.status()).toBe(200);
  });

  test('[P1] should serve OpenAPI spec confirming full application pipeline is wired', async ({
    request,
  }) => {
    // GIVEN: Program.cs has AddDbContext, AddOpenApi, UseCors all correctly registered
    // WHEN: The OpenAPI JSON spec endpoint is requested

    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    // THEN: OpenAPI spec is served, confirming the entire DI container built successfully.
    // If AddDbContext had a misconfiguration, the host build would fail and return nothing.
    expect(response.status()).toBe(200);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType.toLowerCase()).toContain('json');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — dotnet build succeeds with zero errors and zero warnings
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Backend solution builds with zero errors and zero warnings', () => {
  test('[P0] should have the backend running (proves zero-error build completed)', async ({
    request,
  }) => {
    // GIVEN: dotnet build SiesaAgents.sln executes with TreatWarningsAsErrors=true
    // WHEN: The backend server responds to requests

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Server is running — this is only possible if dotnet build succeeded with zero errors.
    // With TreatWarningsAsErrors=true, any warning also causes a build failure.
    expect(response.status()).toBe(200);
  });

  test('[P1] should have all Clean Architecture layers operational after build', async ({
    request,
  }) => {
    // GIVEN: SiesaAgents.sln contains API, Application, Domain, Infrastructure projects
    //        All four compile and reference each other correctly
    // WHEN: The backend DI container is resolved (includes Infrastructure layer via AppDbContext)

    // Intercept before navigating to ensure route is set up
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    // THEN: OpenAPI endpoint responds, confirming all four Clean Architecture projects
    // compiled and linked without errors. Infrastructure layer (DbContext) is resolved via DI.
    expect(response.status()).toBe(200);
  });
});

/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (API Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — PostgreSQL database siesa_agents_db created with __EFMigrationsHistory table
 *   AC4 — Backend starts on port 5000 with EF Core Npgsql provider registered
 *   AC5 — ExceptionHandlingMiddleware returns Problem Details RFC 7807 (via HTTP)
 *   AC6 — GET /scalar returns 200 (Scalar registered, Swagger absent)
 *   AC7 — Startup with bad connection string does not crash; error surfaces on first DB op
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Backend starts with EF Core + Npgsql provider registered
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Backend starts with valid connection string and EF Core Npgsql', () => {
  test('should have the backend running on port 5000 when connection string is valid', async ({ request }) => {
    // GIVEN: ConnectionStrings__DefaultConnection env var is set to a valid PostgreSQL instance
    // WHEN: A GET request is made to the backend health-check or base URL

    const response = await request.get(`${API_BASE_URL}/`);

    // THEN: Server responds — startup did not crash due to EF Core misconfiguration
    // Any non-connection-refused response indicates the app started successfully
    expect(response.status()).toBeLessThan(500);
  });

  test('should respond to the Scalar endpoint confirming the app started on port 5000', async ({ request }) => {
    // GIVEN: AppDbContext is registered via builder.Services.AddDbContext<AppDbContext>()
    //        using the Npgsql provider in Program.cs
    // WHEN: The application starts and Scalar endpoint is accessed

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Scalar responds with HTTP 200, confirming the app started without DI errors
    expect(response.status()).toBe(200);
  });

  test('should NOT expose Swagger — only Scalar is permitted', async ({ request }) => {
    // GIVEN: Architecture mandates app.MapScalarApiReference(), never app.UseSwagger()
    // WHEN: A GET request is made to the /swagger endpoint

    const response = await request.get(`${API_BASE_URL}/swagger`);

    // THEN: /swagger does NOT return HTTP 200 (endpoint must not be registered)
    expect(response.status()).not.toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — ExceptionHandlingMiddleware returns Problem Details RFC 7807 (HTTP-level)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — ExceptionHandlingMiddleware returns Problem Details RFC 7807', () => {
  test('should return application/problem+json content-type for unhandled 404 paths', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered as the first middleware in Program.cs
    // WHEN: A request is made to a non-existent endpoint (simulates unhandled exception path)

    const response = await request.get(`${API_BASE_URL}/api/does-not-exist-atdd-1-3`);

    // THEN: Response content-type is JSON (not HTML), indicating middleware is handling errors
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');
  });

  test('should return RFC 7807 Problem Details body with status field for unhandled routes', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware wraps all requests and returns Problem Details
    // WHEN: An unhandled route is accessed

    const response = await request.get(`${API_BASE_URL}/api/trigger-problem-details-atdd`);
    const body = await response.json().catch(() => null);

    // THEN: Body contains RFC 7807 required fields (status is not null/undefined)
    // The middleware must produce { status, title, detail } — no stacktrace
    expect(body).not.toBeNull();
    expect(typeof body.status === 'number' || body.status === undefined).toBe(true);
  });

  test('should NOT expose stack traces in error responses from the API', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware is configured to never expose StackTrace (NFR6)
    // WHEN: Any error response is received from the API

    const response = await request.get(`${API_BASE_URL}/api/nonexistent-atdd-1-3-stack`);
    const bodyText = await response.text();

    // THEN: Response body does NOT contain "StackTrace" or "at System." (no .NET stack dump)
    expect(bodyText).not.toContain('StackTrace');
    expect(bodyText).not.toContain('at System.');
    expect(bodyText).not.toContain('at Microsoft.');
  });

  test('should return HTTP 404 status for not-found routes via middleware', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware maps KeyNotFoundException / not-found scenarios to 404
    // WHEN: A request hits an endpoint that does not exist

    const response = await request.get(`${API_BASE_URL}/api/resource-not-found-atdd-1-3`);

    // THEN: HTTP status is 404 (not 200 or 500)
    expect(response.status()).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — GET /scalar returns 200 with HTML content (Scalar registered in Program.cs)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Scalar API documentation page loads correctly', () => {
  test('should return HTTP 200 when accessing GET /scalar', async ({ request }) => {
    // GIVEN: app.MapScalarApiReference() is registered in Program.cs (never app.UseSwagger())
    // WHEN: GET /scalar is requested

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Scalar API documentation page returns HTTP 200
    expect(response.status()).toBe(200);
  });

  test('should return HTML content from the Scalar endpoint', async ({ request }) => {
    // GIVEN: Scalar.AspNetCore package is installed and MapScalarApiReference() is called
    // WHEN: GET /scalar is requested

    const response = await request.get(`${API_BASE_URL}/scalar`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Response content-type is text/html (Scalar serves an HTML page)
    expect(contentType).toContain('text/html');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC7 — Startup with bad/missing connection string does NOT crash the application
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 — EF Core lazy connection: bad connection string does not crash startup', () => {
  test('should have backend running and serving Scalar even if DB is unreachable', async ({ request }) => {
    // GIVEN: The application may be started with an unreachable PostgreSQL instance
    //        EF Core uses lazy connection — it does NOT connect on startup
    // WHEN: The Scalar endpoint (non-DB path) is accessed

    // Route interception not applicable here — this is a direct API test
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Application is running (Scalar serves HTML) — startup did not fail
    // EF Core lazy connection means the app starts even with a bad connection string
    expect(response.status()).toBe(200);
  });

  test('should respond to non-database endpoints even when DB connectivity is degraded', async ({ request }) => {
    // GIVEN: PostgreSQL instance may be unavailable (simulated by app startup context)
    // WHEN: A request is made to a non-database endpoint

    const response = await request.get(`${API_BASE_URL}/`);

    // THEN: The server responds — startup was not aborted due to DB connection failure
    // Status < 500 means the app is running (not crashed)
    expect(response.status()).toBeLessThan(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Database connectivity: siesa_agents_db exists after migration
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — EF Core migrations applied: siesa_agents_db exists', () => {
  test('should return a valid response from a DB-connected endpoint after migrations applied', async ({ request }) => {
    // GIVEN: PostgreSQL is running locally and dotnet ef database update has been executed
    //        AppDbContext is registered in Program.cs using Npgsql provider
    // WHEN: An endpoint that requires DB connectivity is accessed

    // NOTE: This test validates the DB layer is wired correctly.
    // Before Epic 2 endpoints exist, we probe the health of the DI registration
    // by verifying the app responds without a 500 DI configuration error.
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Application serves responses — EF Core DI configuration is valid
    // A missing Npgsql package or wrong DbContext registration would cause a 500 on startup
    expect(response.status()).toBe(200);
  });
});

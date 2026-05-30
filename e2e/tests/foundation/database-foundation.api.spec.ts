/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (API Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC3 — ExceptionHandlingMiddleware returns application/problem+json with RFC 7807 body
 *   AC4 — Backend builds and starts; connection string read from appsettings.Development.json
 *   AC5 — EF Core registered with Npgsql; AppDbContext participates in DI pipeline
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC3: ExceptionHandlingMiddleware — RFC 7807 Problem Details on unhandled errors
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — ExceptionHandlingMiddleware: RFC 7807 Problem Details on unhandled exceptions', () => {
  test('should return Content-Type application/problem+json when an unhandled error occurs', async ({
    request,
  }) => {
    // GIVEN: The backend is running with ExceptionHandlingMiddleware registered first in the pipeline
    // WHEN: A request triggers an unhandled exception path (non-existent endpoint that throws)
    // NOTE: We use a dedicated test-error endpoint to trigger the middleware
    // Implementation must expose GET /api/test/throw-error (test-only) OR
    // ExceptionHandlingMiddleware must intercept any unhandled exception in the pipeline

    const response = await request.get(`${API_BASE_URL}/api/test/throw-error`);

    // THEN: Content-Type header is exactly application/problem+json
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');
  });

  test('should return HTTP 500 status code for an unexpected unhandled exception', async ({
    request,
  }) => {
    // GIVEN: The ExceptionHandlingMiddleware is wired before routing in Program.cs
    // WHEN: An unhandled Exception (not ArgumentException/KeyNotFoundException) propagates

    const response = await request.get(`${API_BASE_URL}/api/test/throw-error`);

    // THEN: HTTP status code is 500 (Internal Server Error)
    expect(response.status()).toBe(500);
  });

  test('should return RFC 7807 body with status field equal to 500', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware catches an unhandled Exception
    // WHEN: The middleware writes the Problem Details response body

    const response = await request.get(`${API_BASE_URL}/api/test/throw-error`);
    const body = await response.json();

    // THEN: The body contains a "status" field equal to 500
    expect(body).toHaveProperty('status', 500);
  });

  test('should return RFC 7807 body with a title field (non-empty string)', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware formats the Problem Details response
    // WHEN: The error response body is parsed

    const response = await request.get(`${API_BASE_URL}/api/test/throw-error`);
    const body = await response.json();

    // THEN: The body contains a "title" field that is a non-empty string
    expect(body).toHaveProperty('title');
    expect(typeof body.title).toBe('string');
    expect((body.title as string).length).toBeGreaterThan(0);
  });

  test('should NOT expose stack trace or internal error details in the response body', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is configured to hide implementation details (NFR6)
    // WHEN: An unhandled exception occurs and the response body is checked

    const response = await request.get(`${API_BASE_URL}/api/test/throw-error`);
    const bodyText = await response.text();

    // THEN: Stack trace markers, exception type names, and source paths are NOT present
    expect(bodyText).not.toContain('at System.');
    expect(bodyText).not.toContain('StackTrace');
    expect(bodyText).not.toContain('Exception:');
    expect(bodyText).not.toContain('---> ');
  });

  test('should NOT expose the exception message as detail in the response body', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware intentionally sets Detail = null per security requirement
    // WHEN: The response body is parsed for the "detail" field

    const response = await request.get(`${API_BASE_URL}/api/test/throw-error`);
    const body = await response.json();

    // THEN: The "detail" field is either absent or null (never the raw ex.Message)
    if ('detail' in body) {
      expect(body.detail).toBeNull();
    }
    // If detail is absent entirely, the test also passes (field not required in RFC 7807)
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4: Backend builds and reads connection string from configuration
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Backend builds successfully and reads connection string from appsettings', () => {
  test('should have the backend running (proving dotnet build succeeded with zero errors)', async ({
    request,
  }) => {
    // GIVEN: dotnet build SiesaAgents.sln has been executed from the backend/ directory
    // WHEN: The backend server receives a request (only possible if build succeeded)

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: The server is running (build must have succeeded — a failed build cannot start)
    expect(response.status()).toBe(200);
  });

  test('should have EF Core connected — server does not crash on startup (connection string valid)', async ({
    request,
  }) => {
    // GIVEN: appsettings.Development.json contains DefaultConnection with siesa_agents_db
    // AND: Program.cs reads it via builder.Configuration.GetConnectionString("DefaultConnection")
    // WHEN: The backend starts and receives its first request

    // THEN: The server responds normally — a hardcoded or missing connection string would crash startup
    const response = await request.get(`${API_BASE_URL}/scalar`);
    expect(response.status()).toBeLessThan(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5: EF Core registered with Npgsql provider; AppDbContext wired into DI
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — EF Core and AppDbContext registered in DI with Npgsql provider', () => {
  test('should expose a database health check endpoint returning 200 when DB is reachable', async ({
    request,
  }) => {
    // GIVEN: AppDbContext is registered with Npgsql in Program.cs
    // AND: PostgreSQL siesa_agents_db is running locally
    // WHEN: The /api/health/database endpoint is requested
    // NOTE: Implementation must add GET /api/health/database that calls context.Database.CanConnectAsync()

    const response = await request.get(`${API_BASE_URL}/api/health/database`);

    // THEN: The endpoint returns 200, proving AppDbContext resolves from DI and connects
    expect(response.status()).toBe(200);
  });

  test('should return a JSON body with canConnect: true from the database health endpoint', async ({
    request,
  }) => {
    // GIVEN: EF Core Npgsql provider is configured with the correct connection string
    // WHEN: /api/health/database is called and AppDbContext.Database.CanConnectAsync() executes

    const response = await request.get(`${API_BASE_URL}/api/health/database`);
    const body = await response.json();

    // THEN: The body confirms DB connectivity
    expect(body).toHaveProperty('canConnect', true);
  });

  test('should NOT expose any DbSet properties for ClienteEntity or ContactoEntity (scope boundary)', async ({
    request,
  }) => {
    // GIVEN: AppDbContext in Story 1.3 must be intentionally empty (no domain entities yet)
    // WHEN: The OpenAPI spec is retrieved and inspected for entity-level endpoints

    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);
    const spec = await response.json();

    // THEN: No paths for /api/v1/clientes or /api/v1/contactos exist yet
    // These are added in Epics 2 and 3 respectively
    const paths = spec.paths ?? {};
    expect(Object.keys(paths)).not.toContain('/api/v1/clientes');
    expect(Object.keys(paths)).not.toContain('/api/v1/contactos');
  });
});

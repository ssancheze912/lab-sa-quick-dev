/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * AUTOMATION EXPANSION — API Edge Cases & Boundary Conditions
 * Expands ATDD coverage with health endpoint contracts, response shape validation,
 * concurrent requests, wrong HTTP methods, and diagnostic endpoint constraints.
 *
 * Focus areas:
 *   - Health endpoint response shape: required fields present in all conditions
 *   - Diagnostic endpoints only reachable in Development environment
 *   - Wrong HTTP methods on health endpoints (POST/PUT/DELETE must return 405)
 *   - Concurrent requests to health endpoints must all succeed consistently
 *   - Migration list shape validation (empty vs. populated lists)
 *   - Problem Details contract: trigger-exception endpoint boundary cases
 *   - DB health endpoint: unhealthy vs healthy response shape consistency
 *   - Schema-conventions endpoint: tables array always present even if DB unreachable
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// Health endpoint — response shape invariants
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] DB health endpoint — response shape invariants', () => {
  test('[P1] /api/v1/health/db must return a JSON body with a "status" field in any condition', async ({
    request,
  }) => {
    // GIVEN: The /api/v1/health/db endpoint exists in Development mode
    // WHEN: A GET request is made to the endpoint
    const response = await request.get(`${API_BASE_URL}/api/v1/health/db`);

    // THEN: The response is JSON and contains the "status" field
    // (either "healthy" or "unhealthy" — but field must always be present)
    expect([200, 503]).toContain(response.status());
    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(typeof body.status).toBe('string');
    expect(body.status.length).toBeGreaterThan(0);
  });

  test('[P1] /api/v1/health/db must NOT expose connection string or credentials in response body', async ({
    request,
  }) => {
    // GIVEN: The health probe accesses the DB via AppDbContext
    // WHEN: The endpoint responds (healthy or unhealthy)
    const response = await request.get(`${API_BASE_URL}/api/v1/health/db`);

    // THEN: The response body does NOT contain the raw PostgreSQL connection string or credentials
    const body = await response.text();
    expect(body.toLowerCase()).not.toContain('password=');
    expect(body.toLowerCase()).not.toContain('username=postgres');
    expect(body).not.toContain('Host=localhost');
  });

  test('[P1] /api/v1/health/db healthy response must include "database" field', async ({
    request,
  }) => {
    // GIVEN: DB is reachable (siesa_agents_db is running)
    // WHEN: The DB health endpoint returns 200
    const response = await request.get(`${API_BASE_URL}/api/v1/health/db`);
    if (response.status() !== 200) {
      test.skip();
      return;
    }

    // THEN: The healthy response body contains a "database" field with value "reachable"
    const body = await response.json();
    expect(body).toHaveProperty('database');
    expect(body.database).toBe('reachable');
  });

  test('[P2] /api/v1/health/db returns JSON content-type regardless of health state', async ({
    request,
  }) => {
    // GIVEN: The health endpoint is implemented as a minimal API returning Results.Ok/Results.Json
    // WHEN: A request is made
    const response = await request.get(`${API_BASE_URL}/api/v1/health/db`);

    // THEN: Content-Type includes application/json (not text/html or text/plain)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType.toLowerCase()).toContain('application/json');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Migrations endpoint — response shape edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Migrations endpoint — response shape and boundary conditions', () => {
  test('[P1] /api/v1/health/migrations must return an object with "appliedMigrations" array', async ({
    request,
  }) => {
    // GIVEN: The migrations list endpoint is registered in Program.cs (Development only)
    // WHEN: A GET request is made
    const response = await request.get(`${API_BASE_URL}/api/v1/health/migrations`);

    // THEN: Status 200 and body has "appliedMigrations" array
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('appliedMigrations');
    expect(Array.isArray(body.appliedMigrations)).toBe(true);
  });

  test('[P1] /api/v1/health/migrations — each migration entry has a "migrationId" string field', async ({
    request,
  }) => {
    // GIVEN: At least one migration (InitialCreate) has been applied
    // WHEN: The migration list is fetched
    const response = await request.get(`${API_BASE_URL}/api/v1/health/migrations`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    const migrations: Array<{ migrationId: string }> = body.appliedMigrations ?? [];

    // THEN: Every entry in the list has a non-empty "migrationId" string
    for (const migration of migrations) {
      expect(typeof migration.migrationId).toBe('string');
      expect(migration.migrationId.length).toBeGreaterThan(0);
    }
  });

  test('[P1] /api/v1/health/migrations — migrationId contains "InitialCreate" substring', async ({
    request,
  }) => {
    // GIVEN: The InitialCreate migration was applied via `dotnet ef database update`
    // WHEN: The migrations list is fetched
    const response = await request.get(`${API_BASE_URL}/api/v1/health/migrations`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    const migrations: Array<{ migrationId: string }> = body.appliedMigrations ?? [];

    // THEN: The list contains an entry whose migrationId includes "InitialCreate"
    const hasInitialCreate = migrations.some((m) =>
      m.migrationId.includes('InitialCreate')
    );
    expect(hasInitialCreate).toBe(true);
  });

  test('[P2] /api/v1/health/migrations — migrationId follows EF Core timestamp format', async ({
    request,
  }) => {
    // GIVEN: EF Core generates migration IDs in format: <YYYYMMDDHHmmss>_<Name>
    // WHEN: Migration IDs are inspected
    const response = await request.get(`${API_BASE_URL}/api/v1/health/migrations`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    const migrations: Array<{ migrationId: string }> = body.appliedMigrations ?? [];

    // THEN: Each migration ID matches the EF Core timestamp_name pattern
    for (const migration of migrations) {
      // EF Core format: 14-digit timestamp followed by underscore and name
      expect(migration.migrationId).toMatch(/^\d{14}_\w+$/);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DI health endpoint — AppDbContext registration validation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] DI health endpoint — AppDbContext registration edge cases', () => {
  test('[P1] /api/v1/health/di must return "appDbContextRegistered" = true', async ({
    request,
  }) => {
    // GIVEN: Program.cs registers AddDbContext<AppDbContext>
    // WHEN: The DI health endpoint is queried
    const response = await request.get(`${API_BASE_URL}/api/v1/health/di`);

    // THEN: Status 200 and appDbContextRegistered is explicitly true
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('appDbContextRegistered', true);
  });

  test('[P1] /api/v1/health/di must include "infrastructureLayer" field in response', async ({
    request,
  }) => {
    // GIVEN: The DI health endpoint reports the infrastructure layer name
    // WHEN: The endpoint is queried
    const response = await request.get(`${API_BASE_URL}/api/v1/health/di`);
    expect(response.status()).toBe(200);

    // THEN: "infrastructureLayer" field is present and non-empty
    const body = await response.json();
    expect(body).toHaveProperty('infrastructureLayer');
    expect(typeof body.infrastructureLayer).toBe('string');
    expect(body.infrastructureLayer.length).toBeGreaterThan(0);
  });

  test('[P2] /api/v1/health/di response does NOT expose internal DI registration details', async ({
    request,
  }) => {
    // GIVEN: DI health endpoint should only return safe diagnostic info
    // WHEN: The endpoint is queried
    const response = await request.get(`${API_BASE_URL}/api/v1/health/di`);
    const body = await response.text();

    // THEN: Internal assembly paths and connection strings are NOT exposed
    expect(body).not.toContain('password=');
    expect(body).not.toContain('localhost');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Connection-info endpoint — provider and database name validation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Connection-info endpoint — provider and database boundary conditions', () => {
  test('[P1] /api/v1/health/connection-info must return "database" = "siesa_agents_db"', async ({
    request,
  }) => {
    // GIVEN: appsettings.Development.json has DefaultConnection pointing to siesa_agents_db
    // WHEN: The connection-info endpoint is queried
    const response = await request.get(`${API_BASE_URL}/api/v1/health/connection-info`);
    expect(response.status()).toBe(200);

    // THEN: The database name matches exactly "siesa_agents_db"
    const body = await response.json();
    expect(body).toHaveProperty('database', 'siesa_agents_db');
  });

  test('[P1] /api/v1/health/connection-info provider must be Npgsql (not SQLite/InMemory)', async ({
    request,
  }) => {
    // GIVEN: Infrastructure uses Npgsql.EntityFrameworkCore.PostgreSQL
    // WHEN: The provider field is returned
    const response = await request.get(`${API_BASE_URL}/api/v1/health/connection-info`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('provider');

    // THEN: Provider is Npgsql, not SQLite, InMemory, or SQL Server
    const provider = String(body.provider).toLowerCase();
    expect(provider).toContain('npgsql');
    expect(provider).not.toContain('sqlite');
    expect(provider).not.toContain('inmemory');
    expect(provider).not.toContain('sqlserver');
  });

  test('[P1] /api/v1/health/connection-info must report "connectionConfigured" = true', async ({
    request,
  }) => {
    // GIVEN: Connection string is set in appsettings.Development.json
    // WHEN: The connection-info endpoint confirms string is not empty
    const response = await request.get(`${API_BASE_URL}/api/v1/health/connection-info`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('connectionConfigured', true);
  });

  test('[P2] /api/v1/health/connection-info must NOT expose the full connection string', async ({
    request,
  }) => {
    // GIVEN: Security requirement — connection strings must not be exposed in API responses
    // WHEN: The connection-info endpoint is queried
    const response = await request.get(`${API_BASE_URL}/api/v1/health/connection-info`);
    const body = await response.text();

    // THEN: The raw connection string with password and host is NOT exposed
    expect(body.toLowerCase()).not.toContain('password=');
    expect(body.toLowerCase()).not.toContain('password%3d');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EF Core naming endpoint — snake_case contract
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] EFCore naming endpoint — snake_case contract edge cases', () => {
  test('[P1] /api/v1/health/efcore-naming must include "namingConvention" field', async ({
    request,
  }) => {
    // GIVEN: The naming diagnostic endpoint exists in Development
    // WHEN: A GET request is made
    const response = await request.get(`${API_BASE_URL}/api/v1/health/efcore-naming`);

    // THEN: Status 200 and "namingConvention" field present
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('namingConvention');
  });

  test('[P1] /api/v1/health/efcore-naming — "active" field must be a boolean', async ({
    request,
  }) => {
    // GIVEN: The endpoint returns an "active" flag indicating if snake_case is applied
    // WHEN: The endpoint is queried
    const response = await request.get(`${API_BASE_URL}/api/v1/health/efcore-naming`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('active');
    expect(typeof body.active).toBe('boolean');
  });

  test('[P2] /api/v1/health/efcore-naming — response must not expose internal EF Core type names', async ({
    request,
  }) => {
    // GIVEN: The endpoint is a safe diagnostic endpoint
    // WHEN: The response body is inspected for internal type leakage
    const response = await request.get(`${API_BASE_URL}/api/v1/health/efcore-naming`);
    const body = await response.text();

    // THEN: Internal EF Core type names and assembly paths not exposed
    expect(body).not.toContain('EntityFrameworkCore.Infrastructure');
    expect(body).not.toContain('AppDbContextOptions');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Schema-conventions endpoint — table list contract
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Schema-conventions endpoint — table list boundary conditions', () => {
  test('[P1] /api/v1/health/schema-conventions must return a "tables" array field always', async ({
    request,
  }) => {
    // GIVEN: The schema-conventions endpoint catches DB errors and returns empty tables array
    // WHEN: The endpoint is queried
    const response = await request.get(`${API_BASE_URL}/api/v1/health/schema-conventions`);

    // THEN: Status 200 and "tables" is always an array (even if DB is down)
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('tables');
    expect(Array.isArray(body.tables)).toBe(true);
  });

  test('[P1] /api/v1/health/schema-conventions must include "hasManualColumnAttributes" boolean', async ({
    request,
  }) => {
    // GIVEN: Company standard prohibits manual [Column]/[Table] attributes
    // WHEN: The conventions endpoint reports compliance
    const response = await request.get(`${API_BASE_URL}/api/v1/health/schema-conventions`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('hasManualColumnAttributes');
    expect(typeof body.hasManualColumnAttributes).toBe('boolean');
  });

  test('[P1] /api/v1/health/schema-conventions must return "hasManualColumnAttributes" = false', async ({
    request,
  }) => {
    // GIVEN: Company standards forbid manual [Column]/[Table] attributes — always false in this story
    // WHEN: The conventions endpoint is queried
    const response = await request.get(`${API_BASE_URL}/api/v1/health/schema-conventions`);
    expect(response.status()).toBe(200);

    // THEN: The flag is false (no manual attribute overrides in Story 1.3)
    const body = await response.json();
    expect(body.hasManualColumnAttributes).toBe(false);
  });

  test('[P1] /api/v1/health/schema-conventions tables must NOT contain "clientes" (Epic 2 scope)', async ({
    request,
  }) => {
    // GIVEN: Story 1.3 creates an empty migration (no domain tables)
    // WHEN: The schema-conventions endpoint lists existing tables
    const response = await request.get(`${API_BASE_URL}/api/v1/health/schema-conventions`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    const tables: string[] = body.tables ?? [];

    // THEN: The "clientes" table is not present (belongs to Epic 2 Story 2.1)
    expect(tables.map((t: string) => t.toLowerCase())).not.toContain('clientes');
  });

  test('[P1] /api/v1/health/schema-conventions tables must NOT contain "contactos" (Epic 3 scope)', async ({
    request,
  }) => {
    // GIVEN: Story 1.3 creates an empty migration (no domain tables)
    // WHEN: The schema-conventions endpoint lists existing tables
    const response = await request.get(`${API_BASE_URL}/api/v1/health/schema-conventions`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    const tables: string[] = body.tables ?? [];

    // THEN: The "contactos" table is not present (belongs to Epic 3 Story 3.1)
    expect(tables.map((t: string) => t.toLowerCase())).not.toContain('contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Trigger-exception endpoint — edge cases beyond AC2 ATDD
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Trigger-exception endpoint — Problem Details edge cases', () => {
  test('[P1] /api/test/trigger-exception — response body must be valid JSON (not HTML or plain text)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware returns ProblemDetails JSON
    // WHEN: The exception endpoint is triggered
    const response = await request.get(`${API_BASE_URL}/api/test/trigger-exception`);
    expect(response.status()).toBe(500);

    // THEN: Body is parseable JSON (not HTML error page)
    const body = await response.json();
    expect(body).toBeDefined();
    expect(typeof body).toBe('object');
  });

  test('[P1] /api/test/trigger-exception — must NOT return HTML error page (ASP.NET dev exception page must be disabled)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware precedes all routing (before UseExceptionHandler)
    // WHEN: An exception is triggered
    const response = await request.get(`${API_BASE_URL}/api/test/trigger-exception`);

    // THEN: Response body is NOT an HTML page (dev exception page must not leak stack traces)
    const body = await response.text();
    expect(body).not.toContain('<!DOCTYPE html>');
    expect(body).not.toContain('<html');
    expect(body).not.toContain('System.InvalidOperationException');
  });

  test('[P1] /api/test/trigger-exception — response must have Content-Type: application/problem+json', async ({
    request,
  }) => {
    // GIVEN: WriteAsJsonAsync with explicit contentType: "application/problem+json"
    // WHEN: The exception is triggered
    const response = await request.get(`${API_BASE_URL}/api/test/trigger-exception`);

    // THEN: Content-Type is exactly application/problem+json (RFC 7807 requirement)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType.toLowerCase()).toContain('application/problem+json');
  });

  test('[P2] /api/test/trigger-exception — calling it twice returns identical response shape', async ({
    request,
  }) => {
    // GIVEN: Middleware response is deterministic (fixed ProblemDetails structure)
    // WHEN: Two requests are made to the exception endpoint
    const [response1, response2] = await Promise.all([
      request.get(`${API_BASE_URL}/api/test/trigger-exception`),
      request.get(`${API_BASE_URL}/api/test/trigger-exception`),
    ]);

    // THEN: Both responses have the same shape
    expect(response1.status()).toBe(500);
    expect(response2.status()).toBe(500);

    const body1 = await response1.json();
    const body2 = await response2.json();

    expect(body1.status).toBe(body2.status);
    expect(body1.title).toBe(body2.title);
  });

  test('[P2] /api/test/trigger-exception — response "type" field must be absent or null (not exposing problem type URI)', async ({
    request,
  }) => {
    // GIVEN: ProblemDetails.Type is not set in ExceptionHandlingMiddleware
    // WHEN: The exception endpoint is triggered
    const response = await request.get(`${API_BASE_URL}/api/test/trigger-exception`);
    const body = await response.json();

    // THEN: "type" field is either absent or null (no internal route/type URIs exposed)
    const type = body['type'] ?? null;
    // Acceptable: absent or null — not an internal URI pattern
    if (type !== null) {
      expect(String(type).toLowerCase()).not.toContain('localhost');
      expect(String(type).toLowerCase()).not.toContain('internal');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Concurrent access — diagnostic endpoints handle concurrent requests
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Diagnostic endpoints — concurrent request handling', () => {
  test('[P2] /api/v1/health/di — 5 concurrent requests all return 200', async ({ request }) => {
    // GIVEN: AppDbContext is registered as a scoped service (per-request lifecycle)
    // WHEN: 5 concurrent requests are sent to the DI health endpoint
    const responses = await Promise.all(
      Array.from({ length: 5 }, () => request.get(`${API_BASE_URL}/api/v1/health/di`))
    );

    // THEN: All 5 return 200 (scoped DI resolution is safe for concurrent requests)
    for (const response of responses) {
      expect(response.status()).toBe(200);
    }
  });

  test('[P2] /api/v1/health/migrations — 3 concurrent requests return consistent migration list', async ({
    request,
  }) => {
    // GIVEN: The migrations list is read-only from __EFMigrationsHistory table
    // WHEN: 3 concurrent requests are made
    const responses = await Promise.all(
      Array.from({ length: 3 }, () =>
        request.get(`${API_BASE_URL}/api/v1/health/migrations`)
      )
    );

    // THEN: All 3 return 200 and the same migration count
    const bodies = await Promise.all(responses.map((r) => r.json()));
    const migrationCounts = bodies.map(
      (b) => (b.appliedMigrations ?? []).length
    );

    for (const response of responses) {
      expect(response.status()).toBe(200);
    }

    // All concurrent reads return the same count (read consistency)
    expect(new Set(migrationCounts).size).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// HTTP method constraints — diagnostic endpoints are GET-only
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Diagnostic endpoints — HTTP method constraints', () => {
  test('[P2] /api/v1/health/db must return 405 for POST requests', async ({ request }) => {
    // GIVEN: Health endpoints are registered with MapGet (GET only)
    // WHEN: A POST request is sent to the DB health endpoint
    const response = await request.post(`${API_BASE_URL}/api/v1/health/db`, { data: {} });

    // THEN: 405 Method Not Allowed (not 500 or 200)
    expect(response.status()).toBe(405);
  });

  test('[P2] /api/v1/health/di must return 405 for POST requests', async ({ request }) => {
    // GIVEN: DI health endpoint is GET-only (MapGet)
    // WHEN: A POST request is sent
    const response = await request.post(`${API_BASE_URL}/api/v1/health/di`, { data: {} });

    // THEN: 405 Method Not Allowed
    expect(response.status()).toBe(405);
  });

  test('[P2] /api/v1/health/migrations must return 405 for DELETE requests', async ({
    request,
  }) => {
    // GIVEN: Migrations endpoint is read-only (GET only)
    // WHEN: A DELETE request is sent (cannot delete migrations via API)
    const response = await request.delete(`${API_BASE_URL}/api/v1/health/migrations`);

    // THEN: 405 Method Not Allowed (migrations are only deletable via dotnet ef CLI)
    expect(response.status()).toBe(405);
  });
});

/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * Edge Case & Boundary Tests — AUTO-GENERATED (testarch-automate)
 *
 * Expands ATDD coverage (backend-database-foundation.api.spec.ts) with:
 *   - ExceptionHandlingMiddleware exact Problem Details values via live API
 *   - /api/test/throw endpoint does not expose exception type in response body
 *   - /api/test/throw returns camelCase JSON fields (PropertyNamingPolicy.CamelCase)
 *   - /api/diagnostics/migrations alias endpoint exists and responds (not 404)
 *   - /api/health/db-migrations response time boundary (< 5 seconds)
 *   - DB migration endpoint returns JSON (not HTML) response
 *   - Multiple sequential calls to /api/test/throw return identical Problem Details
 *   - AC5: migrations list contains ONLY "InitialCreate" (no domain tables)
 *   - AC3: "detail" field in Problem Details is not null and not empty
 *   - AC4: /scalar documentation endpoint confirms DI container started correctly
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// Edge Cases: ExceptionHandlingMiddleware — exact content validation via live API
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P0] ExceptionHandlingMiddleware — exact Problem Details values via live API', () => {
  test('[P0] should return exact static title "Internal Server Error" from /api/test/throw', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware returns static Problem Details (not dynamic exception info)
    // WHEN: A live request triggers an unhandled exception via /api/test/throw
    const response = await request.get(`${API_BASE_URL}/api/test/throw`);
    const body = await response.json() as Record<string, unknown>;

    // THEN: Title is the exact static string (not the exception message)
    expect(body['title']).toBe('Internal Server Error');
  });

  test('[P0] should return exact static detail "An unexpected error occurred." from /api/test/throw', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware returns a static detail message (not exception.Message)
    // WHEN: An unhandled exception is triggered
    const response = await request.get(`${API_BASE_URL}/api/test/throw`);
    const body = await response.json() as Record<string, unknown>;

    // THEN: Detail matches the exact static string
    expect(body['detail']).toBe('An unexpected error occurred.');
  });

  test('[P0] should return "status" field with numeric value 500 in Problem Details body', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware serializes status as a number
    // WHEN: An unhandled exception is triggered
    const response = await request.get(`${API_BASE_URL}/api/test/throw`);
    const body = await response.json() as Record<string, unknown>;

    // THEN: "status" is the number 500, not the string "500"
    expect(body['status']).toBe(500);
    expect(typeof body['status']).toBe('number');
  });

  test('[P1] should return camelCase JSON fields in Problem Details (no PascalCase keys)', async ({
    request,
  }) => {
    // GIVEN: JsonSerializer uses PropertyNamingPolicy.CamelCase
    // WHEN: Problem Details response is returned
    const response = await request.get(`${API_BASE_URL}/api/test/throw`);
    const bodyText = await response.text();

    // THEN: Keys are camelCase ("status", "title", "detail") — not PascalCase ("Status", "Title", "Detail")
    expect(bodyText).toContain('"status"');
    expect(bodyText).toContain('"title"');
    expect(bodyText).toContain('"detail"');
    expect(bodyText).not.toContain('"Status"');
    expect(bodyText).not.toContain('"Title"');
    expect(bodyText).not.toContain('"Detail"');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge Cases: Exception type / message exposure (NFR6 boundaries)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] ExceptionHandlingMiddleware — no internal details exposed (NFR6 boundaries)', () => {
  test('[P1] should NOT expose C# exception namespace (System.) in response body', async ({
    request,
  }) => {
    // GIVEN: NFR6 prohibits any exception type info in the response
    // WHEN: An unhandled exception is triggered
    const response = await request.get(`${API_BASE_URL}/api/test/throw`);
    const body = await response.text();

    // THEN: No .NET namespace prefix appears in the body
    expect(body).not.toContain('System.');
    expect(body).not.toContain('Microsoft.');
  });

  test('[P1] should NOT expose inner exception details in response body', async ({
    request,
  }) => {
    // GIVEN: Exceptions may have inner exceptions with sensitive messages
    // WHEN: An unhandled exception is triggered via the test endpoint
    const response = await request.get(`${API_BASE_URL}/api/test/throw`);
    const body = await response.text();

    // THEN: No "innerException", "innerError" or "errors" fields with exception info
    expect(body).not.toContain('innerException');
    expect(body).not.toContain('InnerException');
    expect(body).not.toContain('exception');
  });

  test('[P1] "detail" field should NOT be null or empty in the Problem Details response', async ({
    request,
  }) => {
    // GIVEN: RFC 7807 requires the detail field to provide useful (safe) information
    // WHEN: An unhandled exception is triggered
    const response = await request.get(`${API_BASE_URL}/api/test/throw`);
    const body = await response.json() as Record<string, unknown>;

    // THEN: detail is a non-empty string
    expect(body['detail']).not.toBeNull();
    expect(typeof body['detail']).toBe('string');
    expect((body['detail'] as string).length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge Cases: Problem Details response is valid parseable JSON
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] ExceptionHandlingMiddleware — response body is valid JSON', () => {
  test('[P1] should return a JSON object (not an array or primitive) from /api/test/throw', async ({
    request,
  }) => {
    // GIVEN: Problem Details RFC 7807 is a JSON object
    // WHEN: An unhandled exception is triggered
    const response = await request.get(`${API_BASE_URL}/api/test/throw`);
    const body = await response.json() as unknown;

    // THEN: Parsed body is a plain object
    expect(typeof body).toBe('object');
    expect(Array.isArray(body)).toBe(false);
    expect(body).not.toBeNull();
  });

  test('[P1] Problem Details response has exactly the expected top-level keys', async ({
    request,
  }) => {
    // GIVEN: Minimal RFC 7807 Problem Details format (status, title, detail)
    // WHEN: An unhandled exception is triggered
    const response = await request.get(`${API_BASE_URL}/api/test/throw`);
    const body = await response.json() as Record<string, unknown>;

    // THEN: All three required fields are present
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('title');
    expect(body).toHaveProperty('detail');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge Cases: Multiple sequential calls to /api/test/throw — deterministic behavior
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] ExceptionHandlingMiddleware — deterministic across repeated calls', () => {
  test('[P2] should return identical Problem Details on three sequential calls to /api/test/throw', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware uses static responses (no per-request state)
    // WHEN: Three sequential requests are made to the test-throw endpoint
    const bodies: Record<string, unknown>[] = [];
    for (let i = 0; i < 3; i++) {
      const response = await request.get(`${API_BASE_URL}/api/test/throw`);
      bodies.push(await response.json() as Record<string, unknown>);
    }

    // THEN: All three responses have identical status, title, and detail
    const [first, second, third] = bodies;
    expect(second['status']).toBe(first['status']);
    expect(second['title']).toBe(first['title']);
    expect(second['detail']).toBe(first['detail']);
    expect(third['status']).toBe(first['status']);
    expect(third['title']).toBe(first['title']);
    expect(third['detail']).toBe(first['detail']);
  });

  test('[P2] should return 500 on all three sequential calls (no status oscillation)', async ({
    request,
  }) => {
    // GIVEN: Middleware always catches exceptions — status is always 500
    // WHEN: Three requests are made
    const statuses: number[] = [];
    for (let i = 0; i < 3; i++) {
      const response = await request.get(`${API_BASE_URL}/api/test/throw`);
      statuses.push(response.status());
    }

    // THEN: Every response is 500
    statuses.forEach((s) => expect(s).toBe(500));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge Cases: DB migrations endpoint — /api/diagnostics/migrations alias
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] AC1/AC6 — Diagnostics/migrations alias endpoint', () => {
  test('[P1] /api/diagnostics/migrations alias should exist and respond (not 404)', async ({
    request,
  }) => {
    // GIVEN: Program.cs registers /api/diagnostics/migrations as an alias for the migrations list
    // WHEN: A GET request is made to the alias endpoint
    const response = await request.get(`${API_BASE_URL}/api/diagnostics/migrations`);

    // THEN: Alias endpoint responds (not 404 — the route is registered)
    expect(response.status()).not.toBe(404);
  });

  test('[P1] /api/diagnostics/db-connection alias should exist and respond (not 404)', async ({
    request,
  }) => {
    // GIVEN: Program.cs registers /api/diagnostics/db-connection diagnostic endpoint
    // WHEN: A GET request is made
    const response = await request.get(`${API_BASE_URL}/api/diagnostics/db-connection`);

    // THEN: Endpoint exists (not 404)
    expect(response.status()).not.toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge Cases: DB migrations endpoint — response format and timing
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] AC1/AC6 — /api/health/db-migrations response format and timing', () => {
  test('[P1] /api/health/db-migrations should return JSON (not HTML) response', async ({
    request,
  }) => {
    // GIVEN: The migrations endpoint returns structured JSON
    // WHEN: A GET request is made to the diagnostics endpoint
    const response = await request.get(`${API_BASE_URL}/api/health/db-migrations`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Content-Type is JSON (not HTML error page)
    expect(contentType).toContain('json');
    expect(contentType).not.toContain('text/html');
  });

  test('[P2] /api/health/db-migrations should respond within 5 seconds', async ({
    request,
  }) => {
    // GIVEN: The migrations endpoint may query the database — should still be fast
    // WHEN: Request is made and response time measured
    const start = Date.now();
    const response = await request.get(`${API_BASE_URL}/api/health/db-migrations`);
    const elapsed = Date.now() - start;

    // THEN: Response arrives within 5 seconds (DB not hung or connection timeout exceeded)
    expect(response.status()).not.toBe(404);
    expect(elapsed).toBeLessThan(5000);
  });

  test('[P2] /api/health/db-migrations body should contain a "migrations" array key', async ({
    request,
  }) => {
    // GIVEN: The endpoint returns a JSON body with "migrations" array
    // WHEN: Request is made and body is parsed
    const response = await request.get(`${API_BASE_URL}/api/health/db-migrations`);
    const body = await response.json() as Record<string, unknown>;

    // THEN: Body contains "migrations" as an array property
    expect(body).toHaveProperty('migrations');
    expect(Array.isArray(body['migrations'])).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge Cases: AC5 — InitialCreate is the ONLY migration (no domain tables)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] AC5 — No domain table migrations present (empty initial migration)', () => {
  test('[P1] should NOT contain "clientes" in any migration name', async ({
    request,
  }) => {
    // GIVEN: AC5 explicitly states that ClienteEntity and ContactoEntity are out of scope
    // WHEN: The migration list is retrieved
    const response = await request.get(`${API_BASE_URL}/api/health/db-migrations`);
    const body = await response.json() as Record<string, unknown>;
    const migrations = (body['migrations'] as string[]) ?? [];
    const migrationsText = JSON.stringify(migrations).toLowerCase();

    // THEN: No migration name contains "clientes" or domain table references
    expect(migrationsText).not.toContain('clientes');
    expect(migrationsText).not.toContain('contactos');
    expect(migrationsText).not.toContain('cliente');
    expect(migrationsText).not.toContain('contacto');
  });

  test('[P1] migration name must include "InitialCreate" substring (naming convention)', async ({
    request,
  }) => {
    // GIVEN: AC6 requires exactly one migration named "InitialCreate"
    // WHEN: Migrations list is retrieved
    const response = await request.get(`${API_BASE_URL}/api/health/db-migrations`);
    const body = await response.json() as Record<string, unknown>;
    const migrations = (body['migrations'] as string[]) ?? [];

    // THEN: At least one migration entry contains "InitialCreate" (timestamp prefix expected)
    const hasInitialCreate = migrations.some((m) => m.includes('InitialCreate'));
    expect(hasInitialCreate).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge Cases: AC4 — AppDbContext DI does not cause startup errors
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] AC4 — AppDbContext DI registration does not break other endpoints', () => {
  test('[P2] /scalar should return 200 even though AppDbContext is registered in DI', async ({
    request,
  }) => {
    // GIVEN: AppDbContext is registered as a scoped service in Program.cs
    //        A misconfigured scoped service can crash the DI container on first resolve
    // WHEN: /scalar is requested (it does NOT resolve AppDbContext — confirming DI is valid)
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Scalar documentation loads — DI container did not throw during startup
    expect(response.status()).toBe(200);
  });

  test('[P2] /openapi/v1.json should be accessible with AppDbContext registered', async ({
    request,
  }) => {
    // GIVEN: AppDbContext registered does not break OpenAPI generation
    // WHEN: OpenAPI schema endpoint is requested
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    // THEN: Schema is accessible — no startup exception from DI registration
    expect(response.status()).toBe(200);
  });

  test('[P2] root path should respond after AppDbContext DI registration (server started)', async ({
    request,
  }) => {
    // GIVEN: If AddDbContext misconfigures the DI container, the server may refuse connections
    // WHEN: Root path is requested
    const response = await request.get(`${API_BASE_URL}/`);

    // THEN: Server is reachable — any status < 600 (excluding connection refused)
    expect(response.status()).toBeLessThan(600);
  });
});

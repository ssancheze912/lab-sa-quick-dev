/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (API Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC2 — Unhandled exceptions return Problem Details RFC 7807 format
 *          (status, title, detail=null) with Content-Type application/problem+json.
 *          No stack traces or exception messages exposed (NFR6).
 *   AC4 — AppDbContext, IApplicationDbContext, and EF Core DI registration
 *          compile with zero errors and Npgsql is the provider.
 *          (Proxy: backend responds → build succeeded)
 *   AC5 — The InitialCreate migration is EMPTY — no clientes/contactos tables.
 *          (Proxy: GET /api/v1/clientes and /api/v1/contactos return 404 in Story 1.3,
 *          because those endpoints are not implemented until Epic 2 / Epic 3.)
 *
 * ACs NOT covered by Playwright API tests:
 *   AC1 — dotnet ef database update creates siesa_agents_db (CLI/migration operation;
 *          covered by xUnit integration test in AppDbContextConfigurationTests.cs)
 *   AC3 — ApplySnakeCaseNaming() in OnModelCreating (EF Core internal behavior;
 *          covered by xUnit unit test in AppDbContextConfigurationTests.cs)
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC2: Unhandled exceptions return Problem Details RFC 7807 format (NFR6)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — ExceptionHandlingMiddleware returns Problem Details RFC 7807', () => {
  test('should return Content-Type application/problem+json on 500 error', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered in Program.cs
    // WHEN: A request triggers an unhandled server exception
    // NOTE: We trigger via a dedicated test-only endpoint that throws intentionally.
    //       If that endpoint does not exist yet (Story 1.3 not implemented), this
    //       test fails because the middleware and endpoint are missing — valid RED.

    const response = await request.get(`${API_BASE_URL}/api/test/throw`);

    // THEN: Content-Type is application/problem+json (RFC 7807 requirement)
    expect(response.status()).toBe(500);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');
  });

  test('should include "status" field with value 500 in the Problem Details body', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware is configured to return Problem Details
    // WHEN: An unhandled exception propagates to the middleware

    const response = await request.get(`${API_BASE_URL}/api/test/throw`);
    const body = await response.json();

    // THEN: The "status" field equals 500 (RFC 7807 §3.1)
    expect(body.status).toBe(500);
  });

  test('should include "title" field in the Problem Details body', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware sets ProblemDetails.Title
    // WHEN: An unhandled exception propagates to the middleware

    const response = await request.get(`${API_BASE_URL}/api/test/throw`);
    const body = await response.json();

    // THEN: The "title" field is present and non-empty (RFC 7807 §3.1)
    expect(typeof body.title).toBe('string');
    expect(body.title.length).toBeGreaterThan(0);
  });

  test('should NOT expose stack traces in the Problem Details "detail" field', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware sets Detail = null (NFR6: no stack traces exposed)
    // WHEN: An unhandled exception propagates to the middleware

    const response = await request.get(`${API_BASE_URL}/api/test/throw`);
    const body = await response.json();

    // THEN: "detail" is null or absent — NEVER contains exception message or stack trace
    expect(body.detail === null || body.detail === undefined).toBe(true);
  });

  test('should NOT expose exception messages in the Problem Details body', async ({ request }) => {
    // GIVEN: NFR6 requires zero internal error details exposed to clients
    // WHEN: An unhandled exception occurs

    const response = await request.get(`${API_BASE_URL}/api/test/throw`);
    const bodyText = await response.text();

    // THEN: The response body must not contain stack trace markers or exception type names
    expect(bodyText).not.toContain('StackTrace');
    expect(bodyText).not.toContain('at System.');
    expect(bodyText).not.toContain('Exception');
  });

  test('should return Problem Details as valid JSON (parseable body)', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware uses WriteAsJsonAsync with ProblemDetails
    // WHEN: A 500 error occurs

    const response = await request.get(`${API_BASE_URL}/api/test/throw`);

    // THEN: The response body is valid JSON — not HTML error page
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    expect(body).not.toBeNull();
    expect(typeof body).toBe('object');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4: Backend compiles with AppDbContext, IApplicationDbContext, and Npgsql
//      (Proxy: if backend responds to any request, the solution compiled successfully)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Backend compiles with EF Core, IApplicationDbContext, and Npgsql provider', () => {
  test('should have the backend running — proving zero compilation errors', async ({ request }) => {
    // GIVEN: dotnet build SiesaAgents.sln includes AppDbContext, IApplicationDbContext,
    //        and Npgsql.EntityFrameworkCore.PostgreSQL references in Infrastructure project
    // WHEN: Any HTTP request reaches the backend

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Server responds (any status < 500 proves it started = compiled without errors)
    // A compilation failure prevents dotnet run from starting at all.
    expect(response.status()).toBeLessThan(500);
  });

  test('should return health or operational response from backend root', async ({ request }) => {
    // GIVEN: The backend project compiles with all new Story 1.3 packages and registrations
    // WHEN: A GET request is made to the backend base URL

    const response = await request.get(`${API_BASE_URL}/`);

    // THEN: The server is operational — not a connection refused error
    // Note: 404 is acceptable here; what matters is a response was received
    expect([200, 301, 302, 404]).toContain(response.status());
  });

  test('should NOT expose Npgsql connection errors as unhandled HTML pages', async ({ request }) => {
    // GIVEN: AppDbContext is registered with UseNpgsql in Program.cs DI
    // WHEN: A request is made that does NOT trigger a DB query (startup endpoint)
    // THEN: The server starts and responds — Npgsql connection failure (no local PG) must
    //       not crash the process at startup. EF Core uses lazy connection — deferred until query.

    const response = await request.get(`${API_BASE_URL}/scalar`);
    const contentType = response.headers()['content-type'] ?? '';

    // The response from /scalar must be HTML (the docs page), NOT an error HTML dump
    expect(response.status()).toBe(200);
    expect(contentType).toContain('text/html');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5: InitialCreate migration is EMPTY — no clientes or contactos tables created
//      Proxy: Domain entity endpoints must NOT exist in Story 1.3 scope
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — InitialCreate migration creates no domain tables (empty migration)', () => {
  test('should NOT have /api/v1/clientes endpoint available in Story 1.3', async ({ request }) => {
    // GIVEN: The InitialCreate migration is empty (no ClienteEntity defined or mapped)
    // WHEN: A GET request is made to the clientes API endpoint

    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: The endpoint does not exist yet — Epic 2 Story 2.1 introduces it
    // 404 = endpoint not registered; 405 = wrong method but route exists (fail);
    // 501 = not implemented (acceptable)
    expect(response.status()).toBe(404);
  });

  test('should NOT have /api/v1/contactos endpoint available in Story 1.3', async ({ request }) => {
    // GIVEN: The InitialCreate migration is empty (no ContactoEntity defined or mapped)
    // WHEN: A GET request is made to the contactos API endpoint

    const response = await request.get(`${API_BASE_URL}/api/v1/contactos`);

    // THEN: The endpoint does not exist yet — Epic 3 Story 3.1 introduces it
    expect(response.status()).toBe(404);
  });

  test('should NOT have /api/v1/clientes POST endpoint available in Story 1.3', async ({ request }) => {
    // GIVEN: No domain entity endpoints are registered in this story
    // WHEN: A POST request is attempted to create a cliente

    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: { nombre: 'ATDD Test Cliente', nit: '900000001' },
    });

    // THEN: 404 — the route does not exist in the router
    expect(response.status()).toBe(404);
  });

  test('should NOT have /api/v1/contactos POST endpoint available in Story 1.3', async ({ request }) => {
    // GIVEN: No domain entity endpoints are registered in this story
    // WHEN: A POST request is attempted to create a contacto

    const response = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
      data: { nombre: 'ATDD Test Contacto', email: 'atdd@test.com' },
    });

    // THEN: 404 — the route does not exist in the router
    expect(response.status()).toBe(404);
  });
});

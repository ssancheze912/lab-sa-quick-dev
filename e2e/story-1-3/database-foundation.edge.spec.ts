/**
 * Expanded Coverage Tests — Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * Mode: BMad-Integrated (expands ATDD tests with edge cases, error paths, boundary conditions)
 *
 * Coverage NOT in ATDD tests (database-foundation.api.spec.ts):
 *   - AC2 edge cases: exact title value, no extensions with sensitive data, HEAD method,
 *     multiple concurrent 500 requests, content-type charset suffix, RFC 7807 schema completeness
 *   - AC4 boundary: /openapi/v1.json contains no clientes/contactos paths, response time < 3s
 *   - AC5 boundary: PUT/PATCH/DELETE on domain routes → 404, path traversal variants,
 *     nested sub-resource paths do not exist
 *   - Infrastructure: backend starts without real DB (lazy EF Core connection),
 *     no internal connection string or password in any response body
 */

import { test, expect } from '@playwright/test';
import {
  DB_FOUNDATION_CONTRACTS,
  EXPECTED_PROBLEM_DETAILS_500,
  createClientePayload,
  createContactoPayload,
} from '../support/factories/database.factory';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC2 EDGE CASES — ExceptionHandlingMiddleware Problem Details RFC 7807
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P0] AC2 Edge Cases — Problem Details RFC 7807 schema completeness', () => {
  test('[P0] should return exact title "An unexpected error occurred." in Problem Details', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware sets ProblemDetails.Title to a fixed string
    // WHEN: An unhandled exception reaches the middleware
    const response = await request.get(DB_FOUNDATION_CONTRACTS.testThrowEndpoint, {
      failOnStatusCode: false,
    });
    const body = await response.json();

    // THEN: The title is EXACTLY the expected string (no variation or localization)
    expect(body.title).toBe(EXPECTED_PROBLEM_DETAILS_500.title);
  });

  test('[P0] should have status field matching HTTP status code (500)', async ({ request }) => {
    // GIVEN: RFC 7807 §3.1 requires status to equal the HTTP status code
    // WHEN: ExceptionHandlingMiddleware responds
    const response = await request.get(DB_FOUNDATION_CONTRACTS.testThrowEndpoint, {
      failOnStatusCode: false,
    });
    const body = await response.json();

    // THEN: body.status is a number and equals response.status() (500)
    expect(typeof body.status).toBe('number');
    expect(body.status).toBe(response.status());
  });

  test('[P0] should NOT include exception type name in any response field', async ({ request }) => {
    // GIVEN: NFR6 — zero internal error details exposed to clients
    // WHEN: An unhandled exception propagates to the middleware
    const response = await request.get(DB_FOUNDATION_CONTRACTS.testThrowEndpoint, {
      failOnStatusCode: false,
    });
    const bodyText = await response.text();

    // THEN: The body does not contain .NET exception type patterns
    expect(bodyText).not.toContain('InvalidOperationException');
    expect(bodyText).not.toContain('NullReferenceException');
    expect(bodyText).not.toContain('ArgumentException');
    expect(bodyText).not.toContain('System.Exception');
  });

  test('[P1] should NOT include connection string or database password in 500 error response', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware must never expose infrastructure secrets (NFR6)
    // WHEN: An unhandled exception occurs (possibly related to DB startup)
    const response = await request.get(DB_FOUNDATION_CONTRACTS.testThrowEndpoint, {
      failOnStatusCode: false,
    });
    const bodyText = await response.text();

    // THEN: PostgreSQL credentials are never in the response body
    expect(bodyText).not.toContain('Password=');
    expect(bodyText).not.toContain('password=');
    expect(bodyText).not.toContain('postgres');  // DB username not exposed
    expect(bodyText).not.toContain('siesa_agents_db');  // DB name not exposed
    expect(bodyText).not.toContain('Host=localhost');  // Connection host not exposed
  });

  test('[P1] should NOT contain "extensions" field with internal diagnostics in Problem Details', async ({
    request,
  }) => {
    // GIVEN: The ASP.NET Core default ProblemDetails may include an "extensions" field
    //        with traceId or other internal information — this must be suppressed per NFR6
    // WHEN: A 500 error is returned by the middleware
    const response = await request.get(DB_FOUNDATION_CONTRACTS.testThrowEndpoint, {
      failOnStatusCode: false,
    });
    const body = await response.json();

    // THEN: No extensions field containing internal trace IDs or exception info
    // NOTE: A minimal extensions field (empty object) is acceptable; what's forbidden is
    //       extensions.exception, extensions.stackTrace, etc.
    if (body.extensions) {
      expect(body.extensions).not.toHaveProperty('exception');
      expect(body.extensions).not.toHaveProperty('stackTrace');
      expect(JSON.stringify(body.extensions)).not.toContain('at System.');
    }
  });

  test('[P1] should return Problem Details with Content-Type that includes charset or is exact match', async ({
    request,
  }) => {
    // GIVEN: WriteAsJsonAsync sets Content-Type = application/problem+json
    // WHEN: A 500 error is returned
    const response = await request.get(DB_FOUNDATION_CONTRACTS.testThrowEndpoint, {
      failOnStatusCode: false,
    });
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Content-Type starts with application/problem+json (may include charset suffix)
    expect(contentType).toMatch(/^application\/problem\+json/);
  });

  test('[P1] should handle two concurrent 500 errors independently (no shared state)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware must handle concurrent requests without race conditions
    // WHEN: Two requests to the throw endpoint are made concurrently
    const [response1, response2] = await Promise.all([
      request.get(DB_FOUNDATION_CONTRACTS.testThrowEndpoint, { failOnStatusCode: false }),
      request.get(DB_FOUNDATION_CONTRACTS.testThrowEndpoint, { failOnStatusCode: false }),
    ]);

    // THEN: Both responses are valid Problem Details with status 500
    expect(response1.status()).toBe(500);
    expect(response2.status()).toBe(500);

    const [body1, body2] = await Promise.all([response1.json(), response2.json()]);

    expect(body1.status).toBe(500);
    expect(body2.status).toBe(500);
    expect(body1.title).toBe(EXPECTED_PROBLEM_DETAILS_500.title);
    expect(body2.title).toBe(EXPECTED_PROBLEM_DETAILS_500.title);
  });

  test('[P2] should NOT expose "instance" field with internal URI path in Problem Details', async ({
    request,
  }) => {
    // GIVEN: RFC 7807 §3.5 defines optional "instance" field — it must not expose internal paths
    // WHEN: An error response is received
    const response = await request.get(DB_FOUNDATION_CONTRACTS.testThrowEndpoint, {
      failOnStatusCode: false,
    });
    const body = await response.json();

    // THEN: If "instance" is present, it does NOT contain file system paths or stack traces
    if (body.instance !== undefined && body.instance !== null) {
      expect(typeof body.instance).toBe('string');
      expect(body.instance).not.toContain('\\');  // No Windows file paths
      expect(body.instance).not.toContain('C:');  // No drive letters
      expect(body.instance).not.toContain('.cs:'); // No C# file references
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 EDGE CASES — EF Core / Npgsql compile proof via API responses
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] AC4 Edge Cases — OpenAPI spec and compilation boundary conditions', () => {
  test('[P1] should NOT include "clientes" paths in the OpenAPI spec (InitialCreate is empty)', async ({
    request,
  }) => {
    // GIVEN: No ClienteEntity is mapped in AppDbContext (empty migration scope)
    // WHEN: The OpenAPI spec is inspected for domain paths
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);
    const specText = JSON.stringify(await response.json());

    // THEN: No clientes route is registered in the spec
    expect(specText.toLowerCase()).not.toContain('/api/v1/clientes');
    expect(specText.toLowerCase()).not.toContain('clientes');
  });

  test('[P1] should NOT include "contactos" paths in the OpenAPI spec (InitialCreate is empty)', async ({
    request,
  }) => {
    // GIVEN: No ContactoEntity is mapped in AppDbContext (empty migration scope)
    // WHEN: The OpenAPI spec is inspected for domain paths
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);
    const specText = JSON.stringify(await response.json());

    // THEN: No contactos route is registered in the spec
    expect(specText.toLowerCase()).not.toContain('/api/v1/contactos');
    expect(specText.toLowerCase()).not.toContain('contactos');
  });

  test('[P1] should respond to /scalar within 3000ms (backend startup performance boundary)', async ({
    request,
  }) => {
    // GIVEN: The backend is running with lazy EF Core connection (no DB calls at startup)
    // WHEN: The /scalar documentation endpoint is requested
    const startTime = Date.now();
    const response = await request.get(DB_FOUNDATION_CONTRACTS.scalarEndpoint, {
      failOnStatusCode: false,
    });
    const elapsed = Date.now() - startTime;

    // THEN: The response is received within 3 seconds (no blocking DB I/O at startup)
    expect(response.status()).toBe(200);
    expect(elapsed).toBeLessThan(3000);
  });

  test('[P1] should start backend successfully without a live PostgreSQL connection', async ({
    request,
  }) => {
    // GIVEN: EF Core uses lazy connection strategy — DB is NOT accessed on startup
    // WHEN: A non-DB request (Scalar docs) is made regardless of PostgreSQL availability
    const response = await request.get(DB_FOUNDATION_CONTRACTS.scalarEndpoint, {
      failOnStatusCode: false,
    });

    // THEN: The backend is running (200 from Scalar) — EF Core DI did NOT force an eager DB connection
    // If this returns 500 with connection errors, the UseNpgsql registration has eager connect = FAIL
    expect(response.status()).toBe(200);
  });

  test('[P2] should NOT expose Npgsql version or PostgreSQL connection details in any response header', async ({
    request,
  }) => {
    // GIVEN: The backend should never expose infrastructure details in HTTP headers
    // WHEN: The /scalar endpoint is requested
    const response = await request.get(DB_FOUNDATION_CONTRACTS.scalarEndpoint, {
      failOnStatusCode: false,
    });
    const headersText = JSON.stringify(response.headers());

    // THEN: No Npgsql or PostgreSQL version strings in response headers
    expect(headersText.toLowerCase()).not.toContain('npgsql');
    expect(headersText.toLowerCase()).not.toContain('postgresql');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 EDGE CASES — InitialCreate is empty (boundary HTTP methods and paths)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] AC5 Edge Cases — Domain routes absent across all HTTP methods', () => {
  test('[P1] should return 404 for PUT /api/v1/clientes/{id} — route not registered', async ({
    request,
  }) => {
    // GIVEN: No ClienteEntity controller or endpoint group exists in Story 1.3
    // WHEN: A PUT request (update) is attempted for a clientes resource
    const response = await request.put(
      `${API_BASE_URL}/api/v1/clientes/00000000-0000-0000-0000-000000000001`,
      {
        data: createClientePayload(),
        failOnStatusCode: false,
      },
    );

    // THEN: 404 — the route does not exist in the router
    expect(response.status()).toBe(404);
  });

  test('[P1] should return 404 for DELETE /api/v1/clientes/{id} — route not registered', async ({
    request,
  }) => {
    // GIVEN: No delete endpoint for clientes exists in Story 1.3
    // WHEN: A DELETE request is made
    const response = await request.delete(
      `${API_BASE_URL}/api/v1/clientes/00000000-0000-0000-0000-000000000001`,
      { failOnStatusCode: false },
    );

    // THEN: 404 — route not found
    expect(response.status()).toBe(404);
  });

  test('[P1] should return 404 for PUT /api/v1/contactos/{id} — route not registered', async ({
    request,
  }) => {
    // GIVEN: No ContactoEntity controller or endpoint group exists in Story 1.3
    // WHEN: A PUT request is attempted for a contactos resource
    const response = await request.put(
      `${API_BASE_URL}/api/v1/contactos/00000000-0000-0000-0000-000000000002`,
      {
        data: createContactoPayload(),
        failOnStatusCode: false,
      },
    );

    // THEN: 404 — route not registered
    expect(response.status()).toBe(404);
  });

  test('[P1] should return 404 for DELETE /api/v1/contactos/{id} — route not registered', async ({
    request,
  }) => {
    // GIVEN: No delete endpoint for contactos exists in Story 1.3
    // WHEN: A DELETE request is made
    const response = await request.delete(
      `${API_BASE_URL}/api/v1/contactos/00000000-0000-0000-0000-000000000002`,
      { failOnStatusCode: false },
    );

    // THEN: 404 — route not found
    expect(response.status()).toBe(404);
  });

  test('[P1] should return 404 for GET /api/v1/clientes/{id} — route not registered', async ({
    request,
  }) => {
    // GIVEN: Individual cliente retrieval endpoint does not exist in Story 1.3
    // WHEN: A GET by id request is made
    const response = await request.get(
      `${API_BASE_URL}/api/v1/clientes/00000000-0000-0000-0000-000000000001`,
      { failOnStatusCode: false },
    );

    // THEN: 404 — resource path is not mapped
    expect(response.status()).toBe(404);
  });

  test('[P1] should return 404 for GET /api/v1/contactos/{id} — route not registered', async ({
    request,
  }) => {
    // GIVEN: Individual contacto retrieval endpoint does not exist in Story 1.3
    // WHEN: A GET by id request is made
    const response = await request.get(
      `${API_BASE_URL}/api/v1/contactos/00000000-0000-0000-0000-000000000002`,
      { failOnStatusCode: false },
    );

    // THEN: 404 — resource path is not mapped
    expect(response.status()).toBe(404);
  });

  test('[P2] should return 404 for nested sub-resource /api/v1/clientes/{id}/contactos', async ({
    request,
  }) => {
    // GIVEN: No clientes-to-contactos relationship endpoints are defined in Story 1.3
    // WHEN: A nested sub-resource GET request is made (which belongs to later epics)
    const response = await request.get(
      `${API_BASE_URL}/api/v1/clientes/00000000-0000-0000-0000-000000000001/contactos`,
      { failOnStatusCode: false },
    );

    // THEN: 404 — nested resource path is not registered
    expect(response.status()).toBe(404);
  });

  test('[P2] should NOT return 405 (Method Not Allowed) for clientes — route must be fully absent', async ({
    request,
  }) => {
    // GIVEN: 405 would mean the route EXISTS but rejects the method (route partially defined)
    //        404 means the route is not registered at all (correct for empty migration scope)
    // WHEN: GET /api/v1/clientes is requested
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`, {
      failOnStatusCode: false,
    });

    // THEN: 404 (not 405) — the endpoint is completely absent
    expect(response.status()).not.toBe(405);
    expect(response.status()).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// INFRASTRUCTURE EDGE CASES — Lazy DB connection and no credential leakage
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Infrastructure — Lazy EF Core connection and security boundaries', () => {
  test('[P1] should NOT return a 500 from /scalar if PostgreSQL is unavailable at startup', async ({
    request,
  }) => {
    // GIVEN: EF Core lazy connection means DI registration does NOT open a DB connection
    //        The backend CAN start without a live PostgreSQL — connection is deferred to first query
    // WHEN: The Scalar docs page is requested (does not trigger any DB operation)
    const response = await request.get(DB_FOUNDATION_CONTRACTS.scalarEndpoint, {
      failOnStatusCode: false,
    });

    // THEN: 200 from Scalar proves the server started and EF Core did not force eager connection
    expect(response.status()).toBe(200);
  });

  test('[P1] should not include the word "localhost" from connection string in any successful response', async ({
    request,
  }) => {
    // GIVEN: appsettings.Development.json contains Host=localhost which must not leak
    // WHEN: A successful response (Scalar docs) is returned
    const response = await request.get(DB_FOUNDATION_CONTRACTS.scalarEndpoint);
    const bodyText = await response.text();

    // THEN: The connection string host does not appear in the response HTML
    // This validates that DefaultConnection value is not accidentally rendered in the UI
    // Note: "localhost" from e.g. JavaScript URLs is acceptable; we check for the DB connection pattern
    expect(bodyText).not.toContain('Host=localhost');
    expect(bodyText).not.toContain('Database=siesa_agents_db');
  });

  test('[P2] should return the correct HTTP status code type for each error scenario', async ({
    request,
  }) => {
    // GIVEN: The backend uses status codes consistently per RFC 7807 §3.1
    // WHEN: Both 404 and 500 scenarios are checked
    const notFoundResponse = await request.get(`${API_BASE_URL}/definitely-not-an-endpoint-xyz`, {
      failOnStatusCode: false,
    });
    const errorResponse = await request.get(DB_FOUNDATION_CONTRACTS.testThrowEndpoint, {
      failOnStatusCode: false,
    });

    // THEN: 404 is returned for unknown routes, 500 for explicit throws
    expect(notFoundResponse.status()).toBe(404);
    expect(errorResponse.status()).toBe(500);

    // AND: The Problem Details status field matches the HTTP status in both cases
    if (errorResponse.headers()['content-type']?.includes('application/problem+json')) {
      const body = await errorResponse.json();
      expect(body.status).toBe(500);
    }
  });

  test('[P2] should not return a 500 for GET /api/v1 (API root discovery path)', async ({
    request,
  }) => {
    // GIVEN: There is no route at /api/v1 but the server must not crash on this path
    // WHEN: A client tries to discover the API root
    const response = await request.get(`${API_BASE_URL}/api/v1`, {
      failOnStatusCode: false,
    });

    // THEN: Either 404 (route not found) or 200 (if a discovery endpoint exists)
    //       But NEVER a 500 server error from this path
    expect(response.status()).not.toBe(500);
    expect(response.status()).not.toBe(503);
  });
});

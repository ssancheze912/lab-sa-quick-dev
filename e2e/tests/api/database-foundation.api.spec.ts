/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (API Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC2 — Unhandled exceptions → Problem Details RFC 7807 (status, title, detail), no stack trace (NFR6)
 *   AC3 — Domain exceptions (NotFoundException 404, ConflictException 409) → correct HTTP status + Problem Details
 *   AC6 — GET /scalar loads; app.UseSwagger() is NOT registered in Program.cs
 *
 * Notes:
 *   AC1 (database created by dotnet ef) and AC5 (empty migration) are infrastructure-level criteria
 *   verified by backend xUnit tests in SiesaAgents.UnitTests/Infrastructure/.
 *   AC4 (ApplySnakeCaseNaming) is verified by AppDbContextTests.cs (EF Core model inspection).
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC6: Scalar API docs load at /scalar — UseSwagger() must NOT be registered
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Scalar API documentation (UseSwagger forbidden)', () => {
  test('should serve Scalar API documentation at /scalar with HTTP 200', async ({ request }) => {
    // GIVEN: The backend is running and MapScalarApiReference() is registered in Program.cs
    // WHEN: A GET request is made to /scalar

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: The Scalar documentation page loads successfully (HTTP 200)
    expect(response.status()).toBe(200);
  });

  test('should return HTML content type from /scalar endpoint', async ({ request }) => {
    // GIVEN: Scalar.AspNetCore serves an HTML SPA for the documentation UI
    // WHEN: A GET request is made to /scalar

    const response = await request.get(`${API_BASE_URL}/scalar`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: The response Content-Type is text/html (Scalar serves an HTML page)
    expect(contentType).toContain('text/html');
  });

  test('should NOT have /swagger endpoint registered (Swashbuckle is forbidden)', async ({ request }) => {
    // GIVEN: The architecture mandates Scalar ONLY — app.UseSwagger() must NOT be in Program.cs
    // WHEN: A GET request is made to the default Swagger UI endpoint

    const response = await request.get(`${API_BASE_URL}/swagger`);

    // THEN: The /swagger endpoint does NOT exist (404) — Swashbuckle is not registered
    expect(response.status()).toBe(404);
  });

  test('should NOT have /swagger/v1/swagger.json OpenAPI spec endpoint', async ({ request }) => {
    // GIVEN: Swashbuckle is explicitly forbidden — no swagger.json should be generated
    // WHEN: A GET request is made to the default Swagger JSON spec path

    const response = await request.get(`${API_BASE_URL}/swagger/v1/swagger.json`);

    // THEN: The OpenAPI spec endpoint does NOT exist (404) — Swashbuckle is not registered
    expect(response.status()).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2: Unhandled exception → Problem Details RFC 7807, no stack trace exposed
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — ExceptionHandlingMiddleware: Problem Details RFC 7807 for unhandled errors', () => {
  test('should return application/problem+json Content-Type for error responses', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered in Program.cs before routing
    // WHEN: A request is made to a non-existent endpoint (triggers the middleware error path)

    const response = await request.get(`${API_BASE_URL}/api/nonexistent-atdd-trigger-1`);

    // THEN: Response Content-Type is application/problem+json per RFC 7807
    // NOTE: If middleware is missing, ASP.NET returns text/html or text/plain for 404
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');
  });

  test('should return Problem Details body with status field for error responses', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware processes all unhandled errors
    // WHEN: A request produces an error response

    const response = await request.get(`${API_BASE_URL}/api/nonexistent-atdd-trigger-2`);
    const body = await response.json();

    // THEN: Response body has RFC 7807 `status` field
    expect(body).toHaveProperty('status');
    expect(typeof body.status).toBe('number');
  });

  test('should return Problem Details body with title field for error responses', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware processes all unhandled errors (NFR6 compliance)
    // WHEN: A request produces an error response

    const response = await request.get(`${API_BASE_URL}/api/nonexistent-atdd-trigger-3`);
    const body = await response.json();

    // THEN: Response body has RFC 7807 `title` field (non-empty string)
    expect(body).toHaveProperty('title');
    expect(typeof body.title).toBe('string');
    expect(body.title.length).toBeGreaterThan(0);
  });

  test('should NOT expose stack trace in 500 error response body (NFR6)', async ({ request }) => {
    // GIVEN: An endpoint that triggers an unhandled 500 error
    // WHEN: The error is processed by ExceptionHandlingMiddleware
    // NOTE: We use the ATDD test probe endpoint — DEV must implement a test-only 500 trigger
    // or this test validates via the middleware behavior on any 500-class error

    // Trigger via an invalid operation (e.g., malformed request to existing endpoint)
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: null,
      headers: { 'Content-Type': 'application/json' },
    });

    // THEN: Even if this is a 400 or 500, the body must NOT contain stack traces
    const bodyText = await response.text();
    expect(bodyText).not.toContain('at SiesaAgents');
    expect(bodyText).not.toContain('StackTrace');
    expect(bodyText).not.toContain('Microsoft.AspNetCore');
    expect(bodyText).not.toContain('System.Exception');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3: Domain exceptions → correct HTTP status codes (not 500)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — ExceptionHandlingMiddleware: Domain exception HTTP status code mapping', () => {
  test('should return 404 for NotFoundException (not 500 Internal Server Error)', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware maps NotFoundException to 404
    // WHEN: A GET request targets a resource that does not exist
    // Using a UUID-format ID that cannot exist to trigger NotFoundException

    const nonExistentId = '00000000-0000-0000-0000-000000000001';
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${nonExistentId}`);

    // THEN: Response is 404 Not Found — NotFoundException was caught and mapped correctly
    // If middleware is missing, this would be 500 or a raw exception HTML page
    expect(response.status()).toBe(404);
  });

  test('should return application/problem+json for 404 NotFoundException response', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware wraps NotFoundException in Problem Details
    // WHEN: A request triggers NotFoundException

    const nonExistentId = '00000000-0000-0000-0000-000000000002';
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${nonExistentId}`);

    // THEN: Content-Type is application/problem+json (not text/html or text/plain)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');
  });

  test('should return 409 for ConflictException when creating duplicate resource', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware maps ConflictException to 409
    // Setup: Create a cliente first to establish the duplicate scenario
    // WHEN: An attempt is made to create a resource with a duplicate unique constraint (NIT)

    const duplicateData = {
      nombre: 'ATDD Test Cliente',
      nit: '900-ATDD-CONFLICT-001',
      telefono: '3001234567',
      ciudad: 'Bogotá',
    };

    // First creation (may succeed or fail depending on story implementation state)
    await request.post(`${API_BASE_URL}/api/v1/clientes`, { data: duplicateData });

    // Second creation with same NIT — should trigger ConflictException
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data: duplicateData });

    // THEN: Response is 409 Conflict — ConflictException was caught and mapped correctly
    expect(response.status()).toBe(409);
  });

  test('should return Problem Details body with correct status for NotFoundException', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware returns RFC 7807 compliant body for NotFoundException
    // WHEN: A GET request targets a non-existent resource

    const nonExistentId = '00000000-0000-0000-0000-000000000003';
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${nonExistentId}`);
    const body = await response.json();

    // THEN: Response body has RFC 7807 `status` field equal to 404
    expect(body).toHaveProperty('status', 404);
    expect(body).toHaveProperty('title');
  });

  test('should NOT return 500 for NotFoundException (domain exception must not leak as 500)', async ({ request }) => {
    // GIVEN: Without ExceptionHandlingMiddleware, NotFoundException would propagate as 500
    // WHEN: A request triggers NotFoundException
    // THEN: The response is specifically NOT 500

    const nonExistentId = '00000000-0000-0000-0000-000000000004';
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${nonExistentId}`);

    expect(response.status()).not.toBe(500);
  });
});

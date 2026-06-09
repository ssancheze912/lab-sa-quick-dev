/**
 * Story 1.3: Backend Database Foundation — Edge Cases & Boundary Conditions
 * Epic 1: Project Foundation & Application Shell
 *
 * Automation expansion — edge cases NOT covered by ATDD spec.
 * Covers: HTTP method coverage, concurrent requests, content negotiation,
 * response body boundary checks, diagnostic endpoint contracts, and
 * security boundary conditions.
 *
 * Test level: API Integration (Playwright request context against http://localhost:5000)
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// ExceptionHandlingMiddleware — HTTP verb coverage
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] ExceptionHandlingMiddleware — HTTP verb coverage', () => {
  test('[P1] should return 500 Problem Details for POST to error endpoint', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware wraps the full pipeline for all HTTP methods
    // WHEN: A POST request triggers the error endpoint

    const response = await request.post(`${API_BASE_URL}/api/v1/test-error`);

    // THEN: 500 with application/problem+json (not method-dependent behavior)
    expect(response.status()).toBe(500);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');
  });

  test('[P1] should return 500 Problem Details for PUT to error endpoint', async ({
    request,
  }) => {
    // GIVEN: PUT verb must also be caught by middleware
    // WHEN: A PUT request is made to the throwing endpoint

    const response = await request.put(`${API_BASE_URL}/api/v1/test-error`);

    // THEN: 500 with Problem Details (middleware intercepts all verbs)
    expect(response.status()).toBe(500);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');
  });

  test('[P1] should return 500 Problem Details for DELETE to error endpoint', async ({
    request,
  }) => {
    // GIVEN: DELETE verb must also be caught by middleware
    // WHEN: A DELETE request triggers an unhandled exception

    const response = await request.delete(`${API_BASE_URL}/api/v1/test-error`);

    // THEN: 500 with Problem Details
    expect(response.status()).toBe(500);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');
  });

  test('[P1] should return 500 Problem Details for PATCH to error endpoint', async ({
    request,
  }) => {
    // GIVEN: PATCH verb must also be caught by middleware
    // WHEN: A PATCH request triggers an unhandled exception

    const response = await request.patch(`${API_BASE_URL}/api/v1/test-error`);

    // THEN: 500 with Problem Details (middleware is HTTP-method agnostic)
    expect(response.status()).toBe(500);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ExceptionHandlingMiddleware — Content-Type boundary conditions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] ExceptionHandlingMiddleware — Content-Type boundary conditions', () => {
  test('[P1] Content-Type charset must be utf-8 (not absent or other encoding)', async ({
    request,
  }) => {
    // GIVEN: Middleware uses JsonSerializer.SerializeToUtf8Bytes — charset must be utf-8
    // WHEN: The error endpoint is triggered

    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Content-Type contains both application/problem+json and utf-8
    expect(contentType).toContain('application/problem+json');
    expect(contentType).toContain('utf-8');
  });

  test('[P1] Content-Type must NOT be application/json for error responses', async ({
    request,
  }) => {
    // GIVEN: WriteAsJsonAsync was replaced by SerializeToUtf8Bytes specifically
    // to prevent Content-Type being set to application/json
    // WHEN: An unhandled exception occurs

    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Content-Type is NOT application/json (must be application/problem+json)
    // Note: Contains check — application/problem+json also contains "json"
    // so we verify it contains the full "problem+json" discriminator
    expect(contentType).not.toBe('application/json');
    expect(contentType).toContain('problem+json');
  });

  test('[P1] Content-Type must NOT be text/html for error responses', async ({
    request,
  }) => {
    // GIVEN: The .NET developer exception page (HTML) must not be exposed
    // WHEN: An unhandled exception occurs

    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Content-Type is never text/html
    expect(contentType).not.toContain('text/html');
  });

  test('[P1] Content-Type must NOT be text/plain for error responses', async ({
    request,
  }) => {
    // GIVEN: Raw exception message as plain text must be blocked
    // WHEN: An unhandled exception occurs

    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Content-Type is never text/plain
    expect(contentType).not.toContain('text/plain');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ExceptionHandlingMiddleware — Problem Details JSON structure boundary
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] ExceptionHandlingMiddleware — Problem Details JSON structure', () => {
  test('[P1] Problem Details status field value must be exactly 500', async ({
    request,
  }) => {
    // GIVEN: Middleware sets Status = StatusCodes.Status500InternalServerError (500)
    // WHEN: The error endpoint is triggered and response is parsed

    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const body = await response.json() as Record<string, unknown>;

    // THEN: status field is the integer 500, not a string or other value
    expect(body['status']).toBe(500);
  });

  test('[P1] Problem Details title field must be a non-empty string', async ({
    request,
  }) => {
    // GIVEN: Middleware sets Title = "An unexpected error occurred."
    // WHEN: The error endpoint is triggered and response is parsed

    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const body = await response.json() as Record<string, unknown>;

    // THEN: title is a non-empty string — generic message, not exception type name
    expect(typeof body['title']).toBe('string');
    expect((body['title'] as string).length).toBeGreaterThan(0);
  });

  test('[P1] Problem Details title must NOT contain exception type names', async ({
    request,
  }) => {
    // GIVEN: Exception type fingerprinting must be prevented (security boundary)
    // WHEN: The error endpoint is triggered

    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const body = await response.json() as Record<string, unknown>;
    const title = String(body['title'] ?? '');

    // THEN: Exception class names do NOT appear in title
    expect(title).not.toContain('Exception');
    expect(title).not.toContain('InvalidOperation');
    expect(title).not.toContain('NullReference');
  });

  test('[P2] Problem Details detail field must be null or absent', async ({
    request,
  }) => {
    // GIVEN: Middleware sets Detail = null to prevent internal information leakage
    // WHEN: The error endpoint is triggered

    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const body = await response.json() as Record<string, unknown>;

    // THEN: detail is either absent from the JSON or explicitly null
    if (Object.prototype.hasOwnProperty.call(body, 'detail')) {
      expect(body['detail']).toBeNull();
    }
    // If absent, the assertion passes — no detail means no leakage
  });

  test('[P1] Problem Details response must NOT contain "extensions" with exception data', async ({
    request,
  }) => {
    // GIVEN: ProblemDetails.Extensions must not be populated with exception info
    // WHEN: The error endpoint is triggered

    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const body = await response.text();

    // THEN: No exception-related extension properties are present
    expect(body).not.toContain('"exceptionDetails"');
    expect(body).not.toContain('"traceId"');
    expect(body).not.toContain('"exceptionType"');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ExceptionHandlingMiddleware — Concurrent requests (thread safety)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] ExceptionHandlingMiddleware — Concurrent request isolation', () => {
  test('[P1] concurrent error requests must ALL return 500 with Problem Details', async ({
    request,
  }) => {
    // GIVEN: Multiple requests arriving simultaneously to the error endpoint
    // WHEN: 5 concurrent requests are sent

    const requests = Array.from({ length: 5 }, () =>
      request.get(`${API_BASE_URL}/api/v1/test-error`)
    );
    const responses = await Promise.all(requests);

    // THEN: Every response is 500 with application/problem+json — no cross-request contamination
    for (const response of responses) {
      expect(response.status()).toBe(500);
      const contentType = response.headers()['content-type'] ?? '';
      expect(contentType).toContain('application/problem+json');
    }
  });

  test('[P1] concurrent error requests must return independent, valid JSON bodies', async ({
    request,
  }) => {
    // GIVEN: Multiple concurrent error requests
    // WHEN: Bodies are read independently

    const requests = Array.from({ length: 5 }, () =>
      request.get(`${API_BASE_URL}/api/v1/test-error`)
    );
    const responses = await Promise.all(requests);

    // THEN: Each body is independently valid JSON with status=500
    for (const response of responses) {
      const body = await response.json() as Record<string, unknown>;
      expect(body['status']).toBe(500);
      expect(typeof body['title']).toBe('string');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Diagnostic endpoints — contract boundary conditions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Diagnostic endpoints — response contract', () => {
  test('[P1] /api/v1/db-status must return 200 with status:ok and dbContextType field', async ({
    request,
  }) => {
    // GIVEN: AppDbContext is registered via AddDbContext<AppDbContext> in Program.cs
    // WHEN: The db-status endpoint is called

    const response = await request.get(`${API_BASE_URL}/api/v1/db-status`);

    // THEN: 200 with JSON body containing status and dbContextType
    expect(response.status()).toBe(200);
    const body = await response.json() as Record<string, unknown>;
    expect(body['status']).toBe('ok');
    expect(typeof body['dbContextType']).toBe('string');
    expect((body['dbContextType'] as string).length).toBeGreaterThan(0);
  });

  test('[P1] /api/v1/db-status dbContextType must reference AppDbContext', async ({
    request,
  }) => {
    // GIVEN: AppDbContext is the registered DI service
    // WHEN: The diagnostic endpoint returns the context type name

    const response = await request.get(`${API_BASE_URL}/api/v1/db-status`);
    const body = await response.json() as Record<string, unknown>;

    // THEN: The dbContextType field mentions "AppDbContext"
    expect(body['dbContextType']).toContain('AppDbContext');
  });

  test('[P2] /api/v1/db-status must return Content-Type application/json', async ({
    request,
  }) => {
    // GIVEN: The db-status endpoint uses Results.Ok() which returns application/json
    // WHEN: The endpoint is called

    const response = await request.get(`${API_BASE_URL}/api/v1/db-status`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Content-Type is application/json (not problem+json — this is a success response)
    expect(contentType).toContain('application/json');
  });

  test('[P1] /api/v1/migrations-history must return 200 with migrations array', async ({
    request,
  }) => {
    // GIVEN: AppDbContext has at least one applied migration (InitialCreate)
    // WHEN: The migrations-history diagnostic endpoint is called

    const response = await request.get(`${API_BASE_URL}/api/v1/migrations-history`);

    // THEN: 200 with a JSON body containing a migrations array
    expect(response.status()).toBe(200);
    const body = await response.json() as Record<string, unknown>;
    expect(Array.isArray(body['migrations'])).toBe(true);
  });

  test('[P1] /api/v1/migrations-history must list InitialCreate migration', async ({
    request,
  }) => {
    // GIVEN: dotnet ef database update was executed and InitialCreate was applied
    // WHEN: The migrations list is requested

    const response = await request.get(`${API_BASE_URL}/api/v1/migrations-history`);
    const body = await response.json() as Record<string, unknown>;
    const migrations = body['migrations'] as string[];

    // THEN: The migrations array contains at least one entry with "InitialCreate" in the name
    const hasInitialCreate = migrations.some((m) => m.includes('InitialCreate'));
    expect(hasInitialCreate).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Scope boundary — no domain table endpoints
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Scope boundary — domain endpoints absent in Story 1.3', () => {
  test('[P1] /api/v1/clientes must return 404 — no domain tables created yet', async ({
    request,
  }) => {
    // GIVEN: Story 1.3 scope boundary: clientes table NOT created until Epic 2
    // WHEN: A GET request targets the clientes resource

    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: 404 — endpoint not mapped, table does not exist
    expect(response.status()).toBe(404);
  });

  test('[P1] /api/v1/contactos must return 404 — no domain tables created yet', async ({
    request,
  }) => {
    // GIVEN: Story 1.3 scope boundary: contactos table NOT created until Epic 3
    // WHEN: A GET request targets the contactos resource

    const response = await request.get(`${API_BASE_URL}/api/v1/contactos`);

    // THEN: 404 — endpoint not mapped, table does not exist
    expect(response.status()).toBe(404);
  });

  test('[P2] /api/v1/clientes/123 must return 404 — no sub-resource endpoints exist', async ({
    request,
  }) => {
    // GIVEN: No clientes routes are defined in this story
    // WHEN: A GET request targets a specific cliente by ID

    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/123`);

    // THEN: 404 — no routing match
    expect(response.status()).toBe(404);
  });

  test('[P2] /api/v1/contactos/456 must return 404 — no sub-resource endpoints exist', async ({
    request,
  }) => {
    // GIVEN: No contactos routes are defined in this story
    // WHEN: A GET request targets a specific contacto by ID

    const response = await request.get(`${API_BASE_URL}/api/v1/contactos/456`);

    // THEN: 404 — no routing match
    expect(response.status()).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// OpenAPI spec and Scalar — infrastructure validation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] OpenAPI and Scalar infrastructure — compilation proof', () => {
  test('[P2] /openapi/v1.json must NOT list clientes or contactos paths', async ({
    request,
  }) => {
    // GIVEN: OpenAPI spec is generated from registered endpoints only
    // WHEN: The OpenAPI spec is retrieved

    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);
    const body = await response.text();

    // THEN: The spec does NOT mention clientes or contactos paths (not defined yet)
    expect(body).not.toContain('"/api/v1/clientes"');
    expect(body).not.toContain('"/api/v1/contactos"');
  });

  test('[P2] /openapi/v1.json must list diagnostic endpoints defined in Program.cs', async ({
    request,
  }) => {
    // GIVEN: Diagnostic endpoints /api/v1/test-error, /api/v1/db-status are registered
    // WHEN: The OpenAPI spec is retrieved

    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);
    const body = await response.text();

    // THEN: The spec includes at least one of the diagnostic endpoints
    const hasAnyDiagnostic = body.includes('/api/v1/test-error')
      || body.includes('/api/v1/db-status')
      || body.includes('/api/v1/migrations-history');
    expect(hasAnyDiagnostic).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CORS + exception middleware order — security boundary
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Middleware order — ExceptionHandling before CORS', () => {
  test('[P1] error response includes Problem Details even when Origin header is present', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered BEFORE app.UseCors()
    // A request from the allowed frontend origin must still get Problem Details on error
    // WHEN: A request with an Origin header triggers the error endpoint

    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`, {
      headers: { Origin: 'http://localhost:5173' },
    });

    // THEN: Response is 500 with application/problem+json — CORS does not pre-empt middleware
    expect(response.status()).toBe(500);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');
  });

  test('[P1] error response body must NOT leak exception message even with Origin header', async ({
    request,
  }) => {
    // GIVEN: Cross-origin requests must also receive sanitized error responses
    // WHEN: A CORS-preflight-aware request triggers the error endpoint

    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`, {
      headers: { Origin: 'http://localhost:5173' },
    });
    const body = await response.text();

    // THEN: No raw exception message or stack trace in the response body
    expect(body).not.toContain('internal test');
    expect(body).not.toContain('at System.');
    expect(body).not.toContain('StackTrace');
  });
});

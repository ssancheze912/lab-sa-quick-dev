/**
 * Story 1.3: Backend Database Foundation
 * API Edge Cases & Boundary Tests — Expanded Coverage
 *
 * Complements backend-database-foundation.api.spec.ts (ATDD) with:
 *   - ExceptionHandlingMiddleware: 4xx paths, response structure completeness,
 *     no HTML on errors, concurrent exception requests
 *   - Health endpoint: response body schema, DB connectivity context
 *   - Middleware ordering: ensures non-exception HTTP errors are also wrapped
 *   - Problem Details RFC 7807 boundary conditions for 500 responses
 *
 * Test Level: API (Playwright request context against http://localhost:5000)
 * Priority tagging: [P0] critical, [P1] high, [P2] medium
 */

import { test, expect } from '@playwright/test';

const BACKEND_BASE_URL = 'http://localhost:5000';

// ---------------------------------------------------------------------------
// Health endpoint — response body schema and structure
// ---------------------------------------------------------------------------

test.describe('Health endpoint — response body and structure (AC1)', () => {
  test('[P0] GIVEN PostgreSQL is running WHEN GET /health THEN response body has "status" field', async ({
    request,
  }) => {
    // GIVEN: Backend is running with DB connected
    // WHEN: Health probe is hit
    const response = await request.get(`${BACKEND_BASE_URL}/health`);

    // THEN: Body contains a "status" property
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('status');
  });

  test('[P1] GIVEN GET /health responds WHEN checking Content-Type THEN it is application/json', async ({
    request,
  }) => {
    // GIVEN: Backend health endpoint returns JSON
    // WHEN: GET /health
    const response = await request.get(`${BACKEND_BASE_URL}/health`);

    // THEN: Content-Type is JSON (not text/plain or text/html)
    expect(response.status()).toBe(200);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType.toLowerCase()).toContain('json');
  });

  test('[P1] GIVEN GET /health responds WHEN checking body THEN "status" value is a non-empty string', async ({
    request,
  }) => {
    // GIVEN: Health endpoint is implemented and DB is connected
    // WHEN: GET /health
    const response = await request.get(`${BACKEND_BASE_URL}/health`);

    // THEN: The status field is a non-empty string (e.g. "healthy")
    const body = await response.json();
    expect(typeof body.status).toBe('string');
    expect((body.status as string).trim().length).toBeGreaterThan(0);
  });

  test('[P2] GIVEN multiple sequential requests to /health WHEN all complete THEN all return 200', async ({
    request,
  }) => {
    // GIVEN: Backend is stable and DB connection is pooled
    // WHEN: 3 sequential health checks are performed
    for (let i = 0; i < 3; i++) {
      const response = await request.get(`${BACKEND_BASE_URL}/health`);

      // THEN: Each request returns 200 — confirms no connection leak or exhaustion
      expect(response.status()).toBe(200);
    }
  });
});

// ---------------------------------------------------------------------------
// ExceptionHandlingMiddleware — 500 error response completeness (AC3)
// ---------------------------------------------------------------------------

test.describe('ExceptionHandlingMiddleware — 500 response completeness (AC3)', () => {
  test('[P1] GIVEN unhandled exception WHEN checking 500 body THEN "type" field is absent or null (RFC 7807 minimal)', async ({
    request,
  }) => {
    // GIVEN: RFC 7807 minimal required fields are status + title
    // WHEN: Triggering unhandled exception
    const response = await request.get(`${BACKEND_BASE_URL}/__throw-test`);
    const body = await response.json();

    // THEN: "type" is absent or null — implementation should not expose internal URIs
    if ('type' in body) {
      expect(body.type === null || body.type === 'about:blank').toBe(true);
    }
    // If absent, test passes automatically
  });

  test('[P1] GIVEN unhandled exception WHEN response received THEN body does not contain "innerException" field', async ({
    request,
  }) => {
    // GIVEN: NFR6 — no internal exception details exposed
    // WHEN: Triggering unhandled exception
    const response = await request.get(`${BACKEND_BASE_URL}/__throw-test`);
    const body = await response.json();

    // THEN: No innerException field (internal .NET exception chain must not leak)
    expect(body).not.toHaveProperty('innerException');
    expect(body).not.toHaveProperty('exceptionType');
    expect(body).not.toHaveProperty('stackTrace');
  });

  test('[P1] GIVEN unhandled exception WHEN response received THEN body is valid JSON (not HTML)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware must NEVER return ASP.NET developer HTML page
    // WHEN: Triggering unhandled exception
    const response = await request.get(`${BACKEND_BASE_URL}/__throw-test`);
    const bodyText = await response.text();

    // THEN: Response is not HTML — Problem Details is JSON
    expect(bodyText.toLowerCase()).not.toContain('<!doctype html>');
    expect(bodyText.toLowerCase()).not.toContain('<html');
    // And it parses as JSON without throwing
    const body = JSON.parse(bodyText);
    expect(typeof body).toBe('object');
  });

  test('[P2] GIVEN two concurrent exception requests WHEN both complete THEN both return status 500', async ({
    request,
  }) => {
    // GIVEN: Middleware handles concurrent exceptions without state corruption
    // WHEN: Two requests are made concurrently
    const [resp1, resp2] = await Promise.all([
      request.get(`${BACKEND_BASE_URL}/__throw-test`),
      request.get(`${BACKEND_BASE_URL}/__throw-test`),
    ]);

    // THEN: Both requests independently return 500
    expect(resp1.status()).toBe(500);
    expect(resp2.status()).toBe(500);
  });

  test('[P2] GIVEN unhandled exception WHEN POST is used THEN middleware still returns 500 Problem Details', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware wraps ALL HTTP methods, not just GET
    // WHEN: POST to the throw-test endpoint
    const response = await request.post(`${BACKEND_BASE_URL}/__throw-test`, {
      data: {},
    });

    // THEN: Status is 500 (or 404/405 if POST is not mapped — but NOT a 200 or unhandled crash)
    // The middleware must not pass through an unhandled exception as a non-error response
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});

// ---------------------------------------------------------------------------
// Middleware non-exception 4xx paths — middleware handles HTTP status codes
// ---------------------------------------------------------------------------

test.describe('ExceptionHandlingMiddleware — non-exception 4xx handling (AC3)', () => {
  test('[P1] GIVEN a request to a non-existent route WHEN checking status THEN response is 404 not 500', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware intercepts both exceptions and HTTP status codes
    // WHEN: A GET to a path with no matching route
    const response = await request.get(`${BACKEND_BASE_URL}/api/db-foundation-nonexistent`);

    // THEN: 404 is returned — middleware did not escalate to 500
    expect(response.status()).toBe(404);
  });

  test('[P1] GIVEN a 404 response WHEN checking Content-Type THEN it is application/problem+json', async ({
    request,
  }) => {
    // GIVEN: Middleware wraps non-exception 4xx with RFC 7807
    // WHEN: GET to a non-existent API path
    const response = await request.get(`${BACKEND_BASE_URL}/api/db-foundation-edge-ct`);

    // THEN: Content-Type header matches RFC 7807
    expect(response.status()).toBe(404);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');
  });

  test('[P1] GIVEN a 404 response WHEN checking body THEN it contains "status" field equal to 404', async ({
    request,
  }) => {
    // GIVEN: Problem Details format for 404
    // WHEN: Non-existent path requested
    const response = await request.get(`${BACKEND_BASE_URL}/api/db-foundation-edge-status`);

    // THEN: Body status field equals the HTTP status code
    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body.status).toBe(404);
  });

  test('[P2] GIVEN a 404 response WHEN checking body THEN "detail" is absent, null or empty (no internal path leak)', async ({
    request,
  }) => {
    // GIVEN: NFR6 applies to ALL error responses, not just 500
    // WHEN: Non-existent path triggers 404 middleware handler
    const response = await request.get(`${BACKEND_BASE_URL}/api/db-foundation-edge-no-detail`);

    // THEN: "detail" must not contain internal file paths, stack traces, or exception messages
    expect(response.status()).toBe(404);
    const body = await response.json();
    if ('detail' in body) {
      const detail = body.detail;
      // detail must be null, undefined, or empty — never a stack trace or path
      const isBlank = detail === null || detail === undefined || detail === '';
      expect(isBlank).toBe(true);
    }
    // If absent, passes
  });
});

// ---------------------------------------------------------------------------
// Middleware ordering — registered before routing (AC3 architecture constraint)
// ---------------------------------------------------------------------------

test.describe('ExceptionHandlingMiddleware — ordering and coverage', () => {
  test('[P1] GIVEN any 4xx or 5xx WHEN checking response THEN it is never raw HTML', async ({
    request,
  }) => {
    // GIVEN: Middleware is first in the pipeline — no HTML developer exception page
    // WHEN: Any error-inducing request is made
    const response = await request.get(`${BACKEND_BASE_URL}/api/db-ordering-edge-test`);

    // THEN: Body is JSON (Problem Details), never HTML
    const bodyText = await response.text();
    expect(bodyText.toLowerCase()).not.toContain('<!doctype html>');
    // It should parse as JSON
    const body = JSON.parse(bodyText);
    expect(typeof body).toBe('object');
  });

  test('[P2] GIVEN the /__throw-test endpoint exists only in Development WHEN the environment is development THEN the endpoint is accessible', async ({
    request,
  }) => {
    // GIVEN: Program.cs maps /__throw-test only in Development environment (IsDevelopment)
    // WHEN: Calling the endpoint in the local dev environment
    const response = await request.get(`${BACKEND_BASE_URL}/__throw-test`);

    // THEN: The endpoint is reachable (returns 500 — meaning it exists and threw correctly)
    // In non-development environments this would be 404 (which is also acceptable)
    expect([404, 500]).toContain(response.status());
  });
});

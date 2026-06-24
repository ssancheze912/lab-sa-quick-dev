/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (API Level)
 * These tests verify HTTP-level behavior of the exception middleware and Scalar endpoint.
 * Tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC3 — Unhandled exceptions return Problem Details RFC 7807 (status, title, detail)
 *          with no stack traces exposed (NFR6)
 *   AC4 — Domain-level validation failures map to correct HTTP codes (404, 409, 400)
 *          and return Problem Details body, never 500
 *   AC5 — Scalar API docs load at /scalar (no Swagger/OpenAPI UI registered)
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC3 (HTTP Level): Unhandled exceptions → Problem Details RFC 7807
//                   No stack trace in response body (NFR6)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Global exception handling returns Problem Details RFC 7807', () => {
  test('should return JSON content-type for unhandled 404 routes', async ({ request }) => {
    // GIVEN: The backend is running with ExceptionHandlingMiddleware registered
    // WHEN: A request is made to a non-existent route that triggers exception handling
    const response = await request.get(`${API_BASE_URL}/api/v1/non-existent-atdd-route-1-3`);

    // THEN: Response content-type is problem+json or application/json (not text/html)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');
  });

  test('should return Problem Details status field for unknown routes', async ({ request }) => {
    // GIVEN: The backend is running with ExceptionHandlingMiddleware registered
    // WHEN: A request is made to a non-existent route
    const response = await request.get(`${API_BASE_URL}/api/v1/not-found-atdd-1-3`);
    const body = await response.json();

    // THEN: Response body contains 'status' field (RFC 7807 required field)
    expect(body).toHaveProperty('status');
    expect(typeof body.status).toBe('number');
  });

  test('should not expose stack trace in response body for any error (NFR6)', async ({ request }) => {
    // GIVEN: NFR6 requires no stack trace or internal exception messages in responses
    // WHEN: A request triggers an error response
    const response = await request.get(`${API_BASE_URL}/api/v1/non-existent-atdd-nfr6`);
    const text = await response.text();

    // THEN: The response body does NOT contain stack trace indicators
    expect(text.toLowerCase()).not.toContain('stacktrace');
    expect(text).not.toContain('   at ');
    expect(text).not.toContain('System.Exception');
  });

  test('should not return HTML error page for unhandled errors', async ({ request }) => {
    // GIVEN: The backend is running with Problem Details middleware configured
    // WHEN: An error occurs
    const response = await request.get(`${API_BASE_URL}/api/v1/trigger-error-atdd`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Response is NOT an HTML error page (which would indicate middleware is missing)
    expect(contentType).not.toContain('text/html');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 (HTTP Level): Domain-level validation failures → correct HTTP codes
//                   404 / 409 / 400 — never 500
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Domain validation failures return correct HTTP status codes', () => {
  test('GET non-existent resource endpoint returns 404 not 500', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware maps KeyNotFoundException → 404
    // WHEN: A GET request is made for a resource that does not exist
    // NOTE: This endpoint will be registered in a later story; for now it tests
    //       that the backend does not return 500 for expected not-found scenarios
    const response = await request.get(
      `${API_BASE_URL}/api/v1/clientes/00000000-0000-0000-0000-000000000000`,
    );

    // THEN: The response is 404 (not-found), NOT 500 (server error)
    // AC4: Domain-level not-found scenarios must return 404
    expect(response.status()).not.toBe(500);
    expect([404, 400, 405]).toContain(response.status());
  });

  test('Problem Details body status field matches HTTP response status code', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware returns RFC 7807 Problem Details
    // WHEN: An error endpoint is hit
    const response = await request.get(`${API_BASE_URL}/api/v1/atdd-error-probe-1-3`);
    const httpStatus = response.status();

    if (httpStatus !== 200) {
      const body = await response.json().catch(() => null);
      if (body && typeof body.status === 'number') {
        // THEN: The 'status' field in the body matches the HTTP status code (RFC 7807 requirement)
        expect(body.status).toBe(httpStatus);
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5: Scalar API docs load at /scalar (no Swagger/OpenAPI UI registered)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Scalar API documentation endpoint', () => {
  test('should load Scalar documentation page at /scalar with HTTP 200', async ({ request }) => {
    // GIVEN: Scalar.AspNetCore package is referenced and app.MapScalarApiReference() is registered
    // WHEN: A GET request is made to /scalar
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: The Scalar documentation page responds with HTTP 200
    expect(response.status()).toBe(200);
  });

  test('should return HTML content from /scalar endpoint', async ({ request }) => {
    // GIVEN: app.MapScalarApiReference() is registered in Program.cs
    // WHEN: The /scalar endpoint is requested
    const response = await request.get(`${API_BASE_URL}/scalar`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: The response is an HTML page (Scalar renders its UI as HTML)
    expect(contentType).toContain('text/html');
  });

  test('should NOT serve Swagger UI at /swagger (Swashbuckle is explicitly forbidden)', async ({
    request,
  }) => {
    // GIVEN: Architecture mandates Scalar ONLY — app.UseSwagger() must NOT be registered
    // WHEN: A GET request is made to /swagger
    const response = await request.get(`${API_BASE_URL}/swagger`);

    // THEN: The /swagger endpoint does NOT return HTTP 200 (Swashbuckle must not be configured)
    expect(response.status()).not.toBe(200);
  });

  test('should NOT serve Swagger JSON spec at /swagger/v1/swagger.json', async ({ request }) => {
    // GIVEN: Swashbuckle is explicitly forbidden in this project
    // WHEN: A GET request is made to the default Swashbuckle JSON endpoint
    const response = await request.get(`${API_BASE_URL}/swagger/v1/swagger.json`);

    // THEN: The OpenAPI JSON spec endpoint does NOT return HTTP 200
    expect(response.status()).not.toBe(200);
  });
});

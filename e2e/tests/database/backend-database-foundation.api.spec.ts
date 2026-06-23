/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (API Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC2  — ExceptionHandlingMiddleware returns Problem Details RFC 7807 (status, title, detail)
 *           with HTTP 500 for unhandled exceptions — no stack trace in response body.
 *   AC7  — ExceptionHandlingMiddleware exists and is registered in Program.cs before endpoint
 *           mapping; intercepts all unhandled exceptions.
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC2 + AC7 — ExceptionHandlingMiddleware: Problem Details RFC 7807
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2/AC7 — ExceptionHandlingMiddleware returns Problem Details RFC 7807', () => {
  /**
   * Validates that a request to a dedicated test endpoint that triggers an unhandled
   * exception returns HTTP 500 with a Problem Details body.
   *
   * GIVEN: An unhandled exception occurs in the backend
   * WHEN: The exception reaches the ExceptionHandlingMiddleware
   * THEN: The response returns HTTP 500 with Problem Details RFC 7807 format
   */
  test('should return HTTP 500 for an unhandled exception endpoint', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered in Program.cs before endpoint mapping
    // WHEN: A request reaches an endpoint that throws an unhandled exception
    // NOTE: This test will fail (RED) until the middleware and a test-throw endpoint exist.
    // The endpoint GET /api/test/throw-exception must be added by the dev for full verification.
    // During RED phase the test validates the expected contract.

    const response = await request.get(`${API_BASE_URL}/api/test/throw-exception`);

    // THEN: HTTP status is 500 Internal Server Error
    expect(response.status()).toBe(500);
  });

  /**
   * Validates that the Problem Details response has the required RFC 7807 fields:
   * status (integer), title (string), detail (string).
   *
   * GIVEN: An unhandled exception occurs in the backend
   * WHEN: ExceptionHandlingMiddleware processes the exception
   * THEN: Response body contains "status", "title", and "detail" fields (RFC 7807)
   */
  test('should return a body with RFC 7807 "status" field equal to 500', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware is configured to return Problem Details
    // WHEN: An unhandled exception is triggered

    const response = await request.get(`${API_BASE_URL}/api/test/throw-exception`);
    const body = await response.json().catch(() => ({}));

    // THEN: The "status" field in the body is 500
    expect(body.status).toBe(500);
  });

  /**
   * GIVEN: An unhandled exception occurs
   * WHEN: ExceptionHandlingMiddleware returns the Problem Details response
   * THEN: The body contains a "title" field with value "Internal Server Error"
   */
  test('should return a Problem Details body with "title" equal to "Internal Server Error"', async ({
    request,
  }) => {
    const response = await request.get(`${API_BASE_URL}/api/test/throw-exception`);
    const body = await response.json().catch(() => ({}));

    // THEN: Title matches the required string
    expect(body.title).toBe('Internal Server Error');
  });

  /**
   * GIVEN: An unhandled exception occurs
   * WHEN: ExceptionHandlingMiddleware returns the Problem Details response
   * THEN: The body contains a "detail" field (non-empty string, not exposing stack trace)
   */
  test('should return a Problem Details body with a "detail" field that hides the stack trace', async ({
    request,
  }) => {
    const response = await request.get(`${API_BASE_URL}/api/test/throw-exception`);
    const body = await response.json().catch(() => ({}));

    // THEN: detail field exists and does not contain stack trace keywords
    expect(typeof body.detail).toBe('string');
    expect(body.detail.length).toBeGreaterThan(0);

    // NFR6: Stack trace must NOT be exposed in the response body
    expect(body.detail).not.toContain('at System.');
    expect(body.detail).not.toContain('StackTrace');
    expect(body.detail).not.toContain('Exception');
  });

  /**
   * GIVEN: An unhandled exception occurs
   * WHEN: ExceptionHandlingMiddleware handles it
   * THEN: Content-Type header is application/json (or application/problem+json)
   */
  test('should return Content-Type application/json for Problem Details error responses', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware sets Content-Type header on error responses
    // WHEN: An unhandled exception is triggered

    const response = await request.get(`${API_BASE_URL}/api/test/throw-exception`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Content-Type is JSON-based (RFC 7807 prefers application/problem+json or application/json)
    expect(contentType).toMatch(/application\/(problem\+)?json/i);
  });

  /**
   * Validates that normal (non-exception) requests are NOT affected by the middleware.
   * The middleware must pass-through successful requests unchanged.
   *
   * GIVEN: A valid request to an existing endpoint (e.g., /scalar)
   * WHEN: The request passes through ExceptionHandlingMiddleware
   * THEN: The middleware does not interfere — response is 200 as expected
   */
  test('should not interfere with normal successful requests (middleware pass-through)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered in Program.cs
    // WHEN: A normal request reaches the /scalar documentation endpoint

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: The response passes through unmodified — still 200
    expect(response.status()).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — HTTP 500 must not expose internal details (NFR6 security requirement)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — NFR6: No stack trace or internal details in 500 responses', () => {
  /**
   * GIVEN: An unhandled exception occurs in the backend
   * WHEN: ExceptionHandlingMiddleware returns the error response
   * THEN: The raw response body does NOT contain the actual exception message or C# type names
   */
  test('should not expose C# exception type names in the 500 response body', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware masks internal exception details
    // WHEN: An unhandled System.Exception is thrown in the backend

    const response = await request.get(`${API_BASE_URL}/api/test/throw-exception`);
    const text = await response.text();

    // THEN: Internal .NET implementation details are NOT in the response
    expect(text).not.toContain('System.Exception');
    expect(text).not.toContain('System.InvalidOperationException');
    expect(text).not.toContain('Microsoft.AspNetCore');
  });

  /**
   * GIVEN: An unhandled exception occurs
   * WHEN: ExceptionHandlingMiddleware responds
   * THEN: The response body does NOT contain a "stackTrace" or "traceId" exposing internals
   */
  test('should not include a raw stackTrace field in the Problem Details response', async ({
    request,
  }) => {
    const response = await request.get(`${API_BASE_URL}/api/test/throw-exception`);
    const body = await response.json().catch(() => ({}));

    // THEN: No stack trace key in the body
    expect(body.stackTrace).toBeUndefined();
    expect(body.exception).toBeUndefined();
    expect(body.innerException).toBeUndefined();
  });
});

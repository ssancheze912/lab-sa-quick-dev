/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (API Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC2 — Unhandled exceptions return Problem Details RFC 7807 (status, title, detail)
 *          with no stack traces exposed (NFR6):
 *            - Unhandled exception → 500 Problem Details
 *            - NotFoundException       → 404 Problem Details
 *            - ValidationException     → 400 Problem Details
 *            - Content-Type must be application/problem+json
 *            - Response body must NOT contain stack trace
 *
 * Test level rationale:
 *   - API tests validate the HTTP contract surface exposed by ExceptionHandlingMiddleware.
 *   - Unit tests (SiesaAgents.UnitTests) verify the middleware internals in isolation.
 *   - AC1 (DB creation) and AC3 (snake_case naming) are pure .NET concerns tested via xUnit.
 *
 * Priority tags:
 *   [P0] — Critical infrastructure, must pass on every commit.
 *   [P1] — Important, run on PR to main.
 *   [P2] — Supplementary, run on scheduled pipeline.
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ---------------------------------------------------------------------------
// AC2 — Problem Details RFC 7807: unhandled exception → 500
// ---------------------------------------------------------------------------

test.describe('AC2 — Unhandled exception returns Problem Details 500 (RFC 7807)', () => {
  test('[P0] should return HTTP 500 when an unhandled exception is triggered', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered in Program.cs
    // WHEN: A request reaches an endpoint that throws an unhandled exception
    // (test probe endpoint that intentionally throws — must be implemented by dev)

    // Intercept at API level — no browser needed
    const response = await request.get(
      `${API_BASE_URL}/api/v1/test-probes/throw-unhandled`,
      { failOnStatusCode: false },
    );

    // THEN: Middleware catches it and returns 500
    expect(response.status()).toBe(500);
  });

  test('[P0] should return Content-Type application/problem+json for unhandled exception', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware writes a ProblemDetails response
    // WHEN: An unhandled exception reaches the middleware

    const response = await request.get(
      `${API_BASE_URL}/api/v1/test-probes/throw-unhandled`,
      { failOnStatusCode: false },
    );

    // THEN: Content-Type is application/problem+json (RFC 7807 compliant)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');
  });

  test('[P0] should include status field equal to 500 in Problem Details body', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware returns a ProblemDetails object
    // WHEN: An unhandled exception is thrown

    const response = await request.get(
      `${API_BASE_URL}/api/v1/test-probes/throw-unhandled`,
      { failOnStatusCode: false },
    );

    // THEN: JSON body contains status: 500
    const body = await response.json();
    expect(body.status).toBe(500);
  });

  test('[P0] should include a non-empty title field in the Problem Details body', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware writes title in ProblemDetails
    // WHEN: An unhandled exception is caught

    const response = await request.get(
      `${API_BASE_URL}/api/v1/test-probes/throw-unhandled`,
      { failOnStatusCode: false },
    );

    // THEN: title field is present and non-empty
    const body = await response.json();
    expect(typeof body.title).toBe('string');
    expect(body.title.length).toBeGreaterThan(0);
  });

  test('[P0] should NOT expose stack trace in Problem Details detail field (NFR6)', async ({
    request,
  }) => {
    // GIVEN: NFR6 mandates no stack trace exposure to clients
    // WHEN: An unhandled exception is caught by the middleware

    const response = await request.get(
      `${API_BASE_URL}/api/v1/test-probes/throw-unhandled`,
      { failOnStatusCode: false },
    );

    // THEN: Response body does NOT contain a .NET stack trace
    const bodyText = await response.text();
    expect(bodyText).not.toContain('at SiesaAgents');
    expect(bodyText).not.toContain('System.Exception');
    expect(bodyText).not.toContain('   at ');
  });

  test('[P1] should NOT return HTML error page for unhandled exception (developer exception page disabled)', async ({
    request,
  }) => {
    // GIVEN: Developer exception page must be OFF in any environment where tests run
    // WHEN: An unhandled exception is triggered

    const response = await request.get(
      `${API_BASE_URL}/api/v1/test-probes/throw-unhandled`,
      { failOnStatusCode: false },
    );

    // THEN: Response is not HTML (developer error page would be text/html)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).not.toContain('text/html');
  });
});

// ---------------------------------------------------------------------------
// AC2 — Problem Details RFC 7807: NotFoundException → 404
// ---------------------------------------------------------------------------

test.describe('AC2 — NotFoundException returns Problem Details 404', () => {
  test('[P0] should return HTTP 404 when NotFoundException is thrown', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware maps NotFoundException → 404
    // WHEN: An endpoint throws NotFoundException (test probe)

    const response = await request.get(
      `${API_BASE_URL}/api/v1/test-probes/throw-not-found`,
      { failOnStatusCode: false },
    );

    // THEN: Status code is 404
    expect(response.status()).toBe(404);
  });

  test('[P0] should return Content-Type application/problem+json for NotFoundException', async ({
    request,
  }) => {
    // GIVEN: NotFoundException path in ExceptionHandlingMiddleware
    // WHEN: Endpoint throws NotFoundException

    const response = await request.get(
      `${API_BASE_URL}/api/v1/test-probes/throw-not-found`,
      { failOnStatusCode: false },
    );

    // THEN: Content-Type is application/problem+json
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');
  });

  test('[P0] should include status: 404 in Problem Details body for NotFoundException', async ({
    request,
  }) => {
    // GIVEN: ProblemDetails is written with status 404
    // WHEN: NotFoundException is caught

    const response = await request.get(
      `${API_BASE_URL}/api/v1/test-probes/throw-not-found`,
      { failOnStatusCode: false },
    );

    // THEN: Body.status equals 404
    const body = await response.json();
    expect(body.status).toBe(404);
  });

  test('[P1] should NOT expose stack trace for NotFoundException (NFR6)', async ({ request }) => {
    // GIVEN: NFR6 applies to all exception types, not just 500s
    // WHEN: NotFoundException is caught and response is written

    const response = await request.get(
      `${API_BASE_URL}/api/v1/test-probes/throw-not-found`,
      { failOnStatusCode: false },
    );

    // THEN: No stack trace in body
    const bodyText = await response.text();
    expect(bodyText).not.toContain('   at ');
  });
});

// ---------------------------------------------------------------------------
// AC2 — Problem Details RFC 7807: ValidationException → 400
// ---------------------------------------------------------------------------

test.describe('AC2 — ValidationException returns Problem Details 400', () => {
  test('[P0] should return HTTP 400 when ValidationException is thrown', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware maps ValidationException → 400
    // WHEN: An endpoint throws ValidationException (test probe)

    const response = await request.get(
      `${API_BASE_URL}/api/v1/test-probes/throw-validation`,
      { failOnStatusCode: false },
    );

    // THEN: Status code is 400
    expect(response.status()).toBe(400);
  });

  test('[P0] should return Content-Type application/problem+json for ValidationException', async ({
    request,
  }) => {
    // GIVEN: ValidationException path in ExceptionHandlingMiddleware
    // WHEN: Endpoint throws ValidationException

    const response = await request.get(
      `${API_BASE_URL}/api/v1/test-probes/throw-validation`,
      { failOnStatusCode: false },
    );

    // THEN: Content-Type is application/problem+json
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');
  });

  test('[P0] should include status: 400 in Problem Details body for ValidationException', async ({
    request,
  }) => {
    // GIVEN: ProblemDetails is written with status 400
    // WHEN: ValidationException is caught

    const response = await request.get(
      `${API_BASE_URL}/api/v1/test-probes/throw-validation`,
      { failOnStatusCode: false },
    );

    // THEN: Body.status equals 400
    const body = await response.json();
    expect(body.status).toBe(400);
  });

  test('[P1] should NOT expose stack trace for ValidationException (NFR6)', async ({ request }) => {
    // GIVEN: NFR6 applies to all exception types
    // WHEN: ValidationException is caught

    const response = await request.get(
      `${API_BASE_URL}/api/v1/test-probes/throw-validation`,
      { failOnStatusCode: false },
    );

    // THEN: No stack trace in body
    const bodyText = await response.text();
    expect(bodyText).not.toContain('   at ');
  });
});

// ---------------------------------------------------------------------------
// AC2 — Problem Details RFC 7807: structural compliance
// ---------------------------------------------------------------------------

test.describe('AC2 — Problem Details RFC 7807 structural compliance', () => {
  test('[P1] Problem Details body for 500 should not contain stackTrace field at root level', async ({
    request,
  }) => {
    // GIVEN: RFC 7807 does not include a stackTrace field
    // WHEN: An unhandled exception occurs

    const response = await request.get(
      `${API_BASE_URL}/api/v1/test-probes/throw-unhandled`,
      { failOnStatusCode: false },
    );

    // THEN: stackTrace field is absent from the body
    const body = await response.json();
    expect(body).not.toHaveProperty('stackTrace');
    expect(body).not.toHaveProperty('StackTrace');
  });

  test('[P1] Problem Details body for 500 should not contain exception message that leaks internals', async ({
    request,
  }) => {
    // GIVEN: NFR6 mandates no internal detail exposed in 500 responses
    // WHEN: An unhandled exception occurs

    const response = await request.get(
      `${API_BASE_URL}/api/v1/test-probes/throw-unhandled`,
      { failOnStatusCode: false },
    );

    // THEN: detail field is null or absent for 500 (internal messages must not be forwarded)
    const body = await response.json();
    // detail must be null or missing — not an internal exception message
    expect(body.detail === null || body.detail === undefined).toBe(true);
  });

  test('[P2] Problem Details response for all probes should be valid JSON', async ({
    request,
  }) => {
    // GIVEN: Middleware writes JSON using WriteAsJsonAsync
    // WHEN: Any exception probe endpoint is called

    const response = await request.get(
      `${API_BASE_URL}/api/v1/test-probes/throw-unhandled`,
      { failOnStatusCode: false },
    );

    // THEN: Response body is parseable as JSON (not malformed)
    let body: unknown;
    expect(async () => {
      body = await response.json();
    }).not.toThrow();
    expect(body).toBeTruthy();
  });
});

/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (API Level, Playwright)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC #3 — Unhandled exception => HTTP 500 with application/problem+json,
 *           ProblemDetails body, Detail null/omitted, NO sensitive tokens (NFR6).
 *   AC #5 — Backend boots with AppDbContext registered (CanConnectAsync does not throw).
 *           Verified indirectly: /health returns 200 (startup did not crash).
 *   AC #6 — ExceptionHandlingMiddleware is FIRST in the pipeline (verified by content-type
 *           of error responses being application/problem+json).
 *
 * Sandbox infra notes:
 *   - Chromium-only sandbox: run with --project=chromium.
 *   - PostgreSQL is OPTIONAL. The /health probe MAY fail if the backend crashes at
 *     startup due to missing DB connection. Those tests are gated below.
 *
 * Conventions:
 *   - Network-first not applicable here (these are direct API hits, not page navigations).
 *   - One assertion per test (atomic).
 *   - Given-When-Then comments throughout.
 *   - No hard waits.
 *   - data-testid not applicable (no UI).
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

/**
 * Endpoint that intentionally throws to exercise the ExceptionHandlingMiddleware path.
 * Story 1.3 documents this endpoint as registered ONLY via WebApplicationFactory in
 * xUnit tests. For Playwright/E2E we verify the closest available signal — the
 * unmapped-route Problem Details path that AC #6 also requires to be application/problem+json.
 *
 * If the dev team chooses to also expose /api/v1/test-error in Development environment,
 * the test in the "AC #3 — exception path (when test-error endpoint is exposed)" describe
 * block will activate (currently gated by env var so it does not pollute CI runs by default).
 */
const TEST_ERROR_ROUTE = '/api/v1/test-error';
const UNMAPPED_ROUTE_FOR_PROBLEM_DETAILS = '/api/v1/__unmapped_for_atdd_1_3';

// ──────────────────────────────────────────────────────────────────────────────
// AC #5 + AC #6 — Backend boots with DI + middleware order preserved
// ──────────────────────────────────────────────────────────────────────────────

test.describe('AC #5 — Backend boots with AppDbContext registered in DI', () => {
  test('should return HTTP 200 on /health after AddDbContext is registered', async ({ request }) => {
    // GIVEN: AppDbContext is registered in DI via AddDbContext<AppDbContext>(UseNpgsql(...))
    // WHEN: The /health endpoint is requested

    const response = await request.get(`${API_BASE_URL}/health`);

    // THEN: The server is up — the DI graph resolved without throwing at startup
    expect(response.status()).toBe(200);
  });

  test('should respond /health with status payload (DI did not break the pipeline)', async ({ request }) => {
    // GIVEN: AppDbContext is registered between AddProblemDetails() and AddCors(...)
    // WHEN: The /health endpoint is requested

    const response = await request.get(`${API_BASE_URL}/health`);
    const body = await response.json();

    // THEN: The expected payload from Program.cs is preserved
    expect(body).toEqual({ status: 'ok' });
  });
});

test.describe('AC #6 — ExceptionHandlingMiddleware remains the FIRST middleware', () => {
  test('should serve application/problem+json for unmapped routes (Problem Details wiring intact)', async ({
    request,
  }) => {
    // GIVEN: UseStatusCodePages + ExceptionHandlingMiddleware are registered correctly
    // WHEN: An unmapped route is requested

    const response = await request.get(`${API_BASE_URL}${UNMAPPED_ROUTE_FOR_PROBLEM_DETAILS}`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: The response is RFC 7807 Problem Details (JSON), not HTML or empty
    expect(contentType).toContain('application/problem+json');
  });

  test('should return HTTP 404 status code for unmapped routes', async ({ request }) => {
    // GIVEN: No /api/v1/__unmapped_for_atdd_1_3 endpoint is mapped
    // WHEN: The unmapped route is requested

    const response = await request.get(`${API_BASE_URL}${UNMAPPED_ROUTE_FOR_PROBLEM_DETAILS}`);

    // THEN: The status is exactly 404
    expect(response.status()).toBe(404);
  });

  test('should NOT expose Swagger UI (no /swagger route — Scalar only per Story 1.1)', async ({ request }) => {
    // GIVEN: The architecture mandates Scalar; Swashbuckle is forbidden
    // WHEN: /swagger is requested

    const response = await request.get(`${API_BASE_URL}/swagger`);

    // THEN: /swagger does NOT respond with 200 (regression check for AC #6 — pipeline unchanged)
    expect(response.status()).not.toBe(200);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// AC #3 — exception path (Problem Details + NFR6)
// Gated: only runs when the dev team has exposed /api/v1/test-error in Development.
// The xUnit ProblemDetailsTests cover the same contract via WebApplicationFactory
// without needing this endpoint exposed publicly.
// ──────────────────────────────────────────────────────────────────────────────

test.describe('AC #3 — exception path (when test-error endpoint is exposed)', () => {
  test.beforeAll(async ({ request }) => {
    // GIVEN: This block only runs if /api/v1/test-error is reachable.
    // If the endpoint is NOT exposed (production behavior — recommended), all tests are skipped.
    const probe = await request.get(`${API_BASE_URL}${TEST_ERROR_ROUTE}`, { failOnStatusCode: false });
    test.skip(
      probe.status() === 404,
      `Skipped: ${TEST_ERROR_ROUTE} is not exposed in this environment (xUnit ProblemDetailsTests cover this contract).`,
    );
  });

  test('should return HTTP 500 for unhandled exception', async ({ request }) => {
    // GIVEN: /api/v1/test-error throws InvalidOperationException
    // WHEN: The endpoint is invoked

    const response = await request.get(`${API_BASE_URL}${TEST_ERROR_ROUTE}`, {
      failOnStatusCode: false,
    });

    // THEN: HTTP status is 500
    expect(response.status()).toBe(500);
  });

  test('should return application/problem+json content type for unhandled exception', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware emits RFC 7807 responses
    // WHEN: The error endpoint is invoked

    const response = await request.get(`${API_BASE_URL}${TEST_ERROR_ROUTE}`, {
      failOnStatusCode: false,
    });
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Content-Type starts with application/problem+json
    expect(contentType).toContain('application/problem+json');
  });

  test('should NOT include stackTrace token in the response body (NFR6)', async ({ request }) => {
    // GIVEN: NFR6 forbids stack-trace exposure
    // WHEN: The error endpoint is invoked

    const response = await request.get(`${API_BASE_URL}${TEST_ERROR_ROUTE}`, {
      failOnStatusCode: false,
    });
    const body = await response.text();

    // THEN: The raw body does not include the "stackTrace" token
    expect(body.toLowerCase()).not.toContain('stacktrace');
  });

  test('should NOT include exception class name in the response body (NFR6)', async ({ request }) => {
    // GIVEN: NFR6 forbids exception type exposure
    // WHEN: The error endpoint is invoked

    const response = await request.get(`${API_BASE_URL}${TEST_ERROR_ROUTE}`, {
      failOnStatusCode: false,
    });
    const body = await response.text();

    // THEN: The raw body does not include "InvalidOperationException"
    expect(body).not.toContain('InvalidOperationException');
  });

  test('should NOT include innerException token in the response body (NFR6)', async ({ request }) => {
    // GIVEN: NFR6 forbids inner-exception exposure
    // WHEN: The error endpoint is invoked

    const response = await request.get(`${API_BASE_URL}${TEST_ERROR_ROUTE}`, {
      failOnStatusCode: false,
    });
    const body = await response.text();

    // THEN: The raw body does not include the "innerException" token
    expect(body.toLowerCase()).not.toContain('innerexception');
  });

  test('should return ProblemDetails body with status 500', async ({ request }) => {
    // GIVEN: RFC 7807 mandates a `status` field
    // WHEN: The error endpoint is invoked and the JSON body is parsed

    const response = await request.get(`${API_BASE_URL}${TEST_ERROR_ROUTE}`, {
      failOnStatusCode: false,
    });
    const body = await response.json();

    // THEN: status field equals 500
    expect(body.status).toBe(500);
  });

  test('should return ProblemDetails body with detail null or omitted (NFR6)', async ({ request }) => {
    // GIVEN: NFR6 + AC #3: Detail MUST be null or omitted
    // WHEN: The error endpoint is invoked

    const response = await request.get(`${API_BASE_URL}${TEST_ERROR_ROUTE}`, {
      failOnStatusCode: false,
    });
    const body = await response.json();

    // THEN: detail is null OR the key is absent
    expect(body.detail === undefined || body.detail === null).toBe(true);
  });
});

/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (API Level — Playwright)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC2 — ExceptionHandlingMiddleware returns Problem Details RFC 7807 with
 *          Content-Type: application/problem+json, fields: status, title, detail,
 *          and NO stackTrace/exception/innerException keys (NFR6)
 *   AC5 — Backend builds and the Npgsql provider is wired (runtime smoke test)
 *
 * Test-Case References (test-design-epic-1.md):
 *   TC-E1-P0-05 — ExceptionHandlingMiddleware Returns Problem Details RFC 7807
 *   TC-E1-P1-05 — EF Core Migration Creates Database and Migrations Table (smoke)
 *   TC-E1-P2-04 — snake_case Column Naming Applied via ApplySnakeCaseNaming
 *
 * Note: AC1, AC3, AC4 are covered by xUnit tests in AppDbContextTests.cs.
 * Playwright API tests cover the HTTP contract observable from outside the process.
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC2 + NFR6: ExceptionHandlingMiddleware returns Problem Details RFC 7807
// TC-E1-P0-05
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — ExceptionHandlingMiddleware: Problem Details RFC 7807 (TC-E1-P0-05)', () => {
  test('should return HTTP 500 when an unhandled exception occurs', async ({ request }) => {
    // GIVEN: The backend is running with ExceptionHandlingMiddleware registered
    // AND: A test endpoint GET /api/v1/test-error exists that throws new Exception("internal test")
    // WHEN: The error endpoint is called

    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);

    // THEN: The HTTP status code is 500 Internal Server Error
    expect(response.status()).toBe(500);
  });

  test('should return Content-Type: application/problem+json for unhandled exceptions', async ({ request }) => {
    // GIVEN: The backend is running with ExceptionHandlingMiddleware registered
    // WHEN: An unhandled exception is triggered via the test endpoint

    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Content-Type header contains application/problem+json (RFC 7807 requirement)
    expect(contentType).toContain('application/problem+json');
  });

  test('should include "status" field in Problem Details response body', async ({ request }) => {
    // GIVEN: The backend is running with ExceptionHandlingMiddleware registered
    // WHEN: An unhandled exception is triggered

    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const body = await response.json();

    // THEN: The response body contains a "status" field (RFC 7807)
    expect(body).toHaveProperty('status');
  });

  test('should include "title" field in Problem Details response body', async ({ request }) => {
    // GIVEN: The backend is running with ExceptionHandlingMiddleware registered
    // WHEN: An unhandled exception is triggered

    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const body = await response.json();

    // THEN: The response body contains a "title" field (RFC 7807)
    expect(body).toHaveProperty('title');
  });

  test('should include "detail" field in Problem Details response body', async ({ request }) => {
    // GIVEN: The backend is running with ExceptionHandlingMiddleware registered
    // WHEN: An unhandled exception is triggered

    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const body = await response.json();

    // THEN: The response body contains a "detail" field (RFC 7807)
    expect(body).toHaveProperty('detail');
  });

  test('should NOT expose stackTrace in Problem Details response (NFR6)', async ({ request }) => {
    // GIVEN: The backend is running with ExceptionHandlingMiddleware registered
    // WHEN: An unhandled exception is triggered

    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const body = await response.json();

    // THEN: The response body does NOT contain a "stackTrace" key (NFR6 — no leakage)
    expect(body).not.toHaveProperty('stackTrace');
  });

  test('should NOT expose exception key in Problem Details response (NFR6)', async ({ request }) => {
    // GIVEN: The backend is running with ExceptionHandlingMiddleware registered
    // WHEN: An unhandled exception is triggered

    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const body = await response.json();

    // THEN: The response body does NOT contain an "exception" key (NFR6)
    expect(body).not.toHaveProperty('exception');
  });

  test('should NOT expose innerException key in Problem Details response (NFR6)', async ({ request }) => {
    // GIVEN: The backend is running with ExceptionHandlingMiddleware registered
    // WHEN: An unhandled exception is triggered

    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const body = await response.json();

    // THEN: The response body does NOT contain an "innerException" key (NFR6)
    expect(body).not.toHaveProperty('innerException');
  });

  test('should return status value of 500 in Problem Details body', async ({ request }) => {
    // GIVEN: The backend is running with ExceptionHandlingMiddleware registered
    // WHEN: An unhandled exception is triggered

    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const body = await response.json();

    // THEN: The "status" field value equals 500
    expect(body.status).toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 + AC1 (smoke): Backend remains functional with EF Core / PostgreSQL wired
// TC-E1-P1-05 (smoke proxy — actual DB verification is in xUnit tests)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Backend starts with EF Core and Npgsql wired (TC-E1-P1-05 smoke)', () => {
  test('should have the backend running after DbContext registration (Scalar still responds)', async ({
    request,
  }) => {
    // GIVEN: AppDbContext is registered in DI using Npgsql / UseSnakeCaseNamingConvention()
    // AND: dotnet ef database update has been run at least once
    // WHEN: A simple GET is made to the Scalar endpoint

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: The backend is still running (200) — if DI or DB registration crashed startup,
    // the server would not be available. This is a proxy for AC5 build + wiring success.
    expect(response.status()).toBe(200);
  });

  test('should return a non-HTML response for a non-existent API endpoint (Problem Details wired)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is wired BEFORE endpoint mapping in Program.cs
    // WHEN: A non-existent API endpoint is requested after EF Core / DB wiring

    const response = await request.get(`${API_BASE_URL}/api/v1/nonexistent-atdd-1-3`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: The response is JSON (not HTML), confirming middleware is active post-DI setup
    expect(contentType).toContain('json');
    expect([404, 400]).toContain(response.status());
  });
});

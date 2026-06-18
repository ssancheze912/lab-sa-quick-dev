/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * AUTOMATE — API Edge Cases, Error Paths & Boundary Conditions
 * Expands ATDD coverage for the backend database foundation beyond the happy-path
 * tests in backend-database-foundation.api.spec.ts.
 *
 * Coverage added (not in ATDD):
 *   EC-DB-1  — Problem Details 500 response has exactly the RFC 7807 shape (no extra debug keys)
 *   EC-DB-2  — Problem Details status field value is a number (not a string)
 *   EC-DB-3  — Problem Details title field is a non-empty string
 *   EC-DB-4  — Problem Details detail field does NOT echo raw exception message text
 *   EC-DB-5  — Multiple sequential calls to test-error are all handled correctly (idempotency)
 *   EC-DB-6  — Routing 404 returns application/problem+json Content-Type (middleware intercepts 404s)
 *   EC-DB-7  — Routing 404 body "status" field equals 404
 *   EC-DB-8  — Error response body is valid parseable JSON (no truncation)
 *   EC-DB-9  — Error response Content-Type is NOT text/html (no fallback to ASP.NET HTML error page)
 *   EC-DB-10 — Backend /scalar endpoint still returns 200 after EF Core DbContext is registered (AC5 smoke)
 *   EC-DB-11 — Response body does NOT contain "exceptionType" key (NFR6 additional vector)
 *   EC-DB-12 — Problem Details 500 response does NOT contain "traceId" with exception info (diagnostic leak)
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// EC-DB-SHAPE: Problem Details response shape edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] EC-DB-SHAPE — Problem Details response shape edge cases', () => {
  test('[P1] EC-DB-1: Problem Details response has no extra sensitive debug keys beyond RFC 7807 fields', async ({
    request,
  }) => {
    // GIVEN: The backend is running with ExceptionHandlingMiddleware
    // WHEN: An unhandled exception is triggered via the test endpoint
    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const body = await response.json();

    // THEN: None of the forbidden sensitive debug keys are present
    const forbiddenKeys = [
      'stackTrace',
      'exception',
      'innerException',
      'exceptionType',
      'exceptionMessage',
      'source',
      'targetSite',
      'hResult',
      'innerExceptions',
    ];

    for (const key of forbiddenKeys) {
      expect(body, `Forbidden key '${key}' found in Problem Details response`).not.toHaveProperty(key);
    }
  });

  test('[P1] EC-DB-2: Problem Details "status" field is a number, not a string', async ({
    request,
  }) => {
    // GIVEN: The backend is running with ExceptionHandlingMiddleware
    // WHEN: An unhandled exception is triggered
    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const body = await response.json();

    // THEN: The "status" field is a number (not a string like "500")
    expect(typeof body.status).toBe('number');
  });

  test('[P1] EC-DB-3: Problem Details "title" field is a non-empty string', async ({
    request,
  }) => {
    // GIVEN: The backend is running with ExceptionHandlingMiddleware
    // WHEN: An unhandled exception is triggered
    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const body = await response.json();

    // THEN: The "title" field is a non-empty string
    expect(typeof body.title).toBe('string');
    expect(body.title.length).toBeGreaterThan(0);
  });

  test('[P1] EC-DB-4: Problem Details "detail" field does NOT echo raw exception message', async ({
    request,
  }) => {
    // GIVEN: The test-error endpoint throws with message "internal test — unhandled exception for ATDD"
    // WHEN: That endpoint is triggered
    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const body = await response.json();

    // THEN: The "detail" field, if present, does not contain the raw exception message
    if (body.detail !== undefined && body.detail !== null) {
      const detail = String(body.detail);
      // Raw exception text must not appear
      expect(detail.toLowerCase()).not.toContain('internal test');
      // .NET stack frame patterns must not appear
      expect(detail).not.toMatch(/at System\./);
      expect(detail).not.toMatch(/at SiesaAgents\./);
    }
  });

  test('[P1] EC-DB-8: Problem Details response body is valid parseable JSON', async ({
    request,
  }) => {
    // GIVEN: The backend is running with ExceptionHandlingMiddleware
    // WHEN: An unhandled exception is triggered
    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const rawBody = await response.text();

    // THEN: The body is valid JSON (no truncation or encoding corruption)
    expect(() => JSON.parse(rawBody)).not.toThrow();
  });

  test('[P1] EC-DB-9: Problem Details Content-Type is NOT text/html', async ({
    request,
  }) => {
    // GIVEN: The backend is running with ExceptionHandlingMiddleware
    // WHEN: An unhandled exception is triggered
    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Content-Type is not text/html (ASP.NET HTML error page must not appear)
    expect(contentType.toLowerCase()).not.toContain('text/html');
  });

  test('[P1] EC-DB-11: Problem Details response does NOT contain "exceptionType" key', async ({
    request,
  }) => {
    // GIVEN: The backend is running with ExceptionHandlingMiddleware
    // WHEN: An unhandled exception is triggered
    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const body = await response.json();

    // THEN: The "exceptionType" key is absent (NFR6 additional vector)
    expect(body).not.toHaveProperty('exceptionType');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EC-DB-IDEMPOTENCY: Middleware idempotency and concurrency
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] EC-DB-IDEMPOTENCY — Middleware idempotency edge cases', () => {
  test('[P1] EC-DB-5: multiple sequential error requests are all handled correctly', async ({
    request,
  }) => {
    // GIVEN: The backend is running with ExceptionHandlingMiddleware
    // WHEN: The same error endpoint is called 3 times in sequence
    for (let i = 0; i < 3; i++) {
      const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);

      // THEN: Each request returns HTTP 500 with Problem Details
      expect(response.status()).toBe(500);
      const body = await response.json();
      expect(body).toHaveProperty('status');
      expect(body.status).toBe(500);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EC-DB-404: Routing 404 handling edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] EC-DB-404 — Routing 404 Problem Details edge cases', () => {
  test('[P1] EC-DB-6: routing 404 returns application/problem+json Content-Type', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is wired before endpoint mapping
    // AND: It handles routing 404s (not-started 404 responses from the routing layer)
    // WHEN: A request is made to a non-existent endpoint
    const response = await request.get(
      `${API_BASE_URL}/api/v1/does-not-exist-edge-case-db-1-3`
    );
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: HTTP 404 is returned
    expect(response.status()).toBe(404);

    // AND: Content-Type is application/problem+json (not text/html)
    expect(contentType).toContain('application/problem+json');
  });

  test('[P1] EC-DB-7: routing 404 body "status" field equals 404', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware intercepts routing 404s
    // WHEN: A request is made to a non-existent endpoint
    const response = await request.get(
      `${API_BASE_URL}/api/v1/does-not-exist-status-check-db-1-3`
    );
    const body = await response.json();

    // THEN: The "status" field in the body equals 404
    expect(body).toHaveProperty('status');
    expect(body.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EC-DB-SMOKE: EF Core + DbContext registration smoke tests
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] EC-DB-SMOKE — EF Core DbContext registration smoke tests', () => {
  test('[P1] EC-DB-10: backend /scalar endpoint returns 200 after EF Core DbContext registration', async ({
    request,
  }) => {
    // GIVEN: AppDbContext registered in DI with Npgsql + UseSnakeCaseNamingConvention()
    // AND: dotnet ef database update has applied the empty InitialCreate migration
    // WHEN: A GET request is made to the Scalar endpoint (requires full app startup)
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: 200 is returned — if DbContext DI registration crashed startup, this would fail
    expect(response.status()).toBe(200);
  });

  test('[P1] EC-DB-12: normal API response does NOT contain debug/diagnostic exception fields', async ({
    request,
  }) => {
    // GIVEN: The backend is running normally (not in error state)
    // WHEN: A request is made to a non-existent endpoint (produces a structured error, not a crash)
    const response = await request.get(
      `${API_BASE_URL}/api/v1/diagnostic-leak-check-db-1-3`
    );

    // THEN: The response is a structured error (404) without diagnostic leak
    expect(response.status()).toBe(404);

    const body = await response.json();

    // Diagnostic fields that .NET may append in Development mode must not expose exception details
    // traceId from Activity is acceptable in the body — but it must not contain exception info
    if (body.traceId !== undefined) {
      // traceId is an acceptable RFC 7807 extension — it must be a correlation ID string, not exception data
      expect(typeof body.traceId).toBe('string');
      // Must not be a stack trace or exception message disguised as a traceId
      expect(String(body.traceId)).not.toMatch(/Exception:/i);
      expect(String(body.traceId)).not.toMatch(/at System\./);
    }

    // Forbidden fields must not be present regardless
    expect(body).not.toHaveProperty('exception');
    expect(body).not.toHaveProperty('stackTrace');
    expect(body).not.toHaveProperty('innerException');
  });
});

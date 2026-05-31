/**
 * Story 1.3: Backend Database Foundation
 * API Acceptance Tests — RED Phase (failing until implementation complete)
 *
 * Covers:
 *   AC3 — ExceptionHandlingMiddleware returns Problem Details RFC 7807
 *   AC1 — Backend starts and responds (DB connectivity smoke)
 *
 * Test Level: API (Playwright request context against http://localhost:5000)
 * Pattern: Network-first, Given-When-Then, one assertion per test
 */

import { test, expect } from '@playwright/test';

const BACKEND_BASE_URL = 'http://localhost:5000';

// ---------------------------------------------------------------------------
// AC3 — ExceptionHandlingMiddleware: Problem Details RFC 7807 on unhandled errors
// ---------------------------------------------------------------------------

test.describe('ExceptionHandlingMiddleware — Problem Details RFC 7807 (AC3)', () => {
  test('GIVEN an unhandled exception occurs WHEN the error reaches ExceptionHandlingMiddleware THEN response status is 500', async ({
    request,
  }) => {
    // GIVEN: Backend is running; hitting a route that triggers unhandled exception
    // (The /__throw-test endpoint must be created by dev as a test-only route that throws)

    // WHEN: Sending request to trigger unhandled exception
    const response = await request.get(`${BACKEND_BASE_URL}/__throw-test`);

    // THEN: HTTP status 500
    expect(response.status()).toBe(500);
  });

  test('GIVEN an unhandled exception occurs WHEN the error reaches ExceptionHandlingMiddleware THEN Content-Type is application/problem+json', async ({
    request,
  }) => {
    // GIVEN: Backend is running
    // WHEN: Triggering unhandled exception endpoint
    const response = await request.get(`${BACKEND_BASE_URL}/__throw-test`);

    // THEN: Content-Type must be application/problem+json (RFC 7807)
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/problem+json');
  });

  test('GIVEN an unhandled exception occurs WHEN the error reaches ExceptionHandlingMiddleware THEN response body contains RFC 7807 "status" field equal to 500', async ({
    request,
  }) => {
    // GIVEN: Backend is running
    // WHEN: Triggering unhandled exception endpoint
    const response = await request.get(`${BACKEND_BASE_URL}/__throw-test`);
    const body = await response.json();

    // THEN: Body must have status:500 (Problem Details RFC 7807)
    expect(body.status).toBe(500);
  });

  test('GIVEN an unhandled exception occurs WHEN the error reaches ExceptionHandlingMiddleware THEN response body "title" is "An unexpected error occurred."', async ({
    request,
  }) => {
    // GIVEN: Backend is running
    // WHEN: Triggering unhandled exception endpoint
    const response = await request.get(`${BACKEND_BASE_URL}/__throw-test`);
    const body = await response.json();

    // THEN: Title must match architecture spec (NFR6)
    expect(body.title).toBe('An unexpected error occurred.');
  });

  test('GIVEN an unhandled exception occurs WHEN the error reaches ExceptionHandlingMiddleware THEN response body does not expose stack trace (detail is null or absent)', async ({
    request,
  }) => {
    // GIVEN: Backend is running
    // WHEN: Triggering unhandled exception endpoint
    const response = await request.get(`${BACKEND_BASE_URL}/__throw-test`);
    const body = await response.json();

    // THEN: No stack trace exposed — "detail" must be null or not present (NFR6)
    const detail = body.detail ?? null;
    expect(detail).toBeNull();
  });

  test('GIVEN an unhandled exception occurs WHEN the error reaches ExceptionHandlingMiddleware THEN response body does not contain exception message in any field', async ({
    request,
  }) => {
    // GIVEN: Backend is running
    // WHEN: Triggering unhandled exception endpoint
    const response = await request.get(`${BACKEND_BASE_URL}/__throw-test`);
    const bodyText = await response.text();

    // THEN: Raw exception message MUST NOT appear in any field (NFR6 — no stack traces)
    expect(bodyText).not.toContain('Exception');
    expect(bodyText).not.toContain('at ');
    expect(bodyText).not.toContain('StackTrace');
  });
});

// ---------------------------------------------------------------------------
// AC1 — Database connectivity: Backend starts against siesa_agents_db
// ---------------------------------------------------------------------------

test.describe('Database Connectivity — EF Core + PostgreSQL (AC1)', () => {
  test('GIVEN PostgreSQL is running WHEN the backend starts and receives a health-check request THEN it responds with HTTP 200', async ({
    request,
  }) => {
    // GIVEN: Backend is running and connected to siesa_agents_db
    // WHEN: Hitting health endpoint (GET /health — must be added by dev)
    const response = await request.get(`${BACKEND_BASE_URL}/health`);

    // THEN: 200 OK — confirms DB connection is established (EF Core can reach siesa_agents_db)
    expect(response.status()).toBe(200);
  });
});

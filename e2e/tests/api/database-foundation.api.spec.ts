/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (API Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC2 — Unhandled exceptions produce RFC 7807 application/problem+json with
 *          status, title, detail (null) and Type field; no stack trace exposed.
 *   AC4 — dotnet build SiesaAgents.sln succeeds with zero errors (proxy: server
 *          is running only when build succeeds; AppDbContext registered in DI).
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC2: ExceptionHandlingMiddleware returns RFC 7807 Problem Details
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — ExceptionHandlingMiddleware returns RFC 7807 Problem Details', () => {
  test('should return HTTP 500 when an unhandled exception occurs', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered in Program.cs (Story 1.1)
    // WHEN: An endpoint triggers an unhandled server-side exception
    // NOTE: /api/trigger-error is an endpoint that throws intentionally for test purposes
    //       Until it is implemented this test fails with 404 (RED phase)

    const response = await request.get(`${API_BASE_URL}/api/trigger-error`);

    // THEN: The middleware intercepts the exception and returns HTTP 500
    expect(response.status()).toBe(500);
  });

  test('should return Content-Type application/problem+json on unhandled exception', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware is wired in Program.cs
    // WHEN: The error endpoint is hit and an exception is thrown

    const response = await request.get(`${API_BASE_URL}/api/trigger-error`);

    // THEN: Response content type is application/problem+json (RFC 7807 requirement)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');
  });

  test('should include RFC 7807 "status" field equal to 500 in response body', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware returns ProblemDetails on unhandled exception
    // WHEN: The error endpoint is hit

    const response = await request.get(`${API_BASE_URL}/api/trigger-error`);

    // THEN: The JSON body contains a "status" field equal to 500
    const body = await response.json();
    expect(body).toHaveProperty('status', 500);
  });

  test('should include RFC 7807 "title" field with non-empty string in response body', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware returns ProblemDetails on unhandled exception
    // WHEN: The error endpoint is hit

    const response = await request.get(`${API_BASE_URL}/api/trigger-error`);

    // THEN: The JSON body contains a "title" field with a non-empty string value
    const body = await response.json();
    expect(body).toHaveProperty('title');
    expect(typeof body.title).toBe('string');
    expect((body.title as string).length).toBeGreaterThan(0);
  });

  test('should NOT expose stack trace or exception message in response body', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware sets Detail = null (NFR6 security requirement)
    // WHEN: An exception with a recognizable message is thrown

    const response = await request.get(`${API_BASE_URL}/api/trigger-error`);

    // THEN: The response body does not contain stack trace indicators
    const bodyText = await response.text();
    expect(bodyText).not.toContain('StackTrace');
    expect(bodyText).not.toContain('at System.');
    expect(bodyText).not.toContain('Exception:');
  });

  test('should include RFC 7807 "type" field with rfc7807 URI in response body', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware is enhanced in Story 1.3 to add the Type field
    // WHEN: An unhandled exception reaches the middleware

    const response = await request.get(`${API_BASE_URL}/api/trigger-error`);

    // THEN: The JSON body contains a "type" field pointing to the RFC 7807 spec URI
    // RED: This test fails until middleware is updated to include Type = "https://tools.ietf.org/html/rfc7807"
    const body = await response.json();
    expect(body).toHaveProperty('type', 'https://tools.ietf.org/html/rfc7807');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4: dotnet build SiesaAgents.sln succeeds — proxy via server runtime behavior
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Solution compiles and AppDbContext resolves in DI', () => {
  test('should have the backend server responding (proves build succeeded)', async ({ request }) => {
    // GIVEN: dotnet build SiesaAgents.sln has been run with AppDbContext registered
    // WHEN: A request is made to the backend
    // NOTE: If the solution has compile errors or AppDbContext DI registration fails,
    //       the server will not start and this test will fail with ECONNREFUSED

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Server is running — build succeeded and DI resolved without errors
    expect(response.status()).toBe(200);
  });

  test('should resolve the health check or root endpoint confirming DI container is healthy', async ({ request }) => {
    // GIVEN: AppDbContext is registered in Program.cs via AddDbContext<AppDbContext>
    // WHEN: A request hits the server (DI container is initialized at startup)
    // RED: After AppDbContext is registered, if the connection string is missing or
    //      Npgsql package is absent, the startup will throw and this test will fail

    const response = await request.get(`${API_BASE_URL}/`);

    // THEN: Server responds without startup crash (DI resolved AppDbContext successfully)
    // Any non-5xx status proves the DI container initialized correctly
    expect(response.status()).toBeLessThan(500);
  });
});

/**
 * ATDD API Tests - Story 1.1: Project Initialization & Repository Structure
 * Status: RED (failing - implementation not yet complete)
 *
 * These tests verify the backend infrastructure without a browser.
 * They use Playwright's APIRequestContext to make direct HTTP calls.
 *
 * Acceptance Criteria covered:
 *   AC2 - Backend starts on port 5000 and Scalar loads at /scalar
 *   AC3 - CORS headers present in backend responses
 *   AC5 - Backend solution compiles (inferred from server being able to start)
 */

import { test, expect } from '@playwright/test';

const BACKEND_URL = 'http://localhost:5000';
const FRONTEND_ORIGIN = 'http://localhost:5173';

// ---------------------------------------------------------------------------
// AC2: Backend starts on port 5000 and Scalar loads at /scalar
// ---------------------------------------------------------------------------

test.describe('AC2 - Backend .NET server initialization', () => {
  test('should respond on port 5000', async ({ request }) => {
    // GIVEN: The .NET 10 backend is running on port 5000
    // WHEN: A GET request is sent to the root path
    const response = await request.get(`${BACKEND_URL}/`);

    // THEN: The server responds (any status is acceptable — 200, 404, or 400
    //       all indicate the server is running; only a connection error would fail)
    expect([200, 400, 404, 405]).toContain(response.status());
  });

  test('should serve the Scalar API documentation page at /scalar', async ({ request }) => {
    // GIVEN: The backend has Scalar configured via MapScalarApiReference()
    // WHEN: A GET request is sent to /scalar
    const response = await request.get(`${BACKEND_URL}/scalar`);

    // THEN: The Scalar page returns HTTP 200
    expect(response.status()).toBe(200);
  });

  test('should return HTML content at /scalar (Scalar UI page)', async ({ request }) => {
    // GIVEN: Scalar is mounted at /scalar
    // WHEN: A GET request is sent to /scalar
    const response = await request.get(`${BACKEND_URL}/scalar`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: The response is HTML (Scalar renders an HTML page)
    expect(contentType).toContain('text/html');
  });
});

// ---------------------------------------------------------------------------
// AC3: CORS headers present in backend responses
// ---------------------------------------------------------------------------

test.describe('AC3 - CORS headers on backend responses', () => {
  test('should include Access-Control-Allow-Origin for requests from localhost:5173', async ({ request }) => {
    // GIVEN: The backend has a CORS policy allowing http://localhost:5173
    // WHEN: A request is made with Origin: http://localhost:5173
    const response = await request.get(`${BACKEND_URL}/scalar`, {
      headers: {
        Origin: FRONTEND_ORIGIN,
      },
    });

    // THEN: The response includes the Access-Control-Allow-Origin header
    const allowOrigin = response.headers()['access-control-allow-origin'];
    expect(allowOrigin).toBe(FRONTEND_ORIGIN);
  });

  test('should handle OPTIONS preflight from localhost:5173 without CORS error', async ({ request }) => {
    // GIVEN: The backend CORS policy allows AllowAnyHeader and AllowAnyMethod from the frontend origin
    // WHEN: An OPTIONS preflight request is sent
    const response = await request.fetch(`${BACKEND_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: FRONTEND_ORIGIN,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: The response is 200 or 204 and includes the allow-origin header
    expect([200, 204]).toContain(response.status());
    const allowOrigin = response.headers()['access-control-allow-origin'];
    expect(allowOrigin).toBe(FRONTEND_ORIGIN);
  });

  test('should NOT include Access-Control-Allow-Origin for unknown origins', async ({ request }) => {
    // GIVEN: The CORS policy only allows http://localhost:5173
    // WHEN: A request is made from an unknown origin
    const response = await request.get(`${BACKEND_URL}/scalar`, {
      headers: {
        Origin: 'http://malicious.example.com',
      },
    });

    // THEN: The Access-Control-Allow-Origin header is absent or does not match
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).not.toBe('http://malicious.example.com');
  });
});

// ---------------------------------------------------------------------------
// AC2 (extended): Clean Architecture solution structure inferred from API health
// ---------------------------------------------------------------------------

test.describe('AC2 (extended) - Clean Architecture projects referenced correctly', () => {
  test('should not expose any unhandled exception detail in error responses (ExceptionHandlingMiddleware)', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered in Program.cs
    // WHEN: A request is sent to a non-existent endpoint that would throw
    const response = await request.get(`${BACKEND_URL}/non-existent-route-that-should-404`);
    const status = response.status();

    // THEN: The status is a managed HTTP status (not 500 with raw exception details)
    // A 404 means routing worked; 400/405 means middleware is handling it correctly.
    // We also check that if it is 500, the body is a Problem Details shape (not raw exception)
    if (status === 500) {
      const body = await response.json();
      // Must be Problem Details RFC 7807 shape — no stack trace keys
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('title');
      expect(body).not.toHaveProperty('stackTrace');
      expect(body).not.toHaveProperty('exception');
    } else {
      // 404 is the expected behavior for undefined routes
      expect([400, 404, 405]).toContain(status);
    }
  });
});

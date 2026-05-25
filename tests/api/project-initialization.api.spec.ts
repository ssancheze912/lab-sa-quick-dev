/**
 * ATDD - Story 1.1: Project Initialization & Repository Structure
 * RED PHASE - These tests are expected to FAIL until implementation is complete.
 *
 * Acceptance Criteria covered:
 * - AC2: Backend starts on port 5000, Scalar API docs load at /scalar,
 *         4 Clean Architecture projects referenced correctly
 * - AC3: CORS allows requests from http://localhost:5173 without errors
 * - AC5: dotnet build succeeds with zero errors (reflected via API availability)
 *
 * Test level: API (HTTP-level verification of backend startup and CORS config)
 */

import { test, expect } from '@playwright/test';

const BACKEND_URL = 'http://localhost:5000';
const FRONTEND_ORIGIN = 'http://localhost:5173';

test.describe('Story 1.1 - Backend Initialization (AC2, AC3, AC5)', () => {
  test('AC2 - should respond on port 5000 when backend is running', async ({ request }) => {
    // GIVEN: The .NET backend has been started with `dotnet run` in SiesaAgents.API
    // WHEN: An HTTP request is made to the backend root
    const response = await request.get(`${BACKEND_URL}/`);

    // THEN: The server is reachable (any 2xx or redirect is acceptable at root)
    expect(response.status()).toBeLessThan(500);
  });

  test('AC2 - should serve the Scalar API documentation page at /scalar', async ({ request }) => {
    // GIVEN: The backend is running and Scalar is configured via app.MapScalarApiReference()
    // WHEN: A GET request is made to the /scalar endpoint
    const response = await request.get(`${BACKEND_URL}/scalar`);

    // THEN: The Scalar documentation page loads successfully (HTTP 200)
    expect(response.status()).toBe(200);
  });

  test('AC2 - Scalar page should return HTML content type', async ({ request }) => {
    // GIVEN: The backend is running with Scalar configured
    // WHEN: A GET request is made to /scalar
    const response = await request.get(`${BACKEND_URL}/scalar`);

    // THEN: The response is an HTML page (Scalar UI)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('text/html');
  });

  test('AC3 - should include CORS Allow-Origin header for requests from frontend origin', async ({ request }) => {
    // GIVEN: Both frontend (5173) and backend (5000) are running
    // WHEN: A cross-origin request is made from the frontend origin
    const response = await request.get(`${BACKEND_URL}/scalar`, {
      headers: {
        Origin: FRONTEND_ORIGIN,
      },
    });

    // THEN: The response includes the Access-Control-Allow-Origin header
    const corsHeader = response.headers()['access-control-allow-origin'];
    expect(corsHeader).toBe(FRONTEND_ORIGIN);
  });

  test('AC3 - should respond to CORS preflight OPTIONS request with 204 from frontend origin', async ({ request }) => {
    // GIVEN: The backend has CORS policy "DevCors" configured
    // WHEN: A CORS preflight OPTIONS request is sent from the frontend origin
    const response = await request.fetch(`${BACKEND_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: FRONTEND_ORIGIN,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: The preflight response is successful (200 or 204)
    expect([200, 204]).toContain(response.status());
  });

  test('AC3 - should NOT block requests from http://localhost:5173 with CORS errors', async ({ request }) => {
    // GIVEN: The CORS policy is configured to allow origin http://localhost:5173
    // WHEN: A request is made with the frontend origin header
    const response = await request.get(`${BACKEND_URL}/scalar`, {
      headers: {
        Origin: FRONTEND_ORIGIN,
      },
    });

    // THEN: The Access-Control-Allow-Origin is set (not missing, which would cause browser CORS error)
    expect(response.headers()['access-control-allow-origin']).toBeDefined();
  });

  test('AC2 - should NOT expose Swagger UI (only Scalar is permitted)', async ({ request }) => {
    // GIVEN: The backend is configured per architecture decision (no Swashbuckle/Swagger)
    // WHEN: A GET request is made to the /swagger endpoint
    const response = await request.get(`${BACKEND_URL}/swagger`);

    // THEN: Swagger is NOT available (404 expected — only Scalar is used)
    expect(response.status()).toBe(404);
  });

  test('AC5 - backend should be running and reachable (build succeeded)', async ({ request }) => {
    // GIVEN: dotnet build SiesaAgents.sln succeeded with zero errors
    // WHEN: The backend is started and a health check request is made
    const response = await request.get(`${BACKEND_URL}/scalar`);

    // THEN: The backend is responsive, proving the build was successful
    expect(response.ok()).toBe(true);
  });
});

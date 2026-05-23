import { test, expect } from '@playwright/test';

/**
 * Story 1.1 — Project Initialization & Repository Structure
 * AC 2: Backend on port 5000 with Scalar at /scalar
 * AC 4: CORS allows requests from localhost:5173
 *
 * These tests are in RED phase — they fail until the backend is initialized.
 * Test IDs: API-F-01, API-F-02, API-F-03
 */

const BACKEND_BASE = 'http://localhost:5000';
const FRONTEND_ORIGIN = 'http://localhost:5173';

test.describe('Story 1.1 — Backend Health & CORS', () => {
  /**
   * API-F-01 (P0 — AC 2)
   * Given the backend project has been created and dotnet run is executing
   * When a GET request is made to /scalar
   * Then the response status is 200 (Scalar API documentation page is reachable)
   */
  test('API-F-01 — GET /scalar retorna HTTP 200', async ({ request }) => {
    // network-first: direct API call, no navigation needed
    const response = await request.get(`${BACKEND_BASE}/scalar`);
    expect(response.status()).toBe(200);
  });

  /**
   * API-F-02 (P0 — AC 4)
   * Given both projects are running
   * When the frontend makes an OPTIONS preflight to the backend from origin localhost:5173
   * Then the response includes Access-Control-Allow-Origin: http://localhost:5173
   */
  test('API-F-02 — Preflight OPTIONS incluye cabecera CORS correcta', async ({ request }) => {
    // Simulate CORS preflight from frontend origin
    const response = await request.fetch(`${BACKEND_BASE}/api/v1/clientes`, {
      method: 'OPTIONS',
      headers: {
        Origin: FRONTEND_ORIGIN,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    const allowOrigin = response.headers()['access-control-allow-origin'];
    expect(allowOrigin).toBe(FRONTEND_ORIGIN);
  });

  /**
   * API-F-03 (P1 — NFR6)
   * Given an unhandled exception occurs in the backend
   * When a request hits a non-existent route or error path
   * Then the response uses application/problem+json format (RFC 7807)
   * And the body does not contain stackTrace or exception fields
   */
  test('API-F-03 — Ruta inexistente devuelve Problem Details sin stackTrace', async ({ request }) => {
    // Requesting a non-existent route to trigger Problem Details middleware
    const response = await request.get(`${BACKEND_BASE}/api/v1/ruta-que-no-existe`);

    // RFC 7807 requires 4xx or 5xx with content-type application/problem+json
    expect(response.status()).toBeGreaterThanOrEqual(400);

    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');

    const body = await response.json();
    // Problem Details must have status and title
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('title');

    // Must NOT expose stack traces
    expect(body).not.toHaveProperty('stackTrace');
    expect(body).not.toHaveProperty('exception');
    expect(body).not.toHaveProperty('traceId');

    // Detail field, if present, must not contain source code paths
    if (body.detail) {
      expect(body.detail).not.toMatch(/at\s+\w+.*\.(cs|dll)/);
    }
  });
});

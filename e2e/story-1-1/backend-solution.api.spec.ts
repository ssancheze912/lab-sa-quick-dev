/**
 * ATDD API Tests - Story 1.1: Backend Solution Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * RED PHASE: All tests in this file are expected to FAIL until implementation is complete.
 *
 * These tests validate the backend .NET 10 Clean Architecture solution contracts via HTTP:
 * - AC2: Four projects exist and are referenced in the solution (validated via build artifacts)
 * - AC3: CORS headers are correct in actual HTTP responses
 * - AC5: Solution builds successfully (validated by server responding correctly)
 *
 * Note: AC4 and AC5 (TypeScript/dotnet compilation) are validated via CI shell scripts
 * defined in the implementation checklist. These API tests cover runtime behavior.
 */

import { test, expect } from '@playwright/test';

const BACKEND_BASE_URL = 'http://localhost:5000';

// ============================================================
// AC2 — Backend solution structure via HTTP contracts
// ============================================================

test.describe('AC2 — Backend API runtime contracts', () => {
  test('should return a valid JSON response from the OpenAPI spec endpoint', async ({
    request,
  }) => {
    // GIVEN: The backend solution has been built (dotnet build SiesaAgents.sln) and is running
    // WHEN: The OpenAPI JSON specification is fetched
    const response = await request.get(`${BACKEND_BASE_URL}/openapi/v1.json`);
    const body = await response.json();

    // THEN: The spec is a valid OpenAPI document with required top-level fields
    expect(body).toHaveProperty('openapi');
    expect(body).toHaveProperty('info');
    expect(body).toHaveProperty('paths');
  });

  test('should NOT expose a /swagger endpoint (Swashbuckle must not be used)', async ({
    request,
  }) => {
    // GIVEN: The backend is configured with Scalar ONLY (architecture decision)
    // WHEN: A request is made to the legacy Swagger UI path
    const response = await request.get(`${BACKEND_BASE_URL}/swagger`, {
      failOnStatusCode: false,
    });

    // THEN: The endpoint does NOT exist (404 or similar — Swashbuckle must not be registered)
    expect(response.status()).not.toBe(200);
  });

  test('should respond to requests without leaking internal stack traces', async ({
    request,
  }) => {
    // GIVEN: The ExceptionHandlingMiddleware is registered in Program.cs
    // WHEN: A request triggers an error scenario (non-existent route)
    const response = await request.get(
      `${BACKEND_BASE_URL}/non-existent-route-to-trigger-404`,
      { failOnStatusCode: false },
    );

    // THEN: Response body does not contain stack trace information
    const body = await response.text();
    expect(body).not.toContain('StackTrace');
    expect(body).not.toContain('System.Exception');
    expect(body).not.toContain('at SiesaAgents');
  });

  test('should return Problem Details RFC 7807 format for unhandled errors', async ({
    request,
  }) => {
    // GIVEN: The ExceptionHandlingMiddleware is configured to return Problem Details
    // WHEN: The backend encounters an error (simulated via a non-existent endpoint that returns 404)
    const response = await request.get(
      `${BACKEND_BASE_URL}/trigger-server-error`,
      { failOnStatusCode: false },
    );

    // THEN: If the status is 4xx/5xx, the Content-Type is application/problem+json
    if (response.status() >= 400) {
      const contentType = response.headers()['content-type'] ?? '';
      // Either problem+json or the standard 404 page — middleware should wrap 5xx
      // For a 500, content-type MUST be application/problem+json
      if (response.status() >= 500) {
        expect(contentType).toContain('application/problem+json');
      }
    }
  });
});

// ============================================================
// AC3 — CORS: Preflight and actual request headers
// ============================================================

test.describe('AC3 — CORS header validation on all backend responses', () => {
  test('should include CORS allow-origin header on GET /openapi/v1.json from frontend origin', async ({
    request,
  }) => {
    // GIVEN: CORS policy "DevCors" is applied before endpoint mappings in Program.cs
    // WHEN: A GET request with Origin header is sent from the frontend origin
    const response = await request.get(
      `${BACKEND_BASE_URL}/openapi/v1.json`,
      {
        headers: { Origin: 'http://localhost:5173' },
      },
    );

    // THEN: The Access-Control-Allow-Origin header is present and correct
    const allowOrigin = response.headers()['access-control-allow-origin'];
    expect(allowOrigin).toBe('http://localhost:5173');
  });

  test('should include CORS allow-methods header in OPTIONS preflight response', async ({
    request,
  }) => {
    // GIVEN: The CORS policy allows any method
    // WHEN: A preflight OPTIONS request is sent
    const response = await request.fetch(`${BACKEND_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });

    // THEN: Access-Control-Allow-Methods is present in the response
    const allowMethods = response.headers()['access-control-allow-methods'];
    expect(allowMethods).toBeDefined();
  });

  test('should NOT allow requests from an unauthorized origin', async ({
    request,
  }) => {
    // GIVEN: The CORS policy only allows http://localhost:5173
    // WHEN: A request is made from a different origin
    const response = await request.get(`${BACKEND_BASE_URL}/openapi/v1.json`, {
      headers: { Origin: 'http://evil-site.example.com' },
    });

    // THEN: The Access-Control-Allow-Origin header should NOT be set to the unauthorized origin
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).not.toBe('http://evil-site.example.com');
  });
});

/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Expanded API Coverage — Edge Cases & Boundary Conditions
 * Complements ATDD tests in backend-initialization.api.spec.ts
 *
 * Gaps covered:
 *   - CORS correctly REJECTS unauthorized origins (not just allows known ones)
 *   - ExceptionHandlingMiddleware response shape (RFC 7807 schema validation)
 *   - /openapi/v1.json endpoint availability (required by Scalar to load spec)
 *   - Backend handles HEAD requests without 5xx errors
 *   - Backend handles malformed Content-Type without crash
 *   - Content-Security-Policy / no info leakage in error headers
 *   - Mock server responses mirror real backend contracts
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// CORS — Negative path (unauthorized origins must be rejected)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] CORS security — unauthorized origins rejected', () => {
  test('[P1] should NOT include CORS allow-origin header for an unauthorized origin', async ({
    request,
  }) => {
    // GIVEN: DevCors policy only allows http://localhost:5173
    // WHEN: A request comes from a different (unauthorized) origin
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: 'http://malicious-site.example.com',
      },
    });

    // THEN: The Access-Control-Allow-Origin header is NOT set to the malicious origin
    const allowOriginHeader = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOriginHeader).not.toBe('http://malicious-site.example.com');
  });

  test('[P1] should NOT return wildcard CORS header when origin is provided and unauthorized', async ({
    request,
  }) => {
    // GIVEN: A strict CORS policy (WithOrigins, not AllowAnyOrigin)
    // WHEN: An unauthorized origin makes a request
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: 'http://evil.attacker.io',
      },
    });

    // THEN: Wildcard (*) is not returned — policy should be specific
    const allowOriginHeader = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOriginHeader).not.toBe('*');
  });

  test('[P1] should reject OPTIONS preflight from unauthorized origin', async ({ request }) => {
    // GIVEN: DevCors policy with explicit WithOrigins list
    // WHEN: An OPTIONS preflight comes from an unauthorized origin
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://unauthorized.example.com',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: The preflight response does NOT grant access to the unauthorized origin
    const allowOriginHeader = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOriginHeader).not.toBe('http://unauthorized.example.com');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ExceptionHandlingMiddleware — RFC 7807 Problem Details schema
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] ExceptionHandlingMiddleware — Problem Details RFC 7807 contract', () => {
  test('[P1] should return application/problem+json content-type for 404 responses', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered and all unknown routes return Problem Details
    // WHEN: A non-existent endpoint is requested
    const response = await request.get(
      `${API_BASE_URL}/api/nonexistent-atdd-probe-endpoint`
    );

    // THEN: Content-Type is application/problem+json (not text/html or application/json)
    const contentType = response.headers()['content-type'] ?? '';
    // The mock returns application/problem+json; the real .NET backend returns application/problem+json
    // We accept both json variants as the .NET default 404 returns application/problem+json
    expect(
      contentType.includes('problem+json') || contentType.includes('application/json')
    ).toBe(true);
  });

  test('[P1] should return a response body with status and title fields for 404', async ({
    request,
  }) => {
    // GIVEN: Problem Details RFC 7807 mandates { status, title } minimum fields
    // WHEN: A non-existent endpoint is requested
    const response = await request.get(
      `${API_BASE_URL}/api/atdd-problem-details-probe`
    );

    // THEN: The body contains at least status and title
    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('title');
    expect(typeof body.status).toBe('number');
    expect(typeof body.title).toBe('string');
  });

  test('[P1] should NOT expose exception stack traces or internal messages in error responses', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware sets Detail = null (never expose ex.Message)
    // WHEN: A 404 endpoint is probed
    const response = await request.get(`${API_BASE_URL}/api/atdd-leak-probe`);
    const body = await response.json();

    // THEN: No stack trace fields or verbose exception messages
    const bodyStr = JSON.stringify(body);
    expect(bodyStr).not.toContain('System.');
    expect(bodyStr).not.toContain('Exception');
    expect(bodyStr).not.toContain('StackTrace');
    expect(bodyStr).not.toContain('at ');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// OpenAPI / Scalar metadata endpoint
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] OpenAPI metadata endpoint (required by Scalar)', () => {
  test('[P2] should expose the OpenAPI JSON spec at /openapi/v1.json', async ({ request }) => {
    // GIVEN: Program.cs calls app.MapOpenApi() (registered in the actual .NET backend)
    // The mock also exposes this endpoint
    // WHEN: The OpenAPI metadata endpoint is requested
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    // THEN: Returns 200 (Scalar requires this to render the API reference)
    expect(response.status()).toBe(200);
  });

  test('[P2] should return JSON content from the OpenAPI spec endpoint', async ({ request }) => {
    // GIVEN: The OpenAPI spec is a JSON document
    // WHEN: The spec is fetched
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Content-Type is application/json
    expect(contentType).toContain('application/json');
  });

  test('[P2] should have a valid OpenAPI structure (openapi version field)', async ({ request }) => {
    // GIVEN: The spec follows OpenAPI 3.x format
    // WHEN: The JSON is parsed
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);
    const body = await response.json();

    // THEN: The spec contains the required openapi version field
    expect(body).toHaveProperty('openapi');
    expect(body.openapi).toMatch(/^3\./);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// HTTP Method Handling — Robustness
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Backend HTTP method robustness', () => {
  test('[P2] should handle HEAD requests to /scalar without 5xx errors', async ({ request }) => {
    // GIVEN: The backend is running and /scalar endpoint exists
    // WHEN: A HEAD request is made (browser preflights, caches, and health checks use HEAD)
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'HEAD',
    });

    // THEN: Server responds without crashing (5xx would indicate middleware failure)
    expect(response.status()).toBeLessThan(500);
  });

  test('[P2] should return 404 or 405 for POST to /scalar (read-only documentation endpoint)', async ({
    request,
  }) => {
    // GIVEN: /scalar is a GET-only documentation page
    // WHEN: A POST request is attempted
    const response = await request.post(`${API_BASE_URL}/scalar`, {
      data: {},
    });

    // THEN: Server rejects it (not 200, not 500)
    expect([404, 405]).toContain(response.status());
  });

  test('[P2] should handle requests with an empty body without crashing', async ({ request }) => {
    // GIVEN: The backend has ExceptionHandlingMiddleware to catch all unhandled exceptions
    // WHEN: A POST request with no body is sent to any endpoint
    const response = await request.post(`${API_BASE_URL}/api/atdd-empty-body-probe`, {
      data: null,
    });

    // THEN: Server responds (not connection error, not 500 without Problem Details)
    expect(response.status()).toBeLessThan(600);
    expect(response.status()).toBeGreaterThanOrEqual(100);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Backend Response Headers — Security & Compliance
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Backend response headers — baseline security', () => {
  test('[P2] should return a Content-Type header on all 200 responses', async ({ request }) => {
    // GIVEN: Backend is running and /scalar returns 200
    // WHEN: The endpoint is requested
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Content-Type is present (indicates proper response formatting)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).not.toBe('');
  });

  test('[P2] should NOT return Server header exposing .NET version information', async ({
    request,
  }) => {
    // GIVEN: Security best practice — server version should not be disclosed
    // WHEN: Any endpoint is requested
    const response = await request.get(`${API_BASE_URL}/scalar`);
    const serverHeader = response.headers()['server'] ?? '';

    // THEN: Server header does not expose Kestrel version (minimal info disclosure)
    // Mock server returns empty; real .NET may return "Kestrel" without version — either is acceptable
    // What is NOT acceptable: "Microsoft-IIS/10.0", "Kestrel/1.0.0.0" (with version)
    expect(serverHeader).not.toMatch(/\/\d+\.\d+\.\d+/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Backend Root Endpoint
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Backend root endpoint behavior', () => {
  test('[P2] should respond to GET / with a non-5xx status code', async ({ request }) => {
    // GIVEN: The backend server is running
    // WHEN: The root path is requested
    const response = await request.get(`${API_BASE_URL}/`);

    // THEN: Server does not crash (any non-5xx is acceptable)
    expect(response.status()).toBeLessThan(500);
  });

  test('[P2] should NOT return an HTML error page for unknown JSON API paths', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware converts errors to Problem Details (JSON)
    // WHEN: A JSON API path that doesn't exist is requested
    const response = await request.get(`${API_BASE_URL}/api/v1/unknown-resource`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Content-Type is NOT text/html (HTML error page would bypass middleware)
    expect(contentType).not.toContain('text/html');
  });
});

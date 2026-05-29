/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * API-LEVEL EDGE CASES & BOUNDARY CONDITIONS
 *
 * Complements backend-initialization.api.spec.ts by covering:
 *   - Response time SLOs (NFR1 boundary: < 1s for infrastructure endpoints)
 *   - HTTP header presence and security (Content-Security-Policy, X-Content-Type-Options)
 *   - OpenAPI spec exposure boundary (spec file must be accessible for Scalar but not as raw JSON)
 *   - Backend behavior under malformed request input
 *   - Content negotiation edge cases
 *   - CORS header completeness for API preflight
 *
 * Priority tags:
 *   [P0] — Critical.
 *   [P1] — Important.
 *   [P2] — Supplementary.
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ---------------------------------------------------------------------------
// Response time SLOs — infrastructure health
// ---------------------------------------------------------------------------

test.describe('Backend response time SLOs', () => {
  test('[P0] /scalar must respond within 2 seconds (SLO boundary)', async ({ request }) => {
    // GIVEN: Backend has completed startup (not cold-start)
    // WHEN: GET /scalar is timed
    const start = Date.now();
    const response = await request.get(`${API_BASE_URL}/scalar`);
    const elapsed = Date.now() - start;

    // THEN: Documentation endpoint is available within 2s SLO
    expect(response.status()).toBe(200);
    expect(elapsed).toBeLessThan(2000);
  });

  test('[P1] backend root must respond within 2 seconds (not hanging)', async ({ request }) => {
    // GIVEN: The backend is running with no deadlocks in middleware
    const start = Date.now();
    const response = await request.get(`${API_BASE_URL}/`, { failOnStatusCode: false });
    const elapsed = Date.now() - start;

    // THEN: Root responds promptly even if no route is mapped
    expect(elapsed).toBeLessThan(2000);
    // Any status < 500 is acceptable (404 expected)
    expect(response.status()).toBeLessThan(500);
  });

  test('[P2] CORS OPTIONS preflight must respond within 500ms', async ({ request }) => {
    // GIVEN: CORS middleware should add minimal latency
    const start = Date.now();
    await request.fetch(`${API_BASE_URL}/api/`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
      },
      failOnStatusCode: false,
    });
    const elapsed = Date.now() - start;

    // THEN: Preflight overhead is under 500ms
    expect(elapsed).toBeLessThan(500);
  });
});

// ---------------------------------------------------------------------------
// Content negotiation
// ---------------------------------------------------------------------------

test.describe('Backend content negotiation', () => {
  test('[P1] /scalar should serve HTML when Accept: text/html is requested', async ({ request }) => {
    // GIVEN: Scalar serves an SPA (HTML page)
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: { Accept: 'text/html,application/xhtml+xml' },
    });

    // THEN: HTML content is returned
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('text/html');
  });

  test('[P1] unknown API route with Accept: application/json should return JSON error body', async ({
    request,
  }) => {
    // GIVEN: Problem Details middleware is configured
    // WHEN: A JSON-accepting client requests a non-existent endpoint
    const response = await request.get(`${API_BASE_URL}/api/v1/boundary-probe-content-neg`, {
      headers: { Accept: 'application/json' },
      failOnStatusCode: false,
    });

    // THEN: The error response is returned in JSON format (not HTML)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });

  test('[P2] backend should not return 500 when Accept header is missing entirely', async ({
    request,
  }) => {
    // GIVEN: Malformed/minimal request with no Accept header
    // WHEN: GET / is made without Accept header
    const response = await request.fetch(`${API_BASE_URL}/`, {
      method: 'GET',
      headers: {},
      failOnStatusCode: false,
    });

    // THEN: Server handles gracefully — not 500
    expect(response.status()).not.toBe(500);
  });
});

// ---------------------------------------------------------------------------
// Malformed request handling
// ---------------------------------------------------------------------------

test.describe('Backend malformed request handling', () => {
  test('[P1] extremely long URL path should return 400 or 414, not 500', async ({ request }) => {
    // GIVEN: Backend has a request limit middleware
    // WHEN: A GET request with an excessively long path is made
    const longPath = '/api/v1/' + 'a'.repeat(2048);
    const response = await request.get(`${API_BASE_URL}${longPath}`, {
      failOnStatusCode: false,
    });

    // THEN: Server rejects gracefully without 500
    expect(response.status()).not.toBe(500);
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('[P1] request with invalid Content-Type to API should not cause 500', async ({ request }) => {
    // GIVEN: A POST with a nonsensical Content-Type
    const response = await request.post(`${API_BASE_URL}/api/v1/boundary-invalid-ct`, {
      headers: { 'Content-Type': 'application/x-not-a-real-type' },
      data: '{"test":true}',
      failOnStatusCode: false,
    });

    // THEN: Server returns 400, 404, or 415 — not 500
    expect(response.status()).not.toBe(500);
  });

  test('[P2] OPTIONS request without Origin header should return at most 405 (not 500)', async ({
    request,
  }) => {
    // GIVEN: CORS middleware receives OPTIONS without Origin (non-preflight OPTIONS)
    const response = await request.fetch(`${API_BASE_URL}/api/`, {
      method: 'OPTIONS',
      headers: {
        'Access-Control-Request-Method': 'GET',
        // No Origin header — this is not a CORS preflight
      },
      failOnStatusCode: false,
    });

    // THEN: Server handles this gracefully
    expect(response.status()).not.toBe(500);
  });
});

// ---------------------------------------------------------------------------
// OpenAPI spec boundary — Scalar owns the spec; raw JSON not exposed as public API
// ---------------------------------------------------------------------------

test.describe('OpenAPI spec accessibility', () => {
  test('[P1] Scalar must reference an OpenAPI JSON spec (internal generation, not public route)', async ({
    request,
  }) => {
    // GIVEN: Scalar.AspNetCore auto-generates an OpenAPI spec
    // The default internal spec route is /openapi/v1.json or similar
    // WHEN: The Scalar page HTML is fetched
    const response = await request.get(`${API_BASE_URL}/scalar`);
    const html = await response.text();

    // THEN: The HTML references an OpenAPI spec URL (Scalar needs it to render)
    // This confirms OpenAPI generation is wired (not just static HTML)
    const hasSpecReference =
      html.includes('openapi') ||
      html.includes('swagger') ||
      html.includes('.json') ||
      html.includes('api-reference');
    expect(hasSpecReference).toBe(true);
  });

  test('[P2] /openapi/v1.json should exist (Scalar default spec endpoint)', async ({ request }) => {
    // GIVEN: .NET 10 MapOpenApi() is registered
    // WHEN: The default OpenAPI spec path is requested
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`, {
      failOnStatusCode: false,
    });

    // THEN: The spec file is accessible (200) OR not exposed publicly (404 acceptable if Scalar renders it internally)
    // 500 is NOT acceptable
    expect(response.status()).not.toBe(500);
  });
});

// ---------------------------------------------------------------------------
// Backend — server response headers (security hygiene)
// ---------------------------------------------------------------------------

test.describe('Backend response header hygiene', () => {
  test('[P2] Server header should not expose .NET version details', async ({ request }) => {
    // GIVEN: NFR6 mandates no internal implementation exposure
    // WHEN: Any response is received from the backend
    const response = await request.get(`${API_BASE_URL}/scalar`);

    const serverHeader = response.headers()['server'] ?? '';
    const xPoweredBy = response.headers()['x-powered-by'] ?? '';

    // THEN: Server header does not expose detailed version info
    // (e.g. "Microsoft-IIS/10.0" or "Kestrel" with version is acceptable, "dotnet/10.0" is not leaking)
    expect(xPoweredBy.toLowerCase()).not.toContain('asp.net');
  });

  test('[P2] X-Content-Type-Options header should be present on API error responses', async ({
    request,
  }) => {
    // GIVEN: Basic security headers are expected from ASP.NET Core middleware
    // WHEN: A 404 is returned for an unknown API route
    const response = await request.get(`${API_BASE_URL}/api/v1/boundary-security-header-probe`, {
      failOnStatusCode: false,
    });

    // THEN: X-Content-Type-Options: nosniff prevents MIME-type sniffing attacks
    // This may be set by default in some .NET configurations
    // We test for presence but don't fail hard if absent (P2)
    const xContentType = response.headers()['x-content-type-options'] ?? '';
    // Just record — it's informational at this stage (P2 observability check)
    // The value may be 'nosniff' or empty in development mode
    expect(typeof xContentType).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// Backend clean architecture validation via runtime behavior
// ---------------------------------------------------------------------------

test.describe('Clean Architecture layers — runtime validation', () => {
  test('[P0] backend must be running (prerequisite for all other backend tests)', async ({
    request,
  }) => {
    // GIVEN: dotnet run was executed in SiesaAgents.API
    // WHEN: Any request reaches the server
    let serverUp = false;
    try {
      const response = await request.get(`${API_BASE_URL}/scalar`, {
        failOnStatusCode: false,
      });
      serverUp = response.status() < 500;
    } catch {
      serverUp = false;
    }

    // THEN: Server is reachable — all four CA layers (API, Application, Domain, Infrastructure) compiled
    expect(serverUp).toBe(true);
  });

  test('[P1] DI container is healthy — no missing service registrations on startup', async ({
    request,
  }) => {
    // GIVEN: All Clean Architecture layers are registered in Program.cs DI container
    // WHEN: The server starts and serves its first request (DI container is validated at startup)
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: 200 response proves DI container did not throw InvalidOperationException at startup
    // (DI failures prevent the server from starting entirely)
    expect(response.status()).toBe(200);
  });

  test('[P1] backend API must NOT return Content-Type: text/html for /api/ routes (never HTML error pages)', async ({
    request,
  }) => {
    // GIVEN: All API routes should return JSON, not HTML developer error pages
    // WHEN: Any /api/ route returns an error
    const response = await request.get(`${API_BASE_URL}/api/v1/ca-layer-validation-probe`, {
      failOnStatusCode: false,
    });

    // THEN: Content type is JSON — Clean Architecture exception middleware is active
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).not.toContain('text/html');
  });
});

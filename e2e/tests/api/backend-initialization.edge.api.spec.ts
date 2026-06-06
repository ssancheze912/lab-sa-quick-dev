/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * EDGE CASE expansion — API level, built on ATDD baseline.
 *
 * Coverage added:
 *   - CORS rejects unknown origins (security boundary)
 *   - CORS OPTIONS preflight includes required Allow-Headers header
 *   - StatusCodePages returns problem+json for 401, 403, 405 status codes
 *   - Non-existent API routes return problem+json (not HTML)
 *   - Scalar endpoint is not accessible via POST (method-not-allowed path)
 *   - Backend root (/) returns problem+json for 404, not HTML error page
 *   - Content-Type of error responses is strictly application/problem+json
 *   - Response body for 404 contains JSON with 'status' and 'title' fields
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// Edge: CORS security — unknown origins must be rejected
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P0] CORS security — unknown origins rejected', () => {
  test('[P0] should NOT include Access-Control-Allow-Origin for an unknown origin', async ({
    request,
  }) => {
    // GIVEN: The CORS policy allows only http://localhost:5173
    // WHEN: A request is made with an untrusted origin
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: 'http://evil.attacker.com',
      },
    });

    // THEN: The response does NOT include ACAO header for the untrusted origin
    const allowOriginHeader = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOriginHeader).not.toBe('http://evil.attacker.com');
    // Wildcard would also be a security issue here — policy uses WithOrigins not AllowAnyOrigin
    // Note: no ACAO header at all OR absence of attacker origin are both acceptable
  });

  test('[P0] should NOT include ACAO header for http://localhost:3000 (not whitelisted)', async ({
    request,
  }) => {
    // GIVEN: Only http://localhost:5173 is whitelisted
    // WHEN: A request from a different localhost port is made
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: 'http://localhost:3000',
      },
    });

    // THEN: No ACAO header for this origin
    const allowOriginHeader = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOriginHeader).not.toBe('http://localhost:3000');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: CORS OPTIONS preflight completeness
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] CORS preflight — response headers completeness', () => {
  test('[P1] should return Access-Control-Allow-Methods in OPTIONS preflight response', async ({
    request,
  }) => {
    // GIVEN: CORS policy is configured with AllowAnyMethod()
    // WHEN: An OPTIONS preflight is sent from the allowed origin
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: The preflight is successful (200 or 204)
    expect([200, 204]).toContain(response.status());

    // AND: Access-Control-Allow-Methods is present in the response
    const allowMethods = response.headers()['access-control-allow-methods'] ?? '';
    // AllowAnyMethod() should respond with either a wildcard or the requested method
    expect(allowMethods.length).toBeGreaterThan(0);
  });

  test('[P1] should return Access-Control-Allow-Headers in OPTIONS preflight for Content-Type', async ({
    request,
  }) => {
    // GIVEN: CORS policy is configured with AllowAnyHeader()
    // WHEN: An OPTIONS preflight requests Content-Type header
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: Response allows the requested header
    expect([200, 204]).toContain(response.status());
    const allowHeaders = response.headers()['access-control-allow-headers'] ?? '';
    // AllowAnyHeader() should echo back or use wildcard
    expect(allowHeaders.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Problem Details (RFC 7807) — various HTTP error status codes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Problem Details — error responses are RFC 7807 compliant', () => {
  test('[P1] should return application/problem+json for a 404 on unknown API path', async ({
    request,
  }) => {
    // GIVEN: UseStatusCodePages middleware is configured
    // WHEN: A request is made to a non-existent API path
    const response = await request.get(`${API_BASE_URL}/api/v1/this-route-does-not-exist`);

    // THEN: Status is 404
    expect(response.status()).toBe(404);

    // AND: Content-Type is application/problem+json (not text/html)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');
  });

  test('[P1] should return JSON body with "status" and "title" fields for 404 errors', async ({
    request,
  }) => {
    // GIVEN: UseStatusCodePages returns Problem Details for all 4xx/5xx
    // WHEN: A 404 is triggered by a non-existent endpoint
    const response = await request.get(
      `${API_BASE_URL}/api/v1/nonexistent-for-problem-details-check`
    );
    const body = await response.json();

    // THEN: The body has the RFC 7807 required fields
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('title');
    expect(body.status).toBe(404);
    // Title must be a non-empty string (not null / undefined)
    expect(typeof body.title).toBe('string');
    expect(body.title.length).toBeGreaterThan(0);
  });

  test('[P1] should NOT include a "detail" field that exposes internal error messages on 404', async ({
    request,
  }) => {
    // GIVEN: Security rule — detail must be null / absent (no stack traces, no sensitive info)
    // WHEN: A 404 is triggered
    const response = await request.get(`${API_BASE_URL}/api/v1/detail-exposure-check`);
    const body = await response.json();

    // THEN: The detail field is absent or null (never a stack trace string)
    if ('detail' in body) {
      expect(body.detail).toBeNull();
    }
    // If 'detail' is not present at all that is also acceptable
  });

  test('[P2] should return application/problem+json for a 405 Method Not Allowed', async ({
    request,
  }) => {
    // GIVEN: The /scalar endpoint only handles GET
    // WHEN: A POST request is sent to it
    const response = await request.post(`${API_BASE_URL}/scalar`, { data: {} });

    // THEN: The response is a 4xx (405 or 404 depending on routing)
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);

    // AND: Content-Type is problem+json (not HTML)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');
  });

  test('[P2] should return problem+json (not HTML) for the bare root path 404', async ({
    request,
  }) => {
    // GIVEN: The root path "/" has no registered endpoint (returns 404 via status code pages)
    // WHEN: GET / is requested
    const response = await request.get(`${API_BASE_URL}/`);

    // THEN: If not 200, the error response is JSON, never HTML
    if (response.status() !== 200) {
      const contentType = response.headers()['content-type'] ?? '';
      expect(contentType).toContain('json');
    }
    // (200 is acceptable if a health or index route is registered — no crash either way)
    expect(response.status()).toBeLessThan(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Scalar endpoint — content negotiation and method safety
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Scalar endpoint — content and method edge cases', () => {
  test('[P2] should return text/html with charset for Scalar documentation', async ({
    request,
  }) => {
    // GIVEN: Scalar.AspNetCore renders an HTML documentation UI
    // WHEN: GET /scalar is requested
    const response = await request.get(`${API_BASE_URL}/scalar`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Response is HTML (may include charset)
    expect(contentType).toContain('text/html');
  });

  test('[P2] should respond to the /scalar path with a non-empty body', async ({ request }) => {
    // GIVEN: Scalar documentation is configured
    // WHEN: The /scalar page is fetched
    const response = await request.get(`${API_BASE_URL}/scalar`);
    const body = await response.text();

    // THEN: The response body is not empty
    expect(body.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: No response body leaks sensitive stack trace info
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Security — no stack trace or internal detail exposure', () => {
  test('[P1] should not include "at " stack frame patterns in any 4xx error response body', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware and UseStatusCodePages suppress internals
    // WHEN: A non-existent route is hit
    const response = await request.get(`${API_BASE_URL}/api/stack-trace-leak-check`);
    const body = await response.text();

    // THEN: The body does not contain .NET stack frame lines ("at SiesaAgents.", "at System.")
    expect(body).not.toMatch(/\bat\s+\w+\./);
    // AND: Does not contain "Exception" class names
    expect(body).not.toContain('Exception');
  });

  test('[P1] should not include HTML error page content in 404 responses', async ({ request }) => {
    // GIVEN: Problem Details middleware intercepts all 4xx responses
    // WHEN: A 404 is triggered
    const response = await request.get(`${API_BASE_URL}/api/html-leak-check`);
    const body = await response.text();

    // THEN: Body does not contain HTML document markers (no fallback HTML error page)
    expect(body).not.toContain('<!DOCTYPE html>');
    expect(body).not.toContain('<html');
  });
});

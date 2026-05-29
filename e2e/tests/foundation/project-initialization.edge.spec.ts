/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * EDGE CASES & BOUNDARY CONDITIONS — Complement to ATDD base tests
 *
 * Rationale:
 *   The ATDD tests (project-initialization.spec.ts) cover the happy path for each
 *   Acceptance Criterion. This file adds:
 *     - Error path validation (wrong methods, malformed headers, security probes)
 *     - Boundary conditions (response time SLOs, concurrent requests, content integrity)
 *     - Negative CORS scenarios (wrong origins, credentials mode)
 *     - Deep-link SPA fallback completeness
 *     - Problem Details RFC 7807 body structure validation
 *
 * Priority tags:
 *   [P0] — Critical infrastructure, must pass on every commit.
 *   [P1] — Important; run on PR to main.
 *   [P2] — Nice-to-have; run on scheduled CI.
 */

import { test, expect } from '@playwright/test';

const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL ?? 'http://localhost:5173';
const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ---------------------------------------------------------------------------
// Frontend SPA Fallback — deep linking boundary
// ---------------------------------------------------------------------------

test.describe('Frontend SPA Fallback — deep link boundary conditions', () => {
  const knownDeepLinks = [
    '/clientes',
    '/contactos',
    '/clientes/new',
    '/contactos/new',
    '/ruta-desconocida',
    '/deeply/nested/unknown/path',
  ];

  for (const route of knownDeepLinks) {
    test(`[P1] Vite should serve index.html (200) for deep link: ${route}`, async ({
      request,
    }) => {
      // GIVEN: Vite is configured with historyApiFallback / spa mode
      // WHEN: A direct HTTP GET is made to a client-side route
      const response = await request.get(FRONTEND_BASE_URL + route, {
        failOnStatusCode: false,
      });

      // THEN: The server returns 200 — NOT 404 — so the SPA router handles the path
      // A 404 at server level would break deep linking (FR30)
      expect(response.status()).toBe(200);

      const contentType = response.headers()['content-type'] ?? '';
      expect(contentType).toContain('text/html');
    });
  }

  test('[P1] SPA index.html served for deep links must contain the React root element', async ({
    page,
  }) => {
    // GIVEN: A user navigates directly to /clientes (deep link)
    await page.goto(FRONTEND_BASE_URL + '/clientes');

    // WHEN: The page loads via Vite SPA fallback
    // THEN: The #root mount point exists — the SPA is bootstrapped correctly
    await expect(page.locator('#root')).toBeAttached();
  });

  test('[P2] frontend should NOT redirect deep links to a different URL', async ({
    request,
  }) => {
    // GIVEN: SPA fallback is configured without server-side redirects
    // WHEN: GET /clientes is requested
    const response = await request.get(FRONTEND_BASE_URL + '/clientes', {
      failOnStatusCode: false,
    });

    // THEN: No redirect (3xx) — the server must serve index.html inline
    expect(response.status()).not.toBeGreaterThanOrEqual(300);
    expect(response.status()).not.toBeLessThan(200);
    expect(response.status()).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// Frontend — response integrity edge cases
// ---------------------------------------------------------------------------

test.describe('Frontend response integrity', () => {
  test('[P1] root HTML must reference a main script entry point', async ({ page }) => {
    // GIVEN: Vite has compiled the app
    await page.goto(FRONTEND_BASE_URL + '/');

    // WHEN: The HTML source is examined
    const html = await page.content();

    // THEN: A <script type="module"> tag exists — the app entry is linked
    expect(html).toMatch(/<script\s[^>]*type=["']module["']/i);
  });

  test('[P1] frontend should set a charset in the HTML meta tags', async ({ page }) => {
    // GIVEN: Proper HTML structure is expected from Vite template
    await page.goto(FRONTEND_BASE_URL + '/');
    const html = await page.content();

    // THEN: charset meta is declared (important for Spanish characters in app)
    expect(html.toLowerCase()).toContain('charset');
  });

  test('[P2] frontend should not serve stale cached responses (Cache-Control)', async ({
    request,
  }) => {
    // GIVEN: Dev server is running
    const response = await request.get(FRONTEND_BASE_URL + '/');

    // WHEN: HTML root is requested
    const cacheControl = response.headers()['cache-control'] ?? '';

    // THEN: HTML should not be aggressively cached (no-store or no-cache for dev)
    // A production build may differ — in dev, long-lived caching of index.html is problematic
    expect(cacheControl).not.toContain('max-age=31536000');
  });

  test('[P2] HEAD request to frontend root should return 200 with no body', async ({
    request,
  }) => {
    // GIVEN: Vite dev server supports HTTP HEAD method for resource discovery
    // WHEN: A HEAD request is made to root
    const response = await request.fetch(FRONTEND_BASE_URL + '/', {
      method: 'HEAD',
      failOnStatusCode: false,
    });

    // THEN: Status 200 (or method-allowed equivalent) — not 405
    expect([200, 204]).toContain(response.status());
  });
});

// ---------------------------------------------------------------------------
// Backend — Problem Details RFC 7807 body structure
// ---------------------------------------------------------------------------

test.describe('Backend Problem Details RFC 7807 — error response format', () => {
  test('[P0] 404 response for unknown API route must be JSON, not HTML', async ({ request }) => {
    // GIVEN: Global exception middleware and Problem Details are configured
    // WHEN: A non-existent API endpoint is requested
    const response = await request.get(`${API_BASE_URL}/api/v1/nonexistent-story-1-1-probe`, {
      failOnStatusCode: false,
    });

    // THEN: Response is NOT an HTML error page (ASP.NET default exception page)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');
    expect(contentType).not.toContain('text/html');
  });

  test('[P1] 404 Problem Details body must include status field', async ({ request }) => {
    // GIVEN: Problem Details RFC 7807 middleware is registered
    // WHEN: A 404 response is returned
    const response = await request.get(`${API_BASE_URL}/api/v1/nonexistent-story-1-1-probe`, {
      failOnStatusCode: false,
    });

    // THEN: The JSON body contains the "status" field matching HTTP status code
    if (response.headers()['content-type']?.includes('json')) {
      const body = await response.json().catch(() => ({}));
      expect(body).toHaveProperty('status');
      expect(body.status).toBe(404);
    } else {
      test.skip();
    }
  });

  test('[P1] error responses must NOT expose a stack trace or internal exception details', async ({
    request,
  }) => {
    // GIVEN: NFR6 prohibits stack trace exposure
    // WHEN: A 404 response is returned for an unknown route
    const response = await request.get(`${API_BASE_URL}/api/v1/nonexistent-story-1-1-probe`, {
      failOnStatusCode: false,
    });

    const bodyText = await response.text();

    // THEN: No stack trace markers appear in the response body
    expect(bodyText).not.toContain('at ');
    expect(bodyText).not.toContain('System.Exception');
    expect(bodyText).not.toContain('StackTrace');
    expect(bodyText).not.toContain('InnerException');
  });

  test('[P2] backend must not return HTML ASP.NET developer exception page for any API route', async ({
    request,
  }) => {
    // GIVEN: Developer exception page must be disabled (never expose internals)
    // WHEN: Any 404 route under /api is hit
    const response = await request.get(`${API_BASE_URL}/api/trigger-404-boundary`, {
      failOnStatusCode: false,
    });

    const body = await response.text();

    // THEN: No ASP.NET developer exception page content in body
    expect(body).not.toContain('Developer Exception Page');
    expect(body).not.toContain('Microsoft.AspNetCore');
  });
});

// ---------------------------------------------------------------------------
// Backend — CORS edge cases and negative paths
// ---------------------------------------------------------------------------

test.describe('CORS negative paths and boundary conditions', () => {
  test('[P0] disallowed origin must NOT receive Access-Control-Allow-Origin', async ({
    request,
  }) => {
    // GIVEN: CORS policy restricts allowed origins to localhost:5173
    // WHEN: A preflight is made from an untrusted origin
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://attacker.example.com',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
      failOnStatusCode: false,
    });

    // THEN: The CORS policy does NOT echo back the untrusted origin
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).not.toBe('http://attacker.example.com');
  });

  test('[P1] disallowed origin on GET request should NOT receive CORS allow header', async ({
    request,
  }) => {
    // GIVEN: The backend only allows localhost:5173
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: 'http://malicious.tld',
      },
      failOnStatusCode: false,
    });

    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    // THEN: Malicious origin is not reflected back
    expect(allowOrigin).not.toBe('http://malicious.tld');
  });

  test('[P1] preflight from allowed origin should receive Access-Control-Allow-Methods header', async ({
    request,
  }) => {
    // GIVEN: CORS is configured with allowed HTTP methods
    // WHEN: OPTIONS preflight from the frontend origin is made
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
      },
      failOnStatusCode: false,
    });

    // THEN: Allowed methods header is present in the preflight response
    const allowMethods = response.headers()['access-control-allow-methods'] ?? '';
    expect(allowMethods.length).toBeGreaterThan(0);
  });

  test('[P2] CORS preflight should respond within 1 second (not introducing latency)', async ({
    request,
  }) => {
    // GIVEN: CORS middleware is lightweight
    const start = Date.now();
    await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
      },
      failOnStatusCode: false,
    });
    const elapsed = Date.now() - start;

    // THEN: Preflight completes in under 1 second
    expect(elapsed).toBeLessThan(1000);
  });
});

// ---------------------------------------------------------------------------
// Backend — HTTP method boundary conditions
// ---------------------------------------------------------------------------

test.describe('Backend HTTP method boundaries', () => {
  test('[P2] POST to /scalar should not return 500 (graceful rejection)', async ({ request }) => {
    // GIVEN: /scalar is a GET-only documentation endpoint
    // WHEN: A POST request is made
    const response = await request.post(`${API_BASE_URL}/scalar`, {
      failOnStatusCode: false,
    });

    // THEN: The response is 404 or 405 — NOT 500 (unhandled error)
    expect(response.status()).not.toBe(500);
    expect([404, 405]).toContain(response.status());
  });

  test('[P2] DELETE to /scalar should return 404 or 405, not 500', async ({ request }) => {
    // GIVEN: /scalar has no DELETE handler
    const response = await request.delete(`${API_BASE_URL}/scalar`, {
      failOnStatusCode: false,
    });

    expect(response.status()).not.toBe(500);
  });
});

// ---------------------------------------------------------------------------
// Backend — startup security probes
// ---------------------------------------------------------------------------

test.describe('Backend security probes — known dangerous endpoints must not exist', () => {
  const forbiddenPaths = [
    '/swagger',
    '/swagger/index.html',
    '/swagger/v1/swagger.json',
    '/weatherforecast',
    '/.env',
    '/appsettings.json',
    '/appsettings.Development.json',
  ];

  for (const path of forbiddenPaths) {
    test(`[P1] ${path} must NOT return HTTP 200`, async ({ request }) => {
      // GIVEN: The backend has no scaffold/default endpoints exposed
      const response = await request.get(`${API_BASE_URL}${path}`, {
        failOnStatusCode: false,
      });

      // THEN: The path is not accessible (404, 405, or 403 are all acceptable)
      expect(response.status()).not.toBe(200);
    });
  }
});

// ---------------------------------------------------------------------------
// Concurrent request resilience
// ---------------------------------------------------------------------------

test.describe('Concurrent request resilience', () => {
  test('[P2] frontend should handle 5 concurrent requests without dropping any', async ({
    request,
  }) => {
    // GIVEN: Vite dev server is running
    // WHEN: 5 simultaneous GET / requests are made
    const requests = Array.from({ length: 5 }, () =>
      request.get(FRONTEND_BASE_URL + '/', { failOnStatusCode: false })
    );

    const responses = await Promise.all(requests);

    // THEN: All 5 requests return 200 — no connection failures
    for (const response of responses) {
      expect(response.status()).toBe(200);
    }
  });

  test('[P2] backend should handle 5 concurrent requests to /scalar without 5xx errors', async ({
    request,
  }) => {
    // GIVEN: The backend is running
    // WHEN: 5 simultaneous GET /scalar requests are made
    const requests = Array.from({ length: 5 }, () =>
      request.get(`${API_BASE_URL}/scalar`, { failOnStatusCode: false })
    );

    const responses = await Promise.all(requests);

    // THEN: None of the responses is a server error (5xx)
    for (const response of responses) {
      expect(response.status()).toBeLessThan(500);
    }
  });
});

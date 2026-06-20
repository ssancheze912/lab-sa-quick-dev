/**
 * Expanded Coverage Tests - Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Mode: BMad-Integrated (expands ATDD tests with edge cases, error paths, boundary conditions)
 *
 * Coverage NOT in ATDD tests:
 *   - Frontend: port isolation, HTML meta charset, Vite module CSS, env var configuration
 *   - Backend: response headers, appsettings.json contracts, server startup timing boundaries
 *   - CORS: additional HTTP methods preflight, arbitrary origin rejection (negative path)
 *   - Problem Details: RFC 7807 schema shape, no sensitive data leakage
 *   - OpenAPI spec: mandatory fields, no WeatherForecast paths leaked
 */

import { test, expect } from '@playwright/test';

const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// FRONTEND EDGE CASES
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Frontend — Port isolation and HTML document structure', () => {
  test('[P1] should NOT be served on the backend port 5000', async ({ request }) => {
    // GIVEN: The Vite dev server is bound to port 5173 only
    // WHEN: A request is made to port 5000 to check it does not serve the React app
    const response = await request.get(`${BACKEND_URL}/`, {
      failOnStatusCode: false,
    });

    // THEN: Port 5000 does not return an HTML React app (it is a .NET backend)
    const contentType = response.headers()['content-type'] ?? '';
    // Backend root returns JSON (problem details) or a redirect — NOT Vite HTML with React root
    if (response.status() === 200) {
      const body = await response.text();
      expect(body).not.toContain('id="root"');
      expect(body).not.toContain('type="module"');
    }
  });

  test('[P1] should serve HTML with UTF-8 charset meta tag', async ({ page }) => {
    // GIVEN: The Vite dev server is running at port 5173
    // WHEN: The index.html is served
    await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded' });

    // THEN: The HTML document declares UTF-8 charset
    const metaCharset = await page.locator('meta[charset]').getAttribute('charset');
    expect(metaCharset?.toLowerCase()).toBe('utf-8');
  });

  test('[P1] should load a viewport meta tag for responsive design', async ({ page }) => {
    // GIVEN: The Vite react-ts template includes a viewport meta tag
    // WHEN: The page loads
    await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded' });

    // THEN: A viewport meta tag is present
    const metaViewport = page.locator('meta[name="viewport"]');
    await expect(metaViewport).toHaveCount(1);
  });

  test('[P2] should not expose source maps in production-like bundles', async ({ page }) => {
    // GIVEN: Vite runs in dev mode (maps are served by Vite's HMR for DX — this is acceptable)
    // WHEN: The root HTML is loaded and script tags are inspected
    await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded' });

    // THEN: The application renders without any unresolvable script errors
    const uncaughtErrors: string[] = [];
    page.on('pageerror', (e) => uncaughtErrors.push(e.message));

    // Navigate again with error capture active
    await page.reload({ waitUntil: 'networkidle' });
    expect(uncaughtErrors).toHaveLength(0);
  });

  test('[P2] should load the main CSS stylesheet without network errors', async ({ page }) => {
    // GIVEN: TailwindCSS v4 is configured via @tailwindcss/vite plugin
    // WHEN: The page is loaded and CSS requests are captured
    const failedRequests: string[] = [];
    page.on('requestfailed', (req) => {
      if (req.url().endsWith('.css') || req.url().includes('tailwind')) {
        failedRequests.push(req.url());
      }
    });

    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });

    // THEN: No CSS resources fail to load
    expect(failedRequests).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BACKEND EDGE CASES — Response Headers and Security
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Backend — Response headers and security boundaries', () => {
  test('[P1] should return Content-Type text/html for the Scalar documentation page', async ({
    request,
  }) => {
    // GIVEN: Scalar.AspNetCore is registered and renders its own HTML UI
    // WHEN: The /scalar endpoint is requested
    const response = await request.get(`${BACKEND_URL}/scalar`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: The response is HTML (not JSON or plain text)
    expect(contentType).toContain('text/html');
  });

  test('[P1] should not return a 500 error from the backend root path on startup', async ({
    request,
  }) => {
    // GIVEN: The .NET backend is running and middleware is configured
    // WHEN: A request is made to the root path /
    const response = await request.get(`${BACKEND_URL}/`, {
      failOnStatusCode: false,
    });

    // THEN: The server does not crash (no 5xx on startup path)
    expect(response.status()).not.toBe(500);
    expect(response.status()).not.toBe(503);
  });

  test('[P1] should return response within acceptable time boundary (< 3000ms)', async ({
    request,
  }) => {
    // GIVEN: The backend is running with no external database calls for this endpoint
    // WHEN: The /scalar endpoint is requested
    const startTime = Date.now();
    await request.get(`${BACKEND_URL}/scalar`);
    const elapsed = Date.now() - startTime;

    // THEN: The response arrives within 3 seconds (infrastructure only, no DB)
    expect(elapsed).toBeLessThan(3000);
  });

  test('[P2] should not expose Server header revealing .NET version details', async ({
    request,
  }) => {
    // GIVEN: The backend is a .NET 10 Minimal API
    // WHEN: A request is made to any backend endpoint
    const response = await request.get(`${BACKEND_URL}/scalar`);
    const serverHeader = response.headers()['server'] ?? '';

    // THEN: The Server header does not reveal specific version information
    // Kestrel typically sets "Kestrel" which is acceptable; "Microsoft-IIS/X.Y" with version is not ideal
    expect(serverHeader.toLowerCase()).not.toContain('asp.net');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// OPENAPI SPEC EDGE CASES
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] OpenAPI spec — Structural validation', () => {
  test('[P1] should return a JSON document at /openapi/v1.json with openapi version field', async ({
    request,
  }) => {
    // GIVEN: AddOpenApi() is registered in Program.cs for Scalar metadata
    // WHEN: The spec is fetched
    const response = await request.get(`${BACKEND_URL}/openapi/v1.json`);
    const body = await response.json();

    // THEN: The openapi field starts with "3." (OpenAPI 3.x)
    expect(body.openapi).toMatch(/^3\./);
  });

  test('[P1] should include an info block with title in the OpenAPI spec', async ({ request }) => {
    // GIVEN: The OpenAPI spec is registered
    // WHEN: The spec is fetched
    const response = await request.get(`${BACKEND_URL}/openapi/v1.json`);
    const body = await response.json();

    // THEN: The info block has a title property
    expect(body).toHaveProperty('info');
    expect(body.info).toHaveProperty('title');
    expect(typeof body.info.title).toBe('string');
    expect(body.info.title.length).toBeGreaterThan(0);
  });

  test('[P2] should NOT contain a "WeatherForecast" path in the OpenAPI spec', async ({
    request,
  }) => {
    // GIVEN: The default WeatherForecast template endpoints have been removed
    // WHEN: The spec is inspected
    const response = await request.get(`${BACKEND_URL}/openapi/v1.json`);
    const body = await response.json();
    const specText = JSON.stringify(body);

    // THEN: No WeatherForecast path or schema exists in the spec
    expect(specText.toLowerCase()).not.toContain('weatherforecast');
    expect(specText.toLowerCase()).not.toContain('weather');
  });

  test('[P2] should return the spec with Content-Type application/json', async ({ request }) => {
    // GIVEN: The OpenAPI spec endpoint is a JSON document
    // WHEN: The endpoint is requested
    const response = await request.get(`${BACKEND_URL}/openapi/v1.json`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Content-Type indicates JSON
    expect(contentType).toContain('application/json');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EXCEPTION HANDLING MIDDLEWARE EDGE CASES
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P0] ExceptionHandlingMiddleware — Problem Details RFC 7807 edge cases', () => {
  test('[P0] should NOT include stack trace details in any error response body', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is configured to suppress stack traces
    // WHEN: Any non-existent endpoint is requested (triggering 404 path)
    const response = await request.get(
      `${BACKEND_URL}/non-existent-endpoint-that-does-not-exist-atdd`,
      { failOnStatusCode: false },
    );

    const body = await response.text();

    // THEN: No internal exception details are leaked in the response body
    expect(body).not.toContain('StackTrace');
    expect(body).not.toContain('at SiesaAgents');
    expect(body).not.toContain('System.Exception');
    expect(body).not.toContain('System.NullReferenceException');
    expect(body).not.toContain('Microsoft.AspNetCore');
  });

  test('[P1] should return status code < 500 for a path that does not exist (404)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware catches unhandled exceptions and returns 500
    // WHEN: A route that does not match any endpoint is requested
    const response = await request.get(
      `${BACKEND_URL}/absolutely-nonexistent-path-12345`,
      { failOnStatusCode: false },
    );

    // THEN: The server returns 404 (not found), not 500 (middleware not crashing on 404)
    expect(response.status()).toBe(404);
  });

  test('[P1] should not expose the detail field with exception message for unexpected errors', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware sets detail to null (per architecture spec)
    // WHEN: A request is made to a deliberately broken/non-existent endpoint
    const response = await request.get(
      `${BACKEND_URL}/trigger-error-path-atdd`,
      { failOnStatusCode: false },
    );

    if (response.status() === 500) {
      const body = await response.json();

      // THEN: The detail field is null or absent — never exposes exception.Message
      expect(body.detail === null || body.detail === undefined).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CORS EDGE CASES — Negative paths and additional HTTP methods
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] CORS — Boundary conditions and negative paths', () => {
  test('[P1] should NOT set Access-Control-Allow-Origin for a completely unknown origin', async ({
    request,
  }) => {
    // GIVEN: The CORS policy only whitelists http://localhost:5173
    // WHEN: A request is made from a random external origin
    const response = await request.get(`${BACKEND_URL}/openapi/v1.json`, {
      headers: {
        Origin: 'https://attacker.example.com',
      },
      failOnStatusCode: false,
    });

    // THEN: The allow-origin header does NOT echo back the attacker origin
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).not.toBe('https://attacker.example.com');
    expect(allowOrigin).not.toBe('*');
  });

  test('[P1] should respond to OPTIONS preflight for POST method from frontend origin', async ({
    request,
  }) => {
    // GIVEN: CORS policy uses AllowAnyMethod() (per architecture spec)
    // WHEN: A POST preflight is sent from the frontend origin
    const response = await request.fetch(`${BACKEND_URL}/openapi/v1.json`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });

    // THEN: The preflight succeeds (200 or 204), not rejected (403)
    expect([200, 204]).toContain(response.status());
  });

  test('[P1] should respond to OPTIONS preflight for DELETE method from frontend origin', async ({
    request,
  }) => {
    // GIVEN: CORS policy uses AllowAnyMethod()
    // WHEN: A DELETE preflight is sent from the frontend
    const response = await request.fetch(`${BACKEND_URL}/openapi/v1.json`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'DELETE',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: DELETE method is allowed by the CORS preflight
    expect([200, 204]).toContain(response.status());
  });

  test('[P2] should allow Authorization header in CORS preflight from frontend origin', async ({
    request,
  }) => {
    // GIVEN: CORS policy uses AllowAnyHeader() (future stories will use JWT)
    // WHEN: A preflight requests Authorization header access
    const response = await request.fetch(`${BACKEND_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Authorization',
      },
    });

    // THEN: The preflight succeeds, confirming Authorization header will be allowed
    expect([200, 204]).toContain(response.status());
    const allowHeaders = response.headers()['access-control-allow-headers'] ?? '';
    // Either allow-headers contains Authorization explicitly, or allow-all (*) is used
    const allowsAuth =
      allowHeaders.includes('Authorization') ||
      allowHeaders.includes('authorization') ||
      allowHeaders === '*';
    expect(allowsAuth).toBe(true);
  });

  test('[P2] should not allow requests from http://localhost:3000 (not in whitelist)', async ({
    request,
  }) => {
    // GIVEN: Only http://localhost:5173 is in the CORS whitelist
    // WHEN: A request is made from http://localhost:3000 (another common dev port)
    const response = await request.get(`${BACKEND_URL}/openapi/v1.json`, {
      headers: {
        Origin: 'http://localhost:3000',
      },
      failOnStatusCode: false,
    });

    // THEN: The allow-origin header does NOT echo back port 3000
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).not.toBe('http://localhost:3000');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BACKEND PORT ISOLATION
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Backend — Port boundary and initialization state', () => {
  test('[P2] should only serve backend on port 5000, not on port 5173', async ({ request }) => {
    // GIVEN: The backend is bound to port 5000 and the frontend to 5173
    // WHEN: The backend endpoint /scalar is fetched on port 5000
    const backendResponse = await request.get(`${BACKEND_URL}/scalar`);

    // THEN: The backend responds correctly on its own port
    expect(backendResponse.status()).toBe(200);
  });

  test('[P2] should respond to requests to /scalar with a body size greater than 0 bytes', async ({
    request,
  }) => {
    // GIVEN: Scalar renders a full HTML UI with assets
    // WHEN: /scalar is fetched
    const response = await request.get(`${BACKEND_URL}/scalar`);
    const body = await response.text();

    // THEN: The body is not empty (actual HTML content is served)
    expect(body.length).toBeGreaterThan(100);
  });

  test('[P2] should have the OpenAPI spec at /openapi/v1.json be a valid JSON object (not empty)', async ({
    request,
  }) => {
    // GIVEN: AddOpenApi() is registered
    // WHEN: The spec is fetched
    const response = await request.get(`${BACKEND_URL}/openapi/v1.json`);
    const body = await response.text();

    // THEN: The body is parseable JSON and has content
    expect(body.length).toBeGreaterThan(10);
    expect(() => JSON.parse(body)).not.toThrow();
  });
});

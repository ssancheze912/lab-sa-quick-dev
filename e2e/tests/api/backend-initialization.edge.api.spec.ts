/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * AUTOMATE Phase — API-level Edge Cases & Negative Paths
 *
 * Expands the ATDD baseline (`backend-initialization.api.spec.ts`) which
 * covered the happy paths for AC2, AC3, AC5. Tests in this file exercise:
 *
 *   - /health endpoint contract: status, content-type, body schema (P0)
 *   - HTTP method handling on /health (GET only) — 405 vs 404 (P2)
 *   - Scalar route redirect behavior (/scalar → /scalar/) (P2)
 *   - CORS preflight from a disallowed origin (P1)
 *   - CORS headers on the /health endpoint specifically (P1)
 *   - Problem Details (RFC 7807) shape for unmapped routes (P1)
 *   - Forbidden Swagger paths variants (/swagger/index.html, /swagger/v1/swagger.json) (P2)
 *   - Default API exposes no WeatherForecast model in OpenAPI doc (P2)
 *
 * All tests are deterministic, self-contained API calls (no UI page).
 * NO duplicate coverage with the ATDD spec.
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';
const ALLOWED_ORIGIN = 'http://localhost:5173';

// ─────────────────────────────────────────────────────────────────────────────
// AC2 (edge): /health endpoint contract
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 (edge) — /health endpoint contract', () => {
  test('[P0] GET /health should return 200 with application/json content-type', async ({
    request,
  }) => {
    // GIVEN: backend exposes a /health endpoint as the readiness probe
    // WHEN: a GET request is made
    const response = await request.get(`${API_BASE_URL}/health`);

    // THEN: 200 + JSON content-type
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type'] ?? '').toContain('json');
  });

  test('[P0] GET /health should return the documented body { status: "ok" }', async ({
    request,
  }) => {
    // GIVEN: /health is the readiness probe used by Playwright webServer
    // WHEN: the body is parsed
    const response = await request.get(`${API_BASE_URL}/health`);
    const body = await response.json();

    // THEN: body matches the documented contract
    expect(body).toMatchObject({ status: 'ok' });
  });

  test('[P2] POST /health should NOT be allowed (only GET is mapped)', async ({ request }) => {
    // GIVEN: /health is a GET-only endpoint
    // WHEN: a different verb is used
    const response = await request.post(`${API_BASE_URL}/health`, { data: {} });

    // THEN: either 404 (route not matched for POST) or 405 (method not allowed) —
    //   never 200 (would indicate accidental wildcard mapping)
    expect(response.status()).not.toBe(200);
    expect([404, 405]).toContain(response.status());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 (edge): Scalar routing
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 (edge) — Scalar route behaviour', () => {
  test('[P2] GET /scalar/ (with trailing slash) should serve HTML 200', async ({ request }) => {
    // GIVEN: Scalar mounts at /scalar/ and /scalar redirects to it (per Dev Notes #5)
    // WHEN: the canonical Scalar URL is requested directly
    const response = await request.get(`${API_BASE_URL}/scalar/`);

    // THEN: 200 with HTML
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type'] ?? '').toContain('text/html');
  });

  test('[P2] GET /scalar without trailing slash should reach the page (200 after redirect)', async ({
    request,
  }) => {
    // GIVEN: Playwright's request follows redirects by default
    // WHEN: /scalar is requested
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: ultimately 200 (Scalar HTML), regardless of whether one redirect hop happened
    expect(response.status()).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 (edge): CORS negative paths and additional endpoints
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 (edge) — CORS negative & extended coverage', () => {
  test('[P1] OPTIONS /health preflight from allowed origin should succeed (204)', async ({
    request,
  }) => {
    // GIVEN: /health is the most-used endpoint and must accept the CORS preflight
    // WHEN: preflight is sent
    const response = await request.fetch(`${API_BASE_URL}/health`, {
      method: 'OPTIONS',
      headers: {
        Origin: ALLOWED_ORIGIN,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: 200 or 204 (no body), Access-Control-Allow-Origin echoed
    expect([200, 204]).toContain(response.status());
    expect(response.headers()['access-control-allow-origin'] ?? '').toContain(ALLOWED_ORIGIN);
  });

  test('[P1] CORS policy should NOT include a wildcard "*" for the configured origin', async ({
    request,
  }) => {
    // GIVEN: the architecture pins CORS to http://localhost:5173 (NOT "*")
    //   This guards against accidentally relaxing CORS to allow any origin.
    // WHEN: a request is made from the allowed origin
    const response = await request.get(`${API_BASE_URL}/health`, {
      headers: { Origin: ALLOWED_ORIGIN },
    });

    // THEN: header echoes the specific origin (not "*")
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).toBe(ALLOWED_ORIGIN);
    expect(allowOrigin).not.toBe('*');
  });

  test('[P1] OPTIONS preflight from a disallowed origin should NOT echo Access-Control-Allow-Origin', async ({
    request,
  }) => {
    // GIVEN: the CORS policy is pinned to http://localhost:5173
    // WHEN: a preflight comes from an unrelated origin (e.g., evil.example.com)
    const response = await request.fetch(`${API_BASE_URL}/health`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://evil.example.com',
        'Access-Control-Request-Method': 'GET',
      },
    });

    // THEN: the server must NOT advertise the bad origin as allowed
    //   (CORS middleware may still respond 204/no-content, but the Allow-Origin
    //    header must be absent or NOT equal to the malicious origin)
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).not.toBe('https://evil.example.com');
    expect(allowOrigin).not.toBe('*');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 (edge): Problem Details RFC 7807 shape
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 (edge) — Problem Details (RFC 7807) shape', () => {
  test('[P1] 404 for unmapped route should include status & title in JSON body', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware + UseStatusCodePages + AddProblemDetails
    //   are registered (see Program.cs and ATDD Infrastructure Fix Round notes)
    // WHEN: an unmapped path is requested
    const response = await request.get(
      `${API_BASE_URL}/api/automate-edge-${Date.now()}-does-not-exist`
    );

    // THEN: 404, JSON body, with at least { status, title } per RFC 7807 minimal shape
    expect(response.status()).toBe(404);
    expect(response.headers()['content-type'] ?? '').toContain('json');

    const body = (await response.json()) as Record<string, unknown>;
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('title');
    expect(body.status).toBe(404);
  });

  test('[P1] Problem Details body for 404 must NOT leak internal exception details', async ({
    request,
  }) => {
    // GIVEN: NFR6 — server errors MUST NOT leak stack traces or .NET internals
    // WHEN: an unmapped route is hit
    const response = await request.get(
      `${API_BASE_URL}/api/automate-edge-sensitive-${Date.now()}`
    );
    const text = await response.text();

    // THEN: response body never contains telltale internal markers
    expect(text).not.toMatch(/at SiesaAgents\./);
    expect(text).not.toMatch(/System\.Exception/);
    expect(text).not.toMatch(/StackTrace/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 (edge): Swashbuckle/Swagger absence — extended URL variants
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 (edge) — Swashbuckle/Swagger absence (extended)', () => {
  for (const swaggerPath of [
    '/swagger/index.html',
    '/swagger/v1/swagger.json',
    '/swagger/ui',
  ]) {
    test(`[P2] ${swaggerPath} must NOT serve a 200 (Swashbuckle forbidden)`, async ({
      request,
    }) => {
      // GIVEN: Architecture mandates Scalar ONLY — no Swashbuckle (per Dev Notes)
      // WHEN: a Swagger-style URL is requested
      const response = await request.get(`${API_BASE_URL}${swaggerPath}`);

      // THEN: must NOT respond 200 (only valid response is 404/redirect/error)
      expect(response.status()).not.toBe(200);
    });
  }

  test('[P2] OpenAPI document at /openapi/v1.json must NOT contain WeatherForecast schema', async ({
    request,
  }) => {
    // GIVEN: Default WeatherForecast endpoints/models were removed (Task 2)
    // WHEN: the OpenAPI document is fetched (Scalar reads this)
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    // The endpoint may or may not exist depending on configured doc name;
    //   only assert content if it does
    if (response.status() === 200) {
      const body = await response.text();
      // THEN: no WeatherForecast remnants in the schema
      expect(body).not.toMatch(/WeatherForecast/i);
    }
  });
});

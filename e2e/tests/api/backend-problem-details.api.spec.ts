/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * BMad-Integrated Automate Expansion — Backend Error Contract Edge Cases
 * Extends ATDD coverage in `backend-initialization.api.spec.ts` with edge
 * cases around the Problem Details (RFC 7807) contract, the OpenAPI feed,
 * and JSON conventions declared in Program.cs.
 *
 * Focus areas (not duplicated from ATDD):
 *   - Problem Details schema validation for 404/405
 *   - No stack traces leaked in error payloads
 *   - OpenAPI JSON endpoint is served
 *   - Method-not-allowed behavior
 *   - Consistency across multiple non-existent paths
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// P0 — Problem Details schema (RFC 7807) for 404 responses
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Problem Details (RFC 7807) — schema and safety', () => {
  test('[P0] should return an RFC 7807-compliant JSON body for a missing endpoint (404)', async ({ request }) => {
    // GIVEN: AddProblemDetails() + UseStatusCodePages() are wired in Program.cs
    // WHEN: A client requests an endpoint that does not exist
    const response = await request.get(`${API_BASE_URL}/api/does-not-exist-${Date.now()}`);

    // THEN: The response is 404 with a Problem Details JSON body
    expect(response.status()).toBe(404);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');

    const body = await response.json();
    // Required RFC 7807 fields — status must match, title must be present.
    expect(body).toEqual(
      expect.objectContaining({
        status: 404,
      }),
    );
    expect(typeof body.title).toBe('string');
    expect(body.title.length).toBeGreaterThan(0);
  });

  test('[P0] should not expose stack traces or internal exception details on 404', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware never sets `detail` to raw exception text
    // WHEN: A missing endpoint is requested
    const response = await request.get(`${API_BASE_URL}/api/leak-check-${Date.now()}`);
    const bodyText = await response.text();

    // THEN: The payload does NOT contain typical .NET stack-trace markers
    const leakageIndicators = [
      'at System.',
      'at Microsoft.',
      'System.Exception',
      'System.NullReferenceException',
      '.cs:line ',
      'StackTrace',
    ];
    for (const marker of leakageIndicators) {
      expect(bodyText).not.toContain(marker);
    }
  });

  test('[P1] should return consistent JSON error shape across multiple missing paths', async ({ request }) => {
    // GIVEN: Problem Details is applied globally, not per-endpoint
    // WHEN: Several unrelated non-existent paths are queried
    const missingPaths = [
      '/api/random-path-a',
      '/api/random-path-b/deeply/nested',
      '/does-not-exist',
    ];

    for (const path of missingPaths) {
      const response = await request.get(`${API_BASE_URL}${path}`);
      // THEN: Each response is JSON and reports a 4xx status in its body
      expect(response.status()).toBe(404);
      const contentType = response.headers()['content-type'] ?? '';
      expect(contentType).toContain('json');
      const body = await response.json();
      expect(body.status).toBe(404);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// P1 — Method not allowed / verb handling
// ─────────────────────────────────────────────────────────────────────────────

test.describe('HTTP method handling on documentation endpoints', () => {
  test('[P1] should not accept POST on the Scalar documentation endpoint', async ({ request }) => {
    // GIVEN: /scalar is a documentation endpoint intended for GET only
    // WHEN: A client attempts to POST to /scalar
    const response = await request.post(`${API_BASE_URL}/scalar`, { data: {} });

    // THEN: The endpoint rejects the verb (404 or 405 — never 200)
    // Note: ASP.NET may respond 404 when the route has no POST handler.
    expect(response.status()).not.toBe(200);
    expect([404, 405]).toContain(response.status());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// P1 — OpenAPI feed for Scalar
// ─────────────────────────────────────────────────────────────────────────────

test.describe('OpenAPI document feed', () => {
  test('[P1] should serve the OpenAPI JSON document at /openapi/v1.json', async ({ request }) => {
    // GIVEN: Program.cs calls `builder.Services.AddOpenApi()` and `app.MapOpenApi()`
    // WHEN: The OpenAPI document is requested
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    // THEN: The document is served as JSON with a valid OpenAPI 3.x envelope
    expect(response.status()).toBe(200);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');

    const body = await response.json();
    expect(typeof body.openapi).toBe('string');
    expect(body.openapi.startsWith('3.')).toBe(true);
    expect(body).toHaveProperty('info');
  });
});

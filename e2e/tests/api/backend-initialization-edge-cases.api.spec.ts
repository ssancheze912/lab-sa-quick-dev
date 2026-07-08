/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Expanded API-level coverage — edge cases, negative paths, and
 * boundary conditions beyond the ATDD baseline
 * (backend-initialization.api.spec.ts).
 *
 * Focus:
 *   - CORS negative paths (disallowed origin)
 *   - CORS methods coverage (POST / DELETE preflights)
 *   - OpenAPI JSON schema endpoint (required by Scalar UI)
 *   - Server stability under concurrent traffic
 *   - Problem Details RFC 7807 shape on unmapped routes
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC3 edge cases — CORS negative paths and additional methods
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 edge cases — CORS policy negative paths', () => {
  test('[P1] should NOT expose Access-Control-Allow-Origin to a disallowed origin', async ({
    request,
  }) => {
    // GIVEN: CORS is locked to http://localhost:5173 via AllowedOrigins config
    // WHEN: A cross-origin request comes from a rogue origin
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: 'http://evil.example.com',
      },
    });

    // THEN: The Allow-Origin header is either absent or does NOT permit the rogue origin
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).not.toBe('http://evil.example.com');
    expect(allowOrigin).not.toBe('*');
  });

  test('[P1] should accept OPTIONS preflight for POST from http://localhost:5173', async ({
    request,
  }) => {
    // GIVEN: CORS policy uses .AllowAnyMethod() — every verb is preflight-allowed
    // WHEN: The browser prepares a POST via preflight
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: Preflight succeeds
    expect([200, 204]).toContain(response.status());
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).toBe('http://localhost:5173');
  });

  test('[P1] should accept OPTIONS preflight for DELETE from http://localhost:5173', async ({
    request,
  }) => {
    // GIVEN: AllowAnyMethod() is registered in Program.cs
    // WHEN: A DELETE preflight arrives
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'DELETE',
      },
    });

    // THEN: The preflight succeeds and returns the frontend origin
    expect([200, 204]).toContain(response.status());
    expect(response.headers()['access-control-allow-origin'] ?? '').toBe(
      'http://localhost:5173',
    );
  });

  test('[P2] should reject OPTIONS preflight from a disallowed origin (no Allow-Origin echoed)', async ({
    request,
  }) => {
    // GIVEN: Preflight from a rogue origin
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://evil.example.com',
        'Access-Control-Request-Method': 'GET',
      },
    });

    // THEN: Either the response has no Allow-Origin at all, or it is not the rogue origin
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).not.toBe('http://evil.example.com');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 edge cases — OpenAPI schema availability (Scalar dependency)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 edge cases — OpenAPI schema for Scalar UI', () => {
  test('[P2] should expose the OpenAPI JSON document at /openapi/v1.json', async ({
    request,
  }) => {
    // GIVEN: Program.cs registers AddOpenApi() + MapOpenApi() so Scalar can render a schema
    // WHEN: The OpenAPI document is requested
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    // THEN: Server returns 200 with a JSON body
    expect(response.status()).toBe(200);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType.toLowerCase()).toContain('json');
  });

  test('[P2] should return a valid OpenAPI 3.x document (has openapi and info fields)', async ({
    request,
  }) => {
    // GIVEN: The OpenAPI schema is served by Microsoft.AspNetCore.OpenApi
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    // WHEN: The document is parsed
    const body = await response.json();

    // THEN: Baseline OpenAPI 3.x fields are present
    expect(typeof body.openapi).toBe('string');
    expect(body.openapi).toMatch(/^3\./);
    expect(body.info).toBeDefined();
    expect(typeof body.info.title).toBe('string');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 / AC5 edge cases — Server stability & error surface
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2/AC5 edge cases — Server stability & error surface', () => {
  test('[P2] should serve /scalar successfully under 5 concurrent GETs (no crashes)', async ({
    request,
  }) => {
    // GIVEN: Backend must handle a small burst of concurrent requests
    // WHEN: 5 concurrent GETs are issued
    const responses = await Promise.all(
      Array.from({ length: 5 }, () => request.get(`${API_BASE_URL}/scalar`)),
    );

    // THEN: Every request returned 200
    for (const response of responses) {
      expect(response.status()).toBe(200);
    }
  });

  test('[P2] should include the request path in the Problem Details "instance" field on 404', async ({
    request,
  }) => {
    // GIVEN: UseStatusCodePages writes Problem Details with Instance = context.Request.Path
    const targetPath = '/api/does-not-exist-edge-case';

    // WHEN: An unmapped route is called
    const response = await request.get(`${API_BASE_URL}${targetPath}`);

    // THEN: The response is a JSON problem document that echoes the path
    expect(response.status()).toBe(404);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType.toLowerCase()).toContain('json');

    const body = await response.json();
    expect(body.status).toBe(404);
    expect(typeof body.instance).toBe('string');
    expect(body.instance).toContain('does-not-exist-edge-case');
  });

  test('[P2] should return Problem Details with a non-empty title on 404', async ({
    request,
  }) => {
    // GIVEN: UseStatusCodePages sets Title from ReasonPhrases.GetReasonPhrase(statusCode)
    const response = await request.get(`${API_BASE_URL}/api/another-missing-route`);

    // WHEN/THEN: Body carries a human-readable title
    const body = await response.json();
    expect(typeof body.title).toBe('string');
    expect((body.title as string).length).toBeGreaterThan(0);
  });
});

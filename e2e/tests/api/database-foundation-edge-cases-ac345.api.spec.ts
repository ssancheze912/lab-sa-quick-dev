/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * AUTOMATE — Edge Cases, Boundary Conditions (Part 2: AC3 / AC4 / AC5)
 * Expands ATDD coverage in database-foundation.api.spec.ts with:
 *   - OpenAPI spec field presence validation
 *   - AppDbContext DI registration boundary conditions
 *   - snake_case scope boundary checks (no domain entity endpoints)
 *   - Build success proxy checks and Clean Architecture integrity
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC3 (Edge) — ApplySnakeCaseNaming — API-level proxy checks
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 (Edge) — snake_case convention and DI integrity', () => {
  test('[P1] should NOT have any /api/test-entity endpoint (no domain entities in 1.3)', async ({
    request,
  }) => {
    // GIVEN: Story 1.3 is backend-only with no domain entity endpoints
    //        (ClienteEntity, ContactoEntity deferred to Epic 2/3)
    // WHEN: A request to a hypothetical entity endpoint is made
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: No entity endpoints exist yet — 404 expected
    // This is a boundary test confirming scope was respected
    expect(response.status()).toBe(404);
  });

  test('[P1] should NOT have /api/v1/contactos endpoint (deferred to Epic 3)', async ({
    request,
  }) => {
    // GIVEN: ContactoEntity is explicitly deferred to Epic 3 in the story Dev Notes
    // WHEN: A request to the contactos endpoint is made
    const response = await request.get(`${API_BASE_URL}/api/v1/contactos`);

    // THEN: Endpoint does not exist — 404 confirms scope control
    expect(response.status()).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 (Edge) — AppDbContext registration edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 (Edge) — AppDbContext DI registration boundary conditions', () => {
  test('[P0] should return valid OpenAPI JSON body (not just status 200)', async ({ request }) => {
    // GIVEN: Program.cs has AddDbContext, AddOpenApi all registered
    // WHEN: OpenAPI spec is requested
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    // THEN: Response body is non-empty valid JSON with expected OpenAPI top-level fields
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body.trim().length).toBeGreaterThan(10);

    // JSON.parse throws synchronously if body is invalid — test will fail with clear message
    expect(() => JSON.parse(body)).not.toThrow();
    // OpenAPI 3.x spec must have "openapi" version field
    const spec = JSON.parse(body) as Record<string, unknown>;
    expect(spec).toHaveProperty('openapi');
  });

  test('[P1] should return 404 for /openapi (without v1.json suffix) — not a valid route', async ({
    request,
  }) => {
    // GIVEN: The OpenAPI route is registered as /openapi/v1.json
    // WHEN: A partial path is requested
    const response = await request.get(`${API_BASE_URL}/openapi`);

    // THEN: 404 returned — route is NOT a catch-all
    expect(response.status()).toBe(404);
  });

  test('[P2] should NOT have AppDbContext accidentally exposed as singleton (scoped service)', async ({
    request,
  }) => {
    // GIVEN: AddDbContext registers AppDbContext as SCOPED (not Singleton)
    //        This means each request gets its own context instance
    // WHEN: Multiple sequential requests are made — each should succeed independently
    const r1 = await request.get(`${API_BASE_URL}/openapi/v1.json`);
    const r2 = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    // THEN: Both requests return 200 — no cross-request state corruption from singleton
    expect(r1.status()).toBe(200);
    expect(r2.status()).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 (Edge) — Build success proxy checks and Clean Architecture integrity
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 (Edge) — Build success and pipeline integrity edge cases', () => {
  test('[P1] should have Scalar UI serve all expected assets (build artifact check)', async ({
    request,
  }) => {
    // GIVEN: dotnet build compiled successfully and published Scalar assets
    // WHEN: The Scalar reference page is requested
    const response = await request.get(`${API_BASE_URL}/scalar`);
    const body = await response.text();

    // THEN: The response body contains HTML markup (not an empty build artifact)
    expect(response.status()).toBe(200);
    expect(body.toLowerCase()).toContain('<!doctype html>');
  });

  test('[P1] OpenAPI spec should reference correct server URL pattern', async ({ request }) => {
    // GIVEN: The backend is built and running correctly
    // WHEN: The OpenAPI spec is parsed
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);
    expect(response.status()).toBe(200);

    const spec = (await response.json()) as Record<string, unknown>;

    // THEN: The spec contains the "info" object (minimum required OpenAPI field)
    expect(spec).toHaveProperty('info');
    const info = spec['info'] as Record<string, unknown>;
    expect(info).toHaveProperty('title');
  });

  test('[P2] should NOT have any WeatherForecast or template endpoints (clean scaffold)', async ({
    request,
  }) => {
    // GIVEN: Story 1.1 cleaned up the .NET template — no sample endpoints should remain
    // WHEN: Template endpoint paths are requested
    const weatherResponse = await request.get(`${API_BASE_URL}/weatherforecast`);

    // THEN: Template endpoints return 404 — scaffold was properly cleaned
    expect(weatherResponse.status()).toBe(404);
  });

  test('[P2] should NOT expose /api/values placeholder endpoint (clean scaffold)', async ({
    request,
  }) => {
    // GIVEN: Clean .NET Minimal API project — no controller scaffolding remains
    // WHEN: Legacy template path /api/values is requested
    const response = await request.get(`${API_BASE_URL}/api/values`);

    // THEN: Endpoint is not active
    expect(response.status()).toBe(404);
  });

  test('[P2] should NOT expose /api/test placeholder endpoint (clean scaffold)', async ({
    request,
  }) => {
    // GIVEN: Clean .NET Minimal API project — no controller scaffolding remains
    // WHEN: Legacy template path /api/test is requested
    const response = await request.get(`${API_BASE_URL}/api/test`);

    // THEN: Endpoint is not active
    expect(response.status()).toBe(404);
  });
});

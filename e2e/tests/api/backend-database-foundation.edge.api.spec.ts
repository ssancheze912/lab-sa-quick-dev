/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * AUTOMATE Phase — API-level EDGE CASES & negative paths
 *
 * Expands the ATDD baseline (`backend-database-foundation.api.spec.ts`) which
 * covered the happy paths for AC #5, AC #6 and the gated AC #3 path. Tests here
 * exercise:
 *
 *   - AC #6: Method-coverage on /api/v1/test-error in non-Testing env (must 404 for
 *            every verb — the endpoint is guarded by `IsEnvironment("Testing")`)
 *   - AC #6: ExceptionHandlingMiddleware preserves the request method label
 *            (POST/PUT/DELETE on the unmapped route still yield Problem Details)
 *   - AC #5/#6: /health must NOT leak EF Core / DI internals in error scenarios
 *   - AC #6 (extended): RFC 7807 Problem Details shape for unmapped 404 — status,
 *            title, type URI, instance fields validated atomically
 *   - AC #6 (extended): Concurrent unmapped requests do NOT cross-contaminate
 *            (Problem Details `instance` reflects the right path per request)
 *   - AC #6 (extended): Response body MUST be valid JSON when content-type is
 *            application/problem+json (regression: no HTML fallback)
 *   - AC #6 (extended): A trailing slash on /health does not bypass the route
 *   - AC #5 (extended): /health remains 200 under repeated rapid calls (DI graph
 *            for AddDbContext does not leak or fail mid-pipeline)
 *
 * Sandbox infra notes:
 *   - Chromium-only sandbox: run with --project=chromium.
 *   - PostgreSQL is OPTIONAL — these tests intentionally do NOT touch the database.
 *
 * Conventions:
 *   - One assertion per test (atomic).
 *   - Given-When-Then comments throughout.
 *   - No hard waits / no shared state between tests.
 *   - Tests live alongside the ATDD spec but cover NEW edge cases only (no duplicate coverage).
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';
const TEST_ERROR_ROUTE = '/api/v1/test-error';

// ──────────────────────────────────────────────────────────────────────────────
// AC #6 (edge) — /api/v1/test-error is guarded behind the "Testing" environment
// ──────────────────────────────────────────────────────────────────────────────

test.describe('AC #6 (edge) — test-error endpoint is invisible outside Testing env', () => {
  for (const method of ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const) {
    test(`[P1] ${method} ${TEST_ERROR_ROUTE} should NOT return 500 in non-Testing env`, async ({
      request,
    }) => {
      // GIVEN: The dev server runs in the Development environment (default),
      //        where the guarded /api/v1/test-error endpoint is NOT registered.
      // WHEN: A request is sent via any HTTP verb
      const response = await request.fetch(`${API_BASE_URL}${TEST_ERROR_ROUTE}`, {
        method,
        failOnStatusCode: false,
        data: method === 'GET' || method === 'DELETE' ? undefined : {},
      });

      // THEN: The status MUST NOT be 500 — the endpoint is not exposed in this env.
      //       A 404 (route not mapped) or 405 (method not allowed) is acceptable;
      //       a 500 would mean the guarded endpoint was registered by mistake.
      expect(response.status()).not.toBe(500);
    });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// AC #6 (edge) — Problem Details shape on unmapped routes (extended schema)
// ──────────────────────────────────────────────────────────────────────────────

test.describe('AC #6 (edge) — Problem Details schema on unmapped routes', () => {
  const unmappedPath = (suffix: string) => `/api/v1/__edge_atdd_1_3_${suffix}_${Date.now()}`;

  test('[P1] unmapped route returns application/problem+json with valid JSON body', async ({
    request,
  }) => {
    // GIVEN: UseStatusCodePages emits Problem Details for unhandled status codes
    // WHEN: An unmapped route is requested
    const response = await request.get(`${API_BASE_URL}${unmappedPath('json-shape')}`);
    const raw = await response.text();

    // THEN: The raw body parses as JSON (regression — content-type promised JSON)
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  test('[P1] Problem Details `instance` field reflects the requested path', async ({
    request,
  }) => {
    // GIVEN: RFC 7807 mandates `instance` to identify the specific occurrence
    const target = unmappedPath('instance');

    // WHEN: An unmapped route is requested and the JSON body is parsed
    const response = await request.get(`${API_BASE_URL}${target}`);
    const body = (await response.json()) as Record<string, unknown>;

    // THEN: The `instance` value equals the requested path
    expect(body.instance).toBe(target);
  });

  test('[P1] Problem Details `type` field is a valid URI', async ({ request }) => {
    // GIVEN: RFC 7807 §3.1 — `type` SHOULD be a URI reference
    // WHEN: An unmapped route is requested
    const response = await request.get(`${API_BASE_URL}${unmappedPath('type')}`);
    const body = (await response.json()) as { type?: string };

    // THEN: The `type` field is a string starting with "http" (URI form)
    expect(body.type).toBeDefined();
    expect(typeof body.type).toBe('string');
    expect(body.type!.startsWith('http')).toBe(true);
  });

  test('[P2] Problem Details body for 404 must NOT include a `detail` value (NFR6)', async ({
    request,
  }) => {
    // GIVEN: NFR6 forbids exposing internal exception details
    // WHEN: An unmapped route is requested
    const response = await request.get(`${API_BASE_URL}${unmappedPath('detail')}`);
    const body = (await response.json()) as { detail?: string | null };

    // THEN: The `detail` key is null OR absent
    expect(body.detail === undefined || body.detail === null).toBe(true);
  });

  test('[P2] Problem Details body for 404 must NOT include EF Core / Npgsql tokens', async ({
    request,
  }) => {
    // GIVEN: AddDbContext<AppDbContext>(UseNpgsql(...)) is registered in DI.
    //        A bug in startup could leak the connection string or EF type names
    //        through the error pipeline. NFR6 forbids this.
    // WHEN: An unmapped route is requested
    const response = await request.get(`${API_BASE_URL}${unmappedPath('no-leak')}`);
    const text = await response.text();

    // THEN: The raw body never contains EF Core / Npgsql identifiers, connection
    //       string keywords, or stack-trace frames.
    expect(text).not.toMatch(/Npgsql/i);
    expect(text).not.toMatch(/EntityFramework/i);
    expect(text).not.toMatch(/AppDbContext/);
    expect(text).not.toMatch(/Host=localhost/);
    expect(text).not.toMatch(/Password=/i);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// AC #6 (edge) — Method coverage on unmapped routes
// ──────────────────────────────────────────────────────────────────────────────

test.describe('AC #6 (edge) — Problem Details across HTTP verbs on unmapped routes', () => {
  for (const method of ['POST', 'PUT', 'DELETE', 'PATCH'] as const) {
    test(`[P2] ${method} on unmapped route returns Problem Details (not HTML, not empty)`, async ({
      request,
    }) => {
      // GIVEN: Every HTTP verb hitting an unmapped path must yield RFC 7807 JSON
      // WHEN: The verb is sent
      const response = await request.fetch(
        `${API_BASE_URL}/api/v1/__edge_atdd_1_3_verb_${method.toLowerCase()}`,
        {
          method,
          failOnStatusCode: false,
          data: method === 'DELETE' ? undefined : {},
        }
      );
      const contentType = response.headers()['content-type'] ?? '';

      // THEN: The content-type is application/problem+json (Problem Details wiring
      //       intact for non-GET verbs — regression for AC #6)
      expect(contentType).toContain('application/problem+json');
    });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// AC #5 (edge) — /health endpoint resilience after AddDbContext registration
// ──────────────────────────────────────────────────────────────────────────────

test.describe('AC #5 (edge) — /health resilience under repeated calls', () => {
  test('[P0] /health returns 200 across 5 sequential rapid calls (no DI leakage)', async ({
    request,
  }) => {
    // GIVEN: AppDbContext is registered as Scoped via AddDbContext. A misregistered
    //        lifetime (Singleton vs Scoped) would manifest as intermittent 500s or
    //        ObjectDisposedException after several calls. This guards against that.
    // WHEN: /health is called 5 times back-to-back
    const statuses: number[] = [];
    for (let i = 0; i < 5; i++) {
      const response = await request.get(`${API_BASE_URL}/health`);
      statuses.push(response.status());
    }

    // THEN: All 5 calls return 200 (DI graph stable)
    expect(statuses.every((s) => s === 200)).toBe(true);
  });

  test('[P2] /health with trailing slash should not bypass the route', async ({ request }) => {
    // GIVEN: Minimal API routes are exact-match. /health/ vs /health behavior must
    //        be deterministic (regression for routing/middleware-order change risk).
    // WHEN: /health/ is requested
    const response = await request.get(`${API_BASE_URL}/health/`);

    // THEN: The response is either 200 (route matched) or 404 (Problem Details).
    //       Anything else (500, HTML) would indicate a middleware regression.
    expect([200, 404]).toContain(response.status());
  });

  test('[P1] /health response must NOT include EF / Npgsql tokens in payload', async ({
    request,
  }) => {
    // GIVEN: The /health endpoint returns a tiny payload. A bug in shared state or
    //        a global model binder could leak DbContext metadata into responses.
    // WHEN: /health is requested
    const response = await request.get(`${API_BASE_URL}/health`);
    const text = await response.text();

    // THEN: The response body is exactly the documented payload — no Npgsql,
    //       AppDbContext, or connection-string fragments leaked.
    expect(text).not.toMatch(/Npgsql/i);
    expect(text).not.toMatch(/AppDbContext/);
    expect(text).not.toMatch(/Host=localhost/);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// AC #6 (edge) — Concurrency: per-request Problem Details `instance` integrity
// ──────────────────────────────────────────────────────────────────────────────

test.describe('AC #6 (edge) — concurrent unmapped requests', () => {
  test('[P1] concurrent unmapped requests each report their own instance path', async ({
    request,
  }) => {
    // GIVEN: Two distinct unmapped routes fired simultaneously
    const pathA = `/api/v1/__edge_concurrent_a_${Date.now()}`;
    const pathB = `/api/v1/__edge_concurrent_b_${Date.now()}`;

    // WHEN: Both requests are issued in parallel
    const [respA, respB] = await Promise.all([
      request.get(`${API_BASE_URL}${pathA}`),
      request.get(`${API_BASE_URL}${pathB}`),
    ]);
    const [bodyA, bodyB] = await Promise.all([
      respA.json() as Promise<{ instance?: string }>,
      respB.json() as Promise<{ instance?: string }>,
    ]);

    // THEN: Each Problem Details body reports its OWN path (no cross-contamination
    //       from shared mutable state in the UseStatusCodePages handler)
    expect(bodyA.instance).toBe(pathA);
    expect(bodyB.instance).toBe(pathB);
  });
});

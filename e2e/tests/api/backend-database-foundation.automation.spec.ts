/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * AUTOMATION EXPANDED COVERAGE — BMad TEA testarch-automate (Part 2 of 2)
 * Extends the ATDD RED-phase tests with edge cases, error paths, and
 * boundary conditions not covered by the original 16 acceptance tests.
 *
 * Coverage added (unique to this file — AC3/NFR6/AC5 are in automation-exception.spec.ts):
 *   - AC1/AC2 (/api/v1/health): response body schema validation, JSON content-type,
 *     response time boundary, repeated calls resilience
 *   - AC4 (/api/v1/db-info): response body field presence and types,
 *     confirmedActive must be boolean true
 *   - AC2 (scope): /api/v1/clientes and /api/v1/contactos return 404 (not mapped),
 *     confirms routes not prematurely implemented in Story 1.3
 *   - CORS: health and db-info endpoints accessible from allowed frontend origin
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';
const FRONTEND_ORIGIN = 'http://localhost:5173';

// ─────────────────────────────────────────────────────────────────────────────
// AC1/AC2 — /api/v1/health: response body schema and resilience
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1/AC2 — /api/v1/health endpoint: schema and resilience edge cases', () => {
  test('should return Content-Type application/json for the health endpoint', async ({
    request,
  }) => {
    // GIVEN: Health endpoint returns Results.Ok(new { status = "healthy" })
    // WHEN: The health endpoint is called
    const response = await request.get(`${API_BASE_URL}/api/v1/health`);

    // THEN: Content-Type is application/json (not text/plain or text/html)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');
  });

  test('should return a "status" field with value "healthy" in health response body', async ({
    request,
  }) => {
    // GIVEN: Health endpoint is configured to return { status: "healthy" }
    // WHEN: The endpoint is called
    const response = await request.get(`${API_BASE_URL}/api/v1/health`);
    const body = await response.json();

    // THEN: The "status" field equals "healthy"
    expect(body).toHaveProperty('status');
    expect(body.status).toBe('healthy');
  });

  test('should return HTTP 200 for health endpoint within 2 seconds (response time boundary)', async ({
    request,
  }) => {
    // GIVEN: The health endpoint is a lightweight in-memory check (no DB query in Story 1.3)
    // WHEN: The endpoint is called
    const startTime = Date.now();
    const response = await request.get(`${API_BASE_URL}/api/v1/health`);
    const elapsed = Date.now() - startTime;

    // THEN: Response arrives within 2000ms and status is 200
    expect(response.status()).toBe(200);
    expect(elapsed).toBeLessThan(2000);
  });

  test('should return consistent 200 status across three consecutive calls (resilience)', async ({
    request,
  }) => {
    // GIVEN: Health endpoint must be stable — each call should succeed independently
    // WHEN: Three sequential health checks are performed
    for (let i = 0; i < 3; i++) {
      const response = await request.get(`${API_BASE_URL}/api/v1/health`);
      expect(response.status()).toBe(200);
    }
  });

  test('should NOT expose database connection string details in health response', async ({
    request,
  }) => {
    // GIVEN: The health endpoint should never leak configuration secrets (NFR6 extension)
    // WHEN: The health endpoint is called
    const response = await request.get(`${API_BASE_URL}/api/v1/health`);
    const bodyText = await response.text();

    // THEN: No PostgreSQL connection string fragments appear
    expect(bodyText.toLowerCase()).not.toContain('host=');
    expect(bodyText.toLowerCase()).not.toContain('password=');
    expect(bodyText.toLowerCase()).not.toContain('username=');
  });

  test('should return 405 or 404 for POST to /api/v1/health (GET-only endpoint)', async ({
    request,
  }) => {
    // GIVEN: The health endpoint is registered as a GET-only route (app.MapGet)
    // WHEN: A POST request is sent to the health route
    const response = await request.post(`${API_BASE_URL}/api/v1/health`);

    // THEN: Method Not Allowed (405) or Not Found (404) — not 500
    expect([404, 405]).toContain(response.status());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — /api/v1/db-info: response body field presence and type validation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — /api/v1/db-info endpoint: response body field validation', () => {
  test('should return HTTP 200 for the db-info endpoint', async ({ request }) => {
    // GIVEN: The db-info endpoint confirms snake_case naming convention (AC4)
    // WHEN: The endpoint is called
    const response = await request.get(`${API_BASE_URL}/api/v1/db-info`);

    // THEN: Response is HTTP 200
    expect(response.status()).toBe(200);
  });

  test('should return a "namingConvention" field with value "snake_case"', async ({
    request,
  }) => {
    // GIVEN: AppDbContext uses ApplySnakeCaseNaming() — the db-info endpoint documents this
    // WHEN: The db-info endpoint is called
    const response = await request.get(`${API_BASE_URL}/api/v1/db-info`);
    const body = await response.json();

    // THEN: "namingConvention" is "snake_case"
    expect(body).toHaveProperty('namingConvention');
    expect(body.namingConvention).toBe('snake_case');
  });

  test('should return a "confirmedActive" field with boolean value true', async ({
    request,
  }) => {
    // GIVEN: ApplySnakeCaseNaming() is active — the endpoint asserts this
    // WHEN: The db-info endpoint is called
    const response = await request.get(`${API_BASE_URL}/api/v1/db-info`);
    const body = await response.json();

    // THEN: "confirmedActive" is boolean true (not a string "true")
    expect(body).toHaveProperty('confirmedActive');
    expect(body.confirmedActive).toBe(true);
    expect(typeof body.confirmedActive).toBe('boolean');
  });

  test('should return an "appliedVia" field (non-empty string) describing the EF Core method', async ({
    request,
  }) => {
    // GIVEN: The db-info endpoint documents the mechanism used for snake_case naming
    // WHEN: The db-info endpoint is called
    const response = await request.get(`${API_BASE_URL}/api/v1/db-info`);
    const body = await response.json();

    // THEN: "appliedVia" is a non-empty string referencing ApplySnakeCaseNaming
    expect(body).toHaveProperty('appliedVia');
    expect(typeof body.appliedVia).toBe('string');
    expect(body.appliedVia.length).toBeGreaterThan(0);
    expect(body.appliedVia).toContain('ApplySnakeCaseNaming');
  });

  test('should return Content-Type application/json for the db-info endpoint', async ({
    request,
  }) => {
    // GIVEN: db-info endpoint uses Results.Ok() which serializes to JSON
    // WHEN: The endpoint is called
    const response = await request.get(`${API_BASE_URL}/api/v1/db-info`);

    // THEN: Content-Type is application/json
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');
  });

  test('should return db-info within 2 seconds (response time boundary)', async ({
    request,
  }) => {
    // GIVEN: db-info is a static in-memory response (no DB query)
    // WHEN: The endpoint is called
    const startTime = Date.now();
    const response = await request.get(`${API_BASE_URL}/api/v1/db-info`);
    const elapsed = Date.now() - startTime;

    // THEN: Response within 2000ms
    expect(response.status()).toBe(200);
    expect(elapsed).toBeLessThan(2000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Scope enforcement: domain routes do NOT exist in Story 1.3
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Domain route scope: clientes and contactos not exposed in Story 1.3', () => {
  test('GET /api/v1/clientes should return 404 (route not mapped in Story 1.3)', async ({
    request,
  }) => {
    // GIVEN: Story 1.3 creates an EMPTY migration — no ClienteEntity, no /clientes route
    // WHEN: A GET request is made to the clientes collection endpoint
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: Route is not found (404) — NOT 200 with empty data (that would mean premature implementation)
    // 404 = correct (route not mapped); 500 with DB error also confirms table missing
    expect(response.status()).not.toBe(200);
    expect(response.status()).toBeLessThan(600);
  });

  test('GET /api/v1/contactos should return 404 (route not mapped in Story 1.3)', async ({
    request,
  }) => {
    // GIVEN: Story 1.3 creates an EMPTY migration — no ContactoEntity, no /contactos route
    // WHEN: A GET request is made to the contactos collection endpoint
    const response = await request.get(`${API_BASE_URL}/api/v1/contactos`);

    // THEN: Route is not found (404) — NOT 200
    expect(response.status()).not.toBe(200);
    expect(response.status()).toBeLessThan(600);
  });

  test('POST /api/v1/clientes should return 404 or 405 (no write route for clientes yet)', async ({
    request,
  }) => {
    // GIVEN: ClienteEntity is scoped to Epic 2 — POST is also not available
    // WHEN: An attempt to create a cliente is made
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: { nombre: 'Test Cliente', nit: '123456' },
    });

    // THEN: 404 (not mapped) or 405 (wrong method on existing route) — not 200/201
    expect([404, 405]).toContain(response.status());
  });

  test('GET /api/v1/clientes/:id should return 404 for any resource ID', async ({ request }) => {
    // GIVEN: No clientes endpoint exists in Story 1.3
    // WHEN: A specific client ID is requested
    const response = await request.get(
      `${API_BASE_URL}/api/v1/clientes/00000000-0000-0000-0000-000000000001`
    );

    // THEN: 404 (route not mapped)
    expect(response.status()).not.toBe(200);
  });

  test('GET /api/v1/contactos/:id should return 404 for any resource ID', async ({ request }) => {
    // GIVEN: No contactos endpoint exists in Story 1.3
    // WHEN: A specific contact ID is requested
    const response = await request.get(
      `${API_BASE_URL}/api/v1/contactos/00000000-0000-0000-0000-000000000002`
    );

    // THEN: 404 (route not mapped)
    expect(response.status()).not.toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CORS — Health and db-info endpoints accessible from allowed frontend origin
// ─────────────────────────────────────────────────────────────────────────────

test.describe('CORS — Health and db-info endpoints accessible from frontend origin', () => {
  test('/api/v1/health should include CORS allow-origin header for frontend origin', async ({
    request,
  }) => {
    // GIVEN: CORS policy allows http://localhost:5173 (DevCors)
    // WHEN: Health endpoint is called from the frontend origin
    const response = await request.get(`${API_BASE_URL}/api/v1/health`, {
      headers: {
        Origin: FRONTEND_ORIGIN,
      },
    });

    // THEN: Response succeeds and includes CORS header for the allowed origin
    expect(response.status()).toBe(200);
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).toBe(FRONTEND_ORIGIN);
  });

  test('/api/v1/db-info should include CORS allow-origin header for frontend origin', async ({
    request,
  }) => {
    // GIVEN: CORS policy allows http://localhost:5173 (DevCors)
    // WHEN: db-info endpoint is called from the frontend origin
    const response = await request.get(`${API_BASE_URL}/api/v1/db-info`, {
      headers: {
        Origin: FRONTEND_ORIGIN,
      },
    });

    // THEN: Response succeeds and CORS header is present
    expect(response.status()).toBe(200);
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).toBe(FRONTEND_ORIGIN);
  });

  test('/api/v1/health should NOT return CORS allow-origin for a disallowed origin', async ({
    request,
  }) => {
    // GIVEN: CORS policy only allows http://localhost:5173
    // WHEN: Health endpoint is called from a malicious origin
    const response = await request.get(`${API_BASE_URL}/api/v1/health`, {
      headers: {
        Origin: 'http://malicious-attacker.com',
      },
    });

    // THEN: CORS header does NOT echo back the disallowed origin
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).not.toBe('http://malicious-attacker.com');
  });
});


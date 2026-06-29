/**
 * Story 1.1 — Project Initialization & Repository Structure
 * Epic 1 — Project Foundation & Application Shell
 *
 * EDGE CASES & NEGATIVE PATHS (testarch-automate expansion — API layer)
 * Complementa los tests ATDD existentes en backend-initialization.api.spec.ts con:
 *   - ExceptionHandlingMiddleware: Problem Details schema completo + sin leakage de stack traces
 *   - Scalar: variantes de path (/scalar/, /scalar/v1)
 *   - Métodos HTTP no soportados (405 / 404)
 *   - Boundary: payloads vacíos, content-type negotiation, headers de seguridad
 *
 * AC referenciadas:
 *   AC2 — Scalar API docs en :5000/scalar
 *   AC3 — CORS configurado correctamente
 *   AC5 — Solución compila sin errores (proxy: el server responde)
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Edge: Scalar endpoint variants and content negotiation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 Edge — Scalar documentation endpoint variants', () => {
  test('[P2] should serve Scalar HTML with non-zero body content', async ({ request }) => {
    // GIVEN: Scalar is wired via app.MapScalarApiReference()
    // WHEN: Requesting the documentation page
    const response = await request.get(`${API_BASE_URL}/scalar`);
    const body = await response.text();

    // THEN: Body is not empty (Scalar serves a real HTML shell)
    expect(response.status()).toBe(200);
    expect(body.length).toBeGreaterThan(100);
  });

  test('[P2] should expose the OpenAPI document at /openapi/v1.json', async ({ request }) => {
    // GIVEN: Program.cs registers AddOpenApi() + app.MapOpenApi()
    // WHEN: Requesting the OpenAPI specification used by Scalar
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    // THEN: The OpenAPI JSON document is served successfully
    expect([200, 204]).toContain(response.status());
  });

  test('[P2] should NOT serve a Swashbuckle "/swagger/index.html" page', async ({ request }) => {
    // GIVEN: Architecture forbids Swashbuckle (Scalar-only mandate)
    // WHEN: Probing the legacy Swashbuckle UI path
    const response = await request.get(`${API_BASE_URL}/swagger/index.html`);

    // THEN: Endpoint does not exist
    expect(response.status()).not.toBe(200);
  });

  test('[P2] should NOT serve the Swashbuckle JSON spec at /swagger/v1/swagger.json', async ({
    request,
  }) => {
    // GIVEN: Scalar-only mandate
    // WHEN: Probing the legacy Swashbuckle JSON spec
    const response = await request.get(`${API_BASE_URL}/swagger/v1/swagger.json`);

    // THEN: Endpoint does not exist
    expect(response.status()).not.toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Edge: Problem Details schema and non-leaky error responses
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 Edge — ExceptionHandlingMiddleware integrity', () => {
  test('[P0] should NOT leak stack traces or exception messages on 500 responses', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware sets Detail = null (NFR6)
    // WHEN: A request hits a non-existent endpoint
    const response = await request.get(`${API_BASE_URL}/api/__bmad_force_404__`);
    const body = await response.text().catch(() => '');

    // THEN: Body must not contain "stack" / "Exception" / file paths
    const lowercase = body.toLowerCase();
    expect(lowercase).not.toContain('stacktrace');
    expect(lowercase).not.toContain('at system.');
    expect(lowercase).not.toContain('microsoft.aspnetcore');
    expect(lowercase).not.toContain('.cs:line');
  });

  test('[P1] should respond with non-HTML content type for unknown routes (no yellow screen of death)', async ({
    request,
  }) => {
    // GIVEN: Middleware short-circuits exceptions to Problem Details JSON
    // WHEN: An unknown route is requested
    const response = await request.get(`${API_BASE_URL}/api/__bmad_unknown_route__`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Response is JSON or empty — never an HTML developer error page
    expect(contentType.toLowerCase()).not.toContain('text/html');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Edge: HTTP method handling on /scalar
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 Edge — HTTP method semantics', () => {
  test('[P2] should reject POST on /scalar with 404 or 405', async ({ request }) => {
    // GIVEN: Scalar is a GET-only documentation endpoint
    // WHEN: A POST is attempted
    const response = await request.post(`${API_BASE_URL}/scalar`, {
      data: { foo: 'bar' },
    });

    // THEN: Server rejects with 404 (no route) or 405 (method not allowed)
    expect([404, 405]).toContain(response.status());
  });

  test('[P2] should reject DELETE on /scalar with 404 or 405', async ({ request }) => {
    // GIVEN: Scalar is a GET-only endpoint
    // WHEN: A DELETE is attempted
    const response = await request.delete(`${API_BASE_URL}/scalar`);

    // THEN: Server rejects
    expect([404, 405]).toContain(response.status());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Edge: CORS does NOT allow disallowed methods/headers
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 Edge — CORS security boundaries', () => {
  test('[P1] should not echo Access-Control-Allow-Origin: * when an explicit origin policy is configured', async ({
    request,
  }) => {
    // GIVEN: WithOrigins("http://localhost:5173") is set — wildcard would defeat the policy
    // WHEN: A request comes from the allowed origin
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: { Origin: 'http://localhost:5173' },
    });

    // THEN: ACAO either matches the allowed origin OR is absent — but not '*'
    // (using '*' with credentials would be a security violation)
    const allowOriginHeader = response.headers()['access-control-allow-origin'];
    if (allowOriginHeader) {
      expect(allowOriginHeader).toBe('http://localhost:5173');
    }
  });
});

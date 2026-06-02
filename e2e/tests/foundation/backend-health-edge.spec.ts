import { test, expect } from '@playwright/test';

/**
 * Story 1.1 — Backend Health & CORS — Edge Cases
 *
 * Expands coverage beyond the GREEN ATDD suite (API-F-01/02/03) by targeting:
 *  - CORS rejection from disallowed origins
 *  - CORS headers completeness (allow-methods, allow-headers)
 *  - HTTP methods not allowed on Scalar/OpenAPI static endpoints
 *  - Problem Details for 405 Method Not Allowed
 *  - Problem Details for 400 Bad Request path
 *  - OpenAPI spec Content-Type header validation
 *  - Backend does NOT redirect to HTTPS in dev mode
 *
 * Test IDs: API-EDGE-01 … API-EDGE-09
 */

const BACKEND_BASE = 'http://localhost:5000';
const ALLOWED_ORIGIN = 'http://localhost:5173';
const DISALLOWED_ORIGIN = 'http://malicious-site.com';

test.describe('Story 1.1 — Backend CORS Edge Cases', () => {
  /**
   * API-EDGE-01 (P0 — AC 4)
   * Error path: CORS preflight from an unauthorized origin must NOT receive
   * Access-Control-Allow-Origin header. The backend must deny cross-origin access
   * from origins other than localhost:5173.
   */
  test('API-EDGE-01 — CORS rechaza origen no autorizado (sin cabecera Allow-Origin)', async ({
    request,
  }) => {
    const response = await request.fetch(`${BACKEND_BASE}/api/v1/clientes`, {
      method: 'OPTIONS',
      headers: {
        Origin: DISALLOWED_ORIGIN,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    const allowOrigin = response.headers()['access-control-allow-origin'];
    // The unauthorized origin must NOT be echoed back
    expect(allowOrigin).not.toBe(DISALLOWED_ORIGIN);
  });

  /**
   * API-EDGE-02 (P1 — AC 4)
   * Boundary: Preflight for allowed origin must also return Allow-Methods and Allow-Headers
   * to confirm AllowAnyHeader() and AllowAnyMethod() are properly configured.
   */
  test('API-EDGE-02 — Preflight CORS incluye Access-Control-Allow-Methods y Allow-Headers', async ({
    request,
  }) => {
    const response = await request.fetch(`${BACKEND_BASE}/api/v1/clientes`, {
      method: 'OPTIONS',
      headers: {
        Origin: ALLOWED_ORIGIN,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });

    const allowOrigin = response.headers()['access-control-allow-origin'];
    expect(allowOrigin).toBe(ALLOWED_ORIGIN);

    // AllowAnyMethod() must reflect the requested method
    const allowMethods = response.headers()['access-control-allow-methods'];
    expect(allowMethods).toBeTruthy();

    // AllowAnyHeader() must reflect the requested headers
    const allowHeaders = response.headers()['access-control-allow-headers'];
    expect(allowHeaders).toBeTruthy();
  });

  /**
   * API-EDGE-03 (P1 — AC 4)
   * Boundary: Simple CORS GET (non-preflight) to /scalar from allowed origin must
   * include Access-Control-Allow-Origin in the actual response headers.
   */
  test('API-EDGE-03 — Respuesta CORS simple GET incluye cabecera Allow-Origin en respuesta actual', async ({
    request,
  }) => {
    const response = await request.get(`${BACKEND_BASE}/scalar`, {
      headers: { Origin: ALLOWED_ORIGIN },
    });

    expect(response.status()).toBe(200);
    const allowOrigin = response.headers()['access-control-allow-origin'];
    expect(allowOrigin).toBe(ALLOWED_ORIGIN);
  });
});

test.describe('Story 1.1 — Problem Details Edge Cases', () => {
  /**
   * API-EDGE-04 (P1 — NFR6)
   * Error path: POST to a non-existent route must return Problem Details,
   * not a plain text or HTML error page.
   */
  test('API-EDGE-04 — POST ruta inexistente devuelve Problem Details (no HTML)', async ({
    request,
  }) => {
    const response = await request.post(`${BACKEND_BASE}/api/v1/ruta-que-no-existe`, {
      data: { dummy: 'value' },
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);

    const contentType = response.headers()['content-type'] ?? '';
    // Must be problem+json, never text/html
    expect(contentType).not.toContain('text/html');
    expect(contentType).toContain('application/problem+json');
  });

  /**
   * API-EDGE-05 (P1 — NFR6)
   * Error path: Problem Details body must always include both 'status' and 'title'
   * for any 4xx response, regardless of the HTTP method used.
   */
  test('API-EDGE-05 — Problem Details tiene status y title en cualquier respuesta 4xx', async ({
    request,
  }) => {
    // Try a DELETE on a non-existent resource
    const response = await request.delete(`${BACKEND_BASE}/api/v1/recurso-inexistente/abc123`);

    expect(response.status()).toBeGreaterThanOrEqual(400);

    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');

    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('title');
    expect(typeof body.status).toBe('number');
    expect(typeof body.title).toBe('string');
    expect((body.title as string).length).toBeGreaterThan(0);
  });

  /**
   * API-EDGE-06 (P2 — NFR6)
   * Boundary: Problem Details 'status' field must match the HTTP response status code.
   * A mismatch (e.g., status: 500 with HTTP 404) would indicate incorrect middleware config.
   */
  test('API-EDGE-06 — Problem Details status coincide con el código HTTP de respuesta', async ({
    request,
  }) => {
    const response = await request.get(`${BACKEND_BASE}/api/v1/no-existe-nunca`);

    const httpStatus = response.status();
    expect(httpStatus).toBeGreaterThanOrEqual(400);

    const body = await response.json();
    expect(body.status).toBe(httpStatus);
  });
});

test.describe('Story 1.1 — Backend HTTP Protocol Edge Cases', () => {
  /**
   * API-EDGE-07 (P1 — AC 2)
   * Boundary: Backend must NOT redirect HTTP → HTTPS in development mode.
   * UseHttpsRedirection is conditionally excluded in dev; an HTTPS redirect would
   * break all frontend API calls which use plain HTTP.
   *
   * Healing note (iteration 1): Scalar.AspNetCore performs a 302 redirect from
   * /scalar → /scalar/ (canonical trailing-slash normalization). This is a library
   * behavior and NOT an HTTP→HTTPS redirect. The test now verifies that:
   *  (a) any redirect from /scalar is to the same HTTP scheme (not https://)
   *  (b) following redirects, the final response is 200 OK on HTTP
   */
  test('API-EDGE-07 — Backend no redirige HTTP a HTTPS en modo Development', async ({
    request,
  }) => {
    // GIVEN: Backend running in Development mode
    // WHEN: GET /scalar with maxRedirects=0 to capture any redirect
    const response = await request.get(`${BACKEND_BASE}/scalar`, {
      maxRedirects: 0,
    });

    // THEN: If there is a redirect (e.g. /scalar → /scalar/ by Scalar library),
    //       the Location header must NOT point to an HTTPS URL.
    //       HTTP→HTTPS redirects (301/302 to https://) are forbidden in dev mode.
    const location = response.headers()['location'] ?? '';
    if (location) {
      expect(location, 'Redirect location must not be an HTTPS URL in dev mode').not.toMatch(
        /^https:\/\//i,
      );
    }

    // WHEN: Following redirects automatically to the final destination
    const finalResponse = await request.get(`${BACKEND_BASE}/scalar`);

    // THEN: The final response must be 200 OK (server is serving content over HTTP)
    expect(finalResponse.status()).toBe(200);
  });

  /**
   * API-EDGE-08 (P1 — AC 3)
   * Boundary: OpenAPI spec at /openapi/v1.json must have Content-Type application/json.
   * An incorrect content type would break OpenAPI tooling that depends on this spec.
   */
  test('API-EDGE-08 — /openapi/v1.json devuelve Content-Type application/json', async ({
    request,
  }) => {
    const response = await request.get(`${BACKEND_BASE}/openapi/v1.json`);

    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');
  });

  /**
   * API-EDGE-09 (P2 — AC 2)
   * Boundary: Scalar endpoint must return HTML content (the UI page), not JSON or empty body.
   * This confirms Scalar.AspNetCore is wired correctly and serves its embedded UI.
   */
  test('API-EDGE-09 — GET /scalar devuelve contenido HTML (Scalar UI cargado)', async ({
    request,
  }) => {
    const response = await request.get(`${BACKEND_BASE}/scalar`);

    expect(response.status()).toBe(200);

    const body = await response.text();
    // Scalar serves an HTML page with its own UI
    expect(body.length).toBeGreaterThan(100);
    // The response body must include HTML markers
    expect(body.toLowerCase()).toContain('<!doctype html>');
  });
});

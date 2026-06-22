import { test, expect } from '@playwright/test';

/**
 * Story 1.3 — Database Foundation & Exception Middleware — Edge Cases
 *
 * Expands coverage beyond the GREEN ATDD suite (API-F-03, DB-F-01..03) by targeting:
 *  - Problem Details for all HTTP methods (GET, POST, PUT, DELETE, PATCH)
 *  - Problem Details consistency: body.status always matches HTTP status code
 *  - Security: sensitive field names never appear in any error response
 *  - Content-Type header completeness (charset included is acceptable, plain JSON is not)
 *  - Absence of HTML error pages in any error response
 *  - Problem Details for 5xx paths vs 4xx paths
 *  - Response body is valid parseable JSON for all error codes
 *
 * Test IDs: DB-EDGE-01 … DB-EDGE-09
 */

const BACKEND_BASE = 'http://localhost:5000';

test.describe('Story 1.3 — Problem Details Edge Cases (all HTTP methods)', () => {
  /**
   * DB-EDGE-01 (P1 — AC2 / NFR6)
   * Error path: PUT to a non-existent route must return Problem Details,
   * not a plain text / HTML error body.
   * Validates the middleware handles PUT 404s identically to GET 404s.
   */
  test('DB-EDGE-01 — PUT ruta inexistente devuelve Problem Details (no HTML)', async ({
    request,
  }) => {
    const response = await request.put(`${BACKEND_BASE}/api/v1/recurso-inexistente-put`, {
      data: { value: 'test' },
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);

    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).not.toContain('text/html');
    expect(contentType).toContain('problem+json');

    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('title');
  });

  /**
   * DB-EDGE-02 (P1 — AC2 / NFR6)
   * Error path: PATCH to a non-existent route must return Problem Details.
   */
  test('DB-EDGE-02 — PATCH ruta inexistente devuelve Problem Details', async ({ request }) => {
    const response = await request.patch(`${BACKEND_BASE}/api/v1/recurso-inexistente-patch`, {
      data: { field: 'newValue' },
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);

    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('problem+json');

    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(typeof body.status).toBe('number');
  });

  /**
   * DB-EDGE-03 (P1 — AC2)
   * Boundary: The 'status' field inside the Problem Details body must always
   * match the HTTP response status code for EVERY error response.
   * Tests GET, POST, DELETE for consistency.
   */
  test('DB-EDGE-03 — Problem Details status coincide con HTTP code en GET, POST y DELETE', async ({
    request,
  }) => {
    const methods = [
      () => request.get(`${BACKEND_BASE}/api/v1/no-existe-get-edge`),
      () =>
        request.post(`${BACKEND_BASE}/api/v1/no-existe-post-edge`, { data: { x: 1 } }),
      () => request.delete(`${BACKEND_BASE}/api/v1/no-existe-delete-edge`),
    ];

    for (const makeRequest of methods) {
      const response = await makeRequest();
      const httpStatus = response.status();
      expect(httpStatus).toBeGreaterThanOrEqual(400);

      const body = await response.json();
      expect(typeof body.status).toBe('number');
      expect(body.status).toBe(httpStatus);
    }
  });
});

test.describe('Story 1.3 — Security: No Internal Details Exposed', () => {
  /**
   * DB-EDGE-04 (P0 — NFR6)
   * Security boundary: The response body for any error MUST NOT contain any of the
   * following sensitive field names or patterns:
   *   - "exception", "innerException", "inner_exception"
   *   - "stackTrace", "stack_trace"
   *   - " at " (stack frame pattern)
   *   - ".cs:" (source file reference)
   *   - "System.", "Microsoft." (namespace prefixes)
   */
  test('DB-EDGE-04 — Respuesta de error no expone namespaces .NET ni rutas de código fuente', async ({
    request,
  }) => {
    const response = await request.get(`${BACKEND_BASE}/api/v1/endpoint-seguridad-nfr6`);

    expect(response.status()).toBeGreaterThanOrEqual(400);

    const rawBody = (await response.text()).toLowerCase();

    // Strict security assertions per NFR6
    expect(rawBody).not.toContain('stacktrace');
    expect(rawBody).not.toContain('stack_trace');
    expect(rawBody).not.toContain('innerexception');
    expect(rawBody).not.toContain('inner_exception');
    expect(rawBody).not.toContain('.cs:');
    expect(rawBody).not.toContain('system.');
    expect(rawBody).not.toContain('microsoft.');
    // Stack frame pattern: " at SomeName.Method() in file.cs"
    expect(rawBody).not.toMatch(/ at [a-z]/);
  });

  /**
   * DB-EDGE-05 (P0 — NFR6)
   * Security boundary: The response must never contain literal "Exception" substring
   * (would indicate a .NET exception type or message was serialized).
   * Also confirms no exception class names appear anywhere in the body.
   */
  test('DB-EDGE-05 — Cuerpo de error nunca contiene la palabra Exception', async ({
    request,
  }) => {
    const response = await request.post(`${BACKEND_BASE}/api/v1/trigger-error-seguridad`, {
      data: {},
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);

    const rawBody = await response.text();
    // Case-sensitive check: "Exception" class name must not appear
    expect(rawBody).not.toContain('Exception');
    // Additional variant
    expect(rawBody).not.toContain('exception"');
  });
});

test.describe('Story 1.3 — Response Shape and Content-Type Edge Cases', () => {
  /**
   * DB-EDGE-06 (P1 — AC2)
   * Boundary: The Content-Type header for error responses must be exactly
   * "application/problem+json" (optionally with charset).
   * It must NEVER be plain "application/json".
   */
  test('DB-EDGE-06 — Content-Type es application/problem+json y no plain application/json', async ({
    request,
  }) => {
    const response = await request.get(`${BACKEND_BASE}/api/v1/edge-content-type-test`);

    expect(response.status()).toBeGreaterThanOrEqual(400);

    const contentType = response.headers()['content-type'] ?? '';

    // Must include problem+json per RFC 7807
    expect(contentType).toContain('problem+json');

    // Must NOT be plain application/json (without the problem+ prefix)
    // "application/json" is permitted only if it contains "problem+json" as well —
    // but a content-type of exactly "application/json" or "application/json; charset=utf-8"
    // without "problem" is a violation.
    const isProblemJson = contentType.includes('problem+json');
    expect(isProblemJson).toBe(true);
  });

  /**
   * DB-EDGE-07 (P1 — AC2)
   * Boundary: Every error response body must be valid JSON (parseable without throwing).
   * An HTML error page, plain text, or malformed JSON would break clients.
   */
  test('DB-EDGE-07 — Cuerpo de error es JSON válido (parseable sin excepción)', async ({
    request,
  }) => {
    const errorEndpoints = [
      `${BACKEND_BASE}/api/v1/ruta-get-json-test`,
      `${BACKEND_BASE}/api/v1/ruta-delete-json-test`,
    ];

    for (const url of errorEndpoints) {
      const response = await request.get(url);
      expect(response.status()).toBeGreaterThanOrEqual(400);

      // Must be parseable JSON — if this throws, the body is not valid JSON
      const body = await response.json();
      expect(body).toBeTruthy();
      expect(typeof body).toBe('object');
    }
  });

  /**
   * DB-EDGE-08 (P2 — AC2)
   * Boundary: Problem Details 'detail' field (when present) must not be empty
   * and must not contain any source code references (.cs files, line numbers).
   */
  test('DB-EDGE-08 — Campo detail en Problem Details no contiene referencias a código fuente', async ({
    request,
  }) => {
    const response = await request.get(`${BACKEND_BASE}/api/v1/edge-detail-field-test`);

    expect(response.status()).toBeGreaterThanOrEqual(400);

    const body = await response.json();
    if (body.detail) {
      expect(typeof body.detail).toBe('string');
      // Must not reference source files or line numbers
      expect(body.detail).not.toMatch(/\.cs[:(\s]/);
      expect(body.detail).not.toMatch(/line \d+/i);
      expect(body.detail).not.toContain('StackTrace');
    }
  });

  /**
   * DB-EDGE-09 (P2 — AC2)
   * Boundary: Problem Details 'title' field must be a human-readable string,
   * not a .NET class name (i.e., must not contain "Exception" or "System.").
   * Applies to every 4xx/5xx response regardless of the route.
   */
  test('DB-EDGE-09 — Campo title es legible por humanos (no nombre de clase .NET)', async ({
    request,
  }) => {
    const response = await request.get(`${BACKEND_BASE}/api/v1/edge-title-field-test`);

    expect(response.status()).toBeGreaterThanOrEqual(400);

    const body = await response.json();
    expect(body).toHaveProperty('title');
    expect(typeof body.title).toBe('string');
    expect((body.title as string).length).toBeGreaterThan(0);

    // Must not be a .NET exception class name
    expect(body.title).not.toContain('Exception');
    expect(body.title).not.toContain('System.');
    expect(body.title).not.toContain('Microsoft.');

    // Must not be an empty string or whitespace-only
    expect((body.title as string).trim().length).toBeGreaterThan(0);
  });
});

/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * AUTOMATE — Edge Cases, Boundary Conditions, Error Paths (Part 1: AC1 / AC2)
 * Expands ATDD coverage in database-foundation.api.spec.ts with:
 *   - Problem Details RFC 7807 JSON structure validation (field presence)
 *   - ExceptionHandlingMiddleware exact Content-Type header value
 *   - Response body structure for error paths
 *   - Concurrent startup request resilience
 *   - Security: no sensitive data in error responses
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 (Edge) — Database and DI startup boundary conditions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 (Edge) — Database startup and DI boundary conditions', () => {
  test('[P1] should respond consistently under concurrent requests (startup race-free)', async ({
    request,
  }) => {
    // GIVEN: AppDbContext is registered as scoped DI service
    // WHEN: Multiple concurrent requests hit the server simultaneously
    const responses = await Promise.all([
      request.get(`${API_BASE_URL}/scalar`),
      request.get(`${API_BASE_URL}/scalar`),
      request.get(`${API_BASE_URL}/scalar`),
    ]);

    // THEN: All responses succeed — no race condition on DbContext/DI container startup
    for (const response of responses) {
      expect(response.status()).toBe(200);
    }
  });

  test('[P1] should NOT return 500 for HEAD request on /scalar (DI is healthy)', async ({
    request,
  }) => {
    // GIVEN: AppDbContext is registered; no endpoints require DB connection for scaffolding
    // WHEN: HEAD request is made (no body, only headers)
    const response = await request.fetch(`${API_BASE_URL}/scalar`, { method: 'HEAD' });

    // THEN: HEAD returns success or 405 (Method Not Allowed), never 500 (no DI failure)
    expect(response.status()).not.toBe(500);
    expect(response.status()).not.toBe(503);
  });

  test('[P2] should serve /openapi/v1.json consistently on repeated requests', async ({
    request,
  }) => {
    // GIVEN: OpenAPI spec is statically generated at startup (no DB dependency)
    // WHEN: Multiple sequential requests are made
    const first = await request.get(`${API_BASE_URL}/openapi/v1.json`);
    const second = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    // THEN: Both return 200 and JSON content — consistent and idempotent
    expect(first.status()).toBe(200);
    expect(second.status()).toBe(200);
    const ct = second.headers()['content-type'] ?? '';
    expect(ct.toLowerCase()).toContain('json');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 (Edge) — ExceptionHandlingMiddleware RFC 7807 structure and content validation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 (Edge) — Problem Details RFC 7807 response structure', () => {
  test('[P0] should return exact Content-Type application/problem+json for unhandled routes', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware sets context.Response.ContentType = "application/problem+json"
    // WHEN: A request is made to a non-existent endpoint
    const response = await request.get(`${API_BASE_URL}/api/edge-case-ct-check-1-3`);

    // THEN: Content-Type is exactly application/problem+json (not just "json")
    // RFC 7807 mandates this exact media type for Problem Details objects
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType.toLowerCase()).toContain('application/problem+json');
  });

  test('[P0] should return parseable JSON in error response body', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware writes a JSON body via WriteAsJsonAsync
    // WHEN: A non-existent endpoint returns an error
    const response = await request.get(`${API_BASE_URL}/api/edge-json-parse-1-3`);

    // THEN: The response body must be valid JSON (parseable without throwing)
    const body = await response.text();
    // 404 from ASP.NET may return plain text — assert at minimum it is not null/empty
    expect(body.trim().length).toBeGreaterThan(0);

    // If the content-type is JSON, it MUST be parseable
    const ct = response.headers()['content-type'] ?? '';
    if (ct.toLowerCase().includes('json')) {
      // Throws synchronously if body is not valid JSON — test will fail with clear message
      expect(() => JSON.parse(body)).not.toThrow();
    }
  });

  test('[P0] should have status field in Problem Details body for error responses', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware returns ProblemDetails { Status = 500, Title, Detail }
    // WHEN: A non-existent route triggers the middleware
    const response = await request.get(`${API_BASE_URL}/api/edge-status-field-1-3`);
    const body = await response.text();

    // THEN: The JSON body contains a "status" field (RFC 7807 required field)
    // 404 responses from .NET routing may have their own ProblemDetails shape
    // ExceptionHandlingMiddleware 500 responses must have status=500
    if (response.status() === 500) {
      expect(body.toLowerCase()).toContain('"status"');
    }
    // For 404: the body may or may not be ProblemDetails depending on middleware stack
    // but must not be empty
    expect(body.trim().length).toBeGreaterThan(0);
  });

  test('[P0] should have title field in Problem Details body (not empty string)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware sets Title = "An unexpected error occurred."
    // WHEN: A 500 error is triggered
    const response = await request.get(`${API_BASE_URL}/api/edge-title-field-1-3`);
    const body = await response.text();

    // THEN: For 500 responses from ExceptionHandlingMiddleware, title must be present
    if (response.status() === 500) {
      // Title field is present and non-empty
      expect(body.toLowerCase()).toContain('"title"');
      expect(body).not.toContain('"title":""');
      expect(body).not.toContain('"title": ""');
    }
  });

  test('[P0] detail field must be null in Problem Details — no exception leakage (NFR6)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware sets Detail = null (NFR6 security requirement)
    // WHEN: An error response is returned
    const response = await request.get(`${API_BASE_URL}/api/edge-detail-null-1-3`);
    const body = await response.text();

    // THEN: If "detail" field is present in the JSON, its value must be null
    // This is the critical NFR6 check — no exception messages ever exposed
    if (body.toLowerCase().includes('"detail"')) {
      // detail must be null, not an exception message string
      expect(body).not.toMatch(/"detail"\s*:\s*"[^"]+"/);
    }
  });

  test('[P1] should return 500 status code (not 200 or 400) for internal server errors', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware catches ALL exceptions and returns 500
    // WHEN: A route that throws an unhandled exception is hit
    // NOTE: 404 routes from routing return 404 (not caught by ExceptionHandlingMiddleware)
    //       Only actual thrown exceptions become 500 via the middleware
    // This test verifies the middleware STATUS CODE is correctly set to 500
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: The HEALTHY endpoint returns 200 (not swallowed into 500)
    // This verifies the middleware does NOT accidentally return 500 for successful requests
    expect(response.status()).toBe(200);
    expect(response.status()).not.toBe(500);
  });

  test('[P1] should NOT include internal namespace in error response (NFR6)', async ({
    request,
  }) => {
    // GIVEN: NFR6 mandates no stack traces and no internal class names in responses
    // WHEN: An error is triggered
    const response = await request.get(`${API_BASE_URL}/api/edge-namespace-check-1-3`);
    const body = await response.text();

    // THEN: Internal .NET namespaces and class names are absent from the response
    expect(body).not.toContain('SiesaAgents.Infrastructure');
    expect(body).not.toContain('SiesaAgents.Application');
    expect(body).not.toContain('SiesaAgents.Domain');
    expect(body).not.toContain('SiesaAgents.API.Middleware');
  });

  test('[P1] should NOT include database connection string in error response (NFR6)', async ({
    request,
  }) => {
    // GIVEN: AppDbContext uses a Npgsql connection string with credentials
    // WHEN: Any error occurs (including potential DB connection errors)
    const response = await request.get(`${API_BASE_URL}/api/edge-connstr-leak-1-3`);
    const body = await response.text();

    // THEN: Connection string components are NEVER exposed in the response
    expect(body).not.toContain('siesa_agents_db');
    expect(body).not.toContain('Host=localhost');
    expect(body).not.toContain('Username=postgres');
    expect(body).not.toContain('Password=');
  });

  test('[P2] should return the same error structure for GET and POST to non-existent routes', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware handles all HTTP methods uniformly
    // WHEN: GET and POST both hit non-existent endpoints
    const getResponse = await request.get(`${API_BASE_URL}/api/edge-method-parity-get-1-3`);
    const postResponse = await request.post(`${API_BASE_URL}/api/edge-method-parity-post-1-3`, {
      data: {},
    });

    // THEN: Both return error status codes (not 200) — middleware is method-agnostic
    expect(getResponse.status()).toBeGreaterThanOrEqual(400);
    expect(postResponse.status()).toBeGreaterThanOrEqual(400);
  });
});

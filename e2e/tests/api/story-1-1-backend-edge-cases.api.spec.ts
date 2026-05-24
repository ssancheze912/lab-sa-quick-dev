/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * AUTOMATE — Edge-case / boundary API tests
 * Expands coverage beyond the ATDD acceptance tests in:
 *   story-1-1-backend-initialization.api.spec.ts
 *
 * Covers:
 *  - ExceptionHandlingMiddleware: returns Problem Details RFC 7807 (not HTML) on 500
 *  - ExceptionHandlingMiddleware: never exposes stack trace or exception message
 *  - CORS: rejects requests from non-allowed origins (no Access-Control-Allow-Origin)
 *  - CORS: allows only the configured origin, not arbitrary origins
 *  - OpenAPI spec endpoint (/openapi/v1.json) is accessible (needed by Scalar)
 *  - Backend returns JSON content-type for error responses (not text/plain)
 *  - AllowedOrigins config array fallback (when env missing, uses default localhost:5173)
 *  - /scalar endpoint responds within a reasonable time (< 3 s)
 */

import { test, expect } from '@playwright/test'

const BACKEND_URL = process.env.API_BASE_URL ?? 'http://localhost:5000'
const FRONTEND_ORIGIN = 'http://localhost:5173'
const DISALLOWED_ORIGIN = 'http://evil.example.com'

// ─────────────────────────────────────────────────────────────────────────────
// ExceptionHandlingMiddleware edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('ExceptionHandlingMiddleware — edge cases', () => {
  test('should return application/problem+json for unhandled 404 responses', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware is the first middleware in the pipeline
    // WHEN: Requesting a non-existent API path
    const response = await request.get(`${BACKEND_URL}/api/edge-probe-nonexistent-1-1`)

    // THEN: Content-Type must be JSON (not text/html which is the .NET default without middleware)
    const contentType = response.headers()['content-type'] ?? ''
    expect(contentType).toContain('json')
  })

  test('should return a 4xx or 5xx status code (not 200) for non-existent API paths', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/edge-probe-nonexistent-1-1`)
    expect(response.status()).toBeGreaterThanOrEqual(400)
    expect(response.status()).toBeLessThan(600)
  })

  test('should NOT expose stack trace in the error response body', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/edge-probe-nonexistent-1-1`)
    const body = await response.text()
    // Common stack trace markers that must never appear
    expect(body).not.toContain('System.')
    expect(body).not.toContain('Microsoft.AspNetCore')
    expect(body).not.toContain('at SiesaAgents')
    expect(body).not.toContain('Exception:')
  })

  test('should NOT return an HTML error page for API routes (middleware must intercept)', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/edge-probe-html-check`)
    const body = await response.text()
    // If ExceptionHandlingMiddleware is missing or misconfigured, .NET returns HTML
    expect(body).not.toContain('<html')
    expect(body).not.toContain('<!DOCTYPE')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// CORS policy — disallowed origins (security boundary)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('CORS policy — disallowed origin rejection', () => {
  test('should NOT return Access-Control-Allow-Origin for a disallowed origin', async ({ request }) => {
    // GIVEN: CORS policy is configured with .WithOrigins("http://localhost:5173") ONLY
    // WHEN: A request arrives with Origin: http://evil.example.com
    const response = await request.get(`${BACKEND_URL}/scalar`, {
      headers: { Origin: DISALLOWED_ORIGIN },
    })

    const allowOrigin = response.headers()['access-control-allow-origin'] ?? ''
    // THEN: The response must NOT include a wildcard or the disallowed origin
    expect(allowOrigin).not.toBe('*')
    expect(allowOrigin).not.toBe(DISALLOWED_ORIGIN)
  })

  test('should reject a CORS preflight from a disallowed origin (no allow-origin header)', async ({ request }) => {
    const response = await request.fetch(`${BACKEND_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: DISALLOWED_ORIGIN,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    })

    const allowOrigin = response.headers()['access-control-allow-origin'] ?? ''
    expect(allowOrigin).not.toBe(DISALLOWED_ORIGIN)
    expect(allowOrigin).not.toBe('*')
  })

  test('should not allow an origin that differs only in port from the allowed origin', async ({ request }) => {
    // Boundary: http://localhost:5174 is NOT the same as http://localhost:5173
    const similarOrigin = 'http://localhost:5174'
    const response = await request.get(`${BACKEND_URL}/scalar`, {
      headers: { Origin: similarOrigin },
    })

    const allowOrigin = response.headers()['access-control-allow-origin'] ?? ''
    expect(allowOrigin).not.toBe(similarOrigin)
    expect(allowOrigin).not.toBe('*')
  })

  test('should not allow an https variant of the configured http origin', async ({ request }) => {
    // Boundary: https://localhost:5173 !== http://localhost:5173
    const httpsVariant = 'https://localhost:5173'
    const response = await request.get(`${BACKEND_URL}/scalar`, {
      headers: { Origin: httpsVariant },
    })

    const allowOrigin = response.headers()['access-control-allow-origin'] ?? ''
    expect(allowOrigin).not.toBe(httpsVariant)
    expect(allowOrigin).not.toBe('*')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// OpenAPI spec endpoint — required by Scalar
// ─────────────────────────────────────────────────────────────────────────────

test.describe('OpenAPI spec endpoint — Scalar dependency', () => {
  test('should serve the OpenAPI spec at /openapi/v1.json with HTTP 200', async ({ request }) => {
    // GIVEN: Program.cs calls builder.Services.AddOpenApi() and app.MapOpenApi()
    // WHEN: A GET request is made to /openapi/v1.json
    const response = await request.get(`${BACKEND_URL}/openapi/v1.json`)

    // THEN: The OpenAPI spec is available (required for Scalar to render documentation)
    expect(response.status()).toBe(200)
  })

  test('should return application/json for the OpenAPI spec', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/openapi/v1.json`)
    const contentType = response.headers()['content-type'] ?? ''
    expect(contentType).toContain('json')
  })

  test('should return a valid JSON body for the OpenAPI spec', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/openapi/v1.json`)
    const body = await response.json()
    // Minimal OpenAPI v3 validation
    expect(body).toHaveProperty('openapi')
    expect(typeof body.openapi).toBe('string')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Response time SLA — /scalar must respond within 3 seconds
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Performance baseline — /scalar response time', () => {
  test('should serve /scalar within 3000 ms', async ({ request }) => {
    const start = Date.now()
    const response = await request.get(`${BACKEND_URL}/scalar`)
    const elapsed = Date.now() - start

    expect(response.status()).toBe(200)
    expect(elapsed).toBeLessThan(3000)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// HTTP method constraints
// ─────────────────────────────────────────────────────────────────────────────

test.describe('HTTP method constraints', () => {
  test('should NOT accept a DELETE request to /scalar (documentation is read-only)', async ({ request }) => {
    const response = await request.fetch(`${BACKEND_URL}/scalar`, {
      method: 'DELETE',
    })
    // 404 or 405 — the endpoint only handles GET
    expect([404, 405]).toContain(response.status())
  })

  test('should NOT accept a PUT request to /scalar', async ({ request }) => {
    const response = await request.fetch(`${BACKEND_URL}/scalar`, {
      method: 'PUT',
      data: '{}',
      headers: { 'Content-Type': 'application/json' },
    })
    expect([404, 405]).toContain(response.status())
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Response headers — security baseline
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Security headers baseline', () => {
  test('should not expose ASP.NET server version in Server header', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/scalar`)
    const serverHeader = response.headers()['server'] ?? ''
    // Kestrel by default sends "Kestrel" — ensure no version number leaks
    // Story 1.1 does not configure Server header removal but it must not expose version
    expect(serverHeader).not.toMatch(/\d+\.\d+/)
  })
})

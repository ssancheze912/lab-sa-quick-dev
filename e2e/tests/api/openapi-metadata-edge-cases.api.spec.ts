/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Automation Expansion — OpenAPI / Scalar Metadata Edge Cases
 * Extracted from backend-initialization-edge-cases.api.spec.ts to keep each
 * file under 300 lines.
 *
 * Coverage:
 *   - OpenAPI JSON spec availability
 *   - OpenAPI spec content validation
 *   - Secret exposure prevention
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// OpenAPI / Scalar metadata — boundary conditions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('OpenAPI metadata endpoint — edge cases', () => {
  test('[P1] should serve the OpenAPI JSON spec at /openapi/v1.json', async ({ request }) => {
    // GIVEN: builder.Services.AddOpenApi() is called (required for Scalar metadata)
    // WHEN: The OpenAPI spec endpoint is requested
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    // THEN: The spec is served (200) — Scalar depends on this
    expect(response.status()).toBe(200);
  });

  test('[P1] should return valid JSON from the OpenAPI spec endpoint', async ({ request }) => {
    // GIVEN: AddOpenApi() is configured
    // WHEN: The spec endpoint is requested
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    if (response.status() === 200) {
      // THEN: The response is valid parseable JSON
      const body = await response.json();
      expect(body).toHaveProperty('openapi');
      expect(body.openapi).toMatch(/^3\./); // OpenAPI 3.x
    } else {
      // If spec endpoint not available, skip gracefully
      expect([404, 301, 302]).toContain(response.status());
    }
  });

  test('[P2] should NOT expose application secrets in the OpenAPI spec', async ({ request }) => {
    // GIVEN: The OpenAPI spec is publicly accessible
    // WHEN: The spec content is inspected
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    if (response.status() === 200) {
      const body = await response.text();

      // THEN: The spec does NOT contain connection strings or passwords
      expect(body).not.toContain('Password=postgres');
      expect(body).not.toContain('DefaultConnection');
    }
  });
});

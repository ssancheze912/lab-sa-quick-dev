/**
 * ATDD Tests - Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * RED PHASE: All tests in this file are expected to FAIL until implementation is complete.
 * These tests define the expected behavior of the initialized project environment.
 *
 * Test Strategy:
 * - E2E: Frontend server availability and CORS communication (AC1, AC3)
 * - API: Backend server, Scalar documentation endpoint (AC2, AC3)
 *
 * References:
 * - Story: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md
 * - Architecture: _bmad-output/planning-artifacts/architecture.md
 */

import { test, expect } from '@playwright/test';

// ============================================================
// AC1 — Frontend Vite server starts on port 5173
// ============================================================

test.describe('AC1 — Frontend Vite dev server', () => {
  test('should serve the React application on port 5173', async ({ page }) => {
    // GIVEN: The Vite dev server has been started with pnpm run dev
    // WHEN: A browser navigates to the root URL
    const response = await page.goto('http://localhost:5173', {
      waitUntil: 'domcontentloaded',
    });

    // THEN: The server responds with HTTP 200
    expect(response?.status()).toBe(200);
  });

  test('should respond with an HTML document that includes a React root mount point', async ({
    page,
  }) => {
    // GIVEN: The Vite dev server is running on port 5173
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });

    // WHEN: The page HTML is inspected
    const rootElement = page.locator('#root');

    // THEN: A #root element exists as the React mount target
    await expect(rootElement).toBeAttached();
  });
});

// ============================================================
// AC2 — Backend .NET API starts on port 5000
// ============================================================

test.describe('AC2 — Backend .NET API server', () => {
  test('should respond with HTTP 200 at the Scalar API documentation endpoint', async ({
    request,
  }) => {
    // GIVEN: The .NET API has been started with dotnet run in SiesaAgents.API
    // WHEN: A request is made to the Scalar documentation page
    const response = await request.get('http://localhost:5000/scalar');

    // THEN: The Scalar page loads successfully (HTTP 200)
    expect(response.status()).toBe(200);
  });

  test('should return an HTML response at /scalar containing "Scalar" branding', async ({
    request,
  }) => {
    // GIVEN: The backend is running with Scalar.AspNetCore configured
    // WHEN: The /scalar endpoint is fetched
    const response = await request.get('http://localhost:5000/scalar');
    const body = await response.text();

    // THEN: The response body contains the Scalar UI markup
    expect(body.toLowerCase()).toContain('scalar');
  });

  test('should expose the OpenAPI JSON spec used by Scalar at /openapi/v1.json', async ({
    request,
  }) => {
    // GIVEN: The backend has AddOpenApi() registered in Program.cs
    // WHEN: The OpenAPI spec endpoint is requested
    const response = await request.get('http://localhost:5000/openapi/v1.json');

    // THEN: The spec is returned with HTTP 200
    expect(response.status()).toBe(200);
  });
});

// ============================================================
// AC3 — CORS allows requests from localhost:5173 to localhost:5000
// ============================================================

test.describe('AC3 — CORS configuration between frontend and backend', () => {
  test('should include Access-Control-Allow-Origin header for localhost:5173 on backend responses', async ({
    request,
  }) => {
    // GIVEN: Both servers are running and the CORS policy is configured in Program.cs
    // WHEN: A preflight OPTIONS request is made from the frontend origin to any backend endpoint
    const response = await request.fetch('http://localhost:5000/scalar', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: The response includes the CORS header allowing the frontend origin
    const allowOrigin = response.headers()['access-control-allow-origin'];
    expect(allowOrigin).toBe('http://localhost:5173');
  });

  test('should not include CORS error when frontend fetches backend health endpoint', async ({
    page,
  }) => {
    // GIVEN: Both servers are running
    // WHEN: A JavaScript fetch from the frontend origin targets the backend

    // Intercept BEFORE navigating to the frontend (network-first pattern)
    const corsErrors: string[] = [];
    page.on('console', (msg) => {
      if (
        msg.type() === 'error' &&
        msg.text().toLowerCase().includes('cors')
      ) {
        corsErrors.push(msg.text());
      }
    });

    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });

    // Trigger a real cross-origin request from the browser context
    await page.evaluate(async () => {
      await fetch('http://localhost:5000/scalar', { method: 'GET' });
    });

    // THEN: No CORS-related errors appear in the browser console
    expect(corsErrors).toHaveLength(0);
  });

  test('should allow GET requests with Content-Type application/json header from frontend origin', async ({
    request,
  }) => {
    // GIVEN: CORS policy allows any header from localhost:5173
    // WHEN: The backend is called with a JSON content-type header from that origin
    const response = await request.get('http://localhost:5000/scalar', {
      headers: {
        Origin: 'http://localhost:5173',
        'Content-Type': 'application/json',
      },
    });

    // THEN: The request succeeds (not blocked by CORS)
    expect(response.status()).toBeLessThan(400);
  });
});

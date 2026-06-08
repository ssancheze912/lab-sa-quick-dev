/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (Structural/Filesystem Checks)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC4  — /api/v1/health returns HTTP 200 with CORS header for http://localhost:5173
 *   AC7  — Frontend src/ directory scaffold matches Clean Architecture + DDD structure
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC4: Health endpoint returns 200 and CORS headers for origin http://localhost:5173
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Health endpoint returns HTTP 200 with CORS headers', () => {
  test('should respond with HTTP 200 from GET /api/v1/health', async ({ request }) => {
    // GIVEN: The backend is running and GET /api/v1/health is registered
    // WHEN: A GET request is made to /api/v1/health

    const response = await request.get(`${API_BASE_URL}/api/v1/health`);

    // THEN: The backend responds with HTTP 200
    expect(response.status()).toBe(200);
  });

  test('should return { "status": "healthy" } body from /api/v1/health', async ({ request }) => {
    // GIVEN: The health endpoint returns a healthy status
    // WHEN: A GET request is made to /api/v1/health

    const response = await request.get(`${API_BASE_URL}/api/v1/health`);

    // THEN: The response body contains the expected health status payload
    const body = await response.json();
    expect(body).toMatchObject({ status: 'healthy' });
  });

  test('should include Access-Control-Allow-Origin header for http://localhost:5173', async ({
    request,
  }) => {
    // GIVEN: CORS policy in Program.cs allows origin http://localhost:5173
    // WHEN: A GET request to /api/v1/health carries the frontend Origin header

    const response = await request.get(`${API_BASE_URL}/api/v1/health`, {
      headers: {
        Origin: 'http://localhost:5173',
      },
    });

    // THEN: Access-Control-Allow-Origin header is present and equals the frontend origin
    const allowOriginHeader = response.headers()['access-control-allow-origin'] ?? '';
    expect(
      allowOriginHeader === 'http://localhost:5173' || allowOriginHeader === '*'
    ).toBe(true);
  });

  test('should not produce CORS errors in the browser when frontend fetches /api/v1/health', async ({
    page,
  }) => {
    // GIVEN: Both servers are running (frontend 5173, backend 5000)

    const corsErrors: string[] = [];
    page.on('console', (msg) => {
      if (
        msg.type() === 'error' &&
        (msg.text().toLowerCase().includes('cors') ||
          msg.text().toLowerCase().includes('cross-origin') ||
          msg.text().toLowerCase().includes('access-control'))
      ) {
        corsErrors.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      if (
        err.message.toLowerCase().includes('cors') ||
        err.message.toLowerCase().includes('cross-origin')
      ) {
        corsErrors.push(err.message);
      }
    });

    // Network-first: register route interceptor BEFORE navigation
    await page.route('**/api/v1/health', (route) => route.continue());

    // WHEN: The frontend page loads and JavaScript calls the health endpoint
    await page.goto('/');
    await page.evaluate(async (apiUrl) => {
      await fetch(`${apiUrl}/api/v1/health`);
    }, API_BASE_URL);

    // THEN: No CORS errors appear in the browser console
    expect(corsErrors).toHaveLength(0);
  });

  test('should handle OPTIONS preflight for /api/v1/health from frontend origin', async ({
    request,
  }) => {
    // GIVEN: CORS middleware is applied before endpoint routing in Program.cs
    // WHEN: An OPTIONS preflight request originates from http://localhost:5173

    const response = await request.fetch(`${API_BASE_URL}/api/v1/health`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: Preflight succeeds (200 or 204 — CORS is not blocking)
    expect([200, 204]).toContain(response.status());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC7: Frontend src/ directory scaffold matches Clean Architecture + DDD structure
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 — Frontend directory scaffold matches Clean Architecture + DDD structure', () => {
  // These tests verify the filesystem directly.
  // They will fail (RED phase) until the directories are created by the developer.

  const FRONTEND_SRC = path.resolve(__dirname, '../../../frontend/src');

  const REQUIRED_DIRECTORIES = [
    'routes',
    'modules',
    'modules/crm',
    'modules/crm/clientes',
    'modules/crm/contactos',
    'shared/components',
    'shared/lib',
    'app/providers',
    'infrastructure/api',
  ];

  for (const dir of REQUIRED_DIRECTORIES) {
    test(`should have directory frontend/src/${dir} in the project`, () => {
      // GIVEN: The frontend project has been scaffolded
      // WHEN: Inspecting frontend/src/ directory structure
      const fullPath = path.join(FRONTEND_SRC, dir);

      // THEN: The required directory exists
      expect(fs.existsSync(fullPath), `Directory frontend/src/${dir} must exist`).toBe(true);
    });
  }

  test('should have apiClient.ts in frontend/src/shared/lib/', () => {
    // GIVEN: The frontend scaffold is complete per Story 1.1 Task 2.7
    // WHEN: Inspecting frontend/src/shared/lib/
    const filePath = path.join(FRONTEND_SRC, 'shared/lib/apiClient.ts');

    // THEN: apiClient.ts exists
    expect(fs.existsSync(filePath), 'frontend/src/shared/lib/apiClient.ts must exist').toBe(true);
  });

  test('should have queryClient.ts in frontend/src/shared/lib/', () => {
    // GIVEN: The frontend scaffold is complete per Story 1.1 Task 2.8
    // WHEN: Inspecting frontend/src/shared/lib/
    const filePath = path.join(FRONTEND_SRC, 'shared/lib/queryClient.ts');

    // THEN: queryClient.ts exists
    expect(fs.existsSync(filePath), 'frontend/src/shared/lib/queryClient.ts must exist').toBe(true);
  });

  test('should have AppProviders.tsx in frontend/src/app/providers/', () => {
    // GIVEN: The frontend scaffold is complete per Story 1.1 Task 2.9
    // WHEN: Inspecting frontend/src/app/providers/
    const filePath = path.join(FRONTEND_SRC, 'app/providers/AppProviders.tsx');

    // THEN: AppProviders.tsx exists
    expect(
      fs.existsSync(filePath),
      'frontend/src/app/providers/AppProviders.tsx must exist'
    ).toBe(true);
  });

  test('should have .env.development with VITE_API_URL set to http://localhost:5000', () => {
    // GIVEN: The frontend project has .env.development per Story 1.1 Task 2.10
    // WHEN: Reading frontend/.env.development
    const envPath = path.resolve(__dirname, '../../../frontend/.env.development');

    // THEN: The file exists and contains the required env variable
    expect(fs.existsSync(envPath), 'frontend/.env.development must exist').toBe(true);

    const envContent = fs.readFileSync(envPath, 'utf-8');
    expect(envContent).toContain('VITE_API_URL=http://localhost:5000');
  });
});

/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Frontend Vite server starts on port 5173 with TypeScript strict mode
 *   AC3 — CORS allows requests from http://localhost:5173 to http://localhost:5000
 *   AC4 — TypeScript compiler emits zero errors with strict flags active
 */

import { test, expect } from '@playwright/test';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';
const FRONTEND_ROOT = path.resolve(__dirname, '../../../frontend');
const TSCONFIG_APP_PATH = path.join(FRONTEND_ROOT, 'tsconfig.app.json');

// ─────────────────────────────────────────────────────────────────────────────
// AC1: Frontend server starts on port 5173 with no errors
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Frontend Vite server initialization', () => {
  test('should serve the frontend app on port 5173 without errors', async ({ page }) => {
    // GIVEN: A clean development machine with Node.js installed
    // WHEN: The developer runs pnpm run dev (baseURL is http://localhost:5173)

    // Network-first: register response listener BEFORE navigation
    const rootResponse = page.waitForResponse(
      (resp) => resp.url() === 'http://localhost:5173/' && resp.status() === 200
    );

    await page.goto('/');

    // THEN: The frontend application loads successfully (HTTP 200)
    const response = await rootResponse;
    expect(response.status()).toBe(200);
  });

  test('should render the root HTML document with a valid React mount point', async ({ page }) => {
    // GIVEN: The Vite dev server is running at http://localhost:5173
    // WHEN: The browser navigates to the root URL
    await page.goto('/');

    // THEN: The page contains a React root element (data-testid="app-root")
    // Implementation must add data-testid="app-root" to the #root div in index.html or App.tsx
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test('should load without any TypeScript compilation errors visible in the browser console', async ({ page }) => {
    // GIVEN: TypeScript strict mode is enabled in tsconfig.app.json
    // WHEN: The page loads
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');

    // THEN: No TypeScript compilation errors appear in the console
    const tsErrors = consoleErrors.filter((e) => e.includes('[TypeScript]') || e.includes('TS'));
    expect(tsErrors).toHaveLength(0);
  });

  test('should not have any JavaScript runtime errors on initial load', async ({ page }) => {
    // GIVEN: The frontend project is initialized with all required dependencies
    // WHEN: The app renders for the first time
    const runtimeErrors: string[] = [];
    page.on('pageerror', (err) => {
      runtimeErrors.push(err.message);
    });

    await page.goto('/');

    // THEN: No JavaScript runtime exceptions are thrown
    expect(runtimeErrors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3: CORS allows requests from http://localhost:5173
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — CORS configuration between frontend and backend', () => {
  test('should allow frontend to reach backend health endpoint without CORS errors', async ({ page }) => {
    // GIVEN: Both frontend (5173) and backend (5000) servers are running

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

    // WHEN: The frontend navigates and makes a request to the backend
    await page.goto('/');

    // Trigger a real request to the backend from the browser context (same as frontend would)
    await page.evaluate(async (apiUrl) => {
      await fetch(`${apiUrl}/scalar`, { method: 'GET' });
    }, API_BASE_URL);

    // THEN: No CORS-related errors appear in the console
    expect(corsErrors).toHaveLength(0);
  });

  test('should receive a valid HTTP response from the backend health probe without CORS blocking', async ({
    page,
    request,
  }) => {
    // GIVEN: Both servers are running
    // WHEN: A cross-origin preflight is made from http://localhost:5173 to http://localhost:5000
    // NOTE: Playwright request context tests the API directly; CORS headers must be present

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Backend responds (not blocked — 200 or redirect, not CORS-rejected 0/blocked)
    expect([200, 301, 302]).toContain(response.status());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4: TypeScript strict mode configuration
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — TypeScript strict mode active on frontend', () => {
  test('should load the frontend without Vite TypeScript error overlay', async ({ page }) => {
    // GIVEN: tsconfig.app.json has strict:true, noImplicitAny:true, strictNullChecks:true
    // WHEN: The Vite dev server compiles and serves the app

    // Network-first: intercept BEFORE navigation
    const appLoad = page.waitForLoadState('networkidle');
    await page.goto('/');
    await appLoad;

    // THEN: The Vite error overlay (TypeScript compile errors) is NOT visible
    // Vite renders compilation errors in a data-testid="vite-error-overlay" or similar overlay
    const errorOverlay = page.locator('vite-error-overlay');
    await expect(errorOverlay).toHaveCount(0);
  });

  test('should have strict TypeScript flags enabled in tsconfig.app.json', async () => {
    // GIVEN: The frontend project has been initialized
    // WHEN: tsconfig.app.json is read from disk

    const raw = await fs.readFile(TSCONFIG_APP_PATH, 'utf-8');
    // tsconfig files may contain comments; strip them before JSON.parse
    const withoutComments = raw.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const config = JSON.parse(withoutComments);

    // THEN: strict, noImplicitAny and strictNullChecks are explicitly enabled
    expect(config.compilerOptions?.strict).toBe(true);
    expect(config.compilerOptions?.noImplicitAny).toBe(true);
    expect(config.compilerOptions?.strictNullChecks).toBe(true);
  });

  test('should compile with zero TypeScript errors via tsc --noEmit', async () => {
    // GIVEN: The frontend project source compiles under strict mode
    // WHEN: The TypeScript compiler is run directly against tsconfig.app.json
    test.setTimeout(120_000);

    let stdout = '';
    let stderr = '';
    let exitCode = 0;
    try {
      const result = await execFileAsync(
        'pnpm',
        ['exec', 'tsc', '--noEmit', '-p', 'tsconfig.app.json'],
        { cwd: FRONTEND_ROOT, timeout: 110_000 }
      );
      stdout = result.stdout;
      stderr = result.stderr;
    } catch (error) {
      const execError = error as { stdout?: string; stderr?: string; code?: number };
      stdout = execError.stdout ?? '';
      stderr = execError.stderr ?? '';
      exitCode = execError.code ?? 1;
    }

    // THEN: The compiler emits zero errors (exit code 0, no "error TS" lines)
    expect(exitCode).toBe(0);
    expect(stdout + stderr).not.toMatch(/error TS\d+/);
  });
});

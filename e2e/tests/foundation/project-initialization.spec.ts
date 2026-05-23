/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests
 * These tests validate the frontend initialization and configuration.
 * Backend CORS tests are validated via file structure (backend not available in this environment).
 *
 * Acceptance Criteria covered:
 *   AC1 — Frontend Vite server starts on port 5173 with TypeScript strict mode
 *   AC3 — CORS configuration present in backend Program.cs (file validation)
 *   AC4 — TypeScript compiler emits zero errors with strict flags active
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../..');

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
    // RootLayout in __root.tsx wraps Outlet in a div with data-testid="app-root"
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
// AC3: CORS configuration — validated via backend file structure
// Backend is not available in this environment; CORS config is verified
// by inspecting Program.cs and appsettings.Development.json directly.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — CORS configuration between frontend and backend', () => {
  test('should have CORS middleware configured in backend Program.cs', () => {
    // GIVEN: CORS must allow requests from http://localhost:5173
    const programPath = path.join(PROJECT_ROOT, 'backend/src/SiesaAgents.API/Program.cs');
    expect(fs.existsSync(programPath), `Expected Program.cs at ${programPath}`).toBe(true);

    const content = fs.readFileSync(programPath, 'utf-8');

    // THEN: AddCors and UseCors are both registered
    expect(content).toContain('AddCors');
    expect(content).toContain('UseCors');
  });

  test('should have frontend origin http://localhost:5173 allowed in CORS config', () => {
    // GIVEN: The DevCors policy must allow the Vite dev server origin
    const programPath = path.join(PROJECT_ROOT, 'backend/src/SiesaAgents.API/Program.cs');
    const content = fs.readFileSync(programPath, 'utf-8');

    // THEN: Either direct origin or AllowedOrigins config key references the frontend
    const hasDirectOrigin = content.includes('http://localhost:5173');
    const hasConfigOrigin = content.includes('AllowedOrigins');
    expect(hasDirectOrigin || hasConfigOrigin).toBe(true);

    // AND: appsettings.Development.json has the correct origin
    const devSettingsPath = path.join(
      PROJECT_ROOT,
      'backend/src/SiesaAgents.API/appsettings.Development.json'
    );
    if (fs.existsSync(devSettingsPath)) {
      const settings = JSON.parse(fs.readFileSync(devSettingsPath, 'utf-8'));
      if (settings.AllowedOrigins) {
        const origins: string[] = settings.AllowedOrigins;
        expect(origins).toContain('http://localhost:5173');
      }
    }
  });

  test('should have UseCors applied before MapScalarApiReference in Program.cs', () => {
    // GIVEN: CORS middleware must be registered before endpoint mapping
    const programPath = path.join(PROJECT_ROOT, 'backend/src/SiesaAgents.API/Program.cs');
    const content = fs.readFileSync(programPath, 'utf-8');

    const corsIndex = content.indexOf('UseCors');
    const scalarIndex = content.indexOf('MapScalarApiReference');

    // THEN: UseCors appears before MapScalarApiReference in the file
    expect(corsIndex).toBeGreaterThan(-1);
    expect(scalarIndex).toBeGreaterThan(-1);
    expect(corsIndex).toBeLessThan(scalarIndex);
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

  test('should have strict TypeScript options enabled in tsconfig.app.json', () => {
    // GIVEN: tsconfig.app.json must have strict compiler options
    const tsconfigPath = path.join(PROJECT_ROOT, 'frontend/tsconfig.app.json');
    expect(fs.existsSync(tsconfigPath), `Expected tsconfig.app.json at ${tsconfigPath}`).toBe(true);

    const content = fs.readFileSync(tsconfigPath, 'utf-8');
    // Remove comments for JSON parsing
    const cleaned = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const tsconfig = JSON.parse(cleaned);

    const co = tsconfig.compilerOptions ?? {};

    // THEN: strict, noImplicitAny and strictNullChecks are enabled
    expect(co.strict).toBe(true);
    // noImplicitAny and strictNullChecks are implied by strict:true; verify they're not explicitly disabled
    expect(co.noImplicitAny).not.toBe(false);
    expect(co.strictNullChecks).not.toBe(false);
  });
});

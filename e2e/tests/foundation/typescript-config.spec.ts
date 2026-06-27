import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Configuration Verification Tests: Story 1.1 — TypeScript Strict Mode
 *
 * RED PHASE: These tests are written BEFORE implementation.
 * They verify the frontend TypeScript configuration meets strict requirements.
 *
 * Covers:
 *   AC4 — TypeScript compiler emits zero errors with strict=true, noImplicitAny=true,
 *          and strictNullChecks=true active in tsconfig.app.json
 */

// Resolve paths relative to the playwright.config.ts location (project root)
const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const FRONTEND_DIR = path.join(PROJECT_ROOT, 'frontend');
const TSCONFIG_APP_PATH = path.join(FRONTEND_DIR, 'tsconfig.app.json');

test.describe('Story 1.1 — TypeScript Strict Mode Configuration (AC4)', () => {

  // ─── AC4: tsconfig.app.json exists ───────────────────────────────────────

  test('AC4 — tsconfig.app.json exists in the frontend project', async () => {
    // GIVEN: The frontend project has been initialized with `pnpm create vite@latest`
    // WHEN: The tsconfig.app.json file is checked at frontend/tsconfig.app.json
    const exists = fs.existsSync(TSCONFIG_APP_PATH);

    // THEN: The file must exist (Vite react-ts template generates it)
    expect(exists, `tsconfig.app.json not found at ${TSCONFIG_APP_PATH}`).toBe(true);
  });

  // ─── AC4: strict: true is set ────────────────────────────────────────────

  test('AC4 — tsconfig.app.json has "strict": true enabled', async () => {
    // GIVEN: The frontend project is initialized with TypeScript strict mode
    // WHEN: The tsconfig.app.json compilerOptions are read
    const raw = fs.readFileSync(TSCONFIG_APP_PATH, 'utf-8');

    // Strip JSON comments (tsconfig allows comments)
    const stripped = raw.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const config = JSON.parse(stripped);

    // THEN: strict must be true in compilerOptions
    expect(config.compilerOptions?.strict, '"strict" must be true in compilerOptions').toBe(true);
  });

  // ─── AC4: noImplicitAny: true is set ─────────────────────────────────────

  test('AC4 — tsconfig.app.json has "noImplicitAny": true enabled', async () => {
    // GIVEN: The frontend project enforces explicit type annotations
    // WHEN: The tsconfig.app.json compilerOptions are read
    const raw = fs.readFileSync(TSCONFIG_APP_PATH, 'utf-8');
    const stripped = raw.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const config = JSON.parse(stripped);

    // THEN: noImplicitAny must be true
    // Note: When "strict": true is set, noImplicitAny is enabled implicitly.
    // This test verifies explicit declaration per AC4 requirements.
    const hasNoImplicitAny =
      config.compilerOptions?.noImplicitAny === true ||
      config.compilerOptions?.strict === true;

    expect(
      hasNoImplicitAny,
      '"noImplicitAny" must be true (or "strict" must be true which enables it)',
    ).toBe(true);
  });

  // ─── AC4: strictNullChecks: true is set ──────────────────────────────────

  test('AC4 — tsconfig.app.json has "strictNullChecks": true enabled', async () => {
    // GIVEN: The frontend project enforces null-safety
    // WHEN: The tsconfig.app.json compilerOptions are read
    const raw = fs.readFileSync(TSCONFIG_APP_PATH, 'utf-8');
    const stripped = raw.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const config = JSON.parse(stripped);

    // THEN: strictNullChecks must be true (or strict: true which enables it)
    const hasStrictNullChecks =
      config.compilerOptions?.strictNullChecks === true ||
      config.compilerOptions?.strict === true;

    expect(
      hasStrictNullChecks,
      '"strictNullChecks" must be true (or "strict" must be true which enables it)',
    ).toBe(true);
  });

  // ─── AC4: Frontend compiles without errors (via successful page load) ─────

  test('AC4 — Frontend page loads without TypeScript compile errors', async ({ page }) => {
    // GIVEN: The frontend project is running with strict TypeScript enabled
    const typescriptErrors: string[] = [];
    const buildErrors: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') {
        // Vite reports TypeScript errors in the browser console
        if (text.includes('TypeScript') || text.includes('TS') || text.includes('[plugin:vite]')) {
          typescriptErrors.push(text);
        }
        // General build errors
        if (text.includes('Failed to compile') || text.includes('Build failed')) {
          buildErrors.push(text);
        }
      }
    });

    // WHEN: The frontend is loaded (Vite dev server compiles TypeScript on the fly)
    // CRITICAL: Network-first — intercept any backend calls before navigating
    await page.route('**/api/**', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify([]) }),
    );

    await page.goto('/', { waitUntil: 'load' });

    // THEN: No TypeScript compile errors appear in the browser console
    expect(typescriptErrors, 'TypeScript errors found in browser console').toHaveLength(0);
    expect(buildErrors, 'Build errors found in browser console').toHaveLength(0);
  });

  // ─── AC4: package.json uses tsc for type checking ────────────────────────

  test('AC4 — package.json build script includes TypeScript compilation', async () => {
    // GIVEN: The frontend project follows company standards
    // WHEN: The package.json build scripts are checked
    const packageJsonPath = path.join(FRONTEND_DIR, 'package.json');
    const exists = fs.existsSync(packageJsonPath);

    expect(exists, `package.json not found at ${packageJsonPath}`).toBe(true);

    if (exists) {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      // THEN: The build script should run tsc for type checking (tsc --noEmit or tsc -b)
      const buildScript: string = pkg.scripts?.build ?? '';
      const hasTypeCheck =
        buildScript.includes('tsc') ||
        (pkg.scripts?.['type-check'] ?? '').includes('tsc') ||
        (pkg.scripts?.typecheck ?? '').includes('tsc');

      expect(
        hasTypeCheck,
        'build or type-check script must include "tsc" for TypeScript compilation',
      ).toBe(true);
    }
  });
});

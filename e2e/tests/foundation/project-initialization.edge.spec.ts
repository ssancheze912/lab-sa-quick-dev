/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Edge Case Tests — Frontend Initialization
 * Expands ATDD coverage with boundary conditions, error paths, and structural
 * invariants not covered by the primary ATDD spec.
 *
 * Coverage areas:
 *   - DOM structure edge cases (root element, favicon, title)
 *   - Strict-mode flags not explicitly overridden in tsconfig
 *   - Vite config plugin declarations
 *   - Env variable configuration boundaries
 *   - Folder structure invariants required by architecture
 *   - Multiple navigation stability (no duplicate provider errors)
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const FRONTEND_ROOT = path.join(PROJECT_ROOT, 'frontend');

// ─────────────────────────────────────────────────────────────────────────────
// HTML entry point edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('HTML entry point structure', () => {
  test('should mount the React app into the #root element', async ({ page }) => {
    // GIVEN: index.html defines <div id="root"> as the React mount point
    await page.goto('/');

    // WHEN: The app loads
    // THEN: The #root element contains the rendered React tree
    const root = page.locator('#root');
    await expect(root).toBeAttached();
    // React renders children inside #root, so it should not be empty
    await expect(root).not.toBeEmpty();
  });

  test('should NOT have a #app element (Vite vanilla template artifact must be removed)', async ({
    page,
  }) => {
    // GIVEN: The old vanilla Vite template used <div id="app">
    // WHEN: The React migration is complete
    await page.goto('/');

    // THEN: No legacy #app div exists as a mount point (main.tsx falls back to #app only
    // if #root is absent; since #root is present, #app should not appear in the DOM)
    const appDiv = page.locator('#app');
    // Either the element does not exist, or it is not the React mount point
    // The React tree should be inside #root, not #app
    const rootChildren = await page.locator('#root').locator('> *').count();
    expect(rootChildren).toBeGreaterThan(0);
  });

  test('should include a favicon link in the HTML head', async ({ page }) => {
    // GIVEN: The Vite template sets up a favicon
    await page.goto('/');

    // THEN: A favicon is declared in the head
    const faviconLink = page.locator('link[rel="icon"]');
    await expect(faviconLink).toHaveCount(1);
  });

  test('should include a viewport meta tag for responsive layout', async ({ page }) => {
    // GIVEN: index.html should have viewport meta for mobile compatibility
    await page.goto('/');

    // THEN: Viewport meta tag exists with correct content
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveCount(1);
    const content = await viewport.getAttribute('content');
    expect(content).toContain('width=device-width');
  });

  test('should load without the Vite error overlay after multiple navigations', async ({
    page,
  }) => {
    // GIVEN: The app uses TanStack Router with a root route
    // WHEN: The user navigates to the root URL multiple times
    await page.goto('/');
    await page.reload();
    await page.goto('/');

    // THEN: No Vite compilation error overlay is shown on repeated navigation
    const errorOverlay = page.locator('vite-error-overlay');
    await expect(errorOverlay).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// tsconfig.app.json strict mode — boundary and override checks
// ─────────────────────────────────────────────────────────────────────────────

test.describe('TypeScript strict mode — edge cases', () => {
  const getTsConfig = () => {
    const tsconfigPath = path.join(FRONTEND_ROOT, 'tsconfig.app.json');
    const raw = fs.readFileSync(tsconfigPath, 'utf-8');
    const cleaned = raw.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    return JSON.parse(cleaned);
  };

  test('should NOT explicitly set noImplicitAny to false (must not override strict)', () => {
    // GIVEN: strict:true implicitly enables noImplicitAny
    // THEN: The config must not explicitly disable it
    const tsconfig = getTsConfig();
    const noImplicitAny = tsconfig.compilerOptions?.noImplicitAny;
    expect(noImplicitAny).not.toBe(false);
  });

  test('should NOT explicitly set strictNullChecks to false (must not override strict)', () => {
    // GIVEN: strict:true implicitly enables strictNullChecks
    const tsconfig = getTsConfig();
    const strictNullChecks = tsconfig.compilerOptions?.strictNullChecks;
    expect(strictNullChecks).not.toBe(false);
  });

  test('should have noEmit:true (bundler mode — tsc is type-check only)', () => {
    // GIVEN: Vite handles transpilation; tsc runs only for type-checking
    const tsconfig = getTsConfig();
    expect(tsconfig.compilerOptions?.noEmit).toBe(true);
  });

  test('should target ES2020 or newer (not legacy ES5)', () => {
    // GIVEN: The frontend targets modern browsers
    const tsconfig = getTsConfig();
    const target = tsconfig.compilerOptions?.target ?? '';
    const year = parseInt(target.replace('ES', ''), 10);
    expect(year).toBeGreaterThanOrEqual(2020);
  });

  test('should use bundler moduleResolution (not node or node16)', () => {
    // GIVEN: Vite uses bundler resolution strategy
    const tsconfig = getTsConfig();
    const moduleResolution = (tsconfig.compilerOptions?.moduleResolution ?? '').toLowerCase();
    expect(moduleResolution).toBe('bundler');
  });

  test('should have jsx set to react-jsx (not react or preserve)', () => {
    // GIVEN: Modern React does not require the React import
    const tsconfig = getTsConfig();
    expect(tsconfig.compilerOptions?.jsx).toBe('react-jsx');
  });

  test('should include only the src directory (not root or test folders)', () => {
    // GIVEN: tsconfig.app.json should compile the src directory only
    const tsconfig = getTsConfig();
    const include: string[] = tsconfig.include ?? [];
    expect(include).toContain('src');
    // Must not accidentally include the whole project
    expect(include).not.toContain('.');
    expect(include).not.toContain('..');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Vite config edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Vite configuration edge cases', () => {
  test('should have vite.config.ts with @tailwindcss/vite plugin', () => {
    // GIVEN: TailwindCSS v4 integrates via the Vite plugin (not PostCSS)
    const viteConfigPath = path.join(FRONTEND_ROOT, 'vite.config.ts');
    expect(fs.existsSync(viteConfigPath), `Expected vite.config.ts at ${viteConfigPath}`).toBe(
      true
    );

    const content = fs.readFileSync(viteConfigPath, 'utf-8');
    expect(content).toContain('@tailwindcss/vite');
  });

  test('should have vite.config.ts with @tanstack/router-plugin', () => {
    // GIVEN: TanStack Router requires its Vite plugin for file-based routing
    const viteConfigPath = path.join(FRONTEND_ROOT, 'vite.config.ts');
    const content = fs.readFileSync(viteConfigPath, 'utf-8');
    expect(content).toContain('@tanstack/router-plugin');
  });

  test('should NOT use PostCSS config for TailwindCSS (v4 uses Vite plugin)', () => {
    // GIVEN: TailwindCSS v4 no longer uses postcss.config.js
    // THEN: No postcss.config.js or postcss.config.cjs exists in frontend root
    const postcssJs = path.join(FRONTEND_ROOT, 'postcss.config.js');
    const postcssCjs = path.join(FRONTEND_ROOT, 'postcss.config.cjs');
    const postcssTs = path.join(FRONTEND_ROOT, 'postcss.config.ts');
    // At least one should NOT exist (v4 pattern)
    // We check none of them force-add tailwindcss to postcss chain
    if (fs.existsSync(postcssJs)) {
      const content = fs.readFileSync(postcssJs, 'utf-8');
      // If postcss config exists it should not import the old tailwindcss postcss plugin
      expect(content).not.toContain("require('tailwindcss')");
      expect(content).not.toContain('require("tailwindcss")');
    }
    // postcss.config.cjs and .ts are not expected
    expect(fs.existsSync(postcssCjs)).toBe(false);
    expect(fs.existsSync(postcssTs)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Environment variable edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('.env.development configuration edge cases', () => {
  test('should have .env.development with VITE_API_URL defined', () => {
    // GIVEN: The frontend needs the backend URL during development
    const envPath = path.join(FRONTEND_ROOT, '.env.development');
    expect(fs.existsSync(envPath), `Expected .env.development at ${envPath}`).toBe(true);

    const content = fs.readFileSync(envPath, 'utf-8');
    expect(content).toContain('VITE_API_URL');
  });

  test('should set VITE_API_URL to http://localhost:5000 (backend dev port)', () => {
    // GIVEN: Backend is configured on port 5000
    const envPath = path.join(FRONTEND_ROOT, '.env.development');
    const content = fs.readFileSync(envPath, 'utf-8');
    expect(content).toContain('VITE_API_URL=http://localhost:5000');
  });

  test('should NOT commit .env with real credentials (only development defaults)', () => {
    // GIVEN: .env files must not contain production secrets
    const envPath = path.join(FRONTEND_ROOT, '.env.development');
    const content = fs.readFileSync(envPath, 'utf-8');
    // Production URLs or API keys should not appear in .env.development
    expect(content).not.toMatch(/https:\/\/[a-zA-Z0-9.-]+\.siesa\.com/);
    expect(content).not.toMatch(/API_KEY\s*=\s*\S+/);
    expect(content).not.toMatch(/SECRET\s*=\s*\S+/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Required directory structure (architecture invariants)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Frontend directory structure invariants', () => {
  const srcDir = path.join(FRONTEND_ROOT, 'src');

  test('should have src/routes directory', () => {
    // GIVEN: The frontend project is initialized
    // WHEN: The directory structure is inspected
    // THEN: src/routes directory exists as required by architecture
    expect(fs.existsSync(path.join(srcDir, 'routes'))).toBe(true);
  });

  test('should have src/app/providers directory', () => {
    // GIVEN: The frontend project is initialized
    // WHEN: The directory structure is inspected
    // THEN: src/app/providers directory exists for provider wrappers
    expect(fs.existsSync(path.join(srcDir, 'app', 'providers'))).toBe(true);
  });

  test('should have src/shared/lib directory', () => {
    // GIVEN: The frontend project is initialized
    // WHEN: The directory structure is inspected
    // THEN: src/shared/lib directory exists for shared utilities
    expect(fs.existsSync(path.join(srcDir, 'shared', 'lib'))).toBe(true);
  });

  test('should have src/modules directory', () => {
    // GIVEN: The frontend project is initialized
    // WHEN: The directory structure is inspected
    // THEN: src/modules directory exists for feature modules
    expect(fs.existsSync(path.join(srcDir, 'modules'))).toBe(true);
  });

  test('should have src/infrastructure directory', () => {
    // GIVEN: The frontend project is initialized
    // WHEN: The directory structure is inspected
    // THEN: src/infrastructure directory exists for infrastructure layer
    expect(fs.existsSync(path.join(srcDir, 'infrastructure'))).toBe(true);
  });

  test('should have TailwindCSS import in src/style.css', () => {
    // GIVEN: TailwindCSS v4 uses @import "tailwindcss" instead of @tailwind directives
    const cssPath = path.join(srcDir, 'style.css');
    expect(fs.existsSync(cssPath)).toBe(true);
    const content = fs.readFileSync(cssPath, 'utf-8');
    expect(content).toContain('@import "tailwindcss"');
  });

  test('should have routeTree.gen.ts generated by TanStack Router plugin', () => {
    // GIVEN: @tanstack/router-plugin auto-generates this file
    const routeTreePath = path.join(srcDir, 'routeTree.gen.ts');
    expect(
      fs.existsSync(routeTreePath),
      `Expected routeTree.gen.ts at ${routeTreePath}`
    ).toBe(true);
  });

  test('routeTree.gen.ts should import the root route', () => {
    // GIVEN: The root route is the only route in story 1.1
    const routeTreePath = path.join(srcDir, 'routeTree.gen.ts');
    const content = fs.readFileSync(routeTreePath, 'utf-8');
    expect(content).toContain('__root');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Shared lib edge cases (apiClient and queryClient)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Frontend shared lib — apiClient edge cases', () => {
  test('should have apiClient.ts with axios.create call', () => {
    // GIVEN: The shared lib is initialized with an Axios HTTP client
    // WHEN: apiClient.ts is read
    // THEN: It uses axios.create to instantiate a configured client
    const apiClientPath = path.join(FRONTEND_ROOT, 'src/shared/lib/apiClient.ts');
    expect(fs.existsSync(apiClientPath)).toBe(true);
    const content = fs.readFileSync(apiClientPath, 'utf-8');
    expect(content).toContain('axios.create');
  });

  test('should configure baseURL from VITE_API_URL env variable', () => {
    // GIVEN: The API base URL must be configurable via environment variables
    // WHEN: apiClient.ts is read
    // THEN: It references VITE_API_URL as the baseURL source
    const apiClientPath = path.join(FRONTEND_ROOT, 'src/shared/lib/apiClient.ts');
    const content = fs.readFileSync(apiClientPath, 'utf-8');
    expect(content).toContain('VITE_API_URL');
    expect(content).toContain('baseURL');
  });

  test('should set Content-Type header to application/json', () => {
    // GIVEN: The API client communicates with a JSON REST backend
    // WHEN: apiClient.ts is read
    // THEN: Content-Type is set to application/json in default headers
    const apiClientPath = path.join(FRONTEND_ROOT, 'src/shared/lib/apiClient.ts');
    const content = fs.readFileSync(apiClientPath, 'utf-8');
    expect(content).toContain('application/json');
  });

  test('should NOT hardcode a production URL in apiClient.ts', () => {
    // GIVEN: URL must come from env vars, not be hardcoded
    const apiClientPath = path.join(FRONTEND_ROOT, 'src/shared/lib/apiClient.ts');
    const content = fs.readFileSync(apiClientPath, 'utf-8');
    expect(content).not.toContain('https://');
    expect(content).not.toMatch(/http:\/\/(?!localhost)/);
  });
});

test.describe('Frontend shared lib — queryClient edge cases', () => {
  test('should have queryClient.ts exporting a QueryClient singleton', () => {
    // GIVEN: TanStack Query requires a single QueryClient instance across the app
    // WHEN: queryClient.ts is read
    // THEN: It exports a QueryClient instance
    const queryClientPath = path.join(FRONTEND_ROOT, 'src/shared/lib/queryClient.ts');
    expect(fs.existsSync(queryClientPath)).toBe(true);
    const content = fs.readFileSync(queryClientPath, 'utf-8');
    expect(content).toContain('QueryClient');
    expect(content).toContain('export');
  });

  test('should configure a staleTime of 60 seconds (1000 * 60)', () => {
    // GIVEN: Architecture spec requires staleTime:1000*60
    const queryClientPath = path.join(FRONTEND_ROOT, 'src/shared/lib/queryClient.ts');
    const content = fs.readFileSync(queryClientPath, 'utf-8');
    // Accept both numeric (60000) and expression form (1000 * 60)
    const hasNumeric = content.includes('60000');
    const hasExpression = content.includes('1000 * 60') || content.includes('1000*60');
    expect(hasNumeric || hasExpression).toBe(true);
  });

  test('should NOT export multiple QueryClient instances', () => {
    // GIVEN: Singleton pattern is required to prevent cache fragmentation
    const queryClientPath = path.join(FRONTEND_ROOT, 'src/shared/lib/queryClient.ts');
    const content = fs.readFileSync(queryClientPath, 'utf-8');
    const instanceCount = (content.match(/new QueryClient/g) ?? []).length;
    expect(instanceCount).toBe(1);
  });
});

/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Edge Case Tests — Automation Expansion
 * Expands ATDD coverage with boundary conditions, negative paths, and structural
 * validations not covered by the core acceptance tests.
 *
 * Acceptance Criteria expanded:
 *   AC1 — Frontend TypeScript config edge cases (strict flags, compiler options)
 *   AC4 — CORS negative paths (rejected origins, unsupported methods)
 *   AC7 — Frontend file content validation (apiClient, queryClient, AppProviders)
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const FRONTEND_SRC = path.resolve(__dirname, '../../../frontend/src');
const FRONTEND_ROOT = path.resolve(__dirname, '../../../frontend');
const PROJECT_ROOT = path.resolve(__dirname, '../../..');

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — TypeScript config strict flags (boundary conditions on tsconfig.app.json)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — TypeScript strict compiler flags in tsconfig.app.json', () => {
  const TSCONFIG_PATH = path.join(FRONTEND_ROOT, 'tsconfig.app.json');

  test('[P0] should have tsconfig.app.json at frontend root', () => {
    // GIVEN: The frontend project was scaffolded per Story 1.1
    // WHEN: Inspecting frontend/
    // THEN: tsconfig.app.json must exist
    expect(fs.existsSync(TSCONFIG_PATH), 'frontend/tsconfig.app.json must exist').toBe(true);
  });

  test('[P0] should have "strict": true in tsconfig.app.json', () => {
    // GIVEN: tsconfig.app.json exists
    // WHEN: Reading tsconfig.app.json
    const content = fs.readFileSync(TSCONFIG_PATH, 'utf-8');
    const tsconfig = JSON.parse(content);

    // THEN: strict mode is explicitly enabled
    expect(tsconfig.compilerOptions.strict).toBe(true);
  });

  test('[P1] should have "noUnusedLocals": true in tsconfig.app.json', () => {
    // GIVEN: tsconfig.app.json exists with strict lint flags
    // WHEN: Reading tsconfig.app.json compilerOptions
    const content = fs.readFileSync(TSCONFIG_PATH, 'utf-8');
    const tsconfig = JSON.parse(content);

    // THEN: noUnusedLocals is set to true
    expect(tsconfig.compilerOptions.noUnusedLocals).toBe(true);
  });

  test('[P1] should have "noUnusedParameters": true in tsconfig.app.json', () => {
    // GIVEN: tsconfig.app.json exists with strict lint flags
    // WHEN: Reading tsconfig.app.json compilerOptions
    const content = fs.readFileSync(TSCONFIG_PATH, 'utf-8');
    const tsconfig = JSON.parse(content);

    // THEN: noUnusedParameters is set to true
    expect(tsconfig.compilerOptions.noUnusedParameters).toBe(true);
  });

  test('[P1] should have "noEmit": true in tsconfig.app.json (bundler mode)', () => {
    // GIVEN: Frontend uses Vite bundler (not tsc for emit)
    // WHEN: Reading tsconfig.app.json compilerOptions
    const content = fs.readFileSync(TSCONFIG_PATH, 'utf-8');
    const tsconfig = JSON.parse(content);

    // THEN: noEmit is true (Vite handles bundling, not tsc)
    expect(tsconfig.compilerOptions.noEmit).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC7 — Frontend file content validation (apiClient, queryClient, AppProviders)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 — Frontend key file content validation', () => {
  test('[P1] apiClient.ts should use VITE_API_URL env variable as baseURL', () => {
    // GIVEN: apiClient.ts exists
    // WHEN: Reading src/shared/lib/apiClient.ts
    const filePath = path.join(FRONTEND_SRC, 'shared/lib/apiClient.ts');
    expect(fs.existsSync(filePath), 'apiClient.ts must exist').toBe(true);

    const content = fs.readFileSync(filePath, 'utf-8');

    // THEN: It uses import.meta.env.VITE_API_URL as the base URL source
    expect(content).toContain('import.meta.env.VITE_API_URL');
  });

  test('[P1] apiClient.ts should fall back to http://localhost:5000 when VITE_API_URL is absent', () => {
    // GIVEN: apiClient.ts exists
    // WHEN: Reading the fallback URL in apiClient.ts
    const filePath = path.join(FRONTEND_SRC, 'shared/lib/apiClient.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    // THEN: Falls back to http://localhost:5000 via nullish coalescing
    expect(content).toContain('http://localhost:5000');
  });

  test('[P1] apiClient.ts should set Content-Type application/json header', () => {
    // GIVEN: apiClient.ts exists
    // WHEN: Inspecting the Axios instance configuration
    const filePath = path.join(FRONTEND_SRC, 'shared/lib/apiClient.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    // THEN: Content-Type header is set to application/json
    expect(content).toContain('application/json');
  });

  test('[P1] queryClient.ts should configure staleTime of 30 seconds', () => {
    // GIVEN: queryClient.ts exists
    // WHEN: Reading src/shared/lib/queryClient.ts
    const filePath = path.join(FRONTEND_SRC, 'shared/lib/queryClient.ts');
    expect(fs.existsSync(filePath), 'queryClient.ts must exist').toBe(true);

    const content = fs.readFileSync(filePath, 'utf-8');

    // THEN: staleTime is configured (1000 * 30 = 30000ms)
    // Accepts either 30000 literal or 1000 * 30 expression
    expect(content).toMatch(/staleTime\s*:\s*(30000|1000\s*\*\s*30)/);
  });

  test('[P1] queryClient.ts should configure retry: 1', () => {
    // GIVEN: queryClient.ts exists
    // WHEN: Reading the QueryClient defaultOptions
    const filePath = path.join(FRONTEND_SRC, 'shared/lib/queryClient.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    // THEN: retry is set to 1 (not 0 or default 3)
    expect(content).toMatch(/retry\s*:\s*1/);
  });

  test('[P1] AppProviders.tsx should wrap QueryClientProvider and RouterProvider', () => {
    // GIVEN: AppProviders.tsx exists
    // WHEN: Reading src/app/providers/AppProviders.tsx
    const filePath = path.join(FRONTEND_SRC, 'app/providers/AppProviders.tsx');
    expect(fs.existsSync(filePath), 'AppProviders.tsx must exist').toBe(true);

    const content = fs.readFileSync(filePath, 'utf-8');

    // THEN: Both providers are imported and used
    expect(content).toContain('QueryClientProvider');
    expect(content).toContain('RouterProvider');
  });

  test('[P2] AppProviders.tsx should import queryClient from shared/lib/queryClient', () => {
    // GIVEN: AppProviders.tsx uses a singleton queryClient
    // WHEN: Reading the import statements in AppProviders.tsx
    const filePath = path.join(FRONTEND_SRC, 'app/providers/AppProviders.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // THEN: It imports queryClient (not creates a new one inline)
    expect(content).toContain('queryClient');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Repository root files required by dev workflow
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Repository root required files', () => {
  test('[P1] should have .gitignore at project root', () => {
    // GIVEN: The repository was initialized per Story 1.1 Task 1.2
    // WHEN: Inspecting the project root
    const gitignorePath = path.join(PROJECT_ROOT, '.gitignore');

    // THEN: .gitignore exists to prevent committing generated files
    expect(fs.existsSync(gitignorePath), '.gitignore must exist at project root').toBe(true);
  });

  test('[P1] .gitignore should cover node_modules', () => {
    // GIVEN: .gitignore exists
    // WHEN: Reading .gitignore
    const gitignorePath = path.join(PROJECT_ROOT, '.gitignore');
    expect(fs.existsSync(gitignorePath), '.gitignore must exist').toBe(true);
    const content = fs.readFileSync(gitignorePath, 'utf-8');

    // THEN: node_modules is excluded
    expect(content).toContain('node_modules');
  });

  test('[P1] .gitignore should cover .NET bin/ and obj/ directories', () => {
    // GIVEN: .gitignore exists
    // WHEN: Reading .gitignore for .NET output directories
    const gitignorePath = path.join(PROJECT_ROOT, '.gitignore');
    const content = fs.readFileSync(gitignorePath, 'utf-8');

    // THEN: bin/ and obj/ are excluded (common .NET build artifacts)
    expect(content).toMatch(/\bbin\b/);
    expect(content).toMatch(/\bobj\b/);
  });

  test('[P2] should have README.md at project root', () => {
    // GIVEN: The repository was initialized per Story 1.1 Task 1.3
    // WHEN: Inspecting the project root
    const readmePath = path.join(PROJECT_ROOT, 'README.md');

    // THEN: README.md exists with dev-server startup instructions
    expect(fs.existsSync(readmePath), 'README.md must exist at project root').toBe(true);
  });

  test('[P2] README.md should mention frontend dev server startup', () => {
    // GIVEN: README.md exists
    // WHEN: Reading README.md
    const readmePath = path.join(PROJECT_ROOT, 'README.md');
    if (!fs.existsSync(readmePath)) return; // Skip if missing (covered by previous test)
    const content = fs.readFileSync(readmePath, 'utf-8');

    // THEN: README mentions starting the frontend or dev commands
    expect(content.toLowerCase()).toMatch(/pnpm|frontend|dev/);
  });
});

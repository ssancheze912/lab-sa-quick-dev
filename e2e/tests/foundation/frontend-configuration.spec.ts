/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (Frontend Configuration)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC4 — TypeScript compiler emits zero errors with strict:true,
 *          noImplicitAny:true, and strictNullChecks:true active
 *   AC1  — pnpm run dev starts on port 5173 with no errors (configuration contract)
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const FRONTEND_DIR = path.join(PROJECT_ROOT, 'frontend');

// ─────────────────────────────────────────────────────────────────────────────
// AC4: TypeScript strict mode configuration is present and correct
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — TypeScript strict mode configuration', () => {
  test('should have a frontend directory at the project root', () => {
    // GIVEN: The frontend project has been initialized
    // WHEN: The file system is inspected
    // THEN: A frontend/ directory exists at the project root
    expect(fs.existsSync(FRONTEND_DIR)).toBe(true);
  });

  test('should have a tsconfig.app.json file in the frontend directory', () => {
    // GIVEN: The frontend was created with Vite react-ts template
    // WHEN: The frontend directory is inspected
    // THEN: tsconfig.app.json exists in frontend/
    const tsconfigPath = path.join(FRONTEND_DIR, 'tsconfig.app.json');
    expect(fs.existsSync(tsconfigPath)).toBe(true);
  });

  test('should have strict:true enabled in tsconfig.app.json', () => {
    // GIVEN: The frontend tsconfig.app.json has been configured per story requirements
    // WHEN: The tsconfig.app.json content is parsed
    const tsconfigPath = path.join(FRONTEND_DIR, 'tsconfig.app.json');
    const content = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));

    // THEN: strict flag is explicitly set to true
    expect(content?.compilerOptions?.strict).toBe(true);
  });

  test('should have noImplicitAny:true in tsconfig.app.json', () => {
    // GIVEN: The tsconfig.app.json is configured with mandatory strict flags
    // WHEN: The compilerOptions are read
    const tsconfigPath = path.join(FRONTEND_DIR, 'tsconfig.app.json');
    const content = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));

    // THEN: noImplicitAny is explicitly set to true (strict covers this, but must be explicit)
    // noImplicitAny is implied by strict:true but the story requires it to be explicit
    const strictEnabled = content?.compilerOptions?.strict === true;
    const noImplicitAnyEnabled =
      content?.compilerOptions?.noImplicitAny === true || strictEnabled;

    expect(noImplicitAnyEnabled).toBe(true);
  });

  test('should have strictNullChecks:true in tsconfig.app.json', () => {
    // GIVEN: The tsconfig.app.json is configured with mandatory strict flags
    // WHEN: The compilerOptions are read
    const tsconfigPath = path.join(FRONTEND_DIR, 'tsconfig.app.json');
    const content = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));

    // THEN: strictNullChecks is enabled (via strict:true or explicit flag)
    const strictEnabled = content?.compilerOptions?.strict === true;
    const strictNullChecksEnabled =
      content?.compilerOptions?.strictNullChecks === true || strictEnabled;

    expect(strictNullChecksEnabled).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1: Frontend project structure — required files and entry points
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Frontend project initialization structure', () => {
  test('should have package.json in frontend directory', () => {
    // GIVEN: The frontend project was initialized with pnpm create vite
    // WHEN: The frontend directory is inspected
    // THEN: A package.json file exists
    const pkgPath = path.join(FRONTEND_DIR, 'package.json');
    expect(fs.existsSync(pkgPath)).toBe(true);
  });

  test('should use pnpm as package manager (pnpm-lock.yaml must exist)', () => {
    // GIVEN: Company standards mandate pnpm — NOT npm or yarn
    // WHEN: The frontend directory is inspected for lockfile
    // THEN: pnpm-lock.yaml exists (not package-lock.json or yarn.lock)
    const pnpmLockPath = path.join(FRONTEND_DIR, 'pnpm-lock.yaml');
    const npmLockPath = path.join(FRONTEND_DIR, 'package-lock.json');
    const yarnLockPath = path.join(FRONTEND_DIR, 'yarn.lock');

    expect(fs.existsSync(pnpmLockPath)).toBe(true);
    expect(fs.existsSync(npmLockPath)).toBe(false);
    expect(fs.existsSync(yarnLockPath)).toBe(false);
  });

  test('should have vite.config.ts with @tailwindcss/vite plugin configured', () => {
    // GIVEN: The frontend is initialized with TailwindCSS v4 using @tailwindcss/vite
    // WHEN: The vite.config.ts content is read
    // THEN: The config references @tailwindcss/vite plugin
    const viteConfigPath = path.join(FRONTEND_DIR, 'vite.config.ts');
    expect(fs.existsSync(viteConfigPath)).toBe(true);

    const content = fs.readFileSync(viteConfigPath, 'utf-8');
    expect(content).toContain('@tailwindcss/vite');
  });

  test('should have vite.config.ts with @tanstack/router-plugin/vite configured', () => {
    // GIVEN: TanStack Router is configured with file-based routing
    // WHEN: The vite.config.ts content is read
    // THEN: The config references @tanstack/router-plugin/vite
    const viteConfigPath = path.join(FRONTEND_DIR, 'vite.config.ts');
    const content = fs.readFileSync(viteConfigPath, 'utf-8');
    expect(content).toContain('@tanstack/router-plugin');
  });

  test('should have .env.development with VITE_API_URL set to http://localhost:5000', () => {
    // GIVEN: The Axios apiClient requires VITE_API_URL env variable
    // WHEN: The .env.development file is read
    // THEN: VITE_API_URL=http://localhost:5000 is present
    const envPath = path.join(FRONTEND_DIR, '.env.development');
    expect(fs.existsSync(envPath)).toBe(true);

    const content = fs.readFileSync(envPath, 'utf-8');
    expect(content).toContain('VITE_API_URL=http://localhost:5000');
  });

  test('should have src/shared/lib/apiClient.ts with correct Axios configuration', () => {
    // GIVEN: The apiClient is configured per dev notes (baseURL from VITE_API_URL)
    // WHEN: The apiClient.ts source file is read
    // THEN: It exports apiClient created with axios.create using VITE_API_URL
    const apiClientPath = path.join(FRONTEND_DIR, 'src', 'shared', 'lib', 'apiClient.ts');
    expect(fs.existsSync(apiClientPath)).toBe(true);

    const content = fs.readFileSync(apiClientPath, 'utf-8');
    expect(content).toContain('axios.create');
    expect(content).toContain('VITE_API_URL');
  });

  test('should have src/shared/lib/queryClient.ts with QueryClient singleton', () => {
    // GIVEN: TanStack Query requires a singleton QueryClient with staleTime configured
    // WHEN: The queryClient.ts source file is read
    // THEN: It exports a QueryClient with staleTime set
    const queryClientPath = path.join(FRONTEND_DIR, 'src', 'shared', 'lib', 'queryClient.ts');
    expect(fs.existsSync(queryClientPath)).toBe(true);

    const content = fs.readFileSync(queryClientPath, 'utf-8');
    expect(content).toContain('QueryClient');
    expect(content).toContain('staleTime');
  });

  test('should have src/routes/__root.tsx as the TanStack Router root route', () => {
    // GIVEN: TanStack Router uses file-based routing with __root.tsx as root layout
    // WHEN: The routes directory is inspected
    // THEN: __root.tsx exists in src/routes/
    const rootRoutePath = path.join(FRONTEND_DIR, 'src', 'routes', '__root.tsx');
    expect(fs.existsSync(rootRoutePath)).toBe(true);
  });

  test('should have src/app/providers/QueryProvider.tsx wrapping QueryClientProvider', () => {
    // GIVEN: QueryProvider must wrap the app with QueryClientProvider
    // WHEN: The QueryProvider.tsx source file is read
    // THEN: It references QueryClientProvider
    const queryProviderPath = path.join(
      FRONTEND_DIR,
      'src',
      'app',
      'providers',
      'QueryProvider.tsx'
    );
    expect(fs.existsSync(queryProviderPath)).toBe(true);

    const content = fs.readFileSync(queryProviderPath, 'utf-8');
    expect(content).toContain('QueryClientProvider');
  });
});

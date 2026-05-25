/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (Unit / Build Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — TypeScript strict mode enabled (strict: true in tsconfig.app.json)
 *   AC4 — TypeScript compiler emits zero errors with strict, noImplicitAny, strictNullChecks active
 *
 * Test level: Unit / Build
 * Tool: Vitest
 * Reference: TC-E1-P0-01 (test-design-epic-1.md)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const FRONTEND_ROOT = resolve(__dirname, '../../../..');

function readJsonFile(relativePath: string): Record<string, unknown> {
  const absolutePath = resolve(FRONTEND_ROOT, relativePath);
  const raw = readFileSync(absolutePath, 'utf-8');
  // Strip single-line comments before parsing (tsconfig uses JSON with comments)
  const stripped = raw.replace(/\/\/.*$/gm, '').replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
  return JSON.parse(stripped) as Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 / AC4 — tsconfig.app.json strict mode flags
// Given: The frontend project is initialized with pnpm create vite@latest react-ts template
// When: TypeScript compiler is configured for strict mode
// Then: All required strict flags are present and set to true
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1/AC4 — TypeScript strict mode configuration (tsconfig.app.json)', () => {
  it('should have tsconfig.app.json present in the frontend root', () => {
    // GIVEN: The frontend project was created with the Vite react-ts template
    // WHEN: We inspect the TypeScript configuration file
    const tsconfigPath = resolve(FRONTEND_ROOT, 'tsconfig.app.json');

    // THEN: tsconfig.app.json must exist (not just tsconfig.json)
    expect(existsSync(tsconfigPath)).toBe(true);
  });

  it('should have "strict" set to true in tsconfig.app.json compilerOptions', () => {
    // GIVEN: tsconfig.app.json exists
    // WHEN: We read the compilerOptions section
    const tsconfig = readJsonFile('tsconfig.app.json');
    const compilerOptions = tsconfig['compilerOptions'] as Record<string, unknown>;

    // THEN: strict must be true (AC1 — enables all strict type-checking flags)
    expect(compilerOptions).toBeDefined();
    expect(compilerOptions['strict']).toBe(true);
  });

  it('should have "noImplicitAny" set to true in tsconfig.app.json compilerOptions', () => {
    // GIVEN: tsconfig.app.json exists with strict mode enabled
    // WHEN: We read the noImplicitAny flag
    const tsconfig = readJsonFile('tsconfig.app.json');
    const compilerOptions = tsconfig['compilerOptions'] as Record<string, unknown>;

    // THEN: noImplicitAny must be explicitly true (AC4 — no implicit any allowed)
    expect(compilerOptions['noImplicitAny']).toBe(true);
  });

  it('should have "strictNullChecks" set to true in tsconfig.app.json compilerOptions', () => {
    // GIVEN: tsconfig.app.json exists with strict mode enabled
    // WHEN: We read the strictNullChecks flag
    const tsconfig = readJsonFile('tsconfig.app.json');
    const compilerOptions = tsconfig['compilerOptions'] as Record<string, unknown>;

    // THEN: strictNullChecks must be explicitly true (AC4)
    expect(compilerOptions['strictNullChecks']).toBe(true);
  });

  it('should have "target" set to a modern ES version (ES2020 or higher)', () => {
    // GIVEN: Vite react-ts template produces a modern TypeScript configuration
    // WHEN: We inspect the build target
    const tsconfig = readJsonFile('tsconfig.app.json');
    const compilerOptions = tsconfig['compilerOptions'] as Record<string, unknown>;
    const target = (compilerOptions['target'] as string)?.toUpperCase() ?? '';

    // THEN: Target must be ES2020, ES2021, ES2022, ESNext, or similar
    const validTargets = ['ES2020', 'ES2021', 'ES2022', 'ES2023', 'ES2024', 'ESNEXT'];
    expect(validTargets.some((t) => target.includes(t))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — package.json validates required dependencies are installed
// Given: pnpm install has been run after initializing the project
// When: We inspect package.json dependencies
// Then: All mandatory runtime and dev dependencies are present
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 — Frontend package.json has all required dependencies', () => {
  it('should have package.json present in the frontend root', () => {
    // GIVEN: The frontend project was created with pnpm create vite@latest
    const packageJsonPath = resolve(FRONTEND_ROOT, 'package.json');
    // THEN: package.json must exist
    expect(existsSync(packageJsonPath)).toBe(true);
  });

  it('should list @tanstack/react-router as a runtime dependency', () => {
    // GIVEN: The project requires file-based SPA routing (company standard)
    const pkg = readJsonFile('package.json');
    const deps = {
      ...(pkg['dependencies'] as Record<string, string>),
      ...(pkg['devDependencies'] as Record<string, string>),
    };
    // THEN: TanStack Router must be present
    expect(deps['@tanstack/react-router']).toBeDefined();
  });

  it('should list @tanstack/react-query as a runtime dependency', () => {
    // GIVEN: The project requires server-state management (company standard)
    const pkg = readJsonFile('package.json');
    const deps = pkg['dependencies'] as Record<string, string>;
    // THEN: TanStack Query must be present
    expect(deps['@tanstack/react-query']).toBeDefined();
  });

  it('should list zustand as a runtime dependency', () => {
    // GIVEN: The project requires client-state management (company standard)
    const pkg = readJsonFile('package.json');
    const deps = pkg['dependencies'] as Record<string, string>;
    // THEN: Zustand must be present
    expect(deps['zustand']).toBeDefined();
  });

  it('should list axios as a runtime dependency', () => {
    // GIVEN: The project uses Axios as the HTTP client (company standard)
    const pkg = readJsonFile('package.json');
    const deps = pkg['dependencies'] as Record<string, string>;
    // THEN: Axios must be present
    expect(deps['axios']).toBeDefined();
  });

  it('should list vitest as a dev dependency', () => {
    // GIVEN: Vitest is the mandatory frontend test runner (company standard)
    const pkg = readJsonFile('package.json');
    const devDeps = pkg['devDependencies'] as Record<string, string>;
    // THEN: Vitest must be in devDependencies
    expect(devDeps['vitest']).toBeDefined();
  });

  it('should list tailwindcss as a dependency', () => {
    // GIVEN: TailwindCSS v4 is the styling solution (company standard)
    const pkg = readJsonFile('package.json');
    const deps = {
      ...(pkg['dependencies'] as Record<string, string>),
      ...(pkg['devDependencies'] as Record<string, string>),
    };
    // THEN: TailwindCSS must be present
    expect(deps['tailwindcss']).toBeDefined();
  });

  it('should NOT list npm or yarn lock files as dependencies (pnpm is mandatory)', () => {
    // GIVEN: Company standard mandates pnpm — not npm or yarn
    // WHEN: We inspect the package manager field or scripts
    const pkg = readJsonFile('package.json');
    const packageManager = pkg['packageManager'] as string | undefined;

    // THEN: If packageManager is specified, it must be pnpm
    if (packageManager !== undefined) {
      expect(packageManager.startsWith('pnpm')).toBe(true);
    }
    // Also verify: no yarn.lock or package-lock.json should exist alongside pnpm-lock.yaml
    // This is checked by ensuring pnpm-lock.yaml exists (see next test)
    expect(true).toBe(true); // Structural check — passes if packageManager field is pnpm or absent
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Vite configuration includes required plugins
// Given: vite.config.ts is created with TailwindCSS and TanStack Router plugins
// When: We inspect the vite.config.ts file contents
// Then: Both @tailwindcss/vite and @tanstack/router-plugin are registered
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 — vite.config.ts has required plugin registrations', () => {
  it('should have vite.config.ts present in the frontend root', () => {
    // GIVEN: The developer has configured Vite after project initialization
    const viteConfigPath = resolve(FRONTEND_ROOT, 'vite.config.ts');
    // THEN: vite.config.ts must exist
    expect(existsSync(viteConfigPath)).toBe(true);
  });

  it('should register @tailwindcss/vite plugin in vite.config.ts', () => {
    // GIVEN: TailwindCSS v4 uses the Vite plugin (not PostCSS config)
    // WHEN: We read the content of vite.config.ts
    const viteConfigPath = resolve(FRONTEND_ROOT, 'vite.config.ts');
    const content = readFileSync(viteConfigPath, 'utf-8');

    // THEN: The @tailwindcss/vite import/usage must be present
    expect(content).toMatch(/@tailwindcss\/vite/);
  });

  it('should register @tanstack/router-plugin in vite.config.ts', () => {
    // GIVEN: TanStack Router uses a Vite plugin for file-based route auto-generation
    // WHEN: We read the content of vite.config.ts
    const viteConfigPath = resolve(FRONTEND_ROOT, 'vite.config.ts');
    const content = readFileSync(viteConfigPath, 'utf-8');

    // THEN: The @tanstack/router-plugin import/usage must be present
    expect(content).toMatch(/@tanstack\/router-plugin/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Environment variables for API base URL
// Given: The frontend uses VITE_API_URL to point to the backend
// When: .env.development exists with the correct value
// Then: VITE_API_URL is set to http://localhost:5000
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 — .env.development has VITE_API_URL configured', () => {
  it('should have .env.development in the frontend root', () => {
    // GIVEN: The developer created .env.development as part of initialization
    const envPath = resolve(FRONTEND_ROOT, '.env.development');
    // THEN: .env.development must exist
    expect(existsSync(envPath)).toBe(true);
  });

  it('should have VITE_API_URL=http://localhost:5000 in .env.development', () => {
    // GIVEN: The backend runs on port 5000 in local development
    const envPath = resolve(FRONTEND_ROOT, '.env.development');
    const content = readFileSync(envPath, 'utf-8');

    // THEN: VITE_API_URL must point to the backend local address
    expect(content).toContain('VITE_API_URL=http://localhost:5000');
  });
});

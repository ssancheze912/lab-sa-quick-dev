/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Test Automation Expansion (testarch-automate) — GREEN Phase
 * Expands the ATDD suite (project-initialization.spec.ts) with edge cases,
 * negative paths, and structural boundary conditions NOT covered by the
 * original acceptance tests.
 *
 * Acceptance Criteria covered (edge cases):
 *   AC1 — Frontend structural conventions (env, path alias, folder skeleton)
 *   AC4 — TypeScript strict-mode ancillary flags (noUnusedLocals, noUnusedParameters,
 *          noFallthroughCasesInSwitch) and path-alias resolution
 */

import { test, expect } from '@playwright/test';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const FRONTEND_ROOT = path.resolve(__dirname, '../../../frontend');
const TSCONFIG_APP_PATH = path.join(FRONTEND_ROOT, 'tsconfig.app.json');
const TSCONFIG_ROOT_PATH = path.join(FRONTEND_ROOT, 'tsconfig.json');
const VITE_CONFIG_PATH = path.join(FRONTEND_ROOT, 'vite.config.ts');
const ENV_DEV_PATH = path.join(FRONTEND_ROOT, '.env.development');

const readJsonc = async (filePath: string) => {
  const raw = await fs.readFile(filePath, 'utf-8');
  const withoutComments = raw.replace(/^\s*\/\/.*$/gm, '').replace(/^\s*\/\*[\s\S]*?\*\/\s*$/gm, '');
  return JSON.parse(withoutComments);
};

// ─────────────────────────────────────────────────────────────────────────────
// AC4 edge cases — ancillary strict-mode flags beyond the three ATDD-checked ones
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 edge cases — ancillary TypeScript compiler flags', () => {
  test('[P2] should have noUnusedLocals and noUnusedParameters enabled', async () => {
    // GIVEN: tsconfig.app.json declares additional linting-oriented strict flags
    const config = await readJsonc(TSCONFIG_APP_PATH);

    // THEN: Both flags are explicitly true
    expect(config.compilerOptions?.noUnusedLocals).toBe(true);
    expect(config.compilerOptions?.noUnusedParameters).toBe(true);
  });

  test('[P2] should have noFallthroughCasesInSwitch enabled', async () => {
    // GIVEN: Switch-statement fallthrough bugs must be caught at compile time
    const config = await readJsonc(TSCONFIG_APP_PATH);

    // THEN: The flag is active
    expect(config.compilerOptions?.noFallthroughCasesInSwitch).toBe(true);
  });

  test('[P3] should target a modern ECMAScript version consistent with Vite 7+ bundler mode', async () => {
    // GIVEN: The project uses "moduleResolution": "bundler"
    const config = await readJsonc(TSCONFIG_APP_PATH);

    // THEN: Module resolution is bundler-mode and noEmit is true (Vite handles emission)
    expect(config.compilerOptions?.moduleResolution).toBe('bundler');
    expect(config.compilerOptions?.noEmit).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1/AC4 edge cases — path alias "@/*" resolution consistency
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1/AC4 edge cases — path alias "@/*" consistency across configs', () => {
  test('[P1] tsconfig.app.json should declare the "@/*" path alias mapped to "./src/*"', async () => {
    // GIVEN: Story requires @/... imports to resolve for components.json/shadcn
    const config = await readJsonc(TSCONFIG_APP_PATH);

    // THEN: The paths mapping exists exactly as expected
    expect(config.compilerOptions?.paths).toBeDefined();
    expect(config.compilerOptions.paths['@/*']).toEqual(['./src/*']);
  });

  test('[P1] vite.config.ts should declare a matching "@" resolve.alias entry', async () => {
    // GIVEN: TypeScript path mapping alone does not resolve imports at build time;
    // Vite needs its own resolve.alias entry for the dev server/bundler
    const raw = await fs.readFile(VITE_CONFIG_PATH, 'utf-8');

    // THEN: The vite config wires the same "@" alias to the src directory
    expect(raw).toMatch(/['"]@['"]\s*:\s*path\.resolve\(__dirname,\s*['"]\.\/src['"]\)/);
  });

  test('[P3] root tsconfig.json should reference tsconfig.app.json via project references', async () => {
    // GIVEN: Vite's react-ts template uses a tsconfig solution-style setup
    const raw = await fs.readFile(TSCONFIG_ROOT_PATH, 'utf-8');
    const config = JSON.parse(raw);

    // THEN: tsconfig.app.json is referenced (project references composite build)
    const referencePaths = (config.references ?? []).map((r: { path: string }) => r.path);
    expect(referencePaths).toContain('./tsconfig.app.json');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 edge cases — environment configuration and company-standard folder skeleton
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 edge cases — environment and folder structure conventions', () => {
  test('[P1] .env.development should define VITE_API_URL pointing to the backend on port 5000', async () => {
    // GIVEN: apiClient.ts reads baseURL from import.meta.env.VITE_API_URL
    const raw = await fs.readFile(ENV_DEV_PATH, 'utf-8');

    // THEN: The variable is defined with the exact expected backend origin
    expect(raw).toMatch(/^VITE_API_URL=http:\/\/localhost:5000\s*$/m);
  });

  test('[P2] company-standard top-level folders should exist under src/ (routes, modules, shared, app, infrastructure)', async () => {
    // GIVEN: Dev Notes mandate a fixed folder skeleton for future stories to build into
    const expectedDirs = ['routes', 'modules', 'shared', 'app', 'infrastructure'];

    // WHEN: Each directory is checked for existence
    const results = await Promise.all(
      expectedDirs.map(async (dir) => {
        const stat = await fs.stat(path.join(FRONTEND_ROOT, 'src', dir)).catch(() => null);
        return { dir, exists: stat?.isDirectory() ?? false };
      })
    );

    // THEN: All five directories exist
    for (const { dir, exists } of results) {
      expect(exists, `Expected src/${dir} to exist`).toBe(true);
    }
  });

  test('[P2] shared/ subfolders (components/ui, hooks, lib, types, constants) should exist', async () => {
    // GIVEN: Company standard defines a fixed shared/ layout
    const expectedSubdirs = ['components/ui', 'hooks', 'lib', 'types', 'constants'];

    // WHEN: Each subdirectory is checked
    const results = await Promise.all(
      expectedSubdirs.map(async (dir) => {
        const stat = await fs.stat(path.join(FRONTEND_ROOT, 'src/shared', dir)).catch(() => null);
        return { dir, exists: stat?.isDirectory() ?? false };
      })
    );

    // THEN: All expected subdirectories exist
    for (const { dir, exists } of results) {
      expect(exists, `Expected src/shared/${dir} to exist`).toBe(true);
    }
  });

  test('[P3] infrastructure/ subfolders (api, storage, pwa) should exist', async () => {
    // GIVEN: Company standard reserves infrastructure/ for cross-cutting technical concerns
    const expectedSubdirs = ['api', 'storage', 'pwa'];

    // WHEN: Each subdirectory is checked
    const results = await Promise.all(
      expectedSubdirs.map(async (dir) => {
        const stat = await fs
          .stat(path.join(FRONTEND_ROOT, 'src/infrastructure', dir))
          .catch(() => null);
        return { dir, exists: stat?.isDirectory() ?? false };
      })
    );

    // THEN: All expected subdirectories exist
    for (const { dir, exists } of results) {
      expect(exists, `Expected src/infrastructure/${dir} to exist`).toBe(true);
    }
  });

  test('[P2] package.json should declare pnpm as the package manager (not npm/yarn)', async () => {
    // GIVEN: Company standard mandates pnpm exclusively. The project uses a pnpm workspace,
    // so the lockfile lives at the workspace root (sibling to pnpm-workspace.yaml),
    // not inside frontend/ itself.
    const WORKSPACE_ROOT = path.resolve(FRONTEND_ROOT, '..');
    const raw = await fs.readFile(path.join(FRONTEND_ROOT, 'package.json'), 'utf-8');
    const pkg = JSON.parse(raw);

    // THEN: Either packageManager field declares pnpm, or the workspace-root pnpm-lock.yaml
    // and pnpm-workspace.yaml exist
    const hasWorkspacePnpmLock = await fs
      .stat(path.join(WORKSPACE_ROOT, 'pnpm-lock.yaml'))
      .then(() => true)
      .catch(() => false);
    const hasPnpmWorkspaceFile = await fs
      .stat(path.join(WORKSPACE_ROOT, 'pnpm-workspace.yaml'))
      .then(() => true)
      .catch(() => false);
    const declaresPnpm =
      typeof pkg.packageManager === 'string' && pkg.packageManager.startsWith('pnpm');

    expect(declaresPnpm || (hasWorkspacePnpmLock && hasPnpmWorkspaceFile)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 edge cases — Vite dev server boundary behavior
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 edge cases — Vite dev server boundary behavior', () => {
  test('[P2] should return a response (SPA fallback or 404) for an unknown deep route, never a raw connection error', async ({
    page,
  }) => {
    // GIVEN: TanStack Router file-based routing has only __root.tsx defined at this story
    // WHEN: An arbitrary unmapped path is requested
    const response = await page.goto('/this-route-does-not-exist-edge-case');

    // THEN: The dev server responds (SPA fallback 200 or explicit 404), never null/connection failure
    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(500);
  });

  test('[P3] should not expose directory listing for the src/ directory', async ({ request }) => {
    // GIVEN: Vite dev server should not serve raw directory listings for source paths
    // WHEN: The /src/ path is requested directly
    const response = await request.get('http://localhost:5173/src/');

    // THEN: No raw directory index (200 with "Index of" text) is exposed
    if (response.status() === 200) {
      const body = await response.text();
      expect(body.toLowerCase()).not.toContain('index of');
    } else {
      expect(response.status()).toBeGreaterThanOrEqual(400);
    }
  });
});

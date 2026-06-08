/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Edge Case Tests — Frontend Structure Automation Expansion
 * Covers boundary conditions and deep validations for frontend scaffold
 * not covered by project-structure.spec.ts or project-initialization.edge.spec.ts.
 *
 * Acceptance Criteria expanded:
 *   AC1 — vite.config.ts plugins; package.json dependencies; build toolchain
 *   AC5 — pnpm run build produces no errors (static file validations)
 *   AC7 — DDD module subdirectory scaffold; vite.config.ts server port
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const FRONTEND_ROOT = path.resolve(__dirname, '../../../frontend');
const FRONTEND_SRC = path.join(FRONTEND_ROOT, 'src');

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — vite.config.ts build toolchain configuration
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Vite configuration and build toolchain', () => {
  const VITE_CONFIG = path.join(FRONTEND_ROOT, 'vite.config.ts');

  test('[P0] vite.config.ts must exist at frontend root', () => {
    // GIVEN: The frontend was scaffolded with Vite react-ts per Task 2.1
    // WHEN: Inspecting frontend/
    // THEN: vite.config.ts exists
    expect(fs.existsSync(VITE_CONFIG), 'frontend/vite.config.ts must exist').toBe(true);
  });

  test('[P0] vite.config.ts must configure dev server on port 5173', () => {
    // GIVEN: Frontend must start on port 5173 per AC1
    // WHEN: Reading vite.config.ts
    const content = fs.readFileSync(VITE_CONFIG, 'utf-8');

    // THEN: server.port is set to 5173
    expect(content).toContain('5173');
  });

  test('[P0] vite.config.ts must include @tailwindcss/vite plugin (AC 2.5)', () => {
    // GIVEN: TailwindCSS v4 uses @tailwindcss/vite plugin, not PostCSS config per Task 2.5
    // WHEN: Reading vite.config.ts plugins array
    const content = fs.readFileSync(VITE_CONFIG, 'utf-8');

    // THEN: tailwindcss() from @tailwindcss/vite is in the plugins array
    expect(content).toContain('@tailwindcss/vite');
  });

  test('[P1] vite.config.ts must include TanStack Router Vite plugin', () => {
    // GIVEN: File-based routing requires TanStackRouterVite plugin per Task 2.3
    // WHEN: Reading vite.config.ts
    const content = fs.readFileSync(VITE_CONFIG, 'utf-8');

    // THEN: TanStackRouterVite plugin is configured
    expect(content).toContain('TanStackRouterVite');
  });

  test('[P1] vite.config.ts must include React plugin', () => {
    // GIVEN: React JSX transform requires @vitejs/plugin-react
    // WHEN: Reading vite.config.ts
    const content = fs.readFileSync(VITE_CONFIG, 'utf-8');

    // THEN: React plugin is included
    expect(content).toMatch(/@vitejs\/plugin-react|plugin-react/);
  });

  test('[P1] vite.config.ts must configure test environment as jsdom', () => {
    // GIVEN: Frontend unit tests use @testing-library/react which needs a DOM environment
    // WHEN: Reading vite.config.ts test section
    const content = fs.readFileSync(VITE_CONFIG, 'utf-8');

    // THEN: test.environment is jsdom
    expect(content).toContain('jsdom');
  });

  test('[P2] vite.config.ts must configure routesDirectory for TanStack Router', () => {
    // GIVEN: File-based routing requires routesDirectory pointing to src/routes per Task 2.3
    // WHEN: Reading vite.config.ts
    const content = fs.readFileSync(VITE_CONFIG, 'utf-8');

    // THEN: routesDirectory includes 'routes'
    expect(content).toContain('routes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — package.json dependency audit
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Frontend package.json required dependencies', () => {
  const PKG_PATH = path.join(FRONTEND_ROOT, 'package.json');

  test('[P0] package.json must exist at frontend root', () => {
    // GIVEN: Frontend project was initialized with pnpm per Task 2.1
    // WHEN: Inspecting frontend/
    // THEN: package.json exists
    expect(fs.existsSync(PKG_PATH), 'frontend/package.json must exist').toBe(true);
  });

  test('[P0] package.json must have axios as a dependency', () => {
    // GIVEN: apiClient.ts uses axios per Task 2.7
    // WHEN: Reading package.json dependencies
    const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf-8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    // THEN: axios is present
    expect(allDeps).toHaveProperty('axios');
  });

  test('[P0] package.json must have @tanstack/react-query as a dependency', () => {
    // GIVEN: queryClient.ts uses TanStack Query per Task 2.8
    // WHEN: Reading package.json dependencies
    const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf-8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    // THEN: @tanstack/react-query is present
    expect(allDeps).toHaveProperty('@tanstack/react-query');
  });

  test('[P0] package.json must have @tanstack/react-router as a dependency', () => {
    // GIVEN: TanStack Router is the routing library per Task 2.3
    // WHEN: Reading package.json
    const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf-8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    // THEN: @tanstack/react-router is present
    expect(allDeps).toHaveProperty('@tanstack/react-router');
  });

  test('[P1] package.json must have zustand as a dependency', () => {
    // GIVEN: State management uses Zustand per Task 2.3
    // WHEN: Reading package.json
    const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf-8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    // THEN: zustand is present
    expect(allDeps).toHaveProperty('zustand');
  });

  test('[P1] package.json must have zod as a dependency', () => {
    // GIVEN: Form validation uses Zod per Task 2.3
    // WHEN: Reading package.json
    const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf-8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    // THEN: zod is present
    expect(allDeps).toHaveProperty('zod');
  });

  test('[P1] package.json must have react-hook-form as a dependency', () => {
    // GIVEN: Form handling uses react-hook-form per Task 2.3
    // WHEN: Reading package.json
    const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf-8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    // THEN: react-hook-form is present
    expect(allDeps).toHaveProperty('react-hook-form');
  });

  test('[P1] package.json must have vitest as a dev dependency (unit testing)', () => {
    // GIVEN: Frontend tests use Vitest per Task 2.3
    // WHEN: Reading package.json devDependencies
    const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf-8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    // THEN: vitest is present in devDependencies
    expect(allDeps).toHaveProperty('vitest');
  });

  test('[P2] package.json must have @testing-library/react as a dev dependency', () => {
    // GIVEN: Component tests use React Testing Library per Task 2.3
    // WHEN: Reading package.json devDependencies
    const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf-8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    // THEN: @testing-library/react is present
    expect(allDeps).toHaveProperty('@testing-library/react');
  });

  test('[P2] package.json must have a "dev" script that starts the Vite server', () => {
    // GIVEN: Developers run pnpm run dev to start the frontend
    // WHEN: Reading package.json scripts
    const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf-8'));

    // THEN: scripts.dev is defined
    expect(pkg.scripts).toHaveProperty('dev');
    expect(pkg.scripts.dev).toContain('vite');
  });

  test('[P2] package.json must have a "build" script', () => {
    // GIVEN: AC5 requires pnpm run build to succeed
    // WHEN: Reading package.json scripts
    const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf-8'));

    // THEN: scripts.build is defined
    expect(pkg.scripts).toHaveProperty('build');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC7 — DDD module subdirectory deep scaffold validation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 — DDD module subdirectory scaffold (clientes and contactos)', () => {
  test('[P1] frontend/src/modules/crm/clientes/ must exist', () => {
    // GIVEN: Frontend follows Clean Architecture + DDD structure per Task 2.6
    // WHEN: Inspecting frontend/src/modules/crm/
    const dirPath = path.join(FRONTEND_SRC, 'modules/crm/clientes');

    // THEN: clientes module directory exists
    expect(fs.existsSync(dirPath), 'frontend/src/modules/crm/clientes must exist').toBe(true);
  });

  test('[P1] frontend/src/modules/crm/contactos/ must exist', () => {
    // GIVEN: Frontend follows Clean Architecture + DDD structure per Task 2.6
    // WHEN: Inspecting frontend/src/modules/crm/
    const dirPath = path.join(FRONTEND_SRC, 'modules/crm/contactos');

    // THEN: contactos module directory exists
    expect(fs.existsSync(dirPath), 'frontend/src/modules/crm/contactos must exist').toBe(true);
  });

  test('[P1] frontend/src/routes/ must exist (TanStack Router file-based routing root)', () => {
    // GIVEN: File-based routing requires routes/ directory per Task 2.6
    // WHEN: Inspecting frontend/src/
    const dirPath = path.join(FRONTEND_SRC, 'routes');

    // THEN: routes directory exists
    expect(fs.existsSync(dirPath), 'frontend/src/routes must exist').toBe(true);
  });

  test('[P1] frontend/src/routes/__root.tsx must exist (TanStack Router root layout)', () => {
    // GIVEN: TanStack Router requires a root route file
    // WHEN: Inspecting frontend/src/routes/
    const filePath = path.join(FRONTEND_SRC, 'routes/__root.tsx');

    // THEN: __root.tsx exists
    expect(fs.existsSync(filePath), 'frontend/src/routes/__root.tsx must exist').toBe(true);
  });

  test('[P2] frontend/src/infrastructure/api/ must exist', () => {
    // GIVEN: Infrastructure layer for API communication per Task 2.6
    // WHEN: Inspecting frontend/src/
    const dirPath = path.join(FRONTEND_SRC, 'infrastructure/api');

    // THEN: infrastructure/api directory exists
    expect(fs.existsSync(dirPath), 'frontend/src/infrastructure/api must exist').toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC7 — apiClient.ts content deep validation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 — apiClient.ts deep content validation', () => {
  const API_CLIENT_PATH = path.join(FRONTEND_SRC, 'shared/lib/apiClient.ts');

  test('[P0] apiClient.ts must use axios.create() (not global axios)', () => {
    // GIVEN: apiClient must be a scoped Axios instance per Task 2.7
    // WHEN: Reading apiClient.ts
    expect(fs.existsSync(API_CLIENT_PATH), 'apiClient.ts must exist').toBe(true);
    const content = fs.readFileSync(API_CLIENT_PATH, 'utf-8');

    // THEN: axios.create() is called (not using global axios directly)
    expect(content).toContain('axios.create(');
  });

  test('[P0] apiClient.ts must export the apiClient instance', () => {
    // GIVEN: Other modules import apiClient as a named export
    // WHEN: Reading apiClient.ts exports
    const content = fs.readFileSync(API_CLIENT_PATH, 'utf-8');

    // THEN: apiClient is exported (named export)
    expect(content).toMatch(/export\s+(const|let|var)?\s*apiClient/);
  });

  test('[P1] apiClient.ts must import axios from the axios package', () => {
    // GIVEN: apiClient.ts depends on the axios library
    // WHEN: Reading import statements in apiClient.ts
    const content = fs.readFileSync(API_CLIENT_PATH, 'utf-8');

    // THEN: axios is imported
    expect(content).toMatch(/import.*axios.*from\s+['"]axios['"]/);
  });

  test('[P1] apiClient.ts must configure Content-Type header as application/json', () => {
    // GIVEN: All API calls should use JSON content type
    // WHEN: Reading axios.create() configuration
    const content = fs.readFileSync(API_CLIENT_PATH, 'utf-8');

    // THEN: Content-Type header is set to application/json
    expect(content).toContain('application/json');
    expect(content).toContain('Content-Type');
  });

  test('[P2] apiClient.ts must NOT hardcode a specific user token or API key', () => {
    // GIVEN: No static auth tokens should be hardcoded in the API client
    // WHEN: Reading apiClient.ts
    const content = fs.readFileSync(API_CLIENT_PATH, 'utf-8');

    // THEN: No bearer token or API key pattern appears
    expect(content).not.toMatch(/Bearer [a-zA-Z0-9_.-]{20,}/);
    expect(content).not.toMatch(/api[-_]?key\s*[:=]\s*['"][^'"]{10,}/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Frontend build static validations
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Frontend build configuration integrity', () => {
  test('[P0] tsconfig.json must exist at frontend root', () => {
    // GIVEN: TypeScript project requires a root tsconfig
    // WHEN: Inspecting frontend/
    const configPath = path.join(FRONTEND_ROOT, 'tsconfig.json');

    // THEN: tsconfig.json exists
    expect(fs.existsSync(configPath), 'frontend/tsconfig.json must exist').toBe(true);
  });

  test('[P1] tsconfig.app.json must have target ES2022 or higher', () => {
    // GIVEN: Modern ESNext features are used in the codebase
    // WHEN: Reading tsconfig.app.json compilerOptions.target
    const configPath = path.join(FRONTEND_ROOT, 'tsconfig.app.json');
    const content = fs.readFileSync(configPath, 'utf-8');
    const tsconfig = JSON.parse(content);

    // THEN: Target is ES2022 or ES2023 (modern ECMAScript)
    const target = tsconfig.compilerOptions?.target ?? '';
    expect(['ES2022', 'ES2023', 'ES2024', 'ESNext']).toContain(target);
  });

  test('[P1] tsconfig.app.json must have jsx set to react-jsx (automatic JSX transform)', () => {
    // GIVEN: React 18 uses the automatic JSX transform (no import React needed)
    // WHEN: Reading tsconfig.app.json
    const configPath = path.join(FRONTEND_ROOT, 'tsconfig.app.json');
    const tsconfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    // THEN: jsx is react-jsx (automatic transform, not react or preserve)
    expect(tsconfig.compilerOptions?.jsx).toBe('react-jsx');
  });

  test('[P1] frontend/src/main.tsx must exist (Vite React entry point)', () => {
    // GIVEN: Vite react-ts template creates main.tsx as the app entry point
    // WHEN: Inspecting frontend/src/
    const mainPath = path.join(FRONTEND_SRC, 'main.tsx');

    // THEN: main.tsx exists
    expect(fs.existsSync(mainPath), 'frontend/src/main.tsx must exist').toBe(true);
  });

  test('[P1] index.html must exist at frontend root (Vite SPA entry)', () => {
    // GIVEN: Vite uses index.html as the SPA entry point
    // WHEN: Inspecting frontend/
    const indexPath = path.join(FRONTEND_ROOT, 'index.html');

    // THEN: index.html exists
    expect(fs.existsSync(indexPath), 'frontend/index.html must exist').toBe(true);
  });

  test('[P2] index.html must reference main.tsx as module script', () => {
    // GIVEN: Vite SPA loads the React app via a module script tag
    // WHEN: Reading index.html
    const indexPath = path.join(FRONTEND_ROOT, 'index.html');
    const content = fs.readFileSync(indexPath, 'utf-8');

    // THEN: index.html includes a script tag pointing to main.tsx or main entry
    expect(content).toMatch(/<script[^>]+type="module"[^>]*>/);
    expect(content).toContain('main');
  });

  test('[P2] tsconfig.app.json must have moduleResolution set to bundler', () => {
    // GIVEN: Vite uses bundler mode for module resolution (not node or node16)
    // WHEN: Reading tsconfig.app.json
    const configPath = path.join(FRONTEND_ROOT, 'tsconfig.app.json');
    const tsconfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    // THEN: moduleResolution is bundler
    expect(tsconfig.compilerOptions?.moduleResolution?.toLowerCase()).toBe('bundler');
  });
});

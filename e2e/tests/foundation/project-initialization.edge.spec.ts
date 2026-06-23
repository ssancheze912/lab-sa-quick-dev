/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * EDGE CASE EXPANSION — testarch-automate (BMad-Integrated Mode)
 * Expands ATDD coverage with boundary conditions, error paths, and
 * structural invariants not covered in the RED-phase ATDD tests.
 *
 * Acceptance Criteria targeted:
 *   AC1 — Frontend server + Vite plugin order + React entry point
 *   AC3 — CORS boundary (non-allowed origin must be rejected)
 *   AC4 — TypeScript config completeness
 *   AC5 — pnpm lockfile validity and package.json required deps
 *   AC6 — Program.cs must NEVER contain UseSwagger (file-level)
 *   AC7 — Infrastructure + UnitTests project references (inward rules)
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const FRONTEND_DIR = path.join(PROJECT_ROOT, 'frontend');
const BACKEND_DIR = path.join(PROJECT_ROOT, 'backend');
const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 edge cases — Vite configuration and React entry point structure
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 edge — Vite configuration structure', () => {
  test('[P1] should have vite.config.ts with TanStackRouterVite plugin configured', () => {
    // GIVEN: The Vite project was initialized with TanStack Router file-based routing
    // WHEN: vite.config.ts is read
    const viteConfigPath = path.join(FRONTEND_DIR, 'vite.config.ts');

    // THEN: The config file exists
    expect(fs.existsSync(viteConfigPath), `Expected vite.config.ts at ${viteConfigPath}`).toBe(true);

    const content = fs.readFileSync(viteConfigPath, 'utf-8');

    // THEN: TanStackRouterVite plugin is imported and configured (required for file-based routing)
    expect(content, 'vite.config.ts must import TanStackRouterVite').toContain('TanStackRouterVite');
    expect(content, 'vite.config.ts must configure routesDirectory').toContain('routesDirectory');
  });

  test('[P1] should configure Vite server port 5173 explicitly', () => {
    // GIVEN: Architecture mandates frontend runs on port 5173
    // WHEN: vite.config.ts is read
    const viteConfigPath = path.join(FRONTEND_DIR, 'vite.config.ts');
    expect(fs.existsSync(viteConfigPath)).toBe(true);

    const content = fs.readFileSync(viteConfigPath, 'utf-8');

    // THEN: Port 5173 is explicitly set (prevents accidental port changes)
    expect(content, 'vite.config.ts must declare server port 5173').toContain('5173');
  });

  test('[P1] should have index.html with id="root" mount point for React', () => {
    // GIVEN: React mounts onto a DOM element with id="root"
    // WHEN: index.html is read
    const indexPath = path.join(FRONTEND_DIR, 'index.html');

    expect(fs.existsSync(indexPath), `Expected index.html at ${indexPath}`).toBe(true);

    const content = fs.readFileSync(indexPath, 'utf-8');

    // THEN: The root mount point exists
    expect(content, 'index.html must have <div id="root">').toContain('id="root"');
  });

  test('[P1] should have index.html referencing main.tsx as module entry point', () => {
    // GIVEN: The React entry must be loaded as an ES module
    // WHEN: index.html is read
    const indexPath = path.join(FRONTEND_DIR, 'index.html');
    expect(fs.existsSync(indexPath)).toBe(true);

    const content = fs.readFileSync(indexPath, 'utf-8');

    // THEN: main.tsx is referenced as the module entry
    expect(content, 'index.html must reference src/main.tsx as module').toContain('src/main.tsx');
    expect(content, 'index.html script tag must be type="module"').toContain('type="module"');
  });

  test('[P1] should have src/main.tsx that mounts React with StrictMode', () => {
    // GIVEN: React 19 requires a proper root mount via createRoot
    // WHEN: main.tsx is read
    const mainPath = path.join(FRONTEND_DIR, 'src', 'main.tsx');

    expect(fs.existsSync(mainPath), `Expected src/main.tsx at ${mainPath}`).toBe(true);

    const content = fs.readFileSync(mainPath, 'utf-8');

    // THEN: createRoot and StrictMode are both used (React 19 best practice)
    expect(content, 'main.tsx must use createRoot').toContain('createRoot');
    expect(content, 'main.tsx must wrap app in StrictMode').toContain('StrictMode');
  });

  test('[P1] should have src/routes/__root.tsx with data-testid="app-root"', () => {
    // GIVEN: ATDD tests use [data-testid="app-root"] to assert the app rendered
    // WHEN: __root.tsx is read
    const rootRoutePath = path.join(FRONTEND_DIR, 'src', 'routes', '__root.tsx');

    expect(
      fs.existsSync(rootRoutePath),
      `Expected __root.tsx at ${rootRoutePath}`
    ).toBe(true);

    const content = fs.readFileSync(rootRoutePath, 'utf-8');

    // THEN: data-testid="app-root" is present so E2E tests can find the root
    expect(content, '__root.tsx must have data-testid="app-root"').toContain('data-testid="app-root"');
  });

  test('[P2] should have tailwindcss configured as a Vite plugin', () => {
    // GIVEN: TailwindCSS v4 is integrated via @tailwindcss/vite (not PostCSS)
    // WHEN: vite.config.ts is read
    const viteConfigPath = path.join(FRONTEND_DIR, 'vite.config.ts');
    expect(fs.existsSync(viteConfigPath)).toBe(true);

    const content = fs.readFileSync(viteConfigPath, 'utf-8');

    // THEN: tailwindcss plugin is imported and used
    expect(content, 'vite.config.ts must import tailwindcss vite plugin').toContain('tailwindcss');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 edge — CORS boundary conditions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 edge — CORS boundary conditions', () => {
  test('[P1] should NOT return CORS header for a non-allowed origin', async ({ request }) => {
    // GIVEN: CORS is configured to allow ONLY http://localhost:5173
    // WHEN: A request arrives from an unauthorized origin
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: 'http://evil.example.com',
      },
    });

    // THEN: The Access-Control-Allow-Origin header must NOT be present or must not equal the evil origin
    const allowOriginHeader = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOriginHeader, 'CORS must not allow unauthorized origins').not.toBe(
      'http://evil.example.com'
    );
  });

  test('[P1] should allow GET method via CORS (AllowAnyMethod is configured)', async ({
    request,
  }) => {
    // GIVEN: CORS policy uses AllowAnyMethod()
    // WHEN: OPTIONS preflight for GET is made from the allowed origin
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
      },
    });

    // THEN: Preflight succeeds (not rejected with 403)
    expect(response.status(), 'OPTIONS preflight for GET must succeed').not.toBe(403);
  });

  test('[P1] should allow POST method via CORS (needed for future API calls)', async ({
    request,
  }) => {
    // GIVEN: CORS policy uses AllowAnyMethod() — POST must be allowed for API calls
    // WHEN: OPTIONS preflight for POST is made from the allowed origin
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: Preflight for POST succeeds
    expect(response.status(), 'OPTIONS preflight for POST must succeed').not.toBe(403);
  });

  test('[P2] should allow Content-Type header via CORS (AllowAnyHeader is configured)', async ({
    request,
  }) => {
    // GIVEN: CORS uses AllowAnyHeader() — Content-Type is required for JSON POST bodies
    // WHEN: OPTIONS preflight requests Content-Type header be allowed
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });

    // THEN: Preflight is not rejected
    const allowHeaders = response.headers()['access-control-allow-headers'] ?? '';
    // Either '*' (allow all) or explicitly lists the requested headers
    const status = response.status();
    expect([200, 204]).toContain(status);
    // Verify the header is in the allow list OR status code indicates acceptance
    const headersAllowed =
      allowHeaders.includes('*') ||
      allowHeaders.toLowerCase().includes('content-type') ||
      status === 204;
    expect(headersAllowed, 'CORS must allow Content-Type header').toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 edge — TypeScript configuration completeness
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 edge — TypeScript configuration completeness', () => {
  test('[P1] should have tsconfig.json with jsx set to react-jsx', () => {
    // GIVEN: React 19 requires the new JSX transform (react-jsx, not react)
    // WHEN: tsconfig.json is read
    const tsconfigPath = path.join(FRONTEND_DIR, 'tsconfig.json');
    expect(fs.existsSync(tsconfigPath)).toBe(true);

    const content = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));

    // THEN: jsx is set to react-jsx (new JSX transform, no React import needed)
    expect(
      content.compilerOptions?.jsx,
      'tsconfig must have jsx: "react-jsx" for React 19'
    ).toBe('react-jsx');
  });

  test('[P1] should have tsconfig.json that includes the src/ directory', () => {
    // GIVEN: All source files reside in src/
    // WHEN: tsconfig.json is read
    const tsconfigPath = path.join(FRONTEND_DIR, 'tsconfig.json');
    expect(fs.existsSync(tsconfigPath)).toBe(true);

    const content = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));

    // THEN: include array contains "src" to compile all source files
    const includes: string[] = content.include ?? [];
    const hasSrc = includes.some((inc) => inc === 'src' || inc.startsWith('src'));
    expect(hasSrc, 'tsconfig.json must include "src" in its include array').toBe(true);
  });

  test('[P1] should NOT have tsconfig.json with noEmit: false (Vite handles bundling)', () => {
    // GIVEN: Vite is the bundler — TypeScript should only type-check, not emit files
    // WHEN: tsconfig.json is read
    const tsconfigPath = path.join(FRONTEND_DIR, 'tsconfig.json');
    expect(fs.existsSync(tsconfigPath)).toBe(true);

    const content = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));

    // THEN: noEmit is not explicitly set to false (must be true or undefined)
    const noEmit = content.compilerOptions?.noEmit;
    expect(
      noEmit,
      'tsconfig.compilerOptions.noEmit must be true (Vite handles bundling)'
    ).not.toBe(false);
  });

  test('[P2] should have tsconfig.json with noFallthroughCasesInSwitch enabled', () => {
    // GIVEN: Company standards enforce safe switch statements
    // WHEN: tsconfig.json is read
    const tsconfigPath = path.join(FRONTEND_DIR, 'tsconfig.json');
    expect(fs.existsSync(tsconfigPath)).toBe(true);

    const content = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));

    // THEN: noFallthroughCasesInSwitch is true or strict mode covers it
    // (strict mode does not cover this, so it must be explicit)
    const noFallthrough = content.compilerOptions?.noFallthroughCasesInSwitch;
    expect(
      noFallthrough,
      'tsconfig must have noFallthroughCasesInSwitch: true for safe switch statements'
    ).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 edge — pnpm and required frontend dependencies
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 edge — Frontend required dependencies', () => {
  const getPackageJson = () => {
    const pkgPath = path.join(FRONTEND_DIR, 'package.json');
    expect(fs.existsSync(pkgPath), `Expected package.json at ${pkgPath}`).toBe(true);
    return JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  };

  test('[P1] should have @tanstack/react-router as a dependency', () => {
    // GIVEN: TanStack Router is the required routing library
    const pkg = getPackageJson();
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    expect(
      allDeps['@tanstack/react-router'],
      'package.json must declare @tanstack/react-router as a dependency'
    ).toBeTruthy();
  });

  test('[P1] should have @tanstack/react-query as a dependency', () => {
    // GIVEN: TanStack Query is required for server state management
    const pkg = getPackageJson();
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    expect(
      allDeps['@tanstack/react-query'],
      'package.json must declare @tanstack/react-query'
    ).toBeTruthy();
  });

  test('[P1] should have axios as a dependency', () => {
    // GIVEN: axios is used for the apiClient (shared/lib/apiClient.ts)
    const pkg = getPackageJson();
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    expect(allDeps['axios'], 'package.json must declare axios').toBeTruthy();
  });

  test('[P1] should have zod as a dependency', () => {
    // GIVEN: zod is required for form and API response validation
    const pkg = getPackageJson();
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    expect(allDeps['zod'], 'package.json must declare zod for schema validation').toBeTruthy();
  });

  test('[P1] should have zustand as a dependency', () => {
    // GIVEN: zustand is required for client-side state management
    const pkg = getPackageJson();
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    expect(allDeps['zustand'], 'package.json must declare zustand for state management').toBeTruthy();
  });

  test('[P1] should have react-hook-form and @hookform/resolvers as dependencies', () => {
    // GIVEN: Form handling uses react-hook-form with zod resolvers
    const pkg = getPackageJson();
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    expect(allDeps['react-hook-form'], 'package.json must declare react-hook-form').toBeTruthy();
    expect(
      allDeps['@hookform/resolvers'],
      'package.json must declare @hookform/resolvers'
    ).toBeTruthy();
  });

  test('[P1] should have vitest and @testing-library/react as dev dependencies', () => {
    // GIVEN: Company standards require Vitest for unit/component tests
    const pkg = getPackageJson();
    const devDeps = pkg.devDependencies ?? {};

    expect(devDeps['vitest'], 'package.json must declare vitest as devDependency').toBeTruthy();
    expect(
      devDeps['@testing-library/react'],
      'package.json must declare @testing-library/react as devDependency'
    ).toBeTruthy();
  });

  test('[P1] should have @tanstack/router-plugin as a dev dependency', () => {
    // GIVEN: File-based routing requires the router plugin for code generation
    const pkg = getPackageJson();
    const devDeps = pkg.devDependencies ?? {};

    expect(
      devDeps['@tanstack/router-plugin'],
      'package.json must declare @tanstack/router-plugin as devDependency'
    ).toBeTruthy();
  });

  test('[P2] should have pnpm-lock.yaml that is non-empty (not a stub)', () => {
    // GIVEN: A valid pnpm-lock.yaml must contain actual dependency data
    // WHEN: The lockfile is read
    const lockPath = path.join(FRONTEND_DIR, 'pnpm-lock.yaml');
    expect(fs.existsSync(lockPath), `Expected pnpm-lock.yaml at ${lockPath}`).toBe(true);

    const stat = fs.statSync(lockPath);

    // THEN: The lockfile is not empty (must have content from actual pnpm install)
    expect(stat.size, 'pnpm-lock.yaml must not be empty — run pnpm install').toBeGreaterThan(100);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 edge — Scalar only, never Swagger (file-level assertion)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 edge — Program.cs Scalar-only configuration', () => {
  test('[P0] should NOT contain UseSwagger in Program.cs (Swashbuckle is forbidden)', () => {
    // GIVEN: Company standards forbid app.UseSwagger() — only Scalar is allowed
    // WHEN: Program.cs is read directly
    const programCsPath = path.join(
      BACKEND_DIR,
      'src',
      'SiesaAgents.API',
      'Program.cs'
    );

    expect(
      fs.existsSync(programCsPath),
      `Expected Program.cs at ${programCsPath}`
    ).toBe(true);

    const content = fs.readFileSync(programCsPath, 'utf-8');

    // THEN: UseSwagger is NEVER present (critical architecture rule)
    expect(
      content,
      'Program.cs must NOT contain app.UseSwagger() — use MapScalarApiReference() only'
    ).not.toContain('UseSwagger');
  });

  test('[P0] should contain MapScalarApiReference in Program.cs', () => {
    // GIVEN: Scalar is the mandatory API documentation tool
    // WHEN: Program.cs is read
    const programCsPath = path.join(
      BACKEND_DIR,
      'src',
      'SiesaAgents.API',
      'Program.cs'
    );
    expect(fs.existsSync(programCsPath)).toBe(true);

    const content = fs.readFileSync(programCsPath, 'utf-8');

    // THEN: MapScalarApiReference() is present
    expect(
      content,
      'Program.cs must call MapScalarApiReference() for API documentation'
    ).toContain('MapScalarApiReference');
  });

  test('[P0] should NOT contain Swashbuckle or SwaggerGen in Program.cs', () => {
    // GIVEN: Swashbuckle namespace must not be referenced
    const programCsPath = path.join(BACKEND_DIR, 'src', 'SiesaAgents.API', 'Program.cs');
    expect(fs.existsSync(programCsPath)).toBe(true);

    const content = fs.readFileSync(programCsPath, 'utf-8');

    // THEN: No Swashbuckle references
    expect(content, 'Program.cs must not reference Swashbuckle').not.toContain('Swashbuckle');
    expect(content, 'Program.cs must not call AddSwaggerGen').not.toContain('AddSwaggerGen');
  });

  test('[P1] should have appsettings.json in the API project', () => {
    // GIVEN: Runtime configuration requires appsettings.json
    // WHEN: The API project directory is examined
    const appsettingsPath = path.join(
      BACKEND_DIR,
      'src',
      'SiesaAgents.API',
      'appsettings.json'
    );

    // THEN: appsettings.json exists
    expect(
      fs.existsSync(appsettingsPath),
      `Expected appsettings.json at ${appsettingsPath}`
    ).toBe(true);

    // AND THEN: It is valid JSON
    const content = fs.readFileSync(appsettingsPath, 'utf-8');
    expect(() => JSON.parse(content), 'appsettings.json must be valid JSON').not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC7 edge — Clean Architecture project reference rules
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 edge — Clean Architecture dependency boundary violations', () => {
  test('[P1] should have SiesaAgents.Infrastructure .csproj reference both Application and Domain', () => {
    // GIVEN: Infrastructure accesses DB (Domain entities) and Application interfaces
    // WHEN: The Infrastructure .csproj is read
    const csprojPath = path.join(
      BACKEND_DIR,
      'src',
      'SiesaAgents.Infrastructure',
      'SiesaAgents.Infrastructure.csproj'
    );

    expect(fs.existsSync(csprojPath), `Expected .csproj at ${csprojPath}`).toBe(true);

    const content = fs.readFileSync(csprojPath, 'utf-8');

    // THEN: Both Application and Domain are referenced (Infrastructure implements Application interfaces)
    expect(
      content,
      'Infrastructure.csproj must reference SiesaAgents.Application'
    ).toContain('SiesaAgents.Application');
    expect(
      content,
      'Infrastructure.csproj must reference SiesaAgents.Domain'
    ).toContain('SiesaAgents.Domain');
  });

  test('[P1] should NOT have SiesaAgents.Infrastructure .csproj referencing SiesaAgents.API', () => {
    // GIVEN: Infrastructure must not depend on the API layer (inward dependency rule)
    // WHEN: The Infrastructure .csproj is read
    const csprojPath = path.join(
      BACKEND_DIR,
      'src',
      'SiesaAgents.Infrastructure',
      'SiesaAgents.Infrastructure.csproj'
    );
    expect(fs.existsSync(csprojPath)).toBe(true);

    const content = fs.readFileSync(csprojPath, 'utf-8');

    // THEN: Infrastructure does NOT reference API (would violate Clean Architecture)
    expect(
      content,
      'Infrastructure.csproj must NOT reference SiesaAgents.API (violates Clean Architecture)'
    ).not.toContain('SiesaAgents.API');
  });

  test('[P1] should have SiesaAgents.UnitTests .csproj reference Application and Domain', () => {
    // GIVEN: Unit tests must be able to test Application and Domain layer logic
    // WHEN: The UnitTests .csproj is read
    const csprojPath = path.join(
      BACKEND_DIR,
      'tests',
      'SiesaAgents.UnitTests',
      'SiesaAgents.UnitTests.csproj'
    );

    expect(fs.existsSync(csprojPath)).toBe(true);

    const content = fs.readFileSync(csprojPath, 'utf-8');

    // THEN: Both Application and Domain are referenced for unit testing
    expect(
      content,
      'UnitTests.csproj must reference SiesaAgents.Application'
    ).toContain('SiesaAgents.Application');
    expect(
      content,
      'UnitTests.csproj must reference SiesaAgents.Domain'
    ).toContain('SiesaAgents.Domain');
  });

  test('[P1] should NOT have SiesaAgents.UnitTests .csproj referencing Infrastructure', () => {
    // GIVEN: Unit tests must not depend on Infrastructure (use mocks instead)
    // WHEN: The UnitTests .csproj is read
    const csprojPath = path.join(
      BACKEND_DIR,
      'tests',
      'SiesaAgents.UnitTests',
      'SiesaAgents.UnitTests.csproj'
    );
    expect(fs.existsSync(csprojPath)).toBe(true);

    const content = fs.readFileSync(csprojPath, 'utf-8');

    // THEN: UnitTests must NOT reference Infrastructure (keep unit tests truly isolated)
    expect(
      content,
      'UnitTests.csproj must NOT reference SiesaAgents.Infrastructure (use mocks)'
    ).not.toContain('SiesaAgents.Infrastructure');
  });

  test('[P1] should NOT have SiesaAgents.Domain .csproj referencing any other project', () => {
    // GIVEN: Domain is the innermost layer and must have zero project dependencies
    // WHEN: The Domain .csproj is read
    const csprojPath = path.join(
      BACKEND_DIR,
      'src',
      'SiesaAgents.Domain',
      'SiesaAgents.Domain.csproj'
    );

    expect(fs.existsSync(csprojPath), `Expected Domain.csproj at ${csprojPath}`).toBe(true);

    const content = fs.readFileSync(csprojPath, 'utf-8');

    // THEN: No ProjectReference elements (Domain is self-contained)
    expect(
      content,
      'Domain.csproj must NOT reference any other project — it is the innermost layer'
    ).not.toContain('<ProjectReference');
  });

  test('[P2] should have SiesaAgents.Application .csproj referencing FluentValidation', () => {
    // GIVEN: FluentValidation is the required validation library for Application layer
    // WHEN: The Application .csproj is read
    const csprojPath = path.join(
      BACKEND_DIR,
      'src',
      'SiesaAgents.Application',
      'SiesaAgents.Application.csproj'
    );
    expect(fs.existsSync(csprojPath)).toBe(true);

    const content = fs.readFileSync(csprojPath, 'utf-8');

    // THEN: FluentValidation package is referenced
    expect(
      content,
      'Application.csproj must reference FluentValidation'
    ).toContain('FluentValidation');
  });

  test('[P2] should have SiesaAgents.Infrastructure .csproj referencing EFCore packages', () => {
    // GIVEN: EF Core with Npgsql and naming conventions is required for Infrastructure
    // WHEN: The Infrastructure .csproj is read
    const csprojPath = path.join(
      BACKEND_DIR,
      'src',
      'SiesaAgents.Infrastructure',
      'SiesaAgents.Infrastructure.csproj'
    );
    expect(fs.existsSync(csprojPath)).toBe(true);

    const content = fs.readFileSync(csprojPath, 'utf-8');

    // THEN: Npgsql EFCore package is referenced (database provider)
    expect(
      content,
      'Infrastructure.csproj must reference Npgsql.EntityFrameworkCore.PostgreSQL'
    ).toContain('Npgsql.EntityFrameworkCore.PostgreSQL');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Repository structure edge cases — .gitignore and README
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Repository structure edge cases', () => {
  test('[P1] should have a .gitignore that excludes node_modules', () => {
    // GIVEN: node_modules must never be committed
    // WHEN: .gitignore at repo root is read
    const gitignorePath = path.join(PROJECT_ROOT, '.gitignore');

    expect(fs.existsSync(gitignorePath), `Expected .gitignore at ${gitignorePath}`).toBe(true);

    const content = fs.readFileSync(gitignorePath, 'utf-8');

    // THEN: node_modules/ is excluded
    expect(content, '.gitignore must exclude node_modules/').toContain('node_modules');
  });

  test('[P1] should have a .gitignore that excludes .NET build artifacts (bin/ and obj/)', () => {
    // GIVEN: .NET build artifacts must not be committed
    // WHEN: .gitignore is read
    const gitignorePath = path.join(PROJECT_ROOT, '.gitignore');
    expect(fs.existsSync(gitignorePath)).toBe(true);

    const content = fs.readFileSync(gitignorePath, 'utf-8');

    // THEN: bin/ and obj/ are excluded
    expect(content, '.gitignore must exclude bin/').toContain('bin/');
    expect(content, '.gitignore must exclude obj/').toContain('obj/');
  });

  test('[P1] should have a .gitignore that excludes .env files', () => {
    // GIVEN: Secrets must never be committed
    // WHEN: .gitignore is read
    const gitignorePath = path.join(PROJECT_ROOT, '.gitignore');
    expect(fs.existsSync(gitignorePath)).toBe(true);

    const content = fs.readFileSync(gitignorePath, 'utf-8');

    // THEN: .env is excluded (but .env.example may be allowed)
    expect(content, '.gitignore must exclude .env files').toContain('.env');
  });

  test('[P2] should have a .gitignore that excludes dist/ (Vite build output)', () => {
    // GIVEN: Vite build output must not be committed
    // WHEN: .gitignore is read
    const gitignorePath = path.join(PROJECT_ROOT, '.gitignore');
    expect(fs.existsSync(gitignorePath)).toBe(true);

    const content = fs.readFileSync(gitignorePath, 'utf-8');

    // THEN: dist/ is excluded
    expect(content, '.gitignore must exclude dist/').toContain('dist/');
  });

  test('[P2] should have a README.md at the repository root', () => {
    // GIVEN: Setup instructions are required for new team members
    // WHEN: The repository root is examined
    const readmePath = path.join(PROJECT_ROOT, 'README.md');

    // THEN: README.md exists
    expect(fs.existsSync(readmePath), `Expected README.md at ${readmePath}`).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 runtime edge — Vite error overlay boundary
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 runtime edge — Vite dev server error boundary', () => {
  test('[P1] should NOT render Vite error overlay for unhandled routes (React Router handles 404)', async ({
    page,
  }) => {
    // GIVEN: TanStack Router is configured for client-side routing
    // WHEN: The user navigates to an unknown route
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/this-route-does-not-exist-atdd-probe');

    // THEN: No Vite error overlay (vite-error-overlay custom element)
    const viteOverlay = page.locator('vite-error-overlay');
    await expect(viteOverlay).toHaveCount(0);

    // AND THEN: No page-level JavaScript errors (React Router should handle gracefully)
    // Note: TanStack Router may render a "not found" component or redirect — both are acceptable
    expect(
      pageErrors.filter((e) => e.includes('Cannot read') || e.includes('is not a function')),
      'No uncaught JS errors on unknown route'
    ).toHaveLength(0);
  });

  test('[P1] should load the root page within a reasonable time (< 10 seconds)', async ({
    page,
  }) => {
    // GIVEN: The Vite dev server is running
    // WHEN: The root page is loaded and the app renders
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-root"]');
    const loadTime = Date.now() - startTime;

    // THEN: Page renders within 10 seconds (Vite HMR should be fast)
    expect(
      loadTime,
      `Page should load in under 10s, took ${loadTime}ms`
    ).toBeLessThan(10000);
  });
});

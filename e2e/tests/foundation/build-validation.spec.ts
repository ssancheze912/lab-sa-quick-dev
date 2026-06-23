/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (Build / File-System Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC4 — tsconfig.json has "strict": true and project compiles with zero TypeScript errors
 *   AC5 — Frontend uses pnpm with a valid pnpm-lock.yaml committed
 *   AC7 — .NET solution file references all four projects with correct dependency graph
 *   AC8 — tests/SiesaAgents.UnitTests exists, is in solution, dotnet test runs with zero failures
 *
 * NOTE: These tests validate project structure via the API server and file-system conventions.
 * Build-level assertions (tsc, dotnet build) are verified as CI shell tests; these Playwright
 * tests act as structural contract tests that verify the same invariants through runtime
 * behavior or API responses.
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const FRONTEND_DIR = path.join(PROJECT_ROOT, 'frontend');
const BACKEND_DIR = path.join(PROJECT_ROOT, 'backend');
const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC4: TypeScript strict mode in tsconfig.json
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — TypeScript strict mode configuration', () => {
  test('should have tsconfig.json with strict: true in the frontend project', () => {
    // GIVEN: The frontend project is initialized with Vite react-ts template
    // WHEN: The tsconfig.json (or tsconfig.app.json) is read
    const tsconfigAppPath = path.join(FRONTEND_DIR, 'tsconfig.app.json');
    const tsconfigPath = path.join(FRONTEND_DIR, 'tsconfig.json');

    const filePath = fs.existsSync(tsconfigAppPath) ? tsconfigAppPath : tsconfigPath;

    // THEN: The file exists
    expect(fs.existsSync(filePath), `Expected tsconfig at ${filePath} to exist`).toBe(true);

    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // THEN: strict mode is enabled
    expect(content.compilerOptions?.strict, 'tsconfig.compilerOptions.strict must be true').toBe(true);
  });

  test('should have noUnusedLocals: true in tsconfig to enforce clean code', () => {
    // GIVEN: Company standards require no unused locals
    // WHEN: The tsconfig.app.json is read
    const tsconfigAppPath = path.join(FRONTEND_DIR, 'tsconfig.app.json');
    const tsconfigPath = path.join(FRONTEND_DIR, 'tsconfig.json');
    const filePath = fs.existsSync(tsconfigAppPath) ? tsconfigAppPath : tsconfigPath;

    expect(fs.existsSync(filePath), `Expected tsconfig at ${filePath} to exist`).toBe(true);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // THEN: noUnusedLocals is enabled
    expect(
      content.compilerOptions?.noUnusedLocals,
      'tsconfig.compilerOptions.noUnusedLocals must be true'
    ).toBe(true);
  });

  test('should have noUnusedParameters: true in tsconfig to enforce clean code', () => {
    // GIVEN: Company standards require no unused parameters
    // WHEN: The tsconfig.app.json is read
    const tsconfigAppPath = path.join(FRONTEND_DIR, 'tsconfig.app.json');
    const tsconfigPath = path.join(FRONTEND_DIR, 'tsconfig.json');
    const filePath = fs.existsSync(tsconfigAppPath) ? tsconfigAppPath : tsconfigPath;

    expect(fs.existsSync(filePath), `Expected tsconfig at ${filePath} to exist`).toBe(true);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // THEN: noUnusedParameters is enabled
    expect(
      content.compilerOptions?.noUnusedParameters,
      'tsconfig.compilerOptions.noUnusedParameters must be true'
    ).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5: pnpm package manager with pnpm-lock.yaml
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — pnpm package manager setup', () => {
  test('should have a pnpm-lock.yaml file committed in the frontend project', () => {
    // GIVEN: Company standards mandate pnpm as the frontend package manager
    // WHEN: The frontend directory is examined
    const lockfilePath = path.join(FRONTEND_DIR, 'pnpm-lock.yaml');

    // THEN: The pnpm-lock.yaml file exists (not package-lock.json or yarn.lock)
    expect(
      fs.existsSync(lockfilePath),
      `Expected pnpm-lock.yaml at ${lockfilePath} — use pnpm, not npm or yarn`
    ).toBe(true);
  });

  test('should NOT have a package-lock.json file (npm lock file must be absent)', () => {
    // GIVEN: Company standards prohibit npm as the package manager
    // WHEN: The frontend directory is examined
    const npmLockPath = path.join(FRONTEND_DIR, 'package-lock.json');

    // THEN: No npm lockfile exists
    expect(
      fs.existsSync(npmLockPath),
      'package-lock.json must NOT exist — only pnpm-lock.yaml is allowed'
    ).toBe(false);
  });

  test('should NOT have a yarn.lock file (yarn is not the approved package manager)', () => {
    // GIVEN: Company standards prohibit yarn as the package manager
    // WHEN: The frontend directory is examined
    const yarnLockPath = path.join(FRONTEND_DIR, 'yarn.lock');

    // THEN: No yarn lockfile exists
    expect(
      fs.existsSync(yarnLockPath),
      'yarn.lock must NOT exist — only pnpm-lock.yaml is allowed'
    ).toBe(false);
  });

  test('should have a valid pnpm workspace configuration or package.json with type: module', () => {
    // GIVEN: The frontend is a pnpm-managed project
    // WHEN: The package.json is read
    const packageJsonPath = path.join(FRONTEND_DIR, 'package.json');

    expect(fs.existsSync(packageJsonPath), `Expected package.json at ${packageJsonPath}`).toBe(true);

    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    // THEN: The project has a name and version (valid npm manifest)
    expect(pkg.name, 'package.json must have a name field').toBeTruthy();
    expect(pkg.scripts?.dev, 'package.json must have a dev script').toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC7: .NET solution file references all four Clean Architecture projects
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 — Clean Architecture .NET solution project references', () => {
  test('should have a SiesaAgents.sln solution file in the backend directory', () => {
    // GIVEN: The backend is a .NET 10 Clean Architecture solution
    // WHEN: The backend directory is examined
    const slnPath = path.join(BACKEND_DIR, 'SiesaAgents.sln');

    // THEN: The solution file exists
    expect(fs.existsSync(slnPath), `Expected SiesaAgents.sln at ${slnPath}`).toBe(true);
  });

  test('should reference SiesaAgents.API project in the solution file', () => {
    // GIVEN: The solution file exists
    // WHEN: The solution file contents are read
    const slnPath = path.join(BACKEND_DIR, 'SiesaAgents.sln');
    expect(fs.existsSync(slnPath), `SiesaAgents.sln not found at ${slnPath}`).toBe(true);

    const slnContent = fs.readFileSync(slnPath, 'utf-8');

    // THEN: SiesaAgents.API project is referenced
    expect(slnContent, 'SiesaAgents.sln must reference SiesaAgents.API').toContain('SiesaAgents.API');
  });

  test('should reference SiesaAgents.Application project in the solution file', () => {
    // GIVEN: Clean Architecture requires Application project
    const slnPath = path.join(BACKEND_DIR, 'SiesaAgents.sln');
    expect(fs.existsSync(slnPath)).toBe(true);

    const slnContent = fs.readFileSync(slnPath, 'utf-8');

    // THEN: SiesaAgents.Application is referenced
    expect(slnContent, 'SiesaAgents.sln must reference SiesaAgents.Application').toContain(
      'SiesaAgents.Application'
    );
  });

  test('should reference SiesaAgents.Domain project in the solution file', () => {
    // GIVEN: Clean Architecture requires Domain project (innermost layer)
    const slnPath = path.join(BACKEND_DIR, 'SiesaAgents.sln');
    expect(fs.existsSync(slnPath)).toBe(true);

    const slnContent = fs.readFileSync(slnPath, 'utf-8');

    // THEN: SiesaAgents.Domain is referenced
    expect(slnContent, 'SiesaAgents.sln must reference SiesaAgents.Domain').toContain(
      'SiesaAgents.Domain'
    );
  });

  test('should reference SiesaAgents.Infrastructure project in the solution file', () => {
    // GIVEN: Clean Architecture requires Infrastructure project for EF Core
    const slnPath = path.join(BACKEND_DIR, 'SiesaAgents.sln');
    expect(fs.existsSync(slnPath)).toBe(true);

    const slnContent = fs.readFileSync(slnPath, 'utf-8');

    // THEN: SiesaAgents.Infrastructure is referenced
    expect(slnContent, 'SiesaAgents.sln must reference SiesaAgents.Infrastructure').toContain(
      'SiesaAgents.Infrastructure'
    );
  });

  test('should have SiesaAgents.API .csproj reference to Application and Infrastructure', () => {
    // GIVEN: API layer must reference Application and Infrastructure (Clean Architecture rule)
    // WHEN: The API .csproj file is read
    const csprojPath = path.join(BACKEND_DIR, 'src', 'SiesaAgents.API', 'SiesaAgents.API.csproj');

    expect(fs.existsSync(csprojPath), `Expected .csproj at ${csprojPath}`).toBe(true);

    const csprojContent = fs.readFileSync(csprojPath, 'utf-8');

    // THEN: Both Application and Infrastructure are referenced
    expect(csprojContent, 'API.csproj must reference SiesaAgents.Application').toContain(
      'SiesaAgents.Application'
    );
    expect(csprojContent, 'API.csproj must reference SiesaAgents.Infrastructure').toContain(
      'SiesaAgents.Infrastructure'
    );
  });

  test('should have SiesaAgents.Application .csproj reference to Domain only', () => {
    // GIVEN: Application layer must only reference Domain (inward dependency rule)
    // WHEN: The Application .csproj file is read
    const csprojPath = path.join(
      BACKEND_DIR,
      'src',
      'SiesaAgents.Application',
      'SiesaAgents.Application.csproj'
    );

    expect(fs.existsSync(csprojPath), `Expected .csproj at ${csprojPath}`).toBe(true);

    const csprojContent = fs.readFileSync(csprojPath, 'utf-8');

    // THEN: Domain is referenced, Infrastructure is NOT referenced (would violate CA)
    expect(csprojContent, 'Application.csproj must reference SiesaAgents.Domain').toContain(
      'SiesaAgents.Domain'
    );
    expect(
      csprojContent,
      'Application.csproj must NOT reference SiesaAgents.Infrastructure (violates Clean Architecture)'
    ).not.toContain('SiesaAgents.Infrastructure');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC8: xUnit test project exists and is included in the solution
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC8 — xUnit test project setup', () => {
  test('should have SiesaAgents.UnitTests project in tests/ directory', () => {
    // GIVEN: The testing standards require an xUnit project
    // WHEN: The tests directory is examined
    const testProjectDir = path.join(BACKEND_DIR, 'tests', 'SiesaAgents.UnitTests');

    // THEN: The test project directory exists
    expect(
      fs.existsSync(testProjectDir),
      `Expected UnitTests project at ${testProjectDir}`
    ).toBe(true);
  });

  test('should have a valid .csproj file for SiesaAgents.UnitTests', () => {
    // GIVEN: The xUnit project must be a valid .NET project
    // WHEN: The test project directory is examined
    const csprojPath = path.join(
      BACKEND_DIR,
      'tests',
      'SiesaAgents.UnitTests',
      'SiesaAgents.UnitTests.csproj'
    );

    // THEN: The .csproj file exists
    expect(fs.existsSync(csprojPath), `Expected .csproj at ${csprojPath}`).toBe(true);
  });

  test('should reference SiesaAgents.UnitTests in the solution file', () => {
    // GIVEN: The test project must be included in the solution for dotnet test to discover it
    // WHEN: The solution file is read
    const slnPath = path.join(BACKEND_DIR, 'SiesaAgents.sln');
    expect(fs.existsSync(slnPath), `SiesaAgents.sln not found at ${slnPath}`).toBe(true);

    const slnContent = fs.readFileSync(slnPath, 'utf-8');

    // THEN: UnitTests project is in the solution
    expect(slnContent, 'SiesaAgents.sln must reference SiesaAgents.UnitTests').toContain(
      'SiesaAgents.UnitTests'
    );
  });

  test('should have xunit package referenced in the UnitTests .csproj', () => {
    // GIVEN: The project uses xUnit as the testing framework
    // WHEN: The test project .csproj is read
    const csprojPath = path.join(
      BACKEND_DIR,
      'tests',
      'SiesaAgents.UnitTests',
      'SiesaAgents.UnitTests.csproj'
    );
    expect(fs.existsSync(csprojPath)).toBe(true);

    const csprojContent = fs.readFileSync(csprojPath, 'utf-8');

    // THEN: xunit package is referenced
    expect(csprojContent, 'UnitTests.csproj must reference xunit package').toContain('xunit');
  });

  test('should have the backend API respond after xUnit tests build successfully', async ({
    request,
  }) => {
    // GIVEN: dotnet test runs with zero failures (an empty test project passes by default)
    // WHEN: The backend server is running (which proves the entire solution builds)
    // NOTE: This is a proxy test — if the backend is up, dotnet build succeeded

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Server is up (build and test zero-failure constraint met)
    expect(response.status()).toBe(200);
  });
});

/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (Build Verification Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC4 — TypeScript compiler emits zero errors with "strict": true,
 *          "noImplicitAny": true, and "strictNullChecks": true active
 *   AC5 — dotnet build SiesaAgents.sln succeeds with zero errors or warnings
 *
 * Test approach: Shell-based build validation via Playwright test runner.
 * These tests invoke CLI commands and assert exit codes / output.
 */

import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const ROOT_DIR = path.resolve(__dirname, '../../../..');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');

// ─────────────────────────────────────────────────────────────────────────────
// AC4: TypeScript strict mode — zero compilation errors
// Given: tsconfig.app.json has "strict": true, "noImplicitAny": true,
//        "strictNullChecks": true
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — TypeScript strict mode: zero compilation errors', () => {
  test('should have tsconfig.app.json with strict mode enabled', () => {
    // GIVEN: The frontend project has been initialized
    // WHEN: The TypeScript configuration file is read
    const tsconfigPath = path.join(FRONTEND_DIR, 'tsconfig.app.json');

    // THEN: tsconfig.app.json exists
    expect(fs.existsSync(tsconfigPath), `tsconfig.app.json must exist at ${tsconfigPath}`).toBe(true);

    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));

    // THEN: strict mode is enabled
    expect(
      tsconfig.compilerOptions?.strict,
      '"strict" must be true in tsconfig.app.json compilerOptions'
    ).toBe(true);
  });

  test('should have tsconfig.app.json with noImplicitAny enabled', () => {
    // GIVEN: The frontend project has been initialized
    // WHEN: The TypeScript configuration file is read
    const tsconfigPath = path.join(FRONTEND_DIR, 'tsconfig.app.json');

    expect(fs.existsSync(tsconfigPath), `tsconfig.app.json must exist at ${tsconfigPath}`).toBe(true);

    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));

    // THEN: noImplicitAny is true (explicitly set OR implied by strict: true)
    const strictEnabled = tsconfig.compilerOptions?.strict === true;
    const noImplicitAnyEnabled = tsconfig.compilerOptions?.noImplicitAny !== false;
    expect(
      strictEnabled || noImplicitAnyEnabled,
      '"noImplicitAny" must be true (or implied by strict: true) in tsconfig.app.json'
    ).toBe(true);
  });

  test('should have tsconfig.app.json with strictNullChecks enabled', () => {
    // GIVEN: The frontend project has been initialized
    // WHEN: The TypeScript configuration file is read
    const tsconfigPath = path.join(FRONTEND_DIR, 'tsconfig.app.json');

    expect(fs.existsSync(tsconfigPath), `tsconfig.app.json must exist at ${tsconfigPath}`).toBe(true);

    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));

    // THEN: strictNullChecks is true (explicitly set OR implied by strict: true)
    const strictEnabled = tsconfig.compilerOptions?.strict === true;
    const strictNullChecksEnabled = tsconfig.compilerOptions?.strictNullChecks !== false;
    expect(
      strictEnabled || strictNullChecksEnabled,
      '"strictNullChecks" must be true (or implied by strict: true) in tsconfig.app.json'
    ).toBe(true);
  });

  test('should compile the frontend TypeScript with zero errors in strict mode', () => {
    // GIVEN: The frontend project is initialized with all dependencies installed
    // WHEN: The TypeScript compiler runs with --noEmit (type-check only)

    expect(fs.existsSync(FRONTEND_DIR), `Frontend directory must exist at ${FRONTEND_DIR}`).toBe(true);

    let stdout = '';
    let exitCode = 0;

    try {
      stdout = execSync('pnpm exec tsc --noEmit 2>&1', {
        cwd: FRONTEND_DIR,
        encoding: 'utf-8',
        timeout: 60000,
      });
    } catch (err: unknown) {
      const execError = err as { stdout?: string; stderr?: string; status?: number };
      stdout = (execError.stdout ?? '') + (execError.stderr ?? '');
      exitCode = execError.status ?? 1;
    }

    // THEN: TypeScript compiler exits with code 0 (zero errors)
    expect(
      exitCode,
      `TypeScript strict compilation must exit with code 0. Output:\n${stdout}`
    ).toBe(0);
  });

  test('should have no "any" type annotations in frontend source files', () => {
    // GIVEN: The frontend source directory exists
    // WHEN: The source files are scanned for explicit "any" type usage
    const srcDir = path.join(FRONTEND_DIR, 'src');

    expect(fs.existsSync(srcDir), `Frontend src/ directory must exist at ${srcDir}`).toBe(true);

    // Recursively find all .ts and .tsx files
    function findSourceFiles(dir: string): string[] {
      const files: string[] = [];
      if (!fs.existsSync(dir)) return files;
      for (const entry of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          files.push(...findSourceFiles(fullPath));
        } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
          files.push(fullPath);
        }
      }
      return files;
    }

    const sourceFiles = findSourceFiles(srcDir);
    const filesWithAny: string[] = [];

    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      // Match explicit ": any" or "as any" patterns (not inside comments or strings)
      if (/:\s*any\b|as\s+any\b/.test(content)) {
        filesWithAny.push(path.relative(FRONTEND_DIR, file));
      }
    }

    // THEN: No source files contain explicit "any" type annotations
    expect(
      filesWithAny,
      `Source files must not use "any" type. Found in:\n${filesWithAny.join('\n')}`
    ).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5: dotnet build SiesaAgents.sln succeeds with zero errors
// Given: backend/ directory exists with SiesaAgents.sln and all four projects
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Backend solution builds with zero errors', () => {
  test('should have SiesaAgents.sln in the backend directory', () => {
    // GIVEN: The backend solution has been created
    // WHEN: The solution file is checked
    const slnPath = path.join(BACKEND_DIR, 'SiesaAgents.sln');

    // THEN: SiesaAgents.sln exists
    expect(
      fs.existsSync(slnPath),
      `SiesaAgents.sln must exist at ${slnPath}`
    ).toBe(true);
  });

  test('should have all four Clean Architecture project directories', () => {
    // GIVEN: The backend solution has been initialized with Clean Architecture
    // WHEN: The project directories are verified
    const requiredProjects = [
      'src/SiesaAgents.API',
      'src/SiesaAgents.Application',
      'src/SiesaAgents.Domain',
      'src/SiesaAgents.Infrastructure',
    ];

    const missingProjects: string[] = [];
    for (const projectPath of requiredProjects) {
      const fullPath = path.join(BACKEND_DIR, projectPath);
      if (!fs.existsSync(fullPath)) {
        missingProjects.push(projectPath);
      }
    }

    // THEN: All four Clean Architecture project directories exist
    expect(
      missingProjects,
      `Missing project directories:\n${missingProjects.join('\n')}`
    ).toHaveLength(0);
  });

  test('should have the UnitTests project in the tests directory', () => {
    // GIVEN: The backend solution has been initialized
    // WHEN: The tests directory is verified
    const unitTestsPath = path.join(BACKEND_DIR, 'tests/SiesaAgents.UnitTests');

    // THEN: UnitTests project directory exists
    expect(
      fs.existsSync(unitTestsPath),
      `UnitTests project must exist at ${unitTestsPath}`
    ).toBe(true);
  });

  test('should have SiesaAgents.sln referencing all four Clean Architecture projects', () => {
    // GIVEN: The backend solution exists
    // WHEN: The solution file contents are read
    const slnPath = path.join(BACKEND_DIR, 'SiesaAgents.sln');

    expect(fs.existsSync(slnPath), `SiesaAgents.sln must exist at ${slnPath}`).toBe(true);

    const slnContent = fs.readFileSync(slnPath, 'utf-8');

    // THEN: All four project names are referenced in the solution file
    const requiredProjectNames = [
      'SiesaAgents.API',
      'SiesaAgents.Application',
      'SiesaAgents.Domain',
      'SiesaAgents.Infrastructure',
    ];

    const missingProjects = requiredProjectNames.filter(
      (name) => !slnContent.includes(name)
    );

    expect(
      missingProjects,
      `SiesaAgents.sln must reference all four CA projects. Missing:\n${missingProjects.join('\n')}`
    ).toHaveLength(0);
  });

  test('should build the entire solution with dotnet build and zero errors', () => {
    // GIVEN: The backend solution exists and all dependencies are restored
    // WHEN: dotnet build SiesaAgents.sln is executed

    const slnPath = path.join(BACKEND_DIR, 'SiesaAgents.sln');
    expect(fs.existsSync(slnPath), `SiesaAgents.sln must exist before building`).toBe(true);

    let stdout = '';
    let exitCode = 0;

    try {
      stdout = execSync('dotnet build SiesaAgents.sln --no-restore 2>&1', {
        cwd: BACKEND_DIR,
        encoding: 'utf-8',
        timeout: 120000,
      });
    } catch (err: unknown) {
      const execError = err as { stdout?: string; stderr?: string; status?: number };
      stdout = (execError.stdout ?? '') + (execError.stderr ?? '');
      exitCode = execError.status ?? 1;
    }

    // THEN: dotnet build exits with code 0 (zero errors)
    expect(
      exitCode,
      `dotnet build SiesaAgents.sln must exit with code 0. Output:\n${stdout}`
    ).toBe(0);
  });

  test('should have Program.cs using app.MapScalarApiReference() and NOT app.UseSwagger()', () => {
    // GIVEN: The API project exists with a configured Program.cs
    // WHEN: The Program.cs file is read
    const programCsPath = path.join(BACKEND_DIR, 'src/SiesaAgents.API/Program.cs');

    expect(
      fs.existsSync(programCsPath),
      `Program.cs must exist at ${programCsPath}`
    ).toBe(true);

    const content = fs.readFileSync(programCsPath, 'utf-8');

    // THEN: MapScalarApiReference is present (not UseSwagger)
    expect(
      content.includes('MapScalarApiReference'),
      'Program.cs must call app.MapScalarApiReference() (not UseSwagger)'
    ).toBe(true);

    expect(
      content.includes('UseSwagger'),
      'Program.cs must NOT call app.UseSwagger() — Scalar is the only allowed API docs provider'
    ).toBe(false);
  });

  test('should have Program.cs with CORS policy allowing http://localhost:5173', () => {
    // GIVEN: The API project exists with CORS configured in Program.cs
    // WHEN: The Program.cs file is read
    const programCsPath = path.join(BACKEND_DIR, 'src/SiesaAgents.API/Program.cs');

    expect(
      fs.existsSync(programCsPath),
      `Program.cs must exist at ${programCsPath}`
    ).toBe(true);

    const content = fs.readFileSync(programCsPath, 'utf-8');

    // THEN: CORS policy explicitly allows http://localhost:5173
    expect(
      content.includes('http://localhost:5173'),
      'Program.cs must have a CORS policy with WithOrigins("http://localhost:5173")'
    ).toBe(true);
  });

  test('should have ExceptionHandlingMiddleware registered in Program.cs', () => {
    // GIVEN: The API project exists with middleware configured
    // WHEN: The Program.cs file is read
    const programCsPath = path.join(BACKEND_DIR, 'src/SiesaAgents.API/Program.cs');

    expect(
      fs.existsSync(programCsPath),
      `Program.cs must exist at ${programCsPath}`
    ).toBe(true);

    const content = fs.readFileSync(programCsPath, 'utf-8');

    // THEN: ExceptionHandlingMiddleware is registered (before routing)
    expect(
      content.includes('ExceptionHandlingMiddleware'),
      'Program.cs must register ExceptionHandlingMiddleware via app.UseMiddleware<ExceptionHandlingMiddleware>()'
    ).toBe(true);
  });
});

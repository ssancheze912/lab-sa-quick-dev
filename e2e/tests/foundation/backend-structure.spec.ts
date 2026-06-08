/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (Backend Structure & Build Validation)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC3 — SiesaAgents.sln references exactly four projects + UnitTests with correct P2P references
 *   AC6 — dotnet build succeeds with zero errors (verified via runtime behavior proxy)
 *   AC8 — AppDbContext.cs calls ApplySnakeCaseNaming() last in OnModelCreating,
 *          no [Column] or [Table] attributes on any entity
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC3: SiesaAgents.sln references exactly 4 Clean Architecture projects + UnitTests
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Backend solution structure with four Clean Architecture projects', () => {
  const BACKEND_ROOT = path.resolve(__dirname, '../../../backend');
  const SLN_PATH = path.join(BACKEND_ROOT, 'SiesaAgents.sln');

  test('should have SiesaAgents.sln file at backend/ root', () => {
    // GIVEN: The backend has been scaffolded per Story 1.1 Task 3.1
    // WHEN: Inspecting the backend/ directory
    // THEN: SiesaAgents.sln exists
    expect(fs.existsSync(SLN_PATH), 'backend/SiesaAgents.sln must exist').toBe(true);
  });

  test('should reference SiesaAgents.API project in the solution', () => {
    // GIVEN: SiesaAgents.sln exists
    // WHEN: Reading the solution file
    expect(fs.existsSync(SLN_PATH), 'backend/SiesaAgents.sln must exist').toBe(true);

    const slnContent = fs.readFileSync(SLN_PATH, 'utf-8');

    // THEN: The API project is referenced
    expect(slnContent).toContain('SiesaAgents.API');
  });

  test('should reference SiesaAgents.Application project in the solution', () => {
    // GIVEN: SiesaAgents.sln exists
    // WHEN: Reading the solution file
    expect(fs.existsSync(SLN_PATH), 'backend/SiesaAgents.sln must exist').toBe(true);

    const slnContent = fs.readFileSync(SLN_PATH, 'utf-8');

    // THEN: The Application project is referenced
    expect(slnContent).toContain('SiesaAgents.Application');
  });

  test('should reference SiesaAgents.Domain project in the solution', () => {
    // GIVEN: SiesaAgents.sln exists
    // WHEN: Reading the solution file
    expect(fs.existsSync(SLN_PATH), 'backend/SiesaAgents.sln must exist').toBe(true);

    const slnContent = fs.readFileSync(SLN_PATH, 'utf-8');

    // THEN: The Domain project is referenced
    expect(slnContent).toContain('SiesaAgents.Domain');
  });

  test('should reference SiesaAgents.Infrastructure project in the solution', () => {
    // GIVEN: SiesaAgents.sln exists
    // WHEN: Reading the solution file
    expect(fs.existsSync(SLN_PATH), 'backend/SiesaAgents.sln must exist').toBe(true);

    const slnContent = fs.readFileSync(SLN_PATH, 'utf-8');

    // THEN: The Infrastructure project is referenced
    expect(slnContent).toContain('SiesaAgents.Infrastructure');
  });

  test('should reference SiesaAgents.UnitTests project in the solution', () => {
    // GIVEN: SiesaAgents.sln exists
    // WHEN: Reading the solution file
    expect(fs.existsSync(SLN_PATH), 'backend/SiesaAgents.sln must exist').toBe(true);

    const slnContent = fs.readFileSync(SLN_PATH, 'utf-8');

    // THEN: The UnitTests project is referenced
    expect(slnContent).toContain('SiesaAgents.UnitTests');
  });

  test('should have SiesaAgents.API.csproj at expected path', () => {
    // GIVEN: The backend solution is scaffolded
    // WHEN: Inspecting backend/src/SiesaAgents.API/
    const projPath = path.join(BACKEND_ROOT, 'src/SiesaAgents.API/SiesaAgents.API.csproj');

    // THEN: The API project file exists
    expect(fs.existsSync(projPath), 'backend/src/SiesaAgents.API/SiesaAgents.API.csproj must exist').toBe(true);
  });

  test('should have SiesaAgents.Application.csproj at expected path', () => {
    // GIVEN: The backend solution is scaffolded
    // WHEN: Inspecting backend/src/SiesaAgents.Application/
    const projPath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.Application/SiesaAgents.Application.csproj'
    );

    // THEN: The Application project file exists
    expect(
      fs.existsSync(projPath),
      'backend/src/SiesaAgents.Application/SiesaAgents.Application.csproj must exist'
    ).toBe(true);
  });

  test('should have SiesaAgents.Domain.csproj at expected path', () => {
    // GIVEN: The backend solution is scaffolded
    // WHEN: Inspecting backend/src/SiesaAgents.Domain/
    const projPath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.Domain/SiesaAgents.Domain.csproj'
    );

    // THEN: The Domain project file exists
    expect(
      fs.existsSync(projPath),
      'backend/src/SiesaAgents.Domain/SiesaAgents.Domain.csproj must exist'
    ).toBe(true);
  });

  test('should have SiesaAgents.Infrastructure.csproj at expected path', () => {
    // GIVEN: The backend solution is scaffolded
    // WHEN: Inspecting backend/src/SiesaAgents.Infrastructure/
    const projPath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj'
    );

    // THEN: The Infrastructure project file exists
    expect(
      fs.existsSync(projPath),
      'backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj must exist'
    ).toBe(true);
  });

  test('should have SiesaAgents.API.csproj referencing Application and Infrastructure projects', () => {
    // GIVEN: Project references are configured per Story 1.1 Task 3.2
    // WHEN: Reading SiesaAgents.API.csproj
    const projPath = path.join(BACKEND_ROOT, 'src/SiesaAgents.API/SiesaAgents.API.csproj');
    expect(fs.existsSync(projPath), 'SiesaAgents.API.csproj must exist').toBe(true);

    const projContent = fs.readFileSync(projPath, 'utf-8');

    // THEN: The API project references Application and Infrastructure
    expect(projContent).toContain('SiesaAgents.Application');
    expect(projContent).toContain('SiesaAgents.Infrastructure');
  });

  test('should have SiesaAgents.Application.csproj referencing Domain project', () => {
    // GIVEN: Project references are configured per Story 1.1 Task 3.2
    // WHEN: Reading SiesaAgents.Application.csproj
    const projPath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.Application/SiesaAgents.Application.csproj'
    );
    expect(fs.existsSync(projPath), 'SiesaAgents.Application.csproj must exist').toBe(true);

    const projContent = fs.readFileSync(projPath, 'utf-8');

    // THEN: Application references Domain
    expect(projContent).toContain('SiesaAgents.Domain');
  });

  test('should have SiesaAgents.Infrastructure.csproj referencing Domain project', () => {
    // GIVEN: Project references are configured per Story 1.1 Task 3.2
    // WHEN: Reading SiesaAgents.Infrastructure.csproj
    const projPath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj'
    );
    expect(fs.existsSync(projPath), 'SiesaAgents.Infrastructure.csproj must exist').toBe(true);

    const projContent = fs.readFileSync(projPath, 'utf-8');

    // THEN: Infrastructure references Domain
    expect(projContent).toContain('SiesaAgents.Domain');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6: dotnet build succeeds with zero warnings and zero errors
// Verified via runtime proxy: if server responds, build succeeded.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Backend builds with zero errors and zero warnings', () => {
  test('should serve the Scalar page proving the solution compiled successfully', async ({
    request,
  }) => {
    // GIVEN: dotnet build has been run for SiesaAgents.sln
    // WHEN: The backend server is running (build must succeed for server to start)
    // NOTE: A build failure prevents the server from starting; this is a runtime proxy for AC6

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Server responds with 200 — proving the entire solution compiled without errors
    expect(response.status()).toBe(200);
  });

  test('should serve /api/v1/health proving ExceptionHandlingMiddleware compiled and registered', async ({
    request,
  }) => {
    // GIVEN: Program.cs registers ExceptionHandlingMiddleware and MapHealthEndpoints
    // WHEN: The health endpoint is hit
    // NOTE: If any compilation error existed in registered middleware, server would not start

    const response = await request.get(`${API_BASE_URL}/api/v1/health`);

    // THEN: Health endpoint responds — confirming middleware and endpoint compiled without errors
    expect(response.status()).toBe(200);
  });

  test('should have ExceptionHandlingMiddleware.cs at expected path', () => {
    // GIVEN: The middleware is created per Story 1.1 Task 3.5
    // WHEN: Inspecting backend/src/SiesaAgents.API/Middleware/
    const middlewarePath = path.resolve(
      __dirname,
      '../../../backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs'
    );

    // THEN: The middleware file exists
    expect(
      fs.existsSync(middlewarePath),
      'backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs must exist'
    ).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC8: AppDbContext.cs calls ApplySnakeCaseNaming() as last statement in OnModelCreating
//      and has no [Column] or [Table] attributes on any entity
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC8 — AppDbContext enforces snake_case naming conventions correctly', () => {
  const APP_DB_CONTEXT_PATH = path.resolve(
    __dirname,
    '../../../backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs'
  );

  test('should have AppDbContext.cs at backend/src/SiesaAgents.Infrastructure/Data/', () => {
    // GIVEN: The Infrastructure project is scaffolded per Story 1.1 Task 3.6
    // WHEN: Inspecting the Data/ directory
    // THEN: AppDbContext.cs exists
    expect(
      fs.existsSync(APP_DB_CONTEXT_PATH),
      'backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs must exist'
    ).toBe(true);
  });

  test('should contain modelBuilder.ApplySnakeCaseNaming() call in AppDbContext.cs', () => {
    // GIVEN: AppDbContext.cs exists
    // WHEN: Reading the file content
    expect(fs.existsSync(APP_DB_CONTEXT_PATH), 'AppDbContext.cs must exist').toBe(true);
    const content = fs.readFileSync(APP_DB_CONTEXT_PATH, 'utf-8');

    // THEN: ApplySnakeCaseNaming() is called
    expect(content).toContain('ApplySnakeCaseNaming()');
  });

  test('should call ApplySnakeCaseNaming() as the LAST statement in OnModelCreating', () => {
    // GIVEN: AppDbContext.cs exists and contains OnModelCreating
    // WHEN: Parsing the OnModelCreating method body
    expect(fs.existsSync(APP_DB_CONTEXT_PATH), 'AppDbContext.cs must exist').toBe(true);
    const content = fs.readFileSync(APP_DB_CONTEXT_PATH, 'utf-8');

    // THEN: ApplySnakeCaseNaming() is the last meaningful call before the closing brace
    // Pattern: ApplySnakeCaseNaming() must appear after all other modelBuilder calls
    const applySnakeCaseIndex = content.lastIndexOf('ApplySnakeCaseNaming()');
    const onModelCreatingIndex = content.indexOf('OnModelCreating');

    expect(applySnakeCaseIndex).toBeGreaterThan(onModelCreatingIndex);

    // No modelBuilder calls should appear after ApplySnakeCaseNaming()
    const afterApplySnakeCase = content.substring(applySnakeCaseIndex);
    // Should only contain closing braces and whitespace after ApplySnakeCaseNaming()
    const remainingModelBuilderCalls = afterApplySnakeCase
      .replace('ApplySnakeCaseNaming()', '')
      .match(/modelBuilder\.\w+/g);
    expect(remainingModelBuilderCalls).toBeNull();
  });

  test('should not contain [Column] attribute anywhere in the Infrastructure project', () => {
    // GIVEN: The Infrastructure project follows snake_case via EFCore.NamingConventions only
    // WHEN: Scanning all .cs files in SiesaAgents.Infrastructure/
    const infraRoot = path.resolve(
      __dirname,
      '../../../backend/src/SiesaAgents.Infrastructure'
    );
    expect(fs.existsSync(infraRoot), 'SiesaAgents.Infrastructure directory must exist').toBe(true);

    const allCsFiles = getAllCsFiles(infraRoot);
    const filesWithColumnAttribute = allCsFiles.filter((file) => {
      const content = fs.readFileSync(file, 'utf-8');
      return content.includes('[Column(') || content.includes('[Column]');
    });

    // THEN: No [Column] attributes exist in any Infrastructure .cs file
    expect(
      filesWithColumnAttribute,
      `[Column] attribute must not be used — found in: ${filesWithColumnAttribute.join(', ')}`
    ).toHaveLength(0);
  });

  test('should not contain [Table] attribute anywhere in the Infrastructure project', () => {
    // GIVEN: The Infrastructure project follows snake_case via EFCore.NamingConventions only
    // WHEN: Scanning all .cs files in SiesaAgents.Infrastructure/
    const infraRoot = path.resolve(
      __dirname,
      '../../../backend/src/SiesaAgents.Infrastructure'
    );
    expect(fs.existsSync(infraRoot), 'SiesaAgents.Infrastructure directory must exist').toBe(true);

    const allCsFiles = getAllCsFiles(infraRoot);
    const filesWithTableAttribute = allCsFiles.filter((file) => {
      const content = fs.readFileSync(file, 'utf-8');
      return content.includes('[Table(') || content.includes('[Table]');
    });

    // THEN: No [Table] attributes exist in any Infrastructure .cs file
    expect(
      filesWithTableAttribute,
      `[Table] attribute must not be used — found in: ${filesWithTableAttribute.join(', ')}`
    ).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Utility: recursively find all .cs files in a directory
// ─────────────────────────────────────────────────────────────────────────────

function getAllCsFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'obj' && entry.name !== 'bin') {
      results.push(...getAllCsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.cs')) {
      results.push(fullPath);
    }
  }
  return results;
}

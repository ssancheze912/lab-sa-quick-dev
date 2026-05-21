/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (Backend Structure)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC2 — Backend .NET 10 Clean Architecture — four projects referenced in SiesaAgents.sln
 *   AC5 — dotnet build SiesaAgents.sln succeeds — verified via solution structure contracts
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const BACKEND_DIR = path.join(PROJECT_ROOT, 'backend');

// ─────────────────────────────────────────────────────────────────────────────
// AC2 + AC5: Backend Clean Architecture solution structure
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2/AC5 — Backend Clean Architecture solution structure', () => {
  test('should have a backend directory at the project root', () => {
    // GIVEN: The backend project has been created per story requirements
    // WHEN: The project root file system is inspected
    // THEN: A backend/ directory exists at the project root
    expect(fs.existsSync(BACKEND_DIR)).toBe(true);
  });

  test('should have SiesaAgents.sln at backend root', () => {
    // GIVEN: The solution was created with dotnet new sln -n SiesaAgents
    // WHEN: The backend directory is inspected
    // THEN: SiesaAgents.sln exists
    const slnPath = path.join(BACKEND_DIR, 'SiesaAgents.sln');
    expect(fs.existsSync(slnPath)).toBe(true);
  });

  test('should have SiesaAgents.API project in src/', () => {
    // GIVEN: The API project was created with dotnet new webapi
    // WHEN: The src/ directory is inspected
    // THEN: SiesaAgents.API directory and .csproj exist
    const apiCsproj = path.join(
      BACKEND_DIR,
      'src',
      'SiesaAgents.API',
      'SiesaAgents.API.csproj'
    );
    expect(fs.existsSync(apiCsproj)).toBe(true);
  });

  test('should have SiesaAgents.Application project in src/', () => {
    // GIVEN: The Application layer was created with dotnet new classlib
    // WHEN: The src/ directory is inspected
    // THEN: SiesaAgents.Application directory and .csproj exist
    const appCsproj = path.join(
      BACKEND_DIR,
      'src',
      'SiesaAgents.Application',
      'SiesaAgents.Application.csproj'
    );
    expect(fs.existsSync(appCsproj)).toBe(true);
  });

  test('should have SiesaAgents.Domain project in src/', () => {
    // GIVEN: The Domain layer was created with dotnet new classlib
    // WHEN: The src/ directory is inspected
    // THEN: SiesaAgents.Domain directory and .csproj exist
    const domainCsproj = path.join(
      BACKEND_DIR,
      'src',
      'SiesaAgents.Domain',
      'SiesaAgents.Domain.csproj'
    );
    expect(fs.existsSync(domainCsproj)).toBe(true);
  });

  test('should have SiesaAgents.Infrastructure project in src/', () => {
    // GIVEN: The Infrastructure layer was created with dotnet new classlib
    // WHEN: The src/ directory is inspected
    // THEN: SiesaAgents.Infrastructure directory and .csproj exist
    const infraCsproj = path.join(
      BACKEND_DIR,
      'src',
      'SiesaAgents.Infrastructure',
      'SiesaAgents.Infrastructure.csproj'
    );
    expect(fs.existsSync(infraCsproj)).toBe(true);
  });

  test('should have SiesaAgents.UnitTests project in tests/', () => {
    // GIVEN: The xUnit test project was created with dotnet new xunit
    // WHEN: The tests/ directory is inspected
    // THEN: SiesaAgents.UnitTests directory and .csproj exist
    const unitTestsCsproj = path.join(
      BACKEND_DIR,
      'tests',
      'SiesaAgents.UnitTests',
      'SiesaAgents.UnitTests.csproj'
    );
    expect(fs.existsSync(unitTestsCsproj)).toBe(true);
  });

  test('should reference all four project layers in SiesaAgents.sln', () => {
    // GIVEN: All four Clean Architecture projects were added to the solution
    // WHEN: The SiesaAgents.sln content is parsed
    // THEN: All four project names appear in the solution file
    const slnPath = path.join(BACKEND_DIR, 'SiesaAgents.sln');
    const slnContent = fs.readFileSync(slnPath, 'utf-8');

    expect(slnContent).toContain('SiesaAgents.API');
    expect(slnContent).toContain('SiesaAgents.Application');
    expect(slnContent).toContain('SiesaAgents.Domain');
    expect(slnContent).toContain('SiesaAgents.Infrastructure');
  });

  test('should have Program.cs in SiesaAgents.API using Scalar (not Swagger)', () => {
    // GIVEN: Architecture mandates Scalar ONLY — app.UseSwagger() is forbidden
    // WHEN: Program.cs content is read
    // THEN: MapScalarApiReference is present and UseSwagger is absent
    const programCsPath = path.join(BACKEND_DIR, 'src', 'SiesaAgents.API', 'Program.cs');
    expect(fs.existsSync(programCsPath)).toBe(true);

    const content = fs.readFileSync(programCsPath, 'utf-8');
    expect(content).toContain('MapScalarApiReference');
    expect(content).not.toContain('UseSwagger');
  });

  test('should have ExceptionHandlingMiddleware in SiesaAgents.API/Middleware/', () => {
    // GIVEN: Problem Details RFC 7807 requires ExceptionHandlingMiddleware
    // WHEN: The Middleware directory is inspected
    // THEN: ExceptionHandlingMiddleware.cs exists
    const middlewarePath = path.join(
      BACKEND_DIR,
      'src',
      'SiesaAgents.API',
      'Middleware',
      'ExceptionHandlingMiddleware.cs'
    );
    expect(fs.existsSync(middlewarePath)).toBe(true);
  });

  test('should have ExceptionHandlingMiddleware registered before endpoint mapping in Program.cs', () => {
    // GIVEN: Middleware ordering is critical — ExceptionHandlingMiddleware must be first
    // WHEN: Program.cs is parsed for middleware registration order
    const programCsPath = path.join(BACKEND_DIR, 'src', 'SiesaAgents.API', 'Program.cs');
    const content = fs.readFileSync(programCsPath, 'utf-8');

    const middlewarePos = content.indexOf('UseMiddleware<ExceptionHandlingMiddleware>');
    const scalarPos = content.indexOf('MapScalarApiReference');

    // THEN: ExceptionHandlingMiddleware is registered BEFORE MapScalarApiReference
    expect(middlewarePos).toBeGreaterThan(-1);
    expect(scalarPos).toBeGreaterThan(-1);
    expect(middlewarePos).toBeLessThan(scalarPos);
  });

  test('should have CORS policy configured with http://localhost:5173 as allowed origin in Program.cs', () => {
    // GIVEN: AC3 requires CORS to allow requests from http://localhost:5173
    // WHEN: Program.cs content is read for CORS configuration
    const programCsPath = path.join(BACKEND_DIR, 'src', 'SiesaAgents.API', 'Program.cs');
    const content = fs.readFileSync(programCsPath, 'utf-8');

    // THEN: The CORS policy explicitly lists http://localhost:5173 as an allowed origin
    expect(content).toContain('http://localhost:5173');
    expect(content).toContain('AddCors');
    expect(content).toContain('UseCors');
  });

  test('should have appsettings.Development.json with ConnectionStrings and AllowedOrigins', () => {
    // GIVEN: Task 5 requires appsettings.Development.json with DB connection and CORS origins
    // WHEN: The appsettings.Development.json is parsed
    const appsettingsPath = path.join(
      BACKEND_DIR,
      'src',
      'SiesaAgents.API',
      'appsettings.Development.json'
    );
    expect(fs.existsSync(appsettingsPath)).toBe(true);

    const content = JSON.parse(fs.readFileSync(appsettingsPath, 'utf-8'));

    // THEN: ConnectionStrings.DefaultConnection and AllowedOrigins are present
    expect(content?.ConnectionStrings?.DefaultConnection).toBeDefined();
    expect(content?.AllowedOrigins).toBeDefined();
    expect(Array.isArray(content?.AllowedOrigins)).toBe(true);
  });
});

/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — File Structure Validation
 * These tests verify backend project structure and configuration files
 * in environments where the .NET SDK / runtime is not available.
 *
 * Acceptance Criteria covered:
 *   AC2 — Four Clean Architecture projects referenced in SiesaAgents.sln;
 *          Scalar configured via MapScalarApiReference(); no Swagger/Swashbuckle
 *   AC5 — All four projects present with valid .csproj files; Program.cs
 *          contains correct Minimal API setup (build verified by file structure)
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Project root is two levels up from e2e/tests/api/
const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const BACKEND_ROOT = path.join(PROJECT_ROOT, 'backend');

// ─────────────────────────────────────────────────────────────────────────────
// AC2: Backend project structure — SiesaAgents.sln + four CA layers
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Backend Clean Architecture project structure', () => {
  test('should have SiesaAgents.sln at backend root', () => {
    // GIVEN: The backend solution has been created
    const slnPath = path.join(BACKEND_ROOT, 'SiesaAgents.sln');

    // THEN: The solution file exists
    expect(fs.existsSync(slnPath), `Expected SiesaAgents.sln at ${slnPath}`).toBe(true);
  });

  test('should have SiesaAgents.sln referencing all four Clean Architecture projects', () => {
    // GIVEN: The solution file exists
    const slnPath = path.join(BACKEND_ROOT, 'SiesaAgents.sln');
    expect(fs.existsSync(slnPath)).toBe(true);

    const slnContent = fs.readFileSync(slnPath, 'utf-8');

    // THEN: All four CA layers are referenced in the solution
    expect(slnContent).toContain('SiesaAgents.API');
    expect(slnContent).toContain('SiesaAgents.Application');
    expect(slnContent).toContain('SiesaAgents.Domain');
    expect(slnContent).toContain('SiesaAgents.Infrastructure');
  });

  test('should have Program.cs in SiesaAgents.API', () => {
    // GIVEN: The API project has been created
    const programPath = path.join(BACKEND_ROOT, 'src/SiesaAgents.API/Program.cs');

    // THEN: Program.cs exists
    expect(fs.existsSync(programPath), `Expected Program.cs at ${programPath}`).toBe(true);
  });

  test('should configure Scalar API reference (NOT Swagger) in Program.cs', () => {
    // GIVEN: Architecture mandates Scalar ONLY — Swashbuckle explicitly forbidden
    const programPath = path.join(BACKEND_ROOT, 'src/SiesaAgents.API/Program.cs');
    const content = fs.readFileSync(programPath, 'utf-8');

    // THEN: MapScalarApiReference is present
    expect(content).toContain('MapScalarApiReference');

    // AND: Swagger/Swashbuckle is NOT present
    expect(content).not.toContain('UseSwagger');
    expect(content).not.toContain('AddSwaggerGen');
  });

  test('should NOT have WeatherForecast endpoint in Program.cs', () => {
    // GIVEN: Default .NET webapi template includes WeatherForecast which must be removed
    const programPath = path.join(BACKEND_ROOT, 'src/SiesaAgents.API/Program.cs');
    const content = fs.readFileSync(programPath, 'utf-8');

    // THEN: WeatherForecast is not referenced
    expect(content).not.toContain('WeatherForecast');
  });

  test('should have CORS policy allowing http://localhost:5173 in Program.cs', () => {
    // GIVEN: CORS policy "DevCors" must allow the frontend origin
    const programPath = path.join(BACKEND_ROOT, 'src/SiesaAgents.API/Program.cs');
    const content = fs.readFileSync(programPath, 'utf-8');

    // THEN: CORS is configured
    expect(content).toContain('AddCors');
    expect(content).toContain('UseCors');

    // AND: Frontend origin is allowed (directly or via config key)
    const hasDirectOrigin = content.includes('http://localhost:5173');
    const hasConfigOrigin = content.includes('AllowedOrigins');
    expect(hasDirectOrigin || hasConfigOrigin).toBe(true);
  });

  test('should have ExceptionHandlingMiddleware registered in Program.cs', () => {
    // GIVEN: Problem Details RFC 7807 middleware must be wired before routing
    const programPath = path.join(BACKEND_ROOT, 'src/SiesaAgents.API/Program.cs');
    const content = fs.readFileSync(programPath, 'utf-8');

    // THEN: ExceptionHandlingMiddleware is registered
    expect(content).toContain('ExceptionHandlingMiddleware');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5: All four CA layer project files exist
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — All four Clean Architecture layer projects exist', () => {
  test('should have SiesaAgents.API.csproj targeting net10.0', () => {
    // GIVEN: The API project has been created targeting .NET 10
    // WHEN: The .csproj file is read
    // THEN: It targets net10.0 framework moniker
    const csprojPath = path.join(BACKEND_ROOT, 'src/SiesaAgents.API/SiesaAgents.API.csproj');
    expect(fs.existsSync(csprojPath), `Expected .csproj at ${csprojPath}`).toBe(true);

    const content = fs.readFileSync(csprojPath, 'utf-8');
    expect(content).toContain('net10.0');
  });

  test('should have SiesaAgents.Application.csproj', () => {
    // GIVEN: The backend solution requires an Application layer
    // WHEN: The project directory is inspected
    // THEN: The Application .csproj file exists
    const csprojPath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.Application/SiesaAgents.Application.csproj'
    );
    expect(fs.existsSync(csprojPath), `Expected .csproj at ${csprojPath}`).toBe(true);
  });

  test('should have SiesaAgents.Domain.csproj', () => {
    // GIVEN: The backend solution requires a Domain layer
    // WHEN: The project directory is inspected
    // THEN: The Domain .csproj file exists
    const csprojPath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.Domain/SiesaAgents.Domain.csproj'
    );
    expect(fs.existsSync(csprojPath), `Expected .csproj at ${csprojPath}`).toBe(true);
  });

  test('should have SiesaAgents.Infrastructure.csproj', () => {
    // GIVEN: The backend solution requires an Infrastructure layer
    // WHEN: The project directory is inspected
    // THEN: The Infrastructure .csproj file exists
    const csprojPath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj'
    );
    expect(fs.existsSync(csprojPath), `Expected .csproj at ${csprojPath}`).toBe(true);
  });

  test('should have ExceptionHandlingMiddleware.cs with Problem Details pattern', () => {
    // GIVEN: ExceptionHandlingMiddleware must implement RFC 7807 Problem Details
    const middlewarePath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs'
    );
    expect(
      fs.existsSync(middlewarePath),
      `Expected ExceptionHandlingMiddleware.cs at ${middlewarePath}`
    ).toBe(true);

    const content = fs.readFileSync(middlewarePath, 'utf-8');

    // THEN: Implements Problem Details pattern
    expect(content).toContain('ProblemDetails');
    expect(content).toContain('application/problem+json');
    expect(content).toContain('InvokeAsync');
  });

  test('should have AppDbContext.cs in Infrastructure/Data', () => {
    // GIVEN: EF Core DbContext must exist in Infrastructure layer
    const dbContextPath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.Infrastructure/Data/AppDbContext.cs'
    );
    expect(
      fs.existsSync(dbContextPath),
      `Expected AppDbContext.cs at ${dbContextPath}`
    ).toBe(true);

    const content = fs.readFileSync(dbContextPath, 'utf-8');

    // THEN: Extends DbContext
    expect(content).toContain('DbContext');
  });

  test('should have appsettings.Development.json with ConnectionStrings and AllowedOrigins', () => {
    // GIVEN: Development settings must include DB connection and CORS origins
    const settingsPath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.API/appsettings.Development.json'
    );
    expect(fs.existsSync(settingsPath), `Expected appsettings.Development.json at ${settingsPath}`).toBe(true);

    const content = fs.readFileSync(settingsPath, 'utf-8');
    const settings = JSON.parse(content);

    // THEN: ConnectionStrings and AllowedOrigins keys exist
    expect(settings).toHaveProperty('ConnectionStrings');
    expect(settings).toHaveProperty('AllowedOrigins');
  });
});

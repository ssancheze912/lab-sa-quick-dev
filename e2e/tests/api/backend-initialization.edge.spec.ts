/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Edge Case Tests — Backend File Structure
 * Expands ATDD coverage with boundary conditions and invariants not covered
 * by the primary ATDD backend-initialization.api.spec.ts.
 *
 * Coverage areas:
 *   - Solution references all 5 projects (including UnitTests)
 *   - launchSettings.json port boundary (exactly 5000)
 *   - Project dependency graph correctness (no circular or incorrect refs)
 *   - Entity base class uses Guid (not int) and DateTimeOffset (not DateTime)
 *   - ExceptionHandlingMiddleware does NOT leak ex.Message or stack traces
 *   - IRepository has all CRUD methods with CancellationToken support
 *   - AppDbContext uses primary constructor (not parameterized constructor body)
 *   - csproj Nullable and ImplicitUsings flags
 *   - AllowedOrigins array is not empty
 *   - appsettings.Development.json ConnectionStrings has DefaultConnection key
 *   - Program.cs middleware order: ExceptionHandlingMiddleware before UseCors
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const BACKEND_ROOT = path.join(PROJECT_ROOT, 'backend');

// ─────────────────────────────────────────────────────────────────────────────
// Solution file completeness
// ─────────────────────────────────────────────────────────────────────────────

test.describe('SiesaAgents.sln completeness edge cases', () => {
  test('should include UnitTests project in the solution', () => {
    // GIVEN: tests/SiesaAgents.UnitTests is part of the solution
    const slnPath = path.join(BACKEND_ROOT, 'SiesaAgents.sln');
    const content = fs.readFileSync(slnPath, 'utf-8');
    expect(content).toContain('SiesaAgents.UnitTests');
  });

  test('should reference exactly 5 projects in the solution', () => {
    // GIVEN: API, Application, Domain, Infrastructure, UnitTests
    const slnPath = path.join(BACKEND_ROOT, 'SiesaAgents.sln');
    const content = fs.readFileSync(slnPath, 'utf-8');
    // Count "Project(" declarations
    const projectLines = (content.match(/^Project\(/gm) ?? []).length;
    expect(projectLines).toBe(5);
  });

  test('solution file should use valid VS format (Format Version 12.00)', () => {
    // GIVEN: Solution files must be valid Visual Studio format
    const slnPath = path.join(BACKEND_ROOT, 'SiesaAgents.sln');
    const content = fs.readFileSync(slnPath, 'utf-8');
    expect(content).toContain('Format Version 12.00');
  });

  test('each project in solution should have a unique GUID', () => {
    // GIVEN: Duplicate GUIDs cause build failures
    const slnPath = path.join(BACKEND_ROOT, 'SiesaAgents.sln');
    const content = fs.readFileSync(slnPath, 'utf-8');
    // Extract GUIDs from Project( lines: last GUID on the project declaration
    const guidPattern = /\{([0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12})\}"/gi;
    const guids: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = guidPattern.exec(content)) !== null) {
      guids.push(match[1].toUpperCase());
    }
    // Remove project type GUIDs (FAE04EC0 prefix) and keep project-specific ones
    const projectGuids = guids.filter((g) => !g.startsWith('FAE04EC0'));
    const uniqueGuids = new Set(projectGuids);
    expect(uniqueGuids.size).toBe(projectGuids.length);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// launchSettings.json edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('launchSettings.json port configuration edge cases', () => {
  test('should configure applicationUrl on exactly port 5000', () => {
    // GIVEN: AC2 requires the backend to start on port 5000
    const launchSettingsPath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.API/Properties/launchSettings.json'
    );
    expect(fs.existsSync(launchSettingsPath)).toBe(true);

    const settings = JSON.parse(fs.readFileSync(launchSettingsPath, 'utf-8'));
    const profiles = settings.profiles ?? {};
    const urls: string[] = Object.values(profiles).map(
      (p: unknown) => (p as { applicationUrl?: string }).applicationUrl ?? ''
    );

    const hasPort5000 = urls.some((url) => url.includes(':5000'));
    expect(hasPort5000).toBe(true);
  });

  test('should NOT use HTTPS in development launch profile (http only)', () => {
    // GIVEN: CORS configuration uses http://localhost:5000; HTTPS would cause mismatch
    const launchSettingsPath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.API/Properties/launchSettings.json'
    );
    const settings = JSON.parse(fs.readFileSync(launchSettingsPath, 'utf-8'));
    const profiles = settings.profiles ?? {};

    // The "http" profile should not contain an HTTPS port
    const httpProfile = profiles['http'] ?? profiles['SiesaAgents.API'] ?? {};
    const appUrl: string = (httpProfile as { applicationUrl?: string }).applicationUrl ?? '';
    expect(appUrl).not.toContain('https://');
  });

  test('should set ASPNETCORE_ENVIRONMENT to Development', () => {
    // GIVEN: Development config (appsettings.Development.json) is loaded in Development env
    const launchSettingsPath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.API/Properties/launchSettings.json'
    );
    const settings = JSON.parse(fs.readFileSync(launchSettingsPath, 'utf-8'));
    const profiles = settings.profiles ?? {};
    const envVars = (profiles['http'] as { environmentVariables?: Record<string, string> } | undefined)
      ?.environmentVariables ?? {};
    expect(envVars['ASPNETCORE_ENVIRONMENT']).toBe('Development');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Project dependency graph invariants
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Clean Architecture project dependency graph', () => {
  test('Domain project should have NO ProjectReference (pure domain)', () => {
    // GIVEN: Domain layer must not depend on any other layer
    const csprojPath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.Domain/SiesaAgents.Domain.csproj'
    );
    const content = fs.readFileSync(csprojPath, 'utf-8');
    expect(content).not.toContain('<ProjectReference');
  });

  test('Application project should reference Domain and NOT Infrastructure or API', () => {
    // GIVEN: Application depends only on Domain (no infrastructure leakage)
    const csprojPath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.Application/SiesaAgents.Application.csproj'
    );
    const content = fs.readFileSync(csprojPath, 'utf-8');

    expect(content).toContain('SiesaAgents.Domain');
    expect(content).not.toContain('SiesaAgents.Infrastructure');
    expect(content).not.toContain('SiesaAgents.API');
  });

  test('Infrastructure project should reference Domain and NOT Application or API', () => {
    // GIVEN: Infrastructure depends only on Domain (no circular dependency with Application)
    const csprojPath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj'
    );
    const content = fs.readFileSync(csprojPath, 'utf-8');

    expect(content).toContain('SiesaAgents.Domain');
    expect(content).not.toContain('SiesaAgents.Application');
    expect(content).not.toContain('SiesaAgents.API');
  });

  test('API project should reference Application and Infrastructure', () => {
    // GIVEN: API orchestrates Application + Infrastructure
    const csprojPath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.API/SiesaAgents.API.csproj'
    );
    const content = fs.readFileSync(csprojPath, 'utf-8');

    expect(content).toContain('SiesaAgents.Application');
    expect(content).toContain('SiesaAgents.Infrastructure');
  });

  test('UnitTests project should reference Application and Domain', () => {
    // GIVEN: Unit tests exercise Application + Domain logic
    const csprojPath = path.join(
      BACKEND_ROOT,
      'tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj'
    );
    const content = fs.readFileSync(csprojPath, 'utf-8');

    expect(content).toContain('SiesaAgents.Application');
    expect(content).toContain('SiesaAgents.Domain');
    expect(content).not.toContain('SiesaAgents.Infrastructure');
    expect(content).not.toContain('SiesaAgents.API');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Entity base class — type safety invariants
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Entity base class type safety', () => {
  test('Entity.Id should use Guid (not int, long, or string)', () => {
    // GIVEN: Architecture mandates Guid PKs for all entities
    const entityPath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.Domain/Entities/Entity.cs'
    );
    const content = fs.readFileSync(entityPath, 'utf-8');

    expect(content).toContain('Guid');
    expect(content).not.toMatch(/\bint\s+Id\b/);
    expect(content).not.toMatch(/\blong\s+Id\b/);
    expect(content).not.toMatch(/\bstring\s+Id\b/);
  });

  test('Entity timestamps should use DateTimeOffset (not DateTime)', () => {
    // GIVEN: Architecture mandates DateTimeOffset — NEVER DateTime
    const entityPath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.Domain/Entities/Entity.cs'
    );
    const content = fs.readFileSync(entityPath, 'utf-8');

    expect(content).toContain('DateTimeOffset');
    // Must not use DateTime without Offset suffix
    const hasRawDateTime = content.match(/\bDateTime\b(?!Offset)/);
    expect(hasRawDateTime).toBeNull();
  });

  test('Entity.Id should initialize to Guid.NewGuid() (not default(Guid))', () => {
    // GIVEN: PKs must be auto-assigned, not left as empty Guid
    const entityPath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.Domain/Entities/Entity.cs'
    );
    const content = fs.readFileSync(entityPath, 'utf-8');
    expect(content).toContain('Guid.NewGuid()');
  });

  test('Entity timestamps should initialize to DateTimeOffset.UtcNow (not Now or local)', () => {
    // GIVEN: Timestamps must be UTC to avoid timezone bugs
    const entityPath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.Domain/Entities/Entity.cs'
    );
    const content = fs.readFileSync(entityPath, 'utf-8');
    expect(content).toContain('DateTimeOffset.UtcNow');
    expect(content).not.toContain('DateTimeOffset.Now');
    expect(content).not.toContain('DateTime.Now');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ExceptionHandlingMiddleware security edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('ExceptionHandlingMiddleware security invariants', () => {
  test('should NOT expose ex.Message in the Problem Details response', () => {
    // GIVEN: Exposing exception messages leaks internal details to clients
    const middlewarePath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs'
    );
    const content = fs.readFileSync(middlewarePath, 'utf-8');

    // Detail must not be set to ex.Message or ex.ToString()
    expect(content).not.toContain('ex.Message');
    expect(content).not.toContain('ex.ToString()');
    expect(content).not.toContain('ex.StackTrace');
  });

  test('should set HTTP status 500 for unhandled exceptions', () => {
    // GIVEN: Unhandled exceptions must return 500 Internal Server Error
    const middlewarePath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs'
    );
    const content = fs.readFileSync(middlewarePath, 'utf-8');
    expect(content).toContain('500');
  });

  test('should set Content-Type to application/problem+json', () => {
    // GIVEN: RFC 7807 requires the application/problem+json media type
    const middlewarePath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs'
    );
    const content = fs.readFileSync(middlewarePath, 'utf-8');
    expect(content).toContain('application/problem+json');
  });

  test('should use primary constructor (RequestDelegate parameter injection)', () => {
    // GIVEN: .NET 10 uses primary constructor for dependency injection
    const middlewarePath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs'
    );
    const content = fs.readFileSync(middlewarePath, 'utf-8');
    expect(content).toContain('RequestDelegate');
  });

  test('Problem Details Detail property should be null (no internal info)', () => {
    // GIVEN: Detail must not expose internal information
    const middlewarePath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs'
    );
    const content = fs.readFileSync(middlewarePath, 'utf-8');
    expect(content).toContain('Detail = null');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// IRepository interface edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('IRepository interface completeness', () => {
  test('should have GetByIdAsync method', () => {
    // GIVEN: IRepository must expose a method to fetch a single entity by id
    // WHEN: IRepository.cs is read
    // THEN: GetByIdAsync is declared
    const repoPath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.Application/Interfaces/IRepository.cs'
    );
    const content = fs.readFileSync(repoPath, 'utf-8');
    expect(content).toContain('GetByIdAsync');
  });

  test('should have GetAllAsync method', () => {
    // GIVEN: IRepository must expose a method to fetch all entities
    // WHEN: IRepository.cs is read
    // THEN: GetAllAsync is declared
    const repoPath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.Application/Interfaces/IRepository.cs'
    );
    const content = fs.readFileSync(repoPath, 'utf-8');
    expect(content).toContain('GetAllAsync');
  });

  test('should have AddAsync method', () => {
    // GIVEN: IRepository must expose a method to persist new entities
    // WHEN: IRepository.cs is read
    // THEN: AddAsync is declared
    const repoPath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.Application/Interfaces/IRepository.cs'
    );
    const content = fs.readFileSync(repoPath, 'utf-8');
    expect(content).toContain('AddAsync');
  });

  test('should have UpdateAsync method', () => {
    // GIVEN: IRepository must expose a method to update existing entities
    // WHEN: IRepository.cs is read
    // THEN: UpdateAsync is declared
    const repoPath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.Application/Interfaces/IRepository.cs'
    );
    const content = fs.readFileSync(repoPath, 'utf-8');
    expect(content).toContain('UpdateAsync');
  });

  test('should have DeleteAsync method', () => {
    // GIVEN: IRepository must expose a method to remove entities
    // WHEN: IRepository.cs is read
    // THEN: DeleteAsync is declared
    const repoPath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.Application/Interfaces/IRepository.cs'
    );
    const content = fs.readFileSync(repoPath, 'utf-8');
    expect(content).toContain('DeleteAsync');
  });

  test('all async methods should accept CancellationToken parameter', () => {
    // GIVEN: Async operations must support cooperative cancellation
    const repoPath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.Application/Interfaces/IRepository.cs'
    );
    const content = fs.readFileSync(repoPath, 'utf-8');
    expect(content).toContain('CancellationToken');
  });

  test('interface should be generic and constrained to Entity', () => {
    // GIVEN: IRepository<T> must constrain T to Entity base class
    const repoPath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.Application/Interfaces/IRepository.cs'
    );
    const content = fs.readFileSync(repoPath, 'utf-8');
    // Must be generic with Entity constraint
    expect(content).toMatch(/interface\s+IRepository<T>/);
    expect(content).toContain('where T : Entity');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AppDbContext edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AppDbContext implementation edge cases', () => {
  test('should use primary constructor pattern (DbContextOptions parameter)', () => {
    // GIVEN: .NET 10 uses primary constructor for DbContext
    const dbContextPath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.Infrastructure/Data/AppDbContext.cs'
    );
    const content = fs.readFileSync(dbContextPath, 'utf-8');
    expect(content).toContain('DbContextOptions');
  });

  test('should call ApplyConfigurationsFromAssembly for entity configuration', () => {
    // GIVEN: EF Core configuration should use IEntityTypeConfiguration pattern
    const dbContextPath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.Infrastructure/Data/AppDbContext.cs'
    );
    const content = fs.readFileSync(dbContextPath, 'utf-8');
    expect(content).toContain('ApplyConfigurationsFromAssembly');
  });

  test('should override OnModelCreating', () => {
    // GIVEN: Model configuration hook must be overridden
    const dbContextPath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.Infrastructure/Data/AppDbContext.cs'
    );
    const content = fs.readFileSync(dbContextPath, 'utf-8');
    expect(content).toContain('OnModelCreating');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// appsettings.Development.json boundary checks
// ─────────────────────────────────────────────────────────────────────────────

test.describe('appsettings.Development.json boundary checks', () => {
  test('AllowedOrigins array should not be empty', () => {
    // GIVEN: At least one origin must be configured for CORS to work
    const settingsPath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.API/appsettings.Development.json'
    );
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    const origins: string[] = settings.AllowedOrigins ?? [];
    expect(origins.length).toBeGreaterThan(0);
  });

  test('ConnectionStrings should have DefaultConnection key', () => {
    // GIVEN: EF Core AppDbContext uses the DefaultConnection string
    const settingsPath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.API/appsettings.Development.json'
    );
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    expect(settings.ConnectionStrings).toHaveProperty('DefaultConnection');
  });

  test('DefaultConnection should reference siesa_agents_db database', () => {
    // GIVEN: The development database is named siesa_agents_db per architecture doc
    const settingsPath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.API/appsettings.Development.json'
    );
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    const connStr: string = settings.ConnectionStrings?.DefaultConnection ?? '';
    expect(connStr).toContain('siesa_agents_db');
  });

  test('appsettings.Development.json should be valid JSON (no trailing commas)', () => {
    // GIVEN: Malformed JSON causes startup failures
    const settingsPath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.API/appsettings.Development.json'
    );
    const raw = fs.readFileSync(settingsPath, 'utf-8');
    expect(() => JSON.parse(raw)).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Program.cs middleware ordering edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Program.cs middleware ordering edge cases', () => {
  test('ExceptionHandlingMiddleware should be registered before UseCors', () => {
    // GIVEN: Exception handler must wrap all subsequent middleware including CORS
    const programPath = path.join(BACKEND_ROOT, 'src/SiesaAgents.API/Program.cs');
    const content = fs.readFileSync(programPath, 'utf-8');

    const exceptionIndex = content.indexOf('ExceptionHandlingMiddleware');
    const corsIndex = content.indexOf('UseCors');

    expect(exceptionIndex).toBeGreaterThan(-1);
    expect(corsIndex).toBeGreaterThan(-1);
    expect(exceptionIndex).toBeLessThan(corsIndex);
  });

  test('should register MapOpenApi() for Scalar metadata', () => {
    // GIVEN: Scalar requires MapOpenApi to generate the OpenAPI document
    const programPath = path.join(BACKEND_ROOT, 'src/SiesaAgents.API/Program.cs');
    const content = fs.readFileSync(programPath, 'utf-8');
    expect(content).toContain('MapOpenApi');
  });

  test('should NOT have app.UseHttpsRedirection() (http-only dev setup)', () => {
    // GIVEN: Dev environment uses plain HTTP; HTTPS redirect would break CORS
    const programPath = path.join(BACKEND_ROOT, 'src/SiesaAgents.API/Program.cs');
    const content = fs.readFileSync(programPath, 'utf-8');
    expect(content).not.toContain('UseHttpsRedirection');
  });

  test('should NOT have app.UseAuthorization() (not required in story 1.1)', () => {
    // GIVEN: Authentication/authorization is not part of the foundation story
    const programPath = path.join(BACKEND_ROOT, 'src/SiesaAgents.API/Program.cs');
    const content = fs.readFileSync(programPath, 'utf-8');
    // Authorization middleware would appear in Program.cs if misconfigured from template
    expect(content).not.toContain('UseAuthorization');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// csproj compiler settings edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('csproj compiler settings', () => {
  test('API csproj should have Nullable enabled', () => {
    // GIVEN: All .NET 10 projects must have nullable reference types enabled
    // WHEN: The API .csproj file is read
    // THEN: <Nullable>enable</Nullable> is present
    const csprojPath = path.join(BACKEND_ROOT, 'src/SiesaAgents.API/SiesaAgents.API.csproj');
    const content = fs.readFileSync(csprojPath, 'utf-8');
    expect(content).toContain('<Nullable>enable</Nullable>');
  });

  test('Domain csproj should have Nullable enabled', () => {
    // GIVEN: All .NET 10 projects must have nullable reference types enabled
    // WHEN: The Domain .csproj file is read
    // THEN: <Nullable>enable</Nullable> is present
    const csprojPath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.Domain/SiesaAgents.Domain.csproj'
    );
    const content = fs.readFileSync(csprojPath, 'utf-8');
    expect(content).toContain('<Nullable>enable</Nullable>');
  });

  test('Application csproj should have Nullable enabled', () => {
    // GIVEN: All .NET 10 projects must have nullable reference types enabled
    // WHEN: The Application .csproj file is read
    // THEN: <Nullable>enable</Nullable> is present
    const csprojPath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.Application/SiesaAgents.Application.csproj'
    );
    const content = fs.readFileSync(csprojPath, 'utf-8');
    expect(content).toContain('<Nullable>enable</Nullable>');
  });

  test('Infrastructure csproj should have Nullable enabled', () => {
    // GIVEN: All .NET 10 projects must have nullable reference types enabled
    // WHEN: The Infrastructure .csproj file is read
    // THEN: <Nullable>enable</Nullable> is present
    const csprojPath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj'
    );
    const content = fs.readFileSync(csprojPath, 'utf-8');
    expect(content).toContain('<Nullable>enable</Nullable>');
  });

  test('Infrastructure csproj should reference Npgsql.EntityFrameworkCore.PostgreSQL', () => {
    // GIVEN: Infrastructure layer uses EF Core with Npgsql provider
    const csprojPath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj'
    );
    const content = fs.readFileSync(csprojPath, 'utf-8');
    expect(content).toContain('Npgsql.EntityFrameworkCore.PostgreSQL');
  });

  test('Application csproj should reference FluentValidation', () => {
    // GIVEN: Application layer uses FluentValidation for request validation
    const csprojPath = path.join(
      BACKEND_ROOT,
      'src/SiesaAgents.Application/SiesaAgents.Application.csproj'
    );
    const content = fs.readFileSync(csprojPath, 'utf-8');
    expect(content).toContain('FluentValidation');
  });
});

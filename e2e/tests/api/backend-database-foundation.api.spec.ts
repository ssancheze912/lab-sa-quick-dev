/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — File Structure & Configuration Validation
 * These tests verify EF Core / PostgreSQL infrastructure is correctly configured
 * in the backend project files (structure-based validation, no running server required).
 *
 * Acceptance Criteria covered:
 *   AC1 — EF Core Migrations folder exists at SiesaAgents.Infrastructure/Migrations/
 *          after running `dotnet ef migrations add InitialCreate`
 *   AC2 — AppDbContext registered via AddDbContext<AppDbContext> + UseNpgsql in Program.cs;
 *          DefaultConnection present in appsettings.Development.json
 *   AC3 — ExceptionHandlingMiddleware returns RFC 7807 Problem Details format
 *          (application/problem+json, status, title, detail — no stack traces)
 *   AC4 — OnModelCreating calls modelBuilder.UseSnakeCaseNamingConvention() as last call
 *          in AppDbContext.cs
 *   AC5 — Infrastructure.csproj contains required EF Core packages;
 *          API.csproj contains EFCore.Design; solution builds without errors
 *
 * Status: RED — tests define expected structure before implementation
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const BACKEND_ROOT = path.join(PROJECT_ROOT, 'backend');
const API_SRC = path.join(BACKEND_ROOT, 'src/SiesaAgents.API');
const INFRASTRUCTURE_SRC = path.join(BACKEND_ROOT, 'src/SiesaAgents.Infrastructure');

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — EF Core migrations folder created after dotnet ef migrations add
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — EF Core migrations folder exists', () => {
  test('should have Migrations directory at SiesaAgents.Infrastructure/Migrations', () => {
    /**
     * Given PostgreSQL is running locally
     * When the developer runs `dotnet ef migrations add InitialCreate`
     * Then SiesaAgents.Infrastructure/Migrations/ directory is created
     */
    const migrationsDir = path.join(INFRASTRUCTURE_SRC, 'Migrations');

    expect(
      fs.existsSync(migrationsDir),
      `Expected Migrations directory at ${migrationsDir}. ` +
        'Run: dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure ' +
        '--startup-project src/SiesaAgents.API'
    ).toBe(true);
  });

  test('should have AppDbContextModelSnapshot.cs inside Migrations directory', () => {
    /**
     * Given the InitialCreate migration has been added
     * When the Migrations directory is inspected
     * Then AppDbContextModelSnapshot.cs exists (created by dotnet ef)
     */
    const migrationsDir = path.join(INFRASTRUCTURE_SRC, 'Migrations');

    expect(
      fs.existsSync(migrationsDir),
      `Migrations directory must exist first at ${migrationsDir}`
    ).toBe(true);

    const files = fs.readdirSync(migrationsDir);
    const hasSnapshot = files.some((f) => f === 'AppDbContextModelSnapshot.cs');

    expect(
      hasSnapshot,
      'AppDbContextModelSnapshot.cs must exist in Migrations/ — ' +
        'run dotnet ef migrations add InitialCreate'
    ).toBe(true);
  });

  test('should have an InitialCreate migration file inside Migrations directory', () => {
    /**
     * Given the InitialCreate migration has been added
     * When the Migrations directory is inspected
     * Then a timestamped file ending in _InitialCreate.cs exists
     */
    const migrationsDir = path.join(INFRASTRUCTURE_SRC, 'Migrations');

    expect(
      fs.existsSync(migrationsDir),
      `Migrations directory must exist first at ${migrationsDir}`
    ).toBe(true);

    const files = fs.readdirSync(migrationsDir);
    const hasInitialCreate = files.some(
      (f) => f.endsWith('_InitialCreate.cs') && !f.includes('Designer')
    );

    expect(
      hasInitialCreate,
      'A file matching *_InitialCreate.cs must exist in Migrations/ — ' +
        'run dotnet ef migrations add InitialCreate'
    ).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — AppDbContext registered in DI via AddDbContext + UseNpgsql
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — AppDbContext registered in DI with Npgsql', () => {
  test('should register AddDbContext<AppDbContext> in Program.cs', () => {
    /**
     * Given the backend starts with PostgreSQL connection string configured
     * When AppDbContext is resolved from DI
     * Then it is registered via AddDbContext<AppDbContext>
     */
    const programPath = path.join(API_SRC, 'Program.cs');
    expect(fs.existsSync(programPath), `Program.cs not found at ${programPath}`).toBe(true);

    const content = fs.readFileSync(programPath, 'utf-8');

    expect(
      content,
      'Program.cs must contain AddDbContext<AppDbContext>(...)'
    ).toContain('AddDbContext<AppDbContext>');
  });

  test('should configure AppDbContext with UseNpgsql in Program.cs', () => {
    /**
     * Given the AppDbContext registration in Program.cs
     * When AddDbContext is configured
     * Then UseNpgsql is the provider option used
     */
    const programPath = path.join(API_SRC, 'Program.cs');
    const content = fs.readFileSync(programPath, 'utf-8');

    expect(
      content,
      'Program.cs must use UseNpgsql as the EF Core provider'
    ).toContain('UseNpgsql');
  });

  test('should read DefaultConnection from configuration in Program.cs', () => {
    /**
     * Given AddDbContext<AppDbContext> is registered in Program.cs
     * When the connection string is resolved
     * Then it reads from GetConnectionString("DefaultConnection")
     */
    const programPath = path.join(API_SRC, 'Program.cs');
    const content = fs.readFileSync(programPath, 'utf-8');

    expect(
      content,
      'Program.cs must read "DefaultConnection" via GetConnectionString'
    ).toContain('GetConnectionString');

    expect(
      content,
      'Connection string key must be "DefaultConnection"'
    ).toContain('DefaultConnection');
  });

  test('should have DefaultConnection in appsettings.Development.json pointing to siesa_agents_db', () => {
    /**
     * Given the backend starts with connection string configured
     * When appsettings.Development.json is read
     * Then DefaultConnection references siesa_agents_db on localhost
     */
    const settingsPath = path.join(API_SRC, 'appsettings.Development.json');
    expect(
      fs.existsSync(settingsPath),
      `appsettings.Development.json not found at ${settingsPath}`
    ).toBe(true);

    const raw = fs.readFileSync(settingsPath, 'utf-8');
    const settings = JSON.parse(raw);

    expect(
      settings,
      'appsettings.Development.json must have ConnectionStrings section'
    ).toHaveProperty('ConnectionStrings');

    expect(
      settings.ConnectionStrings,
      'ConnectionStrings must have DefaultConnection key'
    ).toHaveProperty('DefaultConnection');

    const connStr: string = settings.ConnectionStrings.DefaultConnection;
    expect(
      connStr,
      'DefaultConnection must reference the siesa_agents_db database'
    ).toContain('siesa_agents_db');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — ExceptionHandlingMiddleware returns RFC 7807 Problem Details
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — ExceptionHandlingMiddleware is RFC 7807 compliant', () => {
  test('should set Content-Type to application/problem+json in ExceptionHandlingMiddleware', () => {
    /**
     * Given an unhandled exception occurs anywhere in the backend pipeline
     * When the error reaches ExceptionHandlingMiddleware
     * Then the response Content-Type is application/problem+json (RFC 7807)
     */
    const middlewarePath = path.join(
      API_SRC,
      'Middleware/ExceptionHandlingMiddleware.cs'
    );
    expect(
      fs.existsSync(middlewarePath),
      `ExceptionHandlingMiddleware.cs not found at ${middlewarePath}`
    ).toBe(true);

    const content = fs.readFileSync(middlewarePath, 'utf-8');

    expect(
      content,
      'Middleware must set Content-Type to application/problem+json'
    ).toContain('application/problem+json');
  });

  test('should return HTTP 500 status code in ExceptionHandlingMiddleware', () => {
    /**
     * Given an unhandled exception occurs
     * When ExceptionHandlingMiddleware catches it
     * Then StatusCode is set to 500
     */
    const middlewarePath = path.join(
      API_SRC,
      'Middleware/ExceptionHandlingMiddleware.cs'
    );
    const content = fs.readFileSync(middlewarePath, 'utf-8');

    expect(
      content,
      'Middleware must set StatusCode = 500'
    ).toContain('500');
  });

  test('should return ProblemDetails object with required RFC 7807 fields', () => {
    /**
     * Given an unhandled exception occurs
     * When ExceptionHandlingMiddleware catches it
     * Then the response body is a ProblemDetails object with status, title, and detail fields
     */
    const middlewarePath = path.join(
      API_SRC,
      'Middleware/ExceptionHandlingMiddleware.cs'
    );
    const content = fs.readFileSync(middlewarePath, 'utf-8');

    expect(
      content,
      'Middleware must use ProblemDetails for RFC 7807 compliance'
    ).toContain('ProblemDetails');

    expect(
      content,
      'Middleware must set Title field on ProblemDetails'
    ).toContain('Title');
  });

  test('should NOT expose ex.Message or stack traces in ExceptionHandlingMiddleware', () => {
    /**
     * Given an unhandled exception occurs (NFR6)
     * When ExceptionHandlingMiddleware catches it
     * Then ex.Message is NOT written to the response (no stack traces exposed)
     */
    const middlewarePath = path.join(
      API_SRC,
      'Middleware/ExceptionHandlingMiddleware.cs'
    );
    const content = fs.readFileSync(middlewarePath, 'utf-8');

    // Must NOT expose ex.Message
    expect(
      content,
      'Middleware must NOT expose ex.Message in the response (NFR6 — no stack traces)'
    ).not.toContain('ex.Message');

    // Must NOT write StackTrace
    expect(
      content,
      'Middleware must NOT expose StackTrace in the response (NFR6)'
    ).not.toContain('StackTrace');
  });

  test('should register ExceptionHandlingMiddleware before other middleware in Program.cs', () => {
    /**
     * Given the backend pipeline is configured
     * When Program.cs is read
     * Then app.UseMiddleware<ExceptionHandlingMiddleware>() appears before UseCors and other middleware
     */
    const programPath = path.join(API_SRC, 'Program.cs');
    const content = fs.readFileSync(programPath, 'utf-8');

    expect(
      content,
      'Program.cs must register ExceptionHandlingMiddleware via UseMiddleware<ExceptionHandlingMiddleware>()'
    ).toContain('UseMiddleware<ExceptionHandlingMiddleware>');

    // Verify ordering: ExceptionHandlingMiddleware must appear before UseCors
    const exceptionMiddlewareIndex = content.indexOf('UseMiddleware<ExceptionHandlingMiddleware>');
    const corsIndex = content.indexOf('UseCors');

    expect(
      exceptionMiddlewareIndex,
      'ExceptionHandlingMiddleware must be registered in Program.cs'
    ).toBeGreaterThan(-1);

    expect(
      exceptionMiddlewareIndex,
      'ExceptionHandlingMiddleware must be registered BEFORE UseCors in Program.cs'
    ).toBeLessThan(corsIndex);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — OnModelCreating applies UseSnakeCaseNamingConvention as last call
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — AppDbContext.OnModelCreating uses snake_case naming convention', () => {
  test('should have OnModelCreating override in AppDbContext.cs', () => {
    /**
     * Given the backend solution is built
     * When OnModelCreating runs in AppDbContext
     * Then modelBuilder.UseSnakeCaseNamingConvention() is applied
     */
    const dbContextPath = path.join(INFRASTRUCTURE_SRC, 'Data/AppDbContext.cs');
    expect(
      fs.existsSync(dbContextPath),
      `AppDbContext.cs not found at ${dbContextPath}`
    ).toBe(true);

    const content = fs.readFileSync(dbContextPath, 'utf-8');

    expect(
      content,
      'AppDbContext must override OnModelCreating'
    ).toContain('OnModelCreating');
  });

  test('should call UseSnakeCaseNamingConvention() in OnModelCreating', () => {
    /**
     * Given OnModelCreating is overridden in AppDbContext
     * When the method body is inspected
     * Then UseSnakeCaseNamingConvention() is called on modelBuilder
     */
    const dbContextPath = path.join(INFRASTRUCTURE_SRC, 'Data/AppDbContext.cs');
    const content = fs.readFileSync(dbContextPath, 'utf-8');

    expect(
      content,
      'AppDbContext.OnModelCreating must call modelBuilder.UseSnakeCaseNamingConvention() ' +
        'to ensure all column/table names follow snake_case convention'
    ).toContain('UseSnakeCaseNamingConvention');
  });

  test('should call UseSnakeCaseNamingConvention() AFTER ApplyConfigurationsFromAssembly', () => {
    /**
     * Given OnModelCreating is configured
     * When the ordering of calls is inspected
     * Then UseSnakeCaseNamingConvention is the LAST call (after ApplyConfigurationsFromAssembly)
     * so it overrides any naming set by entity configurations
     */
    const dbContextPath = path.join(INFRASTRUCTURE_SRC, 'Data/AppDbContext.cs');
    const content = fs.readFileSync(dbContextPath, 'utf-8');

    const snakeCaseIndex = content.indexOf('UseSnakeCaseNamingConvention');
    const applyConfigsIndex = content.indexOf('ApplyConfigurationsFromAssembly');

    if (applyConfigsIndex > -1) {
      // If ApplyConfigurationsFromAssembly is present, snake_case must come AFTER it
      expect(
        snakeCaseIndex,
        'UseSnakeCaseNamingConvention() must be called AFTER ApplyConfigurationsFromAssembly() ' +
          'to ensure snake_case is the last naming convention applied'
      ).toBeGreaterThan(applyConfigsIndex);
    } else {
      // If no ApplyConfigurationsFromAssembly, snake_case must still be present
      expect(
        snakeCaseIndex,
        'UseSnakeCaseNamingConvention() must be present in OnModelCreating'
      ).toBeGreaterThan(-1);
    }
  });

  test('should NOT use manual [Column] or [Table] attributes in AppDbContext.cs', () => {
    /**
     * Given snake_case naming is enforced via EFCore.NamingConventions
     * When AppDbContext.cs is inspected
     * Then no manual [Column] or [Table] attributes are used (convention handles naming)
     */
    const dbContextPath = path.join(INFRASTRUCTURE_SRC, 'Data/AppDbContext.cs');
    const content = fs.readFileSync(dbContextPath, 'utf-8');

    expect(
      content,
      'AppDbContext must NOT use manual [Column] attributes — UseSnakeCaseNamingConvention handles all naming'
    ).not.toContain('[Column(');

    expect(
      content,
      'AppDbContext must NOT use manual [Table] attributes — UseSnakeCaseNamingConvention handles all naming'
    ).not.toContain('[Table(');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Solution builds: required NuGet packages present in .csproj files
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Required EF Core NuGet packages present in project files', () => {
  test('should have Npgsql.EntityFrameworkCore.PostgreSQL in Infrastructure.csproj', () => {
    /**
     * Given the backend solution is built
     * When SiesaAgents.Infrastructure.csproj is inspected
     * Then Npgsql.EntityFrameworkCore.PostgreSQL package is referenced
     */
    const csprojPath = path.join(
      INFRASTRUCTURE_SRC,
      'SiesaAgents.Infrastructure.csproj'
    );
    expect(
      fs.existsSync(csprojPath),
      `SiesaAgents.Infrastructure.csproj not found at ${csprojPath}`
    ).toBe(true);

    const content = fs.readFileSync(csprojPath, 'utf-8');

    expect(
      content,
      'Infrastructure.csproj must reference Npgsql.EntityFrameworkCore.PostgreSQL'
    ).toContain('Npgsql.EntityFrameworkCore.PostgreSQL');
  });

  test('should have EFCore.NamingConventions in Infrastructure.csproj', () => {
    /**
     * Given the backend solution is built
     * When SiesaAgents.Infrastructure.csproj is inspected
     * Then EFCore.NamingConventions package is referenced (required for UseSnakeCaseNamingConvention)
     */
    const csprojPath = path.join(
      INFRASTRUCTURE_SRC,
      'SiesaAgents.Infrastructure.csproj'
    );
    const content = fs.readFileSync(csprojPath, 'utf-8');

    expect(
      content,
      'Infrastructure.csproj must reference EFCore.NamingConventions ' +
        'for modelBuilder.UseSnakeCaseNamingConvention() to work'
    ).toContain('EFCore.NamingConventions');
  });

  test('should have Microsoft.EntityFrameworkCore.Design in API.csproj with PrivateAssets=all', () => {
    /**
     * Given dotnet ef CLI tools are required for migrations
     * When SiesaAgents.API.csproj is inspected
     * Then Microsoft.EntityFrameworkCore.Design is referenced with PrivateAssets="all"
     */
    const csprojPath = path.join(API_SRC, 'SiesaAgents.API.csproj');
    expect(
      fs.existsSync(csprojPath),
      `SiesaAgents.API.csproj not found at ${csprojPath}`
    ).toBe(true);

    const content = fs.readFileSync(csprojPath, 'utf-8');

    expect(
      content,
      'API.csproj must include Microsoft.EntityFrameworkCore.Design for dotnet ef CLI tooling'
    ).toContain('Microsoft.EntityFrameworkCore.Design');

    expect(
      content,
      'Microsoft.EntityFrameworkCore.Design must have PrivateAssets="all" to avoid runtime dependency'
    ).toContain('PrivateAssets');
  });

  test('should have AppDbContext.cs extending DbContext in Infrastructure/Data', () => {
    /**
     * Given the EF Core infrastructure is configured
     * When AppDbContext.cs is inspected
     * Then it extends DbContext (not IdentityDbContext or other base)
     */
    const dbContextPath = path.join(INFRASTRUCTURE_SRC, 'Data/AppDbContext.cs');
    expect(
      fs.existsSync(dbContextPath),
      `AppDbContext.cs not found at ${dbContextPath}`
    ).toBe(true);

    const content = fs.readFileSync(dbContextPath, 'utf-8');

    expect(
      content,
      'AppDbContext must extend DbContext'
    ).toContain('DbContext');

    // Verify using Microsoft.EntityFrameworkCore namespace
    expect(
      content,
      'AppDbContext.cs must import Microsoft.EntityFrameworkCore'
    ).toContain('Microsoft.EntityFrameworkCore');
  });

  test('should NOT define ClienteEntity or ContactoEntity in AppDbContext (scope boundary)', () => {
    /**
     * Given this story creates an empty initial migration (scope boundary)
     * When AppDbContext.cs is inspected
     * Then NO DbSet<ClienteEntity> or DbSet<ContactoEntity> properties are defined
     * (clientes table: Epic 2 Story 2.1; contactos table: Epic 3 Story 3.1)
     */
    const dbContextPath = path.join(INFRASTRUCTURE_SRC, 'Data/AppDbContext.cs');
    const content = fs.readFileSync(dbContextPath, 'utf-8');

    expect(
      content,
      'AppDbContext must NOT define DbSet<ClienteEntity> in Story 1.3 — added in Epic 2 Story 2.1'
    ).not.toContain('ClienteEntity');

    expect(
      content,
      'AppDbContext must NOT define DbSet<ContactoEntity> in Story 1.3 — added in Epic 3 Story 3.1'
    ).not.toContain('ContactoEntity');
  });
});

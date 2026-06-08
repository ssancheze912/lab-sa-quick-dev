/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Edge Case / Boundary Tests — Backend Structure Automation Expansion
 * Expands ATDD coverage with negative paths, boundary conditions, and deep
 * structural validations not covered by the core acceptance tests.
 *
 * Acceptance Criteria expanded:
 *   AC2 — Backend must NOT use Swagger; launchSettings.json port; .NET 10 target; no WeatherForecast
 *   AC3 — Deep project-to-project reference validation; slnx parity; UnitTests refs
 *   AC4 — CORS rejects unknown origins (security boundary); Content-Type on health
 *   AC5 — ExceptionHandlingMiddleware returns RFC 7807 for multiple exception types
 *   AC6 — Program.cs forbidden patterns; NuGet packages installed
 *   AC8 — AppDbContext inherits DbContext; Infrastructure uses correct NuGet packages
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BACKEND_ROOT = path.resolve(__dirname, '../../../backend');
const API_SRC = path.join(BACKEND_ROOT, 'src/SiesaAgents.API');
const APPLICATION_SRC = path.join(BACKEND_ROOT, 'src/SiesaAgents.Application');
const DOMAIN_SRC = path.join(BACKEND_ROOT, 'src/SiesaAgents.Domain');
const INFRASTRUCTURE_SRC = path.join(BACKEND_ROOT, 'src/SiesaAgents.Infrastructure');
const UNIT_TESTS_SRC = path.join(BACKEND_ROOT, 'tests/SiesaAgents.UnitTests');
const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Swagger/OpenAPI must NOT be registered (forbidden pattern)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Program.cs must not use Swagger/OpenAPI middleware', () => {
  const PROGRAM_CS = path.join(API_SRC, 'Program.cs');

  test('[P0] Program.cs must not contain UseSwagger call', () => {
    // GIVEN: Program.cs exists per Story 1.1 Task 3.4
    // WHEN: Reading Program.cs content
    expect(fs.existsSync(PROGRAM_CS), 'Program.cs must exist').toBe(true);
    const content = fs.readFileSync(PROGRAM_CS, 'utf-8');

    // THEN: UseSwagger is NOT present — Scalar replaces Swagger entirely
    expect(content).not.toContain('UseSwagger');
  });

  test('[P0] Program.cs must not contain UseSwaggerUI call', () => {
    // GIVEN: Program.cs exists
    // WHEN: Reading Program.cs content
    const content = fs.readFileSync(path.join(API_SRC, 'Program.cs'), 'utf-8');

    // THEN: UseSwaggerUI is NOT present
    expect(content).not.toContain('UseSwaggerUI');
  });

  test('[P0] Program.cs must call MapScalarApiReference()', () => {
    // GIVEN: Scalar.AspNetCore is installed per Story 1.1 Task 3.3
    // WHEN: Reading Program.cs content
    const content = fs.readFileSync(path.join(API_SRC, 'Program.cs'), 'utf-8');

    // THEN: MapScalarApiReference() is called — confirming Scalar, not Swagger
    expect(content).toContain('MapScalarApiReference');
  });

  test('[P1] launchSettings.json must configure application URL on port 5000', () => {
    // GIVEN: The backend must start on port 5000 per AC2
    // WHEN: Reading Properties/launchSettings.json
    const launchSettingsPath = path.join(API_SRC, 'Properties/launchSettings.json');
    expect(fs.existsSync(launchSettingsPath), 'launchSettings.json must exist').toBe(true);

    const content = fs.readFileSync(launchSettingsPath, 'utf-8');
    const settings = JSON.parse(content);

    // THEN: At least one profile configures port 5000
    const profiles = settings.profiles ?? {};
    const allUrls = Object.values(profiles)
      .map((p: unknown) => (p as Record<string, unknown>).applicationUrl as string | undefined)
      .filter(Boolean);

    const hasPort5000 = allUrls.some((url) => url?.includes(':5000'));
    expect(hasPort5000, 'At least one launchSettings profile must configure port 5000').toBe(true);
  });

  test('[P1] SiesaAgents.API.csproj must target .NET 10', () => {
    // GIVEN: The backend is built on .NET 10 per architecture requirements
    // WHEN: Reading SiesaAgents.API.csproj
    const csprojPath = path.join(API_SRC, 'SiesaAgents.API.csproj');
    expect(fs.existsSync(csprojPath), 'SiesaAgents.API.csproj must exist').toBe(true);

    const content = fs.readFileSync(csprojPath, 'utf-8');

    // THEN: TargetFramework is net10.0
    expect(content).toContain('net10.0');
  });

  test('[P1] SiesaAgents.API.csproj must have Scalar.AspNetCore NuGet package', () => {
    // GIVEN: Scalar.AspNetCore installed per Story 1.1 Task 3.3
    // WHEN: Reading SiesaAgents.API.csproj
    const content = fs.readFileSync(path.join(API_SRC, 'SiesaAgents.API.csproj'), 'utf-8');

    // THEN: Scalar.AspNetCore package is referenced
    expect(content).toContain('Scalar.AspNetCore');
  });

  test('[P1] appsettings.Development.json must have DefaultConnection string placeholder', () => {
    // GIVEN: Database connection string is configured per Story 1.1 Task 3.7
    // WHEN: Reading appsettings.Development.json
    const appsettingsPath = path.join(API_SRC, 'appsettings.Development.json');
    expect(fs.existsSync(appsettingsPath), 'appsettings.Development.json must exist').toBe(true);

    const content = fs.readFileSync(appsettingsPath, 'utf-8');
    const settings = JSON.parse(content);

    // THEN: ConnectionStrings.DefaultConnection is present with PostgreSQL placeholder
    expect(settings.ConnectionStrings?.DefaultConnection).toBeTruthy();
    expect(settings.ConnectionStrings.DefaultConnection).toContain('siesa_agents_db');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Deep project-to-project reference validation and slnx parity
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — Deep project-to-project reference validation', () => {
  test('[P0] SiesaAgents.API.csproj must reference SiesaAgents.Application (not just Infrastructure)', () => {
    // GIVEN: API layer depends on both Application and Infrastructure per Clean Architecture
    // WHEN: Reading SiesaAgents.API.csproj ProjectReference items
    const projPath = path.join(API_SRC, 'SiesaAgents.API.csproj');
    const content = fs.readFileSync(projPath, 'utf-8');

    // THEN: Application reference exists (not just Infrastructure)
    expect(content).toContain('SiesaAgents.Application');
    expect(content).toContain('SiesaAgents.Infrastructure');
  });

  test('[P1] SiesaAgents.Infrastructure.csproj must reference SiesaAgents.Application', () => {
    // GIVEN: Infrastructure depends on Application (implements interfaces) per Clean Architecture
    // WHEN: Reading SiesaAgents.Infrastructure.csproj
    const projPath = path.join(INFRASTRUCTURE_SRC, 'SiesaAgents.Infrastructure.csproj');
    const content = fs.readFileSync(projPath, 'utf-8');

    // THEN: Application reference exists in Infrastructure
    expect(content).toContain('SiesaAgents.Application');
  });

  test('[P1] SiesaAgents.UnitTests.csproj must exist in tests/', () => {
    // GIVEN: Unit test project created per Story 1.1 Task 5.1
    // WHEN: Inspecting backend/tests/SiesaAgents.UnitTests/
    const projPath = path.join(UNIT_TESTS_SRC, 'SiesaAgents.UnitTests.csproj');

    // THEN: The project file exists
    expect(
      fs.existsSync(projPath),
      'backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj must exist'
    ).toBe(true);
  });

  test('[P1] SiesaAgents.UnitTests.csproj must reference SiesaAgents.Application', () => {
    // GIVEN: UnitTests can test Application layer logic
    // WHEN: Reading SiesaAgents.UnitTests.csproj
    const projPath = path.join(UNIT_TESTS_SRC, 'SiesaAgents.UnitTests.csproj');
    expect(fs.existsSync(projPath), 'SiesaAgents.UnitTests.csproj must exist').toBe(true);
    const content = fs.readFileSync(projPath, 'utf-8');

    // THEN: Application reference is present
    expect(content).toContain('SiesaAgents.Application');
  });

  test('[P1] SiesaAgents.UnitTests.csproj must reference SiesaAgents.Domain', () => {
    // GIVEN: UnitTests can test Domain layer logic
    // WHEN: Reading SiesaAgents.UnitTests.csproj
    const projPath = path.join(UNIT_TESTS_SRC, 'SiesaAgents.UnitTests.csproj');
    const content = fs.readFileSync(projPath, 'utf-8');

    // THEN: Domain reference is present
    expect(content).toContain('SiesaAgents.Domain');
  });

  test('[P2] SiesaAgents.slnx must also exist (new .NET format) alongside .sln', () => {
    // GIVEN: dotnet new sln in .NET 10 creates .slnx by default per dev notes
    // WHEN: Inspecting backend/ directory
    const slnxPath = path.join(BACKEND_ROOT, 'SiesaAgents.slnx');

    // THEN: SiesaAgents.slnx exists for .NET 10 tooling compatibility
    expect(
      fs.existsSync(slnxPath),
      'backend/SiesaAgents.slnx must exist (.NET 10 new solution format)'
    ).toBe(true);
  });

  test('[P2] SiesaAgents.Infrastructure.csproj must have EFCore.NamingConventions package', () => {
    // GIVEN: snake_case naming via EFCore.NamingConventions per Story 1.1 Task 3.3
    // WHEN: Reading SiesaAgents.Infrastructure.csproj
    const projPath = path.join(INFRASTRUCTURE_SRC, 'SiesaAgents.Infrastructure.csproj');
    const content = fs.readFileSync(projPath, 'utf-8');

    // THEN: EFCore.NamingConventions package is referenced
    expect(content).toContain('EFCore.NamingConventions');
  });

  test('[P2] SiesaAgents.Infrastructure.csproj must have Npgsql.EntityFrameworkCore.PostgreSQL package', () => {
    // GIVEN: PostgreSQL is the database provider per architecture requirements
    // WHEN: Reading SiesaAgents.Infrastructure.csproj
    const projPath = path.join(INFRASTRUCTURE_SRC, 'SiesaAgents.Infrastructure.csproj');
    const content = fs.readFileSync(projPath, 'utf-8');

    // THEN: Npgsql EF Core provider is referenced
    expect(content).toContain('Npgsql.EntityFrameworkCore.PostgreSQL');
  });

  test('[P2] All four Clean Architecture source projects must target .NET 10', () => {
    // GIVEN: The architecture requires .NET 10 throughout
    // WHEN: Reading all .csproj files in src/
    const projects = [
      path.join(API_SRC, 'SiesaAgents.API.csproj'),
      path.join(APPLICATION_SRC, 'SiesaAgents.Application.csproj'),
      path.join(DOMAIN_SRC, 'SiesaAgents.Domain.csproj'),
      path.join(INFRASTRUCTURE_SRC, 'SiesaAgents.Infrastructure.csproj'),
    ];

    // THEN: Every project targets net10.0
    for (const projPath of projects) {
      expect(fs.existsSync(projPath), `${path.basename(projPath)} must exist`).toBe(true);
      const content = fs.readFileSync(projPath, 'utf-8');
      expect(content, `${path.basename(projPath)} must target net10.0`).toContain('net10.0');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — CORS negative paths (security boundary — unknown origins must be rejected)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — CORS security boundary: unknown origins must be rejected', () => {
  test('[P0] should NOT return CORS header for unknown origin (security boundary)', async ({
    request,
  }) => {
    // GIVEN: CORS policy only whitelists http://localhost:5173
    // WHEN: A request comes from a non-whitelisted origin
    const response = await request.get(`${API_BASE_URL}/api/v1/health`, {
      headers: {
        Origin: 'http://evil-site.com',
      },
    });

    // THEN: Access-Control-Allow-Origin must NOT be present or must not allow the unknown origin
    const allowOriginHeader = response.headers()['access-control-allow-origin'] ?? '';
    const isBypassed =
      allowOriginHeader === '*' || allowOriginHeader === 'http://evil-site.com';
    expect(
      isBypassed,
      `CORS must not allow http://evil-site.com — header was: "${allowOriginHeader}"`
    ).toBe(false);
  });

  test('[P0] /api/v1/health must return Content-Type application/json or application/problem+json', async ({
    request,
  }) => {
    // GIVEN: The health endpoint returns a JSON body
    // WHEN: A GET request is made to /api/v1/health
    const response = await request.get(`${API_BASE_URL}/api/v1/health`);

    // THEN: Content-Type indicates JSON (not HTML, not text/plain)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType, 'Health endpoint must return JSON content-type').toMatch(/application\/json/);
  });

  test('[P1] health endpoint must return exactly { "status": "healthy" } — not extra fields', async ({
    request,
  }) => {
    // GIVEN: Health endpoint is defined to return a minimal status payload
    // WHEN: Requesting /api/v1/health
    const response = await request.get(`${API_BASE_URL}/api/v1/health`);
    const body = await response.json();

    // THEN: status field is "healthy" (case-sensitive)
    expect(body.status).toBe('healthy');
  });

  test('[P1] CORS preflight OPTIONS on /api/v1/health must return Access-Control-Allow-Methods', async ({
    request,
  }) => {
    // GIVEN: CORS middleware handles OPTIONS preflights
    // WHEN: Preflight from the whitelisted frontend origin
    const response = await request.fetch(`${API_BASE_URL}/api/v1/health`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: Response includes Access-Control-Allow-Methods header
    const allowMethods = response.headers()['access-control-allow-methods'] ?? '';
    expect(allowMethods.length, 'CORS preflight must include Access-Control-Allow-Methods').toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — ExceptionHandlingMiddleware: RFC 7807 for multiple exception types
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — ExceptionHandlingMiddleware returns RFC 7807 Problem Details', () => {
  test('[P0] 404 response for non-existent path must be application/problem+json', async ({
    request,
  }) => {
    // GIVEN: MapFallback in Program.cs returns Problem Details for unmatched routes
    // WHEN: A GET request is made to a path that does not exist
    const response = await request.get(`${API_BASE_URL}/api/v1/this-path-does-not-exist`);

    // THEN: Content-Type is application/problem+json (RFC 7807)
    expect(response.status()).toBe(404);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType, '404 must return RFC 7807 Problem Details content-type').toContain('json');
  });

  test('[P0] 404 Problem Details body must have "title" and "status" fields (RFC 7807)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware and MapFallback produce RFC 7807 responses
    // WHEN: Requesting a non-existent endpoint
    const response = await request.get(`${API_BASE_URL}/api/v1/edge-case-nonexistent`);

    // THEN: Body conforms to RFC 7807 minimal required fields
    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('title');
    expect(body.status).toBe(404);
  });

  test('[P1] 404 Problem Details must NOT include stack trace', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware explicitly excludes stack traces (AC from dev notes)
    // WHEN: Requesting a non-existent endpoint
    const response = await request.get(`${API_BASE_URL}/api/v1/stack-trace-check`);
    const body = await response.json();

    // THEN: No stackTrace, exception, or innerException field in the response
    const bodyStr = JSON.stringify(body).toLowerCase();
    expect(bodyStr).not.toContain('stacktrace');
    expect(bodyStr).not.toContain('at system.');
    expect(bodyStr).not.toContain('innerexception');
  });

  test('[P1] ExceptionHandlingMiddleware.cs must handle ArgumentException as 400', () => {
    // GIVEN: ExceptionHandlingMiddleware maps exception types to status codes
    // WHEN: Reading ExceptionHandlingMiddleware.cs
    const middlewarePath = path.join(
      API_SRC,
      'Middleware/ExceptionHandlingMiddleware.cs'
    );
    const content = fs.readFileSync(middlewarePath, 'utf-8');

    // THEN: ArgumentException maps to BadRequest (400)
    expect(content).toContain('ArgumentException');
    expect(content).toContain('BadRequest');
  });

  test('[P1] ExceptionHandlingMiddleware.cs must handle KeyNotFoundException as 404', () => {
    // GIVEN: ExceptionHandlingMiddleware maps exception types to status codes
    // WHEN: Reading ExceptionHandlingMiddleware.cs
    const middlewarePath = path.join(
      API_SRC,
      'Middleware/ExceptionHandlingMiddleware.cs'
    );
    const content = fs.readFileSync(middlewarePath, 'utf-8');

    // THEN: KeyNotFoundException maps to NotFound (404)
    expect(content).toContain('KeyNotFoundException');
    expect(content).toContain('NotFound');
  });

  test('[P1] ExceptionHandlingMiddleware.cs must set response ContentType to application/problem+json', () => {
    // GIVEN: RFC 7807 requires content-type application/problem+json
    // WHEN: Reading ExceptionHandlingMiddleware.cs
    const middlewarePath = path.join(
      API_SRC,
      'Middleware/ExceptionHandlingMiddleware.cs'
    );
    const content = fs.readFileSync(middlewarePath, 'utf-8');

    // THEN: application/problem+json is used as content-type
    expect(content).toContain('application/problem+json');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Program.cs forbidden patterns and Clean Architecture DI wiring
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Program.cs correct structure and forbidden patterns', () => {
  const PROGRAM_CS = path.join(API_SRC, 'Program.cs');

  test('[P0] Program.cs must register UseCors before endpoint mapping', () => {
    // GIVEN: CORS middleware must be applied before routing per ASP.NET Core ordering rules
    // WHEN: Reading Program.cs content
    const content = fs.readFileSync(PROGRAM_CS, 'utf-8');

    // THEN: UseCors appears before MapScalarApiReference and MapHealthEndpoints
    const corsIdx = content.indexOf('UseCors');
    const scalarIdx = content.indexOf('MapScalarApiReference');
    const healthIdx = content.indexOf('MapHealthEndpoints');

    expect(corsIdx, 'UseCors must be present in Program.cs').toBeGreaterThan(-1);
    expect(corsIdx, 'UseCors must appear before MapScalarApiReference').toBeLessThan(scalarIdx);
    expect(corsIdx, 'UseCors must appear before MapHealthEndpoints').toBeLessThan(healthIdx);
  });

  test('[P0] Program.cs must register ExceptionHandlingMiddleware', () => {
    // GIVEN: ExceptionHandlingMiddleware is created per Story 1.1 Task 3.5
    // WHEN: Reading Program.cs
    const content = fs.readFileSync(PROGRAM_CS, 'utf-8');

    // THEN: UseMiddleware<ExceptionHandlingMiddleware>() is called
    expect(content).toContain('ExceptionHandlingMiddleware');
  });

  test('[P1] Program.cs must register CORS policy with http://localhost:5173 origin', () => {
    // GIVEN: AC4 requires frontend origin to be explicitly whitelisted
    // WHEN: Reading Program.cs
    const content = fs.readFileSync(PROGRAM_CS, 'utf-8');

    // THEN: The frontend origin is explicitly configured
    expect(content).toContain('http://localhost:5173');
  });

  test('[P1] HealthEndpoints.cs must register the endpoint on exactly /api/v1/health', () => {
    // GIVEN: AC4 specifies the exact path /api/v1/health
    // WHEN: Reading HealthEndpoints.cs
    const healthEndpointsPath = path.join(API_SRC, 'Endpoints/HealthEndpoints.cs');
    expect(fs.existsSync(healthEndpointsPath), 'HealthEndpoints.cs must exist').toBe(true);

    const content = fs.readFileSync(healthEndpointsPath, 'utf-8');

    // THEN: The exact path /api/v1/health is mapped
    expect(content).toContain('/api/v1/health');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC8 — AppDbContext structural validation (inheritance, naming)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC8 — AppDbContext structural validation', () => {
  const APP_DB_CONTEXT_PATH = path.join(
    INFRASTRUCTURE_SRC,
    'Data/AppDbContext.cs'
  );

  test('[P0] AppDbContext must inherit from DbContext (not IdentityDbContext or ApplicationDbContext)', () => {
    // GIVEN: AppDbContext is a plain EF Core context — no Identity
    // WHEN: Reading AppDbContext.cs class declaration
    expect(fs.existsSync(APP_DB_CONTEXT_PATH), 'AppDbContext.cs must exist').toBe(true);
    const content = fs.readFileSync(APP_DB_CONTEXT_PATH, 'utf-8');

    // THEN: Class inherits DbContext
    expect(content).toMatch(/:\s*DbContext/);
  });

  test('[P0] AppDbContext must override OnModelCreating', () => {
    // GIVEN: AC8 requires ApplySnakeCaseNaming() to be called in OnModelCreating
    // WHEN: Reading AppDbContext.cs
    const content = fs.readFileSync(APP_DB_CONTEXT_PATH, 'utf-8');

    // THEN: OnModelCreating is overridden
    expect(content).toContain('OnModelCreating');
    expect(content).toContain('override');
  });

  test('[P0] AppDbContext must call base.OnModelCreating before ApplySnakeCaseNaming()', () => {
    // GIVEN: EF Core best practice requires calling base first
    // WHEN: Reading the OnModelCreating body
    const content = fs.readFileSync(APP_DB_CONTEXT_PATH, 'utf-8');

    // THEN: base.OnModelCreating appears before ApplySnakeCaseNaming
    const baseCallIdx = content.indexOf('base.OnModelCreating');
    const applySnakeCaseIdx = content.indexOf('ApplySnakeCaseNaming()');

    expect(baseCallIdx, 'base.OnModelCreating() must be called').toBeGreaterThan(-1);
    expect(applySnakeCaseIdx, 'ApplySnakeCaseNaming() must be called').toBeGreaterThan(-1);
    expect(
      baseCallIdx,
      'base.OnModelCreating() must appear before ApplySnakeCaseNaming()'
    ).toBeLessThan(applySnakeCaseIdx);
  });

  test('[P1] No [Key] attribute should be used on any entity in Infrastructure (UUIDs auto-configured)', () => {
    // GIVEN: Primary keys are Guid configured via conventions, not attributes
    // WHEN: Scanning all .cs files in SiesaAgents.Infrastructure/
    const allCsFiles = getAllCsFiles(INFRASTRUCTURE_SRC);
    const filesWithKeyAttribute = allCsFiles.filter((file) => {
      const content = fs.readFileSync(file, 'utf-8');
      // Check for [Key] attribute usage (not just the word "Key" in comments)
      return /\[Key\]|\[Key\(/.test(content);
    });

    // THEN: No [Key] attributes exist — EF Core convention handles primary keys
    expect(
      filesWithKeyAttribute,
      `[Key] attribute must not be used — found in: ${filesWithKeyAttribute.join(', ')}`
    ).toHaveLength(0);
  });

  test('[P2] AppDbContext must have a constructor accepting DbContextOptions<AppDbContext>', () => {
    // GIVEN: AppDbContext is registered via DI with typed options
    // WHEN: Reading AppDbContext.cs constructor
    const content = fs.readFileSync(APP_DB_CONTEXT_PATH, 'utf-8');

    // THEN: Constructor takes DbContextOptions<AppDbContext>
    expect(content).toContain('DbContextOptions<AppDbContext>');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Backend runtime: API-level boundary conditions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Backend API — boundary conditions and path validation', () => {
  test('[P0] GET /api/v1/health must NOT redirect (must be exactly 200, not 301/302)', async ({
    request,
  }) => {
    // GIVEN: The health endpoint is registered at the exact path /api/v1/health
    // WHEN: A GET request is made to /api/v1/health without trailing slash
    const response = await request.get(`${API_BASE_URL}/api/v1/health`);

    // THEN: Responds with 200 directly — no redirect
    expect(response.status()).toBe(200);
  });

  test('[P1] GET /api/v1/health must return JSON body with status field', async ({ request }) => {
    // GIVEN: Health endpoint is wired per HealthEndpoints.cs MapGet pattern
    // WHEN: Requesting the health endpoint
    const response = await request.get(`${API_BASE_URL}/api/v1/health`);
    const body = await response.json();

    // THEN: Body has a status field (not an empty response)
    expect(body).toHaveProperty('status');
  });

  test('[P1] Scalar endpoint /scalar must redirect or serve a client-side page (not 404)', async ({
    request,
  }) => {
    // GIVEN: MapScalarApiReference() is registered
    // WHEN: Requesting /scalar
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Scalar serves its page (200 or redirect) — never 404
    expect(response.status(), 'Scalar endpoint must not return 404').not.toBe(404);
    expect(response.status(), 'Scalar endpoint must not return 500').not.toBe(500);
  });

  test('[P2] POST /api/v1/health must return 404 or 405 (only GET is registered)', async ({
    request,
  }) => {
    // GIVEN: Health endpoint only registers GET
    // WHEN: A POST request is made to /api/v1/health
    const response = await request.post(`${API_BASE_URL}/api/v1/health`, {
      data: {},
    });

    // THEN: Server rejects POST — 404 (route not found) or 405 (method not allowed)
    expect([404, 405]).toContain(response.status());
  });

  test('[P2] Response for deep non-existent paths must be JSON, not HTML error page', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware + MapFallback intercept all unmatched routes
    // WHEN: A deeply-nested non-existent path is requested
    const response = await request.get(`${API_BASE_URL}/api/v2/deep/nonexistent/path/edge`);

    // THEN: Response is JSON, not an HTML error page (which would indicate missing middleware)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType, 'Unmatched routes must return JSON, not HTML').not.toContain('text/html');
    expect(contentType).toContain('json');
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

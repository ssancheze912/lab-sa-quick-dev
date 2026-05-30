/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * EDGE CASE & BOUNDARY TESTS — Automation Expansion Layer
 * Complements the ATDD acceptance tests with edge cases, error paths,
 * and boundary conditions NOT covered by the primary ATDD tests.
 *
 * Environment note: .NET 10 SDK and PostgreSQL are NOT available.
 * All tests in this file are STATIC (file-system / source-code assertions).
 * They require no dotnet runtime, no database, and no running backend.
 *
 * Test categories:
 *   [STATIC-BE]     — Backend source code structural assertions (no .NET runtime)
 *   [STATIC-MIGS]   — Migration file structural assertions
 *   [STATIC-CONFIG] — Configuration file content assertions
 *   [STATIC-SCOPE]  — Scope boundary assertions (no premature entity introduction)
 *   [E2E-API]       — API-level tests (require running backend, marked fixme when unavailable)
 */

import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const PROJECT_ROOT = path.resolve(__dirname, '../../..')
const BACKEND_ROOT = path.join(PROJECT_ROOT, 'backend')
const INFRA_SRC = path.join(BACKEND_ROOT, 'src', 'SiesaAgents.Infrastructure')
const API_SRC = path.join(BACKEND_ROOT, 'src', 'SiesaAgents.API')
const MIDDLEWARE_FILE = path.join(API_SRC, 'Middleware', 'ExceptionHandlingMiddleware.cs')
const PROGRAM_FILE = path.join(API_SRC, 'Program.cs')
const APP_DB_CONTEXT_FILE = path.join(INFRA_SRC, 'Data', 'AppDbContext.cs')
const MIGRATIONS_DIR = path.join(INFRA_SRC, 'Data', 'Migrations')
const APPSETTINGS_DEV = path.join(API_SRC, 'appsettings.Development.json')
const INFRA_CSPROJ = path.join(INFRA_SRC, 'SiesaAgents.Infrastructure.csproj')
const UNIT_TEST_CSPROJ = path.join(
  BACKEND_ROOT,
  'tests',
  'SiesaAgents.UnitTests',
  'SiesaAgents.UnitTests.csproj'
)
const INTEGRATION_TEST_CSPROJ = path.join(
  BACKEND_ROOT,
  'tests',
  'SiesaAgents.IntegrationTests',
  'SiesaAgents.IntegrationTests.csproj'
)
const UNIT_TEST_MIDDLEWARE = path.join(
  BACKEND_ROOT,
  'tests',
  'SiesaAgents.UnitTests',
  'API',
  'Middleware',
  'ExceptionHandlingMiddlewareTests.cs'
)
const INTEGRATION_TEST_CONTEXT = path.join(
  BACKEND_ROOT,
  'tests',
  'SiesaAgents.IntegrationTests',
  'Data',
  'AppDbContextTests.cs'
)

// ─────────────────────────────────────────────────────────────────────────────
// [STATIC-BE] AppDbContext source structure
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[STATIC-BE] AppDbContext structural assertions (AC#2, AC#5)', () => {
  test('should have AppDbContext.cs file at the expected infrastructure path', () => {
    // GIVEN: AC#5 requires AppDbContext registered in DI with Npgsql
    // THEN: The file must physically exist
    expect(fs.existsSync(APP_DB_CONTEXT_FILE)).toBe(true)
  })

  test('should have AppDbContext in namespace SiesaAgents.Infrastructure.Data', () => {
    // GIVEN: CA architecture mandates Infrastructure.Data namespace for data access
    const content = fs.readFileSync(APP_DB_CONTEXT_FILE, 'utf-8')

    // THEN: Namespace declaration is correct
    expect(content).toContain('namespace SiesaAgents.Infrastructure.Data')
  })

  test('should have AppDbContext inheriting from DbContext', () => {
    // GIVEN: AppDbContext must extend DbContext (EF Core base class)
    const content = fs.readFileSync(APP_DB_CONTEXT_FILE, 'utf-8')

    // THEN: Class declaration shows inheritance
    expect(content).toContain('DbContext')
    expect(content).toContain('AppDbContext')
  })

  test('should have AppDbContext constructor accepting DbContextOptions<AppDbContext>', () => {
    // GIVEN: DI requires constructor injection of options (AC#5)
    const content = fs.readFileSync(APP_DB_CONTEXT_FILE, 'utf-8')

    // THEN: Constructor accepts typed options
    expect(content).toContain('DbContextOptions<AppDbContext>')
  })

  test('should have OnModelCreating calling ApplySnakeCaseNaming (AC#2)', () => {
    // GIVEN: AC#2 mandates ApplySnakeCaseNaming() as the LAST statement in OnModelCreating
    const content = fs.readFileSync(APP_DB_CONTEXT_FILE, 'utf-8')

    // THEN: Both OnModelCreating and ApplySnakeCaseNaming are present
    expect(content).toContain('OnModelCreating')
    expect(content).toContain('ApplySnakeCaseNaming')
  })

  test('should have OnModelCreating calling base.OnModelCreating before ApplySnakeCaseNaming', () => {
    // GIVEN: Convention requires base.OnModelCreating(modelBuilder) to be called first
    const content = fs.readFileSync(APP_DB_CONTEXT_FILE, 'utf-8')

    // THEN: base call appears before snake_case call in source order
    const baseCallIdx = content.indexOf('base.OnModelCreating')
    const snakeCaseIdx = content.indexOf('ApplySnakeCaseNaming')
    expect(baseCallIdx).toBeGreaterThanOrEqual(0)
    expect(snakeCaseIdx).toBeGreaterThan(baseCallIdx)
  })

  test('should NOT have any DbSet properties in AppDbContext (scope boundary, AC#5)', () => {
    // GIVEN: Story 1.3 intentionally has NO domain entities — added in Epics 2 and 3
    const content = fs.readFileSync(APP_DB_CONTEXT_FILE, 'utf-8')

    // THEN: No DbSet<> properties exist (ClienteEntity and ContactoEntity are NOT premature)
    expect(content).not.toContain('DbSet<')
    expect(content).not.toContain('ClienteEntity')
    expect(content).not.toContain('ContactoEntity')
  })

  test('should NOT have [Column] or [Table] attributes on any entity (snake_case is automatic)', () => {
    // GIVEN: AC#2 spec — ApplySnakeCaseNaming() handles naming; manual attributes are forbidden
    const content = fs.readFileSync(APP_DB_CONTEXT_FILE, 'utf-8')

    // THEN: No manual column or table attribute annotations are present
    expect(content).not.toContain('[Column(')
    expect(content).not.toContain('[Table(')
  })

  test('should have ApplyConfigurationsFromAssembly called before ApplySnakeCaseNaming', () => {
    // GIVEN: Configuration registrations must run before naming conventions are applied
    const content = fs.readFileSync(APP_DB_CONTEXT_FILE, 'utf-8')

    const configIdx = content.indexOf('ApplyConfigurationsFromAssembly')
    const snakeCaseIdx = content.indexOf('ApplySnakeCaseNaming')

    // THEN: ApplyConfigurationsFromAssembly is called before ApplySnakeCaseNaming
    expect(configIdx).toBeGreaterThanOrEqual(0)
    expect(snakeCaseIdx).toBeGreaterThan(configIdx)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [STATIC-BE] Program.cs EF Core registration assertions (AC#4, AC#5)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[STATIC-BE] Program.cs EF Core and AppDbContext registration (AC#4, AC#5)', () => {
  test('should have AddDbContext<AppDbContext> in Program.cs', () => {
    // GIVEN: AC#5 requires AppDbContext registered in DI
    const content = fs.readFileSync(PROGRAM_FILE, 'utf-8')

    // THEN: AddDbContext registration is present
    expect(content).toContain('AddDbContext<AppDbContext>')
  })

  test('should use UseNpgsql in the EF Core DI registration', () => {
    // GIVEN: AC#5 mandates the Npgsql provider (PostgreSQL)
    const content = fs.readFileSync(PROGRAM_FILE, 'utf-8')

    // THEN: Npgsql provider is configured
    expect(content).toContain('UseNpgsql')
  })

  test('should use UseSnakeCaseNamingConvention on the DbContextOptionsBuilder', () => {
    // GIVEN: AC#2 — naming convention applied at DB options level (belt-and-suspenders with AppDbContext)
    const content = fs.readFileSync(PROGRAM_FILE, 'utf-8')

    // THEN: UseSnakeCaseNamingConvention is chained on the options builder
    expect(content).toContain('UseSnakeCaseNamingConvention')
  })

  test('should read DefaultConnection via GetConnectionString (not hardcoded)', () => {
    // GIVEN: AC#4 — connection string must come from configuration, never hardcoded
    const content = fs.readFileSync(PROGRAM_FILE, 'utf-8')

    // THEN: GetConnectionString with "DefaultConnection" key is used
    expect(content).toContain('GetConnectionString("DefaultConnection")')
    // AND: No hardcoded connection string literal appears
    expect(content).not.toContain('Host=localhost;Database=siesa_agents_db')
  })

  test('should have AddDbContext registered BEFORE builder.Build() is called', () => {
    // GIVEN: Service registrations must appear before app.Build() — the DI container is frozen after Build()
    const content = fs.readFileSync(PROGRAM_FILE, 'utf-8')

    const addDbContextIdx = content.indexOf('AddDbContext<AppDbContext>')
    const buildIdx = content.indexOf('builder.Build()')

    // THEN: DI registration appears before Build()
    expect(addDbContextIdx).toBeGreaterThanOrEqual(0)
    expect(buildIdx).toBeGreaterThan(addDbContextIdx)
  })

  test('should import SiesaAgents.Infrastructure.Data namespace in Program.cs', () => {
    // GIVEN: AppDbContext is in the Infrastructure.Data namespace — Program.cs must import it
    const content = fs.readFileSync(PROGRAM_FILE, 'utf-8')

    // THEN: The using directive is present
    expect(content).toContain('SiesaAgents.Infrastructure.Data')
  })

  test('should have partial class Program declaration for integration test support', () => {
    // GIVEN: Integration tests using WebApplicationFactory require Program to be accessible
    // This is the standard ASP.NET pattern: public partial class Program { }
    const content = fs.readFileSync(PROGRAM_FILE, 'utf-8')

    // THEN: Partial Program class is declared for test host access
    expect(content).toContain('partial class Program')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [STATIC-BE] ExceptionHandlingMiddleware edge cases (AC#3, NFR6)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[STATIC-BE] ExceptionHandlingMiddleware structural edge cases (AC#3)', () => {
  test('should have ExceptionHandlingMiddleware.cs at the expected path', () => {
    // GIVEN: AC#3 requires the middleware to exist in the API Middleware folder
    expect(fs.existsSync(MIDDLEWARE_FILE)).toBe(true)
  })

  test('should have middleware in namespace SiesaAgents.API.Middleware', () => {
    // GIVEN: Namespace follows project convention for middleware
    const content = fs.readFileSync(MIDDLEWARE_FILE, 'utf-8')

    // THEN: Correct namespace declared
    expect(content).toContain('namespace SiesaAgents.API.Middleware')
  })

  test('should have InvokeAsync method (ASP.NET Core conventional middleware signature)', () => {
    // GIVEN: Conventional middleware requires InvokeAsync(HttpContext) method
    const content = fs.readFileSync(MIDDLEWARE_FILE, 'utf-8')

    // THEN: InvokeAsync is implemented
    expect(content).toContain('InvokeAsync')
    expect(content).toContain('HttpContext')
  })

  test('should have try/catch block wrapping next(context) call', () => {
    // GIVEN: Middleware must catch ALL unhandled exceptions from downstream pipeline
    const content = fs.readFileSync(MIDDLEWARE_FILE, 'utf-8')

    // THEN: try/catch pattern present with await next invocation
    expect(content).toContain('try')
    expect(content).toContain('catch')
    expect(content).toContain('await _next')
  })

  test('should set Content-Type to application/problem+json in the catch block', () => {
    // GIVEN: RFC 7807 requires the problem+json media type (AC#3)
    const content = fs.readFileSync(MIDDLEWARE_FILE, 'utf-8')

    // THEN: application/problem+json is set on the response
    expect(content).toContain('application/problem+json')
    expect(content).toContain('ContentType')
  })

  test('should NOT write ex.Message to the response body (NFR6 - no info leakage)', () => {
    // GIVEN: NFR6 forbids exposing exception messages to clients
    // Dev Notes explicitly state: detail = null — NEVER expose ex.Message or ex.StackTrace
    const content = fs.readFileSync(MIDDLEWARE_FILE, 'utf-8')

    // THEN: ex.Message is NOT written to the response
    expect(content).not.toContain('ex.Message')
    expect(content).not.toContain('exception.Message')
  })

  test('should NOT write ex.StackTrace to the response body (NFR6)', () => {
    // GIVEN: NFR6 forbids stack trace exposure
    const content = fs.readFileSync(MIDDLEWARE_FILE, 'utf-8')

    // THEN: Stack trace is never written to response
    expect(content).not.toContain('ex.StackTrace')
    expect(content).not.toContain('exception.StackTrace')
  })

  test('should set detail to null (not the exception message) in the Problem Details response', () => {
    // GIVEN: AC#3 / Dev Notes — detail must be null per security policy
    const content = fs.readFileSync(MIDDLEWARE_FILE, 'utf-8')

    // THEN: The detail field is explicitly null
    // The implementation uses: detail = (string?)null  OR  detail = null
    expect(content).toContain('null')
    // AND: The detail key appears in the problem details object and is assigned null
    // Match both: "detail = null", "detail = (string?)null", "Detail = null"
    const detailLineMatch = content.match(/detail\s*=\s*(\([^)]+\))?\s*null/i)
    expect(detailLineMatch).not.toBeNull()
  })

  test('should map ArgumentException to HTTP 400 (BadRequest)', () => {
    // GIVEN: The middleware has richer exception-to-status-code mapping than the story base spec
    const content = fs.readFileSync(MIDDLEWARE_FILE, 'utf-8')

    // THEN: ArgumentException maps to a 400-equivalent status
    expect(content).toContain('ArgumentException')
    expect(content).toContain('BadRequest')
  })

  test('should map KeyNotFoundException to HTTP 404 (NotFound)', () => {
    // GIVEN: Domain exceptions should map to semantically correct HTTP status codes
    const content = fs.readFileSync(MIDDLEWARE_FILE, 'utf-8')

    // THEN: KeyNotFoundException maps to 404
    expect(content).toContain('KeyNotFoundException')
    expect(content).toContain('NotFound')
  })

  test('should map InvalidOperationException to HTTP 409 (Conflict)', () => {
    // GIVEN: State conflict exceptions map to Conflict status
    const content = fs.readFileSync(MIDDLEWARE_FILE, 'utf-8')

    // THEN: InvalidOperationException maps to Conflict
    expect(content).toContain('InvalidOperationException')
    expect(content).toContain('Conflict')
  })

  test('should map unrecognized exceptions to HTTP 500 (InternalServerError)', () => {
    // GIVEN: All unrecognized exceptions must fall through to 500
    const content = fs.readFileSync(MIDDLEWARE_FILE, 'utf-8')

    // THEN: InternalServerError is the default case
    expect(content).toContain('InternalServerError')
  })

  test('should have a switch expression or switch statement for exception type mapping', () => {
    // GIVEN: Multiple exception types map to different status codes — a switch is expected
    const content = fs.readFileSync(MIDDLEWARE_FILE, 'utf-8')

    // THEN: switch expression (C# 8+) or switch statement is present
    const hasSwitchExpression = content.includes('switch')
    expect(hasSwitchExpression).toBe(true)
  })

  test('should include ILogger<ExceptionHandlingMiddleware> field (logging of unhandled errors)', () => {
    // GIVEN: Unhandled exceptions must be logged for observability without exposing to clients
    const content = fs.readFileSync(MIDDLEWARE_FILE, 'utf-8')

    // THEN: Logger field is present
    expect(content).toContain('ILogger<ExceptionHandlingMiddleware>')
  })

  test('should include a LogError or LogCritical call in the catch block', () => {
    // GIVEN: Every caught exception must be logged before sending the error response
    const content = fs.readFileSync(MIDDLEWARE_FILE, 'utf-8')

    // THEN: At least one error-level log call exists
    const hasLogError =
      content.includes('LogError') ||
      content.includes('LogCritical') ||
      content.includes('_logger.Log')
    expect(hasLogError).toBe(true)
  })

  test('should include RFC 7807 "type" field with a URL in the problem details object', () => {
    // GIVEN: RFC 7807 recommends a "type" URI for machine-readable error classification
    const content = fs.readFileSync(MIDDLEWARE_FILE, 'utf-8')

    // THEN: A type URI field is included in the response body
    expect(content).toContain('type')
    expect(content).toContain('rfc7807')
  })

  test('should include "instance" field with request path in the problem details object', () => {
    // GIVEN: RFC 7807 defines "instance" as the specific occurrence URI (request path)
    const content = fs.readFileSync(MIDDLEWARE_FILE, 'utf-8')

    // THEN: instance field uses context.Request.Path
    expect(content).toContain('instance')
    expect(content).toContain('Request.Path')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [STATIC-MIGS] Migration files structural assertions (AC#1)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[STATIC-MIGS] Migration files structure (AC#1)', () => {
  test('should have a Data/Migrations folder in the Infrastructure project', () => {
    // GIVEN: AC#1 requires migrations folder to exist in SiesaAgents.Infrastructure
    expect(fs.existsSync(MIGRATIONS_DIR)).toBe(true)
  })

  test('should have at least one migration .cs file in the Migrations folder', () => {
    // GIVEN: AC#1 requires at least one migration file (the initial empty migration)
    const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.cs'))

    // THEN: At least one .cs file exists
    expect(files.length).toBeGreaterThanOrEqual(1)
  })

  test('should have an InitialCreate migration .cs file', () => {
    // GIVEN: Story Task 4 names the migration "InitialCreate"
    const files = fs.readdirSync(MIGRATIONS_DIR)

    // THEN: A file with InitialCreate in the name exists
    const initialCreateFile = files.find((f) => f.includes('InitialCreate') && f.endsWith('.cs'))
    expect(initialCreateFile).toBeDefined()
  })

  test('should have an AppDbContextModelSnapshot.cs file in the Migrations folder', () => {
    // GIVEN: EF Core generates a model snapshot to compare migration state
    const snapshotPath = path.join(MIGRATIONS_DIR, 'AppDbContextModelSnapshot.cs')

    // THEN: Snapshot file exists
    expect(fs.existsSync(snapshotPath)).toBe(true)
  })

  test('should have InitialCreate migration with empty Up() and Down() methods (intentionally empty)', () => {
    // GIVEN: Story 1.3 creates an EMPTY initial migration — no tables yet
    // Dev Notes: "no domain tables in Story 1.3"
    const files = fs.readdirSync(MIGRATIONS_DIR)
    const initialCreateFileName = files.find(
      (f) => f.includes('InitialCreate') && f.endsWith('.cs') && !f.endsWith('.Designer.cs')
    )
    expect(initialCreateFileName).toBeDefined()

    const content = fs.readFileSync(path.join(MIGRATIONS_DIR, initialCreateFileName!), 'utf-8')

    // THEN: Up() method exists but creates NO tables
    expect(content).toContain('protected override void Up')
    expect(content).not.toContain('CreateTable')
    expect(content).not.toContain('clientes')
    expect(content).not.toContain('contactos')
    expect(content).not.toContain('ClienteEntity')
    expect(content).not.toContain('ContactoEntity')
  })

  test('should have InitialCreate Designer file with [Migration] attribute', () => {
    // GIVEN: EF Core uses the Designer file for migration metadata
    const files = fs.readdirSync(MIGRATIONS_DIR)
    const designerFile = files.find(
      (f) => f.includes('InitialCreate') && f.endsWith('.Designer.cs')
    )
    expect(designerFile).toBeDefined()

    const content = fs.readFileSync(path.join(MIGRATIONS_DIR, designerFile!), 'utf-8')

    // THEN: The [Migration] attribute is present with the migration ID
    expect(content).toContain('[Migration(')
    expect(content).toContain('InitialCreate')
  })

  test('should have InitialCreate Designer file referencing AppDbContext via [DbContext] attribute', () => {
    // GIVEN: Migration designer must reference its DbContext
    const files = fs.readdirSync(MIGRATIONS_DIR)
    const designerFile = files.find(
      (f) => f.includes('InitialCreate') && f.endsWith('.Designer.cs')
    )
    expect(designerFile).toBeDefined()

    const content = fs.readFileSync(path.join(MIGRATIONS_DIR, designerFile!), 'utf-8')

    // THEN: [DbContext(typeof(AppDbContext))] attribute is present
    expect(content).toContain('[DbContext(typeof(AppDbContext))]')
  })

  test('should have AppDbContextModelSnapshot referencing Npgsql metadata', () => {
    // GIVEN: Snapshot must use the Npgsql provider annotations
    const snapshotPath = path.join(MIGRATIONS_DIR, 'AppDbContextModelSnapshot.cs')
    const content = fs.readFileSync(snapshotPath, 'utf-8')

    // THEN: Npgsql-specific metadata annotation is present
    expect(content).toContain('Npgsql')
    expect(content).toContain('UseIdentityByDefaultColumns')
  })

  test('should have AppDbContextModelSnapshot with [DbContext(typeof(AppDbContext))] attribute', () => {
    // GIVEN: Model snapshot must reference the correct context type
    const snapshotPath = path.join(MIGRATIONS_DIR, 'AppDbContextModelSnapshot.cs')
    const content = fs.readFileSync(snapshotPath, 'utf-8')

    // THEN: DbContext attribute is present and points to AppDbContext
    expect(content).toContain('[DbContext(typeof(AppDbContext))]')
  })

  test('should have AppDbContextModelSnapshot with empty BuildModel (no entity types yet)', () => {
    // GIVEN: Initial migration is empty — snapshot must not define any entity types
    const snapshotPath = path.join(MIGRATIONS_DIR, 'AppDbContextModelSnapshot.cs')
    const content = fs.readFileSync(snapshotPath, 'utf-8')

    // THEN: No entity types in the snapshot (no .Entity<> calls)
    expect(content).not.toContain('.Entity<')
    expect(content).not.toContain('ClienteEntity')
    expect(content).not.toContain('ContactoEntity')
  })

  test('should have all migration .cs files in namespace SiesaAgents.Infrastructure.Data.Migrations', () => {
    // GIVEN: Namespace conventions require migrations in the correct namespace
    const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.cs'))

    for (const fileName of files) {
      const content = fs.readFileSync(path.join(MIGRATIONS_DIR, fileName), 'utf-8')
      // THEN: Each migration file declares the correct namespace
      expect(content).toContain('namespace SiesaAgents.Infrastructure.Data.Migrations')
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [STATIC-CONFIG] Configuration file assertions (AC#4)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[STATIC-CONFIG] appsettings.Development.json configuration (AC#4)', () => {
  test('should have appsettings.Development.json file', () => {
    // GIVEN: AC#4 requires the connection string to be in appsettings.Development.json
    expect(fs.existsSync(APPSETTINGS_DEV)).toBe(true)
  })

  test('should have valid JSON in appsettings.Development.json', () => {
    // GIVEN: The file must be valid JSON (not JSONC) for ASP.NET Core to parse it
    const content = fs.readFileSync(APPSETTINGS_DEV, 'utf-8')

    // THEN: JSON.parse succeeds without throwing
    expect(() => JSON.parse(content)).not.toThrow()
  })

  test('should have ConnectionStrings:DefaultConnection key', () => {
    // GIVEN: Program.cs reads GetConnectionString("DefaultConnection") — key must match exactly
    const config = JSON.parse(fs.readFileSync(APPSETTINGS_DEV, 'utf-8'))

    // THEN: DefaultConnection exists under ConnectionStrings
    expect(config).toHaveProperty('ConnectionStrings')
    expect(config.ConnectionStrings).toHaveProperty('DefaultConnection')
  })

  test('should have DefaultConnection targeting siesa_agents_db database', () => {
    // GIVEN: AC#1 / AC#4 — database name must be siesa_agents_db
    const config = JSON.parse(fs.readFileSync(APPSETTINGS_DEV, 'utf-8'))
    const connStr: string = config.ConnectionStrings.DefaultConnection

    // THEN: Connection string references the correct database
    expect(connStr).toContain('siesa_agents_db')
  })

  test('should have DefaultConnection with Host=localhost (local development)', () => {
    // GIVEN: Local development connection string targets localhost
    const config = JSON.parse(fs.readFileSync(APPSETTINGS_DEV, 'utf-8'))
    const connStr: string = config.ConnectionStrings.DefaultConnection

    // THEN: Host is localhost
    expect(connStr).toContain('Host=localhost')
  })

  test('should have DefaultConnection with Port=5432 (PostgreSQL default port)', () => {
    // GIVEN: PostgreSQL default port is 5432
    const config = JSON.parse(fs.readFileSync(APPSETTINGS_DEV, 'utf-8'))
    const connStr: string = config.ConnectionStrings.DefaultConnection

    // THEN: Port 5432 is specified explicitly
    expect(connStr).toContain('5432')
  })

  test('should have DefaultConnection with Username=postgres', () => {
    // GIVEN: AC#4 specifies Username=postgres in the connection string
    const config = JSON.parse(fs.readFileSync(APPSETTINGS_DEV, 'utf-8'))
    const connStr: string = config.ConnectionStrings.DefaultConnection

    // THEN: Username is postgres
    expect(connStr.toLowerCase()).toContain('username=postgres')
  })

  test('should NOT have the connection string hardcoded in Program.cs source file', () => {
    // GIVEN: AC#4 — connection string must NOT be hardcoded in C# source
    const programContent = fs.readFileSync(PROGRAM_FILE, 'utf-8')

    // THEN: No Npgsql connection string literal is in Program.cs
    expect(programContent).not.toContain('Host=localhost;Database=siesa_agents_db')
    expect(programContent).not.toContain('siesa_agents_db')
  })

  test('should NOT have the connection string hardcoded in AppDbContext.cs', () => {
    // GIVEN: AppDbContext must use options from DI — no hardcoded strings
    const contextContent = fs.readFileSync(APP_DB_CONTEXT_FILE, 'utf-8')

    // THEN: No connection string in the context file
    expect(contextContent).not.toContain('Host=localhost')
    expect(contextContent).not.toContain('siesa_agents_db')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [STATIC-BE] NuGet package assertions (AC#1, AC#2, AC#4, AC#5)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[STATIC-BE] Infrastructure .csproj NuGet package assertions', () => {
  test('should have EFCore.NamingConventions package (for ApplySnakeCaseNaming)', () => {
    // GIVEN: ApplySnakeCaseNaming() requires EFCore.NamingConventions NuGet package
    const content = fs.readFileSync(INFRA_CSPROJ, 'utf-8')

    // THEN: Package is referenced
    expect(content).toContain('EFCore.NamingConventions')
  })

  test('should have Npgsql.EntityFrameworkCore.PostgreSQL package', () => {
    // GIVEN: Npgsql is the EF Core provider for PostgreSQL (AC#5)
    const content = fs.readFileSync(INFRA_CSPROJ, 'utf-8')

    // THEN: Package is referenced
    expect(content).toContain('Npgsql.EntityFrameworkCore.PostgreSQL')
  })

  test('should have Microsoft.EntityFrameworkCore.Design package (for dotnet ef CLI)', () => {
    // GIVEN: Task 4 requires EFCore.Design for running migration commands
    const content = fs.readFileSync(INFRA_CSPROJ, 'utf-8')

    // THEN: Design package is referenced
    expect(content).toContain('Microsoft.EntityFrameworkCore.Design')
  })

  test('should have Microsoft.EntityFrameworkCore.Design with PrivateAssets=all (dev-only tool)', () => {
    // GIVEN: Design package is a dev/tooling-only dependency and must not be published
    const content = fs.readFileSync(INFRA_CSPROJ, 'utf-8')

    // THEN: PrivateAssets=all is set on the design package reference
    const designPkgSection = content.substring(
      content.indexOf('Microsoft.EntityFrameworkCore.Design'),
      content.indexOf('Microsoft.EntityFrameworkCore.Design') + 500
    )
    expect(designPkgSection).toContain('PrivateAssets')
    expect(designPkgSection).toContain('all')
  })

  test('should have Infrastructure .csproj targeting net10.0', () => {
    // GIVEN: All projects must target the same framework (net10.0)
    const content = fs.readFileSync(INFRA_CSPROJ, 'utf-8')

    // THEN: Target framework is net10.0
    expect(content).toContain('<TargetFramework>net10.0</TargetFramework>')
  })

  test('should have Infrastructure .csproj with TreatWarningsAsErrors=true', () => {
    // GIVEN: Zero-warning policy applies to Infrastructure project (company standard)
    const content = fs.readFileSync(INFRA_CSPROJ, 'utf-8')

    // THEN: Warnings are treated as errors
    expect(content).toContain('<TreatWarningsAsErrors>true</TreatWarningsAsErrors>')
  })

  test('should have Infrastructure .csproj with Nullable=enable', () => {
    // GIVEN: Nullable reference types must be enabled for all projects (company standard)
    const content = fs.readFileSync(INFRA_CSPROJ, 'utf-8')

    // THEN: Nullable is enabled
    expect(content).toContain('<Nullable>enable</Nullable>')
  })

  test('should NOT have Swashbuckle package in Infrastructure .csproj', () => {
    // GIVEN: Architecture standard forbids Swashbuckle (Scalar is used instead)
    const content = fs.readFileSync(INFRA_CSPROJ, 'utf-8')

    // THEN: Swashbuckle is absent
    expect(content).not.toContain('Swashbuckle')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [STATIC-SCOPE] Scope boundary assertions — no premature entities
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[STATIC-SCOPE] Story 1.3 scope boundary — no premature domain entities', () => {
  test('should NOT have ClienteEntity class anywhere in the Domain project', () => {
    // GIVEN: ClienteEntity is scoped to Epic 2, Story 2.1 — NOT Story 1.3
    const domainSrc = path.join(BACKEND_ROOT, 'src', 'SiesaAgents.Domain')
    const domainFiles = findAllCsFiles(domainSrc)

    for (const filePath of domainFiles) {
      const content = fs.readFileSync(filePath, 'utf-8')
      expect(content).not.toContain('class ClienteEntity')
    }
  })

  test('should NOT have ContactoEntity class anywhere in the Domain project', () => {
    // GIVEN: ContactoEntity is scoped to Epic 3, Story 3.1 — NOT Story 1.3
    const domainSrc = path.join(BACKEND_ROOT, 'src', 'SiesaAgents.Domain')
    const domainFiles = findAllCsFiles(domainSrc)

    for (const filePath of domainFiles) {
      const content = fs.readFileSync(filePath, 'utf-8')
      expect(content).not.toContain('class ContactoEntity')
    }
  })

  test('should NOT have ClienteEntity or ContactoEntity in AppDbContext OnModelCreating', () => {
    // GIVEN: AppDbContext must be intentionally empty for Story 1.3
    const content = fs.readFileSync(APP_DB_CONTEXT_FILE, 'utf-8')

    // THEN: No entity configuration calls for domain entities
    expect(content).not.toContain('ClienteEntity')
    expect(content).not.toContain('ContactoEntity')
  })

  test('should NOT have any migrations that create tables (empty initial migration)', () => {
    // GIVEN: Story 1.3 creates an empty migration — first real table (clientes) is Epic 2
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.cs') && !f.endsWith('.Designer.cs') && f !== 'AppDbContextModelSnapshot.cs')

    for (const fileName of files) {
      const content = fs.readFileSync(path.join(MIGRATIONS_DIR, fileName), 'utf-8')
      // THEN: No CreateTable operations in any migration of this story
      expect(content).not.toContain('migrationBuilder.CreateTable')
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [STATIC-BE] Test project structural assertions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[STATIC-BE] Test project configuration and structure', () => {
  test('should have ExceptionHandlingMiddlewareTests.cs at the expected path', () => {
    // GIVEN: Task 6 creates unit tests for the middleware
    expect(fs.existsSync(UNIT_TEST_MIDDLEWARE)).toBe(true)
  })

  test('should have AppDbContextTests.cs at the expected integration test path', () => {
    // GIVEN: Task 7 creates integration tests for the DbContext
    expect(fs.existsSync(INTEGRATION_TEST_CONTEXT)).toBe(true)
  })

  test('should have ExceptionHandlingMiddlewareTests using xUnit [Fact] attributes', () => {
    // GIVEN: Company standard mandates xUnit for all .NET tests
    const content = fs.readFileSync(UNIT_TEST_MIDDLEWARE, 'utf-8')

    // THEN: [Fact] attribute is present
    expect(content).toContain('[Fact]')
  })

  test('should have ExceptionHandlingMiddlewareTests with at least 8 test methods', () => {
    // GIVEN: Story specifies 10 tests covering HTTP 500, Content-Type, RFC 7807 fields, etc.
    const content = fs.readFileSync(UNIT_TEST_MIDDLEWARE, 'utf-8')

    // Count [Fact] occurrences as a proxy for test method count
    const factCount = (content.match(/\[Fact\]/g) ?? []).length
    expect(factCount).toBeGreaterThanOrEqual(8)
  })

  test('should have ExceptionHandlingMiddlewareTests using NullLogger (no mocking frameworks)', () => {
    // GIVEN: Dev Notes specify no mocking frameworks — NullLogger from abstractions
    const content = fs.readFileSync(UNIT_TEST_MIDDLEWARE, 'utf-8')

    // THEN: NullLogger is used instead of a mock framework
    expect(content).toContain('NullLogger')
    expect(content).toContain('Microsoft.Extensions.Logging.Abstractions')
  })

  test('should have ExceptionHandlingMiddlewareTests using DefaultHttpContext (not a mock)', () => {
    // GIVEN: Unit tests use DefaultHttpContext for pure in-process testing
    const content = fs.readFileSync(UNIT_TEST_MIDDLEWARE, 'utf-8')

    // THEN: DefaultHttpContext is used
    expect(content).toContain('DefaultHttpContext')
  })

  test('should have AppDbContextTests covering CanConnectAsync', () => {
    // GIVEN: AC#1 requires verifying database connectivity
    const content = fs.readFileSync(INTEGRATION_TEST_CONTEXT, 'utf-8')

    // THEN: CanConnectAsync is tested
    expect(content).toContain('CanConnectAsync')
  })

  test('should have AppDbContextTests covering pending migrations (AC#1)', () => {
    // GIVEN: AC#1 requires no pending migrations after database update
    const content = fs.readFileSync(INTEGRATION_TEST_CONTEXT, 'utf-8')

    // THEN: GetPendingMigrationsAsync is tested
    expect(content).toContain('GetPendingMigrationsAsync')
  })

  test('should have AppDbContextTests verifying empty entity types (AC#5)', () => {
    // GIVEN: AC#5 requires no DbSet properties in this story
    const content = fs.readFileSync(INTEGRATION_TEST_CONTEXT, 'utf-8')

    // THEN: GetEntityTypes is tested for emptiness
    expect(content).toContain('GetEntityTypes')
    expect(content).toContain('Empty')
  })

  test('should have AppDbContextTests following Arrange/Act/Assert pattern', () => {
    // GIVEN: Company testing standard requires AAA pattern
    const content = fs.readFileSync(INTEGRATION_TEST_CONTEXT, 'utf-8')

    // THEN: GIVEN/WHEN/THEN comments or AAA structure is present
    const hasGiven = content.includes('GIVEN') || content.includes('// Arrange') || content.includes('// Given')
    const hasWhen = content.includes('WHEN') || content.includes('// Act') || content.includes('// When')
    const hasThen = content.includes('THEN') || content.includes('// Assert') || content.includes('// Then')
    expect(hasGiven).toBe(true)
    expect(hasWhen).toBe(true)
    expect(hasThen).toBe(true)
  })

  test('should have UnitTests .csproj with API project reference (for middleware access)', () => {
    // GIVEN: UnitTests project must reference SiesaAgents.API to access ExceptionHandlingMiddleware
    const content = fs.readFileSync(UNIT_TEST_CSPROJ, 'utf-8')

    // THEN: API project reference is present
    expect(content).toContain('SiesaAgents.API')
  })

  test('should have UnitTests .csproj with Microsoft.Extensions.Logging.Abstractions package', () => {
    // GIVEN: NullLogger comes from Logging.Abstractions — must be a dependency
    const content = fs.readFileSync(UNIT_TEST_CSPROJ, 'utf-8')

    // THEN: Package is referenced
    expect(content).toContain('Microsoft.Extensions.Logging.Abstractions')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [E2E-API] API-level tests for error mapping — require running backend
// Marked fixme: .NET 10 SDK and backend runtime not available in CI environment
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000'

test.describe('[E2E-API] ExceptionHandlingMiddleware — exception type to status code mapping', () => {
  test('should return HTTP 400 when a 400-mapped route is triggered (ArgumentException path)', async ({
    request,
  }) => {
    test.fixme(
      true,
      'Requires running .NET 10 backend with a dedicated test-error endpoint that throws ArgumentException. ' +
        'Backend not available in this environment. Validate manually once backend is running.'
    )
    const response = await request.get(`${API_BASE_URL}/api/test/throw-argument-error`)
    expect(response.status()).toBe(400)
    const contentType = response.headers()['content-type'] ?? ''
    expect(contentType).toContain('application/problem+json')
  })

  test('should return HTTP 404 with problem+json when a 404-mapped route is triggered (KeyNotFoundException path)', async ({
    request,
  }) => {
    test.fixme(
      true,
      'Requires running .NET 10 backend with a test endpoint that throws KeyNotFoundException. ' +
        'Backend not available in this environment.'
    )
    const response = await request.get(`${API_BASE_URL}/api/test/throw-notfound-error`)
    expect(response.status()).toBe(404)
    const contentType = response.headers()['content-type'] ?? ''
    expect(contentType).toContain('application/problem+json')
  })

  test('should return HTTP 409 with problem+json for InvalidOperationException path', async ({
    request,
  }) => {
    test.fixme(
      true,
      'Requires running .NET 10 backend with a test endpoint that throws InvalidOperationException. ' +
        'Backend not available in this environment.'
    )
    const response = await request.get(`${API_BASE_URL}/api/test/throw-conflict-error`)
    expect(response.status()).toBe(409)
    const contentType = response.headers()['content-type'] ?? ''
    expect(contentType).toContain('application/problem+json')
  })

  test('should include "type" field with RFC 7807 URI in all error responses', async ({
    request,
  }) => {
    test.fixme(
      true,
      'Requires running .NET 10 backend. Backend not available in this environment.'
    )
    const response = await request.get(`${API_BASE_URL}/api/test/throw-error`)
    const body = await response.json()
    expect(body).toHaveProperty('type')
    expect(body.type).toContain('rfc7807')
  })

  test('should include "instance" field with the request path in all error responses', async ({
    request,
  }) => {
    test.fixme(
      true,
      'Requires running .NET 10 backend. Backend not available in this environment.'
    )
    const response = await request.get(`${API_BASE_URL}/api/test/throw-error`)
    const body = await response.json()
    expect(body).toHaveProperty('instance')
    expect(typeof body.instance).toBe('string')
    expect((body.instance as string).length).toBeGreaterThan(0)
  })

  test('should NOT contain any x-powered-by or server information headers in error response', async ({
    request,
  }) => {
    test.fixme(
      true,
      'Requires running .NET 10 backend. Backend not available in this environment. ' +
        'Validates that server implementation details are not leaked in response headers.'
    )
    const response = await request.get(`${API_BASE_URL}/api/test/throw-error`)
    const headers = response.headers()
    expect(headers['x-powered-by']).toBeUndefined()
    expect(headers['server']).not.toContain('Microsoft-IIS')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Helper utilities
// ─────────────────────────────────────────────────────────────────────────────

function findAllCsFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  const results: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...findAllCsFiles(fullPath))
    } else if (entry.name.endsWith('.cs')) {
      results.push(fullPath)
    }
  }
  return results
}

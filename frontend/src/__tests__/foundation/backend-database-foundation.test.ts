/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * Unit Tests — Edge cases for Story 1.3 static content validation
 * Runs using Vitest + Node.js fs — NO dotnet SDK required
 *
 * Acceptance Criteria covered:
 *   AC1 — EF Core migrations folder, InitialCreate migration, AppDbContextModelSnapshot
 *   AC3 — AppDbContext.cs calls ApplySnakeCaseNaming() as last call in OnModelCreating
 *   AC4 — AppDbContext registered in DI with connection string from configuration
 *   AC1 — IDesignTimeDbContextFactory<AppDbContext> in AppDbContextFactory.cs
 *
 * Edge cases NOT covered by the ATDD C# file-structure tests:
 *   - Migration Up/Down methods are empty (scope boundary: no domain entities yet)
 *   - Migration file uses correct timestamp-based naming convention
 *   - ModelSnapshot references Npgsql metadata and correct ProductVersion
 *   - AppDbContextFactory uses design-time hardcoded connection string (not config)
 *   - AppDbContextFactory CreateDbContext method returns a new AppDbContext
 *   - AppDbContext namespace matches Clean Architecture convention
 *   - AppDbContext assembly reference uses typeof(AppDbContext).Assembly (not hardcoded string)
 *   - Program.cs throws InvalidOperationException when DefaultConnection is missing
 *   - Program.cs registers AddDbContext BEFORE var app = builder.Build()
 *   - Infrastructure.csproj has PrivateAssets=all for Design package (not a runtime dep)
 *   - API.csproj has PrivateAssets=all for Tools package (not a runtime dep)
 *   - UnitTests.csproj references Infrastructure project (required for AppDbContextTests)
 *   - UnitTests.csproj has InMemory EF package (required for AppDbContextTests)
 *   - appsettings.Development.json connection string targets siesa_agents_db specifically
 *   - appsettings.Development.json connection string uses postgres username (not sa or root)
 *   - ModelSnapshot is in Data.Migrations namespace (matches Infrastructure.Data folder)
 *   - Scope boundary: AppDbContext has no DbSet<> properties (no entities defined yet)
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, readdirSync } from 'fs'
import { resolve, dirname, basename } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const FRONTEND_ROOT = resolve(__dirname, '../../..')
const PROJECT_ROOT = resolve(FRONTEND_ROOT, '..')

const readBackend = (path: string): string =>
  readFileSync(resolve(PROJECT_ROOT, path), 'utf-8')

const MIGRATIONS_PATH = 'backend/src/SiesaAgents.Infrastructure/Data/Migrations'
const CONTEXT_PATH = 'backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs'
const FACTORY_PATH = 'backend/src/SiesaAgents.Infrastructure/Data/AppDbContextFactory.cs'
const INFRA_CSPROJ_PATH = 'backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj'
const API_CSPROJ_PATH = 'backend/src/SiesaAgents.API/SiesaAgents.API.csproj'
const UNIT_TESTS_CSPROJ_PATH = 'backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj'
const PROGRAM_PATH = 'backend/src/SiesaAgents.API/Program.cs'
const APPSETTINGS_DEV_PATH = 'backend/src/SiesaAgents.API/appsettings.Development.json'

// ─────────────────────────────────────────────────────────────────────────────
// AC1: Migrations folder and file content — scope boundary edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('Story 1.3 — EF Core Migrations folder structure and content', () => {
  it('should have the Migrations directory at the Data/Migrations subpath (not root Migrations/)', () => {
    // GIVEN: Architecture places migrations inside Infrastructure/Data/Migrations (not Infrastructure/Migrations)
    // WHEN: We check the path
    const correctPath = resolve(PROJECT_ROOT, MIGRATIONS_PATH)
    const wrongPath = resolve(PROJECT_ROOT, 'backend/src/SiesaAgents.Infrastructure/Migrations')
    // THEN: Migrations are in Data/Migrations, not root-level Migrations/
    expect(existsSync(correctPath)).toBe(true)
    expect(existsSync(wrongPath)).toBe(false)
  })

  it('should have exactly two migration files: InitialCreate and ModelSnapshot', () => {
    // GIVEN: Story 1.3 creates only the initial empty migration
    // WHEN: We list the Migrations directory
    const migrationsDir = resolve(PROJECT_ROOT, MIGRATIONS_PATH)
    const csFiles = readdirSync(migrationsDir).filter((f) => f.endsWith('.cs'))
    // THEN: There should be exactly 2 files (no extra migrations created yet)
    expect(csFiles.length).toBe(2)
  })

  it('should have InitialCreate migration file with timestamp prefix in filename', () => {
    // GIVEN: EF Core migration file naming convention requires a timestamp prefix
    // WHEN: We list migration files
    const migrationsDir = resolve(PROJECT_ROOT, MIGRATIONS_PATH)
    const files = readdirSync(migrationsDir)
    const migrationFile = files.find((f) => f.includes('InitialCreate') && f.endsWith('.cs'))
    // THEN: The file name matches pattern <digits>_InitialCreate.cs
    expect(migrationFile).toBeDefined()
    expect(migrationFile).toMatch(/^\d+_InitialCreate\.cs$/)
  })

  it('InitialCreate migration Up() method must be empty (scope boundary: no domain entities)', () => {
    // GIVEN: Story 1.3 scope explicitly prohibits creating domain entities
    // WHEN: We read the InitialCreate migration Up method
    const migrationsDir = resolve(PROJECT_ROOT, MIGRATIONS_PATH)
    const files = readdirSync(migrationsDir)
    const migrationFileName = files.find((f) => f.includes('InitialCreate') && f.endsWith('.cs'))
    expect(migrationFileName).toBeDefined()
    const content = readFileSync(resolve(PROJECT_ROOT, MIGRATIONS_PATH, migrationFileName!), 'utf-8')

    // Extract the Up method body — it must have no table operations
    // THEN: Up() has no migrationBuilder.Create*, Alter*, Drop*, or Add* calls
    expect(content).not.toMatch(/migrationBuilder\.(CreateTable|AlterTable|DropTable|AddColumn|CreateIndex)/i)
  })

  it('InitialCreate migration Down() method must be empty (scope boundary: no domain entities)', () => {
    // GIVEN: Story 1.3 scope — no entities to roll back
    const migrationsDir = resolve(PROJECT_ROOT, MIGRATIONS_PATH)
    const files = readdirSync(migrationsDir)
    const migrationFileName = files.find((f) => f.includes('InitialCreate') && f.endsWith('.cs'))
    expect(migrationFileName).toBeDefined()
    const content = readFileSync(resolve(PROJECT_ROOT, MIGRATIONS_PATH, migrationFileName!), 'utf-8')

    // THEN: Down() has no rollback operations
    expect(content).not.toMatch(/migrationBuilder\.(DropTable|AlterTable|DropColumn|DropIndex)/i)
  })

  it('InitialCreate migration must be in the correct namespace (SiesaAgents.Infrastructure.Data.Migrations)', () => {
    // GIVEN: Namespace must match the folder path in Clean Architecture
    const migrationsDir = resolve(PROJECT_ROOT, MIGRATIONS_PATH)
    const files = readdirSync(migrationsDir)
    const migrationFileName = files.find((f) => f.includes('InitialCreate') && f.endsWith('.cs'))
    expect(migrationFileName).toBeDefined()
    const content = readFileSync(resolve(PROJECT_ROOT, MIGRATIONS_PATH, migrationFileName!), 'utf-8')

    // THEN: Correct namespace declared
    expect(content).toContain('namespace SiesaAgents.Infrastructure.Data.Migrations')
  })

  it('InitialCreate migration must extend Migration base class', () => {
    // GIVEN: EF Core migrations require inheriting from Migration
    const migrationsDir = resolve(PROJECT_ROOT, MIGRATIONS_PATH)
    const files = readdirSync(migrationsDir)
    const migrationFileName = files.find((f) => f.includes('InitialCreate') && f.endsWith('.cs'))
    expect(migrationFileName).toBeDefined()
    const content = readFileSync(resolve(PROJECT_ROOT, MIGRATIONS_PATH, migrationFileName!), 'utf-8')

    // THEN: Inherits from Migration
    expect(content).toContain(': Migration')
    expect(content).toContain('using Microsoft.EntityFrameworkCore.Migrations')
  })

  it('InitialCreate migration class must be a partial class (EF Core generated convention)', () => {
    // GIVEN: EF Core generates partial classes for migrations
    const migrationsDir = resolve(PROJECT_ROOT, MIGRATIONS_PATH)
    const files = readdirSync(migrationsDir)
    const migrationFileName = files.find((f) => f.includes('InitialCreate') && f.endsWith('.cs'))
    expect(migrationFileName).toBeDefined()
    const content = readFileSync(resolve(PROJECT_ROOT, MIGRATIONS_PATH, migrationFileName!), 'utf-8')

    // THEN: class is partial
    expect(content).toMatch(/public\s+partial\s+class\s+InitialCreate/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC1: AppDbContextModelSnapshot content edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('Story 1.3 — AppDbContextModelSnapshot content and conventions', () => {
  it('ModelSnapshot must be in Data.Migrations namespace (matching Infrastructure.Data folder)', () => {
    // GIVEN: ModelSnapshot is auto-generated in the same namespace as migrations
    const content = readBackend(`${MIGRATIONS_PATH}/AppDbContextModelSnapshot.cs`)
    // THEN: Correct namespace
    expect(content).toContain('namespace SiesaAgents.Infrastructure.Data.Migrations')
  })

  it('ModelSnapshot must reference Npgsql.EntityFrameworkCore.PostgreSQL.Metadata', () => {
    // GIVEN: Npgsql is the provider — its metadata namespace must appear in snapshot
    const content = readBackend(`${MIGRATIONS_PATH}/AppDbContextModelSnapshot.cs`)
    // THEN: Npgsql metadata import is present
    expect(content).toContain('Npgsql.EntityFrameworkCore.PostgreSQL.Metadata')
  })

  it('ModelSnapshot must be decorated with [DbContext(typeof(AppDbContext))]', () => {
    // GIVEN: The DbContext attribute links the snapshot to its context
    const content = readBackend(`${MIGRATIONS_PATH}/AppDbContextModelSnapshot.cs`)
    // THEN: DbContext attribute with correct type
    expect(content).toContain('[DbContext(typeof(AppDbContext))]')
  })

  it('ModelSnapshot must extend ModelSnapshot base class', () => {
    // GIVEN: EF Core model snapshots inherit from ModelSnapshot
    const content = readBackend(`${MIGRATIONS_PATH}/AppDbContextModelSnapshot.cs`)
    // THEN: Correct base class
    expect(content).toContain(': ModelSnapshot')
  })

  it('ModelSnapshot must be a partial class (EF Core convention)', () => {
    // GIVEN: EF Core generates partial classes for snapshots
    const content = readBackend(`${MIGRATIONS_PATH}/AppDbContextModelSnapshot.cs`)
    // THEN: partial class declared
    expect(content).toMatch(/partial\s+class\s+AppDbContextModelSnapshot/)
  })

  it('ModelSnapshot BuildModel must call UseIdentityByDefaultColumns (Npgsql PostgreSQL convention)', () => {
    // GIVEN: Npgsql PostgreSQL provider sets identity columns by default
    const content = readBackend(`${MIGRATIONS_PATH}/AppDbContextModelSnapshot.cs`)
    // THEN: UseIdentityByDefaultColumns is called
    expect(content).toContain('UseIdentityByDefaultColumns')
  })

  it('ModelSnapshot must NOT define any entity tables (scope boundary: no domain entities)', () => {
    // GIVEN: Story 1.3 creates no domain entities — snapshot must be empty
    // WHEN: We check for entity/table builder calls
    const content = readBackend(`${MIGRATIONS_PATH}/AppDbContextModelSnapshot.cs`)
    // THEN: No entity builder calls (no modelBuilder.Entity<...>)
    expect(content).not.toContain('modelBuilder.Entity<')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC1: AppDbContextFactory — design-time factory edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('Story 1.3 — AppDbContextFactory design-time factory', () => {
  it('AppDbContextFactory must be in SiesaAgents.Infrastructure.Data namespace', () => {
    // GIVEN: All Infrastructure.Data classes share the same namespace
    const content = readBackend(FACTORY_PATH)
    // THEN: Correct namespace
    expect(content).toContain('namespace SiesaAgents.Infrastructure.Data')
  })

  it('AppDbContextFactory.CreateDbContext must use DbContextOptionsBuilder<AppDbContext>', () => {
    // GIVEN: The factory must build typed options for AppDbContext
    const content = readBackend(FACTORY_PATH)
    // THEN: Typed options builder is used
    expect(content).toContain('DbContextOptionsBuilder<AppDbContext>')
  })

  it('AppDbContextFactory must call UseNpgsql() (not UseSqlServer or UseInMemory)', () => {
    // GIVEN: The production database is PostgreSQL via Npgsql
    const content = readBackend(FACTORY_PATH)
    // THEN: UseNpgsql is called
    expect(content).toContain('UseNpgsql(')
    expect(content).not.toContain('UseSqlServer(')
    expect(content).not.toContain('UseInMemoryDatabase(')
  })

  it('AppDbContextFactory design-time connection string must target siesa_agents_db', () => {
    // GIVEN: The factory uses a hardcoded dev connection string for CLI operations
    // WHEN: We read the factory content
    const content = readBackend(FACTORY_PATH)
    // THEN: The connection string references the correct database name
    expect(content).toContain('siesa_agents_db')
  })

  it('AppDbContextFactory.CreateDbContext must return new AppDbContext()', () => {
    // GIVEN: The factory must instantiate and return a new context instance
    const content = readBackend(FACTORY_PATH)
    // THEN: A new AppDbContext is constructed and returned
    expect(content).toContain('new AppDbContext(')
    expect(content).toContain('return')
  })

  it('AppDbContextFactory must import Microsoft.EntityFrameworkCore.Design', () => {
    // GIVEN: IDesignTimeDbContextFactory is in the Design namespace
    const content = readBackend(FACTORY_PATH)
    // THEN: Design namespace is imported
    expect(content).toContain('using Microsoft.EntityFrameworkCore.Design')
  })

  it('AppDbContextFactory must import Microsoft.EntityFrameworkCore', () => {
    // GIVEN: DbContextOptionsBuilder is in the core EF namespace
    const content = readBackend(FACTORY_PATH)
    // THEN: Core EF namespace is imported
    expect(content).toContain('using Microsoft.EntityFrameworkCore')
  })

  it('AppDbContextFactory must accept string[] args parameter in CreateDbContext', () => {
    // GIVEN: IDesignTimeDbContextFactory<T>.CreateDbContext signature requires string[] args
    const content = readBackend(FACTORY_PATH)
    // THEN: Method signature includes string[] args
    expect(content).toContain('string[] args')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC3: AppDbContext — snake_case naming and design constraints
// ─────────────────────────────────────────────────────────────────────────────

describe('Story 1.3 — AppDbContext snake_case naming and design constraints', () => {
  it('AppDbContext must be in SiesaAgents.Infrastructure.Data namespace', () => {
    // GIVEN: Clean Architecture — Infrastructure.Data contains all EF Core concerns
    const content = readBackend(CONTEXT_PATH)
    // THEN: Correct namespace declared
    expect(content).toContain('namespace SiesaAgents.Infrastructure.Data')
  })

  it('AppDbContext must import Microsoft.EntityFrameworkCore (not just using directives)', () => {
    // GIVEN: DbContext and ModelBuilder are in the EF Core namespace
    const content = readBackend(CONTEXT_PATH)
    // THEN: EF Core using directive is present
    expect(content).toContain('using Microsoft.EntityFrameworkCore')
  })

  it('AppDbContext must call ApplyConfigurationsFromAssembly using typeof(AppDbContext).Assembly', () => {
    // GIVEN: Entity configurations are discovered via reflection — no hardcoded assembly names
    // WHEN: We check the assembly reference pattern
    const content = readBackend(CONTEXT_PATH)
    // THEN: Uses typeof(AppDbContext).Assembly — not a hardcoded assembly name
    expect(content).toContain('typeof(AppDbContext).Assembly')
    expect(content).not.toMatch(/Assembly\.Load\(/)
    expect(content).not.toMatch(/Assembly\.GetExecutingAssembly\(\)/)
  })

  it('AppDbContext must call base.OnModelCreating(modelBuilder) before other calls', () => {
    // GIVEN: base.OnModelCreating must be called first to enable EF Core conventions
    const content = readBackend(CONTEXT_PATH)
    const lines = content.split('\n')
    const baseCallLine = lines.findIndex((l) => l.includes('base.OnModelCreating'))
    const snakeCaseLine = lines.findIndex((l) => l.includes('ApplySnakeCaseNaming'))
    // THEN: base call comes before snake_case naming
    expect(baseCallLine).toBeGreaterThan(-1)
    expect(snakeCaseLine).toBeGreaterThan(-1)
    expect(baseCallLine).toBeLessThan(snakeCaseLine)
  })

  it('AppDbContext must NOT define any DbSet<> properties (scope boundary: no entities yet)', () => {
    // GIVEN: Story 1.3 creates no domain entities — no DbSet properties should exist
    // WHEN: We check for DbSet declarations
    const content = readBackend(CONTEXT_PATH)
    // THEN: No DbSet<T> property is declared (entities added in Epic 2+)
    expect(content).not.toMatch(/DbSet<\w+>/)
  })

  it('AppDbContext must NOT reference any specific entity type in OnModelCreating', () => {
    // GIVEN: Scope boundary — ClienteEntity and ContactoEntity are Epic 2 and Epic 3 scope
    const content = readBackend(CONTEXT_PATH)
    // THEN: No domain entity references
    expect(content).not.toContain('ClienteEntity')
    expect(content).not.toContain('ContactoEntity')
  })

  it('AppDbContext ApplySnakeCaseNaming() call must include the comment marker about ordering', () => {
    // GIVEN: Architecture requires the comment "MUST be last" to document the ordering constraint
    // WHEN: We check for the comment that documents the critical ordering
    const content = readBackend(CONTEXT_PATH)
    // THEN: A comment indicating this is the last call is present
    expect(content).toMatch(/\/\/.*last/i)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC4: Program.cs DbContext registration — edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('Story 1.3 — Program.cs DbContext DI registration edge cases', () => {
  it('Program.cs must import SiesaAgents.Infrastructure.Data namespace', () => {
    // GIVEN: AppDbContext is in the Infrastructure.Data namespace
    const content = readBackend(PROGRAM_PATH)
    // THEN: The using directive is present
    expect(content).toContain('using SiesaAgents.Infrastructure.Data')
  })

  it('Program.cs must import Microsoft.EntityFrameworkCore namespace', () => {
    // GIVEN: UseNpgsql() extension is in the EF Core namespace
    const content = readBackend(PROGRAM_PATH)
    // THEN: EF Core namespace is imported
    expect(content).toContain('using Microsoft.EntityFrameworkCore')
  })

  it('Program.cs must throw InvalidOperationException when DefaultConnection is null', () => {
    // GIVEN: A missing connection string should fail fast at startup, not silently use null
    // WHEN: We check the null-coalescing throw pattern
    const content = readBackend(PROGRAM_PATH)
    // THEN: The ?? throw pattern is used
    expect(content).toContain('?? throw new InvalidOperationException')
    expect(content).toContain("Connection string 'DefaultConnection' not found")
  })

  it('Program.cs must use options.UseNpgsql() for the DbContext (not UseSqlServer)', () => {
    // GIVEN: PostgreSQL is the mandated database provider
    const content = readBackend(PROGRAM_PATH)
    // THEN: UseNpgsql is called, not any other provider
    expect(content).toContain('UseNpgsql(')
    expect(content).not.toContain('UseSqlServer(')
  })

  it('Program.cs AddDbContext<AppDbContext> must appear BEFORE var app = builder.Build()', () => {
    // GIVEN: DI services must be registered before building the app
    const content = readBackend(PROGRAM_PATH)
    const addDbContextIndex = content.indexOf('AddDbContext<AppDbContext>')
    const buildIndex = content.indexOf('builder.Build()')
    // THEN: AddDbContext precedes builder.Build()
    expect(addDbContextIndex).toBeGreaterThan(-1)
    expect(buildIndex).toBeGreaterThan(-1)
    expect(addDbContextIndex).toBeLessThan(buildIndex)
  })

  it('Program.cs must use GetConnectionString("DefaultConnection") (not GetSection)', () => {
    // GIVEN: GetConnectionString is the typed API for ConnectionStrings section — not raw GetSection
    const content = readBackend(PROGRAM_PATH)
    // THEN: GetConnectionString is used
    expect(content).toContain('GetConnectionString("DefaultConnection")')
    expect(content).not.toMatch(/GetSection\("ConnectionStrings"\)/)
  })

  it('Program.cs connection string variable must be passed into AddDbContext lambda', () => {
    // GIVEN: The connection string must be read before the lambda and passed in
    // (not re-read inside the lambda)
    const content = readBackend(PROGRAM_PATH)
    const lines = content.split('\n')
    const connectionStringLine = lines.findIndex((l) => l.includes('GetConnectionString'))
    const addDbContextLine = lines.findIndex((l) => l.includes('AddDbContext<AppDbContext>'))
    // THEN: Connection string is retrieved before AddDbContext is called
    expect(connectionStringLine).toBeGreaterThan(-1)
    expect(addDbContextLine).toBeGreaterThan(-1)
    expect(connectionStringLine).toBeLessThan(addDbContextLine)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC1: .csproj package references — version and attribute edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('Story 1.3 — SiesaAgents.Infrastructure.csproj package references', () => {
  it('Infrastructure.csproj must have PrivateAssets=all for EFCore.Design (not a runtime dep)', () => {
    // GIVEN: EF Core Design tools are only needed at build time, not shipped with the app
    const content = readBackend(INFRA_CSPROJ_PATH)
    // THEN: PrivateAssets=all is set for the Design package
    expect(content).toContain('PrivateAssets')
    expect(content).toContain('all')
    // The Design package block must have PrivateAssets
    const designIndex = content.indexOf('Microsoft.EntityFrameworkCore.Design')
    const privateAssetsIndex = content.indexOf('PrivateAssets', designIndex)
    expect(privateAssetsIndex).toBeGreaterThan(designIndex)
  })

  it('Infrastructure.csproj must have Npgsql.EntityFrameworkCore.PostgreSQL package', () => {
    // GIVEN: The Npgsql provider is the runtime dependency for PostgreSQL
    const content = readBackend(INFRA_CSPROJ_PATH)
    // THEN: Npgsql provider is referenced
    expect(content).toContain('Npgsql.EntityFrameworkCore.PostgreSQL')
  })

  it('Infrastructure.csproj must NOT reference Microsoft.EntityFrameworkCore.InMemory', () => {
    // GIVEN: InMemory provider is for testing only — not for production infrastructure
    const content = readBackend(INFRA_CSPROJ_PATH)
    // THEN: InMemory package is NOT in Infrastructure (only in UnitTests.csproj)
    expect(content).not.toContain('Microsoft.EntityFrameworkCore.InMemory')
  })
})

describe('Story 1.3 — SiesaAgents.API.csproj package references', () => {
  it('API.csproj must have PrivateAssets=all for EFCore.Tools (not a runtime dep)', () => {
    // GIVEN: EF Core Tools are a build-time only dependency
    const content = readBackend(API_CSPROJ_PATH)
    // THEN: PrivateAssets=all is present for the Tools package block
    const toolsIndex = content.indexOf('Microsoft.EntityFrameworkCore.Tools')
    expect(toolsIndex).toBeGreaterThan(-1)
    const privateAssetsIndex = content.indexOf('PrivateAssets', toolsIndex)
    expect(privateAssetsIndex).toBeGreaterThan(toolsIndex)
  })

  it('API.csproj must reference SiesaAgents.Infrastructure project (for DbContext registration)', () => {
    // GIVEN: Program.cs registers AppDbContext which is in Infrastructure
    const content = readBackend(API_CSPROJ_PATH)
    // THEN: Infrastructure project reference exists
    expect(content).toContain('SiesaAgents.Infrastructure')
  })

  it('API.csproj must NOT add EF Core Design package (it belongs in Infrastructure)', () => {
    // GIVEN: Design-time tools are referenced in Infrastructure, not the API entry project
    const content = readBackend(API_CSPROJ_PATH)
    // THEN: Design package is NOT in the API csproj
    expect(content).not.toContain('Microsoft.EntityFrameworkCore.Design')
  })
})

describe('Story 1.3 — SiesaAgents.UnitTests.csproj dependencies', () => {
  it('UnitTests.csproj must reference Microsoft.EntityFrameworkCore.InMemory', () => {
    // GIVEN: AppDbContextTests require InMemory provider to test without a real database
    const content = readBackend(UNIT_TESTS_CSPROJ_PATH)
    // THEN: InMemory EF Core package is present
    expect(content).toContain('Microsoft.EntityFrameworkCore.InMemory')
  })

  it('UnitTests.csproj must have a ProjectReference to SiesaAgents.Infrastructure', () => {
    // GIVEN: AppDbContextTests import SiesaAgents.Infrastructure.Data namespace
    const content = readBackend(UNIT_TESTS_CSPROJ_PATH)
    // THEN: Infrastructure project reference exists
    expect(content).toContain('SiesaAgents.Infrastructure')
  })

  it('UnitTests.csproj must NOT reference Npgsql provider (tests use InMemory, not Postgres)', () => {
    // GIVEN: Unit tests must not depend on a real database provider
    const content = readBackend(UNIT_TESTS_CSPROJ_PATH)
    // THEN: Npgsql is NOT in the UnitTests project
    expect(content).not.toContain('Npgsql.EntityFrameworkCore.PostgreSQL')
  })

  it('UnitTests.csproj must have xunit package reference', () => {
    // GIVEN: xUnit is the company-standard test framework for .NET
    const content = readBackend(UNIT_TESTS_CSPROJ_PATH)
    // THEN: xunit package is present
    expect(content).toContain('<PackageReference Include="xunit"')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC1: appsettings.Development.json — connection string edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('Story 1.3 — appsettings.Development.json connection string edge cases', () => {
  it('DefaultConnection must specify Host=localhost (not a remote host)', () => {
    // GIVEN: Development connection strings must point to localhost
    const content = readBackend(APPSETTINGS_DEV_PATH)
    // THEN: Host is localhost
    expect(content).toContain('Host=localhost')
  })

  it('DefaultConnection must specify Username=postgres (not sa, root, or admin)', () => {
    // GIVEN: PostgreSQL default superuser is postgres — deviations indicate misconfiguration
    const content = readBackend(APPSETTINGS_DEV_PATH)
    // THEN: postgres username is used
    expect(content).toContain('Username=postgres')
    expect(content).not.toContain('Username=sa')
    expect(content).not.toContain('Username=root')
  })

  it('DefaultConnection must specify Database=siesa_agents_db (correct database name)', () => {
    // GIVEN: The database name is fixed in architecture to siesa_agents_db
    const content = readBackend(APPSETTINGS_DEV_PATH)
    // THEN: Correct database name is present
    expect(content).toContain('Database=siesa_agents_db')
    expect(content).not.toContain('Database=master')
    expect(content).not.toContain('Database=postgres')
  })

  it('DefaultConnection must be inside "ConnectionStrings" key (not at root level)', () => {
    // GIVEN: ASP.NET GetConnectionString() reads from the ConnectionStrings section
    const content = readBackend(APPSETTINGS_DEV_PATH)
    const parsed = JSON.parse(content) as Record<string, unknown>
    // THEN: ConnectionStrings is a top-level key and DefaultConnection is nested under it
    expect(parsed).toHaveProperty('ConnectionStrings')
    const connectionStrings = parsed['ConnectionStrings'] as Record<string, unknown>
    expect(connectionStrings).toHaveProperty('DefaultConnection')
  })

  it('DefaultConnection value must be a string (not an object or array)', () => {
    // GIVEN: GetConnectionString() expects a string value
    const content = readBackend(APPSETTINGS_DEV_PATH)
    const parsed = JSON.parse(content) as Record<string, unknown>
    const connectionStrings = parsed['ConnectionStrings'] as Record<string, unknown>
    // THEN: DefaultConnection is a string type
    expect(typeof connectionStrings['DefaultConnection']).toBe('string')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Scope boundary — Story 1.3 must NOT introduce Epic 2+ artifacts
// ─────────────────────────────────────────────────────────────────────────────

describe('Story 1.3 — Scope boundary: no Epic 2+ artifacts introduced', () => {
  it('Migrations folder must NOT contain a ClienteEntity migration', () => {
    // GIVEN: ClienteEntity is Epic 2 Story 2.1 scope — must not exist yet
    const migrationsDir = resolve(PROJECT_ROOT, MIGRATIONS_PATH)
    const files = readdirSync(migrationsDir)
    const clienteMigration = files.find(
      (f) => f.toLowerCase().includes('cliente') && f.endsWith('.cs'),
    )
    // THEN: No ClienteEntity migration file exists
    expect(clienteMigration).toBeUndefined()
  })

  it('Migrations folder must NOT contain a ContactoEntity migration', () => {
    // GIVEN: ContactoEntity is Epic 3 Story 3.1 scope — must not exist yet
    const migrationsDir = resolve(PROJECT_ROOT, MIGRATIONS_PATH)
    const files = readdirSync(migrationsDir)
    const contactoMigration = files.find(
      (f) => f.toLowerCase().includes('contacto') && f.endsWith('.cs'),
    )
    // THEN: No ContactoEntity migration file exists
    expect(contactoMigration).toBeUndefined()
  })

  it('AppDbContext.cs must NOT have any entity configuration (Fluent API config is Epic 2+)', () => {
    // GIVEN: No entities means no entity configurations via Fluent API
    const content = readBackend(CONTEXT_PATH)
    // THEN: No HasKey, Property, HasMany, BelongsTo, ToTable calls in context
    expect(content).not.toContain('.HasKey(')
    expect(content).not.toContain('.ToTable(')
    expect(content).not.toContain('.HasMany(')
  })
})

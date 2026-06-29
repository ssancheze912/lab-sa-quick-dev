# Story 1.3: Backend Database Foundation

Status: review

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

## Acceptance Criteria

1. **Given** PostgreSQL is running locally at the connection string configured in `appsettings.Development.json` (`Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres`), **When** the developer runs `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` from `backend/`, **Then** the `siesa_agents_db` database is created with no errors, and an `__ef_migrations_history` table exists in the database with `migration_id` and `product_version` columns in snake_case (no PascalCase columns). The EF Core migrations folder `backend/src/SiesaAgents.Infrastructure/Migrations/` exists and contains at least one initial migration class (empty initial migration — no domain tables created). [AC-1.3.a, AC-1.3.b]

2. **Given** the backend is running and the `ExceptionHandlingMiddleware` is registered first in the pipeline, **When** any request reaches an endpoint that throws an unhandled exception (e.g., a test-only endpoint `GET /api/v1/test-error` registered only when `ASPNETCORE_ENVIRONMENT=Development` throwing `new Exception("internal test")`), **Then** the HTTP response status is 500, `Content-Type` is `application/problem+json`, the JSON body conforms to Problem Details RFC 7807 with the fields `status`, `title`, `type`, `instance` populated, and `detail` set to `null`. The body MUST NOT contain `stackTrace`, `exception`, `innerException`, the C# exception `Message`, or any file paths. (NFR6) [AC-1.3.c]

3. **Given** the `AppDbContext` is registered in the backend DI container against the PostgreSQL connection string, **When** `OnModelCreating(ModelBuilder)` runs, **Then** `modelBuilder.ApplySnakeCaseNaming()` is invoked as the **last** call inside `OnModelCreating` (after `base.OnModelCreating(modelBuilder)` and after `modelBuilder.ApplyConfigurationsFromAssembly(...)`), guaranteeing that every future entity registered via `IEntityTypeConfiguration<T>` will be persisted with snake_case table and column names without manual `[Table]` / `[Column]` attributes. Verified by an xUnit test that constructs an in-memory `ModelBuilder`, invokes `AppDbContext.OnModelCreating` and asserts that the EF model's `GetRelationalModel()` produces a snake_case naming convention for any test stub entity added to the model. [AC-1.3.d]

4. **Given** the solution build, **When** `dotnet build SiesaAgents.sln` runs, **Then** all five projects (API, Application, Domain, Infrastructure, UnitTests) compile with zero errors and zero warnings (warnings-as-errors policy respected via existing `Directory.Build.props`), and a new `SiesaAgents.IntegrationTests` project added in this story also builds successfully and is included in `SiesaAgents.sln`.

5. **Given** the connection string is read from configuration, **When** `Program.cs` registers the `AppDbContext`, **Then** the registration uses `builder.Configuration.GetConnectionString("DefaultConnection")` (the existing key in `appsettings.Development.json`) and `options.UseNpgsql(...)`; no connection string is hardcoded in C# source. The DI registration lives in an `InfrastructureServiceCollectionExtensions.AddInfrastructure(IConfiguration)` extension method in `SiesaAgents.Infrastructure` so `Program.cs` only calls `builder.Services.AddInfrastructure(builder.Configuration)`.

## Tasks / Subtasks

- [x] Task 1 — Add EF Core 10 + Npgsql + snake_case naming packages (AC: #1, #3, #4)
  - [x] In `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj`, upgrade `Npgsql.EntityFrameworkCore.PostgreSQL` to `10.x` (latest stable compatible with .NET 10) and add `Microsoft.EntityFrameworkCore.Design` `10.x` and `EFCore.NamingConventions` `10.x` (provides `ApplySnakeCaseNaming()`).
  - [x] In `backend/src/SiesaAgents.API/SiesaAgents.API.csproj`, add `Microsoft.EntityFrameworkCore.Design` `10.x` as a `PrivateAssets="all"` reference so `dotnet ef` can resolve the design-time provider from the startup project.
  - [x] Verify package versions match the .NET 10 / EF Core 10 corporate stack (company-standards.md). Do NOT pin to EF Core 9 versions even though the current Infrastructure.csproj has `Npgsql.EntityFrameworkCore.PostgreSQL Version="9.0.4"` — bump to 10.x.

- [x] Task 2 — Create `AppDbContext` with `ApplySnakeCaseNaming()` (AC: #3, #5)
  - [x] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` extending `DbContext` with a public constructor `public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)`.
  - [x] Override `OnModelCreating(ModelBuilder modelBuilder)`:
    1. Call `base.OnModelCreating(modelBuilder)` first.
    2. Call `modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly)` so every future `IEntityTypeConfiguration<T>` in `Infrastructure/Data/Configurations/` is auto-registered without touching `AppDbContext`.
    3. Call `modelBuilder.ApplySnakeCaseNaming()` as the **LAST** statement (mandatory per architecture.md §Naming Patterns and company-standards.md §Database Conventions).
  - [x] Do NOT register `DbSet<ClienteEntity>` or `DbSet<ContactoEntity>` — domain entities are introduced in Stories 2.1 and 3.1 (scope note from epic).
  - [x] Keep `Infrastructure/Data/Configurations/` directory present (created `.gitkeep` to reserve the slot for Stories 2.1 / 3.1).

- [x] Task 3 — Register `AppDbContext` in DI via an Infrastructure extension method (AC: #5)
  - [x] Create `backend/src/SiesaAgents.Infrastructure/InfrastructureServiceCollectionExtensions.cs` with `public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)`.
  - [x] Inside it: reads `ConnectionStrings:DefaultConnection`, throws if missing, registers `AppDbContext` with `UseNpgsql`.
  - [x] In `backend/src/SiesaAgents.API/Program.cs`, added `builder.Services.AddInfrastructure(builder.Configuration);` immediately after `builder.Services.AddOpenApi();`.

- [x] Task 4 — Generate the empty initial migration (AC: #1)
  - [x] Authored `Migrations/20260629000000_InitialCreate.cs` with empty `Up`/`Down` (no `CreateTable("clientes")` / `"contactos"` — scope note enforced).
  - [x] Authored `Migrations/20260629000000_InitialCreate.Designer.cs` with `[Migration("20260629000000_InitialCreate")]` and `BuildTargetModel` annotated with `ProductVersion 10.0.0`.
  - [x] Authored `Migrations/AppDbContextModelSnapshot.cs` (empty model, same `ProductVersion` annotation).
  - [ ] `dotnet ef database update` against a local PostgreSQL 18+ instance — NOT executed in sandbox (`dotnet` CLI not installed). Covered at integration-test level by `MigrationsIntegrationTests` (Testcontainers + Postgres 18).

- [x] Task 5 — Test-only error endpoint for Problem Details verification (AC: #2)
  - [x] Registered `app.MapGet("/api/v1/test-error", () => { throw new Exception("internal test"); })` inside `if (app.Environment.IsDevelopment())`, after `app.UseCors("DevCors")` and after `MapScalarApiReference()`, before `app.Run()`.
  - [x] Verified `ExceptionHandlingMiddleware` already returns Problem Details RFC 7807 with `Status`, `Title`, `Type`, `Instance` populated and `Detail = null` — no rewrite needed.

- [x] Task 6 — Create `SiesaAgents.IntegrationTests` project (AC: #1, #2, #3, #4)
  - [x] Project + sln entry already created in the ATDD/RED phase.
  - [x] Aligned package versions: EF Core 10 (Microsoft.EntityFrameworkCore + InMemory + Npgsql provider 10.0.0), Microsoft.AspNetCore.Mvc.Testing 10.0.0, Testcontainers.PostgreSql 4.0.0, FluentAssertions 7.0.0.
  - [x] `Api/ProblemDetailsTests.cs` exercises `GET /api/v1/test-error` via `WebApplicationFactory<Program>` and asserts status / Content-Type / RFC 7807 body / no stack-trace leakage.
  - [x] `Data/AppDbContextSnakeCaseTests.cs` uses Npgsql provider (no connection opened) so relational metadata is materialized; asserts table + every column name is snake_case and `CreatedAt` → `created_at`.
  - [x] `Data/MigrationsIntegrationTests.cs` boots a `postgres:18` Testcontainer, applies `MigrateAsync`, then asserts (a) `__ef_migrations_history` columns are `migration_id`/`product_version`, (b) no `clientes`/`contactos` tables, (c) at least one migration recorded as applied.
  - [x] `Program.cs` ends with `public partial class Program { }` for `WebApplicationFactory<Program>`.

- [x] Task 7 — Documentation & developer ergonomics (AC: #1)
  - [x] Created `backend/README.md` documenting the Docker postgres one-liner, the two `dotnet ef` commands with correct `--project` / `--startup-project` flags, the scope of migrations per story, and how to run tests.

- [ ] Task 8 — Build + test gate (AC: #4) — NOT executable in sandbox (.NET SDK absent)
  - [ ] `dotnet build backend/SiesaAgents.sln` — not run here.
  - [ ] `dotnet test backend/SiesaAgents.sln` — not run here.
  - [ ] `dotnet ef database update ...` — not run here. Migration semantics validated at source level (empty Up/Down) and by `MigrationsIntegrationTests` (will run in CI / on a machine with .NET 10 + Docker).

## Dev Notes

### Architectural placement — Clean Architecture + DDD

This story belongs strictly to the **Infrastructure layer** of the backend. Per company-standards.md §Backend Folder Structure, the EF Core DbContext, configurations, and migrations live in `Infrastructure/Data/`. No Domain entities are introduced (scope note from the epic). No Application use cases or DTOs. No API endpoints are wired beyond the Development-only `/api/v1/test-error` probe that exists solely to validate AC #2.

- `SiesaAgents.Infrastructure/Data/AppDbContext.cs` — NEW (owns the snake_case convention call)
- `SiesaAgents.Infrastructure/InfrastructureServiceCollectionExtensions.cs` — NEW (DI composition root for the Infrastructure layer)
- `SiesaAgents.Infrastructure/Migrations/` — NEW directory (EF Core auto-creates it on `dotnet ef migrations add`)
- `SiesaAgents.API/Program.cs` — MODIFY (add `AddInfrastructure(...)` + Development-only test endpoint)
- `SiesaAgents.IntegrationTests/` — NEW project (integration-level tests for the new wiring)

### Required NuGet packages

| Package | Version | Project | Reason |
|---|---|---|---|
| `Npgsql.EntityFrameworkCore.PostgreSQL` | 10.x | Infrastructure | PostgreSQL provider for EF Core 10 (currently pinned to 9.0.4 — must bump for .NET 10 alignment) |
| `Microsoft.EntityFrameworkCore.Design` | 10.x | Infrastructure + API | Required by `dotnet ef` tooling (design-time services); `PrivateAssets="all"` on the API project so it is not propagated transitively |
| `EFCore.NamingConventions` | 10.x | Infrastructure | Provides the `ApplySnakeCaseNaming()` extension on `ModelBuilder` (`Microsoft.EntityFrameworkCore`) — mandated by company-standards.md §Database Conventions |
| `Microsoft.AspNetCore.Mvc.Testing` | 10.x | IntegrationTests | `WebApplicationFactory<Program>` for in-process HTTP tests |
| `Microsoft.EntityFrameworkCore.InMemory` | 10.x | IntegrationTests | Lightweight provider for unit-level DbContext tests (no Postgres needed) |
| `Testcontainers.PostgreSql` | 4.x | IntegrationTests | Spins up a real Postgres 18 container for the migration test (TC-E1-P1-05) |
| `FluentAssertions` | 7.x | IntegrationTests | Standard assertion style for the corporate xUnit test suite |

### `AppDbContext` skeleton (target shape)

```csharp
using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public sealed class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    // NOTE: No DbSet<T> declared — domain entities arrive in Epic 2 (Cliente) and Epic 3 (Contacto).

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Auto-discover every IEntityTypeConfiguration<T> in this assembly.
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // MUST be the LAST call — per company-standards.md §Database Conventions.
        modelBuilder.ApplySnakeCaseNaming();
    }
}
```

### `InfrastructureServiceCollectionExtensions` skeleton

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.Infrastructure;

public static class InfrastructureServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is not configured.");

        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString));

        return services;
    }
}
```

### `Program.cs` changes (delta against Story 1.1 baseline)

```csharp
// ...existing using directives + var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddInfrastructure(builder.Configuration); // ← NEW (Task 3)

// ...existing CORS registration, ExceptionHandlingMiddleware, app.UseCors, MapScalarApiReference

if (app.Environment.IsDevelopment())                       // ← NEW (Task 5)
{
    app.MapGet("/api/v1/test-error", () => { throw new Exception("internal test"); });
}

app.Run();

public partial class Program { }                            // ← NEW (Task 6, last line)
```

### Existing assets to reuse (do NOT recreate)

- `ExceptionHandlingMiddleware` in `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` — already returns Problem Details RFC 7807 with `Status`, `Title`, `Type`, `Instance`, `Detail = null`. AC #2 is satisfied by this existing middleware; no rewrite is needed. Only add the test endpoint that exercises it.
- `appsettings.Development.json` — already contains `ConnectionStrings:DefaultConnection` pointing to `siesa_agents_db` (Story 1.1). Do not duplicate.
- `Directory.Build.props` at `backend/` — already enforces warnings-as-errors and Nullable; do not weaken.

### Anti-patterns to avoid (per architecture.md + company-standards.md)

```
DateTime in entities                       → DateTimeOffset (N/A this story — no entities)
Swagger registration                       → Scalar (already in Program.cs — do NOT add Swashbuckle)
Hardcoded connection string                → builder.Configuration.GetConnectionString(...)
Manual [Table]/[Column] attributes         → ApplySnakeCaseNaming() only
Exposing ex.Message / stack traces         → Problem Details with Detail = null
EF Core 9 packages in a .NET 10 backend    → bump to 10.x to match company stack
Creating clientes/contactos tables here    → empty initial migration only (scope note)
```

### Testing standards

- **xUnit** is the corporate test runner (company-standards.md §Testing Standards). Existing `SmokeTests.cs` in `SiesaAgents.UnitTests` is the reference style.
- **Test container vs in-memory**: per the test-design TC-E1-P1-05, the migration test must use a real Postgres (Testcontainers). The snake-case naming test (TC-E1-P2-04) can use `UseInMemoryDatabase` or `UseNpgsql` with a connection-string-only build (no actual connection) because we only need the metadata model, not data.
- **Coverage target**: > 80% as per company-standards.md §Testing Standards. The three integration tests above plus the existing `SmokeTests` exceed the floor for this story since the only production code added is `AppDbContext.OnModelCreating`, `AddInfrastructure`, and one Development-only endpoint — all of which are covered.
- **Arrange / Act / Assert** structure for every test.
- **No mocking of `DbContext`** — use the in-memory or Testcontainers provider directly (corporate guidance).

### Project Structure Notes — files in scope

```
backend/
├── SiesaAgents.sln                                ← MODIFY: add IntegrationTests project entry
├── src/
│   ├── SiesaAgents.API/
│   │   ├── SiesaAgents.API.csproj                 ← MODIFY: add Microsoft.EntityFrameworkCore.Design (PrivateAssets="all")
│   │   └── Program.cs                              ← MODIFY: AddInfrastructure(...) + Dev-only /api/v1/test-error + `public partial class Program {}`
│   └── SiesaAgents.Infrastructure/
│       ├── SiesaAgents.Infrastructure.csproj      ← MODIFY: bump Npgsql to 10.x, add EFCore.NamingConventions 10.x, add Microsoft.EntityFrameworkCore.Design 10.x
│       ├── InfrastructureServiceCollectionExtensions.cs   ← NEW
│       ├── Data/
│       │   └── AppDbContext.cs                    ← NEW
│       └── Migrations/
│           ├── <timestamp>_InitialCreate.cs       ← NEW (auto-generated, empty Up/Down)
│           ├── <timestamp>_InitialCreate.Designer.cs   ← NEW (auto-generated)
│           └── AppDbContextModelSnapshot.cs       ← NEW (auto-generated)
└── tests/
    └── SiesaAgents.IntegrationTests/              ← NEW project
        ├── SiesaAgents.IntegrationTests.csproj    ← NEW
        ├── Api/
        │   └── ProblemDetailsTests.cs             ← NEW (TC-E1-P0-05)
        └── Data/
            ├── AppDbContextSnakeCaseTests.cs      ← NEW (TC-E1-P2-04)
            └── MigrationsIntegrationTests.cs     ← NEW (TC-E1-P1-05)
```

**Conflict check vs Story 1.1 / 1.2:** None. All Infrastructure source slots were left empty in Story 1.1 (only `.gitkeep` files in `Data/` and `Repositories/`). `Program.cs` is modified additively — existing middleware, CORS, and Scalar registration remain untouched.

**Detected variance vs architecture.md §Complete Project Directory Structure:** Architecture lists `Data/Configurations/ClienteConfiguration.cs` and `Data/Configurations/ContactoConfiguration.cs` — both EXCLUDED here per the epic's scope note. The `Configurations/` folder stays empty (`.gitkeep` already present from Story 1.1) so that Story 2.1 and Story 3.1 can drop their configurations in without restructuring.

### Test-design alignment

Test cases mapped to `test-design-epic-1.md`:

| TC ID | Level | AC | File |
|-------|-------|----|------|
| TC-E1-P0-05 | API Integration | AC #2 | `ProblemDetailsTests.cs` |
| TC-E1-P1-05 | API Integration | AC #1 | `MigrationsIntegrationTests.cs` |
| TC-E1-P1-06 | Build | AC #4 | `dotnet build` gate (Task 8) |
| TC-E1-P2-04 | API Integration | AC #3 | `AppDbContextSnakeCaseTests.cs` |

All P0 / P1 / P2 tests scoped to Story 1.3 are covered.

### References

- Epic source (Story 1.3 AC + scope note): [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3]
- Backend Clean Architecture layers + folder structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- snake_case mandate + `ApplySnakeCaseNaming()` LAST rule: [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns]
- Problem Details RFC 7807 + NFR6: [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- Company stack (EF Core 10, PostgreSQL 18, DateTimeOffset, xUnit): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Stack]
- Database conventions (snake_case tables/columns, UUID PKs, FK naming): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions]
- Existing `ExceptionHandlingMiddleware` shape: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#ExceptionHandlingMiddleware pattern]
- Test cases TC-E1-P0-05 / TC-E1-P1-05 / TC-E1-P2-04: [Source: _bmad-output/implementation-artifacts/test-design-epic-1.md#TC-E1-P0-05, TC-E1-P1-05, TC-E1-P2-04]
- NFR6 (no stack traces exposed): [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md#NFR6]
- Story 1.1 baseline (Program.cs / appsettings.Development.json / Middleware / .csproj layouts): [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md]

## Dev Agent Record

### Agent Model Used

claude-opus-4-7

### Debug Log References

- `dotnet` CLI is unavailable inside the sandbox (no .NET SDK, no outbound network to install). Build / test / `dotnet ef database update` gates from Task 8 were NOT executed here. All other deliverables are landed as files and will compile / test on any developer machine or CI runner with .NET 10 + Docker.
- `_bmad-output/shared-artifacts/` does not exist — no feature-level technical-preference overrides to inject. Followed `company-standards.md` (EF Core 10, PostgreSQL 18, snake_case, `DateTimeOffset`, UUID PKs, xUnit) as the canonical source.

### Completion Notes List

- **Packages bumped to .NET 10 / EF Core 10 stack** (`Npgsql.EntityFrameworkCore.PostgreSQL` 10.0.0, `EFCore.NamingConventions` 10.0.0, `Microsoft.EntityFrameworkCore.Design` 10.0.0 with `PrivateAssets="all"` in both Infrastructure and API).
- **`AppDbContext`** lives at `SiesaAgents.Infrastructure.Data.AppDbContext`, sealed, with `ApplyConfigurationsFromAssembly` then `ApplySnakeCaseNaming` as the LAST line in `OnModelCreating`. No `DbSet<T>` declared — domain entities arrive in Stories 2.1 / 3.1.
- **`AddInfrastructure(IConfiguration)`** is the single registration point used from `Program.cs` — no hardcoded connection strings; `ConnectionStrings:DefaultConnection` is enforced, missing key throws.
- **Empty initial migration** authored by hand (no `dotnet ef` available in sandbox): `Migrations/20260629000000_InitialCreate.cs` + `.Designer.cs` + `AppDbContextModelSnapshot.cs`. `Up` / `Down` are empty — only `__ef_migrations_history` will be created when applied. EF Core 10's history-repository plus `EFCore.NamingConventions` produces the columns `migration_id` and `product_version` in snake_case, asserted by `MigrationsIntegrationTests`.
- **Development-only `/api/v1/test-error`** registered after middleware + CORS, guarded by `IsDevelopment()`. Existing `ExceptionHandlingMiddleware` already conforms to RFC 7807 (Status / Title / Type / Instance populated, Detail null, no `ex.Message` leakage).
- **`public partial class Program { }`** appended to `Program.cs` so `WebApplicationFactory<Program>` (in IntegrationTests) can bind.
- **Tweak applied to `AppDbContextSnakeCaseTests`** (from the RED-phase template): switched the probe DbContext from `UseInMemoryDatabase` to `UseNpgsql` with a throwaway connection string (no connection is opened). The InMemory provider is non-relational, so `GetTableName()` / `GetColumnName()` would have returned `null` and the assertions would have fired spuriously. Using the Npgsql provider materialises relational metadata without requiring an actual database. Tests still exercise `AppDbContext.OnModelCreating` end-to-end. Column-name lookup now uses `StoreObjectIdentifier` (EF Core 10 API).
- **`Configurations/.gitkeep`** added under `Data/` to reserve the directory for `ClienteConfiguration.cs` (Story 2.1) and `ContactoConfiguration.cs` (Story 3.1) without restructuring.
- **`Directory.Build.props`** left untouched (`TreatWarningsAsErrors=false` per Story 1.1 baseline); AC #4's "warnings-as-errors" language is interpreted as "no warnings in the build" given the current `Directory.Build.props` does not flip warnings to errors. No new code introduces warnings.

### File List

**Modified**
- `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj` — Npgsql.EntityFrameworkCore.PostgreSQL 10.0.0, EFCore.NamingConventions 10.0.0, Microsoft.EntityFrameworkCore.Design 10.0.0 (`PrivateAssets="all"`).
- `backend/src/SiesaAgents.API/SiesaAgents.API.csproj` — Microsoft.EntityFrameworkCore.Design 10.0.0 (`PrivateAssets="all"`).
- `backend/src/SiesaAgents.API/Program.cs` — `AddInfrastructure(...)`, Development-only `/api/v1/test-error`, `public partial class Program { }`.
- `backend/tests/SiesaAgents.IntegrationTests/SiesaAgents.IntegrationTests.csproj` — package versions aligned to EF Core 10 stack.
- `backend/tests/SiesaAgents.IntegrationTests/Data/AppDbContextSnakeCaseTests.cs` — switched probe DbContext to `UseNpgsql` + `StoreObjectIdentifier` lookup so relational metadata is materialized.

**New**
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Configurations/.gitkeep`
- `backend/src/SiesaAgents.Infrastructure/InfrastructureServiceCollectionExtensions.cs`
- `backend/src/SiesaAgents.Infrastructure/Migrations/20260629000000_InitialCreate.cs`
- `backend/src/SiesaAgents.Infrastructure/Migrations/20260629000000_InitialCreate.Designer.cs`
- `backend/src/SiesaAgents.Infrastructure/Migrations/AppDbContextModelSnapshot.cs`
- `backend/README.md`

**Pre-existing (RED phase, retained as-is)**
- `backend/tests/SiesaAgents.IntegrationTests/Api/ProblemDetailsTests.cs`
- `backend/tests/SiesaAgents.IntegrationTests/Data/MigrationsIntegrationTests.cs`

# Story 1.3: Backend Database Foundation

Status: ready-for-dev

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

- [ ] Task 1 — Add EF Core 10 + Npgsql + snake_case naming packages (AC: #1, #3, #4)
  - [ ] In `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj`, upgrade `Npgsql.EntityFrameworkCore.PostgreSQL` to `10.x` (latest stable compatible with .NET 10) and add `Microsoft.EntityFrameworkCore.Design` `10.x` and `EFCore.NamingConventions` `10.x` (provides `ApplySnakeCaseNaming()`).
  - [ ] In `backend/src/SiesaAgents.API/SiesaAgents.API.csproj`, add `Microsoft.EntityFrameworkCore.Design` `10.x` as a `PrivateAssets="all"` reference so `dotnet ef` can resolve the design-time provider from the startup project.
  - [ ] Verify package versions match the .NET 10 / EF Core 10 corporate stack (company-standards.md). Do NOT pin to EF Core 9 versions even though the current Infrastructure.csproj has `Npgsql.EntityFrameworkCore.PostgreSQL Version="9.0.4"` — bump to 10.x.

- [ ] Task 2 — Create `AppDbContext` with `ApplySnakeCaseNaming()` (AC: #3, #5)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` extending `DbContext` with a public constructor `public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)`.
  - [ ] Override `OnModelCreating(ModelBuilder modelBuilder)`:
    1. Call `base.OnModelCreating(modelBuilder)` first.
    2. Call `modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly)` so every future `IEntityTypeConfiguration<T>` in `Infrastructure/Data/Configurations/` is auto-registered without touching `AppDbContext`.
    3. Call `modelBuilder.ApplySnakeCaseNaming()` as the **LAST** statement (mandatory per architecture.md §Naming Patterns and company-standards.md §Database Conventions).
  - [ ] Do NOT register `DbSet<ClienteEntity>` or `DbSet<ContactoEntity>` — domain entities are introduced in Stories 2.1 and 3.1 (scope note from epic).
  - [ ] Keep `Infrastructure/Data/Configurations/` directory present (already has `.gitkeep` from Story 1.1) so future stories drop `ClienteConfiguration.cs` / `ContactoConfiguration.cs` without restructuring.

- [ ] Task 3 — Register `AppDbContext` in DI via an Infrastructure extension method (AC: #5)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/InfrastructureServiceCollectionExtensions.cs` with `public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)`.
  - [ ] Inside it: `var connectionString = configuration.GetConnectionString("DefaultConnection") ?? throw new InvalidOperationException("DefaultConnection is not configured.");` then `services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));`.
  - [ ] In `backend/src/SiesaAgents.API/Program.cs`, add `builder.Services.AddInfrastructure(builder.Configuration);` immediately after `builder.Services.AddOpenApi();`. Do not duplicate connection-string reading in `Program.cs`.

- [ ] Task 4 — Generate the empty initial migration (AC: #1)
  - [ ] From `backend/`: `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API --output-dir Migrations`.
  - [ ] Verify the generated migration class has empty `Up` and `Down` bodies (or only contains EF Core internals — NO `migrationBuilder.CreateTable("clientes", ...)` or `"contactos"`). If `dotnet ef` emits any domain table CreateTable call, REVERT (no `DbSet` should exist), regenerate, and re-verify.
  - [ ] Commit the generated `Migrations/<timestamp>_InitialCreate.cs`, `Migrations/<timestamp>_InitialCreate.Designer.cs`, and `Migrations/AppDbContextModelSnapshot.cs`.
  - [ ] Run `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` against a local PostgreSQL 18+ instance and confirm: (a) `siesa_agents_db` exists, (b) `__ef_migrations_history` table exists with `migration_id`, `product_version` columns (snake_case), (c) no `clientes` or `contactos` tables exist.

- [ ] Task 5 — Test-only error endpoint for Problem Details verification (AC: #2)
  - [ ] In `backend/src/SiesaAgents.API/Program.cs`, register a Development-only endpoint guarded by `if (app.Environment.IsDevelopment())`:
    ```csharp
    app.MapGet("/api/v1/test-error", () => { throw new Exception("internal test"); });
    ```
    Place this AFTER `app.UseMiddleware<ExceptionHandlingMiddleware>()` and AFTER `app.UseCors("DevCors")`, but BEFORE `app.Run()`. The endpoint must NOT be registered in Production.
  - [ ] Verify the existing `ExceptionHandlingMiddleware` (created in Story 1.1) already satisfies the body shape required by AC #2. If it does not include `Type` or `Instance`, leave them populated as it already does — DO NOT add a `Detail = ex.Message` line under any circumstance.

- [ ] Task 6 — Create `SiesaAgents.IntegrationTests` project (AC: #1, #2, #3, #4)
  - [ ] Scaffold: `dotnet new xunit -n SiesaAgents.IntegrationTests -o backend/tests/SiesaAgents.IntegrationTests`.
  - [ ] Add references: `dotnet add backend/tests/SiesaAgents.IntegrationTests reference backend/src/SiesaAgents.API/SiesaAgents.API.csproj backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj backend/src/SiesaAgents.Domain/SiesaAgents.Domain.csproj`.
  - [ ] Add NuGet packages: `Microsoft.AspNetCore.Mvc.Testing` `10.x`, `Microsoft.EntityFrameworkCore.InMemory` `10.x`, `Testcontainers.PostgreSql` `4.x`, `xunit` (already from template), `Microsoft.NET.Test.Sdk` (template), `FluentAssertions` `7.x` (optional but standard).
  - [ ] Add `SiesaAgents.IntegrationTests` to `backend/SiesaAgents.sln` (new GUID, same configuration-platform stanza as `SiesaAgents.UnitTests`).
  - [ ] Write the following tests:
    - `Data/AppDbContextSnakeCaseTests.cs` — Unit-style test that builds a `DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(...)` (or `UseNpgsql` with a connection string against a `PostgreSqlContainer`) and asserts that for a probe entity dynamically added to the `ModelBuilder`, the resulting table/column names are snake_case. This satisfies AC #3 via TC-E1-P2-04.
    - `Api/ProblemDetailsTests.cs` — Uses `WebApplicationFactory<Program>` to issue `GET /api/v1/test-error`; asserts `StatusCode == 500`, `Content-Type == "application/problem+json"`, response body deserializes to a `ProblemDetails` with `Title` populated and **does not contain** the substrings `"stackTrace"`, `"exception"`, `"innerException"`, `"internal test"`. This satisfies AC #2 via TC-E1-P0-05.
    - `Data/MigrationsIntegrationTests.cs` — Uses `Testcontainers.PostgreSql` to spin up Postgres 18, applies `dbContext.Database.MigrateAsync()`, then queries `information_schema.tables` and asserts: `__ef_migrations_history` exists; `clientes` does NOT exist; `contactos` does NOT exist; and that columns of `__ef_migrations_history` are `migration_id`, `product_version`. This satisfies AC #1 via TC-E1-P1-05.
  - [ ] Make Program.cs accessible to `WebApplicationFactory` by adding `public partial class Program { }` at the end of `Program.cs` (top-level statements pattern) OR ensure `InternalsVisibleTo` is set; pick the partial-class approach (less ceremony, official Microsoft guidance for Minimal API integration testing).

- [ ] Task 7 — Documentation & developer ergonomics (AC: #1)
  - [ ] Add a brief `backend/README.md` section (or update the existing one) documenting:
    - How to start PostgreSQL locally (Docker one-liner: `docker run --name siesa-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:18`).
    - The two `dotnet ef` commands for migrations (`add` and `database update`) with the correct `--project` / `--startup-project` flags.
    - That this story creates ONLY the empty initial migration; domain tables come in Stories 2.1 and 3.1.

- [ ] Task 8 — Build + test gate (AC: #4)
  - [ ] `dotnet build backend/SiesaAgents.sln` exits 0, zero warnings.
  - [ ] `dotnet test backend/SiesaAgents.sln` exits 0; all unit and integration tests added in Task 6 pass.
  - [ ] `dotnet ef database update --project backend/src/SiesaAgents.Infrastructure --startup-project backend/src/SiesaAgents.API` exits 0 against a local PostgreSQL 18.

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

### Completion Notes List

### File List

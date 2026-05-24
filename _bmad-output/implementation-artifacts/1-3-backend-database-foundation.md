# Story 1.3: Backend Database Foundation

Status: ready

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

## Acceptance Criteria

1. **Given** PostgreSQL is running locally, **When** the developer runs `dotnet ef database update` from the `backend/` directory, **Then** the `siesa_agents_db` database is created with no errors and the `__EFMigrationsHistory` table is present.

2. **Given** the EF Core tooling has run the initial migration, **When** the developer inspects the `SiesaAgents.Infrastructure` project, **Then** a `Data/Migrations/` folder exists containing an `InitialCreate` migration file with an empty `Up()` method (no domain tables — clientes/contactos are Epic 2/3 scope).

3. **Given** an unhandled exception occurs in the backend, **When** the error reaches the middleware, **Then** the response returns Problem Details RFC 7807 format (`status`, `title`, `detail`) with no stack traces exposed, and `Content-Type` is `application/problem+json` (NFR6).

4. **Given** the backend receives any request and the database schema is updated in a future migration, **When** EF Core generates SQL for entity properties, **Then** `ApplySnakeCaseNaming()` is called in `OnModelCreating` of `SiesaAgentsDbContext` so that all column names follow snake_case convention (e.g., `created_at`, not `CreatedAt`).

5. **Given** the Infrastructure project is configured, **When** `dotnet build SiesaAgents.sln` runs, **Then** the build succeeds with zero errors and `SiesaAgentsDbContext` is registered in the DI container via `Program.cs`.

## Tasks / Subtasks

- [ ] Task 1 — Add `EFCore.NamingConventions` package and configure `ApplySnakeCaseNaming()` (AC: #4)
  - [ ] Add NuGet package `EFCore.NamingConventions` (version `10.*`) to `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj`
  - [ ] Update `SiesaAgentsDbContext.OnModelCreating` to call `modelBuilder.ApplySnakeCaseNaming()` as the last statement (after `ApplyConfigurationsFromAssembly`)
  - [ ] Verify no `[Column]` or `[Table]` data annotations are present — naming is handled exclusively via convention

- [ ] Task 2 — Register `SiesaAgentsDbContext` in DI and configure connection string (AC: #1, #5)
  - [ ] In `backend/src/SiesaAgents.API/Program.cs`, register the DbContext: `builder.Services.AddDbContext<SiesaAgentsDbContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")))`
  - [ ] Add `using SiesaAgents.Infrastructure.Data;` and `using Microsoft.EntityFrameworkCore;` to `Program.cs`
  - [ ] Confirm `appsettings.Development.json` already contains `ConnectionStrings:DefaultConnection` pointing to `Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres` (created in Story 1.1 — verify, do not duplicate)
  - [ ] Add `Microsoft.EntityFrameworkCore.Design` package reference to `SiesaAgents.API.csproj` (required for `dotnet ef` CLI tooling to resolve the DbContext from the startup project)

- [ ] Task 3 — Create and apply the initial empty migration (AC: #1, #2)
  - [ ] From the `backend/` directory, run: `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
  - [ ] Verify `backend/src/SiesaAgents.Infrastructure/Data/Migrations/` is created with `<timestamp>_InitialCreate.cs` and `<timestamp>_InitialCreate.Designer.cs` and `SiesaAgentsDbContextModelSnapshot.cs`
  - [ ] Confirm the `Up()` method in `InitialCreate.cs` is empty (no `CreateTable` calls — no domain entities exist yet)
  - [ ] Run: `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` to create `siesa_agents_db` and apply the migration
  - [ ] Verify `siesa_agents_db` exists with the `__EFMigrationsHistory` table populated with the `InitialCreate` entry

- [ ] Task 4 — Verify `ExceptionHandlingMiddleware` returns Problem Details RFC 7807 (AC: #3)
  - [ ] Review existing `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` — confirm it already sets `Content-Type: application/problem+json`, `StatusCode: 500`, and returns `ProblemDetails` with `Status`, `Title`, and `Detail = null`
  - [ ] Confirm `Detail` is always `null` — never expose `ex.Message` or stack traces (NFR6)
  - [ ] Confirm `app.UseMiddleware<ExceptionHandlingMiddleware>()` is registered before routing in `Program.cs` (created in Story 1.1 — verify, do not duplicate)

- [ ] Task 5 — Unit tests for DbContext configuration and middleware (AC: #3, #4)
  - [ ] In `backend/tests/SiesaAgents.UnitTests/`, create `Infrastructure/DbContextConfigurationTests.cs`
  - [ ] Test: `SiesaAgentsDbContext` can be instantiated with `UseInMemoryDatabase` options (verifies DI wiring compiles)
  - [ ] Test: `OnModelCreating` does not throw when called (smoke test for `ApplySnakeCaseNaming()` + `ApplyConfigurationsFromAssembly`)
  - [ ] Review existing `backend/tests/SiesaAgents.UnitTests/API/ExceptionHandlingMiddlewareTests.cs` — confirm it covers: (a) `Content-Type` header is `application/problem+json`, (b) status code is 500, (c) `Detail` field is null, (d) no stack trace in response body. Add missing assertions if any.
  - [ ] Run `dotnet test` and confirm all tests pass

## Dev Notes

### EF Core Snake Case Naming Convention

Per company standards (database-conventions.md): all PostgreSQL tables and columns MUST use snake_case. EF Core maps C# PascalCase properties to snake_case automatically via `EFCore.NamingConventions`.

```csharp
// backend/src/SiesaAgents.Infrastructure/Data/SiesaAgentsDbContext.cs
using EFCore.NamingConventions;  // not needed — extension method is on ModelBuilder
using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public sealed class SiesaAgentsDbContext(DbContextOptions<SiesaAgentsDbContext> options) : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(SiesaAgentsDbContext).Assembly);
        modelBuilder.ApplySnakeCaseNaming();  // MUST be last — applied after all configurations
    }
}
```

> `ApplySnakeCaseNaming()` is an extension method provided by `EFCore.NamingConventions`. It must be the LAST call in `OnModelCreating` so it applies after all entity configurations have registered their property names.

### DbContext Registration in Program.cs

```csharp
// backend/src/SiesaAgents.API/Program.cs — additions for this story
using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;

// ... existing builder setup ...

builder.Services.AddDbContext<SiesaAgentsDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
```

### EF Core Migrations — Required Package

`dotnet ef migrations add` requires `Microsoft.EntityFrameworkCore.Design` in the startup project (`SiesaAgents.API`). Without it, the command fails with "No DbContext was found."

```xml
<!-- backend/src/SiesaAgents.API/SiesaAgents.API.csproj -->
<PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="10.*">
  <PrivateAssets>all</PrivateAssets>
  <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
</PackageReference>
```

### Migration Commands

Run from `backend/` directory (where `SiesaAgents.sln` lives):

```bash
# Create initial empty migration
dotnet ef migrations add InitialCreate \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API

# Apply migration (creates siesa_agents_db)
dotnet ef database update \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API
```

### Initial Migration — Expected Content

The `Up()` method MUST be empty. No `CreateTable`, no `CreateIndex`. The `clientes` table is created in Story 2.1 (`ClienteEntity` + `ClienteConfiguration`). The `contactos` table is created in Story 3.1 (`ContactoEntity` + `ContactoConfiguration`).

```csharp
// Expected InitialCreate.cs — Up() is intentionally empty
public partial class InitialCreate : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder) { }
    protected override void Down(MigrationBuilder migrationBuilder) { }
}
```

### ExceptionHandlingMiddleware — Current State

The middleware was created as a stub in Story 1.1. It already meets AC #3. This story verifies it is correct and its unit tests cover all RFC 7807 requirements:

```csharp
// Current implementation — already compliant
public class ExceptionHandlingMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try { await next(context); }
        catch (Exception)
        {
            context.Response.ContentType = "application/problem+json";
            context.Response.StatusCode = 500;
            await context.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Status = 500,
                Title = "An unexpected error occurred.",
                Detail = null   // Never expose ex.Message or stack traces (NFR6)
            });
        }
    }
}
```

### NuGet Package Versions

All packages target the `10.*` wildcard to align with .NET 10 and EF Core 10:

| Package | Version | Project |
|---|---|---|
| `EFCore.NamingConventions` | `10.*` | `SiesaAgents.Infrastructure` |
| `Microsoft.EntityFrameworkCore.Design` | `10.*` | `SiesaAgents.API` (PrivateAssets=all) |

> Note: `Npgsql.EntityFrameworkCore.PostgreSQL` is already installed in `SiesaAgents.Infrastructure` from Story 1.1.

### Unit Test Pattern for DbContext

```csharp
// backend/tests/SiesaAgents.UnitTests/Infrastructure/DbContextConfigurationTests.cs
using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

public class DbContextConfigurationTests
{
    [Fact]
    public void DbContext_CanBeInstantiated_WithInMemoryDatabase()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<SiesaAgentsDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        // Act & Assert
        using var context = new SiesaAgentsDbContext(options);
        Assert.NotNull(context);
    }

    [Fact]
    public void OnModelCreating_DoesNotThrow_WithSnakeCaseNaming()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<SiesaAgentsDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new SiesaAgentsDbContext(options);

        // Act — EnsureCreated triggers OnModelCreating
        var act = () => context.Database.EnsureCreated();

        // Assert
        var exception = Record.Exception(act);
        Assert.Null(exception);
    }
}
```

> Note: `UseInMemoryDatabase` does not support `ApplySnakeCaseNaming()` validation at the DB level — but it confirms model building compiles and executes without errors. Integration tests against a real PostgreSQL instance (Story 2+ scope) will validate actual column naming.

### Scope Boundary — What This Story Does NOT Do

- Does NOT create `ClienteEntity` or `ClienteConfiguration` (Epic 2, Story 2.1)
- Does NOT create `ContactoEntity` or `ContactoConfiguration` (Epic 3, Story 3.1)
- Does NOT create `IClienteRepository`, `IContactoRepository`, or their implementations (Epic 2/3)
- Does NOT add any application-layer commands, queries, or DTOs
- Does NOT create integration test project (noted in architecture.md — deferred to implementation stories)

### References

- EF Core snake_case convention: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#EF Core: Automatic snake_case via ApplySnakeCaseNaming()]
- Database naming conventions (snake_case tables/columns): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions (PostgreSQL)]
- Problem Details RFC 7807 requirement: [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md#NFR6]
- ExceptionHandlingMiddleware pattern: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#ExceptionHandlingMiddleware pattern]
- Connection string and DB name (`siesa_agents_db`): [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment]
- Backend project structure (Migrations/ folder): [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

(To be filled by dev agent after implementation)

### File List

**Backend (to create/modify):**
- `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj` — add `EFCore.NamingConventions` package
- `backend/src/SiesaAgents.Infrastructure/Data/SiesaAgentsDbContext.cs` — add `ApplySnakeCaseNaming()` call
- `backend/src/SiesaAgents.API/SiesaAgents.API.csproj` — add `Microsoft.EntityFrameworkCore.Design` package
- `backend/src/SiesaAgents.API/Program.cs` — register `SiesaAgentsDbContext` via `AddDbContext<>()`
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/<timestamp>_InitialCreate.cs` — empty initial migration (generated by dotnet ef)
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/<timestamp>_InitialCreate.Designer.cs` — migration designer snapshot (generated)
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/SiesaAgentsDbContextModelSnapshot.cs` — EF Core model snapshot (generated)
- `backend/tests/SiesaAgents.UnitTests/Infrastructure/DbContextConfigurationTests.cs` — 2 unit tests for DbContext

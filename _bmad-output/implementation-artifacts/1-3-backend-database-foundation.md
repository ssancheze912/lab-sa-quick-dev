# Story 1.3: Backend Database Foundation

Status: ready-for-dev

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

## Acceptance Criteria

1. **Given** PostgreSQL is running locally, **When** the developer runs `dotnet ef database update` inside `backend/`, **Then** the `siesa_agents_db` database is created with no errors and EF Core migrations folder exists at `backend/src/SiesaAgents.Infrastructure/Migrations/`.

2. **Given** an unhandled exception occurs in the backend, **When** the error reaches the middleware, **Then** the response returns Problem Details RFC 7807 format (status, title, detail) with no stack traces exposed (NFR6). The `ExceptionHandlingMiddleware` already exists from Story 1.1 — verify it is wired in `Program.cs` before routing.

3. **Given** the backend receives any request, **When** the request is processed, **Then** `ApplySnakeCaseNaming()` is applied in `OnModelCreating` and all future column names follow snake_case convention automatically.

4. **Given** the `AppDbContext` is registered in DI, **When** `dotnet build SiesaAgents.sln` is executed, **Then** all projects compile with zero errors, `AppDbContext` is resolvable from DI, and the connection string is read from `appsettings.Development.json`.

5. **Given** the initial empty migration exists, **When** the migration file is inspected, **Then** it contains NO `clientes` or `contactos` table definitions — it is intentionally empty (scope note: those tables are created in Epics 2 and 3).

## Tasks / Subtasks

- [ ] Task 1 — Complete `AppDbContext` in SiesaAgents.Infrastructure (AC: #1, #3, #4)
  - [ ] Open `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj` and confirm `Npgsql.EntityFrameworkCore.PostgreSQL` package reference is present (added in Story 1.1)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` implementing `DbContext`
  - [ ] In `OnModelCreating`, call `modelBuilder.ApplySnakeCaseNaming()` as the LAST statement (enables automatic snake_case for all future entity configurations without manual `[Column]`/`[Table]` attributes)
  - [ ] Constructor must accept `DbContextOptions<AppDbContext>` — use primary constructor syntax compatible with .NET 10
  - [ ] No `DbSet<>` properties in this story — the context is intentionally empty; entity DbSets are added in Epics 2 and 3

- [ ] Task 2 — Register EF Core in Dependency Injection (AC: #4)
  - [ ] In `backend/src/SiesaAgents.API/Program.cs`, register `AppDbContext` using `builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")))`
  - [ ] Ensure `using SiesaAgents.Infrastructure.Data;` and `using Microsoft.EntityFrameworkCore;` are present
  - [ ] The connection string key `DefaultConnection` maps to the value already set in `appsettings.Development.json` from Story 1.1: `Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres`
  - [ ] Register `AppDbContext` before `var app = builder.Build()`

- [ ] Task 3 — Create the initial empty migration (AC: #1, #5)
  - [ ] Add EF Core tools support: add `Microsoft.EntityFrameworkCore.Design` package reference to `SiesaAgents.Infrastructure.csproj` (required for `dotnet ef migrations` to work)
  - [ ] From the `backend/` directory, run: `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
  - [ ] Verify that the generated migration file under `backend/src/SiesaAgents.Infrastructure/Migrations/` contains only the `__EFMigrationsHistory` table setup (or is fully empty `Up`/`Down` methods) — NO `clientes` or `contactos` table DDL
  - [ ] Run `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` to apply the migration to `siesa_agents_db`
  - [ ] Verify the database is created and `__EFMigrationsHistory` table exists

- [ ] Task 4 — Verify ExceptionHandlingMiddleware for Problem Details (AC: #2)
  - [ ] Confirm `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` exists (created in Story 1.1)
  - [ ] Confirm `app.UseMiddleware<ExceptionHandlingMiddleware>()` is the FIRST middleware registered in `Program.cs` (before `app.UseCors`, `app.MapScalarApiReference`, and any endpoint mapping)
  - [ ] Verify the middleware never exposes `ex.Message` or stack traces — `Detail` must be `null` for unhandled exceptions (see pattern in Story 1.1 Dev Notes)

- [ ] Task 5 — Unit tests (AC: #3, #4)
  - [ ] In `backend/tests/SiesaAgents.UnitTests/`, create `Infrastructure/AppDbContextTests.cs`
  - [ ] Test: `AppDbContext_OnModelCreating_AppliesSnakeCaseNaming` — use EF Core InMemory provider to verify the model builds without error (snake_case verification is structural; actual column name verification requires PostgreSQL integration test)
  - [ ] Test: `AppDbContext_CanBeInstantiated_WithOptions` — verify constructor accepts `DbContextOptions<AppDbContext>` and does not throw
  - [ ] Follow Arrange / Act / Assert structure; use xUnit `[Fact]` attributes

## Dev Notes

### Architecture Context

This story is purely backend. No frontend files are touched. The `AppDbContext` belongs in the **Infrastructure layer** (`SiesaAgents.Infrastructure/Data/`). EF Core registration belongs in the **API layer** (`Program.cs`) using the DI container — never reference Infrastructure directly from Domain or Application.

### AppDbContext Pattern

```csharp
// backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs
using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // No DbSet<> properties in this story.
    // ClienteEntity and ContactoEntity DbSets are added in Epics 2 and 3.

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply entity type configurations (currently none — added per epic)
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // MUST be LAST: automatic snake_case naming for all tables and columns
        modelBuilder.ApplySnakeCaseNaming();
    }
}
```

### Program.cs DI Registration (additions to existing file)

```csharp
// Add after existing builder.Services registrations, before var app = builder.Build()
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
```

The existing `appsettings.Development.json` already contains:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres"
  }
}
```

### Entity Conventions (for future stories using this DbContext)

Per company standards and architecture doc — enforce on ALL future entities:

| Rule | Implementation |
|------|---------------|
| Primary key | `Guid Id` — `= Guid.NewGuid()` default. Never int/string. |
| Timestamps | `DateTimeOffset CreatedAt` and `DateTimeOffset UpdatedAt` — NEVER `DateTime` |
| Entity constructor | Private constructor + static `Create()` factory method |
| Table naming | Automatic via `ApplySnakeCaseNaming()` — PascalCase C# → snake_case SQL |
| Column naming | Automatic via `ApplySnakeCaseNaming()` — NO manual `[Column]` attributes |
| FK columns | Named `{Entity}Id` in C# → auto-converted to `{entity}_id` in SQL |

### EF Core Migration Commands

```bash
# From backend/ directory
# Add migration (empty — no entities yet)
dotnet ef migrations add InitialCreate \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API

# Apply to database
dotnet ef database update \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API
```

Required NuGet package for migrations tooling (add to SiesaAgents.Infrastructure.csproj):
```xml
<PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="10.*">
  <PrivateAssets>all</PrivateAssets>
  <IncludeAssets>runtime; build; native; contentfiles; analyzers</IncludeAssets>
</PackageReference>
```

### Snake_case Naming Extension

The `ApplySnakeCaseNaming()` extension method is provided by the `EFCore.NamingConventions` package. Add to `SiesaAgents.Infrastructure.csproj` if not already present:
```xml
<PackageReference Include="EFCore.NamingConventions" Version="9.*" />
```

Note: If `EFCore.NamingConventions` is unavailable or incompatible with EF Core 10, implement manually using:
```csharp
// Alternative: manual snake_case conversion
foreach (var entity in modelBuilder.Model.GetEntityTypes())
{
    entity.SetTableName(ToSnakeCase(entity.GetTableName()!));
    foreach (var property in entity.GetProperties())
        property.SetColumnName(ToSnakeCase(property.GetColumnName()!));
}
```

### ExceptionHandlingMiddleware Verification (from Story 1.1)

The middleware already exists at `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`. Verify correct wiring in `Program.cs`:

```csharp
var app = builder.Build();

// FIRST — catches all unhandled exceptions before any other middleware
app.UseMiddleware<ExceptionHandlingMiddleware>();

// SECOND — CORS
app.UseCors("DevCors");

// THEN — API docs and endpoints
app.MapScalarApiReference();
// ... endpoint mappings
```

### Scope Boundary (CRITICAL)

This story creates an **empty** `AppDbContext` and an **empty initial migration**. The scope note from the epic is mandatory:

> Do NOT define `ClienteEntity` or `ContactoEntity` in this story.
> The `clientes` table is created in Epic 2 Story 2.1.
> The `contactos` table is created in Epic 3 Story 3.1.

Any deviation from this scope boundary will cause migration conflicts in subsequent stories.

### Testing Pattern

```csharp
// backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs
using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

public class AppDbContextTests
{
    [Fact]
    public void AppDbContext_CanBeInstantiated_WithOptions()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_Instantiation")
            .Options;

        // Act
        using var context = new AppDbContext(options);

        // Assert
        Assert.NotNull(context);
    }

    [Fact]
    public void AppDbContext_OnModelCreating_BuildsModelWithoutError()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_ModelCreating")
            .Options;

        // Act & Assert — should not throw
        using var context = new AppDbContext(options);
        var model = context.Model; // triggers OnModelCreating
        Assert.NotNull(model);
    }
}
```

Note: InMemory provider does not support `ApplySnakeCaseNaming()` — use `UseInMemoryDatabase` for structural tests only. Integration tests verifying actual column names require PostgreSQL (via Testcontainers, added in a future testing story).

### Project Structure Notes

Files to create in this story:
```
backend/
└── src/
    └── SiesaAgents.Infrastructure/
        ├── SiesaAgents.Infrastructure.csproj     ← ADD: EFCore.NamingConventions + EFCore.Design packages
        └── Data/
            └── AppDbContext.cs                   ← CREATE: empty DbContext with snake_case naming
        └── Migrations/                           ← AUTO-GENERATED by dotnet ef migrations add
            ├── {timestamp}_InitialCreate.cs
            └── AppDbContextModelSnapshot.cs
tests/
└── SiesaAgents.UnitTests/
    └── Infrastructure/
        └── AppDbContextTests.cs                  ← CREATE: 2 unit tests
```

Files to modify:
```
backend/
└── src/
    └── SiesaAgents.API/
        └── Program.cs                            ← ADD: AddDbContext<AppDbContext> registration
```

No frontend files are touched in this story.

### References

- Epic source and story AC: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3]
- Architecture — Backend structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Architecture — Database conventions: [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns]
- Architecture — Enforcement guidelines: [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines]
- Company standards — Backend stack: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Stack]
- Company standards — Database conventions: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions]
- Story 1.1 learnings — ExceptionHandlingMiddleware pattern: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#ExceptionHandlingMiddleware pattern]
- Story 1.1 learnings — Program.cs structure: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#Backend Stack Details]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

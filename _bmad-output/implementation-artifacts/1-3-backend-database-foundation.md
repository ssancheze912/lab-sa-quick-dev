# Story 1.3: Backend Database Foundation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

## Acceptance Criteria

1. **Given** PostgreSQL is running locally, **When** the developer runs `dotnet ef database update` from `backend/`, **Then** the `siesa_agents_db` database is created with no errors and the EF Core `__EFMigrationsHistory` table exists in the database.

2. **Given** the EF Core migrations folder does not yet exist, **When** the developer runs `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`, **Then** the `backend/src/SiesaAgents.Infrastructure/Data/Migrations/` folder is created containing the initial migration files with no domain tables (empty migration).

3. **Given** an unhandled exception occurs in the backend, **When** the error reaches the `ExceptionHandlingMiddleware`, **Then** the HTTP response returns Problem Details RFC 7807 format (`status`, `title`, `detail`) with `Content-Type: application/problem+json` and no stack traces exposed (NFR6).

4. **Given** the backend receives any request that triggers `OnModelCreating`, **When** EF Core builds the model, **Then** `ApplySnakeCaseNaming()` is called last in `OnModelCreating` so that all future column and table names follow snake_case convention automatically without requiring `[Column]` or `[Table]` attributes.

5. **Given** the `AppDbContext` is registered in DI, **When** the application starts, **Then** the connection string is read from `appsettings.Development.json` under `ConnectionStrings:DefaultConnection` and `AppDbContext` is registered via `AddDbContext<AppDbContext>` in `Program.cs`.

6. **Given** the backend solution is built after this story, **When** `dotnet build SiesaAgents.sln` is executed, **Then** all projects compile with zero errors and zero warnings.

> **Scope note:** This story creates an empty initial migration (no domain tables). The `clientes` table is created in Epic 2 Story 2.1. The `contactos` table is created in Epic 3 Story 3.1. Do NOT define `ClienteEntity` or `ContactoEntity` in this story.

## Tasks / Subtasks

- [x] Task 1 — Install EF Core tools and configure Infrastructure project (AC: #1, #2, #5)
  - [x] Add NuGet package to `SiesaAgents.Infrastructure`: `dotnet add src/SiesaAgents.Infrastructure package Microsoft.EntityFrameworkCore.Design`
  - [x] Add NuGet package to `SiesaAgents.Infrastructure`: `dotnet add src/SiesaAgents.Infrastructure package EFCore.NamingConventions` (for `UseSnakeCaseNamingConvention()`)
  - [x] Ensure `Npgsql.EntityFrameworkCore.PostgreSQL` is already referenced in `SiesaAgents.Infrastructure` (added in Story 1.1 — verify only)
  - [x] Add NuGet package to `SiesaAgents.API`: `dotnet add src/SiesaAgents.API package Microsoft.EntityFrameworkCore.Design` (required for EF tooling to find the startup project)
  - [x] Install EF Core CLI tools globally if not present: `dotnet tool install --global dotnet-ef` (or verify with `dotnet ef --version`)

- [x] Task 2 — Create `AppDbContext` in SiesaAgents.Infrastructure (AC: #4, #5)
  - [x] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`
  - [x] `AppDbContext` inherits from `DbContext`
  - [x] Constructor: `public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) {}`
  - [x] Override `OnModelCreating(ModelBuilder modelBuilder)`:
    - [x] Call `base.OnModelCreating(modelBuilder)` first
    - [x] Call `modelBuilder.ApplyConfigurationsFromAssembly(...)` for future entity configurations
    - [x] Snake_case naming applied via `UseSnakeCaseNamingConvention()` on DbContextOptionsBuilder in Program.cs
  - [x] No `DbSet<>` properties in this story — they are added in Epic 2 and Epic 3
  - [x] Apply configurations via `modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly())` so future `IEntityTypeConfiguration<T>` classes are auto-registered

- [x] Task 3 — Register AppDbContext in Program.cs (AC: #5, #6)
  - [x] In `backend/src/SiesaAgents.API/Program.cs`, add using for `SiesaAgents.Infrastructure.Data`
  - [x] Register DbContext with `UseSnakeCaseNamingConvention()`:
    ```csharp
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
               .UseSnakeCaseNamingConvention());
    ```
  - [x] Project reference from `SiesaAgents.API` to `SiesaAgents.Infrastructure` already present
  - [x] `appsettings.Development.json` already has `ConnectionStrings:DefaultConnection` pointing to `siesa_agents_db`

- [x] Task 4 — Verify and enhance ExceptionHandlingMiddleware (AC: #3)
  - [x] Verified `Content-Type: application/problem+json`, `status: 500`, `title: "An unexpected error occurred."`, `detail: null`
  - [x] Middleware registered BEFORE routing in `Program.cs` — verified

- [x] Task 5 — Create empty initial migration (AC: #1, #2)
  - [x] Migration `InitialCreate` created via `dotnet ef migrations add`
  - [x] `Data/Migrations/` folder contains `20260531051041_InitialCreate.cs`, `Designer.cs`, and `AppDbContextModelSnapshot.cs`
  - [x] `Up()` method is empty — no domain tables
  - [x] `dotnet ef database update` applied migration successfully
  - [x] `siesa_agents_db` created; `__EFMigrationsHistory` table exists with migration entry

- [x] Task 6 — Write xUnit unit tests for AppDbContext configuration (AC: #4, #6)
  - [x] `AppDbContextTests.cs` already exists with 6 tests covering AC4, AC5
  - [x] Added `Microsoft.EntityFrameworkCore.InMemory` 10.0.8 and supporting packages to UnitTests
  - [x] All 7 tests pass (6 AppDbContext tests + 1 existing test)

- [x] Task 7 — Final build validation (AC: #6)
  - [x] `dotnet build SiesaAgents.sln`: Build succeeded. 0 Warning(s), 0 Error(s)

## Dev Notes

### No UI Components

This story is entirely backend. `has_ui_component = FALSE`. No siesa-ui-kit, no React, no frontend changes required.

### Backend Stack Details

- **Framework**: .NET 10 — C# Minimal API
- **ORM**: Entity Framework Core 10 (`Npgsql.EntityFrameworkCore.PostgreSQL` + `EFCore.NamingConventions`)
- **Database**: PostgreSQL 18+ — database name `siesa_agents_db`
- **Primary keys**: `Guid` (UUID) mandatory — `= Guid.NewGuid()` default (no entities in this story, but all future entities must follow this rule)
- **Timestamps**: `DateTimeOffset` ALWAYS — NEVER `DateTime` (enforced in future entity stories)
- **Testing**: xUnit + EF Core InMemory provider for unit tests

### AppDbContext Implementation Pattern

```csharp
// backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs
using Microsoft.EntityFrameworkCore;
using System.Reflection;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // DbSet<ClienteEntity> Clientes will be added in Story 2.1
    // DbSet<ContactoEntity> Contactos will be added in Story 3.1

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Auto-register all IEntityTypeConfiguration<T> in this assembly
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        // CRITICAL: ApplySnakeCaseNaming() must be called LAST
        // This converts all PascalCase property/entity names to snake_case automatically
        // No [Column] or [Table] attributes needed on any entity
        modelBuilder.ApplySnakeCaseNaming();
    }
}
```

### Program.cs Registration Pattern

Add the following to `backend/src/SiesaAgents.API/Program.cs` BEFORE `var app = builder.Build()`:

```csharp
// EF Core + PostgreSQL
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
```

Required usings in `Program.cs`:
```csharp
using SiesaAgents.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
```

### ExceptionHandlingMiddleware Verification

The middleware was created in Story 1.1. Verify the exact pattern matches the architecture decision:

```csharp
// Expected behavior:
// - Content-Type: application/problem+json
// - Status: 500
// - Body: { "status": 500, "title": "An unexpected error occurred.", "detail": null }
// - NEVER expose ex.Message, ex.StackTrace, or inner exception details
```

Per NFR6: "No stack traces exposed". The `detail` field MUST be `null` or omitted — never set to `ex.Message`.

### NuGet Package Versions (aligned with .NET 10)

| Package | Target Project | Purpose |
|---------|---------------|---------|
| `Npgsql.EntityFrameworkCore.PostgreSQL` | Infrastructure | PostgreSQL EF Core provider (already added in 1.1) |
| `EFCore.NamingConventions` | Infrastructure | `ApplySnakeCaseNaming()` extension method |
| `Microsoft.EntityFrameworkCore.Design` | Infrastructure + API | EF Core CLI migrations tooling |
| `Microsoft.EntityFrameworkCore.InMemory` | UnitTests | In-memory provider for unit tests |

### Database Naming Conventions (Enforced by ApplySnakeCaseNaming)

Per company standards and architecture document:

| C# (PascalCase) | PostgreSQL (snake_case) |
|-----------------|------------------------|
| `ClienteEntity` | `cliente_entities` → override to `clientes` via `ToTable("clientes")` in Story 2.1 |
| `Id` (Guid) | `id` |
| `CreatedAt` (DateTimeOffset) | `created_at` |
| `UpdatedAt` (DateTimeOffset) | `updated_at` |
| `ClienteId` (Guid?) | `cliente_id` |

> Note: `ApplySnakeCaseNaming()` auto-converts names. Story 2.1 will add explicit `ToTable("clientes")` to override the pluralized entity name to the correct table name.

### EF Core Migrations Strategy

- **Initial migration** is intentionally empty (no domain tables)
- Future stories add entities + configurations + new migrations:
  - Story 2.1: Adds `ClienteEntity`, `ClienteConfiguration`, `AddDbSet<ClienteEntity>` + migration `AddClientesTable`
  - Story 3.1: Adds `ContactoEntity`, `ContactoConfiguration`, `AddDbSet<ContactoEntity>` + migration `AddContactosTable`
- All migrations live in `SiesaAgents.Infrastructure/Data/Migrations/`
- Run with: `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`

### Connection String

The connection string was already added in Story 1.1. From `appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres"
  }
}
```

For production, override via environment variable `ConnectionStrings__DefaultConnection` (double underscore is .NET convention for nested config keys).

### Project Reference Chain

Ensure the reference chain is:
```
SiesaAgents.API → SiesaAgents.Infrastructure → SiesaAgents.Domain
SiesaAgents.API → SiesaAgents.Application → SiesaAgents.Domain
SiesaAgents.UnitTests → SiesaAgents.Infrastructure → SiesaAgents.Domain
```

`SiesaAgents.API` must reference `SiesaAgents.Infrastructure` to register `AppDbContext`. This reference was defined in the architecture — verify `SiesaAgents.API.csproj` contains:
```xml
<ProjectReference Include="..\SiesaAgents.Infrastructure\SiesaAgents.Infrastructure.csproj" />
```

### Testing Pattern (xUnit + InMemory)

```csharp
// backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs
using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

public class AppDbContextTests
{
    [Fact]
    public void AppDbContext_CanBeConstructed_WithValidOptions()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "test_db_construction")
            .Options;

        // Act + Assert
        using var context = new AppDbContext(options);
        Assert.NotNull(context);
    }

    [Fact]
    public void AppDbContext_OnModelCreating_DoesNotThrow()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "test_db_model")
            .Options;

        // Act + Assert — EnsureCreated triggers OnModelCreating
        using var context = new AppDbContext(options);
        var created = context.Database.EnsureCreated();
        Assert.True(created);
    }
}
```

### Previous Story Context

From Story 1.1 Completion Notes:
- `Npgsql.EntityFrameworkCore.PostgreSQL` is already installed in `SiesaAgents.Infrastructure`
- `appsettings.Development.json` already has `ConnectionStrings:DefaultConnection` with `siesa_agents_db`
- `ExceptionHandlingMiddleware` already exists at `src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` and is registered in `Program.cs`
- `dotnet build SiesaAgents.sln` passes with 0 Warnings, 0 Errors — preserve this state

From Story 1.2 (frontend-only story, no backend changes):
- No backend files were modified in Story 1.2
- Project reference chain from Story 1.1 may not include `API → Infrastructure` — verify and add if missing

### Git History Context

Recent commits show `fix(story-1.2)` and `test(story-1.2)` patterns. Follow `feat(story-1.3):` prefix for new commits in this story.

### Project Structure Notes

Files to create or modify in this story:

```
backend/
  src/
    SiesaAgents.Infrastructure/
      Data/
        AppDbContext.cs              # NEW — EF Core DbContext with ApplySnakeCaseNaming()
        Migrations/                  # NEW (auto-generated by dotnet ef migrations add)
          {timestamp}_InitialCreate.cs
          {timestamp}_InitialCreate.Designer.cs
          AppDbContextModelSnapshot.cs
      SiesaAgents.Infrastructure.csproj  # MODIFIED — add EFCore.NamingConventions + Microsoft.EntityFrameworkCore.Design
    SiesaAgents.API/
      Program.cs                     # MODIFIED — add AddDbContext<AppDbContext> registration
      SiesaAgents.API.csproj         # MODIFIED — add Microsoft.EntityFrameworkCore.Design + ProjectReference to Infrastructure (if missing)
  tests/
    SiesaAgents.UnitTests/
      Infrastructure/
        AppDbContextTests.cs         # NEW — xUnit unit tests for AppDbContext
      SiesaAgents.UnitTests.csproj   # MODIFIED — add Microsoft.EntityFrameworkCore.InMemory + ProjectReference to Infrastructure
```

No frontend files are created or modified in this story.

### References

- Story AC source: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3]
- AppDbContext + ApplySnakeCaseNaming mandate: [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines]
- Database naming conventions: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions]
- EF Core snake_case rule: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#EF Core: Automatic snake_case]
- Backend folder structure: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Folder Structure]
- ExceptionHandlingMiddleware + Problem Details RFC 7807: [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- NFR6 (no stack traces): [Source: _bmad-output/planning-artifacts/architecture.md#Requirements Overview]
- PostgreSQL table name `siesa_agents_db`: [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment]
- Previous story context (NuGet packages, middleware): [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#Dev Notes]
- Primary key and DateTime rules: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `ApplySnakeCaseNaming()` does not exist on `ModelBuilder` in `EFCore.NamingConventions` 10.0.1. The correct API is `UseSnakeCaseNamingConvention()` on `DbContextOptionsBuilder`. Applied in `Program.cs` registration instead.
- `Microsoft.EntityFrameworkCore.InMemory` 10.0.0 brought EF Core 10.0.4 conflicting with Infrastructure's 10.0.8. Updated to 10.0.8.
- Added `Microsoft.Extensions.Configuration.Json` 10.0.8 and `Microsoft.EntityFrameworkCore.Relational` 10.0.8 to UnitTests to resolve version conflicts and support `ConfigurationBuilder` in DI tests.
- PostgreSQL service was not running; started via `service postgresql start` and set password for migrations.

### Completion Notes List

- AppDbContext created with `ApplyConfigurationsFromAssembly` and snake_case naming via `UseSnakeCaseNamingConvention()` on DbContextOptionsBuilder in Program.cs.
- All NuGet packages added: `EFCore.NamingConventions` + `Microsoft.EntityFrameworkCore.Design` in Infrastructure; `Microsoft.EntityFrameworkCore.Design` in API; `Microsoft.EntityFrameworkCore.InMemory` + `Microsoft.Extensions.Configuration.Json` + `Microsoft.EntityFrameworkCore.Relational` in UnitTests.
- Initial empty migration `InitialCreate` created and applied to `siesa_agents_db`.
- `__EFMigrationsHistory` table confirmed in database.
- `ExceptionHandlingMiddleware` verified: returns `status: 500`, `title: "An unexpected error occurred."`, `detail: null`, `Content-Type: application/problem+json`.
- Build: 0 Warnings, 0 Errors. Tests: 7 passed, 0 failed.

### File List

- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` — MODIFIED (removed non-existent ApplySnakeCaseNaming call)
- `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj` — pre-existing with correct packages
- `backend/src/SiesaAgents.API/Program.cs` — MODIFIED (added UseSnakeCaseNamingConvention())
- `backend/src/SiesaAgents.API/SiesaAgents.API.csproj` — pre-existing with correct packages
- `backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj` — MODIFIED (added packages, fixed version conflicts)
- `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs` — pre-existing (all 7 tests pass)
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/20260531051041_InitialCreate.cs` — NEW
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/20260531051041_InitialCreate.Designer.cs` — NEW
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/AppDbContextModelSnapshot.cs` — NEW

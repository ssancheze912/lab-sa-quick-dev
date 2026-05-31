# Story 1.3: Backend Database Foundation

Status: ready-for-dev

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

- [ ] Task 1 — Install EF Core tools and configure Infrastructure project (AC: #1, #2, #5)
  - [ ] Add NuGet package to `SiesaAgents.Infrastructure`: `dotnet add src/SiesaAgents.Infrastructure package Microsoft.EntityFrameworkCore.Design`
  - [ ] Add NuGet package to `SiesaAgents.Infrastructure`: `dotnet add src/SiesaAgents.Infrastructure package EFCore.NamingConventions` (for `ApplySnakeCaseNaming()`)
  - [ ] Ensure `Npgsql.EntityFrameworkCore.PostgreSQL` is already referenced in `SiesaAgents.Infrastructure` (added in Story 1.1 — verify only)
  - [ ] Add NuGet package to `SiesaAgents.API`: `dotnet add src/SiesaAgents.API package Microsoft.EntityFrameworkCore.Design` (required for EF tooling to find the startup project)
  - [ ] Install EF Core CLI tools globally if not present: `dotnet tool install --global dotnet-ef` (or verify with `dotnet ef --version`)

- [ ] Task 2 — Create `AppDbContext` in SiesaAgents.Infrastructure (AC: #4, #5)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`
  - [ ] `AppDbContext` inherits from `DbContext`
  - [ ] Constructor: `public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) {}`
  - [ ] Override `OnModelCreating(ModelBuilder modelBuilder)`:
    - Call `base.OnModelCreating(modelBuilder)` first
    - Call `modelBuilder.ApplySnakeCaseNaming()` LAST (after any future entity configurations)
  - [ ] No `DbSet<>` properties in this story — they are added in Epic 2 and Epic 3
  - [ ] Apply configurations via `modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly())` so future `IEntityTypeConfiguration<T>` classes are auto-registered

- [ ] Task 3 — Register AppDbContext in Program.cs (AC: #5, #6)
  - [ ] In `backend/src/SiesaAgents.API/Program.cs`, add using for `SiesaAgents.Infrastructure.Data`
  - [ ] Register DbContext:
    ```csharp
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
    ```
  - [ ] Add project reference from `SiesaAgents.API` to `SiesaAgents.Infrastructure` if not already present: `dotnet add src/SiesaAgents.API/SiesaAgents.API.csproj reference src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj`
  - [ ] Verify `appsettings.Development.json` already has `ConnectionStrings:DefaultConnection` pointing to `Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres` (set in Story 1.1 — verify only)

- [ ] Task 4 — Verify and enhance ExceptionHandlingMiddleware (AC: #3)
  - [ ] Read the existing `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` created in Story 1.1
  - [ ] Verify it sets `Content-Type: application/problem+json` and returns a `ProblemDetails` object with no `detail` containing stack trace or exception message
  - [ ] Ensure the middleware returns `status: 500`, `title: "An unexpected error occurred."`, `detail: null`
  - [ ] Verify middleware is registered BEFORE routing in `Program.cs`: `app.UseMiddleware<ExceptionHandlingMiddleware>()` (already done in Story 1.1 — verify position)

- [ ] Task 5 — Create empty initial migration (AC: #1, #2)
  - [ ] From `backend/` directory, run:
    ```bash
    dotnet ef migrations add InitialCreate \
      --project src/SiesaAgents.Infrastructure \
      --startup-project src/SiesaAgents.API \
      --output-dir Data/Migrations
    ```
  - [ ] Verify `backend/src/SiesaAgents.Infrastructure/Data/Migrations/` contains `{timestamp}_InitialCreate.cs` and `{timestamp}_InitialCreate.Designer.cs` and `AppDbContextModelSnapshot.cs`
  - [ ] Verify the generated migration `Up()` method is empty (no domain tables — correct for this story)
  - [ ] Run `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` to apply the migration to `siesa_agents_db`
  - [ ] Verify the `siesa_agents_db` database is created and `__EFMigrationsHistory` table exists

- [ ] Task 6 — Write xUnit unit tests for AppDbContext configuration (AC: #4, #6)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`
  - [ ] Add NuGet to `SiesaAgents.UnitTests` if needed: `dotnet add tests/SiesaAgents.UnitTests package Microsoft.EntityFrameworkCore.InMemory`
  - [ ] Test: `AppDbContext_OnModelCreating_AppliesSnakeCaseNaming` — use InMemory provider, verify that the context builds without errors (smoke test for `ApplySnakeCaseNaming` being called)
  - [ ] Test: `AppDbContext_CanBeConstructed_WithValidOptions` — verify constructor accepts `DbContextOptions<AppDbContext>` without throwing
  - [ ] Run `dotnet test` from `backend/` to verify all tests pass (including existing Story 1.1 test)

- [ ] Task 7 — Final build validation (AC: #6)
  - [ ] Run `dotnet build SiesaAgents.sln` from `backend/`
  - [ ] Confirm: `Build succeeded. 0 Warning(s), 0 Error(s)`

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

### Completion Notes List

### File List

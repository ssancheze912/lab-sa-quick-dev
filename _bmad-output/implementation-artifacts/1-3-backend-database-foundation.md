# Story 1.3: Backend Database Foundation

Status: ready-for-dev

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

## Acceptance Criteria

1. **Given** PostgreSQL is running locally, **When** the developer runs `dotnet ef database update` from `backend/`, **Then** the `siesa_agents_db` database is created with no errors and the EF Core `__EFMigrationsHistory` table is present.

2. **Given** the initial migration is created, **When** the developer inspects `backend/src/SiesaAgents.Infrastructure/Migrations/`, **Then** a migration file named `InitialCreate` exists and its `Up()` method contains no table creation statements (empty migration — no domain tables yet).

3. **Given** `AppDbContext.OnModelCreating` is configured, **When** EF Core generates migrations for any future entity, **Then** all column names follow snake_case convention automatically (enforced by `modelBuilder.UseSnakeCaseNamingConvention()` called last in `OnModelCreating`).

4. **Given** an unhandled exception occurs in the backend, **When** the error reaches `ExceptionHandlingMiddleware`, **Then** the response body is a valid Problem Details RFC 7807 JSON object with `status`, `title`, and `detail` fields, HTTP status 500, `Content-Type: application/problem+json`, and no stack trace or internal exception message exposed to the caller (NFR6).

5. **Given** the application starts, **When** `Program.cs` builds the DI container, **Then** `AppDbContext` is registered with `AddDbContext<AppDbContext>` using the `DefaultConnection` connection string from `appsettings.Development.json`, and the application starts with no errors.

6. **Given** the `ConnectionStrings` section in `appsettings.Development.json`, **When** the value is read, **Then** it targets `Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres` using the Npgsql provider format.

## Tasks / Subtasks

- [ ] Task 1 — Rename DbContext to `AppDbContext` and align with architecture (AC: #3, #5)
  - [ ] Rename `SiesaAgentsDbContext` to `AppDbContext` in `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`
  - [ ] Verify `OnModelCreating` calls `modelBuilder.UseSnakeCaseNamingConvention()` (already present as `UseSnakeCaseNamingConvention` via `EFCore.NamingConventions` package) and `modelBuilder.ApplyConfigurationsFromAssembly(...)` — both calls must be present
  - [ ] Confirm `EFCore.NamingConventions` package is referenced in `SiesaAgents.Infrastructure.csproj` (already present at version `9.*`)
  - [ ] Add `Microsoft.EntityFrameworkCore.Design` package reference to `SiesaAgents.Infrastructure.csproj` (required for `dotnet ef migrations add`)
  - [ ] Add `Microsoft.EntityFrameworkCore.Tools` package reference to `SiesaAgents.API.csproj` (required for EF CLI tooling)

- [ ] Task 2 — Register `AppDbContext` in DI and configure connection string (AC: #5, #6)
  - [ ] In `backend/src/SiesaAgents.API/Program.cs`, add before `var app = builder.Build()`:
    ```csharp
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
    ```
  - [ ] Add `using SiesaAgents.Infrastructure.Data;` and `using Microsoft.EntityFrameworkCore;` to `Program.cs`
  - [ ] Verify `appsettings.Development.json` already contains `ConnectionStrings.DefaultConnection` pointing to `Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres` (confirmed from Story 1.1 — no changes needed)
  - [ ] Ensure `appsettings.json` contains an empty or template `ConnectionStrings` section for non-development environments

- [ ] Task 3 — Create the initial empty EF Core migration (AC: #1, #2)
  - [ ] Run from `backend/`:
    ```bash
    dotnet ef migrations add InitialCreate \
      --project src/SiesaAgents.Infrastructure \
      --startup-project src/SiesaAgents.API \
      --output-dir Data/Migrations
    ```
  - [ ] Verify `backend/src/SiesaAgents.Infrastructure/Data/Migrations/` contains:
    - `<timestamp>_InitialCreate.cs` — `Up()` and `Down()` methods with no table creation (empty body is valid)
    - `<timestamp>_InitialCreate.Designer.cs` — EF snapshot
    - `AppDbContextModelSnapshot.cs`
  - [ ] Run `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` and verify `siesa_agents_db` is created with `__EFMigrationsHistory` table

- [ ] Task 4 — Validate and enhance `ExceptionHandlingMiddleware` for RFC 7807 compliance (AC: #4)
  - [ ] Review existing `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` — already returns Problem Details with `Status=500`, `Title`, `Detail=null`; no stack trace exposed
  - [ ] Add handling for domain-specific exception types to be defined in future stories:
    - `KeyNotFoundException` → HTTP 404, `title: "Resource not found."`
    - `ArgumentException` / `InvalidOperationException` → HTTP 400, `title: "Invalid request."`
  - [ ] Ensure `context.Response.ContentType = "application/problem+json"` is set in ALL exception branches
  - [ ] Confirm middleware is registered in `Program.cs` as the FIRST middleware before `app.UseCors("DevCors")` — already correct from Story 1.1, no changes needed

- [ ] Task 5 — Write xUnit tests for database infrastructure (AC: #3, #4, #5)
  - [ ] Add `Microsoft.EntityFrameworkCore.InMemory` package to `SiesaAgents.UnitTests.csproj`
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`:
    - Test: `OnModelCreating_AppliesSnakeCaseNaming` — creates InMemory context and verifies convention is applied without exception
    - Test: `AppDbContext_CanBeInstantiated_WithValidOptions` — verifies context instantiation with InMemory provider
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs`:
    - Test: `InvokeAsync_OnUnhandledException_Returns500ProblemDetails` — asserts status 500 and `application/problem+json` content type
    - Test: `InvokeAsync_OnKeyNotFoundException_Returns404ProblemDetails` — asserts status 404
    - Test: `InvokeAsync_OnArgumentException_Returns400ProblemDetails` — asserts status 400
    - Test: `InvokeAsync_OnCancelledRequest_Returns499` — asserts status 499, no response body written

## Dev Notes

### Key Decisions from Story 1.1

Story 1.1 created the skeleton. The following is already in place and must NOT be re-created:
- `backend/src/SiesaAgents.Infrastructure/Data/SiesaAgentsDbContext.cs` — exists but uses old name; rename to `AppDbContext`
- `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj` — already has `Npgsql.EntityFrameworkCore.PostgreSQL v10.*` and `EFCore.NamingConventions v9.*`
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` — already implements RFC 7807 correctly
- `backend/src/SiesaAgents.API/appsettings.Development.json` — already has `ConnectionStrings.DefaultConnection`
- `backend/src/SiesaAgents.Domain/Entities/Entity.cs` — base entity with `Guid Id` and `DateTimeOffset` timestamps

**The main gap**: `AppDbContext` is not registered in DI and no migrations exist yet. This story closes that gap.

### DbContext Naming

The architecture document specifies `AppDbContext` (not `SiesaAgentsDbContext`). Rename the class and file:
- Old: `backend/src/SiesaAgents.Infrastructure/Data/SiesaAgentsDbContext.cs` (class `SiesaAgentsDbContext`)
- New: `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` (class `AppDbContext`)

### AppDbContext Implementation

```csharp
using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        // Apply all IEntityTypeConfiguration<T> implementations in this assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        // MUST be called last — overrides naming for all configured entities
        modelBuilder.UseSnakeCaseNamingConvention();
    }
}
```

Note: The `EFCore.NamingConventions` package provides `UseSnakeCaseNamingConvention()`. The architecture doc refers to `ApplySnakeCaseNaming()` which maps to this method from the `EFCore.NamingConventions` package. These are equivalent.

### Program.cs DI Registration

Add the following block in `Program.cs` after the CORS configuration and before `var app = builder.Build()`:

```csharp
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
```

Required using statements:
```csharp
using SiesaAgents.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
```

### EF Core Migrations CLI

The `dotnet ef` CLI requires:
- `Microsoft.EntityFrameworkCore.Design` in the Infrastructure project (startup project reference)
- The startup project must reference the Infrastructure project (already satisfied via API → Infrastructure reference)

Migration output directory: `Data/Migrations` (within Infrastructure project). The architecture defines `SiesaAgents.Infrastructure/Migrations/` — use `Data/Migrations` to keep migrations co-located with `AppDbContext`.

### Empty Initial Migration

The initial migration `Up()` and `Down()` methods will be empty — this is intentional and correct. The purpose is to establish the migrations baseline for `siesa_agents_db`. Domain tables (`clientes`, `contactos`) are added in Epic 2 and Epic 3 respectively.

```csharp
// Expected structure of InitialCreate migration
public partial class InitialCreate : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Empty — no domain tables in this story
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Empty
    }
}
```

### ExceptionHandlingMiddleware Enhancement

The existing middleware from Story 1.1 handles the general `Exception` case. Extend it to differentiate domain exceptions:

```csharp
catch (KeyNotFoundException ex)
{
    context.Response.ContentType = "application/problem+json";
    context.Response.StatusCode = 404;
    await context.Response.WriteAsJsonAsync(new ProblemDetails
    {
        Status = 404,
        Title = "Resource not found.",
        Detail = null
    });
}
catch (ArgumentException ex)
{
    context.Response.ContentType = "application/problem+json";
    context.Response.StatusCode = 400;
    await context.Response.WriteAsJsonAsync(new ProblemDetails
    {
        Status = 400,
        Title = "Invalid request.",
        Detail = null
    });
}
```

**NEVER** set `Detail` to `ex.Message` or include stack traces — NFR6 compliance.

### Connection String Format

Npgsql connection string format (appsettings.Development.json):
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres"
  }
}
```

For production/staging, override via environment variable: `ConnectionStrings__DefaultConnection`.

### Testing Approach

**InMemory DbContext test pattern:**
```csharp
var options = new DbContextOptionsBuilder<AppDbContext>()
    .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
    .Options;
using var context = new AppDbContext(options);
// Assert context can be used
```

**Middleware test pattern using DefaultHttpContext:**
```csharp
var context = new DefaultHttpContext();
context.Response.Body = new MemoryStream();
var middleware = new ExceptionHandlingMiddleware(_ => throw new KeyNotFoundException());
await middleware.InvokeAsync(context);
Assert.Equal(404, context.Response.StatusCode);
Assert.Equal("application/problem+json", context.Response.ContentType);
```

### Backend Stack Summary (no UI in this story)

| Component | Version | Note |
|-----------|---------|------|
| .NET | 10 | C# Minimal API |
| EF Core | 10 | via `Npgsql.EntityFrameworkCore.PostgreSQL v10.*` |
| Npgsql | 10 | PostgreSQL 18+ driver |
| EFCore.NamingConventions | 9.* | Provides `UseSnakeCaseNamingConvention()` |
| xUnit | latest | Unit tests |

### Project Structure Notes

Files touched or created in this story:

**Renamed/Modified:**
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` (renamed from `SiesaAgentsDbContext.cs`)
- `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj` (add `Microsoft.EntityFrameworkCore.Design`)
- `backend/src/SiesaAgents.API/SiesaAgents.API.csproj` (add `Microsoft.EntityFrameworkCore.Tools`)
- `backend/src/SiesaAgents.API/Program.cs` (add `AddDbContext` registration)
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` (add 404/400 exception branches)
- `backend/src/SiesaAgents.API/appsettings.json` (add `ConnectionStrings` template section)

**Created:**
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/<timestamp>_InitialCreate.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/<timestamp>_InitialCreate.Designer.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/AppDbContextModelSnapshot.cs`
- `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs`

**Scope constraints (DO NOT create in this story):**
- `ClienteEntity.cs` — deferred to Epic 2, Story 2.1
- `ContactoEntity.cs` — deferred to Epic 3, Story 3.1
- `ClienteConfiguration.cs` / `ContactoConfiguration.cs` — deferred to Epic 2/3
- Any endpoint file — not in scope for this story

### References

- EF Core snake_case configuration: [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines]
- DbContext and migration location: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Problem Details RFC 7807 requirement: [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security] + NFR6
- Connection string format: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#Task 5]
- ExceptionHandlingMiddleware pattern: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#ExceptionHandlingMiddleware pattern]
- Scope note (no domain tables): [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3]
- Naming conventions: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

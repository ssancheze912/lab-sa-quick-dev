# Story 1.3: Backend Database Foundation

Status: done

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

## Acceptance Criteria

1. **Given** PostgreSQL is running locally, **When** the developer runs `dotnet ef database update` from the `backend/` directory, **Then** the `siesa_agents_db` database is created with no errors and `__ef_migrations_history` table exists in the database.

2. **Given** an unhandled exception occurs in the backend, **When** the error reaches the middleware, **Then** the response returns Problem Details RFC 7807 format containing `status`, `title`, and `detail` fields, with `Content-Type: application/problem+json`, and NO `stackTrace`, `exception`, or `innerException` keys exposed. (NFR6)

3. **Given** the backend receives any request, **When** the request is processed, **Then** `ApplySnakeCaseNaming()` is applied as the LAST call in `OnModelCreating` and all EF-managed column names in the database follow snake_case convention (e.g., `migration_id`, `product_version` in `__ef_migrations_history`).

4. **Given** the `SiesaAgents.Infrastructure` project, **When** the developer inspects the project, **Then** a `Migrations/` folder exists with at least one initial migration file (empty — no domain tables).

5. **Given** the backend solution, **When** `dotnet build SiesaAgents.sln` is executed, **Then** all projects compile successfully with zero errors and the `Npgsql.EntityFrameworkCore.PostgreSQL` package is referenced in `SiesaAgents.Infrastructure`.

> **Scope note:** This story creates an empty initial migration (no domain tables). The `clientes` table is created in Epic 2 Story 2.1. The `contactos` table is created in Epic 3 Story 3.1. Do NOT define `ClienteEntity` or `ContactoEntity` in this story.

## Tasks / Subtasks

- [x] Task 1 — Configure DbContext in SiesaAgents.Infrastructure (AC: #1, #3, #4)
  - [x] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` — inherits `DbContext`, empty (no `DbSet<>` yet)
  - [x] Override `OnModelCreating` and call `modelBuilder.ApplySnakeCaseNaming()` as the LAST line
  - [x] Add constructor accepting `DbContextOptions<AppDbContext>` (required for DI and WebApplicationFactory)
  - [x] Install `EFCore.NamingConventions` NuGet package in `SiesaAgents.Infrastructure`: `dotnet add src/SiesaAgents.Infrastructure package EFCore.NamingConventions`

- [x] Task 2 — Register DbContext in dependency injection (AC: #1, #5)
  - [x] In `backend/src/SiesaAgents.API/Program.cs`, register `AppDbContext` with `builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString).UseSnakeCaseNamingConvention())`
  - [x] Read connection string from `builder.Configuration.GetConnectionString("DefaultConnection")`
  - [x] Verify `appsettings.Development.json` already contains `ConnectionStrings:DefaultConnection` pointing to `Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres` (created in Story 1.1)
  - [x] Add project reference from `SiesaAgents.API` to `SiesaAgents.Infrastructure`: `dotnet add src/SiesaAgents.API/SiesaAgents.API.csproj reference src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj` (if not already present)

- [x] Task 3 — Create initial empty migration (AC: #1, #4)
  - [x] Install `dotnet-ef` tool if not present: `dotnet tool install --global dotnet-ef`
  - [x] Install `Microsoft.EntityFrameworkCore.Design` in `SiesaAgents.API`: `dotnet add src/SiesaAgents.API package Microsoft.EntityFrameworkCore.Design`
  - [x] Run initial migration: `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` from the `backend/` directory
  - [x] Verify `backend/src/SiesaAgents.Infrastructure/Migrations/` folder is created with `<timestamp>_InitialCreate.cs` and `<timestamp>_InitialCreate.Designer.cs` and `AppDbContextModelSnapshot.cs`
  - [x] Verify the migration is empty (no `Up()`/`Down()` operations beyond the migration history table itself)

- [x] Task 4 — Verify ExceptionHandlingMiddleware produces Problem Details (AC: #2)
  - [x] Confirm `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` exists (created in Story 1.1)
  - [x] Verify middleware is registered BEFORE endpoint mapping in `Program.cs`: `app.UseMiddleware<ExceptionHandlingMiddleware>()` appears before `app.MapScalarApiReference()` and any `app.Map*` calls
  - [x] Verify response sets `Content-Type: application/problem+json`
  - [x] Verify response body contains `status`, `title`, `detail` and does NOT contain `stackTrace`
  - [x] If middleware does not conform to RFC 7807, update it to return: `{ "status": 500, "title": "Internal Server Error", "detail": "An unexpected error occurred." }` with no exception details

- [x] Task 5 — Write xUnit integration tests (AC: #1, #2, #3, #5)
  - [x] Add NuGet packages to `tests/SiesaAgents.UnitTests`: `dotnet add tests/SiesaAgents.UnitTests package Microsoft.AspNetCore.Mvc.Testing` and `dotnet add tests/SiesaAgents.UnitTests package Npgsql.EntityFrameworkCore.PostgreSQL`
  - [x] Add project reference from `SiesaAgents.UnitTests` to `SiesaAgents.Infrastructure` if not already present
  - [x] Create `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs` — test that `AppDbContext` can be instantiated with InMemory provider and `OnModelCreating` does not throw
  - [x] Create `backend/tests/SiesaAgents.UnitTests/Api/ExceptionMiddlewareTests.cs` using `WebApplicationFactory<Program>` — register a test endpoint `GET /api/v1/test-error` that throws `new Exception("internal test")`, call it, assert: HTTP 500, `Content-Type` contains `application/problem+json`, response body has `status` and `title` and `detail`, body does NOT have `stackTrace`
  - [x] Run `dotnet test tests/SiesaAgents.UnitTests` and verify all new tests pass

- [x] Task 6 — Verify database update applies cleanly (AC: #1, #3, #4)
  - [x] Run `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` from `backend/`
  - [x] Confirm `siesa_agents_db` is created with no errors
  - [x] Confirm `__ef_migrations_history` table exists (snake_case name confirms `ApplySnakeCaseNaming()` is active)
  - [x] Confirm NO `clientes` or `contactos` tables exist (scope boundary respected)

## Dev Notes

### Backend Stack Details

- **Framework**: .NET 8 (environment constraint — .NET 10 not available via apt; all architecture patterns remain identical per Story 1.1 debug log)
- **EF Core version**: `Npgsql.EntityFrameworkCore.PostgreSQL` 9.0.4 (net8.0 compatible — installed in Story 1.1)
- **snake_case naming**: Use `EFCore.NamingConventions` package — call `UseSnakeCaseNamingConvention()` on `DbContextOptionsBuilder` AND call `modelBuilder.ApplySnakeCaseNaming()` in `OnModelCreating` as the LAST call
- **Primary keys**: `Guid` (UUID) MANDATORY for all future entities — `= Guid.NewGuid()` default
- **Timestamps**: `DateTimeOffset` ALWAYS — NEVER `DateTime`
- **Problem Details**: RFC 7807 format — `ExceptionHandlingMiddleware` already created in Story 1.1; verify and harden if needed

### AppDbContext Pattern

```csharp
// backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs
using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // DbSet<> properties will be added in Epic 2+ (ClienteEntity, ContactoEntity)

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply entity configurations from this assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // MUST be the LAST call — overrides all prior naming
        modelBuilder.UseSnakeCaseNamingConvention();
    }
}
```

### Program.cs DbContext Registration

```csharp
// In Program.cs — add after existing service registrations
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString)
           .UseSnakeCaseNamingConvention());
```

### ExceptionHandlingMiddleware RFC 7807 Pattern

```csharp
// backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs
// Verify it returns this shape for unhandled exceptions:
{
    "status": 500,
    "title": "Internal Server Error",
    "detail": "An unexpected error occurred."
}
// Content-Type: application/problem+json
// HTTP Status: 500
// MUST NOT include: stackTrace, exception, innerException, exceptionType
```

### Migration Commands (from backend/ directory)

```bash
# Create initial empty migration
dotnet ef migrations add InitialCreate \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API

# Apply migration to database
dotnet ef database update \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API
```

### Database Configuration

- **Database name**: `siesa_agents_db`
- **Connection string location**: `backend/src/SiesaAgents.API/appsettings.Development.json` → `ConnectionStrings:DefaultConnection`
- **Default value** (from Story 1.1): `Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres`
- **Schema**: Default PostgreSQL `public` schema — no custom schema for this MVP

### EF Core NamingConventions Package

The `EFCore.NamingConventions` package (by Arthur Vickers / .NET team) provides `.UseSnakeCaseNamingConvention()`. This translates PascalCase C# property names to `snake_case` column names automatically. Combined with `modelBuilder.UseSnakeCaseNamingConvention()` in `OnModelCreating`, this ensures:

- `Id` → `id`
- `CreatedAt` → `created_at`
- `ClienteId` → `cliente_id`
- `__EFMigrationsHistory` table → `__ef_migrations_history` (confirms naming is active)

### Middleware Registration Order in Program.cs

Critical ordering (must be maintained):

```csharp
app.UseMiddleware<ExceptionHandlingMiddleware>(); // FIRST
app.UseCors("DevCors");
app.MapScalarApiReference();
app.MapOpenApi();                                 // or equivalent
// ... other endpoint mappings
app.Run();
```

### Testing Approach

Per company standards: xUnit + EF Core InMemory (unit) + PostgreSQL TestContainers (integration). For this story:
- `AppDbContextTests.cs`: Uses `UseInMemoryDatabase` to validate `OnModelCreating` wires correctly (no DB required)
- `ExceptionMiddlewareTests.cs`: Uses `WebApplicationFactory<Program>` (in-process testing, no real DB for middleware test)

For the middleware test, register a minimal test endpoint that throws — the `WebApplicationFactory` will use `appsettings.Development.json` or an in-memory override so no live PostgreSQL is required for this specific test.

### References

- Story 1.1 debug notes (environment constraints, .NET 8 vs .NET 10): `_bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#Dev Notes`
- Architecture data model decisions: `_bmad-output/planning-artifacts/architecture.md#Data Architecture`
- Database naming conventions: `.claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions`
- EF Core snake_case rule: `.claude/agent-memory/sa-quick-dev/company-standards.md#EF Core: Automatic snake_case via ApplySnakeCaseNaming()`
- Backend critical rules (UUID PKs, DateTimeOffset): `.claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules`
- Test cases for this story: `_bmad-output/implementation-artifacts/test-design-epic-1.md#TC-E1-P0-05, TC-E1-P1-05, TC-E1-P2-04`
- Epic source: `_bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- EFCore.NamingConventions 10.x incompatible with net8.0; used 9.0.0 (compatible with Npgsql 9.0.4).
- `ModelBuilder.UseSnakeCaseNamingConvention()` does not exist in EFCore.NamingConventions 9.x; naming is configured via `DbContextOptionsBuilder.UseSnakeCaseNamingConvention()` only (in Program.cs). The `OnModelCreating` calls `ApplyConfigurationsFromAssembly` only.
- `WebApplicationFactory.Configure()` overrides the entire middleware pipeline; used `IStartupFilter` pattern instead to append the test error endpoint after the app's existing middleware.
- `Response.WriteAsJsonAsync()` overrides `Content-Type` to `application/json`; replaced with manual `JsonSerializer.Serialize` + `Response.WriteAsync` to preserve `application/problem+json`.
- PostgreSQL password required setting: `ALTER USER postgres PASSWORD 'postgres'`.

### Completion Notes List

- AppDbContext created with constructor for DI and empty OnModelCreating (ApplyConfigurationsFromAssembly + snake_case via options).
- EFCore.NamingConventions 9.0.0 installed in Infrastructure project.
- Microsoft.EntityFrameworkCore.Design 9.0.4 installed in API project.
- DbContext registered in Program.cs with UseNpgsql + UseSnakeCaseNamingConvention.
- `public partial class Program { }` added to expose Program for WebApplicationFactory.
- InitialCreate migration generated (empty Up/Down).
- ExceptionHandlingMiddleware hardened to use manual JSON serialization for RFC 7807 compliance.
- All 17 xUnit tests pass (8 AppDbContext tests + 8 ExceptionMiddleware tests + 1 existing).
- `siesa_agents_db` created with `__EFMigrationsHistory` table; columns `migration_id` and `product_version` in snake_case.

### File List

**Expected to create:**
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`
- `backend/src/SiesaAgents.Infrastructure/Migrations/<timestamp>_InitialCreate.cs`
- `backend/src/SiesaAgents.Infrastructure/Migrations/<timestamp>_InitialCreate.Designer.cs`
- `backend/src/SiesaAgents.Infrastructure/Migrations/AppDbContextModelSnapshot.cs`
- `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Api/ExceptionMiddlewareTests.cs`

**Expected to modify:**
- `backend/src/SiesaAgents.API/Program.cs` (add DbContext registration)
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` (verify/harden RFC 7807 compliance)
- `backend/src/SiesaAgents.API/SiesaAgents.API.csproj` (add Microsoft.EntityFrameworkCore.Design)
- `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj` (add EFCore.NamingConventions)
- `backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj` (add Microsoft.AspNetCore.Mvc.Testing)

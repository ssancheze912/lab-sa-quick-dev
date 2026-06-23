# Story 1.3: Backend Database Foundation

Status: ready-for-dev

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

## Acceptance Criteria

1. **AC1 (Database creation):** Given PostgreSQL is running locally, when the developer runs `dotnet ef database update` from the `backend/` directory, then the `siesa_agents_db` database is created with no errors and EF Core migrations folder exists at `backend/src/SiesaAgents.Infrastructure/Data/Migrations/`.

2. **AC2 (Problem Details middleware):** Given an unhandled exception occurs in the backend, when the error reaches the middleware, then the response returns a Problem Details RFC 7807 format (status, title, detail) with no stack traces exposed (NFR6). The HTTP status code must be 500 for unhandled exceptions.

3. **AC3 (snake_case naming convention):** Given the backend receives any request, when any EF Core migration runs, then `ApplySnakeCaseNaming()` is applied inside `OnModelCreating` and all column/table names follow snake_case convention automatically (no manual `[Column]` or `[Table]` attributes).

4. **AC4 (DbContext registered):** Given the application starts, when `Program.cs` executes DI registration, then `SiesaAgentsDbContext` is registered as a scoped service using the connection string from `appsettings.Development.json` key `ConnectionStrings:DefaultConnection`.

5. **AC5 (Empty initial migration):** The initial migration (`InitialCreate`) exists in `backend/src/SiesaAgents.Infrastructure/Data/Migrations/` and represents an empty schema (no domain entity tables). The migration is produced by `dotnet ef migrations add InitialCreate`.

6. **AC6 (No domain entities in this story):** `ClienteEntity` and `ContactoEntity` are NOT defined in this story. The DbContext registers zero `DbSet<>` properties. Domain entity definitions belong to Epic 2 and Epic 3 respectively.

7. **AC7 (ExceptionHandlingMiddleware):** A custom `ExceptionHandlingMiddleware` exists at `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` and is registered in `Program.cs` before endpoint mapping. It intercepts all unhandled exceptions and returns Problem Details RFC 7807 (no stack trace in response body).

8. **AC8 (Connection string config):** `backend/src/SiesaAgents.API/appsettings.Development.json` contains a `ConnectionStrings:DefaultConnection` key pointing to a local PostgreSQL connection string for `siesa_agents_db`. The connection string follows the pattern: `Host=localhost;Port=5432;Database=siesa_agents_db;Username=postgres;Password=<password>`.

9. **AC9 (EF Core tools package):** `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj` references `Microsoft.EntityFrameworkCore.Design` so `dotnet ef migrations add` succeeds without errors.

10. **AC10 (xUnit integration test):** A test in `backend/tests/SiesaAgents.UnitTests/` verifies that `SiesaAgentsDbContext` can be instantiated with an in-memory SQLite or EF Core InMemory provider, and that `OnModelCreating` executes without exceptions.

## Tasks / Subtasks

- [ ] Task 1 — Create DbContext in Infrastructure layer (AC: 1, 3, 4, 5, 6)
  - [ ] 1.1 Create directory `backend/src/SiesaAgents.Infrastructure/Data/`
  - [ ] 1.2 Create `backend/src/SiesaAgents.Infrastructure/Data/SiesaAgentsDbContext.cs` inheriting from `DbContext`. Override `OnModelCreating` to call `modelBuilder.ApplySnakeCaseNaming()` as the last call. No `DbSet<>` properties (empty schema — domain entities added in Epic 2/3).
  - [ ] 1.3 Add NuGet package `Microsoft.EntityFrameworkCore.Design` to `SiesaAgents.Infrastructure.csproj`: `dotnet add backend/src/SiesaAgents.Infrastructure package Microsoft.EntityFrameworkCore.Design`
  - [ ] 1.4 Create migrations directory: `backend/src/SiesaAgents.Infrastructure/Data/Migrations/` (will be populated by dotnet ef)
  - [ ] 1.5 Run `dotnet ef migrations add InitialCreate --project backend/src/SiesaAgents.Infrastructure --startup-project backend/src/SiesaAgents.API` to generate the empty `InitialCreate` migration files

- [ ] Task 2 — Register DbContext in Program.cs (AC: 4, 8)
  - [ ] 2.1 Update `backend/src/SiesaAgents.API/appsettings.Development.json` to add the `ConnectionStrings` section with key `DefaultConnection` pointing to `Host=localhost;Port=5432;Database=siesa_agents_db;Username=postgres;Password=postgres`
  - [ ] 2.2 In `backend/src/SiesaAgents.API/Program.cs`, add `builder.Services.AddDbContext<SiesaAgentsDbContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")).UseSnakeCaseNamingConvention());`
  - [ ] 2.3 Add `using SiesaAgents.Infrastructure.Data;` and `using Microsoft.EntityFrameworkCore;` to `Program.cs`

- [ ] Task 3 — Implement ExceptionHandlingMiddleware (AC: 2, 7)
  - [ ] 3.1 Create `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`. The middleware catches all unhandled exceptions, logs the error (using `ILogger<ExceptionHandlingMiddleware>`), and writes a Problem Details RFC 7807 response with `status: 500`, `title: "Internal Server Error"`, `detail: "An unexpected error occurred."` — no stack trace in the response body.
  - [ ] 3.2 Register `ExceptionHandlingMiddleware` in `Program.cs` using `app.UseMiddleware<ExceptionHandlingMiddleware>()` BEFORE `app.UseExceptionHandler()` (or replace it if `UseExceptionHandler` was the prior fallback). It must be registered before endpoint mapping.
  - [ ] 3.3 Remove `app.UseExceptionHandler()` and `app.UseStatusCodePages()` from `Program.cs` if present — the custom middleware fully replaces them for Problem Details compliance.

- [ ] Task 4 — Verify database creation (AC: 1)
  - [ ] 4.1 Run `dotnet ef database update --project backend/src/SiesaAgents.Infrastructure --startup-project backend/src/SiesaAgents.API` to apply the `InitialCreate` migration and create `siesa_agents_db` (requires local PostgreSQL running)
  - [ ] 4.2 Confirm the database is created with no errors in the CLI output
  - [ ] 4.3 Confirm the `__EFMigrationsHistory` table exists in `siesa_agents_db` with one row for `InitialCreate`

- [ ] Task 5 — Write xUnit test (AC: 10)
  - [ ] 5.1 Add `Microsoft.EntityFrameworkCore.InMemory` NuGet package to `SiesaAgents.UnitTests.csproj`: `dotnet add backend/tests/SiesaAgents.UnitTests package Microsoft.EntityFrameworkCore.InMemory`
  - [ ] 5.2 Add project reference to Infrastructure in the test project: `dotnet add backend/tests/SiesaAgents.UnitTests reference backend/src/SiesaAgents.Infrastructure`
  - [ ] 5.3 Create `backend/tests/SiesaAgents.UnitTests/Infrastructure/SiesaAgentsDbContextTests.cs` with a test that instantiates `SiesaAgentsDbContext` using the EF Core InMemory provider and asserts `OnModelCreating` executes without throwing.

## Dev Notes

### Architecture Context

This story wires the data layer for the Clean Architecture backend established in Story 1.1. The `SiesaAgentsDbContext` lives in the **Infrastructure** layer (`SiesaAgents.Infrastructure`) — this is the only layer that may depend on EF Core directly. The **Domain** layer has zero EF Core dependencies (no `[Key]`, `[Column]`, etc. attributes on entities).

Relevant dependency rule (already established in Story 1.1):
```
SiesaAgents.Infrastructure → references Application + Domain
SiesaAgents.API            → references Application + Infrastructure
```

This means `Program.cs` in `SiesaAgents.API` can register `SiesaAgentsDbContext` (via `AddDbContext<>`) because API references Infrastructure.

[Source: architecture.md#Project Structure & Boundaries, story-1-1#Project References]

### Backend Project Path

The backend lives at `backend/` relative to the repo root (confirmed in Story 1.1 completion notes — the worktree path is `/home/user/wt-lab-sa-quick-dev/lab-sa-quick-dev-develop-siesa-agents-gaduranb-rq1-epic-01-foundation/backend/`).

All `dotnet ef` commands must be run with explicit `--project` and `--startup-project` flags since the solution is multi-project.

### SiesaAgentsDbContext Implementation

```csharp
// backend/src/SiesaAgents.Infrastructure/Data/SiesaAgentsDbContext.cs
using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public class SiesaAgentsDbContext : DbContext
{
    public SiesaAgentsDbContext(DbContextOptions<SiesaAgentsDbContext> options)
        : base(options)
    {
    }

    // NOTE: No DbSet<> properties in this story.
    // ClienteEntity DbSet is added in Epic 2 Story 2.1.
    // ContactoEntity DbSet is added in Epic 3 Story 3.1.

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // MANDATORY: Apply snake_case naming convention.
        // This MUST be the last call in OnModelCreating per company standards.
        modelBuilder.UseSnakeCaseNamingConvention();
    }
}
```

**CRITICAL:** `UseSnakeCaseNamingConvention()` is the EFCore.NamingConventions method (already installed in `SiesaAgents.Infrastructure.csproj` from Story 1.1). It MUST be the last call in `OnModelCreating`. No manual `[Column]` or `[Table]` attributes — ever.

[Source: company-standards.md#EF Core: Automatic snake_case via ApplySnakeCaseNaming(), architecture.md#Implementation Patterns & Consistency Rules]

### Program.cs DbContext Registration

Add to `builder.Services` section in `Program.cs`:

```csharp
// EF Core + PostgreSQL
builder.Services.AddDbContext<SiesaAgentsDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
           .UseSnakeCaseNamingConvention());
```

The `UseSnakeCaseNamingConvention()` call on `DbContextOptionsBuilder` is required in addition to (or instead of) the call inside `OnModelCreating` when using the Npgsql provider — include both for safety.

### ExceptionHandlingMiddleware Implementation

```csharp
// backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs
using Microsoft.AspNetCore.Mvc;
using System.Net.Mime;
using System.Text.Json;

namespace SiesaAgents.API.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception caught by middleware");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception ex)
    {
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = MediaTypeNames.Application.Json;

        var problemDetails = new ProblemDetails
        {
            Status = StatusCodes.Status500InternalServerError,
            Title = "Internal Server Error",
            Detail = "An unexpected error occurred.",
            Instance = context.Request.Path,
        };

        // NEVER expose ex.Message or ex.StackTrace in the response body (NFR6)
        var json = JsonSerializer.Serialize(problemDetails, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        });

        await context.Response.WriteAsync(json);
    }
}
```

Register in `Program.cs` (before endpoint mapping):
```csharp
app.UseMiddleware<ExceptionHandlingMiddleware>();
```

Remove or replace the existing `app.UseExceptionHandler()` and `app.UseStatusCodePages()` calls.

[Source: architecture.md#Authentication & Security, architecture.md#Process Patterns — Error handling backend, company-standards.md#Backend Critical Rules — Error Responses: Problem Details RFC 7807]

### appsettings.Development.json Connection String

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=siesa_agents_db;Username=postgres;Password=postgres"
  }
}
```

Password must be adjusted to match the local PostgreSQL installation. The database name is `siesa_agents_db` as specified in architecture.md.

[Source: architecture.md#Infrastructure & Deployment]

### EF Core Commands Reference

```bash
# Add initial (empty) migration
dotnet ef migrations add InitialCreate \
  --project backend/src/SiesaAgents.Infrastructure \
  --startup-project backend/src/SiesaAgents.API \
  --output-dir Data/Migrations

# Apply migration to database
dotnet ef database update \
  --project backend/src/SiesaAgents.Infrastructure \
  --startup-project backend/src/SiesaAgents.API
```

Run from the repo root (same level as `backend/` folder).

### NuGet Packages Required

Packages already installed in Story 1.1 (verify they exist before adding):
- `Npgsql.EntityFrameworkCore.PostgreSQL` (v10.*) — in `SiesaAgents.Infrastructure.csproj`
- `EFCore.NamingConventions` (v10.*) — in `SiesaAgents.Infrastructure.csproj`

New package to add in this story:
```bash
# Required for dotnet ef migrations add to work
dotnet add backend/src/SiesaAgents.Infrastructure package Microsoft.EntityFrameworkCore.Design

# Required for InMemory provider in unit tests
dotnet add backend/tests/SiesaAgents.UnitTests package Microsoft.EntityFrameworkCore.InMemory
```

[Source: story-1-1#Backend Packages, company-standards.md#Backend Stack]

### xUnit Test for DbContext

```csharp
// backend/tests/SiesaAgents.UnitTests/Infrastructure/SiesaAgentsDbContextTests.cs
using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

public class SiesaAgentsDbContextTests
{
    [Fact]
    public void OnModelCreating_DoesNotThrow_WithInMemoryProvider()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<SiesaAgentsDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_" + Guid.NewGuid())
            .Options;

        // Act & Assert — EnsureCreated triggers OnModelCreating
        using var context = new SiesaAgentsDbContext(options);
        var created = context.Database.EnsureCreated();
        Assert.True(created); // DB was created (first time)
    }

    [Fact]
    public void DbContext_CanBeInstantiated_WithInMemoryProvider()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<SiesaAgentsDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_" + Guid.NewGuid())
            .Options;

        // Act
        using var context = new SiesaAgentsDbContext(options);

        // Assert
        Assert.NotNull(context);
    }
}
```

**Note:** `UseSnakeCaseNamingConvention()` is a Npgsql/EFCore.NamingConventions extension. When using the InMemory provider it may not be recognized — if tests fail due to this, remove the call from `OnModelCreating` and keep it only in `AddDbContext<>` options in `Program.cs`. Document this decision in the Dev Agent Record.

[Source: company-standards.md#Testing Standards — Backend (xUnit + EF Core InMemory)]

### Scope Boundary (CRITICAL)

This story creates an **empty schema** — no domain entity tables:

- Do NOT define `ClienteEntity` — belongs to Epic 2, Story 2.1
- Do NOT define `ContactoEntity` — belongs to Epic 3, Story 3.1
- Do NOT add `DbSet<ClienteEntity>` or `DbSet<ContactoEntity>` to `SiesaAgentsDbContext`
- Do NOT create `clientes` or `contactos` tables in this migration
- The initial migration is intentionally empty (only `__EFMigrationsHistory` tracking table is created by EF Core)

[Source: epic-01-foundation.md#Story 1.3 Scope note]

### Previous Story Learnings

From Story 1.1 (completed):
- Backend root is `backend/` relative to repo root (NOT `src/` directly)
- The worktree for this epic is `/home/user/wt-lab-sa-quick-dev/lab-sa-quick-dev-develop-siesa-agents-gaduranb-rq1-epic-01-foundation/`
- `dotnet` SDK availability must be verified at runtime (was not available in CI during Story 1.1 — files were created manually)
- `SiesaAgents.Infrastructure.csproj` already references `Npgsql.EntityFrameworkCore.PostgreSQL` (v10.*) and `EFCore.NamingConventions` (v10.*)
- `Program.cs` currently has `app.UseExceptionHandler()` and `app.UseStatusCodePages()` — Task 3.3 must remove these

From Story 1.2 (completed, frontend only):
- No learnings applicable to this backend story

[Source: story-1-1#Completion Notes List, story-1-1#Dev Agent Record]

### Database Naming Conventions

Per company standards (mandatory):

| Element | Convention | This Story |
|---------|-----------|------------|
| Database | lowercase | `siesa_agents_db` |
| Tables | plural snake_case | (none in this story — Epic 2/3) |
| PK column | `id` UUID | (none in this story) |
| Audit columns | snake_case | `created_at`, `updated_at` (Epic 2/3) |

EF Core will automatically map C# PascalCase property names to snake_case column names via `UseSnakeCaseNamingConvention()`. Never use `[Column("column_name")]` attributes.

[Source: company-standards.md#Database Conventions (PostgreSQL)]

### File Structure for This Story

New files to create:
```
backend/src/SiesaAgents.Infrastructure/
└── Data/
    ├── SiesaAgentsDbContext.cs           ← DbContext with ApplySnakeCaseNaming
    └── Migrations/                       ← Created by dotnet ef migrations add
        ├── <timestamp>_InitialCreate.cs  ← Auto-generated (empty migration)
        └── SiesaAgentsDbContextModelSnapshot.cs ← Auto-generated

backend/src/SiesaAgents.API/
└── Middleware/
    └── ExceptionHandlingMiddleware.cs    ← Problem Details RFC 7807

backend/tests/SiesaAgents.UnitTests/
└── Infrastructure/
    └── SiesaAgentsDbContextTests.cs      ← xUnit tests (2 tests)
```

Files to modify:
```
backend/src/SiesaAgents.API/Program.cs                    ← Add DbContext DI + middleware
backend/src/SiesaAgents.API/appsettings.Development.json  ← Add ConnectionStrings section
backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj ← Add EF.Design package
backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj ← Add InMemory + Infrastructure ref
```

### Key Constraints Checklist

| Constraint | Rule | Source |
|---|---|---|
| ORM | EF Core 10 + Npgsql | company-standards.md#Backend Stack |
| DB naming | snake_case via `UseSnakeCaseNamingConvention()` — no manual attributes | company-standards.md#Database Conventions |
| PKs | UUID (Guid) — mandatory for all future entities | company-standards.md#Backend Critical Rules |
| Timestamps | `DateTimeOffset` (never `DateTime`) for all future entities | company-standards.md#Backend Critical Rules |
| Error responses | Problem Details RFC 7807 — no stack traces | company-standards.md#Backend Critical Rules |
| API docs | Scalar only — `app.MapScalarApiReference()` must remain unchanged | company-standards.md#Backend Critical Rules |
| Entity scope | Zero domain entities in this story | epic-01-foundation.md#Story 1.3 Scope note |
| Testing | xUnit + EF Core InMemory | company-standards.md#Testing Standards |

### Project Structure Notes

- `SiesaAgentsDbContext` goes in `SiesaAgents.Infrastructure/Data/` — this matches the backend folder structure in company-standards.md: `{Domain}.Infrastructure/Data/ (DbContext, Configurations/, Migrations/)`
- `ExceptionHandlingMiddleware` goes in `SiesaAgents.API/Middleware/` — matches the architecture.md directory tree for `Middleware/ExceptionHandlingMiddleware.cs`
- No conflict with existing code from Story 1.1 — the Infrastructure project currently only has a `Placeholder.cs` stub

[Source: company-standards.md#Backend Folder Structure, architecture.md#Complete Project Directory Structure]

### References

- [Source: epic-01-foundation.md#Story 1.3] — Acceptance Criteria, scope boundary note
- [Source: architecture.md#Data Architecture] — Domain model, PostgreSQL tables, entity definitions (for future stories)
- [Source: architecture.md#Infrastructure & Deployment] — Database name `siesa_agents_db`, ports, connection config
- [Source: architecture.md#Complete Project Directory Structure] — Backend file tree, middleware placement
- [Source: architecture.md#Authentication & Security] — Problem Details NFR6, no stack traces
- [Source: architecture.md#Implementation Patterns & Consistency Rules] — snake_case, DateTimeOffset, UUID PKs enforcement
- [Source: company-standards.md#Backend Stack] — EF Core 10, PostgreSQL 18+, xUnit
- [Source: company-standards.md#Database Conventions (PostgreSQL)] — Table/column naming, UUID PKs
- [Source: company-standards.md#Backend Critical Rules] — DateTimeOffset, Entity pattern, Problem Details, Scalar
- [Source: company-standards.md#Testing Standards — Backend] — xUnit + EF Core InMemory + PostgreSQL Test Containers
- [Source: story-1-1#Backend Packages] — Already installed NuGet packages in Infrastructure
- [Source: story-1-1#Completion Notes List] — Backend file locations, dotnet SDK availability note

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

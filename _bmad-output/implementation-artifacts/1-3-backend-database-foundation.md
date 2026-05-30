# Story 1.3: Backend Database Foundation

Status: ready-for-dev

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

## Acceptance Criteria

1. **Given** PostgreSQL is running locally, **When** the developer runs `dotnet ef database update` from the `backend/` directory, **Then** the `siesa_agents_db` database is created with no errors, and an EF Core `Migrations/` folder exists in `src/SiesaAgents.Infrastructure/` containing at least one migration file (the initial empty migration).

2. **Given** the EF Core `AppDbContext` is configured, **When** `OnModelCreating` executes, **Then** `modelBuilder.ApplySnakeCaseNaming()` is called as the last statement, ensuring all future table and column names follow snake_case without any manual `[Column]` or `[Table]` attributes.

3. **Given** an unhandled exception occurs anywhere in the backend request pipeline, **When** the exception reaches the `ExceptionHandlingMiddleware`, **Then** the HTTP response has `Content-Type: application/problem+json`, an appropriate status code (500 for unexpected errors), and a body conforming to Problem Details RFC 7807 — containing `status`, `title`, and `detail` fields — with no stack traces or internal error messages exposed to the client (NFR6).

4. **Given** the backend starts successfully, **When** `dotnet build SiesaAgents.sln` is executed, **Then** all projects compile with zero errors. The connection string `Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres` is read from `appsettings.Development.json` (not hardcoded).

5. **Given** the `AppDbContext` is registered in DI, **When** the application starts, **Then** EF Core is configured with the Npgsql provider using the `DefaultConnection` connection string from configuration. No domain entity `DbSet` properties exist yet — this context is intentionally empty for this story (scope note: `ClienteEntity` and `ContactoEntity` are added in Epics 2 and 3 respectively).

## Tasks / Subtasks

- [ ] Task 1 — Create `AppDbContext` in Infrastructure layer (AC: #2, #5)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`
  - [ ] Inherit from `DbContext` and inject `DbContextOptions<AppDbContext>` via constructor
  - [ ] Override `OnModelCreating(ModelBuilder modelBuilder)` and call `modelBuilder.ApplySnakeCaseNaming()` as the last statement
  - [ ] Add no `DbSet<>` properties in this story — intentionally empty until Epic 2 / Epic 3
  - [ ] Install `EFCore.NamingConventions` NuGet package: `dotnet add src/SiesaAgents.Infrastructure package EFCore.NamingConventions`

- [ ] Task 2 — Register EF Core and `AppDbContext` in `Program.cs` (AC: #4, #5)
  - [ ] In `backend/src/SiesaAgents.API/Program.cs`, add `builder.Services.AddDbContext<AppDbContext>` wired to Npgsql
  - [ ] Read connection string via `builder.Configuration.GetConnectionString("DefaultConnection")`
  - [ ] Use `.UseNpgsql(connectionString).UseSnakeCaseNamingConvention()` on the `DbContextOptionsBuilder`
  - [ ] Add `using SiesaAgents.Infrastructure.Data;` and `using Microsoft.EntityFrameworkCore;`
  - [ ] Register `AppDbContext` after existing service registrations (CORS, OpenApi) and before `builder.Build()`

- [ ] Task 3 — Verify `appsettings.Development.json` connection string (AC: #4)
  - [ ] Open `backend/src/SiesaAgents.API/appsettings.Development.json`
  - [ ] Confirm `"ConnectionStrings": { "DefaultConnection": "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres" }` is present (added in Story 1.1 Task 5 — verify, do NOT duplicate)
  - [ ] Ensure no connection string is hardcoded anywhere in C# source files

- [ ] Task 4 — Install EF Core tools and create initial migration (AC: #1)
  - [ ] Verify `dotnet-ef` tool is installed globally: `dotnet tool install --global dotnet-ef` (skip if already installed)
  - [ ] Add `Microsoft.EntityFrameworkCore.Design` package to the API project (required for migrations CLI): `dotnet add src/SiesaAgents.Infrastructure package Microsoft.EntityFrameworkCore.Design`
  - [ ] Create the initial (empty) migration from the `backend/` directory:
    ```bash
    dotnet ef migrations add InitialCreate \
      --project src/SiesaAgents.Infrastructure \
      --startup-project src/SiesaAgents.API \
      --output-dir Data/Migrations
    ```
  - [ ] Verify `backend/src/SiesaAgents.Infrastructure/Data/Migrations/` folder is created with `<timestamp>_InitialCreate.cs` and `<timestamp>_InitialCreate.Designer.cs`
  - [ ] Run `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` and verify `siesa_agents_db` is created in PostgreSQL with no errors

- [ ] Task 5 — Implement `ExceptionHandlingMiddleware` (AC: #3)
  - [ ] Open `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` (created as stub in Story 1.1 Task 4 — replace/complete its contents)
  - [ ] Implement the `InvokeAsync` method to wrap `await next(context)` in a `try/catch (Exception)`
  - [ ] On exception: set `context.Response.ContentType = "application/problem+json"`, `context.Response.StatusCode = 500`, write `ProblemDetails` JSON with `Status = 500`, `Title = "An unexpected error occurred."`, `Detail = null` (NEVER expose `ex.Message` or stack trace)
  - [ ] Verify middleware is already registered in `Program.cs` via `app.UseMiddleware<ExceptionHandlingMiddleware>()` before routing (Story 1.1 Task 4) — confirm registration order is: ExceptionHandlingMiddleware → CORS → Scalar → endpoints
  - [ ] Add `using Microsoft.AspNetCore.Mvc;` for `ProblemDetails` type

- [ ] Task 6 — Unit tests for `ExceptionHandlingMiddleware` (AC: #3)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/API/Middleware/ExceptionHandlingMiddlewareTests.cs`
  - [ ] Test: when `next` throws an unhandled `Exception`, the response status is `500`, `Content-Type` is `application/problem+json`, and the body does not contain stack trace text
  - [ ] Test: when `next` completes without exception, the response passes through unchanged
  - [ ] Use xUnit `[Fact]` and `DefaultHttpContext` from `Microsoft.AspNetCore.Http` to build test contexts without mocking frameworks
  - [ ] Run `dotnet test tests/SiesaAgents.UnitTests` — all tests must pass

- [ ] Task 7 — Integration test: database connectivity (AC: #1, #4)
  - [ ] Create `backend/tests/SiesaAgents.IntegrationTests/Data/AppDbContextTests.cs`
  - [ ] Use `WebApplicationFactory<Program>` or a direct `AppDbContext` instance pointed at the local `siesa_agents_db`
  - [ ] Test: `context.Database.CanConnectAsync()` returns `true`
  - [ ] Test: `context.Database.GetPendingMigrationsAsync()` returns an empty list (all migrations applied)
  - [ ] Run integration tests: all tests pass

## Dev Notes

### Backend Architecture Context

This story is purely backend. No frontend files are touched.

**Infrastructure layer responsibilities for this story:**
- `AppDbContext.cs` — EF Core DbContext with snake_case naming convention
- `Data/Migrations/` — EF Core migration history (initial empty migration)

**API layer responsibilities for this story:**
- `Middleware/ExceptionHandlingMiddleware.cs` — Problem Details RFC 7807 global error handler
- `Program.cs` — DI registration of `AppDbContext` with Npgsql

**Scope boundary (CRITICAL):** This story creates an **empty initial migration**. Do NOT add `ClienteEntity`, `ContactoEntity`, or any `DbSet<>` properties to `AppDbContext` — those are added in Epic 2 (Story 2.1) and Epic 3 (Story 3.1) respectively.

### `AppDbContext` Pattern

```csharp
// backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs
using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // No DbSet<> properties in this story — added in Epics 2 and 3
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Apply entity type configurations (none yet — added per entity in future stories)
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        
        // MUST be last — converts all table/column names to snake_case automatically
        modelBuilder.ApplySnakeCaseNaming();
    }
}
```

### EF Core DI Registration Pattern

```csharp
// In Program.cs — add after existing service registrations
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
           .UseSnakeCaseNamingConvention());
```

### `ExceptionHandlingMiddleware` Full Pattern

```csharp
// backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs
using Microsoft.AspNetCore.Mvc;

namespace SiesaAgents.API.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception)
        {
            context.Response.ContentType = "application/problem+json";
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            await context.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "An unexpected error occurred.",
                Detail = null   // NEVER expose ex.Message or ex.StackTrace
            });
        }
    }
}
```

### Middleware Registration Order in `Program.cs`

The correct order is critical — `ExceptionHandlingMiddleware` must be registered BEFORE any other middleware so it can catch exceptions from the entire pipeline:

```csharp
var app = builder.Build();

// 1. Exception handling first — wraps everything below
app.UseMiddleware<ExceptionHandlingMiddleware>();

// 2. CORS — must be before routing
app.UseCors("DevCors");

// 3. API docs
app.MapScalarApiReference();

// 4. Endpoints (none yet in this story)
app.Run();
```

### NuGet Package Summary for This Story

| Package | Project | Purpose |
|---|---|---|
| `EFCore.NamingConventions` | `SiesaAgents.Infrastructure` | `ApplySnakeCaseNaming()` / `UseSnakeCaseNamingConvention()` |
| `Microsoft.EntityFrameworkCore.Design` | `SiesaAgents.Infrastructure` | Required for `dotnet ef migrations` CLI commands |

`Npgsql.EntityFrameworkCore.PostgreSQL` was already added to `SiesaAgents.Infrastructure` in Story 1.1.

### Migration Commands Reference

All migration commands must be run from `backend/` directory:

```bash
# Create migration
dotnet ef migrations add InitialCreate \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API \
  --output-dir Data/Migrations

# Apply migration (creates siesa_agents_db)
dotnet ef database update \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API

# List migrations (verify state)
dotnet ef migrations list \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API
```

### Database Naming Conventions

Per company standards (`company-standards.md` and `architecture.md`):
- Tables: plural snake_case (e.g., `clientes`, `contactos`)
- Columns: snake_case (e.g., `created_at`, `cliente_id`)
- PK column: `id` (UUID)
- `ApplySnakeCaseNaming()` automates this — NO manual `[Column]` or `[Table]` attributes permitted

### Backend Entity Rules (for future stories referencing this story)

When entities are added in Epic 2 / Epic 3, they MUST follow these patterns (established here):
- **PK type**: `Guid` — initialized as `Guid.NewGuid()`
- **Timestamps**: `DateTimeOffset` — ALWAYS, NEVER `DateTime`
- **Pattern**: private/protected constructor + static `Create()` factory method
- **`OnModelCreating`**: call `modelBuilder.ApplySnakeCaseNaming()` as last line (already set up in `AppDbContext`)

### Testing Standards

- **Framework**: xUnit (`tests/SiesaAgents.UnitTests/`)
- **Structure**: Arrange / Act / Assert
- **Integration tests**: `tests/SiesaAgents.IntegrationTests/` using real PostgreSQL (`siesa_agents_db`)
- **Coverage target**: > 80% for files created in this story

### Previous Stories Learnings

- Story 1.1 created `ExceptionHandlingMiddleware.cs` as a stub and registered it in `Program.cs` — this story completes/verifies its full implementation
- Story 1.1 added `Npgsql.EntityFrameworkCore.PostgreSQL` to `SiesaAgents.Infrastructure` — verify it is present before adding `EFCore.NamingConventions`
- Story 1.1 set `appsettings.Development.json` with the `DefaultConnection` string — do NOT overwrite, only verify
- No controllers exist — `Program.cs` uses C# Minimal API exclusively (per company standards)
- Backend root is at `backend/` — all paths are relative to `backend/`

### Project Structure — Files Created/Modified in This Story

```
backend/
├── src/
│   ├── SiesaAgents.API/
│   │   ├── Program.cs                          ← MODIFY (add AppDbContext registration)
│   │   └── Middleware/
│   │       └── ExceptionHandlingMiddleware.cs   ← MODIFY (complete implementation from stub)
│   └── SiesaAgents.Infrastructure/
│       ├── SiesaAgents.Infrastructure.csproj   ← MODIFY (add EFCore.NamingConventions + EFCore.Design)
│       └── Data/
│           ├── AppDbContext.cs                  ← CREATE
│           └── Migrations/                      ← CREATE (by dotnet ef migrations add)
│               ├── <timestamp>_InitialCreate.cs
│               ├── <timestamp>_InitialCreate.Designer.cs
│               └── AppDbContextModelSnapshot.cs
└── tests/
    ├── SiesaAgents.UnitTests/
    │   └── API/
    │       └── Middleware/
    │           └── ExceptionHandlingMiddlewareTests.cs  ← CREATE
    └── SiesaAgents.IntegrationTests/
        └── Data/
            └── AppDbContextTests.cs                    ← CREATE
```

No frontend files are touched in this story.

### References

- EF Core + Npgsql setup: [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions]
- `ApplySnakeCaseNaming()` mandate: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions]
- Problem Details RFC 7807 requirement: [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md#NFR6]
- `ExceptionHandlingMiddleware` pattern: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#ExceptionHandlingMiddleware pattern]
- Backend project structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Database `siesa_agents_db`: [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment]
- Scope boundary (no ClienteEntity/ContactoEntity): [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3]
- Story 1.1 established packages + middleware stub: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#Tasks / Subtasks]
- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

# Story 1.3: Backend Database Foundation

Status: ready-for-dev

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

## Acceptance Criteria

1. **Given** PostgreSQL is running locally, **When** the developer runs `dotnet ef database update` from the `backend/` directory, **Then** the `siesa_agents_db` database is created with no errors and EF Core migrations folder exists at `backend/src/SiesaAgents.Infrastructure/Migrations/`.

2. **Given** the EF Core DbContext is configured, **When** `OnModelCreating` executes, **Then** `modelBuilder.ApplySnakeCaseNaming()` is applied as the last call, ensuring all future column and table names follow snake_case convention automatically — no manual `[Column]` or `[Table]` attributes on entities.

3. **Given** an unhandled exception occurs in the backend at any point, **When** the exception reaches the global middleware, **Then** the response returns a Problem Details RFC 7807 JSON body (`status`, `title`, `detail`) with HTTP status 500 and no stack traces or internal exception messages exposed to the caller. (NFR6)

4. **Given** the backend is started with `dotnet run` in `src/SiesaAgents.API`, **When** the application boots, **Then** `AppDbContext` is registered in the DI container using the `DefaultConnection` connection string from `appsettings.Development.json` pointing to `Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres`.

5. **Given** the initial migration is applied, **When** the developer inspects the `siesa_agents_db` database, **Then** only the EF Core `__EFMigrationsHistory` table exists — NO `clientes` or `contactos` tables are present (those are created in Epics 2 and 3 respectively).

6. **Given** `dotnet build SiesaAgents.sln` is executed after this story's changes, **When** the build completes, **Then** all four projects (API, Application, Domain, Infrastructure) compile with zero errors and zero warnings.

## Tasks / Subtasks

- [ ] Task 1 — Add EF Core NuGet packages to Infrastructure (AC: #1, #4, #6)
  - [ ] Add `Microsoft.EntityFrameworkCore` to `SiesaAgents.Infrastructure`: `dotnet add src/SiesaAgents.Infrastructure package Microsoft.EntityFrameworkCore`
  - [ ] Confirm `Npgsql.EntityFrameworkCore.PostgreSQL` is already present (added in Story 1.1); if not: `dotnet add src/SiesaAgents.Infrastructure package Npgsql.EntityFrameworkCore.PostgreSQL`
  - [ ] Add EF Core design tools for migrations: `dotnet add src/SiesaAgents.Infrastructure package Microsoft.EntityFrameworkCore.Design`
  - [ ] Add EF Core design tools to API project (required for `dotnet ef` CLI targeting): `dotnet add src/SiesaAgents.API package Microsoft.EntityFrameworkCore.Design`
  - [ ] Add EF Core tools to the global tool manifest if not present: `dotnet tool install --global dotnet-ef` (or confirm via `dotnet ef --version`)

- [ ] Task 2 — Create `AppDbContext` in Infrastructure layer (AC: #2, #4, #5)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`
  - [ ] Inherit from `DbContext`; constructor accepts `DbContextOptions<AppDbContext>`
  - [ ] Override `OnModelCreating(ModelBuilder modelBuilder)` — call `modelBuilder.ApplySnakeCaseNaming()` as the **last** statement
  - [ ] Do NOT add any `DbSet<>` properties in this story — no domain entities exist yet
  - [ ] Ensure the class is in namespace `SiesaAgents.Infrastructure.Data`

  ```csharp
  // backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs
  using Microsoft.EntityFrameworkCore;

  namespace SiesaAgents.Infrastructure.Data;

  public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
  {
      protected override void OnModelCreating(ModelBuilder modelBuilder)
      {
          base.OnModelCreating(modelBuilder);
          modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
          modelBuilder.ApplySnakeCaseNaming(); // MUST be last
      }
  }
  ```

- [ ] Task 3 — Register `AppDbContext` in `Program.cs` (AC: #4, #6)
  - [ ] Open `backend/src/SiesaAgents.API/Program.cs`
  - [ ] Add the `using` for `SiesaAgents.Infrastructure.Data`
  - [ ] Register the DbContext before `var app = builder.Build()`:
    ```csharp
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
    ```
  - [ ] Ensure `SiesaAgents.API.csproj` references `SiesaAgents.Infrastructure` project (should already exist from Story 1.1; verify)
  - [ ] Verify `dotnet build SiesaAgents.sln` passes with zero errors

- [ ] Task 4 — Configure `appsettings.Development.json` connection string (AC: #4)
  - [ ] Open `backend/src/SiesaAgents.API/appsettings.Development.json`
  - [ ] Ensure the `ConnectionStrings` section contains:
    ```json
    {
      "ConnectionStrings": {
        "DefaultConnection": "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres"
      }
    }
    ```
  - [ ] Confirm `appsettings.Development.json` is excluded from git via `.gitignore` (secrets must not be committed)

- [ ] Task 5 — Create and apply initial EF Core migration (AC: #1, #5)
  - [ ] Run the migration command from `backend/` directory:
    ```bash
    dotnet ef migrations add InitialCreate \
      --project src/SiesaAgents.Infrastructure \
      --startup-project src/SiesaAgents.API \
      --output-dir Data/Migrations
    ```
  - [ ] Verify the migration file is created at `backend/src/SiesaAgents.Infrastructure/Data/Migrations/`
  - [ ] Inspect the generated migration: confirm it contains only the `__EFMigrationsHistory` scaffolding — no Up() table creation calls
  - [ ] Apply the migration: `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
  - [ ] Connect to the `siesa_agents_db` database and verify only `__EFMigrationsHistory` table exists

- [ ] Task 6 — Verify and harden `ExceptionHandlingMiddleware` (AC: #3)
  - [ ] Open `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` (created in Story 1.1)
  - [ ] Confirm it catches ALL unhandled exceptions and writes Problem Details RFC 7807 format
  - [ ] Ensure `Detail = null` — never expose `ex.Message` or stack traces
  - [ ] Ensure `Content-Type: application/problem+json` is set on the response
  - [ ] Confirm middleware is registered in `Program.cs` BEFORE all other middleware: `app.UseMiddleware<ExceptionHandlingMiddleware>()`
  - [ ] If middleware does not exist (Story 1.1 task was skipped), create it now:

  ```csharp
  // backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs
  using Microsoft.AspNetCore.Mvc;

  namespace SiesaAgents.API.Middleware;

  public sealed class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
  {
      public async Task InvokeAsync(HttpContext context)
      {
          try
          {
              await next(context);
          }
          catch (Exception ex)
          {
              logger.LogError(ex, "Unhandled exception on {Method} {Path}", context.Request.Method, context.Request.Path);
              context.Response.ContentType = "application/problem+json";
              context.Response.StatusCode = StatusCodes.Status500InternalServerError;
              await context.Response.WriteAsJsonAsync(new ProblemDetails
              {
                  Status = StatusCodes.Status500InternalServerError,
                  Title = "An unexpected error occurred.",
                  Detail = null  // Never expose ex.Message or stack trace
              });
          }
      }
  }
  ```

- [ ] Task 7 — Write xUnit unit test for `ExceptionHandlingMiddleware` (AC: #3)
  - [ ] Open/Create `backend/tests/SiesaAgents.UnitTests/` — ensure the test project references `SiesaAgents.API`
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs`
  - [ ] Test 1 (Arrange/Act/Assert): When the `next` delegate throws an unhandled exception, the middleware returns HTTP 500 with `Content-Type: application/problem+json` and the body contains `"status":500` and `"title":"An unexpected error occurred."` with no stack trace or message
  - [ ] Test 2: When no exception is thrown, the middleware calls `next` and passes through without modification

- [ ] Task 8 — Final integration validation (AC: #1, #4, #6)
  - [ ] Run `dotnet build SiesaAgents.sln` — verify zero errors and zero warnings
  - [ ] Run `dotnet run --project src/SiesaAgents.API` — verify startup with no EF Core exceptions
  - [ ] Run `dotnet test` — all tests pass

## Dev Notes

### Architecture Context

This story is **backend-only**. No frontend changes are required. It extends the backend skeleton created in Story 1.1 by wiring the PostgreSQL data layer.

**Scope boundary (critical):** This story creates an empty initial migration only. The `clientes` table is created in Epic 2 Story 2.1 when `ClienteEntity` is defined. The `contactos` table is created in Epic 3 Story 3.1. Do NOT define `ClienteEntity`, `ContactoEntity`, or any domain `DbSet<>` in this story.

### Backend Stack for This Story

| Component | Version | Notes |
|-----------|---------|-------|
| .NET | 10 | Framework |
| EF Core | 10 | ORM — `Microsoft.EntityFrameworkCore` |
| Npgsql EF Provider | 10 | `Npgsql.EntityFrameworkCore.PostgreSQL` |
| EF Core Design | 10 | `Microsoft.EntityFrameworkCore.Design` — required for migrations CLI |
| dotnet-ef CLI | latest | Global tool — `dotnet tool install --global dotnet-ef` |

### Critical EF Core Conventions

**snake_case via `ApplySnakeCaseNaming()` — mandatory:**
- Requires `EFCore.NamingConventions` NuGet package: `dotnet add src/SiesaAgents.Infrastructure package EFCore.NamingConventions`
- Called as the LAST statement in `OnModelCreating` after all configurations
- Effect: C# `PascalCase` entity/property names → PostgreSQL `snake_case` columns/tables automatically
- No `[Column]`, `[Table]`, or `HasColumnName()` overrides needed or allowed

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);
    modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    modelBuilder.ApplySnakeCaseNaming(); // ALWAYS last
}
```

**Primary Keys — UUID (Guid) mandatory for all future entities:**
```csharp
public abstract class Entity
{
    public Guid Id { get; protected set; } = Guid.NewGuid();
}
```

**Timestamps — `DateTimeOffset` always:**
```csharp
public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
public DateTimeOffset UpdatedAt { get; private set; } = DateTimeOffset.UtcNow;
// NEVER: DateTime, DateTime.Now, DateTime.UtcNow
```

### Program.cs Registration Pattern

```csharp
// backend/src/SiesaAgents.API/Program.cs
using SiesaAgents.Infrastructure.Data;
using SiesaAgents.API.Middleware;

var builder = WebApplication.CreateBuilder(args);

// EF Core + PostgreSQL
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Scalar (NOT Swagger)
builder.Services.AddOpenApi();
// ... other registrations (CORS from Story 1.1) ...

var app = builder.Build();

// ExceptionHandlingMiddleware MUST be first
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("DevCors");
app.MapScalarApiReference();
app.Run();
```

### Migration Commands Reference

All commands run from `backend/` root directory:

```bash
# Add new migration
dotnet ef migrations add <MigrationName> \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API \
  --output-dir Data/Migrations

# Apply migrations to database
dotnet ef database update \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API

# Revert last migration (undo)
dotnet ef migrations remove \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API
```

### Problem Details RFC 7807 Response Shape

```json
{
  "status": 500,
  "title": "An unexpected error occurred.",
  "detail": null
}
```

- `Content-Type: application/problem+json` — mandatory header
- `detail` MUST be `null` — never expose `ex.Message` or inner exceptions
- HTTP status code must match the `status` field value

### Project Structure Notes

Files modified or created by this story:

```
backend/
  src/
    SiesaAgents.Infrastructure/
      SiesaAgents.Infrastructure.csproj     ← Add EFCore + Npgsql + EFCore.NamingConventions packages
      Data/
        AppDbContext.cs                      ← NEW: DbContext with ApplySnakeCaseNaming()
        Migrations/
          <timestamp>_InitialCreate.cs       ← NEW: generated by dotnet ef migrations add
          <timestamp>_InitialCreate.Designer.cs  ← NEW: generated
          AppDbContextModelSnapshot.cs       ← NEW: generated
    SiesaAgents.API/
      SiesaAgents.API.csproj                ← Add EFCore.Design package
      Program.cs                            ← UPDATE: register AppDbContext
      appsettings.Development.json          ← UPDATE: confirm DefaultConnection string
      Middleware/
        ExceptionHandlingMiddleware.cs      ← VERIFY/UPDATE from Story 1.1
  tests/
    SiesaAgents.UnitTests/
      Middleware/
        ExceptionHandlingMiddlewareTests.cs  ← NEW: unit tests
```

Files NOT modified by this story (scope boundary):
- `SiesaAgents.Domain/` — no entities created here
- `SiesaAgents.Application/` — no commands/queries yet
- Frontend (`frontend/`) — no changes

### Dependencies from Story 1.1

This story assumes the following exist from Story 1.1:
- `SiesaAgents.sln` with all 4 projects added
- `SiesaAgents.API` → `SiesaAgents.Infrastructure` → `SiesaAgents.Domain` project references
- `Scalar.AspNetCore` registered in `Program.cs`
- CORS configured allowing `http://localhost:5173`
- `ExceptionHandlingMiddleware.cs` stub (if created in Story 1.1 Task 4)
- `appsettings.Development.json` with placeholder `DefaultConnection` (if created in Story 1.1 Task 5)

### Testing Standards

**xUnit (backend):**
- Test structure: Arrange / Act / Assert sections, clearly commented
- `ExceptionHandlingMiddlewareTests` uses `DefaultHttpContext` and mocked `RequestDelegate`
- No external DB required for unit tests — middleware tests are pure unit tests
- Integration tests with real PostgreSQL (Testcontainers) are deferred to later epics when domain entities exist

### References

- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3]
- Architecture — EF Core DbContext pattern: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Architecture — snake_case naming: [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns]
- Architecture — Enforcement Guidelines: [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines]
- Company standards — Database Conventions: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions]
- Company standards — Backend Critical Rules: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- Previous story (1.1) learnings: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#Dev Notes]
- Migration command pattern: [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

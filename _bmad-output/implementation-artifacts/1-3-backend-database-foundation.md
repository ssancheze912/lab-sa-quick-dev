# Story 1.3: Backend Database Foundation

Status: ready-for-dev

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

## Acceptance Criteria

1. **Given** PostgreSQL is running locally, **When** the developer runs `dotnet ef database update` from `backend/`, **Then** the `siesa_agents_db` database is created with no errors, and the EF Core `__EFMigrationsHistory` table exists in the database.

2. **Given** the EF Core infrastructure is configured, **When** inspecting `SiesaAgents.Infrastructure`, **Then** an `InitialCreate` migration file exists under `src/SiesaAgents.Infrastructure/Data/Migrations/` with no domain tables defined (empty migration — schema scaffolding only).

3. **Given** the `AppDbContext` is configured, **When** inspecting `OnModelCreating`, **Then** `modelBuilder.ApplySnakeCaseNaming()` is called as the last line in `OnModelCreating`, ensuring all future column names follow snake_case convention automatically without manual `[Column]` or `[Table]` attributes.

4. **Given** `AppDbContext` is registered in `Program.cs`, **When** the backend starts with a valid `ConnectionStrings__DefaultConnection` environment variable, **Then** the application starts on port 5000 with no errors and EF Core uses the PostgreSQL provider (`Npgsql.EntityFrameworkCore.PostgreSQL`).

5. **Given** an unhandled exception occurs anywhere in the backend, **When** the exception reaches the `ExceptionHandlingMiddleware`, **Then** the response returns Problem Details RFC 7807 format (`status`, `title`, `detail`) with no stack traces exposed (NFR6), and the HTTP status code reflects the exception type (400 for domain validation, 404 for not-found, 500 for unexpected).

6. **Given** the backend is running, **When** accessing `GET /scalar`, **Then** the Scalar API documentation page loads correctly (`app.MapScalarApiReference()` is registered in `Program.cs`, never `app.UseSwagger()`).

7. **Given** the connection string points to a non-existent or unreachable PostgreSQL instance, **When** the application starts, **Then** the startup does not crash — the error surfaces only on first database operation (EF Core lazy connection pattern).

## Tasks / Subtasks

- [ ] Task 1 — Configure EF Core DbContext (AC: #3, #4)
  - [ ] Add `AppDbContext.cs` in `src/SiesaAgents.Infrastructure/Data/`
  - [ ] Inherit from `DbContext`, inject `DbContextOptions<AppDbContext>` via constructor
  - [ ] Override `OnModelCreating` — call `modelBuilder.ApplySnakeCaseNaming()` as the **last** line
  - [ ] Register `AppDbContext` in `Program.cs` using `builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")))` 
  - [ ] Add `Npgsql.EntityFrameworkCore.PostgreSQL` package to `SiesaAgents.Infrastructure.csproj` if not already present
  - [ ] Add `Microsoft.EntityFrameworkCore.Design` package to `SiesaAgents.API.csproj` (required for `dotnet ef` CLI)

- [ ] Task 2 — Add and configure connection string (AC: #4, #7)
  - [ ] Add `ConnectionStrings.DefaultConnection` to `backend/src/SiesaAgents.API/appsettings.Development.json`:
    ```json
    {
      "ConnectionStrings": {
        "DefaultConnection": "Host=localhost;Port=5432;Database=siesa_agents_db;Username=postgres;Password=postgres"
      }
    }
    ```
  - [ ] Add placeholder entry to `backend/src/SiesaAgents.API/appsettings.json` with an empty/template value (no real credentials)
  - [ ] Add `backend/src/SiesaAgents.API/appsettings.Development.json` to `.gitignore` if it contains real credentials

- [ ] Task 3 — Create initial EF Core migration (AC: #1, #2)
  - [ ] Run from `backend/` directory: `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
  - [ ] Verify the generated migration creates only the `__EFMigrationsHistory` table scaffold — no domain tables
  - [ ] Run `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` to apply migration
  - [ ] Confirm `siesa_agents_db` database exists in PostgreSQL with `__EFMigrationsHistory` table

- [ ] Task 4 — Implement ExceptionHandlingMiddleware (AC: #5)
  - [ ] Create `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`
  - [ ] Catch all unhandled exceptions in `InvokeAsync`
  - [ ] Map exception types to HTTP status codes:
    - `KeyNotFoundException` / domain not-found → 404
    - `ArgumentException` / `InvalidOperationException` / domain validation → 400
    - Any other `Exception` → 500
  - [ ] Return `application/problem+json` with RFC 7807 fields: `type`, `title`, `status`, `detail` — NEVER include `StackTrace` or internal exception messages in responses
  - [ ] Register middleware in `Program.cs` before all other middleware: `app.UseMiddleware<ExceptionHandlingMiddleware>()`

- [ ] Task 5 — Verify Scalar registration (AC: #6)
  - [ ] Confirm `app.MapScalarApiReference()` is present in `Program.cs` (added in Story 1.1)
  - [ ] Confirm `app.UseSwagger()` / `app.UseSwaggerUI()` are NOT present anywhere in `Program.cs`
  - [ ] Verify `GET /scalar` returns 200 after `dotnet run`

- [ ] Task 6 — Unit tests for ExceptionHandlingMiddleware (AC: #5)
  - [ ] Add test class `ExceptionHandlingMiddlewareTests.cs` in `tests/SiesaAgents.UnitTests/`
  - [ ] Test: `ArgumentException` → 400 Problem Details with correct `status` and `title`
  - [ ] Test: `KeyNotFoundException` → 404 Problem Details
  - [ ] Test: generic `Exception` → 500 Problem Details
  - [ ] Test: response body does NOT contain stack trace string
  - [ ] Use xUnit + `Microsoft.AspNetCore.Mvc.Testing` or manual middleware pipeline setup (Arrange/Act/Assert)

## Dev Notes

### Architecture Context

This story is **backend-only** — no frontend changes required. It establishes the data layer foundation used by all subsequent backend stories (Epic 2, 3, 4).

**Scope boundary (CRITICAL):** Do NOT define `ClienteEntity`, `ContactoEntity`, or any domain `DbSet<>` properties in `AppDbContext`. Those entities are created in Epic 2 Story 2.1 and Epic 3 Story 3.1 respectively. The `InitialCreate` migration must be empty of domain tables.

### Backend Stack

| Component | Value |
|-----------|-------|
| Framework | .NET 10 |
| ORM | Entity Framework Core 10 (`Npgsql.EntityFrameworkCore.PostgreSQL`) |
| Database | PostgreSQL 18+ — database name: `siesa_agents_db` |
| API docs | Scalar (`Scalar.AspNetCore`) — NEVER Swagger |
| Error format | Problem Details RFC 7807 |
| Testing | xUnit |

### File Structure

Files to create or modify in this story:

```
backend/
  src/
    SiesaAgents.API/
      Program.cs                              ← Modify: register DbContext + ExceptionHandlingMiddleware
      appsettings.json                        ← Modify: add ConnectionStrings placeholder
      appsettings.Development.json            ← Modify: add real local connection string
      Middleware/
        ExceptionHandlingMiddleware.cs        ← CREATE NEW
    SiesaAgents.Infrastructure/
      SiesaAgents.Infrastructure.csproj       ← Modify: add Npgsql.EFCore package ref
      Data/
        AppDbContext.cs                       ← CREATE NEW
        Migrations/                           ← Auto-generated by dotnet ef
          <timestamp>_InitialCreate.cs        ← Auto-generated
          <timestamp>_InitialCreate.Designer.cs ← Auto-generated
          AppDbContextModelSnapshot.cs        ← Auto-generated
  tests/
    SiesaAgents.UnitTests/
      Middleware/
        ExceptionHandlingMiddlewareTests.cs   ← CREATE NEW
```

### AppDbContext Pattern

```csharp
// src/SiesaAgents.Infrastructure/Data/AppDbContext.cs
using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // Future DbSet<> properties go here (Epic 2, 3)

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        modelBuilder.ApplySnakeCaseNaming(); // MUST be the last line
    }
}
```

> Note: `ApplySnakeCaseNaming()` is an extension method from `EFCore.NamingConventions` package. Verify the correct package name: `EFCore.NamingConventions` (by Roji) provides `UseSnakeCaseNamingConvention()` on `DbContextOptionsBuilder`. Alternatively, call `modelBuilder.ApplySnakeCaseNaming()` if the Npgsql package includes it. **Verify the actual API available in `.NET 10 / EF Core 10 + Npgsql` before coding.** The architecture mandates snake_case columns — use whatever the correct API is for the installed package version.

### Program.cs Registration Pattern

```csharp
// Middleware registration (order matters)
app.UseMiddleware<ExceptionHandlingMiddleware>(); // Must be first
// ... other middleware

// DbContext registration
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Scalar (MANDATORY — never Swagger)
app.MapScalarApiReference();
```

### ExceptionHandlingMiddleware Pattern

```csharp
// src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs
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
            _logger.LogError(ex, "Unhandled exception occurred");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, title) = exception switch
        {
            KeyNotFoundException => (StatusCodes.Status404NotFound, "Resource Not Found"),
            ArgumentException => (StatusCodes.Status400BadRequest, "Bad Request"),
            InvalidOperationException => (StatusCodes.Status400BadRequest, "Invalid Operation"),
            _ => (StatusCodes.Status500InternalServerError, "Internal Server Error")
        };

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/problem+json";

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = exception.Message, // Message only — NEVER StackTrace
            Type = $"https://httpstatuses.io/{statusCode}"
        };

        await context.Response.WriteAsJsonAsync(problemDetails);
    }
}
```

### Database Conventions Enforced (company-standards.md)

| Rule | Value |
|------|-------|
| Tables | snake_case (plural) |
| Columns | snake_case (auto via `ApplySnakeCaseNaming()`) |
| Primary Keys | UUID (`Guid`) — `DEFAULT uuidv7()` in future migrations |
| Timestamps | `DateTimeOffset` — NEVER `DateTime` |
| No manual `[Column]`/`[Table]` attributes | EF Core naming convention handles it |

### EF Core CLI Commands Reference

```bash
# From backend/ directory
# Add migration
dotnet ef migrations add InitialCreate \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API

# Apply migration  
dotnet ef database update \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API

# Verify connection
dotnet ef dbcontext info \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API
```

### Testing Standards

- Framework: xUnit
- Pattern: Arrange / Act / Assert
- Coverage target: > 80% for new code
- `ExceptionHandlingMiddleware` must be tested with direct middleware pipeline invocation — no integration test container needed for unit tests
- Verify Problem Details response shape matches RFC 7807 (status, title, detail, type fields)

### Previous Story Context (Story 1.2)

Story 1.2 (Frontend Navigation Shell) is complete. The backend was already running from Story 1.1 with Scalar registered. This story adds the database layer without breaking existing frontend connectivity. The CORS configuration and Scalar registration from Story 1.1 must remain intact.

Git history shows recent fixes were frontend-only (E2E tests, Tailwind v4, touch targets). No backend changes conflict with this story.

### Project Structure Notes

- `AppDbContext.cs` lives in `SiesaAgents.Infrastructure/Data/` — aligns with architecture doc
- Migrations folder auto-created by `dotnet ef` under `SiesaAgents.Infrastructure/Data/Migrations/`
- `ExceptionHandlingMiddleware.cs` lives in `SiesaAgents.API/Middleware/` — aligns with architecture doc
- `Microsoft.EntityFrameworkCore.Design` must be in `SiesaAgents.API.csproj` (not Infrastructure) for `dotnet ef` CLI to work with `--startup-project`

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story-1.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data-Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Backend-Folder-Structure]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns]
- [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend-Stack]
- [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database-Conventions]
- [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend-Critical-Rules]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

# Story 1.3: Backend Database Foundation

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

## Acceptance Criteria

1. **Given** PostgreSQL is running locally, **When** the developer runs `dotnet ef database update` from the solution root or `backend/` directory, **Then** the `siesa_agents_db` database is created with no errors and an EF Core migrations folder (`Migrations/`) exists under `SiesaAgents.Infrastructure`.

2. **Given** an unhandled exception occurs in the backend (any exception not caught by a handler), **When** the error reaches the global middleware, **Then** the response body conforms to Problem Details RFC 7807 format (`status`, `title`, `detail`) and no stack trace is exposed in the response (NFR6).

3. **Given** a handled domain exception (e.g., `NotFoundException`, `ValidationException`) is thrown, **When** the exception middleware processes it, **Then** the response returns the appropriate HTTP status code (404, 400, 409) with a Problem Details body — not a 500 Internal Server Error.

4. **Given** the backend boots and migrations are applied, **When** EF Core generates column names from entity properties, **Then** `ApplySnakeCaseNaming()` is called in `OnModelCreating` and all column names in the database follow `snake_case` convention (e.g., `created_at`, `updated_at`).

5. **Given** the empty initial migration is created, **When** it is inspected, **Then** it contains NO domain table definitions — no `clientes` table, no `contactos` table. Only the `__EFMigrationsHistory` table is created by EF Core internally.

6. **Given** the backend is running, **When** a GET request is made to `/scalar`, **Then** the Scalar API documentation page loads successfully — `app.UseSwagger()` is NOT registered anywhere in `Program.cs`.

## Tasks / Subtasks

- [ ] Task 1 — Configure PostgreSQL connection and AppDbContext (AC: #1, #4)
  - [ ] Add `Npgsql.EntityFrameworkCore.PostgreSQL` NuGet package to `SiesaAgents.Infrastructure` if not already present (from Story 1.1 init)
  - [ ] Create `SiesaAgents.Infrastructure/Data/AppDbContext.cs` — inherits `DbContext`, empty `OnModelCreating` that calls `modelBuilder.ApplySnakeCaseNaming()` as the last statement
  - [ ] Register `AppDbContext` in `Program.cs` with `builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")))` 
  - [ ] Add connection string `"DefaultConnection": "Host=localhost;Port=5432;Database=siesa_agents_db;Username=postgres;Password=postgres"` to `appsettings.Development.json`
  - [ ] Add `dotnet-ef` tool reference to the solution if not present (global or local tool manifest)

- [ ] Task 2 — Create empty initial migration and verify database creation (AC: #1, #5)
  - [ ] Run `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` to generate the empty migration
  - [ ] Verify the generated migration file in `SiesaAgents.Infrastructure/Migrations/` contains no `Up()` table creation calls beyond `migrationBuilder` boilerplate
  - [ ] Run `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` and confirm `siesa_agents_db` is created without errors
  - [ ] Commit the generated migration files to source control

- [ ] Task 3 — Implement ExceptionHandlingMiddleware with Problem Details RFC 7807 (AC: #2, #3)
  - [ ] Create `SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` — catch `Exception`, map to `ProblemDetails` response
  - [ ] Map known domain exceptions to specific HTTP status codes:
    - `NotFoundException` → 404 Not Found
    - `ValidationException` (FluentValidation) → 400 Bad Request with `errors` detail
    - `ConflictException` → 409 Conflict
    - All other exceptions → 500 Internal Server Error (no stack trace, generic message)
  - [ ] Set response `Content-Type: application/problem+json`
  - [ ] Register middleware in `Program.cs` via `app.UseMiddleware<ExceptionHandlingMiddleware>()` — place it early in the pipeline (before routing)
  - [ ] Create domain exception classes in `SiesaAgents.Domain/Exceptions/`: `NotFoundException.cs`, `ConflictException.cs`

- [ ] Task 4 — Write unit tests for ExceptionHandlingMiddleware (AC: #2, #3)
  - [ ] Create `tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs`
  - [ ] Test: unhandled `Exception` → 500 + Problem Details body + no stack trace in response
  - [ ] Test: `NotFoundException` → 404 + Problem Details body
  - [ ] Test: `ConflictException` → 409 + Problem Details body
  - [ ] Test: Problem Details `Content-Type` header is `application/problem+json`
  - [ ] All tests follow Arrange / Act / Assert structure with xUnit

- [ ] Task 5 — Integration test: verify database connectivity (AC: #1)
  - [ ] Create `tests/SiesaAgents.IntegrationTests/Infrastructure/DatabaseConnectionTests.cs`
  - [ ] Test: `AppDbContext.Database.CanConnectAsync()` returns true when PostgreSQL is available
  - [ ] Use `TestContainers` (PostgreSQL) or `EF Core InMemory` for the integration test environment
  - [ ] Verify `ApplySnakeCaseNaming` is applied: check that `__EFMigrationsHistory` table exists post-migration (no domain tables)

## Dev Notes

### Architecture Patterns

This story establishes the data layer foundation in `SiesaAgents.Infrastructure`. It follows Clean Architecture — the `AppDbContext` lives in Infrastructure, domain exception classes live in Domain, and the middleware is registered in the API layer. No application-layer use cases are created in this story.

**Layer responsibilities for this story:**
- `SiesaAgents.Domain/Exceptions/` — domain exception types (zero external dependencies)
- `SiesaAgents.Infrastructure/Data/AppDbContext.cs` — EF Core DbContext with `ApplySnakeCaseNaming()`
- `SiesaAgents.Infrastructure/Migrations/` — EF Core migration files (auto-generated)
- `SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` — Problem Details RFC 7807 handler
- `SiesaAgents.API/Program.cs` — DI registration, middleware pipeline order

**AppDbContext pattern:**
```csharp
// SiesaAgents.Infrastructure/Data/AppDbContext.cs
using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        // Apply entity configurations from this assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        // CRITICAL: ApplySnakeCaseNaming() MUST be called LAST in OnModelCreating
        modelBuilder.ApplySnakeCaseNaming();
    }
}
```

**ExceptionHandlingMiddleware pattern:**
```csharp
// SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs
public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (NotFoundException ex)
        {
            await WriteProblemDetailsAsync(context, StatusCodes.Status404NotFound, "Not Found", ex.Message);
        }
        catch (ConflictException ex)
        {
            await WriteProblemDetailsAsync(context, StatusCodes.Status409Conflict, "Conflict", ex.Message);
        }
        catch (ValidationException ex)
        {
            await WriteValidationProblemDetailsAsync(context, ex);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception occurred");
            // Generic message — NEVER expose stack traces (NFR6)
            await WriteProblemDetailsAsync(context, StatusCodes.Status500InternalServerError,
                "Internal Server Error", "An unexpected error occurred. Please try again later.");
        }
    }

    private static async Task WriteProblemDetailsAsync(HttpContext context, int status, string title, string detail)
    {
        context.Response.StatusCode = status;
        context.Response.ContentType = "application/problem+json";
        var problem = new ProblemDetails { Status = status, Title = title, Detail = detail };
        await context.Response.WriteAsJsonAsync(problem);
    }
}
```

**Domain exception classes:**
```csharp
// SiesaAgents.Domain/Exceptions/NotFoundException.cs
namespace SiesaAgents.Domain.Exceptions;

public sealed class NotFoundException(string message) : Exception(message);

// SiesaAgents.Domain/Exceptions/ConflictException.cs
namespace SiesaAgents.Domain.Exceptions;

public sealed class ConflictException(string message) : Exception(message);
```

**Program.cs middleware registration order:**
```csharp
// Middleware must be registered BEFORE routing
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseHttpsRedirection();
app.MapScalarApiReference(); // NOT app.UseSwagger()
// ... other endpoint registrations
```

**Connection string in appsettings.Development.json:**
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=siesa_agents_db;Username=postgres;Password=postgres"
  }
}
```

**Migration commands (run from solution root `backend/`):**
```bash
dotnet ef migrations add InitialCreate \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API \
  --output-dir Data/Migrations

dotnet ef database update \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API
```

### Tech Stack & Libraries

- **.NET 10 + C# Minimal API** — no controllers
- **EF Core 10** (`Microsoft.EntityFrameworkCore`) — ORM
- **Npgsql.EntityFrameworkCore.PostgreSQL** — PostgreSQL provider (already added in Story 1.1 backend init)
- **EFCore.NamingConventions** NuGet package — provides `ApplySnakeCaseNaming()` extension. Add to `SiesaAgents.Infrastructure`: `dotnet add package EFCore.NamingConventions`
- **Scalar.AspNetCore** — API docs (already added in Story 1.1)
- **xUnit** — backend unit testing (already configured)
- **Microsoft.AspNetCore.Mvc** — `ProblemDetails` class

### Database Conventions

All column names must follow snake_case per company standards. `ApplySnakeCaseNaming()` handles this automatically via `EFCore.NamingConventions`. Do NOT add manual `[Column("...")]` or `[Table("...")]` attributes.

| C# Property | PostgreSQL Column |
|---|---|
| `Id` | `id` |
| `CreatedAt` | `created_at` |
| `UpdatedAt` | `updated_at` |

**Primary keys:** `Guid` (UUID) — MANDATORY for all future entities.
**Timestamps:** `DateTimeOffset` — NEVER `DateTime`.

### Scope Boundary (CRITICAL)

This story creates an **empty migration only**. Do NOT define any entity `DbSet<>` properties in `AppDbContext` yet:
- `DbSet<ClienteEntity>` — belongs to Epic 2, Story 2.1
- `DbSet<ContactoEntity>` — belongs to Epic 3, Story 3.1

The `Migrations/` folder is created but the `Up()` method of `InitialCreate` migration must be empty (no `migrationBuilder.CreateTable(...)` calls).

### Testing Standards

- **Framework:** xUnit + EF Core InMemory (unit) / TestContainers PostgreSQL (integration)
- **Structure:** Arrange / Act / Assert — no exceptions
- **Coverage target:** >80% for modified files
- **Middleware tests:** Use `HttpContext` mock or `WebApplicationFactory` test host; do NOT test against a live PostgreSQL instance in unit tests
- **No stack traces in 500 responses** must be explicitly asserted in the 500 test case

### Project Structure Notes

Files to create in this story:
```
backend/src/SiesaAgents.Infrastructure/
  Data/
    AppDbContext.cs                     ← NEW
    Migrations/                         ← NEW (auto-generated by dotnet ef)
      YYYYMMDDHHMMSS_InitialCreate.cs  ← auto-generated
      AppDbContextModelSnapshot.cs     ← auto-generated

backend/src/SiesaAgents.Domain/
  Exceptions/
    NotFoundException.cs               ← NEW
    ConflictException.cs               ← NEW

backend/src/SiesaAgents.API/
  Middleware/
    ExceptionHandlingMiddleware.cs     ← NEW

backend/tests/SiesaAgents.UnitTests/
  Middleware/
    ExceptionHandlingMiddlewareTests.cs ← NEW

backend/tests/SiesaAgents.IntegrationTests/
  Infrastructure/
    DatabaseConnectionTests.cs         ← NEW
```

Files to modify:
```
backend/src/SiesaAgents.API/Program.cs
  → Register AppDbContext with AddDbContext<AppDbContext>
  → Register app.UseMiddleware<ExceptionHandlingMiddleware>() early in pipeline
  → Verify app.MapScalarApiReference() is present (not UseSwagger)

backend/src/SiesaAgents.API/appsettings.Development.json
  → Add ConnectionStrings.DefaultConnection
```

### Previous Story Context

Story 1.1 initialized the .NET solution with:
- `SiesaAgents.sln` with API, Application, Domain, Infrastructure, UnitTests projects
- `Scalar.AspNetCore` registered in `Program.cs`
- `Npgsql.EntityFrameworkCore.PostgreSQL` added to `SiesaAgents.Infrastructure`
- `FluentValidation` added to `SiesaAgents.Application`
- Basic `Program.cs` with CORS for `localhost:5173`

Story 1.2 was frontend-only (navigation shell) — no backend changes.

The backend `Program.cs` from Story 1.1 is the starting point. Add `AppDbContext` registration and middleware registration without removing existing CORS + Scalar config.

### References

- AppDbContext + ApplySnakeCaseNaming: [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- EF Core migrations folder: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Problem Details RFC 7807 requirement: [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security] + NFR6
- ExceptionHandlingMiddleware location: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- snake_case naming convention: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions]
- UUID PKs + DateTimeOffset: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- Scalar (not Swagger): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- Scope note (no domain tables in this story): [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3]
- EFCore.NamingConventions package: provides `ApplySnakeCaseNaming()` for PostgreSQL snake_case

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

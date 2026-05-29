# Story 1.3: Backend Database Foundation

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

## Acceptance Criteria

1. **Given** PostgreSQL is running locally, **When** the developer runs `dotnet ef database update`, **Then** the `siesa_agents_db` database is created with no errors, **And** the EF Core migrations folder exists in `SiesaAgents.Infrastructure`.

2. **Given** an unhandled exception occurs in the backend, **When** the error reaches the middleware, **Then** the response returns Problem Details RFC 7807 format (status, title, detail) with no stack traces exposed (NFR6).

3. **Given** the backend receives any request, **When** the request is processed, **Then** `ApplySnakeCaseNaming()` is applied in `OnModelCreating` and all future column names will follow snake_case convention automatically.

## Tasks / Subtasks

- [ ] Task 1 — Install EF Core + Npgsql packages and wire DbContext (AC: #1, #3)
  - [ ] Add `Npgsql.EntityFrameworkCore.PostgreSQL` to `SiesaAgents.Infrastructure.csproj`
  - [ ] Add `Microsoft.EntityFrameworkCore.Design` to `SiesaAgents.API.csproj` (needed for `dotnet ef` CLI)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` — inherits `DbContext`; override `OnModelCreating` calling `modelBuilder.ApplySnakeCaseNaming()` as the last call; no entity `DbSet` properties yet (empty initial schema)
  - [ ] Register `AppDbContext` in `backend/src/SiesaAgents.API/Program.cs` via `builder.Services.AddDbContext<AppDbContext>(opts => opts.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")))`
  - [ ] Add `ConnectionStrings:DefaultConnection` in `backend/src/SiesaAgents.API/appsettings.Development.json` pointing to `Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres`

- [ ] Task 2 — Create initial empty migration (AC: #1)
  - [ ] Run `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` from the `backend/` directory
  - [ ] Verify the `backend/src/SiesaAgents.Infrastructure/Data/Migrations/` folder is created with `InitialCreate` migration files (`_InitialCreate.cs`, `_InitialCreate.Designer.cs`, `AppDbContextModelSnapshot.cs`)
  - [ ] Run `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` and confirm `siesa_agents_db` is created with no errors
  - [ ] Confirm migration is empty (no tables created) — this story intentionally creates zero domain tables; `clientes` table is added in Story 2.1, `contactos` in Story 3.1

- [ ] Task 3 — Implement global exception middleware (Problem Details RFC 7807) (AC: #2)
  - [ ] Create `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` — `IMiddleware` implementation that catches all unhandled exceptions and writes a `ProblemDetails` response (status 500, title "An unexpected error occurred", no `detail` stack trace)
  - [ ] Map known exception types: a custom `NotFoundException` → 404, a custom `ValidationException` → 400 with `errors` field; all others → 500
  - [ ] Create `backend/src/SiesaAgents.Domain/Exceptions/NotFoundException.cs` and `ValidationException.cs` base exception classes (zero dependencies)
  - [ ] Register middleware in `Program.cs` via `app.UseMiddleware<ExceptionHandlingMiddleware>()` before all endpoint mappings; register as scoped service with `builder.Services.AddTransient<ExceptionHandlingMiddleware>()`
  - [ ] Verify response Content-Type is `application/problem+json` and no stack trace is present in the JSON body

- [ ] Task 4 — Configure environment and project references (AC: #1)
  - [ ] Add project reference from `SiesaAgents.API` to `SiesaAgents.Infrastructure`
  - [ ] Add project reference from `SiesaAgents.Infrastructure` to `SiesaAgents.Domain`
  - [ ] Add project reference from `SiesaAgents.Application` to `SiesaAgents.Domain`
  - [ ] Confirm all projects compile without errors: `dotnet build SiesaAgents.sln`

- [ ] Task 5 — Unit and integration tests (AC: #1, #2, #3)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs` — xUnit tests using `DefaultHttpContext` to verify: unhandled exceptions return 500 Problem Details; `NotFoundException` returns 404; no stack trace in response body
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs` — verify `ApplySnakeCaseNaming()` is called (use EF Core InMemory provider; reflect on the model and assert a known property name would be snake_case)
  - [ ] All tests pass: `dotnet test` reports 0 failures

## Dev Notes

### Architecture Patterns

This is a pure backend story. No UI components. The following architectural decisions from the architecture document apply directly:

- **Clean Architecture layers:** Infrastructure owns `AppDbContext`, `Migrations/`, and repository implementations. Domain owns entity definitions and exception types. API owns `Program.cs`, `Middleware/`.
- **Dependency direction:** `SiesaAgents.API` → `SiesaAgents.Infrastructure` → `SiesaAgents.Domain`. Application also references Domain. No circular references.
- **Empty initial migration:** This story does NOT define `ClienteEntity` or `ContactoEntity`. The EF Core model has zero entities at this stage. Subsequent stories add entities and migrations incrementally.
- **`ApplySnakeCaseNaming()` placement:** Must be the **last** call inside `OnModelCreating` to ensure all previously configured column names are also converted. This is mandated by both the architecture document and company standards.

### Tech Stack Details

| Component | Version / Package | Notes |
|---|---|---|
| .NET | 10 | `SiesaAgents.API`, target framework `net10.0` |
| EF Core | 10 (`Microsoft.EntityFrameworkCore` 10.x) | ORM |
| Npgsql.EntityFrameworkCore.PostgreSQL | Latest stable for EF Core 10 | PostgreSQL provider |
| Microsoft.EntityFrameworkCore.Design | 10.x | Required by `dotnet ef` CLI tools; add to API project |
| EFCore.NamingConventions | Latest stable | Provides `ApplySnakeCaseNaming()` extension |
| xUnit | Latest | Unit tests |
| FluentValidation | Latest stable | Not used in this story directly, but already referenced in Application project per Story 1.1 setup |

> **Note on `EFCore.NamingConventions`:** The `ApplySnakeCaseNaming()` extension is provided by the `EFCore.NamingConventions` NuGet package (by Shay Rojansky). Add it to `SiesaAgents.Infrastructure.csproj`. Architecture and company standards mandate its use — do NOT manually map column names with `[Column]` attributes.

### AppDbContext Implementation Pattern

```csharp
// SiesaAgents.Infrastructure/Data/AppDbContext.cs
using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // No DbSet<> properties in this story — added in Story 2.1 (ClienteEntity) and Story 3.1 (ContactoEntity)

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        // Apply all entity configurations via assembly scanning (ready for future stories)
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        // MUST be last — converts all C# PascalCase property names to snake_case column names automatically
        modelBuilder.ApplySnakeCaseNaming();
    }
}
```

### ExceptionHandlingMiddleware Pattern

```csharp
// SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs
using Microsoft.AspNetCore.Mvc;
using SiesaAgents.Domain.Exceptions;

namespace SiesaAgents.API.Middleware;

public class ExceptionHandlingMiddleware : IMiddleware
{
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(ILogger<ExceptionHandlingMiddleware> logger)
        => _logger = logger;

    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        try
        {
            await next(context);
        }
        catch (NotFoundException ex)
        {
            _logger.LogWarning(ex, "Resource not found");
            await WriteProblemDetails(context, StatusCodes.Status404NotFound, "Resource Not Found", ex.Message);
        }
        catch (ValidationException ex)
        {
            _logger.LogWarning(ex, "Validation error");
            await WriteProblemDetails(context, StatusCodes.Status400BadRequest, "Validation Error", ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error");
            // NEVER expose stack trace or internal message to client
            await WriteProblemDetails(context, StatusCodes.Status500InternalServerError, "An unexpected error occurred", null);
        }
    }

    private static async Task WriteProblemDetails(HttpContext context, int statusCode, string title, string? detail)
    {
        var problem = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = detail
        };
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/problem+json";
        await context.Response.WriteAsJsonAsync(problem);
    }
}
```

### Program.cs Registration Pattern

```csharp
// Add to Program.cs (after builder.Build() not needed — register before building)
builder.Services.AddTransient<ExceptionHandlingMiddleware>();
builder.Services.AddDbContext<AppDbContext>(opts =>
    opts.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// Middleware must be registered before all endpoints
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Scalar API docs (already present from Story 1.1 — DO NOT add Swagger)
app.MapScalarApiReference();
```

### Domain Exception Classes

```csharp
// SiesaAgents.Domain/Exceptions/NotFoundException.cs
namespace SiesaAgents.Domain.Exceptions;
public class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message) { }
    public NotFoundException(string entityName, object id) : base($"{entityName} with id '{id}' was not found.") { }
}

// SiesaAgents.Domain/Exceptions/ValidationException.cs
namespace SiesaAgents.Domain.Exceptions;
public class ValidationException : Exception
{
    public ValidationException(string message) : base(message) { }
}
```

### Database Conventions Enforced

Per company standards and architecture doc — all enforced automatically via `ApplySnakeCaseNaming()`:
- Table names: `snake_case` plural (e.g., `clientes`, `contactos`)
- Column names: `snake_case` (e.g., `created_at`, `cliente_id`)
- PK column: `id` (UUID)
- No manual `[Column]` or `[Table]` attributes — EF Core conventions handle it

### appsettings.Development.json

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

### Project File Structure for This Story

```
backend/
  src/
    SiesaAgents.API/
      Program.cs                              # UPDATED: DbContext + middleware registration
      Middleware/
        ExceptionHandlingMiddleware.cs        # NEW
      appsettings.Development.json           # UPDATED: ConnectionStrings
    SiesaAgents.Domain/
      Exceptions/
        NotFoundException.cs                  # NEW
        ValidationException.cs               # NEW
    SiesaAgents.Infrastructure/
      SiesaAgents.Infrastructure.csproj      # UPDATED: add Npgsql + EFCore.NamingConventions packages
      Data/
        AppDbContext.cs                       # NEW
        Migrations/                           # NEW (generated by dotnet ef)
          <timestamp>_InitialCreate.cs
          <timestamp>_InitialCreate.Designer.cs
          AppDbContextModelSnapshot.cs
  tests/
    SiesaAgents.UnitTests/
      Middleware/
        ExceptionHandlingMiddlewareTests.cs   # NEW
      Infrastructure/
        AppDbContextTests.cs                  # NEW
```

### Scope Boundary (Critical)

Per epic scope note: This story creates an **empty initial migration** only. No domain tables are defined here.

- Do NOT create `ClienteEntity` — belongs to Story 2.1
- Do NOT create `ContactoEntity` — belongs to Story 3.1
- Do NOT add `DbSet<ClienteEntity>` or `DbSet<ContactoEntity>` to `AppDbContext`
- Do NOT create `ClienteConfiguration.cs` or `ContactoConfiguration.cs` in this story

### Testing Standard

- Framework: xUnit + EF Core InMemory (for unit tests)
- Pattern: Arrange / Act / Assert
- Coverage target: > 80%
- Middleware tests use `DefaultHttpContext` with a `MemoryStream` response body
- `AppDbContext` tests use `UseInMemoryDatabase` to validate EF Core configuration without PostgreSQL

### References

- EF Core DbContext + ApplySnakeCaseNaming: [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- AppDbContext file path: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- ExceptionHandlingMiddleware path: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Problem Details RFC 7807: [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- Database snake_case conventions: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions (PostgreSQL)]
- EF Core ApplySnakeCaseNaming mandate: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#EF Core: Automatic snake_case]
- Backend folder structure: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Folder Structure (.NET Solution)]
- NFR6 no stack trace: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3 AC]
- Scalar registration (not Swagger): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- DateTimeOffset mandate: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- UUID PK mandate: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- Story 1.1 baseline (solution structure already in place): [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md]
- Story 1.2 learnings (pure backend story — no siesa-ui-kit, no frontend changes): [Source: _bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

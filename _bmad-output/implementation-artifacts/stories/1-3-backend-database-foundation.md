# Story 1.3: Backend Database Foundation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

## Acceptance Criteria

1. **Given** PostgreSQL is running locally, **When** the developer runs `dotnet ef database update`, **Then** the `siesa_agents_db` database is created with no errors **And** the EF Core migrations folder (`backend/src/SiesaAgents.Infrastructure/Migrations/`) exists and contains one initial empty migration.

2. **Given** an unhandled exception occurs in the backend, **When** the error reaches the middleware, **Then** the response returns Problem Details RFC 7807 format with `status`, `title`, and `detail` fields **And** no `stackTrace` or exception type is exposed in the response body (NFR6).

3. **Given** any future entity is registered in `AppDbContext`, **When** EF Core generates or applies migrations, **Then** all table and column names follow snake_case convention because `ApplySnakeCaseNaming()` is called last in `OnModelCreating`.

4. **Given** the backend is running locally, **When** `AppDbContext.Database.CanConnectAsync()` is called from an integration test, **Then** it returns `true` against `siesa_agents_db`.

> **Scope note:** This story creates an **empty initial migration** — no domain tables. Do NOT define `ClienteEntity` or `ContactoEntity` here. The `clientes` table is created in Epic 2 (Story 2.1). The `contactos` table is created in Epic 3 (Story 3.1).

## Tasks / Subtasks

- [x] Task 1 — Create `AppDbContext` in SiesaAgents.Infrastructure (AC: 1, 3)
  - [x] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`
  - [x] Inherit from `DbContext`; inject `DbContextOptions<AppDbContext>` via constructor
  - [x] Override `OnModelCreating`: call `modelBuilder.ApplySnakeCaseNaming()` as the last statement
  - [x] Do NOT add any `DbSet<>` properties — entities are added in later stories

- [x] Task 2 — Register DbContext and connection string (AC: 1, 4)
  - [x] Add connection string `"DefaultConnection"` to `backend/src/SiesaAgents.API/appsettings.Development.json` pointing to `siesa_agents_db`
  - [x] Register `AppDbContext` in `Program.cs` using `builder.Services.AddDbContext<AppDbContext>(...)` with Npgsql provider
  - [x] Reference `SiesaAgents.Infrastructure` from `SiesaAgents.API` project if not already referenced

- [x] Task 3 — Install EF Core tooling and create initial migration (AC: 1)
  - [x] Ensure `Microsoft.EntityFrameworkCore.Design` package is referenced in `SiesaAgents.API` (needed for `dotnet ef` to locate startup project)
  - [x] Ensure `Microsoft.EntityFrameworkCore.Tools` package is referenced in `SiesaAgents.Infrastructure`
  - [x] Run `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API -o Data/Migrations` from `backend/`
  - [x] Verify `backend/src/SiesaAgents.Infrastructure/Data/Migrations/` folder is created with snapshot and migration files
  - [x] Run `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` — confirm exit code 0 and `siesa_agents_db` is created

- [x] Task 4 — Implement `ExceptionHandlingMiddleware` for Problem Details RFC 7807 (AC: 2)
  - [x] Create `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`
  - [x] Catch all unhandled exceptions; write `application/problem+json` response
  - [x] Response MUST include: `status` (int), `title` (string), `detail` (string)
  - [x] Response MUST NOT include: `stackTrace`, exception type, inner exception details
  - [x] Map domain-level exceptions to appropriate HTTP status codes (default: 500)
  - [x] Register middleware in `Program.cs` via `app.UseMiddleware<ExceptionHandlingMiddleware>()` — place before `app.UseCors()`

- [x] Task 5 — Write xUnit unit tests for ExceptionHandlingMiddleware (AC: 2)
  - [x] Create `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs`
  - [x] UNIT-F-04: Unhandled exception → response has `status`, `title`, `detail` fields (Problem Details RFC 7807)
  - [x] UNIT-F-05: Response body does NOT contain `stackTrace` or exception type key

- [x] Task 6 — Write xUnit integration tests for database foundation (AC: 1, 4)
  - [x] Create `backend/tests/SiesaAgents.IntegrationTests/DatabaseFoundationTests.cs`
  - [x] Add `SiesaAgents.IntegrationTests` xUnit project to solution if it does not exist
  - [x] INT-F-01: `AppDbContext.Database.CanConnectAsync()` returns `true` for `siesa_agents_db`
  - [x] INT-F-02: `__EFMigrationsHistory` table exists and contains exactly one entry after `dotnet ef database update`
  - [x] Use test connection string from environment variable `ConnectionStrings__DefaultConnection` or `appsettings.Test.json`

- [x] Task 7 — Write xUnit unit test for snake_case naming (AC: 3)
  - [x] Create or extend `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`
  - [x] UNIT-F-06: Verify `ApplySnakeCaseNaming()` is configured (assert `__EFMigrationsHistory` default table name is unaffected; or add a minimal test entity in-memory to verify column name transform)

## Dev Notes

### Architecture Context

This story builds the data layer on top of Story 1.1's initialized backend (.NET 10 Clean Architecture). No frontend changes are required.

**Depends on:** Story 1.1 — SiesaAgents.Infrastructure project exists, `Npgsql.EntityFrameworkCore.PostgreSQL` v10.0.1 is already referenced.

**Provides for:** All subsequent backend stories (Epic 2, 3, 4) — entities and migrations will be added on top of this DbContext.

### AppDbContext Pattern

```csharp
// backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs
using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    // No DbSet<> properties in this story — entities added in Epic 2 and 3

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply entity configurations (IEntityTypeConfiguration<>) when they exist
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // MANDATORY: snake_case naming for all tables and columns — MUST be last
        modelBuilder.ApplySnakeCaseNaming();
    }
}
```

**Critical rule:** `modelBuilder.ApplySnakeCaseNaming()` MUST be the **last** call in `OnModelCreating`. Calling it before `ApplyConfigurationsFromAssembly` can cause naming to be overridden.

### Connection String Configuration

```json
// backend/src/SiesaAgents.API/appsettings.Development.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=siesa_agents_db;Username=postgres;Password=postgres"
  }
}
```

Adjust `Username` and `Password` to match the local PostgreSQL instance. The database name MUST be `siesa_agents_db`.

### DbContext Registration in Program.cs

```csharp
// In Program.cs — add before builder.Build()
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
```

Import namespace: `using SiesaAgents.Infrastructure.Data;`

### EF Core Tooling Requirements

`dotnet ef` requires a design-time reference in the startup project. Add these packages if not present:

```xml
<!-- SiesaAgents.API.csproj -->
<PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="10.0.*" />

<!-- SiesaAgents.Infrastructure.csproj -->
<PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="10.0.*" />
```

Run from `backend/` directory:
```bash
dotnet ef migrations add InitialCreate \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API \
  -o Data/Migrations

dotnet ef database update \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API
```

The migration will be empty (no tables) because no `DbSet<>` properties exist yet. This is intentional per scope.

### ExceptionHandlingMiddleware Pattern

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
            _logger.LogError(ex, "Unhandled exception");
            await WriteProblemDetailsAsync(context, ex);
        }
    }

    private static async Task WriteProblemDetailsAsync(HttpContext context, Exception ex)
    {
        var statusCode = ex switch
        {
            ArgumentException => StatusCodes.Status400BadRequest,
            KeyNotFoundException => StatusCodes.Status404NotFound,
            InvalidOperationException => StatusCodes.Status409Conflict,
            _ => StatusCodes.Status500InternalServerError
        };

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = GetTitle(statusCode),
            Detail = "An unexpected error occurred. Please try again later.",
        };

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = MediaTypeNames.Application.Json + "+problem";

        // CRITICAL: serialize ONLY the ProblemDetails fields — NEVER include ex.StackTrace or ex.GetType().Name
        await context.Response.WriteAsync(JsonSerializer.Serialize(problemDetails, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        }));
    }

    private static string GetTitle(int statusCode) => statusCode switch
    {
        400 => "Bad Request",
        404 => "Not Found",
        409 => "Conflict",
        _ => "Internal Server Error"
    };
}
```

Register in `Program.cs` **before** `app.UseCors()`:

```csharp
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors();
```

**Note:** `app.UseExceptionHandler()` from Story 1.1 may conflict. If `app.UseExceptionHandler()` is already registered in `Program.cs`, evaluate whether to replace it entirely with the custom middleware or complement it. The custom `ExceptionHandlingMiddleware` MUST guarantee no stack traces are exposed — verify this is not achievable through `app.UseExceptionHandler()` + `app.UseProblemDetails()` already in place before adding a duplicate handler.

### Database Conventions (Critical)

All entities created in future stories MUST follow these conventions — enforced via `ApplySnakeCaseNaming()`:

| C# property | SQL column (auto-mapped) |
|---|---|
| `Id` (Guid) | `id` |
| `CreatedAt` (DateTimeOffset) | `created_at` |
| `UpdatedAt` (DateTimeOffset) | `updated_at` |
| `ClienteId` (Guid?) | `cliente_id` |

- Primary keys: UUID (`Guid.NewGuid()`) — MANDATORY per company standards
- Timestamps: `DateTimeOffset` — NEVER `DateTime`
- Manual `[Column]` or `[Table]` attributes are FORBIDDEN — use `ApplySnakeCaseNaming()` exclusively

### Backend Naming Conventions

```csharp
// Namespace pattern
SiesaAgents.Infrastructure.Data            // DbContext, DbContextFactory
SiesaAgents.Infrastructure.Data.Migrations // EF Core migrations (auto-generated)
SiesaAgents.API.Middleware                 // ExceptionHandlingMiddleware

// File names
AppDbContext.cs
ExceptionHandlingMiddleware.cs
```

### Testing Requirements

#### Unit Tests — `backend/tests/SiesaAgents.UnitTests/`

| Test ID | Priority | File | Description |
|---|---|---|---|
| UNIT-F-04 | P1 | `Middleware/ExceptionHandlingMiddlewareTests.cs` | Unhandled exception → Problem Details response has `status`, `title`, `detail` |
| UNIT-F-05 | P1 | `Middleware/ExceptionHandlingMiddlewareTests.cs` | Response body does NOT contain `stackTrace` or exception type key |
| UNIT-F-06 | P2 | `Infrastructure/AppDbContextTests.cs` | `ApplySnakeCaseNaming()` is applied (verify via model builder conventions or column name assertions) |

**Unit test pattern (xUnit + Arrange/Act/Assert):**

```csharp
// ExceptionHandlingMiddlewareTests.cs
public class ExceptionHandlingMiddlewareTests
{
    [Fact]
    public async Task InvokeAsync_UnhandledException_ReturnsProblemDetails()
    {
        // Arrange
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new Exception("boom"),
            logger: NullLogger<ExceptionHandlingMiddleware>.Instance);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var json = JsonDocument.Parse(body).RootElement;

        // Assert
        Assert.Equal(500, context.Response.StatusCode);
        Assert.True(json.TryGetProperty("status", out _));
        Assert.True(json.TryGetProperty("title", out _));
        Assert.True(json.TryGetProperty("detail", out _));
    }

    [Fact]
    public async Task InvokeAsync_UnhandledException_DoesNotExposeStackTrace()
    {
        // Arrange
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new Exception("secret internal error"),
            logger: NullLogger<ExceptionHandlingMiddleware>.Instance);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();

        // Assert
        Assert.DoesNotContain("stackTrace", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("secret internal error", body);
    }
}
```

#### Integration Tests — `backend/tests/SiesaAgents.IntegrationTests/`

| Test ID | Priority | File | Description |
|---|---|---|---|
| INT-F-01 | P1 | `DatabaseFoundationTests.cs` | `AppDbContext.Database.CanConnectAsync()` returns `true` |
| INT-F-02 | P1 | `DatabaseFoundationTests.cs` | `__EFMigrationsHistory` table exists and has exactly 1 entry |

**Notes:**
- Integration tests require a running PostgreSQL instance. Use environment variable `ConnectionStrings__DefaultConnection` or `appsettings.Test.json`.
- Create `SiesaAgents.IntegrationTests` xUnit project under `backend/tests/` if it does not exist.
- Reference `SiesaAgents.Infrastructure` from the integration test project.

#### API Tests (Playwright APIRequestContext) — `e2e/tests/foundation/backend-health.spec.ts`

| Test ID | Priority | Description |
|---|---|---|
| API-F-03 | P1 | Problem Details: hitting a non-existent route returns JSON with `status`, `title` (no `stackTrace`) |

### Project Structure Notes

**Files to create:**

```
backend/src/SiesaAgents.Infrastructure/
  Data/
    AppDbContext.cs                              # DbContext with ApplySnakeCaseNaming()
    Migrations/                                 # Auto-generated by dotnet ef migrations add

backend/src/SiesaAgents.API/
  Middleware/
    ExceptionHandlingMiddleware.cs              # Problem Details RFC 7807

backend/tests/SiesaAgents.UnitTests/
  Middleware/
    ExceptionHandlingMiddlewareTests.cs         # UNIT-F-04, UNIT-F-05
  Infrastructure/
    AppDbContextTests.cs                        # UNIT-F-06

backend/tests/SiesaAgents.IntegrationTests/    # Create project if not exists
  DatabaseFoundationTests.cs                   # INT-F-01, INT-F-02
```

**Files to modify:**

```
backend/src/SiesaAgents.API/Program.cs
  — Register AppDbContext with Npgsql
  — Register ExceptionHandlingMiddleware (before app.UseCors())

backend/src/SiesaAgents.API/appsettings.Development.json
  — Add ConnectionStrings.DefaultConnection pointing to siesa_agents_db

backend/src/SiesaAgents.API/SiesaAgents.API.csproj
  — Add Microsoft.EntityFrameworkCore.Design package reference

backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj
  — Add Microsoft.EntityFrameworkCore.Tools package reference (if needed)
```

**Alignment with architecture directory structure (`architecture.md` — "Project Structure"):**

- `AppDbContext.cs` → `SiesaAgents.Infrastructure/Data/`
- `Migrations/` → `SiesaAgents.Infrastructure/Data/Migrations/`
- `ExceptionHandlingMiddleware.cs` → `SiesaAgents.API/Middleware/`

> Note: The architecture document places `Migrations/` directly under `SiesaAgents.Infrastructure/Migrations/`. The EF Core convention via `-o Data/Migrations` places them under `Data/Migrations/`. Both are acceptable — use `Data/Migrations/` to keep data-layer files grouped together. Adjust `-o` flag if team preference differs.

### Key Anti-Patterns to Avoid

```
❌ DateTime in DbContext properties        → DateTimeOffset
❌ [Column("created_at")] attributes       → ApplySnakeCaseNaming() only
❌ string Id / int Id                      → Guid (UUID) mandatory
❌ Exposing ex.StackTrace in middleware    → Problem Details only
❌ app.UseSwagger()                        → already using Scalar (no change)
❌ Adding ClienteEntity / ContactoEntity  → out of scope for this story
❌ ApplySnakeCaseNaming() before ApplyConfigurationsFromAssembly() → must be last
```

### References

- Epic source: `_bmad-output/planning-artifacts/epics/epic-01-foundation.md` — Story 1.3 AC
- Architecture: `_bmad-output/planning-artifacts/architecture.md` — "Data Architecture", "Backend folder structure", "Implementation Patterns & Consistency Rules", "Enforcement Guidelines"
- Test design: `_bmad-output/implementation-artifacts/test-design-epic-1.md` — INT-F-01, INT-F-02, UNIT-F-04, UNIT-F-05, UNIT-F-06, API-F-03
- Company standards: `.claude/agent-memory/sa-quick-dev/company-standards.md` — Backend Stack, Database Conventions, Backend Critical Rules
- Predecessor story: `_bmad-output/implementation-artifacts/stories/1-2-frontend-navigation-shell.md`
- Existing backend: `backend/src/SiesaAgents.API/Program.cs`, `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- `ApplySnakeCaseNaming()` implemented as custom extension in `ModelBuilderExtensions.cs` (EFCore.NamingConventions package not available in offline environment).
- `ExceptionHandlingMiddleware` updated to handle non-exception 4xx/5xx responses (e.g. routing 404) in addition to thrown exceptions.
- `DatabaseFoundationTests.cs` updated: added `IDisposable` interface, added `Microsoft.Extensions.Configuration.EnvironmentVariables` package, fixed `SqlQueryRaw<int>` column alias to `"Value"` for PostgreSQL compatibility.
- EF Core InitialCreate migration applied — `siesa_agents_db` created with `__EFMigrationsHistory` containing exactly 1 entry.

### File List

- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` (existing, verified)
- `backend/src/SiesaAgents.Infrastructure/Data/ModelBuilderExtensions.cs` (created)
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/` (created via dotnet-ef)
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` (updated - added status code handler)
- `backend/src/SiesaAgents.API/Program.cs` (existing, verified)
- `backend/src/SiesaAgents.API/appsettings.Development.json` (existing, verified)
- `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs` (existing, all pass)
- `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs` (existing, all pass)
- `backend/tests/SiesaAgents.IntegrationTests/DatabaseFoundationTests.cs` (updated - IDisposable, SQL alias fix)
- `backend/tests/SiesaAgents.IntegrationTests/SiesaAgents.IntegrationTests.csproj` (updated - added EnvironmentVariables package)

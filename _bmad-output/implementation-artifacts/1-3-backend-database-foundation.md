# Story 1.3: Backend Database Foundation

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

## Acceptance Criteria

1. **Given** PostgreSQL is running locally, **When** the developer runs `dotnet ef database update`, **Then** the `siesa_agents_db` database is created with no errors, **And** the EF Core migrations folder exists in `SiesaAgents.Infrastructure`.

2. **Given** an unhandled exception occurs in the backend, **When** the error reaches the middleware, **Then** the response returns Problem Details RFC 7807 format (`status`, `title`, `detail`) with no stack traces exposed (NFR6).

3. **Given** the backend receives any request, **When** the request is processed, **Then** `ApplySnakeCaseNaming()` is applied in `OnModelCreating` and all future column names follow snake_case convention automatically.

4. **Given** `appsettings.Development.json` is configured with the `siesa_agents_db` connection string, **When** `AppDbContext` is registered in DI, **Then** EF Core resolves the Npgsql provider without errors at startup.

5. **Given** the solution is built, **When** `dotnet build` is run, **Then** all four projects (API, Application, Domain, Infrastructure) compile with zero errors and zero warnings.

## Tasks / Subtasks

- [ ] Task 1 — Add NuGet packages to `SiesaAgents.Infrastructure` (AC: #1, #4)
  - [ ] Add `Npgsql.EntityFrameworkCore.PostgreSQL` (latest stable for .NET 10 / EF Core 10)
  - [ ] Add `EFCore.NamingConventions` (for `UseSnakeCaseNamingConvention()` / `ApplySnakeCaseNaming()`)
  - [ ] Add `Microsoft.EntityFrameworkCore.Design` to `SiesaAgents.API` (required for `dotnet ef` tooling)
  - [ ] Add `Microsoft.EntityFrameworkCore.Tools` to `SiesaAgents.Infrastructure` (migrations support)

- [ ] Task 2 — Create `AppDbContext` in `SiesaAgents.Infrastructure` (AC: #3, #4)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`
  - [ ] Inherit from `DbContext`
  - [ ] Override `OnModelCreating` — apply `modelBuilder.UseSnakeCaseNamingConvention()` as the LAST call
  - [ ] Constructor accepts `DbContextOptions<AppDbContext>` via DI
  - [ ] Do NOT add any `DbSet<>` properties in this story (domain entities belong to Epics 2 and 3)

- [ ] Task 3 — Configure connection string (AC: #4)
  - [ ] Add `ConnectionStrings.DefaultConnection` to `backend/src/SiesaAgents.API/appsettings.Development.json`:
    ```json
    "ConnectionStrings": {
      "DefaultConnection": "Host=localhost;Port=5432;Database=siesa_agents_db;Username=postgres;Password=postgres"
    }
    ```
  - [ ] Do NOT commit real credentials — comment instructs developer to set own password

- [ ] Task 4 — Register EF Core in DI (`Program.cs`) (AC: #4, #5)
  - [ ] In `backend/src/SiesaAgents.API/Program.cs`, add:
    ```csharp
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
    ```
  - [ ] Add `using SiesaAgents.Infrastructure.Data;` and relevant `using` statements
  - [ ] Ensure the `SiesaAgents.API.csproj` references `SiesaAgents.Infrastructure`

- [ ] Task 5 — Implement `ExceptionHandlingMiddleware` (AC: #2)
  - [ ] Create `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`
  - [ ] Implement `IMiddleware` (or use the delegate pattern with `RequestDelegate`)
  - [ ] Catch `Exception` broadly and map to Problem Details RFC 7807:
    - `status`: `500` (or specific codes for domain exceptions in future stories)
    - `title`: `"An unexpected error occurred"`
    - `detail`: Generic message — NEVER expose `exception.Message` or stack traces in production
    - Response `Content-Type`: `application/problem+json`
  - [ ] Register middleware in `Program.cs` via `app.UseMiddleware<ExceptionHandlingMiddleware>()`
  - [ ] Add `app.UseMiddleware<ExceptionHandlingMiddleware>()` BEFORE endpoint mapping

- [ ] Task 6 — Create initial EF Core migration (AC: #1)
  - [ ] Run from solution root:
    ```bash
    dotnet ef migrations add InitialCreate \
      --project src/SiesaAgents.Infrastructure \
      --startup-project src/SiesaAgents.API
    ```
  - [ ] Verify `Migrations/` folder is created in `SiesaAgents.Infrastructure` with `InitialCreate` files
  - [ ] The migration should be empty (no tables) — this is expected per scope note
  - [ ] Run `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
  - [ ] Verify `siesa_agents_db` database is created in PostgreSQL with `__EFMigrationsHistory` table

- [ ] Task 7 — Write xUnit tests (AC: #2, #3, #5)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs`
  - [ ] Test 1: Middleware returns HTTP 500 with `application/problem+json` content type when an unhandled exception is thrown
  - [ ] Test 2: Response body contains `status`, `title`, and `detail` fields (RFC 7807 shape)
  - [ ] Test 3: Response body does NOT contain stack trace text
  - [ ] Test 4: Middleware invokes `next` delegate when no exception is thrown (happy path)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`
  - [ ] Test 5: `OnModelCreating` is called and snake_case naming convention is applied (verify via model metadata that table/column names are lowercase snake_case)

## Dev Notes

### Architecture Patterns

- **Clean Architecture layers** — this story touches `SiesaAgents.Infrastructure` (DbContext, Migrations) and `SiesaAgents.API` (middleware registration, DI wiring). Domain and Application layers are NOT modified.
- **AppDbContext** must live in `SiesaAgents.Infrastructure/Data/` per the architecture directory structure.
- **ExceptionHandlingMiddleware** lives in `SiesaAgents.API/Middleware/` — it is a cross-cutting infrastructure concern, but scoped to the API layer.
- **No domain entities in this story** — per epic scope note: `ClienteEntity` and `ContactoEntity` will be added in Epics 2 and 3 respectively.
- The initial migration MUST be empty (only `__EFMigrationsHistory` table scaffold). Any domain table creation in this migration is out of scope.

### Tech Stack & Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| `Npgsql.EntityFrameworkCore.PostgreSQL` | 10.x (aligned with EF Core 10) | PostgreSQL provider for EF Core |
| `EFCore.NamingConventions` | latest | snake_case naming via `UseSnakeCaseNamingConvention()` |
| `Microsoft.EntityFrameworkCore.Design` | 10.x | EF Core tooling (dotnet ef commands) |
| `Microsoft.EntityFrameworkCore.Tools` | 10.x | EF Core migrations |

### Critical Implementation Constraints

1. **UUID Primary Keys**: ALL future entities will use `Guid` PKs (UUID). `AppDbContext` must not introduce any `int` identity configurations.
2. **DateTimeOffset MANDATORY**: When domain entities are added later, use `DateTimeOffset` — NEVER `DateTime`. This story sets the convention, not the entities.
3. **`ApplySnakeCaseNaming()` call order**: Must be the LAST call in `OnModelCreating`. If `ApplyConfigurations()` is added later, `UseSnakeCaseNamingConvention()` must still be called last.
4. **Problem Details RFC 7807**: `ExceptionHandlingMiddleware` must set `Content-Type: application/problem+json` and return a JSON object with fields: `type`, `title`, `status`, `detail`. Do NOT expose `exception.StackTrace` or `exception.Message` in production responses.
5. **Scalar API docs**: `Program.cs` already registers Scalar from Story 1.1 — do NOT add `app.UseSwagger()` under any circumstance.
6. **Connection string**: Use `appsettings.Development.json` only. Never hardcode credentials. Use environment variable override for CI/CD.

### `AppDbContext` Reference Implementation

```csharp
// SiesaAgents.Infrastructure/Data/AppDbContext.cs
using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply all IEntityTypeConfiguration<T> from this assembly (future stories)
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // MUST be last — converts all table/column names to snake_case
        modelBuilder.UseSnakeCaseNamingConvention();
    }
}
```

### `ExceptionHandlingMiddleware` Reference Implementation

```csharp
// SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs
using Microsoft.AspNetCore.Mvc;

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
            _logger.LogError(ex, "Unhandled exception occurred");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/problem+json";
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;

        var problem = new ProblemDetails
        {
            Status = StatusCodes.Status500InternalServerError,
            Title = "An unexpected error occurred",
            Detail = "An internal server error has occurred. Please try again later.",
            Type = "https://tools.ietf.org/html/rfc7807"
        };

        await context.Response.WriteAsJsonAsync(problem);
    }
}
```

### `Program.cs` Registration Reference

```csharp
// Register ExceptionHandlingMiddleware BEFORE UseRouting/UseEndpoints
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Register DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
```

### Project Structure Notes

Files to create or modify in this story:

```
backend/
  src/
    SiesaAgents.Infrastructure/
      SiesaAgents.Infrastructure.csproj     ← Add NuGet packages
      Data/
        AppDbContext.cs                      ← CREATE (new file)
      Migrations/                            ← CREATE via dotnet ef migrations add
        <timestamp>_InitialCreate.cs
        <timestamp>_InitialCreate.Designer.cs
        AppDbContextModelSnapshot.cs
    SiesaAgents.API/
      SiesaAgents.API.csproj                ← Add Microsoft.EntityFrameworkCore.Design ref
      Program.cs                            ← MODIFY: add DbContext DI + middleware registration
      Middleware/
        ExceptionHandlingMiddleware.cs      ← CREATE (new file)
      appsettings.Development.json          ← MODIFY: add ConnectionStrings section
  tests/
    SiesaAgents.UnitTests/
      SiesaAgents.UnitTests.csproj          ← Add EF Core InMemory ref if needed
      Middleware/
        ExceptionHandlingMiddlewareTests.cs ← CREATE (new file)
      Infrastructure/
        AppDbContextTests.cs                ← CREATE (new file)
```

- `SiesaAgents.Domain` and `SiesaAgents.Application` are NOT modified in this story.
- `SiesaAgents.API.csproj` must already reference `SiesaAgents.Infrastructure` from Story 1.1 — verify this before adding new packages.

### Testing Standards

- **xUnit** for all unit tests (company standard, see `company-standards.md`)
- **EF Core InMemory** provider for `AppDbContextTests` (unit tests do not require a running PostgreSQL instance)
- **Test structure**: Arrange / Act / Assert pattern — no exception
- **Integration tests** (PostgreSQL TestContainers) are deferred to future stories when domain entities exist
- Coverage target: >80% for middleware and context

### Previous Story Learnings (from Story 1.2)

- Story 1.2 had issues with siesa-ui-kit components not being used (custom nav built instead). This story is pure backend — no siesa-ui-kit required.
- Code review in 1.2 enforced `useIsMobile` moved to `shared/hooks` — follow the Clean Architecture layers strictly (no cross-layer leakage).
- Git history shows active story pattern: fix commits are common. Ensure `ExceptionHandlingMiddleware` is tested thoroughly to avoid review cycles.

### Git History Context

Recent commits show Story 1.2 work (navigation shell fixes). Story 1.3 introduces the first backend infrastructure. No prior migrations exist — this is the `InitialCreate` baseline.

### References

- Architecture decision: `_bmad-output/planning-artifacts/architecture.md` — "Data Architecture", "Infrastructure & Deployment", "Enforcement Guidelines"
- Epic source: `_bmad-output/planning-artifacts/epics/epic-01-foundation.md` — Story 1.3 section
- Company standards: `.claude/agent-memory/sa-quick-dev/company-standards.md` — "Backend Stack", "Database Conventions", "Backend Critical Rules"
- NFR6 (no stack traces): `architecture.md` — "Authentication & Security" section

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

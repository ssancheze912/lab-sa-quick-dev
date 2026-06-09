# Story 1.3: Backend Database Foundation

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

## Acceptance Criteria

1. **Given** PostgreSQL is running locally, **When** the developer runs `dotnet ef database update` from the `backend/` directory (or `src/SiesaAgents.Infrastructure/`), **Then** the `siesa_agents_db` database is created with no errors, and the EF Core migrations folder exists at `backend/src/SiesaAgents.Infrastructure/Migrations/`.

2. **Given** an unhandled exception occurs in the backend, **When** the error reaches the middleware, **Then** the response returns Problem Details RFC 7807 format with `status`, `title`, and `detail` fields, uses `Content-Type: application/problem+json`, and exposes NO stack traces or raw exception messages (NFR6).

3. **Given** the backend receives any request, **When** EF Core models are configured via `OnModelCreating`, **Then** `modelBuilder.ApplySnakeCaseNaming()` is applied as the LAST call in `OnModelCreating`, ensuring all future column names follow snake_case convention automatically.

4. **Given** the initial migration is created and applied, **When** the developer inspects the `siesa_agents_db` schema, **Then** only the `__ef_migrations_history` table exists — no domain tables (`clientes`, `contactos`) are present (scope boundary respected per epic note).

5. **Given** the Infrastructure project references the Domain project and is wired to the API via DI, **When** the developer runs `dotnet build SiesaAgents.slnx`, **Then** all four Clean Architecture projects compile with zero errors.

## Tasks / Subtasks

- [x] Task 1 — Add EF Core + Npgsql NuGet packages (AC: #1, #3, #5)
  - [x] In `backend/src/SiesaAgents.Infrastructure/`, add NuGet packages: `Npgsql.EntityFrameworkCore.PostgreSQL` (already added in Story 1.1 — verify it is present), `Microsoft.EntityFrameworkCore.Design` (for migration tooling)
  - [x] In `backend/src/SiesaAgents.API/`, add `Microsoft.EntityFrameworkCore.Design` if not already present (required for `dotnet ef` CLI to work from the API project)
  - [x] Verify `SiesaAgents.Infrastructure.csproj` includes `<PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" />` and `<PackageReference Include="Microsoft.EntityFrameworkCore.Design" />`

- [x] Task 2 — Create `AppDbContext` (AC: #1, #3, #4)
  - [x] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`
  - [x] Inherit from `DbContext`, accept `DbContextOptions<AppDbContext>` via constructor
  - [x] Override `OnModelCreating(ModelBuilder modelBuilder)`:
    - [x] Call `modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly())` to auto-register entity configurations
    - [x] `UseSnakeCaseNamingConvention()` registered via `DbContextOptionsBuilder` in `Program.cs` and test contexts (EFCore.NamingConventions v10.0.1 extension is on options builder, not ModelBuilder)
  - [x] Do NOT define any `DbSet<>` properties in this story — domain tables are scoped to Epics 2 and 3

- [x] Task 3 — Create initial EF Core migration (AC: #1, #4)
  - [x] Run `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` from the `backend/` directory
  - [x] Verify `backend/src/SiesaAgents.Infrastructure/Migrations/` folder is created with `InitialCreate` migration files
  - [x] Inspect migration file to confirm it is empty of domain tables (only EF Core scaffolding — no `clientes` or `contactos` Up/Down code)
  - [x] Run `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` to apply the migration
  - [x] Verify `siesa_agents_db` is created and `__EFMigrationsHistory` table exists with snake_case columns (`migration_id`, `product_version`)

- [x] Task 4 — Register `AppDbContext` in DI container (AC: #1, #5)
  - [x] In `backend/src/SiesaAgents.API/Program.cs`, add EF Core registration with `UseSnakeCaseNamingConvention()`
  - [x] Add `using SiesaAgents.Infrastructure.Data;` and `using Microsoft.EntityFrameworkCore;` to `Program.cs`
  - [x] Verify `appsettings.Development.json` already contains `ConnectionStrings:DefaultConnection` (set in Story 1.1 — `Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres`)

- [x] Task 5 — Verify and harden `ExceptionHandlingMiddleware` (AC: #2)
  - [x] Open `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` (created in Story 1.1)
  - [x] Confirm it wraps `await next(context)` in a try/catch
  - [x] Hardened: uses `JsonSerializer.SerializeToUtf8Bytes` to preserve `Content-Type: application/problem+json; charset=utf-8` — `WriteAsJsonAsync` was overriding it to `application/json`
  - [x] Confirm middleware is registered in `Program.cs` BEFORE endpoint mapping and BEFORE `app.UseCors()`

- [x] Task 6 — Write xUnit integration tests (AC: #1, #2, #3, #4)
  - [x] Create `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`
    - [x] Test: `OnModelCreating` completes without throwing, no domain DbSets, DI resolution, and integration tests for migration + snake_case columns
  - [x] Create `backend/tests/SiesaAgents.UnitTests/API/ExceptionMiddlewareTests.cs`
    - [x] Test: Unhandled exception → response `Content-Type` is `application/problem+json`, status 500, body contains `status`/`title` keys, does NOT contain `stackTrace` key

## Dev Notes

### No UI Component — Backend Only

This story is purely backend. No frontend changes are required. `has_ui_component = false`. No siesa-ui-kit requirements apply.

### Architecture Patterns

**Clean Architecture layer responsibilities for this story:**

| Layer | File(s) | Responsibility |
|-------|---------|----------------|
| Infrastructure | `AppDbContext.cs` | EF Core DbContext, snake_case naming, configuration loading |
| Infrastructure | `Migrations/` | EF-generated migration files (do not hand-edit) |
| API | `Program.cs` | DI registration of `AppDbContext`, connection string wiring |
| API | `Middleware/ExceptionHandlingMiddleware.cs` | Problem Details RFC 7807 error responses |

**Project reference chain (already established in Story 1.1):**
```
SiesaAgents.API → SiesaAgents.Infrastructure → SiesaAgents.Domain
SiesaAgents.API → SiesaAgents.Application → SiesaAgents.Domain
```

### EF Core Configuration Details

**`AppDbContext.cs` — correct pattern:**

```csharp
using Microsoft.EntityFrameworkCore;
using System.Reflection;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // No DbSet<> properties in this story — domain tables are scoped to Epics 2 and 3

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Auto-register all IEntityTypeConfiguration<T> in this assembly
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        // CRITICAL: ApplySnakeCaseNaming() MUST be the last call in this method
        modelBuilder.ApplySnakeCaseNaming();
    }
}
```

**Critical ordering rule:** `ApplySnakeCaseNaming()` must be the absolute last call in `OnModelCreating`. If any `IEntityTypeConfiguration` or fluent API call runs after it, explicit column names in those configurations will override the snake_case naming convention. This is documented in the architecture and company standards.

**Extension method source:** `ApplySnakeCaseNaming()` is provided by `EFCore.NamingConventions` NuGet package (for Npgsql/PostgreSQL projects). Add it explicitly:
```bash
dotnet add src/SiesaAgents.Infrastructure package EFCore.NamingConventions
```
Then register the convention in `UseNpgsql` options:
```csharp
options.UseNpgsql(connectionString)
       .UseSnakeCaseNamingConvention();
```
Alternatively, call `modelBuilder.UseSnakeCaseNamingConvention()` in `OnModelCreating`. Confirm which extension method is available after package installation — both `ApplySnakeCaseNaming()` and `UseSnakeCaseNamingConvention()` achieve the same result depending on the package version. The architecture references `ApplySnakeCaseNaming()` (method name from `EFCore.NamingConventions`).

**Important:** `Npgsql.EntityFrameworkCore.PostgreSQL` alone does NOT include `ApplySnakeCaseNaming()`. The `EFCore.NamingConventions` package is a separate dependency.

### NuGet Packages Required

```bash
# Already present from Story 1.1 (verify):
dotnet add src/SiesaAgents.Infrastructure package Npgsql.EntityFrameworkCore.PostgreSQL

# New in this story:
dotnet add src/SiesaAgents.Infrastructure package EFCore.NamingConventions
dotnet add src/SiesaAgents.Infrastructure package Microsoft.EntityFrameworkCore.Design
dotnet add src/SiesaAgents.API package Microsoft.EntityFrameworkCore.Design
```

### EF Core CLI Migration Commands

Run from the `backend/` directory (where `SiesaAgents.slnx` lives):

```bash
# Create the initial empty migration
dotnet ef migrations add InitialCreate \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API

# Apply the migration to create siesa_agents_db
dotnet ef database update \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API
```

**Prerequisites for `dotnet ef` to work:**
1. `Microsoft.EntityFrameworkCore.Design` must be referenced in BOTH `SiesaAgents.Infrastructure.csproj` and `SiesaAgents.API.csproj` (the startup project needs it at build time).
2. `AppDbContext` must be registered in the DI container in `Program.cs` before calling `dotnet ef migrations add`.
3. Connection string in `appsettings.Development.json` must be valid and PostgreSQL must be running.

### `Program.cs` DI Registration Pattern

```csharp
// After builder.Services.AddOpenApi() and CORS registration:
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
           .UseSnakeCaseNamingConvention());  // only if ApplySnakeCaseNaming() is from UseNpgsql options
```

Or register the naming convention in `OnModelCreating` (recommended per architecture):
```csharp
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
// Then apply naming convention in AppDbContext.OnModelCreating (see above)
```

### ExceptionHandlingMiddleware Verification

Middleware was created in Story 1.1 (Task 4). Verify the implementation matches this pattern exactly:

```csharp
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
                Detail = null   // NEVER expose exception message or stack trace
            });
        }
    }
}
```

**Middleware order in `Program.cs` (critical):**
```csharp
app.UseMiddleware<ExceptionHandlingMiddleware>();  // FIRST — catches all exceptions
app.UseCors("DevCors");                            // SECOND
app.MapScalarApiReference();                       // Scalar docs
// ... endpoint mappings last
```

### Database Configuration

**Connection string** (already set in Story 1.1 `appsettings.Development.json`):
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres"
  }
}
```

**Scope boundary (critical):** This story creates an empty initial migration. No `DbSet<ClienteEntity>` or `DbSet<ContactoEntity>` properties. No entity configurations in `Configurations/`. The `Migrations/InitialCreate.cs` file will have empty `Up()` and `Down()` methods (only EF Core metadata). Domain tables (`clientes`, `contactos`) are created in Epics 2 and 3 respectively.

### Testing

**Framework:** xUnit + `WebApplicationFactory<Program>` (backend integration) — per company standards and test design for Epic 1.

**Test cases from `test-design-epic-1.md` relevant to this story:**

| Test ID | Description | Priority |
|---------|-------------|----------|
| TC-E1-P0-05 | ExceptionHandlingMiddleware returns Problem Details RFC 7807 | P0 (must pass) |
| TC-E1-P1-05 | EF Core migration creates `siesa_agents_db` and migrations table | P1 |
| TC-E1-P2-04 | snake_case columns via `ApplySnakeCaseNaming()` | P2 |

**Unit test for middleware (xUnit + WebApplicationFactory):**

```csharp
[Fact]
public async Task ExceptionMiddleware_Returns_ProblemDetails_Without_StackTrace()
{
    // Arrange: register a test endpoint that throws
    var factory = new WebApplicationFactory<Program>()
        .WithWebHostBuilder(builder =>
        {
            builder.Configure(app =>
            {
                app.UseMiddleware<ExceptionHandlingMiddleware>();
                app.Map("/api/v1/test-error", () => { throw new Exception("internal test"); });
            });
        });
    var client = factory.CreateClient();

    // Act
    var response = await client.GetAsync("/api/v1/test-error");
    var body = await response.Content.ReadAsStringAsync();

    // Assert
    Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
    Assert.Contains("application/problem+json", response.Content.Headers.ContentType?.ToString());
    Assert.DoesNotContain("stackTrace", body, StringComparison.OrdinalIgnoreCase);
    Assert.DoesNotContain("internal test", body);  // No raw exception message
    Assert.Contains("\"status\"", body);
    Assert.Contains("\"title\"", body);
}
```

**Integration test for DB migration (requires live PostgreSQL):**

```csharp
[Fact]
public async Task EfCore_Migration_Creates_Database_With_SnakeCase_Table()
{
    // Uses TestContainers or a local PostgreSQL instance
    // After applying migration: query information_schema.tables
    // Verify __ef_migrations_history exists and migration_id column is snake_case
}
```

**Coverage target:** > 80% per company standards. Tests should cover: middleware 500 response, Problem Details format, absence of stack trace, DB creation, snake_case naming.

### Project Structure Notes

Files created/modified in this story (relative to `backend/`):

```
src/SiesaAgents.Infrastructure/
  Data/
    AppDbContext.cs                          ← NEW
  Migrations/                               ← NEW (generated by EF CLI)
    <timestamp>_InitialCreate.cs            ← NEW (generated)
    <timestamp>_InitialCreate.Designer.cs   ← NEW (generated)
    AppDbContextModelSnapshot.cs            ← NEW (generated)
  SiesaAgents.Infrastructure.csproj        ← UPDATE (add EFCore.NamingConventions, Microsoft.EntityFrameworkCore.Design)

src/SiesaAgents.API/
  Program.cs                               ← UPDATE (register AppDbContext)
  SiesaAgents.API.csproj                   ← UPDATE (add Microsoft.EntityFrameworkCore.Design)
  Middleware/
    ExceptionHandlingMiddleware.cs         ← VERIFY (created in Story 1.1, validate correctness)

tests/SiesaAgents.UnitTests/
  Infrastructure/
    AppDbContextTests.cs                   ← NEW
  API/
    ExceptionMiddlewareTests.cs            ← NEW
```

No frontend files. No Application or Domain layer files.

### References

- Story 1.3 acceptance criteria: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3]
- EF Core DbContext + ApplySnakeCaseNaming pattern: [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- Backend project structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Problem Details RFC 7807 + middleware ordering: [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- ExceptionHandlingMiddleware pattern: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#ExceptionHandlingMiddleware pattern]
- EF Core NuGet packages from Story 1.1: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#Completion Notes List]
- Database conventions (snake_case, UUID PKs, DateTimeOffset): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions (PostgreSQL)]
- Backend critical rules (DateTimeOffset, Entity pattern, Error Responses): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- Test cases TC-E1-P0-05, TC-E1-P1-05, TC-E1-P2-04: [Source: _bmad-output/implementation-artifacts/test-design-epic-1.md#Test Cases by Priority]
- Scope note (no domain tables in this story): [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3 scope note]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

1. `EFCore.NamingConventions` v10.0.1 provides `UseSnakeCaseNamingConvention()` only on `DbContextOptionsBuilder`, NOT on `ModelBuilder`. Applied via `options.UseNpgsql(...).UseSnakeCaseNamingConvention()` in `Program.cs` and test contexts. The story reference to `ApplySnakeCaseNaming()` was clarified by the dev notes as equivalent to `UseSnakeCaseNamingConvention()`.
2. `ExceptionHandlingMiddleware` was hardened: replaced `WriteAsJsonAsync` (which overrides Content-Type to `application/json`) with `JsonSerializer.SerializeToUtf8Bytes` to preserve `application/problem+json; charset=utf-8`.
3. Integration tests use separate `NpgsqlConnection` instances (not `context.Database.GetDbConnection()`) to avoid `NpgsqlOperationInProgressException` after `MigrateAsync()`.
4. Test packages upgraded: `Microsoft.AspNetCore.Mvc.Testing` 10.0.8, `Microsoft.EntityFrameworkCore.InMemory` 10.0.8, added `Microsoft.AspNetCore.TestHost` 10.0.8.
5. All 14 tests pass: 11 unit + 3 integration (with live PostgreSQL). Build: 0 errors, 1 warning (transitive EFCore version conflict from EFCore.NamingConventions upstream — non-blocking).
6. `siesa_agents_db` created with only `__EFMigrationsHistory` (columns: `migration_id`, `product_version` — snake_case confirmed).

### File List

**Modified:**
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` — implemented `OnModelCreating` with `ApplyConfigurationsFromAssembly`
- `backend/src/SiesaAgents.API/Program.cs` — registered `AppDbContext` with `UseNpgsql().UseSnakeCaseNamingConvention()`
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` — hardened Content-Type to `application/problem+json` using `JsonSerializer`
- `backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj` — added `Microsoft.AspNetCore.TestHost`, `EFCore.NamingConventions`, upgraded `Microsoft.AspNetCore.Mvc.Testing` and `Microsoft.EntityFrameworkCore.InMemory` to 10.0.8
- `backend/tests/SiesaAgents.UnitTests/API/ExceptionMiddlewareTests.cs` — rewrote to use `IHostBuilder + TestServer` pattern
- `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs` — updated integration tests with `UseSnakeCaseNamingConvention()` and separate connections

**Created (EF CLI generated):**
- `backend/src/SiesaAgents.Infrastructure/Migrations/20260609045338_InitialCreate.cs`
- `backend/src/SiesaAgents.Infrastructure/Migrations/20260609045338_InitialCreate.Designer.cs`
- `backend/src/SiesaAgents.Infrastructure/Migrations/AppDbContextModelSnapshot.cs`

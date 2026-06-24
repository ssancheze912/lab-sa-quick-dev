# Story 1.3: Backend Database Foundation

Status: ready-for-dev

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

## Acceptance Criteria

1. **Given** PostgreSQL is running locally, **When** the developer runs `dotnet ef database update` from the `backend/` directory, **Then** the `siesa_agents_db` database is created with no errors, **And** an EF Core Migrations folder exists at `backend/src/SiesaAgents.Infrastructure/Migrations/` containing an initial migration file.

2. **Given** the EF Core DbContext is configured, **When** `OnModelCreating` executes, **Then** `modelBuilder.ApplySnakeCaseNaming()` is called as the last statement, ensuring all future column and table names automatically follow snake_case convention without any `[Column]` or `[Table]` data annotation attributes.

3. **Given** an unhandled exception occurs anywhere in the backend request pipeline, **When** the exception reaches the global middleware, **Then** the response body follows Problem Details RFC 7807 format with fields: `status` (HTTP code), `title` (error category), `detail` (user-safe message), **And** no stack trace or internal exception message is exposed (NFR6).

4. **Given** a domain-level validation failure occurs (e.g., not-found, conflict), **When** it is caught by the middleware, **Then** the appropriate HTTP status code is returned (404, 409, 400) with a Problem Details body, never a 500.

5. **Given** the backend starts with `dotnet run`, **When** the developer opens `http://localhost:5000/scalar`, **Then** the Scalar API documentation page loads successfully (no Swagger/OpenAPI UI must be registered).

6. **Given** the connection string is configured in `appsettings.Development.json`, **When** `AppDbContext` is registered in `Program.cs`, **Then** the connection uses the `siesa_agents_db` PostgreSQL database on `localhost:5432` with the Npgsql provider.

7. **Given** the initial migration is created, **When** it is applied, **Then** the migration contains NO domain entity tables (no `clientes`, no `contactos`) — only the EF Core migration history table (`__EFMigrationsHistory`) is created in the database. The `clientes` table is created in Story 2.1; the `contactos` table is created in Story 3.1.

## Tasks / Subtasks

- [ ] Task 1 — Configure EF Core DbContext with Npgsql and snake_case naming (AC: #1, #2, #6)
  - [ ] Add `Npgsql.EntityFrameworkCore.PostgreSQL` package to `SiesaAgents.Infrastructure.csproj` (if not already present from Story 1.1)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` inheriting `DbContext`
  - [ ] Override `OnModelCreating` with `modelBuilder.ApplySnakeCaseNaming()` as the last call — no manual `[Column]` or `[Table]` attributes on any entity
  - [ ] Add connection string `"DefaultConnection"` to `backend/src/SiesaAgents.API/appsettings.Development.json`: `"Host=localhost;Port=5432;Database=siesa_agents_db;Username=postgres;Password=postgres"`
  - [ ] Register `AppDbContext` in `Program.cs` using `builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString))`

- [ ] Task 2 — Create the initial empty migration (AC: #1, #7)
  - [ ] Run `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` from the `backend/` directory
  - [ ] Verify the migration file is created at `backend/src/SiesaAgents.Infrastructure/Migrations/` and contains NO `clientes` or `contactos` table creation — only the migrations history table setup
  - [ ] Run `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` and verify `siesa_agents_db` is created without errors

- [ ] Task 3 — Implement global exception handling middleware (AC: #3, #4)
  - [ ] Create `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` implementing `IMiddleware`
  - [ ] Catch all unhandled exceptions and write a `ProblemDetails` response (use `Microsoft.AspNetCore.Mvc.ProblemDetails` or `IProblemDetailsService`)
  - [ ] Map known exception types to HTTP status codes:
    - `KeyNotFoundException` or custom `NotFoundException` → 404
    - Custom `ConflictException` → 409
    - `ArgumentException` or `ValidationException` → 400
    - All others → 500
  - [ ] Ensure `detail` field contains only a user-safe message — NO `exception.StackTrace`, NO `exception.InnerException.Message` in production/non-development environments
  - [ ] Register the middleware in `Program.cs` with `app.UseMiddleware<ExceptionHandlingMiddleware>()` before endpoint mapping
  - [ ] Add `builder.Services.AddProblemDetails()` to DI registration

- [ ] Task 4 — Validate Scalar API documentation (AC: #5)
  - [ ] Confirm `Scalar.AspNetCore` NuGet package is referenced in `SiesaAgents.API.csproj` (added in Story 1.1)
  - [ ] Confirm `app.MapScalarApiReference()` is present in `Program.cs` — never `app.UseSwagger()`
  - [ ] Verify `http://localhost:5000/scalar` loads the API docs page after `dotnet run`

- [ ] Task 5 — Unit tests for exception middleware (AC: #3, #4)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/API/Middleware/ExceptionHandlingMiddlewareTests.cs`
  - [ ] Test: unhandled `Exception` → 500 status + Problem Details body
  - [ ] Test: `KeyNotFoundException` → 404 status + Problem Details body
  - [ ] Test: `ArgumentException` → 400 status + Problem Details body
  - [ ] Test: response body never contains `StackTrace` string
  - [ ] All tests follow Arrange / Act / Assert pattern using xUnit

- [ ] Task 6 — Integration smoke test for database connectivity (AC: #1, #6)
  - [ ] Create `backend/tests/SiesaAgents.IntegrationTests/Infrastructure/DatabaseConnectivityTests.cs`
  - [ ] Test: `AppDbContext.Database.CanConnectAsync()` returns `true` with the configured connection string (uses TestContainers PostgreSQL or a local test database)
  - [ ] Test: `AppDbContext.Database.GetAppliedMigrationsAsync()` returns at least `"InitialCreate"` after applying migrations

## Dev Notes

### Architecture Context

This story is **backend-only** — no frontend changes. It establishes the data layer foundation on top of the .NET 10 solution structure created in Story 1.1.

**Critical scope constraint (from Epic 1):** This story creates an **empty initial migration** only. No domain entity tables (`clientes`, `contactos`) are defined here. Those are created in Epic 2 Story 2.1 and Epic 3 Story 3.1 respectively. Do NOT define `ClienteEntity` or `ContactoEntity` in this story.

**Backend project layout (from `architecture.md`):**

```
backend/
  src/
    SiesaAgents.API/
      Program.cs                          # ← MODIFY: register DbContext + middleware
      Middleware/
        ExceptionHandlingMiddleware.cs    # ← CREATE
      appsettings.Development.json        # ← MODIFY: add connection string
    SiesaAgents.Infrastructure/
      Data/
        AppDbContext.cs                   # ← CREATE
      Migrations/                         # ← GENERATED by dotnet-ef
  tests/
    SiesaAgents.UnitTests/
      API/Middleware/
        ExceptionHandlingMiddlewareTests.cs   # ← CREATE
    SiesaAgents.IntegrationTests/
      Infrastructure/
        DatabaseConnectivityTests.cs          # ← CREATE
```

### EF Core Configuration Details

**AppDbContext pattern** (mandatory per company standards):

```csharp
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        modelBuilder.ApplySnakeCaseNaming(); // ALWAYS last
    }
}
```

- `ApplySnakeCaseNaming()` is provided by `EFCore.NamingConventions` package — add it if not already installed: `dotnet add src/SiesaAgents.Infrastructure package EFCore.NamingConventions`
- `ApplyConfigurationsFromAssembly` auto-loads all `IEntityTypeConfiguration<T>` classes in the Infrastructure assembly (none exist yet in this story — future stories add them)

**Primary key rule (mandatory):** All entities use `Guid` (UUID) PKs:
```csharp
public abstract class Entity
{
    public Guid Id { get; protected set; } = Guid.NewGuid();
}
```
No entities are defined in this story, but the `Entity` base class should be created in `SiesaAgents.Domain` for future stories to inherit from.

**DateTime rule:** Always `DateTimeOffset`, never `DateTime`. Applies to any audit columns defined in future migrations.

### Exception Middleware Pattern

**Problem Details RFC 7807 response shape:**

```json
{
  "status": 404,
  "title": "Resource Not Found",
  "detail": "The requested resource was not found.",
  "type": "https://tools.ietf.org/html/rfc7807"
}
```

**Middleware implementation skeleton:**

```csharp
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (status, title, detail) = exception switch
        {
            KeyNotFoundException => (404, "Resource Not Found", exception.Message),
            ArgumentException    => (400, "Bad Request", exception.Message),
            // Add ConflictException → 409 when defined
            _                    => (500, "Internal Server Error", "An unexpected error occurred.")
        };

        context.Response.StatusCode = status;
        context.Response.ContentType = "application/problem+json";

        var problem = new ProblemDetails
        {
            Status = status,
            Title = title,
            Detail = detail,
            Type = "https://tools.ietf.org/html/rfc7807"
        };

        await context.Response.WriteAsJsonAsync(problem);
    }
}
```

### Database Connection String

Place in `appsettings.Development.json` (never committed with real credentials to source control in production):

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=siesa_agents_db;Username=postgres;Password=postgres"
  }
}
```

Retrieve in `Program.cs`:
```csharp
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
```

### PostgreSQL Naming Conventions

Per company standards (enforced via `ApplySnakeCaseNaming()`):

| Element | Convention | Example |
|---------|-----------|---------|
| Tables | snake_case plural | `clientes`, `order_items` |
| Columns | snake_case | `created_at`, `cliente_id` |
| PK column | `id` (UUID) | `id UUID PRIMARY KEY` |
| FK columns | `{entity}_id` | `cliente_id` |
| Indexes | `ix_{table}_{columns}` | `ix_contactos_cliente_id` |
| Unique indexes | `uk_{table}_{columns}` | `uk_clientes_nit` |

### Testing Standards

**Backend testing framework:** xUnit + EF Core InMemory (unit tests) + Testcontainers PostgreSQL (integration tests)

**Test structure:** Arrange / Act / Assert

**Coverage target:** > 80% for all new files

**xUnit pattern for middleware tests:**

```csharp
public class ExceptionHandlingMiddlewareTests
{
    [Fact]
    public async Task InvokeAsync_WhenKeyNotFoundExceptionThrown_Returns404WithProblemDetails()
    {
        // Arrange
        var logger = NullLogger<ExceptionHandlingMiddleware>.Instance;
        var middleware = new ExceptionHandlingMiddleware(logger);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        RequestDelegate next = _ => throw new KeyNotFoundException("Not found");

        // Act
        await middleware.InvokeAsync(context, next);

        // Assert
        Assert.Equal(404, context.Response.StatusCode);
        // Deserialize body and check ProblemDetails fields
    }
}
```

### NuGet Packages Required

| Package | Project | Purpose |
|---------|---------|---------|
| `Npgsql.EntityFrameworkCore.PostgreSQL` | Infrastructure | PostgreSQL EF Core provider |
| `EFCore.NamingConventions` | Infrastructure | `ApplySnakeCaseNaming()` extension |
| `Microsoft.EntityFrameworkCore.Design` | Infrastructure | dotnet-ef migration tooling |
| `Microsoft.EntityFrameworkCore.Tools` | Infrastructure | (CLI tools, may be in API project) |

Verify these are present in `SiesaAgents.Infrastructure.csproj`; add any missing with `dotnet add package`.

### CLI Commands Reference

```bash
# From backend/ directory

# Add migration (empty — no entities yet)
dotnet ef migrations add InitialCreate \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API

# Apply migration
dotnet ef database update \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API

# Verify database was created (psql)
psql -U postgres -c "\l" | grep siesa_agents_db
```

### Story 1.2 Learnings (from previous story Dev Agent Record)

- **Package manager**: Backend uses `dotnet` CLI — not pnpm. Frontend uses pnpm (not relevant here).
- **React 19 / Vite 8**: Frontend detail, not applicable to this story.
- **Playwright Chromium workaround**: Frontend only — not applicable.
- **TypeScript strict mode**: Frontend only — C# has its own nullable reference types (`<Nullable>enable</Nullable>` in `.csproj`).
- **siesa-ui-kit**: Frontend only — this story has no UI component. `has_ui_component = FALSE`.

### Git History Context

Recent commits relevant to this story:
- `fix(review-1.2): fix mobile test viewport setup in app-shell tests` — Story 1.2 is complete/review
- `fix(story-1.2): replace CSS Tailwind responsive with JS conditional rendering` — frontend pattern, not applicable
- Backend infrastructure project exists but EF Core Data layer and middleware have not yet been created

### Project Structure Notes

Files aligned with `architecture.md` directory structure:

```
backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs        ← CREATE (new)
backend/src/SiesaAgents.Infrastructure/Migrations/                 ← GENERATED by dotnet-ef
backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs ← CREATE (new)
backend/src/SiesaAgents.API/Program.cs                            ← MODIFY (add DbContext + middleware)
backend/src/SiesaAgents.API/appsettings.Development.json          ← MODIFY (connection string)
backend/src/SiesaAgents.Domain/Common/Entity.cs                   ← CREATE (base class for future entities)
backend/tests/SiesaAgents.UnitTests/API/Middleware/ExceptionHandlingMiddlewareTests.cs ← CREATE
backend/tests/SiesaAgents.IntegrationTests/Infrastructure/DatabaseConnectivityTests.cs ← CREATE
```

No frontend files are touched in this story.

### References

- EF Core snake_case convention: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#EF Core: Automatic snake_case]
- Database conventions: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions (PostgreSQL)]
- Backend folder structure: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Folder Structure]
- Backend critical rules (UUID PKs, DateTimeOffset): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- Error format Problem Details RFC 7807: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- AppDbContext pattern: [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]
- ExceptionHandlingMiddleware: [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- Story AC source: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3]
- NFR6 no stack traces: [Source: _bmad-output/planning-artifacts/architecture.md#Requirements Overview]
- Scalar registration rule: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#API Documentation]
- Testing standards: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Testing Standards]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

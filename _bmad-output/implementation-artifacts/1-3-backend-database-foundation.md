# Story 1.3: Backend Database Foundation

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

## Acceptance Criteria

1. **Given** PostgreSQL is running locally, **When** the developer runs `dotnet ef database update`, **Then** the `siesa_agents_db` database is created with no errors, and the EF Core migrations folder exists under `SiesaAgents.Infrastructure/Migrations/`.

2. **Given** an unhandled exception occurs in the backend, **When** the error reaches the middleware, **Then** the response returns Problem Details RFC 7807 format (`status`, `title`, `detail`) with no stack traces exposed to the client (NFR6).

3. **Given** the backend receives any request, **When** EF Core processes the model, **Then** `ApplySnakeCaseNaming()` is called last in `OnModelCreating` and all generated column/table names follow snake_case convention automatically — no manual `[Column]` or `[Table]` attributes are used on entities.

4. **Given** the backend is running, **When** the developer hits `/scalar`, **Then** the Scalar API documentation page loads correctly (Swagger is never registered).

5. **Given** the `AppDbContext` is built, **When** inspecting the connection string, **Then** it reads from `appsettings.Development.json` under key `ConnectionStrings:DefaultConnection` pointing to `siesa_agents_db`.

## Tasks / Subtasks

- [ ] Task 1 — Add EF Core + Npgsql packages and configure `AppDbContext` (AC: #1, #3, #5)
  - [ ] Add NuGet package to Infrastructure: `dotnet add src/SiesaAgents.Infrastructure package Npgsql.EntityFrameworkCore.PostgreSQL` (already present from Story 1.1 — verify and skip if already added)
  - [ ] Add EF Core Design tools: `dotnet add src/SiesaAgents.API package Microsoft.EntityFrameworkCore.Design`
  - [ ] Create `src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` extending `DbContext`
    - Constructor: `AppDbContext(DbContextOptions<AppDbContext> options) : base(options)`
    - Override `OnModelCreating(ModelBuilder modelBuilder)`: call `modelBuilder.ApplySnakeCaseNaming()` as the LAST statement
    - No `DbSet<>` properties yet — this is an empty context for the initial migration
  - [ ] Register `AppDbContext` in `Program.cs` using `builder.Services.AddDbContext<AppDbContext>` with `UseNpgsql(connectionString)`
  - [ ] Add `ConnectionStrings:DefaultConnection` to `appsettings.Development.json`:
    ```json
    "ConnectionStrings": {
      "DefaultConnection": "Host=localhost;Port=5432;Database=siesa_agents_db;Username=postgres;Password=postgres"
    }
    ```
  - [ ] Add Infrastructure project reference to API if not already present: `dotnet add src/SiesaAgents.API reference src/SiesaAgents.Infrastructure`

- [ ] Task 2 — Create initial empty migration and verify database creation (AC: #1)
  - [ ] Run migration: `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
  - [ ] Verify `src/SiesaAgents.Infrastructure/Migrations/` folder is created with `InitialCreate` migration files
  - [ ] Run `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` and confirm `siesa_agents_db` is created with no errors
  - [ ] Confirm the `__EFMigrationsHistory` table exists in `siesa_agents_db` after update

- [ ] Task 3 — Implement `ExceptionHandlingMiddleware` for Problem Details RFC 7807 (AC: #2)
  - [ ] Create `src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`
    - Implement `IMiddleware` interface
    - Catch all unhandled exceptions
    - Map domain exceptions (e.g., `KeyNotFoundException`) → HTTP 404; business rule violations → HTTP 400/409; all others → HTTP 500
    - Always return `application/problem+json` with `status`, `title`, `detail` fields — NO stack trace in response body
  - [ ] Register middleware in `Program.cs`: `app.UseMiddleware<ExceptionHandlingMiddleware>()` before all endpoint mappings
  - [ ] Register middleware in DI: `builder.Services.AddTransient<ExceptionHandlingMiddleware>()`

- [ ] Task 4 — Write xUnit tests (AC: #2, #3)
  - [ ] Create `tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`
    - Test: `OnModelCreating` does not throw and `ApplySnakeCaseNaming` is applied (use EF InMemory or SQLite provider for unit scope)
  - [ ] Create `tests/SiesaAgents.UnitTests/API/Middleware/ExceptionHandlingMiddlewareTests.cs`
    - Test: Unhandled `Exception` returns `application/problem+json` with status 500
    - Test: `KeyNotFoundException` returns status 404 with no stack trace in body
    - Test: Response body does NOT contain stack trace strings (`at `, `Exception`)
    - Test: `Content-Type` header is `application/problem+json`
  - [ ] All tests follow Arrange / Act / Assert structure

## Dev Notes

### No UI Component — Backend-Only Story

This story has no frontend changes. `has_ui_component = FALSE`. No siesa-ui-kit, no React, no TanStack Router changes. All work is confined to the .NET backend.

### Architecture Patterns

**Clean Architecture layer responsibilities for this story:**

| Layer | File(s) | Responsibility |
|---|---|---|
| Infrastructure | `Data/AppDbContext.cs` | DbContext — owns EF Core model configuration and snake_case naming |
| Infrastructure | `Migrations/` | Auto-generated by `dotnet ef migrations add` |
| API | `Program.cs` | DI registration of `AppDbContext`, middleware pipeline |
| API | `Middleware/ExceptionHandlingMiddleware.cs` | Global error → Problem Details RFC 7807 |

**Dependency direction:** `API` → `Infrastructure` → `Domain` (Domain has zero dependencies)

### EF Core Configuration — Critical Rules

```csharp
// src/SiesaAgents.Infrastructure/Data/AppDbContext.cs
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        // Apply IEntityTypeConfiguration<T> files here in future stories:
        // modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // MUST be called LAST — converts all PascalCase names to snake_case automatically
        modelBuilder.ApplySnakeCaseNaming();
    }
}
```

**Critical rules (company standards):**
- `ApplySnakeCaseNaming()` MUST be the last call in `OnModelCreating`
- NO `[Column]`, `[Table]`, or `[Key]` attributes on entities — EF auto-maps via snake_case convention
- All entity PKs use `Guid` (UUID) — mandatory per company standards
- All timestamps use `DateTimeOffset` — NEVER `DateTime`

### Program.cs Registration Pattern

```csharp
// In Program.cs — register before builder.Build()
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddTransient<ExceptionHandlingMiddleware>();

// After builder.Build() — register middleware BEFORE endpoint mappings
app.UseMiddleware<ExceptionHandlingMiddleware>();
// ... existing: app.MapScalarApiReference(), app.MapGet(...)
```

### ExceptionHandlingMiddleware Pattern

```csharp
// src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs
public class ExceptionHandlingMiddleware : IMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, title) = exception switch
        {
            KeyNotFoundException => (StatusCodes.Status404NotFound, "Resource not found"),
            ArgumentException => (StatusCodes.Status400BadRequest, "Bad request"),
            InvalidOperationException => (StatusCodes.Status409Conflict, "Conflict"),
            _ => (StatusCodes.Status500InternalServerError, "An unexpected error occurred")
        };

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/problem+json";

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = exception.Message   // Message only — never StackTrace
        };

        await context.Response.WriteAsJsonAsync(problemDetails);
    }
}
```

**Critical:** `Detail` uses `exception.Message` only. `exception.StackTrace` is NEVER included in the response.

### Connection String Configuration

```json
// backend/src/SiesaAgents.API/appsettings.Development.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=siesa_agents_db;Username=postgres;Password=postgres"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

Adjust `Username` and `Password` to match the local PostgreSQL installation.

### Migration Commands (EF Core Tools)

```bash
# Install EF Core CLI tools if not present
dotnet tool install --global dotnet-ef

# Create initial migration (empty — no entities yet)
dotnet ef migrations add InitialCreate \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API

# Apply migration (creates siesa_agents_db database)
dotnet ef database update \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API
```

**Scope note:** This story creates an EMPTY initial migration. No `clientes` or `contactos` tables are created here. `ClienteEntity` is added in Epic 2 Story 2.1. `ContactoEntity` is added in Epic 3 Story 3.1. DO NOT define domain entities in this story.

### Story 1.1 & 1.2 Context — What Already Exists

From Story 1.1 (done), the following backend files exist and must NOT be recreated:
- `src/SiesaAgents.API/Program.cs` — already has CORS, Scalar, and basic structure
- `src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj` — already has `Npgsql.EntityFrameworkCore.PostgreSQL` package
- `src/SiesaAgents.API/SiesaAgents.API.csproj` — already references Infrastructure project
- `tests/SiesaAgents.UnitTests/` — exists with xUnit setup

From Story 1.2 (done), no backend changes were made. Frontend-only story.

**Verify before adding packages:**
```bash
dotnet list src/SiesaAgents.Infrastructure package | grep Npgsql
dotnet list src/SiesaAgents.API reference
```

### Testing Requirements

- **Framework**: xUnit (backend standard)
- **Unit testing DbContext**: Use `Microsoft.EntityFrameworkCore.InMemory` provider or SQLite in-memory to verify `OnModelCreating` runs without throwing
- **Unit testing middleware**: Create a mock `HttpContext` and `RequestDelegate` that throws; assert response status and content type
- **Test structure**: Arrange / Act / Assert
- **Coverage target**: > 80% for new files in this story
- **Integration tests**: `SiesaAgents.IntegrationTests` project is future scope — not required in this story

### NuGet Packages Required

| Package | Target Project | Already Present? |
|---|---|---|
| `Npgsql.EntityFrameworkCore.PostgreSQL` | `SiesaAgents.Infrastructure` | Yes (Story 1.1) |
| `Microsoft.EntityFrameworkCore.Design` | `SiesaAgents.API` | No — ADD NOW |
| `Microsoft.EntityFrameworkCore.InMemory` | `SiesaAgents.UnitTests` | No — ADD for tests |

```bash
dotnet add src/SiesaAgents.API package Microsoft.EntityFrameworkCore.Design
dotnet add tests/SiesaAgents.UnitTests package Microsoft.EntityFrameworkCore.InMemory
```

### Database Naming Conventions (Company Standards)

| Element | Convention | Example |
|---|---|---|
| Database name | snake_case | `siesa_agents_db` |
| Tables | snake_case plural | `clientes`, `contactos` (future stories) |
| Columns | snake_case | `created_at`, `cliente_id` |
| PK column | `id` (UUID) | auto-generated via `Guid.NewGuid()` |
| EF Core migration history table | auto-managed | `__EFMigrationsHistory` |

`ApplySnakeCaseNaming()` handles all name conversions automatically from PascalCase C# properties. No manual overrides needed.

### Anti-Patterns to Avoid

```
❌ DateTime in any entity or DbContext       → Use DateTimeOffset
❌ [Column("column_name")] attributes        → ApplySnakeCaseNaming() handles this
❌ [Table("table_name")] attributes          → EF Core snake_case convention handles this
❌ app.UseSwagger()                          → Scalar only (already set in Story 1.1)
❌ Exception.StackTrace in response body     → Problem Details with Message only
❌ Hardcoded connection string in code       → Always from Configuration/appsettings
❌ Defining ClienteEntity or ContactoEntity  → Scope of Epic 2 and Epic 3 stories
❌ DbSet<> properties in AppDbContext now    → Empty context for this story only
```

### Project Structure Notes

Files to **create** in this story:
```
backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs
backend/src/SiesaAgents.Infrastructure/Migrations/         ← auto-generated by dotnet ef
backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs
backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs
backend/tests/SiesaAgents.UnitTests/API/Middleware/ExceptionHandlingMiddlewareTests.cs
```

Files to **modify** in this story:
```
backend/src/SiesaAgents.API/Program.cs           ← Add DbContext DI + middleware registration
backend/src/SiesaAgents.API/appsettings.Development.json  ← Add ConnectionStrings section
backend/src/SiesaAgents.API/SiesaAgents.API.csproj        ← Add Microsoft.EntityFrameworkCore.Design
backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj  ← Add InMemory package
```

No frontend files are touched in this story.

### Requirements Covered

| Requirement | Coverage |
|---|---|
| Epic AC-E1 (backend functional) | `AppDbContext` + migrations + `ExceptionHandlingMiddleware` complete the backend foundation |
| NFR6 — No stack traces exposed | `ExceptionHandlingMiddleware` → Problem Details with `Message` only |
| Architecture: snake_case DB naming | `ApplySnakeCaseNaming()` in `OnModelCreating` |
| Architecture: UUID PKs ready | `AppDbContext` configured; entities in future stories will use `Guid Id` |
| Architecture: DateTimeOffset ready | Enforced as anti-pattern rule; no entities created yet |

### References

- EF Core + PostgreSQL setup: [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- Problem Details middleware pattern: [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- snake_case database naming: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions (PostgreSQL)]
- `ApplySnakeCaseNaming()` mandate: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#EF Core: Automatic snake_case]
- Backend project structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Existing packages from Story 1.1: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#Tasks]
- Scope constraint (no entity definitions): [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

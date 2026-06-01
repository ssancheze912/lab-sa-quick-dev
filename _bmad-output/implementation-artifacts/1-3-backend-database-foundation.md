# Story 1.3: Backend Database Foundation

Status: draft

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

## Acceptance Criteria

1. **Given** PostgreSQL is running locally, **When** the developer runs `dotnet ef database update` from `backend/`, **Then** the `siesa_agents_db` database is created with no errors, and the EF Core migrations folder exists at `backend/src/SiesaAgents.Infrastructure/Migrations/`.

2. **Given** an unhandled exception occurs in the backend, **When** the error reaches the middleware, **Then** the response returns Problem Details RFC 7807 format (`status`, `title`, `detail`) with no stack traces exposed in the response body (NFR6).

3. **Given** the backend receives any request, **When** the `AppDbContext` is used to access the database, **Then** `ApplySnakeCaseNaming()` is applied in `OnModelCreating` as the last call, and all future column names will follow `snake_case` convention automatically.

4. **Given** the EF Core infrastructure is configured, **When** `dotnet build SiesaAgents.sln` is executed, **Then** all projects compile successfully with zero errors and zero warnings.

5. **Given** the backend is running, **When** a request is made to any endpoint, **Then** `AppDbContext` is registered in DI via `builder.Services.AddDbContext<AppDbContext>()` reading `ConnectionStrings:DefaultConnection` from `appsettings.Development.json`.

6. **Given** the initial migration is created, **When** the developer inspects the migration file, **Then** it is an empty migration (no table creation SQL) — domain tables (`clientes`, `contactos`) are NOT created in this story.

## Tasks / Subtasks

- [ ] Task 1 — Add EF Core + Npgsql packages (AC: #4, #5)
  - [ ] Verify `Npgsql.EntityFrameworkCore.PostgreSQL` is already added to `SiesaAgents.Infrastructure` (done in Story 1.1); if not: `dotnet add src/SiesaAgents.Infrastructure package Npgsql.EntityFrameworkCore.PostgreSQL`
  - [ ] Add `Microsoft.EntityFrameworkCore.Design` to `SiesaAgents.API`: `dotnet add src/SiesaAgents.API package Microsoft.EntityFrameworkCore.Design` (required for `dotnet ef` tooling)
  - [ ] Add `Microsoft.EntityFrameworkCore.Tools` to `SiesaAgents.API`: `dotnet add src/SiesaAgents.API package Microsoft.EntityFrameworkCore.Tools`
  - [ ] Add `EFCore.NamingConventions` to `SiesaAgents.Infrastructure`: `dotnet add src/SiesaAgents.Infrastructure package EFCore.NamingConventions` (provides `UseSnakeCaseNamingConvention()`)

- [ ] Task 2 — Create `AppDbContext` (AC: #3, #4, #6)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`
  - [ ] Inherit from `DbContext`; inject `DbContextOptions<AppDbContext>` via constructor
  - [ ] Override `OnModelCreating(ModelBuilder modelBuilder)` calling `modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly())` first, then `modelBuilder.UseSnakeCaseNamingConvention()` as the last call
  - [ ] No `DbSet<>` properties in this story — they will be added in Epic 2 and Epic 3

- [ ] Task 3 — Register `AppDbContext` in DI (AC: #5)
  - [ ] In `backend/src/SiesaAgents.API/Program.cs`, add:
    ```csharp
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
    ```
  - [ ] Add `using SiesaAgents.Infrastructure.Data;` and `using Microsoft.EntityFrameworkCore;` in `Program.cs`
  - [ ] Ensure `appsettings.Development.json` already contains `ConnectionStrings:DefaultConnection` (set in Story 1.1): `"Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres"`

- [ ] Task 4 — Verify `ExceptionHandlingMiddleware` (AC: #2)
  - [ ] Confirm `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` exists (created in Story 1.1) and is registered in `Program.cs` as `app.UseMiddleware<ExceptionHandlingMiddleware>()` before routing
  - [ ] Confirm the middleware returns `ProblemDetails` with `Status = 500`, `Title = "An unexpected error occurred."`, and `Detail = null` — no `ex.Message` or stack trace exposure
  - [ ] If missing or incomplete, implement the full middleware following the pattern documented in Story 1.1 Dev Notes

- [ ] Task 5 — Create initial empty migration (AC: #1, #6)
  - [ ] Install EF Core CLI tools if not present: `dotnet tool install --global dotnet-ef`
  - [ ] Create migration from the solution root: `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
  - [ ] Verify the generated migration file under `backend/src/SiesaAgents.Infrastructure/Migrations/` contains only the empty `Up()` and `Down()` methods (no table DDL)
  - [ ] Verify `AppDbContextModelSnapshot.cs` is also generated

- [ ] Task 6 — Apply migration to create database (AC: #1)
  - [ ] Run: `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
  - [ ] Confirm `siesa_agents_db` database is created in local PostgreSQL instance with no errors
  - [ ] Confirm EF Core `__EFMigrationsHistory` table is created in the database

- [ ] Task 7 — Add `SiesaAgents.Infrastructure` project reference to `SiesaAgents.API` (AC: #4, #5)
  - [ ] Verify project reference exists: `SiesaAgents.API` → `SiesaAgents.Infrastructure` (should be set in Story 1.1)
  - [ ] If missing: `dotnet add src/SiesaAgents.API/SiesaAgents.API.csproj reference src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj`

- [ ] Task 8 — Write unit and integration tests (AC: #2, #3, #5)
  - [ ] Create `tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs` — unit test verifying `UseSnakeCaseNamingConvention()` is applied: use EF Core InMemory provider to build the model and assert a known property maps to snake_case column name
  - [ ] Create `tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs` — unit test verifying: given an exception thrown by `next()`, the response status is 500, Content-Type is `application/problem+json`, and body contains `status: 500` and `title` fields without stack trace
  - [ ] All tests must follow Arrange / Act / Assert structure

## Dev Notes

### Package Dependencies

| Package | Project | Purpose |
|---------|---------|---------|
| `Npgsql.EntityFrameworkCore.PostgreSQL` | Infrastructure | PostgreSQL EF Core provider |
| `EFCore.NamingConventions` | Infrastructure | `UseSnakeCaseNamingConvention()` extension |
| `Microsoft.EntityFrameworkCore.Design` | API | EF Core tooling (`dotnet ef` commands) |
| `Microsoft.EntityFrameworkCore.Tools` | API | EF Core migration tooling |

### `AppDbContext` Pattern

```csharp
// backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs
using Microsoft.EntityFrameworkCore;
using System.Reflection;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // DbSet properties will be added in Epic 2 (ClienteEntity) and Epic 3 (ContactoEntity)
    // DO NOT add ClienteEntity or ContactoEntity here

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        modelBuilder.UseSnakeCaseNamingConvention(); // MUST be last call
    }
}
```

### DI Registration in `Program.cs`

```csharp
// Add after existing service registrations
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
```

The complete `Program.cs` ordering after this story:

```csharp
var builder = WebApplication.CreateBuilder(args);

// Services
builder.Services.AddOpenApi();
builder.Services.AddCors(options =>
    options.AddPolicy("DevCors", policy =>
        policy.WithOrigins(builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? ["http://localhost:5173"])
              .AllowAnyHeader()
              .AllowAnyMethod()));
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// Middleware — order matters
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("DevCors");
app.MapScalarApiReference();
app.MapOpenApi();

app.Run();
```

### EF Core Migration Commands

All commands run from `backend/` directory:

```bash
# Create migration
dotnet ef migrations add InitialCreate \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API

# Apply migration
dotnet ef database update \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API
```

### `appsettings.Development.json` Connection String

Already set in Story 1.1. Confirm it contains:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres"
  },
  "AllowedOrigins": ["http://localhost:5173"]
}
```

### snake_case Naming Convention

`EFCore.NamingConventions` package provides `UseSnakeCaseNamingConvention()`. This call in `OnModelCreating` ensures all entity properties (e.g., `CreatedAt`) map automatically to snake_case columns (e.g., `created_at`) without any `[Column]` attributes.

Per company standards: **NEVER use manual `[Column]` or `[Table]` attributes** — rely on `ApplySnakeCaseNaming()` (i.e., `UseSnakeCaseNamingConvention()`) exclusively.

### ExceptionHandlingMiddleware (from Story 1.1)

The middleware already created in Story 1.1 is the final implementation. No changes needed if correctly implemented:

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
            context.Response.StatusCode = 500;
            await context.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Status = 500,
                Title = "An unexpected error occurred.",
                Detail = null   // NEVER expose ex.Message or stack traces
            });
        }
    }
}
```

### Scope Constraints

**DO NOT create in this story:**
- `ClienteEntity.cs` — belongs to Epic 2, Story 2.1
- `ContactoEntity.cs` — belongs to Epic 3, Story 3.1
- `ClienteConfiguration.cs` / `ContactoConfiguration.cs` — belongs to Epic 2 / Epic 3
- `ClienteRepository.cs` / `ContactoRepository.cs` — belongs to Epic 2 / Epic 3
- Any `DbSet<>` on `AppDbContext` — belongs to Epic 2 / Epic 3

The migration created in this story MUST be empty (no table DDL). This is a foundation story establishing only the DB connection and EF Core infrastructure.

### Testing Standards

- **Framework**: xUnit + EF Core InMemory (unit tests)
- **Structure**: Arrange / Act / Assert
- **Middleware test**: Use `DefaultHttpContext` + `ResponseBodyFactory` to capture response body
- **DbContext test**: Use `UseInMemoryDatabase` options to verify naming convention is applied at model build time

```csharp
// Example: verify snake_case naming is applied
var options = new DbContextOptionsBuilder<AppDbContext>()
    .UseInMemoryDatabase("test")
    .UseSnakeCaseNamingConvention()  // replicated for test
    .Options;
using var ctx = new AppDbContext(options);
// Assert entity type column names follow snake_case after Epic 2 adds DbSet
```

### Project Structure Notes

**Files to create:**
```
backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs
backend/src/SiesaAgents.Infrastructure/Migrations/           ← folder (auto-generated by dotnet ef)
tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs
tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs
```

**Files to modify:**
```
backend/src/SiesaAgents.API/Program.cs                      ← add DbContext DI registration
backend/src/SiesaAgents.API/SiesaAgents.API.csproj          ← add EF Design/Tools packages
backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj  ← add EFCore.NamingConventions
```

**Files to verify (no modification expected):**
```
backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs  ← from Story 1.1
backend/src/SiesaAgents.API/appsettings.Development.json              ← from Story 1.1
```

**No frontend changes** in this story.

### Database Conventions Reminder

Per company standards:
- Tables: `snake_case` plural (e.g., `clientes`, `contactos`)
- Columns: `snake_case` (e.g., `created_at`, `cliente_id`)
- PK column: `id` (UUID)
- All handled automatically by `UseSnakeCaseNamingConvention()` — no manual attributes

### References

- EF Core DbContext pattern: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure → SiesaAgents.Infrastructure/Data/AppDbContext.cs]
- snake_case naming requirement: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions]
- ExceptionHandlingMiddleware pattern: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#ExceptionHandlingMiddleware pattern]
- Problem Details RFC 7807 (NFR6): [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md#NFR6]
- Connection string location: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#Dev Notes → Configure appsettings.Development.json]
- Scope note (no domain entities here): [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3 scope note]
- EF Core infrastructure pattern: [Source: _bmad-output/planning-artifacts/architecture.md#Backend project organization]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

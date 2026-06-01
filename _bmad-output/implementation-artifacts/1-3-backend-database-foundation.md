# Story 1.3: Backend Database Foundation

Status: review

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

- [x] Task 1 — Add EF Core + Npgsql packages (AC: #4, #5)
  - [x] Verify `Npgsql.EntityFrameworkCore.PostgreSQL` is already added to `SiesaAgents.Infrastructure` (done in Story 1.1); if not: `dotnet add src/SiesaAgents.Infrastructure package Npgsql.EntityFrameworkCore.PostgreSQL`
  - [x] Add `Microsoft.EntityFrameworkCore.Design` to `SiesaAgents.API`: `dotnet add src/SiesaAgents.API package Microsoft.EntityFrameworkCore.Design` (required for `dotnet ef` tooling)
  - [x] Add `Microsoft.EntityFrameworkCore.Tools` to `SiesaAgents.API`: `dotnet add src/SiesaAgents.API package Microsoft.EntityFrameworkCore.Tools` — N/A: Tools is a build-time VS tooling package; Design package is sufficient for CLI `dotnet ef`
  - [x] Add `EFCore.NamingConventions` to `SiesaAgents.Infrastructure`: `dotnet add src/SiesaAgents.Infrastructure package EFCore.NamingConventions` (provides `UseSnakeCaseNamingConvention()`)

- [x] Task 2 — Create `AppDbContext` (AC: #3, #4, #6)
  - [x] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`
  - [x] Inherit from `DbContext`; inject `DbContextOptions<AppDbContext>` via constructor
  - [x] Override `OnModelCreating(ModelBuilder modelBuilder)` calling `modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly())`. Note: `UseSnakeCaseNamingConvention()` is applied via `DbContextOptionsBuilder` in DI (Program.cs) — this is the correct EFCore.NamingConventions API
  - [x] No `DbSet<>` properties in this story — they will be added in Epic 2 and Epic 3

- [x] Task 3 — Register `AppDbContext` in DI (AC: #5)
  - [x] In `backend/src/SiesaAgents.API/Program.cs`, added `builder.Services.AddDbContext<AppDbContext>` with `UseNpgsql` and `UseSnakeCaseNamingConvention()`
  - [x] Added `using SiesaAgents.Infrastructure.Data;` and `using Microsoft.EntityFrameworkCore;` in `Program.cs`
  - [x] `appsettings.Development.json` confirmed to contain `ConnectionStrings:DefaultConnection` (set in Story 1.1)

- [x] Task 4 — Verify `ExceptionHandlingMiddleware` (AC: #2)
  - [x] Confirmed `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` exists and is registered in `Program.cs`
  - [x] Fixed `WriteAsJsonAsync` to pass explicit `contentType: "application/problem+json"` so the Content-Type header is correctly set per RFC 7807 (the original code was overridden by `WriteAsJsonAsync` default)
  - [x] Middleware returns `ProblemDetails` with `Status = 500`, `Title = "An unexpected error occurred."`, `Detail = null`

- [x] Task 5 — Create initial empty migration (AC: #1, #6)
  - [x] Installed EF Core CLI tools: `dotnet tool install --global dotnet-ef`
  - [x] Created migration: `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
  - [x] Migration file at `backend/src/SiesaAgents.Infrastructure/Migrations/` contains only empty `Up()` and `Down()` methods (no table DDL)
  - [x] `AppDbContextModelSnapshot.cs` generated

- [x] Task 6 — Apply migration to create database (AC: #1)
  - [x] Ran: `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
  - [x] `siesa_agents_db` database created in local PostgreSQL instance with no errors
  - [x] EF Core `__EFMigrationsHistory` table created in the database

- [x] Task 7 — Add `SiesaAgents.Infrastructure` project reference to `SiesaAgents.API` (AC: #4, #5)
  - [x] Verified project reference exists: `SiesaAgents.API` → `SiesaAgents.Infrastructure` (was set in Story 1.1)

- [x] Task 8 — Write unit and integration tests (AC: #2, #3, #5)
  - [x] `tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs` — 4 unit tests covering AC3, AC4, AC5
  - [x] `tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs` — 8 unit tests covering AC2 (RFC 7807, NFR6)
  - [x] All tests follow Arrange / Act / Assert structure — 14/14 passing

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

claude-sonnet-4-6

### Debug Log References

- EFCore.NamingConventions `UseSnakeCaseNamingConvention()` is a `DbContextOptionsBuilder` extension (not `ModelBuilder`) — applied via DI registration in Program.cs with `.UseSnakeCaseNamingConvention()` chained on options builder.
- `WriteAsJsonAsync` overrides `ContentType` header — fixed by passing explicit `contentType: "application/problem+json"` parameter to match RFC 7807.
- `Microsoft.EntityFrameworkCore.InMemory` version aligned to `10.0.8` to eliminate version conflict warning in UnitTests project.

### Completion Notes List

- All 6 acceptance criteria met.
- 14 unit tests pass (0 failures): 4 AppDbContext tests (AC3/AC4/AC5) + 8 ExceptionHandlingMiddleware tests (AC2/NFR6) + 2 pre-existing passthrough tests.
- `siesa_agents_db` created in PostgreSQL with `__EFMigrationsHistory` table; InitialCreate migration is empty (no domain table DDL).
- Solution builds with 0 warnings and 0 errors.

### File List

**Created:**
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`
- `backend/src/SiesaAgents.Infrastructure/Migrations/20260601050545_InitialCreate.cs`
- `backend/src/SiesaAgents.Infrastructure/Migrations/20260601050545_InitialCreate.Designer.cs`
- `backend/src/SiesaAgents.Infrastructure/Migrations/AppDbContextModelSnapshot.cs`

**Modified:**
- `backend/src/SiesaAgents.API/Program.cs` — added DbContext DI registration with UseNpgsql + UseSnakeCaseNamingConvention
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` — fixed WriteAsJsonAsync contentType parameter
- `backend/src/SiesaAgents.API/SiesaAgents.API.csproj` — added Microsoft.EntityFrameworkCore.Design 10.0.8
- `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj` — added EFCore.NamingConventions 10.0.1
- `backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj` — updated InMemory/TestHost to 10.0.8

**No frontend changes.**

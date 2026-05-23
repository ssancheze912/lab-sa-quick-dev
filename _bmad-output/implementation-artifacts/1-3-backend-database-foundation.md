# Story 1.3: Backend Database Foundation

Status: ready

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

## Acceptance Criteria

1. **Given** PostgreSQL is running locally, **When** the developer runs `dotnet ef database update` in `backend/`, **Then** the `siesa_agents_db` database is created with no errors and the `__EFMigrationsHistory` table is present.

2. **Given** the backend is initialized, **When** the developer inspects `SiesaAgents.Infrastructure`, **Then** an `Migrations/` folder exists containing an initial empty migration (no domain tables — no `clientes` or `contactos` columns).

3. **Given** a request triggers an unhandled exception in the backend, **When** the error reaches `ExceptionHandlingMiddleware`, **Then** the response body is `application/problem+json` with fields `status`, `title`, and `detail` (null), and no stack trace or internal message is exposed — conforming to Problem Details RFC 7807 (NFR6).

4. **Given** any entity is mapped through `AppDbContext`, **When** EF Core generates the schema, **Then** `ApplySnakeCaseNaming()` is applied last in `OnModelCreating` so all table and column names follow snake_case convention automatically (no manual `[Column]`/`[Table]` attributes needed).

5. **Given** the backend solution is running, **When** the developer calls `dotnet build backend/SiesaAgents.sln`, **Then** the build succeeds with zero errors and `AppDbContext` is registered in the DI container with the `DefaultConnection` connection string from `appsettings.Development.json`.

## Tasks / Subtasks

- [ ] Task 1 — Install EF Core and PostgreSQL packages (AC: #1, #2, #4, #5)
  - [ ] Add `Microsoft.EntityFrameworkCore` to `SiesaAgents.Infrastructure.csproj`
  - [ ] Add `Npgsql.EntityFrameworkCore.PostgreSQL` to `SiesaAgents.Infrastructure.csproj` (provides `ApplySnakeCaseNaming()`)
  - [ ] Add `Microsoft.EntityFrameworkCore.Design` to `SiesaAgents.API.csproj` (required by EF CLI tools for migrations)
  - [ ] Add `Microsoft.EntityFrameworkCore.Tools` to `SiesaAgents.Infrastructure.csproj`

- [ ] Task 2 — Implement `AppDbContext` (AC: #4, #5)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` extending `DbContext`
  - [ ] Override `OnModelCreating` and call `modelBuilder.ApplySnakeCaseNaming()` as the LAST statement
  - [ ] Constructor signature: `AppDbContext(DbContextOptions<AppDbContext> options) : base(options)`
  - [ ] No `DbSet` properties for domain entities in this story — empty context is intentional

- [ ] Task 3 — Register `AppDbContext` in DI (AC: #5)
  - [ ] In `Program.cs` add `builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")))`
  - [ ] Verify `appsettings.Development.json` already has `ConnectionStrings:DefaultConnection` = `Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres` (set in Story 1.1 — no change needed)

- [ ] Task 4 — Create initial empty migration (AC: #1, #2)
  - [ ] Run `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` from `backend/`
  - [ ] Verify `Migrations/` folder is created under `SiesaAgents.Infrastructure/` with `InitialCreate` migration files
  - [ ] Confirm migration `Up()` and `Down()` methods are empty (no table DDL — no domain entities defined yet)
  - [ ] Run `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` — database `siesa_agents_db` must be created with only `__EFMigrationsHistory`

- [ ] Task 5 — Implement/harden `ExceptionHandlingMiddleware` (AC: #3)
  - [ ] Confirm `ExceptionHandlingMiddleware.cs` exists at `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` (stub created in Story 1.1)
  - [ ] Ensure the catch block sets `context.Response.ContentType = "application/problem+json"` and `StatusCode = 500`
  - [ ] Ensure `ProblemDetails.Detail` is always `null` — never assigns `ex.Message` or any internal detail
  - [ ] Ensure `ExceptionHandlingMiddleware` is registered FIRST in `Program.cs` pipeline (before `UseCors`)

- [ ] Task 6 — Write unit tests for `ExceptionHandlingMiddleware` (AC: #3)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs`
  - [ ] Test: exception thrown by next delegate → response content-type is `application/problem+json`, status 500, body deserializes to `ProblemDetails` with `status=500`, `title` non-empty, `detail` null
  - [ ] Test: no exception → middleware calls next delegate without modification (pass-through)
  - [ ] Tests use `DefaultHttpContext` from `Microsoft.AspNetCore.Http` — no external test web app required

## Dev Notes

### EF Core snake_case Naming

Per company standards, EF Core snake_case naming is applied via `ApplySnakeCaseNaming()` provided by `Npgsql.EntityFrameworkCore.PostgreSQL`. This extension method must be called LAST in `OnModelCreating` so it applies to all entities already registered.

```csharp
// backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs
using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // DbSet properties for domain entities are added in Epic 2+ stories.
    // This story intentionally leaves AppDbContext empty of domain sets.

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        // Entity configurations are applied via ApplyConfigurationsFromAssembly in future stories.
        modelBuilder.ApplySnakeCaseNaming(); // MUST be last — converts PascalCase → snake_case
    }
}
```

### DI Registration Pattern

```csharp
// backend/src/SiesaAgents.API/Program.cs — add before var app = builder.Build()
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
```

Connection string already present in `appsettings.Development.json` from Story 1.1:
```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres"
}
```

### EF Core Migrations Pattern

Migrations live in `SiesaAgents.Infrastructure/Migrations/` (per company standards). The EF CLI requires `Microsoft.EntityFrameworkCore.Design` to be in the startup project (`SiesaAgents.API`):

```bash
# Run from backend/ directory
dotnet ef migrations add InitialCreate \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API

dotnet ef database update \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API
```

The generated `InitialCreate` migration `Up()` method must be empty — no domain entities exist yet. `clientes` table is created in Epic 2 Story 2.1. `contactos` table is created in Epic 3 Story 3.1.

### ExceptionHandlingMiddleware (from Story 1.1 — harden in this story)

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
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            await context.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "An unexpected error occurred.",
                Detail = null // NEVER expose ex.Message or stack traces (NFR6)
            });
        }
    }
}
```

Registration order in `Program.cs` (middleware must be first):
```csharp
app.UseMiddleware<ExceptionHandlingMiddleware>(); // FIRST
app.UseCors("DevCors");
app.MapScalarApiReference();
// domain endpoints registered here in future stories
app.Run();
```

### Problem Details RFC 7807 Format

All error responses from this backend conform to RFC 7807:
```json
{
  "status": 500,
  "title": "An unexpected error occurred.",
  "detail": null
}
```
Content-Type header: `application/problem+json`

Future domain exceptions (404, 400, 409) will follow the same pattern via `Results.Problem()` in Minimal API endpoints (added in Epic 2+).

### Unit Test Pattern for Middleware

```csharp
// backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SiesaAgents.API.Middleware;
using Xunit;

namespace SiesaAgents.UnitTests.Middleware;

public class ExceptionHandlingMiddlewareTests
{
    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_ReturnsProblemDetailsJson()
    {
        // Arrange
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        var middleware = new ExceptionHandlingMiddleware(_ => throw new Exception("internal error"));

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal("application/problem+json", context.Response.ContentType);
        Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var problem = JsonSerializer.Deserialize<ProblemDetails>(body,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.NotNull(problem);
        Assert.Equal(500, problem.Status);
        Assert.NotEmpty(problem.Title!);
        Assert.Null(problem.Detail); // MUST be null — no internal details exposed
    }

    [Fact]
    public async Task InvokeAsync_WhenNoException_CallsNext()
    {
        // Arrange
        var context = new DefaultHttpContext();
        var nextCalled = false;
        var middleware = new ExceptionHandlingMiddleware(_ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        });

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.True(nextCalled);
    }
}
```

### Scope Boundary

This story creates ONLY the empty database infrastructure. Do NOT define:
- `ClienteEntity` — belongs to Epic 2 Story 2.1
- `ContactoEntity` — belongs to Epic 3 Story 3.1
- Any `DbSet<T>` properties — added when entities are defined
- `ClienteConfiguration.cs` / `ContactoConfiguration.cs` — added alongside their entities

### Project References

`SiesaAgents.Infrastructure` must reference `SiesaAgents.Domain` (already set in Story 1.1). No new project-to-project references are required for this story.

### References

- Backend architecture and EF Core snake_case naming: [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- `ExceptionHandlingMiddleware` stub (created in Story 1.1): [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#Task 4]
- Connection string in `appsettings.Development.json` (set in Story 1.1): [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#Task 5]
- NFR6 (no stack traces): [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md#Security]
- Database conventions (snake_case, UUID, DateTimeOffset): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions]
- Backend Clean Architecture folder structure: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Folder Structure]
- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3]

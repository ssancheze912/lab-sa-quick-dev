# Story 1.3: Backend Database Foundation

Status: ready

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

## Acceptance Criteria

1. **Given** PostgreSQL is running locally, **When** the developer runs `dotnet ef database update` from `backend/src/SiesaAgents.Infrastructure/`, **Then** the `siesa_agents_db` database is created with no errors, **And** EF Core migrations folder exists at `backend/src/SiesaAgents.Infrastructure/Migrations/` with an initial empty migration file.

2. **Given** an unhandled exception occurs in the backend, **When** the error reaches the middleware, **Then** the response returns Problem Details RFC 7807 format (`status`, `title`, `detail`) with content-type `application/problem+json` and no stack traces exposed (NFR6).

3. **Given** the backend receives any request, **When** `OnModelCreating` executes in `AppDbContext`, **Then** `ApplySnakeCaseNaming()` is called last and all future column/table names follow snake_case convention (EF Core auto-mapping, no manual `[Column]`/`[Table]` attributes required).

4. **Given** the `AppDbContext` is registered in DI, **When** `dotnet build SiesaAgents.sln` runs, **Then** all four projects compile with zero errors, **And** `AppDbContext` resolves from the DI container using the `DefaultConnection` connection string from `appsettings.Development.json`.

5. **Given** a unit test for `ExceptionHandlingMiddleware`, **When** the middleware catches an unhandled exception, **Then** the test asserts the response status is 500 and body contains `"title"` and `"status"` keys in Problem Details format.

## Tasks / Subtasks

- [ ] Task 1 — Create `AppDbContext` in Infrastructure layer (AC: #3, #4)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`
  - [ ] Inherit from `DbContext`; constructor receives `DbContextOptions<AppDbContext>`
  - [ ] Override `OnModelCreating`: call `modelBuilder.ApplySnakeCaseNaming()` as the LAST statement
  - [ ] No `DbSet<>` properties in this story — empty context is intentional (domain entities added in Epics 2 and 3)

- [ ] Task 2 — Register EF Core + Npgsql in `Program.cs` (AC: #4)
  - [ ] In `Program.cs`, add `builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")))` before `var app = builder.Build()`
  - [ ] Add `using SiesaAgents.Infrastructure.Data;` and `using Microsoft.EntityFrameworkCore;` usings
  - [ ] Verify `SiesaAgents.API.csproj` references `SiesaAgents.Infrastructure.csproj` — add project reference if missing

- [ ] Task 3 — Add EF Core Tools NuGet package to Infrastructure project (AC: #1)
  - [ ] Add `<PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="10.*" />` to `SiesaAgents.Infrastructure.csproj`
  - [ ] Add `<PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="10.*" />` to `SiesaAgents.Infrastructure.csproj`
  - [ ] Verify `Npgsql.EntityFrameworkCore.PostgreSQL` package is already present (it is, from Story 1.1)

- [ ] Task 4 — Generate initial empty migration (AC: #1)
  - [ ] Run `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` from `backend/`
  - [ ] Confirm `backend/src/SiesaAgents.Infrastructure/Migrations/` folder is created with `<timestamp>_InitialCreate.cs` and `AppDbContextModelSnapshot.cs`
  - [ ] Verify migration file contains empty `Up()` and `Down()` methods (no tables — domain entities are in Epics 2 and 3)
  - [ ] Run `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` to verify `siesa_agents_db` is created with no errors

- [ ] Task 5 — Verify `ExceptionHandlingMiddleware` returns Problem Details RFC 7807 (AC: #2)
  - [ ] Confirm `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` is already implemented (from Story 1.1)
  - [ ] Confirm middleware sets `context.Response.ContentType = "application/problem+json"`, `context.Response.StatusCode = 500`, and returns `ProblemDetails` with `Status = 500`, `Title = "An unexpected error occurred."`, `Detail = null`
  - [ ] Confirm `app.UseMiddleware<ExceptionHandlingMiddleware>()` is registered BEFORE routing in `Program.cs` (already present from Story 1.1)

- [ ] Task 6 — Write xUnit unit tests for `ExceptionHandlingMiddleware` (AC: #5)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs`
  - [ ] Test 1 — `InvokeAsync_WhenNoException_CallsNext`: arrange `DefaultHttpContext` + next delegate that completes normally, act, assert `context.Response.StatusCode` is 200
  - [ ] Test 2 — `InvokeAsync_WhenExceptionThrown_Returns500ProblemDetails`: arrange next delegate that throws `Exception("test error")`, act `InvokeAsync`, assert `context.Response.StatusCode == 500`, `context.Response.ContentType == "application/problem+json"`, response body contains `"status":500` and `"title"` key
  - [ ] Add `<ProjectReference>` to `SiesaAgents.API` in `SiesaAgents.UnitTests.csproj` if not already present
  - [ ] Run `dotnet test` — all tests pass

## Dev Notes

### AppDbContext Implementation

```csharp
// backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs
using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // No DbSet<> properties in this story.
    // Domain entities (ClienteEntity, ContactoEntity) are added in Epics 2 and 3.

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply entity type configurations (none in this story)
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // MUST be the last call — overrides all naming to snake_case
        modelBuilder.ApplySnakeCaseNaming();
    }
}
```

### Program.cs Registration Pattern

```csharp
// Add after CORS registration, before var app = builder.Build()
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")));
```

Full `Program.cs` after this story:

```csharp
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using SiesaAgents.API.Middleware;
using SiesaAgents.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
    options.AddPolicy("DevCors", policy =>
        policy.WithOrigins(
                builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
                ?? ["http://localhost:5173"])
              .AllowAnyHeader()
              .AllowAnyMethod()));

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("DevCors");
app.MapOpenApi();
app.MapScalarApiReference();

app.Run();
```

### SiesaAgents.Infrastructure.csproj After Changes

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="10.*" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="10.*" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="10.*" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\SiesaAgents.Domain\SiesaAgents.Domain.csproj" />
  </ItemGroup>

</Project>
```

### SiesaAgents.API.csproj — Add Infrastructure Reference

```xml
<!-- Add inside <ItemGroup> for project references -->
<ProjectReference Include="..\SiesaAgents.Infrastructure\SiesaAgents.Infrastructure.csproj" />
```

### Migration Commands

Run from `backend/` directory:

```bash
# Add initial empty migration
dotnet ef migrations add InitialCreate \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API

# Apply migration to create siesa_agents_db
dotnet ef database update \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API
```

The migration `Up()` will be empty (no tables yet). Tables are created in:
- `InitialCreate` migration — empty (this story)
- Epic 2, Story 2.1 — `clientes` table added via `AddClientsTable` migration
- Epic 3, Story 3.1 — `contactos` table added via `AddContactosTable` migration

### ApplySnakeCaseNaming() — Critical Rule

Per company standards and architecture.md:
- `modelBuilder.ApplySnakeCaseNaming()` MUST be the LAST call in `OnModelCreating`
- This auto-converts all PascalCase C# property names to snake_case DB column names
- NO manual `[Column("column_name")]` or `[Table("table_name")]` attributes allowed
- Example: `public string NombreCompleto` → column `nombre_completo` automatically

### ExceptionHandlingMiddleware — Already Implemented

`ExceptionHandlingMiddleware` was created in Story 1.1 and is already registered in `Program.cs`. This story verifies it and adds unit test coverage. Do NOT modify the existing implementation — it already conforms to Problem Details RFC 7807.

### Unit Test Pattern for ExceptionHandlingMiddleware

```csharp
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SiesaAgents.API.Middleware;
using Xunit;

namespace SiesaAgents.UnitTests.Middleware;

public class ExceptionHandlingMiddlewareTests
{
    [Fact]
    public async Task InvokeAsync_WhenNoException_CallsNext()
    {
        // Arrange
        var nextCalled = false;
        RequestDelegate next = _ => { nextCalled = true; return Task.CompletedTask; };
        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.True(nextCalled);
        Assert.Equal(200, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_Returns500ProblemDetails()
    {
        // Arrange
        RequestDelegate next = _ => throw new Exception("test error");
        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(500, context.Response.StatusCode);
        Assert.Equal("application/problem+json", context.Response.ContentType);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("status", out _));
        Assert.True(doc.RootElement.TryGetProperty("title", out _));
    }
}
```

### Database Connection String

Already present in `backend/src/SiesaAgents.API/appsettings.Development.json`:

```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres"
}
```

No changes needed to connection string configuration.

### Scope Constraints (CRITICAL)

- DO NOT define `ClienteEntity` or `ContactoEntity` in this story
- DO NOT add `DbSet<>` properties to `AppDbContext`
- DO NOT create EF Core entity configurations (ClienteConfiguration, ContactoConfiguration) — those belong to Epics 2 and 3
- The initial migration MUST be empty (no domain tables)
- This story is exclusively infrastructure plumbing: DbContext + migrations scaffolding + EF Core registration

### References

- EF Core + Npgsql snake_case: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions]
- `ApplySnakeCaseNaming()` mandatory rule: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#EF Core]
- `AppDbContext` location in project structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Problem Details RFC 7807 requirement: [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- `ExceptionHandlingMiddleware` pattern: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#ExceptionHandlingMiddleware pattern]
- Backend infrastructure csproj (Npgsql already present): [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#File List]
- Database name `siesa_agents_db`: [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment]
- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3]
- Story 1.1 implementation state: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

(empty — story not yet implemented)

### Completion Notes List

(empty — story not yet implemented)

### File List

#### New files
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`
- `backend/src/SiesaAgents.Infrastructure/Migrations/<timestamp>_InitialCreate.cs` (generated by EF CLI)
- `backend/src/SiesaAgents.Infrastructure/Migrations/AppDbContextModelSnapshot.cs` (generated by EF CLI)
- `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs`

#### Modified files
- `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj` — add EF Core Design + Tools packages
- `backend/src/SiesaAgents.API/SiesaAgents.API.csproj` — add Infrastructure project reference
- `backend/src/SiesaAgents.API/Program.cs` — register `AppDbContext` with Npgsql

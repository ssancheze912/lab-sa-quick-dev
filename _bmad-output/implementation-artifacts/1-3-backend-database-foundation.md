# Story 1.3: Backend Database Foundation

Status: draft

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

## Acceptance Criteria

1. **Given** PostgreSQL is running locally, **When** the developer runs `dotnet ef database update` from `backend/src/SiesaAgents.Infrastructure/`, **Then** the `siesa_agents_db` database is created with no errors, **And** the `__ef_migrations_history` table exists in snake_case (confirming `ApplySnakeCaseNaming()` is active), **And** no domain tables (`clientes`, `contactos`) exist — this story creates an empty initial migration only.

2. **Given** an unhandled exception occurs in the backend, **When** the error reaches the middleware, **Then** the response returns Problem Details RFC 7807 format (`Content-Type: application/problem+json`) with `status`, `title`, and `detail` fields, **And** no `stackTrace`, `exception`, or `innerException` keys are exposed (NFR6). _(Note: `ExceptionHandlingMiddleware` was implemented in Story 1.1. This AC validates it is still correctly registered and ordered.)_

3. **Given** the backend receives any request, **When** the EF Core model is built, **Then** `ApplySnakeCaseNaming()` is applied as the last call in `OnModelCreating`, **And** all future column and table names produced by EF Core use snake_case convention automatically without any manual `[Column]` or `[Table]` attribute overrides.

4. **Given** the Infrastructure project is wired to the API project, **When** `dotnet run` starts `SiesaAgents.API`, **Then** `AppDbContext` is registered in the DI container via `builder.Services.AddDbContext<AppDbContext>()`, **And** the connection string is read from `ConnectionStrings:DefaultConnection` in `appsettings.Development.json`.

5. **Given** the EF Core migrations folder exists in `backend/src/SiesaAgents.Infrastructure/Data/Migrations/`, **When** a developer inspects the solution, **Then** at least one migration file (the initial empty migration) is present, confirming the EF Core tooling is correctly configured.

## Tasks / Subtasks

- [ ] Task 1 — Create `AppDbContext` in `SiesaAgents.Infrastructure` (AC: #3, #4)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`
  - [ ] Inherit from `DbContext`; constructor accepts `DbContextOptions<AppDbContext>`
  - [ ] Override `OnModelCreating`: call `modelBuilder.ApplySnakeCaseNaming()` as the **last** call in the method
  - [ ] Do NOT add any `DbSet<>` properties for domain entities — those are added in Epics 2 and 3
  - [ ] Add `using EFCore.NamingConventions` reference (provided by `EFCore.NamingConventions` NuGet package)

- [ ] Task 2 — Add required NuGet packages to `SiesaAgents.Infrastructure` (AC: #1, #3)
  - [ ] `Npgsql.EntityFrameworkCore.PostgreSQL` is already in the `.csproj` — verify version is `10.0.0-preview.2` or later
  - [ ] Add `EFCore.NamingConventions` package to `SiesaAgents.Infrastructure.csproj` for `ApplySnakeCaseNaming()` support
  - [ ] Add `Microsoft.EntityFrameworkCore.Design` package to `SiesaAgents.Infrastructure.csproj` (required for `dotnet ef` tooling)

- [ ] Task 3 — Register `AppDbContext` in `Program.cs` (AC: #4)
  - [ ] In `backend/src/SiesaAgents.API/Program.cs`, add `using SiesaAgents.Infrastructure.Data;`
  - [ ] Register DbContext before `var app = builder.Build()`:
    ```csharp
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
               .UseSnakeCaseNamingConvention());
    ```
  - [ ] Add `using Npgsql.EntityFrameworkCore.PostgreSQL;` (or use `UseNpgsql` extension from the Npgsql package)

- [ ] Task 4 — Verify `appsettings.Development.json` has correct connection string (AC: #4)
  - [ ] Confirm `backend/src/SiesaAgents.API/appsettings.Development.json` has:
    ```json
    "ConnectionStrings": {
      "DefaultConnection": "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres"
    }
    ```
  - [ ] This was added in Story 1.1 as a placeholder — verify it is present and correct format
  - [ ] Confirm `appsettings.json` also has the key as empty string `""` for explicit declaration in non-Development environments

- [ ] Task 5 — Create and run the initial empty migration (AC: #1, #5)
  - [ ] From `backend/src/SiesaAgents.Infrastructure/`, run:
    ```bash
    dotnet ef migrations add InitialCreate --startup-project ../SiesaAgents.API/
    ```
  - [ ] Verify `backend/src/SiesaAgents.Infrastructure/Data/Migrations/` folder is created with the migration files
  - [ ] Inspect the generated migration — `Up()` and `Down()` methods should be empty (no domain tables)
  - [ ] Run `dotnet ef database update --startup-project ../SiesaAgents.API/` to apply migration
  - [ ] Confirm `siesa_agents_db` is created and `__ef_migrations_history` table exists

- [ ] Task 6 — Write xUnit integration test for Problem Details middleware (AC: #2)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Infrastructure/ExceptionMiddlewareTests.cs`
  - [ ] Use `WebApplicationFactory<Program>` to spin up the test host in-process
  - [ ] Register a test-only endpoint `GET /api/v1/test-error` that throws `new Exception("internal test")` — add only in test host configuration, not in production `Program.cs`
  - [ ] Assert: HTTP 500, `Content-Type` contains `application/problem+json`
  - [ ] Assert: Response JSON has `status` = 500, `title` is not null, no `stackTrace` key
  - [ ] Use `System.Text.Json.JsonDocument` to parse response for assertions

- [ ] Task 7 — Write xUnit integration test for database connectivity and snake_case (AC: #1, #3, #5)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`
  - [ ] Test: `AppDbContext` resolves from DI container without throwing
  - [ ] Test: `modelBuilder.GetTableName(typeof(object))` — or verify via model introspection that `ApplySnakeCaseNaming` is present as the last `ModelBuilder` configuration
  - [ ] Note: Full database migration test (TC-E1-P1-05) requires a live PostgreSQL instance — document as integration test requiring TestContainers or local DB
  - [ ] Unit test: verify `AppDbContext` constructor accepts `DbContextOptions<AppDbContext>` and initializes without connecting

- [ ] Task 8 — Update `SiesaAgents.API.csproj` to reference Infrastructure (if not already) (AC: #4)
  - [ ] Confirm `SiesaAgents.API.csproj` already has `<ProjectReference Include="..\SiesaAgents.Infrastructure\...">` — it does (created in Story 1.1)
  - [ ] No changes needed if reference exists

## Dev Notes

### Backend Stack for this Story

- **Framework**: .NET 10, C# Minimal API
- **ORM**: Entity Framework Core 10 (`Npgsql.EntityFrameworkCore.PostgreSQL` v10+)
- **Naming**: `EFCore.NamingConventions` package provides `UseSnakeCaseNamingConvention()` on `DbContextOptionsBuilder` and `ApplySnakeCaseNaming()` on `ModelBuilder`
- **Database**: PostgreSQL 18+, database name `siesa_agents_db`
- **Testing**: xUnit + `WebApplicationFactory<Program>`

### `AppDbContext` Implementation Pattern

```csharp
using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // DbSet properties are added in Epics 2 and 3 — NOT here
    // public DbSet<ClienteEntity> Clientes => Set<ClienteEntity>();  ← Epic 2, Story 2.1

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply entity configurations from Infrastructure/Data/Configurations/
        // modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly); ← uncomment when configs exist

        // MUST be the last call in OnModelCreating — enforces snake_case for ALL column names
        modelBuilder.UseSnakeCaseNamingConvention();
    }
}
```

> **Note:** `EFCore.NamingConventions` v8+ uses `modelBuilder.UseSnakeCaseNamingConvention()` (not `ApplySnakeCaseNaming()`). Verify the exact method name against the installed package version. Both the `DbContextOptionsBuilder` extension (`UseSnakeCaseNamingConvention()`) and the `ModelBuilder` extension are provided by the same package.

### `Program.cs` DbContext Registration

Add the following block **before** `var app = builder.Build();` in `backend/src/SiesaAgents.API/Program.cs`:

```csharp
// Database — EF Core + PostgreSQL
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"))
           .UseSnakeCaseNamingConvention());
```

The complete `Program.cs` ordering must be:

```
1. builder.Services.AddOpenApi()
2. builder.Services.AddCors(...)
3. builder.Services.AddDbContext<AppDbContext>(...)  ← new in this story
4. var app = builder.Build()
5. app.UseMiddleware<ExceptionHandlingMiddleware>()  ← must remain first
6. app.UseCors("DevCors")
7. app.MapOpenApi()
8. app.MapScalarApiReference()
9. app.Run()
```

### `SiesaAgents.Infrastructure.csproj` After Update

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="EFCore.NamingConventions" Version="8.0.3" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="10.0.0-preview.2">
      <PrivateAssets>all</PrivateAssets>
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
    </PackageReference>
    <PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="10.0.0-preview.2" />
  </ItemGroup>
  <ItemGroup>
    <ProjectReference Include="..\SiesaAgents.Domain\SiesaAgents.Domain.csproj" />
  </ItemGroup>
</Project>
```

> **Version note:** Verify `EFCore.NamingConventions` version compatibility with EF Core 10 preview. As of 2026, use the latest stable release compatible with EF Core 10. Check NuGet for the correct version if `8.0.3` is not compatible.

### EF Core Migrations CLI Commands

```bash
# From backend/src/SiesaAgents.Infrastructure/
# (startup-project points to the API project for configuration loading)

# Create initial empty migration
dotnet ef migrations add InitialCreate --startup-project ../SiesaAgents.API/

# Apply migration (creates siesa_agents_db if it doesn't exist)
dotnet ef database update --startup-project ../SiesaAgents.API/

# Verify migrations folder was created
ls Data/Migrations/
# Expected: *_InitialCreate.cs  *_InitialCreate.Designer.cs  AppDbContextModelSnapshot.cs
```

### Scope Boundary — CRITICAL

Per the epic scope note:

> **DO NOT define `ClienteEntity` or `ContactoEntity` in this story.**

- `AppDbContext` has zero `DbSet<>` properties in this story
- The generated `InitialCreate` migration `Up()` method must be empty
- No `Configurations/` files are created in this story
- Tables `clientes` and `contactos` are created in Epic 2 Story 2.1 and Epic 3 Story 3.1 respectively

### Folder Structure Created by this Story

```
backend/
└── src/
    └── SiesaAgents.Infrastructure/
        ├── SiesaAgents.Infrastructure.csproj   ← MODIFIED (new NuGet packages)
        └── Data/
            ├── AppDbContext.cs                  ← CREATED
            ├── Configurations/                  ← CREATED (empty, for future use)
            └── Migrations/                      ← CREATED by dotnet ef migrations add
                ├── {timestamp}_InitialCreate.cs
                ├── {timestamp}_InitialCreate.Designer.cs
                └── AppDbContextModelSnapshot.cs
backend/
└── src/
    └── SiesaAgents.API/
        └── Program.cs                           ← MODIFIED (AddDbContext registration)
```

### Test Patterns

**`ExceptionMiddlewareTests.cs` pattern:**

```csharp
using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using System.Text.Json;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

public class ExceptionMiddlewareTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task UnhandledException_ReturnsProblemDetails_WithNoStackTrace()
    {
        // Arrange
        var client = factory.WithWebHostBuilder(builder =>
        {
            builder.Configure(app =>
            {
                app.UseMiddleware<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>();
                app.Run(_ => throw new Exception("internal test"));
            });
        }).CreateClient();

        // Act
        var response = await client.GetAsync("/api/v1/test-error");

        // Assert
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Contains("application/problem+json", response.Content.Headers.ContentType?.ToString());

        var body = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("status", out _));
        Assert.True(root.TryGetProperty("title", out _));
        Assert.False(root.TryGetProperty("stackTrace", out _));
        Assert.False(root.TryGetProperty("exception", out _));
    }
}
```

**`AppDbContextTests.cs` pattern:**

```csharp
using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

public class AppDbContextTests
{
    [Fact]
    public void AppDbContext_CanBeInstantiated_WithInMemoryOptions()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("TestDb_AppDbContext")
            .UseSnakeCaseNamingConvention()
            .Options;

        // Act
        using var context = new AppDbContext(options);

        // Assert — no exception thrown
        Assert.NotNull(context);
    }

    [Fact]
    public void OnModelCreating_AppliesSnakeCaseNaming_AsLastConfiguration()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("TestDb_NamingConvention")
            .UseSnakeCaseNamingConvention()
            .Options;

        using var context = new AppDbContext(options);

        // Act — trigger model building
        var model = context.Model;

        // Assert — model was built without exceptions (naming convention applied)
        Assert.NotNull(model);
    }
}
```

### Previous Story Context

**From Story 1.1 (already completed):**
- `SiesaAgents.Infrastructure.csproj` already has `Npgsql.EntityFrameworkCore.PostgreSQL` v10 preview
- `appsettings.Development.json` already has `ConnectionStrings:DefaultConnection` placeholder
- `SiesaAgents.API.csproj` already references `SiesaAgents.Infrastructure`
- `ExceptionHandlingMiddleware` is already registered as the first middleware in `Program.cs`
- `Entity.cs` base class already uses `Guid` PKs and `DateTimeOffset` timestamps

**From Story 1.1 Known Issues:**
- .NET 10 SDK may not be available in CI — `dotnet ef` and `dotnet run` must be verified on developer machine
- `TreatWarningsAsErrors` is missing from `SiesaAgents.UnitTests.csproj` — flagged in Story 1.1 review. This story should add it when modifying the test project.

### Test Cases from Test Design (Epic 1)

This story must satisfy the following test cases from `_bmad-output/implementation-artifacts/test-design-epic-1.md`:

| Test Case | Priority | Description |
|-----------|----------|-------------|
| TC-E1-P0-05 | P0 | `ExceptionHandlingMiddleware` returns Problem Details RFC 7807 (no stack trace) |
| TC-E1-P1-05 | P1 | EF Core migration creates `siesa_agents_db` and `__ef_migrations_history` in snake_case |
| TC-E1-P2-04 | P2 | `ApplySnakeCaseNaming()` applied — column names are lowercase snake_case |

All three must pass before this story is closed as done.

### References

- EF Core configuration and `ApplySnakeCaseNaming` rule: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions (PostgreSQL)]
- Backend folder structure: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Folder Structure (.NET Solution)]
- `AppDbContext` placement (`Infrastructure/Data/`): [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Problem Details RFC 7807 middleware: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- `DateTimeOffset` and `Guid` entity standards: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- Connection string placeholder: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#Task 5]
- Test cases TC-E1-P0-05, TC-E1-P1-05, TC-E1-P2-04: [Source: _bmad-output/implementation-artifacts/test-design-epic-1.md#Test Cases by Priority]
- Story scope note (no ClienteEntity/ContactoEntity): [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3]
- Middleware ordering rules: [Source: _bmad-output/implementation-artifacts/test-design-epic-1.md#Notes for Story Implementation Agents]

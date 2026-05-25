# Story 1.3: Backend Database Foundation

Status: draft

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

## Acceptance Criteria

1. **Given** PostgreSQL is running locally, **When** the developer runs `dotnet ef database update` from `backend/`, **Then** the `siesa_agents_db` database is created with no errors and the EF Core migrations folder exists in `backend/src/SiesaAgents.Infrastructure/Migrations/`.

2. **Given** an unhandled exception occurs in the backend, **When** the error reaches the middleware, **Then** the response returns Problem Details RFC 7807 format (status, title, detail) with no stack traces exposed (NFR6). The `ExceptionHandlingMiddleware` must be registered before routing in `Program.cs`.

3. **Given** the backend receives any request, **When** EF Core processes database operations, **Then** `modelBuilder.ApplySnakeCaseNaming()` is called last inside `OnModelCreating` so all generated column and table names follow snake_case convention.

4. **Given** the Infrastructure project is compiled, **When** `dotnet build SiesaAgents.sln` is executed, **Then** all projects compile successfully with zero errors and `AppDbContext` is registered in the DI container via `AddDbContext<AppDbContext>` reading `ConnectionStrings:DefaultConnection` from configuration.

5. **Given** the xUnit test project is run, **When** `dotnet test` executes, **Then** the `AppDbContextTests` class passes all assertions confirming that `AppDbContext` is instantiable via EF Core InMemory provider with `ApplySnakeCaseNaming()` applied.

## Tasks / Subtasks

- [ ] Task 1 — Add EF Core design-time tooling and Npgsql.Design package to Infrastructure (AC: #1)
  - [ ] Add `Microsoft.EntityFrameworkCore.Design` package to `SiesaAgents.Infrastructure.csproj` (required for `dotnet ef` CLI)
  - [ ] Add `Microsoft.EntityFrameworkCore.Tools` package to `SiesaAgents.API.csproj` (required for migrations from API project)
  - [ ] Verify `Npgsql.EntityFrameworkCore.PostgreSQL` version `10.0.0-preview.1` is already present in `SiesaAgents.Infrastructure.csproj` (added in Story 1.1)

- [ ] Task 2 — Update `AppDbContext.cs` to apply snake_case naming (AC: #3)
  - [ ] Update `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`
  - [ ] Call `modelBuilder.ApplySnakeCaseNaming()` as the LAST call in `OnModelCreating`, after `base.OnModelCreating(modelBuilder)` and `modelBuilder.ApplyConfigurationsFromAssembly(...)`
  - [ ] Ensure the class uses primary constructor: `AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)`

- [ ] Task 3 — Register `AppDbContext` in DI and configure connection string (AC: #4)
  - [ ] In `backend/src/SiesaAgents.API/Program.cs`, add `builder.Services.AddDbContext<AppDbContext>` registration reading `builder.Configuration.GetConnectionString("DefaultConnection")`
  - [ ] Use `options.UseNpgsql(connectionString)` from Npgsql provider
  - [ ] Add `using SiesaAgents.Infrastructure.Data;` and `using Microsoft.EntityFrameworkCore;` namespaces at the top of `Program.cs`
  - [ ] Verify `appsettings.Development.json` already has `ConnectionStrings:DefaultConnection` = `Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres`

- [ ] Task 4 — Create the initial empty EF Core migration (AC: #1)
  - [ ] Run `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` from `backend/` directory
  - [ ] Verify the `backend/src/SiesaAgents.Infrastructure/Migrations/` folder is created with `<timestamp>_InitialCreate.cs` and `AppDbContextModelSnapshot.cs`
  - [ ] The migration must be empty (no `Up`/`Down` table operations) since no domain entities exist yet per scope note

- [ ] Task 5 — Add `IDesignTimeDbContextFactory<AppDbContext>` for EF Core CLI (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContextFactory.cs`
  - [ ] Implement `IDesignTimeDbContextFactory<AppDbContext>` using `DbContextOptionsBuilder` with `UseNpgsql` and a design-time connection string
  - [ ] This enables `dotnet ef` commands without needing the API to be running

- [ ] Task 6 — Add xUnit unit tests for `AppDbContext` (AC: #5)
  - [ ] Add `Microsoft.EntityFrameworkCore.InMemory` package to `SiesaAgents.UnitTests.csproj`
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`
  - [ ] Test: `AppDbContext` can be instantiated with InMemory provider without throwing
  - [ ] Test: `OnModelCreating` does not throw (verifiable via `EnsureCreated()` on InMemory)
  - [ ] Test structure: Arrange / Act / Assert per company standard
  - [ ] Run `dotnet test` and verify all tests pass

## Dev Notes

### AppDbContext — Updated Pattern

```csharp
// backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs
using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        modelBuilder.ApplySnakeCaseNaming(); // MUST be last — overrides all prior naming
    }
}
```

### IDesignTimeDbContextFactory Pattern

```csharp
// backend/src/SiesaAgents.Infrastructure/Data/AppDbContextFactory.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        optionsBuilder.UseNpgsql(
            "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres");
        return new AppDbContext(optionsBuilder.Options);
    }
}
```

### Program.cs — DbContext Registration Addition

The existing `Program.cs` must be extended with the following addition (insert after the CORS registration block, before `var app = builder.Build()`):

```csharp
// Add after CORS registration
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));
```

Required `using` statements to add at the top of `Program.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;
```

### EF Core Migration Command

```bash
# Run from backend/ directory
dotnet ef migrations add InitialCreate \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API \
  --output-dir Data/Migrations
```

The `--output-dir Data/Migrations` places migrations inside the Infrastructure project's `Data/` folder, consistent with the architecture document structure (`SiesaAgents.Infrastructure/Data/Migrations/`).

### Database Apply Command (verification)

```bash
# Run from backend/ directory — requires PostgreSQL running locally
dotnet ef database update \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API
```

### Infrastructure .csproj — Required Package Additions

```xml
<!-- SiesaAgents.Infrastructure.csproj additions -->
<PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="10.0.0" >
  <PrivateAssets>all</PrivateAssets>
  <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
</PackageReference>
```

```xml
<!-- SiesaAgents.API.csproj addition -->
<PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="10.0.0">
  <PrivateAssets>all</PrivateAssets>
  <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
</PackageReference>
```

### UnitTests .csproj — InMemory Package Addition

```xml
<!-- SiesaAgents.UnitTests.csproj addition -->
<PackageReference Include="Microsoft.EntityFrameworkCore.InMemory" Version="10.0.0" />
```

Also add project reference to Infrastructure in `SiesaAgents.UnitTests.csproj`:
```xml
<ProjectReference Include="..\..\src\SiesaAgents.Infrastructure\SiesaAgents.Infrastructure.csproj" />
```

### AppDbContextTests Pattern

```csharp
// backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs
using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

public class AppDbContextTests
{
    [Fact]
    public void AppDbContext_CanBeInstantiated_WithInMemoryProvider()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        // Act & Assert
        using var context = new AppDbContext(options);
        Assert.NotNull(context);
    }

    [Fact]
    public void AppDbContext_EnsureCreated_DoesNotThrow()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        // Act
        using var context = new AppDbContext(options);
        var created = context.Database.EnsureCreated();

        // Assert
        Assert.True(created);
    }
}
```

### Scope Boundary (Critical)

Per the epic scope note: This story creates an **empty** initial migration — no domain tables. `ClienteEntity` and `ContactoEntity` are NOT defined in this story. They are created in Epic 2 Story 2.1 and Epic 3 Story 3.1 respectively. The `Migrations/` folder will exist but the generated migration will have empty `Up()` and `Down()` methods.

### snake_case Naming Convention Enforcement

`ApplySnakeCaseNaming()` is provided by the Npgsql provider and converts all C# PascalCase property names to PostgreSQL snake_case automatically. This means:
- `public Guid Id` → column `id`
- `public string Nombre` → column `nombre`
- `public DateTimeOffset CreatedAt` → column `created_at`
- `public Guid? ClienteId` → column `cliente_id`

No manual `[Column("...")]` or `[Table("...")]` attributes are needed — per company standards.

### ExceptionHandlingMiddleware Verification

The `ExceptionHandlingMiddleware` was created in Story 1.1 (`backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`) and is already registered in `Program.cs` via `app.UseMiddleware<ExceptionHandlingMiddleware>()`. No changes are needed to the middleware itself. AC #2 is verified by confirming registration order in `Program.cs`: middleware must run before `app.UseCors()` and `app.MapScalarApiReference()`.

### Dependencies on Story 1.1

- `backend/SiesaAgents.sln` already references all four projects
- `Npgsql.EntityFrameworkCore.PostgreSQL` already in `SiesaAgents.Infrastructure.csproj`
- `ExceptionHandlingMiddleware.cs` already exists and is registered in `Program.cs`
- `appsettings.Development.json` already has `ConnectionStrings:DefaultConnection`
- `AppDbContext.cs` stub already exists — only needs `ApplySnakeCaseNaming()` added

### References

- EF Core snake_case naming rule: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions]
- AppDbContext architecture decision: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure → SiesaAgents.Infrastructure/Data/AppDbContext.cs]
- ExceptionHandlingMiddleware: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#ExceptionHandlingMiddleware pattern]
- Problem Details RFC 7807: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- Database naming conventions: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions (PostgreSQL)]
- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3: Backend Database Foundation]

## Dev Agent Record

### Agent Model Used

N/A

### Debug Log References

N/A

### Completion Notes List

N/A

### File List

N/A

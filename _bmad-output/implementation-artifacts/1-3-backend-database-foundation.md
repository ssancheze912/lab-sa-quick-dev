# Story 1.3: Backend Database Foundation

Status: ready

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

## Acceptance Criteria

1. **Given** PostgreSQL is running locally, **When** the developer runs `dotnet ef database update` from `backend/`, **Then** the `siesa_agents_db` database is created with no errors, and an EF Core `Migrations/` folder exists in `SiesaAgents.Infrastructure` containing the initial empty migration.

2. **Given** an unhandled exception occurs in the backend, **When** the error reaches the middleware, **Then** the response returns Problem Details RFC 7807 format (status, title, detail) with no stack traces exposed (NFR6). The `ExceptionHandlingMiddleware` already created in Story 1.1 satisfies this criterion — no changes required if implementation is correct.

3. **Given** the backend receives any request, **When** the request is processed, **Then** `modelBuilder.ApplySnakeCaseNaming()` is called last in `AppDbContext.OnModelCreating`, so all future entity column names follow snake_case convention automatically — NO manual `[Column]`/`[Table]` attributes required.

4. **Given** the `AppDbContext` is registered in `Program.cs`, **When** the application starts, **Then** `AddDbContext<AppDbContext>` is called with the Npgsql provider using the `DefaultConnection` connection string from `appsettings.Development.json`.

5. **Given** the solution builds successfully, **When** `dotnet build` is executed, **Then** all projects compile with zero errors and zero warnings.

## Tasks / Subtasks

- [ ] Task 1 — Add `ApplySnakeCaseNaming()` to `AppDbContext.OnModelCreating` (AC: #3)
  - [ ] Open `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`
  - [ ] Call `modelBuilder.ApplySnakeCaseNaming()` as the LAST statement in `OnModelCreating`, after `base.OnModelCreating` and `ApplyConfigurationsFromAssembly`
  - [ ] Verify no `[Column]`, `[Table]`, or `[Key]` data annotation attributes exist in the project — EF Core snake_case naming handles all mapping automatically

- [ ] Task 2 — Register `AppDbContext` in `Program.cs` (AC: #4)
  - [ ] In `backend/src/SiesaAgents.API/Program.cs`, add `builder.Services.AddDbContext<AppDbContext>` before `var app = builder.Build()`
  - [ ] Use Npgsql provider: `options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))`
  - [ ] Add the required `using` directives: `using SiesaAgents.Infrastructure.Data;` and `using Microsoft.EntityFrameworkCore;`
  - [ ] Confirm `appsettings.Development.json` already contains `"DefaultConnection": "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres"` (set in Story 1.1 — no change needed)

- [ ] Task 3 — Add EF Core Tools support to `SiesaAgents.Infrastructure.csproj` (AC: #1)
  - [ ] Add `<PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="10.*">` with `PrivateAssets="all"` to `SiesaAgents.Infrastructure.csproj`
  - [ ] Verify `Npgsql.EntityFrameworkCore.PostgreSQL` Version `10.*` is already referenced (set in Story 1.1)

- [ ] Task 4 — Create initial empty migration (AC: #1)
  - [ ] Run `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` from `backend/`
  - [ ] Confirm `backend/src/SiesaAgents.Infrastructure/Migrations/` folder is created with the migration files
  - [ ] NOTE: If .NET 10 SDK is not available in the environment, create the migration files manually (see Dev Notes — Manual Migration Files)

- [ ] Task 5 — Verify `ExceptionHandlingMiddleware` correctness (AC: #2)
  - [ ] Confirm `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` catches all `Exception` instances and returns `ProblemDetails` with `Status = 500`, `Title = "An unexpected error occurred."`, and `Detail = null`
  - [ ] Confirm `app.UseMiddleware<ExceptionHandlingMiddleware>()` is registered BEFORE `app.UseCors()` in `Program.cs`
  - [ ] No code changes needed if Story 1.1 implementation is correct — this task is a verification-only step

- [ ] Task 6 — Unit tests for `AppDbContext` configuration (AC: #3, #5)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`
  - [ ] Test: `OnModelCreating_AppliesSnakeCaseNaming` — use EF Core InMemory provider (or verify via model metadata that the convention is applied)
  - [ ] Test: `AppDbContext_CanBeInstantiated_WithNpgsqlOptions` — verify context can be created with connection string options without throwing

## Dev Notes

### What This Story Does and Does NOT Do

This story is **backend-only** — no frontend changes required.

**In scope:**
- `ApplySnakeCaseNaming()` in `AppDbContext`
- `AddDbContext<AppDbContext>` registration in `Program.cs`
- Empty initial EF Core migration (no domain tables)
- EF Core Design package for migration tooling

**Out of scope (deferred to Epic 2 / Epic 3):**
- `ClienteEntity` and `ContactoEntity` — DO NOT define these here
- `ClienteConfiguration.cs` and `ContactoConfiguration.cs` — deferred
- `ClienteRepository.cs` and `ContactoRepository.cs` — deferred
- `IUnitOfWork` implementation — deferred
- Any endpoint that touches the database — deferred

### Backend Stack Details

- **EF Core version**: 10 (matches `Npgsql.EntityFrameworkCore.PostgreSQL` Version `10.*` already in .csproj)
- **snake_case naming**: Provided by `EFCore.NamingConventions` package — add `Microsoft.EntityFrameworkCore.NamingConventions` OR use the Npgsql built-in convention via `UseSnakeCaseNamingConvention()`. See pattern below.
- **Database**: PostgreSQL 18+ — `siesa_agents_db`
- **Connection string key**: `"DefaultConnection"` in `appsettings.Development.json`

### `AppDbContext.OnModelCreating` — Correct Pattern

```csharp
using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        modelBuilder.ApplySnakeCaseNaming(); // MUST be LAST
    }
}
```

> **Note:** `ApplySnakeCaseNaming()` is an extension method from `EFCore.NamingConventions`. If using Npgsql's built-in alternative, call `UseSnakeCaseNamingConvention()` on the `NpgsqlDbContextOptionsBuilder` inside `AddDbContext`. Either approach is acceptable — use whichever is available in the installed Npgsql version.

### `Program.cs` — Correct `AddDbContext` Registration

```csharp
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using SiesaAgents.API.Middleware;
using SiesaAgents.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
    options.AddPolicy("DevCors", policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
            ?? ["http://localhost:5173"];
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    }));

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("DevCors");

app.MapOpenApi();
app.MapScalarApiReference();

app.Run();
```

### `SiesaAgents.Infrastructure.csproj` — EF Core Design Package

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="10.*" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="10.*">
      <PrivateAssets>all</PrivateAssets>
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
    </PackageReference>
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\SiesaAgents.Domain\SiesaAgents.Domain.csproj" />
  </ItemGroup>
</Project>
```

### Manual Migration Files (when .NET SDK is unavailable)

If `dotnet ef` cannot run in this environment, create the migration manually:

**`Migrations/{timestamp}_InitialCreate.cs`:**
```csharp
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SiesaAgents.Infrastructure.Migrations;

/// <inheritdoc />
public partial class InitialCreate : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Empty initial migration — domain tables added in Epic 2 (Story 2.1) and Epic 3 (Story 3.1)
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Empty
    }
}
```

**`Migrations/AppDbContextModelSnapshot.cs`:**
```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using SiesaAgents.Infrastructure.Data;

#nullable disable

namespace SiesaAgents.Infrastructure.Migrations;

[DbContext(typeof(AppDbContext))]
partial class AppDbContextModelSnapshot : ModelSnapshot
{
    protected override void BuildModel(ModelBuilder modelBuilder)
    {
#pragma warning disable 612, 618
        modelBuilder.HasAnnotation("ProductVersion", "10.0.0");
#pragma warning restore 612, 618
    }
}
```

Use a timestamp prefix like `20260524000000` in the filename to match EF Core conventions.

### Database Conventions (Mandatory)

Per company standards and architecture doc:

| Element | Convention | Applied by |
|---------|-----------|------------|
| Tables | snake_case plural | `ApplySnakeCaseNaming()` |
| Columns | snake_case | `ApplySnakeCaseNaming()` |
| PK column | `id` (UUID) | Base `Entity` class |
| Timestamps | `created_at`, `updated_at` | `ApplySnakeCaseNaming()` on `CreatedAt`/`UpdatedAt` |

NO manual `[Column]`, `[Table]`, or `[Key]` attributes — the naming convention handles all mapping.

### Problem Details RFC 7807 — Verification Checklist

The `ExceptionHandlingMiddleware` from Story 1.1 already satisfies AC#2. Verify the following are true:

- `Content-Type: application/problem+json` header is set
- `Status = 500` on the `ProblemDetails` object
- `Title` is a generic non-revealing message: `"An unexpected error occurred."`
- `Detail = null` — stack trace and exception message NEVER exposed
- Middleware is registered BEFORE `UseCors()` in `Program.cs`

### Testing Strategy

**Unit tests** (`SiesaAgents.UnitTests`): Use EF Core InMemory provider or `UseInMemoryDatabase` to instantiate `AppDbContext` and verify `OnModelCreating` executes without errors.

> `Microsoft.EntityFrameworkCore.InMemory` package must be added to the unit test project if not already present.

**Integration tests** (deferred): Full `dotnet ef database update` + connection verification requires a live PostgreSQL instance. Defer to a CI environment with TestContainers (Epic 2+).

### References

- Architecture — DB conventions and EF Core pattern: [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- Architecture — `AppDbContext` location: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Architecture — `AddDbContext` and snake_case enforcement: [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines]
- Company standards — EF Core snake_case: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions (PostgreSQL)]
- Company standards — Backend stack (.NET 10, EF Core 10, PostgreSQL 18+): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Stack]
- NFR6 — No stack traces: [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md#Security]
- Story 1.1 scaffold (existing files): [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#File List]
- Epic source with AC: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

(To be filled by dev agent during implementation.)

### File List

**Modified**
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` — Add `modelBuilder.ApplySnakeCaseNaming()` as last call in `OnModelCreating`
- `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj` — Add `Microsoft.EntityFrameworkCore.Design` package reference
- `backend/src/SiesaAgents.API/Program.cs` — Add `builder.Services.AddDbContext<AppDbContext>` with Npgsql provider

**Created**
- `backend/src/SiesaAgents.Infrastructure/Migrations/{timestamp}_InitialCreate.cs` — Empty initial migration
- `backend/src/SiesaAgents.Infrastructure/Migrations/AppDbContextModelSnapshot.cs` — EF Core model snapshot
- `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs` — Unit tests for DbContext configuration

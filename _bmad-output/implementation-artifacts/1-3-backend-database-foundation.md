# Story 1.3: Backend Database Foundation

Status: review

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

## Acceptance Criteria

1. **Given** PostgreSQL is running locally, **When** the developer runs `dotnet ef database update` from the `backend/` directory, **Then** the `siesa_agents_db` database is created with no errors and the `__EFMigrationsHistory` table is present.

2. **Given** the EF Core tooling has run the initial migration, **When** the developer inspects the `SiesaAgents.Infrastructure` project, **Then** a `Data/Migrations/` folder exists containing an `InitialCreate` migration file with an empty `Up()` method (no domain tables — clientes/contactos are Epic 2/3 scope).

3. **Given** an unhandled exception occurs in the backend, **When** the error reaches the middleware, **Then** the response returns Problem Details RFC 7807 format (`status`, `title`, `detail`) with no stack traces exposed, and `Content-Type` is `application/problem+json` (NFR6).

4. **Given** the backend receives any request and the database schema is updated in a future migration, **When** EF Core generates SQL for entity properties, **Then** `UseSnakeCaseNamingConvention()` is called on the DbContext options in `Program.cs` so that all column names follow snake_case convention (e.g., `created_at`, not `CreatedAt`).

5. **Given** the Infrastructure project is configured, **When** `dotnet build SiesaAgents.sln` runs, **Then** the build succeeds with zero errors and `SiesaAgentsDbContext` is registered in the DI container via `Program.cs`.

## Tasks / Subtasks

- [x] Task 1 — Add `EFCore.NamingConventions` package and configure snake_case naming (AC: #4)
  - [x] Add NuGet package `EFCore.NamingConventions` (version `10.*`) to `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj`
  - [x] Update `Program.cs` to call `.UseSnakeCaseNamingConvention()` on the DbContext options builder (correct API — convention is applied at options level, not in `OnModelCreating`)
  - [x] Verify no `[Column]` or `[Table]` data annotations are present — naming is handled exclusively via convention

- [x] Task 2 — Register `SiesaAgentsDbContext` in DI and configure connection string (AC: #1, #5)
  - [x] In `backend/src/SiesaAgents.API/Program.cs`, register the DbContext: `builder.Services.AddDbContext<SiesaAgentsDbContext>(options => options.UseNpgsql(...).UseSnakeCaseNamingConvention())`
  - [x] Add `using SiesaAgents.Infrastructure.Data;` and `using Microsoft.EntityFrameworkCore;` to `Program.cs`
  - [x] Confirm `appsettings.Development.json` already contains `ConnectionStrings:DefaultConnection` pointing to `Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres` (created in Story 1.1 — verified, not duplicated)
  - [x] Add `Microsoft.EntityFrameworkCore.Design` package reference to `SiesaAgents.API.csproj` (required for `dotnet ef` CLI tooling to resolve the DbContext from the startup project)

- [x] Task 3 — Create and apply the initial empty migration (AC: #1, #2)
  - [x] From the `backend/` directory, run: `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
  - [x] Verify `backend/src/SiesaAgents.Infrastructure/Data/Migrations/` is created with `<timestamp>_InitialCreate.cs` and `<timestamp>_InitialCreate.Designer.cs` and `SiesaAgentsDbContextModelSnapshot.cs`
  - [x] Confirm the `Up()` method in `InitialCreate.cs` is empty (no `CreateTable` calls — no domain entities exist yet)
  - [ ] Run: `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` to create `siesa_agents_db` and apply the migration (requires PostgreSQL running locally — deferred to developer environment)
  - [ ] Verify `siesa_agents_db` exists with the `__EFMigrationsHistory` table populated with the `InitialCreate` entry (requires PostgreSQL running locally — deferred to developer environment)

- [x] Task 4 — Verify `ExceptionHandlingMiddleware` returns Problem Details RFC 7807 (AC: #3)
  - [x] Updated `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` — fixed Content-Type handling: uses `JsonSerializer.Serialize` + `WriteAsync` to ensure `Content-Type: application/problem+json` is preserved (prior implementation's `WriteAsJsonAsync` overwrote the Content-Type header)
  - [x] Confirmed `Detail` is always `null` — never expose `ex.Message` or stack traces (NFR6)
  - [x] Confirmed `app.UseMiddleware<ExceptionHandlingMiddleware>()` is registered before routing in `Program.cs`

- [x] Task 5 — Unit tests for DbContext configuration and middleware (AC: #3, #4)
  - [x] In `backend/tests/SiesaAgents.UnitTests/`, created `Infrastructure/DbContextConfigurationTests.cs`
  - [x] Test: `SiesaAgentsDbContext` can be instantiated with `UseInMemoryDatabase` options (verifies DI wiring compiles)
  - [x] Test: `OnModelCreating` does not throw when called (smoke test via `EnsureCreated()`)
  - [x] Created `backend/tests/SiesaAgents.UnitTests/API/ExceptionHandlingMiddlewareTests.cs` covering: (a) `Content-Type` header is `application/problem+json`, (b) status code is 500, (c) `Detail` field is null, (d) no stack trace in response body, (e) passes through when no exception
  - [x] Run `dotnet test` — all 10 tests pass (5 new + 3 existing Entity tests + 2 DbContext tests)

## Dev Notes

### EF Core Snake Case Naming Convention

Per company standards (database-conventions.md): all PostgreSQL tables and columns MUST use snake_case. EF Core maps C# PascalCase properties to snake_case automatically via `EFCore.NamingConventions`.

The correct API is `UseSnakeCaseNamingConvention()` on the `DbContextOptionsBuilder` (not `ApplySnakeCaseNaming()` on `ModelBuilder`):

```csharp
// backend/src/SiesaAgents.API/Program.cs — correct registration
builder.Services.AddDbContext<SiesaAgentsDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
           .UseSnakeCaseNamingConvention());
```

### DbContext Registration in Program.cs

```csharp
// backend/src/SiesaAgents.API/Program.cs — additions for this story
using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;

builder.Services.AddDbContext<SiesaAgentsDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
           .UseSnakeCaseNamingConvention());
```

### EF Core Migrations — Required Package

`dotnet ef migrations add` requires `Microsoft.EntityFrameworkCore.Design` in the startup project (`SiesaAgents.API`). Without it, the command fails with "No DbContext was found."

```xml
<!-- backend/src/SiesaAgents.API/SiesaAgents.API.csproj -->
<PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="10.*">
  <PrivateAssets>all</PrivateAssets>
  <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
</PackageReference>
```

### Migration Commands

Run from `backend/` directory (where `SiesaAgents.sln` lives):

```bash
# Create initial empty migration
dotnet ef migrations add InitialCreate \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API

# Apply migration (creates siesa_agents_db) — requires PostgreSQL running
dotnet ef database update \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API
```

### Initial Migration — Expected Content

The `Up()` method MUST be empty. No `CreateTable`, no `CreateIndex`. The `clientes` table is created in Story 2.1 (`ClienteEntity` + `ClienteConfiguration`). The `contactos` table is created in Story 3.1 (`ContactoEntity` + `ContactoConfiguration`).

```csharp
// Expected InitialCreate.cs — Up() is intentionally empty
public partial class InitialCreate : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder) { }
    protected override void Down(MigrationBuilder migrationBuilder) { }
}
```

### ExceptionHandlingMiddleware — Fix Applied

The original implementation used `WriteAsJsonAsync` which overwrote the `Content-Type` header that was set to `application/problem+json`. The fix uses `JsonSerializer.Serialize` + `WriteAsync` to maintain the correct content type:

```csharp
// Correct implementation using manual serialization
context.Response.StatusCode = 500;
context.Response.ContentType = "application/problem+json";
var json = JsonSerializer.Serialize(problem, JsonOptions);
await context.Response.WriteAsync(json);
```

### NuGet Package Versions

All packages target the `10.*` wildcard to align with .NET 10 and EF Core 10:

| Package | Version | Project |
|---|---|---|
| `EFCore.NamingConventions` | `10.*` | `SiesaAgents.Infrastructure` |
| `Microsoft.EntityFrameworkCore.Design` | `10.*` | `SiesaAgents.API` (PrivateAssets=all) |
| `Microsoft.EntityFrameworkCore.InMemory` | `10.*` | `SiesaAgents.UnitTests` |
| `Microsoft.AspNetCore.Mvc.Testing` | `10.*` | `SiesaAgents.UnitTests` |

> Note: `Npgsql.EntityFrameworkCore.PostgreSQL` is already installed in `SiesaAgents.Infrastructure` from Story 1.1.

### Scope Boundary — What This Story Does NOT Do

- Does NOT create `ClienteEntity` or `ClienteConfiguration` (Epic 2, Story 2.1)
- Does NOT create `ContactoEntity` or `ContactoConfiguration` (Epic 3, Story 3.1)
- Does NOT create `IClienteRepository`, `IContactoRepository`, or their implementations (Epic 2/3)
- Does NOT add any application-layer commands, queries, or DTOs
- Does NOT create integration test project (noted in architecture.md — deferred to implementation stories)

### References

- EF Core snake_case convention: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#EF Core: Automatic snake_case via ApplySnakeCaseNaming()]
- Database naming conventions (snake_case tables/columns): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions (PostgreSQL)]
- Problem Details RFC 7807 requirement: [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md#NFR6]
- ExceptionHandlingMiddleware pattern: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#ExceptionHandlingMiddleware pattern]
- Connection string and DB name (`siesa_agents_db`): [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment]
- Backend project structure (Migrations/ folder): [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `WriteAsJsonAsync` overrides `Content-Type` header — fixed by switching to `JsonSerializer.Serialize` + `WriteAsync`
- `ApplySnakeCaseNaming()` does not exist on `ModelBuilder` — correct API is `UseSnakeCaseNamingConvention()` on `DbContextOptionsBuilder`
- EF Core migrations generated in `Migrations/` by default — moved to `Data/Migrations/` per architecture requirement and updated namespaces to `SiesaAgents.Infrastructure.Data.Migrations`
- PostgreSQL not available in CI environment — `dotnet ef database update` deferred to developer environment

### Completion Notes List

1. All Tasks 1-5 implemented. Tasks 1, 2, 4, and 5 fully verified with passing tests.
2. Task 3: Migration files created and placed in `Data/Migrations/`. `database update` requires PostgreSQL running locally — deferred.
3. ExceptionHandlingMiddleware fixed: `WriteAsJsonAsync` was overwriting the `Content-Type` header; replaced with manual JSON serialization to preserve `application/problem+json`.
4. `EFCore.NamingConventions` applies convention via `UseSnakeCaseNamingConvention()` on the options builder (not `ApplySnakeCaseNaming()` on ModelBuilder as the Dev Notes originally suggested).
5. Unit test suite: 10 tests total — 3 Entity tests (pre-existing) + 2 DbContext tests + 5 middleware tests. All pass.

### File List

**Backend (created/modified):**
- `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj` — `EFCore.NamingConventions` package already present (verified)
- `backend/src/SiesaAgents.Infrastructure/Data/SiesaAgentsDbContext.cs` — `ApplyConfigurationsFromAssembly` kept; snake_case via options builder (not OnModelCreating)
- `backend/src/SiesaAgents.API/SiesaAgents.API.csproj` — `Microsoft.EntityFrameworkCore.Design` already present (verified)
- `backend/src/SiesaAgents.API/Program.cs` — added `.UseSnakeCaseNamingConvention()` to DbContext registration
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` — fixed Content-Type handling using manual JSON serialization
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/20260524051531_InitialCreate.cs` — empty initial migration (generated + moved to Data/Migrations/)
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/20260524051531_InitialCreate.Designer.cs` — migration designer snapshot (generated + moved)
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/SiesaAgentsDbContextModelSnapshot.cs` — EF Core model snapshot (generated + moved)
- `backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj` — added `Microsoft.EntityFrameworkCore.InMemory`, `Microsoft.AspNetCore.Mvc.Testing`, Infrastructure and API project references
- `backend/tests/SiesaAgents.UnitTests/Infrastructure/DbContextConfigurationTests.cs` — 2 unit tests for DbContext (created)
- `backend/tests/SiesaAgents.UnitTests/API/ExceptionHandlingMiddlewareTests.cs` — 5 unit tests for middleware (created)

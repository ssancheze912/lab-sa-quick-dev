# Story 1.3: Backend Database Foundation

Status: ready-for-dev

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

## Acceptance Criteria

1. **Given** PostgreSQL is running locally, **When** the developer runs `dotnet ef database update` (from `SiesaAgents.API` as startup project, targeting `SiesaAgents.Infrastructure`), **Then** the `siesa_agents_db` database is created with no errors, **And** an `Migrations/` folder exists in `SiesaAgents.Infrastructure` containing an `InitialCreate` migration that defines no domain tables (only EF Core's own `__ef_migrations_history` table).

2. **Given** an unhandled exception occurs anywhere in the backend request pipeline, **When** the error reaches `ExceptionHandlingMiddleware`, **Then** the response is `Content-Type: application/problem+json` with a body containing `status`, `title`, and `detail` fields, **And** no stack trace, exception message, or inner exception is exposed (NFR6).

3. **Given** `AppDbContext.OnModelCreating` runs, **When** the model is built, **Then** `modelBuilder.ApplySnakeCaseNaming()` is invoked as the LAST statement in the method, **And** all EF-managed identifiers (table names, column names, keys, foreign key constraints, indexes) are converted to snake_case — verified by inspecting `__ef_migrations_history` columns (`migration_id`, `product_version`), since no domain tables exist yet in this story.

> **Scope note:** This story creates an empty initial migration (no domain tables). The `clientes` table is created in Epic 2 Story 2.1. The `contactos` table is created in Epic 3 Story 3.1. Do NOT define `ClienteEntity` or `ContactoEntity` in this story.

## Tasks / Subtasks

- [ ] Task 1 — EF Core design-time tooling (AC: #1)
  - [ ] Add `Microsoft.EntityFrameworkCore.Design` package to `SiesaAgents.API` (design-time package must live in the startup project, not `Infrastructure`)
  - [ ] Verify `Npgsql.EntityFrameworkCore.PostgreSQL` (already added to `SiesaAgents.Infrastructure` in Story 1.1) — do not re-add
  - [ ] Verify/install the `dotnet-ef` global tool: `dotnet tool install --global dotnet-ef` (skip if `dotnet ef --version` already resolves)

- [ ] Task 2 — Create `AppDbContext` (AC: #1, #3)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`: `public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)`
  - [ ] Override `OnModelCreating(ModelBuilder modelBuilder)` — no `DbSet<>` properties yet (no domain entities exist; see scope note); call `base.OnModelCreating(modelBuilder)` first, then `modelBuilder.ApplySnakeCaseNaming()` as the LAST line

- [ ] Task 3 — Implement the `ApplySnakeCaseNaming()` extension (AC: #3)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Extensions/ModelBuilderExtensions.cs` — static class with `public static void ApplySnakeCaseNaming(this ModelBuilder modelBuilder)`
  - [ ] Implement a private `ToSnakeCase(string input)` helper (regex-based PascalCase/camelCase → snake_case, e.g. `ClienteId` → `cliente_id`)
  - [ ] Iterate `modelBuilder.Model.GetEntityTypes()` and rename: table name (`SetTableName`), every property's column name (`SetColumnName`), every key name (`SetName`), every foreign key constraint name (`SetConstraintName`), every index database name (`SetDatabaseName`)
  - [ ] Method must be safe to call with zero entity types registered (this story has none) — no-op, no exceptions

- [ ] Task 4 — Register `AppDbContext` and the connection string (AC: #1)
  - [ ] In `backend/src/SiesaAgents.API/Program.cs`, add: `builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));`
  - [ ] Verify `ConnectionStrings:DefaultConnection` already exists in `appsettings.Development.json` (added in Story 1.1 Task 5: `Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres`) — do not duplicate or overwrite

- [ ] Task 5 — Create and apply the initial empty migration (AC: #1)
  - [ ] From `backend/src/SiesaAgents.API`: `dotnet ef migrations add InitialCreate --project ../SiesaAgents.Infrastructure --startup-project .`
  - [ ] Verify `backend/src/SiesaAgents.Infrastructure/Migrations/` is created with `*_InitialCreate.cs`, `*_InitialCreate.Designer.cs`, `AppDbContextModelSnapshot.cs` — the migration's `Up()`/`Down()` bodies must be empty (no `MigrationBuilder.CreateTable` calls) since there are no domain entities yet
  - [ ] Run `dotnet ef database update --project ../SiesaAgents.Infrastructure --startup-project .` against a locally running PostgreSQL instance — verify `siesa_agents_db` is created with only the `__ef_migrations_history` table (snake_case columns: `migration_id`, `product_version`)

- [ ] Task 6 — Verify Problem Details middleware compliance (AC: #2)
  - [ ] Confirm `ExceptionHandlingMiddleware` (created in Story 1.1 Task 4) is registered before `UseCors`/endpoint mapping in `Program.cs` — already true, do not reorder
  - [ ] Confirm the middleware's JSON response contains only `status`, `title`, `detail` (already `null`) — no `stackTrace`/`exception` keys — already true, no code change expected here, only verification

- [ ] Task 7 — Backend integration test project (AC: #1, #2, #3)
  - [ ] Create `backend/tests/SiesaAgents.IntegrationTests` (`dotnet new xunit -o backend/tests/SiesaAgents.IntegrationTests`), add to `SiesaAgents.sln` under the existing `tests` solution folder
  - [ ] Add package `Microsoft.AspNetCore.Mvc.Testing` and project reference to `SiesaAgents.API`
  - [ ] `ExceptionHandlingMiddlewareTests.cs` (TC-E1-P0-05): register a test-only minimal endpoint that throws `new Exception("test error")` (map it only when `builder.Environment.IsEnvironment("Testing")`, guarded so it never exists in Development/Production), call it via `WebApplicationFactory<Program>`, assert `Content-Type: application/problem+json`, status 500, body has `status`/`title`/`detail`, and the response body does NOT contain `"stackTrace"`, `"exception"`, or the raw message `"test error"`
  - [ ] `AppDbContextMigrationTests.cs` (TC-E1-P1-05, TC-E1-P2-04): resolve `AppDbContext` from the test host's DI container, assert it can connect (`Database.CanConnectAsync()`) after `dotnet ef database update` has been run locally, and query `information_schema.columns` for `__ef_migrations_history` to assert `migration_id`/`product_version` column names are snake_case — skip/document if no local PostgreSQL is reachable in the execution environment (do not fail the whole suite on infra absence; use a fact-level guard or `TestContainers` if available)

## Dev Notes

### Architecture patterns and constraints

- **No domain entities in this story.** `AppDbContext` has zero `DbSet<>` properties and the `InitialCreate` migration is intentionally empty. `ClienteEntity` (Epic 2 Story 2.1) and `ContactoEntity` (Epic 3 Story 3.1) are explicitly out of scope — do not create them, their configurations, or their repositories here.
- **EF Core 10 + Npgsql** is the ORM per company standards (`Npgsql.EntityFrameworkCore.PostgreSQL` v10.0.2, already installed in `SiesaAgents.Infrastructure` since Story 1.1).
- **`ApplySnakeCaseNaming()` is a custom extension method**, not the `EFCore.NamingConventions` NuGet package. `architecture.md` explicitly documents it as a call made inside `OnModelCreating` (`modelBuilder.ApplySnakeCaseNaming()` as the LAST call) — this story must implement that method itself in `SiesaAgents.Infrastructure/Data/Extensions/ModelBuilderExtensions.cs`. Do not introduce the `EFCore.NamingConventions` package as an alternative; the company standard requires the explicit `OnModelCreating` call form.
- **Primary keys**: `Guid` (UUID) mandatory for all future entities — not exercised in this story (no entities), but the naming/config pattern established here must support it.
- **Timestamps**: `DateTimeOffset` always, never `DateTime` — same note, applies to future entity stories.

### Tech Stack & Libraries

| Package | Project | Status |
|---|---|---|
| `Npgsql.EntityFrameworkCore.PostgreSQL` 10.0.2 | `SiesaAgents.Infrastructure` | Already installed (Story 1.1) |
| `Microsoft.EntityFrameworkCore.Design` | `SiesaAgents.API` | **Add in this story** (Task 1) — required for `dotnet ef` CLI to work with a separate startup project |
| `dotnet-ef` CLI tool | global/local tool | **Verify/install in this story** (Task 1) |
| `Microsoft.AspNetCore.Mvc.Testing` | `SiesaAgents.IntegrationTests` (new) | **Add in this story** (Task 7) |

No UI component work in this story (`{{has_ui_component}}` = false) — pure backend/data-layer infrastructure. No `siesa-ui-kit` requirements apply.

### Code patterns

**`AppDbContext` (`backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`):**

```csharp
using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // No DbSet<> properties yet — domain entities are added starting Epic 2 (ClienteEntity)
    // and Epic 3 (ContactoEntity). Do not add them in this story.

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // MUST remain the last call — converts all EF-managed identifiers to snake_case
        modelBuilder.ApplySnakeCaseNaming();
    }
}
```

**`ModelBuilderExtensions` (`backend/src/SiesaAgents.Infrastructure/Data/Extensions/ModelBuilderExtensions.cs`):**

```csharp
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data.Extensions;

public static class ModelBuilderExtensions
{
    public static void ApplySnakeCaseNaming(this ModelBuilder modelBuilder)
    {
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            entity.SetTableName(ToSnakeCase(entity.GetTableName()!));

            foreach (var property in entity.GetProperties())
                property.SetColumnName(ToSnakeCase(property.GetColumnName()));

            foreach (var key in entity.GetKeys())
                key.SetName(ToSnakeCase(key.GetName()!));

            foreach (var foreignKey in entity.GetForeignKeys())
                foreignKey.SetConstraintName(ToSnakeCase(foreignKey.GetConstraintName()!));

            foreach (var index in entity.GetIndexes())
                index.SetDatabaseName(ToSnakeCase(index.GetDatabaseName()!));
        }
    }

    private static string ToSnakeCase(string input) =>
        Regex.Replace(input, "([a-z0-9])([A-Z])", "$1_$2").ToLowerInvariant();
}
```

**`Program.cs` addition (`backend/src/SiesaAgents.API/Program.cs`):**

```csharp
using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;
// ...existing usings (Scalar, Middleware)

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ...existing CORS registration unchanged

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();  // unchanged — already before UseCors/routing
app.UseStatusCodePages();
app.UseCors("DevCors");
app.MapOpenApi();
app.MapScalarApiReference();
app.Run();
```

`SiesaAgents.API` does not yet reference `SiesaAgents.Infrastructure` directly for DI purposes beyond the existing project reference established in Story 1.1 — the `AddDbContext<AppDbContext>` call above is the only new wiring needed; no additional project reference change required.

### Existing state from Story 1.1 (verify, do not duplicate)

- `ExceptionHandlingMiddleware` (`backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`) already implements the full Problem Details RFC 7807 response (`Content-Type: application/problem+json`, status 500, `Title`, `Detail: null`) and is already registered in `Program.cs` before `UseCors`. AC #2 of this story is a **verification**, not new implementation — add the integration test (Task 7) to lock in the behavior, but do not rewrite the middleware unless the test reveals a defect.
- `appsettings.Development.json` already has `ConnectionStrings:DefaultConnection` = `Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres` and `AllowedOrigins`. Only add to this file if a new key is genuinely required (none is expected in this story).
- `SiesaAgents.Domain` and `SiesaAgents.Application` currently contain only their `.csproj` files (no code) — this story does not add anything to them.

### Local environment note

- PostgreSQL 16 is installed in this environment but the cluster is stopped by default (`pg_lsclusters` showed `16 main 5432 down`). The developer/agent implementing this story must start it before running `dotnet ef database update` — e.g. `sudo service postgresql start` or `pg_ctlcluster 16 main start` — and ensure a `postgres` role/password matching the connection string exists.

### Project Structure Notes

- New files live under `backend/src/SiesaAgents.Infrastructure/Data/` (`AppDbContext.cs`, `Extensions/ModelBuilderExtensions.cs`, `Migrations/`) and `backend/src/SiesaAgents.API/Program.cs` (modified), matching the tree documented in `architecture.md#Complete Project Directory Structure`.
- New test project `backend/tests/SiesaAgents.IntegrationTests/` matches the `SiesaAgents.IntegrationTests` folder already documented in `architecture.md`'s directory tree (previously undelivered — Story 1.1 only created `SiesaAgents.UnitTests`).
- No frontend changes in this story.

### References

- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3]
- Database/EF Core decisions: [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules] and [#Naming Patterns]
- Complete backend directory structure (`AppDbContext.cs`, `Migrations/`, `SiesaAgents.IntegrationTests`): [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Problem Details / NFR6: [Source: _bmad-output/planning-artifacts/architecture.md#Error handling — backend] and [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3]
- Test plan for this story (TC-E1-P0-05, TC-E1-P1-05, TC-E1-P2-04): [Source: _bmad-output/implementation-artifacts/test-design-epic-1.md#4. Test Cases by Priority] and [#10. Notes for Story Implementation Agents]
- Previous story state (`ExceptionHandlingMiddleware`, `appsettings.Development.json`, `Npgsql.EntityFrameworkCore.PostgreSQL` install): [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#Dev Notes] and [#File List]
- Company stack/database standards: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions (PostgreSQL)] and [#Backend Stack]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

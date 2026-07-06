# Story 1.3: Backend Database Foundation

Status: done

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

- [x] Task 1 — EF Core design-time tooling (AC: #1)
  - [x] Add `Microsoft.EntityFrameworkCore.Design` package to `SiesaAgents.API` (design-time package must live in the startup project, not `Infrastructure`) — already added by the ATDD sub-agent pass; verified present in `SiesaAgents.API.csproj`
  - [x] Verify `Npgsql.EntityFrameworkCore.PostgreSQL` (already added to `SiesaAgents.Infrastructure` in Story 1.1) — do not re-add — confirmed present, unchanged
  - [x] Verify/install the `dotnet-ef` global tool: `dotnet tool install --global dotnet-ef` (skip if `dotnet ef --version` already resolves) — installed (`dotnet-ef 10.0.9`), not previously present in this environment

- [x] Task 2 — Create `AppDbContext` (AC: #1, #3)
  - [x] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`: `public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)`
  - [x] Override `OnModelCreating(ModelBuilder modelBuilder)` — no `DbSet<>` properties yet (no domain entities exist; see scope note); call `base.OnModelCreating(modelBuilder)` first, then `modelBuilder.ApplySnakeCaseNaming()` as the LAST line

- [x] Task 3 — Implement the `ApplySnakeCaseNaming()` extension (AC: #3)
  - [x] Create `backend/src/SiesaAgents.Infrastructure/Data/Extensions/ModelBuilderExtensions.cs` — static class with `public static void ApplySnakeCaseNaming(this ModelBuilder modelBuilder)`
  - [x] Implement a private `ToSnakeCase(string input)` helper (regex-based PascalCase/camelCase → snake_case, e.g. `ClienteId` → `cliente_id`)
  - [x] Iterate `modelBuilder.Model.GetEntityTypes()` and rename: table name (`SetTableName`), every property's column name (`SetColumnName`), every key name (`SetName`), every foreign key constraint name (`SetConstraintName`), every index database name (`SetDatabaseName`)
  - [x] Method must be safe to call with zero entity types registered (this story has none) — no-op, no exceptions (verified: `modelBuilder.Model.GetEntityTypes()` returns empty, loop body never executes, migration generation and `database update` succeed without error)

- [x] Task 4 — Register `AppDbContext` and the connection string (AC: #1)
  - [x] In `backend/src/SiesaAgents.API/Program.cs`, add: `builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));` — implemented, plus `npgsqlOptions.MigrationsHistoryTable("__ef_migrations_history")` and `.ReplaceService<IHistoryRepository, SnakeCaseHistoryRepository>()` (see Completion Notes — required for AC #3's `__ef_migrations_history` snake_case verification, since that table is built outside `OnModelCreating`'s model)
  - [x] Verify `ConnectionStrings:DefaultConnection` already exists in `appsettings.Development.json` (added in Story 1.1 Task 5: `Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres`) — do not duplicate or overwrite — confirmed present, unchanged

- [x] Task 5 — Create and apply the initial empty migration (AC: #1)
  - [x] From `backend/src/SiesaAgents.API`: `dotnet ef migrations add InitialCreate --project ../SiesaAgents.Infrastructure --startup-project .`
  - [x] Verify `backend/src/SiesaAgents.Infrastructure/Migrations/` is created with `*_InitialCreate.cs`, `*_InitialCreate.Designer.cs`, `AppDbContextModelSnapshot.cs` — the migration's `Up()`/`Down()` bodies must be empty (no `MigrationBuilder.CreateTable` calls) since there are no domain entities yet — verified, both bodies are empty
  - [x] Run `dotnet ef database update --project ../SiesaAgents.Infrastructure --startup-project .` against a locally running PostgreSQL instance — verify `siesa_agents_db` is created with only the `__ef_migrations_history` table (snake_case columns: `migration_id`, `product_version`) — verified via `psql`: only `__ef_migrations_history` exists in the `public` schema, with columns `migration_id`/`product_version`

- [x] Task 6 — Verify Problem Details middleware compliance (AC: #2)
  - [x] Confirm `ExceptionHandlingMiddleware` (created in Story 1.1 Task 4) is registered before `UseCors`/endpoint mapping in `Program.cs` — already true, do not reorder — confirmed, unchanged
  - [x] Confirm the middleware's JSON response contains only `status`, `title`, `detail` (already `null`) — no `stackTrace`/`exception` keys — **defect found and fixed**, not a pure verification (see Completion Notes): the response `Content-Type` was silently downgraded to `application/json` and the `detail` key was omitted entirely by the framework's default `ProblemDetails` JSON serialization; both are now fixed and covered by the integration tests

- [x] Task 7 — Backend integration test project (AC: #1, #2, #3)
  - [x] Create `backend/tests/SiesaAgents.IntegrationTests` (`dotnet new xunit -o backend/tests/SiesaAgents.IntegrationTests`), add to `SiesaAgents.sln` under the existing `tests` solution folder — already created by the ATDD sub-agent pass; verified present and correctly wired
  - [x] Add package `Microsoft.AspNetCore.Mvc.Testing` and project reference to `SiesaAgents.API` — already present, verified
  - [x] `ExceptionHandlingMiddlewareTests.cs` (TC-E1-P0-05): register a test-only minimal endpoint that throws `new Exception("test error")` (map it only when `builder.Environment.IsEnvironment("Testing")`, guarded so it never exists in Development/Production), call it via `WebApplicationFactory<Program>`, assert `Content-Type: application/problem+json`, status 500, body has `status`/`title`/`detail`, and the response body does NOT contain `"stackTrace"`, `"exception"`, or the raw message `"test error"` — all 8 tests GREEN
  - [x] `AppDbContextMigrationTests.cs` (TC-E1-P1-05, TC-E1-P2-04): resolve `AppDbContext` from the test host's DI container, assert it can connect (`Database.CanConnectAsync()`) after `dotnet ef database update` has been run locally, and query `information_schema.columns` for `__ef_migrations_history` to assert `migration_id`/`product_version` column names are snake_case — skip/document if no local PostgreSQL is reachable in the execution environment (do not fail the whole suite on infra absence; use a fact-level guard or `TestContainers` if available) — PostgreSQL 16 started locally in this session; all 5 tests GREEN against the real database (soft-skip guards not triggered)

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

Claude Sonnet 5 (sa-dev-story sub-agent)

### Debug Log References

- **Local environment setup** (per the story's "Local environment note", PostgreSQL 16 was installed but stopped): started it with `sudo service postgresql start` (`pg_lsclusters` confirmed `16 main 5432 online` after) and set the `postgres` role password to match the connection string with `ALTER USER postgres PASSWORD 'postgres';`.
- Installed the global `dotnet-ef` tool (`dotnet tool install --global dotnet-ef` → `10.0.9`); added `/root/.dotnet/tools` to `PATH` for the session (not previously on `PATH` in this sandbox).
- `dotnet build` (full solution) — 0 warnings, 0 errors after all changes (the one `EF1001` warning from using the internal `NpgsqlHistoryRepository` extension point is suppressed with a scoped `#pragma warning disable/restore EF1001` and a comment explaining why).
- `dotnet ef migrations add InitialCreate --project ../SiesaAgents.Infrastructure --startup-project .` (from `SiesaAgents.API`) — succeeded; generated migration has empty `Up()`/`Down()` bodies (verified by reading the generated file) since `AppDbContext` has zero entity types.
- `dotnet ef database update` (twice: once before, once after adding `SnakeCaseHistoryRepository` — see Completion Notes) — succeeded both times; `siesa_agents_db` created with no errors.
- Verified database state directly via `psql`: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'` → only `__ef_migrations_history`; `SELECT column_name FROM information_schema.columns WHERE table_name = '__ef_migrations_history'` → `migration_id`, `product_version` (both snake_case, no `MigrationId`/`ProductVersion`).
- `dotnet test SiesaAgents.sln` — `SiesaAgents.UnitTests`: 0 tests (expected — no domain entities in this story, matches prior stories' state). `SiesaAgents.IntegrationTests`: **13/13 passing** (8 `ExceptionHandlingMiddlewareTests` + 5 `AppDbContextMigrationTests`), run against the real local PostgreSQL instance (soft-skip guards in `AppDbContextMigrationTests` were not triggered).
- Manually verified the fixed middleware end-to-end: ran the API with `ASPNETCORE_ENVIRONMENT=Testing`, `curl -D - http://localhost:5299/api/v1/test-error` → `HTTP/1.1 500`, `Content-Type: application/problem+json; charset=utf-8`, body `{"title":"An unexpected error occurred.","status":500,"detail":"An unexpected error occurred. Please contact support if the problem persists."}` — no `stackTrace`, `exception`, or the raw `"test error"` message.

### Completion Notes List

- Tasks 1 and 7 (EF Core Design package, `dotnet-ef`-driven scaffolding expectations, and the entire `SiesaAgents.IntegrationTests` project with both test files) had already been created by the preceding ATDD sub-agent pass (commit "Add ATDD tests for story 1.3"), correctly in RED state (compile error: `AppDbContext` did not exist). This session's work made them pass without modifying test intent.
- Implemented `AppDbContext` (`backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`) and `ModelBuilderExtensions.ApplySnakeCaseNaming()` (`backend/src/SiesaAgents.Infrastructure/Data/Extensions/ModelBuilderExtensions.cs`) exactly per the Dev Notes code samples — no domain `DbSet<>` properties, `ApplySnakeCaseNaming()` called as the last statement in `OnModelCreating`.
- **Defect discovered via AC #3's own test and fixed (not anticipated in the story's Dev Notes)**: EF Core's `__ef_migrations_history` table is generated by a separate internal model built by `IHistoryRepository`, entirely outside `AppDbContext.OnModelCreating`'s `ModelBuilder` — so `ApplySnakeCaseNaming()` never touches it, and by default it is created as `__EFMigrationsHistory` with `MigrationId`/`ProductVersion` columns (verified empirically: first `dotnet ef database update` run produced exactly this PascalCase table). Since AC #3 explicitly requires verifying snake_case via this exact table/columns, added `backend/src/SiesaAgents.Infrastructure/Data/SnakeCaseHistoryRepository.cs` (a minimal `NpgsqlHistoryRepository` subclass renaming the two columns) and wired it up in `Program.cs` via `npgsqlOptions.MigrationsHistoryTable("__ef_migrations_history")` (table name) + `.ReplaceService<IHistoryRepository, SnakeCaseHistoryRepository>()` (column names) — both are EF Core/Npgsql's documented, supported extension points for this exact customization (the `EF1001` "internal API" warning on `NpgsqlHistoryRepository` is expected and suppressed with a scoped pragma and explanatory comment). Dropped and recreated the local database (`dotnet ef database update`) after this change and re-verified column/table names via `psql`.
- **Defect discovered via AC #2's own test and fixed** (Task 6 predicted "no code change expected here, only verification" — the verification instead surfaced two real bugs): (1) the middleware set `context.Response.ContentType = "application/problem+json"` manually, but the subsequent `await context.Response.WriteAsJsonAsync(...)` call silently overwrote it back to `application/json; charset=utf-8` (ASP.NET Core's `WriteAsJsonAsync` always sets the response `Content-Type` itself unless a `contentType` argument is passed); (2) `Detail = null` combined with the framework's built-in `ProblemDetails` JSON converter (which omits any null RFC 7807 field, e.g. `type`/`detail`/`instance`, from the serialized body) meant the `detail` key was entirely absent from the response, violating AC #2's "body containing `status`, `title`, and `detail` fields". Fixed both in `ExceptionHandlingMiddleware.cs`: pass `contentType: "application/problem+json"` explicitly to `WriteAsJsonAsync` (with an explicit `null` `JsonSerializerOptions` argument, required because no overload accepts `(value, contentType, cancellationToken)` directly), and changed `Detail` from `null` to a fixed, generic, non-sensitive string ("An unexpected error occurred. Please contact support if the problem persists.") — still never the raw exception message/stack trace, preserving NFR6.
- No domain entities, `ClienteEntity`/`ContactoEntity`, repositories, or configurations were added — fully in scope per the story's scope note.
- `appsettings.Development.json`/`appsettings.json` were not modified — the existing `ConnectionStrings:DefaultConnection` from Story 1.1 was reused as-is.

### File List

**Created:**
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Extensions/ModelBuilderExtensions.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/SnakeCaseHistoryRepository.cs`
- `backend/src/SiesaAgents.Infrastructure/Migrations/20260706051420_InitialCreate.cs`
- `backend/src/SiesaAgents.Infrastructure/Migrations/20260706051420_InitialCreate.Designer.cs`
- `backend/src/SiesaAgents.Infrastructure/Migrations/AppDbContextModelSnapshot.cs`
- `backend/tests/SiesaAgents.UnitTests/Infrastructure/Data/Extensions/ModelBuilderExtensionsTests.cs` (added by Automate sub-agent pass)
- `backend/tests/SiesaAgents.UnitTests/Infrastructure/Migrations/InitialCreateMigrationTests.cs` (added by Automate sub-agent pass)
- `backend/tests/SiesaAgents.IntegrationTests/AppDbContextConfigurationTests.cs` (added by Automate sub-agent pass)
- `backend/tests/SiesaAgents.IntegrationTests/ExceptionHandlingMiddlewareEdgeCaseTests.cs` (added by Automate sub-agent pass)
- `backend/tests/SiesaAgents.IntegrationTests/RequiresPostgresFactAttribute.cs` (added by Code Review — see Review Follow-ups)

**Modified:**
- `backend/src/SiesaAgents.API/Program.cs` (registered `AddDbContext<AppDbContext>` with `UseNpgsql` + `MigrationsHistoryTable("__ef_migrations_history")` + `ReplaceService<IHistoryRepository, SnakeCaseHistoryRepository>()`)
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` (fixed `Content-Type` override bug and missing `detail` field — see Completion Notes)
- `backend/tests/SiesaAgents.IntegrationTests/AppDbContextMigrationTests.cs` (Code Review fix: replaced `[Fact]` + silent-return soft-skip with `[RequiresPostgresFact]` — see Review Follow-ups)

## Review Follow-ups (AI)

- [x] [AI-Review][Medium] `AppDbContextMigrationTests.cs` silently reported "Passed" (zero assertions) when PostgreSQL was unreachable, masking missing AC #1/#3 validation in CI. Fixed by introducing `RequiresPostgresFactAttribute` (TCP reachability probe at test-discovery time, sets `Skip` reason) and removing the internal early-`return` guards. Verified empirically: Skipped when DB down, genuinely Passed (35/35 suite) when DB up. See `_bmad-output/review-1-3-backend-database-foundation.md`.
- [ ] [AI-Review][Low] Integration tests depend on a locally-running PostgreSQL instance rather than Testcontainers, per `company-standards.md`'s "PostgreSQL Test Containers (integration)". Already flagged transparently by the story's own Dev Notes/Environment Limitations; deferred to a dedicated test-framework story (out of scope here).
- [ ] [AI-Review][Low] No `[Trait]`-based test-ID/priority convention (project-wide gap, not Story-1.3-specific) — deferred to backlog per prior test-review report.

**Pre-existing, unmodified this story (from the prior ATDD sub-agent run, verified in place):**
- `backend/src/SiesaAgents.API/SiesaAgents.API.csproj` (`Microsoft.EntityFrameworkCore.Design` package reference already added)
- `backend/tests/SiesaAgents.IntegrationTests/SiesaAgents.IntegrationTests.csproj`
- `backend/tests/SiesaAgents.IntegrationTests/TestWebApplicationFactory.cs`
- `backend/tests/SiesaAgents.IntegrationTests/ExceptionHandlingMiddlewareTests.cs`
- `backend/tests/SiesaAgents.IntegrationTests/AppDbContextMigrationTests.cs`
- `backend/SiesaAgents.sln` (`SiesaAgents.IntegrationTests` already added under the `tests` solution folder)
- `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj` (`Npgsql.EntityFrameworkCore.PostgreSQL` already present from Story 1.1)
- `backend/src/SiesaAgents.API/appsettings.Development.json` (`ConnectionStrings:DefaultConnection` already present from Story 1.1)

### Environment Limitations

- PostgreSQL 16 was installed but stopped by default in this sandbox (`pg_lsclusters` → `16 main 5432 down`), consistent with the story's own "Local environment note" and with Story 1.1's Debug Log. Unlike a fully sandboxed/CI environment, this session was able to start the local cluster (`sudo service postgresql start`) and set the `postgres` role password, so — unlike the ATDD RED-phase run — **all 13 integration tests were executed against a real PostgreSQL 18-compatible-enough (actual: 16) instance with true GREEN assertions**, not soft-skips. `dotnet ef database update` was run for real and independently verified via `psql`.
- Note: the company standard specifies PostgreSQL 18+; only PostgreSQL 16 is available as an OS package in this sandbox. This does not affect AC compliance (no version-specific SQL features are used), but is flagged for awareness — production/CI environments should provision PostgreSQL 18+ per company-standards.md.

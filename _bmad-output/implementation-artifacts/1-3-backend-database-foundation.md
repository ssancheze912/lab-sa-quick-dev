# Story 1.3: Backend Database Foundation

Status: in-progress

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

## Acceptance Criteria

1. **Given** PostgreSQL 18+ is running locally with the connection string from `appsettings.Development.json` (`Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres`), **When** the developer runs `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` from `backend/`, **Then** the `siesa_agents_db` database is created (if absent) and the EF Core history table `__ef_migrations_history` is created in it with snake_case columns (`migration_id`, `product_version`) — no domain tables are created in this story (TC-E1-P1-05, AC-1.3.a, AC-1.3.b).

2. **Given** the `SiesaAgents.Infrastructure` project, **When** the initial migration is added via `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`, **Then** the `backend/src/SiesaAgents.Infrastructure/Data/Migrations/` folder exists with the generated `*_InitialCreate.cs`, the `*_InitialCreate.Designer.cs`, and `AppDbContextModelSnapshot.cs` files; the migration body is empty (no `CreateTable` / `CreateIndex` calls — no `clientes`, no `contactos`) (AC-1.3.b, scope-note from epic).

3. **Given** the API is running, **When** any handler throws an unhandled exception that reaches `ExceptionHandlingMiddleware` (covered by a single registered test-only endpoint `MapGet("/api/v1/test-error", ...)` mounted ONLY when `app.Environment.IsDevelopment()` is `true`), **Then** the response status is `500`, `Content-Type` is exactly `application/problem+json`, the JSON body conforms to RFC 7807 with at minimum `status`, `title`, `type`, `instance` (and optionally `detail` as a generic string), and the body MUST NOT contain `stackTrace`, `exception`, `innerException`, or the raw `Exception.Message` (NFR6, AC-1.3.c, TC-E1-P0-05).

4. **Given** `AppDbContext` is constructed by the API and any tooling command, **When** EF Core invokes `OnModelCreating(ModelBuilder modelBuilder)`, **Then** the LAST call in that method is `modelBuilder.ApplySnakeCaseNaming()` (a small extension method shipped in this story under `SiesaAgents.Infrastructure.Data.Extensions`) that converts every entity table name, column name, key name, foreign key name, and index name from PascalCase to lower `snake_case`; verified by querying `information_schema.columns` against the `__ef_migrations_history` table and asserting all column names match `^[a-z0-9_]+$` (AC-1.3.d, TC-E1-P2-04).

5. **Given** the `SiesaAgents.Infrastructure` project, **When** `dotnet build` runs, **Then** the project compiles with zero errors / zero warnings under `<Nullable>enable</Nullable>`, and the following are wired exactly once in DI inside `Program.cs` via `builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")))` — the EF Core design-time tooling package `Microsoft.EntityFrameworkCore.Design` is added to `SiesaAgents.API` (per Microsoft guidance, design-time packages are added to the startup project), and `Npgsql.EntityFrameworkCore.PostgreSQL` (already present from Story 1.1) is consumed from `SiesaAgents.Infrastructure`.

6. **Given** the `SiesaAgents.UnitTests` project, **When** `dotnet test` runs, **Then** the following xUnit tests pass:
   - A unit test asserting that `AppDbContext` derives from `DbContext` and exposes a public parameterless-friendly constructor accepting `DbContextOptions<AppDbContext>`.
   - A unit test asserting that `ModelBuilder.ApplySnakeCaseNaming()` converts a sample entity's PascalCase property names to snake_case (in-memory `ModelBuilder` — no DB required).
   - An integration test (`Microsoft.AspNetCore.Mvc.Testing` + `WebApplicationFactory<Program>`) verifying that hitting the dev-only `/api/v1/test-error` endpoint returns a Problem Details body that satisfies AC #3 (status 500, content-type `application/problem+json`, no leaked exception fields).
   - The integration test runs without requiring a live PostgreSQL — for AC #3 the test does NOT need the DB; the DB-touching test for AC #1/#2/#4 (`dotnet ef database update` + `information_schema` inspection) is the QA-owned `TC-E1-P1-05` / `TC-E1-P2-04` and lives in `tests/SiesaAgents.IntegrationTests/` using TestContainers-Postgres (mark this integration suite as `[Trait("Category", "Db")]` so CI can opt-in).

7. **Given** the `SiesaAgents.Infrastructure.csproj`, **When** project references are audited, **Then** `SiesaAgents.Infrastructure` references ONLY `SiesaAgents.Domain` (per Clean Architecture: Infrastructure implements Domain interfaces; Application is NOT a reference target of Infrastructure). The pre-existing `Application → Infrastructure` reference from Story 1.1 review item [AI-Review][HIGH] is corrected as part of this story by removing the `<ProjectReference Include="..\SiesaAgents.Application\SiesaAgents.Application.csproj" />` line from `SiesaAgents.Infrastructure.csproj`. Any cross-layer abstractions are kept in `SiesaAgents.Application` as interfaces; `SiesaAgents.Infrastructure` does not depend on them in this story because no repository is being implemented yet (deferred to Epic 2 Story 2.1).

## Tasks / Subtasks

- [ ] Task 1 — Add EF Core design-time tooling to API and clean Infrastructure references (AC: #5, #7)
  - [ ] In `backend/src/SiesaAgents.API/SiesaAgents.API.csproj`, add `<PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="10.0.*" />` (with `PrivateAssets="all"` per Microsoft tooling guidance).
  - [ ] In `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj`, REMOVE the `<ProjectReference Include="..\SiesaAgents.Application\SiesaAgents.Application.csproj" />` line. Keep ONLY the reference to `SiesaAgents.Domain`. (Closes Story 1.1 review item AI-Review[HIGH] "Infrastructure → Application project reference violates Clean Architecture".)
  - [ ] `dotnet build backend/SiesaAgents.slnx` — must exit 0 with no warnings.

- [ ] Task 2 — Create `AppDbContext` and the snake_case naming extension (AC: #4, #5)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` with `public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)`. No `DbSet<...>` properties yet (none until Epic 2 / 3).
  - [ ] Override `OnModelCreating(ModelBuilder modelBuilder)`. Body: `base.OnModelCreating(modelBuilder);` then `modelBuilder.ApplySnakeCaseNaming();` as the LAST call.
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Extensions/ModelBuilderSnakeCaseExtensions.cs` with `public static ModelBuilder ApplySnakeCaseNaming(this ModelBuilder modelBuilder)`. Implementation iterates `modelBuilder.Model.GetEntityTypes()` and rewrites:
    - `entity.SetTableName(ToSnakeCase(entity.GetTableName()!))`
    - For each `property` in `entity.GetProperties()`: `property.SetColumnName(ToSnakeCase(property.GetColumnName()))`.
    - For each `key`: `key.SetName(ToSnakeCase(key.GetName()!))`.
    - For each `foreignKey`: `foreignKey.SetConstraintName(ToSnakeCase(foreignKey.GetConstraintName()!))`.
    - For each `index`: `index.SetDatabaseName(ToSnakeCase(index.GetDatabaseName()!))`.
    - Local `private static string ToSnakeCase(string input)` — insert `_` before each uppercase letter that is preceded by a lowercase letter or digit, then `.ToLowerInvariant()`. Empty / null guard returns input.
  - [ ] Add `namespace SiesaAgents.Infrastructure.Data;` and `namespace SiesaAgents.Infrastructure.Data.Extensions;` respectively.

- [ ] Task 3 — Wire EF Core into the API DI container (AC: #5)
  - [ ] In `backend/src/SiesaAgents.API/Program.cs`, after `builder.Services.AddCors(...)` and before `var app = builder.Build();`, add:
    ```csharp
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
    ```
  - [ ] Add `using SiesaAgents.Infrastructure.Data;` and `using Microsoft.EntityFrameworkCore;` at the top of `Program.cs`.
  - [ ] Verify `appsettings.Development.json` has `ConnectionStrings:DefaultConnection` set (already present from Story 1.1 — `Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres`).
  - [ ] Add a default placeholder `ConnectionStrings:DefaultConnection` to `appsettings.json` (production placeholder, e.g. empty string with a comment field), so `Configuration.GetConnectionString` never returns `null` in non-Dev environments and EF tooling resolves cleanly. Do NOT commit real production credentials.

- [ ] Task 4 — Create the empty initial migration (AC: #1, #2)
  - [ ] From `backend/`, run:
    ```
    dotnet ef migrations add InitialCreate \
      --project src/SiesaAgents.Infrastructure \
      --startup-project src/SiesaAgents.API \
      --output-dir Data/Migrations
    ```
  - [ ] Verify the produced `Data/Migrations/{timestamp}_InitialCreate.cs` `Up(MigrationBuilder migrationBuilder)` body is empty (no `CreateTable` calls). If the generator emits `CreateTable("__EFMigrationsHistory", ...)` it will be ignored because the history table is managed automatically; otherwise the body should be a no-op.
  - [ ] Verify `Data/Migrations/AppDbContextModelSnapshot.cs` is generated.
  - [ ] Run `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` against the local Postgres. Expected: `siesa_agents_db` exists; `__ef_migrations_history` exists with rows referencing `InitialCreate`. No `clientes`, no `contactos` tables.

- [ ] Task 5 — Add dev-only test-error endpoint and harden Problem Details middleware (AC: #3, #6)
  - [ ] In `backend/src/SiesaAgents.API/Program.cs`, mount the test-error endpoint INSIDE an `if (app.Environment.IsDevelopment())` block, after `app.MapScalarApiReference();`:
    ```csharp
    if (app.Environment.IsDevelopment())
    {
        app.MapGet("/api/v1/test-error", () =>
        {
            throw new InvalidOperationException("Forced failure for Problem Details smoke test.");
        });
    }
    ```
  - [ ] Review existing `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` — confirm it ALREADY satisfies AC #3: `Status = 500`, `Type` set to RFC 7231 link, `Instance` set to request path, body serialized with `contentType: "application/problem+json"`, NO `Detail` field carrying `ex.Message`, exception logged via `ILogger` only. If anything is missing, fix it. Do NOT swallow exceptions silently — the existing `logger.LogError(ex, ...)` is mandatory.

- [ ] Task 6 — Unit + integration tests (AC: #6)
  - [ ] In `backend/tests/SiesaAgents.UnitTests/`, add `Data/AppDbContextTests.cs`:
    - `[Fact] AppDbContext_HasOptionsConstructor` — uses reflection or a direct call with `new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase("test").Options` to instantiate; assert it derives from `DbContext`. (Add `Microsoft.EntityFrameworkCore.InMemory` package to UnitTests project for this.)
  - [ ] In `backend/tests/SiesaAgents.UnitTests/`, add `Data/Extensions/ModelBuilderSnakeCaseExtensionsTests.cs`:
    - `[Theory]` table-driven cases — `"Cliente"` → `"cliente"`, `"ClienteEntity"` → `"cliente_entity"`, `"NIT"` → `"nit"`, `"CreatedAt"` → `"created_at"`, `"ID"` → `"id"`, `"id"` → `"id"`, `""` → `""`. (Tests can target the `ToSnakeCase` helper indirectly via a tiny throwaway entity registered on an `InMemory` `ModelBuilder` and reading back `GetColumnName()`, OR by making `ToSnakeCase` `internal` and adding `[assembly: InternalsVisibleTo("SiesaAgents.UnitTests")]` to `SiesaAgents.Infrastructure`. Choose the assembly-attribute path for clarity.)
  - [ ] Create `backend/tests/SiesaAgents.IntegrationTests/SiesaAgents.IntegrationTests.csproj` (xUnit + `Microsoft.AspNetCore.Mvc.Testing`). Add to `SiesaAgents.slnx`. Reference `SiesaAgents.API`.
  - [ ] In `SiesaAgents.IntegrationTests`, add `ProblemDetailsTests.cs` (`[Trait("Category", "Api")]`):
    - Boot the API with `WebApplicationFactory<Program>` and `UseEnvironment("Development")`.
    - `GET /api/v1/test-error`; assert `response.StatusCode == 500`, `response.Content.Headers.ContentType?.MediaType == "application/problem+json"`, and the body parsed as JSON has `status`, `title`, `type`, `instance` and does NOT contain `stackTrace`, `exception`, `innerException`, or the literal `"Forced failure for Problem Details smoke test."`.
  - [ ] (QA-owned, this story files the failing-by-design DB test as `[Trait("Category", "Db")] [Fact(Skip = "Requires local PostgreSQL — run manually or via CI with TestContainers")]` placeholder) — `MigrationCreatesDbTests.cs` shape:
    - On a TestContainers-Postgres or local DB, run `await using var ctx = new AppDbContext(opts); await ctx.Database.MigrateAsync();` and query `information_schema.tables` (`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`) — expect at minimum `__ef_migrations_history` and zero domain tables.
    - Query `information_schema.columns` for `__ef_migrations_history` and assert every column name matches the regex `^[a-z0-9_]+$` (AC #4 verification — TC-E1-P2-04).
  - [ ] `dotnet test backend/SiesaAgents.slnx --filter "Category!=Db"` — must be green locally without a DB. Full `dotnet test` (including `Db`) is QA / CI gated.

- [ ] Task 7 — Documentation & cleanup
  - [ ] Update `backend/README.md` (create if missing) with the three EF Core commands for new developers: `dotnet ef database update`, `dotnet ef migrations add <Name>`, and the connection string override path for staging/prod (env var `ConnectionStrings__DefaultConnection`).
  - [ ] Verify `dotnet build backend/SiesaAgents.slnx` and `dotnet test backend/SiesaAgents.slnx --filter "Category!=Db"` both exit 0.
  - [ ] Update File List below.

## Dev Notes

### Architecture Pattern — Clean Architecture (backend, layered)

This story lives in the **infrastructure** layer (`SiesaAgents.Infrastructure`) plus minimal DI wiring in the **API host** (`SiesaAgents.API`). Per company standards Clean Architecture diagram, the dependency direction is:

```
SiesaAgents.API ──► SiesaAgents.Application ──► SiesaAgents.Domain
       │                                              ▲
       └────► SiesaAgents.Infrastructure ─────────────┘
```

`SiesaAgents.Infrastructure` MUST reference ONLY `SiesaAgents.Domain`. Story 1.1 introduced an extra `Application` reference in `Infrastructure.csproj` that was flagged in the code review as `[AI-Review][HIGH]` — this story closes that finding by removing it (Task 1). No repositories are added in this story (deferred to Epic 2 Story 2.1), so no Application interfaces are needed yet.

[Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Architecture: Clean Architecture + DDD (Frontend & Backend)`]
[Source: `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure`]
[Source: `_bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#Review Follow-ups (AI)` — AI-Review[HIGH] entry]

### EF Core 10 + PostgreSQL 18 Wiring

**Packages already present (Story 1.1):**
- `SiesaAgents.Infrastructure` → `Npgsql.EntityFrameworkCore.PostgreSQL` v10.0.2

**Packages to add in this story:**
- `SiesaAgents.API` → `Microsoft.EntityFrameworkCore.Design` (matching v10.0.*). EF Core tooling guidance: the **design-time package belongs in the startup project**, not the project that owns the `DbContext`. This lets `dotnet ef` resolve `Program` for host bootstrapping.
- `SiesaAgents.UnitTests` → `Microsoft.EntityFrameworkCore.InMemory` (for `AppDbContext` instantiation tests — no real DB).

**Migrations output directory:** `Data/Migrations/` inside `SiesaAgents.Infrastructure`. The `--output-dir Data/Migrations` flag on `dotnet ef migrations add` is what places the generated files there (otherwise they default to a top-level `Migrations/` folder). The architecture spec mandates `Data/` for the DbContext and `Data/Configurations/` for `IEntityTypeConfiguration<T>` files (added in Epic 2 / 3, not here).

[Source: `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure` lines 575–582]
[Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Backend Stack` + `#Database Conventions (PostgreSQL)`]

### `ApplySnakeCaseNaming()` Implementation Contract

Company standards mandate this extension exist (`#Database Conventions` → "EF Core: Automatic snake_case via `ApplySnakeCaseNaming()` — NO manual `[Column]`/`[Table]` attributes"). It is NOT shipped by EF Core or by `Npgsql.EntityFrameworkCore.PostgreSQL`; we ship our own thin extension in `Data/Extensions/ModelBuilderSnakeCaseExtensions.cs`.

**Regex-free snake_case rule** (avoids `System.Text.RegularExpressions` overhead and is deterministic for the entity-name shapes we use):

```csharp
private static string ToSnakeCase(string input)
{
    if (string.IsNullOrEmpty(input)) return input;
    var sb = new StringBuilder(input.Length + 8);
    for (int i = 0; i < input.Length; i++)
    {
        var c = input[i];
        if (i > 0 && char.IsUpper(c) && (char.IsLower(input[i - 1]) || char.IsDigit(input[i - 1])))
        {
            sb.Append('_');
        }
        sb.Append(char.ToLowerInvariant(c));
    }
    return sb.ToString();
}
```

Handles the architecture-spec examples (line 326 of `architecture.md`):
- `ClienteEntity` → `cliente_entity` (per architecture line 322, the EF map for `ClienteEntity` is `clientes` — explicit `SetTableName("clientes")` will be configured per-entity in Epic 2; this extension only handles the default PascalCase → snake_case fallback).
- `ID` → `id` (no underscore, contiguous uppercase stays glued — matches the architecture comment `public Guid ID → column: id`).
- `ClienteID` → `cliente_id`.
- `CreatedAt` → `created_at`.

This extension MUST run LAST in `OnModelCreating` so it can rename already-applied per-entity `SetTableName("clientes")` overrides as `clientes` (already lowercase snake_case — idempotent) and rewrite all default PascalCase columns.

[Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions (PostgreSQL)`]
[Source: `_bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules` lines 299–327]
[Source: `_bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines` line 417 — "Apply `modelBuilder.ApplySnakeCaseNaming()` last in `OnModelCreating`"]

### Problem Details RFC 7807 (NFR6 — AC #3)

The existing `ExceptionHandlingMiddleware` (Story 1.1, `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`) already conforms to the contract:

- Catches `Exception ex`, logs via `ILogger<ExceptionHandlingMiddleware>`, never throws.
- Returns HTTP `500`.
- Serializes a `ProblemDetails` object with `Status`, `Title = "An unexpected error occurred."`, `Type` (RFC 7231 link), `Instance = context.Request.Path`.
- Uses `WriteAsJsonAsync(..., contentType: "application/problem+json")` — the explicit content-type is critical because the default `WriteAsJsonAsync` uses `application/json` and AC #3 demands `application/problem+json` exactly.
- Does NOT include `Detail` (which would be the place where `ex.Message` could leak) — kept null per Story 1.1 implementation. **DO NOT** add `Detail = ex.Message` in this story.

Story 1.1 also wired `UseStatusCodePages` for status-only responses (404, etc.) — that path also returns `application/problem+json` and does not require changes in this story.

This story ADDS:
- A dev-only `MapGet("/api/v1/test-error", ...)` endpoint that throws, so QA's `TC-E1-P0-05` integration test can drive the middleware end-to-end. The endpoint MUST be gated by `app.Environment.IsDevelopment()` so it never ships to production.

[Source: `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` (current)]
[Source: `backend/src/SiesaAgents.API/Program.cs` (current — has `UseStatusCodePages` for non-thrown 404s)]
[Source: `_bmad-output/planning-artifacts/implementation-readiness-report-2026-03-13.md` — NFR6 commitment]
[Source: `_bmad-output/implementation-artifacts/test-design-epic-1.md#TC-E1-P0-05`]

### Test Strategy & TEA Traceability

| Test ID | Level | AC | Owner | Notes |
|---|---|---|---|---|
| TC-E1-P0-05 | API Integration (xUnit + `WebApplicationFactory<Program>`) | #3 — Problem Details RFC 7807 (NFR6) | DEV in this story | No DB required. Lives in `tests/SiesaAgents.IntegrationTests/ProblemDetailsTests.cs`. |
| TC-E1-P1-05 | API Integration | #1, #2 — `dotnet ef database update` creates `siesa_agents_db` + `__ef_migrations_history` | QA (lives in `IntegrationTests`, `[Trait("Category","Db")]`) | Requires PostgreSQL — TestContainers-Postgres recommended. Skipped on `--filter "Category!=Db"`. |
| TC-E1-P2-04 | API Integration | #4 — snake_case columns | QA (same trait) | After migration, assert `information_schema.columns` lowercase. |
| (DEV) | Unit (xUnit) | #6 — `AppDbContext` derives from `DbContext`; `ApplySnakeCaseNaming()` rule | DEV in this story | In-memory provider for the DbContext, theory cases for the rule. |

**Backend tooling already wired in Story 1.1:** xUnit 2.9.3 + `Microsoft.AspNetCore.Mvc.Testing` 10.0.8 + `Microsoft.NET.Test.Sdk` 17.14.1 + `coverlet.collector` 6.0.4 in `tests/SiesaAgents.UnitTests`. This story adds `Microsoft.EntityFrameworkCore.InMemory` to UnitTests and creates a NEW `tests/SiesaAgents.IntegrationTests` project.

[Source: `_bmad-output/implementation-artifacts/test-design-epic-1.md#3.1 P0`, `#3.2 P1`, `#3.3 P2`]
[Source: `_bmad-output/implementation-artifacts/test-design-epic-1.md#Risk Map` — R-003, R-005, R-006]
[Source: `backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj`]

### Code & Convention Rules (NON-NEGOTIABLE)

- **C# 12 / .NET 10 features:** primary constructors are fine (already used in `ExceptionHandlingMiddleware`). `<Nullable>enable</Nullable>` is mandatory — no `string?` left untyped, no `!` null-forgiving operator unless justified by a comment.
- **Timestamps:** `DateTimeOffset` ONLY. No `DateTime`. (Not directly exercised in this story since there are no entities yet, but the `ApplySnakeCaseNaming` extension must handle `CreatedAt` → `created_at` correctly when entities arrive in Epic 2 — the test suite asserts this.)
- **PKs:** `Guid` (UUID) for every entity that will be added in Epic 2 / 3. Not exercised here.
- **API documentation:** `Scalar` already wired in Story 1.1 (`app.MapScalarApiReference()`). NEVER `app.UseSwagger()`. No changes to this in Story 1.3.
- **No domain entities yet:** This story MUST NOT define `ClienteEntity`, `ContactoEntity`, any `DbSet<T>`, or any `IEntityTypeConfiguration<T>` — those are explicitly scoped to Epic 2 Story 2.1 and Epic 3 Story 3.1 per the epic Scope Note.
- **Database name:** `siesa_agents_db` (snake_case database name aligns with company DB conventions and the connection string already in `appsettings.Development.json`).
- **Secrets:** `appsettings.Development.json` ships dev-only credentials (`postgres / postgres`). Production must override via env var `ConnectionStrings__DefaultConnection` or User Secrets — DO NOT commit production credentials.

[Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules`]
[Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Security`]

### Concrete Code Skeleton (reference — adapt during implementation)

**`backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`:**
```csharp
using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data.Extensions;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // No DbSet<T> properties — domain tables arrive in Epic 2 (Story 2.1 — clientes)
    // and Epic 3 (Story 3.1 — contactos). Do NOT add them here.

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // MUST be the LAST call — converts every table/column/key/FK/index
        // name to lower snake_case so future migrations follow PostgreSQL standards.
        modelBuilder.ApplySnakeCaseNaming();
    }
}
```

**`backend/src/SiesaAgents.Infrastructure/Data/Extensions/ModelBuilderSnakeCaseExtensions.cs`:**
```csharp
using System.Text;
using System.Runtime.CompilerServices;
using Microsoft.EntityFrameworkCore;

[assembly: InternalsVisibleTo("SiesaAgents.UnitTests")]

namespace SiesaAgents.Infrastructure.Data.Extensions;

public static class ModelBuilderSnakeCaseExtensions
{
    public static ModelBuilder ApplySnakeCaseNaming(this ModelBuilder modelBuilder)
    {
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            var tableName = entity.GetTableName();
            if (tableName is not null)
            {
                entity.SetTableName(ToSnakeCase(tableName));
            }

            foreach (var property in entity.GetProperties())
            {
                property.SetColumnName(ToSnakeCase(property.GetColumnName()));
            }

            foreach (var key in entity.GetKeys())
            {
                var name = key.GetName();
                if (name is not null) key.SetName(ToSnakeCase(name));
            }

            foreach (var foreignKey in entity.GetForeignKeys())
            {
                var name = foreignKey.GetConstraintName();
                if (name is not null) foreignKey.SetConstraintName(ToSnakeCase(name));
            }

            foreach (var index in entity.GetIndexes())
            {
                var name = index.GetDatabaseName();
                if (name is not null) index.SetDatabaseName(ToSnakeCase(name));
            }
        }

        return modelBuilder;
    }

    internal static string ToSnakeCase(string input)
    {
        if (string.IsNullOrEmpty(input)) return input;
        var sb = new StringBuilder(input.Length + 8);
        for (int i = 0; i < input.Length; i++)
        {
            var c = input[i];
            if (i > 0 && char.IsUpper(c) && (char.IsLower(input[i - 1]) || char.IsDigit(input[i - 1])))
            {
                sb.Append('_');
            }
            sb.Append(char.ToLowerInvariant(c));
        }
        return sb.ToString();
    }
}
```

**`backend/src/SiesaAgents.API/Program.cs` — additions (relevant block only):**
```csharp
using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;
// ... existing usings ...

var builder = WebApplication.CreateBuilder(args);

// ... existing AddOpenApi / AddCors registrations ...

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// ... existing middleware: ExceptionHandlingMiddleware, UseStatusCodePages, UseCors,
//     MapOpenApi, MapScalarApiReference, MapGet("/", ...) ...

if (app.Environment.IsDevelopment())
{
    app.MapGet("/api/v1/test-error", () =>
    {
        throw new InvalidOperationException("Forced failure for Problem Details smoke test.");
    });
}

app.Run();
```

**`backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj` — final shape:**
```xml
<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <ProjectReference Include="..\SiesaAgents.Domain\SiesaAgents.Domain.csproj" />
  </ItemGroup>
  <ItemGroup>
    <PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="10.0.2" />
  </ItemGroup>
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>
</Project>
```

**`backend/tests/SiesaAgents.IntegrationTests/ProblemDetailsTests.cs` — skeleton:**
```csharp
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace SiesaAgents.IntegrationTests;

public class ProblemDetailsTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    [Trait("Category", "Api")]
    public async Task TestError_Returns_RFC7807_ProblemDetails_WithoutLeakingException()
    {
        var client = factory.WithWebHostBuilder(b => b.UseEnvironment("Development")).CreateClient();

        var response = await client.GetAsync("/api/v1/test-error");

        Assert.Equal(500, (int)response.StatusCode);
        Assert.Equal("application/problem+json",
            response.Content.Headers.ContentType?.MediaType);

        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        Assert.Equal(500, root.GetProperty("status").GetInt32());
        Assert.False(string.IsNullOrEmpty(root.GetProperty("title").GetString()));
        Assert.True(root.TryGetProperty("type", out _));
        Assert.True(root.TryGetProperty("instance", out _));

        // NFR6 — must not leak internals
        Assert.DoesNotContain("stackTrace", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("exception", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("innerException", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("Forced failure for Problem Details smoke test.", body);
    }
}
```

> **Note:** `WebApplicationFactory<Program>` requires `Program` to be public — in .NET 10 minimal hosting the implicit `Program` class is internal. Either add `public partial class Program { }` at the bottom of `Program.cs`, OR add `<InternalsVisibleTo Include="SiesaAgents.IntegrationTests" />` via `MSBuild` (cleaner: the partial class trick is the canonical pattern from Microsoft docs).

### Previous Story Learnings (from Stories 1.1 and 1.2)

- `SiesaAgents.slnx` is the solution file (modern .NET 10 XML format). Use `dotnet build backend/SiesaAgents.slnx`. (Story 1.1 deviation.)
- `Microsoft.AspNetCore.OpenApi` 10.0.8 is already wired alongside `Scalar.AspNetCore` 2.14.14. No Swagger anywhere — preserve this.
- The existing `ExceptionHandlingMiddleware` was wired correctly in Story 1.1 with `ILogger<ExceptionHandlingMiddleware>` injection. The 2 existing tests in `tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs` cover the success and failure paths at unit level — this story ADDS an integration-level test that drives the middleware through the full HTTP pipeline via `WebApplicationFactory<Program>`.
- Story 1.1 review left `[AI-Review][HIGH]` open: Infrastructure → Application reference is wrong. This story closes it (Task 1, sub-step 2).
- `appsettings.Development.json` already has the connection string and `_ConnectionStrings_Comment` clarifying DEV-only scope (added by Story 1.1 review auto-fix).
- No frontend changes in this story — the frontend continues to ship the placeholder views from Story 1.2.

[Source: `_bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md` — File List + Review Follow-ups]
[Source: `_bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md` — Dev Agent Record]

### Git & Project Patterns

- Commit cadence from Stories 1.1 / 1.2: one cohesive commit per task above (e.g., `feat(story-1.3): wire EF Core AppDbContext + snake_case extension`). Run `dotnet build && dotnet test --filter "Category!=Db"` locally before requesting review.
- File naming: PascalCase `.cs` files (`AppDbContext.cs`, `ModelBuilderSnakeCaseExtensions.cs`). Namespaces follow folder structure (`SiesaAgents.Infrastructure.Data`, `SiesaAgents.Infrastructure.Data.Extensions`).
- Migration file naming is auto-generated by `dotnet ef migrations add` (`{timestamp}_InitialCreate.cs`) — do not rename.

### Project Structure Notes

- Story 1.1 created `backend/src/SiesaAgents.Infrastructure/` as an empty class library (only `.csproj`). This story populates `Data/` (DbContext) and `Data/Extensions/` (snake_case extension) and `Data/Migrations/` (auto-generated by `dotnet ef`). This matches `architecture.md#Complete Project Directory Structure` lines 575–582 exactly.
- A NEW test project `backend/tests/SiesaAgents.IntegrationTests/` is created in this story (architecture line 594). It is added to `SiesaAgents.slnx`.
- The `[AI-Review][HIGH]` follow-up from Story 1.1 (Infrastructure → Application reference) is closed in Task 1 — this is the correct story to do it because Story 1.3 is the first time Infrastructure has anything in it beyond an empty `.csproj`.

### References

- Epic source: [Source: `_bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3: Backend Database Foundation`]
- Architecture (project layout, naming conventions, enforcement rules): [Source: `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure`] · [Source: `_bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules`] · [Source: `_bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines`]
- Test design (TC-E1-P0-05, TC-E1-P1-05, TC-E1-P2-04 + risks R-003, R-005, R-006): [Source: `_bmad-output/implementation-artifacts/test-design-epic-1.md#3.1 P0`] · [Source: `_bmad-output/implementation-artifacts/test-design-epic-1.md#3.2 P1`] · [Source: `_bmad-output/implementation-artifacts/test-design-epic-1.md#3.3 P2`] · [Source: `_bmad-output/implementation-artifacts/test-design-epic-1.md#2. Risk Map`]
- Company standards (stack, DB conventions, snake_case mandate, Problem Details, DateTimeOffset, UUID PKs): [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md`]
- Previous story state of repo: [Source: `_bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md`] · [Source: `_bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md`]
- Existing middleware to harden: [Source: `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`]
- Existing Program.cs (DI registration site): [Source: `backend/src/SiesaAgents.API/Program.cs`]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

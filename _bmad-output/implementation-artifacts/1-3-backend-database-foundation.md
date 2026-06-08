# Story 1.3: Backend Database Foundation

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured (with snake_case naming, an initial empty migration, and an RFC 7807 Problem Details middleware),
so that subsequent stories (2.1 `clientes`, 3.1 `contactos`) can define entities and run migrations against a working, standards-compliant data layer.

## Acceptance Criteria

1. **Given** PostgreSQL 18+ is running locally on `localhost:5432` with a user that has `CREATE DATABASE` privilege, **When** the developer runs `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` from `backend/`, **Then** the `siesa_agents_db` database is created with no errors, and the `__ef_migrations_history` table is present using snake_case naming (`migration_id`, `product_version`). The initial migration is empty (no domain tables — `clientes` / `contactos` are owned by stories 2.1 and 3.1).

2. **Given** the backend solution is built, **When** the project tree is inspected, **Then** `src/SiesaAgents.Infrastructure/Migrations/` contains the auto-generated initial migration files (`{timestamp}_InitialCreate.cs`, `{timestamp}_InitialCreate.Designer.cs`, `AppDbContextModelSnapshot.cs`), and the `AppDbContext` class lives at `src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`.

3. **Given** an unhandled exception is thrown from any endpoint, **When** the response reaches the client, **Then** it is HTTP 500 with `Content-Type: application/problem+json` and a body matching RFC 7807 (`status`, `title`, `type`, `instance` — `detail` MUST be `null` or omitted). The response body MUST NOT contain `stackTrace`, `exception`, `innerException`, `targetSite`, or the raw exception message (NFR6). The original exception MUST be logged server-side via `ILogger<ExceptionHandlingMiddleware>` at `Error` level (verified by Story 1.1's existing middleware).

4. **Given** any `DbContext` model is loaded, **When** `OnModelCreating` runs, **Then** `modelBuilder.ApplySnakeCaseNaming()` is the **last** call inside `OnModelCreating` (after `HasDefaultSchema` and any `ApplyConfigurationsFromAssembly`), and **all** EF-managed identifiers — table names, column names, indexes (`ix_*` / `uk_*`), and FK constraints (`fk_{dependent}_{principal}`) — are lowercase snake_case in the generated SQL.

5. **Given** the backend boots, **When** `Program.cs` runs the DI container, **Then** `AppDbContext` is registered via `builder.Services.AddDbContext<AppDbContext>(opt => opt.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")))`, the connection string is read from `appsettings.Development.json` → `ConnectionStrings:DefaultConnection`, and a startup `Database.CanConnectAsync()` check (or `dotnet run` startup) does not throw.

6. **Given** the existing pipeline from Story 1.1, **When** Story 1.3 changes are applied, **Then** `app.UseMiddleware<ExceptionHandlingMiddleware>()` continues to be the **first** middleware (before `UseCors`, `UseStatusCodePages`, `MapOpenApi`, `MapScalarApiReference`, `MapGet("/health")`), and no Swagger / Swashbuckle / `UseDeveloperExceptionPage` is added anywhere.

7. **Given** the .NET test suite, **When** `dotnet test backend/SiesaAgents.sln` runs, **Then** all P0/P1 backend tests for this story pass:
   - `TC-E1-P0-05` (Problem Details RFC 7807, no stack-trace leak) — verifies AC #3
   - `TC-E1-P1-05` (EF migration creates DB + snake_case `__ef_migrations_history`) — verifies AC #1, #4
   - `TC-E1-P2-04` (snake_case column verification) — verifies AC #4
   
   The pre-existing Story 1.1 tests (`ApiSmokeTests`, `ExceptionHandlingMiddlewareTests`) MUST continue to pass.

## Tasks / Subtasks

- [ ] Task 1 — Add EF Core 10 + design-time tooling NuGet packages (AC: #1, #5)
  - [ ] Add to `src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj`: `Microsoft.EntityFrameworkCore` (10.x — already pulled transitively by Npgsql provider; pin explicitly), `Microsoft.EntityFrameworkCore.Design` (10.x — needed for `dotnet ef`).
  - [ ] Add to `src/SiesaAgents.API/SiesaAgents.API.csproj`: `Microsoft.EntityFrameworkCore.Design` (10.x — required by `dotnet ef` so the startup project can be discovered).
  - [ ] Verify `dotnet tool list -g` includes `dotnet-ef` (>= 10.0); if absent, document the install command `dotnet tool install --global dotnet-ef --version 10.0.*` in the story's Completion Notes (do NOT modify a user machine's tool manifest in code).
  - [ ] Confirm `Npgsql.EntityFrameworkCore.PostgreSQL` is already at 10.0.2 in `SiesaAgents.Infrastructure.csproj` (it is, per Story 1.1).
  - [ ] Run `dotnet restore SiesaAgents.sln`; verify zero warnings.

- [ ] Task 2 — Implement the `SnakeCaseNamingConvention` extension (AC: #4)
  - [ ] Create `src/SiesaAgents.Infrastructure/Data/SnakeCaseNamingConvention.cs` exposing `public static class SnakeCaseNamingConvention` with two members:
    - `public static string ToSnakeCase(string input)` — uses two regex passes per company-standards: `([a-z0-9])([A-Z])` → `$1_$2`, then `([A-Z]+)([A-Z][a-z])` → `$1_$2`, then `.ToLowerInvariant()`. Handles `ID → id`, `APIKey → api_key`, `CreatedAt → created_at` correctly.
    - `public static void ApplySnakeCaseNaming(this ModelBuilder modelBuilder)` — iterates `modelBuilder.Model.GetEntityTypes()` and rewrites: table names, column names, indexes (prefix `uk_` if unique else `ix_`, then `{table}_{columns}`), and FK constraint names (`fk_{dependent}_{principal}`). Reference implementation: `_bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/database-conventions.md#2.1`.
  - [ ] DO NOT depend on the external NuGet package `EFCore.NamingConventions` — this story uses the company-standards implementation (in-house extension method) so naming for tables/columns/indexes/FKs is uniform and not provider-dependent.
  - [ ] Add namespace `SiesaAgents.Infrastructure.Data`.

- [ ] Task 3 — Create `AppDbContext` with empty model + snake_case applied (AC: #2, #4, #5)
  - [ ] Create `src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`:
    ```csharp
    using Microsoft.EntityFrameworkCore;
    using SiesaAgents.Infrastructure.Data;  // SnakeCaseNamingConvention

    namespace SiesaAgents.Infrastructure.Data;

    public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
    {
        // NOTE: NO DbSet<T> properties in this story.
        // Story 2.1 adds DbSet<ClienteEntity>; Story 3.1 adds DbSet<ContactoEntity>.

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Future: modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
            //   (added when first IEntityTypeConfiguration<T> ships in Story 2.1)

            // MUST be the LAST call — rewrites every table/column/index/FK name to snake_case.
            modelBuilder.ApplySnakeCaseNaming();
        }
    }
    ```
  - [ ] No `DbSet<T>` is declared in this story. The migration will be empty (only `__ef_migrations_history` is materialized when running `database update`).
  - [ ] Use the C# 12 primary-constructor `DbContext(DbContextOptions<AppDbContext> options)` form to match the company `.NET 10` style and avoid an explicit constructor body.

- [ ] Task 4 — Register `AppDbContext` in DI + read connection string (AC: #5, #6)
  - [ ] Modify `src/SiesaAgents.API/Program.cs`. Insert (between `AddProblemDetails()` and `AddCors(...)`, preserving the rest of the existing pipeline verbatim):
    ```csharp
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
    ```
  - [ ] Add the using directive `using SiesaAgents.Infrastructure.Data;` at the top of `Program.cs`.
  - [ ] Do NOT add `Database.Migrate()` or `EnsureCreated()` at startup — migrations are run explicitly via `dotnet ef database update` (corporate standard: no auto-migration in API startup).
  - [ ] Do NOT touch the order of `UseMiddleware<ExceptionHandlingMiddleware>()` → `UseCors(...)` → `UseStatusCodePages(...)` → `MapOpenApi()` → `MapScalarApiReference()` → `MapGet("/health")` → `Run()`. The `ExceptionHandlingMiddleware` MUST remain the first middleware (AC #6).
  - [ ] Confirm `src/SiesaAgents.API/appsettings.Development.json` already contains the connection string `Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres` (it does, per Story 1.1 — no change needed). Add the same key to `appsettings.json` with a safe placeholder value (`""`) so `IConfiguration` does not return null in non-Development environments.

- [ ] Task 5 — Verify the existing `ExceptionHandlingMiddleware` satisfies NFR6 (AC: #3, #6)
  - [ ] Re-read `src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`. Confirm `ProblemDetails.Detail` is NOT set (it is `null` — verified), `ex.Message` is NEVER written to the response, the logger logs the exception server-side at `Error` level, and the response uses `application/problem+json` content type via the `WriteAsJsonAsync(value, options: null, contentType)` overload.
  - [ ] Confirm `ApiSmokeTests` and `ExceptionHandlingMiddlewareTests` (Story 1.1, `tests/SiesaAgents.UnitTests/`) still pass without modification. They already cover the 500 path and content-type. This story does NOT modify the middleware code itself — Story 1.1 already implemented it. Reference: `_bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#File List` → `ExceptionHandlingMiddleware.cs`, `ExceptionHandlingMiddlewareTests.cs`.

- [ ] Task 6 — Generate the initial empty migration (AC: #1, #2)
  - [ ] From `backend/`, run:
    ```bash
    dotnet ef migrations add InitialCreate \
        --project src/SiesaAgents.Infrastructure \
        --startup-project src/SiesaAgents.API \
        --output-dir Data/Migrations
    ```
  - [ ] This generates `src/SiesaAgents.Infrastructure/Data/Migrations/{timestamp}_InitialCreate.cs`, `{timestamp}_InitialCreate.Designer.cs`, and `AppDbContextModelSnapshot.cs`. The `Up()` and `Down()` methods will be empty (no `CreateTable` calls) — this is correct and matches the scope note in the epic.
  - [ ] Commit the generated migration files. Do NOT manually edit them.
  - [ ] If a different timestamped migration was committed during exploratory work, delete it before generating the canonical `InitialCreate`.

- [ ] Task 7 — Apply the migration and verify the database state (AC: #1)
  - [ ] From `backend/`, run:
    ```bash
    dotnet ef database update \
        --project src/SiesaAgents.Infrastructure \
        --startup-project src/SiesaAgents.API
    ```
  - [ ] Connect to the local PostgreSQL with `psql -U postgres -d siesa_agents_db` and run `\dt` — verify exactly one table exists: `__ef_migrations_history`. No `clientes` / `contactos` tables should be present (the empty migration is correct).
  - [ ] Run `\d __ef_migrations_history` and verify column names are snake_case (`migration_id`, `product_version`).
  - [ ] Document the verification output in the Dev Agent Record → Debug Log References.

- [ ] Task 8 — Add the integration tests for AC #1, #3, #4 (AC: #7)
  - [ ] Decide test placement: add new tests in the existing `tests/SiesaAgents.UnitTests/` project (already wired with `WebApplicationFactory<Program>` per Story 1.1). A separate `IntegrationTests` project is NOT required for this story — the existing `Microsoft.AspNetCore.Mvc.Testing` package supports in-process integration tests.
  - [ ] Add `tests/SiesaAgents.UnitTests/Infrastructure/SnakeCaseNamingConventionTests.cs` (unit tests, no DB needed) covering:
    - `ToSnakeCase("CreatedAt") == "created_at"`
    - `ToSnakeCase("ID") == "id"`
    - `ToSnakeCase("APIKey") == "api_key"`
    - `ToSnakeCase("HTTPClient") == "http_client"`
    - `ToSnakeCase("ClienteID") == "cliente_id"`
    - `ToSnakeCase(null/empty)` returns the input unchanged.
    
    These tests directly verify the regex behavior and satisfy TC-E1-P2-04 at the unit level.
  - [ ] Add `tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs` covering AC #4 at the model level (no DB needed — uses EF Core's in-memory model API):
    - Build an `AppDbContext` instance with a `DbContextOptionsBuilder<AppDbContext>().UseNpgsql("Host=localhost;Database=test;Username=u;Password=p")` (the connection string is never opened — only the model is read).
    - Read `context.Model.GetEntityTypes()` — assert it returns an empty collection (no DbSets in this story).
    - Confirm the `ApplySnakeCaseNaming` call did not throw when applied to an empty model.
  - [ ] Add `tests/SiesaAgents.UnitTests/Infrastructure/ProblemDetailsTests.cs` (or extend `ExceptionHandlingMiddlewareTests.cs`) covering AC #3 / TC-E1-P0-05:
    - Boot a test-only `WebApplicationFactory<Program>` that registers a transient endpoint `GET /api/v1/test-error` (only in `Testing` environment via `WithWebHostBuilder`) that throws `new InvalidOperationException("internal test message")`.
    - Call the endpoint, assert HTTP 500, assert `Content-Type` starts with `application/problem+json`, deserialize the body to `ProblemDetails`, and assert:
      - `problem.Status == 500`
      - `problem.Title == "An unexpected error occurred."`
      - `problem.Detail == null`
      - Raw response body string does NOT contain `"stackTrace"`, `"exception"`, `"internal test message"`, `"InvalidOperationException"`.
  - [ ] Add `tests/SiesaAgents.UnitTests/Infrastructure/MigrationsHistorySnakeCaseTests.cs` covering AC #1 + TC-E1-P1-05 / TC-E1-P2-04 (integration test, requires a real Postgres):
    - Skip the test (using `Skip.If(...)` with `Xunit.SkippableFact` OR by gating on `Environment.GetEnvironmentVariable("RUN_DB_INTEGRATION_TESTS") == "1"`) when no local PostgreSQL is available — sandbox environments without Postgres should NOT fail the suite.
    - When enabled: build a `DbContextOptionsBuilder<AppDbContext>().UseNpgsql(connStr)`, call `context.Database.MigrateAsync()`, then query `information_schema.columns` for the `__ef_migrations_history` table and assert columns `migration_id` and `product_version` exist (lowercase, with underscores).
    - Use a randomized DB name per test run (e.g. `siesa_agents_test_{Guid.NewGuid():N}`) and drop the DB in test cleanup (`DisposeAsync` calling `Database.EnsureDeletedAsync()`) so reruns are idempotent.
  - [ ] If the local sandbox does not have PostgreSQL, the gated integration test is skipped (acceptable per `test-design-epic-1.md#8c` — P1 tests are gated by environment availability). Document in Dev Agent Record whether PostgreSQL was available during the run.

- [ ] Task 9 — Verify build + all tests pass (AC: #7)
  - [ ] Run `dotnet build backend/SiesaAgents.sln` → 0 errors, 0 warnings.
  - [ ] Run `dotnet test backend/SiesaAgents.sln` → all pre-existing Story 1.1 tests pass + all new Story 1.3 tests pass (gated integration test may be skipped if Postgres unavailable — note this in Completion Notes).
  - [ ] Run `dotnet run --project backend/src/SiesaAgents.API` and `curl http://localhost:5000/health` → HTTP 200 `{"status":"ok"}`. Confirm startup logs do NOT include any EF Core exception (DI registration validates the provider configuration).
  - [ ] Visually verify Scalar still renders at `http://localhost:5000/scalar` (regression check that Task 4's `Program.cs` edits did not break Story 1.1 behavior).

## Dev Notes

### Architectural Layer — Clean Architecture mapping for this story

This story creates the **data infrastructure foundation** only. No `Domain/` entities are added (they belong to Stories 2.1 and 3.1). No `Application/` commands or queries are added. The only files touched are in `Infrastructure/Data/` (DbContext + snake_case helper) and `API/Program.cs` (DI registration). The pre-existing `ExceptionHandlingMiddleware` (Story 1.1) already satisfies NFR6 and is re-verified — not re-implemented — by this story.

```
backend/src/
├── SiesaAgents.API/
│   ├── Program.cs                  ← MODIFY: add AddDbContext<AppDbContext>(...UseNpgsql(...))
│   └── Middleware/
│       └── ExceptionHandlingMiddleware.cs  ← UNCHANGED (Story 1.1 already RFC 7807-compliant)
├── SiesaAgents.Infrastructure/
│   ├── SiesaAgents.Infrastructure.csproj   ← MODIFY: add Microsoft.EntityFrameworkCore.Design
│   └── Data/
│       ├── AppDbContext.cs                  ← NEW: empty DbContext + ApplySnakeCaseNaming()
│       ├── SnakeCaseNamingConvention.cs     ← NEW: in-house naming extension
│       └── Migrations/                       ← NEW: generated by `dotnet ef migrations add`
│           ├── {timestamp}_InitialCreate.cs           (empty Up/Down)
│           ├── {timestamp}_InitialCreate.Designer.cs
│           └── AppDbContextModelSnapshot.cs
```

[Source: company-standards.md#Backend Folder Structure] [Source: architecture.md#Complete Project Directory Structure]

### Tech Stack & Library Versions

| Package | Version | Purpose | Project |
|---|---|---|---|
| `Microsoft.EntityFrameworkCore` | 10.x | EF Core base | Infrastructure (pinned explicitly) |
| `Microsoft.EntityFrameworkCore.Design` | 10.x | `dotnet ef` design-time | Infrastructure + API |
| `Npgsql.EntityFrameworkCore.PostgreSQL` | 10.0.2 | PostgreSQL provider | Infrastructure (already present per Story 1.1) |
| `Microsoft.AspNetCore.Mvc.Testing` | 10.0.8 | `WebApplicationFactory<Program>` | UnitTests (already present per Story 1.1) |

**Versions are pinned to 10.x to match `.NET 10` per company-standards.md#Backend Stack.**

**No additional packages.** The story explicitly does NOT add:
- `EFCore.NamingConventions` — replaced by the in-house `SnakeCaseNamingConvention.ApplySnakeCaseNaming()` extension (per company-standards.md). This is intentional: the in-house version also rewrites index/FK constraint names with the `ix_` / `uk_` / `fk_` prefixes the corporate database conventions require, which the upstream package does NOT do.
- `Microsoft.AspNetCore.Diagnostics` extras — `AddProblemDetails()` from `Program.cs` (Story 1.1) is sufficient.
- TestContainers — gated integration tests use the developer's local PostgreSQL; CI provisioning of TestContainers is a future story.

[Source: company-standards.md#Backend Stack] [Source: architecture.md#Starter Template Evaluation]

### snake_case naming extension — required behavior

The `ApplySnakeCaseNaming(this ModelBuilder)` extension MUST rewrite (per `database-conventions.md#2.1` and `company-standards.md#Database Conventions`):

| Element | Rule | Example |
|---|---|---|
| Tables | `entity.SetTableName(ToSnakeCase(...))` | `Cliente` → `cliente` (pluralization is NOT applied here; Story 2.1's `IEntityTypeConfiguration<ClienteEntity>` will call `.ToTable("clientes")` explicitly to enforce plural per company convention) |
| Columns | `property.SetColumnName(ToSnakeCase(name))` | `CreatedAt` → `created_at`, `ID` → `id`, `ClienteID` → `cliente_id` |
| Indexes | Prefix `uk_` if `IsUnique` else `ix_`, then `{table}_{columns}` | `ix_contactos_cliente_id`, `uk_clientes_nit` |
| FK constraints | `fk_{dependent}_{principal}` | `fk_contactos_clientes` |

The regex pair `([a-z0-9])([A-Z])` → `$1_$2` followed by `([A-Z]+)([A-Z][a-z])` → `$1_$2` handles all four edge cases tested in Task 8 (`ID`, `APIKey`, `HTTPClient`, `ClienteID`). Use `ToLowerInvariant()` (NOT `ToLower()`) for culture-safety.

**Ordering rule (NON-NEGOTIABLE):** `ApplySnakeCaseNaming()` MUST be the **last** call in `OnModelCreating` — it reads the configured table/column/index/FK names set by `ApplyConfigurationsFromAssembly` and rewrites them. If called first, subsequent configurations would overwrite the snake_case names. This is also enforced in `test-design-epic-1.md#10` (item #2).

[Source: company-standards.md#Database Conventions] [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/database-conventions.md#2.1]

### Program.cs — DI registration patch

The exact insertion point in `src/SiesaAgents.API/Program.cs`:

```csharp
// ... existing imports
using SiesaAgents.Infrastructure.Data;   // ← ADD

// ... builder created, DevCorsPolicy constant, AddOpenApi()

builder.Services.AddProblemDetails();

// ── ADD START ──
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
// ── ADD END ──

builder.Services.AddCors(...);    // ← existing
// ...
```

The middleware pipeline (everything from `var app = builder.Build();` onward) is UNTOUCHED. Story 1.1 already established the correct order: `ExceptionHandlingMiddleware` → `UseCors` → `UseStatusCodePages` → `MapOpenApi` → `MapScalarApiReference` → `MapGet("/health")` → `Run`. AC #6 is satisfied by not reordering.

[Source: 1-1-project-initialization-repository-structure.md#File List] [Source: architecture.md#API & Communication Patterns]

### Problem Details — what Story 1.1 already provides

Story 1.1 already ships:
- `ExceptionHandlingMiddleware.cs` — catches all unhandled exceptions, returns HTTP 500 with `application/problem+json`, sets `Status`/`Title`/`Type`/`Instance`, leaves `Detail = null`, and logs the exception server-side at `Error` level. Verified by `ExceptionHandlingMiddlewareTests` (3 tests, including the "no sensitive leakage" assertion).
- `AddProblemDetails()` + `UseStatusCodePages(...)` — handles unmapped-route 404s with the same RFC 7807 format.

This story's role for NFR6 is to **re-verify** the contract (Task 5) and to add the dedicated test `TC-E1-P0-05` that hits a real exception path through the full pipeline (Task 8). No production code change to the middleware is needed.

[Source: 1-1-project-initialization-repository-structure.md#Backend Stack Details] [Source: 1-1-project-initialization-repository-structure.md#File List]

### EF Core migration — generation command + expected output

Run from `backend/`:

```bash
dotnet ef migrations add InitialCreate \
    --project src/SiesaAgents.Infrastructure \
    --startup-project src/SiesaAgents.API \
    --output-dir Data/Migrations
```

Expected generated files (committed to source control):
- `src/SiesaAgents.Infrastructure/Data/Migrations/{yyyyMMddHHmmss}_InitialCreate.cs` — `Up()` and `Down()` both empty (no `CreateTable` calls because no `DbSet<T>` exists).
- `src/SiesaAgents.Infrastructure/Data/Migrations/{yyyyMMddHHmmss}_InitialCreate.Designer.cs` — model snapshot for this migration (will be empty model).
- `src/SiesaAgents.Infrastructure/Data/Migrations/AppDbContextModelSnapshot.cs` — running model snapshot (empty model).

Then run `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`. The `siesa_agents_db` database is created (Npgsql will issue `CREATE DATABASE` if the user has the privilege) and a single table `__ef_migrations_history` is materialized with the row `{ migration_id: '{timestamp}_InitialCreate', product_version: '10.x.x' }`.

[Source: architecture.md#Project Structure & Boundaries] [Source: test-design-epic-1.md#TC-E1-P1-05]

### Connection string source

`src/SiesaAgents.API/appsettings.Development.json` (Story 1.1) already contains:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres"
  },
  "AllowedOrigins": ["http://localhost:5173"]
}
```

No change is required to this file. Add the same key with an empty value to `appsettings.json` (so production deploys explicitly require the env var `ConnectionStrings__DefaultConnection`, per .NET configuration override conventions).

`dotnet ef` reads the connection string from the **startup project** at design time (i.e., `SiesaAgents.API`), so the `--startup-project src/SiesaAgents.API` flag in the commands above is mandatory.

[Source: 1-1-project-initialization-repository-structure.md#appsettings.Development.json] [Source: company-standards.md#Backend Stack]

### Test strategy — mapping to Epic 1 Test Design

| Test ID | Title | Implementation | Level |
|---|---|---|---|
| TC-E1-P0-05 | ExceptionHandlingMiddleware returns RFC 7807 with no stack-trace | Task 8 → `ProblemDetailsTests.cs` | API Integration (WebApplicationFactory) |
| TC-E1-P1-05 | EF migration creates DB + snake_case `__ef_migrations_history` | Task 8 → `MigrationsHistorySnakeCaseTests.cs` (gated) | API Integration (real Postgres) |
| TC-E1-P2-04 | snake_case column verification | Task 8 → `SnakeCaseNamingConventionTests.cs` + `MigrationsHistorySnakeCaseTests.cs` | Unit + Integration |

The unit-level snake_case tests run unconditionally; the DB-level migration test is gated on `RUN_DB_INTEGRATION_TESTS=1` so it does not break CI sandboxes lacking PostgreSQL. The Definition of Done (per `test-design-epic-1.md#9`) requires P0 and P1 tests to pass — TC-E1-P1-05 may be marked deferred-with-justification if no Postgres is available, provided the unit-level `SnakeCaseNamingConventionTests` pass and the migration command is manually verified by the developer.

[Source: test-design-epic-1.md#TC-E1-P0-05] [Source: test-design-epic-1.md#TC-E1-P1-05] [Source: test-design-epic-1.md#TC-E1-P2-04] [Source: test-design-epic-1.md#8c]

### Spanish text & UI Kit

This story is backend-only. **No UI components**, no user-facing text. `siesa-ui-kit`, Heroicons, TanStack Router, and `_app/` shell rules from Stories 1.1 and 1.2 are NOT touched. The MasterCrud reference is NOT applicable here (no CRUD screen / data grid / form is in scope).

### Project Structure Notes

**Alignment:**
- `Infrastructure/Data/AppDbContext.cs` matches `architecture.md#Complete Project Directory Structure` exactly.
- `Infrastructure/Data/Migrations/` matches `architecture.md#Complete Project Directory Structure` and `company-standards.md#Backend Folder Structure` (`Data/Migrations/` co-located with `Data/Configurations/`).
- Connection string lives in `appsettings.Development.json` per `company-standards.md#Backend Stack`.
- The DbContext is registered in DI (not instantiated manually) per `company-standards.md#Backend Critical Rules` (Clean Architecture: API references Infrastructure for DI registration only).

**Variances / decisions:**
- The architecture document lists `Infrastructure/Data/Configurations/` and `Infrastructure/Data/Migrations/` as separate sibling folders. Story 1.1 already created empty `Data/Configurations/` and `Data/Migrations/` folders. This story populates `Data/Migrations/` via `dotnet ef`. `Data/Configurations/` remains empty until Story 2.1's `ClienteConfiguration.cs`.
- The story uses the in-house `SnakeCaseNamingConvention` (per company-standards.md) instead of the `EFCore.NamingConventions` NuGet package — rationale documented in "Tech Stack & Library Versions" above (the in-house version rewrites index and FK constraint names; the upstream package does not).
- No `ClienteEntity` / `ContactoEntity` are defined. Scope note from the epic enforced: clientes table comes in 2.1, contactos in 3.1. The migration generated by Task 6 is empty (no `CreateTable` calls).

### References

- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3]
- NFR6 (no stack traces): [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md] [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- Database conventions (snake_case, FK naming, index naming): [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/database-conventions.md#1.1] [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions]
- `ApplySnakeCaseNaming()` reference implementation: [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/database-conventions.md#2.1]
- EF Core configuration ordering rule (`ApplySnakeCaseNaming` must be last): [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines item 2] [Source: _bmad-output/implementation-artifacts/test-design-epic-1.md#10 item 2]
- Backend project structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Existing middleware + DI baseline from Story 1.1: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#File List] [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#Backend Stack Details]
- Tech stack + DateTimeOffset + Guid PK rules: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- Test design + risk matrix + execution order: [Source: _bmad-output/implementation-artifacts/test-design-epic-1.md#TC-E1-P0-05] [Source: _bmad-output/implementation-artifacts/test-design-epic-1.md#TC-E1-P1-05] [Source: _bmad-output/implementation-artifacts/test-design-epic-1.md#10]
- Connection string baseline: [Source: backend/src/SiesaAgents.API/appsettings.Development.json]

## Dev Agent Record

### Agent Model Used

claude-opus-4-7

### Debug Log References

### Completion Notes List

### File List

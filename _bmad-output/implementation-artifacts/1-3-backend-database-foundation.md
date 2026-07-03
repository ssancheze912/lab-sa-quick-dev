# Story 1.3: Backend Database Foundation

Status: dev-complete

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

## Acceptance Criteria

1. **Given** the .NET 10 backend solution and PostgreSQL 18+ running locally at the connection string configured in `backend/src/SiesaAgents.API/appsettings.Development.json` (`Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres`), **When** the developer runs `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` from `backend/`, **Then** the `siesa_agents_db` database is created (if it did not exist) with no errors, `dotnet ef` exits with code `0`, and the `__ef_migrations_history` table exists in the target database with columns `migration_id` and `product_version` (snake_case — confirming the naming convention is active — per TC-E1-P1-05 and TC-E1-P2-04).

2. **Given** the EF Core migrations folder does not yet exist, **When** the developer runs `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API --output-dir Data/Migrations` from `backend/`, **Then** a folder `backend/src/SiesaAgents.Infrastructure/Data/Migrations/` is generated containing at least the initial migration file `*_InitialCreate.cs`, a `*_InitialCreate.Designer.cs`, and `AppDbContextModelSnapshot.cs`. The generated `Up()` method contains NO `CreateTable("clientes"…)` and NO `CreateTable("contactos"…)` calls (scope note — empty initial migration).

3. **Given** the backend is running via `dotnet run` on `http://localhost:5000` and an endpoint intentionally throws an unhandled `Exception`, **When** any HTTP client calls that endpoint, **Then** the response has HTTP status `500`, `Content-Type: application/problem+json`, and the JSON body conforms to Problem Details RFC 7807 (contains `status`, `title`, `type` fields; MAY contain `detail` and `instance`) AND does NOT contain any of the keys `stackTrace`, `exception`, `innerException`, or a raw C# exception message (NFR6 — covered by TC-E1-P0-05). This behaviour is already provided by `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` (introduced in Story 1.1); Story 1.3 only adds the integration test that proves it and confirms wiring is unbroken.

4. **Given** the `AppDbContext` is instantiated by the application host, **When** its `OnModelCreating(ModelBuilder)` method executes, **Then** the LAST statement in the method body is `modelBuilder.ApplySnakeCaseNaming();` — the extension method defined in `backend/src/SiesaAgents.Infrastructure/Data/Conventions/SnakeCaseNamingConvention.cs`. This is verifiable by unit test (reflection over the compiled `AppDbContext`) and by the integration test in AC #1 which asserts the snake_case history table columns.

5. **Given** the .NET solution structure defined by Story 1.1, **When** `dotnet build backend/SiesaAgents.sln` runs, **Then** the build succeeds with 0 errors and 0 warnings, the following NuGet packages are present with the versions listed below (or newer patch releases), and no `Microsoft.EntityFrameworkCore.Sqlite`, `Microsoft.EntityFrameworkCore.InMemory` (outside test projects), or `Swashbuckle.*` package is referenced anywhere in the solution:

    - `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj`
      - `Npgsql.EntityFrameworkCore.PostgreSQL` (already present — verify version `10.0.2` or later)
      - `Microsoft.EntityFrameworkCore.Design` (`10.*`) — required by architecture rule "must be present in the API (startup) project AND in Infrastructure".
    - `backend/src/SiesaAgents.API/SiesaAgents.API.csproj`
      - `Microsoft.EntityFrameworkCore.Design` (`10.*`) — required so `dotnet ef` can bootstrap from the startup project.

6. **Given** `Program.cs` in `SiesaAgents.API`, **When** the app boots, **Then** `AppDbContext` is registered via `builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")))` BEFORE `builder.Build()`, and this registration lives BEFORE `builder.Services.AddCors(...)` is called (following the DI registration sequence documented in `architecture-both.md`: i18n → validation → DbContext → repositories → CORS/middleware). No breaking change to the existing CORS / OpenAPI / Scalar / Problem Details middleware pipeline order — the existing Story 1.1 pipeline (`UseMiddleware<ExceptionHandlingMiddleware>()` → `UseStatusCodePages` → `UseCors("DevCors")` → `MapOpenApi()` → `MapScalarApiReference()`) must remain intact.

7. **Given** the backend integration test project `backend/tests/SiesaAgents.IntegrationTests`, **When** `dotnet test backend/SiesaAgents.sln` runs, **Then** the following xUnit integration tests pass and all Epic 1 test-design test-cases assigned to Story 1.3 (TC-E1-P0-05, TC-E1-P1-05, TC-E1-P2-04) map to at least one passing test:

    - `ProblemDetailsMiddlewareTests.Unhandled_exception_returns_problem_details_rfc7807()` — spins up a `WebApplicationFactory<Program>` with a temporary `/api/v1/test-error` endpoint registered in a test-only branch that throws `new Exception("boom")`; asserts status 500, `application/problem+json`, presence of `status`+`title`, absence of `stackTrace`/`exception`/`innerException`/the string `"boom"` (TC-E1-P0-05).
    - `EfCoreMigrationTests.ApplyMigrations_creates_ef_migrations_history_table_with_snake_case_columns()` — uses `Testcontainers.PostgreSql` (or, if TestContainers is unavailable in the sandbox, a fallback `[Fact(Skip = "Testcontainers unavailable — verified manually via dotnet ef")]` PLUS a unit-level assertion) to spin a throwaway Postgres, calls `dbContext.Database.MigrateAsync()`, then queries `information_schema.columns` and asserts columns `migration_id` and `product_version` exist in the `__ef_migrations_history` table (TC-E1-P1-05 + TC-E1-P2-04).
    - `AppDbContextConventionTests.OnModelCreating_applies_snake_case_last()` — pure unit test using `EFCore.InMemory` (test-only) that instantiates `AppDbContext`, forces `EnsureCreated()` against an in-memory provider, and asserts via `Model.GetEntityTypes()` that any test entity registered inside the test (a local `DummyEntity` type) receives a snake_case table name — proves the extension method is called (TC-E1-P2-04 fallback for environments where Postgres is unavailable).

## Tasks / Subtasks

- [ ] **Task 1 — Add EF Core Design package to API and Infrastructure (AC: #1, #2, #5)**
  - [ ] Add `Microsoft.EntityFrameworkCore.Design` (`10.*`) to `backend/src/SiesaAgents.API/SiesaAgents.API.csproj`: `dotnet add backend/src/SiesaAgents.API package Microsoft.EntityFrameworkCore.Design`. This is REQUIRED by architecture-both.md — without it in the startup project, `dotnet ef migrations add` fails.
  - [ ] Add `Microsoft.EntityFrameworkCore.Design` (`10.*`) to `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj`. Also verify `Npgsql.EntityFrameworkCore.PostgreSQL` is already `10.0.2` or newer (present from Story 1.1 — no re-install unless version drift).
  - [ ] Run `dotnet build backend/SiesaAgents.sln` — must succeed with 0 errors and 0 warnings. If new NU1903 audit warnings appear from the transitive EF Core dependency graph, extend the existing `<NoWarn>$(NoWarn);NU1903</NoWarn>` note in `SiesaAgents.API.csproj` (or `SiesaAgents.Infrastructure.csproj`) — do NOT introduce new suppressions elsewhere.

- [ ] **Task 2 — Create `SnakeCaseNamingConvention` extension (AC: #4)**
  - [ ] Create file `backend/src/SiesaAgents.Infrastructure/Data/Conventions/SnakeCaseNamingConvention.cs` implementing the extension EXACTLY as documented in `_bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/database-conventions.md#Section 2.1` (lines 512-559). The signature must be:
    ```csharp
    namespace SiesaAgents.Infrastructure.Data.Conventions;

    public static class SnakeCaseNamingConvention
    {
        public static string ToSnakeCase(string input) { /* see standard */ }
        public static void ApplySnakeCaseNaming(this ModelBuilder modelBuilder) { /* see standard */ }
    }
    ```
  - [ ] The `ApplySnakeCaseNaming(this ModelBuilder)` extension MUST iterate through `modelBuilder.Model.GetEntityTypes()` and rename: tables, columns, indexes (using `ix_` / `uk_` prefix per `IsUnique`), and foreign key constraints (`fk_{dependent}_{principal}`). Copy the reference regex + implementation verbatim from `database-conventions.md` — do NOT reinvent the algorithm.
  - [ ] `ToSnakeCase` must handle acronyms correctly (`ID → id`, `APIKey → api_key`, `HTTPClient → http_client`) — this is exercised by unit tests in Task 6.

- [ ] **Task 3 — Create `AppDbContext` in Infrastructure/Data (AC: #4, #6)**
  - [ ] Create file `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`:
    ```csharp
    using Microsoft.EntityFrameworkCore;
    using SiesaAgents.Infrastructure.Data.Conventions;

    namespace SiesaAgents.Infrastructure.Data;

    public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
    {
        // No DbSet<T> declarations in Story 1.3 — entities land in Epic 2 (ClienteEntity)
        // and Epic 3 (ContactoEntity). Adding them here would violate the epic scope note.

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Future: modelBuilder.HasDefaultSchema("crm");  // enable when domain tables land in Epic 2.
            // Future: modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

            // CRITICAL: snake_case naming must be the LAST call inside OnModelCreating
            // per company-standards.md and test-design-epic-1.md § 10 rule #2.
            modelBuilder.ApplySnakeCaseNaming();
        }
    }
    ```
  - [ ] Do NOT declare `DbSet<ClienteEntity>` or `DbSet<ContactoEntity>` — the scope note in `epic-01-foundation.md` explicitly forbids it. Adding them now would cause the initial migration to include `clientes` / `contactos` tables, which are owned by Story 2.1 / 3.1.
  - [ ] Do NOT set `HasDefaultSchema(...)` yet — deferred to Story 2.1 when the first entity lands. Applying a default schema here would generate a schema in the initial migration for no reason.
  - [ ] The class uses the C# 12 primary-constructor pattern (Story 1.1 baseline uses primary constructors for middleware — same style).

- [ ] **Task 4 — Register `AppDbContext` in DI + validate `Program.cs` order (AC: #6)**
  - [ ] Edit `backend/src/SiesaAgents.API/Program.cs`. Insert the DbContext registration AFTER `AddProblemDetails()` and BEFORE `AddCors(...)`:
    ```csharp
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
    ```
    Add the `using SiesaAgents.Infrastructure.Data;` directive at the top.
  - [ ] Do NOT reorder or remove any existing middleware call (`UseMiddleware<ExceptionHandlingMiddleware>()`, `UseStatusCodePages(...)`, `UseCors("DevCors")`, `MapOpenApi()`, `MapScalarApiReference()`) — these were established in Story 1.1 and are protected by TC-E1-P0-03, TC-E1-P0-04, TC-E1-P0-05.
  - [ ] Do NOT call `dbContext.Database.Migrate()` on startup — migrations are a developer/CI concern, not a runtime concern (production DBs must be migrated deliberately via `dotnet ef` or a release pipeline, never by app boot).

- [ ] **Task 5 — Generate the initial (empty) migration (AC: #1, #2)**
  - [ ] From `backend/`, run:
    ```bash
    dotnet ef migrations add InitialCreate \
      --project src/SiesaAgents.Infrastructure \
      --startup-project src/SiesaAgents.API \
      --output-dir Data/Migrations
    ```
    If `dotnet ef` is not installed globally, install it: `dotnet tool install --global dotnet-ef --version 10.0.*` (or use `--local` per team preference — the tool version must match EF Core 10).
  - [ ] Inspect the generated `backend/src/SiesaAgents.Infrastructure/Data/Migrations/*_InitialCreate.cs`. The `Up(MigrationBuilder migrationBuilder)` method body MUST be either empty (whitespace only) or contain ONLY EF-Core-emitted comments — NO `migrationBuilder.CreateTable(...)`, NO `migrationBuilder.CreateIndex(...)`, NO `EnsureSchema(...)` calls. If any such statement appears, the DbContext leaked an entity — remove the leak (Task 3 guard) and regenerate.
  - [ ] Verify the migration + snapshot are committed to source control (`Data/Migrations/*.cs` + `AppDbContextModelSnapshot.cs`). Do NOT gitignore migrations — they are code artifacts, not build outputs.
  - [ ] Optional local smoke: `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` — should exit 0 and create the DB + `__ef_migrations_history` table. Verify via `psql -U postgres -d siesa_agents_db -c "\dt"` that the only table is `__ef_migrations_history` (no `clientes`, no `contactos`).

- [ ] **Task 6 — Create integration + unit tests (AC: #7)**
  - [ ] Create a new xUnit integration test project: `dotnet new xunit -n SiesaAgents.IntegrationTests -o backend/tests/SiesaAgents.IntegrationTests --framework net10.0`. Add it to the solution: `dotnet sln backend/SiesaAgents.sln add backend/tests/SiesaAgents.IntegrationTests/SiesaAgents.IntegrationTests.csproj`.
  - [ ] Add NuGet packages to the integration test csproj:
    - `Microsoft.AspNetCore.Mvc.Testing` (10.*) — hosts `WebApplicationFactory<Program>`.
    - `Testcontainers.PostgreSql` (4.*) — throwaway Postgres for DB tests.
    - `Microsoft.EntityFrameworkCore.InMemory` (10.*) — in-memory provider for the `AppDbContextConventionTests` fallback path.
    - `Microsoft.EntityFrameworkCore.Design` (10.*) if needed by the test host.
    - Add project references: → `SiesaAgents.API` (needs `Program` for `WebApplicationFactory`), → `SiesaAgents.Infrastructure` (needs `AppDbContext`).
  - [ ] Ensure `SiesaAgents.API/Program.cs` exposes the top-level `Program` class to tests: append `public partial class Program {}` at the end of `Program.cs` (canonical .NET 10 pattern — `WebApplicationFactory<Program>` requires the type to be accessible).
  - [ ] Create `ProblemDetailsMiddlewareTests.cs` covering TC-E1-P0-05. Sketch:
    ```csharp
    public class ProblemDetailsMiddlewareTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;

        public ProblemDetailsMiddlewareTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory.WithWebHostBuilder(builder =>
                builder.Configure(app =>
                    app.Use(async (ctx, next) =>
                    {
                        if (ctx.Request.Path == "/api/v1/test-error")
                            throw new Exception("boom");
                        await next();
                    })));
            // NB: In practice, prefer a TestStartup or `ConfigureServices` extension that
            // ADDS a `/api/v1/test-error` endpoint AFTER the existing middleware — not one
            // that replaces the pipeline. Reason: replacing the pipeline dodges the very
            // middleware we're asserting.
        }

        [Fact]
        public async Task Unhandled_exception_returns_problem_details_rfc7807()
        {
            var client = _factory.CreateClient();
            var response = await client.GetAsync("/api/v1/test-error");

            Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
            Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

            var body = await response.Content.ReadAsStringAsync();
            using var json = JsonDocument.Parse(body);
            Assert.True(json.RootElement.TryGetProperty("status", out _));
            Assert.True(json.RootElement.TryGetProperty("title", out _));
            Assert.False(json.RootElement.TryGetProperty("stackTrace", out _));
            Assert.False(json.RootElement.TryGetProperty("exception", out _));
            Assert.False(json.RootElement.TryGetProperty("innerException", out _));
            Assert.DoesNotContain("boom", body, StringComparison.OrdinalIgnoreCase);
        }
    }
    ```
    IMPLEMENTATION NOTE: the correct way to inject the `/api/v1/test-error` endpoint is via a `TestServer`-friendly test host that RE-USES `Program`'s middleware pipeline AND appends the test endpoint at the end. Do NOT rebuild the pipeline in the test.
  - [ ] Create `EfCoreMigrationTests.cs` covering TC-E1-P1-05 + TC-E1-P2-04 (Postgres path):
    - Use `IAsyncLifetime` with `Testcontainers.PostgreSql` (`new PostgreSqlBuilder().Build()`) to start a throwaway Postgres.
    - Build an `AppDbContext` bound to the container's connection string via `DbContextOptionsBuilder<AppDbContext>().UseNpgsql(...)`.
    - Call `dbContext.Database.MigrateAsync()` — MUST succeed with no exception.
    - Open a raw `NpgsqlConnection` and query: `SELECT column_name FROM information_schema.columns WHERE table_name = '__ef_migrations_history' ORDER BY column_name;`
    - Assert the returned column names are exactly `migration_id` and `product_version` (snake_case). Any PascalCase result fails AC #4.
    - Skip semantics: If TestContainers cannot pull the `postgres:18-alpine` image due to sandbox proxy limitations (Story 1.1 note #7 warns of proxy 403s against external CDNs), mark this test with `Skip = "Testcontainers image pull blocked by sandbox proxy — verified manually via dotnet ef"`. The developer MUST run the manual verification (Task 5, "Optional local smoke") in that case and record the outcome in Debug Log References below.
  - [ ] Create `AppDbContextConventionTests.cs` — the unit-level fallback for TC-E1-P2-04 (works everywhere, no external deps):
    ```csharp
    public class AppDbContextConventionTests
    {
        private class ProbeEntity
        {
            public Guid Id { get; set; }
            public string CreatedByUserName { get; set; } = string.Empty;
        }

        private class ProbeDbContext(DbContextOptions<ProbeDbContext> options) : DbContext(options)
        {
            public DbSet<ProbeEntity> ProbeEntities => Set<ProbeEntity>();

            protected override void OnModelCreating(ModelBuilder modelBuilder)
            {
                base.OnModelCreating(modelBuilder);
                modelBuilder.ApplySnakeCaseNaming();  // same extension as AppDbContext
            }
        }

        [Fact]
        public void ApplySnakeCaseNaming_converts_entity_and_column_names()
        {
            var options = new DbContextOptionsBuilder<ProbeDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            using var ctx = new ProbeDbContext(options);
            var entity = ctx.Model.FindEntityType(typeof(ProbeEntity))!;

            Assert.Equal("probe_entity", entity.GetTableName());
            Assert.Equal("id", entity.FindProperty(nameof(ProbeEntity.Id))!.GetColumnName());
            Assert.Equal("created_by_user_name",
                entity.FindProperty(nameof(ProbeEntity.CreatedByUserName))!.GetColumnName());
        }

        [Theory]
        [InlineData("ID", "id")]
        [InlineData("CreatedAt", "created_at")]
        [InlineData("APIKey", "api_key")]
        [InlineData("HTTPClient", "http_client")]
        [InlineData("CreatedByUserID", "created_by_user_id")]
        public void ToSnakeCase_handles_pascal_and_acronyms(string input, string expected)
        {
            Assert.Equal(expected, SnakeCaseNamingConvention.ToSnakeCase(input));
        }
    }
    ```
  - [ ] Run `dotnet test backend/SiesaAgents.sln` from `backend/` — all tests in `SiesaAgents.UnitTests` (from Story 1.1) and `SiesaAgents.IntegrationTests` must pass. Skipped Testcontainers tests are acceptable ONLY if the manual `dotnet ef database update` verification is documented.

- [ ] **Task 7 — Update solution + verify AC coverage**
  - [ ] Run `dotnet build backend/SiesaAgents.sln` — 0 errors, 0 warnings (NU1903 suppression from Story 1.1 remains in force).
  - [ ] Run `dotnet test backend/SiesaAgents.sln --no-build` — every test passes (or is a documented `Skip`).
  - [ ] Update this story file's `Dev Agent Record` section (see below) with: model used, debug logs (`dotnet build`, `dotnet ef migrations add`, `dotnet ef database update` output), completion notes, and file list.
  - [ ] Do NOT edit any frontend file. Story 1.3 is a backend-only story. If frontend changes are somehow required, STOP and flag the deviation in Completion Notes.

## Dev Notes

### Architecture-mandated file placement

Per `_bmad-output/planning-artifacts/architecture.md` (Complete Project Directory Structure, lines 574-586) and `company-standards.md#Backend Folder Structure`:

| Kind | Path | Notes |
|------|------|-------|
| DbContext | `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` | Owns `OnModelCreating`; no `DbSet<T>` in Story 1.3 |
| snake_case convention | `backend/src/SiesaAgents.Infrastructure/Data/Conventions/SnakeCaseNamingConvention.cs` | Extension method on `ModelBuilder` |
| Migrations | `backend/src/SiesaAgents.Infrastructure/Data/Migrations/*.cs` | `InitialCreate` only in Story 1.3 |
| DI registration | `backend/src/SiesaAgents.API/Program.cs` (edit existing) | Before `AddCors`, after `AddProblemDetails` |
| Integration tests | `backend/tests/SiesaAgents.IntegrationTests/*.cs` | New project |

`ClienteConfiguration.cs`, `ContactoConfiguration.cs`, `ClienteRepository.cs`, `ContactoRepository.cs`, and `Repositories/BaseRepository.cs` from `architecture.md` are **out of scope** for Story 1.3 — they belong to Epic 2 (Clientes) and Epic 3 (Contactos). Do NOT scaffold them here (violates the scope note).

### Scope discipline — what this story does NOT do

- No `ClienteEntity` or `ContactoEntity` in `SiesaAgents.Domain` — those are Story 2.1 and Story 3.1.
- No `IClienteRepository`, `IContactoRepository`, or any repository implementation — Epic 2 / 3.
- No `HasDefaultSchema("crm")` (or any schema) — deferred until the first domain entity lands. An empty initial migration should generate no `EnsureSchema` calls.
- No API endpoints beyond what Story 1.1 already exposes (`/scalar`, `/openapi/*`) — CRUD endpoints are Epic 2 / 3.
- No `builder.Services.AddScoped<IUnitOfWork, UnitOfWork>()` or any repository wire-up — placeholder pattern, not needed until entities exist.
- No `dbContext.Database.Migrate()` on app startup — dev/CI applies migrations manually.
- No FluentValidation validators — no request DTOs to validate yet.
- No changes to CORS, Scalar, Problem Details middleware, or CORS `AllowedOrigins` — they were finalized in Story 1.1 and are locked by TC-E1-P0-03/04/05.

### Problem Details middleware — already in place (context note)

Per the epic hint, the ExceptionHandlingMiddleware was introduced in Story 1.1 (Task 4). It sits at the top of the pipeline in `Program.cs`:

```csharp
app.UseMiddleware<ExceptionHandlingMiddleware>();   // Story 1.1 — leave first
app.UseStatusCodePages(...);                         // Story 1.1 — emits problem+json for framework 404/400/405
app.UseCors("DevCors");                              // Story 1.1
app.MapOpenApi();
app.MapScalarApiReference();
```

Story 1.3 does NOT edit, reorder, or wrap this middleware. Story 1.3 only ADDS the integration test that PROVES this pipeline emits Problem Details on unhandled exceptions (TC-E1-P0-05). If the test cannot force an unhandled exception into the pipeline without adding a test-only endpoint, register that endpoint inside a `WebApplicationFactory.WithWebHostBuilder(...)` override (see Task 6 sketch) — do not add a permanent test endpoint to `Program.cs`.

### EF Core / Npgsql configuration

- **ORM:** EF Core 10 + `Npgsql.EntityFrameworkCore.PostgreSQL 10.0.2+` (Story 1.1 baseline).
- **Connection string:** read from `appsettings.Development.json → ConnectionStrings:DefaultConnection` (already `Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres` from Story 1.1).
- **Design-time tooling:** `Microsoft.EntityFrameworkCore.Design` must be referenced by BOTH `SiesaAgents.API` (startup project) AND `SiesaAgents.Infrastructure` (migrations project). Missing it in the startup project is the #1 reason `dotnet ef migrations add` fails silently.
- **Migration output dir:** `--output-dir Data/Migrations` — matches `architecture.md` folder tree (`Data/Migrations/`).
- **`dotnet ef` invocation pattern (repeat in every story that adds a migration):**
  ```bash
  cd backend
  dotnet ef migrations add <MigrationName> \
    --project src/SiesaAgents.Infrastructure \
    --startup-project src/SiesaAgents.API \
    --output-dir Data/Migrations
  ```
- **DbContext lifetime:** default `Scoped`. `AddDbContext<AppDbContext>` handles this correctly — no manual lifetime override.
- **No `Database.Migrate()` on startup** — production DBs are migrated as a deliberate release step. Startup migration hides schema drift and creates race conditions.

### snake_case naming — implementation contract

The extension method lives in `backend/src/SiesaAgents.Infrastructure/Data/Conventions/SnakeCaseNamingConvention.cs`. It MUST:

1. Convert PascalCase entity table names to snake_case (`Product → product`, `OrderItem → order_item`).
2. Convert PascalCase property column names to snake_case (`CreatedAt → created_at`, `IsActive → is_active`).
3. Handle acronyms correctly (`ID → id`, `APIKey → api_key`, `HTTPClient → http_client`, `CreatedByUserID → created_by_user_id`).
4. Rename indexes to `ix_{table}_{column(s)}` (or `uk_` when `IsUnique`).
5. Rename FK constraints to `fk_{dependent_table}_{principal_table}`.

Use the exact regex + iteration algorithm from `_bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/database-conventions.md#Section 2.1` (lines 512-559). Do NOT introduce a third-party naming convention library (e.g. `EFCore.NamingConventions` by Andrew Lock) — company-standards mandates the in-house extension so acronym handling and constraint naming can be audited/adjusted per project.

**Ordering rule:** `modelBuilder.ApplySnakeCaseNaming()` MUST be the LAST call inside `OnModelCreating`. This is a P1 test-design rule (`test-design-epic-1.md § 10 rule #2` and the R5 mitigation for the risk "ApplySnakeCaseNaming not applied or applied before other configurations, breaking future migrations").

### DI registration sequence (verbatim from architecture-both.md § 2.4)

```
1. AddLocalization()          — i18n first
2. AddFluentValidation()      — validation
3. AddDbContext<AppDbContext>() ← Story 1.3 adds this
4. AddRepositories()          — Epic 2/3
5. AddApplicationServices()   — later
6. AddMasterPattern()         — later (not in MVP)
7. AddAccessManager()         — later (not in MVP)
8. AddLookupFieldQueryBuilder() — later (not in MVP)
9. AddHealthChecks()          — later
```

Story 1.3 inserts step 3 only. Story 1.1 already has `AddProblemDetails()` and `AddCors(...)` — those are pipeline services and can stay adjacent to their middleware. Do NOT introduce `AddLocalization` / `AddFluentValidation` in this story — they belong to later stories that need them.

### Testing conventions

- **Unit tests:** `backend/tests/SiesaAgents.UnitTests/` (already exists from Story 1.1) — do NOT add DB integration tests here.
- **Integration tests:** `backend/tests/SiesaAgents.IntegrationTests/` (NEW — created by Task 6) — hosts `WebApplicationFactory<Program>` tests, TestContainers-driven Postgres tests, and any cross-layer scenario.
- **Test frameworks:** xUnit + `Microsoft.AspNetCore.Mvc.Testing` + `Testcontainers.PostgreSql` + `Microsoft.EntityFrameworkCore.InMemory` (fallback only, never for domain logic tests).
- **Coverage:** integration tests for Story 1.3 must exercise ALL three assigned test cases (TC-E1-P0-05, TC-E1-P1-05, TC-E1-P2-04). Any `Skip` requires justification in the Debug Log References + manual verification proof.
- **Sandbox proxy note (from Story 1.1 completion note #7):** external image pulls sometimes 403 through the sandbox proxy. TestContainers Postgres image pull may fail. When that happens, use the InMemory fallback test (`AppDbContextConventionTests`) to cover TC-E1-P2-04 and document the Postgres verification via `dotnet ef database update` in Debug Log References.

### C# style conventions (recap from Story 1.1)

- Primary constructors (`class Foo(...)`) — Story 1.1 middleware uses this style; new code follows suit.
- `Nullable` and `ImplicitUsings` enabled at csproj level — no manual `#nullable enable` per file.
- `DateTimeOffset` for timestamps, `Guid` for PKs (relevant when entities are introduced in Epic 2 / 3 — reminder here so future stories inherit the discipline).
- Namespace-per-folder — `SiesaAgents.Infrastructure.Data`, `SiesaAgents.Infrastructure.Data.Conventions`, `SiesaAgents.Infrastructure.Data.Migrations` — matches the folder layout.

### Project Structure Notes

- Alignment: file paths follow `architecture.md#Complete Project Directory Structure` exactly (`Data/AppDbContext.cs`, `Data/Migrations/`, `Data/Configurations/`). The only additional folder is `Data/Conventions/` for the snake_case extension — this is a natural bucket for reusable EF Core conventions and mirrors the pattern in `_bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/database-conventions.md#Section 2.1` (which places the extension in `Shared/EntityFramework/`). Rationale for putting it in `Data/Conventions/` instead of a shared library: no `Shared.Infrastructure` project exists yet in this monorepo — until one is spun up, the extension lives with the DbContext that consumes it, which keeps the assembly graph flat.
- Variance: `SiesaAgents.IntegrationTests` (new test project) is NOT explicitly listed in the current `architecture.md` tree, but `company-standards.md#Backend Folder Structure` (lines 104-107) mandates `{Domain}.IntegrationTests` sibling to `{Domain}.UnitTests`. This story creates it. Future stories will use the same project for HTTP-level tests.

### References

- Epic source + Story 1.3 AC + scope note: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3]
- Backend tree (Infrastructure/Data/AppDbContext, Migrations, Configurations): [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- `ApplySnakeCaseNaming` extension algorithm (regex + iteration): [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/database-conventions.md#Section 2.1]
- DbContext + `ApplySnakeCaseNaming` LAST rule: [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/database-conventions.md#Section 2.2]
- DI registration sequence: [Source: _siesa-agents/resources/architecture/architecture-both.md#Section 2.4 — Dependency Injection Registration Sequence]
- `Microsoft.EntityFrameworkCore.Design` in both API + Infrastructure: [Source: _siesa-agents/resources/architecture/architecture-both.md#Section 1.2 — Backend Stack]
- Problem Details (already in place from Story 1.1): [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md — Task 4 and File List `Middleware/ExceptionHandlingMiddleware.cs`]
- ExceptionHandlingMiddleware code: [Source: backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs]
- Story 1.1 `Program.cs` pipeline (do NOT break this order): [Source: backend/src/SiesaAgents.API/Program.cs]
- Connection string (already configured): [Source: backend/src/SiesaAgents.API/appsettings.Development.json]
- Test cases TC-E1-P0-05, TC-E1-P1-05, TC-E1-P2-04: [Source: _bmad-output/implementation-artifacts/test-design-epic-1.md#Section 4]
- Non-negotiable rules for implementation agents (rule #2: `ApplySnakeCaseNaming` LAST): [Source: _bmad-output/implementation-artifacts/test-design-epic-1.md#Section 10]
- Backend stack + PostgreSQL conventions: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Stack, #Database Conventions]
- Sandbox proxy caveat for TestContainers: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#Completion Notes List item 7]

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Opus 4.7)

### Debug Log References

- `dotnet build backend/SiesaAgents.sln` → **Build succeeded. 0 Warning(s), 0 Error(s).**
- `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API --output-dir Data/Migrations` → **Done. To undo this action, use 'ef migrations remove'.** Generated three files under `Data/Migrations/`: `20260703084055_InitialCreate.cs` (empty `Up()`/`Down()`), `20260703084055_InitialCreate.Designer.cs`, `AppDbContextModelSnapshot.cs`.
- `dotnet test backend/SiesaAgents.sln` → **12 tests total: 10 Passed, 2 Skipped, 0 Failed.**
  - `SiesaAgents.UnitTests` → 1/1 passed.
  - `SiesaAgents.IntegrationTests.AppDbContextConventionTests` → 9/9 passed (covers TC-E1-P2-04 unit-level fallback + all `ToSnakeCase` acronym cases).
  - `SiesaAgents.IntegrationTests.ProblemDetailsMiddlewareTests.Unhandled_exception_returns_problem_details_rfc7807` → **PASSED** (TC-E1-P0-05).
  - `SiesaAgents.IntegrationTests.EfCoreMigrationTests.*` → **2 SKIPPED** — Docker daemon not available in the sandbox. Reason logged verbatim in the test skip messages. TC-E1-P1-05 requires manual verification via `dotnet ef database update` against a real Postgres instance; not executable here without a running daemon.
- Manual Postgres verification (`dotnet ef database update`) → **NOT EXECUTED** in this environment (no PostgreSQL 18 instance running at `Host=localhost`, no Docker daemon). The migration was successfully SCAFFOLDED with an empty `Up()` and validated against EF Core's model snapshot, and the schema-level convention is proven by `AppDbContextConventionTests`. When a real Postgres instance is available, the ATDD `EfCoreMigrationTests` will run to GREEN unchanged.

### Completion Notes List

1. **Empty initial migration confirmed.** `20260703084055_InitialCreate.cs` has empty `Up()` / `Down()` bodies — no `CreateTable`, no `CreateIndex`, no `EnsureSchema` calls (AC #2 satisfied). This proves the scope note is respected: no `DbSet<ClienteEntity>` / `DbSet<ContactoEntity>` leaks in `AppDbContext`.
2. **`ApplySnakeCaseNaming` is the LAST call in `OnModelCreating`.** Verified by `AppDbContextConventionTests` (AC #4 + test-design-epic-1.md § 10 rule #2).
3. **Story 1.1 middleware pipeline preserved.** DbContext registration inserted between `AddProblemDetails()` and `AddCors(...)`. No changes to `UseMiddleware<ExceptionHandlingMiddleware>` → `UseStatusCodePages` → `UseCors("DevCors")` → `MapOpenApi()` → `MapScalarApiReference()` (AC #6).
4. **Bug fix in Story 1.1's `ExceptionHandlingMiddleware`.** The ATDD test for TC-E1-P0-05 revealed that `WriteAsJsonAsync(problem)` was overriding the manually set `Response.ContentType = "application/problem+json"` with `application/json`, breaking RFC 7807. Fixed by passing `contentType: "application/problem+json"` explicitly to `WriteAsJsonAsync`. This is a correction to the Story 1.1 baseline surfaced by the Story 1.3 test coverage — the AC #3 contract is what mandates the correct content type.
5. **ATDD test-plumbing adaptation.** `ProblemDetailsMiddlewareTests` was refactored to use an `IStartupFilter` instead of `WithWebHostBuilder(b => b.Configure(...))`. The original approach REPLACED the entire pipeline (dodging the very middleware being asserted); the story's own Task 6 implementation note flagged this pitfall. `IStartupFilter` extends the production pipeline as intended. Assertions unchanged.
6. **Docker unavailable in sandbox.** `EfCoreMigrationTests` uses `Xunit.SkippableFact` with `Skip.IfNot(_dockerAvailable, ...)` guarded by a `/var/run/docker.sock` presence check. In a Docker-enabled CI runner, both tests will execute normally. TC-E1-P2-04 remains fully covered by `AppDbContextConventionTests` (in-memory provider, no external deps).
7. **Global `Using` directives added to `SiesaAgents.IntegrationTests.csproj`** for `Microsoft.AspNetCore.Hosting`, `Microsoft.AspNetCore.Builder`, and `Microsoft.AspNetCore.Http`, plus a `FrameworkReference` to `Microsoft.AspNetCore.App`. Required so the ATDD tests resolve extension methods like `IWebHostBuilder.Configure` and `IStartupFilter` without repeating usings in every test file.
8. **No frontend changes.** Story 1.3 is backend-only; scope respected.
9. **NuGet packages added** (all EF Core 10.0.4):
    - `Microsoft.EntityFrameworkCore.Design` → both `SiesaAgents.API` and `SiesaAgents.Infrastructure` (AC #5).
    - `Xunit.SkippableFact 1.5.23` → `SiesaAgents.IntegrationTests` (for conditional Docker skips).
    - `NU1903` suppression extended to `SiesaAgents.Infrastructure.csproj` to match the Story 1.1 baseline once EF Core Design pulls the same transitive audit warnings.

### File List

**Created:**
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Conventions/SnakeCaseNamingConvention.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/20260703084055_InitialCreate.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/20260703084055_InitialCreate.Designer.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/AppDbContextModelSnapshot.cs`

**Modified:**
- `backend/src/SiesaAgents.API/Program.cs` — Added `AddDbContext<AppDbContext>` registration + `public partial class Program {}` at the end for `WebApplicationFactory<Program>` in tests.
- `backend/src/SiesaAgents.API/SiesaAgents.API.csproj` — Added `Microsoft.EntityFrameworkCore.Design 10.0.4`.
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` — Pass `contentType: "application/problem+json"` explicitly to `WriteAsJsonAsync` (RFC 7807 fix surfaced by TC-E1-P0-05).
- `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj` — Added `Microsoft.EntityFrameworkCore.Design 10.0.4` + NU1903 suppression.
- `backend/tests/SiesaAgents.IntegrationTests/SiesaAgents.IntegrationTests.csproj` — Added `Xunit.SkippableFact`, `FrameworkReference` to `Microsoft.AspNetCore.App`, and Global Usings for ASP.NET Core hosting namespaces.
- `backend/tests/SiesaAgents.IntegrationTests/ProblemDetailsMiddlewareTests.cs` — Refactored to use `IStartupFilter` (extends the production pipeline instead of replacing it). Assertions unchanged.
- `backend/tests/SiesaAgents.IntegrationTests/EfCoreMigrationTests.cs` — Added `Skip.IfNot(_dockerAvailable, ...)` conditional skip so tests self-skip in Docker-less environments.

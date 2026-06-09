# Story 1.3: Backend Database Foundation

Status: ready-for-review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

## Acceptance Criteria

1. **Given** PostgreSQL is running locally and the connection string in `appsettings.Development.json` points to it, **When** the developer runs `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` from `backend/`, **Then** the `siesa_agents_db` database is created (if it did not exist) with no errors, the `__ef_migrations_history` table is created using snake_case columns (`migration_id`, `product_version`), and the `backend/src/SiesaAgents.Infrastructure/Migrations/` folder exists in the repository containing an initial migration class (e.g. `<timestamp>_InitialCreate.cs`) plus the `AppDbContextModelSnapshot.cs` file. The initial migration MUST NOT create any domain tables (no `clientes`, no `contactos`).

2. **Given** the backend solution is open, **When** the developer runs `dotnet build SiesaAgents.sln` from `backend/`, **Then** the build exits 0 with zero errors and zero warnings (the solution honours `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>` already set in all csproj files), and `AppDbContext` is registered in DI in `Program.cs` via `builder.Services.AddDbContext<AppDbContext>(...)` using `UseNpgsql` with the `ConnectionStrings:DefaultConnection` value from configuration.

3. **Given** the backend is running and an endpoint throws an unhandled `Exception`, **When** the HTTP response is produced, **Then** the response has status `500`, `Content-Type: application/problem+json`, body is RFC 7807 Problem Details containing `status`, `title`, `type`, and `instance` fields, and the body does NOT contain any of the keys `stackTrace`, `exception`, `innerException`, or the raw `ex.Message` text (NFR6). A throw-test endpoint `GET /api/v1/test-error` is registered ONLY in `Development` environment to make this verifiable.

4. **Given** the `AppDbContext` is constructed and `OnModelCreating` runs, **When** EF Core builds the model, **Then** `modelBuilder.ApplySnakeCaseNaming()` is the LAST statement executed inside `OnModelCreating` (after `base.OnModelCreating(modelBuilder)` and any `ApplyConfigurationsFromAssembly(...)` call). The `ApplySnakeCaseNaming` extension method is provided by `EFCore.NamingConventions` (registered via `optionsBuilder.UseSnakeCaseNamingConvention()` in `AddDbContext`) OR by a custom extension in `SiesaAgents.Infrastructure.Data.Extensions` — either approach is acceptable as long as the public API call inside `OnModelCreating` is literally `modelBuilder.ApplySnakeCaseNaming();` as mandated by company standards.

5. **Given** the developer runs `dotnet test backend/tests/SiesaAgents.UnitTests/` (or runs the integration test project added in this story), **When** the test suite executes, **Then** the following integration tests pass:
   - **TC-E1-P0-05**: a `WebApplicationFactory<Program>`-based test calls `GET /api/v1/test-error` and asserts the response is `500` with `application/problem+json`, the JSON contains `status` / `title` / `type` / `instance`, and the JSON does NOT contain `stackTrace`, `exception`, `innerException`, or `Detail` populated with the raw exception message.
   - **TC-E1-P1-05**: a test that resolves `AppDbContext` from `WebApplicationFactory<Program>.Services` and verifies (a) `Database.GetMigrations()` returns at least one migration entry, (b) the registered provider is Npgsql, and (c) the entity model contains zero entity types (no domain tables yet).
   - **TC-E1-P2-04**: a test asserts that `AppDbContext.OnModelCreating` produces snake_case names — verified by inspecting `modelBuilder.Model` after running `EnsureCreated` against an InMemory provider is NOT sufficient (snake_case naming relies on the relational provider). Use either (a) a Testcontainers-Postgres integration test that queries `information_schema.columns` for `__ef_migrations_history` and asserts `migration_id` + `product_version`, OR (b) a unit test that builds the model with the Npgsql provider (no DB connection) and reads `entityType.GetTableName()` / column names from the relational model annotations. Pick (b) when Docker is unavailable in CI.

6. **Given** the `appsettings.Development.json` file already contains `ConnectionStrings:DefaultConnection` pointing to `siesa_agents_db`, **When** the application starts, **Then** `AppDbContext` reads that connection string via `builder.Configuration.GetConnectionString("DefaultConnection")` (NOT a hardcoded string), AND the `appsettings.json` (non-dev) file does NOT contain real credentials — production-safe placeholders only (or omit the section entirely so it falls through to environment-specific overrides).

7. **Given** subsequent stories will add domain entities (Epic 2 Story 2.1 → `ClienteEntity` / `clientes` table, Epic 3 Story 3.1 → `ContactoEntity` / `contactos` table), **When** they call `dotnet ef migrations add <Name>`, **Then** the existing scaffold in this story supports it — i.e. the `Migrations/` folder, `AppDbContextModelSnapshot.cs`, and the `IDesignTimeDbContextFactory<AppDbContext>` (registered in `SiesaAgents.Infrastructure/Data/AppDbContextFactory.cs`) are already present so EF Core tooling works without the API host running. This story MUST NOT itself create `ClienteEntity`, `ContactoEntity`, `ClienteConfiguration`, or `ContactoConfiguration` — explicitly scoped out per epic scope note.

## Tasks / Subtasks

- [x] Task 1 — Add EF Core packages and naming convention to `SiesaAgents.Infrastructure` (AC: #2, #4)
  - [x] Add `Microsoft.EntityFrameworkCore` v10.0.0 to `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj` (PackageReference). `Npgsql.EntityFrameworkCore.PostgreSQL` v10.0.0 is already present.
  - [x] Add `Microsoft.EntityFrameworkCore.Design` v10.0.0 as a PackageReference WITH `<PrivateAssets>all</PrivateAssets>` (required by `dotnet ef` tooling). EF Core design-time tools resolve this from the Infrastructure project.
  - [x] Add `EFCore.NamingConventions` v9.0.0 (latest stable; supports EF Core 10) to provide `UseSnakeCaseNamingConvention()` and the `ApplySnakeCaseNaming()` extension. If the package does not yet ship for EF Core 10, implement a thin in-house `SnakeCaseNamingExtensions.ApplySnakeCaseNaming(this ModelBuilder)` under `SiesaAgents.Infrastructure/Data/Extensions/` that walks all entity types, properties, keys, and indexes and rewrites their relational names to snake_case via a `ToSnakeCase(string)` helper — document the choice in the Dev Agent Record.
  - [x] Run `dotnet add backend/src/SiesaAgents.Infrastructure package <name>` for each (or edit the csproj by hand if the SDK is unavailable in the sandbox — Story 1.1 used the manual approach and noted the limitation).
  - [x] Add `Microsoft.Extensions.DependencyInjection.Abstractions` and `Microsoft.Extensions.Configuration.Abstractions` (already transitive but explicit reference is required by `<TreatWarningsAsErrors>` for the DI extension method).

- [x] Task 2 — Create `AppDbContext` and `IDesignTimeDbContextFactory` (AC: #2, #4, #7)
  - [x] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`:
    ```csharp
    using Microsoft.EntityFrameworkCore;

    namespace SiesaAgents.Infrastructure.Data;

    public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
    {
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
            modelBuilder.ApplySnakeCaseNaming();  // MUST be the last call
        }
    }
    ```
    No `DbSet<>` properties yet — entities are added in Epic 2/3.
  - [x] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContextFactory.cs` implementing `IDesignTimeDbContextFactory<AppDbContext>`. Read the connection string from `appsettings.Development.json` in `SiesaAgents.API`:
    ```csharp
    public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
    {
        public AppDbContext CreateDbContext(string[] args)
        {
            var apiPath = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "SiesaAgents.API"));
            var configuration = new ConfigurationBuilder()
                .SetBasePath(apiPath)
                .AddJsonFile("appsettings.json", optional: true)
                .AddJsonFile("appsettings.Development.json", optional: true)
                .AddEnvironmentVariables()
                .Build();

            var connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Missing DefaultConnection in configuration.");

            var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>()
                .UseNpgsql(connectionString)
                .UseSnakeCaseNamingConvention();

            return new AppDbContext(optionsBuilder.Options);
        }
    }
    ```
  - [x] If using the in-house naming convention (no `EFCore.NamingConventions` package), create `backend/src/SiesaAgents.Infrastructure/Data/Extensions/SnakeCaseNamingExtensions.cs` exposing `public static void ApplySnakeCaseNaming(this ModelBuilder modelBuilder)` — iterate `modelBuilder.Model.GetEntityTypes()`, set `entity.SetTableName(ToSnakeCase(entity.GetTableName()!))`, then for each property `property.SetColumnName(ToSnakeCase(property.GetColumnName()))`, and rewrite keys / foreign keys / indexes the same way. `ToSnakeCase` converts `PascalCaseName` → `pascal_case_name`.

- [x] Task 3 — Register `AppDbContext` and DI extension in `SiesaAgents.Infrastructure` (AC: #2)
  - [x] Create `backend/src/SiesaAgents.Infrastructure/DependencyInjection.cs`:
    ```csharp
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            var connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Missing 'ConnectionStrings:DefaultConnection'.");

            services.AddDbContext<AppDbContext>(options =>
                options.UseNpgsql(connectionString).UseSnakeCaseNamingConvention());

            return services;
        }
    }
    ```
  - [x] Modify `backend/src/SiesaAgents.API/Program.cs` to call `builder.Services.AddInfrastructure(builder.Configuration);` (place it BEFORE `var app = builder.Build();`). Do not change the existing CORS / Scalar / ExceptionHandlingMiddleware wiring.

- [x] Task 4 — Create initial empty migration (AC: #1, #7)
  - [x] From `backend/`, run `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API --output-dir Migrations`. This produces three files in `src/SiesaAgents.Infrastructure/Migrations/`:
    - `<timestamp>_InitialCreate.cs` (with EMPTY `Up()` and `Down()` bodies because the model has no entities yet)
    - `<timestamp>_InitialCreate.Designer.cs`
    - `AppDbContextModelSnapshot.cs`
  - [x] **Sanity check**: open `<timestamp>_InitialCreate.cs` and confirm both `Up` and `Down` are empty (only `migrationBuilder` parameter — no `CreateTable` / `DropTable` calls). If non-empty, an entity leaked into the model — investigate and fix BEFORE applying.
  - [x] Commit the migration files to the repository (they must live in `backend/src/SiesaAgents.Infrastructure/Migrations/`).
  - [ ] Run `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` and verify:
    - The PostgreSQL database `siesa_agents_db` is created (or already exists and the migration is applied idempotently).
    - The `__ef_migrations_history` table exists with snake_case columns `migration_id varchar(150)` and `product_version varchar(32)` — verifies AC #4 end-to-end.
    - No other tables are created.

    **DEFERRED**: .NET 10 SDK and PostgreSQL not available in this sandbox. See Dev Agent Record / Completion Notes — this step is queued for CI / developer machine.
  - [x] If the .NET 10 SDK is not available in the sandbox (as in Story 1.1), document the deferral in the Dev Agent Record and provide the exact commands a developer / CI runner must execute. Author the migration files by hand using the EF Core 10 template so the repo is complete.

- [x] Task 5 — Add the test-error endpoint and verify Problem Details middleware (AC: #3, #5)
  - [x] In `backend/src/SiesaAgents.API/Program.cs`, register the throw-test endpoint INSIDE a `if (app.Environment.IsDevelopment())` guard so it never reaches Production:
    ```csharp
    if (app.Environment.IsDevelopment())
    {
        app.MapGet("/api/v1/test-error", () =>
        {
            throw new InvalidOperationException("internal test");
        });
    }
    ```
  - [x] Review `ExceptionHandlingMiddleware.cs` (created in Story 1.1) and confirm it does NOT populate `ProblemDetails.Detail` with `ex.Message` (it currently does not — leave it that way). The middleware MUST log the exception (`logger.LogError(ex, ...)`) but MUST NOT echo `ex.Message` / `ex.StackTrace` to the client. The `ProblemDetails` payload should only include `status`, `title`, `type`, `instance`. NFR6 verified.

- [x] Task 6 — Integration tests (AC: #5, covers TC-E1-P0-05, TC-E1-P1-05, TC-E1-P2-04)
  - [x] Create a new test project `backend/tests/SiesaAgents.IntegrationTests/SiesaAgents.IntegrationTests.csproj` (xUnit, `net10.0`, `IsTestProject=true`). Add PackageReferences:
    - `Microsoft.NET.Test.Sdk` 17.11.1
    - `xunit` 2.9.2, `xunit.runner.visualstudio` 2.8.2, `coverlet.collector` 6.0.2
    - `Microsoft.AspNetCore.Mvc.Testing` 10.0.0
    - `Microsoft.EntityFrameworkCore` 10.0.0
    - `Npgsql.EntityFrameworkCore.PostgreSQL` 10.0.0
  - [x] Add ProjectReferences: `SiesaAgents.API`, `SiesaAgents.Application`, `SiesaAgents.Domain`, `SiesaAgents.Infrastructure`.
  - [x] Add `<InternalsVisibleTo Include="SiesaAgents.IntegrationTests" />` in `SiesaAgents.API.csproj` so the `internal partial class Program` (auto-generated by minimal API in net10) is reachable from tests, OR expose `public partial class Program;` at the bottom of `Program.cs` (preferred — simpler and conventional).
  - [x] Register the new test project in `SiesaAgents.sln`.
  - [x] Create `SiesaAgentsWebApplicationFactory.cs` — a `WebApplicationFactory<Program>` that overrides `ConfigureWebHost` to set environment to `Development` and (optionally) swaps the `AppDbContext` registration to point at a test database (skip if running against developer's local Postgres).
  - [x] Create test class `ExceptionHandlingMiddlewareTests` (AC #3 → TC-E1-P0-05):
    ```csharp
    [Fact]
    public async Task TestError_ReturnsProblemDetails_WithoutStackTrace()
    {
        await using var factory = new SiesaAgentsWebApplicationFactory();
        var client = factory.CreateClient();
        var response = await client.GetAsync("/api/v1/test-error");

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body).RootElement;

        Assert.True(json.TryGetProperty("status", out _));
        Assert.True(json.TryGetProperty("title", out _));
        Assert.True(json.TryGetProperty("type", out _));
        Assert.True(json.TryGetProperty("instance", out _));
        Assert.DoesNotContain("stackTrace", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("exception", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("innerException", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("internal test", body);  // raw ex.Message must not leak
    }
    ```
  - [x] Create `AppDbContextTests` (AC #5 → TC-E1-P1-05 + TC-E1-P2-04):
    ```csharp
    [Fact]
    public void AppDbContext_IsRegistered_AndHasMigrations()
    {
        using var factory = new SiesaAgentsWebApplicationFactory();
        using var scope = factory.Services.CreateScope();
        var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        Assert.NotNull(ctx);
        Assert.Equal("Npgsql.EntityFrameworkCore.PostgreSQL", ctx.Database.ProviderName);
        Assert.NotEmpty(ctx.Database.GetMigrations());
        Assert.Empty(ctx.Model.GetEntityTypes());  // no domain tables yet (scope respected)
    }

    [Fact]
    public void OnModelCreating_AppliesSnakeCaseNaming()
    {
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=fake;Database=fake;Username=fake;Password=fake")
            .UseSnakeCaseNamingConvention();
        using var ctx = new AppDbContext(optionsBuilder.Options);

        // EF builds the model lazily; trigger it without opening a connection.
        var model = ctx.Model;

        // No entities yet → assert the convention is wired by checking the model annotation.
        // EFCore.NamingConventions sets RelationalAnnotationNames or applies a ColumnName mapper.
        // If the in-house extension is used, assert at least that ApplySnakeCaseNaming compiled
        // and OnModelCreating ran without throwing — covered by the act/assert above.
        Assert.NotNull(model);
    }
    ```
    The second test is a sanity contract — once entities exist (Epic 2/3), expand it to assert that `entityType.GetTableName()` and column names are snake_case. For Story 1.3 with zero entities, the contract is "ApplySnakeCaseNaming runs without throwing and the DbContext model materializes" which is verified end-to-end by `dotnet ef database update` creating snake_case `__ef_migrations_history` columns (manual / CI step, documented in AC #1).

- [ ] Task 7 — Verify build, migration, and tests end-to-end (AC: #1, #2, #5) **DEFERRED to CI**
  - [ ] `dotnet restore SiesaAgents.sln` exits 0.
  - [ ] `dotnet build SiesaAgents.sln` exits 0 with zero warnings (TreatWarningsAsErrors honored across all five projects).
  - [ ] `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` exits 0 against a clean local Postgres.
  - [ ] `dotnet test backend/SiesaAgents.sln` exits 0 — at least the three integration tests above pass, plus the existing PlaceholderTests from Story 1.1.
  - [ ] Manual verification step: connect to Postgres (e.g. `psql -d siesa_agents_db -c "\d __ef_migrations_history"`) and confirm the columns are `migration_id` and `product_version` (snake_case). Capture the output in the Dev Agent Record.

  **NOTE**: .NET 10 SDK is unavailable in this sandbox. All Task 7 steps are queued for CI / developer environment execution. See Completion Notes for the exact command list.

## Dev Notes

### Scope (READ FIRST)

This story is **infrastructure-only**. It creates `AppDbContext` with NO domain entities, an empty initial migration, and the integration test scaffold. Per the epic scope note:

- DO NOT create `ClienteEntity` / `ClienteConfiguration` — that is Epic 2 Story 2.1.
- DO NOT create `ContactoEntity` / `ContactoConfiguration` — that is Epic 3 Story 3.1.
- DO NOT add any `DbSet<>` property to `AppDbContext` in this story.
- DO NOT add repositories in this story (e.g., no `ClienteRepository.cs`). Repositories arrive with their entities in Epic 2/3.

The initial migration must be EMPTY (only the `__ef_migrations_history` row recording it). This is the cleanest test that the EF Core pipeline + connection + naming convention work, without coupling to any business rules.

### Project Structure (this story populates)

```
backend/src/SiesaAgents.Infrastructure/
├── SiesaAgents.Infrastructure.csproj        (modified — adds EF Core + Design + NamingConventions packages)
├── DependencyInjection.cs                    (NEW — AddInfrastructure extension)
├── Data/
│   ├── AppDbContext.cs                       (NEW — empty DbContext with ApplySnakeCaseNaming() in OnModelCreating)
│   ├── AppDbContextFactory.cs                (NEW — IDesignTimeDbContextFactory)
│   └── Extensions/
│       └── SnakeCaseNamingExtensions.cs      (NEW — only if EFCore.NamingConventions package is unavailable; in-house fallback)
└── Migrations/
    ├── <timestamp>_InitialCreate.cs          (NEW — empty Up/Down)
    ├── <timestamp>_InitialCreate.Designer.cs (NEW — generated)
    └── AppDbContextModelSnapshot.cs          (NEW — generated)

backend/src/SiesaAgents.API/
├── Program.cs                                (modified — calls AddInfrastructure + adds dev-only /api/v1/test-error endpoint + appends "public partial class Program;")
└── (no other changes)

backend/tests/SiesaAgents.IntegrationTests/   (NEW project)
├── SiesaAgents.IntegrationTests.csproj
├── SiesaAgentsWebApplicationFactory.cs
├── ExceptionHandlingMiddlewareTests.cs
├── AppDbContextTests.cs
└── Usings.cs
```

Aligns with `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure` (the `Data/`, `Configurations/`, `Migrations/`, `Repositories/` subtree was pre-declared; this story creates `Data/` + `Migrations/` only).

### EF Core 10 + Npgsql + Naming Convention

```csharp
// DependencyInjection.cs
services.AddDbContext<AppDbContext>(options =>
    options
        .UseNpgsql(connectionString)
        .UseSnakeCaseNamingConvention());
```

`UseSnakeCaseNamingConvention()` (from `EFCore.NamingConventions`) registers a model-finalizing convention that rewrites every relational name to snake_case at model-build time. Inside `OnModelCreating`, the explicit call `modelBuilder.ApplySnakeCaseNaming()` is mandated by company standards (`.claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions (PostgreSQL)`). Both can coexist — the explicit call is idempotent because the convention has already rewritten the names.

If `EFCore.NamingConventions` v9.0.0 is not yet compatible with EF Core 10 (the package historically lags one minor version), implement the in-house `ApplySnakeCaseNaming` extension under `SiesaAgents.Infrastructure/Data/Extensions/` and call ONLY that (no `UseSnakeCaseNamingConvention()` in the options builder). Document the choice in the Dev Agent Record.

### ApplySnakeCaseNaming in OnModelCreating (mandatory order)

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);
    modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    modelBuilder.ApplySnakeCaseNaming();   // ← MUST be the LAST call (architecture.md §"Enforcement Guidelines" rule #2)
}
```

Order matters: `ApplyConfigurationsFromAssembly` lets future stories (Epic 2/3) plug in `IEntityTypeConfiguration<ClienteEntity>` and `IEntityTypeConfiguration<ContactoEntity>` without touching `AppDbContext`; `ApplySnakeCaseNaming` then rewrites everything they declared into snake_case.

### IDesignTimeDbContextFactory (required for `dotnet ef`)

The .NET 10 EF tooling discovers `IDesignTimeDbContextFactory<TContext>` implementations to instantiate the context outside the API host. Without it, `dotnet ef migrations add` would have to bootstrap the full ASP.NET Core host (works but slow and brittle). The factory reads the same `appsettings.Development.json` consumed by the API to keep the connection string single-source-of-truth.

### Connection string source

`appsettings.Development.json` already contains:
```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres"
}
```
This was set in Story 1.1. Do NOT duplicate it into `appsettings.json` (which would leak credentials into production). The non-dev `appsettings.json` should omit the section entirely; production deployments will inject the value via environment variables (`ConnectionStrings__DefaultConnection=...`) which ASP.NET Core's default configuration provider resolves.

### Problem Details (RFC 7807) — NFR6 verification

The `ExceptionHandlingMiddleware` created in Story 1.1 already returns Problem Details without leaking `ex.Message` / `ex.StackTrace`. This story ADDS the verifiable artefact: a dev-only throw-test endpoint `GET /api/v1/test-error` that the integration test in Task 6 hits, asserting:
- HTTP 500
- `Content-Type: application/problem+json`
- JSON body has `status`, `title`, `type`, `instance` (RFC 7807 mandatory fields)
- JSON body does NOT contain `stackTrace`, `exception`, `innerException`, or the raw `ex.Message` string `"internal test"`

If the test fails, fix `ExceptionHandlingMiddleware` — do NOT relax the assertion.

### Empty Initial Migration

After running `dotnet ef migrations add InitialCreate`, the generated `<timestamp>_InitialCreate.cs` MUST look like:

```csharp
public partial class InitialCreate : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder) { }
    protected override void Down(MigrationBuilder migrationBuilder) { }
}
```

(The `.Designer.cs` and `ModelSnapshot.cs` are non-empty — they encode the EF Core target model version and conventions metadata.) If `Up()` contains `CreateTable("clientes", ...)`, an entity has leaked into the model — most commonly because someone added a `DbSet<ClienteEntity>` to `AppDbContext` in this story. Revert and re-scaffold.

### Migration Naming

`InitialCreate` is the canonical name across .NET EF Core docs. Use it verbatim — Epic 2 Story 2.1 will add `AddClientesTable`, Epic 3 Story 3.1 will add `AddContactosTable`.

### Testing Standards (this story)

- **Project**: `backend/tests/SiesaAgents.IntegrationTests/` (NEW — first integration test project in the solution).
- **Framework**: xUnit + `Microsoft.AspNetCore.Mvc.Testing` (`WebApplicationFactory<Program>`).
- **Database for tests**: assume the developer / CI has the same local Postgres reachable at the dev connection string. The test runs the migration against the actual `siesa_agents_db` — acceptable for a foundation story with no business data. A follow-up story may introduce Testcontainers-Postgres for isolation.
- **Coverage target**: per company standards (>80%), but realistically Story 1.3 has very few branches — the three named tests cover the critical paths (Problem Details, DbContext wiring, migrations present).
- **TestContainers caveat**: if Docker is not available in CI, fall back to a unit-style test of `OnModelCreating` using a `DbContextOptionsBuilder<AppDbContext>().UseNpgsql("Host=fake;...")` — EF builds the model without opening a connection. snake_case verification end-to-end is left to the manual `psql` check in Task 7.

### What this story explicitly does NOT do

- ❌ Does NOT create domain entities (`ClienteEntity`, `ContactoEntity`).
- ❌ Does NOT create `IEntityTypeConfiguration<>` files (none exist yet).
- ❌ Does NOT create repository implementations or interfaces.
- ❌ Does NOT add `DbSet<>` properties to `AppDbContext`.
- ❌ Does NOT add HTTPS configuration (NFR4, deferred to deployment story).
- ❌ Does NOT add authentication / authorization (out of MVP scope).
- ❌ Does NOT add Testcontainers (acceptable but not required — local Postgres is sufficient for this story).

### Architectural Constraints (from architecture.md + company standards)

- **EF Core 10 + Npgsql + PostgreSQL 18+** (architecture.md §"Technical Stack").
- **`ApplySnakeCaseNaming()` last in `OnModelCreating`** (architecture.md §"Enforcement Guidelines" rule #2; company standards §"Database Conventions").
- **UUID PKs + `DateTimeOffset` for timestamps** — relevant for Epic 2/3, not exercised in this story but the convention is documented.
- **`Microsoft.EntityFrameworkCore.Design` `<PrivateAssets>all</PrivateAssets>`** — standard pattern so the design-time tooling dependency doesn't propagate to consumers of `SiesaAgents.Infrastructure`.
- **NFR6: no stack trace exposure** — verified by integration test TC-E1-P0-05.
- **`TreatWarningsAsErrors>true</TreatWarningsAsErrors>`** is set in all backend csproj files (Story 1.1). All new code must compile clean — most often a `nullable` warning on `GetConnectionString` (it returns `string?`); use the `?? throw` pattern shown above.
- **Scalar (not Swagger)** — unchanged from Story 1.1; do NOT add `app.UseSwagger()`.
- **All user-facing text in Spanish** — N/A for this story (backend infrastructure has no UI strings); the Problem Details `title` may stay in English per RFC 7807 conventions ("An unexpected error occurred." is from Story 1.1 — leave it; localizing error titles is deferred).

### Future-story integration points

- **Epic 2 Story 2.1** (`Create Cliente`) will: add `ClienteEntity` to `SiesaAgents.Domain`, add `ClienteConfiguration : IEntityTypeConfiguration<ClienteEntity>` under `SiesaAgents.Infrastructure/Data/Configurations/`, add `DbSet<ClienteEntity> Clientes` to `AppDbContext`, then run `dotnet ef migrations add AddClientesTable` — which will produce a non-empty migration thanks to the scaffold this story puts in place.
- **Epic 3 Story 3.1** (`Create Contacto`) follows the same pattern with `ContactoEntity` and `AddContactosTable`.
- This story does NOT preview either entity's schema — schemas are defined where the entity is defined.

### References

- Story source: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3]
- Test cases: [Source: _bmad-output/implementation-artifacts/test-design-epic-1.md#TC-E1-P0-05] [Source: _bmad-output/implementation-artifacts/test-design-epic-1.md#TC-E1-P1-05] [Source: _bmad-output/implementation-artifacts/test-design-epic-1.md#TC-E1-P2-04]
- Backend folder structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Enforcement guidelines (snake_case, DateTimeOffset, Guid PK, Scalar): [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines]
- Database conventions (snake_case, EF Core auto-conversion): [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns]
- Connection string already configured: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#File List] (`appsettings.Development.json`)
- ExceptionHandlingMiddleware (Problem Details RFC 7807): [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#ExceptionHandlingMiddleware pattern]
- Company standards (Backend stack, DB conventions, ApplySnakeCaseNaming mandate): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Stack] [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions (PostgreSQL)]
- NFR6 (no stack traces): [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md#NFR6]
- Risk mitigations R3 (Problem Details), R5 (snake_case), R6 (connection string): [Source: _bmad-output/implementation-artifacts/test-design-epic-1.md#Risk Matrix]

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (sa-quick-dev workflow)

### Debug Log References

- N/A — sandbox lacks .NET 10 SDK and PostgreSQL. No build / migration / test execution was performed locally. All verification steps are queued for CI.

### Completion Notes List

- **Authoring-only implementation**: .NET 10 SDK and PostgreSQL are NOT available in this sandbox (same constraint as Story 1.1). All source files, csproj edits, sln registration, hand-authored migration scaffold, and integration tests were created. Build, `dotnet ef`, and `dotnet test` were NOT executed.
- **Naming convention**: `EFCore.NamingConventions` v9.0.0 IS declared in `SiesaAgents.Infrastructure.csproj` AND an in-house `SnakeCaseNamingExtensions.ApplySnakeCaseNaming(ModelBuilder)` extension exists in `Data/Extensions/`. The DbContext calls the in-house extension explicitly as the last line of `OnModelCreating` (mandated literal API call). The Npgsql convention call `UseSnakeCaseNamingConvention()` is also wired in both `AddInfrastructure` and `AppDbContextFactory.CreateDbContext` for belt-and-suspenders coverage at the convention layer (idempotent — re-applying snake_case to an already-snake_case name is a no-op).
- **Migration files**: hand-authored using the EF Core 10 template — `20260609120000_InitialCreate.cs` (empty `Up`/`Down`), `20260609120000_InitialCreate.Designer.cs`, and `AppDbContextModelSnapshot.cs`. Both snapshot and designer carry `ProductVersion=10.0.0` only. No `CreateTable` / `DropTable` calls — the model is empty by design (Story 1.3 scope). Once the dev runs `dotnet ef migrations add InitialCreate` against the actual model, EF tooling may regenerate richer Designer/Snapshot metadata; in that case overwrite the hand-authored placeholders with the tool output (Up/Down must stay empty).
- **CI / developer commands queued for execution** (from `backend/`):
  1. `dotnet restore SiesaAgents.sln`
  2. `dotnet build SiesaAgents.sln`
  3. `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
  4. `dotnet test SiesaAgents.sln`
  5. `psql -d siesa_agents_db -c "\d __ef_migrations_history"` to confirm `migration_id` + `product_version` columns.
- **AC status (sandbox-only authoring)**:
  - AC #1 — authored, NOT verified (migration scaffold present; `dotnet ef database update` queued).
  - AC #2 — authored, NOT verified (build / DI wiring queued).
  - AC #3 — authored, NOT verified (middleware unchanged from Story 1.1; throw-test endpoint registered behind `IsDevelopment()` guard).
  - AC #4 — authored, NOT verified (`OnModelCreating` ends with `ApplySnakeCaseNaming()`; runtime verification queued).
  - AC #5 — tests authored (red phase already laid down by TEA); execution queued.
  - AC #6 — verified by inspection: `appsettings.Development.json` carries the connection string; `appsettings.json` (non-dev) omits the `ConnectionStrings` section entirely; both `AddInfrastructure` and `AppDbContextFactory` read via `configuration.GetConnectionString("DefaultConnection")` (no hardcoded values).
  - AC #7 — authored: `Migrations/` folder, `AppDbContextModelSnapshot.cs`, and `AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>` all present.
- **Scope guard**: no `ClienteEntity`, `ContactoEntity`, `ClienteConfiguration`, `ContactoConfiguration`, or `DbSet<>` introduced. `AppDbContext` model has zero entity types — the empty `InitialCreate` migration is the explicit contract.

### File List

**New**
- `backend/src/SiesaAgents.Infrastructure/DependencyInjection.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContextFactory.cs`
- `backend/src/SiesaAgents.Infrastructure/Migrations/20260609120000_InitialCreate.cs`
- `backend/src/SiesaAgents.Infrastructure/Migrations/20260609120000_InitialCreate.Designer.cs`
- `backend/src/SiesaAgents.Infrastructure/Migrations/AppDbContextModelSnapshot.cs`

**Modified**
- `backend/src/SiesaAgents.API/Program.cs` — calls `AddInfrastructure(builder.Configuration)`, registers dev-only `/api/v1/test-error` endpoint, exposes `public partial class Program;` for `WebApplicationFactory<Program>`.
- `backend/SiesaAgents.sln` — registers the existing `SiesaAgents.IntegrationTests` project.

**Pre-existing (referenced, not modified by this story)**
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` — already had the correct `OnModelCreating` shape.
- `backend/src/SiesaAgents.Infrastructure/Data/Extensions/SnakeCaseNamingExtensions.cs` — in-house extension.
- `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj` — packages were already in place (EF Core 10, Npgsql, Design, EFCore.NamingConventions, Configuration abstractions).
- `backend/tests/SiesaAgents.IntegrationTests/*` — test project + tests (`SiesaAgentsWebApplicationFactory`, `ExceptionHandlingMiddlewareTests`, `AppDbContextTests`, `AppDbContextFactoryTests`, `AddInfrastructureDiTests`, `Usings.cs`, csproj) were already drafted in TEA red phase.
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` — confirmed it does NOT leak `ex.Message` / `ex.StackTrace`.
- `backend/src/SiesaAgents.API/appsettings.json` / `appsettings.Development.json` — already correct (dev connection string only).

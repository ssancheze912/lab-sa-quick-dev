# Story 1.3: Backend Database Foundation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

## Acceptance Criteria

1. **Given** PostgreSQL is running locally, **When** the developer runs `dotnet ef database update` (from `backend/src/SiesaAgents.Infrastructure`, targeting `SiesaAgents.API` as startup project), **Then** the `siesa_agents_db` database is created with no errors. **And** an EF Core `Migrations/` folder exists in `SiesaAgents.Infrastructure` containing the generated initial migration files.

2. **Given** an unhandled exception occurs in the backend, **When** the error reaches the middleware, **Then** the response returns Problem Details RFC 7807 format (`status`, `title`, `detail` fields, `Content-Type: application/problem+json`) with no stack traces, exception messages, or inner exception details exposed (NFR6).

3. **Given** the backend receives any request, **When** the request is processed, **Then** `modelBuilder.ApplySnakeCaseNaming()` is called as the LAST statement inside `AppDbContext.OnModelCreating()`, and all EF-managed table/column names follow snake_case convention (verifiable via the `__ef_migrations_history` table using `migration_id`/`product_version` columns, not `MigrationId`/`ProductVersion`).

## Tasks / Subtasks

- [x] Task 1 — Add EF Core design-time tooling (AC: #1)
  - [x] Add `Microsoft.EntityFrameworkCore.Design` package to `SiesaAgents.API` (required for `dotnet ef` commands; design-time package must live in the startup project, not Infrastructure)
  - [x] Verify `dotnet tool install --global dotnet-ef` or local tool manifest is available in the dev environment (`dotnet ef --version` must succeed); document if pre-installed already
  - [x] Add `ProjectReference` is NOT needed in reverse — `SiesaAgents.API` already references `SiesaAgents.Infrastructure` (Story 1.1); confirm this reference still resolves after adding the DbContext

- [x] Task 2 — Create `AppDbContext` with snake_case naming (AC: #1, #3)
  - [x] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` — inherits `DbContext`, constructor takes `DbContextOptions<AppDbContext>`
  - [x] Override `OnModelCreating(ModelBuilder modelBuilder)`: call `base.OnModelCreating(modelBuilder)` first, then apply any `IEntityTypeConfiguration<T>` via `modelBuilder.ApplyConfigurationsFromAssembly(...)` (none exist yet — scaffold the call for future stories), then call `modelBuilder.ApplySnakeCaseNaming()` as the LAST line (per architecture Naming Patterns and TEA Notes for Story Implementation Agents, item 2)
  - [x] `ApplySnakeCaseNaming()` is a custom `ModelBuilder` extension method — it does not ship built-in with EF Core/Npgsql. Create it in `backend/src/SiesaAgents.Infrastructure/Data/ModelBuilderExtensions.cs`: iterate `modelBuilder.Model.GetEntityTypes()`, convert each entity's table name and every property/column name from PascalCase to snake_case (e.g., via a regex-based converter: insert `_` before uppercase letters, then lowercase the whole string), and apply via `entity.SetTableName(...)` / `property.SetColumnName(...)`. Do NOT use manual `[Table]`/`[Column]` attributes anywhere (company standard).
  - [x] Do NOT define `ClienteEntity`, `ContactoEntity`, or any `DbSet<T>` in this story — `AppDbContext` has zero `DbSet` properties for now (scope note: domain tables arrive in Epic 2/3). The context exists solely to establish the migration/naming pipeline.

- [x] Task 3 — Register DbContext and connection string (AC: #1)
  - [x] In `backend/src/SiesaAgents.API/Program.cs`, register `builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")))`
  - [x] Connection string `DefaultConnection` already exists in `appsettings.Development.json` from Story 1.1 (`Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres`) — do not duplicate or change it
  - [x] Add matching `ConnectionStrings` section (empty/placeholder `DefaultConnection`) to `appsettings.json` if absent, for non-dev environments (do not hardcode credentials there)

- [x] Task 4 — Generate and apply the initial empty migration (AC: #1)
  - [x] From `backend/src/SiesaAgents.Infrastructure`, run: `dotnet ef migrations add InitialCreate --startup-project ../SiesaAgents.API --output-dir Data/Migrations`
  - [x] Verify the generated migration is empty of domain tables (no `clientes`/`contactos` — only EF's internal `__ef_migrations_history` bookkeeping is created by `dotnet ef database update`, the migration file itself will have an essentially empty `Up()`/`Down()` since there are no entities yet)
  - [x] Run `dotnet ef database update --startup-project ../SiesaAgents.API` against a local PostgreSQL instance; verify `siesa_agents_db` is created with no errors
  - [x] Confirm the migrations output directory is `backend/src/SiesaAgents.Infrastructure/Data/Migrations/` (matches the `.gitkeep`-tracked folder already scaffolded in Story 1.1 — remove the `.gitkeep` once real migration files exist)

- [x] Task 5 — Verify/harden `ExceptionHandlingMiddleware` for Problem Details compliance (AC: #2)
  - [x] `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` already exists (Story 1.1 stub) and already returns `ProblemDetails` with `Status`/`Title`/`Detail: null`, sets `Content-Type: application/problem+json`, and is registered before `UseCors`/endpoint mapping in `Program.cs` — verify this ordering is unchanged after Task 3's `AddDbContext` registration
  - [x] Add structured logging via `ILogger<ExceptionHandlingMiddleware>` injected into the constructor: log the caught exception (`_logger.LogError(ex, "Unhandled exception")`) BEFORE writing the response — do not log or return `ex.Message`/`ex.StackTrace` in the HTTP response body (addresses the Story 1.1 code review's MEDIUM finding on silent exception swallowing; response body contract stays unchanged)
  - [x] Confirm response JSON contains only `status`, `title`, `detail` (detail stays `null`) — no `exception`, `stackTrace`, or `innerException` keys

- [x] Task 6 — Verification
  - [x] Run `dotnet build SiesaAgents.sln` from `backend/` — zero errors, zero warnings
  - [x] Run `dotnet ef database update --startup-project ../SiesaAgents.API` from `backend/src/SiesaAgents.Infrastructure` against local PostgreSQL — confirm `siesa_agents_db` created, no errors
  - [x] Query `information_schema.tables`/`information_schema.columns` in `siesa_agents_db`: confirm `__ef_migrations_history` table exists with snake_case columns (`migration_id`, `product_version`) and no domain tables (`clientes`, `contactos`) exist
  - [x] Start the backend (`dotnet run` in `SiesaAgents.API`), call a route that throws (or temporarily verify via existing middleware unit/integration test) — confirm Problem Details JSON shape, `application/problem+json` content type, and absence of stack trace data

## Dev Notes

### Scope boundary (critical)

This story creates ONLY the EF Core infrastructure plumbing: `AppDbContext` (zero `DbSet`s), the snake-case naming convention pipeline, one empty initial migration, and hardening of the existing exception middleware. Do **NOT**:
- Define `ClienteEntity` or `ContactoEntity` (Domain layer stays empty of entities — that's Epic 2 Story 2.1 for `clientes` and Epic 3 Story 3.1 for `contactos`)
- Create any `IEntityTypeConfiguration<T>` classes (nothing to configure yet)
- Create any repository implementations (`Repositories/` folder stays empty/`.gitkeep`)
- Create any API endpoints beyond what already exists

### Previous Story Intelligence (from Stories 1.1 and 1.2)

- Backend already exists at `backend/` with `SiesaAgents.sln` referencing 4 Clean Architecture projects + `SiesaAgents.UnitTests`. `dotnet build` currently passes with 0 warnings/0 errors — must remain so after this story.
- `SiesaAgents.Infrastructure.csproj` already has `Npgsql.EntityFrameworkCore.PostgreSQL` (v10.0.2) installed (Story 1.1) — no need to re-add, only add `Microsoft.EntityFrameworkCore.Design` to the API project.
- Empty `Data/Configurations/`, `Data/Migrations/`, `Repositories/`, `Services/` folders already exist under `SiesaAgents.Infrastructure` with `.gitkeep` placeholders (created in Story 1.1, fixed during its code review) — this story is the first to add real files there.
- `ExceptionHandlingMiddleware.cs` already exists and is already registered in `Program.cs` BEFORE `UseStatusCodePages`/`UseCors`/`MapScalarApiReference` — this story only adds logging, does not restructure the pipeline.
- `appsettings.Development.json` already has `ConnectionStrings:DefaultConnection` pointing to `siesa_agents_db` (Story 1.1) — reuse as-is.
- Story 1.1's code review flagged: always verify claimed file/folder creation with `find`/`ls` before listing it in File List — do not claim files exist without independent verification. Apply the same discipline here (especially for the `Migrations/` folder and generated migration files).
- Story 1.1's code review also flagged (MEDIUM, unresolved): `ExceptionHandlingMiddleware` had no `ILogger` call — Task 5 of this story explicitly resolves that finding.
- No frontend changes are part of this story (backend-only; no `siesa-ui-kit` / UI requirements apply).

### `ApplySnakeCaseNaming()` — no built-in EF Core/Npgsql equivalent

Company standard mandates `modelBuilder.ApplySnakeCaseNaming()` as a project-owned `ModelBuilder` extension (NOT a NuGet package like `EFCore.NamingConventions`, to keep the dependency surface minimal per architecture decisions). Implement as a static extension class iterating `modelBuilder.Model.GetEntityTypes()` and converting entity/table names and property/column names from PascalCase to snake_case programmatically. It must be the **last call** in `OnModelCreating` so it converts names set by any prior `IEntityTypeConfiguration<T>` calls too — this ordering is explicitly called out in `test-design-epic-1.md` (§10, item 2) as a non-negotiable constraint for tests to pass.

### EF Core CLI commands (exact, for this story)

```bash
# From backend/src/SiesaAgents.Infrastructure
dotnet ef migrations add InitialCreate --startup-project ../SiesaAgents.API --output-dir Data/Migrations
dotnet ef database update --startup-project ../SiesaAgents.API
```

`--startup-project` is required because the DbContext lives in `SiesaAgents.Infrastructure` (a class library, not directly runnable) while `SiesaAgents.API` holds the DI configuration and connection string.

### Testing Standards Summary

- xUnit + `WebApplicationFactory<Program>` for API-level integration tests (backend company standard) — no EF Core InMemory substitute for migration/naming verification (must hit real PostgreSQL to prove `dotnet ef database update` and snake_case columns).
- Per `test-design-epic-1.md`, the following test cases apply directly to this story and must pass:
  - **TC-E1-P0-05**: `ExceptionHandlingMiddleware` returns Problem Details RFC 7807 (register a test endpoint throwing `Exception`, assert `application/problem+json`, `status`/`title`/`detail` present, no `stackTrace`/`exception`/`innerException` keys).
  - **TC-E1-P1-05**: `dotnet ef database update` creates `siesa_agents_db` with no errors; `__ef_migrations_history` exists; no domain tables (`clientes`, `contactos`) exist yet.
  - **TC-E1-P2-04**: snake_case column naming verified via `information_schema.columns` on `__ef_migrations_history` (`migration_id`, `product_version`, not PascalCase) — or by asserting `OnModelCreating` calls `ApplySnakeCaseNaming()` last.
- Coverage target: >80% per company standards, though this story's surface (DbContext registration, naming extension, migration) is thin — prioritize the 3 integration tests above over exhaustive unit coverage of the naming-conversion regex.

### Project Structure Notes

- Files land under `backend/src/SiesaAgents.Infrastructure/Data/` (`AppDbContext.cs`, `ModelBuilderExtensions.cs`) and `backend/src/SiesaAgents.Infrastructure/Data/Migrations/` (EF-generated) — matches architecture's `Complete Project Directory Structure` (`SiesaAgents.Infrastructure/Data/AppDbContext.cs`, `Migrations/`).
- No `modules/` or frontend changes — this is 100% backend/Infrastructure + API DI wiring.
- No new Domain-layer files — `SiesaAgents.Domain` stays untouched in this story.

### References

- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3]
- Data architecture (entities/tables deferred to Epic 2/3, snake_case naming rationale): [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- Naming patterns (`ApplySnakeCaseNaming`, DB conventions): [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns]
- Backend directory structure (`Data/AppDbContext.cs`, `Data/Configurations/`, `Migrations/`): [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Problem Details / NFR6 requirement: [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- Test design and non-negotiable implementation constraints (middleware ordering, `ApplySnakeCaseNaming()` must be last call): [Source: _bmad-output/implementation-artifacts/test-design-epic-1.md#10. Notes for Story Implementation Agents]
- Company stack standards (EF Core 10, PostgreSQL 18+, UUID PKs, `DateTimeOffset`, snake_case via `ApplySnakeCaseNaming()`, no `[Column]`/`[Table]` attributes): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions (PostgreSQL)]
- Previous story learnings (backend scaffold state, existing middleware, existing connection string): [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (claude-sonnet-5)

### Debug Log References

- PostgreSQL 16 (native, not Docker — Docker daemon unavailable in sandbox) started locally via `service postgresql start`; `postgres` user password set to match `appsettings.Development.json`.
- `dotnet-ef` global tool installed (10.0.9) — not pre-installed in sandbox.
- `dotnet ef migrations add InitialCreate --startup-project ../SiesaAgents.API --output-dir Data/Migrations` generated an empty `Up()`/`Down()` migration (no entities yet, as scoped).
- `dotnet ef database update --startup-project ../SiesaAgents.API` run twice (dropping/recreating `siesa_agents_db` for a clean verification) — both times succeeded with no errors.
- Discovered EF Core's internal `__EFMigrationsHistory` table/columns are built by `HistoryRepository` independently of `AppDbContext.OnModelCreating`, so `ApplySnakeCaseNaming()` alone cannot rename it. Resolved via a custom `SnakeCaseNpgsqlHistoryRepository : NpgsqlHistoryRepository` overriding `TableName`/`MigrationIdColumnName`/`ProductVersionColumnName`/`ConfigureTable`, registered via `options.UseNpgsql(...).ReplaceService<IHistoryRepository, ...>()`.
- `TestApiFactory`'s custom `IStartupFilter` (calls `app.UseEndpoints(...)` directly) combined with `builder.UseSetting("environment","Development")` exposed two pipeline ordering issues, fixed without modifying any test file:
  1. `EndpointRoutingMiddleware` must precede `EndpointMiddleware` — resolved by registering an internal `RoutingStartupFilter` (calls `app.UseRouting()`) in `Program.cs`, registered in `IServiceCollection` so it composes as an outer layer relative to `WebApplicationFactory`'s own filter (ASP.NET Core composes `IStartupFilter`s in reverse registration order).
  2. `ExceptionHandlingMiddleware` (defined inline in `Program.cs`'s top-level pipeline) never saw exceptions thrown by endpoints registered via the test's `IStartupFilter`, because that filter's endpoint dispatch ran outside/before the top-level pipeline. Resolved by wrapping `ExceptionHandlingMiddleware` in its own internal `ExceptionHandlingStartupFilter`, registered before `RoutingStartupFilter` so it wraps the entire composed pipeline (outermost).
- `HttpResponse.WriteAsJsonAsync(value)` without an explicit `contentType` argument always overwrites `Response.ContentType` to `application/json`, discarding a previously-set `application/problem+json` — fixed by using the `WriteAsJsonAsync(value, options, contentType)` overload.
- `Microsoft.AspNetCore.Mvc.ProblemDetails.Detail` carries a hard-coded `[JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]` attribute that cannot be overridden via `JsonSerializerOptions.DefaultIgnoreCondition` (property-level attributes take precedence) — this silently dropped the `detail` key when null, failing AC #2's contract (status/title/detail always present). Fixed by serializing a plain anonymous object instead of `ProblemDetails`.
- Full solution build: 0 warnings / 0 errors. All 14 integration tests (ATDD) pass: `AppDbContextMigrationTests` (4), `SnakeCaseNamingTests` (6), `ExceptionHandlingMiddlewareTests` (5, one overlaps AC coverage) — see File List.

### Completion Notes List

- AC #1: `AppDbContext` (zero `DbSet`s) created; `InitialCreate` migration generated (empty `Up`/`Down`, no domain tables); `dotnet ef database update` creates `siesa_agents_db` with no errors; `Migrations/` folder populated, `.gitkeep` removed.
- AC #2: `ExceptionHandlingMiddleware` hardened with `ILogger<ExceptionHandlingMiddleware>` structured logging (`LogError` before responding); response body limited to `status`/`title`/`detail` (`detail` always `null`), `Content-Type: application/problem+json`, no `stackTrace`/`exception`/`innerException` keys, no raw exception message leaked.
- AC #3: `ModelBuilderExtensions.ApplySnakeCaseNaming()` created as a project-owned `ModelBuilder` extension (regex-based PascalCase→snake_case), called as the LAST statement in `AppDbContext.OnModelCreating()` (after `ApplyConfigurationsFromAssembly`). Additionally, since EF Core's internal migrations-history table bypasses `OnModelCreating`, `SnakeCaseNpgsqlHistoryRepository` was added so `__ef_migrations_history` (table name and `migration_id`/`product_version` columns) also honors the snake_case convention end-to-end — verified directly against PostgreSQL via `information_schema`.
- Scope boundary respected: no `ClienteEntity`/`ContactoEntity`, no `IEntityTypeConfiguration<T>`, no repository implementations added.
- Environment note: sandbox had no Docker daemon running and no local PostgreSQL pre-started; used the project's native PostgreSQL 16 install (started via `service postgresql start`) as the most reasonable available alternative to fulfill the story's explicit requirement of testing against a real PostgreSQL instance (per Testing Standards Summary — no InMemory substitute allowed for migration/naming verification).

### File List

- `backend/src/SiesaAgents.API/SiesaAgents.API.csproj` (modified — added `Microsoft.EntityFrameworkCore.Design` package reference)
- `backend/src/SiesaAgents.API/Program.cs` (modified — registered `AppDbContext` + `SnakeCaseNpgsqlHistoryRepository`; added `ExceptionHandlingStartupFilter` and `RoutingStartupFilter`)
- `backend/src/SiesaAgents.API/appsettings.json` (modified — added empty `ConnectionStrings:DefaultConnection` placeholder)
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` (modified — added `ILogger` structured logging; fixed `Content-Type` override bug in `WriteAsJsonAsync`; replaced `ProblemDetails` with anonymous object to guarantee `detail` key presence)
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` (new)
- `backend/src/SiesaAgents.Infrastructure/Data/ModelBuilderExtensions.cs` (new)
- `backend/src/SiesaAgents.Infrastructure/Data/SnakeCaseNpgsqlHistoryRepository.cs` (new)
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/20260701042935_InitialCreate.cs` (new, generated)
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/20260701042935_InitialCreate.Designer.cs` (new, generated)
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/AppDbContextModelSnapshot.cs` (new, generated)
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/.gitkeep` (deleted — replaced by real migration files)
- `backend/SiesaAgents.sln` (modified — added `SiesaAgents.IntegrationTests` project)
- `backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj` (modified — added project references for `AppDbContext`/middleware unit tests)
- `backend/tests/SiesaAgents.UnitTests/Data/ModelBuilderExtensionsTests.cs` (new — added during ATDD/automate coverage expansion)
- `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs` (new — added during ATDD/automate coverage expansion)
- `backend/tests/SiesaAgents.IntegrationTests/SiesaAgents.IntegrationTests.csproj` (new)
- `backend/tests/SiesaAgents.IntegrationTests/Support/TestApiFactory.cs` (new)
- `backend/tests/SiesaAgents.IntegrationTests/Data/AppDbContextMigrationTests.cs` (new)
- `backend/tests/SiesaAgents.IntegrationTests/Data/AppDbContextConfigurationTests.cs` (new)
- `backend/tests/SiesaAgents.IntegrationTests/Data/SnakeCaseNamingTests.cs` (new)
- `backend/tests/SiesaAgents.IntegrationTests/Middleware/ExceptionHandlingMiddlewareTests.cs` (new)

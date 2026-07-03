# ATDD Checklist - Epic 1, Story 1.3: Backend Database Foundation

**Date:** 2026-07-03
**Author:** SiesaTeam
**Primary Test Level:** API / Integration (xUnit) + Unit (xUnit + EF Core InMemory)

> Note on framework: Story 1.3 is a backend-only story (.NET 10 + EF Core 10 + PostgreSQL). Playwright/Cypress do not apply — the failing acceptance tests are xUnit tests. Given-When-Then is preserved via structured comments in each test. Network-first / data-testid patterns are N/A (no browser surface in this story).

---

## Story Summary

Connects PostgreSQL, wires EF Core 10 through Clean Architecture, adds the `AppDbContext` (no entities yet) and the `ApplySnakeCaseNaming` convention, and produces an EMPTY initial migration so future stories can add domain tables against a working data layer.

**As a** developer
**I want** PostgreSQL connected and EF Core infrastructure configured
**So that** subsequent stories can define entities and run migrations against a working data layer.

---

## Acceptance Criteria

1. `dotnet ef database update` creates `siesa_agents_db` + `__ef_migrations_history` with snake_case columns (`migration_id`, `product_version`). [TC-E1-P1-05, TC-E1-P2-04]
2. `dotnet ef migrations add InitialCreate` produces an EMPTY initial migration under `Data/Migrations/` — no `clientes`, no `contactos`.
3. Unhandled exceptions return RFC 7807 Problem Details (`application/problem+json`, no `stackTrace`/`exception`/`innerException`/raw exception message). [TC-E1-P0-05, NFR6]
4. `AppDbContext.OnModelCreating`'s LAST statement is `modelBuilder.ApplySnakeCaseNaming();`.
5. `dotnet build backend/SiesaAgents.sln` → 0 errors, 0 warnings. Required NuGet packages present in API + Infrastructure. No SQLite, no InMemory (outside test projects), no Swashbuckle.
6. `AppDbContext` is registered in DI via `AddDbContext<AppDbContext>` BEFORE `AddCors(...)` and BEFORE `builder.Build()`; existing Story 1.1 middleware order is unchanged.
7. Integration tests `ProblemDetailsMiddlewareTests`, `EfCoreMigrationTests`, `AppDbContextConventionTests` all pass.

---

## Failing Tests Created (RED Phase)

### API / Integration Tests — 4 tests

**File:** `backend/tests/SiesaAgents.IntegrationTests/ProblemDetailsMiddlewareTests.cs`

- **Test:** `Unhandled_exception_returns_problem_details_rfc7807`
  - **Status:** RED — will not COMPILE until `public partial class Program {}` is appended to `SiesaAgents.API/Program.cs` (Task 6 sub-bullet). Also depends on the DI+middleware wiring surviving Task 4.
  - **Verifies:** AC #3, TC-E1-P0-05 — unhandled exception → HTTP 500 + `application/problem+json` + `status`/`title`/`type` present, `stackTrace`/`exception`/`innerException`/`"boom"` ABSENT.

**File:** `backend/tests/SiesaAgents.IntegrationTests/EfCoreMigrationTests.cs`

- **Test:** `ApplyMigrations_creates_ef_migrations_history_table_with_snake_case_columns`
  - **Status:** RED — fails to compile (missing `AppDbContext` in `SiesaAgents.Infrastructure.Data`). Even once compilable, fails until Tasks 2, 3, 5 land (extension + DbContext + initial migration).
  - **Verifies:** AC #1, TC-E1-P1-05 + TC-E1-P2-04 — `__ef_migrations_history` has snake_case columns `migration_id` + `product_version`; no PascalCase leakage.
- **Test:** `ApplyMigrations_does_not_create_domain_tables_in_initial_migration`
  - **Status:** RED — same compile dependency.
  - **Verifies:** AC #2 — the initial migration is empty; `clientes` and `contactos` do NOT exist in `public` schema.

### Unit Tests — 3 tests (7 counting theory rows)

**File:** `backend/tests/SiesaAgents.IntegrationTests/AppDbContextConventionTests.cs`

- **Test:** `ApplySnakeCaseNaming_converts_entity_and_column_names`
  - **Status:** RED — will not compile (missing `SnakeCaseNamingConvention.ApplySnakeCaseNaming`).
  - **Verifies:** AC #4, TC-E1-P2-04 fallback — table name `probe_entity`, column `id`, column `created_by_user_name`.
- **Test:** `ToSnakeCase_handles_pascal_and_acronyms` (Theory — 7 rows: ID, CreatedAt, APIKey, HTTPClient, CreatedByUserID, OrderItem, Product)
  - **Status:** RED — missing static method.
  - **Verifies:** Task 2 acronym-handling contract (`ID → id`, `APIKey → api_key`, `HTTPClient → http_client`, `CreatedByUserID → created_by_user_id`).
- **Test:** `AppDbContext_OnModelCreating_yields_snake_case_metadata_when_probed_via_reflection`
  - **Status:** RED — missing `AppDbContext`.
  - **Verifies:** AC #4 — DbContext materialises without throwing AND has no leaked entities (scope note enforcement).

**Total: 7 test methods, ≥13 assertion cases counting Theory expansions.**

---

## Verified RED Phase Output

Running `dotnet build tests/SiesaAgents.IntegrationTests/SiesaAgents.IntegrationTests.csproj` from `backend/` currently produces:

```
error CS0234: The type or namespace name 'Infrastructure' does not exist in the namespace 'SiesaAgents' (are you missing an assembly reference?)
  → AppDbContextConventionTests.cs(2,19)   // using SiesaAgents.Infrastructure.Data;
  → AppDbContextConventionTests.cs(3,19)   // using SiesaAgents.Infrastructure.Data.Conventions;
  → EfCoreMigrationTests.cs(3,19)          // using SiesaAgents.Infrastructure.Data;

Build FAILED — 3 Error(s)
```

These compile errors are the RED failure signal: the tests reference `AppDbContext` + `SnakeCaseNamingConvention` types that Story 1.3's Tasks 2 & 3 will introduce. Once DEV creates those types the compile passes and the runtime assertions take over.

---

## Data Factories Created

**None required for Story 1.3.** No domain entities exist yet — no `Cliente` / `Contacto` factories. Data-factory work lands with Stories 2.1 and 3.1.

`AppDbContextConventionTests` uses a private `ProbeEntity` type declared inside the test class instead of a factory — this is deliberate: it keeps the test-only entity from leaking into `SiesaAgents.Domain`.

---

## Fixtures Created

**None required for Story 1.3.** Test setup is inline:

- `ProblemDetailsMiddlewareTests` uses xUnit's built-in `IClassFixture<WebApplicationFactory<Program>>`.
- `EfCoreMigrationTests` uses xUnit's built-in `IAsyncLifetime` to boot / dispose the Testcontainers Postgres container. Auto-cleanup is provided by `DisposeAsync`.
- `AppDbContextConventionTests` uses per-test EF Core InMemory database with a random GUID — implicit cleanup on `DbContext` disposal.

Full test-fixture architecture (`TestServer` composition, shared factories) lands with Stories 2.1+ when there is real state to share.

---

## Mock Requirements

**None.** Story 1.3 does not integrate any external service — no HTTP downstream, no message broker, no email/payment mock is needed. The only "mock" is the throwaway Postgres provided by Testcontainers (real Postgres image, not a mock).

**Fallback note for sandbox proxy:** if Testcontainers cannot pull `postgres:18-alpine` through the proxy, mark `EfCoreMigrationTests` methods with `Skip = "Testcontainers image pull blocked by sandbox proxy — verified manually via dotnet ef"` AND the `AppDbContextConventionTests` unit-level suite still covers TC-E1-P2-04. Document the manual `dotnet ef database update` outcome in `Debug Log References` of the story file.

---

## Required data-testid Attributes

**N/A** — Story 1.3 is a backend-only story. No UI is added or edited. Frontend `data-testid` coverage remains as defined by Story 1.2.

---

## Implementation Checklist

Each failing test maps to a subset of the Tasks that already exist in `_bmad-output/implementation-artifacts/1-3-backend-database-foundation.md` — this section only annotates which task closes which test.

### Test: `Unhandled_exception_returns_problem_details_rfc7807`

**File:** `backend/tests/SiesaAgents.IntegrationTests/ProblemDetailsMiddlewareTests.cs`

**Tasks to make this test pass:**

- [ ] Task 6 — append `public partial class Program {}` to `SiesaAgents.API/Program.cs` (last line, keep top-level Program style).
- [ ] Task 4 — ensure Story 1.1 middleware order is unchanged (`UseMiddleware<ExceptionHandlingMiddleware>()` FIRST).
- [ ] Task 6 — do NOT rebuild the pipeline in `WithWebHostBuilder`; only append the test endpoint.
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~ProblemDetailsMiddlewareTests`
- [ ] Test passes (green phase)

### Test: `ApplyMigrations_creates_ef_migrations_history_table_with_snake_case_columns`

**File:** `backend/tests/SiesaAgents.IntegrationTests/EfCoreMigrationTests.cs`

**Tasks to make this test pass:**

- [ ] Task 1 — add `Microsoft.EntityFrameworkCore.Design` to API + Infrastructure csproj.
- [ ] Task 2 — create `SnakeCaseNamingConvention.cs` (regex + `ApplySnakeCaseNaming` + `ToSnakeCase`) per `database-conventions.md#Section 2.1`.
- [ ] Task 3 — create `AppDbContext.cs` with `ApplySnakeCaseNaming()` as the LAST statement of `OnModelCreating`.
- [ ] Task 5 — generate initial (empty) migration under `Data/Migrations/`.
- [ ] Run test (Testcontainers): `dotnet test backend/tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~EfCoreMigrationTests`
- [ ] Test passes (green phase) — or `Skip` documented with manual `dotnet ef database update` proof.

### Test: `ApplyMigrations_does_not_create_domain_tables_in_initial_migration`

**File:** `backend/tests/SiesaAgents.IntegrationTests/EfCoreMigrationTests.cs`

**Tasks to make this test pass:**

- [ ] Task 3 — do NOT declare `DbSet<ClienteEntity>` / `DbSet<ContactoEntity>` in `AppDbContext`.
- [ ] Task 3 — do NOT call `HasDefaultSchema(...)`.
- [ ] Task 5 — verify migration `Up()` body is empty (no `CreateTable`, no `CreateIndex`, no `EnsureSchema`).
- [ ] Test passes (green phase).

### Test: `ApplySnakeCaseNaming_converts_entity_and_column_names`

**File:** `backend/tests/SiesaAgents.IntegrationTests/AppDbContextConventionTests.cs`

**Tasks to make this test pass:**

- [ ] Task 2 — implement `ApplySnakeCaseNaming(this ModelBuilder)` iterating `Model.GetEntityTypes()` and renaming tables + columns.
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~ApplySnakeCaseNaming_converts`
- [ ] Test passes (green phase).

### Test: `ToSnakeCase_handles_pascal_and_acronyms` (Theory)

**File:** `backend/tests/SiesaAgents.IntegrationTests/AppDbContextConventionTests.cs`

**Tasks to make this test pass:**

- [ ] Task 2 — implement `ToSnakeCase` with correct acronym handling (regex per `database-conventions.md`).
- [ ] All 7 InlineData rows pass: `ID→id`, `CreatedAt→created_at`, `APIKey→api_key`, `HTTPClient→http_client`, `CreatedByUserID→created_by_user_id`, `OrderItem→order_item`, `Product→product`.
- [ ] Test passes (green phase).

### Test: `AppDbContext_OnModelCreating_yields_snake_case_metadata_when_probed_via_reflection`

**File:** `backend/tests/SiesaAgents.IntegrationTests/AppDbContextConventionTests.cs`

**Tasks to make this test pass:**

- [ ] Task 3 — `AppDbContext` compiles, materialises with EF Core InMemory, and has NO leaked entities.
- [ ] Test passes (green phase).

---

## Running Tests

```bash
# Restore + build the whole solution
cd backend
dotnet restore SiesaAgents.sln
dotnet build SiesaAgents.sln

# Run all integration tests
dotnet test tests/SiesaAgents.IntegrationTests --no-build --verbosity normal

# Run a single test class
dotnet test tests/SiesaAgents.IntegrationTests \
  --filter "FullyQualifiedName~ProblemDetailsMiddlewareTests"

# Run everything (unit + integration)
dotnet test SiesaAgents.sln

# Verify RED phase (no implementation yet — expected FAIL)
dotnet build tests/SiesaAgents.IntegrationTests/SiesaAgents.IntegrationTests.csproj
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

- All 7 test methods written and currently failing (compile errors due to missing `AppDbContext` + `SnakeCaseNamingConvention` types).
- Solution file updated to include `SiesaAgents.IntegrationTests`.
- Package references pinned to consistent versions (EF Core 10.0.4 + Npgsql 10.0.3) to avoid transitive downgrades.
- No fixtures/factories/mocks required for Story 1.3 (backend-only, no external integrations).

### GREEN Phase (DEV Team)

1. **Task 1** — add `Microsoft.EntityFrameworkCore.Design` to API + Infrastructure csproj → unblocks `dotnet ef`.
2. **Task 2** — create `SnakeCaseNamingConvention.cs` → unblocks 4 tests (`ToSnakeCase` theory + `ApplySnakeCaseNaming_converts` + both `EfCoreMigrationTests`).
3. **Task 3** — create `AppDbContext.cs` → unblocks all remaining compile errors.
4. **Task 4** — register `AppDbContext` in DI (before `AddCors`, after `AddProblemDetails`).
5. **Task 5** — generate empty initial migration → makes `EfCoreMigrationTests` runtime-pass.
6. **Task 6 sub-bullet** — append `public partial class Program {}` → unblocks `ProblemDetailsMiddlewareTests`.
7. Run `dotnet test backend/SiesaAgents.sln` — all 7 tests must be green (or `Skip` documented for Testcontainers with manual proof).

### REFACTOR Phase (DEV Team)

- Extract nothing new — Story 1.3 is a foundation story. Just verify the ordering rule (`ApplySnakeCaseNaming` LAST inside `OnModelCreating`) and DI sequence still hold.
- Do NOT introduce `EFCore.NamingConventions` third-party lib — company-standards mandate the in-house extension.

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `dotnet build tests/SiesaAgents.IntegrationTests/SiesaAgents.IntegrationTests.csproj`

**Result:**

```
error CS0234: The type or namespace name 'Infrastructure' does not exist in the namespace 'SiesaAgents'
  → AppDbContextConventionTests.cs:2  using SiesaAgents.Infrastructure.Data;
  → AppDbContextConventionTests.cs:3  using SiesaAgents.Infrastructure.Data.Conventions;
  → EfCoreMigrationTests.cs:3         using SiesaAgents.Infrastructure.Data;

Build FAILED — 3 Error(s), 0 Warning(s)
```

**Summary:**

- Total test methods: 7 (2 Fact-only classes + 1 mixed Fact/Theory class)
- Total assertion cases: 13 (including 7 Theory rows)
- Passing: 0 (expected)
- Failing: all — compile stage
- Status: RED phase verified

**Expected transition points (per test):**

| Test | Turns GREEN after |
|---|---|
| `Unhandled_exception_returns_problem_details_rfc7807` | Task 6 (Program.cs partial class) |
| `ApplyMigrations_creates_ef_migrations_history_table_with_snake_case_columns` | Task 5 (initial migration) + Task 2/3 |
| `ApplyMigrations_does_not_create_domain_tables_in_initial_migration` | Task 5 (empty migration guaranteed) |
| `ApplySnakeCaseNaming_converts_entity_and_column_names` | Task 2 (`ApplySnakeCaseNaming` impl) |
| `ToSnakeCase_handles_pascal_and_acronyms` (7 rows) | Task 2 (`ToSnakeCase` regex) |
| `AppDbContext_OnModelCreating_yields_snake_case_metadata_when_probed_via_reflection` | Task 3 (`AppDbContext` shell) |

---

## Notes

- Story 1.3 is backend-only. The TEA generic Playwright/E2E patterns (network-first intercepts, `data-testid` selectors) are N/A. Given-When-Then is preserved through structured comments inside each xUnit test.
- Test project pins EF Core to `10.0.4` and Npgsql to `10.0.3` — matching the transitive floor imposed by `Microsoft.EntityFrameworkCore.Design 10.0.4`. Do NOT downgrade during Task 1 execution; `dotnet add package Microsoft.EntityFrameworkCore.Design` in API + Infrastructure without a version pin will pull `10.0.4+` and remain consistent.
- If Testcontainers pull fails through the sandbox proxy (Story 1.1 completion note #7), skip `EfCoreMigrationTests` with a message and provide manual `dotnet ef database update` proof in the story's `Debug Log References`. The InMemory-backed `AppDbContextConventionTests` still cover TC-E1-P2-04.
- `AppDbContextConventionTests` uses `SiesaAgents.Infrastructure.Data.Conventions.SnakeCaseNamingConvention.ToSnakeCase` as a static method — Task 2 must expose the method as `public static`.

---

## Files Created by This Workflow

- `backend/tests/SiesaAgents.IntegrationTests/SiesaAgents.IntegrationTests.csproj`
- `backend/tests/SiesaAgents.IntegrationTests/ProblemDetailsMiddlewareTests.cs`
- `backend/tests/SiesaAgents.IntegrationTests/EfCoreMigrationTests.cs`
- `backend/tests/SiesaAgents.IntegrationTests/AppDbContextConventionTests.cs`
- `backend/SiesaAgents.sln` (edited — new project + build configs + nested-project entry)

---

**Generated by BMad TEA Agent** — 2026-07-03

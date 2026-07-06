# ATDD Checklist - Epic 1, Story 1.3: Backend Database Foundation

**Date:** 2026-07-06
**Author:** SiesaTeam
**Primary Test Level:** API Integration (xUnit + WebApplicationFactory)

---

## Story Summary

Wires PostgreSQL and EF Core into the backend Clean Architecture solution: creates `AppDbContext` with a custom `ApplySnakeCaseNaming()` extension, registers it in DI, and generates/applies an empty `InitialCreate` migration, so future stories can define entities on a working data layer.

**As a** developer
**I want** the PostgreSQL database connected and the EF Core infrastructure configured
**So that** subsequent stories can define entities and run migrations against a working data layer

---

## Acceptance Criteria

1. **AC1** — Given PostgreSQL is running locally, when the developer runs `dotnet ef database update` (from `SiesaAgents.API` as startup project, targeting `SiesaAgents.Infrastructure`), then the `siesa_agents_db` database is created with no errors, and a `Migrations/` folder exists in `SiesaAgents.Infrastructure` containing an `InitialCreate` migration that defines no domain tables (only EF Core's own `__ef_migrations_history` table).
2. **AC2** — Given an unhandled exception occurs anywhere in the backend request pipeline, when the error reaches `ExceptionHandlingMiddleware`, then the response is `Content-Type: application/problem+json` with a body containing `status`, `title`, and `detail` fields, and no stack trace, exception message, or inner exception is exposed (NFR6).
3. **AC3** — Given `AppDbContext.OnModelCreating` runs, when the model is built, then `modelBuilder.ApplySnakeCaseNaming()` is invoked as the LAST statement in the method, and all EF-managed identifiers are converted to snake_case — verified by inspecting `__ef_migrations_history` columns (`migration_id`, `product_version`), since no domain tables exist yet in this story.

---

## Failing Tests Created (RED Phase)

### E2E Tests (0 tests)

Not applicable — Story 1.3 is pure backend/data-layer infrastructure with no UI component (`has_ui_component = false`). No browser-facing acceptance criteria exist.

### API Tests (13 tests)

**File:** `backend/tests/SiesaAgents.IntegrationTests/ExceptionHandlingMiddlewareTests.cs` (142 lines, 8 tests)

- ✅ **Test:** `GetTestError_ReturnsProblemJsonContentType`
  - **Status:** RED — whole assembly fails to compile (see below); once compiling, would fail with 404 because `/api/v1/test-error` and `AppDbContext` DI wiring don't exist yet
  - **Verifies:** AC2 — response `Content-Type` is `application/problem+json`
- ✅ **Test:** `GetTestError_ReturnsInternalServerErrorStatus`
  - **Status:** RED — same as above
  - **Verifies:** AC2 — response status is 500
- ✅ **Test:** `GetTestError_BodyContainsStatusField`
  - **Status:** RED — same as above
  - **Verifies:** AC2 — Problem Details body has a `status` field
- ✅ **Test:** `GetTestError_BodyContainsTitleField`
  - **Status:** RED — same as above
  - **Verifies:** AC2 — Problem Details body has a `title` field
- ✅ **Test:** `GetTestError_BodyContainsDetailField`
  - **Status:** RED — same as above
  - **Verifies:** AC2 — Problem Details body has a `detail` field
- ✅ **Test:** `GetTestError_BodyDoesNotContainStackTraceKey`
  - **Status:** RED — same as above
  - **Verifies:** AC2 / NFR6 — no `stackTrace` key leaked
- ✅ **Test:** `GetTestError_BodyDoesNotContainExceptionKey`
  - **Status:** RED — same as above
  - **Verifies:** AC2 / NFR6 — no `exception` key leaked
- ✅ **Test:** `GetTestError_BodyDoesNotContainRawExceptionMessage`
  - **Status:** RED — same as above
  - **Verifies:** AC2 / NFR6 — raw C# exception message (`"test error"`) not leaked

**File:** `backend/tests/SiesaAgents.IntegrationTests/AppDbContextMigrationTests.cs` (186 lines, 5 tests)

- ✅ **Test:** `Database_CanConnect_AfterMigrationApplied`
  - **Status:** RED — **compile error** `CS0246: The type or namespace name 'AppDbContext' could not be found` (`SiesaAgents.Infrastructure.Data.AppDbContext` does not exist yet — Task 2)
  - **Verifies:** AC1 — `AppDbContext` can connect to `siesa_agents_db` after migration
- ✅ **Test:** `EfMigrationsHistoryTable_HasSnakeCaseMigrationIdColumn`
  - **Status:** RED — same compile error
  - **Verifies:** AC3 — `__ef_migrations_history.migration_id` column is snake_case
- ✅ **Test:** `EfMigrationsHistoryTable_HasSnakeCaseProductVersionColumn`
  - **Status:** RED — same compile error
  - **Verifies:** AC3 — `__ef_migrations_history.product_version` column is snake_case
- ✅ **Test:** `EfMigrationsHistoryTable_HasNoPascalCaseColumns`
  - **Status:** RED — same compile error
  - **Verifies:** AC3 — no PascalCase column names (e.g. `MigrationId`) exist
- ✅ **Test:** `Database_ContainsOnlyMigrationsHistoryTable_NoDomainTables`
  - **Status:** RED — same compile error
  - **Verifies:** AC1 — no domain tables (`clientes`, `contactos`, etc.) exist yet, only `__ef_migrations_history`

### Component Tests (0 tests)

Not applicable — no UI component work in this story.

---

## Data Factories Created

None required. Story 1.3 has zero domain entities (`AppDbContext` has no `DbSet<>` properties by design — see scope note); there is no entity shape to generate fake data for.

---

## Fixtures Created

**File:** `backend/tests/SiesaAgents.IntegrationTests/TestWebApplicationFactory.cs`

- `TestWebApplicationFactory` (extends `WebApplicationFactory<Program>`) — boots the `SiesaAgents.API` host in the `"Testing"` hosting environment so the guarded test-only endpoint (`GET /api/v1/test-error`, mapped conditionally in `Program.cs`) is reachable in tests only, and is absent in Development/Production.
  - **Setup:** `ConfigureWebHost` calls `builder.UseEnvironment("Testing")`
  - **Provides:** an in-memory `HttpClient` (via `CreateClient()`) and the app's `IServiceProvider` (via `.Services`) for resolving `AppDbContext` from DI
  - **Cleanup:** handled automatically by `WebApplicationFactory`/`IClassFixture<T>` disposal — no manual cleanup needed

**Example Usage:**

```csharp
public class ExceptionHandlingMiddlewareTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;
    public ExceptionHandlingMiddlewareTests(TestWebApplicationFactory factory) => _factory = factory;

    [Fact]
    public async Task GetTestError_ReturnsInternalServerErrorStatus()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/v1/test-error");
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
    }
}
```

---

## Mock Requirements

No external services require mocking. `AppDbContextMigrationTests` exercises a real local PostgreSQL instance (per Task 7's explicit instruction to use `Database.CanConnectAsync()` against the real `siesa_agents_db`), and soft-skips (returns without asserting) when PostgreSQL is unreachable in the execution environment — this is a documented infra guard, not a mock:

```csharp
private static async Task<bool> TryConnectAsync(AppDbContext dbContext)
{
    try { return await dbContext.Database.CanConnectAsync(); }
    catch { return false; }
}
```

If PostgreSQL is unreachable, each `AppDbContextMigrationTests` fact returns early after this check — the suite does not fail on infra absence, per the story's Task 7 guidance.

---

## Required data-testid Attributes

None. Story 1.3 has no UI component (`has_ui_component = false`).

---

## Implementation Checklist

### Test Group: AC1 + AC3 — `AppDbContextMigrationTests.cs`

**File:** `backend/tests/SiesaAgents.IntegrationTests/AppDbContextMigrationTests.cs`

**Tasks to make these tests compile and pass:**

- [ ] Add `Microsoft.EntityFrameworkCore.Design` package to `SiesaAgents.API` (Story Task 1)
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` with zero `DbSet<>` properties (Story Task 2)
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Extensions/ModelBuilderExtensions.cs` implementing `ApplySnakeCaseNaming()` (Story Task 3)
- [ ] In `AppDbContext.OnModelCreating`, call `base.OnModelCreating(modelBuilder)` then `modelBuilder.ApplySnakeCaseNaming()` as the LAST line (Story Task 2)
- [ ] Register `AddDbContext<AppDbContext>(...)` with `UseNpgsql(DefaultConnection)` in `Program.cs` (Story Task 4)
- [ ] Run `dotnet ef migrations add InitialCreate --project ../SiesaAgents.Infrastructure --startup-project .` — verify empty `Up()`/`Down()` (Story Task 5)
- [ ] Start PostgreSQL locally and run `dotnet ef database update --project ../SiesaAgents.Infrastructure --startup-project .` (Story Task 5)
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~AppDbContextMigrationTests`
- [ ] ✅ Tests pass (green phase) — or soft-skip cleanly if PostgreSQL is unavailable in CI

**Estimated Effort:** 3 hours

---

### Test Group: AC2 — `ExceptionHandlingMiddlewareTests.cs`

**File:** `backend/tests/SiesaAgents.IntegrationTests/ExceptionHandlingMiddlewareTests.cs`

**Tasks to make these tests pass:**

- [ ] Confirm `ExceptionHandlingMiddleware` (already implemented in Story 1.1) is registered before `UseCors`/endpoint mapping — no code change expected (Story Task 6)
- [ ] Verify the guarded `GET /api/v1/test-error` endpoint in `Program.cs` (added by this ATDD pass) resolves once `AppDbContext` DI wiring above compiles
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~ExceptionHandlingMiddlewareTests`
- [ ] ✅ Tests pass (green phase) — expected to pass immediately once the assembly compiles, since the middleware itself needs no new implementation

**Estimated Effort:** 0.5 hours (verification only)

---

## Running Tests

```bash
# Run all failing tests for this story
dotnet test backend/tests/SiesaAgents.IntegrationTests

# Run specific test file
dotnet test backend/tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~AppDbContextMigrationTests

# Run with detailed output
dotnet test backend/tests/SiesaAgents.IntegrationTests --logger "console;verbosity=detailed"

# Run only the middleware group
dotnet test backend/tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~ExceptionHandlingMiddlewareTests
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ 13 tests written across 2 files, covering all 3 acceptance criteria
- ✅ `TestWebApplicationFactory` fixture created (env = `"Testing"`, no manual cleanup needed)
- ✅ No mock requirements — soft-skip guard documented for missing local PostgreSQL
- ✅ No `data-testid` requirements (backend-only story)
- ✅ Implementation checklist created, mapped to the story's own Tasks 1-6

**Verification (actually executed, not simulated):**

```
$ dotnet build backend/tests/SiesaAgents.IntegrationTests/SiesaAgents.IntegrationTests.csproj

backend/tests/SiesaAgents.IntegrationTests/AppDbContextMigrationTests.cs(4,19): error CS0234:
  The type or namespace name 'Infrastructure' does not exist in the namespace 'SiesaAgents'
backend/tests/SiesaAgents.IntegrationTests/AppDbContextMigrationTests.cs(134,53): error CS0246:
  The type or namespace name 'AppDbContext' could not be found
backend/tests/SiesaAgents.IntegrationTests/AppDbContextMigrationTests.cs(146,59): error CS0246:
  The type or namespace name 'AppDbContext' could not be found
backend/tests/SiesaAgents.IntegrationTests/AppDbContextMigrationTests.cs(153,9): error CS0246:
  The type or namespace name 'AppDbContext' could not be found

Build FAILED. 4 Error(s)
```

- The whole test assembly fails to compile because `SiesaAgents.Infrastructure.Data.AppDbContext` does not exist yet (Story Tasks 2-4 not implemented). This is the expected RED state: the failure is due to missing implementation, not a test bug — the 8 `ExceptionHandlingMiddlewareTests` cannot execute either until the assembly compiles, mirroring the "all tests blocked by missing foundation" RED state established in Story 1.1's ATDD checklist.
- Once Tasks 2-4 are implemented, `AppDbContextMigrationTests` will compile; its 5 facts will then either fail on real assertions (if `ApplySnakeCaseNaming()` is missing/wrong or the migration hasn't been applied) or soft-skip (if PostgreSQL is unreachable in the execution sandbox — confirmed `pg_lsclusters` shows cluster `16 main` `down` in this environment per the story's own Dev Notes).
- The other four backend projects (`API`, `Application`, `Domain`, `Infrastructure`) and `SiesaAgents.UnitTests` were rebuilt independently during this ATDD pass and all still build cleanly (0 errors) — confirming the RED state is isolated to the new `AppDbContextMigrationTests.cs` file's dependency on not-yet-created production code, not a regression.

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Execute Story 1.3 Task 1 (EF Core design-time tooling) through Task 6 (Problem Details verification)
2. Pick the `AppDbContextMigrationTests` group first (it blocks the whole assembly from compiling)
3. Implement `AppDbContext` + `ModelBuilderExtensions` + DI registration + migration
4. Run `dotnet test backend/tests/SiesaAgents.IntegrationTests` — confirm the assembly compiles and `ExceptionHandlingMiddlewareTests` now run and pass (no new code needed there)
5. Start PostgreSQL locally, run `dotnet ef database update`, re-run tests — confirm `AppDbContextMigrationTests` pass (not soft-skipped)
6. Move to next test group if any remain, repeat until all 13 tests pass or cleanly soft-skip with documented reason

**Key Principles:**

- One AC group at a time — `AppDbContextMigrationTests` first, since it gates compilation for the whole assembly
- Minimal implementation (don't over-engineer; no `DbSet<>` properties per scope note)
- Run tests frequently
- Use implementation checklist as roadmap

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all 13 tests pass (or soft-skip with a documented infra reason)
2. Review `ModelBuilderExtensions.ToSnakeCase` regex for edge cases (acronyms, digits)
3. Ensure tests still pass after each refactor
4. Ready for code review and story approval

---

## Next Steps

1. Share this checklist and the two failing test files with the dev workflow (manual handoff)
2. Start PostgreSQL (`sudo service postgresql start` or `pg_ctlcluster 16 main start`) before attempting the GREEN phase for `AppDbContextMigrationTests`
3. Begin implementation using the Implementation Checklist above, working `AppDbContextMigrationTests` first (it gates compilation)
4. When all tests pass, refactor code for quality
5. Update `sprint-status.yaml` entry `1-3-backend-database-foundation` to `done` when complete

---

## Knowledge Base References Applied

- **test-quality.md** — Given-When-Then structure in code comments, one assertion per test (atomic facts), deterministic assertions, no hard waits/sleeps
- **test-levels-framework.md** — API/Integration level (xUnit + `WebApplicationFactory<Program>`) selected over E2E/Component, since this story has no UI and its risks (DB wiring, naming convention, middleware contract) are backend-contract concerns
- **fixture-architecture.md** (adapted to xUnit) — `TestWebApplicationFactory` as a shared, auto-disposed `IClassFixture<T>` fixture instead of Playwright's `test.extend()`
- **selector-resilience.md** — not applicable (no UI); analogous principle applied by asserting on stable JSON field names (`status`/`title`/`detail`) and stable SQL catalog columns rather than fragile string matching on full response bodies

---

## Notes

- This ATDD pass deviates from the default Playwright/TypeScript test stack described in the generic `testarch-atdd` workflow template because Story 1.3 is 100% backend (`has_ui_component = false`) and the story itself (Task 7) explicitly specifies xUnit + `Microsoft.AspNetCore.Mvc.Testing` + `WebApplicationFactory<Program>` as the required test stack, consistent with `company-standards.md`'s "xUnit + EF Core InMemory (unit) + PostgreSQL Test Containers (integration)" testing standard for the backend.
- Two small pieces of test-enablement scaffolding were added to `backend/src/SiesaAgents.API/Program.cs` as part of this ATDD pass (not production features): (1) `public partial class Program { }` so `WebApplicationFactory<Program>` can reference the implicit top-level-statements `Program` class from the test assembly, and (2) the `GET /api/v1/test-error` endpoint guarded by `app.Environment.IsEnvironment("Testing")`, exactly as specified in Story 1.3 Task 7. Neither is reachable outside the `"Testing"` hosting environment, so Development/Production behavior is unchanged.
- `backend/tests/SiesaAgents.IntegrationTests` was added to `SiesaAgents.sln` under the existing `tests` solution folder (alongside `SiesaAgents.UnitTests`) via `dotnet sln add ... --solution-folder tests`.
- `AppDbContextMigrationTests` cannot be run to a real green/red assertion outcome in this sandbox because PostgreSQL 16 is installed but its cluster is stopped (`pg_lsclusters` → `16 main 5432 down`) — consistent with the story's own "Local environment note". The soft-skip guard ensures this doesn't block CI; DEV must start PostgreSQL locally to observe true RED→GREEN transitions for this group.
- `PascalCase`/no-domain-table assertions double as regression guards for Epic 2 Story 2.1 (`clientes`) and Epic 3 Story 3.1 (`contactos`), which must each re-verify `Database_ContainsOnlyMigrationsHistoryTable_NoDomainTables`-style checks evolve rather than silently break once real entities are added.

---

## Contact

- Refer to `_bmad/bmm/testarch/tea-index.csv` for the full knowledge fragment index
- Story source: `_bmad-output/implementation-artifacts/1-3-backend-database-foundation.md`
- Epic source: `_bmad-output/planning-artifacts/epics/epic-01-foundation.md`
- Test design source: `_bmad-output/implementation-artifacts/test-design-epic-1.md` (TC-E1-P0-05, TC-E1-P1-05, TC-E1-P2-04)

---

**Generated by BMad TEA Agent** - 2026-07-06

# ATDD Checklist - Epic 1, Story 1.3: Backend Database Foundation

**Date:** 2026-07-02
**Author:** SiesaTeam (TEA)
**Primary Test Level:** API Integration (xUnit + `WebApplicationFactory<Program>` + Testcontainers PostgreSQL) with supporting Unit test (xUnit + EF Core InMemory)
**Status:** RED phase — all tests intentionally failing

---

## Story Summary

Story 1.3 wires up the .NET 10 backend's data layer: PostgreSQL connection via
`Npgsql.EntityFrameworkCore.PostgreSQL`, a `Data.AppDbContext`, a locally
implemented `ModelBuilderExtensions.ApplySnakeCaseNaming()`, an empty
`InitialCreate` EF Core migration, and a completed RFC 7807 `ProblemDetails`
middleware that returns Spanish `title`/`detail` fields with no stack-trace
leakage. This is a foundation-only story — no domain entities are created.

**As a** developer
**I want** the PostgreSQL database connected and the EF Core 10 infrastructure configured (DbContext, migrations, snake_case naming, RFC 7807 error middleware)
**So that** subsequent Epic 2 / Epic 3 stories can define `ClienteEntity` / `ContactoEntity` and run migrations against a working data layer without re-plumbing the persistence stack.

---

## Acceptance Criteria (from Story 1.3)

1. **AC #1** — `dotnet ef database update` creates `siesa_agents_db` with zero errors; `__ef_migrations_history` exists; CLI exits 0. (TC-E1-P1-05)
2. **AC #2** — `Migrations/` folder holds exactly one `InitialCreate` migration with an EMPTY `Up`/`Down` body.
3. **AC #3** — Unhandled 500 exception yields `application/problem+json` with `type`, `title`, `status`, `detail`, `instance` only; no `stackTrace`/`exception`/`innerException` leakage; no raw exception message. (TC-E1-P0-05 / NFR6 / R3)
4. **AC #4** — Last statement of `OnModelCreating` is `modelBuilder.ApplySnakeCaseNaming()`; every table/column/key/FK/index name is lower snake_case; verified against `__ef_migrations_history` columns (`migration_id`, `product_version`). (TC-E1-P2-04 / R5)
5. **AC #5** — Applied schema contains ONLY `__ef_migrations_history`; `clientes` / `contactos` tables ABSENT (scope-note enforcement).
6. **AC #6** — `dotnet build backend/SiesaAgents.sln` → 0 errors, 0 warnings across 6 projects (TC-E1-P1-06). *Regression guard — not a new ATDD test.*
7. **AC #7** — `dotnet test SiesaAgents.sln --filter Category=Integration` passes (covered by the RED-phase specs below).
8. **AC #8** — `title` and `detail` in Spanish per company standards; code identifiers remain English.

---

## Failing Tests Created (RED Phase)

### API Integration Tests — 3 tests

**File:** `backend/tests/SiesaAgents.IntegrationTests/ProblemDetailsMiddlewareTests.cs` (~95 lines)

| Test | AC | Status | Expected failure reason |
|---|---|---|---|
| `GivenUnhandledException_WhenGetTestError_ThenReturns500WithProblemDetailsAndNoStackTraceLeakage` | AC #3, AC #8, NFR6 | RED | (a) Project doesn't exist yet (Task 8); (b) `public partial class Program;` sentinel missing (Task 4); (c) `/api/v1/test-error` not mapped (Task 5); (d) middleware still lacks `Detail` and title still English (Task 6). |
| `GivenTestingEnvironment_WhenGetTestErrorEndpointExists_ThenItIsInvokable` | AC #3 | RED | Endpoint not registered — returns 404 instead of 500. |

**File:** `backend/tests/SiesaAgents.IntegrationTests/MigrationsAndSnakeCaseTests.cs` (~90 lines)

| Test | AC | Status | Expected failure reason |
|---|---|---|---|
| `GivenEmptyDatabase_WhenApplyingInitialCreateMigration_ThenOnlyHistoryTableExistsWithSnakeCaseColumns` | AC #1, AC #2, AC #4, AC #5 | RED | (a) `AppDbContext` type not created (Task 3); (b) no `InitialCreate` migration generated (Task 7); (c) `ApplySnakeCaseNaming` extension missing so columns stay PascalCase (Task 2). |

**File:** `backend/tests/SiesaAgents.IntegrationTests/TestingEnvWebApplicationFactory.cs` (~25 lines) — test support, not a test class itself.

### Unit Tests — 1 test

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/ModelBuilderExtensionsTests.cs` (~55 lines)

| Test | AC | Status | Expected failure reason |
|---|---|---|---|
| `GivenModelBuilderWithPascalCaseEntity_WhenApplySnakeCaseNamingIsCalled_ThenTableAndColumnsAreRewrittenToSnakeCase` | AC #4 | RED | `ModelBuilderExtensions.ApplySnakeCaseNaming` doesn't exist yet (Task 2) and UnitTests.csproj has no reference to Infrastructure nor `EFCore.InMemory` (Task 11 subtasks). |

**Total failing tests: 4** (3 Integration + 1 Unit) — every non-regression Story 1.3 AC (#1, #2, #3, #4, #5, #7, #8) is covered.

> AC #6 (solution builds with 0 errors/0 warnings) is a regression guard — validated by `dotnet build` in CI, not by a new ATDD test.

---

## Data Factories Created

None. Story 1.3 introduces no domain entities and no data flows — factories will
land with `ClienteFactory` in Epic 2 Story 2.1 and `ContactoFactory` in Epic 3.

---

## Fixtures Created

### `TestingEnvWebApplicationFactory` (xUnit `IClassFixture`)

**File:** `backend/tests/SiesaAgents.IntegrationTests/TestingEnvWebApplicationFactory.cs`

**Purpose:** Boots the API in-process via `WebApplicationFactory<Program>` with
`Environment = "Testing"`, which unlocks the `/api/v1/test-error` endpoint that
`Program.cs` maps only in that environment (Task 5). Used as
`IClassFixture<TestingEnvWebApplicationFactory>` in
`ProblemDetailsMiddlewareTests` so the factory is created once per class and
disposed automatically at teardown.

**Setup / Provides / Cleanup:**
- **Setup:** `builder.UseEnvironment("Testing")`.
- **Provides:** `CreateClient()` returns an `HttpClient` pointing at the in-memory host.
- **Cleanup:** disposed automatically by xUnit when the class fixture goes out of scope; the Testcontainers-backed Postgres in `MigrationsAndSnakeCaseTests` disposes independently via `IAsyncLifetime`.

---

## Mock Requirements

None. Every integration test hits the real ASP.NET Core pipeline in-process
and, for DB assertions, a real ephemeral PostgreSQL 18 container. External
services are not touched.

---

## Required `data-testid` Attributes

Not applicable — Story 1.3 is a backend-only story. No UI surface, no
`data-testid` selectors. E2E/component surface is unchanged.

---

## Implementation Checklist

The DEV team should turn each RED test GREEN in the order below (matches
Story 1.3 Task numbering to minimize backtracking).

### Task 8 — Scaffold `SiesaAgents.IntegrationTests` project

- [ ] `dotnet new xunit -n SiesaAgents.IntegrationTests -o tests/SiesaAgents.IntegrationTests`
- [ ] `dotnet sln add tests/SiesaAgents.IntegrationTests/SiesaAgents.IntegrationTests.csproj`
- [ ] Add project references: `SiesaAgents.API`, `SiesaAgents.Infrastructure`
- [ ] Add NuGet packages: `Microsoft.AspNetCore.Mvc.Testing 10.0.*`, `Testcontainers.PostgreSql 3.*`, `Microsoft.EntityFrameworkCore.Design 10.0.*`
- [ ] Delete the auto-generated `UnitTest1.cs` — RED tests already live at the target paths.

### Task 11 subtasks — Wire `SiesaAgents.UnitTests` to Infrastructure

- [ ] `dotnet add tests/SiesaAgents.UnitTests reference src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj`
- [ ] `dotnet add tests/SiesaAgents.UnitTests package Microsoft.EntityFrameworkCore.InMemory --version 10.0.*`

### Test: `GivenModelBuilderWithPascalCaseEntity_...`

- [ ] Task 2: create `backend/src/SiesaAgents.Infrastructure/Data/ModelBuilderExtensions.cs` with `ApplySnakeCaseNaming` + `ToSnakeCase` per story spec
- [ ] Run test: `cd backend && dotnet test tests/SiesaAgents.UnitTests --filter FullyQualifiedName~ModelBuilderExtensionsTests`
- [ ] Test passes (green phase)

### Test: `GivenEmptyDatabase_WhenApplyingInitialCreateMigration_...`

- [ ] Task 1: add `Microsoft.EntityFrameworkCore.Design` to `SiesaAgents.API` and `SiesaAgents.Infrastructure`
- [ ] Task 3: create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` with `ApplyConfigurationsFromAssembly` and `ApplySnakeCaseNaming` (last call) — **no** `DbSet<T>`
- [ ] Task 4: register `AddDbContext<AppDbContext>` in `Program.cs`
- [ ] Task 7: `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API --output-dir Migrations` — verify EMPTY `Up`/`Down` bodies; HALT if any `CreateTable` appears
- [ ] Run test (requires Docker): `cd backend && dotnet test tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~MigrationsAndSnakeCaseTests`
- [ ] Test passes (green phase)

### Test: `GivenUnhandledException_...` + `GivenTestingEnvironment_...`

- [ ] Task 4: add `public partial class Program;` sentinel to `Program.cs`
- [ ] Task 5: map `GET /api/v1/test-error` inside `if (app.Environment.EnvironmentName == "Testing") { ... }` block (before `app.Run()`), throwing `new InvalidOperationException("integration-test-error")`
- [ ] Task 6: edit `ExceptionHandlingMiddleware.cs` — set `Title = "Ocurrió un error inesperado."`, add `Detail = "Contacta al administrador si el problema persiste."`, keep `Type` and `Instance`. Never write `ex.Message` / `ex.StackTrace` / `ex.InnerException` into the response body.
- [ ] Run tests: `cd backend && dotnet test tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~ProblemDetailsMiddlewareTests`
- [ ] Both tests pass (green phase)

### Task 12 — Full verification

- [ ] `cd backend && dotnet build SiesaAgents.sln` → 0 errors, 0 warnings (AC #6)
- [ ] `cd backend && dotnet test SiesaAgents.sln` → all UnitTests + IntegrationTests pass (AC #7)
- [ ] `cd backend && dotnet ef migrations list --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` prints exactly one `{timestamp}_InitialCreate`
- [ ] With Postgres running: `dotnet ef database update ...` exits 0 and `psql \dt public.*` shows only `__ef_migrations_history`
- [ ] Playwright regression: `pnpm test:e2e` remains GREEN (Story 1.1 / 1.2 suites unaffected)

**Estimated effort:** 3.5 – 4.5 hours DEV, matches the story task breakdown.

---

## Running Tests

```bash
# All backend tests (unit + integration) — from backend/
dotnet test SiesaAgents.sln

# Only unit tests (no Docker needed)
dotnet test tests/SiesaAgents.UnitTests

# Only integration tests (Docker required for Testcontainers)
dotnet test tests/SiesaAgents.IntegrationTests --filter Category=Integration

# Everything EXCEPT Docker-dependent integration tests
dotnet test SiesaAgents.sln --filter Category!=Integration

# Single test class
dotnet test tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~ProblemDetailsMiddlewareTests

# Verbose output (see full assertion diffs)
dotnet test SiesaAgents.sln --logger "console;verbosity=detailed"
```

Frontend / E2E suites (unchanged, still GREEN):

```bash
pnpm --filter frontend test   # Vitest — story 1.2 units/components
pnpm test:e2e                 # Playwright — story 1.1 + 1.2 suites
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

- All 4 tests written and failing.
- Failures are due to missing implementation (AppDbContext, ModelBuilderExtensions, `/api/v1/test-error` endpoint, `Detail` field on `ProblemDetails`, `SiesaAgents.IntegrationTests` project scaffolding), NOT test bugs.
- No `[Fact(Skip = ...)]` or `[Trait("Skip", ...)]` markers anywhere.
- Given-When-Then structure is baked into every test — method names use the `Given_When_Then` triple, and the body carries `// GIVEN`, `// WHEN`, `// THEN` comments.

### GREEN Phase (DEV Team)

1. Follow the Implementation Checklist above in Story-Task order (1 → 2 → 3 → 4 → 5 → 6 → 7 → 8/11-subtasks → 12).
2. After each task, re-run only the tests it targets — watch each move from RED to GREEN.
3. Do NOT batch multiple tasks before re-running tests — the RED signal is the ATDD contract.

### REFACTOR Phase (DEV Team)

- With all tests GREEN, review `AppDbContext` and `ModelBuilderExtensions` for readability (extract `ToSnakeCase` if a shared utility grows).
- Do NOT introduce `EFCore.NamingConventions` or `.UseSnakeCaseNamingConvention()` — the extension method call site is contractual per AC #4.
- Do NOT change the fixed Spanish strings in `ExceptionHandlingMiddleware` — they are asserted verbatim.
- Do NOT change the test file names or method signatures — the CI filter names (`FullyQualifiedName~...`) rely on them.

---

## Test Execution Evidence (RED Phase Verification)

Expected outcome when running the suites BEFORE any implementation task:

```
cd backend && dotnet test SiesaAgents.sln
  UnitTests
    ✗ SiesaAgents.UnitTests.Infrastructure.ModelBuilderExtensionsTests.GivenModelBuilderWithPascalCaseEntity_...
        Build FAILED — CS0246: The type or namespace name 'SiesaAgents.Infrastructure.Data' could not be found.
        (ApplySnakeCaseNaming extension does not exist; Infrastructure project not referenced.)

  IntegrationTests (project doesn't exist yet)
    Solution reports:  Cannot find project 'SiesaAgents.IntegrationTests.csproj' referenced in tests/*
    → Once Task 8 scaffolds the project, tests compile but fail:
        ✗ ProblemDetailsMiddlewareTests.GivenUnhandledException_...
              CS0246 (Program) → after Task 4:
              404 Not Found (endpoint not mapped) → after Task 5:
              KeyNotFoundException on root.GetProperty("detail") → after Task 6:  GREEN
        ✗ ProblemDetailsMiddlewareTests.GivenTestingEnvironment_WhenGetTestErrorEndpointExists_ThenItIsInvokable
              404 Not Found → after Task 5: GREEN
        ✗ MigrationsAndSnakeCaseTests.GivenEmptyDatabase_...
              CS0246 (AppDbContext) → after Task 3:
              "No migrations were found" → after Task 7:
              Assert.Contains failure: "migration_id" not in cols → after Task 2: GREEN
```

- Total tests: 4
- Passing: 0 (expected)
- Failing / uncompilable: 4 (expected)
- Status: RED phase verified — every failure traces to a specific missing implementation task.

---

## Notes

- Story 1.3 is a **backend-only** infrastructure story. The generic ATDD guidance about `data-testid` selectors, `page.route(...)` network-first intercepts, and Playwright hard-wait avoidance is NOT applicable here — those are frontend E2E patterns. The equivalent discipline for this story is (a) hitting the in-process host through `WebApplicationFactory` before any `await client.GetAsync(...)`, (b) using `IAsyncLifetime` to start the Postgres container before the test body, and (c) never using `Thread.Sleep` in test code.
- The `TestingEnvWebApplicationFactory` deliberately toggles the "Testing" environment. This is the ATDD-friendly alternative to leaving a debug endpoint permanently exposed — the endpoint is compiled but only mapped when environment == Testing.
- `MigrationsAndSnakeCaseTests` requires Docker on the developer's machine (Testcontainers). CI without Docker should filter by `Category!=Integration` and rely on the local dev loop for those cases (documented in `backend/tests/SiesaAgents.IntegrationTests/README.md`).
- All tests avoid the following anti-patterns: shared mutable state between tests, hardcoded connection strings, `Thread.Sleep`, and mutation of the developer's local `siesa_agents_db`. Every DB assertion runs against a fresh Testcontainers instance.
- Given / When / Then is enforced both at method-name level and via inline comments so failure output in CI is self-describing.

---

## Knowledge Base References Applied

- **test-quality.md** — Given-When-Then structure at method-name level, one behavior per test, deterministic assertions, no shared state.
- **fixture-architecture.md** — `IClassFixture<TestingEnvWebApplicationFactory>` + `IAsyncLifetime` for Testcontainers, both with automatic teardown.
- **data-factories.md** — Deliberately deferred; no factories needed for a foundation story with zero entities.
- **network-first.md** — Adapted to backend: the in-process host is fully booted (via `_factory.CreateClient()`) before any HTTP request fires, mirroring the "intercept before navigate" invariant on the frontend.
- **timing-debugging.md** — No hard waits anywhere; all async waits are `await`-based on `HttpClient`, `NpgsqlConnection`, or `DbContext.Database.MigrateAsync()`.
- **selector-resilience.md** — N/A (no UI).

See `_bmad/bmm/testarch/tea-index.csv` for full knowledge fragment mapping.

---

## Next Steps

1. Share this checklist and the four failing tests with the DEV workflow (manual handoff, not auto-consumed).
2. Confirm RED phase locally: `cd backend && dotnet test SiesaAgents.sln` should fail across all four tests (or fail to build until Task 8 scaffolds the IntegrationTests project).
3. Follow the Implementation Checklist above in Story-Task order.
4. When all four tests are GREEN and `dotnet build` is 0-error/0-warning, mark Story 1.3 status → `ready-for-review` in `sprint-status.yaml`.

---

**Generated by BMad TEA Agent (sa-tea-atdd)** — 2026-07-02

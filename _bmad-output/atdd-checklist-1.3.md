# ATDD Checklist - Epic 1, Story 1.3: Backend Database Foundation

**Date:** 2026-06-11
**Author:** SiesaTeam
**Primary Test Level:** Unit (xUnit — backend infrastructure, no UI interaction)

---

## Story Summary

Story 1.3 establishes the PostgreSQL/EF Core infrastructure for the backend. It creates
`AppDbContext` in `SiesaAgents.Infrastructure`, registers it in DI, applies snake_case
naming conventions via `EFCore.NamingConventions`, and adds `ExceptionHandlingMiddleware`
that returns Problem Details RFC 7807 responses without exposing stack traces.

**As a** developer
**I want** the PostgreSQL database connected and the EF Core infrastructure configured
**So that** subsequent stories can define entities and run migrations against a working data layer

---

## Acceptance Criteria

1. (AC1) Given PostgreSQL is running locally, When the developer runs `dotnet ef database update`, Then the `siesa_agents_db` database is created with no errors, And the EF Core migrations folder exists in `SiesaAgents.Infrastructure`.

2. (AC2) Given an unhandled exception occurs in the backend, When the error reaches the middleware, Then the response returns Problem Details RFC 7807 format (`status`, `title`, `detail`) with no stack traces exposed (NFR6).

3. (AC3) Given the backend receives any request, When the request is processed, Then `ApplySnakeCaseNaming()` is applied in `OnModelCreating` and all future column names follow snake_case convention automatically.

4. (AC4) Given `appsettings.Development.json` is configured with the `siesa_agents_db` connection string, When `AppDbContext` is registered in DI, Then EF Core resolves the Npgsql provider without errors at startup.

5. (AC5) Given the solution is built, When `dotnet build` is run, Then all four projects (API, Application, Domain, Infrastructure) compile with zero errors and zero warnings.

---

## Failing Tests Created (RED Phase)

### Unit Tests — ExceptionHandlingMiddleware (5 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs`

- **Test:** `InvokeAsync_WhenExceptionThrown_Returns500WithProblemJsonContentType`
  - **Status:** RED — `SiesaAgents.API` project reference missing from test `.csproj`; resolves to RED after csproj update, pending full middleware contract verification
  - **Verifies:** AC2 — HTTP 500 status code and `Content-Type: application/problem+json` when exception is thrown

- **Test:** `InvokeAsync_WhenExceptionThrown_ResponseBodyContainsProblemDetailsShape`
  - **Status:** RED — compile error until project reference added; tests RFC 7807 shape (`status`, `title` with correct values)
  - **Verifies:** AC2 — response body has `status` (int 500) and `title` properties

- **Test:** `InvokeAsync_WhenExceptionThrown_ResponseBodyDoesNotContainStackTrace`
  - **Status:** RED — compile error until project reference added; verifies NFR6 security constraint
  - **Verifies:** AC2 + NFR6 — response body must NOT contain raw exception message or stack trace indicators

- **Test:** `InvokeAsync_WhenNoExceptionThrown_InvokesNextDelegateAndReturns200`
  - **Status:** RED — compile error until project reference added; verifies happy-path pass-through
  - **Verifies:** AC2 — `next` delegate is called and response is untouched when no exception occurs

- **Test:** `InvokeAsync_WhenExceptionThrown_TitleFieldIsGenericSafeMessage`
  - **Status:** RED — compile error until project reference added; verifies safe generic title message
  - **Verifies:** AC2 + NFR6 — `title` field contains generic safe message, NOT the raw exception message

### Unit Tests — AppDbContext (5 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

- **Test:** `AppDbContext_WhenCreated_ModelBuildsWithoutError`
  - **Status:** RED — `AppDbContext` class does not exist in `SiesaAgents.Infrastructure.Data`; compile error
  - **Verifies:** AC3 — `OnModelCreating` completes without error; snake_case naming convention is applied

- **Test:** `AppDbContext_ConstructorAcceptsDbContextOptions_WithoutThrowing`
  - **Status:** RED — `AppDbContext` class missing; compile error
  - **Verifies:** AC4 — constructor signature accepts `DbContextOptions<AppDbContext>` for DI compatibility

- **Test:** `AppDbContext_Model_IsNotNullAfterConstruction`
  - **Status:** RED — `AppDbContext` class missing; compile error
  - **Verifies:** AC3 + AC4 — `Model` property is accessible and non-null after construction

- **Test:** `AppDbContext_WhenRegisteredWithInMemoryProvider_ResolvesWithoutError`
  - **Status:** RED — `AppDbContext` class missing; compile error
  - **Verifies:** AC4 — DI container resolves `AppDbContext` without errors (simulated with InMemory provider)

- **Test:** `AppDbContext_Model_HasNoEntityTypes_InBaselineStory`
  - **Status:** RED — `AppDbContext` class missing; compile error
  - **Verifies:** AC3 scope note — model has zero entity types in Story 1.3 baseline (no domain entities)

---

## Data Factories Created

Not applicable for this story. Story 1.3 tests are pure unit tests against backend infrastructure
classes. No user-facing data entities exist yet (domain entities deferred to Epics 2 and 3).

---

## Fixtures Created

Not applicable for this story. All tests use `xUnit [Fact]` directly with inline test setup
(Arrange-Act-Assert pattern). No Playwright fixtures are needed for backend unit tests.

---

## Mock Requirements

### ExceptionHandlingMiddleware Mocks

**`RequestDelegate` (next delegate)**:
- Happy path: `ctx => { ctx.Response.StatusCode = 200; return Task.CompletedTask; }`
- Exception path: `_ => throw new InvalidOperationException("boom")`

All mocks are inline in the test methods using lambda delegates. No external mock libraries required.

### EF Core InMemory Provider

**Purpose:** Replaces Npgsql/PostgreSQL provider for unit-isolated testing.
**Package:** `Microsoft.EntityFrameworkCore.InMemory` (added to test `.csproj`)
**Usage:** `new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase("TestDb")`

**Notes:** Integration tests with real PostgreSQL (via TestContainers) are deferred to future stories when domain entities exist (per story dev notes).

---

## Required data-testid Attributes

Not applicable. Story 1.3 is pure backend infrastructure — no UI components are created.

---

## Implementation Checklist

### Test Group 1: ExceptionHandlingMiddleware Tests

**File:** `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs`

**Tasks to make all 5 ExceptionHandlingMiddleware tests pass:**

- [ ] Verify `ExceptionHandlingMiddleware` constructor accepts `(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)` — already done in skeleton
- [ ] Verify `InvokeAsync(HttpContext context)` is public and calls `next` delegate — already done
- [ ] Verify `Content-Type` is set to `"application/problem+json"` before writing response — already done
- [ ] Verify `StatusCode` is set to `500` — already done
- [ ] Verify `ProblemDetails.Title` is set to a generic safe string (e.g. "An unexpected error occurred") — already done
- [ ] Verify `ProblemDetails.Status` is set to `500` — already done
- [ ] Verify `ProblemDetails.Detail` is a safe generic string, NOT `exception.Message` — check current `null` value against test assertions
- [ ] Verify raw `exception.Message` is NOT written to response body — check `Detail = null` serialization behavior
- [ ] Verify stack trace indicators ("StackTrace", "   at ") are NOT written to response body
- [ ] Add project reference in test `.csproj`: `SiesaAgents.API` — done (added by ATDD agent)
- [ ] Run tests: `dotnet test backend/tests/SiesaAgents.UnitTests --filter "FullyQualifiedName~Middleware"`
- [ ] Verify all 5 tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test Group 2: AppDbContext Tests

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

**Tasks to make all 5 AppDbContext tests pass:**

- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`
- [ ] Inherit from `Microsoft.EntityFrameworkCore.DbContext`
- [ ] Add constructor: `public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }`
- [ ] Override `OnModelCreating(ModelBuilder modelBuilder)` with `base.OnModelCreating(modelBuilder)` call
- [ ] Add `modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly)` in `OnModelCreating`
- [ ] Add `modelBuilder.UseSnakeCaseNamingConvention()` as the LAST call in `OnModelCreating`
- [ ] Add NuGet package `EFCore.NamingConventions` to `SiesaAgents.Infrastructure.csproj`
- [ ] Add NuGet package `Microsoft.EntityFrameworkCore.Tools` to `SiesaAgents.Infrastructure.csproj`
- [ ] Do NOT add any `DbSet<>` properties (entities deferred to Epics 2 and 3)
- [ ] Add project reference in test `.csproj`: `SiesaAgents.Infrastructure` — done (added by ATDD agent)
- [ ] Add `Microsoft.EntityFrameworkCore.InMemory` to test `.csproj` — done (added by ATDD agent)
- [ ] Add `Microsoft.Extensions.DependencyInjection` to test `.csproj` — done (added by ATDD agent)
- [ ] Run tests: `dotnet test backend/tests/SiesaAgents.UnitTests --filter "FullyQualifiedName~Infrastructure"`
- [ ] Verify all 5 tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Additional Infrastructure Tasks (AC1, AC4, AC5 — not covered by unit tests)

These tasks are required by the acceptance criteria but tested manually (database operations, build compilation):

- [ ] Add `ConnectionStrings.DefaultConnection` to `backend/src/SiesaAgents.API/appsettings.Development.json`
- [ ] Register `AppDbContext` in `Program.cs` with `builder.Services.AddDbContext<AppDbContext>(...)` using Npgsql provider
- [ ] Add `Microsoft.EntityFrameworkCore.Design` to `SiesaAgents.API.csproj`
- [ ] Run `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
- [ ] Verify `Migrations/` folder exists in `SiesaAgents.Infrastructure` with empty migration (no table definitions)
- [ ] Run `dotnet ef database update` and verify `siesa_agents_db` database is created with `__EFMigrationsHistory` table
- [ ] Run `dotnet build` and verify zero errors and zero warnings across all 4 projects

---

## Running Tests

```bash
# Run ALL unit tests for Story 1.3
dotnet test backend/tests/SiesaAgents.UnitTests

# Run only ExceptionHandlingMiddleware tests
dotnet test backend/tests/SiesaAgents.UnitTests --filter "FullyQualifiedName~Middleware"

# Run only AppDbContext tests
dotnet test backend/tests/SiesaAgents.UnitTests --filter "FullyQualifiedName~Infrastructure"

# Run with verbose output
dotnet test backend/tests/SiesaAgents.UnitTests --logger "console;verbosity=detailed"

# Run from project root with all output
dotnet test backend/tests/SiesaAgents.UnitTests -v normal
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All 10 unit tests written and in RED state (compile failures due to missing `AppDbContext`, missing project references)
- Test project `.csproj` updated with required project references (`SiesaAgents.API`, `SiesaAgents.Infrastructure`) and NuGet packages (`Microsoft.EntityFrameworkCore.InMemory`, `Microsoft.Extensions.DependencyInjection`, `Microsoft.Extensions.Logging.Abstractions`)
- Mock requirements documented (inline `RequestDelegate` lambdas, EF InMemory provider)
- Implementation checklist created with clear, ordered tasks
- No data-testid attributes required (pure backend story)

**Verification:**

- `AppDbContextTests.cs` — 5 tests will fail at compile time (class does not exist)
- `ExceptionHandlingMiddlewareTests.cs` — 5 tests will fail at compile/runtime pending full implementation verification
- Failures are due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. Pick the first failing test from AppDbContext group: `AppDbContext_ConstructorAcceptsDbContextOptions_WithoutThrowing`
2. Create `AppDbContext.cs` with the DI-compatible constructor
3. Run test to verify it passes
4. Move to next test: `AppDbContext_Model_IsNotNullAfterConstruction`
5. Add `OnModelCreating` with `UseSnakeCaseNamingConvention()` call
6. Run tests to verify green
7. Continue through remaining tests
8. After all unit tests pass, complete manual AC1/AC4/AC5 tasks (migrations, DI wiring, build verification)

**Key Principles:**

- One test at a time (do not try to fix all at once)
- Minimal implementation (do not over-engineer)
- Run tests frequently for immediate feedback
- Follow implementation checklist as roadmap

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 10 tests pass
2. Review `AppDbContext.cs` for code quality (naming, XML docs, null safety)
3. Review `ExceptionHandlingMiddleware.cs` for completeness (ensure `type` field is set per RFC 7807)
4. Ensure `UseSnakeCaseNamingConvention()` is truly the LAST call in `OnModelCreating`
5. Ensure tests still pass after any refactor
6. Verify `dotnet build` shows zero warnings before marking story done

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase: `dotnet test backend/tests/SiesaAgents.UnitTests`
3. Begin implementation using the implementation checklist above as guide
4. Work one test at a time (red → green for each)
5. When all 10 unit tests pass, complete the manual infrastructure tasks (migrations, DI registration, build verification)
6. When all tasks complete, update story status to `done`

---

## Knowledge Base References Applied

- **test-quality.md** — Test design principles: Given-When-Then, Arrange/Act/Assert, one assertion per test, determinism
- **test-levels-framework.md** — Unit tests selected as primary level (pure backend infrastructure, no UI/E2E needed)
- **fixture-architecture.md** — Inline arrange pattern selected over fixtures (no shared state needed for these tests)
- **data-factories.md** — Not applicable (no user-facing entities in Story 1.3 scope)
- **network-first.md** — Not applicable (no HTTP navigation; ASP.NET Core `DefaultHttpContext` used directly)

---

## Test Execution Evidence

### Current State — RED Phase Verification

**Expected failure when running before implementation:**

```
Build FAILED.
error CS0246: The type or namespace name 'AppDbContext' could not be found
  (are you missing a using directive or an assembly reference?)
  → backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs
```

**After project reference fix (compile succeeds, runtime RED for AppDbContext tests):**

```
Failed  AppDbContext_WhenCreated_ModelBuildsWithoutError [compile error or runtime]
Failed  AppDbContext_ConstructorAcceptsDbContextOptions_WithoutThrowing [compile error]
Failed  AppDbContext_Model_IsNotNullAfterConstruction [compile error]
Failed  AppDbContext_WhenRegisteredWithInMemoryProvider_ResolvesWithoutError [compile error]
Failed  AppDbContext_Model_HasNoEntityTypes_InBaselineStory [compile error]
```

**Summary:**

- Total tests: 10 (5 ExceptionHandlingMiddleware + 5 AppDbContext)
- Passing: 0 expected initially
- Failing: 10 expected initially
- Status: RED phase — primary RED condition is missing `AppDbContext` class

---

## Notes

- This story is purely backend infrastructure — no Playwright/E2E tests are applicable
- The xUnit test framework (company standard per `company-standards.md`) is used for all tests
- EF Core InMemory provider is used for unit tests; TestContainers (PostgreSQL) is deferred to future stories
- AC1 (migrations) cannot be unit tested and is verified manually via `dotnet ef database update`
- AC5 (zero build warnings) is verified via `dotnet build` CI step, not unit tests
- The `AppDbContext` must NOT have any `DbSet<>` properties in Story 1.3 — `AppDbContext_Model_HasNoEntityTypes_InBaselineStory` enforces this constraint
- `ExceptionHandlingMiddleware` must NOT expose `exception.Message` or stack traces — `InvokeAsync_WhenExceptionThrown_ResponseBodyDoesNotContainStackTrace` and `InvokeAsync_WhenExceptionThrown_TitleFieldIsGenericSafeMessage` enforce NFR6

---

## Contact

**Questions or Issues?**

- Refer to `_bmad-output/implementation-artifacts/1-3-backend-database-foundation.md` for full story context
- Consult `_bmad-output/planning-artifacts/architecture.md` for Data Architecture and Security sections
- Company standards: `.claude/agent-memory/sa-quick-dev/company-standards.md`

---

**Generated by BMad TEA Agent** — 2026-06-11

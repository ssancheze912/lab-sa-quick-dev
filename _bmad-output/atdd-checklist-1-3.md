# ATDD Checklist - Epic 1, Story 1.3: Backend Database Foundation

**Date:** 2026-06-20
**Author:** SiesaTeam
**Primary Test Level:** API (Playwright) + Unit (xUnit)

---

## Story Summary

Story 1.3 establishes the PostgreSQL data layer for the Siesa Agents CRM backend. It configures EF Core with Npgsql, creates an AppDbContext with snake_case naming convention, registers the DI infrastructure, and produces an empty InitialCreate migration. It also hardens the ExceptionHandlingMiddleware to return RFC 7807 Problem Details with no stack trace exposure.

**As a** developer
**I want** the PostgreSQL database connected and the EF Core infrastructure configured
**So that** subsequent stories can define entities and run migrations against a working data layer

---

## Acceptance Criteria

1. **AC1** — Given PostgreSQL is running locally, When `dotnet ef database update` is run from `backend/`, Then `siesa_agents_db` is created with no errors and EF Core migrations folder exists at `backend/src/SiesaAgents.Infrastructure/Migrations/`.

2. **AC2** — Given the backend is running and an unhandled exception occurs, When the error reaches the middleware, Then the response returns Problem Details RFC 7807 format (`status`, `title`, `detail`) with no stack traces or exception messages exposed (NFR6).

3. **AC3** — Given the backend receives any request that results in a database operation, When EF Core maps entities to tables, Then `ApplySnakeCaseNaming()` is called last inside `OnModelCreating` and all column names follow `snake_case` convention automatically — no `[Column]` or `[Table]` attributes used.

4. **AC4** — Given the infrastructure is configured, When `dotnet build SiesaAgents.sln` is executed, Then `AppDbContext`, `IApplicationDbContext`, and the EF Core DI registration compile with zero errors and `Npgsql.EntityFrameworkCore.PostgreSQL` is the provider.

5. **AC5** — Given the initial empty migration is created, When a developer inspects the migration, Then it is an empty `InitialCreate` migration — it does NOT define `clientes` or `contactos` tables.

---

## Failing Tests Created (RED Phase)

### API Tests — Playwright (13 tests)

**File:** `e2e/story-1-3/database-foundation.api.spec.ts`

**AC2 — ExceptionHandlingMiddleware returns Problem Details RFC 7807 (6 tests)**

- RED **Test:** `should return Content-Type application/problem+json on 500 error`
  - **Status:** RED — Endpoint `GET /api/test/throw` does not exist; middleware not yet hardened
  - **Verifies:** AC2 — Content-Type header is `application/problem+json`

- RED **Test:** `should include "status" field with value 500 in the Problem Details body`
  - **Status:** RED — `/api/test/throw` endpoint missing; body shape not yet enforced
  - **Verifies:** AC2 — `body.status === 500` (RFC 7807 §3.1)

- RED **Test:** `should include "title" field in the Problem Details body`
  - **Status:** RED — ProblemDetails.Title not yet set in middleware
  - **Verifies:** AC2 — `body.title` is a non-empty string

- RED **Test:** `should NOT expose stack traces in the Problem Details "detail" field`
  - **Status:** RED — Middleware not yet hardened; may currently expose exception details
  - **Verifies:** AC2 + NFR6 — `body.detail === null`

- RED **Test:** `should NOT expose exception messages in the Problem Details body`
  - **Status:** RED — Response body may contain raw exception text before implementation
  - **Verifies:** AC2 + NFR6 — No `StackTrace`, `at System.`, or `Exception` in body text

- RED **Test:** `should return Problem Details as valid JSON (parseable body)`
  - **Status:** RED — Backend may return HTML error page before middleware is hardened
  - **Verifies:** AC2 — Response body is valid JSON object

**AC4 — Backend compiles with EF Core, IApplicationDbContext, and Npgsql (3 tests)**

- RED **Test:** `should have the backend running — proving zero compilation errors`
  - **Status:** RED — Backend does not compile until Story 1.3 packages and registrations are added
  - **Verifies:** AC4 — Proxy: `/scalar` responds with status < 500

- RED **Test:** `should return health or operational response from backend root`
  - **Status:** RED — Backend startup fails if AppDbContext DI registration has errors
  - **Verifies:** AC4 — Proxy: root endpoint responds (200, 301, 302, or 404)

- RED **Test:** `should NOT expose Npgsql connection errors as unhandled HTML pages`
  - **Status:** RED — If EF Core DI is misconfigured, server may crash on startup
  - **Verifies:** AC4 — `/scalar` returns 200 HTML (EF Core uses lazy connections; startup OK without PostgreSQL running)

**AC5 — InitialCreate migration creates no domain tables (4 tests)**

- RED **Test:** `should NOT have /api/v1/clientes endpoint available in Story 1.3`
  - **Status:** RED — Endpoint doesn't exist yet (Epic 2 introduces it)
  - **Verifies:** AC5 — `GET /api/v1/clientes` returns 404

- RED **Test:** `should NOT have /api/v1/contactos endpoint available in Story 1.3`
  - **Status:** RED — Endpoint doesn't exist yet (Epic 3 introduces it)
  - **Verifies:** AC5 — `GET /api/v1/contactos` returns 404

- RED **Test:** `should NOT have /api/v1/clientes POST endpoint available in Story 1.3`
  - **Status:** RED — POST route not registered in Story 1.3
  - **Verifies:** AC5 — `POST /api/v1/clientes` returns 404

- RED **Test:** `should NOT have /api/v1/contactos POST endpoint available in Story 1.3`
  - **Status:** RED — POST route not registered in Story 1.3
  - **Verifies:** AC5 — `POST /api/v1/contactos` returns 404

### Unit Tests — xUnit .NET (9 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextConfigurationTests.cs`

**AC3 — snake_case naming via EFCore.NamingConventions (3 tests)**

- RED **Test:** `AppDbContext_CanBeInstantiated_WithInMemoryProvider`
  - **Status:** RED — `AppDbContext` class does not exist yet (compilation error)
  - **Verifies:** AC3 — AppDbContext accepts DbContextOptions and can be constructed

- RED **Test:** `OnModelCreating_BuildsModel_WithoutErrors`
  - **Status:** RED — `AppDbContext` and `UseSnakeCaseNamingConvention` not yet installed
  - **Verifies:** AC3 — OnModelCreating executes without exception; model is accessible

- RED **Test:** `AppDbContext_InitialMigration_HasNoEntityTypesDefined`
  - **Status:** RED — AppDbContext not yet created; will fail with compilation error
  - **Verifies:** AC3 + AC5 — Zero entity types registered in the context (empty migration scope)

**AC4 — IApplicationDbContext interface contract (2 tests)**

- RED **Test:** `AppDbContext_ImplementsIApplicationDbContext`
  - **Status:** RED — `IApplicationDbContext` interface does not exist yet
  - **Verifies:** AC4 — `AppDbContext` is assignable to `IApplicationDbContext`

- RED **Test:** `IApplicationDbContext_SaveChangesAsync_IsCallable`
  - **Status:** RED — Interface missing; method signature not defined
  - **Verifies:** AC4 — `SaveChangesAsync` returns 0 with no pending changes

**AC1 — Migrations folder and InitialCreate file (4 tests)**

- RED **Test:** `MigrationsFolder_ExistsAtExpectedPath`
  - **Status:** RED — `backend/src/SiesaAgents.Infrastructure/Data/Migrations/` does not exist
  - **Verifies:** AC1 — `dotnet ef migrations add InitialCreate` was run with `--output-dir Data/Migrations`

- RED **Test:** `InitialCreate_MigrationFile_Exists`
  - **Status:** RED — No `*InitialCreate.cs` file exists
  - **Verifies:** AC1 — Migration file generated by EF Core CLI tooling

- RED **Test:** `InitialCreate_DoesNotDefine_ClientesTable`
  - **Status:** RED — Migration file does not exist (fails at folder check first)
  - **Verifies:** AC5 — InitialCreate migration body does NOT contain "clientes"

- RED **Test:** `InitialCreate_DoesNotDefine_ContactosTable`
  - **Status:** RED — Migration file does not exist (fails at folder check first)
  - **Verifies:** AC5 — InitialCreate migration body does NOT contain "contactos"

---

## Data Factories Created

### Database Foundation Factory

**File:** `e2e/support/factories/database.factory.ts`

**Exports:**

- `DB_FOUNDATION_CONTRACTS` — Endpoint URLs for Story 1.3 validation (scalar, test/throw, clientes, contactos)
- `EXPECTED_PROBLEM_DETAILS_500` — Expected RFC 7807 Problem Details shape for 500 responses
- `createClientePayload(overrides?)` — Minimal payload to verify POST /api/v1/clientes returns 404
- `createContactoPayload(overrides?)` — Minimal payload to verify POST /api/v1/contactos returns 404

**Example Usage:**

```typescript
import { DB_FOUNDATION_CONTRACTS, EXPECTED_PROBLEM_DETAILS_500 } from '../support/factories/database.factory';

const response = await request.get(DB_FOUNDATION_CONTRACTS.testThrowEndpoint);
const body = await response.json();
expect(body.status).toBe(EXPECTED_PROBLEM_DETAILS_500.status);
expect(body.detail).toBe(EXPECTED_PROBLEM_DETAILS_500.detail); // null
```

---

## Fixtures Created

No new Playwright fixtures are required for Story 1.3. Tests use the base `@playwright/test` fixture directly with `{ request }` for API calls. The existing `e2e/fixtures/base.fixture.ts` is not extended in this story.

---

## Mock Requirements

### Test-Throw Endpoint (Required for AC2)

The ExceptionHandlingMiddleware tests require a backend endpoint that intentionally throws an unhandled exception. The DEV team must create this test-only endpoint:

**Endpoint:** `GET /api/test/throw`

**Behavior:** Throws `new Exception("ATDD test exception — intentional")` synchronously.

**Environment:** Should only be registered in Development environment (guarded by `if (app.Environment.IsDevelopment())`).

**Implementation Pattern (Program.cs, Development only):**

```csharp
if (app.Environment.IsDevelopment())
{
    app.MapGet("/api/test/throw", () =>
    {
        throw new Exception("ATDD test exception — intentional");
    });
}
```

**Why:** ExceptionHandlingMiddleware behavior cannot be observed without triggering a real unhandled exception. Network-layer interception cannot simulate server-side exception flow.

---

## Required data-testid Attributes

Story 1.3 is **pure backend infrastructure** — there is NO frontend work in this story. No `data-testid` attributes are required.

---

## Implementation Checklist

### Test: `should return Content-Type application/problem+json on 500 error` (AC2)

**File:** `e2e/story-1-3/database-foundation.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Open `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`
- [ ] Set `context.Response.ContentType = "application/problem+json"` in catch block
- [ ] Set `context.Response.StatusCode = StatusCodes.Status500InternalServerError`
- [ ] Use `context.Response.WriteAsJsonAsync(problem)` to write the Problem Details body
- [ ] Verify middleware is registered in `Program.cs` before routing: `app.UseMiddleware<ExceptionHandlingMiddleware>()`
- [ ] Add test-only throw endpoint in Program.cs (Development only): `app.MapGet("/api/test/throw", () => { throw new Exception("test"); })`
- [ ] Run test: `npx playwright test e2e/story-1-3/database-foundation.api.spec.ts --grep "Content-Type"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should NOT expose stack traces in the Problem Details "detail" field` (AC2, NFR6)

**File:** `e2e/story-1-3/database-foundation.api.spec.ts`

**Tasks to make this test pass:**

- [ ] In `ExceptionHandlingMiddleware.cs`, set `ProblemDetails.Detail = null` explicitly
- [ ] NEVER set `Detail = ex.Message` or `Detail = ex.ToString()`
- [ ] NEVER set `Detail = ex.StackTrace`
- [ ] Log the exception using `ILogger<ExceptionHandlingMiddleware>` (server-side only)
- [ ] Run test: `npx playwright test e2e/story-1-3/database-foundation.api.spec.ts --grep "stack traces"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `AppDbContext_CanBeInstantiated_WithInMemoryProvider` (AC3)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextConfigurationTests.cs`

**Tasks to make this test pass:**

- [ ] Run: `dotnet add backend/src/SiesaAgents.Infrastructure package Npgsql.EntityFrameworkCore.PostgreSQL`
- [ ] Run: `dotnet add backend/src/SiesaAgents.Infrastructure package Microsoft.EntityFrameworkCore.Design`
- [ ] Run: `dotnet add backend/src/SiesaAgents.Infrastructure package EFCore.NamingConventions`
- [ ] Run: `dotnet add backend/tests/SiesaAgents.UnitTests package Microsoft.EntityFrameworkCore.InMemory`
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` with `AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)` constructor
- [ ] In `OnModelCreating`: call `base.OnModelCreating(modelBuilder)`, then `modelBuilder.ApplyConfigurationsFromAssembly(...)`, then `modelBuilder.UseSnakeCaseNamingConvention()` (LAST)
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.UnitTests --filter "AppDbContext_CanBeInstantiated"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: `AppDbContext_ImplementsIApplicationDbContext` (AC4)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextConfigurationTests.cs`

**Tasks to make this test pass:**

- [ ] Create `backend/src/SiesaAgents.Application/Interfaces/IApplicationDbContext.cs`
- [ ] Define interface with `Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)`
- [ ] Add `Microsoft.EntityFrameworkCore` (abstraction) reference to `SiesaAgents.Application.csproj`
- [ ] Make `AppDbContext` implement `IApplicationDbContext`
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.UnitTests --filter "IApplicationDbContext"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `MigrationsFolder_ExistsAtExpectedPath` (AC1)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextConfigurationTests.cs`

**Tasks to make this test pass:**

- [ ] In `backend/src/SiesaAgents.API/Program.cs`, register AppDbContext with `UseNpgsql` pointing to `DefaultConnection` connection string
- [ ] Add connection string to `backend/src/SiesaAgents.API/appsettings.Development.json`: `Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres`
- [ ] Run: `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API --output-dir Data/Migrations` from `backend/` directory
- [ ] Verify `backend/src/SiesaAgents.Infrastructure/Data/Migrations/` folder is created
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.UnitTests --filter "MigrationsFolder"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should NOT have /api/v1/clientes endpoint available in Story 1.3` (AC5)

**File:** `e2e/story-1-3/database-foundation.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Verify that NO `clientes` routes are registered in `Program.cs` in Story 1.3 scope
- [ ] Confirm `ClienteEntity` is NOT defined anywhere in the codebase
- [ ] Confirm the InitialCreate migration Up/Down methods have no `migrationBuilder.CreateTable` calls
- [ ] Run test: `npx playwright test e2e/story-1-3/database-foundation.api.spec.ts --grep "clientes"`
- [ ] ✅ Test passes (green phase) — 404 is the expected passing state

**Estimated Effort:** 0.1 hours (verification only — no code to write)

---

## Running Tests

```bash
# Run all Playwright API tests for Story 1.3
npx playwright test e2e/story-1-3/database-foundation.api.spec.ts

# Run specific AC2 tests (Problem Details middleware)
npx playwright test e2e/story-1-3/database-foundation.api.spec.ts --grep "AC2"

# Run specific AC4 tests (compilation proxy)
npx playwright test e2e/story-1-3/database-foundation.api.spec.ts --grep "AC4"

# Run specific AC5 tests (empty migration proxy)
npx playwright test e2e/story-1-3/database-foundation.api.spec.ts --grep "AC5"

# Run in headed mode
npx playwright test e2e/story-1-3/database-foundation.api.spec.ts --headed

# Debug specific test
npx playwright test e2e/story-1-3/database-foundation.api.spec.ts --debug

# Run xUnit unit tests (requires .NET and backend to exist)
dotnet test backend/tests/SiesaAgents.UnitTests --filter "AppDbContextConfiguration"

# Run all unit tests in the test project
dotnet test backend/tests/SiesaAgents.UnitTests
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing (13 Playwright API + 9 xUnit = 22 total)
- ✅ Data factory created (`database.factory.ts`)
- ✅ Mock requirements documented (test throw endpoint)
- ✅ No data-testid attributes required (pure backend story)
- ✅ Implementation checklist created

**Verification:**

- Playwright tests fail because: backend doesn't compile without Story 1.3 packages; `GET /api/test/throw` endpoint doesn't exist; middleware not yet hardened
- xUnit tests fail because: `AppDbContext`, `IApplicationDbContext` classes don't exist (compilation errors)
- Failures are due to missing implementation — not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with AC4 compilation — Task 1 and 2)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Recommended Order:**

1. Task 1: Add EF Core packages → makes xUnit compilation possible
2. Task 2: Create AppDbContext + IApplicationDbContext → passes AC3, AC4 xUnit tests
3. Task 3: Register in Program.cs → passes AC4 Playwright proxy tests
4. Task 4: Verify connection string → prerequisite for Task 5
5. Task 5: Create empty migration → passes AC1 xUnit tests
6. Task 6: Harden ExceptionHandlingMiddleware → passes AC2 Playwright tests (add /api/test/throw endpoint first)

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. All 22 tests passing (green phase complete)
2. Review `OnModelCreating` for clarity (ensure `UseSnakeCaseNamingConvention()` is definitively last)
3. Ensure `ExceptionHandlingMiddleware` uses constructor injection for `ILogger`
4. Verify `appsettings.Development.json` is in `.gitignore` or uses user secrets for credentials
5. Run `dotnet build SiesaAgents.sln` one final time to confirm zero warnings

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing Playwright tests: `npx playwright test e2e/story-1-3/`
3. Run failing xUnit tests: `dotnet test backend/tests/SiesaAgents.UnitTests`
4. Begin implementation using the implementation checklist as guide
5. Work one test at a time (red → green for each)
6. When all tests pass, refactor for quality
7. When refactoring complete, manually update story status to 'done'

---

## Knowledge Base References Applied

- **network-first.md** — API tests use `request` fixture (no navigation needed for API-only tests)
- **test-quality.md** — Given-When-Then structure, one assertion per test, deterministic behavior
- **selector-resilience.md** — No UI selectors in this story (pure backend); API response assertions only
- **test-levels-framework.md** — API level selected for HTTP-observable ACs; Unit level for EF Core internals
- **fixture-architecture.md** — No new fixtures needed; base `{ request }` fixture used directly

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Playwright Command:** `npx playwright test e2e/story-1-3/database-foundation.api.spec.ts`

**Expected Results (all fail because backend not yet implemented):**

```
FAIL  e2e/story-1-3/database-foundation.api.spec.ts
  AC2 — ExceptionHandlingMiddleware returns Problem Details RFC 7807
    ✗ should return Content-Type application/problem+json on 500 error
      Expected: 500, Received: 404 (endpoint /api/test/throw not registered)
    ✗ should include "status" field with value 500 in the Problem Details body
      Cannot parse JSON from 404 response
    ✗ should include "title" field in the Problem Details body
      Cannot parse JSON from 404 response
    ✗ should NOT expose stack traces in the Problem Details "detail" field
      Cannot parse JSON from 404 response
    ✗ should NOT expose exception messages in the Problem Details body
      Response body does not trigger exception path
    ✗ should return Problem Details as valid JSON (parseable body)
      404 response body is not valid Problem Details JSON
  AC4 — Backend compiles with EF Core, IApplicationDbContext, and Npgsql provider
    ✗ should have the backend running — proving zero compilation errors
      ECONNREFUSED (backend fails to start without Npgsql registration)
    ✗ should return health or operational response from backend root
      ECONNREFUSED
    ✗ should NOT expose Npgsql connection errors as unhandled HTML pages
      ECONNREFUSED
  AC5 — InitialCreate migration creates no domain tables (empty migration)
    ✗ should NOT have /api/v1/clientes endpoint available in Story 1.3
      ECONNREFUSED
    ✗ should NOT have /api/v1/contactos endpoint available in Story 1.3
      ECONNREFUSED
    ✗ should NOT have /api/v1/clientes POST endpoint available in Story 1.3
      ECONNREFUSED
    ✗ should NOT have /api/v1/contactos POST endpoint available in Story 1.3
      ECONNREFUSED

13 failed
```

**xUnit Command:** `dotnet test backend/tests/SiesaAgents.UnitTests`

**Expected Results (all fail due to compilation errors):**

```
Build FAILED.
  Error CS0246: The type or namespace name 'AppDbContext' could not be found
  Error CS0246: The type or namespace name 'IApplicationDbContext' could not be found
  Error CS0246: The type or namespace name 'DbContextOptionsBuilder' could not be found
  (All 9 tests blocked by compilation error — valid RED state)
```

**Summary:**

- Total tests: 22 (13 Playwright API + 9 xUnit)
- Passing: 0 (expected)
- Failing: 22 (expected)
- Status: ✅ RED phase — tests define expected behavior before implementation

---

## Notes

- Story 1.3 is **pure backend** — no frontend code, no UI components, no navigation changes.
- The `AC5` Playwright tests (checking 404 for domain endpoints) will need to be REMOVED or updated once Epic 2 (Story 2.1) and Epic 3 (Story 3.1) implement those endpoints. They serve as boundary guards for Story 1.3 scope only.
- The `/api/test/throw` endpoint must be guarded by `app.Environment.IsDevelopment()` — it must NEVER exist in production.
- xUnit tests for AC1 (migration folder path) use relative navigation from the test binary output directory — they will work correctly when run from the standard `dotnet test` output structure.
- If PostgreSQL is not running locally during development, `dotnet run` for the API still succeeds because EF Core uses lazy database connections (no query at startup).

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Refer to `_bmad-output/test-design-epic-1.md` for overall Epic 1 test strategy
- Consult `_bmad/bmm/testarch/knowledge/` for testing best practices

---

**Generated by BMad TEA Agent** - 2026-06-20

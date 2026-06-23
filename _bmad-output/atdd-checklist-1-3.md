# ATDD Checklist - Epic 1, Story 1.3: Backend Database Foundation

**Date:** 2026-06-23
**Author:** SiesaTeam
**Primary Test Level:** API + Unit (xUnit)

---

## Story Summary

Story 1.3 wires the PostgreSQL data layer for the Clean Architecture backend established in Story 1.1.
It creates `SiesaAgentsDbContext` in the Infrastructure layer with snake_case naming conventions,
registers it as a scoped DI service, and implements `ExceptionHandlingMiddleware` to return
Problem Details RFC 7807 responses for unhandled exceptions — with no stack traces exposed (NFR6).

**As a** developer
**I want** the PostgreSQL database connected and the EF Core infrastructure configured
**So that** subsequent stories can define entities and run migrations against a working data layer

---

## Acceptance Criteria

1. **AC1** — `dotnet ef database update` creates `siesa_agents_db` with no errors and migrations folder exists
2. **AC2** — Unhandled exceptions return Problem Details RFC 7807 (status 500, title, detail) — no stack traces (NFR6)
3. **AC3** — `UseSnakeCaseNamingConvention()` is applied in `OnModelCreating` — no manual `[Column]`/`[Table]` attributes
4. **AC4** — `SiesaAgentsDbContext` is registered as a scoped service in `Program.cs` via `ConnectionStrings:DefaultConnection`
5. **AC5** — `InitialCreate` migration exists in `backend/src/SiesaAgents.Infrastructure/Data/Migrations/` (empty schema)
6. **AC6** — `DbContext` has zero `DbSet<>` properties — `ClienteEntity` and `ContactoEntity` NOT defined in this story
7. **AC7** — `ExceptionHandlingMiddleware` exists at `API/Middleware/ExceptionHandlingMiddleware.cs` and is registered before endpoint mapping
8. **AC8** — `appsettings.Development.json` contains `ConnectionStrings:DefaultConnection` for `siesa_agents_db`
9. **AC9** — `SiesaAgents.Infrastructure.csproj` references `Microsoft.EntityFrameworkCore.Design`
10. **AC10** — xUnit test instantiates `SiesaAgentsDbContext` with InMemory provider; `OnModelCreating` executes without exceptions

---

## Failing Tests Created (RED Phase)

### API Tests - Playwright (8 tests)

**File:** `e2e/tests/database/backend-database-foundation.api.spec.ts`

- **Test:** `should return HTTP 500 for an unhandled exception endpoint`
  - **Status:** RED — endpoint `/api/test/throw-exception` does not exist and middleware not implemented
  - **Verifies:** AC2, AC7 — HTTP 500 returned for unhandled exception
  - **AC covered:** AC2, AC7

- **Test:** `should return a body with RFC 7807 "status" field equal to 500`
  - **Status:** RED — ExceptionHandlingMiddleware not implemented
  - **Verifies:** AC2 — Problem Details body has `status: 500`
  - **AC covered:** AC2

- **Test:** `should return a Problem Details body with "title" equal to "Internal Server Error"`
  - **Status:** RED — ExceptionHandlingMiddleware not implemented
  - **Verifies:** AC2 — Problem Details body has correct `title`
  - **AC covered:** AC2

- **Test:** `should return a Problem Details body with a "detail" field that hides the stack trace`
  - **Status:** RED — ExceptionHandlingMiddleware not implemented
  - **Verifies:** AC2, NFR6 — detail exists but no stack trace leaked
  - **AC covered:** AC2

- **Test:** `should return Content-Type application/json for Problem Details error responses`
  - **Status:** RED — ExceptionHandlingMiddleware not implemented
  - **Verifies:** AC2 — Content-Type is JSON-based for error responses
  - **AC covered:** AC2

- **Test:** `should not interfere with normal successful requests (middleware pass-through)`
  - **Status:** RED — ExceptionHandlingMiddleware not implemented (pass-through behavior)
  - **Verifies:** AC7 — middleware does not break normal requests
  - **AC covered:** AC7

- **Test:** `should not expose C# exception type names in the 500 response body`
  - **Status:** RED — ExceptionHandlingMiddleware not implemented
  - **Verifies:** AC2, NFR6 — no internal .NET types in response
  - **AC covered:** AC2

- **Test:** `should not include a raw stackTrace field in the Problem Details response`
  - **Status:** RED — ExceptionHandlingMiddleware not implemented
  - **Verifies:** AC2, NFR6 — no `stackTrace`, `exception`, `innerException` fields
  - **AC covered:** AC2

### Unit/Integration Tests - xUnit C# (12 tests)

**File (DbContext):** `backend/tests/SiesaAgents.UnitTests/Infrastructure/SiesaAgentsDbContextTests.cs`

- **Test:** `DbContext_CanBeInstantiated_WithInMemoryProvider`
  - **Status:** RED — `SiesaAgentsDbContext` class does not exist; InMemory package not referenced
  - **Verifies:** AC10 — DbContext can be instantiated with InMemory provider
  - **AC covered:** AC10

- **Test:** `OnModelCreating_DoesNotThrow_WithInMemoryProvider`
  - **Status:** RED — `SiesaAgentsDbContext` does not exist
  - **Verifies:** AC10 — OnModelCreating executes without exceptions
  - **AC covered:** AC10

- **Test:** `DbContext_HasZeroEntityTypes_InInitialMigration`
  - **Status:** RED — `SiesaAgentsDbContext` does not exist
  - **Verifies:** AC6 — No entity types registered (empty schema for Story 1.3)
  - **AC covered:** AC6

- **Test:** `DbContext_HasNoPublicDbSetProperties`
  - **Status:** RED — `SiesaAgentsDbContext` does not exist
  - **Verifies:** AC6 — Zero public DbSet<T> properties on the context class
  - **AC covered:** AC6

- **Test:** `DbContext_IsRegistered_AsScopedService`
  - **Status:** RED — `SiesaAgentsDbContext` does not exist
  - **Verifies:** AC4 — Different instance per scope (scoped lifetime)
  - **AC covered:** AC4

- **Test:** `DbContext_ReturnsSameInstance_WithinSameScope`
  - **Status:** RED — `SiesaAgentsDbContext` does not exist
  - **Verifies:** AC4 — Same instance within a single scope
  - **AC covered:** AC4

- **Test:** `OnModelCreating_ExecutesWithoutError_ConfirmingNamingConventionIsApplied`
  - **Status:** RED — `SiesaAgentsDbContext` does not exist
  - **Verifies:** AC3 — `UseSnakeCaseNamingConvention()` applied without errors
  - **AC covered:** AC3

- **Test:** `InitialCreate_Migration_ExistsInMigrationsFolder`
  - **Status:** RED — Migration file does not exist yet (`dotnet ef` not run)
  - **Verifies:** AC5 — `*_InitialCreate.cs` exists in `Data/Migrations/`
  - **AC covered:** AC5

**File (Middleware):** `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs`

- **Test:** `ExceptionHandlingMiddleware_HasInvokeAsyncMethod`
  - **Status:** RED — `ExceptionHandlingMiddleware` class does not exist
  - **Verifies:** AC7 — Middleware class conforms to ASP.NET Core middleware contract
  - **AC covered:** AC7

- **Test:** `ExceptionHandlingMiddleware_Constructor_AcceptsRequestDelegateAndLogger`
  - **Status:** RED — `ExceptionHandlingMiddleware` does not exist
  - **Verifies:** AC7 — Constructor accepts RequestDelegate
  - **AC covered:** AC7

- **Test:** `InvokeAsync_WhenExceptionThrown_SetsStatusCode500`
  - **Status:** RED — `ExceptionHandlingMiddleware` does not exist
  - **Verifies:** AC2 — HTTP 500 status for unhandled exception
  - **AC covered:** AC2

- **Test:** `InvokeAsync_WhenExceptionThrown_SetsContentTypeToJson`
  - **Status:** RED — `ExceptionHandlingMiddleware` does not exist
  - **Verifies:** AC2 — Content-Type is application/json on error
  - **AC covered:** AC2

- **Test:** `InvokeAsync_WhenExceptionThrown_ResponseBodyContainsStatusField500`
  - **Status:** RED — `ExceptionHandlingMiddleware` does not exist
  - **Verifies:** AC2 — Problem Details body has `status: 500`
  - **AC covered:** AC2

- **Test:** `InvokeAsync_WhenExceptionThrown_ResponseBodyContainsTitleField`
  - **Status:** RED — `ExceptionHandlingMiddleware` does not exist
  - **Verifies:** AC2 — Problem Details body has correct `title`
  - **AC covered:** AC2

- **Test:** `InvokeAsync_WhenExceptionThrown_ResponseBodyDoesNotExposeStackTrace`
  - **Status:** RED — `ExceptionHandlingMiddleware` does not exist
  - **Verifies:** AC2, NFR6 — No stack trace in response body
  - **AC covered:** AC2

- **Test:** `InvokeAsync_WhenNoException_CallsNextDelegate`
  - **Status:** RED — `ExceptionHandlingMiddleware` does not exist
  - **Verifies:** AC7 — Pass-through behavior when no exception occurs
  - **AC covered:** AC7

---

## Data Factories Created

No frontend data factories needed for this backend infrastructure story.
All test data is generated inline using xUnit arrange sections.

---

## Fixtures Created

No Playwright fixtures required for this story. Tests use Playwright's built-in `request` context
for API-level testing.

---

## Mock Requirements

### ExceptionHandlingMiddleware — Test Throw Endpoint

**Required:** DEV must add a test-only endpoint to trigger an unhandled exception for API tests.

**Endpoint:** `GET /api/test/throw-exception`

**Behavior:** Throws an `InvalidOperationException` with an internal message that must NOT
appear in the response body.

**Notes:**
- This endpoint should only be active in Development environment
- The middleware must catch the exception and return Problem Details RFC 7807
- Internal exception message must be masked from the response (NFR6)

**Recommended implementation (Program.cs — Development only):**
```csharp
if (app.Environment.IsDevelopment())
{
    app.MapGet("/api/test/throw-exception", () => {
        throw new InvalidOperationException("This internal detail must not be exposed");
    });
}
```

---

## Required data-testid Attributes

No UI elements involved in this backend infrastructure story.
All validation is API-level (HTTP status codes, response body structure).

---

## Implementation Checklist

### Test: DbContext Tests (AC3, AC4, AC5, AC6, AC10)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/SiesaAgentsDbContextTests.cs`

**Tasks to make these tests pass:**

- [ ] Add `Microsoft.EntityFrameworkCore.InMemory` NuGet to `SiesaAgents.UnitTests.csproj`:
  `dotnet add backend/tests/SiesaAgents.UnitTests package Microsoft.EntityFrameworkCore.InMemory`
- [ ] Add project reference to Infrastructure in test project:
  `dotnet add backend/tests/SiesaAgents.UnitTests reference backend/src/SiesaAgents.Infrastructure`
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/SiesaAgentsDbContext.cs` inheriting `DbContext`
- [ ] Override `OnModelCreating` to call `modelBuilder.UseSnakeCaseNamingConvention()` as last call
- [ ] Ensure zero `DbSet<>` properties on `SiesaAgentsDbContext`
- [ ] Run `dotnet ef migrations add InitialCreate --project backend/src/SiesaAgents.Infrastructure --startup-project backend/src/SiesaAgents.API --output-dir Data/Migrations`
- [ ] Register `SiesaAgentsDbContext` in `Program.cs` using `AddDbContext<SiesaAgentsDbContext>` with `UseNpgsql`
- [ ] Add `ConnectionStrings:DefaultConnection` to `appsettings.Development.json`
- [ ] Run tests: `dotnet test backend/tests/SiesaAgents.UnitTests --filter "SiesaAgentsDbContextTests"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 3 hours

---

### Test: ExceptionHandlingMiddleware Unit Tests (AC2, AC7)

**File:** `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs`

**Tasks to make these tests pass:**

- [ ] Add project reference to `SiesaAgents.API` in the test project (or move middleware to Application layer):
  `dotnet add backend/tests/SiesaAgents.UnitTests reference backend/src/SiesaAgents.API`
- [ ] Create `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`
- [ ] Implement constructor: `(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)`
- [ ] Implement `InvokeAsync(HttpContext context)` with try/catch
- [ ] On exception: set status 500, Content-Type application/json, write Problem Details body
- [ ] Problem Details body must include `status`, `title`, `detail` — never expose stack trace
- [ ] Register `app.UseMiddleware<ExceptionHandlingMiddleware>()` in `Program.cs` before endpoint mapping
- [ ] Remove `app.UseExceptionHandler()` and `app.UseStatusCodePages()` from `Program.cs`
- [ ] Run tests: `dotnet test backend/tests/SiesaAgents.UnitTests --filter "ExceptionHandlingMiddlewareTests"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: API-Level Middleware Tests (AC2, AC7 via Playwright)

**File:** `e2e/tests/database/backend-database-foundation.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Implement `ExceptionHandlingMiddleware` (see above)
- [ ] Add test endpoint `GET /api/test/throw-exception` (Development only)
- [ ] Register middleware before `app.MapGet(...)` calls in `Program.cs`
- [ ] Run backend: `dotnet run --project backend/src/SiesaAgents.API`
- [ ] Run tests: `npx playwright test e2e/tests/database/backend-database-foundation.api.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

## Running Tests

```bash
# Run all Playwright API tests for this story
npx playwright test e2e/tests/database/backend-database-foundation.api.spec.ts

# Run specific test in headed mode
npx playwright test e2e/tests/database/backend-database-foundation.api.spec.ts --headed

# Debug specific test
npx playwright test e2e/tests/database/backend-database-foundation.api.spec.ts --debug

# Run xUnit tests for DbContext
dotnet test backend/tests/SiesaAgents.UnitTests --filter "SiesaAgentsDbContextTests"

# Run xUnit tests for Middleware
dotnet test backend/tests/SiesaAgents.UnitTests --filter "ExceptionHandlingMiddlewareTests"

# Run ALL xUnit tests for this story
dotnet test backend/tests/SiesaAgents.UnitTests --filter "Infrastructure|Middleware"

# Run all tests with coverage
dotnet test backend/tests/SiesaAgents.UnitTests --collect:"XPlat Code Coverage"
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing
- API-level tests: 8 tests (Playwright)
- Unit-level tests: 16 tests (xUnit)
- Mock requirements documented (test throw endpoint)
- Implementation checklist created

**Verification:**

- Playwright tests fail: endpoint does not exist, middleware not implemented
- xUnit tests fail: `SiesaAgentsDbContext` and `ExceptionHandlingMiddleware` classes do not compile
- Failures are due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test from implementation checklist (start with xUnit — faster feedback)
2. Read the test to understand expected behavior
3. Implement minimal code to make that specific test pass
4. Run the test to verify it now passes (green)
5. Check off the task in implementation checklist
6. Move to next test and repeat

**Recommended Order:**

1. `SiesaAgentsDbContext` — makes 8 xUnit tests green
2. `ExceptionHandlingMiddleware` — makes 8 xUnit tests green
3. NuGet packages + project references — enables compilation
4. `dotnet ef migrations add InitialCreate` — makes migration file test green
5. Test endpoint + run Playwright — makes 8 API tests green

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all tests pass (green phase complete)
2. Remove test endpoint from Production environment (ensure Development-only guard)
3. Ensure `UseSnakeCaseNamingConvention()` is truly the LAST call in `OnModelCreating`
4. Verify no manual `[Column]` or `[Table]` attributes were accidentally added
5. Run full test suite to confirm nothing regressed

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow
2. Run failing xUnit tests: `dotnet test backend/tests/SiesaAgents.UnitTests`
3. Run failing Playwright tests: `npx playwright test e2e/tests/database/`
4. Begin implementation using implementation checklist as guide
5. Work one test at a time (red → green for each)
6. When all tests pass, refactor and verify
7. When refactoring complete, update story status to 'done'

---

## Acceptance Criteria Coverage Matrix

| AC   | Test Level | Test File | Tests |
|------|-----------|-----------|-------|
| AC1  | Manual/CI | dotnet ef database update | (CLI verification) |
| AC2  | API       | `backend-database-foundation.api.spec.ts` | 6 |
| AC2  | Unit      | `ExceptionHandlingMiddlewareTests.cs` | 6 |
| AC3  | Unit      | `SiesaAgentsDbContextTests.cs` | 1 |
| AC4  | Unit      | `SiesaAgentsDbContextTests.cs` | 2 |
| AC5  | Unit      | `SiesaAgentsDbContextTests.cs` | 1 |
| AC6  | Unit      | `SiesaAgentsDbContextTests.cs` | 2 |
| AC7  | API       | `backend-database-foundation.api.spec.ts` | 2 |
| AC7  | Unit      | `ExceptionHandlingMiddlewareTests.cs` | 3 |
| AC8  | Manual    | appsettings.Development.json inspection | (file check) |
| AC9  | Manual    | dotnet ef migrations add (build validation) | (CLI verification) |
| AC10 | Unit      | `SiesaAgentsDbContextTests.cs` | 2 |

**Total automated tests: 26** (8 API Playwright + 16 xUnit C#)
**Manual verification needed: AC1, AC8, AC9** (file/CLI checks)

---

## Notes

- AC1 (database creation) and AC8 (connection string config) are verified manually or via CI
  pipeline running `dotnet ef database update`. No automated test can create a real PostgreSQL DB.
- AC9 (EF Core Design package) is implicitly verified when `dotnet ef migrations add` succeeds.
- The xUnit test project currently references only `Application` and `Domain` projects.
  The dev must add `Infrastructure` reference before DbContext tests can compile.
- `UseSnakeCaseNamingConvention()` from `EFCore.NamingConventions` may not apply column-name
  mapping when using the InMemory provider. The unit test verifies that no exception is thrown,
  not the actual column names. Column naming is validated by inspecting the generated migration SQL.
- `ExceptionHandlingMiddleware` is in `SiesaAgents.API` namespace. The test project will need an
  API project reference, which creates a circular concern. Consider extracting middleware to
  `SiesaAgents.Application` or a shared library if circular references arise.

---

## Knowledge Base References Applied

- **network-first.md** — Route interception pattern (no UI interception needed for API-only tests)
- **test-quality.md** — Given-When-Then, one assertion per test, deterministic test data
- **test-levels-framework.md** — API tests for middleware contract; Unit tests for class behavior
- **fixture-architecture.md** — No custom fixtures needed; Playwright `request` context used directly

---

**Generated by BMad TEA Agent** - 2026-06-23

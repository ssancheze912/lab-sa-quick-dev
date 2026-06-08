# ATDD Checklist - Epic 1, Story 1.3: Backend Database Foundation

**Date:** 2026-06-08
**Author:** SiesaTeam
**Primary Test Level:** Unit (xUnit/.NET)

---

## Story Summary

This story wires the persistence layer on top of the solution scaffold from Story 1.1.
It sets up PostgreSQL connectivity via EF Core 10, creates an empty `InitialCreate` migration,
implements `AppDbContext` with snake_case naming, defines the `IApplicationDbContext` interface,
and hardens `ExceptionHandlingMiddleware` to comply with Problem Details RFC 7807.

**As a** developer
**I want** the PostgreSQL database connected and EF Core infrastructure configured
**So that** subsequent stories can define entities and run migrations against a working data layer

---

## Acceptance Criteria

1. **Given** PostgreSQL is running locally, **when** the developer runs `dotnet ef database update`, **then** `siesa_agents_db` is created with no errors and `__EFMigrationsHistory` table is present.

2. **Given** the backend solution is initialized, **when** the developer inspects `src/SiesaAgents.Infrastructure`, **then** an `InitialCreate` migration file exists under `Data/Migrations/` and contains no domain tables (`clientes`, `contactos`).

3. **Given** the backend receives any request, **when** `OnModelCreating` is called in `AppDbContext`, **then** `modelBuilder.ApplySnakeCaseNaming()` is applied as the last statement and all future column names follow snake_case automatically.

4. **Given** an unhandled exception occurs, **when** the error reaches `ExceptionHandlingMiddleware`, **then** the response returns `application/problem+json` with `status`, `title`, and `detail` fields (RFC 7807) and no stack traces are exposed (NFR6).

5. **Given** the `AppDbContext` is registered in DI, **when** `dotnet build SiesaAgents.sln` is executed, **then** all four Clean Architecture projects compile with zero errors and `IApplicationDbContext` (Application layer) is satisfied by `AppDbContext` (Infrastructure layer).

6. **Given** the backend starts with a valid `ConnectionStrings:DefaultConnection`, **when** the application launches via `dotnet run`, **then** EF Core successfully opens a connection to the PostgreSQL database without throwing at startup.

---

## Failing Tests Created (RED Phase)

### Unit Tests — AppDbContext (AC #2, #3, #5)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

RED status: Build fails — `IApplicationDbContext` does not yet exist in `SiesaAgents.Application`.
Expected error: `CS0234: The type or namespace name 'Application' does not exist in the namespace 'SiesaAgents'`

- **Test:** `OnModelCreating_WhenCalled_AppliesSnakeCaseNamingConvention`
  - **Status:** RED — compile error (IApplicationDbContext missing)
  - **Verifies:** AC#3 — `AppDbContext` can be constructed with InMemory provider (snake_case wiring is exercised via DI configuration)

- **Test:** `OnModelCreating_WhenCalled_DoesNotThrow`
  - **Status:** RED — compile error (IApplicationDbContext missing)
  - **Verifies:** AC#3 — `OnModelCreating` does not throw when `ApplySnakeCaseNaming()` is called last

- **Test:** `AppDbContext_ImplementsIApplicationDbContext`
  - **Status:** RED — compile error (IApplicationDbContext missing)
  - **Verifies:** AC#5 — `AppDbContext` satisfies `IApplicationDbContext` contract

- **Test:** `SaveChangesAsync_WhenCalled_DelegatesToBase`
  - **Status:** RED — compile error (IApplicationDbContext missing)
  - **Verifies:** AC#5 — `SaveChangesAsync` delegates to base and is callable via interface

- **Test:** `IApplicationDbContext_HasOnlySaveChangesAsyncMethod`
  - **Status:** RED — compile error (IApplicationDbContext missing)
  - **Verifies:** AC#5 — Interface declares only `SaveChangesAsync` (no premature DbSet exposure)

- **Test:** `IApplicationDbContext_HasNoDbSetProperties`
  - **Status:** RED — compile error (IApplicationDbContext missing)
  - **Verifies:** AC#5 — Interface has no `DbSet<>` properties (Application layer stays ORM-free)

- **Test:** `AppDbContext_HasNoClientesDbSet`
  - **Status:** RED — compile error (IApplicationDbContext missing)
  - **Verifies:** AC#2 — No `Clientes` DbSet on `AppDbContext` (scope boundary: Epic 2)

- **Test:** `AppDbContext_HasNoContactosDbSet`
  - **Status:** RED — compile error (IApplicationDbContext missing)
  - **Verifies:** AC#2 — No `Contactos` DbSet on `AppDbContext` (scope boundary: Epic 3)

### Unit Tests — ExceptionHandlingMiddleware (AC #4)

**File:** `backend/tests/SiesaAgents.UnitTests/API/ExceptionHandlingMiddlewareTests.cs`

RED status: Build fails due to compile error in same project (blocked by AppDbContextTests).
Once IApplicationDbContext is created, middleware tests will execute and the detail-field/stack-trace
test may expose implementation gaps if middleware is not fully hardened per AC#4.

- **Test:** `InvokeAsync_WhenExceptionThrown_ReturnsStatus500`
  - **Status:** RED — blocked by compile error
  - **Verifies:** AC#4 — 500 status for unhandled generic exceptions

- **Test:** `InvokeAsync_WhenExceptionThrown_ReturnsApplicationProblemJsonContentType`
  - **Status:** RED — blocked by compile error
  - **Verifies:** AC#4 — `Content-Type: application/problem+json`

- **Test:** `InvokeAsync_WhenExceptionThrown_ResponseBodyContainsStatusField`
  - **Status:** RED — blocked by compile error
  - **Verifies:** AC#4 — RFC 7807 `status` field present in response body

- **Test:** `InvokeAsync_WhenExceptionThrown_ResponseBodyContainsTitleField`
  - **Status:** RED — blocked by compile error
  - **Verifies:** AC#4 — RFC 7807 `title` field present in response body

- **Test:** `InvokeAsync_WhenExceptionThrown_ResponseBodyContainsDetailField`
  - **Status:** RED — blocked by compile error
  - **Verifies:** AC#4 — RFC 7807 `detail` field present in response body

- **Test:** `InvokeAsync_WhenExceptionThrown_DetailFieldDoesNotContainStackTrace`
  - **Status:** RED — blocked by compile error; will expose violation if middleware exposes stack traces
  - **Verifies:** AC#4 / NFR6 — No stack trace or internal exception details leaked to caller

- **Test:** `InvokeAsync_WhenArgumentExceptionThrown_ReturnsStatus400`
  - **Status:** RED — blocked by compile error
  - **Verifies:** AC#4 — `ArgumentException` maps to 400 Bad Request

- **Test:** `InvokeAsync_WhenKeyNotFoundExceptionThrown_ReturnsStatus404`
  - **Status:** RED — blocked by compile error
  - **Verifies:** AC#4 — `KeyNotFoundException` maps to 404 Not Found

- **Test:** `InvokeAsync_WhenUnauthorizedAccessExceptionThrown_ReturnsStatus401`
  - **Status:** RED — blocked by compile error
  - **Verifies:** AC#4 — `UnauthorizedAccessException` maps to 401 Unauthorized

- **Test:** `InvokeAsync_WhenNoException_PassesRequestThrough`
  - **Status:** RED — blocked by compile error
  - **Verifies:** AC#4 — Middleware is transparent when no exception is thrown

**Total Unit Tests:** 18 (8 AppDbContext + 10 ExceptionHandlingMiddleware)

---

## Data Factories Created

Not applicable. This is a backend-only infrastructure story with no domain entities and no test data factories needed. All test data is created inline using EF Core InMemory provider.

---

## Fixtures Created

Not applicable. No shared test fixtures are required at this stage. Each test sets up its own
`DefaultHttpContext` (for middleware tests) or `DbContextOptions` (for AppDbContext tests).

---

## Mock Requirements

### ExceptionHandlingMiddleware — RequestDelegate Mock

The middleware tests use a lambda-based `RequestDelegate` constructed inline (no external mock library required).

```csharp
// Inline mock — throws to simulate unhandled exception
RequestDelegate next = _ => throw new Exception("boom");

// Inline mock — happy path
RequestDelegate next = ctx =>
{
    ctx.Response.StatusCode = 200;
    return Task.CompletedTask;
};
```

### EF Core InMemory Provider (for AppDbContext tests)

```csharp
var options = new DbContextOptionsBuilder<AppDbContext>()
    .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
    .Options;
```

**Note:** `Microsoft.EntityFrameworkCore.InMemory` version 10.0.1 is already present in `SiesaAgents.UnitTests.csproj`.

---

## Required data-testid Attributes

Not applicable. This story is backend-only with no UI components.

---

## Implementation Checklist

### Test: `AppDbContext_ImplementsIApplicationDbContext` (and all 5 related AppDbContext tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

**Tasks to make these tests pass:**

- [ ] Create `src/SiesaAgents.Application/Interfaces/IApplicationDbContext.cs` with `Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)` method
- [ ] Create `src/SiesaAgents.Application/Interfaces/` directory
- [ ] Ensure `SiesaAgents.Application.csproj` does NOT import `Microsoft.EntityFrameworkCore` (keep Application ORM-free)
- [ ] Update `AppDbContext` to implement `IApplicationDbContext`: change class declaration to `public sealed class AppDbContext : DbContext, IApplicationDbContext`
- [ ] Add `Microsoft.EntityFrameworkCore.Design` to `SiesaAgents.Infrastructure.csproj`
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.UnitTests --filter "AppDbContext"`
- [ ] Verify `AppDbContext_HasNoClientesDbSet` passes (no DbSet added)
- [ ] Verify `AppDbContext_HasNoContactosDbSet` passes (no DbSet added)
- [ ] ✅ All AppDbContext tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `InvokeAsync_WhenExceptionThrown_DetailFieldDoesNotContainStackTrace`

**File:** `backend/tests/SiesaAgents.UnitTests/API/ExceptionHandlingMiddlewareTests.cs`

**Tasks to make this test pass:**

- [ ] Review `ExceptionHandlingMiddleware.HandleExceptionAsync` — currently passes `exception.Message` as `detail`
- [ ] Per AC#4 / NFR6: `detail` for 500 errors must be null or a generic non-identifying message (never `exception.Message` for InternalServerError)
- [ ] For 400/404/401, `detail` may include a safe descriptive message (not internal exception details)
- [ ] Ensure `context.Response.ContentType = "application/problem+json"` is set before body write
- [ ] Ensure `context.Response.StatusCode` is set before writing body
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.UnitTests --filter "ExceptionHandlingMiddleware"`
- [ ] ✅ All middleware tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: All remaining ExceptionHandlingMiddleware tests

**File:** `backend/tests/SiesaAgents.UnitTests/API/ExceptionHandlingMiddlewareTests.cs`

**Tasks to make these tests pass:**

- [ ] Verify `ExceptionHandlingMiddleware` constructor accepts `(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)` (already implemented)
- [ ] Verify `InvokeAsync(HttpContext context)` signature (already implemented)
- [ ] Verify `ArgumentException` → 400, `KeyNotFoundException` → 404, `UnauthorizedAccessException` → 401, all others → 500 (already implemented)
- [ ] Verify `application/problem+json` content type is set (already implemented)
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.UnitTests --filter "ExceptionHandlingMiddleware"`
- [ ] ✅ All middleware tests pass (green phase)

**Estimated Effort:** 0.25 hours

---

## Running Tests

```bash
# Run all unit tests (from backend/ directory)
dotnet test tests/SiesaAgents.UnitTests/

# Run AppDbContext tests only
dotnet test tests/SiesaAgents.UnitTests/ --filter "AppDbContext"

# Run ExceptionHandlingMiddleware tests only
dotnet test tests/SiesaAgents.UnitTests/ --filter "ExceptionHandlingMiddleware"

# Run with verbose output
dotnet test tests/SiesaAgents.UnitTests/ --verbosity normal

# Run with coverage
dotnet test tests/SiesaAgents.UnitTests/ --collect:"XPlat Code Coverage"

# Build only (verify RED phase compile errors)
dotnet build tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj
```

**Note:** There are no E2E or Playwright tests for this story — it is backend-only infrastructure.
AC#1 and AC#6 (database connectivity, migration) are verified manually via `dotnet ef database update` and `dotnet run`.

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing (compile error: `IApplicationDbContext` not yet created)
- ✅ Middleware tests written covering all AC#4 scenarios
- ✅ AppDbContext tests written covering AC#2, AC#3, AC#5
- ✅ No external fixtures or factories needed (inline setup pattern)
- ✅ Mock requirements documented (inline lambdas, InMemory EF provider)
- ✅ Implementation checklist created

**Verification:**

```
Command: dotnet build backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj

Result:
  error CS0234: The type or namespace name 'Application' does not exist in the
  namespace 'SiesaAgents' (are you missing an assembly reference?)

Summary:
  Build FAILED — 1 error
  Status: RED phase verified (tests fail due to missing implementation, not test bugs)
```

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Create `src/SiesaAgents.Application/Interfaces/IApplicationDbContext.cs`
2. Update `AppDbContext` to implement `IApplicationDbContext`
3. Run: `dotnet test tests/SiesaAgents.UnitTests/` — verify 18 tests pass
4. If `InvokeAsync_WhenExceptionThrown_DetailFieldDoesNotContainStackTrace` fails, harden `ExceptionHandlingMiddleware` to avoid leaking `exception.Message` for 500 errors
5. Install EF Core tools: `dotnet tool install --global dotnet-ef`
6. Run migration: `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API --output-dir Data/Migrations`
7. Apply migration: `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
8. Verify `siesa_agents_db` created and `__EFMigrationsHistory` has exactly 1 row

**Key Principles:**

- One task at a time (start with `IApplicationDbContext` — it unblocks all 18 tests)
- Run tests frequently after each change
- Do NOT add `DbSet<>` properties — scope boundary enforced by tests

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all 18 unit tests pass
2. Verify migration is empty of domain tables (`Up()` / `Down()` must be empty bodies)
3. Verify `AppDbContext` constructor uses primary constructor syntax if desired
4. Ensure `appsettings.Development.json` is in `.gitignore`
5. Run full solution build: `dotnet build SiesaAgents.sln`
6. Verify AC#5: zero compile errors across all four projects

---

## Next Steps

1. Run `dotnet build backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj` to confirm RED phase
2. Create `src/SiesaAgents.Application/Interfaces/IApplicationDbContext.cs` (unlocks all 18 tests)
3. Update `AppDbContext` to implement `IApplicationDbContext`
4. Run `dotnet test backend/tests/SiesaAgents.UnitTests/` to reach GREEN phase
5. Harden `ExceptionHandlingMiddleware` per AC#4 / NFR6 if any tests still fail
6. Complete manual AC#1 / AC#6 verification (database migration + startup check)
7. When all tests pass, update story status to `done` in sprint-status.yaml

---

## Knowledge Base References Applied

- **test-quality.md** — Given-When-Then structure, one assertion per test, deterministic isolation
- **fixture-architecture.md** — Inline setup pattern (no shared fixtures needed for pure unit tests)
- **component-tdd.md** — Red-green-refactor cycle applied to .NET xUnit unit tests
- **test-levels-framework.md** — Unit tests selected (backend-only story, no UI, no external services)
- **selector-resilience.md** — Not applicable (no UI components)
- **network-first.md** — Not applicable (no browser/network interactions)

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `dotnet build backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj`

**Results:**

```
Build FAILED.
error CS0234: The type or namespace name 'Application' does not exist in the namespace 'SiesaAgents'
  → backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs(2,19)
```

**Summary:**

- Total tests: 18 (blocked by compile error)
- Passing: 0 (expected — build fails)
- Failing: 18 (expected — compile error = RED)
- Status: RED phase verified

**Expected Failure Messages per Test (once IApplicationDbContext is created but AppDbContext does not implement it):**

- `AppDbContext_ImplementsIApplicationDbContext` → `Assert.True() Failure: AppDbContext must implement IApplicationDbContext defined in SiesaAgents.Application`
- `SaveChangesAsync_WhenCalled_DelegatesToBase` → `CS0266: Cannot implicitly convert type 'AppDbContext' to 'IApplicationDbContext'`
- `IApplicationDbContext_HasOnlySaveChangesAsyncMethod` → Passes once interface is created (no extra methods)
- `IApplicationDbContext_HasNoDbSetProperties` → Passes once interface is created (no properties)

---

## Notes

- This story is backend-only. No E2E (Playwright) tests are generated.
- AC#1 and AC#6 require a live PostgreSQL instance and are verified manually (not automatable as unit tests).
- AC#2 (migration empty of domain tables) is partially covered by `AppDbContext_HasNoClientesDbSet` and `AppDbContext_HasNoContactosDbSet` unit tests, which verify no DbSet properties exist on the context.
- The `ExceptionHandlingMiddleware` already exists from Story 1.1 but needs hardening: currently it passes `exception.Message` as `detail` for all exceptions including 500s, which violates NFR6. The test `InvokeAsync_WhenExceptionThrown_DetailFieldDoesNotContainStackTrace` will catch stack-trace leaks but not `exception.Message` leaks. DEV should set `detail = null` for 500 errors to fully comply with AC#4.
- `UnitTest1.cs` in the test project should be cleaned up (leftover scaffold file).

---

**Generated by BMad TEA Agent** - 2026-06-08

# ATDD Checklist - Epic 1, Story 3: Backend Database Foundation

**Date:** 2026-06-22
**Author:** SiesaTeam
**Primary Test Level:** Unit (xUnit) + API (Playwright)

---

## Story Summary

The developer needs PostgreSQL connected and EF Core infrastructure configured so that subsequent
stories can define entities and run migrations against a working data layer. This story establishes
the data layer foundation in Clean Architecture: AppDbContext in Infrastructure, domain exceptions
in Domain, and ExceptionHandlingMiddleware in the API layer.

**As a** developer
**I want** the PostgreSQL database connected and the EF Core infrastructure configured
**So that** subsequent stories can define entities and run migrations against a working data layer

---

## Acceptance Criteria

1. **AC1** — Given PostgreSQL is running locally, When `dotnet ef database update` is executed, Then `siesa_agents_db` is created with no errors and `Migrations/` folder exists under `SiesaAgents.Infrastructure`.
2. **AC2** — Given an unhandled exception occurs in the backend, When the error reaches the global middleware, Then the response body conforms to Problem Details RFC 7807 (status, title, detail) with no stack trace exposed (NFR6).
3. **AC3** — Given a handled domain exception (NotFoundException, ConflictException) is thrown, When the exception middleware processes it, Then the response returns the appropriate HTTP status code (404, 409) with a Problem Details body — not a 500.
4. **AC4** — Given the backend boots and migrations are applied, When EF Core generates column names, Then `ApplySnakeCaseNaming()` is called in `OnModelCreating` and all column names follow `snake_case`.
5. **AC5** — Given the empty initial migration is created, When it is inspected, Then it contains NO domain table definitions — only `__EFMigrationsHistory` is created internally by EF Core.
6. **AC6** — Given the backend is running, When a GET request is made to `/scalar`, Then the Scalar API documentation page loads successfully — `app.UseSwagger()` is NOT registered anywhere in `Program.cs`.

---

## Failing Tests Created (RED Phase)

### xUnit Unit Tests (10 tests)

#### ExceptionHandlingMiddleware Tests (AC2, AC3)

**File:** `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs`

- RED **Test:** `InvokeAsync_WhenUnhandledException_Returns500StatusCode`
  - **Status:** RED — `ExceptionHandlingMiddleware` constructor signature does not accept `ILogger<ExceptionHandlingMiddleware>` (missing parameter)
  - **Verifies:** AC2 — unhandled exception → HTTP 500

- RED **Test:** `InvokeAsync_WhenUnhandledException_ResponseBodyConformsToProblemDetails`
  - **Status:** RED — middleware lacks ILogger parameter; also does not set `detail` field
  - **Verifies:** AC2 — Problem Details RFC 7807 format

- RED **Test:** `InvokeAsync_WhenUnhandledException_ResponseBodyDoesNotContainStackTrace`
  - **Status:** RED — middleware catches exception but currently logs nothing (no ILogger); detail field is null so message could leak in some scenarios
  - **Verifies:** AC2 — NFR6 no stack trace in response

- RED **Test:** `InvokeAsync_WhenUnhandledException_SetsContentTypeToApplicationProblemJson`
  - **Status:** RED — constructor mismatch (ILogger parameter missing)
  - **Verifies:** AC2 — Content-Type header

- RED **Test:** `InvokeAsync_WhenNotFoundException_Returns404StatusCode`
  - **Status:** RED — `NotFoundException` class does not exist in `SiesaAgents.Domain.Exceptions`; middleware does not map it
  - **Verifies:** AC3 — NotFoundException → 404

- RED **Test:** `InvokeAsync_WhenNotFoundException_ResponseBodyConformsToProblemDetails`
  - **Status:** RED — same missing class + missing catch block
  - **Verifies:** AC3 — Problem Details for 404

- RED **Test:** `InvokeAsync_WhenConflictException_Returns409StatusCode`
  - **Status:** RED — `ConflictException` class does not exist; middleware does not map it
  - **Verifies:** AC3 — ConflictException → 409

- RED **Test:** `InvokeAsync_WhenConflictException_ResponseBodyConformsToProblemDetails`
  - **Status:** RED — same missing class + missing catch block
  - **Verifies:** AC3 — Problem Details for 409

- RED **Test:** `InvokeAsync_WhenNotFoundException_SetsContentTypeToApplicationProblemJson`
  - **Status:** RED — NotFoundException class missing
  - **Verifies:** AC2/AC3 — Content-Type for domain exceptions

- RED **Test:** `InvokeAsync_WhenConflictException_SetsContentTypeToApplicationProblemJson`
  - **Status:** RED — ConflictException class missing
  - **Verifies:** AC2/AC3 — Content-Type for domain exceptions

- GREEN **Test:** `InvokeAsync_WhenNoException_PassesRequestThrough`
  - **Status:** May pass once ILogger parameter added (happy path)
  - **Verifies:** Middleware does not interfere with successful requests

#### Domain Exception Tests (AC3 prerequisites)

**File:** `backend/tests/SiesaAgents.UnitTests/Domain/Exceptions/DomainExceptionsTests.cs`

- RED **Test:** `NotFoundException_InheritsFromException`
  - **Status:** RED — `SiesaAgents.Domain.Exceptions.NotFoundException` class does not exist (compilation error)
  - **Verifies:** AC3 — NotFoundException is a proper exception type

- RED **Test:** `NotFoundException_WhenCreatedWithMessage_ExposesMessageProperty`
  - **Status:** RED — class missing
  - **Verifies:** AC3 — message propagation

- RED **Test:** `NotFoundException_IsInDomainExceptionsNamespace`
  - **Status:** RED — class missing
  - **Verifies:** Clean Architecture — domain exceptions in correct namespace

- RED **Test:** `ConflictException_InheritsFromException`
  - **Status:** RED — `SiesaAgents.Domain.Exceptions.ConflictException` class does not exist
  - **Verifies:** AC3 — ConflictException is a proper exception type

- RED **Test:** `ConflictException_WhenCreatedWithMessage_ExposesMessageProperty`
  - **Status:** RED — class missing
  - **Verifies:** AC3 — message propagation

- RED **Test:** `ConflictException_IsInDomainExceptionsNamespace`
  - **Status:** RED — class missing
  - **Verifies:** Clean Architecture — correct namespace

- RED **Test:** `NotFoundException_IsSealed`
  - **Status:** RED — class missing
  - **Verifies:** Story spec pattern — sealed exceptions

- RED **Test:** `ConflictException_IsSealed`
  - **Status:** RED — class missing
  - **Verifies:** Story spec pattern — sealed exceptions

#### AppDbContext Tests (AC4, AC5)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

- RED **Test:** `AppDbContext_WithNpgsqlProvider_AppliesSnakeCaseNamingToBaseEntityProperties`
  - **Status:** RED — `EFCore.NamingConventions` package not installed; `ApplySnakeCaseNaming()` not called in `OnModelCreating`
  - **Verifies:** AC4 — snake_case naming applied

- RED **Test:** `AppDbContext_WithNpgsqlProvider_EntityTableNamesFollowSnakeCase`
  - **Status:** RED — same missing package/call
  - **Verifies:** AC4 — all table names are lowercase snake_case

- GREEN **Test:** `AppDbContext_DoesNotHaveClienteDbSet`
  - **Status:** Expected GREEN — no DbSet properties defined yet (AC5 scope boundary respected)
  - **Verifies:** AC5 — no domain tables in this story

- GREEN **Test:** `AppDbContext_DoesNotHaveContactoDbSet`
  - **Status:** Expected GREEN — no DbSet properties defined yet
  - **Verifies:** AC5 — scope boundary

- GREEN **Test:** `AppDbContext_InheritsFromDbContext`
  - **Status:** Expected GREEN — AppDbContext already inherits DbContext
  - **Verifies:** AC4 — correct base class

- GREEN **Test:** `AppDbContext_CanBeInstantiatedWithDbContextOptions`
  - **Status:** Expected GREEN — constructor already accepts DbContextOptions<AppDbContext>
  - **Verifies:** AC4 — DI compatibility

### Playwright API Tests (14 tests)

**File:** `e2e/tests/api/database-foundation.api.spec.ts`

#### AC6 — Scalar Documentation

- RED **Test:** `should serve Scalar API documentation at /scalar with HTTP 200`
  - **Status:** Likely GREEN (Scalar already registered) — confirm after backend runs
  - **Verifies:** AC6 — /scalar loads

- RED **Test:** `should return HTML content type from /scalar endpoint`
  - **Status:** Likely GREEN
  - **Verifies:** AC6 — HTML response

- RED **Test:** `should NOT have /swagger endpoint registered`
  - **Status:** Likely GREEN (UseSwagger not in Program.cs currently)
  - **Verifies:** AC6 — Swashbuckle forbidden

- RED **Test:** `should NOT have /swagger/v1/swagger.json endpoint`
  - **Status:** Likely GREEN
  - **Verifies:** AC6 — no Swagger spec

#### AC2 — Problem Details for Unhandled Errors

- RED **Test:** `should return application/problem+json Content-Type for error responses`
  - **Status:** RED — ExceptionHandlingMiddleware exists but only catches generic Exception; 404 path returns default ASP.NET response (not problem+json)
  - **Verifies:** AC2 — Content-Type header

- RED **Test:** `should return Problem Details body with status field for error responses`
  - **Status:** RED — 404 for non-existent routes goes through default ASP.NET handler, not the middleware
  - **Verifies:** AC2 — RFC 7807 status field

- RED **Test:** `should return Problem Details body with title field for error responses`
  - **Status:** RED — same routing issue
  - **Verifies:** AC2 — RFC 7807 title field

- RED **Test:** `should NOT expose stack trace in 500 error response body (NFR6)`
  - **Status:** RED — requires `/api/v1/clientes` endpoint to exist (Story 2.x)
  - **Verifies:** AC2 — NFR6 no stack trace

#### AC3 — Domain Exception HTTP Status Mapping

- RED **Test:** `should return 404 for NotFoundException (not 500 Internal Server Error)`
  - **Status:** RED — `/api/v1/clientes/{id}` endpoint not implemented yet; NotFoundException not created
  - **Verifies:** AC3 — NotFoundException → 404

- RED **Test:** `should return application/problem+json for 404 NotFoundException response`
  - **Status:** RED — same missing endpoint
  - **Verifies:** AC3 — Content-Type for 404

- RED **Test:** `should return 409 for ConflictException when creating duplicate resource`
  - **Status:** RED — ConflictException not created; `/api/v1/clientes` POST not implemented
  - **Verifies:** AC3 — ConflictException → 409

- RED **Test:** `should return Problem Details body with correct status for NotFoundException`
  - **Status:** RED — endpoint missing
  - **Verifies:** AC3 — RFC 7807 body for 404

- RED **Test:** `should NOT return 500 for NotFoundException`
  - **Status:** RED — endpoint missing; without middleware would be 500
  - **Verifies:** AC3 — domain exceptions must not leak as 500

---

## Fixtures Created

No Playwright fixtures needed for this story — all tests use `{ request }` directly.
The base fixture at `e2e/fixtures/base.fixture.ts` is available but not required for API-level tests.

---

## Mock Requirements

**Backend API Server** — Must be running at `http://localhost:5000` for Playwright API tests.
No external service mocks required for this story. All tests verify actual HTTP behavior.

---

## Required data-testid Attributes

None required for Story 1.3 — this is a backend-only story with no new frontend components.

---

## Implementation Checklist

### To make `DomainExceptionsTests.cs` pass (AC3 prerequisite)

**File to create:** `backend/src/SiesaAgents.Domain/Exceptions/NotFoundException.cs`

- [ ] Create `SiesaAgents.Domain/Exceptions/` directory
- [ ] Create `NotFoundException.cs`: `public sealed class NotFoundException(string message) : Exception(message);`
- [ ] Create `ConflictException.cs`: `public sealed class ConflictException(string message) : Exception(message);`
- [ ] Verify namespace is `SiesaAgents.Domain.Exceptions`
- [ ] Run tests: `dotnet test backend/tests/SiesaAgents.UnitTests --filter "DomainExceptions"`
- [ ] All 8 domain exception tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### To make `ExceptionHandlingMiddlewareTests.cs` pass (AC2, AC3)

**File to modify:** `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`

- [ ] Add `ILogger<ExceptionHandlingMiddleware>` parameter to the primary constructor
- [ ] Add catch block for `NotFoundException` → 404 + Problem Details
- [ ] Add catch block for `ConflictException` → 409 + Problem Details
- [ ] Ensure generic `Exception` catch → 500 with generic message (no raw exception detail)
- [ ] Set `Content-Type: application/problem+json` for ALL error responses
- [ ] Ensure `logger.LogError(ex, ...)` is called for unhandled exceptions (NFR6 logging)
- [ ] Run tests: `dotnet test backend/tests/SiesaAgents.UnitTests --filter "ExceptionHandlingMiddleware"`
- [ ] All 10 middleware tests pass (green phase)

**Estimated Effort:** 1 hour

---

### To make `AppDbContextTests.cs` pass (AC4)

**File to modify:** `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`

- [ ] Add `EFCore.NamingConventions` NuGet package to `SiesaAgents.Infrastructure`: `dotnet add package EFCore.NamingConventions`
- [ ] Update `UseNpgsql(...)` in Program.cs to chain `.UseSnakeCaseNamingConvention()` on the options builder
- [ ] OR call `modelBuilder.ApplySnakeCaseNaming()` as the LAST statement in `OnModelCreating`
- [ ] Ensure `base.OnModelCreating(modelBuilder)` is called BEFORE `ApplySnakeCaseNaming()`
- [ ] Run tests: `dotnet test backend/tests/SiesaAgents.UnitTests --filter "AppDbContext"`
- [ ] All 6 AppDbContext tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### To make AC1/AC5 verifiable (database migration)

- [ ] Ensure `EFCore.NamingConventions` is installed in `SiesaAgents.Infrastructure`
- [ ] Register `AppDbContext` in `Program.cs`: `builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(...).UseSnakeCaseNamingConvention())`
- [ ] Add connection string `DefaultConnection` to `appsettings.Development.json`
- [ ] Run: `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
- [ ] Verify `Migrations/` folder created under `SiesaAgents.Infrastructure`
- [ ] Verify the generated `Up()` method is empty (no `CreateTable` calls)
- [ ] Run: `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
- [ ] Verify `siesa_agents_db` is created with no errors
- [ ] Commit migration files to source control

**Estimated Effort:** 1 hour

---

### To make Playwright API tests pass (AC2, AC3, AC6)

- [ ] Ensure backend starts on port 5000 (`dotnet run`)
- [ ] AC6 tests: Verify `/scalar` returns 200 + HTML (likely already green)
- [ ] AC6 tests: Verify `/swagger` returns 404 (Swashbuckle not registered)
- [ ] AC2 tests: ExceptionHandlingMiddleware must return `application/problem+json` for ALL error paths including routing 404
- [ ] AC3 tests: `/api/v1/clientes/{id}` endpoint must be implemented to trigger NotFoundException (Story 2.x dependency — these tests may stay RED until Epic 2)
- [ ] AC3 tests: `/api/v1/clientes` POST must be implemented to trigger ConflictException

**Estimated Effort:** 2 hours (dependent on Epic 2 for full AC3 coverage)

---

## Running Tests

```bash
# Run all backend unit tests
dotnet test /home/user/lab-sa-quick-dev/backend/tests/SiesaAgents.UnitTests

# Run only Story 1.3 relevant unit tests
dotnet test /home/user/lab-sa-quick-dev/backend/tests/SiesaAgents.UnitTests --filter "ExceptionHandlingMiddleware|AppDbContext|DomainException"

# Run domain exception tests specifically
dotnet test /home/user/lab-sa-quick-dev/backend/tests/SiesaAgents.UnitTests --filter "DomainExceptions"

# Run Playwright API tests for Story 1.3
npx playwright test e2e/tests/api/database-foundation.api.spec.ts

# Run all API tests
npx playwright test e2e/tests/api/

# Run in headed mode (debug)
npx playwright test e2e/tests/api/database-foundation.api.spec.ts --headed

# Run with specific project
npx playwright test e2e/tests/api/database-foundation.api.spec.ts --project=chromium
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing (compilation errors / assertion failures)
- No fixtures needed (API tests use request context directly)
- Mock requirements documented (none — tests target real backend)
- Implementation checklist created with clear tasks

**Verification:**

- `ExceptionHandlingMiddlewareTests.cs`: Fails at build time — `NotFoundException`, `ConflictException` types not found; ILogger constructor mismatch
- `DomainExceptionsTests.cs`: Fails at build time — `SiesaAgents.Domain.Exceptions.NotFoundException` and `ConflictException` do not exist
- `AppDbContextTests.cs`: Partial RED — snake_case tests fail (EFCore.NamingConventions not installed); scope tests likely GREEN
- Playwright tests: RED for AC2/AC3 (endpoints not implemented); AC6 tests may be GREEN

---

### GREEN Phase (DEV Team - Next Steps)

1. Create `NotFoundException.cs` and `ConflictException.cs` in `SiesaAgents.Domain/Exceptions/`
2. Update `ExceptionHandlingMiddleware.cs` to add ILogger parameter and domain exception catch blocks
3. Install `EFCore.NamingConventions` package and call `ApplySnakeCaseNaming()` in `OnModelCreating`
4. Register `AppDbContext` in `Program.cs` and add connection string to `appsettings.Development.json`
5. Run EF Core migrations to create `siesa_agents_db`
6. Verify Playwright AC6 tests pass (Scalar docs)
7. AC3 Playwright tests will complete GREEN when Epic 2 `/api/v1/clientes` endpoint is implemented

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

- Review `OnModelCreating` ordering (base → configurations → snake_case)
- Ensure middleware ILogger is used correctly (structured logging, not string formatting)
- Verify appsettings.Development.json is in `.gitignore` or uses environment variable substitution for credentials

---

## Next Steps

1. Share this checklist with the dev workflow
2. Run failing tests to confirm RED phase: `dotnet test backend/tests/SiesaAgents.UnitTests`
3. Begin with domain exceptions (highest priority — unblocks middleware tests)
4. Work one test group at a time: Domain → Middleware → AppDbContext → Migrations
5. When all backend unit tests pass, verify Playwright API tests
6. AC3 Playwright tests for `/api/v1/clientes` will complete in Epic 2

---

## Knowledge Base References Applied

- **test-quality.md** — Given-When-Then structure, one assertion per test, deterministic tests
- **network-first.md** — API tests use direct `request` context (no navigation needed for backend-only story)
- **test-levels-framework.md** — Unit tests for middleware/domain logic; API tests for HTTP contract behavior
- **fixture-architecture.md** — No fixtures needed; `{ request }` Playwright fixture sufficient for API tests

---

## Test Execution Evidence

### Expected Build Failures (RED Phase Verification)

**Command:** `dotnet test backend/tests/SiesaAgents.UnitTests`

**Expected compilation errors:**
```
error CS0246: The type or namespace name 'NotFoundException' could not be found
              (are you missing a using directive or assembly reference?)
              → SiesaAgents.Domain.Exceptions.NotFoundException not created yet

error CS0246: The type or namespace name 'ConflictException' could not be found
              → SiesaAgents.Domain.Exceptions.ConflictException not created yet

error CS1503: Argument 2: cannot convert from 'Microsoft.Extensions.Logging.Abstractions.NullLogger<...>'
              to 'expected parameter type'
              → ExceptionHandlingMiddleware constructor missing ILogger parameter
```

**Summary:**

- Total xUnit tests: 24
- RED (compilation errors): 18
- Expected GREEN (scope boundary, happy path): 6
- Status: RED phase confirmed

---

## Notes

- AC1 and AC5 are verified by combining `dotnet ef migrations add` + manual inspection of the generated migration file. These are not easily automated in unit tests without a live DB. The `AppDbContextTests.cs` tests verify the EF Core model configuration as a proxy.
- AC3 Playwright tests at the HTTP level require the `/api/v1/clientes` endpoint which belongs to Epic 2 (Story 2.x). Those tests will remain RED until Epic 2. This is intentional ATDD behavior — they define the expected contract early.
- The `EFCore.NamingConventions` package must be version-compatible with `Npgsql.EntityFrameworkCore.PostgreSQL` v9.x and EF Core 10.

---

**Generated by BMad TEA Agent** - 2026-06-22

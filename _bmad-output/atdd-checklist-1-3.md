# ATDD Checklist - Epic 1, Story 1.3: Backend Database Foundation

**Date:** 2026-06-13
**Author:** SiesaTeam
**Primary Test Level:** API (backend-only story — no frontend UI to drive)

---

## Story Summary

Story 1.3 establishes the PostgreSQL + EF Core data layer for the Siesa Agents backend. It creates the AppDbContext, registers it in Program.cs with the Npgsql provider, produces an empty InitialCreate migration, implements ExceptionHandlingMiddleware (RFC 7807 Problem Details), and verifies the Scalar API documentation endpoint.

**As a** developer
**I want** the PostgreSQL database connected and the EF Core infrastructure configured
**So that** subsequent stories can define entities and run migrations against a working data layer

---

## Acceptance Criteria

1. **AC1** — `dotnet ef database update` creates `siesa_agents_db` with `__EFMigrationsHistory` table, no errors.
2. **AC2** — `InitialCreate` migration file exists under `src/SiesaAgents.Infrastructure/Data/Migrations/` with no domain tables defined.
3. **AC3** — `AppDbContext.OnModelCreating` calls `modelBuilder.ApplySnakeCaseNaming()` as the last line.
4. **AC4** — Backend starts on port 5000 with a valid connection string; EF Core uses `Npgsql.EntityFrameworkCore.PostgreSQL`.
5. **AC5** — `ExceptionHandlingMiddleware` returns Problem Details RFC 7807 (`status`, `title`, `detail`) with no stack traces; HTTP status reflects exception type (400/404/500).
6. **AC6** — `GET /scalar` returns HTTP 200; `app.MapScalarApiReference()` is registered, never `app.UseSwagger()`.
7. **AC7** — Bad/unreachable connection string does NOT crash startup; error surfaces only on first DB operation.

---

## Failing Tests Created (RED Phase)

### API / HTTP Tests (10 tests)

**File:** `e2e/tests/foundation/backend-database-foundation.api.spec.ts` (188 lines)

These tests target the running .NET backend directly via HTTP using Playwright's `request` context.

- **Test:** `should have the backend running on port 5000 when connection string is valid`
  - **Status:** RED — Backend AppDbContext registration missing; `Program.cs` not yet updated
  - **Verifies:** AC4 — App starts without EF Core DI errors

- **Test:** `should respond to the Scalar endpoint confirming the app started on port 5000`
  - **Status:** RED — `AddDbContext<AppDbContext>()` not registered; startup may fail with DI exception
  - **Verifies:** AC4 — Npgsql provider registered correctly

- **Test:** `should NOT expose Swagger — only Scalar is permitted`
  - **Status:** RED — `AppDbContext` DI registration missing; app may not start
  - **Verifies:** AC6 — `app.UseSwagger()` absent, only `MapScalarApiReference()` present

- **Test:** `should return application/problem+json content-type for unhandled 404 paths`
  - **Status:** RED — `ExceptionHandlingMiddleware` not yet implemented
  - **Verifies:** AC5 — Middleware produces `application/problem+json` content-type

- **Test:** `should return RFC 7807 Problem Details body with status field for unhandled routes`
  - **Status:** RED — `ExceptionHandlingMiddleware` not yet implemented
  - **Verifies:** AC5 — Body has `{ status, title, detail }` fields (RFC 7807)

- **Test:** `should NOT expose stack traces in error responses from the API`
  - **Status:** RED — `ExceptionHandlingMiddleware` not yet implemented; default .NET exception handling may expose traces
  - **Verifies:** AC5 / NFR6 — No `StackTrace` or `at System.` in response body

- **Test:** `should return HTTP 404 status for not-found routes via middleware`
  - **Status:** RED — Middleware not implemented; default ASP.NET returns different status
  - **Verifies:** AC5 — HTTP 404 for not-found paths

- **Test:** `should return HTTP 200 when accessing GET /scalar`
  - **Status:** RED — AppDbContext DI not registered; app may fail to start
  - **Verifies:** AC6 — `GET /scalar` returns 200

- **Test:** `should return HTML content from the Scalar endpoint`
  - **Status:** RED — AppDbContext DI not registered
  - **Verifies:** AC6 — `Content-Type: text/html` from Scalar endpoint

- **Test:** `should have backend running and serving Scalar even if DB is unreachable`
  - **Status:** RED — EF Core lazy connection not configured (AppDbContext not registered)
  - **Verifies:** AC7 — App starts with bad connection string (lazy connection)

- **Test:** `should respond to non-database endpoints even when DB connectivity is degraded`
  - **Status:** RED — AppDbContext DI missing; startup crash possible
  - **Verifies:** AC7 — Non-DB endpoint responds when DB is unreachable

- **Test:** `should return a valid response from a DB-connected endpoint after migrations applied`
  - **Status:** RED — AppDbContext + migration not yet applied
  - **Verifies:** AC1 — EF Core DI configuration is valid after migration

### Unit Tests (10 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs` (237 lines)

These tests directly invoke `ExceptionHandlingMiddleware` in a minimal ASP.NET Core HttpContext pipeline (no TestServer needed).

- **Test:** `ArgumentException_Returns_400_BadRequest`
  - **Status:** RED — `SiesaAgents.API.Middleware.ExceptionHandlingMiddleware` class does not exist yet
  - **Verifies:** AC5 — ArgumentException maps to HTTP 400

- **Test:** `ArgumentException_Returns_ProblemJson_ContentType`
  - **Status:** RED — Middleware class missing
  - **Verifies:** AC5 — Content-Type is `application/problem+json`

- **Test:** `ArgumentException_Returns_Rfc7807_ProblemDetails_Body`
  - **Status:** RED — Middleware class missing
  - **Verifies:** AC5 — RFC 7807 body has `status` and `title` fields

- **Test:** `KeyNotFoundException_Returns_404_NotFound`
  - **Status:** RED — Middleware class missing
  - **Verifies:** AC5 — KeyNotFoundException maps to HTTP 404

- **Test:** `KeyNotFoundException_Returns_ProblemDetails_With_Status_404`
  - **Status:** RED — Middleware class missing
  - **Verifies:** AC5 — Problem Details `status` field equals 404

- **Test:** `InvalidOperationException_Returns_400_BadRequest`
  - **Status:** RED — Middleware class missing
  - **Verifies:** AC5 — InvalidOperationException maps to HTTP 400

- **Test:** `GenericException_Returns_500_InternalServerError`
  - **Status:** RED — Middleware class missing
  - **Verifies:** AC5 — Generic exceptions map to HTTP 500

- **Test:** `GenericException_Returns_ProblemDetails_With_Status_500`
  - **Status:** RED — Middleware class missing
  - **Verifies:** AC5 — Problem Details `status` field equals 500

- **Test:** `ExceptionResponse_DoesNot_Contain_StackTrace`
  - **Status:** RED — Middleware class missing
  - **Verifies:** AC5 / NFR6 — No `StackTrace` or `at System.` in response body

- **Test:** `KeyNotFoundException_DoesNot_Expose_StackTrace`
  - **Status:** RED — Middleware class missing
  - **Verifies:** AC5 / NFR6 — 404 responses do not expose stack trace

- **Test:** `NoException_PassesThrough_Without_Modification`
  - **Status:** RED — Middleware class missing
  - **Verifies:** AC5 — Happy path: no exception → response not modified (status 200)

- **Test:** `ArgumentException_Detail_Contains_ExceptionMessage_NotStackTrace`
  - **Status:** RED — Middleware class missing
  - **Verifies:** AC5 / NFR6 — `detail` field has exception message but no stack frames

---

## Data Factories Created

Not applicable for this story. Story 1.3 is backend infrastructure only — no domain entities or UI data flows.

---

## Fixtures Created

Not applicable for this story. Direct API request context (`{ request }`) used in E2E API tests. No auth fixtures or complex setup required.

---

## Mock Requirements

### EF Core / PostgreSQL

**Note:** These tests do NOT mock the database. The API tests verify live backend behavior.

- For AC1: PostgreSQL must be running locally with `dotnet ef database update` executed.
- For AC7: Tests assume app is running; lazy connection verified by observing non-DB endpoints respond normally.

No external service mocks are required for this story.

---

## Required data-testid Attributes

**Not applicable.** Story 1.3 is backend-only with no frontend UI changes. No `data-testid` attributes are required.

---

## Implementation Checklist

### Test Group 1: AppDbContext Registration (AC4)

**Files involved:**
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` ← CREATE
- `backend/src/SiesaAgents.API/Program.cs` ← MODIFY

**Tasks:**

- [ ] Create `AppDbContext.cs` in `src/SiesaAgents.Infrastructure/Data/`
- [ ] Inherit from `DbContext`, inject `DbContextOptions<AppDbContext>` via constructor
- [ ] Override `OnModelCreating` — call `modelBuilder.ApplySnakeCaseNaming()` as the LAST line (AC3)
- [ ] Add `Npgsql.EntityFrameworkCore.PostgreSQL` package to `SiesaAgents.Infrastructure.csproj`
- [ ] Register `AppDbContext` in `Program.cs` using `builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(...))`
- [ ] Add `Microsoft.EntityFrameworkCore.Design` to `SiesaAgents.API.csproj`
- [ ] Run test: `npx playwright test backend-database-foundation.api.spec.ts --grep "AC4"`
- [ ] Run test: `npx playwright test backend-database-foundation.api.spec.ts --grep "AC7"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test Group 2: Connection String Configuration (AC4, AC7)

**Files involved:**
- `backend/src/SiesaAgents.API/appsettings.json` ← MODIFY
- `backend/src/SiesaAgents.API/appsettings.Development.json` ← MODIFY

**Tasks:**

- [ ] Add `ConnectionStrings.DefaultConnection` placeholder to `appsettings.json`
- [ ] Add real local connection string to `appsettings.Development.json`
- [ ] Add `appsettings.Development.json` to `.gitignore` if it contains real credentials
- [ ] Run test: `npx playwright test backend-database-foundation.api.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test Group 3: EF Core Migration (AC1, AC2)

**Files involved:**
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/` ← Auto-generated

**Tasks:**

- [ ] Run from `backend/`: `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
- [ ] Verify generated migration contains NO domain tables (`ClienteEntity`, `ContactoEntity`, etc.)
- [ ] Run: `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
- [ ] Confirm `siesa_agents_db` exists in PostgreSQL with `__EFMigrationsHistory` table
- [ ] Run test: `npx playwright test backend-database-foundation.api.spec.ts --grep "AC1"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test Group 4: ExceptionHandlingMiddleware (AC5 / NFR6)

**Files involved:**
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` ← CREATE
- `backend/src/SiesaAgents.API/Program.cs` ← MODIFY (register middleware first)

**Tasks:**

- [ ] Create `ExceptionHandlingMiddleware.cs` in `src/SiesaAgents.API/Middleware/`
- [ ] Implement `InvokeAsync(HttpContext context)` with try/catch
- [ ] Map `KeyNotFoundException` → 404, `ArgumentException`/`InvalidOperationException` → 400, generic `Exception` → 500
- [ ] Return `application/problem+json` with RFC 7807 fields: `type`, `title`, `status`, `detail`
- [ ] NEVER include `StackTrace` or internal exception frames in response body (NFR6)
- [ ] Register middleware FIRST in `Program.cs`: `app.UseMiddleware<ExceptionHandlingMiddleware>()`
- [ ] Run unit tests: `dotnet test backend/tests/SiesaAgents.UnitTests/`
- [ ] Run API tests: `npx playwright test backend-database-foundation.api.spec.ts --grep "AC5"`
- [ ] ✅ All tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test Group 5: Scalar Registration Verification (AC6)

**Files involved:**
- `backend/src/SiesaAgents.API/Program.cs` ← VERIFY (was set up in Story 1.1)

**Tasks:**

- [ ] Confirm `app.MapScalarApiReference()` is present in `Program.cs`
- [ ] Confirm `app.UseSwagger()` and `app.UseSwaggerUI()` are NOT present
- [ ] Run: `dotnet run` in `backend/src/SiesaAgents.API/`
- [ ] Verify `GET http://localhost:5000/scalar` returns HTTP 200 with HTML content
- [ ] Run test: `npx playwright test backend-database-foundation.api.spec.ts --grep "AC6"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test Group 6: Unit Tests Compilation (pre-condition for RED phase)

**Files involved:**
- `backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj` ← MODIFIED (added API project ref)
- `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs` ← CREATED

**Pre-condition note:** Unit tests CANNOT compile until `ExceptionHandlingMiddleware` class is created in `SiesaAgents.API.Middleware` namespace. Until then, the test project will fail with `CS0246: The type or namespace name 'ExceptionHandlingMiddleware' could not be found`. This is the expected RED state — the build failure IS the failing test indicator.

- [ ] Create `ExceptionHandlingMiddleware.cs` (Task Group 4)
- [ ] Run: `dotnet build backend/tests/SiesaAgents.UnitTests/`
- [ ] Confirm tests now compile but FAIL with assertion errors (correct RED state)
- [ ] Implement middleware (Task Group 4)
- [ ] Run: `dotnet test backend/tests/SiesaAgents.UnitTests/`
- [ ] ✅ All 12 unit tests pass (green phase)

**Estimated Effort:** included in Task Group 4

---

## Running Tests

```bash
# Run all API-level failing tests (Story 1.3)
npx playwright test e2e/tests/foundation/backend-database-foundation.api.spec.ts

# Run in headed mode (no browser, API tests use request context)
npx playwright test e2e/tests/foundation/backend-database-foundation.api.spec.ts --reporter=list

# Run specific AC group
npx playwright test e2e/tests/foundation/backend-database-foundation.api.spec.ts --grep "AC4"
npx playwright test e2e/tests/foundation/backend-database-foundation.api.spec.ts --grep "AC5"
npx playwright test e2e/tests/foundation/backend-database-foundation.api.spec.ts --grep "AC6"
npx playwright test e2e/tests/foundation/backend-database-foundation.api.spec.ts --grep "AC7"

# Run unit tests (xUnit)
dotnet test backend/tests/SiesaAgents.UnitTests/ --logger "console;verbosity=normal"

# Run unit tests for middleware only
dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "FullyQualifiedName~ExceptionHandlingMiddlewareTests"

# Full backend build
dotnet build backend/
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All API-level tests written and failing (missing implementation)
- ✅ All unit tests written and failing (middleware class does not exist)
- ✅ No fixtures required (direct API + unit-level tests)
- ✅ No data-testid attributes required (backend-only story)
- ✅ Implementation checklist created with 5 task groups
- ✅ `.csproj` updated to reference `SiesaAgents.API` from unit test project

**Verification:**

- API tests fail because backend missing: `AppDbContext`, `ExceptionHandlingMiddleware`, DB not initialized
- Unit tests fail at compile time: `ExceptionHandlingMiddleware` class does not exist
- Failures are due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Pick Task Group 1 (AppDbContext) — creates the DI foundation
2. Pick Task Group 2 (Connection Strings) — enables app to start with DB config
3. Pick Task Group 3 (Migration) — creates and applies InitialCreate migration
4. Pick Task Group 4 (ExceptionHandlingMiddleware) — makes unit tests + AC5 API tests pass
5. Pick Task Group 5 (Scalar verification) — confirms AC6
6. Run all tests, confirm GREEN

**Key Principles:**

- One task group at a time
- Run tests after each group
- Scope boundary: DO NOT create `ClienteEntity`, `ContactoEntity`, or domain `DbSet<>` properties

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all tests pass (green phase complete)
2. Review `ExceptionHandlingMiddleware` for edge cases
3. Ensure `OnModelCreating` calling order is correct (`ApplySnakeCaseNaming()` last)
4. Verify `.gitignore` excludes `appsettings.Development.json`
5. Run tests after each change

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase: `npx playwright test e2e/tests/foundation/backend-database-foundation.api.spec.ts`
3. Run unit test build to confirm RED: `dotnet build backend/tests/SiesaAgents.UnitTests/`
4. Begin implementation starting with Task Group 1 (AppDbContext)
5. Work one task group at a time (red → green for each group)
6. When all tests pass, refactor for quality

---

## Knowledge Base References Applied

- **fixture-architecture.md** — No fixtures needed; direct `request` context used for API tests
- **data-factories.md** — No domain entities in this story; not applicable
- **network-first.md** — Not applicable (no page navigation; API tests use `request` context directly)
- **test-quality.md** — Given-When-Then format, one assertion per test, explicit waits (none needed for API tests)
- **test-levels-framework.md** — Backend-only story → API tests as primary level + unit tests for middleware

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test e2e/tests/foundation/backend-database-foundation.api.spec.ts`

**Expected failures (pre-implementation):**

- `Error: connect ECONNREFUSED 127.0.0.1:5000` — Backend not running / crashed at startup due to missing AppDbContext registration
- OR `Error: expect(received).toBe(expected)` — Backend running from Story 1.1 but endpoints misbehave without middleware

**Command:** `dotnet build backend/tests/SiesaAgents.UnitTests/`

**Expected failure (pre-implementation):**

```
error CS0246: The type or namespace name 'ExceptionHandlingMiddleware' could not be found
(are you missing a using directive or an assembly reference?)
```

**Summary:**

- API tests: 12 tests — 0 passing, 12 failing (expected RED)
- Unit tests: 12 tests — Cannot compile until middleware class created (expected RED)
- Status: RED phase verified

---

## Notes

- **AC2 and AC3** are verified by code inspection, not automated tests. The developer must manually confirm:
  - Migration file exists at `src/SiesaAgents.Infrastructure/Data/Migrations/` with no domain tables
  - `OnModelCreating` calls `modelBuilder.ApplySnakeCaseNaming()` as the last line
- **Scope boundary (CRITICAL):** Do NOT define `ClienteEntity`, `ContactoEntity`, or any domain `DbSet<>` in `AppDbContext`. Those belong to Epic 2/3.
- The unit test `.csproj` has been updated to reference `SiesaAgents.API` project — needed to resolve `ExceptionHandlingMiddleware` namespace.
- `Microsoft.Extensions.Logging.Abstractions` added to unit test project for `NullLogger<T>`.

---

**Generated by BMad TEA Agent** - 2026-06-13

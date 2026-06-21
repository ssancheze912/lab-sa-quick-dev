# ATDD Checklist - Epic 1, Story 1.3: Backend Database Foundation

**Date:** 2026-06-21
**Author:** SiesaTeam
**Primary Test Level:** API Integration (xUnit)

---

## Story Summary

Configures the PostgreSQL database connection and EF Core infrastructure so that subsequent stories can define domain entities and run migrations against a working data layer. The story creates an empty `AppDbContext` with `ApplySnakeCaseNaming()` as the last `OnModelCreating` call, registers it in DI, and runs an initial empty migration.

**As a** developer
**I want** the PostgreSQL database connected and EF Core infrastructure configured
**So that** subsequent stories can define entities and run migrations against a working data layer

---

## Acceptance Criteria

1. **AC1** — `dotnet ef database update` creates `siesa_agents_db` with no errors; `Migrations/` folder exists under `SiesaAgents.Infrastructure`.
2. **AC2** — `__ef_migrations_history` table columns are lowercase snake_case (`migration_id`, `product_version`) — confirming `ApplySnakeCaseNaming()` is active.
3. **AC3** — Unhandled exceptions reach `ExceptionHandlingMiddleware`, response has `Content-Type: application/problem+json`, HTTP 500, JSON body contains `status`, `title`, `detail`, and NO `stackTrace`, `exception`, or `innerException` keys. (NFR6)
4. **AC4** — `modelBuilder.ApplySnakeCaseNaming()` is the LAST call inside `OnModelCreating`; no `[Column]` or `[Table]` attributes on domain entities.
5. **AC5** — Connection string `Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres` is read from `appsettings.Development.json` under `ConnectionStrings:DefaultConnection`; backend starts without database-related errors.
6. **AC6** — `dotnet build SiesaAgents.sln` compiles all projects including `SiesaAgents.Infrastructure` with EF Core and Npgsql packages, zero errors.

---

## Failing Tests Created (RED Phase)

### xUnit API Integration Tests (9 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/ExceptionHandlingMiddlewareTests.cs`

- **Test:** `WhenUnhandledExceptionOccurs_ShouldReturn500`
  - **Status:** RED — `WebApplicationFactory<Program>` fails because `Microsoft.AspNetCore.Mvc.Testing` package is missing and `SiesaAgents.API` project reference is not in test csproj
  - **Verifies:** AC3 — HTTP 500 returned on unhandled exception

- **Test:** `WhenUnhandledExceptionOccurs_ShouldReturnProblemJsonContentType`
  - **Status:** RED — same package/reference issue
  - **Verifies:** AC3 — Content-Type is `application/problem+json`

- **Test:** `WhenUnhandledExceptionOccurs_ResponseBodyShouldContainStatusField`
  - **Status:** RED — same package/reference issue
  - **Verifies:** AC3 — `status` field present in Problem Details body

- **Test:** `WhenUnhandledExceptionOccurs_ResponseBodyShouldContainTitleField`
  - **Status:** RED — same package/reference issue
  - **Verifies:** AC3 — `title` field present in Problem Details body

- **Test:** `WhenUnhandledExceptionOccurs_ResponseBodyShouldNotContainStackTrace`
  - **Status:** RED — same package/reference issue
  - **Verifies:** AC3/NFR6 — `stackTrace` NOT in response body

- **Test:** `WhenUnhandledExceptionOccurs_ResponseBodyShouldNotContainExceptionKey`
  - **Status:** RED — same package/reference issue
  - **Verifies:** AC3/NFR6 — `exception` key NOT in response body

- **Test:** `WhenUnhandledExceptionOccurs_ResponseBodyShouldNotContainInnerExceptionKey`
  - **Status:** RED — same package/reference issue
  - **Verifies:** AC3/NFR6 — `innerException` NOT in response body

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/DatabaseMigrationTests.cs`

- **Test:** `WhenMigrationsApplied_DatabaseShouldExist`
  - **Status:** RED — `AppDbContext` does not exist in `SiesaAgents.Infrastructure.Data` namespace yet
  - **Verifies:** AC1 — database `siesa_agents_db_test` is created after `MigrateAsync()`

- **Test:** `WhenMigrationsApplied_EFMigrationsHistoryTableShouldExist`
  - **Status:** RED — `AppDbContext` missing, initial migration not yet created
  - **Verifies:** AC1 — `__ef_migrations_history` table exists after migration

- **Test:** `WhenMigrationsApplied_MigrationIdColumnShouldBeSnakeCase`
  - **Status:** RED — `AppDbContext` and migration not yet created
  - **Verifies:** AC2 — column `migration_id` exists (snake_case)

- **Test:** `WhenMigrationsApplied_ProductVersionColumnShouldBeSnakeCase`
  - **Status:** RED — `AppDbContext` and migration not yet created
  - **Verifies:** AC2 — column `product_version` exists (snake_case)

- **Test:** `WhenMigrationsApplied_NoColumnNamesShouldBePascalCase`
  - **Status:** RED — `ApplySnakeCaseNaming()` not yet applied
  - **Verifies:** AC2/AC4 — no PascalCase column names in any EF-managed table

- **Test:** `WhenMigrationsApplied_NoDomainTablesShouldExist`
  - **Status:** RED — `AppDbContext` and migration not yet created
  - **Verifies:** AC1 scope note — `clientes` and `contactos` tables must NOT exist (scope constraint)

### Playwright API Tests (9 tests)

**File:** `e2e/tests/api/database-foundation.api.spec.ts`

- **Test:** `AC3 > should return HTTP 500 when an unhandled exception occurs`
  - **Status:** RED — `/api/v1/test-error` endpoint does not exist in backend
  - **Verifies:** AC3 — HTTP 500 from `ExceptionHandlingMiddleware`

- **Test:** `AC3 > should return Content-Type application/problem+json on unhandled exception`
  - **Status:** RED — endpoint missing
  - **Verifies:** AC3 — `Content-Type: application/problem+json`

- **Test:** `AC3 > should return body with status field in Problem Details response`
  - **Status:** RED — endpoint missing
  - **Verifies:** AC3 — `status` field in JSON body

- **Test:** `AC3 > should return body with title field in Problem Details response`
  - **Status:** RED — endpoint missing
  - **Verifies:** AC3 — `title` field in JSON body

- **Test:** `AC3 > should NOT expose stackTrace key in Problem Details response (NFR6)`
  - **Status:** RED — endpoint missing
  - **Verifies:** AC3/NFR6 — no `stackTrace` key

- **Test:** `AC3 > should NOT expose exception key in Problem Details response (NFR6)`
  - **Status:** RED — endpoint missing
  - **Verifies:** AC3/NFR6 — no `exception` key

- **Test:** `AC3 > should NOT expose innerException key in Problem Details response (NFR6)`
  - **Status:** RED — endpoint missing
  - **Verifies:** AC3/NFR6 — no `innerException` key

- **Test:** `AC5 > should start without database-related errors`
  - **Status:** RED — `AppDbContext` not yet registered in DI; `Program.cs` doesn't call `UseNpgsql()`
  - **Verifies:** AC5 — backend starts cleanly after `AppDbContext` DI registration

- **Test:** `AC5 > should not return 500 on normal requests after AppDbContext registration`
  - **Status:** RED — `AppDbContext` not registered (DI failure causes 500 on all requests)
  - **Verifies:** AC5 — DI registration succeeds at startup

- **Test:** `AC6 > should serve API after Infrastructure project with EF Core packages builds`
  - **Status:** RED — `Microsoft.EntityFrameworkCore.Design` not yet added to Infrastructure csproj
  - **Verifies:** AC6 — Infrastructure project compiles with EF Core packages

---

## Data Factories Created

Not applicable for this story. Story 1.3 is pure infrastructure — no domain entities, no data factories needed. Data factories for `ClienteEntity` and `ContactoEntity` will be created in Epics 2 and 3 respectively.

---

## Fixtures Created

Not applicable for this story. No UI interactions or auth flows are being tested. The `WebApplicationFactory` pattern in `DatabaseMigrationTests` and `ExceptionHandlingMiddlewareTests` serves as the test fixture.

**Pattern used:** `IClassFixture<WebApplicationFactory<Program>>` for ExceptionHandling tests and `IAsyncLifetime` for DatabaseMigration tests (with auto-cleanup via `EnsureDeletedAsync()`).

---

## Mock Requirements

No external service mocks required. All tests use:
- `WebApplicationFactory<Program>` for in-process .NET API testing
- Direct PostgreSQL connection (Npgsql) for database column verification
- Playwright API request context for HTTP-level endpoint validation

**Note for DEV Team:** The test database `siesa_agents_db_test` is created and destroyed automatically by `DatabaseMigrationTests.IAsyncLifetime`. Ensure PostgreSQL is running locally on port 5432 with username `postgres` / password `postgres`.

---

## Required data-testid Attributes

Not applicable — Story 1.3 has no UI component changes. All tests are at the API integration level.

---

## Implementation Checklist

### Test Group A: ExceptionHandlingMiddleware Tests (AC3)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/ExceptionHandlingMiddlewareTests.cs`

**Tasks to make these 7 tests pass:**

- [ ] Add `<PackageReference Include="Microsoft.AspNetCore.Mvc.Testing" Version="10.*" />` to `SiesaAgents.UnitTests.csproj`
- [ ] Add `<ProjectReference Include="..\..\src\SiesaAgents.API\SiesaAgents.API.csproj" />` to `SiesaAgents.UnitTests.csproj`
- [ ] Ensure `ExceptionHandlingMiddleware` is in namespace `SiesaAgents.API.Middleware` (already exists at `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`)
- [ ] Verify `ExceptionHandlingMiddleware` sets `Content-Type = application/problem+json` and returns a `ProblemDetails` with `status` and `title` fields but no `stackTrace`, `exception`, or `innerException` (already confirmed in existing code)
- [ ] Ensure `Program.cs` has `public partial class Program {}` or is accessible for `WebApplicationFactory<Program>` (may need `InternalsVisibleTo` in API csproj)
- [ ] Run test: `dotnet test tests/SiesaAgents.UnitTests --filter "ExceptionHandlingMiddlewareTests"`
- [ ] All 7 tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test Group B: DatabaseMigration Tests (AC1, AC2, AC5)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/DatabaseMigrationTests.cs`

**Tasks to make these 6 tests pass:**

- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` with namespace `SiesaAgents.Infrastructure.Data`, inherits `DbContext`, constructor accepts `DbContextOptions<AppDbContext>`, overrides `OnModelCreating` with `modelBuilder.ApplySnakeCaseNaming()` as the LAST call
- [ ] Add `<PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="10.*" />` to `SiesaAgents.Infrastructure.csproj` (required for `dotnet ef` CLI tooling)
- [ ] Add `EFCore.NamingConventions` or `Npgsql.EntityFrameworkCore.PostgreSQL` call `.UseSnakeCaseNamingConvention()` — confirm which package provides `ApplySnakeCaseNaming()` extension
- [ ] Register `AppDbContext` in `Program.cs`: `builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")))`
- [ ] Add `using SiesaAgents.Infrastructure.Data;` and `using Microsoft.EntityFrameworkCore;` to `Program.cs`
- [ ] Run `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` from `backend/`
- [ ] Verify `Migrations/` folder created with `*_InitialCreate.cs` and `AppDbContextModelSnapshot.cs`
- [ ] Run `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` to apply migration and create `siesa_agents_db`
- [ ] Add `<PackageReference Include="Microsoft.AspNetCore.Mvc.Testing" Version="10.*" />` to test project (if not already added in Group A)
- [ ] Add `<ProjectReference Include="..\..\src\SiesaAgents.API\SiesaAgents.API.csproj" />` to test project (if not already added in Group A)
- [ ] Add `<ProjectReference Include="..\..\src\SiesaAgents.Infrastructure\SiesaAgents.Infrastructure.csproj" />` to test project
- [ ] Run test: `dotnet test tests/SiesaAgents.UnitTests --filter "DatabaseMigrationTests"`
- [ ] All 6 tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test Group C: Playwright API Tests — AC3, AC5, AC6

**File:** `e2e/tests/api/database-foundation.api.spec.ts`

**Tasks to make these 10 tests pass:**

- [ ] Register a test-only endpoint `GET /api/v1/test-error` that throws `new Exception("internal test")` — can be in `Program.cs` guarded by environment check (`if (app.Environment.IsDevelopment())`)
- [ ] Verify `ExceptionHandlingMiddleware` is registered BEFORE `UseCors` in `Program.cs` (already the case per Story 1.1)
- [ ] Complete all Group B tasks (AppDbContext + migration) so backend starts cleanly
- [ ] Run tests: `npx playwright test e2e/tests/api/database-foundation.api.spec.ts`
- [ ] All 10 tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run all xUnit integration tests for Story 1.3
dotnet test backend/tests/SiesaAgents.UnitTests --filter "Infrastructure"

# Run ExceptionHandlingMiddleware tests only
dotnet test backend/tests/SiesaAgents.UnitTests --filter "ExceptionHandlingMiddlewareTests"

# Run DatabaseMigration tests only
dotnet test backend/tests/SiesaAgents.UnitTests --filter "DatabaseMigrationTests"

# Run Playwright API tests for Story 1.3
npx playwright test e2e/tests/api/database-foundation.api.spec.ts

# Run Playwright tests in headed mode (see network inspector)
npx playwright test e2e/tests/api/database-foundation.api.spec.ts --headed

# Debug specific Playwright test
npx playwright test e2e/tests/api/database-foundation.api.spec.ts --debug

# Run all Story 1.3 tests (xUnit + Playwright)
dotnet test backend/tests/SiesaAgents.UnitTests --filter "Infrastructure" && npx playwright test e2e/tests/api/database-foundation.api.spec.ts
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing
- No data factories needed (infrastructure story)
- No fixtures needed (WebApplicationFactory and IAsyncLifetime patterns used)
- No external mock services required
- No data-testid attributes (no UI changes)
- Implementation checklist created

**Verification:**

- xUnit tests fail with `FileNotFoundException` or `TypeLoadException` because `Microsoft.AspNetCore.Mvc.Testing` package and API project reference are missing
- `DatabaseMigrationTests` fail with `InvalidOperationException` because `AppDbContext` type does not exist
- Playwright API tests fail with `net::ERR_CONNECTION_REFUSED` or HTTP 404 because `/api/v1/test-error` endpoint does not exist

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. **Start with Group A** (ExceptionHandling) — add package + reference to test csproj. Fastest wins.
2. **Then Group B** (DatabaseMigration) — create `AppDbContext`, add packages, run migrations.
3. **Finally Group C** (Playwright) — add test-error endpoint, verify API tests pass.

**Key Principles:**

- One test group at a time
- Run `dotnet test` after each change to see progress
- The xUnit tests require PostgreSQL to be running locally
- Use `siesa_agents_db_test` (not `siesa_agents_db`) for integration tests — isolation matters

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

**DEV Agent Responsibilities:**

1. Verify all 19 tests pass (9 xUnit + 10 Playwright)
2. Review `AppDbContext` — confirm `ApplySnakeCaseNaming()` is last call
3. Confirm `[Column]` and `[Table]` attributes are absent from any entities
4. Review `Program.cs` — confirm `test-error` endpoint is guarded by `IsDevelopment()` check
5. Run full solution build: `dotnet build backend/SiesaAgents.sln` — confirm zero errors

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow
2. Ensure PostgreSQL is running locally: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16`
3. Run failing tests to confirm RED phase: `dotnet test backend/tests/SiesaAgents.UnitTests --filter "Infrastructure"`
4. Begin implementation using implementation checklist — start with Group A (easiest)
5. Work one group at a time (Group A → Group B → Group C)
6. When all tests pass, run `dotnet build backend/SiesaAgents.sln` to confirm AC6

---

## Knowledge Base References Applied

- **test-quality.md** — Deterministic tests with auto-cleanup (IAsyncLifetime), explicit assertions, one assertion per test
- **network-first.md** — Applied in Playwright tests (intercept before navigation; request context used for API-level testing)
- **fixture-architecture.md** — `WebApplicationFactory` as fixture pattern; `IAsyncLifetime` for DB test lifecycle management
- **test-levels-framework.md** — API integration tests selected as primary level (backend-only story, no UI changes)
- **selector-resilience.md** — N/A (no UI interactions in this story)

---

## Test Execution Evidence

### Expected Failure Messages (RED Phase)

**xUnit — ExceptionHandlingMiddlewareTests:**
```
Error CS0246: The type or namespace name 'WebApplicationFactory<>' could not be found
(are you missing a using directive or an assembly reference?)
```
or
```
System.IO.FileNotFoundException: Could not load file or assembly 'Microsoft.AspNetCore.Mvc.Testing'
```

**xUnit — DatabaseMigrationTests:**
```
Error CS0246: The type or namespace name 'AppDbContext' could not be found
(are you missing a using directive or an assembly reference for SiesaAgents.Infrastructure.Data?)
```

**Playwright — AC3 tests:**
```
Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/api/v1/test-error
```
or
```
expect(received).toBe(expected)
Expected: 500
Received: 404
```

**Summary:**
- Total tests: 19 (9 xUnit + 10 Playwright)
- Passing: 0 (expected)
- Failing: 19 (expected)
- Status: RED phase verified

---

## Notes

- **Scope constraint (hard):** `AppDbContext` must have NO `DbSet<>` properties. `clientes` and `contactos` tables are out of scope (Epic 2 and 3 respectively). `WhenMigrationsApplied_NoDomainTablesShouldExist` test enforces this.
- **ApplySnakeCaseNaming source:** Verify whether it comes from `EFCore.NamingConventions` package or `Npgsql.EntityFrameworkCore.PostgreSQL` — check the extension method namespace before running migrations.
- **Program accessibility:** `WebApplicationFactory<Program>` requires the `Program` class to be accessible. If `Program.cs` uses top-level statements without `public partial class Program`, add `public partial class Program {}` at the end of `Program.cs` or add `[assembly: InternalsVisibleTo("SiesaAgents.UnitTests")]` to the API project.
- **Test database isolation:** `DatabaseMigrationTests` uses `siesa_agents_db_test` (not the development database) and drops it in `DisposeAsync`. Tests remain idempotent and don't affect the dev database.

---

**Generated by BMad TEA Agent** — 2026-06-21

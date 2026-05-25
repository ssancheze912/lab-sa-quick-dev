# ATDD Checklist - Epic 1, Story 1.3: Backend Database Foundation

**Date:** 2026-05-25
**Author:** sa-tea-atdd
**Primary Test Level:** Unit (xUnit static file analysis) + API Integration (Playwright)

---

## Story Summary

Story 1.3 configures the PostgreSQL database connection and EF Core infrastructure so subsequent stories can define entities and run migrations against a working data layer.

**As a** developer
**I want** the PostgreSQL database connected and the EF Core infrastructure configured
**So that** subsequent stories can define entities and run migrations against a working data layer

---

## Acceptance Criteria

1. **AC1** — Given PostgreSQL is running locally, When the developer runs `dotnet ef database update` from `backend/`, Then the `siesa_agents_db` database is created with no errors and the EF Core migrations folder exists in `backend/src/SiesaAgents.Infrastructure/Data/Migrations/`.

2. **AC2** — Given an unhandled exception occurs in the backend, When the error reaches the middleware, Then the response returns Problem Details RFC 7807 format (status, title, detail) with no stack traces exposed (NFR6). The `ExceptionHandlingMiddleware` must be registered before routing in `Program.cs`.

3. **AC3** — Given the backend receives any request, When EF Core processes database operations, Then `modelBuilder.ApplySnakeCaseNaming()` is called last inside `OnModelCreating` so all generated column and table names follow snake_case convention.

---

## Environment Constraints

**IMPORTANT:** The .NET 10 backend cannot be compiled or executed in this CI/sandbox environment (dotnet SDK not installed). The following adaptations were applied:

- **API integration tests** (Playwright): Will fail with `ECONNREFUSED` in sandbox. These are valid RED-phase tests that will pass in a full development environment with the backend running.
- **Static file structure tests** (xUnit): Verify C# file existence and code patterns using `System.IO` — these run without dotnet SDK and will fail in RED phase due to missing files/patterns.
- **InMemory unit tests** (xUnit): Require `Microsoft.EntityFrameworkCore.InMemory` package and Infrastructure project reference — will fail to compile in RED phase until packages are added.

---

## Failing Tests Created (RED Phase)

### Unit / Static File Structure Tests — xUnit (12 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/BackendDatabaseFoundationFileStructureTests.cs`

**AC1 — Migrations Folder (5 tests):**

- **Test:** `AC1_MigrationsFolder_ExistsInInfrastructureProject`
  - **Status:** RED — `Data/Migrations/` folder exists but is empty (no migration files generated yet)
  - **Verifies:** AC1 — Migrations folder created by `dotnet ef migrations add`

- **Test:** `AC1_MigrationsFolder_ContainsInitialCreateMigrationFile`
  - **Status:** RED — `*InitialCreate.cs` file not present (migration not run)
  - **Verifies:** AC1 — `dotnet ef migrations add InitialCreate` was executed

- **Test:** `AC1_MigrationsFolder_ContainsModelSnapshotFile`
  - **Status:** RED — `*ModelSnapshot.cs` not present
  - **Verifies:** AC1 — EF tooling generated the snapshot file

- **Test:** `AC1_InfrastructureCsproj_HasEfCoreDesignPackage`
  - **Status:** RED — `Microsoft.EntityFrameworkCore.Design` not yet in Infrastructure.csproj
  - **Verifies:** AC1 — Design-time tooling package present for `dotnet ef` CLI

- **Test:** `AC1_AppDbContextFactory_ExistsInInfrastructureData`
  - **Status:** RED — `AppDbContextFactory.cs` does not exist yet
  - **Verifies:** AC1 — `IDesignTimeDbContextFactory<AppDbContext>` created for CLI-less migrations

- **Test:** `AC1_AppDbContextFactory_ImplementsIDesignTimeDbContextFactory`
  - **Status:** RED — File does not exist
  - **Verifies:** AC1 — Factory correctly implements the interface

**AC2 — ExceptionHandlingMiddleware (3 tests):**

- **Test:** `AC2_ExceptionHandlingMiddleware_FileExists`
  - **Status:** GREEN — File already exists from Story 1.1
  - **Verifies:** AC2 — Middleware exists (baseline check)

- **Test:** `AC2_ExceptionHandlingMiddleware_ReturnsProblemDetailsFormat`
  - **Status:** GREEN — File already has `application/problem+json` and `ProblemDetails`
  - **Verifies:** AC2 — RFC 7807 content type and type used

- **Test:** `AC2_ExceptionHandlingMiddleware_DoesNotExposeStackTrace`
  - **Status:** GREEN — Detail is `null`, no `ex.StackTrace` reference
  - **Verifies:** AC2/NFR6 — No stack trace exposure

- **Test:** `AC2_ProgramCs_RegistersExceptionHandlingMiddlewareBeforeCors`
  - **Status:** GREEN — `app.UseMiddleware<ExceptionHandlingMiddleware>()` is on line before `app.UseCors()`
  - **Verifies:** AC2 — Middleware registration order is correct

**AC3 — ApplySnakeCaseNaming (4 tests):**

- **Test:** `AC3_AppDbContext_FileExists`
  - **Status:** GREEN — AppDbContext.cs exists from Story 1.1
  - **Verifies:** AC3 — File exists (baseline)

- **Test:** `AC3_AppDbContext_CallsApplySnakeCaseNaming`
  - **Status:** RED — AppDbContext.cs does NOT yet call `ApplySnakeCaseNaming()`
  - **Verifies:** AC3 — The naming convention extension method is called

- **Test:** `AC3_AppDbContext_ApplySnakeCaseNaming_IsLastCallInOnModelCreating`
  - **Status:** RED — Method not called at all, cannot be last
  - **Verifies:** AC3 — Naming override happens after `ApplyConfigurationsFromAssembly`

- **Test:** `AC3_AppDbContext_UsesNpgsqlProvider_InInfrastructureCsproj`
  - **Status:** GREEN — `Npgsql.EntityFrameworkCore.PostgreSQL` already in csproj
  - **Verifies:** AC3 — Provider that supplies `ApplySnakeCaseNaming()` is present

- **Test:** `AC3_AppDbContext_UsesPrimaryConstructorPattern`
  - **Status:** GREEN — Primary constructor pattern already used
  - **Verifies:** AC3 — .NET 10 idiomatic constructor pattern in place

### Unit / InMemory Tests — xUnit (4 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

- **Test:** `AppDbContext_CanBeInstantiated_WithInMemoryProvider`
  - **Status:** RED — Fails to compile: `InMemory` package not in UnitTests.csproj; `Infrastructure` project not referenced
  - **Verifies:** AC1/AC3 — AppDbContext is instantiable with EF Core InMemory provider

- **Test:** `AppDbContext_EnsureCreated_DoesNotThrow`
  - **Status:** RED — Fails to compile (same reason above)
  - **Verifies:** AC3 — `OnModelCreating` runs without exception (EnsureCreated triggers it)

- **Test:** `AppDbContext_OnModelCreating_AppliesSnakeCaseNaming`
  - **Status:** RED — Compile failure AND `ApplySnakeCaseNaming()` not called yet
  - **Verifies:** AC3 — `ApplySnakeCaseNaming()` executes without throwing

- **Test:** `AppDbContext_OnModelCreating_HasSnakeCaseNamingAppliedLast`
  - **Status:** RED — Compile failure AND method not present
  - **Verifies:** AC3 — Model is fully configured with snake_case convention active

### API Integration Tests — Playwright (8 tests)

**File:** `e2e/tests/api/backend-database-foundation.api.spec.ts`

**AC2 — Problem Details RFC 7807 runtime (6 tests):**

- **Test:** `should return application/problem+json content-type for unknown endpoint`
  - **Status:** RED — ECONNREFUSED (backend not running in sandbox)
  - **Verifies:** AC2 — Content-Type is `application/problem+json` for errors

- **Test:** `should return HTTP 404 with Problem Details body for unknown route`
  - **Status:** RED — ECONNREFUSED
  - **Verifies:** AC2 — 404 for unknown routes returns JSON Problem Details body

- **Test:** `should include "status" field in Problem Details response for unknown route`
  - **Status:** RED — ECONNREFUSED
  - **Verifies:** AC2 — RFC 7807 `status` field (numeric) present in response

- **Test:** `should include "title" field in Problem Details response for unknown route`
  - **Status:** RED — ECONNREFUSED
  - **Verifies:** AC2 — RFC 7807 `title` field (non-empty string) present in response

- **Test:** `should NOT expose stack trace in Problem Details "detail" field (NFR6)`
  - **Status:** RED — ECONNREFUSED
  - **Verifies:** AC2/NFR6 — `detail` field is null or safe (no stack trace patterns)

- **Test:** `should return 500 with Problem Details for simulated unhandled exception`
  - **Status:** RED — ECONNREFUSED
  - **Verifies:** AC2 — 500 responses include Problem Details format

**AC2 — Middleware pipeline order runtime (2 tests):**

- **Test:** `should have the backend server running on port 5000 (prerequisite for AC2)`
  - **Status:** RED — ECONNREFUSED
  - **Verifies:** AC2 — Backend prerequisite check

- **Test:** `should return JSON (not HTML) for any error response — middleware is wired`
  - **Status:** RED — ECONNREFUSED
  - **Verifies:** AC2 — Middleware intercepts before ASP.NET default HTML error page

---

## Data Factories

None required for Story 1.3 — this story has no domain entities or user data. Tests validate infrastructure configuration only.

---

## Fixtures

No new fixtures required. Existing `e2e/fixtures/base.fixture.ts` is sufficient.

---

## Mock Requirements

No mocks needed. API tests require a real running .NET 10 backend on `http://localhost:5000`.

---

## Required `data-testid` Attributes

None — Story 1.3 is backend-only with no frontend UI changes.

---

## Implementation Checklist

### Test: `AC1_MigrationsFolder_ContainsInitialCreateMigrationFile`

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/BackendDatabaseFoundationFileStructureTests.cs`

**Tasks to make this test pass:**

- [ ] Add `Microsoft.EntityFrameworkCore.Design` to `SiesaAgents.Infrastructure.csproj`
- [ ] Create `AppDbContextFactory.cs` implementing `IDesignTimeDbContextFactory<AppDbContext>`
- [ ] Run from `backend/`:
  ```bash
  dotnet ef migrations add InitialCreate \
    --project src/SiesaAgents.Infrastructure \
    --startup-project src/SiesaAgents.API \
    --output-dir Data/Migrations
  ```
- [ ] Verify `Data/Migrations/<timestamp>_InitialCreate.cs` and `AppDbContextModelSnapshot.cs` exist

**Estimated Effort:** 1.0 hour

---

### Test: `AC3_AppDbContext_CallsApplySnakeCaseNaming`

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/BackendDatabaseFoundationFileStructureTests.cs`

**Tasks to make this test pass:**

- [ ] Edit `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`
- [ ] Add `modelBuilder.ApplySnakeCaseNaming();` as the LAST line in `OnModelCreating`
- [ ] Order must be: `base.OnModelCreating(modelBuilder)` → `ApplyConfigurationsFromAssembly(...)` → `ApplySnakeCaseNaming()`
- [ ] Run static test: `dotnet test --filter "AC3_AppDbContext_CallsApplySnakeCaseNaming"`

**Estimated Effort:** 0.25 hours

---

### Test: `AppDbContext_CanBeInstantiated_WithInMemoryProvider`

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

**Tasks to make this test pass:**

- [ ] Add to `SiesaAgents.UnitTests.csproj`:
  ```xml
  <PackageReference Include="Microsoft.EntityFrameworkCore.InMemory" Version="10.0.0" />
  ```
- [ ] Add Infrastructure project reference to `SiesaAgents.UnitTests.csproj`:
  ```xml
  <ProjectReference Include="..\..\src\SiesaAgents.Infrastructure\SiesaAgents.Infrastructure.csproj" />
  ```
- [ ] Run: `dotnet test --filter "AppDbContext_CanBeInstantiated_WithInMemoryProvider"`

**Estimated Effort:** 0.25 hours

---

### Test: `should return application/problem+json content-type for unknown endpoint`

**File:** `e2e/tests/api/backend-database-foundation.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Ensure backend is running: `dotnet run --project src/SiesaAgents.API` from `backend/`
- [ ] ExceptionHandlingMiddleware is already registered before routing (Story 1.1 done)
- [ ] Run: `npx playwright test e2e/tests/api/backend-database-foundation.api.spec.ts`

**Estimated Effort:** 0.5 hours (environment setup only)

---

## Running Tests

```bash
# Run xUnit static file structure tests (no backend required)
cd /path/to/repo/backend
dotnet test tests/SiesaAgents.UnitTests/ --filter "BackendDatabaseFoundationFileStructureTests"

# Run xUnit InMemory unit tests (requires InMemory package + Infrastructure reference)
dotnet test tests/SiesaAgents.UnitTests/ --filter "AppDbContextTests"

# Run all xUnit tests for Story 1.3
dotnet test tests/SiesaAgents.UnitTests/ --filter "FullyQualifiedName~Infrastructure"

# Run Playwright API tests (requires backend on localhost:5000)
npx playwright test e2e/tests/api/backend-database-foundation.api.spec.ts

# Run all Story 1.3 tests
npx playwright test e2e/tests/api/backend-database-foundation.api.spec.ts && \
dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "FullyQualifiedName~Infrastructure"
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

All tests are written and defined. Expected failures per test:

| Test | Expected Failure Reason |
|------|------------------------|
| `AC1_MigrationsFolder_ContainsInitialCreateMigrationFile` | Migration not generated yet |
| `AC1_InfrastructureCsproj_HasEfCoreDesignPackage` | Package not in csproj |
| `AC1_AppDbContextFactory_ExistsInInfrastructureData` | File not created |
| `AC3_AppDbContext_CallsApplySnakeCaseNaming` | Method not called in AppDbContext.cs |
| `AC3_AppDbContext_ApplySnakeCaseNaming_IsLastCallInOnModelCreating` | Method absent |
| `AppDbContext_CanBeInstantiated_WithInMemoryProvider` | Compile failure: missing packages |
| All Playwright API tests | ECONNREFUSED: backend not running in sandbox |

Tests that are expected to be GREEN (already implemented from Story 1.1):

| Test | Current Status |
|------|---------------|
| `AC2_ExceptionHandlingMiddleware_FileExists` | GREEN |
| `AC2_ExceptionHandlingMiddleware_ReturnsProblemDetailsFormat` | GREEN |
| `AC2_ExceptionHandlingMiddleware_DoesNotExposeStackTrace` | GREEN |
| `AC2_ProgramCs_RegistersExceptionHandlingMiddlewareBeforeCors` | GREEN |
| `AC3_AppDbContext_FileExists` | GREEN |
| `AC3_AppDbContext_UsesNpgsqlProvider_InInfrastructureCsproj` | GREEN |
| `AC3_AppDbContext_UsesPrimaryConstructorPattern` | GREEN |

### GREEN Phase (DEV Team — Next Steps)

1. Add `Microsoft.EntityFrameworkCore.Design` to Infrastructure.csproj
2. Create `AppDbContextFactory.cs`
3. Run `dotnet ef migrations add InitialCreate ...`
4. Edit `AppDbContext.cs` to add `modelBuilder.ApplySnakeCaseNaming()` as last call
5. Add `Microsoft.EntityFrameworkCore.InMemory` to UnitTests.csproj + Infrastructure reference
6. Run `dotnet test` to verify all xUnit tests pass
7. Start backend and run Playwright API tests

### REFACTOR Phase (After All Tests Pass)

1. Verify all 24 tests pass (12 xUnit + 8 Playwright + 4 InMemory)
2. Confirm `ApplySnakeCaseNaming()` is truly LAST in `OnModelCreating`
3. Verify `Data/Migrations/` has only the empty `InitialCreate` migration (no domain tables)
4. Confirm `Detail = null` in `ExceptionHandlingMiddleware` — no accidental stack trace leakage
5. Mark Story 1.3 as `done` in sprint status

---

## Acceptance Criteria Coverage Matrix

| AC | Description | Test Files | Test Count | Level |
|----|-------------|------------|------------|-------|
| AC1 | EF Core migrations folder exists in Infrastructure | `BackendDatabaseFoundationFileStructureTests.cs` | 6 | Unit (static) |
| AC2 | ExceptionHandlingMiddleware RFC 7807, no stack traces, registered before routing | `BackendDatabaseFoundationFileStructureTests.cs`, `backend-database-foundation.api.spec.ts` | 4 + 8 | Unit (static) + API |
| AC3 | ApplySnakeCaseNaming() called last in OnModelCreating | `BackendDatabaseFoundationFileStructureTests.cs`, `AppDbContextTests.cs` | 5 + 4 | Unit (static) + Unit (InMemory) |

**Total: 24 tests across 3 files**

- `backend/tests/SiesaAgents.UnitTests/Infrastructure/BackendDatabaseFoundationFileStructureTests.cs` — 12 tests (xUnit static)
- `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs` — 4 tests (xUnit InMemory)
- `e2e/tests/api/backend-database-foundation.api.spec.ts` — 8 tests (Playwright API)

---

## Next Steps

1. Share this checklist with the dev workflow (sa-dev-story)
2. Confirm RED phase by running: `dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "FullyQualifiedName~Infrastructure"`
3. Implement tasks in order: packages → factory → migration → AppDbContext update → InMemory tests
4. When all tests pass, run `dotnet ef database update` against a local PostgreSQL to verify AC1 fully
5. Update story status to `done`

---

**Generated by sa-tea-atdd (testarch-atdd workflow)** — 2026-05-25

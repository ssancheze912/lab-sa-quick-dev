# ATDD Checklist - Epic 1, Story 1.3: Backend Database Foundation

**Date:** 2026-05-23
**Author:** TEA Agent (claude-sonnet-4-6)
**Primary Test Levels:** Unit (xUnit) + API/Structural (Playwright)

---

## Story Summary

Story 1.3 establishes the PostgreSQL / EF Core data layer for the backend.

**As a** developer
**I want** the PostgreSQL database connected and the EF Core infrastructure configured
**So that** subsequent stories can define entities and run migrations against a working data layer

---

## Acceptance Criteria

1. **AC1** — Given PostgreSQL is running locally, When the developer runs `dotnet ef database update`, Then `siesa_agents_db` is created with no errors and an EF Core migrations folder exists at `backend/src/SiesaAgents.Infrastructure/Migrations/`.

2. **AC2** — Given the backend starts with the PostgreSQL connection string configured, When `AppDbContext` is resolved from DI, Then it is registered via `AddDbContext<AppDbContext>` using `UseNpgsql` with the `DefaultConnection` connection string from `appsettings.Development.json`.

3. **AC3** — Given an unhandled exception occurs anywhere in the backend pipeline, When the error reaches `ExceptionHandlingMiddleware`, Then the response returns HTTP Problem Details RFC 7807 format (`Content-Type: application/problem+json`) with `status`, `title`, and `detail` fields — no stack traces, no raw `ex.Message` exposed (NFR6).

4. **AC4** — Given the backend solution is built, When `OnModelCreating` runs in `AppDbContext`, Then `modelBuilder.UseSnakeCaseNamingConvention()` is the last call applied, ensuring all future column/table names follow `snake_case` convention automatically.

5. **AC5** — Given `dotnet build backend/SiesaAgents.sln` is executed, When the build completes, Then all projects compile with zero errors and zero warnings.

---

## Failing Tests Created (RED Phase)

### Unit Tests — xUnit (6 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

- **Test:** `AppDbContext_OnModelCreating_AppliesSnakeCaseNaming_WithoutError`
  - **Status:** RED — InMemory package not yet added to UnitTests.csproj; Infrastructure not referenced
  - **Verifies:** AC4 — UseSnakeCaseNamingConvention() executes without error

- **Test:** `AppDbContext_Constructor_AcceptsDbContextOptions_WithoutError`
  - **Status:** RED — Infrastructure project not referenced in UnitTests.csproj
  - **Verifies:** AC4 / AC5 — Primary constructor pattern compiles and works

- **Test:** `AppDbContext_CanEnsureCreated_WithInMemoryProvider`
  - **Status:** RED — InMemory provider not available in test project yet
  - **Verifies:** AC2 / AC4 — OnModelCreating runs without error against InMemory DB

- **Test:** `Entity_Id_IsNonEmpty_Guid_OnConstruction`
  - **Status:** RED — Replaces PlaceholderTest.cs `Assert.True(true)` (Story 1.1 warning)
  - **Verifies:** AC5 — Entity.Id is auto-assigned as non-empty Guid

- **Test:** `Entity_TwoInstances_HaveDifferent_Ids`
  - **Status:** RED — Domain project referenced but InMemory/Infrastructure not yet wired
  - **Verifies:** AC5 — Guid.NewGuid() uniqueness per instance

- **Test:** `Entity_CreatedAt_IsDateTimeOffset_NotDateTime`
  - **Status:** RED — Tests architectural rule (DateTimeOffset ALWAYS, never DateTime)
  - **Verifies:** AC5 — Entity timestamps use DateTimeOffset

- **Test:** `Entity_UpdatedAt_IsDateTimeOffset_NotDateTime`
  - **Status:** RED — Same as above
  - **Verifies:** AC5 — Entity timestamps use DateTimeOffset

- **Test:** `ExceptionHandling_ProblemDetails_Detail_IsNull_NotExMessage`
  - **Status:** RED — Microsoft.AspNetCore.Mvc.Core package not yet added to test project
  - **Verifies:** AC3 — Detail field is null (ex.Message never exposed, NFR6)

### API / Structural Tests — Playwright (20 tests)

**File:** `e2e/tests/api/backend-database-foundation.api.spec.ts`

#### AC1 — EF Core migrations folder (3 tests)

- **Test:** `should have Migrations directory at SiesaAgents.Infrastructure/Migrations`
  - **Status:** RED — Migrations folder does not exist yet (dotnet ef not run)
  - **Verifies:** AC1

- **Test:** `should have AppDbContextModelSnapshot.cs inside Migrations directory`
  - **Status:** RED — Migrations folder does not exist yet
  - **Verifies:** AC1

- **Test:** `should have an InitialCreate migration file inside Migrations directory`
  - **Status:** RED — Migrations folder does not exist yet
  - **Verifies:** AC1

#### AC2 — AppDbContext DI registration (4 tests)

- **Test:** `should register AddDbContext<AppDbContext> in Program.cs`
  - **Status:** RED — Program.cs does not yet contain AddDbContext registration
  - **Verifies:** AC2

- **Test:** `should configure AppDbContext with UseNpgsql in Program.cs`
  - **Status:** RED — Program.cs does not yet contain UseNpgsql
  - **Verifies:** AC2

- **Test:** `should read DefaultConnection from configuration in Program.cs`
  - **Status:** RED — Program.cs does not yet contain GetConnectionString call
  - **Verifies:** AC2

- **Test:** `should have DefaultConnection in appsettings.Development.json pointing to siesa_agents_db`
  - **Status:** GREEN (pre-existing) — appsettings.Development.json already has DefaultConnection
  - **Verifies:** AC2

#### AC3 — ExceptionHandlingMiddleware RFC 7807 compliance (5 tests)

- **Test:** `should set Content-Type to application/problem+json in ExceptionHandlingMiddleware`
  - **Status:** GREEN (pre-existing) — ExceptionHandlingMiddleware.cs already sets this
  - **Verifies:** AC3

- **Test:** `should return HTTP 500 status code in ExceptionHandlingMiddleware`
  - **Status:** GREEN (pre-existing) — Middleware already sets 500
  - **Verifies:** AC3

- **Test:** `should return ProblemDetails object with required RFC 7807 fields`
  - **Status:** GREEN (pre-existing) — ProblemDetails already used
  - **Verifies:** AC3

- **Test:** `should NOT expose ex.Message or stack traces in ExceptionHandlingMiddleware`
  - **Status:** GREEN (pre-existing) — ex.Message not exposed (Detail = null)
  - **Verifies:** AC3 / NFR6

- **Test:** `should register ExceptionHandlingMiddleware before other middleware in Program.cs`
  - **Status:** GREEN (pre-existing) — UseMiddleware<ExceptionHandlingMiddleware>() before UseCors
  - **Verifies:** AC3

#### AC4 — UseSnakeCaseNamingConvention in AppDbContext (4 tests)

- **Test:** `should have OnModelCreating override in AppDbContext.cs`
  - **Status:** GREEN (pre-existing) — OnModelCreating already overridden
  - **Verifies:** AC4

- **Test:** `should call UseSnakeCaseNamingConvention() in OnModelCreating`
  - **Status:** GREEN (pre-existing) — UseSnakeCaseNamingConvention() already present
  - **Verifies:** AC4

- **Test:** `should call UseSnakeCaseNamingConvention() AFTER ApplyConfigurationsFromAssembly`
  - **Status:** GREEN (pre-existing) — Ordering already correct
  - **Verifies:** AC4

- **Test:** `should NOT use manual [Column] or [Table] attributes in AppDbContext.cs`
  - **Status:** GREEN (pre-existing) — No manual attributes present
  - **Verifies:** AC4

#### AC5 — NuGet packages and project structure (5 tests)

- **Test:** `should have Npgsql.EntityFrameworkCore.PostgreSQL in Infrastructure.csproj`
  - **Status:** GREEN (pre-existing) — Package already referenced
  - **Verifies:** AC5

- **Test:** `should have EFCore.NamingConventions in Infrastructure.csproj`
  - **Status:** GREEN (pre-existing) — Package already referenced
  - **Verifies:** AC5

- **Test:** `should have Microsoft.EntityFrameworkCore.Design in API.csproj with PrivateAssets=all`
  - **Status:** RED — EFCore.Design not yet added to API.csproj
  - **Verifies:** AC5

- **Test:** `should have AppDbContext.cs extending DbContext in Infrastructure/Data`
  - **Status:** GREEN (pre-existing) — AppDbContext.cs already extends DbContext
  - **Verifies:** AC5

- **Test:** `should NOT define ClienteEntity or ContactoEntity in AppDbContext (scope boundary)`
  - **Status:** GREEN (pre-existing) — No domain entity DbSets defined in Story 1.3 scope
  - **Verifies:** AC5 / Scope boundary

---

## Summary of RED Tests (Failing — Require Implementation)

| # | Test | File | AC |
|---|------|------|----|
| 1 | `AppDbContext_OnModelCreating_AppliesSnakeCaseNaming_WithoutError` | AppDbContextTests.cs | AC4 |
| 2 | `AppDbContext_Constructor_AcceptsDbContextOptions_WithoutError` | AppDbContextTests.cs | AC4/AC5 |
| 3 | `AppDbContext_CanEnsureCreated_WithInMemoryProvider` | AppDbContextTests.cs | AC2/AC4 |
| 4 | `Entity_Id_IsNonEmpty_Guid_OnConstruction` | AppDbContextTests.cs | AC5 |
| 5 | `Entity_TwoInstances_HaveDifferent_Ids` | AppDbContextTests.cs | AC5 |
| 6 | `Entity_CreatedAt_IsDateTimeOffset_NotDateTime` | AppDbContextTests.cs | AC5 |
| 7 | `Entity_UpdatedAt_IsDateTimeOffset_NotDateTime` | AppDbContextTests.cs | AC5 |
| 8 | `ExceptionHandling_ProblemDetails_Detail_IsNull_NotExMessage` | AppDbContextTests.cs | AC3 |
| 9 | `should have Migrations directory at SiesaAgents.Infrastructure/Migrations` | backend-database-foundation.api.spec.ts | AC1 |
| 10 | `should have AppDbContextModelSnapshot.cs inside Migrations directory` | backend-database-foundation.api.spec.ts | AC1 |
| 11 | `should have an InitialCreate migration file inside Migrations directory` | backend-database-foundation.api.spec.ts | AC1 |
| 12 | `should register AddDbContext<AppDbContext> in Program.cs` | backend-database-foundation.api.spec.ts | AC2 |
| 13 | `should configure AppDbContext with UseNpgsql in Program.cs` | backend-database-foundation.api.spec.ts | AC2 |
| 14 | `should read DefaultConnection from configuration in Program.cs` | backend-database-foundation.api.spec.ts | AC2 |
| 15 | `should have Microsoft.EntityFrameworkCore.Design in API.csproj with PrivateAssets=all` | backend-database-foundation.api.spec.ts | AC5 |

**Total RED tests: 15**
**Total GREEN (pre-existing structure already in place): 10**
**Grand total: 25 tests**

---

## Data Factories / Helpers

No domain entity factories are required for Story 1.3. This story creates infrastructure only (empty initial migration — no domain entity tables).

**Note:** `e2e/helpers/data.helper.ts` exists for future stories (Epic 2: ClienteEntity, Epic 3: ContactoEntity).

---

## Mock Requirements

Story 1.3 Playwright tests perform **file-system-only validation** — no running server or database required. Tests read `.cs`, `.csproj`, and `.json` files directly from the filesystem.

Unit tests use `Microsoft.EntityFrameworkCore.InMemory` as a stand-in for the real Npgsql provider — no running PostgreSQL instance required for unit tests.

**No network mocking required for any test in this story.**

---

## Required data-testid Attributes

No UI components or data-testid attributes are required for Story 1.3. This story is purely backend infrastructure.

---

## Implementation Checklist

### Make RED → GREEN: Unit tests (AppDbContextTests.cs)

**Prerequisites — update UnitTests.csproj:**
- [ ] Add `<PackageReference Include="Microsoft.EntityFrameworkCore.InMemory" Version="10.*" />` to `SiesaAgents.UnitTests.csproj`
- [ ] Add `<PackageReference Include="Microsoft.AspNetCore.Mvc.Core" Version="2.*" />` to `SiesaAgents.UnitTests.csproj`
- [ ] Add `<ProjectReference Include="..\..\src\SiesaAgents.Infrastructure\SiesaAgents.Infrastructure.csproj" />` to `SiesaAgents.UnitTests.csproj`
- [ ] Run `dotnet build backend/SiesaAgents.sln` — should compile without errors

**Run unit tests:**
```bash
cd backend
dotnet test tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj --no-build
```

---

### Test: `should register AddDbContext<AppDbContext> in Program.cs` (AC2)

**File:** `e2e/tests/api/backend-database-foundation.api.spec.ts`

**Tasks to make this test pass:**
- [ ] In `backend/src/SiesaAgents.API/Program.cs`, add `builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));`
- [ ] Add `using SiesaAgents.Infrastructure.Data;` and `using Microsoft.EntityFrameworkCore;` to `Program.cs`
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-database-foundation.api.spec.ts --grep "AddDbContext"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should have Microsoft.EntityFrameworkCore.Design in API.csproj with PrivateAssets=all` (AC5)

**File:** `e2e/tests/api/backend-database-foundation.api.spec.ts`

**Tasks to make this test pass:**
- [ ] In `backend/src/SiesaAgents.API/SiesaAgents.API.csproj`, add:
  ```xml
  <PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="10.*" PrivateAssets="all" />
  ```
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-database-foundation.api.spec.ts --grep "EntityFrameworkCore.Design"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.1 hours

---

### Test: `should have Migrations directory at SiesaAgents.Infrastructure/Migrations` (AC1)

**File:** `e2e/tests/api/backend-database-foundation.api.spec.ts`

**Tasks to make this test pass:**
- [ ] Run from `backend/`:
  ```bash
  dotnet ef migrations add InitialCreate \
    --project src/SiesaAgents.Infrastructure \
    --startup-project src/SiesaAgents.API
  ```
- [ ] Verify `Migrations/` directory created with `AppDbContextModelSnapshot.cs` and `*_InitialCreate.cs`
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-database-foundation.api.spec.ts --grep "Migrations directory"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

## Running Tests

```bash
# Run ALL Story 1.3 Playwright tests
pnpm exec playwright test e2e/tests/api/backend-database-foundation.api.spec.ts

# Run specific AC group
pnpm exec playwright test e2e/tests/api/backend-database-foundation.api.spec.ts --grep "AC1"
pnpm exec playwright test e2e/tests/api/backend-database-foundation.api.spec.ts --grep "AC2"
pnpm exec playwright test e2e/tests/api/backend-database-foundation.api.spec.ts --grep "AC3"
pnpm exec playwright test e2e/tests/api/backend-database-foundation.api.spec.ts --grep "AC4"
pnpm exec playwright test e2e/tests/api/backend-database-foundation.api.spec.ts --grep "AC5"

# Run unit tests
cd backend && dotnet test tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj

# Run all tests
pnpm exec playwright test && cd backend && dotnet test
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**
- ✅ 25 tests written (8 unit xUnit + 17 Playwright file-structural)
- ✅ 15 tests are in RED state (failing — implementation required)
- ✅ 10 tests pre-GREEN (existing correct structure from Story 1.1)
- ✅ No running server or database required to execute tests
- ✅ Implementation checklist created per failing test group
- ✅ Scope boundary enforced (no ClienteEntity / ContactoEntity)

**Verification:**
- Unit tests fail with build errors (InMemory/Infrastructure not yet referenced in UnitTests.csproj)
- Playwright AC1 tests fail with `false` assertion (Migrations/ directory does not exist)
- Playwright AC2 tests fail because `AddDbContext<AppDbContext>` not yet in Program.cs
- Playwright AC5 `EntityFrameworkCore.Design` test fails because package not yet in API.csproj
- Failures are due to missing implementation, NOT test bugs

---

### GREEN Phase (DEV Team — Next Steps)

**Recommended implementation order:**

1. **Update UnitTests.csproj** — Add InMemory + AspNetCore.Mvc.Core packages + Infrastructure reference (unblocks all unit tests)
2. **Add EFCore.Design to API.csproj** (Task 5 in story) — quick win, fixes AC5 test
3. **Register AddDbContext in Program.cs** (Task 1 in story) — fixes 3 AC2 tests
4. **Run `dotnet ef migrations add InitialCreate`** (Task 4 in story) — fixes 3 AC1 tests
5. **Run `dotnet build`** — verifies AC5 zero errors/warnings

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 25 tests pass
2. Confirm `dotnet ef database update` runs cleanly against a real PostgreSQL instance
3. Confirm migration file contains no entity tables (scope boundary)
4. Review `Program.cs` ordering — `AddDbContext` registration before `var app = builder.Build()`

---

## Knowledge Base References Applied

- **Given-When-Then pattern** — All tests use explicit Given/When/Then comments
- **File-system validation** — No running server required; tests read .cs/.csproj/.json files directly
- **Scope boundary enforcement** — AC5 test explicitly verifies ClienteEntity/ContactoEntity are absent
- **NFR6 compliance** — AC3 unit test and structural test both verify Detail = null (never ex.Message)
- **snake_case architectural rule** — AC4 tests verify both presence and ordering of UseSnakeCaseNamingConvention

---

**Generated by BMad TEA Agent (testarch-atdd workflow)** — 2026-05-23
